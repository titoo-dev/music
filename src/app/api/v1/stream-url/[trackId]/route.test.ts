import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/s3-stream", () => ({
	getPresignedUrl: vi.fn(),
}));

import { GET } from "./route";
import { getPresignedUrl } from "@/lib/s3-stream";

const getPresignedUrlMock = vi.mocked(getPresignedUrl);

describe("GET /api/v1/stream-url/[trackId]", () => {
	beforeEach(() => {
		resetPrismaMock();
		clearSession();
		getPresignedUrlMock.mockReset();
		delete process.env.DEEMIX_DISABLE_PRESIGNED_URLS;
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
		process.env.DEEMIX_DISABLE_PRESIGNED_URLS = "1";

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.url).toBeNull();
		expect(body?.data.status).toBe("presigned_disabled");
		expect(prismaMock.storedTrack.findFirst).not.toHaveBeenCalled();
	});

	it("returns null url when the cached row is not on s3", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			id: "x",
			trackId: "1",
			bitrate: 320,
			storagePath: "/tmp/foo.mp3",
			storageType: "local",
		} as any);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.url).toBeNull();
		expect(body?.data.status).toBe("unsupported_storage");
	});

	it("returns a presigned url when the track is cached on s3", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			id: "x",
			trackId: "1",
			bitrate: 320,
			storagePath: "deemix-music/foo.mp3",
			storageType: "s3",
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
	});

	it("returns null url when s3 head/sign reports the file is missing", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			id: "x",
			trackId: "1",
			bitrate: 320,
			storagePath: "deemix-music/foo.mp3",
			storageType: "s3",
		} as any);
		const err: any = new Error("Not found");
		err.name = "NotFound";
		getPresignedUrlMock.mockRejectedValue(err);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.url).toBeNull();
		expect(body?.data.status).toBe("file_missing");
	});
});
