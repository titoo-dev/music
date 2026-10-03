import { describe, it, expect, vi, beforeEach } from "vitest";

const { blobMock } = vi.hoisted(() => {
	class BlobError extends Error {}
	class BlobNotFoundError extends BlobError {}
	class BlobServiceNotAvailable extends BlobError {}
	class BlobServiceRateLimited extends BlobError {}
	class BlobStoreSuspendedError extends BlobError {}
	return {
		blobMock: {
			get: vi.fn(),
			head: vi.fn(),
			issueSignedToken: vi.fn(),
			presignUrl: vi.fn(),
			BlobError,
			BlobNotFoundError,
			BlobServiceNotAvailable,
			BlobServiceRateLimited,
			BlobStoreSuspendedError,
		},
	};
});

vi.mock("@vercel/blob", () => blobMock);

import { headObject, streamObject, getPresignedUrl } from "./blob-stream";
import { isStorageNotFound, isStorageUnavailable } from "@/lib/wavelet/storage/blob";

function blobResult(headers: Record<string, string>, contentType = "audio/flac") {
	return {
		statusCode: 200,
		stream: new ReadableStream(),
		headers: new Headers(headers),
		blob: { contentType, size: 999 },
	};
}

describe("blob-stream", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("headObject", () => {
		it("normalizes the storage path and returns size + content type", async () => {
			blobMock.head.mockResolvedValue({ size: 42, contentType: "audio/flac" });

			await expect(headObject("/music/a/b.flac")).resolves.toEqual({
				contentLength: 42,
				contentType: "audio/flac",
			});
			expect(blobMock.head).toHaveBeenCalledWith("music/a/b.flac");
		});

		it("infers the content type when Blob doesn't report one", async () => {
			blobMock.head.mockResolvedValue({ size: 1, contentType: "" });
			const meta = await headObject("music/b.mp3");
			expect(meta.contentType).toBe("audio/mpeg");
		});

		it("maps BlobNotFoundError to StorageNotFoundError", async () => {
			blobMock.head.mockRejectedValue(new blobMock.BlobNotFoundError());
			const err = await headObject("music/x.mp3").catch((e) => e);
			expect(isStorageNotFound(err)).toBe(true);
		});

		it.each(["BlobServiceNotAvailable", "BlobServiceRateLimited", "BlobStoreSuspendedError"] as const)(
			"maps %s to StorageUnavailableError",
			async (name) => {
				blobMock.head.mockRejectedValue(new blobMock[name]());
				const err = await headObject("music/x.mp3").catch((e) => e);
				expect(isStorageUnavailable(err)).toBe(true);
			}
		);

		it.each(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"])(
			"maps a fetch failure with cause %s to StorageUnavailableError",
			async (code) => {
				blobMock.head.mockRejectedValue(
					Object.assign(new TypeError("fetch failed"), { cause: { code } })
				);
				const err = await headObject("music/x.mp3").catch((e) => e);
				expect(isStorageUnavailable(err)).toBe(true);
			}
		);

		it("rethrows unrelated errors untouched", async () => {
			const boom = new Error("No token found");
			blobMock.head.mockRejectedValue(boom);
			await expect(headObject("music/x.mp3")).rejects.toBe(boom);
		});
	});

	describe("streamObject", () => {
		it("streams the whole blob with status 200 when no range is given", async () => {
			blobMock.get.mockResolvedValue(blobResult({ "content-length": "1234" }));

			const res = await streamObject("music/a.flac");
			expect(res.statusCode).toBe(200);
			expect(res.contentLength).toBe(1234);
			expect(res.contentRange).toBeUndefined();
			expect(res.contentType).toBe("audio/flac");
			expect(blobMock.get).toHaveBeenCalledWith("music/a.flac", { access: "private" });
		});

		it("forwards the Range header and reports 206 + Content-Range", async () => {
			blobMock.get.mockResolvedValue(
				blobResult({ "content-length": "100", "content-range": "bytes 0-99/1234" })
			);

			const res = await streamObject("music/a.flac", "bytes=0-99");
			expect(res.statusCode).toBe(206);
			expect(res.contentLength).toBe(100);
			expect(res.contentRange).toBe("bytes 0-99/1234");
			expect(blobMock.get).toHaveBeenCalledWith("music/a.flac", {
				access: "private",
				headers: { range: "bytes=0-99" },
			});
		});

		it("falls back to blob.size and the inferred type when headers are missing", async () => {
			blobMock.get.mockResolvedValue(blobResult({}, ""));
			const res = await streamObject("music/a.mp4");
			expect(res.contentLength).toBe(999);
			expect(res.contentType).toBe("audio/mp4");
		});

		it("throws StorageNotFoundError when get() returns null (404)", async () => {
			blobMock.get.mockResolvedValue(null);
			const err = await streamObject("music/a.flac").catch((e) => e);
			expect(isStorageNotFound(err)).toBe(true);
		});

		it("maps a 5xx BlobError from get() to StorageUnavailableError", async () => {
			blobMock.get.mockRejectedValue(
				new blobMock.BlobError("Failed to fetch blob: 503 Service Unavailable")
			);
			const err = await streamObject("music/a.flac").catch((e) => e);
			expect(isStorageUnavailable(err)).toBe(true);
		});
	});

	describe("getPresignedUrl", () => {
		it("signs a private GET URL and reuses the store-wide token while it is valid", async () => {
			blobMock.issueSignedToken.mockResolvedValue({
				delegationToken: "d",
				clientSigningToken: "c",
				validUntil: Date.now() + 60 * 60 * 1000,
			});
			blobMock.presignUrl.mockResolvedValue({ presignedUrl: "https://blob/x?sig" });

			const first = await getPresignedUrl("/music/a.flac", 900);
			const second = await getPresignedUrl("music/b.mp3", 900);

			expect(first).toEqual({ url: "https://blob/x?sig", contentType: "audio/flac" });
			expect(second.contentType).toBe("audio/mpeg");
			expect(blobMock.issueSignedToken).toHaveBeenCalledTimes(1);
			expect(blobMock.issueSignedToken).toHaveBeenCalledWith(
				expect.objectContaining({ pathname: "*", operations: ["get"] })
			);
			expect(blobMock.presignUrl).toHaveBeenCalledWith(
				expect.objectContaining({ delegationToken: "d" }),
				expect.objectContaining({ operation: "get", pathname: "music/a.flac", access: "private" })
			);
		});

		it("re-issues the token once it can't cover the requested expiry", async () => {
			// Cached token from the previous test is still valid for ~1h; asking
			// for a 2h URL forces a refresh.
			blobMock.issueSignedToken.mockResolvedValue({
				delegationToken: "d2",
				clientSigningToken: "c2",
				validUntil: Date.now() + 4 * 60 * 60 * 1000,
			});
			blobMock.presignUrl.mockResolvedValue({ presignedUrl: "https://blob/y?sig" });

			await getPresignedUrl("music/a.flac", 2 * 60 * 60);
			expect(blobMock.issueSignedToken).toHaveBeenCalledTimes(1);
			expect(blobMock.presignUrl).toHaveBeenCalledWith(
				expect.objectContaining({ delegationToken: "d2" }),
				expect.anything()
			);
		});

		it("maps signing outages to StorageUnavailableError", async () => {
			blobMock.presignUrl.mockRejectedValue(new blobMock.BlobServiceNotAvailable());
			const err = await getPresignedUrl("music/a.flac").catch((e) => e);
			expect(isStorageUnavailable(err)).toBe(true);
		});
	});
});
