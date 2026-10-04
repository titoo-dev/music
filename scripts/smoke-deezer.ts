// Live smoke test (needs WAVELET_SERVICE_ARL): login, resolve, decrypt one track,
// then check byte ranges against the full decode.
// npx tsx scripts/smoke-deezer.ts <trackId> <bitrate 1|3|9>
//
//  1. full decode via openDecryptedStream, compared with a reference decode of
//     the raw encrypted file (one decryptChunk per stripe + the old depadder);
//  2. probeTrack (bytes 0-2047) must agree with the full decode;
//  3. several decoded ranges (head, unaligned mid-file, stripe-edge crossing,
//     tail, last byte) must equal the matching slices of the full decode — or,
//     when the CDN ignores Range, openDecryptedStream must refuse with
//     RangeNotSupportedError.
// Exits 1 on any mismatch.
import "dotenv/config";
import got from "got";
import { Deezer, utils } from "@/lib/deezer";
import Track from "@/lib/wavelet/types/Track";
import { getPreferredBitrate } from "@/lib/wavelet/utils/getPreferredBitrate";
import {
	clearProbeCache,
	isCryptedStreamUrl,
	openDecryptedStream,
	probeTrack,
	RangeNotSupportedError,
} from "@/lib/wavelet/decryption";
import { decryptChunk, generateBlowfishKey } from "@/lib/wavelet/utils/crypto";
import { USER_AGENT_HEADER } from "@/lib/wavelet/utils/core";
import { formatsName } from "@/lib/wavelet/types/Track";

const STRIPE = 2048;
let failures = 0;

function check(label: string, ok: boolean, detail = "") {
	console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
	if (!ok) failures++;
}

/** Straightforward decode of the whole encrypted file: the pre-S13 algorithm. */
function referenceDecode(file: Buffer, trackId: string, crypted: boolean): Buffer {
	const key = generateBlowfishKey(trackId);
	const parts: Buffer[] = [];
	let off = 0;
	for (let i = 0; off + STRIPE <= file.length; off += STRIPE, i++) {
		const stripe = file.subarray(off, off + STRIPE);
		parts.push(crypted && i % 3 === 0 ? decryptChunk(stripe, key) : stripe);
	}
	if (off < file.length) parts.push(file.subarray(off));
	const first = parts[0];
	if (first && first[0] === 0 && first.subarray(4, 8).toString() !== "ftyp") {
		let i = 0;
		while (i < first.length && first[i] === 0) i++;
		parts[0] = first.subarray(i);
	}
	return Buffer.concat(parts);
}

async function main() {
	const dz = new Deezer();
	const ok = await dz.loginViaArl(process.env.WAVELET_SERVICE_ARL!);
	console.log("login", ok, "hq", dz.currentUser?.can_stream_hq, "lossless", dz.currentUser?.can_stream_lossless);
	const id = process.argv[2] || "3135556";
	const gw = await dz.gw.get_track_with_fallback(id);
	const track = new Track();
	track.parseEssentialData(utils.mapGwTrackToDeezer(gw));
	const br = await getPreferredBitrate(dz, track, Number(process.argv[3] || 3), true, false, "", null);
	track.bitrate = br as typeof track.bitrate;
	track.downloadURL = track.urls[formatsName[br]];
	console.log("bitrate", br, "host", new URL(track.downloadURL).host);

	// 1. Full decode
	let t0 = performance.now();
	const s = await openDecryptedStream(track);
	const parts: Buffer[] = [];
	let ttfb = 0;
	for await (const c of s.readable) {
		if (!parts.length) ttfb = performance.now() - t0;
		parts.push(c as Buffer);
	}
	const full = Buffer.concat(parts);
	const sizes = parts.map((p) => p.length);
	console.log(
		`full: upstream ${s.upstreamLength}, decoded ${full.length}, total ${s.totalLength}, rangeSupported ${s.rangeSupported}, ` +
			`head ${full.subarray(0, 4).toString("hex")}, ${parts.length} chunks (first ${sizes[0]}, ` +
			`avg ${Math.round(full.length / parts.length)}), first byte ${ttfb.toFixed(0)} ms, total ${(performance.now() - t0).toFixed(0)} ms`
	);
	check("full decode length = totalLength", full.length === s.totalLength);
	check("first chunk is at most one stripe", sizes[0] <= STRIPE);

	const raw = await got(track.downloadURL, {
		headers: { "User-Agent": USER_AGENT_HEADER },
		responseType: "buffer",
		decompress: false,
	});
	const reference = referenceDecode(raw.body, String(track.id), isCryptedStreamUrl(track.downloadURL));
	check("full decode = reference decode of the raw file", full.equals(reference), `raw ${raw.body.length} bytes`);

	// 2. Probe
	clearProbeCache();
	const probe = await probeTrack(track);
	console.log("probe", probe);
	check("probe decodedLength = full decode length", probe.decodedLength === full.length);

	// 3. Ranges
	const n = full.length;
	const pad = probe.pad;
	const mid = Math.floor(n / 2);
	const ranges: Array<[string, number, number | undefined]> = [
		["head 0-999", 0, 999],
		["mid-file unaligned", mid - 12_345 + 7, mid + 54_321],
		["crosses encrypted stripe 3", 3 * STRIPE - pad - 5, 4 * STRIPE - pad + 5],
		["tail (open-ended)", n - 777, undefined],
		["last byte", n - 1, n - 1],
	];
	if (!probe.rangeSupported) {
		const err = await openDecryptedStream(track, { start: 1000 }).catch((e) => e);
		check("CDN ignores Range → RangeNotSupportedError", err instanceof RangeNotSupportedError);
	} else {
		for (const [label, a, b] of ranges) {
			t0 = performance.now();
			const r = await openDecryptedStream(track, { start: a, end: b });
			const got_: Buffer[] = [];
			for await (const c of r.readable) got_.push(c as Buffer);
			const data = Buffer.concat(got_);
			const last = Math.min(b ?? n - 1, n - 1);
			check(
				`range ${label} [${a}-${last}]`,
				data.equals(full.subarray(a, last + 1)) && r.contentLength === data.length && r.totalLength === n,
				`${data.length} bytes, ${(performance.now() - t0).toFixed(0)} ms`
			);
		}
	}

	if (failures) {
		console.error(`${failures} check(s) failed`);
		process.exit(1);
	}
	console.log("all checks passed");
}
main().catch((e) => { console.error("FAIL", e?.name, e?.code, e?.message); process.exit(1); });
