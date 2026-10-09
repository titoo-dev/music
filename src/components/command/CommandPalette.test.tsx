import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { openOverlay, resetOverlayHistory, useOverlayStack } from "@/lib/overlay-history";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

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
	replace.mockReset();
	resetOverlayHistory();
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

	it("links a result's artist and album without playing it, and closes the palette (was: plain-text subtitle)", async () => {
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		const track = screen.getByText("One More Time").closest("[role=option]") as HTMLElement;
		const artist = track.querySelector('a[href="/artist?id=27"]') as HTMLAnchorElement;
		expect(artist).toHaveTextContent("Daft Punk");
		expect(track.querySelector('a[href="/album?id=302127"]')).toHaveTextContent("Discovery");
		artist.addEventListener("click", (e) => e.preventDefault());
		await userEvent.click(artist);
		expect(usePlayerStore.getState().currentTrack).toBeNull();
		expect(useCommandStore.getState().isOpen).toBe(false);
	});

	it("plays a searched track next, right after the current one (was: no 'Play next' in ⌘K, only append)", async () => {
		const queue = ["x", "y", "z"].map((id) => ({ trackId: id, title: id, artist: "A", cover: null, duration: null }));
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		await userEvent.click(screen.getByRole("button", { name: "Play next" }));
		const s = usePlayerStore.getState();
		expect(s.queue.map((t) => t.trackId)).toEqual(["x", "111", "y", "z"]);
		expect(s.currentTrack?.trackId).toBe("x");
		expect(toast).toHaveBeenCalledWith("“One More Time” plays next");
	});

	it("says so when 'Add to queue' finds the track already up next (was: toast claimed it was added)", async () => {
		const queue = [
			{ trackId: "x", title: "x", artist: "A", cover: null, duration: null },
			{ trackId: "111", title: "One More Time", artist: "Daft Punk", cover: null, duration: null },
		];
		usePlayerStore.setState({ queue, queueIndex: 0, currentTrack: queue[0] });
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		await userEvent.click(screen.getByRole("button", { name: "Add to queue" }));
		expect(usePlayerStore.getState().queue).toHaveLength(2);
		expect(toast).toHaveBeenCalledWith("“One More Time” is already up next");
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

describe("CommandPalette — leaving (NAV-17)", () => {
	it("replaces its own history entry when it navigates, without going Back (was: Back raced the navigation)", async () => {
		const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
		render(<CommandPalette />);
		openWith();
		openOverlay("palette", () => useCommandStore.getState().close());
		expect(await screen.findByText("All music")).toBeInTheDocument();
		await userEvent.keyboard("{Enter}");
		expect(replace).toHaveBeenCalledWith("/");
		expect(push).not.toHaveBeenCalled();
		expect(back).not.toHaveBeenCalled();
		expect(useOverlayStack.getState().ids).toEqual([]);
		back.mockRestore();
	});

	it("closes before the Sign in toast opens /login (was: the palette was open again on the way back)", async () => {
		useAuthStore.setState({ isAuthenticated: false });
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
		const call = vi.mocked(toast).mock.calls.filter((c) => c[0] === "Sign in to download").at(-1) as unknown as [string, { action: { onClick: () => void } }];
		act(() => call[1].action.onClick());
		expect(useCommandStore.getState().isOpen).toBe(false);
		expect(push).toHaveBeenCalledWith("/login");
	});
});

describe("CommandPalette — stale suggestions (NAV-15)", () => {
	it("Enter on results of the previous query searches what is typed (was: played a track of the old query)", async () => {
		fetchData.mockResolvedValueOnce(SUGGEST).mockReturnValue(new Promise(() => {}));
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		act(() => useCommandStore.getState().setQuery("daft punk live"));
		await userEvent.keyboard("{Enter}");
		expect(usePlayerStore.getState().currentTrack).toBeNull();
		expect(push).toHaveBeenCalledWith("/search?term=daft%20punk%20live");
	});

	it("goes back to the first row when new results arrive (was: the selection jumped to another album)", async () => {
		let resolve!: (v: unknown) => void;
		fetchData.mockResolvedValueOnce(SUGGEST).mockReturnValueOnce(new Promise((r) => (resolve = r)));
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		act(() => useCommandStore.getState().setQuery("daft punk"));
		await userEvent.keyboard("{ArrowDown}");
		await act(async () => resolve({ ...SUGGEST, tracks: [{ ...SUGGEST.tracks[0], sourceId: "9", title: "Around the World" }] }));
		await screen.findByText("Around the World");
		expect(screen.getByText("Around the World").closest("[role=option]")).toHaveAttribute("aria-selected", "true");
	});
});

describe("CommandPalette — track links (NAV-16)", () => {
	it("says track links aren't supported instead of searching the URL (was: Open track → No results)", async () => {
		render(<CommandPalette />);
		openWith("https://www.deezer.com/track/3135556");
		expect(await screen.findByText("Track links aren’t supported")).toBeInTheDocument();
		expect(screen.queryByText("Open track")).toBeNull();
		await userEvent.keyboard("{Enter}");
		expect(push).not.toHaveBeenCalled();
	});
});

describe("CommandPalette — keyboard after a click (NAV-18)", () => {
	it("keeps the focus in the input when a row is clicked (was: Escape stopped working)", async () => {
		// "Toggle theme" reads the OS scheme; jsdom has no matchMedia.
		vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
		render(<CommandPalette />);
		openWith();
		const input = await screen.findByLabelText("Search");
		await waitFor(() => expect(input).toHaveFocus());
		await userEvent.click(await screen.findByText("Toggle theme"));
		expect(input).toHaveFocus();
		await userEvent.keyboard("{Escape}");
		expect(useCommandStore.getState().isOpen).toBe(false);
	});
});

describe("CommandPalette — focus return (NAV-20)", () => {
	it("gives the focus back to the control that opened it (was: focus fell to <body>)", async () => {
		render(
			<>
				<button type="button" onClick={() => useCommandStore.getState().open()}>
					opener
				</button>
				<CommandPalette />
			</>
		);
		const opener = screen.getByRole("button", { name: "opener" });
		await userEvent.click(opener);
		const input = await screen.findByLabelText("Search");
		await waitFor(() => expect(input).toHaveFocus());
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(opener).toHaveFocus());
	});
});

describe("CommandPalette — new tabs (NAV-21)", () => {
	const albumRow = () => screen.getByText("Discovery", { selector: "span.block.truncate.text-sm" }).closest("[role=option]") as HTMLElement;

	it("Ctrl / ⌘ click and middle click open a page row in a new tab and keep the palette (was: navigated here / did nothing)", async () => {
		const open = vi.spyOn(window, "open").mockReturnValue(null);
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		fireEvent.click(albumRow(), { ctrlKey: true });
		fireEvent.click(albumRow(), { metaKey: true });
		fireEvent(albumRow(), new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
		expect(open).toHaveBeenCalledTimes(3);
		expect(open).toHaveBeenCalledWith("/album?id=302127", "_blank", "noopener");
		expect(push).not.toHaveBeenCalled();
		expect(useCommandStore.getState().isOpen).toBe(true);
		open.mockRestore();
	});

	it("⌘+Enter on a page row opens it in a new tab (was: navigated in this tab)", async () => {
		const open = vi.spyOn(window, "open").mockReturnValue(null);
		fetchData.mockResolvedValue(SUGGEST);
		render(<CommandPalette />);
		openWith("daft");
		await screen.findByText("One More Time");
		await userEvent.keyboard("{ArrowDown}{Meta>}{Enter}{/Meta}");
		expect(open).toHaveBeenCalledWith("/album?id=302127", "_blank", "noopener");
		expect(push).not.toHaveBeenCalled();
		open.mockRestore();
	});
});
