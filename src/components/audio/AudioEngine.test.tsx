import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock("@/lib/audio-cache", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/audio-cache")>()),
	getCachedBlobUrl: vi.fn(async () => null),
	prefetchTrack: vi.fn(async () => false),
	removeCached: vi.fn(async () => {}),
}));

import { AudioEngine } from "./AudioEngine";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";
import { getCachedBlobUrl } from "@/lib/audio-cache";
import { presignedUrls } from "./engine/presigned-urls";
import { resetPrefetchState } from "./engine/prefetch";
import { __setAudioContextFactory, getElementVolume, initAudioCtx, isRouted } from "@/utils/audio-context";

// AudioEngine drives <audio> elements imperatively (new Audio()). This fake
// element records what the engine asks of it, and the tests play the
// browser's part: readiness, time updates, errors.

type Ranges = { length: number; start(i: number): number; end(i: number): number };
const ranges = (pairs: [number, number][] = []): Ranges => ({
	length: pairs.length,
	start: (i) => pairs[i][0],
	end: (i) => pairs[i][1],
});

class FakeAudio extends EventTarget {
	static all: FakeAudio[] = [];
	preload = "";
	crossOrigin: string | null = null;
	readyState = 0;
	paused = true;
	seeking = false;
	currentTime = 0;
	duration = NaN;
	volume = 1;
	playbackRate = 1;
	networkState = 0;
	error: { code: number; message: string } | null = null;
	buffered: Ranges = ranges();
	seekable: Ranges = ranges();
	plays = 0;
	oncanplay: (() => void) | null = null;
	ontimeupdate: (() => void) | null = null;
	onended: (() => void) | null = null;
	onerror: (() => void) | null = null;
	onloadedmetadata: (() => void) | null = null;
	onwaiting: (() => void) | null = null;
	onplaying: (() => void) | null = null;
	onprogress: (() => void) | null = null;
	private _src = "";

	constructor() {
		super();
		FakeAudio.all.push(this);
	}
	// Like a real element: "" reads back as the document URL.
	get src() {
		return this._src;
	}
	set src(v: string) {
		this._src = new URL(v, window.location.href).href;
		this.readyState = 0;
		this.error = null;
	}
	get currentSrc() {
		return this._src;
	}
	load() {}
	play() {
		this.plays++;
		this.paused = false;
		return Promise.resolve();
	}
	pause() {
		this.paused = true;
	}
	fire(type: string) {
		(this as unknown as Record<string, (() => void) | null>)[`on${type}`]?.();
		this.dispatchEvent(new Event(type));
	}
	/** The browser has metadata and enough data to play. */
	ready(duration: number, readyState = 4) {
		this.readyState = readyState;
		this.duration = duration;
		this.fire("loadedmetadata");
		this.fire("canplay");
	}
	tick(t: number) {
		this.currentTime = t;
		this.fire("timeupdate");
	}
	fail(code = 2) {
		this.error = { code, message: "network" };
		this.fire("error");
	}
}

const track = (id: string): PlayerTrack => ({
	trackId: id,
	title: `Track ${id}`,
	artist: "Artist",
	cover: null,
	duration: 200,
});

const INITIAL = usePlayerStore.getState();
// trackId → presigned URL the server would hand out (absent = not cached)
let stored: Record<string, string>;
let fetchMock: ReturnType<typeof vi.fn>;

const persistingRequests = () =>
	[
		...fetchMock.mock.calls.map(([u]) => String(u)),
		...FakeAudio.all.map((a) => a.src),
	].filter((u) => /\/api\/v1\/stream-progressive\/[^?]+$/.test(u) || /\/api\/v1\/stream\/[^?]+$/.test(u));

function elementWithSrc(pattern: RegExp): FakeAudio {
	const el = FakeAudio.all.findLast((a) => pattern.test(a.src));
	if (!el) throw new Error(`no element with src ${pattern}`);
	return el;
}

beforeEach(() => {
	FakeAudio.all = [];
	vi.stubGlobal("Audio", FakeAudio);
	stored = {};
	fetchMock = vi.fn(async (input: RequestInfo | URL) => {
		const url = String(input);
		const m = /\/api\/v1\/stream-url\/([^/?]+)/.exec(url);
		if (m) {
			const hit = stored[decodeURIComponent(m[1])];
			return Response.json({
				success: true,
				data: hit
					? { url: hit, contentType: "audio/mpeg", expiresAt: new Date(Date.now() + 3_600_000).toISOString() }
					: { url: null, status: "not_cached" },
			});
		}
		if (/[?&]prefetch=1/.test(url)) return Response.json({ success: false, error: { code: "NOT_CACHED" } }, { status: 404 });
		return new Response(null, { status: 204 });
	});
	vi.stubGlobal("fetch", fetchMock);
	vi.mocked(getCachedBlobUrl).mockResolvedValue(null);
	vi.spyOn(console, "warn").mockImplementation(() => {});
	presignedUrls.reset();
	resetPrefetchState();
	__setAudioContextFactory(() => null);
	usePlayerStore.setState(INITIAL, true);
	localStorage.clear();
});

afterEach(() => {
	resetPrefetchState();
	__setAudioContextFactory();
	vi.unstubAllGlobals();
});

describe("AudioEngine — playback starts on every source", () => {
	it("plays a track the server never stored from the persisting live stream", async () => {
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(track("1")));
		const el = await waitFor(() => elementWithSrc(/\/api\/v1\/stream-progressive\/1$/));
		act(() => el.ready(200));
		expect(el.plays).toBe(1);
		await waitFor(() => expect(el.volume).toBeCloseTo(0.8));
	});

	it("plays a stored track from its presigned R2 URL", async () => {
		stored["2"] = "https://r2.example/tracks/2/1.mp3?sig=1";
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(track("2")));
		const el = await waitFor(() => elementWithSrc(/r2\.example\/tracks\/2\//));
		act(() => el.ready(200));
		expect(el.plays).toBe(1);
		await waitFor(() => expect(el.volume).toBeCloseTo(0.8));
	});

	it("plays an IndexedDB copy from its blob URL", async () => {
		vi.mocked(getCachedBlobUrl).mockImplementation(async (id) => (id === "3" ? "blob:http://localhost/3" : null));
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(track("3")));
		const el = await waitFor(() => elementWithSrc(/^blob:http:\/\/localhost\/3$/));
		act(() => el.ready(200));
		expect(el.plays).toBe(1);
	});
});

describe("AudioEngine — Web Audio", () => {
	it("never routes an element into a suspended AudioContext: it keeps element.volume (no silent playback)", async () => {
		const ctx = { state: "suspended", resume: vi.fn(() => new Promise(() => {})), createAnalyser: vi.fn() };
		ctx.createAnalyser.mockReturnValue({ connect: vi.fn(), fftSize: 0, smoothingTimeConstant: 0 });
		__setAudioContextFactory(() => ctx as unknown as AudioContext);
		initAudioCtx();
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(track("1")));
		const el = await waitFor(() => elementWithSrc(/stream-progressive\/1$/));
		act(() => el.ready(200));
		act(() => el.tick(1));
		expect(isRouted(el as unknown as HTMLAudioElement)).toBe(false);
		await waitFor(() => expect(el.volume).toBeCloseTo(0.8));
	});

	it("routes the element once the context runs, and its volume moves to its GainNode", async () => {
		const node = () => ({ connect: vi.fn(), disconnect: vi.fn(), fftSize: 0, smoothingTimeConstant: 0 });
		const gains: { gain: { value: number } }[] = [];
		const ctx = {
			state: "running",
			destination: node(),
			resume: vi.fn(async () => {}),
			createAnalyser: vi.fn(node),
			createMediaElementSource: vi.fn(node),
			createGain: vi.fn(() => {
				const g = { ...node(), gain: { value: 1 } };
				gains.push(g);
				return g;
			}),
		};
		__setAudioContextFactory(() => ctx as unknown as AudioContext);
		initAudioCtx();
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(track("1")));
		const el = await waitFor(() => elementWithSrc(/stream-progressive\/1$/));
		act(() => el.ready(200));
		act(() => el.tick(1));
		const audio = el as unknown as HTMLAudioElement;
		expect(isRouted(audio)).toBe(true);
		await waitFor(() => expect(getElementVolume(audio)).toBeCloseTo(0.8));
		// element.volume stays at 1 (read-only on iOS); the last GainNode is the volume.
		expect(el.volume).toBe(1);
		expect(gains.at(-1)?.gain.value).toBeCloseTo(0.8);
	});
});

describe("AudioEngine — prefetch never persists", () => {
	it("starting a queue opens no persisting stream for the tracks around it", async () => {
		stored["2"] = "https://r2.example/tracks/2/1.mp3?sig=1";
		const queue = ["1", "2", "3", "4"].map(track);
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(queue[0], queue));
		const el = await waitFor(() => elementWithSrc(/stream-progressive\/1$/));
		act(() => el.ready(200));
		await act(async () => {
			await new Promise((r) => setTimeout(r, 20));
		});
		// The playing track streams (and persists); 2, 3, 4 never do.
		expect(persistingRequests().every((u) => /\/1$/.test(u))).toBe(true);
		// The stored next track is preloaded from R2.
		expect(FakeAudio.all.some((a) => a.src.startsWith("https://r2.example/tracks/2/"))).toBe(true);
	});
});

describe("AudioEngine — fades", () => {
	it("a crossfaded track fades back in after a pause (was: its first resume jumped straight to full volume)", async () => {
		stored["1"] = "https://r2.example/tracks/1/1.mp3?sig=1";
		stored["2"] = "https://r2.example/tracks/2/1.mp3?sig=1";
		usePlayerStore.setState({ crossfadeDuration: 5 });
		const queue = [track("1"), track("2")];
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(queue[0], queue));
		const first = await waitFor(() => elementWithSrc(/tracks\/1\//));
		act(() => first.ready(200));
		const second = await waitFor(() => elementWithSrc(/tracks\/2\//));
		second.readyState = 4;
		second.duration = 200;
		// 4 s left: the crossfade hands over to the preloaded next track.
		act(() => first.tick(196));
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("2");
		expect(second.plays).toBe(1);

		act(() => usePlayerStore.getState().pause());
		await waitFor(() => expect(second.paused).toBe(true));
		expect(second.volume).toBe(0);
		act(() => usePlayerStore.getState().resume());
		// A user resume starts from silence and fades in.
		expect(second.volume).toBe(0);
		await waitFor(() => expect(second.volume).toBeCloseTo(0.8));
	});

	it("the next track of the queue starts at full volume, with no fade-in", async () => {
		stored["1"] = "https://r2.example/tracks/1/1.mp3?sig=1";
		stored["2"] = "https://r2.example/tracks/2/1.mp3?sig=1";
		const queue = [track("1"), track("2")];
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(queue[0], queue));
		const first = await waitFor(() => elementWithSrc(/tracks\/1\//));
		act(() => first.ready(200));
		const second = await waitFor(() => elementWithSrc(/tracks\/2\//));
		act(() => second.ready(200));
		act(() => first.fire("ended"));
		expect(usePlayerStore.getState().currentTrack?.trackId).toBe("2");
		expect(second.plays).toBe(1);
		expect(second.volume).toBeCloseTo(0.8);
	});

	it("a queue advance paused before it started fades in on resume (was: the user's resume skipped the fade-in)", async () => {
		stored["1"] = "https://r2.example/tracks/1/1.mp3?sig=1";
		stored["2"] = "https://r2.example/tracks/2/1.mp3?sig=1";
		const queue = [track("1"), track("2")];
		render(<AudioEngine />);
		act(() => usePlayerStore.getState().play(queue[0], queue));
		const first = await waitFor(() => elementWithSrc(/tracks\/1\//));
		act(() => first.ready(200));
		const second = await waitFor(() => elementWithSrc(/tracks\/2\//));
		act(() => first.fire("ended"));
		act(() => usePlayerStore.getState().pause());
		act(() => second.ready(200));
		expect(second.plays).toBe(0);
		await waitFor(() => expect(second.volume).toBe(0));
		act(() => usePlayerStore.getState().resume());
		expect(second.plays).toBe(1);
		expect(second.volume).toBe(0);
		await waitFor(() => expect(second.volume).toBeCloseTo(0.8));
	});
});
