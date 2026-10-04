// Authenticated encryption for secrets stored in the database (the Deezer
// ARL in DeezerCredential.arl). AES-256-GCM, stored as
//   enc:v1:<iv b64>:<tag b64>:<ciphertext b64>
// Key: WAVELET_ENCRYPTION_KEY (base64 of 32 bytes) when set, else derived from
// BETTER_AUTH_SECRET with HKDF-SHA256 (info "wavelet-arl-v1"). Rotating
// BETTER_AUTH_SECRET without setting WAVELET_ENCRYPTION_KEY to the old derived
// key makes stored values unreadable — they then read as "no valid ARL".

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";
const HKDF_INFO = "wavelet-arl-v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class SecretBoxKeyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SecretBoxKeyError";
	}
}

/** Where WAVELET_ENCRYPTION_KEY / BETTER_AUTH_SECRET are read from (defaults to process.env). */
export type SecretEnv = Record<string, string | undefined>;

let cachedKey: { source: string; key: Buffer } | null = null;

/** The 32-byte key, from WAVELET_ENCRYPTION_KEY or derived from BETTER_AUTH_SECRET. */
export function resolveSecretKey(env: SecretEnv = process.env): Buffer {
	const explicit = env.WAVELET_ENCRYPTION_KEY?.trim();
	const source = explicit ? `key:${explicit}` : `auth:${env.BETTER_AUTH_SECRET ?? ""}`;
	if (cachedKey?.source === source) return cachedKey.key;

	let key: Buffer;
	if (explicit) {
		key = Buffer.from(explicit, "base64");
		if (key.length !== 32) {
			throw new SecretBoxKeyError("WAVELET_ENCRYPTION_KEY must be the base64 encoding of exactly 32 bytes.");
		}
	} else {
		const secret = env.BETTER_AUTH_SECRET;
		if (!secret) {
			throw new SecretBoxKeyError("Set WAVELET_ENCRYPTION_KEY or BETTER_AUTH_SECRET to encrypt stored secrets.");
		}
		key = Buffer.from(hkdfSync("sha256", secret, Buffer.alloc(0), HKDF_INFO, 32));
	}
	cachedKey = { source, key };
	return key;
}

/** True for values written by encryptSecret (enc:v1:…). */
export function isEncryptedSecret(stored: string | null | undefined): boolean {
	return typeof stored === "string" && stored.startsWith(PREFIX);
}

/** Encrypts `plaintext` for storage. Throws SecretBoxKeyError when no key is configured. */
export function encryptSecret(plaintext: string, env: SecretEnv = process.env): string {
	const key = resolveSecretKey(env);
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

/**
 * The plaintext of a stored secret. Legacy plaintext (no enc:v1: prefix) is
 * returned unchanged. Returns null — never throws — when an enc:v1 value
 * cannot be decrypted (no / wrong key, tampered or malformed value).
 */
export function decryptSecret(
	stored: string | null | undefined,
	env: SecretEnv = process.env
): string | null {
	if (typeof stored !== "string" || !stored) return null;
	if (!isEncryptedSecret(stored)) return stored;
	try {
		const parts = stored.slice(PREFIX.length).split(":");
		if (parts.length !== 3) return null;
		const [ivB64, tagB64, dataB64] = parts;
		const iv = Buffer.from(ivB64, "base64");
		const tag = Buffer.from(tagB64, "base64");
		if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) return null;
		const decipher = createDecipheriv("aes-256-gcm", resolveSecretKey(env), iv);
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
	} catch {
		return null;
	}
}
