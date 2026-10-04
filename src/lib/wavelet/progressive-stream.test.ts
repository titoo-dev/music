// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Readable } from "stream";
import fs from "fs";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

const { openMock, probeMock, preferredMock, coverMock, tagMock } = vi.hoisted(() => ({
	openMock: vi.fn(),
	probeMock: vi.fn(),
	preferredMock: vi.fn(),
	coverMock: vi.fn(),
	tagMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("./decryption", () => ({
	openDecryptedStream: openMock,
	probeTrack: probeMock,
	inferContentTypeFromBitrate: (b: number) => (b === 9 ? "audio/flac" : "audio/mpeg"),
}));
vi.mock("./utils/getPreferredBitrate", () => ({ getPreferredBitrate: preferredMock }));
vi.mock("./cache/metadata-cache", () => ({ fetchCoverImage: coverMock }));
vi.mock("./utils/downloadUtils", () => ({ tagTrackBuffer: tagMock }));

import {
	startProgressiveStream,
	followProgressiveStream,
	classifyStreamError,
	resolveStreamTrack,
	probeProgressiveStream,
	type SharedSpool,
} from "./progressive-stream";
import Track from "./types/Track";
import { gwTrackCache, gwTrackKey } from "./cache/deezer-track-cache";
import {
	TruncatedStreamError,
	UpstreamHttpError,
	UpstreamTimeoutError,
	RangeNotSatisfiableError,
} from "./stream-errors";
import { TrackUnavailableError, PreferredBitrateNotFound } from "./errors";
import { DEFAULT_SETTINGS } from "./settings";
import type { Settings } from "./types/Settings";
import type { Deezer } from "@/lib/deezer";

const settings = { ...DEFAULT_SETTINGS, maxBitrate: 3 } as Settings;

function gwTrack(id: number) {
	return { SNG_ID: id, SNG_TITLE: "T", TRACK_TOKEN: `tok-${id}`, EXPLICIT_TRACK_CONTENT: {}, MEDIA: [] };
}

function fakeDz(user: { id?: number; can_stream_hq?: boolean; can_stream_lossless?: boolean } = { id: 7 }) {
	return {
		currentUser: user,
		gw: { get_track_with_fallback: vi.fn(async (id: string) => gwTrack(Number(id))) },
	} as unknown as Deezer & { gw: { get_track_with_fallback: ReturnType<typeof vi.fn> } };
}

interface FakeStreamOpts {
	total?: number | null;
	error?: Error;
	failAt?: number;
	rangeSupported?: boolean;
}

function fakeStream(chunks: Buffer[], opts: FakeStreamOpts = {}) {
	const sum = chunks.reduce((n, c) => n + c.length, 0);
	const total = opts.total === undefined ? sum : opts.total;
	async function* gen() {
		for (let i = 0; i < chunks.length; i++) {
			if (opts.error && i === (opts.failAt ?? 0)) throw opts.error;
			yield chunks[i];
		}
	}
	const readable = Readable.from(gen(), { objectMode: true });
	return {
		readable,
		contentType: "audio/mpeg",
		start: 0,
		end: total ? total - 1 : null,
		contentLength: total,
		totalLength: total,
		upstreamLength: total,
		rangeSupported: opts.rangeSupported ?? true,
		abort: vi.fn(() => readable.destroy()),
	};
}

const AUDIO = [Buffer.from("first-stripe"), Buffer.alloc(70_000, 7), Buffer.from("tail")];
const AUDIO_BYTES = Buffer.concat(AUDIO);

function provider() {
	return {
		writeFile: vi.fn<(key: string, data: Buffer) => Promise<void>>(async () => {}),
		deleteFile: vi.fn<(key: string) => Promise<void>>(async () => {}),
	};
}

async function readBody(body: ReadableStream<Uint8Array>): Promise<Buffer> {
	return Buffer.from(await new Response(body).arrayBuffer());
}

function start(over: Partial<Parameters<typeof startProgressiveStream>[0]> = {}) {
	const storageProvider = provider();
	const lock = { release: vi.fn(), publish: vi.fn<(s: SharedSpool | null) => void>() };
	const lease = { release: vi.fn(async () => {}) };
	const dz = fakeDz();
	const promise = startProgressiveStream({
		dz,
		trackId: "42",
		bitrate: 3,
		settings,
		storageProvider: storageProvider as never,
		userId: "u1",
		lock,
		lease,
		enrichmentWaitMs: 200,
		...over,
	});
	return { promise, storageProvider, lock, lease, dz };
}

let parseSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	resetPrismaMock();
	openMock.mockReset();
	probeMock.mockReset();
	preferredMock.mockReset();
	coverMock.mockReset();
	tagMock.mockReset();
	preferredMock.mockImplementation(async (_dz, track: Track, bitrate: number) => {
		const b = Math.min(bitrate, 3);
		track.urls[b === 3 ? "MP3_320" : "MP3_128"] = "https://cdn/x";
		return b;
	});
	coverMock.mockResolvedValue(Buffer.from("cover"));
	tagMock.mockImplementation(async (_ext, data: Buffer) => Buffer.concat([Buffer.from("ID3"), data]));
	parseSpy = vi.spyOn(Track.prototype, "parseData").mockImplementation(async function (this: Track) {
		return this;
	});
	vi.spyOn(Track.prototype, "applySettings").mockImplementation(() => {});
	prismaMock.storedTrack.findUnique.mockResolvedValue(null);
	prismaMock.storedTrack.count.mockResolvedValue(0);
	for (const id of [7, 8, 9]) for (const t of ["42", "43"]) gwTrackCache.delete(gwTrackKey(id, t));
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("persisting play (disk-first)", () => {
	it("streams the decrypted bytes and uploads them under tracks/{trackId}/{bitrate}{ext} (was: music/{artist} - {title}.mp3 shared by every version and bitrate)", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, storageProvider } = start();
		const res = await promise;

		expect(res.contentLength).toBe(AUDIO_BYTES.length);
		expect(res.totalLength).toBe(AUDIO_BYTES.length);
		expect(res.rangeSupported).toBe(true);
		expect((await readBody(res.body)).equals(AUDIO_BYTES)).toBe(true);
		await res.persisted;

		expect(storageProvider.writeFile).toHaveBeenCalledOnce();
		const [key, data] = storageProvider.writeFile.mock.calls[0];
		expect(key).toBe("tracks/42/3.mp3");
		expect(data.equals(Buffer.concat([Buffer.from("ID3"), AUDIO_BYTES]))).toBe(true);
		expect(prismaMock.storedTrack.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { trackId_bitrate: { trackId: "42", bitrate: 3 } },
				create: expect.objectContaining({ storagePath: "tracks/42/3.mp3", storageType: "r2", fileSize: data.length }),
			})
		);
	});

	it("records requestedBitrate = min(server quality, persisting account's licence)", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const free = start({ bitrate: 9, dz: fakeDz({ id: 7, can_stream_hq: false, can_stream_lossless: false }) });
		await (await free.promise).persisted;
		expect(prismaMock.storedTrack.upsert.mock.calls[0][0].create).toMatchObject({ bitrate: 3, requestedBitrate: 1 });

		openMock.mockResolvedValue(fakeStream(AUDIO));
		const hq = start({ bitrate: 9, dz: fakeDz({ id: 8, can_stream_hq: true, can_stream_lossless: false }) });
		await (await hq.promise).persisted;
		expect(prismaMock.storedTrack.upsert.mock.calls[1][0].create).toMatchObject({ requestedBitrate: 3 });
	});

	it("never tags, uploads or records a truncated stream, and cleans up (was: a truncated track was uploaded and served forever)", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO, { error: new TruncatedStreamError(100_000, 70_000), failAt: 2 }));
		const { promise, storageProvider, lock, lease } = start();
		const res = await promise;
		const shared = lock.publish.mock.calls[0][0] as SharedSpool;

		await expect(readBody(res.body)).rejects.toBeInstanceOf(TruncatedStreamError);
		await res.persisted;
		expect(tagMock).not.toHaveBeenCalled();
		expect(storageProvider.writeFile).not.toHaveBeenCalled();
		expect(prismaMock.storedTrack.upsert).not.toHaveBeenCalled();
		expect(lock.release).toHaveBeenCalledOnce();
		expect(lease.release).toHaveBeenCalledOnce();
		await new Promise((r) => setTimeout(r, 50));
		expect(fs.existsSync(shared.spool.path)).toBe(false);
	});

	it("refuses a stream that ends cleanly but short of its announced length", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO, { total: AUDIO_BYTES.length + 10 }));
		const { promise, storageProvider } = start();
		const res = await promise;
		await readBody(res.body).catch(() => {});
		await res.persisted;
		expect(storageProvider.writeFile).not.toHaveBeenCalled();
	});

	it("refuses an empty stream", async () => {
		openMock.mockResolvedValue(fakeStream([], { total: null }));
		const { promise, storageProvider } = start();
		await (await promise).persisted;
		expect(storageProvider.writeFile).not.toHaveBeenCalled();
	});

	it("uploads untagged when enrichment fails (was: any enrichment error meant the track was never cached)", async () => {
		parseSpy.mockRejectedValue(new Error("deezer api 500"));
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, storageProvider } = start();
		await (await promise).persisted;

		expect(tagMock).not.toHaveBeenCalled();
		const data = storageProvider.writeFile.mock.calls[0][1];
		expect(data.equals(AUDIO_BYTES)).toBe(true);
		expect(prismaMock.storedTrack.upsert).toHaveBeenCalledOnce();
	});

	it("uploads untagged when enrichment is still running after the wait", async () => {
		parseSpy.mockImplementation(() => new Promise(() => {}));
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, storageProvider } = start({ enrichmentWaitMs: 20 });
		await (await promise).persisted;
		expect((storageProvider.writeFile.mock.calls[0][1]).equals(AUDIO_BYTES)).toBe(true);
	});

	it("uploads untagged when tagging throws", async () => {
		tagMock.mockRejectedValue(new Error("bad frame"));
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, storageProvider } = start();
		await (await promise).persisted;
		expect((storageProvider.writeFile.mock.calls[0][1]).equals(AUDIO_BYTES)).toBe(true);
	});

	it("embeds the cover fetched in memory (was: covers were written to /tmp/wavelet-imgs and never cleaned)", async () => {
		parseSpy.mockImplementation(async function (this: Track) {
			this.album = { pic: { getURL: () => "https://cover/800.jpg" } } as never;
			return this;
		});
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise } = start();
		await (await promise).persisted;
		expect(coverMock).toHaveBeenCalledWith("https://cover/800.jpg");
		expect(tagMock.mock.calls[0][4]).toEqual(Buffer.from("cover"));
	});

	it("keeps persisting while the listener never reads (was: a paused <audio> stalled the upload until the function timed out)", async () => {
		openMock.mockResolvedValue(fakeStream([...AUDIO, Buffer.alloc(500_000, 1)]));
		const { promise, storageProvider } = start();
		const res = await promise;
		await res.persisted; // nobody reads res.body
		expect(storageProvider.writeFile).toHaveBeenCalledOnce();
		await res.body.cancel();
	});

	it("removes the spool once the upload is done and the listener is gone (was: /tmp temp files leaked)", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, lock } = start();
		const res = await promise;
		const shared = lock.publish.mock.calls[0][0] as SharedSpool;
		await readBody(res.body);
		await res.persisted;
		await new Promise((r) => setTimeout(r, 50));
		expect(fs.existsSync(shared.spool.path)).toBe(false);
	});

	it("keeps going (and cleans up) when the upload fails", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, storageProvider, lock, lease } = start();
		storageProvider.writeFile.mockRejectedValue(new Error("R2 down"));
		const res = await promise;
		await readBody(res.body);
		await res.persisted;
		expect(prismaMock.storedTrack.upsert).not.toHaveBeenCalled();
		expect(lock.release).toHaveBeenCalledOnce();
		expect(lease.release).toHaveBeenCalledOnce();
	});

	it("still settles when releasing the lease fails", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, lease } = start();
		lease.release.mockRejectedValue(new Error("db"));
		await expect((await promise).persisted).resolves.toBeUndefined();
	});

	it("drops the legacy object of a re-persisted row unless another row still uses it", async () => {
		prismaMock.storedTrack.findUnique.mockResolvedValue({ storagePath: "music/A - T.mp3" });
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const first = start();
		await (await first.promise).persisted;
		expect(first.storageProvider.deleteFile).toHaveBeenCalledWith("music/A - T.mp3");
		expect(prismaMock.storedTrack.count).toHaveBeenCalledWith({ where: { storagePath: "music/A - T.mp3" } });

		prismaMock.storedTrack.count.mockResolvedValue(1);
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const second = start();
		await (await second.promise).persisted;
		expect(second.storageProvider.deleteFile).not.toHaveBeenCalled();
	});

	it("publishes the spool so a same-instance follower reads the in-progress bytes (C4)", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, lock } = start();
		const res = await promise;
		const shared = lock.publish.mock.calls[0][0] as SharedSpool;
		expect(shared).toMatchObject({ contentType: "audio/mpeg", totalLength: AUDIO_BYTES.length, rangeSupported: true });

		const follower = followProgressiveStream(shared)!;
		expect(follower.contentLength).toBe(AUDIO_BYTES.length);
		expect(follower.end).toBe(AUDIO_BYTES.length - 1);
		const [mine, theirs] = await Promise.all([readBody(res.body), readBody(follower.body)]);
		expect(theirs.equals(mine)).toBe(true);
		await res.persisted;
	});

	it("does not open a spool when the CDN refuses the stream", async () => {
		openMock.mockRejectedValue(new UpstreamHttpError(403));
		const { promise, lock } = start();
		await expect(promise).rejects.toBeInstanceOf(UpstreamHttpError);
		expect(lock.publish).not.toHaveBeenCalled();
	});

	it("opens the full stream without the request signal (the persist outlives the client)", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const controller = new AbortController();
		const { promise } = start({ signal: controller.signal });
		await (await promise).persisted;
		expect(openMock.mock.calls[0][1]).toBeUndefined();
	});
});

describe("followProgressiveStream", () => {
	it("returns null for a failed or removed spool", async () => {
		const failed = { spool: { failed: true }, contentType: "audio/mpeg", totalLength: 1, rangeSupported: true } as unknown as SharedSpool;
		expect(followProgressiveStream(failed)).toBeNull();
		const gone = { spool: { failed: false, createReader: () => null }, contentType: "audio/mpeg", totalLength: null, rangeSupported: false } as unknown as SharedSpool;
		expect(followProgressiveStream(gone)).toBeNull();
	});
});

describe("live-only streams", () => {
	it("preview mode streams at the listener's pace and persists nothing", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise, storageProvider, lock, lease } = start({ persist: false });
		const res = await promise;
		expect((await readBody(res.body)).equals(AUDIO_BYTES)).toBe(true);
		await res.persisted;
		expect(storageProvider.writeFile).not.toHaveBeenCalled();
		expect(lock.publish).not.toHaveBeenCalled();
		expect(lock.release).toHaveBeenCalled();
		expect(lease.release).toHaveBeenCalled();
		expect(parseSpy).not.toHaveBeenCalled();
	});

	it("head mode caps the body at maxBytes", async () => {
		openMock.mockResolvedValue(fakeStream(AUDIO));
		const { promise } = start({ persist: false, maxBytes: 100 });
		const res = await promise;
		expect(res.contentLength).toBe(100);
		expect((await readBody(res.body)).length).toBe(100);
	});

	it("opens a decoded range with the client's signal and never persists it (C2)", async () => {
		const ranged = { ...fakeStream([Buffer.from("abc")]), start: 10, end: 12, contentLength: 3, totalLength: 1000 };
		openMock.mockResolvedValue(ranged);
		const controller = new AbortController();
		const { promise, storageProvider } = start({ range: { start: 10, end: 12 }, signal: controller.signal });
		const res = await promise;
		expect(openMock.mock.calls[0][1]).toEqual({ signal: controller.signal, start: 10, end: 12 });
		expect(res).toMatchObject({ start: 10, end: 12, contentLength: 3, totalLength: 1000 });
		expect((await readBody(res.body)).toString()).toBe("abc");
		await res.persisted;
		expect(storageProvider.writeFile).not.toHaveBeenCalled();
	});

	it("surfaces range errors to the caller", async () => {
		openMock.mockRejectedValue(new RangeNotSatisfiableError(1000));
		const { promise } = start({ range: { start: 5000 } });
		await expect(promise).rejects.toBeInstanceOf(RangeNotSatisfiableError);
	});
});

describe("resolveStreamTrack", () => {
	it("caches the gw answer per Deezer user (was: user B reused user A's TRACK_TOKEN)", async () => {
		const a = fakeDz({ id: 7 });
		const b = fakeDz({ id: 8 });
		await resolveStreamTrack(a, "43", 3, settings);
		await resolveStreamTrack(a, "43", 3, settings);
		await resolveStreamTrack(b, "43", 3, settings);
		expect(a.gw.get_track_with_fallback).toHaveBeenCalledTimes(1);
		expect(b.gw.get_track_with_fallback).toHaveBeenCalledTimes(1);
		expect(gwTrackCache.get(gwTrackKey(8, "43"))).toMatchObject({ TRACK_TOKEN: "tok-43" });
	});

	it("rejects local tracks and tracks without a URL as unavailable", async () => {
		const dz = fakeDz();
		dz.gw.get_track_with_fallback.mockResolvedValueOnce({ ...gwTrack(-3) });
		await expect(resolveStreamTrack(dz, "-3", 3, settings)).rejects.toBeInstanceOf(TrackUnavailableError);

		preferredMock.mockResolvedValueOnce(3);
		await expect(resolveStreamTrack(dz, "42", 3, settings)).rejects.toThrow("Track URL not available");
	});
});

describe("probeProgressiveStream (C3)", () => {
	it("resolves the track and probes the CDN without opening the audio stream", async () => {
		probeMock.mockResolvedValue({ upstreamLength: 10, pad: 0, decodedLength: 10, rangeSupported: true });
		await probeProgressiveStream(fakeDz(), "42", 3, settings);
		expect(probeMock).toHaveBeenCalledWith(expect.objectContaining({ downloadURL: "https://cdn/x" }));
		expect(openMock).not.toHaveBeenCalled();
	});

	it("surfaces CDN refusals", async () => {
		probeMock.mockRejectedValue(new UpstreamHttpError(403));
		await expect(probeProgressiveStream(fakeDz(), "42", 3, settings)).rejects.toBeInstanceOf(UpstreamHttpError);
	});
});

describe("classifyStreamError", () => {
	it.each([
		[new TrackUnavailableError("x"), 422],
		[new PreferredBitrateNotFound(), 422],
		[Object.assign(new Error("x"), { name: "WrongLicense" }), 422],
		[new UpstreamHttpError(403), 422],
		[new UpstreamHttpError(404), 422],
		[new UpstreamHttpError(500), 502],
		[new UpstreamTimeoutError("connect", 5000), 502],
		[new TruncatedStreamError(2, 1), 502],
		[Object.assign(new Error('{"DATA_ERROR":"x"}'), { name: "GWAPIError" }), 422],
		[Object.assign(new Error("song.getData:: RequestError: ECONNRESET"), { name: "GWAPIError" }), 502],
		[Object.assign(new Error("socket hang up"), { name: "RequestError" }), 502],
	])("%s → %i", (error, status) => {
		const r = classifyStreamError(error);
		expect(r?.status).toBe(status);
		expect(r?.code).toBe(status === 422 ? "TRACK_UNAVAILABLE" : "UPSTREAM_ERROR");
	});

	it("leaves other errors to the generic handler", () => {
		expect(classifyStreamError(new Error("boom"))).toBeNull();
		expect(classifyStreamError("nope")).toBeNull();
	});
});
