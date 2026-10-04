// The local stack the browser checks run against: a throwaway Postgres in
// Docker, `next start` on the production build, a seeded signed-in user
// (better-auth session + the service Deezer ARL), and R2 cleanup.
import { execSync, spawn } from "child_process";
import { createHmac, randomBytes } from "crypto";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import pg from "pg";
import { sleep } from "./cdp.mjs";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** Same precedence as Next: .env.local over .env (shell env wins over both). */
export function loadEnv() {
	config({ path: `${ROOT}/.env.local`, quiet: true });
	config({ path: `${ROOT}/.env`, quiet: true });
	const missing = ["BETTER_AUTH_SECRET", "WAVELET_SERVICE_ARL", "R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"].filter(
		(k) => !process.env[k]
	);
	if (missing.length) throw new Error(`e2e needs ${missing.join(", ")} (from .env / .env.local)`);
	// The checks persist tracks and delete them afterwards: never against the production bucket.
	if (process.env.R2_BUCKET === "wavelet-music" && process.env.E2E_ALLOW_PROD_BUCKET !== "1") {
		throw new Error("R2_BUCKET is the production bucket — use the dev bucket (wavelet-music-dev) for e2e");
	}
}

const sh = (cmd, opts = {}) => (execSync(cmd, { cwd: ROOT, stdio: "pipe", ...opts }) ?? "").toString().trim();

export class ThrowawayDb {
	constructor({ name = "wavelet-e2e-pg", port = 15499 } = {}) {
		this.name = name;
		this.url = `postgresql://e2e:e2e@localhost:${port}/wavelet`;
		this.port = port;
	}
	async start() {
		this.stop();
		sh(`docker run -d --name ${this.name} -p ${this.port}:5432 -e POSTGRES_USER=e2e -e POSTGRES_PASSWORD=e2e -e POSTGRES_DB=wavelet postgres:16-alpine`);
		for (let i = 0; i < 60; i++) {
			try {
				sh(`docker exec ${this.name} pg_isready -U e2e -q`);
				break;
			} catch {
				await sleep(500);
			}
		}
		await sleep(1000);
		sh("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: this.url, DATABASE_URL_UNPOOLED: this.url } });
	}
	async query(sql, params = []) {
		const client = new pg.Client({ connectionString: this.url });
		await client.connect();
		try {
			return (await client.query(sql, params)).rows;
		} finally {
			await client.end();
		}
	}
	stop() {
		try {
			sh(`docker rm -f ${this.name}`);
		} catch {
			// already gone
		}
	}
}

/** A signed-in user with the service ARL; returns the better-auth session cookie. */
export async function seedUser(db) {
	const userId = "e2e-user";
	const token = randomBytes(24).toString("hex");
	await db.query(
		`INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES($1,'E2E','e2e@example.com',true,now(),now()) ON CONFLICT (id) DO NOTHING`,
		[userId]
	);
	await db.query(`INSERT INTO session(id,"expiresAt",token,"createdAt","updatedAt","userId") VALUES($1, now() + interval '1 day', $2, now(), now(), $3)`, [
		"e2e-" + token.slice(0, 8),
		token,
		userId,
	]);
	// Plaintext on purpose: the first login exercises the legacy-ARL re-encryption path.
	await db.query(
		`INSERT INTO deezer_credential(id,"userId",arl,"createdAt","updatedAt") VALUES('e2e-cred',$1,$2,now(),now()) ON CONFLICT ("userId") DO UPDATE SET arl = EXCLUDED.arl`,
		[userId, process.env.WAVELET_SERVICE_ARL]
	);
	const sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET).update(token).digest("base64");
	return "better-auth.session_token=" + encodeURIComponent(`${token}.${sig}`);
}

/** Delete the R2 objects the run persisted (every StoredTrack row of the throwaway DB). */
export async function cleanR2(db) {
	const keys = (await db.query(`SELECT "storagePath" FROM stored_track`)).map((r) => r.storagePath);
	if (keys.length) sh(`npx tsx e2e/lib/clean-r2.ts ${keys.map((k) => `"${k}"`).join(" ")}`);
	return keys.length;
}

/** `next build` + `next start` against the throwaway DB. */
export class Server {
	constructor({ port = 3000, db, cronSecret }) {
		this.port = port;
		this.base = `http://localhost:${port}`;
		this.env = {
			...process.env,
			DATABASE_URL: db.url,
			DATABASE_URL_UNPOOLED: db.url,
			BETTER_AUTH_URL: this.base,
			CRON_SECRET: cronSecret,
		};
		this.log = "";
	}
	build() {
		sh("npm run build", { env: this.env, stdio: "inherit" });
	}
	async start() {
		this.proc = spawn("npx", ["next", "start", "-p", String(this.port)], { cwd: ROOT, env: this.env, shell: true });
		this.proc.stdout.on("data", (d) => (this.log += d));
		this.proc.stderr.on("data", (d) => (this.log += d));
		for (let i = 0; i < 120 && !/Ready/.test(this.log); i++) await sleep(500);
		if (!/Ready/.test(this.log)) throw new Error("next start did not become ready:\n" + this.log);
	}
	serverErrors() {
		return (this.log.match(/unhandled error[^\n]*/g) || []).slice(0, 10);
	}
	stop() {
		if (!this.proc) return;
		if (process.platform === "win32") {
			try {
				execSync(`taskkill /pid ${this.proc.pid} /T /F`, { stdio: "ignore" });
			} catch {
				// already gone
			}
		} else this.proc.kill("SIGTERM");
	}
}

/** Collects named checks; `ok` false keeps going and is reported at the end. */
export function checker() {
	const t0 = Date.now();
	const results = [];
	const check = (flow, name, ok, detail = "") => {
		results.push({ flow, name, ok: !!ok, detail });
		const at = `[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s]`;
		console.log(at, ok ? "PASS" : "FAIL", `${flow} · ${name}`, ok ? "" : String(detail).slice(0, 400));
		return !!ok;
	};
	return { check, results };
}

/** fetch() against the app with or without the session cookie. */
export function apiClient(base, cookie) {
	return async (method, path, body, { auth = true, headers = {} } = {}) => {
		const res = await fetch(base + path, {
			method,
			redirect: "manual",
			headers: { ...(auth && cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
			body: body ? JSON.stringify(body) : undefined,
		});
		const text = await res.text();
		let json = null;
		try {
			json = JSON.parse(text);
		} catch {
			// not JSON
		}
		return { status: res.status, json, text, headers: res.headers };
	};
}
