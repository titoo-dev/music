// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import Track from "./Track";
import { clearMetadataCache } from "../cache/metadata-cache";
import type { Deezer } from "@/lib/deezer";

function apiTrack(id: number, albumId = 10) {
	return {
		id,
		title: `Song ${id}`,
		duration: 200,
		bpm: 120,
		track_position: 1,
		disk_number: 1,
		isrc: "ISRC",
		explicit_lyrics: false,
		contributors: [{ id: 5, name: "Artist", role: "Main" }],
		artist: { id: 5, name: "Artist", md5_image: "" },
		album: { id: albumId, title: "Album", md5_origin: "" },
		lyrics: { LYRICS_TEXT: "la la" },
		filesizes: {},
	};
}

function albumApi() {
	return {
		id: 10,
		title: "Album",
		nb_disk: 1,
		nb_tracks: 2,
		// No picture: parseData then looks the artist up for its picture md5.
		artist: { id: 5, name: "Artist", picture_small: "" },
		contributors: [{ id: 5, name: "Artist", role: "Main" }],
		release_date: "2020-01-02",
		md5_image: "cover-md5",
		genres: { data: [] },
	};
}

function fakeDz() {
	return {
		api: {
			getTrack: vi.fn(),
			get_album: vi.fn(async () => albumApi()),
			get_artist: vi.fn(async () => ({
				picture_small: "https://e-cdns-images.dzcdn.net/images/artist/f2bc007e9133c946ac3c3907ddc5d2ea/56x56-000000-80-0-0.jpg",
			})),
		},
		gw: {
			get_album: vi.fn(async () => ({})),
			get_track_lyrics: vi.fn(),
		},
	};
}

describe("Track.parseData enrichment", () => {
	beforeEach(() => clearMetadataCache());

	it("keeps enriching when the artist lookup fails (was: an uncaught api.get_artist error meant the track was never cached)", async () => {
		const dz = fakeDz();
		dz.api.get_artist.mockRejectedValue(new Error("deezer api 500"));
		const track = new Track();

		await expect(track.parseData(dz as unknown as Deezer, 1, apiTrack(1) as never, undefined, undefined, false)).resolves.toBe(track);
		expect(track.album?.title).toBe("Album");
		expect(track.album?.mainArtist.pic.md5).toBe("");
	});

	it("reads the artist picture md5 when the lookup works", async () => {
		const dz = fakeDz();
		const track = new Track();
		await track.parseData(dz as unknown as Deezer, 1, apiTrack(1) as never, undefined, undefined, false);
		expect(track.album?.mainArtist.pic.md5).toBe("f2bc007e9133c946ac3c3907ddc5d2ea");
	});

	it("reuses the album and artist lookups for the next track of the same album (was: 4-6 sequential Deezer calls per track)", async () => {
		const dz = fakeDz();
		await new Track().parseData(dz as unknown as Deezer, 1, apiTrack(1) as never, undefined, undefined, false);
		const second = new Track();
		await second.parseData(dz as unknown as Deezer, 2, apiTrack(2) as never, undefined, undefined, false);

		expect(dz.api.get_album).toHaveBeenCalledTimes(1);
		expect(dz.api.get_artist).toHaveBeenCalledTimes(1);
		expect(second.album?.title).toBe("Album");
	});

	it("reuses the gw album lookup too (albums without a disk count)", async () => {
		const dz = fakeDz();
		dz.api.get_album.mockResolvedValue({ ...albumApi(), nb_disk: 0 });
		await new Track().parseData(dz as unknown as Deezer, 1, apiTrack(1) as never, undefined, undefined, false);
		await new Track().parseData(dz as unknown as Deezer, 2, apiTrack(2) as never, undefined, undefined, false);
		expect(dz.gw.get_album).toHaveBeenCalledTimes(1);
	});

	it("does not let one track's parsing mutate the cached album (each lookup is a copy)", async () => {
		const dz = fakeDz();
		const first = new Track();
		await first.parseData(dz as unknown as Deezer, 1, { ...apiTrack(1), genres: ["Pop"] } as never, undefined, undefined, false);
		const second = new Track();
		await second.parseData(dz as unknown as Deezer, 2, apiTrack(2) as never, undefined, undefined, false);
		expect(first.album?.genre).toContain("Pop");
		expect(second.album?.genre ?? []).not.toContain("Pop");
	});

	it("retries a failed album lookup instead of caching the failure", async () => {
		const dz = fakeDz();
		dz.api.get_album.mockRejectedValueOnce(new Error("blip"));
		// Without any album data the first parse may fail; what matters is the retry.
		await new Track().parseData(dz as unknown as Deezer, 1, apiTrack(1) as never, undefined, undefined, false).catch(() => {});
		await new Track().parseData(dz as unknown as Deezer, 2, apiTrack(2) as never, undefined, undefined, false);
		expect(dz.api.get_album).toHaveBeenCalledTimes(2);
	});
});
