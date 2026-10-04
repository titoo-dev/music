// npm run e2e — browser checks of the critical web flows against a production
// build: throwaway Postgres → next build → next start → seeded user →
// critical flows → gapless → cleanup (R2 objects, server, database).
// Needs Docker, Chrome, network access to Deezer and the DEV R2 bucket.
// See e2e/README.md. Env: E2E_PORT (3000), E2E_PG_PORT (15499),
// E2E_SKIP_BUILD=1, E2E_KEEP=1 (leave the stack running), CHROME_PATH.
import { randomBytes } from "crypto";
import { launch } from "./lib/cdp.mjs";
import { Server, ThrowawayDb, checker, cleanR2, loadEnv, seedUser } from "./lib/stack.mjs";
import { runCriticalFlows } from "./critical-flows.mjs";
import { runGapless } from "./gapless.mjs";

loadEnv();
const { check, results } = checker();
const db = new ThrowawayDb({ port: Number(process.env.E2E_PG_PORT || 15499) });
const cronSecret = randomBytes(16).toString("hex");
const server = new Server({ port: Number(process.env.E2E_PORT || 3000), db, cronSecret });
let browser = null;

try {
	console.log("▶ throwaway Postgres + migrations");
	await db.start();
	if (process.env.E2E_SKIP_BUILD !== "1") {
		console.log("▶ next build");
		server.build();
	}
	console.log(`▶ next start on ${server.base}`);
	await server.start();
	browser = await launch({ port: 9361 });

	console.log("▶ critical flows");
	await runCriticalFlows({ browser, base: server.base, cookie: await seedUser(db), db, cronSecret, check });
	console.log("▶ gapless (setting on)");
	// The critical flows end signed out: a fresh session for the next suite.
	await runGapless({ browser, base: server.base, cookie: await seedUser(db), check });

	const errors = server.serverErrors();
	check("G server", "no unhandled server error in the log", errors.length === 0, errors.join(" | "));
} catch (e) {
	check("runner", "stack / runner", false, e.stack);
} finally {
	if (browser) await browser.close();
	if (process.env.E2E_KEEP === "1") {
		console.log(`▶ E2E_KEEP=1: server on ${server.base}, database ${db.url}`);
	} else {
		try {
			console.log(`▶ cleanup: ${await cleanR2(db)} R2 object(s)`);
		} catch (e) {
			console.log("▶ cleanup: R2 objects could not be listed/deleted:", e.message);
		}
		server.stop();
		db.stop();
	}
	const failed = results.filter((r) => !r.ok);
	console.log(`\nSUMMARY: ${results.length - failed.length}/${results.length} checks passed`);
	if (failed.length) console.log("FAILED:\n" + failed.map((f) => ` - ${f.flow} · ${f.name}: ${String(f.detail).slice(0, 300)}`).join("\n"));
	process.exit(failed.length ? 1 : 0);
}
