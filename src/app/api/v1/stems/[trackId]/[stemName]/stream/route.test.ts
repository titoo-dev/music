import { describe, it, expect, vi, beforeEach } from "vitest";
import { authServerMock, convexApiMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);
vi.mock("@/lib/repositories/stems", () => ({
	getStemFile: vi.fn(),
	deleteStemFileByName: vi.fn(),
	getSeparationWithFiles: vi.fn(),
	getSeparation: vi.fn(),
	upsertPendingSeparation: vi.fn(),
	deleteStemFiles: vi.fn(),
}));
vi.mock("@/lib/s3-stream", () => ({
	streamObject: vi.fn(),
}));

import { GET } from "./route";
import { getStemFile, deleteStemFileByName } from "@/lib/repositories/stems";
const getStemFileMock = vi.mocked(getStemFile);
const deleteStemFileByNameMock = vi.mocked(deleteStemFileByName);
import { streamObject } from "@/lib/s3-stream";

const streamObjectMock = vi.mocked(streamObject);

function fakeBody() {
	return new ReadableStream({
		start(c) {
			c.enqueue(new Uint8Array([1, 2, 3]));
			c.close();
		},
	});
}

describe("GET /api/v1/stems/[trackId]/[stemName]/stream", () => {
	beforeEach(() => {
		getStemFileMock.mockReset();
		deleteStemFileByNameMock.mockReset();
		clearSession();
		streamObjectMock.mockReset();
	});

	it("returns 401 when not authenticated", async () => {
		const res = await GET(
			makeNextRequest(),
			makeParams({ trackId: "1", stemName: "vocals" }),
		);
		expect(res.status).toBe(401);
	});

	it("returns 404 when the stem has not been generated", async () => {
		setSessionUser("u1");
		getStemFileMock.mockResolvedValue(null);

		const res = await GET(
			makeNextRequest(),
			makeParams({ trackId: "1", stemName: "vocals" }),
		);
		expect(res.status).toBe(404);
	});

	it("returns 400 when the stem is not on s3", async () => {
		setSessionUser("u1");
		getStemFileMock.mockResolvedValue({
			trackId: "1",
			stemName: "vocals",
			storagePath: "/tmp/foo.mp3",
			storageType: "local",
		} as any);

		const res = await GET(
			makeNextRequest(),
			makeParams({ trackId: "1", stemName: "vocals" }),
		);
		expect(res.status).toBe(400);
	});

	it("streams the full object when no range header is sent", async () => {
		setSessionUser("u1");
		getStemFileMock.mockResolvedValue({
			trackId: "1",
			stemName: "vocals",
			storagePath: "deemix-music/stems/1/vocals.mp3",
			storageType: "s3",
		} as any);
		streamObjectMock.mockResolvedValue({
			body: fakeBody(),
			contentLength: 3,
			contentRange: undefined,
			contentType: "audio/mpeg",
			statusCode: 200,
		} as any);

		const res = await GET(
			makeNextRequest(),
			makeParams({ trackId: "1", stemName: "vocals" }),
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
		expect(res.headers.get("Accept-Ranges")).toBe("bytes");
		expect(streamObjectMock).toHaveBeenCalledWith("deemix-music/stems/1/vocals.mp3");
	});

	it("forwards the range header and returns 206 with Content-Range", async () => {
		setSessionUser("u1");
		getStemFileMock.mockResolvedValue({
			trackId: "1",
			stemName: "vocals",
			storagePath: "deemix-music/stems/1/vocals.mp3",
			storageType: "s3",
		} as any);
		streamObjectMock.mockResolvedValue({
			body: fakeBody(),
			contentLength: 3,
			contentRange: "bytes 0-2/100",
			contentType: "audio/mpeg",
			statusCode: 206,
		} as any);

		const res = await GET(
			makeNextRequest({ headers: { range: "bytes=0-2" } }),
			makeParams({ trackId: "1", stemName: "vocals" }),
		);
		expect(res.status).toBe(206);
		expect(res.headers.get("Content-Range")).toBe("bytes 0-2/100");
		expect(streamObjectMock).toHaveBeenCalledWith(
			"deemix-music/stems/1/vocals.mp3",
			"bytes=0-2",
		);
	});

	it("returns 404 STEM_FILE_GONE and clears the row when s3 reports missing", async () => {
		setSessionUser("u1");
		getStemFileMock.mockResolvedValue({
			trackId: "1",
			stemName: "vocals",
			storagePath: "deemix-music/stems/1/vocals.mp3",
			storageType: "s3",
		} as any);
		const err: any = new Error("Not found");
		err.name = "NotFound";
		streamObjectMock.mockRejectedValue(err);

		const res = await GET(
			makeNextRequest(),
			makeParams({ trackId: "1", stemName: "vocals" }),
		);
		expect(res.status).toBe(404);
		expect(deleteStemFileByNameMock).toHaveBeenCalledWith("1", "vocals");
	});
});
