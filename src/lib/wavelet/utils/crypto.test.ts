// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createDecipheriv, getCiphers, randomBytes } from "crypto";
import { createRequire } from "module";
import {
	createStripeDecryptor,
	decryptChunk,
	generateBlowfishKey,
	hasNativeBlowfish,
} from "./crypto";

const require = createRequire(import.meta.url);
const Blowfish = require("./blowfish.cjs");

/** Verbatim copy of decryptChunk before S13 — the byte-for-byte reference. */
function legacyDecryptChunk(chunk: Buffer, blowFishKey: string): Buffer {
	const ciphers = getCiphers();
	if (ciphers.includes("bf-cbc")) {
		const cipher = createDecipheriv(
			"bf-cbc",
			blowFishKey,
			Buffer.from([0, 1, 2, 3, 4, 5, 6, 7])
		);
		cipher.setAutoPadding(false);
		return Buffer.concat([cipher.update(chunk), cipher.final()]);
	}
	const cipher = new Blowfish(blowFishKey, Blowfish.MODE.CBC, Blowfish.PADDING.NULL);
	cipher.setIv(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]));
	return Buffer.from(cipher.decode(chunk, Blowfish.TYPE.UINT8_ARRAY));
}

function encryptStripe(plain: Buffer, key: string): Buffer {
	const cipher = new Blowfish(key, Blowfish.MODE.CBC, Blowfish.PADDING.NULL);
	cipher.setIv(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]));
	return Buffer.from(cipher.encode(plain));
}

describe("createStripeDecryptor", () => {
	it("decrypts many stripes with one key schedule, byte-identical to the per-stripe decryptor (was: new Blowfish + getCiphers() per 2048-byte stripe)", () => {
		for (const trackId of ["3135556", "1", "987654321"]) {
			const key = generateBlowfishKey(trackId);
			const decrypt = createStripeDecryptor(key);
			for (let i = 0; i < 6; i++) {
				const stripe = randomBytes(2048);
				expect(decrypt(stripe).equals(legacyDecryptChunk(stripe, key))).toBe(true);
			}
		}
	});

	it("restarts CBC from the fixed IV on every stripe (shared instance keeps no chaining state)", () => {
		const key = generateBlowfishKey("42");
		const decrypt = createStripeDecryptor(key);
		const a = randomBytes(2048);
		const b = randomBytes(2048);
		const first = decrypt(a);
		decrypt(b);
		expect(decrypt(a).equals(first)).toBe(true);
	});

	it("inverts the Blowfish CBC encryption Deezer applies to a stripe", () => {
		const key = generateBlowfishKey("3135556");
		const plain = randomBytes(2048);
		expect(createStripeDecryptor(key)(encryptStripe(plain, key)).equals(plain)).toBe(true);
	});

	it("keeps decryptChunk as a one-shot alias", () => {
		const key = generateBlowfishKey("7");
		const stripe = randomBytes(2048);
		expect(decryptChunk(stripe, key).equals(legacyDecryptChunk(stripe, key))).toBe(true);
	});

	it("detects native bf-cbc once and agrees with getCiphers()", () => {
		expect(hasNativeBlowfish()).toBe(hasNativeBlowfish());
		if (!getCiphers().includes("bf-cbc")) expect(hasNativeBlowfish()).toBe(false);
	});
});
