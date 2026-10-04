// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock("got", () => ({ default: { get: getMock } }));

import { getDeezerAccessTokenFromEmailPassword, getDeezerArlFromAccessToken } from "./deezer";
import { DEEZER_TIMEOUT, DEEZER_USER_AGENT } from "@/lib/deezer/http";

beforeEach(() => {
	getMock.mockReset();
});

describe("Deezer auth helpers", () => {
	it("bound the token request with explicit timeouts (was: no timeout)", async () => {
		getMock.mockReturnValue({ json: async () => ({ access_token: "AT" }) });
		await expect(getDeezerAccessTokenFromEmailPassword("a@b.c", "pw")).resolves.toBe("AT");
		const opts = getMock.mock.calls[0][1];
		expect(opts.timeout).toEqual(DEEZER_TIMEOUT);
		expect(opts.headers["User-Agent"]).toBe(DEEZER_USER_AGENT);
	});

	it("bound both ARL requests with explicit timeouts", async () => {
		getMock.mockReturnValue(Object.assign(Promise.resolve({}), { json: async () => ({ results: "ARL" }) }));
		await expect(getDeezerArlFromAccessToken("AT")).resolves.toBe("ARL");
		expect(getMock).toHaveBeenCalledTimes(2);
		for (const [, opts] of getMock.mock.calls) expect(opts.timeout).toEqual(DEEZER_TIMEOUT);
	});

	it("return null when Deezer is unreachable", async () => {
		getMock.mockReturnValue({ json: async () => Promise.reject(Object.assign(new Error("t"), { code: "ETIMEDOUT" })) });
		await expect(getDeezerAccessTokenFromEmailPassword("a@b.c", "pw")).resolves.toBeNull();
		await expect(getDeezerArlFromAccessToken(null)).resolves.toBeNull();
	});
});
