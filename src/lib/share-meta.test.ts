// @vitest-environment node
import { describe, it, expect } from "vitest";
import { MAX_SHARE_TEXT, safeCoverUrl, sanitizeShareMeta } from "./share-meta";

const cover = "https://e-cdns-images.dzcdn.net/images/cover/abc/250x250-000000-80-0-0.jpg";

describe("safeCoverUrl", () => {
	it("keeps https Deezer artwork", () => {
		expect(safeCoverUrl(cover)).toBe(cover);
		expect(safeCoverUrl("https://cdn-images.dzcdn.net/images/cover/x/500x500.jpg")).not.toBeNull();
		expect(safeCoverUrl("https://api.deezer.com/album/302127/image")).not.toBeNull();
	});

	it("drops any other URL (was: the OG renderer fetched whatever coverUrl the client sent)", () => {
		for (const u of [
			"http://e-cdns-images.dzcdn.net/x.jpg",
			"https://169.254.169.254/latest/meta-data",
			"https://evil.example/dzcdn.net.jpg",
			"https://dzcdn.net.evil.example/x.jpg",
			"file:///etc/passwd",
			"not a url",
			42,
			null,
		]) {
			expect(safeCoverUrl(u)).toBeNull();
		}
	});
});

describe("sanitizeShareMeta", () => {
	it("trims and caps the text fields", () => {
		const long = "x".repeat(MAX_SHARE_TEXT + 50);
		const m = sanitizeShareMeta({ title: `  ${long} `, artist: " Band ", album: " LP " });
		expect(m.title).toHaveLength(MAX_SHARE_TEXT);
		expect(m.artist).toBe("Band");
		expect(m.album).toBe("LP");
	});

	it("keeps a sane duration only", () => {
		expect(sanitizeShareMeta({ duration: 200 }).duration).toBe(200);
		expect(sanitizeShareMeta({ duration: 200.7 }).duration).toBe(200);
		for (const d of ["200", -1, NaN, 1e9, null, undefined]) expect(sanitizeShareMeta({ duration: d }).duration).toBeNull();
	});

	it("drops non-string album and foreign covers", () => {
		const m = sanitizeShareMeta({ album: { x: 1 }, coverUrl: "https://evil.example/a.jpg" });
		expect(m.album).toBeNull();
		expect(m.coverUrl).toBeNull();
	});
});
