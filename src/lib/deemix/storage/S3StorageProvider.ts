import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
	DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import { tmpdir } from "os";
import path from "path";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import type { StorageProvider } from "./StorageProvider";
import type { S3Settings } from "../types/Settings";

const S3_TEMP_DIR = path.join(tmpdir(), "deemix-s3");
fs.mkdirSync(S3_TEMP_DIR, { recursive: true });

export class S3StorageProvider implements StorageProvider {
	private client: S3Client;
	private bucket: string;
	private pathPrefix: string;
	private downloadLocation: string;
	private tempFiles: Map<string, string> = new Map();

	constructor(s3Settings: S3Settings, downloadLocation: string) {
		this.client = new S3Client({
			endpoint: s3Settings.endpoint,
			region: s3Settings.region || "us-east-1",
			credentials: {
				accessKeyId: s3Settings.accessKeyId,
				secretAccessKey: s3Settings.secretAccessKey,
			},
			forcePathStyle: true,
		});
		this.bucket = s3Settings.bucket;
		this.pathPrefix = s3Settings.pathPrefix || "";
		this.downloadLocation = downloadLocation;
	}

	private toS3Key(filePath: string): string {
		let relative = filePath;
		if (filePath.startsWith(this.downloadLocation)) {
			relative = filePath.slice(this.downloadLocation.length);
		}
		// Normalize to forward slashes and strip leading slash
		relative = relative.replace(/\\/g, "/").replace(/^\/+/, "");
		return this.pathPrefix + relative;
	}

	async ensureDir(_dirPath: string): Promise<void> {
		// No-op — S3 doesn't have directories
	}

	async exists(filePath: string): Promise<boolean> {
		try {
			await this.client.send(
				new HeadObjectCommand({
					Bucket: this.bucket,
					Key: this.toS3Key(filePath),
				})
			);
			return true;
		} catch (e: any) {
			if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) {
				return false;
			}
			throw e;
		}
	}

	async readFile(filePath: string): Promise<Buffer> {
		const response = await this.client.send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: this.toS3Key(filePath),
			})
		);
		const stream = response.Body as Readable;
		const chunks: Buffer[] = [];
		for await (const chunk of stream) {
			chunks.push(Buffer.from(chunk));
		}
		return Buffer.concat(chunks);
	}

	async writeFile(filePath: string, data: Buffer | string): Promise<void> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: this.toS3Key(filePath),
				Body: typeof data === "string" ? Buffer.from(data) : data,
			})
		);
	}

	createWriteStream(filePath: string): NodeJS.WritableStream {
		const tempPath = path.join(S3_TEMP_DIR, randomUUID());
		this.tempFiles.set(filePath, tempPath);
		return fs.createWriteStream(tempPath);
	}

	async finalizeStream(filePath: string): Promise<void> {
		const tempPath = this.tempFiles.get(filePath);
		if (!tempPath) return;

		const fileStream = fs.createReadStream(tempPath);
		const upload = new Upload({
			client: this.client,
			params: {
				Bucket: this.bucket,
				Key: this.toS3Key(filePath),
				Body: fileStream,
			},
		});
		await upload.done();

		// Cleanup temp file
		if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
		this.tempFiles.delete(filePath);
	}

	async deleteFile(filePath: string): Promise<void> {
		// Also clean up any temp file
		const tempPath = this.tempFiles.get(filePath);
		if (tempPath && fs.existsSync(tempPath)) {
			fs.unlinkSync(tempPath);
			this.tempFiles.delete(filePath);
		}

		try {
			await this.client.send(
				new DeleteObjectCommand({
					Bucket: this.bucket,
					Key: this.toS3Key(filePath),
				})
			);
		} catch {
			// Ignore delete errors
		}
	}

	async deleteDirectory(dirPath: string): Promise<void> {
		const prefix = this.toS3Key(dirPath).replace(/\/?$/, "/");

		let continuationToken: string | undefined;
		do {
			const list = await this.client.send(
				new ListObjectsV2Command({
					Bucket: this.bucket,
					Prefix: prefix,
					ContinuationToken: continuationToken,
				})
			);

			const objects = list.Contents;
			if (objects && objects.length > 0) {
				await this.client.send(
					new DeleteObjectsCommand({
						Bucket: this.bucket,
						Delete: {
							Objects: objects.map((o) => ({ Key: o.Key })),
							Quiet: true,
						},
					})
				);
			}

			continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
		} while (continuationToken);
	}

	async getFileSize(filePath: string): Promise<number> {
		const response = await this.client.send(
			new HeadObjectCommand({
				Bucket: this.bucket,
				Key: this.toS3Key(filePath),
			})
		);
		return response.ContentLength || 0;
	}

	getLocalPath(filePath: string): string {
		const tempPath = this.tempFiles.get(filePath);
		if (tempPath) return tempPath;
		throw new Error(
			`No local temp file found for ${filePath}. Call createWriteStream first.`
		);
	}
}
