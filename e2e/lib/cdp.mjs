// Minimal headless-Chrome driver over the DevTools protocol (Node built-ins only).
import { spawn } from "child_process";
import { existsSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll `fn` until it returns a truthy value (or the time runs out → last value). */
export async function until(fn, ms = 15000, step = 400) {
	const end = Date.now() + ms;
	let v = null;
	while (Date.now() < end) {
		v = await fn().catch(() => null);
		if (v) return v;
		await sleep(step);
	}
	return v;
}

function chromePath() {
	if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
	const candidates = {
		win32: [
			"C:/Program Files/Google/Chrome/Application/chrome.exe",
			"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
		],
		darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
		linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
	}[process.platform] ?? [];
	const found = candidates.find((p) => existsSync(p));
	if (!found) throw new Error("Chrome not found: set CHROME_PATH");
	return found;
}

export async function launch({ port = 9361 } = {}) {
	const profile = join(tmpdir(), `wavelet-e2e-chrome-${port}`);
	rmSync(profile, { recursive: true, force: true });
	const chrome = spawn(
		chromePath(),
		[
			"--headless=new",
			`--remote-debugging-port=${port}`,
			`--user-data-dir=${profile}`,
			"--autoplay-policy=no-user-gesture-required",
			"--no-first-run",
			"--mute-audio",
			"--window-size=1366,900",
			"about:blank",
		],
		{ stdio: "ignore" }
	);
	let version;
	for (let i = 0; i < 80 && !version; i++) {
		try {
			version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
		} catch {
			await sleep(200);
		}
	}
	if (!version) throw new Error("Chrome did not expose the DevTools endpoint");
	const ws = new WebSocket(version.webSocketDebuggerUrl);
	await new Promise((r) => (ws.onopen = r));
	let seq = 0;
	const pending = new Map();
	const listeners = [];
	ws.onmessage = (e) => {
		const m = JSON.parse(e.data);
		if (m.id && pending.has(m.id)) {
			const { res, rej } = pending.get(m.id);
			pending.delete(m.id);
			if (m.error) rej(new Error(m.error.message));
			else res(m.result);
		} else listeners.forEach((l) => l(m));
	};
	const send = (method, params = {}, sessionId) =>
		new Promise((res, rej) => {
			const id = ++seq;
			pending.set(id, { res, rej });
			ws.send(JSON.stringify({ id, method, params, sessionId }));
		});
	const close = async () => {
		ws.close();
		chrome.kill();
		await sleep(600);
		for (let i = 0; i < 5; i++) {
			try {
				rmSync(profile, { recursive: true, force: true });
				break;
			} catch {
				await sleep(800);
			}
		}
	};
	return { send, listeners, close };
}

/** Records media elements, created blobs and saved downloads in the page. */
const PAGE_HOOKS = `(()=>{
	window.__blobs=[];window.__saves=[];window.__audios=[];
	const c=URL.createObjectURL;URL.createObjectURL=function(b){try{window.__blobs.push({size:b.size,type:b.type})}catch(e){}return c.apply(this,arguments)};
	const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)window.__saves.push(this.download);return ac.apply(this,arguments)};
	const p=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(!window.__audios.includes(this))window.__audios.push(this);return p.apply(this,arguments)};
})()`;

/** Open a tab with network / console capture. `cookie` = "name=value" or null. */
export async function openPage(browser, { base, cookie }) {
	const { send, listeners } = browser;
	const { targetId } = await send("Target.createTarget", { url: "about:blank" });
	const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
	const S = (m, p) => send(m, p, sessionId);
	const net = [];
	const consoleErrors = [];
	listeners.push((m) => {
		if (m.sessionId !== sessionId) return;
		const p = m.params;
		if (m.method === "Network.requestWillBeSent")
			net.push({ id: p.requestId, url: p.request.url.replace(base, ""), range: p.request.headers.Range || p.request.headers.range });
		if (m.method === "Network.responseReceived") {
			const r = net.find((x) => x.id === p.requestId);
			if (r) {
				r.status = p.response.status;
				r.len = p.response.headers["content-length"] || p.response.headers["Content-Length"];
			}
		}
		if (m.method === "Network.loadingFailed") {
			const r = net.find((x) => x.id === p.requestId);
			if (r) r.failed = p.errorText + (p.canceled ? " (canceled)" : "");
		}
		if (m.method === "Runtime.exceptionThrown") consoleErrors.push("EXC " + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
		if (m.method === "Runtime.consoleAPICalled" && p.type === "error") consoleErrors.push(p.args.map((a) => a.value ?? a.description).join(" "));
	});
	await S("Network.enable");
	await S("Page.enable");
	await S("Runtime.enable");
	if (cookie) {
		const host = new URL(base).hostname;
		const value = cookie.slice(cookie.indexOf("=") + 1);
		await S("Network.setCookie", { name: "better-auth.session_token", value, domain: host, path: "/", httpOnly: true });
	}
	await S("Page.addScriptToEvaluateOnNewDocument", { source: PAGE_HOOKS });

	const ev = async (expression) => {
		const r = await S("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
		if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
		return r.result.value;
	};
	const goto = async (path, settleMs = 3500) => {
		await S("Page.navigate", { url: base + path });
		for (let i = 0; i < 60; i++) {
			if ((await ev("document.readyState").catch(() => "")) === "complete") break;
			await sleep(250);
		}
		await sleep(settleMs);
	};
	const clickBox = async (box) => {
		for (const type of ["mousePressed", "mouseReleased"])
			await S("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 });
	};
	const find = (re, selector) =>
		`(()=>{const re=new RegExp(${JSON.stringify(re)},"i");return [...document.querySelectorAll(${JSON.stringify(selector)})].find(b=>re.test((b.getAttribute("aria-label")||"").trim())||re.test((b.textContent||"").trim()))})()`;
	/** Real mouse click on the first visible control whose label or text matches `re`. */
	const click = async (re, { tries = 30, selector = "button,a,[role=button],[role=menuitem],[role=option],[role=tab]" } = {}) => {
		for (let i = 0; i < tries; i++) {
			const box = await ev(`(()=>{const re=new RegExp(${JSON.stringify(re)},"i");const b=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=="hidden"}).find(b=>re.test((b.getAttribute("aria-label")||"").trim())||re.test((b.textContent||"").trim()));if(!b)return null;b.scrollIntoView({block:"center"});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,label:(b.getAttribute("aria-label")||b.textContent||"").trim().slice(0,60)}})()`);
			if (box) {
				await clickBox(box);
				return box.label;
			}
			await sleep(400);
		}
		return null;
	};
	/** element.click() — for hover-only controls and links. */
	const clickJs = async (re, { tries = 20, selector = "button,a,[role=button],[role=tab]" } = {}) => {
		for (let i = 0; i < tries; i++) {
			const label = await ev(`(()=>{const b=${find(re, selector)};if(!b)return null;b.scrollIntoView({block:"center"});b.click();return (b.getAttribute("aria-label")||b.textContent||"").trim().slice(0,60)})()`);
			if (label) return label;
			await sleep(400);
		}
		return null;
	};
	const type = (text) => S("Input.insertText", { text });
	const key = async (k) => {
		const codes = { Enter: 13, Escape: 27 };
		for (const t of ["keyDown", "keyUp"]) await S("Input.dispatchKeyEvent", { type: t, key: k, code: k, windowsVirtualKeyCode: codes[k] });
	};
	const audio = () =>
		ev(`window.__audios.map(a=>({src:(a.currentSrc||"").replace(location.origin,"").slice(0,200),t:+a.currentTime.toFixed(1),d:isFinite(a.duration)?+a.duration.toFixed(1):String(a.duration),paused:a.paused,err:a.error&&a.error.code}))`);
	const active = async () => (await audio()).filter((a) => !a.paused && !a.err).at(-1);
	const labels = (re = ".") =>
		ev(`[...document.querySelectorAll("button,a,[role=button]")].map(b=>(b.getAttribute("aria-label")||b.textContent||"").trim().replace(/\\s+/g," ").slice(0,50)).filter(l=>l&&new RegExp(${JSON.stringify(re)},"i").test(l))`);
	const nowPlaying = () => ev(`navigator.mediaSession && navigator.mediaSession.metadata ? navigator.mediaSession.metadata.title : null`);
	/** Click the player's seek bar at `seconds`. */
	const seekBarTo = async (seconds) => {
		const bar = await until(() =>
			ev(`(()=>{const s=[...document.querySelectorAll("[role=slider]")].find(e=>Number(e.getAttribute("aria-valuemax"))>60&&e.getBoundingClientRect().width>100);if(!s)return null;const r=s.getBoundingClientRect();const max=Number(s.getAttribute("aria-valuemax"));const at=typeof ${seconds}==="number"&&${seconds}<0?max+${seconds}:${seconds};return {x:r.x+r.width*(at/max),y:r.y+r.height/2,max}})()`)
		);
		if (bar) await clickBox(bar);
		return bar;
	};
	const closeTab = () => send("Target.closeTarget", { targetId });
	const front = () => S("Page.bringToFront");
	return { S, ev, goto, click, clickJs, clickBox, type, key, audio, active, labels, nowPlaying, seekBarTo, net, consoleErrors, closeTab, front };
}
