// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));
vi.mock("got", () => ({ default: { post: postMock, get: vi.fn() } }));

import { Deezer } from "./deezer";
import { DeezerError, DeezerNetworkError, WrongGeolocation, WrongLicense } from "./errors";
import { deezerHttp, DEEZER_TIMEOUT, DEEZER_USER_AGENT } from "./http";

function makeDz() {
	const dz = new Deezer();
	dz.currentUser = {
		license_token: "LT",
		can_stream_hq: true,
		can_stream_lossless: true,
		country: "FR",
	};
	return dz;
}

function getUrlReplies(...bodies: Array<{ ok: unknown } | { err: unknown }>) {
	postMock.mockImplementation(() => ({
		json: async () => {
			const r = bodies.length > 1 ? bodies.shift()! : bodies[0];
			if ("err" in r) throw r.err;
			return r.ok;
		},
		text: async () => "",
	}));
}

const media = (url: string) => ({ media: [{ sources: [{ url }] }] });

beforeEach(() => {
	postMock.mockReset();
	vi.spyOn(deezerHttp, "sleep").mockResolvedValue(undefined);
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("Deezer.get_tracks_url", () => {
	it("throws a DeezerNetworkError on a network failure (was: swallowed → [] → treated as 'no URL for this format')", async () => {
		getUrlReplies({ err: Object.assign(new Error("reset"), { code: "ECONNRESET", name: "RequestError" }) });
		const err = await makeDz().get_tracks_url(["t1"], "FLAC").catch((e) => e);
		expect(err).toBeInstanceOf(DeezerNetworkError);
		expect(err).toBeInstanceOf(DeezerError);
	});

	it("throws a DeezerNetworkError on a 5xx from media.deezer.com", async () => {
		getUrlReplies({ err: Object.assign(new Error("bad gateway"), { name: "HTTPError", response: { statusCode: 502 } }) });
		await expect(makeDz().get_tracks_url(["t1"], "FLAC")).rejects.toBeInstanceOf(DeezerNetworkError);
	});

	it("returns exactly one entry per token when one entry errors (was: error AND null pushed → misaligned)", async () => {
		getUrlReplies({
			ok: {
				data: [media("u1"), { errors: [{ code: 2002, message: "geo" }] }, {}, media("u4")],
			},
		});
		const res = await makeDz().get_tracks_url(["t1", "t2", "t3", "t4"], "MP3_128");
		expect(res).toHaveLength(4);
		expect(res[0]).toBe("u1");
		expect(res[1]).toBeInstanceOf(WrongGeolocation);
		expect(res[2]).toBeNull();
		expect(res[3]).toBe("u4");
	});

	it("maps the 'no sufficient rights' entry error to WrongLicense", async () => {
		getUrlReplies({ ok: { data: [{ errors: [{ code: 2001, message: "rights" }] }] } });
		const [entry] = await makeDz().get_tracks_url(["t1"], "FLAC");
		expect(entry).toBeInstanceOf(WrongLicense);
	});

	it("does not crash when the response has no data array (was: TypeError on response.data.length)", async () => {
		getUrlReplies({ ok: {} });
		await expect(makeDz().get_tracks_url(["t1"], "MP3_128")).resolves.toEqual([null]);
	});

	it("surfaces a top-level error as a DeezerError, not as 'unavailable'", async () => {
		getUrlReplies({ ok: { errors: [{ code: 1000, message: "Invalid license token" }] } });
		const err = await makeDz().get_tracks_url(["t1"], "MP3_128").catch((e) => e);
		expect(err).toBeInstanceOf(DeezerError);
		expect(err).not.toBeInstanceOf(DeezerNetworkError);
	});

	it("sends get_url with explicit timeouts", async () => {
		getUrlReplies({ ok: { data: [media("u1")] } });
		await makeDz().get_tracks_url(["t1"], "MP3_128");
		expect(postMock.mock.calls[0][1].timeout).toEqual(DEEZER_TIMEOUT);
		expect(postMock.mock.calls[0][1].retry).toEqual({ limit: 0 });
	});
});

describe("Deezer.get_track_url", () => {
	it("returns the URL, null for no media, and throws an entry error", async () => {
		const dz = makeDz();
		getUrlReplies({ ok: { data: [media("u1")] } });
		await expect(dz.get_track_url("t1", "MP3_128")).resolves.toBe("u1");
		getUrlReplies({ ok: { data: [{}] } });
		await expect(dz.get_track_url("t1", "MP3_128")).resolves.toBeNull();
		getUrlReplies({ ok: { data: [{ errors: [{ code: 2002 }] }] } });
		await expect(dz.get_track_url("t1", "MP3_128")).rejects.toBeInstanceOf(WrongGeolocation);
	});
});

describe("Deezer client identity", () => {
	it("sends a current desktop Chrome User-Agent (was: hard-coded Chrome 79)", () => {
		const ua = new Deezer().httpHeaders["User-Agent"];
		expect(ua).toBe(DEEZER_USER_AGENT);
		const major = Number(/Chrome\/(\d+)/.exec(ua)?.[1]);
		expect(major).toBeGreaterThanOrEqual(140);
	});
});
