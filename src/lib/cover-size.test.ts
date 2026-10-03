import { describe, it, expect } from "vitest";
import { coverAt, isSizedCover, pickCoverSize } from "./cover-size";

const DZ = "https://cdn-images.dzcdn.net/images/cover/abc123/250x250-000000-80-0-0.jpg";

describe("pickCoverSize", () => {
	it("asks for 120px for a 48px row thumbnail on a 2x screen (was: 1000px for every cover)", () => {
		expect(pickCoverSize(48, 2)).toBe(120);
	});

	it("picks the smallest bucket that covers the rendered size", () => {
		expect(pickCoverSize(40, 1)).toBe(56);
		expect(pickCoverSize(56, 1)).toBe(56);
		expect(pickCoverSize(57, 1)).toBe(120);
		expect(pickCoverSize(180, 2)).toBe(500);
	});

	it("caps at the largest bucket", () => {
		expect(pickCoverSize(600, 3)).toBe(1000);
	});

	it("treats a missing / sub-1 dpr as 1", () => {
		expect(pickCoverSize(100)).toBe(120);
		expect(pickCoverSize(100, 0.5)).toBe(120);
	});
});

describe("coverAt / isSizedCover", () => {
	it("rewrites the size segment of a Deezer cover", () => {
		expect(isSizedCover(DZ)).toBe(true);
		expect(coverAt(DZ, 120)).toBe("https://cdn-images.dzcdn.net/images/cover/abc123/120x120-000000-80-0-0.jpg");
	});

	it("leaves other URLs alone", () => {
		const other = "https://i.scdn.co/image/ab67616d0000b273";
		expect(isSizedCover(other)).toBe(false);
		expect(coverAt(other, 120)).toBe(other);
	});
});
