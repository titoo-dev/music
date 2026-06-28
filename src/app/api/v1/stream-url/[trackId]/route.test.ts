// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authServerMock, convexApiMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);
vi.mock("@/lib/s3-stream", () => ({ getPresignedUrl: vi.fn() }));
vi.mock("@/lib/repositories/storedTracks", () => ({
	findHighestStored: vi.fn(),
	hasStored: vi.fn(),
	deleteStoredRows: vi.fn(),
	upsertStored: vi.fn(),
}));

import { GET } from "./route";
import { getPresignedUrl } from "@/lib/s3-stream";
import { findHighestStored } from "@/lib/repositories/storedTracks";

const getPresignedUrlMock = vi.mocked(getPresignedUrl);
const findHighestStoredMock = vi.mocked(findHighestStored);

describe("GET /api/v1/stream-url/[trackId]", () => {
	beforeEach(() => {
		clearSession();
		getPresignedUrlMock.mockReset();
		findHighestStoredMock.mockReset();
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
		findHighestStoredMock.mockResolvedValue(null as never);
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.url).toBeNull();
		expect(body?.data.status).toBe("not_cached");
	});

	it("returns null url when presigned URLs are globally disabled", async () => {
		setSessionUser("u1");
		process.env.DEEMIX_DISABLE_PRESIGNED_URLS = "1";
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.status).toBe("presigned_disabled");
		expect(findHighestStoredMock).not.toHaveBeenCalled();
	});

	it("returns null url when the cached row is not on s3", async () => {
		setSessionUser("u1");
		findHighestStoredMock.mockResolvedValue({
			storagePath: "/tmp/foo.mp3",
			storageType: "local",
		} as never);
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.status).toBe("unsupported_storage");
	});

	it("returns a presigned url when the track is cached on s3", async () => {
		setSessionUser("u1");
		findHighestStoredMock.mockResolvedValue({
			storagePath: "deemix-music/foo.mp3",
			storageType: "s3",
		} as never);
		getPresignedUrlMock.mockResolvedValue({
			url: "https://example.com/foo.mp3?sig=abc",
			contentType: "audio/mpeg",
		} as never);
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { url: string; contentType: string } }>(res);
		expect(body?.data.url).toContain("example.com");
		expect(body?.data.contentType).toBe("audio/mpeg");
	});

	it("returns null url when s3 reports the file is missing", async () => {
		setSessionUser("u1");
		findHighestStoredMock.mockResolvedValue({
			storagePath: "deemix-music/foo.mp3",
			storageType: "s3",
		} as never);
		const err = Object.assign(new Error("Not found"), { name: "NotFound" });
		getPresignedUrlMock.mockRejectedValue(err);
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { url: null; status: string } }>(res);
		expect(body?.data.status).toBe("file_missing");
	});
});
