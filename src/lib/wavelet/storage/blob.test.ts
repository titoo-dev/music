import { describe, it, expect } from "vitest";
import {
	StorageNotFoundError,
	StorageUnavailableError,
	inferContentType,
	isStorageNotFound,
	isStorageUnavailable,
	toBlobPathname,
} from "./blob";

describe("toBlobPathname", () => {
	it("strips leading slashes", () => {
		expect(toBlobPathname("/data/music/A/B.mp3")).toBe("data/music/A/B.mp3");
		expect(toBlobPathname("///x.flac")).toBe("x.flac");
	});

	it("normalizes Windows separators", () => {
		expect(toBlobPathname("music\\Artist\\Album\\T.flac")).toBe("music/Artist/Album/T.flac");
	});

	it("leaves an already-relative pathname untouched", () => {
		expect(toBlobPathname("music/A - B/01 - T.mp3")).toBe("music/A - B/01 - T.mp3");
	});
});

describe("inferContentType", () => {
	it.each([
		["a.flac", "audio/flac"],
		["a.mp4", "audio/mp4"],
		["a.mp3", "audio/mpeg"],
		["cover.JPG", "image/jpeg"],
		["cover.jpeg", "image/jpeg"],
		["cover.png", "image/png"],
		["noext", "audio/mpeg"],
	])("%s → %s", (path, type) => {
		expect(inferContentType(path)).toBe(type);
	});
});

describe("storage error guards", () => {
	it("recognizes StorageNotFoundError only", () => {
		const e = new StorageNotFoundError("music/x.mp3");
		expect(isStorageNotFound(e)).toBe(true);
		expect(isStorageUnavailable(e)).toBe(false);
		expect(e.name).toBe("NotFound");
		expect(e.message).toContain("music/x.mp3");
	});

	it("recognizes StorageUnavailableError only and keeps the cause", () => {
		const cause = new Error("503");
		const e = new StorageUnavailableError(cause);
		expect(isStorageUnavailable(e)).toBe(true);
		expect(isStorageNotFound(e)).toBe(false);
		expect(e.cause).toBe(cause);
	});

	it("rejects look-alike errors (was: routes matched on e.name === 'NotFound')", () => {
		const fake = Object.assign(new Error("x"), { name: "NotFound" });
		expect(isStorageNotFound(fake)).toBe(false);
		expect(isStorageUnavailable(null)).toBe(false);
	});
});
