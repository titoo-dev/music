// FollowedArtist — liste « Following » (métadonnées plates).
// Miroir de src/lib/library.ts (followArtist, etc.).

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

export const follow = mutation({
	args: {
		userId: v.string(),
		id: v.optional(v.string()),
		deezerArtistId: v.string(),
		name: v.string(),
		pictureUrl: v.optional(v.union(v.string(), v.null())),
		followedAt: v.optional(v.number()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("followedArtist")
			.withIndex("by_user_artist", (q) =>
				q.eq("userId", args.userId).eq("deezerArtistId", args.deezerArtistId),
			)
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				name: args.name,
				pictureUrl: args.pictureUrl ?? undefined,
			});
			return null;
		}
		await ctx.db.insert("followedArtist", {
			id: args.id ?? newId(),
			userId: args.userId,
			deezerArtistId: args.deezerArtistId,
			name: args.name,
			...(args.pictureUrl != null ? { pictureUrl: args.pictureUrl } : {}),
			followedAt: args.followedAt ?? Date.now(),
		});
		return null;
	},
});

export const unfollow = mutation({
	args: { userId: v.string(), deezerArtistId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query("followedArtist")
			.withIndex("by_user_artist", (q) =>
				q.eq("userId", args.userId).eq("deezerArtistId", args.deezerArtistId),
			)
			.collect();
		for (const r of rows) await ctx.db.delete(r._id);
		return null;
	},
});

export const isFollowed = query({
	args: { userId: v.string(), deezerArtistId: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("followedArtist")
			.withIndex("by_user_artist", (q) =>
				q.eq("userId", args.userId).eq("deezerArtistId", args.deezerArtistId),
			)
			.unique();
		return row !== null;
	},
});

export const followedIds = query({
	args: { userId: v.string(), deezerArtistIds: v.array(v.string()) },
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		if (args.deezerArtistIds.length === 0) return [];
		const wanted = new Set(args.deezerArtistIds);
		const rows = await ctx.db
			.query("followedArtist")
			.withIndex("by_user_followed", (q) => q.eq("userId", args.userId))
			.collect();
		return rows
			.filter((r) => wanted.has(r.deezerArtistId))
			.map((r) => r.deezerArtistId);
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
			.query("followedArtist")
			.withIndex("by_user_followed", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();
		const offset = args.offset ?? 0;
		if (offset > 0) rows = rows.slice(offset);
		if (args.limit != null) rows = rows.slice(0, args.limit);
		return rows;
	},
});
