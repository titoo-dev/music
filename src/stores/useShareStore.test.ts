import { describe, it, expect, vi, beforeEach } from "vitest";
import { useShareStore } from "./useShareStore";
import { useAuthStore } from "./useAuthStore";

const fetchMock = vi.fn();

function answer(data: unknown) {
	fetchMock.mockResolvedValue({ json: async () => ({ success: true, data }) });
}

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
	useShareStore.setState({ shared: new Map(), loaded: false });
});

describe("useShareStore", () => {
	it("keeps only live links (was: an expired link showed as Active and blocked Create link)", async () => {
		const hour = 3_600_000;
		answer([
			{ shareId: "live", trackId: "1", expiresAt: new Date(Date.now() + hour).toISOString() },
			{ shareId: "dead", trackId: "2", expiresAt: new Date(Date.now() - hour).toISOString() },
			{ shareId: "forever", trackId: "3", expiresAt: null },
		]);
		await useShareStore.getState().load();
		const s = useShareStore.getState();
		expect(s.loaded).toBe(true);
		expect([...s.shared]).toEqual([
			["1", "live"],
			["3", "forever"],
		]);
	});

	it("loads once", async () => {
		answer([]);
		await useShareStore.getState().load();
		await useShareStore.getState().load();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("forgets the links on sign-out (was: the next account in the tab saw the previous one's links)", async () => {
		answer([{ shareId: "mine", trackId: "1", expiresAt: null }]);
		await useShareStore.getState().load();
		useAuthStore.getState().logout();
		expect(useShareStore.getState().shared.size).toBe(0);
		// The next account loads its own links.
		answer([{ shareId: "theirs", trackId: "2", expiresAt: null }]);
		await useShareStore.getState().load();
		expect(useShareStore.getState().get("2")).toBe("theirs");
	});

	it("adds and removes a track's link", () => {
		useShareStore.getState().add("1", "a");
		expect(useShareStore.getState().get("1")).toBe("a");
		useShareStore.getState().remove("1");
		expect(useShareStore.getState().get("1")).toBeNull();
	});
});
