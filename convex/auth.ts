// Better Auth DANS Convex (composant @convex-dev/better-auth). Phase 4.
// L'auth live de l'app reste sur Prisma (src/lib/auth.ts) tant que les guards
// n'ont pas basculé — ce module fournit le backend cible déployé/validé.

import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
	betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID ?? "",
				clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			},
		},
		plugins: [convex({ authConfig })],
	});

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => authComponent.safeGetAuthUser(ctx),
});
