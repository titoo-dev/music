import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";
import { StorageNotFoundError, StorageUnavailableError } from "@/lib/wavelet/storage/blob";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/blob-stream", () => ({
	streamObject: vi.fn(),
}));

import { GET } from "./route";
import { streamObject } from "@/lib/blob-stream";

const streamObjectMock = vi.mocked(streamObject);

const blobRow = {
	id: "x",
	trackId: "1",
	bitrate: 320,
	storagePath: "music/foo.mp3",
	storageType: "blob",
} as any;

function fakeBody() {
	return new ReadableStream({
		start(c) {
			c.enqueue(new Uint8Array([1, 2, 3]));
			c.close();
		},
	});
}

describe("GET /api/v1/stream/[trackId]", () => {
	beforeEach(() => {
		resetPrismaMock();
		clearSession();
		streamObjectMock.mockReset();
	});

	it("returns 401 when not authenticated", async () => {
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
	});

	it("redirects to /stream-progressive when no StoredTrack row exists", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(null);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/api/v1/stream-progressive/1");
		expect(streamObjectMock).not.toHaveBeenCalled();
	});

	it.each(["s3", "local"])(
		"drops pre-Blob %s rows and 302s to /stream-progressive (was: 400 UNSUPPORTED_STORAGE)",
		async (storageType) => {
			setSessionUser("u1");
			prismaMock.storedTrack.findFirst.mockResolvedValue({ ...blobRow, storageType });

			const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
			expect(res.status).toBe(302);
			expect(res.headers.get("Location")).toBe("/api/v1/stream-progressive/1");
			expect(prismaMock.storedTrack.deleteMany).toHaveBeenCalledWith({
				where: { trackId: "1" },
			});
			expect(streamObjectMock).not.toHaveBeenCalled();
		}
	);

	it("returns 200 + cache headers when streaming without a Range header", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(blobRow);
		streamObjectMock.mockResolvedValue({
			body: fakeBody(),
			contentLength: 12345,
			contentType: "audio/mpeg",
			statusCode: 200,
		} as any);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
		expect(res.headers.get("Content-Length")).toBe("12345");
		expect(res.headers.get("Accept-Ranges")).toBe("bytes");
		expect(res.headers.get("Cache-Control")).toBe("private, max-age=86400");
		expect(res.headers.get("Content-Range")).toBeNull();
		// No Range was sent — streamObject called without a range.
		expect(streamObjectMock).toHaveBeenCalledWith("music/foo.mp3", undefined);
	});

	it("returns the streamObject statusCode + Content-Range when a Range header is present", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(blobRow);
		streamObjectMock.mockResolvedValue({
			body: fakeBody(),
			contentLength: 100,
			contentRange: "bytes 0-99/12345",
			contentType: "audio/mpeg",
			statusCode: 206,
		} as any);

		const res = await GET(
			makeNextRequest({ headers: { range: "bytes=0-99" } }),
			makeParams({ trackId: "1" })
		);
		expect(res.status).toBe(206);
		expect(res.headers.get("Content-Range")).toBe("bytes 0-99/12345");
		expect(res.headers.get("Accept-Ranges")).toBe("bytes");
		expect(streamObjectMock).toHaveBeenCalledWith("music/foo.mp3", "bytes=0-99");
	});

	it("on StorageNotFoundError: deletes stale rows and 302s to /stream-progressive", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(blobRow);
		streamObjectMock.mockRejectedValue(new StorageNotFoundError("music/foo.mp3"));

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/api/v1/stream-progressive/1");
		expect(prismaMock.storedTrack.deleteMany).toHaveBeenCalledWith({
			where: { trackId: "1" },
		});
	});

	it("still 302s when the stale-row cleanup itself fails", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(blobRow);
		prismaMock.storedTrack.deleteMany.mockRejectedValue(new Error("db down"));
		streamObjectMock.mockRejectedValue(new StorageNotFoundError("music/foo.mp3"));

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/api/v1/stream-progressive/1");
	});

	it("on StorageUnavailableError: 302 to /stream-progressive WITHOUT deleting the row", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(blobRow);
		streamObjectMock.mockRejectedValue(new StorageUnavailableError(new Error("503")));

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/api/v1/stream-progressive/1");
		expect(prismaMock.storedTrack.deleteMany).not.toHaveBeenCalled();
	});

	it("on a generic error: falls through to handleError (500 INTERNAL_ERROR)", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(blobRow);
		streamObjectMock.mockRejectedValue(new Error("kaboom"));

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("INTERNAL_ERROR");
		expect(prismaMock.storedTrack.deleteMany).not.toHaveBeenCalled();
	});
});
