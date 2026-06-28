// Config key/value (plugin Spotify & réglages globaux).
// Remplace PostgresConfigStore (src/lib/deemix/config-store/). PK [userId,key].

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
	args: { userId: v.string(), key: v.string() },
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("config")
			.withIndex("by_user_key", (q) =>
				q.eq("userId", args.userId).eq("key", args.key),
			)
			.unique();
		return row ? row.value : null;
	},
});

export const set = mutation({
	args: { userId: v.string(), key: v.string(), value: v.any() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("config")
			.withIndex("by_user_key", (q) =>
				q.eq("userId", args.userId).eq("key", args.key),
			)
			.unique();
		if (row) {
			await ctx.db.patch(row._id, { value: args.value, updatedAt: Date.now() });
		} else {
			await ctx.db.insert("config", {
				userId: args.userId,
				key: args.key,
				value: args.value,
				updatedAt: Date.now(),
			});
		}
		return null;
	},
});

export const remove = mutation({
	args: { userId: v.string(), key: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("config")
			.withIndex("by_user_key", (q) =>
				q.eq("userId", args.userId).eq("key", args.key),
			)
			.unique();
		if (row) await ctx.db.delete(row._id);
		return null;
	},
});

export const listByUser = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("config")
			.withIndex("by_user_key", (q) => q.eq("userId", args.userId))
			.collect();
	},
});
