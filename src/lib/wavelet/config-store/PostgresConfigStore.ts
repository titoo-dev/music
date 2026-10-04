import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { ConfigStore } from "./ConfigStore";

/** The part of the Prisma client the store uses (model Config, table "config"). */
export type ConfigStoreClient = Pick<PrismaClient, "config">;

/**
 * Key/value config in the "config" table, through the shared Prisma client:
 * one pg pool for the whole app (attached with attachDatabasePool in
 * src/lib/prisma.ts) and a schema owned by the Prisma migrations, so no DDL
 * runs at request time. Keys belong to `userId`, "default" for server-wide
 * values.
 */
export class PostgresConfigStore implements ConfigStore {
	constructor(private readonly db: ConfigStoreClient) {}

	/** Nothing to prepare: the table comes from the Prisma migrations (0_init). */
	async init(): Promise<void> {}

	async get<T = unknown>(key: string, userId = "default"): Promise<T | null> {
		const row = await this.db.config.findUnique({
			where: { userId_key: { userId, key } },
			select: { value: true },
		});
		return (row?.value ?? null) as T | null;
	}

	async set(key: string, value: unknown, userId = "default"): Promise<void> {
		const json = toJsonInput(value);
		await this.db.config.upsert({
			where: { userId_key: { userId, key } },
			create: { userId, key, value: json },
			update: { value: json, updatedAt: new Date() },
		});
	}
}

/**
 * The JSON the old `$3::jsonb` insert of JSON.stringify(value) stored: dates
 * as strings, undefined fields dropped, null as a JSON null. A value with no
 * JSON form (undefined, a function) is refused, as the NOT NULL column did.
 */
function toJsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
	const serialized = JSON.stringify(value);
	if (serialized === undefined) {
		throw new TypeError("ConfigStore.set: the value has no JSON representation");
	}
	const parsed = JSON.parse(serialized) as Prisma.InputJsonValue | null;
	return parsed === null ? Prisma.JsonNull : parsed;
}
