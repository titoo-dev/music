import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";
import { StorageNotFoundError } from "@/lib/wavelet/storage/blob";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/blob-stream", () => ({
	getPresignedUrl: vi.fn(),
}));

import { GET } from "./route";
import { getPresignedUrl } from "@/lib/blob-stream";

const getPresignedUrlMock = vi.mocked(getPresignedUrl);

describe("GET /api/v1/stream-url/[trackId]", () => {
	beforeEach(() => {
		resetPrismaMock();
		clearSession();
		getPresignedUrlMock.mockReset();
		delete process.env.WAVELET_DISABLE_PRESIGNED_URLS;
	});

	it("returns 401 when not authenticated", async () => {
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
	});

	it("returns null url when track is not in the cache", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(null);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.url).toBeNull();
		expect(body?.data.status).toBe("not_cached");
	});

	it("returns null url when presigned URLs are globally disabled", async () => {
		setSessionUser("u1");
		process.env.WAVELET_DISABLE_PRESIGNED_URLS = "1";

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.url).toBeNull();
		expect(body?.data.status).toBe("presigned_disabled");
		expect(prismaMock.storedTrack.findFirst).not.toHaveBeenCalled();
	});

	it("returns null url when the cached row predates Blob (s3 / local)", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			id: "x",
			trackId: "1",
			bitrate: 320,
			storagePath: "wavelet-music/foo.mp3",
			storageType: "s3",
		} as any);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.url).toBeNull();
		expect(body?.data.status).toBe("unsupported_storage");
		expect(getPresignedUrlMock).not.toHaveBeenCalled();
	});

	it("returns a presigned url when the track is cached in Blob", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			id: "x",
			trackId: "1",
			bitrate: 320,
			storagePath: "music/foo.mp3",
			storageType: "blob",
		} as any);
		getPresignedUrlMock.mockResolvedValue({
			url: "https://example.com/foo.mp3?sig=abc",
			contentType: "audio/mpeg",
		} as any);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { url: string; contentType: string } }>(res);
		expect(body?.data.url).toContain("example.com");
		expect(body?.data.contentType).toBe("audio/mpeg");
		expect(getPresignedUrlMock).toHaveBeenCalledWith("music/foo.mp3", 900);
	});

	it("returns null url when signing reports the blob is missing", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			id: "x",
			trackId: "1",
			bitrate: 320,
			storagePath: "music/foo.mp3",
			storageType: "blob",
		} as any);
		getPresignedUrlMock.mockRejectedValue(new StorageNotFoundError("music/foo.mp3"));

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.url).toBeNull();
		expect(body?.data.status).toBe("file_missing");
	});

	it("surfaces other signing failures as 500 INTERNAL_ERROR", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			id: "x",
			trackId: "1",
			bitrate: 320,
			storagePath: "music/foo.mp3",
			storageType: "blob",
		} as any);
		getPresignedUrlMock.mockRejectedValue(new Error("No token found"));

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(500);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("INTERNAL_ERROR");
	});
});
