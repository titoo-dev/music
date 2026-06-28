// SavedTrack — pistes « likées ». Miroir de src/lib/library.ts (saveTrack, etc.).
//
// NB : l'éviction de fichier S3 (maybeEvictFile) reste côté Next.js — Convex ne
// gère que les lignes de données. `unsave` retourne le trackId pour que
// l'appelant déclenche l'éviction. Voir docs/CONVEX_MIGRATION.md §6.3.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

export const save = mutation({
	args: {
		userId: v.string(),
		id: v.optional(v.string()),
		trackId: v.string(),
		title: v.string(),
		artist: v.string(),
		album: v.optional(v.union(v.string(), v.null())),
		albumId: v.optional(v.union(v.string(), v.null())),
		coverUrl: v.optional(v.union(v.string(), v.null())),
		duration: v.optional(v.union(v.number(), v.null())),
		savedAt: v.optional(v.number()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("savedTrack")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", args.userId).eq("trackId", args.trackId),
			)
			.unique();
		if (existing) return null; // upsert update:{} → no-op (Prisma parity)

		await ctx.db.insert("savedTrack", {
			id: args.id ?? newId(),
			userId: args.userId,
			trackId: args.trackId,
			title: args.title,
			artist: args.artist,
			...(args.album != null ? { album: args.album } : {}),
			...(args.albumId != null ? { albumId: args.albumId } : {}),
			...(args.coverUrl != null ? { coverUrl: args.coverUrl } : {}),
			...(args.duration != null ? { duration: args.duration } : {}),
			savedAt: args.savedAt ?? Date.now(),
		});
		return null;
	},
});

export const unsave = mutation({
	args: { userId: v.string(), trackId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query("savedTrack")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", args.userId).eq("trackId", args.trackId),
			)
			.collect();
		for (const row of rows) await ctx.db.delete(row._id);
		return null;
	},
});

export const isSaved = query({
	args: { userId: v.string(), trackId: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("savedTrack")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", args.userId).eq("trackId", args.trackId),
			)
			.unique();
		return row !== null;
	},
});

/** Lookup par lot — renvoie les trackIds sauvegardés parmi `trackIds`. */
export const savedIds = query({
	args: { userId: v.string(), trackIds: v.array(v.string()) },
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		if (args.trackIds.length === 0) return [];
		const wanted = new Set(args.trackIds);
		const rows = await ctx.db
			.query("savedTrack")
			.withIndex("by_user_saved", (q) => q.eq("userId", args.userId))
			.collect();
		return rows.filter((r) => wanted.has(r.trackId)).map((r) => r.trackId);
	},
});

/** Métadonnées d'une piste likée (fallback lyrics). */
export const getMeta = query({
	args: { userId: v.string(), trackId: v.string() },
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("savedTrack")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", args.userId).eq("trackId", args.trackId),
			)
			.unique();
		return row
			? { title: row.title, artist: row.artist, album: row.album ?? null }
			: null;
	},
});

export const list = query({
	args: {
		userId: v.string(),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		let rows = await ctx.db
			.query("savedTrack")
			.withIndex("by_user_saved", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();
		const offset = args.offset ?? 0;
		if (offset > 0) rows = rows.slice(offset);
		if (args.limit != null) rows = rows.slice(0, args.limit);
		return rows;
	},
});
