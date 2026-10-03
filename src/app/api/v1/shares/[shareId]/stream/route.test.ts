import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { makeNextRequest, makeParams } from "@/test/helpers/nextRequest";
import { StorageNotFoundError } from "@/lib/wavelet/storage/blob";

const { afterMock, streamObjectMock, startProgressiveStreamMock, serverStateMock } = vi.hoisted(() => ({
	afterMock: vi.fn(),
	streamObjectMock: vi.fn(),
	startProgressiveStreamMock: vi.fn(),
	serverStateMock: { getWaveletApp: vi.fn(), getOrLoginUserDz: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/server", async (importOriginal) => ({
	...(await importOriginal<typeof import("next/server")>()),
	after: afterMock,
}));
vi.mock("@/lib/blob-stream", () => ({ streamObject: streamObjectMock }));
vi.mock("@/lib/wavelet/progressive-stream", () => ({
	startProgressiveStream: startProgressiveStreamMock,
}));
vi.mock("@/lib/server-state", () => serverStateMock);

import { GET } from "./route";

function fakeBody() {
	return new ReadableStream({
		start(c) {
			c.enqueue(new Uint8Array([1]));
			c.close();
		},
	});
}

function share(storedTrack: unknown) {
	return {
		id: "s1",
		shareId: "abc",
		trackId: "42",
		userId: "owner",
		expiresAt: null,
		storedTrack,
	} as any;
}

const blobStored = { storagePath: "music/x.mp3", storageType: "blob" };

function arrangeProgressive() {
	const persisted = Promise.resolve();
	serverStateMock.getOrLoginUserDz.mockResolvedValue({ loggedIn: true });
	serverStateMock.getWaveletApp.mockResolvedValue({
		settings: { maxBitrate: 1 },
		// The config store now holds High: the share must follow it, not the cold-start value.
		freshSettings: vi.fn(async () => ({ maxBitrate: 3 })),
		storageProvider: {},
	});
	startProgressiveStreamMock.mockResolvedValue({
		body: fakeBody(),
		contentType: "audio/mpeg",
		contentLength: 0,
		persisted,
	});
	return persisted;
}

describe("GET /api/v1/shares/[shareId]/stream", () => {
	beforeEach(() => {
		resetPrismaMock();
		vi.resetAllMocks();
		prismaMock.sharedTrack.update.mockResolvedValue({} as any);
	});

	it("serves a Blob-cached share through the proxy with its range", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue(share(blobStored));
		streamObjectMock.mockResolvedValue({
			body: fakeBody(),
			contentLength: 10,
			contentRange: "bytes 0-9/100",
			contentType: "audio/mpeg",
			statusCode: 206,
		});

		const res = await GET(
			makeNextRequest({ headers: { range: "bytes=0-9" } }),
			makeParams({ shareId: "abc" })
		);
		expect(res.status).toBe(206);
		expect(res.headers.get("Content-Range")).toBe("bytes 0-9/100");
		expect(streamObjectMock).toHaveBeenCalledWith("music/x.mp3", "bytes=0-9");
		expect(startProgressiveStreamMock).not.toHaveBeenCalled();
	});

	it("re-streams pre-Blob s3 shares via progressive without touching Blob", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue(
			share({ storagePath: "wavelet-music/x.mp3", storageType: "s3" })
		);
		arrangeProgressive();

		const res = await GET(makeNextRequest(), makeParams({ shareId: "abc" }));
		expect(res.status).toBe(200);
		expect(streamObjectMock).not.toHaveBeenCalled();
		expect(startProgressiveStreamMock).toHaveBeenCalledWith(
			expect.objectContaining({ trackId: "42", userId: "owner" })
		);
	});

	it("detaches a missing blob and falls back to progressive", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue(share(blobStored));
		streamObjectMock.mockRejectedValue(new StorageNotFoundError("music/x.mp3"));
		arrangeProgressive();

		const res = await GET(makeNextRequest(), makeParams({ shareId: "abc" }));
		expect(res.status).toBe(200);
		expect(prismaMock.sharedTrack.update).toHaveBeenCalledWith({
			where: { id: "s1" },
			data: { storedTrackId: null },
		});
	});

	it("re-streams at the server quality saved since this instance started (was: kept the cold-start maxBitrate)", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue(share(null));
		arrangeProgressive();

		await GET(makeNextRequest(), makeParams({ shareId: "abc" }));
		expect(startProgressiveStreamMock).toHaveBeenCalledWith(
			expect.objectContaining({ bitrate: 3, settings: expect.objectContaining({ maxBitrate: 3 }) })
		);
	});

	it("hands the progressive persist promise to after() (was: fire-and-forget)", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue(share(null));
		const persisted = arrangeProgressive();

		await GET(makeNextRequest(), makeParams({ shareId: "abc" }));
		// [0] = play counter, [1] = persist pipeline
		expect(afterMock).toHaveBeenCalledTimes(2);
		const persistCallback = afterMock.mock.calls[1][0] as () => unknown;
		expect(persistCallback()).toBe(persisted);
	});
});
