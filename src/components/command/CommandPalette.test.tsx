import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("sonner", () => {
	const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), loading: vi.fn(() => "t"), dismiss: vi.fn() });
	return { toast };
});

// Skip the debounce so suggestions resolve immediately.
vi.mock("@/hooks/useDebouncedValue", () => ({ useDebouncedValue: <T,>(v: T) => v }));

const fetchData = vi.fn();
vi.mock("@/utils/api", () => ({ fetchData: (...a: unknown[]) => fetchData(...a) }));

// TrackRow pulls AudioEngine; the palette only needs its pure normalizer.
vi.mock("@/components/tracks/TrackRow", () => ({
	trackFromDeezerRaw: (raw: { SNG_ID: string; SNG_TITLE: string; ART_NAME: string }) => ({
		trackId: String(raw.SNG_ID),
		title: raw.SNG_TITLE,
		artist: raw.ART_NAME,
		cover: null,
	}),
}));

import { CommandPalette, CommandTrigger } from "./CommandPalette";
import { useCommandStore } from "@/stores/useCommandStore";
import { useDownloadStore, setDownloadTransport } from "@/stores/useDownloadStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const SUGGEST = {
	tracks: [
		{
			source: "deezer",
			sourceId: "1",
			deezerTrackId: "111",
			title: "One More Time",
			artists: ["Daft Punk"],
			artistId: "27",
			album: "Discovery",
			albumId: "302127",
			durationMs: 320000,
			coverUrl: null,
		},
	],
	albums: [
		{ source: "deezer", sourceId: "2", deezerAlbumId: "302127", title: "Discovery", artists: ["Daft Punk"], coverUrl: null },
	],
	artists: [{ source: "deezer", sourceId: "3", deezerArtistId: "27", name: "Daft Punk", imageUrl: null }],
};

const CMD_INITIAL = useCommandStore.getState();
const PLAYER_INITIAL = usePlayerStore.getState();

beforeEach(() => {
	push.mockReset();
	fetchData.mockReset();
	useCommandStore.setState(CMD_INITIAL, true);
	usePlayerStore.setState(PLAYER_INITIAL, true);
	useDownloadStore.setState({ items: [] });
	setDownloadTransport({ fetchFile: () => new Promise(() => {}), save: vi.fn() });
	useAuthStore.setState({ isAuthenticated: true });
	Element.prototype.scrollIntoView = vi.fn();
});

function openWith(query = "") {
	act(() => useCommandStore.getState().open(query));
}

describe("CommandPalette", () => {
	it("renders nothing while closed", () => {
		render(<CommandPalette />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("opens with the search input focused and closes on Escape", async () => {
		render(<CommandPalette />);
		openWith();
		const input = await screen.findByLabelText("Search");
		await waitFor(() => expect(input).toHaveFocus());
		await userEvent.keyboard("{Escape}");
		expect(useCommandStore.getState().isOpen).toBe(false);
	});

	it("shows navigation commands with an empty query and navigates on Enter", async () => {
		render(<CommandPalette />);
		openWith();
		expect(await screen.findByText("All music")).toBeInTheDocument();
		await userEvent.keyboard("{Enter}");
		expect(push).toHaveBeenCalledWith("/");
		expect(useCommandStore.getState().isOpen).toBe(false);
	});

	it("hides auth-only pages for guests", async () => {
		useAuthStore.setState({ isAuthenticated: false });
		render(<CommandPalette />);
		openWith();
		await screen.findByText("All music");
		expect(screen.queryByText("Library")).toBeNull();
	});

	it("Tab switches to the downloads view", async () => {
		render(<CommandPalette />);
		openWith();
		await screen.findByLabelText("Search");
		await userEvent.keyboard("{Tab}");
		expect(useCommandStore.getState().view).toBe("downloads");
		expect(await screen.findByText("No downloads yet")).toBeInTheDocument();
	});

	it("fetches suggestions and plays the first track on Enter", async () => {
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		expect(await screen.findByText("One More Time")).toBeInTheDocument();
		expect(fetchData).toHaveBeenCalledWith("search/suggest", { term: "daft" });
		await userEvent.keyboard("{Enter}");
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("111");
		expect(useCommandStore.getState().isOpen).toBe(false);
	});

	it("Shift+Enter downloads the active track", async () => {
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
		const items = useDownloadStore.getState().items;
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({ trackId: "111", title: "One More Time", artist: "Daft Punk" });
	});

	it("asks guests to sign in instead of downloading", async () => {
		useAuthStore.setState({ isAuthenticated: false });
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
		expect(useDownloadStore.getState().items).toHaveLength(0);
		expect(toast).toHaveBeenCalledWith("Sign in to download", expect.anything());
	});

	it("arrow keys move the selection; Enter on an album opens it", async () => {
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		await userEvent.keyboard("{ArrowDown}");
		const albumRow = screen.getByText("Discovery", { selector: "span.block.truncate.text-sm" }).closest("[role=option]");
		expect(albumRow).toHaveAttribute("aria-selected", "true");
		await userEvent.keyboard("{Enter}");
		expect(push).toHaveBeenCalledWith("/album?id=302127");
	});

	it("offers 'See all results' which opens the on-screen results", async () => {
		fetchData.mockResolvedValue({ tracks: [], albums: [], artists: [] });
		render(<CommandPalette />);
		openWith("nothing here");
		const row = await screen.findByText("See all results for “nothing here”");
		expect(screen.getByText("No matches on Deezer.")).toBeInTheDocument();
		await userEvent.click(row);
		expect(push).toHaveBeenCalledWith("/search?term=nothing%20here");
	});

	it("detects a pasted Deezer album link and downloads the whole album", async () => {
		fetchData.mockImplementation((endpoint: string) => {
			if (endpoint === "content/tracklist") {
				return Promise.resolve({
					DATA: { ALB_TITLE: "Discovery", ART_NAME: "Daft Punk", ALB_PICTURE: "abc" },
					tracks: [
						{ SNG_ID: "1", SNG_TITLE: "One More Time", ART_NAME: "Daft Punk" },
						{ SNG_ID: "2", SNG_TITLE: "Aerodynamic", ART_NAME: "Daft Punk" },
					],
				});
			}
			return Promise.resolve(SUGGEST);
		});
		render(<CommandPalette />);
		openWith("https://www.deezer.com/fr/album/302127");
		expect(await screen.findByText("Download 2 tracks")).toBeInTheDocument();
		expect(fetchData).not.toHaveBeenCalledWith("search/suggest", expect.anything());
		await userEvent.keyboard("{Enter}");
		const items = useDownloadStore.getState().items;
		expect(items.map((i) => i.trackId).sort()).toEqual(["1", "2"]);
		expect(items[0].group).toBe("Album · Discovery");
	});

	it("shows an 'Open' row for artist links", async () => {
		render(<CommandPalette />);
		openWith("https://deezer.com/artist/27");
		await userEvent.click(await screen.findByText("Open artist"));
		expect(push).toHaveBeenCalledWith("/artist?id=27");
	});

	it("lists downloads with cancel and clear-finished controls", async () => {
		act(() => {
			useDownloadStore.getState().enqueue([{ trackId: "9", title: "Digital Love", artist: "Daft Punk" }]);
		});
		render(<CommandPalette />);
		act(() => useCommandStore.getState().open(undefined, "downloads"));
		expect(await screen.findByText("Digital Love")).toBeInTheDocument();
		await userEvent.click(screen.getByLabelText("Cancel"));
		expect(useDownloadStore.getState().items[0].status).toBe("canceled");
		expect(await screen.findByText("Canceled")).toBeInTheDocument();
		await userEvent.click(screen.getByLabelText("Retry"));
		expect(useDownloadStore.getState().items[0].status).toBe("downloading");
	});
});

describe("CommandTrigger", () => {
	it("opens the palette on click", async () => {
		render(<CommandTrigger />);
		await userEvent.click(screen.getByLabelText("Search and download (Command K)"));
		expect(useCommandStore.getState()).toMatchObject({ isOpen: true, view: "search" });
	});

	it("shows a downloads button once something is queued and opens that view", async () => {
		render(<CommandTrigger />);
		expect(screen.queryByTitle("Downloads")).toBeNull();
		act(() => {
			useDownloadStore.getState().enqueue([{ trackId: "9", title: "Digital Love", artist: "Daft Punk" }]);
		});
		await userEvent.click(await screen.findByLabelText("1 downloads in progress"));
		expect(useCommandStore.getState()).toMatchObject({ isOpen: true, view: "downloads" });
	});
});
