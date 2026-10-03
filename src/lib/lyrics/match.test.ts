import { describe, it, expect } from "vitest";
import {
	normalize,
	cleanTitle,
	titleVariants,
	artistVariants,
	similarity,
	scoreCandidate,
	pickBest,
	type LyricsCandidate,
} from "./match";

const cand = (over: Partial<LyricsCandidate> = {}): LyricsCandidate => ({
	id: 1,
	trackName: "Blinding Lights",
	artistName: "The Weeknd",
	albumName: "After Hours",
	duration: 200,
	instrumental: false,
	plainLyrics: "Yeah",
	syncedLyrics: "[00:01.00]Yeah\n[00:05.00]I've been tryna call",
	...over,
});

describe("normalize", () => {
	it("strips accents, case, punctuation and apostrophes", () => {
		expect(normalize("  Beyoncé — Déjà Vu!! ")).toBe("beyonce deja vu");
		expect(normalize("Don’t Stop Me Now")).toBe("dont stop me now");
		expect(normalize("Simon & Garfunkel")).toBe("simon and garfunkel");
		expect(normalize("Ke$ha")).toBe("kesha");
	});

	it("keeps non-latin letters", () => {
		expect(normalize("夜に駆ける")).toBe("夜に駆ける");
	});
});

describe("cleanTitle", () => {
	it.each([
		["Blinding Lights (Remastered 2020)", "Blinding Lights"],
		["Song (feat. Someone)", "Song"],
		["Song [feat. A & B] - Radio Edit", "Song"],
		["Song ft. Guest", "Song"],
		["Bohemian Rhapsody - Remastered 2011", "Bohemian Rhapsody"],
		["Wonderwall - Live at Knebworth", "Wonderwall"],
		["Song (with Kygo)", "Song"],
		["Let It Go (From \"Frozen\")", "Let It Go"],
		["Hello (Versión Acústica)", "Hello"],
		["Track (Official Video)", "Track"],
		["Wake Me Up (Deluxe Edition) [Explicit]", "Wake Me Up"],
	])("%s → %s", (input, expected) => {
		expect(cleanTitle(input)).toBe(expected);
	});

	it("keeps parentheses that are part of the song name", () => {
		expect(cleanTitle("(I Can't Get No) Satisfaction")).toBe("(I Can't Get No) Satisfaction");
		expect(cleanTitle("Under Pressure - Bowie")).toBe("Under Pressure - Bowie");
	});

	it("never returns an empty title", () => {
		expect(cleanTitle("(Live)")).toBe("(Live)");
	});
});

describe("titleVariants", () => {
	it("offers the raw, cleaned and bracket-free titles, de-duplicated", () => {
		expect(titleVariants("Pt. 2 (Interlude) (Remastered)")).toEqual(["Pt. 2 (Interlude) (Remastered)", "Pt. 2 (Interlude)", "Pt. 2"]);
		expect(titleVariants("Plain")).toEqual(["Plain"]);
	});
});

describe("artistVariants", () => {
	it("adds the main artist of a multi-artist credit", () => {
		expect(artistVariants("Calvin Harris, Dua Lipa")).toEqual(["Calvin Harris, Dua Lipa", "Calvin Harris"]);
		expect(artistVariants("Daft Punk feat. Pharrell Williams")).toEqual(["Daft Punk feat. Pharrell Williams", "Daft Punk"]);
		expect(artistVariants("Major Lazer x DJ Snake")).toEqual(["Major Lazer x DJ Snake", "Major Lazer"]);
	});

	it("keeps duo names intact as the first variant", () => {
		expect(artistVariants("Simon & Garfunkel")[0]).toBe("Simon & Garfunkel");
		expect(artistVariants("Lil Nas X")).toEqual(["Lil Nas X"]);
	});
});

describe("similarity", () => {
	it("is 1 for equal-after-normalize strings and 0 for empties", () => {
		expect(similarity("Beyoncé", "beyonce")).toBe(1);
		expect(similarity("", "x")).toBe(0);
	});

	it("tolerates small typos", () => {
		expect(similarity("Blinding Lights", "Blindin Lights")).toBeGreaterThan(0.85);
	});

	it("does not treat a short word inside a longer title as a match (was: \"Love\" matched \"I Love You\")", () => {
		expect(similarity("Love", "I Love You")).toBeLessThan(0.72);
	});

	it("scores a mostly-covering containment highly", () => {
		expect(similarity("Blinding Lights", "Blinding Lights Extended")).toBeGreaterThan(0.72);
	});

	it("handles one-character strings", () => {
		expect(similarity("a", "a b")).toBeGreaterThan(0);
		expect(similarity("a", "b")).toBe(0);
	});
});

describe("scoreCandidate", () => {
	const q = { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: 200 };

	it("accepts an exact match with aligned sync", () => {
		const s = scoreCandidate(q, cand());
		expect(s?.syncReliable).toBe(true);
		expect(s!.score).toBeGreaterThan(0.95);
	});

	it("rejects candidates without any lyrics", () => {
		expect(scoreCandidate(q, cand({ plainLyrics: null, syncedLyrics: null }))).toBeNull();
		expect(scoreCandidate(q, cand({ trackName: "" }))).toBeNull();
	});

	it("rejects a different song by the same artist", () => {
		expect(scoreCandidate(q, cand({ trackName: "Save Your Tears" }))).toBeNull();
	});

	it("rejects the same title by another artist", () => {
		expect(scoreCandidate(q, cand({ artistName: "7clouds" }))).toBeNull();
	});

	it("matches \"Artist - Title\" uploads (was: LRCLIB search results named 'The Weeknd - Blinding Lights')", () => {
		const s = scoreCandidate(q, cand({ trackName: "The Weeknd - Blinding Lights (Official Audio)" }));
		expect(s).not.toBeNull();
		expect(s!.score).toBeGreaterThan(0.9);
	});

	it("accepts an uploader-named artist when the real artist is in the title", () => {
		const s = scoreCandidate(q, cand({ trackName: "The Weeknd - Blinding Lights", artistName: "SomeUploader" }));
		expect(s).not.toBeNull();
	});

	it("matches a featured credit against the main artist", () => {
		const s = scoreCandidate({ title: "One Kiss (feat. Dua Lipa)", artist: "Calvin Harris, Dua Lipa", duration: 214 }, cand({ trackName: "One Kiss", artistName: "Calvin Harris", duration: 214 }));
		expect(s?.syncReliable).toBe(true);
	});

	it("downgrades sync when the recording length differs by more than 3 s", () => {
		const s = scoreCandidate(q, cand({ duration: 206 }));
		expect(s?.syncReliable).toBe(false);
	});

	it("trusts sync when either duration is unknown", () => {
		expect(scoreCandidate({ ...q, duration: null }, cand())?.syncReliable).toBe(true);
		expect(scoreCandidate(q, cand({ duration: null }))?.syncReliable).toBe(true);
	});

	it("rejects a much longer recording unless it is a near-exact plain-text match", () => {
		expect(scoreCandidate(q, cand({ duration: 263, trackName: "Blinding Lights Extended" }))).toBeNull();
		const plain = scoreCandidate(q, cand({ duration: 263 }));
		expect(plain?.syncReliable).toBe(false);
	});

	it("only trusts an instrumental flag on a near-exact hit (was: wrong 'instrumental' hid real lyrics)", () => {
		const inst = { plainLyrics: null, syncedLyrics: null, instrumental: true };
		expect(scoreCandidate(q, cand({ ...inst, duration: 201 }))).not.toBeNull();
		expect(scoreCandidate(q, cand({ ...inst, duration: 210 }))).toBeNull();
		expect(scoreCandidate({ ...q, duration: null }, cand(inst))).toBeNull();
		expect(scoreCandidate(q, cand({ ...inst, trackName: "Blinding Lights Remix" }))).toBeNull();
	});

	it("gives a small bonus for the same album", () => {
		const same = scoreCandidate(q, cand())!.score;
		const other = scoreCandidate(q, cand({ albumName: "Greatest Hits" }))!.score;
		expect(same).toBeGreaterThan(other);
		expect(scoreCandidate({ ...q, album: null }, cand())!.score).toBe(other);
	});

	it("ranks closer durations higher", () => {
		const scores = [201, 203, 205, 209, 214].map((d) => scoreCandidate(q, cand({ duration: d, syncedLyrics: null }))!.score);
		for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThan(scores[i - 1]);
	});
});

describe("pickBest", () => {
	const q = { title: "Blinding Lights", artist: "The Weeknd", duration: 200 };

	it("returns null when nothing is acceptable", () => {
		expect(pickBest(q, [])).toBeNull();
		expect(pickBest(q, [cand({ trackName: "Other" })])).toBeNull();
	});

	it("prefers the aligned synced candidate over a misaligned or plain one", () => {
		const best = pickBest(q, [
			cand({ id: 1, duration: 263, syncedLyrics: "[00:01.00]a\n[00:02.00]b" }),
			cand({ id: 2, duration: 209 }),
			cand({ id: 3, duration: 201, syncedLyrics: null }),
			cand({ id: 4, duration: 201 }),
		]);
		expect(best?.candidate.id).toBe(4);
		expect(best?.syncReliable).toBe(true);
	});
});
