// Importe les JSONL produits par `npm run db:export` dans Convex.
//
//   npm run db:export              # Postgres → scratch/convex-export/*.jsonl
//   npm run db:import              # → déploiement dev
//   npm run db:import -- --prod    # → déploiement prod
//
// Idempotent : --replace écrase la table à chaque run (les `id` cuid conservés
// rendent l'opération rejouable sans doublon). Les tables d'auth ne sont PAS
// importées ici (composant Better Auth, Phase 4).

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const TABLES = [
	"config",
	"deezerCredential",
	"userSettings",
	"userPreferences",
	"playlist",
	"playlistTrack",
	"savedTrack",
	"album",
	"albumTrack",
	"followedArtist",
	"storedTrack",
	"recentPlay",
	"stemSeparation",
	"stemFile",
	"trackMatch",
	"sharedTrack",
];

function main() {
	const prod = process.argv.includes("--prod");
	const dir = process.env.EXPORT_DIR ?? join("scratch", "convex-export");

	let imported = 0;
	for (const table of TABLES) {
		const file = join(dir, `${table}.jsonl`);
		if (!existsSync(file)) {
			console.warn(`  skip ${table} (no ${file})`);
			continue;
		}
		const args = [
			"convex",
			"import",
			"--table",
			table,
			"--replace",
			"--yes",
			...(prod ? ["--prod"] : []),
			file,
		];
		console.log(`  importing ${table} …`);
		execFileSync("npx", args, { stdio: "inherit" });
		imported++;
	}
	console.log(`\n✓ ${imported} tables importées (${prod ? "prod" : "dev"}).`);
	console.log("Vérifier avec : npm run db:verify" + (prod ? " -- --prod" : ""));
}

main();
