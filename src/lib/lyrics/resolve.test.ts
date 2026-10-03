// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { findLyrics, lrclib, NO_LYRICS } from "./resolve";
import type { LyricsCandidate } from "./match";

const SYNC = "[00:01.00]I've been tryna call\n[00:05.00]I've been on my own";
const SYNC_PLAIN = "I've been tryna call\nI've been on my own";

const track = (over: Partial<LyricsCandidate> = {}): LyricsCandidate => ({
	id: 1,
	trackName: "Blinding Lights",
	artistName: "The Weeknd",
	albumName: "After Hours",
	duration: 200,
	instrumental: false,
	plainLyrics: "plain",
	syncedLyrics: SYNC,
	...over,
});

type Route = (url: URL) => Response | Promise<Response>;
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
	new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
const notFound = () => json({ name: "TrackNotFound" }, 404);

/** Fake fetch: routes /get and /search, records every call's params. */
function fakeLrclib(routes: { get?: Route; search?: Route }) {
	const calls: Array<{ path: string; params: Record<string, string> }> = [];
	const f = vi.fn(async (input: string | URL | Request) => {
		const url = new URL(String(input));
		const path = url.pathname.replace("/api", "");
		calls.push({ path, params: Object.fromEntries(url.searchParams) });
		const route = path === "/get" ? routes.get : routes.search;
		return route ? route(url) : notFound();
	}) as unknown as typeof fetch;
	return { f, calls };
}

const Q = { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: 200 };

describe("lrclib", () => {
	it("skips empty params and returns parsed JSON", async () => {
		const { f, calls } = fakeLrclib({ get: () => json({ ok: 1 }) });
		expect(await lrclib(f, "/get", { track_name: "a", artist_name: "", album_name: null, duration: undefined })).toEqual({ ok: 1 });
		expect(calls[0].params).toEqual({ track_name: "a" });
	});

	it("retries once on 503 (was: LRCLIB load shedding returned no lyrics)", async () => {
		let n = 0;
		const { f } = fakeLrclib({ get: () => (n++ === 0 ? json({}, 503, { "Retry-After": "0.01" }) : json({ ok: 2 })) });
		expect(await lrclib(f, "/get", {})).toEqual({ ok: 2 });
		expect(n).toBe(2);
	});

	it("gives up after a second 503, and on 404 / network errors", async () => {
		let n = 0;
		const { f } = fakeLrclib({ get: () => (n++, json({}, 503)) });
		expect(await lrclib(f, "/get", {})).toBeNull();
		expect(n).toBe(2);

		expect(await lrclib(fakeLrclib({}).f, "/get", {})).toBeNull();
		const boom = vi.fn(async () => {
			throw new Error("ECONNRESET");
		}) as unknown as typeof fetch;
		expect(await lrclib(boom, "/get", {})).toBeNull();
	});
});

describe("findLyrics", () => {
	it("returns the exact LRCLIB hit without searching or waiting for Deezer", async () => {
		const { f, calls } = fakeLrclib({ get: () => json(track()) });
		const deezer = vi.fn(() => new Promise<never>(() => {}));
		const r = await findLyrics(Q, { fetch: f, deezer });
		expect(r).toEqual({ source: "lrclib", syncedLyrics: SYNC, plainLyrics: "plain", instrumental: false });
		expect(calls).toHaveLength(1);
		expect(calls[0].params).toEqual({ track_name: "Blinding Lights", artist_name: "The Weeknd", duration: "200" });
	});

	it("retries /get with the cleaned title and main artist (was: '(Remastered 2020)' title → 404)", async () => {
		const { f, calls } = fakeLrclib({
			get: (u) => (u.searchParams.get("track_name") === "Blinding Lights" ? json(track()) : notFound()),
		});
		const r = await findLyrics({ ...Q, title: "Blinding Lights (Remastered 2020)", artist: "The Weeknd, Someone" }, { fetch: f });
		expect(r.source).toBe("lrclib");
		expect(calls.map((c) => c.params.track_name)).toEqual(["Blinding Lights (Remastered 2020)", "Blinding Lights"]);
		expect(calls[1].params.artist_name).toBe("The Weeknd");
	});

	it("prefers Deezer synced lyrics over searching when /get misses", async () => {
		const { f, calls } = fakeLrclib({});
		const r = await findLyrics(Q, {
			fetch: f,
			deezer: async () => ({ syncedLyrics: SYNC, plainLyrics: null }),
		});
		expect(r).toEqual({ source: "deezer", syncedLyrics: SYNC, plainLyrics: SYNC_PLAIN, instrumental: false });
		expect(calls.every((c) => c.path === "/get")).toBe(true);
	});

	it("finds lyrics through fuzzy search when /get misses (was: exact-only lookup)", async () => {
		const { f, calls } = fakeLrclib({
			search: () =>
				json([
					track({ id: 7, trackName: "The Weeknd - Blinding Lights (Official Video)", duration: 263 }),
					track({ id: 8, trackName: "Blinding Lights", duration: 201.5 }),
				]),
		});
		const r = await findLyrics(Q, { fetch: f });
		expect(r.syncedLyrics).toBe(SYNC);
		expect(calls.filter((c) => c.path === "/search")).toHaveLength(1);
		expect(calls.find((c) => c.path === "/search")!.params).toEqual({ track_name: "Blinding Lights", artist_name: "The Weeknd" });
	});

	it("walks the search ladder: structured → free text → title only", async () => {
		const { f, calls } = fakeLrclib({
			search: (u) => (u.searchParams.has("artist_name") || u.searchParams.has("q") ? json([]) : json([track({ artistName: "Weeknd" })])),
		});
		const r = await findLyrics(Q, { fetch: f });
		expect(r.syncedLyrics).toBe(SYNC);
		expect(calls.filter((c) => c.path === "/search").map((c) => c.params)).toEqual([
			{ track_name: "Blinding Lights", artist_name: "The Weeknd" },
			{ q: "The Weeknd Blinding Lights" },
			{ track_name: "Blinding Lights" },
		]);
	});

	it("drops misaligned sync but keeps the text (was: synced lines from a 263 s video cut drifted)", async () => {
		const { f } = fakeLrclib({ search: () => json([track({ duration: 210, plainLyrics: null })]) });
		const r = await findLyrics(Q, { fetch: f });
		expect(r).toEqual({ source: "lrclib", syncedLyrics: null, plainLyrics: SYNC_PLAIN, instrumental: false });
	});

	it("stops searching once five copies of the song are found, none aligned (was: 3 sequential searches, ~8 s)", async () => {
		const copies = [1, 2, 3, 4, 5].map((id) => track({ id, duration: 220 + id }));
		const { f, calls } = fakeLrclib({ search: () => json(copies) });
		const r = await findLyrics(Q, { fetch: f });
		expect(r.syncedLyrics).toBeNull();
		expect(r.plainLyrics).toBe("plain");
		expect(calls.filter((c) => c.path === "/search")).toHaveLength(1);
	});

	it("ranks: exact plain > Deezer plain > searched plain", async () => {
		const searchPlain = () => json([track({ syncedLyrics: null, plainLyrics: "searched" })]);
		const exactPlain = () => json(track({ syncedLyrics: null, plainLyrics: "exact" }));
		const dz = async () => ({ syncedLyrics: null, plainLyrics: "deezer" });

		expect((await findLyrics(Q, { fetch: fakeLrclib({ get: exactPlain, search: searchPlain }).f, deezer: dz })).plainLyrics).toBe("exact");
		expect((await findLyrics(Q, { fetch: fakeLrclib({ search: searchPlain }).f, deezer: dz })).plainLyrics).toBe("deezer");
		expect((await findLyrics(Q, { fetch: fakeLrclib({ search: searchPlain }).f })).plainLyrics).toBe("searched");
	});

	it("upgrades an exact plain hit to a synced search hit", async () => {
		const { f } = fakeLrclib({
			get: () => json(track({ syncedLyrics: null, plainLyrics: "exact" })),
			search: () => json([track({ id: 9 })]),
		});
		expect((await findLyrics(Q, { fetch: f })).syncedLyrics).toBe(SYNC);
	});

	it("reports instrumental only when nothing has words", async () => {
		const inst = track({ plainLyrics: null, syncedLyrics: null, instrumental: true });
		const r = await findLyrics(Q, { fetch: fakeLrclib({ get: () => json(inst) }).f });
		expect(r).toEqual({ source: "lrclib", syncedLyrics: null, plainLyrics: null, instrumental: true });

		const fromSearch = await findLyrics(Q, { fetch: fakeLrclib({ search: () => json([inst]) }).f });
		expect(fromSearch.instrumental).toBe(true);

		const withDeezer = await findLyrics(Q, {
			fetch: fakeLrclib({ get: () => json(inst) }).f,
			deezer: async () => ({ syncedLyrics: null, plainLyrics: "words" }),
		});
		expect(withDeezer.source).toBe("deezer");
	});

	it("only asks Deezer when there is no metadata", async () => {
		const { f, calls } = fakeLrclib({});
		expect(await findLyrics(null, { fetch: f })).toEqual(NO_LYRICS);
		expect((await findLyrics(null, { fetch: f, deezer: async () => ({ syncedLyrics: null, plainLyrics: "x" }) })).source).toBe("deezer");
		expect(calls).toHaveLength(0);
	});

	it("survives a failing Deezer lookup and junk responses", async () => {
		const { f } = fakeLrclib({ get: () => json(track({ plainLyrics: null, syncedLyrics: null })), search: () => json({ not: "an array" }) });
		const r = await findLyrics(Q, {
			fetch: f,
			deezer: async () => {
				throw new Error("region");
			},
		});
		expect(r).toEqual(NO_LYRICS);
		const empty = await findLyrics(Q, { fetch: fakeLrclib({}).f, deezer: async () => ({ syncedLyrics: "garbage", plainLyrics: " " }) });
		expect(empty).toEqual(NO_LYRICS);
	});

	it("ignores out-of-range durations and stops searching past the time budget", async () => {
		const { f, calls } = fakeLrclib({});
		await findLyrics({ ...Q, duration: 99999 }, { fetch: f, budgetMs: -1 });
		expect(calls[0].params.duration).toBeUndefined();
		expect(calls.some((c) => c.path === "/search")).toBe(false);
	});
});
