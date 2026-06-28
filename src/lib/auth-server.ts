// Helpers serveur Convex Better Auth (Next.js). Utilisés UNIQUEMENT quand
// AUTH_BACKEND=convex (import dynamique depuis les guards + la route proxy), donc
// jamais chargés en mode prisma par défaut. Voir docs/PHASE4_AUTH_CUTOVER.md.

import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
	handler,
	getToken,
	isAuthenticated,
	preloadAuthQuery,
	fetchAuthQuery,
	fetchAuthMutation,
	fetchAuthAction,
} = convexBetterAuthNextJs({
	convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
	convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "",
});
