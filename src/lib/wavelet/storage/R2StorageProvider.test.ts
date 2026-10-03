import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { Readable } from "stream";

const { blobMock } = vi.hoisted(() => {
	class BlobNotFoundError extends Error {}
	return {
		blobMock: {
			put: vi.fn(),
			head: vi.fn(),
			get: vi.fn(),
			del: vi.fn(),
			list: vi.fn(),
			copy: vi.fn(),
			BlobNotFoundError,
		},
	};
});

vi.mock("@vercel/blob", () => blobMock);

import { BlobStorageProvider } from "./BlobStorageProvider";

async function writeThrough(stream: NodeJS.WritableStream, data: string) {
	await new Promise<void>((resolve, reject) => {
		// "close" (not "finish") so the fd is released — Windows keeps open files around.
		stream.on("close", () => resolve());
		stream.on("error", reject);
		stream.end(data);
	});
}

async function drain(body: unknown): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const c of body as Readable) chunks.push(Buffer.from(c));
	return Buffer.concat(chunks).toString();
}

describe("BlobStorageProvider", () => {
	let provider: BlobStorageProvider;

	beforeEach(() => {
		vi.resetAllMocks();
		provider = new BlobStorageProvider();
	});

	it("ensureDir is a no-op", async () => {
		await expect(provider.ensureDir("music/a")).resolves.toBeUndefined();
	});

	describe("exists", () => {
		it("is true when head() resolves", async () => {
			blobMock.head.mockResolvedValue({ size: 1 });
			await expect(provider.exists("/music/a.mp3")).resolves.toBe(true);
			expect(blobMock.head).toHaveBeenCalledWith("music/a.mp3");
		});

		it("is false on BlobNotFoundError", async () => {
			blobMock.head.mockRejectedValue(new blobMock.BlobNotFoundError());
			await expect(provider.exists("music/a.mp3")).resolves.toBe(false);
		});

		it("rethrows other errors", async () => {
			blobMock.head.mockRejectedValue(new Error("boom"));
			await expect(provider.exists("music/a.mp3")).rejects.toThrow("boom");
		});
	});

	describe("readFile", () => {
		it("buffers a private blob", async () => {
			blobMock.get.mockResolvedValue({
				statusCode: 200,
				stream: new Response("hello").body,
			});
			const buf = await provider.readFile("music/cover.jpg");
			expect(buf.toString()).toBe("hello");
			expect(blobMock.get).toHaveBeenCalledWith("music/cover.jpg", { access: "private" });
		});

		it("throws StorageNotFoundError when the blob is missing", async () => {
			blobMock.get.mockResolvedValue(null);
			await expect(provider.readFile("music/cover.jpg")).rejects.toMatchObject({ name: "NotFound" });
		});
	});

	it("writeFile uploads with deterministic, overwritable pathnames", async () => {
		await provider.writeFile("/music/cover.png", Buffer.from("x"));
		expect(blobMock.put).toHaveBeenCalledWith("music/cover.png", Buffer.from("x"), {
			access: "private",
			addRandomSuffix: false,
			allowOverwrite: true,
			contentType: "image/png",
		});
	});

	describe("stream → tag → finalize pipeline", () => {
		it("buffers to /tmp, exposes the local path, uploads on finalize and cleans up", async () => {
			let uploaded = "";
			blobMock.put.mockImplementation(async (_p: string, body: unknown) => {
				uploaded = await drain(body);
				return {};
			});

			await writeThrough(provider.createWriteStream("music/t.mp3.part"), "audio");
			await provider.rename("music/t.mp3.part", "music/t.mp3");
			const local = provider.getLocalPath("music/t.mp3");
			expect(fs.readFileSync(local, "utf8")).toBe("audio");

			await provider.finalizeStream("music/t.mp3");
			expect(uploaded).toBe("audio");
			expect(blobMock.put).toHaveBeenCalledWith(
				"music/t.mp3",
				expect.anything(),
				expect.objectContaining({ access: "private", contentType: "audio/mpeg", multipart: false })
			);
			expect(fs.existsSync(local)).toBe(false);
			expect(() => provider.getLocalPath("music/t.mp3")).toThrow(/No local temp file/);
			// rename() on a temp mapping never touches Blob
			expect(blobMock.copy).not.toHaveBeenCalled();
		});

		it("still removes the temp file when the upload fails", async () => {
			blobMock.put.mockRejectedValue(new Error("upload failed"));
			await writeThrough(provider.createWriteStream("music/t.flac"), "audio");
			const local = provider.getLocalPath("music/t.flac");

			await expect(provider.finalizeStream("music/t.flac")).rejects.toThrow("upload failed");
			expect(fs.existsSync(local)).toBe(false);
		});

		it("finalizeStream is a no-op without a pending temp file", async () => {
			await provider.finalizeStream("music/none.mp3");
			expect(blobMock.put).not.toHaveBeenCalled();
		});
	});

	describe("deleteFile", () => {
		it("drops the pending temp file and the blob", async () => {
			await writeThrough(provider.createWriteStream("music/t.mp3"), "audio");
			const local = provider.getLocalPath("music/t.mp3");

			await provider.deleteFile("/music/t.mp3");
			expect(fs.existsSync(local)).toBe(false);
			expect(blobMock.del).toHaveBeenCalledWith("music/t.mp3");
		});

		it("swallows Blob delete errors", async () => {
			blobMock.del.mockRejectedValue(new Error("nope"));
			await expect(provider.deleteFile("music/t.mp3")).resolves.toBeUndefined();
		});
	});

	it("deleteDirectory pages through the prefix and deletes every blob", async () => {
		blobMock.list
			.mockResolvedValueOnce({ blobs: [{ url: "u1" }, { url: "u2" }], hasMore: true, cursor: "c1" })
			.mockResolvedValueOnce({ blobs: [], hasMore: false });

		await provider.deleteDirectory("/music/Album");
		expect(blobMock.list).toHaveBeenNthCalledWith(1, { prefix: "music/Album/", cursor: undefined });
		expect(blobMock.list).toHaveBeenNthCalledWith(2, { prefix: "music/Album/", cursor: "c1" });
		expect(blobMock.del).toHaveBeenCalledTimes(1);
		expect(blobMock.del).toHaveBeenCalledWith(["u1", "u2"]);
	});

	it("getFileSize reads the blob size", async () => {
		blobMock.head.mockResolvedValue({ size: 321 });
		await expect(provider.getFileSize("music/a.mp3")).resolves.toBe(321);
	});

	it("rename without a temp mapping copies then deletes on Blob", async () => {
		await provider.rename("/music/old.flac", "/music/new.flac");
		expect(blobMock.copy).toHaveBeenCalledWith(
			"music/old.flac",
			"music/new.flac",
			expect.objectContaining({ access: "private", allowOverwrite: true, contentType: "audio/flac" })
		);
		expect(blobMock.del).toHaveBeenCalledWith("music/old.flac");
	});
});
