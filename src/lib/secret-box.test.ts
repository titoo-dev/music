// @vitest-environment node
import { describe, it, expect } from "vitest";
import { hkdfSync, randomBytes } from "node:crypto";
import {
	decryptSecret,
	encryptSecret,
	isEncryptedSecret,
	resolveSecretKey,
	SecretBoxKeyError,
} from "./secret-box";

const authEnv = { BETTER_AUTH_SECRET: "auth-secret-for-tests" };
const keyEnv = { WAVELET_ENCRYPTION_KEY: randomBytes(32).toString("base64") };

describe("secret-box", () => {
	it("round-trips with a key derived from BETTER_AUTH_SECRET", () => {
		const stored = encryptSecret("my-arl", authEnv);
		expect(stored).toMatch(/^enc:v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
		expect(stored).not.toContain("my-arl");
		expect(decryptSecret(stored, authEnv)).toBe("my-arl");
	});

	it("derives the key with HKDF-SHA256, info 'wavelet-arl-v1'", () => {
		const expected = Buffer.from(hkdfSync("sha256", "auth-secret-for-tests", Buffer.alloc(0), "wavelet-arl-v1", 32));
		expect(resolveSecretKey(authEnv).equals(expected)).toBe(true);
	});

	it("prefers WAVELET_ENCRYPTION_KEY over BETTER_AUTH_SECRET", () => {
		const env = { ...keyEnv, ...authEnv };
		const stored = encryptSecret("arl", env);
		expect(decryptSecret(stored, env)).toBe("arl");
		expect(decryptSecret(stored, authEnv)).toBeNull();
	});

	it("uses a fresh IV per encryption", () => {
		expect(encryptSecret("arl", authEnv)).not.toBe(encryptSecret("arl", authEnv));
	});

	it("passes legacy plaintext through unchanged", () => {
		expect(isEncryptedSecret("abcdef0123")).toBe(false);
		expect(decryptSecret("abcdef0123", authEnv)).toBe("abcdef0123");
		expect(decryptSecret("abcdef0123", {})).toBe("abcdef0123");
	});

	it("returns null instead of throwing for a wrong key, a tampered or malformed value", () => {
		const stored = encryptSecret("arl", authEnv);
		expect(decryptSecret(stored, { BETTER_AUTH_SECRET: "other" })).toBeNull();
		const [, , iv, tag, data] = stored.split(":");
		const flipped = Buffer.from(data, "base64");
		flipped[0] ^= 1;
		expect(decryptSecret(`enc:v1:${iv}:${tag}:${flipped.toString("base64")}`, authEnv)).toBeNull();
		expect(decryptSecret("enc:v1:garbage", authEnv)).toBeNull();
		expect(decryptSecret("enc:v1:a:b:c", authEnv)).toBeNull();
		expect(decryptSecret(stored, {})).toBeNull();
		expect(decryptSecret(null)).toBeNull();
		expect(decryptSecret("")).toBeNull();
	});

	it("refuses to encrypt without a key, or with a key of the wrong size", () => {
		expect(() => encryptSecret("arl", {})).toThrow(SecretBoxKeyError);
		expect(() =>
			encryptSecret("arl", { WAVELET_ENCRYPTION_KEY: randomBytes(16).toString("base64") })
		).toThrow(SecretBoxKeyError);
	});
});
