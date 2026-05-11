// S3 helpers for the worker. Mirrors the toS3Key logic from
// src/lib/deemix/storage/S3StorageProvider so keys round-trip cleanly:
// what the deemix S3 provider wrote, this worker can read; what this
// worker writes, the s3-stream.ts in Next.js can read back.

import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

let _client: S3Client | null = null;
let _bucket: string | null = null;
let _pathPrefix: string | null = null;
let _downloadLocation: string | null = null;

function getClient(): { client: S3Client; bucket: string; pathPrefix: string } {
	if (_client && _bucket !== null && _pathPrefix !== null) {
		return { client: _client, bucket: _bucket, pathPrefix: _pathPrefix };
	}
	const endpoint = process.env.DEEMIX_S3_ENDPOINT;
	if (!endpoint) throw new Error("DEEMIX_S3_ENDPOINT is not set");
	_client = new S3Client({
		endpoint,
		region: process.env.DEEMIX_S3_REGION || "us-east-1",
		credentials: {
			accessKeyId: process.env.DEEMIX_S3_ACCESS_KEY || "",
			secretAccessKey: process.env.DEEMIX_S3_SECRET_KEY || "",
		},
		forcePathStyle: true,
	});
	_bucket = process.env.DEEMIX_S3_BUCKET || "deemix-music";
	_pathPrefix = process.env.DEEMIX_S3_PATH_PREFIX || "";
	return { client: _client, bucket: _bucket, pathPrefix: _pathPrefix };
}

function getDownloadLocation(): string {
	if (_downloadLocation !== null) return _downloadLocation;
	_downloadLocation = process.env.DEEMIX_DOWNLOAD_LOCATION || "";
	return _downloadLocation;
}

export function toS3Key(storagePath: string): string {
	const { pathPrefix } = getClient();
	const downloadLocation = getDownloadLocation();
	let relative = storagePath;
	if (downloadLocation && relative.startsWith(downloadLocation)) {
		relative = relative.slice(downloadLocation.length);
	}
	relative = relative.replace(/\\/g, "/").replace(/^\/+/, "");
	return pathPrefix + relative;
}

export async function downloadObjectToFile(
	storagePath: string,
	destFile: string,
): Promise<void> {
	const { client, bucket } = getClient();
	const key = toS3Key(storagePath);
	const response = await client.send(
		new GetObjectCommand({ Bucket: bucket, Key: key }),
	);
	if (!response.Body) {
		throw new Error(`Empty response body for s3://${bucket}/${key}`);
	}
	await pipeline(
		response.Body as Readable,
		fs.createWriteStream(destFile),
	);
}

export async function uploadFileToObject(
	srcFile: string,
	storagePath: string,
): Promise<{ fileSize: number }> {
	const { client, bucket } = getClient();
	const key = toS3Key(storagePath);
	const stat = await fs.promises.stat(srcFile);
	const stream = fs.createReadStream(srcFile);
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: stream,
			ContentLength: stat.size,
			ContentType: "audio/mpeg",
		}),
	);
	return { fileSize: stat.size };
}
