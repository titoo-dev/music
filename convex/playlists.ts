// Playlist + PlaylistTrack. Miroir de src/lib/library.ts (addToPlaylist,
// removeFromPlaylist, reorderPlaylist) + CRUD des routes playlists/*.
// Découplé du cycle de vie fichier (aucune éviction S3 ici).

import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

const trackArg = v.object({
	id: v.optional(v.string()),
	trackId: v.string(),
	title: v.string(),
	artist: v.string(),
	album: v.optional(v.union(v.string(), v.null())),
	albumId: v.optional(v.union(v.string(), v.null())),
	coverUrl: v.optional(v.union(v.string(), v.null())),
	duration: v.optional(v.union(v.number(), v.null())),
});

async function touch(ctx: MutationCtx, playlistId: string) {
	const pl = await ctx.db
		.query("playlist")
		.withIndex("by_origin_id", (q) => q.eq("id", playlistId))
		.unique();
	if (pl) await ctx.db.patch(pl._id, { updatedAt: Date.now() });
}

// ── CRUD ──

export const create = mutation({
	args: {
		userId: v.string(),
		id: v.optional(v.string()),
		title: v.string(),
		description: v.optional(v.union(v.string(), v.null())),
		coverUrl: v.optional(v.union(v.string(), v.null())),
		isPublic: v.optional(v.boolean()),
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		const id = args.id ?? newId();
		const now = Date.now();
		await ctx.db.insert("playlist", {
			id,
			userId: args.userId,
			title: args.title,
			...(args.description != null ? { description: args.description } : {}),
			...(args.coverUrl != null ? { coverUrl: args.coverUrl } : {}),
			isPublic: args.isPublic ?? false,
			createdAt: now,
			updatedAt: now,
		});
		return id;
	},
});

export const update = mutation({
	args: {
		playlistId: v.string(),
		title: v.optional(v.string()),
		description: v.optional(v.union(v.string(), v.null())),
		coverUrl: v.optional(v.union(v.string(), v.null())),
		isPublic: v.optional(v.boolean()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const pl = await ctx.db
			.query("playlist")
			.withIndex("by_origin_id", (q) => q.eq("id", args.playlistId))
			.unique();
		if (!pl) return null;
		await ctx.db.patch(pl._id, {
			...(args.title !== undefined ? { title: args.title } : {}),
			...(args.description !== undefined
				? { description: args.description ?? undefined }
				: {}),
			...(args.coverUrl !== undefined
				? { coverUrl: args.coverUrl ?? undefined }
				: {}),
			...(args.isPublic !== undefined ? { isPublic: args.isPublic } : {}),
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const remove = mutation({
	args: { playlistId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const pl = await ctx.db
			.query("playlist")
			.withIndex("by_origin_id", (q) => q.eq("id", args.playlistId))
			.unique();
		if (!pl) return null;
		// Cascade : supprimer les PlaylistTrack.
		const tracks = await ctx.db
			.query("playlistTrack")
			.withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
			.collect();
		for (const t of tracks) await ctx.db.delete(t._id);
		await ctx.db.delete(pl._id);
		return null;
	},
});

export const listByUser = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("playlist")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();
	},
});

export const get = query({
	args: { playlistId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("playlist")
			.withIndex("by_origin_id", (q) => q.eq("id", args.playlistId))
			.unique();
	},
});

/** Playlist appartenant à l'utilisateur (sinon null). */
export const getOwned = query({
	args: { playlistId: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		const pl = await ctx.db
			.query("playlist")
			.withIndex("by_origin_id", (q) => q.eq("id", args.playlistId))
			.unique();
		return pl && pl.userId === args.userId ? pl : null;
	},
});

/** Playlist (ownership) + ses pistes triées par position. */
export const getOwnedWithTracks = query({
	args: { playlistId: v.string(), userId: v.string() },
	handler: async (ctx, args) => {
		const pl = await ctx.db
			.query("playlist")
			.withIndex("by_origin_id", (q) => q.eq("id", args.playlistId))
			.unique();
		if (!pl || pl.userId !== args.userId) return null;
		const tracks = (
			await ctx.db
				.query("playlistTrack")
				.withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
				.collect()
		).sort((a, b) => a.position - b.position);
		return { ...pl, tracks };
	},
});

/** Liste des playlists de l'utilisateur + count + 4 covers + containsTrack. */
export const listWithCovers = query({
	args: { userId: v.string(), trackId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const playlists = (
			await ctx.db
				.query("playlist")
				.withIndex("by_user", (q) => q.eq("userId", args.userId))
				.collect()
		).sort((a, b) => b.updatedAt - a.updatedAt);

		const out: Record<string, unknown>[] = [];
		for (const pl of playlists) {
			const tracks = (
				await ctx.db
					.query("playlistTrack")
					.withIndex("by_playlist", (q) => q.eq("playlistId", pl.id))
					.collect()
			).sort((a, b) => a.position - b.position);
			const covers = tracks
				.map((t) => t.coverUrl)
				.filter((c): c is string => !!c)
				.slice(0, 4);
			const entry: Record<string, unknown> = {
				...pl,
				_count: { tracks: tracks.length },
				covers,
			};
			if (args.trackId) {
				entry.containsTrack = tracks.some((t) => t.trackId === args.trackId);
			}
			out.push(entry);
		}
		return out;
	},
});

export const listTracks = query({
	args: { playlistId: v.string() },
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query("playlistTrack")
			.withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
			.collect();
		return rows.sort((a, b) => a.position - b.position);
	},
});

// ── Track ops (parité library.ts) ──

export const addTracks = mutation({
	args: { playlistId: v.string(), tracks: v.array(trackArg) },
	returns: v.object({ added: v.number() }),
	handler: async (ctx, args) => {
		if (args.tracks.length === 0) return { added: 0 };

		const existing = await ctx.db
			.query("playlistTrack")
			.withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
			.collect();
		let nextPosition =
			existing.reduce((max, t) => Math.max(max, t.position), -1) + 1;
		const present = new Set(existing.map((t) => t.trackId));

		let added = 0;
		for (const t of args.tracks) {
			if (present.has(t.trackId)) continue; // déjà présent
			present.add(t.trackId);
			await ctx.db.insert("playlistTrack", {
				id: t.id ?? newId(),
				playlistId: args.playlistId,
				trackId: t.trackId,
				title: t.title,
				artist: t.artist,
				...(t.album != null ? { album: t.album } : {}),
				...(t.albumId != null ? { albumId: t.albumId } : {}),
				...(t.coverUrl != null ? { coverUrl: t.coverUrl } : {}),
				...(t.duration != null ? { duration: t.duration } : {}),
				position: nextPosition++,
				addedAt: Date.now(),
			});
			added++;
		}
		await touch(ctx, args.playlistId);
		return { added };
	},
});

export const removeTracks = mutation({
	args: { playlistId: v.string(), trackIds: v.array(v.string()) },
	returns: v.object({ removed: v.number() }),
	handler: async (ctx, args) => {
		if (args.trackIds.length === 0) return { removed: 0 };
		const wanted = new Set(args.trackIds);
		const rows = await ctx.db
			.query("playlistTrack")
			.withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
			.collect();
		let removed = 0;
		for (const r of rows) {
			if (wanted.has(r.trackId)) {
				await ctx.db.delete(r._id);
				removed++;
			}
		}
		await touch(ctx, args.playlistId);
		return { removed };
	},
});

export const reorder = mutation({
	args: { playlistId: v.string(), orderedTrackIds: v.array(v.string()) },
	returns: v.object({ reordered: v.number() }),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("playlistTrack")
			.withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
			.collect();

		if (existing.length !== args.orderedTrackIds.length) {
			throw new Error("REORDER_LENGTH_MISMATCH");
		}
		const orderedSet = new Set(args.orderedTrackIds);
		if (orderedSet.size !== args.orderedTrackIds.length) {
			throw new Error("REORDER_DUPLICATE_TRACK");
		}
		const byTrack = new Map(existing.map((t) => [t.trackId, t]));
		for (const id of args.orderedTrackIds) {
			if (!byTrack.has(id)) throw new Error("REORDER_UNKNOWN_TRACK");
		}

		// Mutation = transaction : réécriture atomique des positions.
		for (let position = 0; position < args.orderedTrackIds.length; position++) {
			const row = byTrack.get(args.orderedTrackIds[position])!;
			await ctx.db.patch(row._id, { position });
		}
		await touch(ctx, args.playlistId);
		return { reordered: args.orderedTrackIds.length };
	},
});
