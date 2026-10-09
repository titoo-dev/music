import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
	useParams: () => ({ id: "abc" }),
	useRouter: () => ({ push, replace }),
	usePathname: () => "/my-playlists/abc",
}));
vi.mock("@/hooks/useUserPreferences", () => ({ useUserPreferences: () => ({ prefs: {}, updatePrefs: vi.fn() }) }));
vi.mock("@/hooks/usePrefetch", () => ({ usePrefetch: () => {} }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import PlaylistDetailPage from "./page";
import { useAuthStore } from "@/stores/useAuthStore";

const PLAYLIST = {
	id: "abc",
	title: "Late night private mix",
	description: null,
	tracks: [{ id: "pt1", trackId: "1", title: "Secret song", artist: "Someone", album: null, albumId: null, coverUrl: null, duration: 200, position: 0 }],
};

beforeEach(() => {
	push.mockReset();
	replace.mockReset();
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response(JSON.stringify({ success: true, data: PLAYLIST })))
	);
});

describe("my-playlists/[id] — signed out", () => {
	it("hides the playlist once signed out (NAV-06, was: private tracks stayed on screen after Log out)", async () => {
		useAuthStore.setState({ isAuthenticated: true, isLoading: false });
		render(<PlaylistDetailPage />);
		expect(await screen.findByText("Late night private mix")).toBeInTheDocument();
		act(() => useAuthStore.getState().logout());
		expect(screen.queryByText("Late night private mix")).toBeNull();
		expect(screen.queryByText("Secret song")).toBeNull();
	});

	it("asks a guest to sign in and come back (NAV-07, was: 'Playlist not found')", () => {
		useAuthStore.setState({ isAuthenticated: false, isLoading: false });
		render(<PlaylistDetailPage />);
		expect(screen.queryByText("Playlist not found")).toBeNull();
		expect(screen.getByRole("link", { name: /Sign in/ })).toHaveAttribute("href", expect.stringMatching(/^\/login/));
	});
});
