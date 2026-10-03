import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLyricsStore } from "./useLyricsStore";
import { usePlayerStore, type PlayerTrack } from "./usePlayerStore";

const INITIAL = useLyricsStore.getState();
const fetchMock = vi.fn();

const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
const SYNCED = { source: "lrclib", syncedLyrics: "[00:02.00]b\n[00:01.00]a", plainLyrics: "a\nb", instrumental: false };

const playing = (over: Partial<PlayerTrack> = {}) =>
	usePlayerStore.setState({
		currentTrack: { trackId: "1", title: "Blinding Lights", artist: "The Weeknd", duration: 200, ...over } as PlayerTrack,
	});

describe("useLyricsStore.fetchLyrics", () => {
	beforeEach(() => {
		useLyricsStore.setState(INITIAL, true);
		usePlayerStore.setState({ currentTrack: null });
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	it("sends the playing track's metadata (was: only ?duration, so unsaved tracks had no title/artist)", async () => {
		playing();
		fetchMock.mockResolvedValue(ok(SYNCED));
		await useLyricsStore.getState().fetchLyrics("1", 199.6);
		const url = new URL(fetchMock.mock.calls[0][0], "http://x");
		expect(url.pathname).toBe("/api/v1/lyrics/1");
		expect(Object.fromEntries(url.searchParams)).toEqual({
			title: "Blinding Lights",
			artist: "The Weeknd",
			duration: "200",
		});
		expect(useLyricsStore.getState()).toMatchObject({
			isLoading: false,
			source: "lrclib",
			syncedLines: [
				{ time: 1, text: "a" },
				{ time: 2, text: "b" },
			],
		});
	});

	it("falls back to the player's duration and skips metadata of another track", async () => {
		playing();
		fetchMock.mockResolvedValue(ok(SYNCED));
		await useLyricsStore.getState().fetchLyrics("1");
		expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/lyrics/1?title=Blinding+Lights&artist=The+Weeknd&duration=200");

		useLyricsStore.setState(INITIAL, true);
		await useLyricsStore.getState().fetchLyrics("other");
		expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/lyrics/other");
	});

	it("does not refetch the same track once loaded", async () => {
		fetchMock.mockResolvedValue(ok(SYNCED));
		await useLyricsStore.getState().fetchLyrics("1");
		await useLyricsStore.getState().fetchLyrics("1");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("ignores a stale response after the track changed (was: lyrics of the previous song shown)", async () => {
		let resolveFirst!: (r: Response) => void;
		fetchMock
			.mockImplementationOnce(() => new Promise<Response>((r) => (resolveFirst = r)))
			.mockResolvedValueOnce(ok({ ...SYNCED, plainLyrics: "second", syncedLyrics: null }));

		const first = useLyricsStore.getState().fetchLyrics("1");
		await useLyricsStore.getState().fetchLyrics("2");
		resolveFirst(ok(SYNCED));
		await first;

		expect(useLyricsStore.getState()).toMatchObject({ trackId: "2", plainLyrics: "second", syncedLines: [] });
	});

	it("ignores stale errors too", async () => {
		let rejectFirst!: (e: Error) => void;
		let resolveBad!: (r: Response) => void;
		fetchMock
			.mockImplementationOnce(() => new Promise<Response>((_, rej) => (rejectFirst = rej)))
			.mockImplementationOnce(() => new Promise<Response>((r) => (resolveBad = r)))
			.mockResolvedValueOnce(ok(SYNCED));

		const a = useLyricsStore.getState().fetchLyrics("1");
		const b = useLyricsStore.getState().fetchLyrics("2");
		await useLyricsStore.getState().fetchLyrics("3");
		rejectFirst(new Error("network"));
		resolveBad(new Response("", { status: 500 }));
		await Promise.all([a, b]);

		expect(useLyricsStore.getState()).toMatchObject({ trackId: "3", error: null, source: "lrclib" });
	});

	it("reports HTTP errors, network errors and empty results", async () => {
		fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
		await useLyricsStore.getState().fetchLyrics("1");
		expect(useLyricsStore.getState().error).toBe("Failed to fetch lyrics");

		fetchMock.mockRejectedValueOnce(new Error("offline"));
		await useLyricsStore.getState().fetchLyrics("1");
		expect(useLyricsStore.getState().error).toBe("Failed to fetch lyrics");

		fetchMock.mockResolvedValueOnce(ok({ source: null, syncedLyrics: null, plainLyrics: null, instrumental: false }));
		await useLyricsStore.getState().fetchLyrics("1");
		expect(useLyricsStore.getState()).toMatchObject({ isLoading: false, error: "No lyrics available" });
	});
});
