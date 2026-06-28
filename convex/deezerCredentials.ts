// DeezerCredential — ARL + profil Deezer. Unique par userId.
// Miroir routes auth/connect, auth/login-arl + helpers requireDeezer.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

export const get = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("deezerCredential")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
	},
});

export const upsert = mutation({
	args: {
		userId: v.string(),
		id: v.optional(v.string()),
		arl: v.string(),
		deezerUserId: v.optional(v.union(v.number(), v.null())),
		deezerUserName: v.optional(v.union(v.string(), v.null())),
		deezerPicture: v.optional(v.union(v.string(), v.null())),
		canStreamHq: v.optional(v.boolean()),
		canStreamLossless: v.optional(v.boolean()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const now = Date.now();
		const fields = {
			arl: args.arl,
			...(args.deezerUserId != null ? { deezerUserId: args.deezerUserId } : {}),
			...(args.deezerUserName != null
				? { deezerUserName: args.deezerUserName }
				: {}),
			...(args.deezerPicture != null
				? { deezerPicture: args.deezerPicture }
				: {}),
			canStreamHq: args.canStreamHq ?? false,
			canStreamLossless: args.canStreamLossless ?? false,
		};
		const row = await ctx.db
			.query("deezerCredential")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, { ...fields, updatedAt: now });
		} else {
			await ctx.db.insert("deezerCredential", {
				id: args.id ?? newId(),
				userId: args.userId,
				...fields,
				createdAt: now,
				updatedAt: now,
			});
		}
		return null;
	},
});

export const remove = mutation({
	args: { userId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("deezerCredential")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		if (row) await ctx.db.delete(row._id);
		return null;
	},
});
