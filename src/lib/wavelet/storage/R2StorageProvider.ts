import fs from "fs";
import { tmpdir } from "os";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageProvider } from "./StorageProvider";
import { StorageNotFoundError, inferContentType, toObjectKey } from "./objects";
import { assertOk, copySource, objectUrl, r2Fetch } from "./r2";

// Streams are buffered to /tmp (the only writable path on Vercel Functions)
// so the tagger can edit the file in place before it is uploaded. A single
// PUT takes objects up to 5 GB — far above any track — so no multipart.
const TEMP_DIR = path.join(tmpdir(), "wavelet-r2");
fs.mkdirSync(TEMP_DIR, { recursive: true });

export class R2StorageProvider implements StorageProvider {
	/** Object key → pending /tmp file. */
	private tempFiles: Map<string, string> = new Map();

	async ensureDir(_dirPath: string): Promise<void> {
		// No-op — object storage has no directories
	}

	async exists(filePath: string): Promise<boolean> {
		const key = toObjectKey(filePath);
		try {
			await assertOk(await r2Fetch(objectUrl(key), { method: "HEAD" }), key);
			return true;
		} catch (e) {
			if (e instanceof StorageNotFoundError) return false;
			throw e;
		}
	}

	async readFile(filePath: string): Promise<Buffer> {
		const key = toObjectKey(filePath);
		const res = await assertOk(await r2Fetch(objectUrl(key)), key);
		return Buffer.from(await res.arrayBuffer());
	}

	async writeFile(filePath: string, data: Buffer | string): Promise<void> {
		const key = toObjectKey(filePath);
		await this.put(key, typeof data === "string" ? Buffer.from(data) : data);
	}

	createWriteStream(filePath: string): NodeJS.WritableStream {
		const tempPath = path.join(TEMP_DIR, randomUUID());
		this.tempFiles.set(toObjectKey(filePath), tempPath);
		return fs.createWriteStream(tempPath);
	}

	async finalizeStream(filePath: string): Promise<void> {
		const key = toObjectKey(filePath);
		const tempPath = this.tempFiles.get(key);
		if (!tempPath) return;

		try {
			await this.put(key, await fs.promises.readFile(tempPath));
		} finally {
			await fs.promises.rm(tempPath, { force: true });
			this.tempFiles.delete(key);
		}
	}

	async deleteFile(filePath: string): Promise<void> {
		const key = toObjectKey(filePath);
		const tempPath = this.tempFiles.get(key);
		if (tempPath) {
			await fs.promises.rm(tempPath, { force: true });
			this.tempFiles.delete(key);
		}

		try {
			await r2Fetch(objectUrl(key), { method: "DELETE" });
		} catch {
			// Ignore delete errors
		}
	}

	async deleteDirectory(dirPath: string): Promise<void> {
		const prefix = toObjectKey(dirPath).replace(/\/?$/, "/");

		let token: string | undefined;
		do {
			const url = new URL(objectUrl(""));
			url.searchParams.set("list-type", "2");
			url.searchParams.set("prefix", prefix);
			if (token) url.searchParams.set("continuation-token", token);
			const xml = await (await assertOk(await r2Fetch(url.toString()), prefix)).text();

			const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => decodeXml(m[1]));
			await Promise.all(keys.map((key) => r2Fetch(objectUrl(key), { method: "DELETE" })));
			token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
				? decodeXml(xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1] ?? "") || undefined
				: undefined;
		} while (token);
	}

	async getFileSize(filePath: string): Promise<number> {
		const key = toObjectKey(filePath);
		const res = await assertOk(await r2Fetch(objectUrl(key), { method: "HEAD" }), key);
		return Number(res.headers.get("content-length")) || 0;
	}

	getLocalPath(filePath: string): string {
		const tempPath = this.tempFiles.get(toObjectKey(filePath));
		if (tempPath) return tempPath;
		throw new Error(
			`No local temp file found for ${filePath}. Call createWriteStream first.`
		);
	}

	async rename(oldPath: string, newPath: string): Promise<void> {
		const from = toObjectKey(oldPath);
		const to = toObjectKey(newPath);

		// If there's a local temp file mapping (pre-upload), just remap the reference
		const tempPath = this.tempFiles.get(from);
		if (tempPath) {
			this.tempFiles.delete(from);
			this.tempFiles.set(to, tempPath);
			return;
		}

		// Otherwise, rename in the bucket via server-side copy + delete
		await assertOk(
			await r2Fetch(objectUrl(to), { method: "PUT", headers: { "x-amz-copy-source": copySource(from) } }),
			to
		);
		await r2Fetch(objectUrl(from), { method: "DELETE" });
	}

	private async put(key: string, body: Buffer): Promise<void> {
		await assertOk(
			await r2Fetch(objectUrl(key), {
				method: "PUT",
				// A view, not a copy: tracks are several MB (FLAC tens of MB).
				body: new Uint8Array(body.buffer as ArrayBuffer, body.byteOffset, body.byteLength),
				headers: { "Content-Type": inferContentType(key) },
			}),
			key
		);
	}
}

function decodeXml(s: string): string {
	return s
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, "&");
}
