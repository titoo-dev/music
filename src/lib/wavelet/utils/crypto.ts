import {
	createCipheriv,
	createHash,
	createDecipheriv,
	getCiphers,
} from "crypto";

let Blowfish;

try {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	Blowfish = require("./blowfish.cjs");
} catch (e) {
	console.error(e);
}

export function _md5(data, type: BufferEncoding = "binary") {
	const md5sum = createHash("md5");
	md5sum.update(Buffer.from(data, type));
	return md5sum.digest("hex");
}

export function _ecbCrypt(key, data) {
	const cipher = createCipheriv(
		"aes-128-ecb",
		Buffer.from(key),
		Buffer.from("")
	);
	cipher.setAutoPadding(false);
	return Buffer.concat([cipher.update(data, "binary"), cipher.final()])
		.toString("hex")
		.toLowerCase();
}

export function _ecbDecrypt(key, data) {
	const cipher = createDecipheriv(
		"aes-128-ecb",
		Buffer.from(key),
		Buffer.from("")
	);
	cipher.setAutoPadding(false);
	return Buffer.concat([cipher.update(data, "binary"), cipher.final()])
		.toString("hex")
		.toLowerCase();
}

export function generateBlowfishKey(trackId) {
	const SECRET = "g4el58wc0zvf9na1";
	const idMd5 = _md5(trackId.toString(), "ascii");
	let bfKey = "";
	for (let i = 0; i < 16; i++) {
		bfKey += String.fromCharCode(
			idMd5.charCodeAt(i) ^ idMd5.charCodeAt(i + 16) ^ SECRET.charCodeAt(i)
		);
	}
	return String(bfKey);
}

/** Fixed CBC IV of Deezer's BF_CBC_STRIPE stripes. */
const STRIPE_IV = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]);

let nativeBfCbc: boolean | null = null;

/**
 * Whether this Node build can do bf-cbc natively. Probed once per process:
 * OpenSSL 3 (Node >= 17) ships Blowfish in the legacy provider only, so
 * `createDecipheriv("bf-cbc")` throws ERR_OSSL_EVP_UNSUPPORTED there.
 */
export function hasNativeBlowfish(): boolean {
	if (nativeBfCbc === null) {
		try {
			if (!getCiphers().includes("bf-cbc")) throw new Error("bf-cbc not listed");
			createDecipheriv("bf-cbc", Buffer.alloc(16), STRIPE_IV);
			nativeBfCbc = true;
		} catch {
			nativeBfCbc = false;
		}
	}
	return nativeBfCbc;
}

/** Decrypts one encrypted 2048-byte stripe (any multiple of 8 bytes works). */
export type StripeDecryptor = (stripe: Uint8Array) => Buffer;

/**
 * Builds a stripe decryptor for one track key. The Blowfish key schedule
 * (521 block encryptions) is computed once here and reused for every stripe,
 * instead of once per 2048-byte stripe. Each call restarts CBC from the fixed
 * IV — blowfish.cjs `decode()` keeps the chaining state in locals and never
 * mutates `iv`, so a shared instance is safe.
 */
export function createStripeDecryptor(blowFishKey: string): StripeDecryptor {
	if (hasNativeBlowfish()) {
		return (stripe) => {
			const cipher = createDecipheriv("bf-cbc", blowFishKey, STRIPE_IV);
			cipher.setAutoPadding(false);
			return Buffer.concat([cipher.update(stripe), cipher.final()]);
		};
	}
	if (Blowfish) {
		const cipher = new Blowfish(
			blowFishKey,
			Blowfish.MODE.CBC,
			Blowfish.PADDING.NULL
		);
		cipher.setIv(STRIPE_IV);
		return (stripe) => {
			const out: Uint8Array = cipher.decode(stripe, Blowfish.TYPE.UINT8_ARRAY);
			return Buffer.from(out.buffer, out.byteOffset, out.byteLength);
		};
	}
	throw new Error("Can't find a way to decrypt chunks");
}

/** One-shot stripe decryption. Prefer `createStripeDecryptor` in loops. */
export function decryptChunk(chunk, blowFishKey) {
	return createStripeDecryptor(blowFishKey)(chunk);
}
