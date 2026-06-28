// @vitest-environment node
// library.ts — Convex-only (Phase 6). On mocke le client Convex et getDeemixApp.
import { describe, it, expect, vi, beforeEach } from "vitest";

const convex = { query: vi.fn(), mutation: vi.fn() };
vi.mock("@/lib/convex/server", () => ({ getConvexClient: () => convex }));
vi.mock("@convex/_generated/api", () => ({
	api: {
		savedTracks: { save: "s", unsave: "s", isSaved: "s", savedIds: "s", list: "s" },
		albums: {
			saveAlbum: "a",
			unsaveAlbum: "a",
			listSavedAlbums: "a",
			savedAlbumIds: "a",
		},
		followedArtists: {
			follow: "f",
			unfollow: "f",
			isFollowed: "f",
			followedIds: "f",
			list: "f",
		},
		playlists: { addTracks: "p", removeTracks: "p", reorder: "p" },
		storedTracks: { refCount: "st", deleteByTrack: "st" },
		shares: { shareTrack: "sh", resolveForPlayback: "sh" },
		preferences: { get: "pr" },
	},
}));
vi.mock("@/lib/server-state", () => ({ getDeemixApp: vi.fn(async () => null) }));
import { getDeemixApp } from "@/lib/server-state";

import {
	saveTrack,
	unsaveTrack,
	isTrackSaved,
	getSavedTrackIds,
	listSavedTracks,
	saveAlbum,
	unsaveAlbum,
	getSavedAlbumIds,
	getTrackRefCount,
	maybeEvictFile,
	forceEvictFile,
	isPreCacheEnabled,
	reorderPlaylist,
	followArtist,
	getFollowedArtistIds,
	addToPlaylist,
	removeFromPlaylist,
	shareTrack,
	resolveShareForPlayback,
} from "./library";

beforeEach(() => {
	convex.query.mockReset();
	convex.mutation.mockReset();
	vi.mocked(getDeemixApp).mockReset();
	vi.mocked(getDeemixApp).mockResolvedValue(null as never);
});

describe("savedTracks", () => {
	it("saveTrack delegates to Convex", async () => {
		convex.mutation.mockResolvedValue(null);
		await saveTrack("u1", { trackId: "t1", title: "T", artist: "A" });
		expect(convex.mutation).toHaveBeenCalledWith(
			"s",
			expect.objectContaining({ userId: "u1", trackId: "t1", album: null }),
		);
	});

	it("isTrackSaved returns the Convex boolean", async () => {
		convex.query.mockResolvedValue(true);
		expect(await isTrackSaved("u1", "t1")).toBe(true);
	});

	it("getSavedTrackIds short-circuits empty and wraps in a Set", async () => {
		expect((await getSavedTrackIds("u1", [])).size).toBe(0);
		expect(convex.query).not.toHaveBeenCalled();
		convex.query.mockResolvedValue(["t1", "t3"]);
		const set = await getSavedTrackIds("u1", ["t1", "t2", "t3"]);
		expect([...set].sort()).toEqual(["t1", "t3"]);
	});

	it("listSavedTracks delegates", async () => {
		convex.query.mockResolvedValue([{ id: "1" }]);
		expect(await listSavedTracks("u1")).toEqual([{ id: "1" }]);
	});

	it("unsaveTrack deletes then evicts (refs 0 → forceEvict)", async () => {
		convex.mutation.mockResolvedValue(null); // unsave
		convex.query.mockResolvedValue({ total: 0 }); // refCount
		// forceEvictFile: deleteByTrack returns [] paths
		convex.mutation.mockResolvedValueOnce(null).mockResolvedValueOnce([]);
		await unsaveTrack("u1", "t1");
		expect(convex.mutation).toHaveBeenCalled();
	});
});

describe("albums", () => {
	it("saveAlbum delegates and returns the album id", async () => {
		convex.mutation.mockResolvedValue("alb-1");
		expect(
			await saveAlbum("u1", { deezerAlbumId: "d", title: "T", artist: "A" }, []),
		).toBe("alb-1");
	});

	it("unsaveAlbum evicts each returned trackId", async () => {
		convex.mutation
			.mockResolvedValueOnce(["t1", "t2"]) // unsaveAlbum → trackIds
			.mockResolvedValue([]); // forceEvict deleteByTrack
		convex.query.mockResolvedValue({ total: 0 });
		await unsaveAlbum("u1", "d");
		expect(convex.mutation).toHaveBeenCalledWith(
			"a",
			expect.objectContaining({ userId: "u1", deezerAlbumId: "d" }),
		);
	});

	it("getSavedAlbumIds short-circuits empty", async () => {
		expect((await getSavedAlbumIds("u1", [])).size).toBe(0);
	});
});

describe("followedArtists", () => {
	it("followArtist delegates", async () => {
		convex.mutation.mockResolvedValue(null);
		await followArtist("u1", { deezerArtistId: "27", name: "X" });
		expect(convex.mutation).toHaveBeenCalledWith(
			"f",
			expect.objectContaining({ deezerArtistId: "27", pictureUrl: null }),
		);
	});

	it("getFollowedArtistIds wraps in a Set", async () => {
		convex.query.mockResolvedValue(["27"]);
		expect([...(await getFollowedArtistIds("u1", ["27", "99"]))]).toEqual(["27"]);
	});
});

describe("playlists", () => {
	it("addToPlaylist short-circuits empty", async () => {
		expect(await addToPlaylist("p1", [])).toEqual({ added: 0 });
	});
	it("removeFromPlaylist short-circuits empty", async () => {
		expect(await removeFromPlaylist("p1", [])).toEqual({ removed: 0 });
	});
	it("reorderPlaylist delegates", async () => {
		convex.mutation.mockResolvedValue({ reordered: 2 });
		expect(await reorderPlaylist("p1", ["a", "b"])).toEqual({ reordered: 2 });
	});
});

describe("ref-counting + eviction", () => {
	it("getTrackRefCount delegates", async () => {
		convex.query.mockResolvedValue({ saved: 1, album: 0, shared: 0, recent: 0, total: 1 });
		expect((await getTrackRefCount("t1")).total).toBe(1);
	});

	it("forceEvictFile returns 0 with no stored paths", async () => {
		convex.mutation.mockResolvedValue([]);
		expect(await forceEvictFile("t1")).toBe(0);
	});

	it("forceEvictFile deletes S3 files when a provider exists", async () => {
		const deleteFile = vi.fn().mockResolvedValue(undefined);
		vi.mocked(getDeemixApp).mockResolvedValue({ storageProvider: { deleteFile } } as never);
		convex.mutation.mockResolvedValue(["/p1", "/p2"]);
		expect(await forceEvictFile("t1")).toBe(2);
		expect(deleteFile).toHaveBeenCalledTimes(2);
	});

	it("maybeEvictFile only evicts when total refs is 0", async () => {
		convex.query.mockResolvedValue({ total: 2 });
		await maybeEvictFile("t1");
		expect(convex.mutation).not.toHaveBeenCalled();
	});
});

describe("shares + prefs", () => {
	it("shareTrack delegates", async () => {
		convex.mutation.mockResolvedValue({ id: "x", shareId: "abc" });
		expect(await shareTrack("u1", { trackId: "t1", title: "T", artist: "A" })).toEqual({
			id: "x",
			shareId: "abc",
		});
	});

	it("resolveShareForPlayback maps the Convex shape", async () => {
		convex.query.mockResolvedValue({
			share: { shareId: "abc", trackId: "t1" },
			storedTrack: null,
			expired: false,
		});
		const r = await resolveShareForPlayback("abc");
		expect(r?.share.shareId).toBe("abc");
		expect(r?.expired).toBe(false);
		convex.query.mockResolvedValue(null);
		expect(await resolveShareForPlayback("nope")).toBeNull();
	});

	it("isPreCacheEnabled reads the pref flag", async () => {
		convex.query.mockResolvedValue({ preCacheSaved: true });
		expect(await isPreCacheEnabled("u1")).toBe(true);
		convex.query.mockResolvedValue(null);
		expect(await isPreCacheEnabled("u1")).toBe(false);
	});
});
