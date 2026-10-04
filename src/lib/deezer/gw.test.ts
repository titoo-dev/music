// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));
vi.mock("got", () => ({ default: { post: postMock, get: vi.fn() } }));

import { GW, EMPTY_TRACK_OBJ } from "./gw";
import { GWAPIError } from "./errors";
import { deezerHttp, DEEZER_TIMEOUT } from "./http";

type Reply = { ok: unknown } | { err: unknown };

/** Queue got.post().json() outcomes; the last one repeats (capped so a runaway loop ends). */
function replies(...queue: Reply[]) {
	let calls = 0;
	postMock.mockImplementation(() => ({
		json: async () => {
			calls++;
			if (calls > 25) throw new Error("runaway: more than 25 Deezer calls");
			const r = queue.length > 1 ? queue.shift()! : queue[0];
			if ("err" in r) throw r.err;
			return r.ok;
		},
	}));
}

const netErr = (code: string) => Object.assign(new Error(code), { code, name: "RequestError" });
const okBody = (results: unknown) => ({ ok: { error: [], results } });

function makeGw() {
	const gw = new GW(undefined, { "User-Agent": "test" });
	gw.api_token = "tok";
	return gw;
}

beforeEach(() => {
	postMock.mockReset();
	vi.spyOn(deezerHttp, "sleep").mockResolvedValue(undefined);
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("GW.api_call", () => {
	it("gives up after 2 retries on a connection reset (was: retried forever every 2 s)", async () => {
		replies({ err: netErr("ECONNRESET") });
		await expect(makeGw().api_call("song.getData", { SNG_ID: 1 })).rejects.toBeInstanceOf(GWAPIError);
		expect(postMock).toHaveBeenCalledTimes(3);
		expect(deezerHttp.sleep).toHaveBeenCalledTimes(2);
	});

	it("succeeds when a retry gets through", async () => {
		replies({ err: netErr("ETIMEDOUT") }, okBody({ SNG_ID: 1 }));
		await expect(makeGw().api_call("song.getData", { SNG_ID: 1 })).resolves.toEqual({ SNG_ID: 1 });
		expect(postMock).toHaveBeenCalledTimes(2);
	});

	it("sends every request with explicit timeouts and got's own retry off (was: no timeout, could hang until maxDuration)", async () => {
		replies(okBody({}));
		await makeGw().api_call("song.getData", { SNG_ID: 1 });
		const opts = postMock.mock.calls[0][1];
		expect(opts.timeout).toEqual(DEEZER_TIMEOUT);
		expect(opts.retry).toEqual({ limit: 0 });
	});

	it("refreshes an invalid api token at most once (was: unbounded recursion)", async () => {
		const invalid = { ok: { error: { GATEWAY_ERROR: "invalid api token" }, results: {} } };
		const userData = okBody({ checkForm: "fresh" });
		// song.getData → invalid, getUserData → token, song.getData → invalid again, …
		replies(invalid, userData, invalid, userData, invalid, userData, invalid, userData, okBody({ SNG_ID: 1 }));
		await expect(makeGw().api_call("song.getData", { SNG_ID: 1 })).rejects.toBeInstanceOf(GWAPIError);
		// first call + one token refresh + one retried call
		expect(postMock).toHaveBeenCalledTimes(3);
	});

	it("retries once with the refreshed token", async () => {
		replies(
			{ ok: { error: { VALID_TOKEN_REQUIRED: "Invalid CSRF token" }, results: {} } },
			okBody({ checkForm: "fresh" }),
			okBody({ SNG_ID: 1 })
		);
		const gw = makeGw();
		await expect(gw.api_call("song.getData", { SNG_ID: 1 })).resolves.toEqual({ SNG_ID: 1 });
		expect(gw.api_token).toBe("fresh");
		expect(postMock.mock.calls[2][1].searchParams.api_token).toBe("fresh");
	});

	it("bounds the FALLBACK chain (was: infinite recursion on payload.FALLBACK)", async () => {
		replies({ ok: { error: { DATA_ERROR: "x" }, payload: { FALLBACK: { SNG_ID: 2 } }, results: {} } });
		await expect(makeGw().api_call("song.getData", { SNG_ID: 1 })).rejects.toBeInstanceOf(GWAPIError);
		expect(postMock.mock.calls.length).toBeLessThanOrEqual(4);
	});

	it("follows a FALLBACK to the alternative id", async () => {
		replies(
			{ ok: { error: { DATA_ERROR: "x" }, payload: { FALLBACK: { SNG_ID: 2 } }, results: {} } },
			okBody({ SNG_ID: 2 })
		);
		await expect(makeGw().api_call("song.getData", { SNG_ID: 1 })).resolves.toEqual({ SNG_ID: 2 });
		expect(postMock.mock.calls[1][1].json).toEqual({ SNG_ID: 2 });
	});

	it("does not retry a write once the request may have reached Deezer", async () => {
		replies({ err: netErr("ECONNRESET") });
		await expect(makeGw().api_call("playlist.create", { title: "x" })).rejects.toBeInstanceOf(GWAPIError);
		expect(postMock).toHaveBeenCalledTimes(1);
	});

	it("retries a write that never left (connection refused)", async () => {
		replies({ err: netErr("ECONNREFUSED") }, okBody({ ok: true }));
		await expect(makeGw().api_call("playlist.create", { title: "x" })).resolves.toEqual({ ok: true });
		expect(postMock).toHaveBeenCalledTimes(2);
	});

	it("does not log secrets from the call arguments (was: logged raw args)", async () => {
		replies({ err: Object.assign(new Error("boom"), { name: "HTTPError", response: { statusCode: 400 } }) });
		await expect(makeGw().api_call("user.update", { arl: "SECRET-ARL", api_token: "SECRET-TOK" })).rejects.toThrow();
		const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls);
		expect(logged).not.toContain("SECRET-ARL");
		expect(logged).not.toContain("SECRET-TOK");
	});
});

describe("GW.get_tracks", () => {
	it("keeps each id at its own position when one id is 0 (was: tested sng_ids[0] for every index)", async () => {
		const gw = makeGw();
		vi.spyOn(gw, "api_call").mockResolvedValue({ data: [{ SNG_ID: 1 }, { SNG_ID: 2 }] });
		const tracks = await gw.get_tracks([1, 0, 2]);
		expect(tracks).toEqual([{ SNG_ID: 1 }, EMPTY_TRACK_OBJ, { SNG_ID: 2 }]);
	});
});
