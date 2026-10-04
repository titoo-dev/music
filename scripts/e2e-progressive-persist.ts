// Manual end-to-end check of the progressive persist pipeline (B2), against a
// THROWAWAY Postgres and the DEV R2 bucket, with the live Deezer CDN.
//
//   DATABASE_URL=postgresql://audit:audit@localhost:15499/wavelet_b \
//     npx tsx scripts/e2e-progressive-persist.ts [trackId=3135556]
//
// Needs WAVELET_SERVICE_ARL (.env) and R2_* for a bucket whose name ends in
// "-dev" (.env.local). Refuses a non-local DATABASE_URL. It:
//  1. runs a persisting progressive play (disk spool → tagged R2 upload →
//     StoredTrack row) while a same-instance follower reads the same spool;
//  2. checks the response bytes equal an independent decode, the follower
//     got the same bytes, the uploaded object is the tagged MP3 wrapping
//     exactly those bytes, and the row has the C9 key + requestedBitrate;
//  3. checks a live Range request (servePlay) returns the right slice (206);
//  4. deletes the object(s) and rows it created.
// Exits 1 on any failure.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
	console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
	if (!ok) failures++;
}

async function main() {
	const trackId = process.argv[2] || "3135556";
	const dbUrl = new URL(process.env.DATABASE_URL ?? "postgresql://missing");
	if (!["localhost", "127.0.0.1"].includes(dbUrl.hostname)) {
		throw new Error(`refusing to run against a non-local database (${dbUrl.hostname})`);
	}
	if (!process.env.R2_BUCKET?.endsWith("-dev")) throw new Error("R2_BUCKET must be a -dev bucket");

	const { Deezer } = await import("@/lib/deezer");
	const { prisma } = await import("@/lib/prisma");
	const { R2StorageProvider } = await import("@/lib/wavelet/storage/R2StorageProvider");
	const { streamObject } = await import("@/lib/object-stream");
	const { DEFAULT_SETTINGS } = await import("@/lib/wavelet/settings");
	const { startProgressiveStream, followProgressiveStream, resolveStreamTrack } = await import(
		"@/lib/wavelet/progressive-stream"
	);
	const { openDecryptedStream } = await import("@/lib/wavelet/decryption");
	const { acquirePersistLease } = await import("@/lib/wavelet/storage/persist-lease");
	const { trackObjectKey } = await import("@/lib/wavelet/storage/objects");
	const { WaveletApp } = await import("@/lib/wavelet-app");
	const { servePlay } = await import("@/app/api/v1/stream-progressive/_lib/play");
	const { NextRequest } = await import("next/server");

	const dz = new Deezer();
	if (!(await dz.loginViaArl(process.env.WAVELET_SERVICE_ARL!))) throw new Error("Deezer login failed");
	console.log("login ok, hq", dz.currentUser?.can_stream_hq, "lossless", dz.currentUser?.can_stream_lossless);

	// Server quality MP3_320 with fallback: a FREE account resolves MP3_128,
	// and the row must record requestedBitrate = min(320, licence) = 128.
	const settings = { ...structuredClone(DEFAULT_SETTINGS), maxBitrate: 3, fallbackBitrate: true };
	const storage = new R2StorageProvider();
	const key = trackObjectKey(trackId, 1);
	const read = async (body: ReadableStream<Uint8Array>) => Buffer.from(await new Response(body).arrayBuffer());

	if (await storage.exists(key)) throw new Error(`${key} already exists in the dev bucket — not touching it`);
	await prisma.storedTrack.deleteMany({ where: { trackId } });
	await prisma.persistLease.deleteMany({ where: { trackId } });

	const created: string[] = [key];
	try {
		// Independent reference decode.
		const { track } = await resolveStreamTrack(dz, trackId, 3, settings);
		const ref = await openDecryptedStream(track);
		const reference = Buffer.concat(await ref.readable.toArray());
		console.log(`reference decode: ${reference.length} bytes, rangeSupported=${ref.rangeSupported}`);

		// 1. Persisting play + same-instance follower.
		const lease = await acquirePersistLease(trackId, 1);
		check("persist lease acquired", lease.acquired);
		let follower: Promise<Buffer> | null = null;
		const started = Date.now();
		const play = await startProgressiveStream({
			dz,
			trackId,
			bitrate: 3,
			settings,
			storageProvider: storage,
			userId: "e2e",
			lock: {
				release: () => {},
				publish: (shared) => {
					const f = shared ? followProgressiveStream(shared) : null;
					follower = f ? read(f.body) : null;
				},
			},
			lease: lease.acquired ? lease.lease : undefined,
		});
		console.log(`first response after ${Date.now() - started} ms, Content-Length ${play.contentLength}`);
		const body = await read(play.body);
		await play.persisted;
		console.log(`persisted after ${Date.now() - started} ms`);

		check("Content-Length equals the decoded size", play.contentLength === reference.length, `${play.contentLength} vs ${reference.length}`);
		check("response bytes equal the reference decode", body.equals(reference));
		const followed = follower ? await follower : null;
		check("same-instance follower read the same bytes", !!followed && followed.equals(body));
		check("lease released", (await prisma.persistLease.count({ where: { trackId } })) === 0);

		// 2. Row + object.
		const row = await prisma.storedTrack.findUnique({ where: { trackId_bitrate: { trackId, bitrate: 1 } } });
		check("StoredTrack row uses the C9 key", row?.storagePath === key, row?.storagePath);
		check("requestedBitrate = min(server 320, FREE licence) = 128", row?.requestedBitrate === 1, String(row?.requestedBitrate));
		const obj = await streamObject(key);
		const uploaded = await read(obj.body);
		check("row fileSize matches the object", row?.fileSize === uploaded.length, `${row?.fileSize} vs ${uploaded.length}`);
		check("object is an ID3-tagged MP3", uploaded.subarray(0, 3).toString() === "ID3" && obj.contentType === "audio/mpeg");
		// The tagger replaces any leading ID3v2 tag and trailing ID3v1 tag of
		// the source; the audio frames in between must be byte-identical.
		let audio = body;
		if (audio.subarray(0, 3).toString() === "ID3") {
			const size = ((audio[6] & 0x7f) << 21) | ((audio[7] & 0x7f) << 14) | ((audio[8] & 0x7f) << 7) | (audio[9] & 0x7f);
			audio = audio.subarray(10 + size);
		}
		if (audio.subarray(-128, -125).toString() === "TAG") audio = audio.subarray(0, -128);
		const at = uploaded.indexOf(audio.subarray(0, 4096));
		check(
			"uploaded object wraps exactly the streamed audio frames",
			at > 0 && uploaded.subarray(at, at + audio.length).equals(audio),
			`audio ${audio.length} bytes at offset ${at}`
		);

		// 3. Live Range through the route orchestration (no persist, 206).
		const app = new WaveletApp({ send() {} }, {} as never);
		app.storageProvider = storage;
		const start = 100_000;
		const end = 165_535;
		const request = new NextRequest(new Request(`http://localhost/api/v1/stream-progressive/${trackId}`, { headers: { range: `bytes=${start}-${end}` } }));
		const res = await servePlay({
			request,
			dz,
			app,
			trackId,
			userId: "e2e",
			settings,
			bitrate: 3,
			requestedBitrate: 1,
			cacheControl: "no-store",
		});
		const slice = await read(res.body!);
		check("Range answers 206", res.status === 206, String(res.status));
		check(
			"Content-Range is right",
			res.headers.get("Content-Range") === `bytes ${start}-${end}/${reference.length}`,
			res.headers.get("Content-Range") ?? ""
		);
		check("Range bytes equal the slice of the full decode", slice.equals(reference.subarray(start, end + 1)), `${slice.length} bytes`);
		const tail = new NextRequest(new Request(`http://localhost/x`, { headers: { range: `bytes=${reference.length + 10}-` } }));
		const past = await servePlay({ request: tail, dz, app, trackId, userId: "e2e", settings, bitrate: 3, requestedBitrate: 1, cacheControl: "no-store" });
		check("Range past the end answers 416", past.status === 416 && past.headers.get("Content-Range") === `bytes */${reference.length}`);
		check("a Range never persists another row", (await prisma.storedTrack.count({ where: { trackId } })) === 1);
	} finally {
		// 4. Cleanup.
		for (const k of created) await storage.deleteFile(k);
		await prisma.storedTrack.deleteMany({ where: { trackId } });
		await prisma.persistLease.deleteMany({ where: { trackId } });
		const left = await storage.exists(key).catch(() => true);
		check("cleanup: test object deleted from the dev bucket", !left);
		await prisma.$disconnect();
	}

	if (failures > 0) {
		console.log(`${failures} check(s) failed`);
		process.exit(1);
	}
	console.log("all checks passed");
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
