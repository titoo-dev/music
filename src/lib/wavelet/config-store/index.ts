export type { ConfigStore } from "./ConfigStore";
export { PostgresConfigStore } from "./PostgresConfigStore";

import type { ConfigStore } from "./ConfigStore";
import { PostgresConfigStore } from "./PostgresConfigStore";

export async function createConfigStore(): Promise<ConfigStore> {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error(
			"DATABASE_URL is required. PostgreSQL is needed for config storage."
		);
	}
	const store = new PostgresConfigStore(databaseUrl);
	await store.init();
	return store;
}
