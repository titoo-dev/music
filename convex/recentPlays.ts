// RecentPlay — historique d'écoute (cap 100, compté à 30s). Unique [userId,trackId].
// L'éviction S3 du dépassement de cap reste côté Next.js : `record` renvoie les
// trackIds évincés pour que l'appelant tente maybeEvictFile.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

const CAP = 100;

export const record = mutation({
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
		cap: v.optional(v.number()),
	},
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		const now = Date.now();
		const existing = await ctx.db
			.query("recentPlay")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", args.userId).eq("trackId", args.trackId),
			)
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, { playedAt: now });
			return [];
		}
		await ctx.db.insert("recentPlay", {
			id: args.id ?? newId(),
			userId: args.userId,
			trackId: args.trackId,
			title: args.title,
			artist: args.artist,
			...(args.album != null ? { album: args.album } : {}),
			...(args.albumId != null ? { albumId: args.albumId } : {}),
			...(args.coverUrl != null ? { coverUrl: args.coverUrl } : {}),
			...(args.duration != null ? { duration: args.duration } : {}),
			playedAt: now,
		});

		// Cap : supprimer les plus anciens au-delà de la limite, renvoyer leurs trackIds.
		const cap = args.cap ?? CAP;
		const all = await ctx.db
			.query("recentPlay")
			.withIndex("by_user_played", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();
		const evicted: string[] = [];
		for (let i = cap; i < all.length; i++) {
			evicted.push(all[i].trackId);
			await ctx.db.delete(all[i]._id);
		}
		return evicted;
	},
});

export const list = query({
	args: { userId: v.string(), limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query("recentPlay")
			.withIndex("by_user_played", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();
		return args.limit != null ? rows.slice(0, args.limit) : rows;
	},
});

/** Métadonnées d'une écoute récente (fallback lyrics). */
export const getMeta = query({
	args: { userId: v.string(), trackId: v.string() },
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("recentPlay")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", args.userId).eq("trackId", args.trackId),
			)
			.unique();
		return row
			? { title: row.title, artist: row.artist, album: row.album ?? null }
			: null;
	},
});

export const hasPlay = query({
	args: { userId: v.string(), trackId: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("recentPlay")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", args.userId).eq("trackId", args.trackId),
			)
			.unique();
		return row !== null;
	},
});

export const removeByTrack = mutation({
	args: { userId: v.string(), trackId: v.string() },
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("recentPlay")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", args.userId).eq("trackId", args.trackId),
			)
			.unique();
		if (!row) return null;
		await ctx.db.delete(row._id);
		return args.trackId;
	},
});
