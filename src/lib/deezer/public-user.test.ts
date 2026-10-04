import { describe, it, expect } from "vitest";
import { deezerAccountPayload, toPublicDeezerUser } from "./public-user";

const parent = { id: 1, name: "Parent", license_token: "LT", can_stream_hq: true, can_stream_lossless: false, country: "FR" };
const kid = { id: 2, name: "Kid", license_token: "LT", can_stream_hq: true, can_stream_lossless: false };

describe("toPublicDeezerUser", () => {
	it("drops license_token and keeps every other key (was: license_token sent to API clients)", () => {
		expect(toPublicDeezerUser(parent)).toEqual({ id: 1, name: "Parent", can_stream_hq: true, can_stream_lossless: false, country: "FR" });
	});

	it("passes nullish values through", () => {
		expect(toPublicDeezerUser(null)).toBeNull();
		expect(toPublicDeezerUser(undefined)).toBeUndefined();
	});
});

describe("deezerAccountPayload", () => {
	it("builds the login payload without any license token", () => {
		const payload = deezerAccountPayload({ currentUser: kid, childs: [parent, kid], selectedAccount: 1 });
		expect(JSON.stringify(payload)).not.toContain("license_token");
		expect(payload).toEqual({
			user: { id: 2, name: "Kid", can_stream_hq: true, can_stream_lossless: false },
			childs: [
				{ id: 1, name: "Parent", can_stream_hq: true, can_stream_lossless: false, country: "FR" },
				{ id: 2, name: "Kid", can_stream_hq: true, can_stream_lossless: false },
			],
			currentChild: 1,
			hasMultipleAccounts: true,
		});
	});

	it("tolerates a client with no childs / selected account", () => {
		expect(deezerAccountPayload({})).toEqual({ user: undefined, childs: [], currentChild: 0, hasMultipleAccounts: false });
	});
});
