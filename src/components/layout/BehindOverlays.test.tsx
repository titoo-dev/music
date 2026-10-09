import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BehindOverlays } from "./BehindOverlays";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyricsStore } from "@/stores/useLyricsStore";

const PLAYER = usePlayerStore.getState();
const LYRICS = useLyricsStore.getState();
const track = { trackId: "1", title: "t", artist: "a", cover: null, duration: 100 };

beforeEach(() => {
	usePlayerStore.setState(PLAYER, true);
	useLyricsStore.setState(LYRICS, true);
});

describe("BehindOverlays", () => {
	it("leaves the page interactive while no player surface covers it", () => {
		render(<BehindOverlays><button>Home</button></BehindOverlays>);
		expect(screen.getByTestId("behind-overlays")).not.toHaveAttribute("inert");
	});

	it("makes the page inert under Now Playing (was: Tab moved the focus into the hidden page)", () => {
		usePlayerStore.setState({ currentTrack: track });
		render(<BehindOverlays><button>Home</button></BehindOverlays>);
		act(() => usePlayerStore.setState({ fullscreenOpen: true }));
		expect(screen.getByTestId("behind-overlays")).toHaveAttribute("inert");
		act(() => usePlayerStore.setState({ fullscreenOpen: false }));
		expect(screen.getByTestId("behind-overlays")).not.toHaveAttribute("inert");
	});

	it("makes the page inert under the immersive lyrics", () => {
		render(<BehindOverlays><button>Home</button></BehindOverlays>);
		act(() => useLyricsStore.setState({ immersiveOpen: true }));
		expect(screen.getByTestId("behind-overlays")).toHaveAttribute("inert");
	});
});
