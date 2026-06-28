// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authServerMock, convexApiMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/auth-server", () => authServerMock);
vi.mock("@convex/_generated/api", () => convexApiMock);
vi.mock("@/lib/queue/stems", () => ({
	enqueueSeparation: vi.fn(),
	getJobStatus: vi.fn(),
}));
vi.mock("@/lib/repositories/stems", () => ({
	getSeparationWithFiles: vi.fn(),
	getSeparation: vi.fn(),
	upsertPendingSeparation: vi.fn(),
	getStemFile: vi.fn(),
	deleteStemFileByName: vi.fn(),
	deleteStemFiles: vi.fn(),
}));
vi.mock("@/lib/repositories/storedTracks", () => ({
	findHighestStored: vi.fn(),
	hasStored: vi.fn(),
	deleteStoredRows: vi.fn(),
	upsertStored: vi.fn(),
}));

import { GET, POST } from "./route";
import { enqueueSeparation, getJobStatus } from "@/lib/queue/stems";
import {
	getSeparationWithFiles,
	getSeparation,
	upsertPendingSeparation,
} from "@/lib/repositories/stems";
import { findHighestStored } from "@/lib/repositories/storedTracks";

const enqueueMock = vi.mocked(enqueueSeparation);
const getJobStatusMock = vi.mocked(getJobStatus);
const getSepWithFilesMock = vi.mocked(getSeparationWithFiles);
const getSepMock = vi.mocked(getSeparation);
const upsertSepMock = vi.mocked(upsertPendingSeparation);
const findHighestStoredMock = vi.mocked(findHighestStored);

const makePostRequest = (body: unknown) =>
	makeNextRequest({ method: "POST", body, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
	clearSession();
	[enqueueMock, getJobStatusMock, getSepWithFilesMock, getSepMock, upsertSepMock, findHighestStoredMock].forEach(
		(m) => m.mockReset(),
	);
});

describe("GET /api/v1/stems/[trackId]", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(401);
	});

	it("returns 404 when no separation has been requested", async () => {
		setSessionUser("u1");
		getSepWithFilesMock.mockResolvedValue(null as never);
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(404);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_FOUND");
	});

	it("returns stored progress when not processing", async () => {
		setSessionUser("u1");
		getSepWithFilesMock.mockResolvedValue({
			trackId: "1",
			status: "completed",
			mode: "six_stems",
			progress: 100,
			errorMessage: null,
			files: [
				{ stemName: "vocals", fileSize: 4_000_000 },
				{ stemName: "drums", fileSize: 5_000_000 },
			],
		} as never);
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { status: string; progress: number; files: unknown[] } }>(res);
		expect(body?.data.status).toBe("completed");
		expect(body?.data.progress).toBe(100);
		expect(body?.data.files).toHaveLength(2);
		expect(getJobStatusMock).not.toHaveBeenCalled();
	});

	it("merges live BullMQ progress when processing", async () => {
		setSessionUser("u1");
		getSepWithFilesMock.mockResolvedValue({
			trackId: "1",
			status: "processing",
			mode: "six_stems",
			progress: 25,
			errorMessage: null,
			files: [],
		} as never);
		getJobStatusMock.mockResolvedValue({ state: "active", progress: 60 } as never);
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { progress: number } }>(res);
		expect(body?.data.progress).toBe(60);
	});

	it("ignores stale BullMQ progress lower than DB", async () => {
		setSessionUser("u1");
		getSepWithFilesMock.mockResolvedValue({
			trackId: "1",
			status: "processing",
			mode: "six_stems",
			progress: 75,
			errorMessage: null,
			files: [],
		} as never);
		getJobStatusMock.mockResolvedValue({ state: "active", progress: 30 } as never);
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { progress: number } }>(res);
		expect(body?.data.progress).toBe(75);
	});
});

describe("POST /api/v1/stems/[trackId]", () => {
	it("returns 401 when not authenticated", async () => {
		const res = await POST(makePostRequest({ mode: "six_stems" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(401);
	});

	it("returns 400 when mode is missing", async () => {
		setSessionUser("u1");
		const res = await POST(makePostRequest({}), makeParams({ trackId: "1" }));
		expect(res.status).toBe(400);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("INVALID_BODY");
	});

	it("returns 400 when mode is invalid", async () => {
		setSessionUser("u1");
		const res = await POST(makePostRequest({ mode: "bogus" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(400);
	});

	it("returns 409 when the track is not cached", async () => {
		setSessionUser("u1");
		findHighestStoredMock.mockResolvedValue(null as never);
		const res = await POST(makePostRequest({ mode: "six_stems" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(409);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("TRACK_NOT_CACHED");
		expect(enqueueMock).not.toHaveBeenCalled();
	});

	it("returns 200 for an existing completed separation without re-queueing", async () => {
		setSessionUser("u1");
		findHighestStoredMock.mockResolvedValue({ bitrate: 320 } as never);
		getSepMock.mockResolvedValue({ status: "completed", mode: "six_stems", progress: 100 } as never);
		const res = await POST(makePostRequest({ mode: "six_stems" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		expect(enqueueMock).not.toHaveBeenCalled();
		expect(upsertSepMock).not.toHaveBeenCalled();
	});

	it("returns 202 for an existing processing separation without re-queueing", async () => {
		setSessionUser("u1");
		findHighestStoredMock.mockResolvedValue({ bitrate: 320 } as never);
		getSepMock.mockResolvedValue({ status: "processing", mode: "six_stems", progress: 40 } as never);
		const res = await POST(makePostRequest({ mode: "six_stems" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(202);
		expect(enqueueMock).not.toHaveBeenCalled();
	});

	it("upserts and enqueues a new separation when none exists", async () => {
		setSessionUser("u1");
		findHighestStoredMock.mockResolvedValue({ bitrate: 320 } as never);
		getSepMock.mockResolvedValue(null as never);
		upsertSepMock.mockResolvedValue({ trackId: "1", status: "pending", mode: "six_stems", progress: 0 } as never);
		enqueueMock.mockResolvedValue({ id: "1" } as never);
		const res = await POST(makePostRequest({ mode: "six_stems" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(202);
		expect(enqueueMock).toHaveBeenCalledWith("1", "six_stems");
		expect(upsertSepMock).toHaveBeenCalledOnce();
	});

	it("re-enqueues when the previous separation failed", async () => {
		setSessionUser("u1");
		findHighestStoredMock.mockResolvedValue({ bitrate: 320 } as never);
		getSepMock.mockResolvedValue({ status: "failed", mode: "two_stems", progress: 0 } as never);
		upsertSepMock.mockResolvedValue({ trackId: "1", status: "pending", mode: "two_stems", progress: 0 } as never);
		enqueueMock.mockResolvedValue({ id: "1" } as never);
		const res = await POST(makePostRequest({ mode: "two_stems" }), makeParams({ trackId: "1" }));
		expect(res.status).toBe(202);
		expect(enqueueMock).toHaveBeenCalledWith("1", "two_stems");
	});
});
