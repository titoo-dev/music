import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { leavePlayer } from "./leave-player";

describe("leavePlayer", () => {
	beforeEach(() => {
		usePlayerStore.setState({ fullscreenOpen: true, queuePanelOpen: true });
		useLyricsStore.setState({ visible: true, immersiveOpen: true });
	});

	it("closes every player overlay so the linked page shows (was: artist page opened behind Now Playing)", () => {
		leavePlayer();
		expect(usePlayerStore.getState()).toMatchObject({ fullscreenOpen: false, queuePanelOpen: false });
		expect(useLyricsStore.getState()).toMatchObject({ visible: false, immersiveOpen: false });
	});
});
