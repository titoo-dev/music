import { describe, it, expect } from "vitest";
import { albumFromRaw, deezerImage, explorePictures, parseExploreSections, parseNewReleases } from "./discover";

describe("discover", () => {
	it("builds CDN image URLs and passes full URLs through", () => {
		expect(deezerImage("abc")).toBe("https://e-cdns-images.dzcdn.net/images/cover/abc/500x500-000000-80-0-0.jpg");
		expect(deezerImage("abc", "artist", 250)).toBe("https://e-cdns-images.dzcdn.net/images/artist/abc/250x250-000000-80-0-0.jpg");
		expect(deezerImage("https://x/y.jpg")).toBe("https://x/y.jpg");
		expect(deezerImage(null)).toBeNull();
	});

	it("parses GW and public-API albums", () => {
		expect(albumFromRaw({ ALB_ID: "1", ALB_TITLE: "A", ART_NAME: "B", ALB_PICTURE: "md5" })).toEqual({
			id: "1",
			title: "A",
			artist: "B",
			cover: "https://e-cdns-images.dzcdn.net/images/cover/md5/500x500-000000-80-0-0.jpg",
		});
		expect(albumFromRaw({ id: 2, title: "C", artist: { name: "D" }, cover_big: "https://c/big.jpg" })).toEqual({
			id: "2",
			title: "C",
			artist: "D",
			cover: "https://c/big.jpg",
		});
		expect(albumFromRaw({ title: "no id" })).toBeNull();
		expect(albumFromRaw(null)).toBeNull();
	});

	it("parses new releases, skipping malformed entries", () => {
		expect(parseNewReleases({ data: [{ id: 1, title: "X" }, { nope: true }] })).toEqual([{ id: "1", title: "X", artist: null, cover: null }]);
		expect(parseNewReleases(undefined)).toEqual([]);
	});

	it("keeps only album items of titled explore sections", () => {
		const page = {
			sections: [
				{
					title: "Hot",
					items: [
						{ type: "album", data: { ALB_ID: "9", ALB_TITLE: "GW", ART_NAME: "Z" } },
						{ type: "album", id: "8", title: "Item", subtitle: "Y", pictures: [{ md5: "p", type: "cover" }] },
						{ type: "channel", id: "7", title: "Chan" },
					],
				},
				{ title: "Channels only", items: [{ type: "channel", id: "1" }] },
				{ items: [{ type: "album", id: "5", title: "Untitled section" }] },
			],
		};
		const sections = parseExploreSections(page);
		expect(sections).toHaveLength(1);
		expect(sections[0].title).toBe("Hot");
		expect(sections[0].albums.map((a) => a.id)).toEqual(["9", "8"]);
		expect(sections[0].albums[1].cover).toContain("/cover/p/");
	});

	it("collects every pictured explore item", () => {
		const page = { sections: [{ items: [{ pictures: [{ md5: "a", type: "playlist" }] }, { pictures: [] }, {}] }] };
		expect(explorePictures(page)).toEqual(["https://e-cdns-images.dzcdn.net/images/playlist/a/500x500-000000-80-0-0.jpg"]);
		expect(explorePictures(null)).toEqual([]);
	});
});
