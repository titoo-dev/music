import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { create } from "zustand";

vi.mock("@/lib/audio-cache", () => ({
	clearCache: vi.fn(async () => {}),
	getCachedBlobUrl: vi.fn(async () => null),
	prefetchTrack: vi.fn(async () => false),
}));

import { clearCache } from "@/lib/audio-cache";
import { presignedUrls } from "./presigned-urls";
import { warmLevel, warmTrack } from "./prefetch";
import { forgetSignedInState, watchSignOut } from "./sign-out";
import { usePlayerStore } from "@/stores/usePlayerStore";

beforeEach(() => {
	vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
	vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("watchSignOut", () => {
	function store() {
		return create<{ user: { id: string } | null }>(() => ({ user: null }));
	}

	it("fires on sign-out and on an account switch, not on the first sign-in", () => {
		const s = store();
		const onSignOut = vi.fn();
		const stop = watchSignOut(s, onSignOut);
		s.setState({ user: { id: "u1" } });
		expect(onSignOut).not.toHaveBeenCalled();
		s.setState({ user: { id: "u1" } });
		expect(onSignOut).not.toHaveBeenCalled();
		s.setState({ user: null });
		expect(onSignOut).toHaveBeenCalledTimes(1);
		s.setState({ user: { id: "u2" } });
		s.setState({ user: { id: "u3" } });
		expect(onSignOut).toHaveBeenCalledTimes(2);
		stop();
		s.setState({ user: null });
		expect(onSignOut).toHaveBeenCalledTimes(2);
	});
});

describe("forgetSignedInState", () => {
	it("drops presigned URLs, refusals, warm levels and the IndexedDB audio (was: cached audio kept playing after sign-out)", async () => {
		presignedUrls.deny("t1");
		warmTrack("t2", { audio: "none" });
		expect(warmLevel("t2")).toBe("none");

		await forgetSignedInState();

		expect(presignedUrls.isDenied("t1")).toBe(false);
		expect(warmLevel("t2")).toBeNull();
		expect(clearCache).toHaveBeenCalled();
	});

	it("stops the player and forgets the queue and the resume position (was: the previous user's track stayed in the player after sign-out)", async () => {
		const track = { trackId: "t1", title: "One More Time", artist: "Daft Punk", cover: null, duration: 320 };
		usePlayerStore.setState({ currentTrack: track, queue: [track], queueIndex: 0, isPlaying: true });
		localStorage.setItem("wavelet-resume", JSON.stringify({ trackId: "t1", time: 100, ts: Date.now() }));

		await forgetSignedInState();

		const s = usePlayerStore.getState();
		expect(s.currentTrack).toBeNull();
		expect(s.queue).toEqual([]);
		expect(s.isPlaying).toBe(false);
		expect(localStorage.getItem("wavelet-resume")).toBeNull();
	});
});
