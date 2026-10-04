// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	backoffDelay,
	deezerHttp,
	isPreSendError,
	isTransientNetworkError,
	redactForLog,
	toDeezerNetworkError,
	withRetry,
} from "./http";
import { DeezerNetworkError, WrongLicense } from "./errors";

beforeEach(() => {
	vi.spyOn(deezerHttp, "sleep").mockResolvedValue(undefined);
});

describe("isTransientNetworkError", () => {
	it.each([
		[{ code: "ECONNRESET" }],
		[{ code: "ETIMEDOUT" }],
		[{ code: "EAI_AGAIN" }],
		[{ name: "TimeoutError", code: "ETIMEDOUT", event: "request" }],
		[{ name: "ReadError" }],
		[{ name: "HTTPError", response: { statusCode: 503 } }],
		[{ name: "HTTPError", response: { statusCode: 429 } }],
		[new DeezerNetworkError("x")],
	])("is transient: %j", (e) => {
		expect(isTransientNetworkError(e)).toBe(true);
	});

	it.each([
		[{ name: "HTTPError", response: { statusCode: 404 } }],
		[{ name: "ParseError" }],
		[new WrongLicense("FLAC")],
		[null],
		["boom"],
	])("is not transient: %j", (e) => {
		expect(isTransientNetworkError(e)).toBe(false);
	});
});

describe("isPreSendError", () => {
	it("accepts failures that happen before the request leaves", () => {
		expect(isPreSendError({ code: "ECONNREFUSED" })).toBe(true);
		expect(isPreSendError({ code: "ENOTFOUND" })).toBe(true);
		expect(isPreSendError({ name: "TimeoutError", event: "connect" })).toBe(true);
	});

	it("rejects failures after the request may have been received", () => {
		expect(isPreSendError({ code: "ECONNRESET" })).toBe(false);
		expect(isPreSendError({ name: "TimeoutError", event: "response" })).toBe(false);
		expect(isPreSendError(undefined)).toBe(false);
	});
});

describe("backoffDelay", () => {
	it("doubles per attempt with jitter in [ceiling/2, ceiling] and caps at the max", () => {
		vi.spyOn(deezerHttp, "random").mockReturnValue(0);
		expect(backoffDelay(0, 500, 4000)).toBe(250);
		expect(backoffDelay(1, 500, 4000)).toBe(500);
		vi.spyOn(deezerHttp, "random").mockReturnValue(1);
		expect(backoffDelay(1, 500, 4000)).toBe(1000);
		expect(backoffDelay(10, 500, 4000)).toBe(4000);
	});
});

describe("withRetry", () => {
	it("retries a transient failure at most twice, then rethrows it", async () => {
		const err = { code: "ECONNRESET" };
		const fn = vi.fn().mockRejectedValue(err);
		await expect(withRetry(fn)).rejects.toBe(err);
		expect(fn).toHaveBeenCalledTimes(3);
		expect(deezerHttp.sleep).toHaveBeenCalledTimes(2);
	});

	it("does not retry a non-transient failure", async () => {
		const fn = vi.fn().mockRejectedValue(new Error("bad input"));
		await expect(withRetry(fn)).rejects.toThrow("bad input");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("returns the first success", async () => {
		const fn = vi.fn().mockRejectedValueOnce({ code: "ETIMEDOUT" }).mockResolvedValue("ok");
		await expect(withRetry(fn)).resolves.toBe("ok");
		expect(fn).toHaveBeenCalledTimes(2);
	});
});

describe("toDeezerNetworkError", () => {
	it("keeps code, status and cause", () => {
		const cause = { name: "HTTPError", message: "bad gateway", response: { statusCode: 502 } };
		const e = toDeezerNetworkError("get_url", cause);
		expect(e).toBeInstanceOf(DeezerNetworkError);
		expect(e.status).toBe(502);
		expect((e as { cause?: unknown }).cause).toBe(cause);
		expect(toDeezerNetworkError("x", e)).toBe(e);
	});
});

describe("redactForLog", () => {
	it("masks secret keys at any depth and leaves the rest", () => {
		expect(
			redactForLog({ SNG_ID: 1, access_token: "a", nested: { arl: "b", license_token: "c", ok: 2 }, list: [{ password: "p" }] })
		).toEqual({
			SNG_ID: 1,
			access_token: "[redacted]",
			nested: { arl: "[redacted]", license_token: "[redacted]", ok: 2 },
			list: [{ password: "[redacted]" }],
		});
		expect(redactForLog("plain")).toBe("plain");
	});
});
