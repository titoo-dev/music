// UserPreferences (blob JSON). Unique par userId. Miroir route preferences/* +
// library.ts isPreCacheEnabled.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { newId } from "./lib/util";
import { authComponent } from "./auth";

// ── Variantes auth-aware (client réactif useQuery/useMutation, Phase 5) ──
// Dérivent l'utilisateur du contexte d'auth Convex (pas d'argument userId).

export const getMine = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return null;
		const row = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		return row ? row.preferences : null;
	},
});

export const setMine = mutation({
	args: { preferences: v.any() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		const now = Date.now();
		const row = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, { preferences: args.preferences, updatedAt: now });
		} else {
			await ctx.db.insert("userPreferences", {
				id: newId(),
				userId: user._id,
				preferences: args.preferences,
				createdAt: now,
				updatedAt: now,
			});
		}
		return null;
	},
});

export const get = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		return row ? row.preferences : null;
	},
});

export const set = mutation({
	args: {
		userId: v.string(),
		id: v.optional(v.string()),
		preferences: v.any(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const now = Date.now();
		const row = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		if (row) {
			await ctx.db.patch(row._id, {
				preferences: args.preferences,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("userPreferences", {
				id: args.id ?? newId(),
				userId: args.userId,
				preferences: args.preferences,
				createdAt: now,
				updatedAt: now,
			});
		}
		return null;
	},
});

export const isPreCacheEnabled = query({
	args: { userId: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		const prefs = row?.preferences as Record<string, unknown> | null;
		return prefs?.preCacheSaved === true;
	},
});
