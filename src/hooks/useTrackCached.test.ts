import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTrackCached } from "./useTrackCached";

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
	vi.unstubAllGlobals();
});

describe("useTrackCached", () => {
	it("returns false when trackId is null", () => {
		const { result } = renderHook(() => useTrackCached(null));
		expect(result.current).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("flips to true when /stream-url returns a presigned URL", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(200, {
				success: true,
				data: { url: "https://example.test/x.mp3", contentType: "audio/mpeg" },
			}),
		);
		const { result } = renderHook(() => useTrackCached("T1"));
		await waitFor(() => expect(result.current).toBe(true));
	});

	it("treats presigned_disabled / unsupported_storage / file_missing as cached", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(200, {
				success: true,
				data: { url: null, status: "presigned_disabled" },
			}),
		);
		const { result } = renderHook(() => useTrackCached("T1"));
		await waitFor(() => expect(result.current).toBe(true));
	});

	it("stays false when status is 'not_cached'", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, {
				success: true,
				data: { url: null, status: "not_cached" },
			}),
		);
		const { result } = renderHook(() =>
			useTrackCached("T1", { pollIntervalMs: 50 }),
		);
		// Wait at least one poll cycle to make sure it doesn't flip on us.
		await new Promise((r) => setTimeout(r, 80));
		expect(result.current).toBe(false);
	});

	it("polls until the track becomes cached, then stops", async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: { url: null, status: "not_cached" },
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: { url: null, status: "not_cached" },
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: { url: "https://example.test/x.mp3" },
				}),
			);

		const { result } = renderHook(() =>
			useTrackCached("T1", { pollIntervalMs: 30 }),
		);

		await waitFor(() => expect(result.current).toBe(true));
		const callsAtFlip = fetchMock.mock.calls.length;
		// No further polling after we flip to cached.
		await new Promise((r) => setTimeout(r, 100));
		expect(fetchMock).toHaveBeenCalledTimes(callsAtFlip);
	});

	it("resets to false and re-checks when trackId changes", async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: { url: "https://example.test/T1.mp3" },
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: { url: null, status: "not_cached" },
				}),
			);

		const { result, rerender } = renderHook(
			({ id }: { id: string }) =>
				useTrackCached(id, { pollIntervalMs: 1_000_000 }),
			{ initialProps: { id: "T1" } },
		);
		await waitFor(() => expect(result.current).toBe(true));

		rerender({ id: "T2" });
		await waitFor(() => expect(result.current).toBe(false));
	});
});
