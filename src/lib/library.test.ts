import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/server-state", () => ({
	getDeemixApp: vi.fn(async () => null),
}));

import {
	saveTrack,
	unsaveTrack,
	isTrackSaved,
	getSavedTrackIds,
	listSavedTracks,
	saveAlbum,
	unsaveAlbum,
	listSavedAlbums,
	getSavedAlbumIds,
	getTrackRefCount,
	maybeEvictFile,
	forceEvictFile,
	isPreCacheEnabled,
	reorderPlaylist,
} from "./library";
import { getDeemixApp } from "@/lib/server-state";

const getDeemixAppMock = vi.mocked(getDeemixApp);

beforeEach(() => {
	resetPrismaMock();
	getDeemixAppMock.mockReset();
	getDeemixAppMock.mockResolvedValue(null as any);
});

describe("saveTrack", () => {
	it("upserts on userId_trackId composite and returns the row", async () => {
		const row = { id: "s1", userId: "u1", trackId: "t1" } as any;
		prismaMock.savedTrack.upsert.mockResolvedValue(row);

		const result = await saveTrack("u1", {
			trackId: "t1",
			title: "Hello",
			artist: "Adele",
			album: "25",
			albumId: "a1",
			coverUrl: "http://cover/1.jpg",
			duration: 295,
		});

		expect(result).toBe(row);
		expect(prismaMock.savedTrack.upsert).toHaveBeenCalledWith({
			where: { userId_trackId: { userId: "u1", trackId: "t1" } },
			update: {},
			create: {
				userId: "u1",
				trackId: "t1",
				title: "Hello",
				artist: "Adele",
				album: "25",
				albumId: "a1",
				coverUrl: "http://cover/1.jpg",
				duration: 295,
			},
		});
	});

	it("defaults optional fields to null when omitted", async () => {
		prismaMock.savedTrack.upsert.mockResolvedValue({} as any);
		await saveTrack("u1", {
			trackId: "t1",
			title: "T",
			artist: "A",
		});
		const args = prismaMock.savedTrack.upsert.mock.calls[0][0] as any;
		expect(args.create).toMatchObject({
			album: null,
			albumId: null,
			coverUrl: null,
			duration: null,
		});
	});
});

describe("unsaveTrack", () => {
	it("deletes the saved row for the user and attempts to evict", async () => {
		prismaMock.savedTrack.deleteMany.mockResolvedValue({ count: 1 } as any);
		// Force refs to all be 0 so maybeEvictFile -> forceEvictFile is called
		prismaMock.savedTrack.count.mockResolvedValue(0 as any);
		prismaMock.albumTrack.count.mockResolvedValue(0 as any);
		prismaMock.sharedTrack.count.mockResolvedValue(0 as any);
		prismaMock.recentPlay.count.mockResolvedValue(0 as any);
		prismaMock.storedTrack.findMany.mockResolvedValue([] as any);

		await unsaveTrack("u1", "t1");

		expect(prismaMock.savedTrack.deleteMany).toHaveBeenCalledWith({
			where: { userId: "u1", trackId: "t1" },
		});
	});

	it("does not call forceEvictFile when there are still references", async () => {
		prismaMock.savedTrack.deleteMany.mockResolvedValue({ count: 1 } as any);
		prismaMock.savedTrack.count.mockResolvedValue(1 as any);
		prismaMock.albumTrack.count.mockResolvedValue(0 as any);
		prismaMock.sharedTrack.count.mockResolvedValue(0 as any);
		prismaMock.recentPlay.count.mockResolvedValue(0 as any);

		await unsaveTrack("u1", "t1");

		expect(prismaMock.storedTrack.findMany).not.toHaveBeenCalled();
		expect(prismaMock.storedTrack.deleteMany).not.toHaveBeenCalled();
	});
});

describe("isTrackSaved", () => {
	it("returns true when a row is found", async () => {
		prismaMock.savedTrack.findUnique.mockResolvedValue({ id: "x" } as any);
		const result = await isTrackSaved("u1", "t1");
		expect(result).toBe(true);
		expect(prismaMock.savedTrack.findUnique).toHaveBeenCalledWith({
			where: { userId_trackId: { userId: "u1", trackId: "t1" } },
			select: { id: true },
		});
	});

	it("returns false when no row exists", async () => {
		prismaMock.savedTrack.findUnique.mockResolvedValue(null);
		const result = await isTrackSaved("u1", "t1");
		expect(result).toBe(false);
	});
});

describe("getSavedTrackIds", () => {
	it("returns an empty Set without hitting Prisma when given no ids", async () => {
		const result = await getSavedTrackIds("u1", []);
		expect(result).toBeInstanceOf(Set);
		expect(result.size).toBe(0);
		expect(prismaMock.savedTrack.findMany).not.toHaveBeenCalled();
	});

	it("returns a Set of saved trackIds for the user", async () => {
		prismaMock.savedTrack.findMany.mockResolvedValue([
			{ trackId: "t1" },
			{ trackId: "t3" },
		] as any);

		const result = await getSavedTrackIds("u1", ["t1", "t2", "t3"]);
		expect(result).toBeInstanceOf(Set);
		expect([...result].sort()).toEqual(["t1", "t3"]);
		expect(prismaMock.savedTrack.findMany).toHaveBeenCalledWith({
			where: { userId: "u1", trackId: { in: ["t1", "t2", "t3"] } },
			select: { trackId: true },
		});
	});
});

describe("listSavedTracks", () => {
	it("orders by savedAt desc and passes take/skip from opts", async () => {
		const items = [{ id: "1" }, { id: "2" }] as any;
		prismaMock.savedTrack.findMany.mockResolvedValue(items);

		const result = await listSavedTracks("u1", { limit: 50, offset: 25 });
		expect(result).toBe(items);
		expect(prismaMock.savedTrack.findMany).toHaveBeenCalledWith({
			where: { userId: "u1" },
			orderBy: { savedAt: "desc" },
			take: 50,
			skip: 25,
		});
	});

	it("passes undefined take/skip when no opts provided", async () => {
		prismaMock.savedTrack.findMany.mockResolvedValue([] as any);
		await listSavedTracks("u1");
		expect(prismaMock.savedTrack.findMany).toHaveBeenCalledWith({
			where: { userId: "u1" },
			orderBy: { savedAt: "desc" },
			take: undefined,
			skip: undefined,
		});
	});
});

describe("saveAlbum", () => {
	it("upserts the album, deletes existing tracks, and creates the new tracklist", async () => {
		const saved = { id: "alb-internal-1" } as any;
		prismaMock.album.upsert.mockResolvedValue(saved);
		prismaMock.albumTrack.deleteMany.mockResolvedValue({ count: 0 } as any);
		prismaMock.albumTrack.createMany.mockResolvedValue({ count: 2 } as any);

		const result = await saveAlbum(
			"u1",
			{
				deezerAlbumId: "deezer-abc",
				title: "Album Title",
				artist: "Artist",
				coverUrl: "http://cover.jpg",
			},
			[
				{
					trackId: "t1",
					title: "Track 1",
					artist: "Artist",
					duration: 200,
					trackNumber: 1,
				},
				{
					trackId: "t2",
					title: "Track 2",
					artist: "Artist",
				},
			]
		);

		expect(result).toBe(saved);

		expect(prismaMock.album.upsert).toHaveBeenCalledWith({
			where: {
				userId_deezerAlbumId: { userId: "u1", deezerAlbumId: "deezer-abc" },
			},
			update: {
				title: "Album Title",
				artist: "Artist",
				coverUrl: "http://cover.jpg",
				trackCount: 2,
			},
			create: {
				userId: "u1",
				deezerAlbumId: "deezer-abc",
				title: "Album Title",
				artist: "Artist",
				coverUrl: "http://cover.jpg",
				trackCount: 2,
			},
		});

		expect(prismaMock.albumTrack.deleteMany).toHaveBeenCalledWith({
			where: { albumId: "alb-internal-1" },
		});

		expect(prismaMock.albumTrack.createMany).toHaveBeenCalledWith({
			data: [
				{
					albumId: "alb-internal-1",
					trackId: "t1",
					title: "Track 1",
					artist: "Artist",
					coverUrl: null,
					duration: 200,
					trackNumber: 1,
				},
				{
					albumId: "alb-internal-1",
					trackId: "t2",
					title: "Track 2",
					artist: "Artist",
					coverUrl: null,
					duration: null,
					trackNumber: null,
				},
			],
			skipDuplicates: true,
		});
	});

	it("does not call createMany when there are no tracks", async () => {
		prismaMock.album.upsert.mockResolvedValue({ id: "alb-1" } as any);
		prismaMock.albumTrack.deleteMany.mockResolvedValue({ count: 0 } as any);

		await saveAlbum(
			"u1",
			{ deezerAlbumId: "d", title: "T", artist: "A" },
			[]
		);

		expect(prismaMock.albumTrack.deleteMany).toHaveBeenCalledWith({
			where: { albumId: "alb-1" },
		});
		expect(prismaMock.albumTrack.createMany).not.toHaveBeenCalled();
	});
});

describe("unsaveAlbum", () => {
	it("returns early when the album doesn't exist", async () => {
		prismaMock.album.findUnique.mockResolvedValue(null);
		await unsaveAlbum("u1", "deezer-x");
		expect(prismaMock.album.delete).not.toHaveBeenCalled();
	});

	it("deletes the album and tries to evict files for each track", async () => {
		prismaMock.album.findUnique.mockResolvedValue({
			id: "alb-1",
			tracks: [{ trackId: "t1" }, { trackId: "t2" }],
		} as any);
		prismaMock.album.delete.mockResolvedValue({} as any);
		prismaMock.savedTrack.count.mockResolvedValue(0 as any);
		prismaMock.albumTrack.count.mockResolvedValue(0 as any);
		prismaMock.sharedTrack.count.mockResolvedValue(0 as any);
		prismaMock.recentPlay.count.mockResolvedValue(0 as any);
		prismaMock.storedTrack.findMany.mockResolvedValue([] as any);

		await unsaveAlbum("u1", "deezer-abc");

		expect(prismaMock.album.delete).toHaveBeenCalledWith({
			where: { id: "alb-1" },
		});
		// 2 tracks × 4 ref counts = 8 .count() calls
		expect(prismaMock.savedTrack.count).toHaveBeenCalledTimes(2);
		expect(prismaMock.albumTrack.count).toHaveBeenCalledTimes(2);
	});
});

describe("listSavedAlbums", () => {
	it("returns albums ordered by savedAt desc", async () => {
		const items = [{ id: "a1" }, { id: "a2" }] as any;
		prismaMock.album.findMany.mockResolvedValue(items);

		const result = await listSavedAlbums("u1");
		expect(result).toBe(items);
		expect(prismaMock.album.findMany).toHaveBeenCalledWith({
			where: { userId: "u1" },
			orderBy: { savedAt: "desc" },
		});
	});
});

describe("getSavedAlbumIds", () => {
	it("returns an empty Set without hitting Prisma when given no ids", async () => {
		const result = await getSavedAlbumIds("u1", []);
		expect(result).toBeInstanceOf(Set);
		expect(result.size).toBe(0);
		expect(prismaMock.album.findMany).not.toHaveBeenCalled();
	});

	it("returns a Set of saved deezerAlbumIds for the user", async () => {
		prismaMock.album.findMany.mockResolvedValue([
			{ deezerAlbumId: "a1" },
			{ deezerAlbumId: "a3" },
		] as any);

		const result = await getSavedAlbumIds("u1", ["a1", "a2", "a3"]);
		expect([...result].sort()).toEqual(["a1", "a3"]);
		expect(prismaMock.album.findMany).toHaveBeenCalledWith({
			where: { userId: "u1", deezerAlbumId: { in: ["a1", "a2", "a3"] } },
			select: { deezerAlbumId: true },
		});
	});
});

describe("getTrackRefCount", () => {
	it("aggregates counts from all 4 ref tables", async () => {
		prismaMock.savedTrack.count.mockResolvedValue(2 as any);
		prismaMock.albumTrack.count.mockResolvedValue(3 as any);
		prismaMock.sharedTrack.count.mockResolvedValue(1 as any);
		prismaMock.recentPlay.count.mockResolvedValue(4 as any);

		const result = await getTrackRefCount("t1");
		expect(result).toEqual({
			saved: 2,
			album: 3,
			shared: 1,
			recent: 4,
			total: 10,
		});

		expect(prismaMock.savedTrack.count).toHaveBeenCalledWith({
			where: { trackId: "t1" },
		});
		expect(prismaMock.albumTrack.count).toHaveBeenCalledWith({
			where: { trackId: "t1" },
		});
		expect(prismaMock.sharedTrack.count).toHaveBeenCalledWith({
			where: { trackId: "t1" },
		});
		expect(prismaMock.recentPlay.count).toHaveBeenCalledWith({
			where: { trackId: "t1" },
		});
	});
});

describe("forceEvictFile", () => {
	it("returns 0 and skips work when no StoredTrack rows exist", async () => {
		prismaMock.storedTrack.findMany.mockResolvedValue([] as any);
		const result = await forceEvictFile("t1");
		expect(result).toBe(0);
		expect(prismaMock.storedTrack.deleteMany).not.toHaveBeenCalled();
		expect(prismaMock.sharedTrack.updateMany).not.toHaveBeenCalled();
	});

	it("nulls SharedTrack.storedTrackId and deletes StoredTrack rows", async () => {
		prismaMock.storedTrack.findMany.mockResolvedValue([
			{ id: "st1", storagePath: "/p1" },
			{ id: "st2", storagePath: "/p2" },
		] as any);
		prismaMock.sharedTrack.updateMany.mockResolvedValue({ count: 0 } as any);
		prismaMock.storedTrack.deleteMany.mockResolvedValue({ count: 2 } as any);

		// no storage provider => deleted counter stays 0
		const result = await forceEvictFile("t1");
		expect(result).toBe(0);

		expect(prismaMock.sharedTrack.updateMany).toHaveBeenCalledWith({
			where: { storedTrackId: { in: ["st1", "st2"] } },
			data: { storedTrackId: null },
		});
		expect(prismaMock.storedTrack.deleteMany).toHaveBeenCalledWith({
			where: { id: { in: ["st1", "st2"] } },
		});
	});

	it("calls storageProvider.deleteFile for each row when one exists", async () => {
		const deleteFile = vi.fn().mockResolvedValue(undefined);
		getDeemixAppMock.mockResolvedValue({
			storageProvider: { deleteFile },
		} as any);
		prismaMock.storedTrack.findMany.mockResolvedValue([
			{ id: "st1", storagePath: "/p1" },
			{ id: "st2", storagePath: "/p2" },
		] as any);
		prismaMock.sharedTrack.updateMany.mockResolvedValue({ count: 0 } as any);
		prismaMock.storedTrack.deleteMany.mockResolvedValue({ count: 2 } as any);

		const result = await forceEvictFile("t1");
		expect(result).toBe(2);
		expect(deleteFile).toHaveBeenCalledTimes(2);
		expect(deleteFile).toHaveBeenCalledWith("/p1");
		expect(deleteFile).toHaveBeenCalledWith("/p2");
	});
});

describe("maybeEvictFile", () => {
	it("triggers forceEvictFile when total refs are 0", async () => {
		prismaMock.savedTrack.count.mockResolvedValue(0 as any);
		prismaMock.albumTrack.count.mockResolvedValue(0 as any);
		prismaMock.sharedTrack.count.mockResolvedValue(0 as any);
		prismaMock.recentPlay.count.mockResolvedValue(0 as any);
		prismaMock.storedTrack.findMany.mockResolvedValue([] as any);

		await maybeEvictFile("t1");

		expect(prismaMock.storedTrack.findMany).toHaveBeenCalledWith({
			where: { trackId: "t1" },
			select: { id: true, storagePath: true },
		});
	});

	it("does not call forceEvictFile when refs > 0", async () => {
		prismaMock.savedTrack.count.mockResolvedValue(0 as any);
		prismaMock.albumTrack.count.mockResolvedValue(0 as any);
		prismaMock.sharedTrack.count.mockResolvedValue(1 as any);
		prismaMock.recentPlay.count.mockResolvedValue(0 as any);

		await maybeEvictFile("t1");

		expect(prismaMock.storedTrack.findMany).not.toHaveBeenCalled();
	});
});

describe("isPreCacheEnabled", () => {
	it("returns true when preferences.preCacheSaved is true", async () => {
		prismaMock.userPreferences.findUnique.mockResolvedValue({
			preferences: { preCacheSaved: true },
		} as any);

		const result = await isPreCacheEnabled("u1");
		expect(result).toBe(true);
		expect(prismaMock.userPreferences.findUnique).toHaveBeenCalledWith({
			where: { userId: "u1" },
			select: { preferences: true },
		});
	});

	it("returns false when preferences.preCacheSaved is missing/false", async () => {
		prismaMock.userPreferences.findUnique.mockResolvedValue({
			preferences: { other: true },
		} as any);
		expect(await isPreCacheEnabled("u1")).toBe(false);

		prismaMock.userPreferences.findUnique.mockResolvedValue({
			preferences: { preCacheSaved: false },
		} as any);
		expect(await isPreCacheEnabled("u1")).toBe(false);
	});

	it("returns false when no UserPreferences row exists", async () => {
		prismaMock.userPreferences.findUnique.mockResolvedValue(null);
		expect(await isPreCacheEnabled("u1")).toBe(false);
	});
});

describe("reorderPlaylist", () => {
	it("rewrites positions 0..N-1 in the supplied order and bumps the playlist updatedAt", async () => {
		prismaMock.playlistTrack.findMany.mockResolvedValue([
			{ trackId: "a" },
			{ trackId: "b" },
			{ trackId: "c" },
		] as any);
		prismaMock.$transaction.mockResolvedValue([] as any);
		prismaMock.playlist.update.mockResolvedValue({} as any);
		// Each .update returns a thenable so the array we pass to $transaction is well-typed.
		prismaMock.playlistTrack.update.mockResolvedValue({} as any);

		const result = await reorderPlaylist("pl1", ["c", "a", "b"]);

		expect(result).toEqual({ reordered: 3 });
		expect(prismaMock.playlistTrack.findMany).toHaveBeenCalledWith({
			where: { playlistId: "pl1" },
			select: { trackId: true },
		});
		// Three updates queued, one per (trackId, newPosition).
		expect(prismaMock.playlistTrack.update).toHaveBeenNthCalledWith(1, {
			where: { playlistId_trackId: { playlistId: "pl1", trackId: "c" } },
			data: { position: 0 },
		});
		expect(prismaMock.playlistTrack.update).toHaveBeenNthCalledWith(2, {
			where: { playlistId_trackId: { playlistId: "pl1", trackId: "a" } },
			data: { position: 1 },
		});
		expect(prismaMock.playlistTrack.update).toHaveBeenNthCalledWith(3, {
			where: { playlistId_trackId: { playlistId: "pl1", trackId: "b" } },
			data: { position: 2 },
		});
		expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
		expect(prismaMock.playlist.update).toHaveBeenCalledWith({
			where: { id: "pl1" },
			data: { updatedAt: expect.any(Date) },
		});
	});

	it("throws REORDER_LENGTH_MISMATCH when the supplied order has the wrong number of trackIds", async () => {
		prismaMock.playlistTrack.findMany.mockResolvedValue([
			{ trackId: "a" },
			{ trackId: "b" },
		] as any);

		await expect(reorderPlaylist("pl1", ["a"])).rejects.toThrow("REORDER_LENGTH_MISMATCH");
		await expect(reorderPlaylist("pl1", ["a", "b", "c"])).rejects.toThrow(
			"REORDER_LENGTH_MISMATCH"
		);
		// No writes attempted when validation fails up front.
		expect(prismaMock.$transaction).not.toHaveBeenCalled();
		expect(prismaMock.playlistTrack.update).not.toHaveBeenCalled();
	});

	it("throws REORDER_DUPLICATE_TRACK when the supplied order repeats a trackId", async () => {
		prismaMock.playlistTrack.findMany.mockResolvedValue([
			{ trackId: "a" },
			{ trackId: "b" },
		] as any);

		await expect(reorderPlaylist("pl1", ["a", "a"])).rejects.toThrow(
			"REORDER_DUPLICATE_TRACK"
		);
		expect(prismaMock.$transaction).not.toHaveBeenCalled();
	});

	it("throws REORDER_UNKNOWN_TRACK when a supplied trackId is not part of the playlist", async () => {
		prismaMock.playlistTrack.findMany.mockResolvedValue([
			{ trackId: "a" },
			{ trackId: "b" },
		] as any);

		await expect(reorderPlaylist("pl1", ["a", "z"])).rejects.toThrow(
			"REORDER_UNKNOWN_TRACK"
		);
		expect(prismaMock.$transaction).not.toHaveBeenCalled();
	});
});
