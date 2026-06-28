// Tests des fonctions Convex (convex-test, in-memory). Couvre la logique non
// triviale : dedup d'upsert, cascades manuelles, validation du reorder,
// ref-counting. Lancer via `npm run test:convex`.

/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const setup = () => convexTest(schema, modules);

describe("savedTracks", () => {
	test("save is idempotent (upsert no-op) then unsave", async () => {
		const t = setup();
		const meta = { userId: "u1", trackId: "t1", title: "T", artist: "A" };
		await t.mutation(api.savedTracks.save, meta);
		await t.mutation(api.savedTracks.save, meta); // dedup
		expect(
			await t.query(api.savedTracks.isSaved, { userId: "u1", trackId: "t1" }),
		).toBe(true);
		const list = await t.query(api.savedTracks.list, { userId: "u1" });
		expect(list.length).toBe(1);

		await t.mutation(api.savedTracks.unsave, { userId: "u1", trackId: "t1" });
		expect(
			await t.query(api.savedTracks.isSaved, { userId: "u1", trackId: "t1" }),
		).toBe(false);
	});

	test("savedIds returns only matching tracks for the user", async () => {
		const t = setup();
		await t.mutation(api.savedTracks.save, {
			userId: "u1",
			trackId: "a",
			title: "x",
			artist: "y",
		});
		await t.mutation(api.savedTracks.save, {
			userId: "u1",
			trackId: "b",
			title: "x",
			artist: "y",
		});
		const ids = await t.query(api.savedTracks.savedIds, {
			userId: "u1",
			trackIds: ["a", "c"],
		});
		expect(ids.sort()).toEqual(["a"]);
	});
});

describe("albums", () => {
	test("saveAlbum re-syncs tracklist and unsaveAlbum cascades", async () => {
		const t = setup();
		const albumId = await t.mutation(api.albums.saveAlbum, {
			userId: "u1",
			deezerAlbumId: "d1",
			title: "Alb",
			artist: "Art",
			tracks: [
				{ trackId: "t1", title: "one", artist: "a" },
				{ trackId: "t2", title: "two", artist: "a" },
			],
		});
		expect((await t.query(api.albums.listAlbumTracks, { albumId })).length).toBe(
			2,
		);

		// Re-save with a different tracklist → old tracks dropped.
		await t.mutation(api.albums.saveAlbum, {
			userId: "u1",
			deezerAlbumId: "d1",
			title: "Alb",
			artist: "Art",
			tracks: [{ trackId: "t3", title: "three", artist: "a" }],
		});
		const tracks = await t.query(api.albums.listAlbumTracks, { albumId });
		expect(tracks.map((x) => x.trackId)).toEqual(["t3"]);

		// Unsave cascades albumTracks and returns evicted trackIds.
		const evicted = await t.mutation(api.albums.unsaveAlbum, {
			userId: "u1",
			deezerAlbumId: "d1",
		});
		expect(evicted).toEqual(["t3"]);
		expect((await t.query(api.albums.listAlbumTracks, { albumId })).length).toBe(
			0,
		);
	});
});

describe("playlists", () => {
	test("addTracks assigns positions and skips duplicates", async () => {
		const t = setup();
		const id = await t.mutation(api.playlists.create, {
			userId: "u1",
			title: "P",
		});
		await t.mutation(api.playlists.addTracks, {
			playlistId: id,
			tracks: [
				{ trackId: "t1", title: "1", artist: "a" },
				{ trackId: "t2", title: "2", artist: "a" },
			],
		});
		const r = await t.mutation(api.playlists.addTracks, {
			playlistId: id,
			tracks: [{ trackId: "t1", title: "1", artist: "a" }],
		});
		expect(r.added).toBe(0); // dup skipped
		const tracks = await t.query(api.playlists.listTracks, { playlistId: id });
		expect(tracks.map((x) => x.position)).toEqual([0, 1]);
	});

	test("reorder rewrites positions; rejects length mismatch", async () => {
		const t = setup();
		const id = await t.mutation(api.playlists.create, {
			userId: "u1",
			title: "P",
		});
		await t.mutation(api.playlists.addTracks, {
			playlistId: id,
			tracks: [
				{ trackId: "t1", title: "1", artist: "a" },
				{ trackId: "t2", title: "2", artist: "a" },
			],
		});
		await t.mutation(api.playlists.reorder, {
			playlistId: id,
			orderedTrackIds: ["t2", "t1"],
		});
		const tracks = await t.query(api.playlists.listTracks, { playlistId: id });
		expect(tracks.map((x) => x.trackId)).toEqual(["t2", "t1"]);

		await expect(
			t.mutation(api.playlists.reorder, {
				playlistId: id,
				orderedTrackIds: ["t1"],
			}),
		).rejects.toThrow(/REORDER_LENGTH_MISMATCH/);
	});

	test("remove cascades playlist tracks", async () => {
		const t = setup();
		const id = await t.mutation(api.playlists.create, {
			userId: "u1",
			title: "P",
		});
		await t.mutation(api.playlists.addTracks, {
			playlistId: id,
			tracks: [{ trackId: "t1", title: "1", artist: "a" }],
		});
		await t.mutation(api.playlists.remove, { playlistId: id });
		expect(await t.query(api.playlists.get, { playlistId: id })).toBe(null);
		expect(
			(await t.query(api.playlists.listTracks, { playlistId: id })).length,
		).toBe(0);
	});
});

describe("storedTracks ref-counting", () => {
	test("refCount aggregates across saved/album/shared/recent", async () => {
		const t = setup();
		await t.mutation(api.savedTracks.save, {
			userId: "u1",
			trackId: "t1",
			title: "x",
			artist: "y",
		});
		await t.mutation(api.recentPlays.record, {
			userId: "u1",
			trackId: "t1",
			title: "x",
			artist: "y",
		});
		const refs = await t.query(api.storedTracks.refCount, { trackId: "t1" });
		expect(refs.saved).toBe(1);
		expect(refs.recent).toBe(1);
		expect(refs.total).toBe(2);
	});

	test("deleteByTrack returns storage paths and unlinks shares", async () => {
		const t = setup();
		await t.mutation(api.storedTracks.upsert, {
			trackId: "t1",
			bitrate: 320,
			storagePath: "p/320.mp3",
			storageType: "s3",
		});
		const { shareId } = await t.mutation(api.shares.shareTrack, {
			userId: "u1",
			trackId: "t1",
			title: "x",
			artist: "y",
		});
		const paths = await t.mutation(api.storedTracks.deleteByTrack, {
			trackId: "t1",
		});
		expect(paths).toEqual(["p/320.mp3"]);
		// Share survives but its storedTrackId is cleared.
		const resolved = await t.query(api.shares.resolveForPlayback, { shareId });
		expect(resolved?.share.storedTrackId).toBeUndefined();
	});
});

describe("config key/value", () => {
	test("set then get then remove", async () => {
		const t = setup();
		await t.mutation(api.config.set, {
			userId: "default",
			key: "spotify",
			value: { token: "abc" },
		});
		expect(
			await t.query(api.config.get, { userId: "default", key: "spotify" }),
		).toEqual({ token: "abc" });
		await t.mutation(api.config.remove, { userId: "default", key: "spotify" });
		expect(
			await t.query(api.config.get, { userId: "default", key: "spotify" }),
		).toBe(null);
	});
});

describe("stems", () => {
	test("lifecycle: upsert → processing → progress → completed", async () => {
		const t = setup();
		await t.mutation(api.stems.upsertSeparation, {
			trackId: "t1",
			mode: "two_stems",
		});
		await t.mutation(api.stems.markProcessing, { trackId: "t1" });
		await t.mutation(api.stems.updateProgress, { trackId: "t1", progress: 250 });
		let row = await t.query(api.stems.getByTrack, { trackId: "t1" });
		expect(row?.status).toBe("processing");
		expect(row?.progress).toBe(100); // clamped
		await t.mutation(api.stems.markCompleted, { trackId: "t1" });
		row = await t.query(api.stems.getByTrack, { trackId: "t1" });
		expect(row?.status).toBe("completed");
		expect(row?.progress).toBe(100);
	});
});
