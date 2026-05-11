import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStems } from "./useStems";

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("useStems — initial fetch", () => {
	it("starts in idle and stays idle on 404", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(404, { success: false, error: { code: "NOT_FOUND", message: "no" } }),
		);
		const { result } = renderHook(() => useStems("T1"));
		expect(result.current.status).toBe("idle");

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		expect(result.current.status).toBe("idle");
	});

	it("hydrates from a completed separation", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(200, {
				success: true,
				data: {
					trackId: "T1",
					status: "completed",
					mode: "six_stems",
					progress: 100,
					files: [{ stemName: "vocals", fileSize: 4_000_000 }],
				},
			}),
		);
		const { result } = renderHook(() => useStems("T1"));
		await waitFor(() => expect(result.current.status).toBe("completed"));
		expect(result.current.progress).toBe(100);
		expect(result.current.mode).toBe("six_stems");
		expect(result.current.files).toHaveLength(1);
	});

	it("does nothing when trackId is null", () => {
		const { result } = renderHook(() => useStems(null));
		expect(result.current.status).toBe("idle");
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe("useStems — requestSeparation", () => {
	it("POSTs and applies the returned state", async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse(404, { success: false, error: { code: "NOT_FOUND", message: "no" } }),
			)
			.mockResolvedValueOnce(
				jsonResponse(202, {
					success: true,
					data: {
						trackId: "T1",
						status: "pending",
						mode: "two_stems",
						progress: 0,
					},
				}),
			);

		const { result } = renderHook(() => useStems("T1"));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

		await act(async () => {
			await result.current.requestSeparation("two_stems");
		});

		expect(result.current.status).toBe("queued");
		expect(result.current.mode).toBe("two_stems");
	});

	it("captures errors from the POST without crashing the hook", async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse(404, { success: false, error: { code: "NOT_FOUND", message: "no" } }),
			)
			.mockResolvedValueOnce(
				jsonResponse(409, {
					success: false,
					error: { code: "TRACK_NOT_CACHED", message: "Play it once first." },
				}),
			);

		const { result } = renderHook(() => useStems("T1"));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

		await act(async () => {
			await result.current.requestSeparation("six_stems");
		});

		expect(result.current.status).toBe("failed");
		expect(result.current.errorMessage).toMatch(/Play it once first/);
	});
});

describe("useStems — polling", () => {
	it("polls while processing and stops on completion", async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: {
						trackId: "T1",
						status: "processing",
						mode: "six_stems",
						progress: 30,
					},
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: {
						trackId: "T1",
						status: "processing",
						mode: "six_stems",
						progress: 70,
					},
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: {
						trackId: "T1",
						status: "completed",
						mode: "six_stems",
						progress: 100,
						files: [],
					},
				}),
			);

		// Small polling interval so the test runs quickly with real timers.
		// 100ms is fast enough to be cheap, slow enough that waitFor
		// (default 50ms checks) reliably catches every transition.
		const { result } = renderHook(() =>
			useStems("T1", { pollIntervalMs: 100 }),
		);
		await waitFor(() => expect(result.current.status).toBe("completed"));
		// Three fetches: initial + two polls (one for progress 70, one for completion).
		expect(fetchMock).toHaveBeenCalledTimes(3);

		// Polling must stop on completion — give it ample time and assert no
		// more fetches happen.
		await new Promise((r) => setTimeout(r, 350));
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it("resets state to idle when trackId becomes null", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(200, {
				success: true,
				data: {
					trackId: "T1",
					status: "processing",
					mode: "six_stems",
					progress: 10,
				},
			}),
		);
		const { result, rerender } = renderHook(
			({ id }: { id: string | null }) => useStems(id),
			{ initialProps: { id: "T1" as string | null } },
		);
		await waitFor(() => expect(result.current.status).toBe("processing"));

		rerender({ id: null });
		await waitFor(() => expect(result.current.status).toBe("idle"));
		expect(result.current.progress).toBe(0);
	});
});
