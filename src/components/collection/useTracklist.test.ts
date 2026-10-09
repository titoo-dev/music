import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const fetchData = vi.fn();
vi.mock("@/utils/api", () => ({ fetchData: (...a: unknown[]) => fetchData(...a) }));

import { clearTracklistCache, useTracklist } from "./useTracklist";

const parse = (data: unknown, id: string) => ((data as { ok?: boolean })?.ok ? { id } : null);

beforeEach(() => {
	fetchData.mockReset();
	clearTracklistCache();
});

describe("useTracklist", () => {
	it("a network failure is an error with a retry, not 'not found' (NAV-24, was: permanent 'Artist not found')", async () => {
		fetchData.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce({ ok: true });
		const { result } = renderHook(() => useTracklist("artist", "1", parse));
		await waitFor(() => expect(result.current.status).toBe("error"));
		act(() => result.current.retry());
		expect(result.current.status).toBe("loading");
		await waitFor(() => expect(result.current.status).toBe("ready"));
		expect(result.current.page).toEqual({ id: "1" });
	});

	it("an empty answer is 'missing'", async () => {
		fetchData.mockResolvedValue({ ok: false });
		const { result } = renderHook(() => useTracklist("artist", "1", parse));
		await waitFor(() => expect(result.current.status).toBe("missing"));
	});

	it("Back to a page seen moments ago shows it at once, no skeleton (NAV-25, was: full reload, scroll lost)", async () => {
		fetchData.mockResolvedValue({ ok: true });
		const { result, rerender } = renderHook(({ id }) => useTracklist("artist", id, parse), { initialProps: { id: "1" } });
		await waitFor(() => expect(result.current.status).toBe("ready"));
		rerender({ id: "2" });
		await waitFor(() => expect(result.current.page).toEqual({ id: "2" }));
		fetchData.mockReturnValue(new Promise(() => {}));
		rerender({ id: "1" });
		expect(result.current.status).toBe("ready");
		expect(result.current.page).toEqual({ id: "1" });
		// …and still revalidates in the background.
		expect(fetchData).toHaveBeenLastCalledWith("content/tracklist", { id: "1", type: "artist" });
	});

	it("keeps showing the cached page when the revalidation fails", async () => {
		fetchData.mockResolvedValueOnce({ ok: true });
		const { result, rerender } = renderHook(({ id }) => useTracklist("artist", id, parse), { initialProps: { id: "1" } });
		await waitFor(() => expect(result.current.status).toBe("ready"));
		fetchData.mockRejectedValue(new TypeError("offline"));
		rerender({ id: "2" });
		await waitFor(() => expect(result.current.status).toBe("error"));
		rerender({ id: "1" });
		await act(async () => {});
		expect(result.current.status).toBe("ready");
	});
});
