import { put, head, get, del, list, copy, BlobNotFoundError } from "@vercel/blob";
import fs from "fs";
import { tmpdir } from "os";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageProvider } from "./StorageProvider";
import { BLOB_ACCESS, StorageNotFoundError, inferContentType, toBlobPathname } from "./blob";

// Streams are buffered to /tmp (the only writable path on Vercel Functions)
// so the tagger can edit the file in place before it is uploaded.
const BLOB_TEMP_DIR = path.join(tmpdir(), "wavelet-blob");
fs.mkdirSync(BLOB_TEMP_DIR, { recursive: true });

// Blob multipart uploads need parts of at least 5 MB; below that a single
// PUT is both valid and cheaper.
const MULTIPART_THRESHOLD = 8 * 1024 * 1024;

function writeOptions(pathname: string) {
	return {
		access: BLOB_ACCESS,
		addRandomSuffix: false,
		allowOverwrite: true,
		contentType: inferContentType(pathname),
	};
}

export class BlobStorageProvider implements StorageProvider {
	/** Blob pathname → pending /tmp file, keyed by normalized pathname. */
	private tempFiles: Map<string, string> = new Map();

	async ensureDir(_dirPath: string): Promise<void> {
		// No-op — Blob doesn't have directories
	}

	async exists(filePath: string): Promise<boolean> {
		try {
			await head(toBlobPathname(filePath));
			return true;
		} catch (e) {
			if (e instanceof BlobNotFoundError) return false;
			throw e;
		}
	}

	async readFile(filePath: string): Promise<Buffer> {
		const pathname = toBlobPathname(filePath);
		const result = await get(pathname, { access: BLOB_ACCESS });
		if (!result || result.statusCode !== 200) throw new StorageNotFoundError(pathname);
		return Buffer.from(await new Response(result.stream).arrayBuffer());
	}

	async writeFile(filePath: string, data: Buffer | string): Promise<void> {
		const pathname = toBlobPathname(filePath);
		await put(pathname, data, writeOptions(pathname));
	}

	createWriteStream(filePath: string): NodeJS.WritableStream {
		const tempPath = path.join(BLOB_TEMP_DIR, randomUUID());
		this.tempFiles.set(toBlobPathname(filePath), tempPath);
		return fs.createWriteStream(tempPath);
	}

	async finalizeStream(filePath: string): Promise<void> {
		const pathname = toBlobPathname(filePath);
		const tempPath = this.tempFiles.get(pathname);
		if (!tempPath) return;

		try {
			const { size } = await fs.promises.stat(tempPath);
			await put(pathname, fs.createReadStream(tempPath), {
				...writeOptions(pathname),
				multipart: size > MULTIPART_THRESHOLD,
			});
		} finally {
			await fs.promises.rm(tempPath, { force: true });
			this.tempFiles.delete(pathname);
		}
	}

	async deleteFile(filePath: string): Promise<void> {
		const pathname = toBlobPathname(filePath);
		const tempPath = this.tempFiles.get(pathname);
		if (tempPath) {
			await fs.promises.rm(tempPath, { force: true });
			this.tempFiles.delete(pathname);
		}

		try {
			await del(pathname);
		} catch {
			// Ignore delete errors
		}
	}

	async deleteDirectory(dirPath: string): Promise<void> {
		const prefix = toBlobPathname(dirPath).replace(/\/?$/, "/");

		let cursor: string | undefined;
		do {
			const page = await list({ prefix, cursor });
			if (page.blobs.length > 0) {
				await del(page.blobs.map((b) => b.url));
			}
			cursor = page.hasMore ? page.cursor : undefined;
		} while (cursor);
	}

	async getFileSize(filePath: string): Promise<number> {
		const meta = await head(toBlobPathname(filePath));
		return meta.size;
	}

	getLocalPath(filePath: string): string {
		const tempPath = this.tempFiles.get(toBlobPathname(filePath));
		if (tempPath) return tempPath;
		throw new Error(
			`No local temp file found for ${filePath}. Call createWriteStream first.`
		);
	}

	async rename(oldPath: string, newPath: string): Promise<void> {
		// If there's a local temp file mapping (pre-upload), just remap the reference
		const tempPath = this.tempFiles.get(toBlobPathname(oldPath));
		if (tempPath) {
			this.tempFiles.delete(toBlobPathname(oldPath));
			this.tempFiles.set(toBlobPathname(newPath), tempPath);
			return;
		}

		// Otherwise, rename on Blob via copy + delete
		const from = toBlobPathname(oldPath);
		const to = toBlobPathname(newPath);
		await copy(from, to, writeOptions(to));
		await del(from);
	}
}
