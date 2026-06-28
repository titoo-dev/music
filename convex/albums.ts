// Album + AlbumTrack — albums sauvegardés et leur tracklist.
// Miroir de src/lib/library.ts (saveAlbum, unsaveAlbum, …). Cascade
// album→albumTrack reproduite manuellement. Éviction S3 côté Next.js :
// unsaveAlbum renvoie les trackIds concernés.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

const albumTrackArg = v.object({
	id: v.optional(v.string()),
	trackId: v.string(),
	title: v.string(),
	artist: v.string(),
	coverUrl: v.optional(v.union(v.string(), v.null())),
	duration: v.optional(v.union(v.number(), v.null())),
	trackNumber: v.optional(v.union(v.number(), v.null())),
});

export const saveAlbum = mutation({
	args: {
		userId: v.string(),
		id: v.optional(v.string()),
		deezerAlbumId: v.string(),
		title: v.string(),
		artist: v.string(),
		coverUrl: v.optional(v.union(v.string(), v.null())),
		tracks: v.array(albumTrackArg),
		savedAt: v.optional(v.number()),
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("album")
			.withIndex("by_user_album", (q) =>
				q.eq("userId", args.userId).eq("deezerAlbumId", args.deezerAlbumId),
			)
			.unique();

		let albumId: string;
		if (existing) {
			albumId = existing.id;
			await ctx.db.patch(existing._id, {
				title: args.title,
				artist: args.artist,
				trackCount: args.tracks.length,
				coverUrl: args.coverUrl ?? undefined,
			});
		} else {
			albumId = args.id ?? newId();
			await ctx.db.insert("album", {
				id: albumId,
				userId: args.userId,
				deezerAlbumId: args.deezerAlbumId,
				title: args.title,
				artist: args.artist,
				trackCount: args.tracks.length,
				...(args.coverUrl != null ? { coverUrl: args.coverUrl } : {}),
				savedAt: args.savedAt ?? Date.now(),
			});
		}

		// Re-sync tracklist : delete-then-recreate (drop des lignes obsolètes).
		const old = await ctx.db
			.query("albumTrack")
			.withIndex("by_album", (q) => q.eq("albumId", albumId))
			.collect();
		for (const t of old) await ctx.db.delete(t._id);

		for (const t of args.tracks) {
			await ctx.db.insert("albumTrack", {
				id: t.id ?? newId(),
				albumId,
				trackId: t.trackId,
				title: t.title,
				artist: t.artist,
				...(t.coverUrl != null ? { coverUrl: t.coverUrl } : {}),
				...(t.duration != null ? { duration: t.duration } : {}),
				...(t.trackNumber != null ? { trackNumber: t.trackNumber } : {}),
			});
		}
		return albumId;
	},
});

export const unsaveAlbum = mutation({
	args: { userId: v.string(), deezerAlbumId: v.string() },
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		const album = await ctx.db
			.query("album")
			.withIndex("by_user_album", (q) =>
				q.eq("userId", args.userId).eq("deezerAlbumId", args.deezerAlbumId),
			)
			.unique();
		if (!album) return [];

		const tracks = await ctx.db
			.query("albumTrack")
			.withIndex("by_album", (q) => q.eq("albumId", album.id))
			.collect();
		const trackIds = tracks.map((t) => t.trackId);

		for (const t of tracks) await ctx.db.delete(t._id);
		await ctx.db.delete(album._id);
		return trackIds;
	},
});

export const listSavedAlbums = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("album")
			.withIndex("by_user_saved", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();
	},
});

export const savedAlbumIds = query({
	args: { userId: v.string(), deezerAlbumIds: v.array(v.string()) },
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		if (args.deezerAlbumIds.length === 0) return [];
		const wanted = new Set(args.deezerAlbumIds);
		const rows = await ctx.db
			.query("album")
			.withIndex("by_user_saved", (q) => q.eq("userId", args.userId))
			.collect();
		return rows
			.filter((r) => wanted.has(r.deezerAlbumId))
			.map((r) => r.deezerAlbumId);
	},
});

/** Album sauvegardé par id interne (ownership) + tracklist triée par n° de piste. */
export const getOwnedWithTracks = query({
	args: { albumId: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		const album = await ctx.db
			.query("album")
			.withIndex("by_origin_id", (q) => q.eq("id", args.albumId))
			.unique();
		if (!album || album.userId !== args.userId) return null;
		const tracks = (
			await ctx.db
				.query("albumTrack")
				.withIndex("by_album", (q) => q.eq("albumId", args.albumId))
				.collect()
		).sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
		return { ...album, tracks };
	},
});

export const listAlbumTracks = query({
	args: { albumId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("albumTrack")
			.withIndex("by_album", (q) => q.eq("albumId", args.albumId))
			.collect();
	},
});
