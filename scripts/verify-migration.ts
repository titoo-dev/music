// Réconciliation Postgres ↔ Convex après import (Phase 2).
//
//   npm run db:verify            # compare Postgres au déploiement dev
//   npm run db:verify -- --prod  # … au déploiement prod
//
// Compare le nombre de lignes par table et signale les écarts. Exit code 1 si
// un écart est détecté (utilisable en CI de migration).

import pg from "pg";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

// pg name → convex table name (mêmes mappings que l'export).
const TABLES: { pg: string; convex: string }[] = [
	{ pg: "config", convex: "config" },
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

async function main() {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) throw new Error("DATABASE_URL is not set");
	const convexUrl =
		process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");

	const pool = new pg.Pool({ connectionString: dbUrl, max: 4 });
	const convex = new ConvexHttpClient(convexUrl);

	const convexCounts = (await convex.query(
		makeFunctionReference<"query">("admin:tableCounts"),
		{},
	)) as Record<string, number>;

	let mismatches = 0;
	console.log("table                 postgres   convex   status");
	console.log("─".repeat(55));
	try {
		for (const t of TABLES) {
			const res = await pool.query<{ count: string }>(
				`SELECT COUNT(*)::text AS count FROM ${t.pg}`,
			);
			const pgCount = Number(res.rows[0].count);
			const cvCount = convexCounts[t.convex] ?? 0;
			const ok = pgCount === cvCount;
			if (!ok) mismatches++;
			console.log(
				`${t.convex.padEnd(20)} ${String(pgCount).padStart(8)} ${String(
					cvCount,
				).padStart(8)}   ${ok ? "✓" : "✗ MISMATCH"}`,
			);
		}
	} finally {
		await pool.end();
	}

	if (mismatches > 0) {
		console.error(`\n✗ ${mismatches} table(s) en écart.`);
		process.exit(1);
	}
	console.log("\n✓ Toutes les tables réconciliées.");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
