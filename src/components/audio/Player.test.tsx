import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
});
