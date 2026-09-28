import { describe, it, expect, vi, afterEach } from "vitest";
import { sanitizeFileName, extensionFor, fileNameFor, fetchTrackFile, saveBlob } from "./download";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("file naming", () => {
	it("strips characters illegal on Windows/macOS and collapses whitespace", () => {
		expect(sanitizeFileName('AC/DC: "Back"  in  <Black>?')).toBe("AC DC Back in Black");
	});

	it("falls back to 'track' for empty names and caps length", () => {
		expect(sanitizeFileName("///")).toBe("track");
		expect(sanitizeFileName("a".repeat(300))).toHaveLength(180);
	});

	it.each([
		["audio/flac", "flac"],
		["audio/x-flac", "flac"],
		["audio/mp4", "m4a"],
		["audio/ogg", "ogg"],
		["audio/mpeg", "mp3"],
		[null, "mp3"],
	])("maps %s to .%s", (ct, ext) => {
		expect(extensionFor(ct)).toBe(ext);
	});

	it("builds 'Artist - Title.ext', or just the title without artist", () => {
		expect(fileNameFor({ title: "One", artist: "Metallica" }, "audio/flac")).toBe("Metallica - One.flac");
		expect(fileNameFor({ title: "One", artist: "" })).toBe("One.mp3");
	});
});

function streamOf(parts: string[]) {
	const enc = new TextEncoder();
	return new ReadableStream<Uint8Array>({
		start(c) {
			for (const p of parts) c.enqueue(enc.encode(p));
			c.close();
		},
	});
}

describe("fetchTrackFile", () => {
	it("streams the body and reports cumulative progress", async () => {
		const res = new Response(streamOf(["ab", "cde"]), {
			headers: { "content-type": "audio/flac", "content-length": "5" },
		});
		const fetchMock = vi.fn().mockResolvedValue(res);
		vi.stubGlobal("fetch", fetchMock);
		const progress: [number, number | null][] = [];
		const out = await fetchTrackFile("42", (p) => progress.push([p.loaded, p.total]));
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/v1/stream/42",
			expect.objectContaining({ credentials: "include" })
		);
		expect(progress).toEqual([
			[2, 5],
			[5, 5],
		]);
		expect(out.blob.size).toBe(5);
		expect(out.contentType).toBe("audio/flac");
	});

	it("reports a null total when Content-Length is missing", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(streamOf(["x"]))));
		const totals: (number | null)[] = [];
		await fetchTrackFile("1", (p) => totals.push(p.total));
		expect(totals).toEqual([null]);
	});

	it("falls back to blob() when there is no readable body", async () => {
		const fake = {
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "audio/mpeg" }),
			body: null,
			blob: async () => new Blob(["abc"]),
		};
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fake));
		const seen: number[] = [];
		const out = await fetchTrackFile("1", (p) => seen.push(p.loaded));
		expect(out.blob.size).toBe(3);
		expect(seen).toEqual([3]);
	});

	it("throws the API error message on failure", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ success: false, error: { message: "Not signed in" } }), {
					status: 401,
				})
			)
		);
		await expect(fetchTrackFile("1", () => {})).rejects.toThrow("Not signed in");
	});

	it("throws a status message when the error body isn't JSON", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 502 })));
		await expect(fetchTrackFile("1", () => {})).rejects.toThrow("Download failed (502)");
	});
});

describe("saveBlob", () => {
	it("clicks a temporary anchor with the file name, then revokes the URL", () => {
		vi.useFakeTimers();
		const revoke = vi.fn();
		const origCreate = URL.createObjectURL;
		const origRevoke = URL.revokeObjectURL;
		URL.createObjectURL = vi.fn(() => "blob:x");
		URL.revokeObjectURL = revoke;
		const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
		try {
			saveBlob(new Blob(["a"]), "a.mp3");
			const anchor = click.mock.contexts[0] as HTMLAnchorElement;
			expect(anchor.download).toBe("a.mp3");
			expect(anchor.href).toBe("blob:x");
			expect(document.querySelector("a[download]")).toBeNull();
			vi.advanceTimersByTime(10_000);
			expect(revoke).toHaveBeenCalledWith("blob:x");
		} finally {
			URL.createObjectURL = origCreate;
			URL.revokeObjectURL = origRevoke;
		}
	});
});
