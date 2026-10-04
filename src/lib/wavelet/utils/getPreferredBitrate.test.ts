// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { Deezer } from "@/lib/deezer";
import type Track from "../types/Track";
import { getPreferredBitrate } from "./getPreferredBitrate";
import { DeezerError, DeezerNetworkError, WrongGeolocation, WrongLicense } from "@/lib/deezer/errors";
import { PreferredBitrateNotFound } from "../errors";

const FLAC = 9;
const MP3_320 = 3;
const MP3_128 = 1;

type Outcome = string | null | Error;
type Resolver = (token: string, format: string, call: number) => Outcome;

let uid = 0;

function fakeTrack(over: Record<string, unknown> = {}) {
	return {
		id: 1,
		title: "Song",
		mainArtist: { name: "Artist" },
		MD5: "abcdef",
		mediaVersion: 1,
		trackToken: `tok-${++uid}`,
		fallbackID: 0,
		local: false,
		filesizes: { flac: "100", mp3_320: "80", mp3_128: "40" } as Record<string, string>,
		urls: {} as Record<string, string>,
		checkAndRenewTrackToken: vi.fn(async () => {}),
		parseEssentialData: vi.fn(),
		...over,
	} as unknown as Track & { urls: Record<string, string>; parseEssentialData: Mock };
}

interface FakeDz {
	currentUser: { can_stream_hq: boolean; can_stream_lossless: boolean; country: string };
	gw: { get_track_with_fallback: Mock };
	get_track_url: Mock;
}

function fakeDz(resolve: Resolver, user = { can_stream_hq: true, can_stream_lossless: true, country: "FR" }) {
	const counts: Record<string, number> = {};
	return {
		currentUser: user,
		gw: { get_track_with_fallback: vi.fn() },
		get_track_url: vi.fn(async (token: string, format: string) => {
			const key = `${token}:${format}`;
			counts[key] = (counts[key] ?? 0) + 1;
			const r = resolve(token, format, counts[key]);
			if (r instanceof Error) throw r;
			return r;
		}),
	} satisfies FakeDz as unknown as FakeDz & Deezer;
}

/** Outcomes per format; arrays are consumed call by call (last one repeats). */
function byFormat(map: Record<string, Outcome | Outcome[]>): Resolver {
	return (_token, format, call) => {
		const v = map[format];
		if (v === undefined) return null;
		if (!Array.isArray(v)) return v;
		return v[Math.min(call, v.length) - 1];
	};
}

const net = () => new DeezerNetworkError("get_url FLAC: RequestError: socket hang up", { code: "ECONNRESET" });
const callsFor = (dz: FakeDz, format: string) =>
	dz.get_track_url.mock.calls.filter((c: unknown[]) => c[1] === format).length;

beforeEach(() => {
	vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("getPreferredBitrate — parallel fast path (fallback allowed, no alternative track)", () => {
	it("does not fall back to MP3 320 when FLAC fails transiently (was: network error read as 'no FLAC', degraded copy persisted)", async () => {
		const dz = fakeDz(byFormat({ FLAC: net(), MP3_320: "u320", MP3_128: "u128" }));
		const track = fakeTrack();
		await expect(getPreferredBitrate(dz, track, FLAC, true, false, "", null)).rejects.toBeInstanceOf(DeezerNetworkError);
		expect(callsFor(dz, "FLAC")).toBe(2); // first try + one retry
		expect(track.urls).toEqual({});
	});

	it("retries a transient failure once and keeps the higher format", async () => {
		const dz = fakeDz(byFormat({ FLAC: [net(), "uflac"], MP3_320: "u320" }));
		const track = fakeTrack();
		await expect(getPreferredBitrate(dz, track, FLAC, true, false, "", null)).resolves.toBe(FLAC);
		expect(track.urls.FLAC).toBe("uflac");
	});

	it.each([
		["no URL", { FLAC: null }],
		["WrongLicense", { FLAC: new WrongLicense("FLAC") }],
		["WrongGeolocation", { FLAC: new WrongGeolocation("FR") }],
	])("falls back past FLAC when it is genuinely unavailable (%s)", async (_label, flac) => {
		const dz = fakeDz(byFormat({ ...flac, MP3_320: "u320" }));
		const track = fakeTrack();
		await expect(getPreferredBitrate(dz, track, FLAC, true, false, "", null)).resolves.toBe(MP3_320);
		expect(track.urls.MP3_320).toBe("u320");
		expect(callsFor(dz, "FLAC")).toBe(1); // a definitive answer is not retried
	});

	it("falls back past a format whose filesize is 0 without asking Deezer for it", async () => {
		const dz = fakeDz(byFormat({ FLAC: "uflac", MP3_320: "u320" }));
		const track = fakeTrack({ filesizes: { flac: "0", mp3_320: "80", mp3_128: "40" } });
		await expect(getPreferredBitrate(dz, track, FLAC, true, false, "", null)).resolves.toBe(MP3_320);
		expect(callsFor(dz, "FLAC")).toBe(0);
	});

	it("keeps the highest available format even when a lower one fails transiently", async () => {
		const dz = fakeDz(byFormat({ FLAC: "uflac", MP3_320: "u320", MP3_128: net() }));
		await expect(getPreferredBitrate(dz, fakeTrack(), FLAC, true, false, "", null)).resolves.toBe(FLAC);
	});

	it("surfaces an unexpected Deezer error instead of degrading (was: any error read as 'format unavailable')", async () => {
		const dz = fakeDz(byFormat({ FLAC: new DeezerError("get_url FLAC:: Invalid license token"), MP3_320: "u320" }));
		await expect(getPreferredBitrate(dz, fakeTrack(), FLAC, true, false, "", null)).rejects.toThrow("Invalid license token");
	});

	it("only asks for formats at or below the preferred bitrate", async () => {
		const dz = fakeDz(byFormat({ FLAC: "uflac", MP3_320: "u320", MP3_128: "u128" }));
		await expect(getPreferredBitrate(dz, fakeTrack(), MP3_320, true, false, "", null)).resolves.toBe(MP3_320);
		expect(callsFor(dz, "FLAC")).toBe(0);
	});
});

describe("getPreferredBitrate — sequential path", () => {
	it("throws the network error, not PreferredBitrateNotFound, when the only allowed format fails transiently (was: PreferredBitrateNotFound)", async () => {
		const dz = fakeDz(byFormat({ FLAC: net() }));
		await expect(getPreferredBitrate(dz, fakeTrack(), FLAC, false, false, "", null)).rejects.toBeInstanceOf(DeezerNetworkError);
		expect(callsFor(dz, "FLAC")).toBe(2);
	});

	it("throws WrongLicense when the account cannot stream the format and fallback is off", async () => {
		const dz = fakeDz(byFormat({ FLAC: new WrongLicense("FLAC") }), {
			can_stream_hq: true,
			can_stream_lossless: false,
			country: "FR",
		});
		await expect(getPreferredBitrate(dz, fakeTrack(), FLAC, false, false, "", null)).rejects.toBeInstanceOf(WrongLicense);
	});

	it("throws PreferredBitrateNotFound when the format has no URL and fallback is off", async () => {
		const dz = fakeDz(byFormat({ FLAC: null }));
		await expect(getPreferredBitrate(dz, fakeTrack(), FLAC, false, false, "", null)).rejects.toBeInstanceOf(PreferredBitrateNotFound);
		expect(callsFor(dz, "FLAC")).toBe(1); // was: asked twice for the same track
	});

	it("reports why the last checked track failed, not a stale flag from an earlier check (was: shared isGeolocked closure flag)", async () => {
		const dz = fakeDz((token, format) => {
			if (format !== "FLAC") return null;
			return token === "alt-token" ? null : new WrongGeolocation("FR");
		});
		dz.gw.get_track_with_fallback.mockResolvedValue({
			SNG_ID: 2,
			SNG_TITLE: "Alt",
			TRACK_TOKEN: "alt-token",
			TRACK_TOKEN_EXPIRE: 0,
			MD5_ORIGIN: "abcdef",
			MEDIA_VERSION: 1,
			FILESIZE: 1,
			FILESIZE_FLAC: 100,
			EXPLICIT_TRACK_CONTENT: {},
			MEDIA: [],
		});
		const track = fakeTrack({ fallbackID: 2 });
		await expect(getPreferredBitrate(dz, track, FLAC, false, false, "", null)).rejects.toBeInstanceOf(PreferredBitrateNotFound);
		expect(dz.gw.get_track_with_fallback).toHaveBeenCalledWith(2);
	});

	it("uses the alternative track's URL when the main track has none", async () => {
		const dz = fakeDz((token, format) => (format === "MP3_128" && token === "alt-token" ? "ualt" : null));
		dz.gw.get_track_with_fallback.mockResolvedValue({
			SNG_ID: 2,
			SNG_TITLE: "Alt",
			TRACK_TOKEN: "alt-token",
			TRACK_TOKEN_EXPIRE: 0,
			MD5_ORIGIN: "abcdef",
			MEDIA_VERSION: 1,
			FILESIZE: 1,
			FILESIZE_MP3_128: 40,
			EXPLICIT_TRACK_CONTENT: {},
			MEDIA: [],
		});
		const track = fakeTrack({ fallbackID: 2, filesizes: { mp3_128: "40" } });
		await expect(getPreferredBitrate(dz, track, MP3_128, false, false, "", null)).resolves.toBe(MP3_128);
		expect(track.urls.MP3_128).toBe("ualt");
		expect(track.parseEssentialData).toHaveBeenCalled();
	});
});
