// Implémentation Convex de ConfigStore (cible de la migration).
// Appelle les fonctions convex/config.* via ConvexHttpClient (côté serveur).
// Le client est injectable pour les tests. Voir docs/CONVEX_MIGRATION.md Phase 3.

import type { ConfigStore } from "./ConfigStore";
import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

type ConvexClient = {
	query: (ref: unknown, args: unknown) => Promise<unknown>;
	mutation: (ref: unknown, args: unknown) => Promise<unknown>;
};

export class ConvexConfigStore implements ConfigStore {
	private client: ConvexClient;

	constructor(client?: ConvexClient) {
		this.client = client ?? (getConvexClient() as unknown as ConvexClient);
	}

	// Le schéma Convex est géré par le déploiement — rien à initialiser.
	async init(): Promise<void> {}

	async get<T = unknown>(key: string, userId = "default"): Promise<T | null> {
		const value = await this.client.query(api.config.get, { userId, key });
		return (value ?? null) as T | null;
	}

	async set(key: string, value: unknown, userId = "default"): Promise<void> {
		await this.client.mutation(api.config.set, { userId, key, value });
	}
}
