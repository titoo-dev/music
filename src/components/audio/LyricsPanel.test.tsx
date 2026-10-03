import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LyricsPanel } from "./LyricsPanel";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";

const PLAYER = usePlayerStore.getState();
const LYRICS = useLyricsStore.getState();
const track = { trackId: "1", title: "Nofy", artist: "Hosea Marlyn", artistId: null, cover: null, duration: 200 };

beforeEach(() => {
	window.matchMedia = vi.fn().mockImplementation((q: string) => ({
		matches: true,
		media: q,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	})) as unknown as typeof window.matchMedia;
	usePlayerStore.setState(PLAYER, true);
	usePlayerStore.setState({ currentTrack: track, queue: [track], queueIndex: 0 });
	useLyricsStore.setState({ ...LYRICS, visible: true, fetchLyrics: vi.fn() }, true);
});

describe("LyricsPanel", () => {
	it("floats next to the player with the track header", () => {
		render(<LyricsPanel />);
		expect(screen.getByRole("region", { name: "Lyrics" })).toBeInTheDocument();
		expect(screen.getByText("Nofy")).toBeInTheDocument();
		expect(useLyricsStore.getState().fetchLyrics).toHaveBeenCalledWith("1", 200);
	});

	it("stays hidden while Now Playing shows the lyrics on its own stage (was: panel stacked over the fullscreen player)", () => {
		usePlayerStore.setState({ fullscreenOpen: true });
		render(<LyricsPanel />);
		expect(screen.queryByRole("region", { name: "Lyrics" })).toBeNull();
	});

	it("closes from the header button", async () => {
		render(<LyricsPanel />);
		await userEvent.click(screen.getByRole("button", { name: "Close lyrics" }));
		expect(useLyricsStore.getState().visible).toBe(false);
	});
});
