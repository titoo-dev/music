import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { headObject, streamObject, getPresignedUrl } from "./object-stream";
import { isStorageNotFound, isStorageUnavailable } from "@/lib/wavelet/storage/objects";
import { _resetR2Client } from "@/lib/wavelet/storage/r2";

const ENV = {
	R2_ACCOUNT_ID: "acct",
	R2_BUCKET: "bucket",
	R2_ACCESS_KEY_ID: "AKID",
	R2_SECRET_ACCESS_KEY: "secret",
};
const BASE = "https://acct.r2.cloudflarestorage.com/bucket";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
const lastRequest = () => new Request(...(fetchMock.mock.calls.at(-1) as [RequestInfo, RequestInit?]));

describe("object-stream (R2)", () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
		for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
		_resetR2Client();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	describe("headObject", () => {
		it("normalizes the storage path, signs a HEAD and returns size + content type", async () => {
			fetchMock.mockResolvedValue(new Response(null, { status: 200, headers: { "content-length": "42", "content-type": "audio/flac" } }));

			await expect(headObject("/music//a/b c.flac")).resolves.toEqual({ contentLength: 42, contentType: "audio/flac" });
			const req = lastRequest();
			expect(req.method).toBe("HEAD");
			expect(req.url).toBe(`${BASE}/music/a/b%20c.flac`);
			expect(req.headers.get("authorization")).toMatch(/^AWS4-HMAC-SHA256 Credential=AKID\/\d{8}\/auto\/s3\//);
		});

		it("infers the content type when R2 doesn't report one", async () => {
			fetchMock.mockResolvedValue(new Response(null, { status: 200, headers: { "content-length": "1" } }));
			expect((await headObject("music/b.mp3")).contentType).toBe("audio/mpeg");
		});

		it("maps 404 to StorageNotFoundError", async () => {
			fetchMock.mockResolvedValue(new Response("", { status: 404 }));
			const e = await headObject("music/x.mp3").catch((err) => err);
			expect(isStorageNotFound(e)).toBe(true);
		});

		it.each([401, 403, 429, 500, 503])("maps %i to StorageUnavailableError (was: a refused store surfaced as a 500 and deleted nothing useful)", async (status) => {
			fetchMock.mockResolvedValue(new Response("nope", { status }));
			const e = await headObject("music/x.mp3").catch((err) => err);
			expect(isStorageUnavailable(e)).toBe(true);
		});

		it("retries a one-off 503 before answering", async () => {
			fetchMock
				.mockResolvedValueOnce(new Response("", { status: 503 }))
				.mockResolvedValueOnce(new Response(null, { status: 200, headers: { "content-length": "5" } }));
			expect((await headObject("music/a.mp3")).contentLength).toBe(5);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it("gives up after two retries", async () => {
			fetchMock.mockResolvedValue(new Response("", { status: 503 }));
			const e = await headObject("music/a.mp3").catch((err) => err);
			expect(isStorageUnavailable(e)).toBe(true);
			expect(fetchMock).toHaveBeenCalledTimes(3);
		});

		it("maps network failures to StorageUnavailableError", async () => {
			fetchMock.mockRejectedValue(Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } }));
			const e = await headObject("music/x.mp3").catch((err) => err);
			expect(isStorageUnavailable(e)).toBe(true);
		});

		it("treats missing R2 config as unavailable, never as missing", async () => {
			vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
			_resetR2Client();
			const e = await headObject("music/x.mp3").catch((err) => err);
			expect(isStorageUnavailable(e)).toBe(true);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it("lets other client errors through untouched", async () => {
			fetchMock.mockResolvedValue(new Response("bad", { status: 400 }));
			const e = await headObject("music/x.mp3").catch((err) => err);
			expect(isStorageNotFound(e) || isStorageUnavailable(e)).toBe(false);
			expect(e.message).toContain("400");
		});
	});

	describe("streamObject", () => {
		it("streams the whole object with status 200 when no range is given", async () => {
			fetchMock.mockResolvedValue(new Response("abc", { status: 200, headers: { "content-length": "3", "content-type": "audio/mpeg" } }));

			const res = await streamObject("music/a.mp3");
			expect(res).toMatchObject({ contentLength: 3, contentType: "audio/mpeg", statusCode: 200, contentRange: undefined });
			expect(await new Response(res.body).text()).toBe("abc");
			expect(lastRequest().headers.get("range")).toBeNull();
		});

		it("forwards the Range header and reports 206 + Content-Range", async () => {
			fetchMock.mockResolvedValue(
				new Response("ab", { status: 206, headers: { "content-length": "2", "content-range": "bytes 0-1/10", "content-type": "audio/flac" } })
			);

			const res = await streamObject("music/a.flac", "bytes=0-1");
			expect(res).toMatchObject({ statusCode: 206, contentRange: "bytes 0-1/10", contentLength: 2 });
			expect(lastRequest().headers.get("range")).toBe("bytes=0-1");
		});

		it("infers the type when R2 omits it", async () => {
			fetchMock.mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
			expect((await streamObject("music/a.flac")).contentType).toBe("audio/flac");
		});

		it("throws StorageNotFoundError on 404", async () => {
			fetchMock.mockResolvedValue(new Response("", { status: 404 }));
			const e = await streamObject("music/x.mp3").catch((err) => err);
			expect(isStorageNotFound(e)).toBe(true);
		});

		it("passes a range past the end through as 416 (was: thrown, so /stream answered 500 INTERNAL_ERROR)", async () => {
			fetchMock.mockResolvedValue(
				new Response("<Error/>", { status: 416, headers: { "content-range": "bytes */5126686" } })
			);
			const r = await streamObject("tracks/1/1.mp3", "bytes=9999999-");
			expect(r.statusCode).toBe(416);
			expect(r.contentRange).toBe("bytes */5126686");
			expect(r.contentLength).toBe(0);
			expect(r.body).toBeNull();
		});

		it("learns the size with a HEAD when R2's 416 has no Content-Range", async () => {
			fetchMock
				.mockResolvedValueOnce(new Response("<Error/>", { status: 416 }))
				.mockResolvedValueOnce(new Response(null, { status: 200, headers: { "content-length": "42" } }));
			const r = await streamObject("tracks/1/1.mp3", "bytes=100-");
			expect(r.statusCode).toBe(416);
			expect(r.contentRange).toBe("bytes */42");
			expect(lastRequest().method).toBe("HEAD");
		});

		it("throws StorageUnavailableError when storage refuses reads (was: Vercel Blob 'Your store is blocked' 403 → 500)", async () => {
			fetchMock.mockResolvedValue(new Response("Your store is blocked", { status: 403 }));
			const e = await streamObject("music/x.mp3").catch((err) => err);
			expect(isStorageUnavailable(e)).toBe(true);
		});
	});

	describe("getPresignedUrl", () => {
		it("signs a query-string GET URL with the requested expiry, without a network call", async () => {
			const { url, contentType } = await getPresignedUrl("/music/a b.flac", 900);

			const u = new URL(url);
			expect(`${u.origin}${u.pathname}`).toBe(`${BASE}/music/a%20b.flac`);
			expect(u.searchParams.get("X-Amz-Expires")).toBe("900");
			expect(u.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
			expect(u.searchParams.get("X-Amz-Credential")).toMatch(/^AKID\//);
			expect(u.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
			expect(contentType).toBe("audio/flac");
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it("clamps the expiry to S3's 7-day maximum", async () => {
			const { url } = await getPresignedUrl("music/a.mp3", 10 * 86_400);
			expect(new URL(url).searchParams.get("X-Amz-Expires")).toBe("604800");
		});

		it("reports missing config as unavailable", async () => {
			vi.stubEnv("R2_ACCOUNT_ID", "");
			_resetR2Client();
			const e = await getPresignedUrl("music/a.mp3").catch((err) => err);
			expect(isStorageUnavailable(e)).toBe(true);
		});
	});
});
