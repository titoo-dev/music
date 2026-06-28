// StoredTrack — cache fichiers (dédup global trackId+bitrate) + ref-counting.
// Miroir de src/lib/library.ts (getTrackRefCount, partie DB de forceEvictFile).
//
// ⚠️ L'accès S3 est IMPOSSIBLE depuis une query/mutation Convex : la suppression
// physique du fichier reste côté Next.js (route/action). `deleteByTrack` ne
// supprime que les LIGNES et renvoie les storagePaths pour que l'appelant
// supprime les objets S3. Voir docs/CONVEX_MIGRATION.md §6.3.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

export const findByTrack = query({
	args: { trackId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("storedTrack")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.collect();
	},
});

export const findHighestBitrate = query({
	args: { trackId: v.string() },
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query("storedTrack")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.collect();
		if (rows.length === 0) return null;
		return rows.reduce((best, r) => (r.bitrate > best.bitrate ? r : best));
	},
});

export const upsert = mutation({
	args: {
		id: v.optional(v.string()),
		trackId: v.string(),
		bitrate: v.number(),
		storagePath: v.string(),
		storageType: v.string(),
		fileSize: v.optional(v.union(v.number(), v.null())),
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("storedTrack")
			.withIndex("by_track_bitrate", (q) =>
				q.eq("trackId", args.trackId).eq("bitrate", args.bitrate),
			)
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				storagePath: args.storagePath,
				storageType: args.storageType,
				fileSize: args.fileSize ?? undefined,
			});
			return existing.id;
		}
		const id = args.id ?? newId();
		await ctx.db.insert("storedTrack", {
			id,
			trackId: args.trackId,
			bitrate: args.bitrate,
			storagePath: args.storagePath,
			storageType: args.storageType,
			...(args.fileSize != null ? { fileSize: args.fileSize } : {}),
			createdAt: Date.now(),
		});
		return id;
	},
});

/** Compteur de références : un fichier est « vivant » si l'une de ces tables le référence. */
export const refCount = query({
	args: { trackId: v.string() },
	handler: async (ctx, args) => {
		const [saved, album, shared, recent] = await Promise.all([
			ctx.db
				.query("savedTrack")
				.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
				.collect(),
			ctx.db
				.query("albumTrack")
				.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
				.collect(),
			ctx.db
				.query("sharedTrack")
				.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
				.collect(),
			ctx.db
				.query("recentPlay")
				.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
				.collect(),
		]);
		const counts = {
			saved: saved.length,
			album: album.length,
			shared: shared.length,
			recent: recent.length,
		};
		return {
			...counts,
			total: counts.saved + counts.album + counts.shared + counts.recent,
		};
	},
});

/**
 * Partie DB de forceEvictFile : délie les SharedTrack, supprime les lignes
 * StoredTrack du trackId, et renvoie les storagePaths à effacer côté S3.
 */
export const deleteByTrack = mutation({
	args: { trackId: v.string() },
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		const stored = await ctx.db
			.query("storedTrack")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.collect();
		if (stored.length === 0) return [];

		const storedIds = new Set(stored.map((s) => s.id));

		// Délier les SharedTrack pointant vers ces StoredTrack (storedTrackId → null).
		for (const id of storedIds) {
			const shares = await ctx.db
				.query("sharedTrack")
				.withIndex("by_stored", (q) => q.eq("storedTrackId", id))
				.collect();
			for (const s of shares)
				await ctx.db.patch(s._id, { storedTrackId: undefined });
		}

		const paths = stored.map((s) => s.storagePath);
		for (const s of stored) await ctx.db.delete(s._id);
		return paths;
	},
});
