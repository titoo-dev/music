import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";
import { authMock, setSessionUser, clearSession } from "@/test/helpers/mockAuth";
import { makeNextRequest, makeParams, readJson } from "@/test/helpers/nextRequest";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/queue/stems", () => ({
	enqueueSeparation: vi.fn(),
	getJobStatus: vi.fn(),
}));

import { GET, POST } from "./route";
import { enqueueSeparation, getJobStatus } from "@/lib/queue/stems";

const enqueueMock = vi.mocked(enqueueSeparation);
const getJobStatusMock = vi.mocked(getJobStatus);

describe("GET /api/v1/stems/[trackId]", () => {
	beforeEach(() => {
		resetPrismaMock();
		clearSession();
		enqueueMock.mockReset();
		getJobStatusMock.mockReset();
	});

	it("returns 401 when not authenticated", async () => {
		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(401);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_AUTHENTICATED");
	});

	it("returns 404 when no separation has been requested", async () => {
		setSessionUser("u1");
		prismaMock.stemSeparation.findUnique.mockResolvedValue(null);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(404);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("NOT_FOUND");
	});

	it("returns the separation with stored progress when not processing", async () => {
		setSessionUser("u1");
		prismaMock.stemSeparation.findUnique.mockResolvedValue({
			trackId: "1",
			status: "completed",
			mode: "six_stems",
			progress: 100,
			errorMessage: null,
			files: [
				{ stemName: "vocals", fileSize: 4_000_000 },
				{ stemName: "drums", fileSize: 5_000_000 },
			],
		} as any);

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{
			data: { status: string; progress: number; files: { stemName: string }[] };
		}>(res);
		expect(body?.data.status).toBe("completed");
		expect(body?.data.progress).toBe(100);
		expect(body?.data.files).toHaveLength(2);
		expect(getJobStatusMock).not.toHaveBeenCalled();
	});

	it("merges live BullMQ progress when processing", async () => {
		setSessionUser("u1");
		prismaMock.stemSeparation.findUnique.mockResolvedValue({
			trackId: "1",
			status: "processing",
			mode: "six_stems",
			progress: 25,
			errorMessage: null,
			files: [],
		} as any);
		getJobStatusMock.mockResolvedValue({
			state: "active",
			progress: 60,
		});

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { progress: number } }>(res);
		expect(body?.data.progress).toBe(60);
	});

	it("ignores stale BullMQ progress lower than DB progress", async () => {
		setSessionUser("u1");
		prismaMock.stemSeparation.findUnique.mockResolvedValue({
			trackId: "1",
			status: "processing",
			mode: "six_stems",
			progress: 75,
			errorMessage: null,
			files: [],
		} as any);
		getJobStatusMock.mockResolvedValue({ state: "active", progress: 30 });

		const res = await GET(makeNextRequest(), makeParams({ trackId: "1" }));
		const body = await readJson<{ data: { progress: number } }>(res);
		expect(body?.data.progress).toBe(75);
	});
});

describe("POST /api/v1/stems/[trackId]", () => {
	beforeEach(() => {
		resetPrismaMock();
		clearSession();
		enqueueMock.mockReset();
		getJobStatusMock.mockReset();
	});

	const makePostRequest = (body: unknown) =>
		makeNextRequest({
			method: "POST",
			body,
			headers: { "Content-Type": "application/json" },
		});

	it("returns 401 when not authenticated", async () => {
		const res = await POST(
			makePostRequest({ mode: "six_stems" }),
			makeParams({ trackId: "1" }),
		);
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
		const res = await POST(
			makePostRequest({ mode: "bogus" }),
			makeParams({ trackId: "1" }),
		);
		expect(res.status).toBe(400);
	});

	it("returns 409 when the track has not been cached yet", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue(null);

		const res = await POST(
			makePostRequest({ mode: "six_stems" }),
			makeParams({ trackId: "1" }),
		);
		expect(res.status).toBe(409);
		const body = await readJson<{ error: { code: string } }>(res);
		expect(body?.error.code).toBe("TRACK_NOT_CACHED");
		expect(enqueueMock).not.toHaveBeenCalled();
	});

	it("returns 200 with existing completed separation without re-queueing", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			trackId: "1",
			bitrate: 320,
		} as any);
		prismaMock.stemSeparation.findUnique.mockResolvedValue({
			trackId: "1",
			status: "completed",
			mode: "six_stems",
			progress: 100,
		} as any);

		const res = await POST(
			makePostRequest({ mode: "six_stems" }),
			makeParams({ trackId: "1" }),
		);
		expect(res.status).toBe(200);
		const body = await readJson<{ data: { status: string } }>(res);
		expect(body?.data.status).toBe("completed");
		expect(enqueueMock).not.toHaveBeenCalled();
		expect(prismaMock.stemSeparation.upsert).not.toHaveBeenCalled();
	});

	it("returns 202 with existing pending separation without re-queueing", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			trackId: "1",
			bitrate: 320,
		} as any);
		prismaMock.stemSeparation.findUnique.mockResolvedValue({
			trackId: "1",
			status: "processing",
			mode: "six_stems",
			progress: 40,
		} as any);

		const res = await POST(
			makePostRequest({ mode: "six_stems" }),
			makeParams({ trackId: "1" }),
		);
		expect(res.status).toBe(202);
		expect(enqueueMock).not.toHaveBeenCalled();
	});

	it("upserts and enqueues a new separation when none exists", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			trackId: "1",
			bitrate: 320,
		} as any);
		prismaMock.stemSeparation.findUnique.mockResolvedValue(null);
		prismaMock.stemSeparation.upsert.mockResolvedValue({
			trackId: "1",
			status: "pending",
			mode: "six_stems",
			progress: 0,
		} as any);
		enqueueMock.mockResolvedValue({ id: "1" } as any);

		const res = await POST(
			makePostRequest({ mode: "six_stems" }),
			makeParams({ trackId: "1" }),
		);
		expect(res.status).toBe(202);
		expect(enqueueMock).toHaveBeenCalledWith("1", "six_stems");
		expect(prismaMock.stemSeparation.upsert).toHaveBeenCalledOnce();
	});

	it("re-enqueues when the previous separation failed", async () => {
		setSessionUser("u1");
		prismaMock.storedTrack.findFirst.mockResolvedValue({
			trackId: "1",
			bitrate: 320,
		} as any);
		prismaMock.stemSeparation.findUnique.mockResolvedValue({
			trackId: "1",
			status: "failed",
			mode: "two_stems",
			progress: 0,
		} as any);
		prismaMock.stemSeparation.upsert.mockResolvedValue({
			trackId: "1",
			status: "pending",
			mode: "two_stems",
			progress: 0,
		} as any);
		enqueueMock.mockResolvedValue({ id: "1" } as any);

		const res = await POST(
			makePostRequest({ mode: "two_stems" }),
			makeParams({ trackId: "1" }),
		);
		expect(res.status).toBe(202);
		expect(enqueueMock).toHaveBeenCalledWith("1", "two_stems");
	});
});
