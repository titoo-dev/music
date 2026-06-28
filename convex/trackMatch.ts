// TrackMatch — cache de correspondance externe (Spotify) → Deezer.
// Unique [source, sourceId]. `deezerTrackId` null = cache négatif.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

export const get = query({
	args: { source: v.string(), sourceId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("trackMatch")
			.withIndex("by_source", (q) =>
				q.eq("source", args.source).eq("sourceId", args.sourceId),
			)
			.unique();
	},
});

export const upsert = mutation({
	args: {
		source: v.string(),
		sourceId: v.string(),
		id: v.optional(v.string()),
		isrc: v.optional(v.union(v.string(), v.null())),
		deezerTrackId: v.optional(v.union(v.string(), v.null())),
		strategy: v.optional(v.union(v.string(), v.null())),
		confidence: v.optional(v.union(v.number(), v.null())),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const fields = {
			...(args.isrc != null ? { isrc: args.isrc } : {}),
			...(args.deezerTrackId != null
				? { deezerTrackId: args.deezerTrackId }
				: {}),
			...(args.strategy != null ? { strategy: args.strategy } : {}),
			...(args.confidence != null ? { confidence: args.confidence } : {}),
		};
		const row = await ctx.db
			.query("trackMatch")
			.withIndex("by_source", (q) =>
				q.eq("source", args.source).eq("sourceId", args.sourceId),
			)
			.unique();
		if (row) {
			await ctx.db.patch(row._id, { ...fields, resolvedAt: Date.now() });
		} else {
			await ctx.db.insert("trackMatch", {
				id: args.id ?? newId(),
				source: args.source,
				sourceId: args.sourceId,
				...fields,
				resolvedAt: Date.now(),
			});
		}
		return null;
	},
});
