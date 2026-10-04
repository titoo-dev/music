// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { acquirePersistLease, hasActivePersistLease, PERSIST_LEASE_TTL_MS } from "./persist-lease";

const NOW = Date.parse("2026-10-04T10:00:00.000Z");
const unique = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

describe("acquirePersistLease", () => {
	beforeEach(() => resetPrismaMock());

	it("acquires a free lease with one atomic insert that outlives maxDuration", async () => {
		prismaMock.persistLease.create.mockResolvedValue({});
		const r = await acquirePersistLease("1", 3, { now: NOW, holder: "h1" });
		expect(r.acquired).toBe(true);
		expect(prismaMock.persistLease.create).toHaveBeenCalledWith({
			data: { trackId: "1", bitrate: 3, holder: "h1", expiresAt: new Date(NOW + PERSIST_LEASE_TTL_MS) },
		});
		expect(PERSIST_LEASE_TTL_MS).toBeGreaterThan(300_000);
		expect(prismaMock.persistLease.updateMany).not.toHaveBeenCalled();
	});

	it("is refused while another instance holds an unexpired lease (was: both instances downloaded and uploaded the track)", async () => {
		prismaMock.persistLease.create.mockRejectedValue(unique);
		prismaMock.persistLease.updateMany.mockResolvedValue({ count: 0 });
		const r = await acquirePersistLease("1", 3, { now: NOW });
		expect(r.acquired).toBe(false);
	});

	it("takes over an expired lease with a conditional update", async () => {
		prismaMock.persistLease.create.mockRejectedValue(unique);
		prismaMock.persistLease.updateMany.mockResolvedValue({ count: 1 });
		const r = await acquirePersistLease("1", 3, { now: NOW, holder: "h2" });
		expect(r.acquired).toBe(true);
		expect(prismaMock.persistLease.updateMany).toHaveBeenCalledWith({
			where: { trackId: "1", bitrate: 3, expiresAt: { lt: new Date(NOW) } },
			data: { holder: "h2", expiresAt: new Date(NOW + PERSIST_LEASE_TTL_MS), createdAt: new Date(NOW) },
		});
	});

	it("rethrows database failures other than the unique violation", async () => {
		prismaMock.persistLease.create.mockRejectedValue(new Error("db down"));
		await expect(acquirePersistLease("1", 3)).rejects.toThrow("db down");
	});

	it("releases only its own lease and never throws", async () => {
		prismaMock.persistLease.create.mockResolvedValue({});
		const r = await acquirePersistLease("1", 3, { holder: "h1" });
		if (!r.acquired) throw new Error("expected a lease");
		await r.lease.release();
		expect(prismaMock.persistLease.deleteMany).toHaveBeenCalledWith({ where: { trackId: "1", bitrate: 3, holder: "h1" } });

		prismaMock.persistLease.deleteMany.mockRejectedValue(new Error("db down"));
		await expect(r.lease.release()).resolves.toBeUndefined();
	});

	it("generates a holder id when none is given", async () => {
		prismaMock.persistLease.create.mockResolvedValue({});
		const r = await acquirePersistLease("1", 3);
		expect(r.acquired && r.lease.holder).toMatch(/^[0-9a-f-]{36}$/);
	});
});

describe("hasActivePersistLease", () => {
	beforeEach(() => resetPrismaMock());

	it("counts unexpired leases of the track", async () => {
		prismaMock.persistLease.count.mockResolvedValue(1);
		await expect(hasActivePersistLease("1", NOW)).resolves.toBe(true);
		expect(prismaMock.persistLease.count).toHaveBeenCalledWith({ where: { trackId: "1", expiresAt: { gt: new Date(NOW) } } });
		prismaMock.persistLease.count.mockResolvedValue(0);
		await expect(hasActivePersistLease("1", NOW)).resolves.toBe(false);
	});
});
