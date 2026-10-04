// Gapless playback (setting on) in the production build: One More Time →
// Aerodynamic, both cached by the critical flows that run first.
import { openPage, sleep, until } from "./lib/cdp.mjs";

export async function runGapless({ browser, base, cookie, check }) {
	const p = await openPage(browser, { base, cookie });
	await p.goto("/album?id=302127", 3000);
	// The persisted setting, as the toggle in the player menu writes it.
	await p.ev(`(()=>{const k="wavelet-player";const v=JSON.parse(localStorage.getItem(k)||'{"state":{},"version":0}');v.state.gapless=true;v.state.crossfadeDuration=0;localStorage.setItem(k,JSON.stringify(v));return 1})()`);
	await p.S("Page.reload");
	await sleep(4500);
	check("Gapless", "setting is on", await p.ev(`JSON.parse(localStorage.getItem("wavelet-player")).state.gapless === true`));
	// A track row, right after the hover preload starts (the race fixed in 5ee5211).
	await p.click("^Play One More Time$");
	const a = await until(async () => {
		const x = await p.active();
		return x && x.t > 0.5 ? x : null;
	}, 20000);
	check("Gapless", "first track plays", !!a, JSON.stringify(await p.audio()));
	check("Gapless", "the Media Source deck plays cached tracks", /^blob:/.test(a?.src || ""), a?.src);
	const elements = (await p.audio()).length;
	await p.seekBarTo(-8);
	check("Gapless", "boundary advances to Aerodynamic", !!(await until(async () => /Aerodynamic/i.test((await p.nowPlaying()) || ""), 30000)), await p.nowPlaying());
	await sleep(3000);
	const after = await p.audio();
	const live = after.filter((x) => !x.paused && !x.err);
	check("Gapless", "one element, no reload at the boundary", after.length === elements && live.length === 1 && /^blob:/.test(live[0].src), JSON.stringify(after));
	const pos = await p.ev(`(()=>{const s=[...document.querySelectorAll("[role=slider]")].find(e=>Number(e.getAttribute("aria-valuemax"))>60);return s?Number(s.getAttribute("aria-valuenow")):null})()`);
	check("Gapless", "the seek bar restarts at 0 for the new track", pos !== null && pos < 10, pos);
	await p.click("^Pause$");
	await sleep(1000);
	check("Gapless", "pause", !(await p.active()));
	await p.click("^Play$");
	check("Gapless", "resume", !!(await until(() => p.active(), 8000)));
	await p.click("^Next track$");
	check("Gapless", "a user skip leaves the run and plays the next track", !!(await until(async () => /Digital Love/i.test((await p.nowPlaying()) || "") && (await p.active()), 25000)), await p.nowPlaying());
	check("Gapless", "no console errors", p.consoleErrors.length === 0, p.consoleErrors.slice(0, 5).join(" | "));
	check("Gapless", "no 5xx", !p.net.some((r) => r.status >= 500));
	await p.closeTab();
}
