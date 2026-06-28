// SharedTrack — liens de partage publics. Miroir de src/lib/library.ts
// (shareTrack, resolveShareForPlayback) + routes shares/*.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId, randomHex } from "./lib/util";

export const shareTrack = mutation({
	args: {
		userId: v.string(),
		id: v.optional(v.string()),
		shareId: v.optional(v.string()),
		trackId: v.string(),
		title: v.string(),
		artist: v.string(),
		album: v.optional(v.union(v.string(), v.null())),
		coverUrl: v.optional(v.union(v.string(), v.null())),
		duration: v.optional(v.union(v.number(), v.null())),
		expiresAt: v.optional(v.union(v.number(), v.null())),
	},
	handler: async (ctx, args) => {
		const shareId = args.shareId ?? randomHex(8);

		// Lier au StoredTrack de meilleure qualité s'il existe (fast-path S3).
		const stored = await ctx.db
			.query("storedTrack")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.collect();
		const best =
			stored.length > 0
				? stored.reduce((b, r) => (r.bitrate > b.bitrate ? r : b))
				: null;

		const id = args.id ?? newId();
		await ctx.db.insert("sharedTrack", {
			id,
			shareId,
			trackId: args.trackId,
			userId: args.userId,
			title: args.title,
			artist: args.artist,
			...(args.album != null ? { album: args.album } : {}),
			...(args.coverUrl != null ? { coverUrl: args.coverUrl } : {}),
			...(args.duration != null ? { duration: args.duration } : {}),
			...(best ? { storedTrackId: best.id } : {}),
			...(args.expiresAt != null ? { expiresAt: args.expiresAt } : {}),
			plays: 0,
			createdAt: Date.now(),
		});
		return { id, shareId };
	},
});

export const resolveForPlayback = query({
	args: { shareId: v.string() },
	handler: async (ctx, args) => {
		const share = await ctx.db
			.query("sharedTrack")
			.withIndex("by_share", (q) => q.eq("shareId", args.shareId))
			.unique();
		if (!share) return null;

		let storedTrack = null;
		if (share.storedTrackId) {
			storedTrack = await ctx.db
				.query("storedTrack")
				.withIndex("by_origin_id", (q) => q.eq("id", share.storedTrackId!))
				.unique();
		}
		const expired = share.expiresAt != null && share.expiresAt < Date.now();
		return { share, storedTrack, expired };
	},
});

export const incrementPlays = mutation({
	args: { shareId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const share = await ctx.db
			.query("sharedTrack")
			.withIndex("by_share", (q) => q.eq("shareId", args.shareId))
			.unique();
		if (share) await ctx.db.patch(share._id, { plays: share.plays + 1 });
		return null;
	},
});

/** Métadonnées publiques d'un partage (sans le user — joint en Phase 4). */
export const getPublicMeta = query({
	args: { shareId: v.string() },
	handler: async (ctx, args) => {
		const s = await ctx.db
			.query("sharedTrack")
			.withIndex("by_share", (q) => q.eq("shareId", args.shareId))
			.unique();
		if (!s) return null;
		return {
			shareId: s.shareId,
			title: s.title,
			artist: s.artist,
			album: s.album ?? null,
			coverUrl: s.coverUrl ?? null,
			duration: s.duration ?? null,
			plays: s.plays,
			createdAt: s.createdAt,
			expiresAt: s.expiresAt ?? null,
			user: null, // TODO Phase 4 : joindre l'utilisateur (composant Better Auth)
		};
	},
});

/** Détache le StoredTrack d'un partage (fichier évincé entre lookup et fetch). */
export const detachStored = mutation({
	args: { shareId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const s = await ctx.db
			.query("sharedTrack")
			.withIndex("by_share", (q) => q.eq("shareId", args.shareId))
			.unique();
		if (s) await ctx.db.patch(s._id, { storedTrackId: undefined });
		return null;
	},
});

export const listByUser = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("sharedTrack")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();
	},
});

export const deleteShare = mutation({
	args: { userId: v.string(), shareId: v.string() },
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, args) => {
		const share = await ctx.db
			.query("sharedTrack")
			.withIndex("by_share", (q) => q.eq("shareId", args.shareId))
			.unique();
		// Ne supprime que si le partage appartient à l'utilisateur (parité route).
		if (!share || share.userId !== args.userId) return null;
		const trackId = share.trackId;
		await ctx.db.delete(share._id);
		return trackId;
	},
});
