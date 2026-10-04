import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({ toast: vi.fn() }));

import { Player } from "./Player";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useDownloadStore, setDownloadTransport } from "@/stores/useDownloadStore";
import { useAuthStore } from "@/stores/useAuthStore";

const PLAYER = usePlayerStore.getState();
const track = { trackId: "42", title: "Pluto Projector", artist: "Rex Orange County", artistId: null, cover: null, duration: 267 };

beforeEach(() => {
	usePlayerStore.setState(PLAYER, true);
	usePlayerStore.setState({ currentTrack: track, queue: [track], queueIndex: 0, duration: 267 });
	useDownloadStore.setState({ items: [] });
	setDownloadTransport({ fetchFile: () => new Promise(() => {}), save: vi.fn() });
	useAuthStore.setState({ isAuthenticated: true });
});

function renderPlayer() {
	return render(
		<TooltipProvider>
			<Player />
		</TooltipProvider>
	);
}

describe("Player", () => {
	it("renders nothing without a current track", () => {
		usePlayerStore.setState({ currentTrack: null });
		renderPlayer();
		expect(screen.queryByRole("region", { name: "Player controls" })).toBeNull();
	});

	it("keeps Close out of the inline controls (was: close button overflowing the pill)", () => {
		renderPlayer();
		expect(screen.getByRole("region", { name: "Player controls" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Close player" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Download track" })).toBeNull();
		expect(screen.getByRole("button", { name: "More player options" })).toBeInTheDocument();
	});

	it("closes the player from the More menu", async () => {
		renderPlayer();
		await userEvent.click(screen.getByRole("button", { name: "More player options" }));
		await userEvent.click(await screen.findByRole("menuitem", { name: /Close player/ }));
		expect(usePlayerStore.getState().currentTrack).toBeNull();
	});

	it("downloads the current track from the More menu", async () => {
		renderPlayer();
		await userEvent.click(screen.getByRole("button", { name: "More player options" }));
		await userEvent.click(await screen.findByRole("menuitem", { name: /Download track/ }));
		await waitFor(() => expect(useDownloadStore.getState().items.map((i) => i.trackId)).toEqual(["42"]));
	});

	it("sets the crossfade from the More menu", async () => {
		renderPlayer();
		await userEvent.click(screen.getByRole("button", { name: "More player options" }));
		await userEvent.click(await screen.findByRole("button", { name: "3s" }));
		expect(usePlayerStore.getState().crossfadeDuration).toBe(3);
	});

	it("turns gapless playback on from the More menu, and says it waits while crossfade is on", async () => {
		renderPlayer();
		await userEvent.click(screen.getByRole("button", { name: "More player options" }));
		const item = await screen.findByRole("menuitemcheckbox", { name: /Gapless playback/ });
		expect(item).toHaveAttribute("aria-checked", "false");
		await userEvent.click(item);
		expect(usePlayerStore.getState().gapless).toBe(true);
		expect(screen.queryByText("Paused while crossfade is on")).toBeNull();
		act(() => usePlayerStore.setState({ crossfadeDuration: 3 }));
		expect(await screen.findByText("Paused while crossfade is on")).toBeInTheDocument();
	});

	it("seeks from a horizontal bar instead of the ring around the pill", () => {
		usePlayerStore.setState({ currentTime: 60 });
		renderPlayer();
		expect(screen.queryByTestId("seek-ring")).toBeNull();
		// Desktop bar (with times) + mobile bar on the pill's bottom edge.
		const sliders = screen.getAllByRole("slider", { name: "Seek" });
		expect(sliders).toHaveLength(2);
		expect(screen.getByTestId("seek-total")).toHaveTextContent("4:27");
		fireEvent.keyDown(sliders[0], { key: "ArrowRight" });
		expect(usePlayerStore.getState()._seekTo).toBe(65);
	});

	it("exposes the volume slider without widening the bar", () => {
		renderPlayer();
		const slider = screen.getByLabelText("Volume");
		expect(slider).toHaveAttribute("type", "range");
	});

	it("keeps the Mute tooltip off the volume slider (was: the tooltip popped over the slider it shares the spot with)", () => {
		renderPlayer();
		expect(screen.getByRole("button", { name: "Next track" })).toHaveAttribute("data-slot", "tooltip-trigger");
		expect(screen.getByRole("button", { name: "Mute" })).not.toHaveAttribute("data-slot", "tooltip-trigger");
	});

	it("nudges the volume with the mouse wheel over the volume control", () => {
		usePlayerStore.setState({ volume: 50 });
		renderPlayer();
		const control = screen.getByTestId("volume-control");
		fireEvent.wheel(control, { deltaY: -100 });
		expect(usePlayerStore.getState().volume).toBe(55);
		fireEvent.wheel(control, { deltaY: 100 });
		fireEvent.wheel(control, { deltaY: 100 });
		expect(usePlayerStore.getState().volume).toBe(45);
		usePlayerStore.setState({ volume: 98 });
		fireEvent.wheel(control, { deltaY: -100 });
		expect(usePlayerStore.getState().volume).toBe(100);
	});

	it("rides a wavy progress line along the phone card instead of the flat bar", () => {
		usePlayerStore.setState({ currentTime: 60 });
		renderPlayer();
		const sliders = screen.getAllByRole("slider", { name: "Seek" });
		expect(sliders[1]).toHaveAttribute("data-testid", "wave-seek");
		fireEvent.keyDown(sliders[1], { key: "ArrowRight" });
		expect(usePlayerStore.getState()._seekTo).toBe(65);
	});

	it("shows the heart only when signed in", () => {
		const { unmount } = renderPlayer();
		expect(screen.getByRole("button", { name: "Save to library" })).toBeInTheDocument();
		unmount();
		useAuthStore.setState({ isAuthenticated: false });
		renderPlayer();
		expect(screen.queryByRole("button", { name: "Save to library" })).toBeNull();
	});

	it("rings the play button while the stream buffers", () => {
		usePlayerStore.setState({ isPlaying: true, isBuffering: true });
		renderPlayer();
		expect(screen.getByTestId("player-buffering")).toBeInTheDocument();
	});

	it("opens Now Playing from the track title", async () => {
		renderPlayer();
		await userEvent.click(screen.getByText("Pluto Projector"));
		expect(usePlayerStore.getState().fullscreenOpen).toBe(true);
	});
});
