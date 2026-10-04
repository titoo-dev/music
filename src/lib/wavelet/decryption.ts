import got from "got";
import { Readable } from "stream";
import { TrackFormats } from "@/lib/deezer";
import {
	_md5,
	_ecbCrypt,
	generateBlowfishKey,
	decryptChunk,
} from "./utils/crypto";

import { USER_AGENT_HEADER } from "./utils/index";

export function generateStreamPath(sngID, md5, mediaVersion, format) {
	let urlPart = md5 + "\xA4" + format + "\xA4" + sngID + "\xA4" + mediaVersion;
	const md5val = _md5(urlPart);
	let step2 = md5val + "\xA4" + urlPart + "\xA4";
	step2 += ".".repeat(16 - (step2.length % 16));
	urlPart = _ecbCrypt("jo6aey6haid2Teih", step2);
	return urlPart;
}

export function generateCryptedStreamURL(sngID, md5, mediaVersion, format) {
	const urlPart = generateStreamPath(sngID, md5, mediaVersion, format);
	return "https://e-cdns-proxy-" + md5[0] + ".dzcdn.net/mobile/1/" + urlPart;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progressive streaming: open a Deezer audio stream, decrypt+depad chunks on
// the fly, and expose them as a Node Readable so callers can both forward
// bytes to a client and persist them in parallel (stream-while-download).
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressiveStream {
	readable: Readable;
	contentType: string;
	contentLengthPromise: Promise<number>;
	abort: () => void;
}

export function inferContentTypeFromBitrate(bitrate: number): string {
	if (bitrate === TrackFormats.FLAC) return "audio/flac";
	if (
		bitrate === TrackFormats.MP4_RA1 ||
		bitrate === TrackFormats.MP4_RA2 ||
		bitrate === TrackFormats.MP4_RA3
	) {
		return "audio/mp4";
	}
	return "audio/mpeg";
}

export function streamTrackToReadable(track: any): ProgressiveStream {
	const isCryptedStream =
		track.downloadURL.includes("/mobile/") ||
		track.downloadURL.includes("/media/");
	const blowfishKey = isCryptedStream
		? generateBlowfishKey(String(track.id))
		: null;
	const headers = { "User-Agent": USER_AGENT_HEADER };

	let resolveLen: (n: number) => void = () => {};
	const contentLengthPromise = new Promise<number>((resolve) => {
		resolveLen = resolve;
	});

	const request = got
		.stream(track.downloadURL, { headers })
		.on("response", (response) => {
			const raw = response.headers["content-length"];
			const len = parseInt(Array.isArray(raw) ? raw[0] : (raw ?? "0"), 10);
			resolveLen(isNaN(len) ? 0 : len);
		})
		.on("error", () => {
			// Resolve with 0 so callers don't hang forever
			resolveLen(0);
		});

	async function* decrypter(source: AsyncIterable<Buffer>) {
		// Deezer's BF_CBC_STRIPE format encrypts every 3rd 2048-byte stripe:
		//   stripe 0: encrypted    (decrypt with Blowfish)
		//   stripe 1: plaintext    (yield as-is)
		//   stripe 2: plaintext    (yield as-is)
		//   ...repeats...
		// Yielding per-stripe (2048 bytes) instead of per-3-stripe-block (6144)
		// gets the first audio byte to the client ~3x sooner — the consumer
		// only needs Deezer to send 2048 bytes (not 6144) before playback can begin.
		if (!isCryptedStream) {
			for await (const chunk of source) yield chunk as Buffer;
			return;
		}

		let buf = Buffer.alloc(0);
		let stripeIndex = 0;

		for await (const chunk of source) {
			buf = Buffer.concat([buf, chunk as Buffer]);
			while (buf.length >= 2048) {
				const stripe = buf.slice(0, 2048);
				buf = buf.slice(2048);
				if (stripeIndex === 0) {
					yield decryptChunk(stripe, blowfishKey);
				} else {
					yield stripe;
				}
				stripeIndex = (stripeIndex + 1) % 3;
			}
		}
		// Tail — partial final stripe. If we're at an encrypted stripe with a
		// full 2048 bytes, decrypt; otherwise yield raw (matches original behavior
		// where short partial encrypted tails were emitted unchanged).
		if (buf.length === 2048 && stripeIndex === 0) {
			yield decryptChunk(buf, blowfishKey);
		} else if (buf.length > 0) {
			yield buf;
		}
	}

	async function* depadder(source: AsyncIterable<Buffer>) {
		let isStart = true;
		for await (let chunk of source) {
			if (
				isStart &&
				chunk[0] === 0 &&
				chunk.slice(4, 8).toString() !== "ftyp"
			) {
				let i;
				for (i = 0; i < chunk.length; i++) {
					if (chunk[i] !== 0) break;
				}
				chunk = chunk.slice(i);
			}
			isStart = false;
			yield chunk;
		}
	}

	async function* combined() {
		try {
			yield* depadder(decrypter(request as unknown as AsyncIterable<Buffer>));
		} catch (e) {
			try {
				request.destroy();
			} catch {}
			throw e;
		}
	}

	const readable = Readable.from(combined());

	return {
		readable,
		contentType: inferContentTypeFromBitrate(Number(track.bitrate)),
		contentLengthPromise,
		abort: () => {
			try {
				request.destroy();
			} catch {}
			try {
				readable.destroy();
			} catch {}
		},
	};
}
