import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Canvas isn't implemented in jsdom; the visualizer is pure decoration.
vi.mock("./AudioVisualizer", () => ({ AudioVisualizer: () => <div data-testid="visualizer" /> }));
// Embla needs real layout — a plain list keeps the covers renderable.
vi.mock("@/components/ui/carousel", () => ({
	Carousel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CarouselContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CarouselItem: ({ children }: { children: React.ReactNode }) => <div data-testid="cover-slide">{children}</div>,
}));

import { FullscreenPlayer } from "./FullscreenPlayer";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";
import { useTrackActionStore } from "@/stores/useTrackActionStore";

const PLAYER = usePlayerStore.getState();
const LYRICS = useLyricsStore.getState();
const a = { trackId: "1", title: "Nofy", artist: "Hosea Marlyn", artistId: "77", cover: "https://img/a.jpg", duration: 295 };
const b = { trackId: "2", title: "Other", artist: "Someone", artistId: null, cover: null, duration: 200 };

beforeEach(() => {
	usePlayerStore.setState(PLAYER, true);
	usePlayerStore.setState({ currentTrack: a, queue: [a], queueIndex: 0, duration: 295, currentTime: 14, fullscreenOpen: true });
	useLyricsStore.setState({ ...LYRICS, visible: false, fetchLyrics: vi.fn() }, true);
});

describe("FullscreenPlayer", () => {
	it("renders nothing while closed", () => {
		usePlayerStore.setState({ fullscreenOpen: false });
		render(<FullscreenPlayer />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("shows the immersive layout: backdrop, cover, track info, wave seek and visualizer", () => {
		render(<FullscreenPlayer />);
		expect(screen.getByRole("dialog", { name: "Now playing" })).toBeInTheDocument();
		expect(screen.getByTestId("immersive-backdrop")).toBeInTheDocument();
		expect(screen.getByTestId("cover-stage")).toBeInTheDocument();
		expect(screen.getByText("Nofy")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Hosea Marlyn" })).toHaveAttribute("href", "/artist?id=77");
		expect(screen.getByRole("slider", { name: "Seek" })).toHaveAttribute("aria-valuenow", "14");
		expect(screen.getByTestId("visualizer")).toBeInTheDocument();
	});

	it("the cover settles back when paused and comes forward when playing", async () => {
		render(<FullscreenPlayer />);
		expect(screen.getByTestId("cover-stage")).not.toHaveAttribute("data-playing");
		await userEvent.click(screen.getByRole("button", { name: "Play" }));
		expect(usePlayerStore.getState().isPlaying).toBe(true);
		expect(screen.getByTestId("cover-stage")).toHaveAttribute("data-playing", "true");
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
	});

	it("disables shuffle / repeat for a single track and toggles them with a queue", async () => {
		const { unmount } = render(<FullscreenPlayer />);
		expect(screen.getByRole("button", { name: "Shuffle" })).toBeDisabled();
		expect(screen.getByRole("button", { name: /^Repeat/ })).toBeDisabled();
		unmount();

		usePlayerStore.setState({ queue: [a, b] });
		render(<FullscreenPlayer />);
		await userEvent.click(screen.getByRole("button", { name: "Shuffle" }));
		expect(screen.getByRole("button", { name: "Shuffle" })).toHaveAttribute("aria-pressed", "true");
		await userEvent.click(screen.getByRole("button", { name: "Repeat off" }));
		expect(screen.getByRole("button", { name: /^Repeat (all|one)$/ })).toHaveAttribute("aria-pressed", "true");
	});

	it("skips to the next track", async () => {
		usePlayerStore.setState({ queue: [a, b] });
		render(<FullscreenPlayer />);
		await userEvent.click(screen.getByRole("button", { name: "Next track" }));
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("2");
		await userEvent.click(screen.getByRole("button", { name: "Previous track" }));
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("1");
	});

	it("seeks through the wave bar", () => {
		render(<FullscreenPlayer />);
		fireEvent.keyDown(screen.getByRole("slider", { name: "Seek" }), { key: "ArrowRight" });
		expect(usePlayerStore.getState().currentTime).toBe(19);
	});

	it("swaps the artwork for lyrics and back", async () => {
		render(<FullscreenPlayer />);
		await userEvent.click(screen.getByRole("button", { name: "Toggle lyrics" }));
		expect(useLyricsStore.getState().visible).toBe(true);
		expect(useLyricsStore.getState().fetchLyrics).toHaveBeenCalledWith("1", 295);
		expect(screen.getByText("Lyrics")).toBeInTheDocument();
	});

	it("opens the track action sheet from the ⋯ button and right-click", async () => {
		render(<FullscreenPlayer />);
		await userEvent.click(screen.getByRole("button", { name: "Track actions" }));
		expect(useTrackActionStore.getState().track?.id).toBe("1");
		useTrackActionStore.setState({ track: null });
		fireEvent.contextMenu(screen.getByText("Nofy"));
		expect(useTrackActionStore.getState().track?.id).toBe("1");
	});

	it("mutes from the speaker button", async () => {
		render(<FullscreenPlayer />);
		await userEvent.click(screen.getByRole("button", { name: "Mute" }));
		expect(usePlayerStore.getState().volume).toBe(0);
		expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
	});

	it("centres the Now playing eyebrow between equal-width side slots (was: pushed left by the two right-hand buttons)", () => {
		render(<FullscreenPlayer />);
		const bar = screen.getByTestId("np-topbar");
		// jsdom has no layout: lock in the symmetric 1fr | auto | 1fr track instead of measuring.
		expect(bar.className).toContain("grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
		const [left, middle, right] = Array.from(bar.children);
		expect(left).toContainElement(screen.getByRole("button", { name: "Close fullscreen player" }));
		expect(middle).toHaveTextContent("Now playing");
		expect(right).toContainElement(screen.getByRole("button", { name: "Audio settings" }));
		expect(right).toContainElement(screen.getByRole("button", { name: "Track actions" }));
	});

	it("closes from the chevron", async () => {
		render(<FullscreenPlayer />);
		await userEvent.click(screen.getByRole("button", { name: "Close fullscreen player" }));
		expect(usePlayerStore.getState().fullscreenOpen).toBe(false);
	});

	it("opens the queue on top of Now Playing from the action pill (was: closed the player first)", async () => {
		usePlayerStore.setState({ queue: [a, b] });
		render(<FullscreenPlayer />);
		await userEvent.click(screen.getByRole("button", { name: /1 up next/ }));
		expect(usePlayerStore.getState().queuePanelOpen).toBe(true);
		expect(usePlayerStore.getState().fullscreenOpen).toBe(true);
	});

	it("labels the queue pill \"Queue\" when nothing is up next", () => {
		render(<FullscreenPlayer />);
		expect(screen.getByRole("button", { name: /^Queue$/ })).toBeInTheDocument();
	});

	it("rings the play button while buffering", () => {
		usePlayerStore.setState({ isPlaying: true, isBuffering: true });
		render(<FullscreenPlayer />);
		expect(screen.getByTestId("play-buffering")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
	});

	it("shows the queue position under the eyebrow", () => {
		usePlayerStore.setState({ queue: [a, b] });
		render(<FullscreenPlayer />);
		expect(screen.getByText("Now playing")).toBeInTheDocument();
		expect(screen.getByText("1 of 2 in queue")).toBeInTheDocument();
	});
});
