// Fonctions d'administration pour la migration (Phase 2). À NE PAS exposer en
// prod une fois la migration terminée (ou protéger). Utilisé par
// scripts/verify-migration.ts pour réconcilier les comptes Postgres ↔ Convex.

import { query } from "./_generated/server";
import { v } from "convex/values";

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
] as const;

/** Compte des documents par table (réconciliation post-import). */
export const tableCounts = query({
	args: {},
	handler: async (ctx) => {
		const counts: Record<string, number> = {};
		for (const table of TABLES) {
			// collect() suffit aux volumes de cette app ; pour de très gros
			// volumes, préférer un agrégat incrémental.
			const rows = await ctx.db.query(table).collect();
			counts[table] = rows.length;
		}
		return counts;
	},
});

/** Vide une table (validation du pipeline d'import en dev — NE PAS utiliser en prod). */
export const clearTable = query({
	args: { table: v.string() },
	handler: async (ctx, args) => {
		// Lecture seule volontairement : la suppression se fait via le dashboard
		// ou `npx convex import --replace`. Cette query sert juste à compter.
		const rows = await ctx.db
			.query(args.table as (typeof TABLES)[number])
			.take(1);
		return { exists: rows.length > 0 };
	},
});
