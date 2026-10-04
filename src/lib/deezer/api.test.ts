// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CookieJar } from "tough-cookie";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock("got", () => ({ default: { get: getMock, post: vi.fn() } }));

import { API } from "./api";
import { APIError, PermissionException } from "./errors";
import { deezerHttp, DEEZER_TIMEOUT } from "./http";

type Reply = { ok: unknown } | { err: unknown };

function replies(...queue: Reply[]) {
	let calls = 0;
	getMock.mockImplementation(() => ({
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
const makeApi = () => new API(new CookieJar(), { "User-Agent": "test" });

beforeEach(() => {
	getMock.mockReset();
	vi.spyOn(deezerHttp, "sleep").mockResolvedValue(undefined);
	vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("API.call", () => {
	it("gives up after 2 retries on a network error (was: retried forever every 2 s)", async () => {
		replies({ err: netErr("ETIMEDOUT") });
		await expect(makeApi().call("track/1")).rejects.toBeInstanceOf(APIError);
		expect(getMock).toHaveBeenCalledTimes(3);
	});

	it("gives up after 2 retries on a quota error (was: retried forever every 5 s)", async () => {
		replies({ ok: { error: { code: 4, message: "Quota limit exceeded" } } });
		await expect(makeApi().call("track/1")).rejects.toBeInstanceOf(APIError);
		expect(getMock).toHaveBeenCalledTimes(3);
	});

	it("returns the body once a retry succeeds", async () => {
		replies({ ok: { error: { code: 700, message: "busy" } } }, { ok: { id: 1 } });
		await expect(makeApi().call("track/1")).resolves.toEqual({ id: 1 });
	});

	it("maps Deezer error codes without retrying them", async () => {
		replies({ ok: { error: { code: 200, message: "nope" } } });
		await expect(makeApi().call("track/1")).rejects.toBeInstanceOf(PermissionException);
		expect(getMock).toHaveBeenCalledTimes(1);
	});

	it("sends explicit timeouts with got's own retry off (was: no timeout)", async () => {
		replies({ ok: { id: 1 } });
		await makeApi().call("track/1");
		const opts = getMock.mock.calls[0][1];
		expect(opts.timeout).toEqual(DEEZER_TIMEOUT);
		expect(opts.retry).toEqual({ limit: 0 });
	});

	it("never logs the access token (was: logged args incl. access_token)", async () => {
		replies({ err: Object.assign(new Error("bad"), { name: "HTTPError", response: { statusCode: 400 } }) });
		const api = makeApi();
		api.access_token = "SECRET-ACCESS";
		await expect(api.call("user/me")).rejects.toBeInstanceOf(APIError);
		const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls);
		expect(logged).not.toContain("SECRET-ACCESS");
		expect(getMock.mock.calls[0][1].searchParams.access_token).toBe("SECRET-ACCESS");
	});

	it("keeps the access token in got's error message out of the log and the thrown error (was: the full request URL was logged and rethrown)", async () => {
		replies({
			err: Object.assign(
				new Error("Request failed with status code 400 (Bad Request): GET https://api.deezer.com/user/me?access_token=SECRET-ACCESS"),
				{ name: "HTTPError", response: { statusCode: 400 } }
			),
		});
		const err = (await makeApi().call("user/me").catch((e: unknown) => e)) as Error;
		expect(err).toBeInstanceOf(APIError);
		expect(err.message).not.toContain("SECRET-ACCESS");
		const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls);
		expect(logged).not.toContain("SECRET-ACCESS");
	});
});
