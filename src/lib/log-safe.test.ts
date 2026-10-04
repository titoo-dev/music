import { describe, it, expect } from "vitest";
import { inspect } from "node:util";
import { describeErrorForLog, errorSummary, redactUrlQueries } from "./log-safe";

/** What got throws: the message embeds the request URL, `options` holds the body and cookie jar. */
function gotLikeError(message: string) {
	return Object.assign(new Error(message), {
		name: "HTTPError",
		code: "ERR_NON_2XX_3XX_RESPONSE",
		options: { json: { license_token: "LT-SECRET" }, cookieJar: { arl: "ARL-SECRET" } },
	});
}

describe("redactUrlQueries", () => {
	it("masks the query string of every http(s) URL and keeps the rest", () => {
		expect(
			redactUrlQueries(
				"POST https://www.deezer.com/ajax/gw-light.php?api_version=1.0&api_token=TOK&method=x failed; see https://example.com/doc"
			)
		).toBe("POST https://www.deezer.com/ajax/gw-light.php?[redacted] failed; see https://example.com/doc");
	});

	it("leaves text without URLs untouched", () => {
		expect(redactUrlQueries("connect ECONNREFUSED 10.0.0.1:443")).toBe("connect ECONNREFUSED 10.0.0.1:443");
	});
});

describe("errorSummary", () => {
	it("is 'Name: message' with URL queries masked", () => {
		const e = gotLikeError("Request failed with status code 500: GET https://api.deezer.com/user/me?access_token=SECRET");
		expect(errorSummary(e)).toBe("HTTPError: Request failed with status code 500: GET https://api.deezer.com/user/me?[redacted]");
	});

	it("handles non-Error values", () => {
		expect(errorSummary("plain")).toBe("plain");
		expect(errorSummary({ code: "X" })).toBe("Error");
		expect(errorSummary(null)).toBe("null");
	});
});

describe("describeErrorForLog", () => {
	it("never prints the error's other properties (was: a got error's request options — license_token, cookie jar — ended up in the logs)", () => {
		const cause = gotLikeError("Response code 502: POST https://media.deezer.com/v1/get_url?x=SECRET-Q");
		const err = Object.assign(new Error("get_url FLAC failed"), { cause, options: cause.options });
		const logged = describeErrorForLog(err);
		expect(logged).toContain("get_url FLAC failed");
		expect(logged).toContain("[cause] HTTPError: Response code 502");
		for (const secret of ["LT-SECRET", "ARL-SECRET", "SECRET-Q"]) expect(logged).not.toContain(secret);
		// The raw object would have leaked them:
		expect(inspect(err)).toContain("LT-SECRET");
	});

	it("keeps the stack for debugging", () => {
		const e = new Error("kaboom");
		expect(describeErrorForLog(e)).toContain("at ");
	});

	it("describes non-Error values", () => {
		expect(describeErrorForLog("oops")).toBe("oops");
		expect(describeErrorForLog(null)).toBe("null");
		expect(describeErrorForLog(undefined)).toBe("undefined");
	});

	it("stops after a few causes (cyclic chains end)", () => {
		const a = new Error("a");
		const b = new Error("b", { cause: a });
		(a as { cause?: unknown }).cause = b;
		expect(describeErrorForLog(b).split("[cause]").length).toBeLessThanOrEqual(4);
	});
});
