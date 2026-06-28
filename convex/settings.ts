// UserSettings (blob JSON). Unique par userId. Miroir route settings/*.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";

export const get = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("userSettings")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		return row ? row.settings : null;
	},
});

export const set = mutation({
	args: { userId: v.string(), id: v.optional(v.string()), settings: v.any() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const now = Date.now();
		const row = await ctx.db
			.query("userSettings")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, { settings: args.settings, updatedAt: now });
		} else {
			await ctx.db.insert("userSettings", {
				id: args.id ?? newId(),
				userId: args.userId,
				settings: args.settings,
				createdAt: now,
				updatedAt: now,
			});
		}
		return null;
	},
});
