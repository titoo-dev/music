// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

const { serverStateMock } = vi.hoisted(() => ({
	serverStateMock: { getWaveletApp: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/server-state", () => serverStateMock);

import {
	qualityRank,
	capByLicence,
	licenceFromDeezerUser,
	chooseCachedCopy,
	findCachedCopy,
	loadStreamLicence,
	resolveCacheQuery,
	type CachedRow,
} from "./cached-copy";

const MISC = 8;
const MP3_128 = 1;
const MP3_320 = 3;
const FLAC = 9;
const FREE = { canStreamHq: false, canStreamLossless: false };
const HQ = { canStreamHq: true, canStreamLossless: false };
const HIFI = { canStreamHq: true, canStreamLossless: true };

function row(bitrate: number, extra: Partial<CachedRow> = {}): CachedRow {
	return {
		id: `r${bitrate}`,
		trackId: "1",
		bitrate,
		storagePath: `tracks/1/${bitrate}.mp3`,
		storageType: "r2",
		requestedBitrate: bitrate,
		...extra,
	};
}

describe("qualityRank", () => {
	it("ranks MP3_MISC below MP3_128 (was: orderBy bitrate desc put MP3_MISC=8 above MP3_320=3)", () => {
		expect(qualityRank(MISC)).toBeLessThan(qualityRank(MP3_128));
		expect(qualityRank(MP3_128)).toBeLessThan(qualityRank(MP3_320));
		expect(qualityRank(MP3_320)).toBeLessThan(qualityRank(FLAC));
		expect(qualityRank(0)).toBe(qualityRank(MISC));
	});

	it("ranks unknown values lowest and 360 formats above FLAC", () => {
		expect(qualityRank(null)).toBe(0);
		expect(qualityRank(42)).toBe(0);
		expect(qualityRank(13)).toBeGreaterThan(qualityRank(FLAC));
		expect(qualityRank(15)).toBeGreaterThan(qualityRank(13));
	});
});

describe("capByLicence", () => {
	it("caps FLAC by the account's licence", () => {
		expect(capByLicence(FLAC, HIFI)).toBe(FLAC);
		expect(capByLicence(FLAC, HQ)).toBe(MP3_320);
		expect(capByLicence(FLAC, FREE)).toBe(MP3_128);
		expect(capByLicence(15, HQ)).toBe(MP3_320);
	});

	it("caps MP3_320 to MP3_128 without HQ and leaves lower settings alone", () => {
		expect(capByLicence(MP3_320, FREE)).toBe(MP3_128);
		expect(capByLicence(MP3_320, HQ)).toBe(MP3_320);
		expect(capByLicence(MP3_128, FREE)).toBe(MP3_128);
	});

	it("does not cap when the licence is unknown", () => {
		expect(capByLicence(FLAC, null)).toBe(FLAC);
	});
});

describe("licenceFromDeezerUser", () => {
	it("reads can_stream_hq / can_stream_lossless", () => {
		expect(licenceFromDeezerUser({ can_stream_hq: true, can_stream_lossless: false })).toEqual(HQ);
		expect(licenceFromDeezerUser({})).toEqual(FREE);
		expect(licenceFromDeezerUser(undefined)).toBeNull();
	});
});

describe("chooseCachedCopy", () => {
	it("prefers MP3_320 over MP3_MISC (was: the MISC copy won because 8 > 3)", () => {
		const d = chooseCachedCopy([row(MISC), row(MP3_320)], { maxBitrate: MP3_320, licence: HQ });
		expect(d).toMatchObject({ kind: "hit", row: { bitrate: MP3_320 } });
	});

	it("never serves a copy above the server cap", () => {
		const d = chooseCachedCopy([row(FLAC), row(MP3_128)], { maxBitrate: MP3_320, licence: FREE });
		expect(d).toMatchObject({ kind: "hit", row: { bitrate: MP3_128 } });
	});

	it("is a miss when only a copy above the cap exists, flagged aboveCap", () => {
		const d = chooseCachedCopy([row(FLAC)], { maxBitrate: MP3_128, licence: FREE });
		expect(d).toMatchObject({ kind: "miss", aboveCap: true });
		// A copy in older storage above the cap is unreadable, not above the cap.
		expect(chooseCachedCopy([row(FLAC, { storageType: "blob" })], { maxBitrate: MP3_128, licence: FREE })).toMatchObject({
			kind: "miss",
			aboveCap: false,
		});
	});

	it("asks for an upgrade when the best copy is below what the listener may get (was: an HQ listener got the free account's 128 copy forever)", () => {
		const d = chooseCachedCopy([row(MP3_128)], { maxBitrate: MP3_320, licence: HQ });
		expect(d).toMatchObject({ kind: "upgrade", best: { bitrate: MP3_128 } });
	});

	it("serves a lower copy that was persisted for the same request (Deezer had nothing better)", () => {
		const d = chooseCachedCopy([row(MP3_128, { requestedBitrate: MP3_320 })], { maxBitrate: MP3_320, licence: HQ });
		expect(d).toMatchObject({ kind: "hit", row: { bitrate: MP3_128 } });
	});

	it("treats a legacy row (requestedBitrate null) as its own bitrate", () => {
		expect(chooseCachedCopy([row(MP3_128, { requestedBitrate: null })], { maxBitrate: MP3_320, licence: HQ }).kind).toBe("upgrade");
		expect(chooseCachedCopy([row(MP3_128, { requestedBitrate: null })], { maxBitrate: MP3_320, licence: FREE }).kind).toBe("hit");
	});

	it("serves the best copy without upgrades when the listener has no licence (public shares)", () => {
		const d = chooseCachedCopy([row(MP3_128)], { maxBitrate: FLAC, licence: null, upgrade: false });
		expect(d).toMatchObject({ kind: "hit", row: { bitrate: MP3_128 } });
	});

	it("serves the best copy when the licence is unknown", () => {
		expect(chooseCachedCopy([row(MP3_128)], { maxBitrate: FLAC, licence: null }).kind).toBe("hit");
	});

	it("has no cap when the server quality is unknown", () => {
		const d = chooseCachedCopy([row(MP3_128), row(FLAC)], { maxBitrate: null, licence: HIFI });
		expect(d).toMatchObject({ kind: "hit", row: { bitrate: FLAC } });
	});

	it("does not cap when the server setting is not a known format", () => {
		const d = chooseCachedCopy([row(MISC), row(MP3_320)], { maxBitrate: 320, licence: HQ });
		expect(d).toMatchObject({ kind: "hit", row: { bitrate: MP3_320 } });
	});

	it("reports rows from older storage as stale and never serves them", () => {
		const legacy = row(MP3_320, { storageType: "blob" });
		const d = chooseCachedCopy([legacy, row(MP3_128)], { maxBitrate: MP3_320, licence: FREE });
		expect(d).toMatchObject({ kind: "hit", row: { bitrate: MP3_128 }, stale: [legacy] });
		expect(chooseCachedCopy([legacy], { maxBitrate: MP3_320, licence: FREE })).toMatchObject({ kind: "miss", stale: [legacy] });
	});

	it("is a miss without rows", () => {
		expect(chooseCachedCopy([], { maxBitrate: MP3_128, licence: FREE })).toEqual({ kind: "miss", stale: [], aboveCap: false });
	});
});

describe("findCachedCopy", () => {
	beforeEach(() => resetPrismaMock());

	it("reads every row of the track and applies the rank rules", async () => {
		prismaMock.storedTrack.findMany.mockResolvedValue([row(MISC), row(MP3_320)]);
		const d = await findCachedCopy("1", { maxBitrate: MP3_320, licence: HQ });
		expect(prismaMock.storedTrack.findMany).toHaveBeenCalledWith({ where: { trackId: "1" } });
		expect(d).toMatchObject({ kind: "hit", row: { bitrate: MP3_320 } });
	});

	it("treats a missing answer as no rows", async () => {
		prismaMock.storedTrack.findMany.mockResolvedValue(undefined);
		expect((await findCachedCopy("1", { maxBitrate: MP3_128, licence: null })).kind).toBe("miss");
	});
});

describe("loadStreamLicence / resolveCacheQuery", () => {
	beforeEach(() => {
		resetPrismaMock();
		serverStateMock.getWaveletApp.mockReset();
	});

	it("reads the licence columns of the user's Deezer credential", async () => {
		prismaMock.deezerCredential.findUnique.mockResolvedValue(HQ);
		await expect(loadStreamLicence("u1")).resolves.toEqual(HQ);
		expect(prismaMock.deezerCredential.findUnique).toHaveBeenCalledWith({
			where: { userId: "u1" },
			select: { canStreamHq: true, canStreamLossless: true },
		});
	});

	it("returns null without a credential or when the lookup fails", async () => {
		prismaMock.deezerCredential.findUnique.mockResolvedValue(null);
		await expect(loadStreamLicence("u1")).resolves.toBeNull();
		prismaMock.deezerCredential.findUnique.mockRejectedValue(new Error("db"));
		await expect(loadStreamLicence("u1")).resolves.toBeNull();
	});

	it("combines the server quality with the user's licence", async () => {
		serverStateMock.getWaveletApp.mockResolvedValue({ freshSettings: vi.fn(async () => ({ maxBitrate: FLAC })) });
		prismaMock.deezerCredential.findUnique.mockResolvedValue(FREE);
		await expect(resolveCacheQuery("u1")).resolves.toEqual({ maxBitrate: FLAC, licence: FREE });
	});

	it("has no server cap when the app is unavailable", async () => {
		serverStateMock.getWaveletApp.mockResolvedValue(null);
		prismaMock.deezerCredential.findUnique.mockResolvedValue(null);
		await expect(resolveCacheQuery("u1")).resolves.toEqual({ maxBitrate: null, licence: null });
		serverStateMock.getWaveletApp.mockRejectedValue(new Error("init"));
		await expect(resolveCacheQuery("u1")).resolves.toEqual({ maxBitrate: null, licence: null });
	});
});
