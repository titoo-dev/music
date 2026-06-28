export type { ConfigStore } from "./ConfigStore";
export { ConvexConfigStore } from "./ConvexConfigStore";

import type { ConfigStore } from "./ConfigStore";
import { ConvexConfigStore } from "./ConvexConfigStore";

// Convex est le seul backend (Postgres supprimé, Phase 6).
export async function createConfigStore(): Promise<ConfigStore> {
	const store = new ConvexConfigStore();
	await store.init();
	return store;
}
