// @vitest-environment node
import { describe, it, expect } from "vitest";
import * as decryption from "./decryption";

describe("decryption module surface", () => {
	it("no longer exports the dead streamTrack downloader or its unused URL helpers (was: streamTrack null-dereferenced downloadObject.isCanceled on every chunk)", () => {
		for (const name of ["streamTrack", "generateStreamURL", "reverseStreamURL", "reverseStreamPath"]) {
			expect(name in decryption).toBe(false);
		}
	});

	it("keeps generateCryptedStreamURL for getPreferredBitrate's feelingLucky fallback", () => {
		const url = decryption.generateCryptedStreamURL(3135556, "a1b2c3", 1, 1);
		expect(url).toMatch(/^https:\/\/e-cdns-proxy-a\.dzcdn\.net\/mobile\/1\/[0-9a-f]+$/);
		expect(url).toBe(decryption.generateCryptedStreamURL(3135556, "a1b2c3", 1, 1));
	});
});
