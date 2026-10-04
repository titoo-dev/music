// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

const { PoolCtor } = vi.hoisted(() => ({
	PoolCtor: vi.fn(function (this: { query: unknown }) {
		this.query = vi.fn(async () => ({ rows: [] }));
	}),
}));
vi.mock("pg", () => ({ default: { Pool: PoolCtor }, Pool: PoolCtor }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { Prisma } from "@/generated/prisma/client";
import { createConfigStore } from "./index";
import { PostgresConfigStore } from "./PostgresConfigStore";

beforeEach(() => {
	resetPrismaMock();
	PoolCtor.mockClear();
	vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5432/db");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("createConfigStore", () => {
	it("uses the shared Prisma client: no private pg.Pool, no CREATE TABLE at runtime (was: own pool not attached with attachDatabasePool + DDL on every cold start)", async () => {
		prismaMock.config.findUnique.mockResolvedValue({ value: { maxBitrate: 3 } });
		const store = await createConfigStore();
		await expect(store.get("settings")).resolves.toEqual({ maxBitrate: 3 });
		await store.set("settings", { maxBitrate: 9 });
		expect(PoolCtor).not.toHaveBeenCalled();
		expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
		expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
		expect(prismaMock.config.upsert).toHaveBeenCalledTimes(1);
	});

	it("still requires DATABASE_URL", async () => {
		vi.stubEnv("DATABASE_URL", "");
		await expect(createConfigStore()).rejects.toThrow(/DATABASE_URL is required/);
	});
});

describe("PostgresConfigStore", () => {
	const store = () => new PostgresConfigStore(prismaMock);

	it("reads one key of the default user", async () => {
		prismaMock.config.findUnique.mockResolvedValue({ value: { a: 1 } });
		await expect(store().get("settings")).resolves.toEqual({ a: 1 });
		expect(prismaMock.config.findUnique).toHaveBeenCalledWith({
			where: { userId_key: { userId: "default", key: "settings" } },
			select: { value: true },
		});
	});

	it("reads another user's key when asked", async () => {
		prismaMock.config.findUnique.mockResolvedValue(null);
		await expect(store().get("k", "u1")).resolves.toBeNull();
		expect(prismaMock.config.findUnique.mock.calls[0][0].where).toEqual({ userId_key: { userId: "u1", key: "k" } });
	});

	it("returns null for a stored JSON null", async () => {
		prismaMock.config.findUnique.mockResolvedValue({ value: null });
		await expect(store().get("k")).resolves.toBeNull();
	});

	it("upserts the default user's key and bumps updatedAt", async () => {
		await store().set("settings", { maxBitrate: 9 });
		const args = prismaMock.config.upsert.mock.calls[0][0];
		expect(args.where).toEqual({ userId_key: { userId: "default", key: "settings" } });
		expect(args.create).toEqual({ userId: "default", key: "settings", value: { maxBitrate: 9 } });
		expect(args.update.value).toEqual({ maxBitrate: 9 });
		expect(args.update.updatedAt).toBeInstanceOf(Date);
	});

	it("writes another user's key when asked", async () => {
		await store().set("k", [1, 2], "u1");
		expect(prismaMock.config.upsert.mock.calls[0][0].create).toEqual({ userId: "u1", key: "k", value: [1, 2] });
	});

	it("stores what JSON.stringify would (as the old ::jsonb insert did): dates as strings, undefined fields dropped", async () => {
		const when = new Date("2026-10-04T00:00:00.000Z");
		await store().set("k", { when, gone: undefined, keep: "x" });
		expect(prismaMock.config.upsert.mock.calls[0][0].create.value).toEqual({ when: when.toISOString(), keep: "x" });
	});

	it("stores null as a JSON null", async () => {
		await store().set("k", null);
		expect(prismaMock.config.upsert.mock.calls[0][0].create.value).toBe(Prisma.JsonNull);
	});

	it("refuses a value with no JSON form", async () => {
		await expect(store().set("k", undefined)).rejects.toThrow(TypeError);
		expect(prismaMock.config.upsert).not.toHaveBeenCalled();
	});

	it("init() needs no database round trip (the table comes from the Prisma migrations)", async () => {
		await store().init();
		expect(prismaMock.config.findUnique).not.toHaveBeenCalled();
		expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
	});
});
