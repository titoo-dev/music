// Client Convex côté serveur (routes /api/v1, server components, server actions).
//
// INERTE en Phase 0 : aucun appelant tant que le seam repository n'est pas
// basculé (Phase 3) et que `npx convex dev` n'a pas généré `convex/_generated`.
// On expose volontairement un ConvexHttpClient brut (générique) pour ne PAS
// dépendre de `_generated/api` avant qu'il existe.
//
// Voir docs/CONVEX_MIGRATION.md §2 et §10.

import { ConvexHttpClient } from "convex/browser";

let _client: ConvexHttpClient | null = null;

/**
 * ConvexHttpClient stateless partagé. Nécessite NEXT_PUBLIC_CONVEX_URL
 * (posé par `npx convex dev`). Lève si l'URL n'est pas configurée — appelé
 * uniquement quand DATA_BACKEND ≠ "prisma".
 */
export function getConvexClient(): ConvexHttpClient {
	if (_client) return _client;
	const url = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!url) {
		throw new Error(
			"NEXT_PUBLIC_CONVEX_URL is not set — lancez `npx convex dev` (voir docs/CONVEX_MIGRATION.md).",
		);
	}
	_client = new ConvexHttpClient(url);
	return _client;
}
