import { describe, it, expect } from "vitest";
import { mediaMetadataInit } from "./media-session";

describe("mediaMetadataInit", () => {
	it("shows the album on the OS media controls (was: title and artist only)", () => {
		const init = mediaMetadataInit({
			title: "One",
			artist: "Metallica",
			album: "...And Justice for All",
			cover: "https://e-cdns-images.dzcdn.net/images/cover/abc/1000x1000-000000-80-0-0.jpg",
		});
		expect(init.album).toBe("...And Justice for All");
		expect(init.artwork).toEqual([
			{
				src: "https://e-cdns-images.dzcdn.net/images/cover/abc/256x256-000000-80-0-0.jpg",
				sizes: "256x256",
				type: "image/jpeg",
			},
			{
				src: "https://e-cdns-images.dzcdn.net/images/cover/abc/512x512-000000-80-0-0.jpg",
				sizes: "512x512",
				type: "image/jpeg",
			},
		]);
	});

	it("copes with a track without album or cover", () => {
		expect(mediaMetadataInit({ title: "T", artist: "A", cover: null })).toEqual({
			title: "T",
			artist: "A",
			album: "",
			artwork: [],
		});
	});
});
