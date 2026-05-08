import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTrackActionStore, type TrackActionInfo } from "./useTrackActionStore";

const INITIAL = useTrackActionStore.getState();

beforeEach(() => {
	useTrackActionStore.setState(INITIAL, true);
});

function makeTrack(id: string, overrides: Partial<TrackActionInfo> = {}): TrackActionInfo {
	return {
		id,
		title: `Title ${id}`,
		artist: `Artist ${id}`,
		...overrides,
	};
}

describe("useTrackActionStore — initial state", () => {
	it("starts closed with no track and empty callbacks", () => {
		const s = useTrackActionStore.getState();
		expect(s.open).toBe(false);
		expect(s.track).toBeNull();
		expect(s.callbacks).toEqual({});
	});
});

describe("useTrackActionStore — openSheet()", () => {
	it("opens with a track and default empty callbacks", () => {
		const t = makeTrack("a");
		useTrackActionStore.getState().openSheet(t);
		const s = useTrackActionStore.getState();
		expect(s.open).toBe(true);
		expect(s.track).toEqual(t);
		expect(s.callbacks).toEqual({});
	});

	it("opens with custom callbacks", () => {
		const onDelete = vi.fn();
		const t = makeTrack("a");
		useTrackActionStore.getState().openSheet(t, { onDelete });
		const s = useTrackActionStore.getState();
		expect(s.open).toBe(true);
		expect(s.track).toEqual(t);
		expect(s.callbacks.onDelete).toBe(onDelete);
	});

	it("re-opening replaces the track and callbacks", () => {
		const onDeleteA = vi.fn();
		useTrackActionStore.getState().openSheet(makeTrack("a"), { onDelete: onDeleteA });
		const onDeleteB = vi.fn();
		useTrackActionStore.getState().openSheet(makeTrack("b"), { onDelete: onDeleteB });
		const s = useTrackActionStore.getState();
		expect(s.track?.id).toBe("b");
		expect(s.callbacks.onDelete).toBe(onDeleteB);
	});

	it("preserves all optional TrackActionInfo fields", () => {
		const t = makeTrack("a", {
			cover: "cover.jpg",
			duration: 180,
			albumId: "alb1",
			albumTitle: "Album One",
			artistId: "art1",
			previewUrl: "preview.mp3",
		});
		useTrackActionStore.getState().openSheet(t);
		expect(useTrackActionStore.getState().track).toEqual(t);
	});
});

describe("useTrackActionStore — closeSheet()", () => {
	it("flips open to false but does NOT clear track or callbacks", () => {
		const onDelete = vi.fn();
		useTrackActionStore.getState().openSheet(makeTrack("a"), { onDelete });
		useTrackActionStore.getState().closeSheet();
		const s = useTrackActionStore.getState();
		expect(s.open).toBe(false);
		// Existing implementation only sets `open: false`. Lock that in.
		expect(s.track?.id).toBe("a");
		expect(s.callbacks.onDelete).toBe(onDelete);
	});
});
