// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock BullMQ at the module level. We capture every Queue construction +
// every queue.add call so the tests can assert on what we sent.

const queueAddMock = vi.fn();
const queueGetJobMock = vi.fn();

vi.mock("bullmq", () => {
	class FakeQueue {
		add = queueAddMock;
		getJob = queueGetJobMock;
	}
	return { Queue: FakeQueue };
});

vi.mock("ioredis", () => {
	class FakeRedis {
		on() {}
		quit() {}
	}
	return { default: FakeRedis, Redis: FakeRedis };
});

beforeEach(() => {
	vi.resetModules();
	queueAddMock.mockReset();
	queueGetJobMock.mockReset();
	process.env.REDIS_URL = "redis://localhost:6379";
});

describe("enqueueSeparation", () => {
	it("does not pass a numeric or colon-containing jobId to BullMQ (was: Error 'Custom Id cannot be integers' / 'cannot contain :' on Deezer track IDs)", async () => {
		const { enqueueSeparation } = await import("./stems");
		await enqueueSeparation("4828137", "six_stems");

		expect(queueAddMock).toHaveBeenCalledTimes(1);
		const [, , options] = queueAddMock.mock.calls[0];
		expect(options).toBeDefined();
		const jobId = (options as { jobId: string }).jobId;
		// BullMQ rejects custom IDs that parse as integers OR contain `:` —
		// guard against anyone breaking the prefix shape.
		expect(/^\d+$/.test(jobId)).toBe(false);
		expect(jobId).not.toContain(":");
		// And it must still be deterministic on trackId (so dedup works).
		expect(jobId).toContain("4828137");
	});

	it("passes the right name + payload + dedup id", async () => {
		const { enqueueSeparation } = await import("./stems");
		await enqueueSeparation("4828137", "two_stems");

		const [name, data, options] = queueAddMock.mock.calls[0];
		expect(name).toBe("separate");
		expect(data).toEqual({ trackId: "4828137", mode: "two_stems" });
		expect((options as { jobId: string }).jobId).toBe("track-4828137");
	});

	it("uses a different jobId per trackId", async () => {
		const { enqueueSeparation } = await import("./stems");
		await enqueueSeparation("123", "six_stems");
		await enqueueSeparation("456", "six_stems");

		const ids = queueAddMock.mock.calls.map(
			(c) => (c[2] as { jobId: string }).jobId,
		);
		expect(ids).toEqual(["track-123", "track-456"]);
	});

	it("throws when REDIS_URL is unset", async () => {
		delete process.env.REDIS_URL;
		const { enqueueSeparation } = await import("./stems");
		await expect(enqueueSeparation("123", "six_stems")).rejects.toThrow(
			/REDIS_URL/,
		);
	});
});

describe("getJobStatus", () => {
	it("looks up the job by the prefixed id (mirrors enqueue)", async () => {
		queueGetJobMock.mockResolvedValue({
			progress: 30,
			getState: vi.fn().mockResolvedValue("active"),
			failedReason: undefined,
		});

		const { getJobStatus } = await import("./stems");
		await getJobStatus("4828137");

		expect(queueGetJobMock).toHaveBeenCalledWith("track-4828137");
	});

	it("returns null when the job does not exist", async () => {
		queueGetJobMock.mockResolvedValue(undefined);

		const { getJobStatus } = await import("./stems");
		const result = await getJobStatus("4828137");
		expect(result).toBeNull();
	});

	it("returns shape { state, progress, failedReason }", async () => {
		queueGetJobMock.mockResolvedValue({
			progress: 42,
			getState: vi.fn().mockResolvedValue("active"),
			failedReason: undefined,
		});

		const { getJobStatus } = await import("./stems");
		const result = await getJobStatus("4828137");
		expect(result).toEqual({
			state: "active",
			progress: 42,
			failedReason: undefined,
		});
	});
});
