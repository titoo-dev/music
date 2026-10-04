// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { planKeyRepair, repairSharedKeys, type KeyRow } from "./key-repair";

const rows: KeyRow[] = [
	// Two versions of a song written under the same template key.
	{ id: "a", trackId: "100", bitrate: 1, storagePath: "music/Artist - Song.mp3" },
	{ id: "b", trackId: "200", bitrate: 1, storagePath: "music/Artist - Song.mp3" },
	// 128 and 320 of one track overwrote each other.
	{ id: "c", trackId: "300", bitrate: 1, storagePath: "music/Other - Tune.mp3" },
	{ id: "d", trackId: "300", bitrate: 3, storagePath: "music/Other - Tune.mp3" },
	// Unique keys are left alone.
	{ id: "e", trackId: "400", bitrate: 3, storagePath: "tracks/400/3.mp3" },
	{ id: "f", trackId: "500", bitrate: 1, storagePath: "music/Solo.mp3" },
];

describe("planKeyRepair", () => {
	it("flags every row whose object is shared with another row (was: one StoredTrack could serve another track's audio)", () => {
		const plan = planKeyRepair(rows);
		expect(plan.crossTrackPaths).toEqual(["music/Artist - Song.mp3"]);
		expect(plan.sameTrackPaths).toEqual(["music/Other - Tune.mp3"]);
		expect(plan.rowIds.sort()).toEqual(["a", "b", "c", "d"]);
	});

	it("plans nothing when every key is unique", () => {
		expect(planKeyRepair(rows.slice(4)).rowIds).toEqual([]);
	});
});

describe("repairSharedKeys", () => {
	beforeEach(() => {
		resetPrismaMock();
		prismaMock.storedTrack.findMany.mockResolvedValue(rows);
		prismaMock.storedTrack.deleteMany.mockResolvedValue({ count: 4 });
	});

	it("is a dry run unless asked to apply", async () => {
		const r = await repairSharedKeys({ apply: false });
		expect(r).toMatchObject({ scanned: 6, deleted: 0 });
		expect(prismaMock.storedTrack.deleteMany).not.toHaveBeenCalled();
	});

	it("deletes the rows (never the objects) when applied", async () => {
		const r = await repairSharedKeys({ apply: true });
		expect(r.deleted).toBe(4);
		expect(prismaMock.storedTrack.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["a", "b", "c", "d"] } } });
	});
});
