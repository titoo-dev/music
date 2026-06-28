// Export Postgres → JSONL prêt pour `npx convex import`.
//
//   npm run db:export                 # → scratch/convex-export/<table>.jsonl
//   EXPORT_DIR=/tmp/x npm run db:export
//
// Une ligne JSON par document. Transformations appliquées :
//   • colonnes DATE/TIMESTAMP  → epoch ms (number)        — cf. schema.ts
//   • colonnes BIGINT (int8)   → number  (type parser pg) — deezerUserId < 2^53
//   • colonnes JSON/JSONB      → objet JS (déjà parsé par pg)
//   • renommage des colonnes @map de `config` (user_id/updated_at)
//
// Les `_id`/`_creationTime` Convex NE sont PAS émis : on conserve l'`id` cuid
// d'origine comme champ (décision (A) de docs/CONVEX_MIGRATION.md), ce qui rend
// l'import idempotent et préserve les FK sans remappage.
//
// NB : les tables d'auth (user/session/account/verification) ne sont PAS
// exportées ici — elles migrent via le composant Better Auth en Phase 4.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

// int8 (OID 20) → number plutôt que string (valeurs < 2^53 dans ce schéma).
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

// Table Postgres (@@map) → table Convex (camelCase de schema.ts).
// `rename` : colonnes @map à réécrire vers les champs Convex.
const TABLES: { pg: string; convex: string; rename?: Record<string, string> }[] =
	[
		{
			pg: "config",
			convex: "config",
			rename: { user_id: "userId", updated_at: "updatedAt" },
		},
		{ pg: "deezer_credential", convex: "deezerCredential" },
		{ pg: "user_settings", convex: "userSettings" },
		{ pg: "user_preferences", convex: "userPreferences" },
		{ pg: "playlist", convex: "playlist" },
		{ pg: "playlist_track", convex: "playlistTrack" },
		{ pg: "saved_track", convex: "savedTrack" },
		{ pg: "album", convex: "album" },
		{ pg: "album_track", convex: "albumTrack" },
		{ pg: "followed_artist", convex: "followedArtist" },
		{ pg: "stored_track", convex: "storedTrack" },
		{ pg: "recent_play", convex: "recentPlay" },
		{ pg: "stem_separation", convex: "stemSeparation" },
		{ pg: "stem_file", convex: "stemFile" },
		{ pg: "track_match", convex: "trackMatch" },
		{ pg: "shared_track", convex: "sharedTrack" },
	];

function transformRow(
	row: Record<string, unknown>,
	rename?: Record<string, string>,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(row)) {
		// Les champs null sont OMIS : le schéma Convex utilise des optionnels
		// propres (v.optional(...)), qui n'acceptent pas la valeur null.
		if (value === null || value === undefined) continue;
		const k = rename?.[key] ?? key;
		out[k] = value instanceof Date ? value.getTime() : value;
	}
	return out;
}

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");

	const outDir = process.env.EXPORT_DIR ?? join("scratch", "convex-export");
	mkdirSync(outDir, { recursive: true });

	const pool = new pg.Pool({ connectionString: url, max: 4 });
	const summary: { table: string; rows: number }[] = [];

	try {
		for (const t of TABLES) {
			const res = await pool.query<Record<string, unknown>>(
				`SELECT * FROM ${t.pg}`,
			);
			const lines = res.rows
				.map((r) => JSON.stringify(transformRow(r, t.rename)))
				.join("\n");
			const file = join(outDir, `${t.convex}.jsonl`);
			writeFileSync(file, lines ? lines + "\n" : "");
			summary.push({ table: t.convex, rows: res.rows.length });
			console.log(`  ${t.convex.padEnd(18)} ${res.rows.length} → ${file}`);
		}
	} finally {
		await pool.end();
	}

	const total = summary.reduce((n, s) => n + s.rows, 0);
	console.log(`\n✓ ${summary.length} tables, ${total} documents → ${outDir}`);
	console.log(
		"\nImport ensuite (par table) :\n" +
			summary
				.map(
					(s) =>
						`  npx convex import --table ${s.table} --replace ${join(
							outDir,
							`${s.table}.jsonl`,
						)}`,
				)
				.join("\n"),
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
