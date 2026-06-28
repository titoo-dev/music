// StemSeparation + StemFile — jobs IA Demucs. Miroir de stems-worker/src/db.ts
// (raw pg) + routes stems/*. Le worker BullMQ appellera ces fonctions via
// ConvexHttpClient (Phase 3). Cascade separation→files manuelle.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

export const getByTrack = query({
	args: { trackId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("stemSeparation")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.unique();
	},
});

export const listFiles = query({
	args: { trackId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("stemFile")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.collect();
	},
});

/** Crée/réinitialise la ligne de séparation (upsert par trackId). */
export const upsertSeparation = mutation({
	args: {
		trackId: v.string(),
		id: v.optional(v.string()),
		mode: v.string(),
		status: v.optional(v.string()),
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		const now = Date.now();
		const row = await ctx.db
			.query("stemSeparation")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, {
				mode: args.mode,
				status: args.status ?? "pending",
				progress: 0,
				errorMessage: undefined,
				startedAt: undefined,
				completedAt: undefined,
				updatedAt: now,
			});
			return row.id;
		}
		const id = args.id ?? newId();
		await ctx.db.insert("stemSeparation", {
			id,
			trackId: args.trackId,
			status: args.status ?? "pending",
			mode: args.mode,
			progress: 0,
			createdAt: now,
			updatedAt: now,
		});
		return id;
	},
});

export const markProcessing = mutation({
	args: { trackId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("stemSeparation")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, {
				status: "processing",
				progress: 0,
				startedAt: Date.now(),
				updatedAt: Date.now(),
				errorMessage: undefined,
			});
		}
		return null;
	},
});

export const updateProgress = mutation({
	args: { trackId: v.string(), progress: v.number() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const clamped = Math.max(0, Math.min(100, Math.round(args.progress)));
		const row = await ctx.db
			.query("stemSeparation")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, { progress: clamped, updatedAt: Date.now() });
		}
		return null;
	},
});

export const markCompleted = mutation({
	args: { trackId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("stemSeparation")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, {
				status: "completed",
				progress: 100,
				completedAt: Date.now(),
				updatedAt: Date.now(),
			});
		}
		return null;
	},
});

export const markFailed = mutation({
	args: { trackId: v.string(), errorMessage: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("stemSeparation")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, {
				status: "failed",
				errorMessage: args.errorMessage.slice(0, 1000),
				updatedAt: Date.now(),
			});
		}
		return null;
	},
});

export const insertStemFile = mutation({
	args: {
		separationId: v.string(),
		trackId: v.string(),
		stemName: v.string(),
		id: v.optional(v.string()),
		storagePath: v.string(),
		storageType: v.string(),
		fileSize: v.optional(v.union(v.number(), v.null())),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("stemFile")
			.withIndex("by_track_stem", (q) =>
				q.eq("trackId", args.trackId).eq("stemName", args.stemName),
			)
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				storagePath: args.storagePath,
				storageType: args.storageType,
				fileSize: args.fileSize ?? undefined,
			});
			return null;
		}
		await ctx.db.insert("stemFile", {
			id: args.id ?? newId(),
			separationId: args.separationId,
			trackId: args.trackId,
			stemName: args.stemName,
			storagePath: args.storagePath,
			storageType: args.storageType,
			...(args.fileSize != null ? { fileSize: args.fileSize } : {}),
			createdAt: Date.now(),
		});
		return null;
	},
});

export const deleteFileByStem = mutation({
	args: { trackId: v.string(), stemName: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const f = await ctx.db
			.query("stemFile")
			.withIndex("by_track_stem", (q) =>
				q.eq("trackId", args.trackId).eq("stemName", args.stemName),
			)
			.unique();
		if (f) await ctx.db.delete(f._id);
		return null;
	},
});

export const deleteStemFiles = mutation({
	args: { trackId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const files = await ctx.db
			.query("stemFile")
			.withIndex("by_track", (q) => q.eq("trackId", args.trackId))
			.collect();
		for (const f of files) await ctx.db.delete(f._id);
		return null;
	},
});
