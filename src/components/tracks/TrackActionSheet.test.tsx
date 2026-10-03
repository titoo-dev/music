import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TrackActionSheet } from "./TrackActionSheet";
import { useTrackActionStore } from "@/stores/useTrackActionStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";

const PLAYER = usePlayerStore.getState();
const playing = { trackId: "9", title: "Current", artist: "Someone", artistId: null, cover: null, duration: 100 };
const info = { id: "1", title: "Nofy", artist: "Hosea Marlyn", artistId: "77", albumId: "5", albumTitle: "Fitiavana", cover: null, duration: 295 };

beforeEach(() => {
	vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
	usePlayerStore.setState(PLAYER, true);
	usePlayerStore.setState({ currentTrack: playing, queue: [playing], queueIndex: 0 });
	useAuthStore.setState({ isAuthenticated: true });
	useTrackActionStore.setState({ open: true, track: info, callbacks: {} });
});

describe("TrackActionSheet", () => {
	it("shows the header card with the title, artist and duration pill", () => {
		render(<TrackActionSheet />);
		expect(screen.getByText("Nofy")).toBeInTheDocument();
		expect(screen.getAllByText("Hosea Marlyn")[0]).toBeInTheDocument();
		expect(screen.getByText("4:55")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Save to library" })).toBeInTheDocument();
	});

	it("offers the quick tiles and queues the track next", async () => {
		render(<TrackActionSheet />);
		for (const name of ["Play next", "Add to queue", "Add to playlist", "Share track"]) {
			expect(screen.getByRole("button", { name })).toBeInTheDocument();
		}
		await userEvent.click(screen.getByRole("button", { name: "Play next" }));
		expect(usePlayerStore.getState().queue.map((t) => t.trackId)).toEqual(["9", "1"]);
		expect(useTrackActionStore.getState().open).toBe(false);
	});

	it("hides the queue tiles for the track that is playing and marks it Playing", () => {
		useTrackActionStore.setState({ track: { ...info, id: "9" } });
		render(<TrackActionSheet />);
		expect(screen.queryByRole("button", { name: "Play next" })).toBeNull();
		expect(screen.getByText("Playing")).toBeInTheDocument();
	});

	it("hides the account tiles when signed out", () => {
		useAuthStore.setState({ isAuthenticated: false });
		render(<TrackActionSheet />);
		expect(screen.queryByRole("button", { name: "Add to playlist" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Save to library" })).toBeNull();
	});

	it("links to the album and the artist and runs the context delete", async () => {
		const onDelete = vi.fn();
		useTrackActionStore.setState({ callbacks: { onDelete } });
		render(<TrackActionSheet />);
		expect(screen.getByRole("link", { name: /Go to album/ })).toHaveAttribute("href", "/album?id=5");
		expect(screen.getByRole("link", { name: /Go to artist/ })).toHaveAttribute("href", "/artist?id=77");
		await userEvent.click(screen.getByRole("button", { name: "Remove from playlist" }));
		expect(onDelete).toHaveBeenCalled();
	});

	it("is not hidden on desktop (was: md:hidden, so right-click on a row did nothing on desktop)", () => {
		render(<TrackActionSheet />);
		const popup = document.querySelector("[data-slot=sheet-content]");
		expect(popup).not.toBeNull();
		expect(popup!.className).not.toMatch(/\bmd:hidden\b/);
	});

	it("opens the playlist picker from the Playlist tile", async () => {
		render(<TrackActionSheet />);
		await userEvent.click(screen.getByRole("button", { name: "Add to playlist" }));
		expect(await screen.findByText("New playlist")).toBeInTheDocument();
	});
});
