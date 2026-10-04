// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/server-state", () => ({ getWaveletApp: vi.fn(async () => null) }));

import { collectStorageGarbage, GC_MIN_AGE_MS } from "./gc";

const NOW = Date.parse("2026-10-04T04:00:00.000Z");
const OLD = new Date(NOW - GC_MIN_AGE_MS - 1000);
const FRESH = new Date(NOW - 1000);

function refs(total: number) {
	prismaMock.savedTrack.count.mockResolvedValue(total);
	prismaMock.albumTrack.count.mockResolvedValue(0);
	prismaMock.sharedTrack.count.mockResolvedValue(0);
	prismaMock.recentPlay.count.mockResolvedValue(0);
}

const emptyBucket = vi.fn(async () => ({ objects: [] }));

describe("collectStorageGarbage", () => {
	beforeEach(() => {
		resetPrismaMock();
		emptyBucket.mockClear();
		refs(0);
		prismaMock.persistLease.count.mockResolvedValue(0);
		prismaMock.storedTrack.deleteMany.mockResolvedValue({ count: 1 });
		prismaMock.storedTrack.count.mockResolvedValue(0);
		prismaMock.storedTrack.findMany.mockResolvedValue([]);
	});

	it("deletes unreferenced rows older than 24 h and their objects (was: a skip during a persist left an orphan forever)", async () => {
		prismaMock.$queryRaw.mockResolvedValue([{ id: "r1", trackId: "t1", storagePath: "tracks/t1/1.mp3" }]);
		const deleteObject = vi.fn(async () => {});

		const report = await collectStorageGarbage({ deleteObject, now: NOW, listPage: emptyBucket });
		expect(report).toMatchObject({ rowsDeleted: 1, objectsDeleted: 1 });
		expect(prismaMock.storedTrack.deleteMany).toHaveBeenCalledWith({
			where: { id: { in: ["r1"] }, createdAt: { lt: new Date(NOW - GC_MIN_AGE_MS) } },
		});
		expect(deleteObject).toHaveBeenCalledWith("tracks/t1/1.mp3");
		// The SQL filters on age and on the four reference tables.
		const sql = (prismaMock.$queryRaw.mock.calls[0][0] as TemplateStringsArray).join("?");
		expect(sql).toContain(`"createdAt" < ?`);
		for (const table of ["saved_track", "album_track", "shared_track", "recent_play"]) expect(sql).toContain(table);
	});

	it("re-checks references and leases right before deleting", async () => {
		prismaMock.$queryRaw.mockResolvedValue([
			{ id: "r1", trackId: "saved-meanwhile", storagePath: "tracks/a/1.mp3" },
			{ id: "r2", trackId: "persisting", storagePath: "tracks/b/1.mp3" },
		]);
		prismaMock.savedTrack.count.mockImplementation((async (args: { where: { trackId: string } }) =>
			args.where.trackId === "saved-meanwhile" ? 1 : 0) as never);
		prismaMock.persistLease.count.mockResolvedValue(1);
		const deleteObject = vi.fn(async () => {});

		const report = await collectStorageGarbage({ deleteObject, now: NOW, listPage: emptyBucket });
		expect(report.rowsDeleted).toBe(0);
		expect(prismaMock.storedTrack.deleteMany).not.toHaveBeenCalled();
		expect(deleteObject).not.toHaveBeenCalled();
	});

	it("keeps an object another row still points at", async () => {
		prismaMock.$queryRaw.mockResolvedValue([{ id: "r1", trackId: "t1", storagePath: "music/A - T.mp3" }]);
		prismaMock.storedTrack.count.mockResolvedValue(1);
		const deleteObject = vi.fn(async () => {});

		const report = await collectStorageGarbage({ deleteObject, now: NOW, listPage: emptyBucket });
		expect(report).toMatchObject({ rowsDeleted: 1, objectsDeleted: 0 });
		expect(deleteObject).not.toHaveBeenCalled();
	});

	it("deletes objects under tracks/ older than 24 h that no row points at, across pages", async () => {
		prismaMock.$queryRaw.mockResolvedValue([]);
		const listPage = vi
			.fn()
			.mockResolvedValueOnce({
				objects: [
					{ key: "tracks/1/1.mp3", lastModified: OLD, size: 1 },
					{ key: "tracks/2/1.mp3", lastModified: OLD, size: 1 },
					{ key: "tracks/3/1.mp3", lastModified: FRESH, size: 1 },
				],
				nextToken: "p2",
			})
			.mockResolvedValueOnce({ objects: [{ key: "tracks/4/9.flac", lastModified: OLD, size: 1 }] });
		prismaMock.storedTrack.findMany.mockResolvedValueOnce([{ storagePath: "tracks/2/1.mp3" }]).mockResolvedValueOnce([]);
		const deleteObject = vi.fn(async () => {});

		const report = await collectStorageGarbage({ deleteObject, now: NOW, listPage });
		expect(listPage).toHaveBeenNthCalledWith(1, "tracks/", undefined);
		expect(listPage).toHaveBeenNthCalledWith(2, "tracks/", "p2");
		expect(deleteObject.mock.calls.map((c) => (c as unknown[])[0])).toEqual(["tracks/1/1.mp3", "tracks/4/9.flac"]);
		expect(report).toMatchObject({ objectsScanned: 4, orphanObjectsDeleted: 2 });
	});

	it("stops after maxListPages", async () => {
		prismaMock.$queryRaw.mockResolvedValue([]);
		const listPage = vi.fn(async () => ({ objects: [], nextToken: "more" }));
		await collectStorageGarbage({ deleteObject: vi.fn(), now: NOW, listPage, maxListPages: 3 });
		expect(listPage).toHaveBeenCalledTimes(3);
	});
});
