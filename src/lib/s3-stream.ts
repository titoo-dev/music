import {
	S3Client,
	GetObjectCommand,
	HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type { Readable } from "stream";

let _cachedClient: S3Client | null = null;
let _cachedBucket: string | null = null;
let _cachedPathPrefix: string | null = null;

function getS3Config() {
	const endpoint = process.env.DEEMIX_S3_ENDPOINT;
	if (!endpoint) throw new Error("S3 not configured");

	return {
		endpoint,
		region: process.env.DEEMIX_S3_REGION || "us-east-1",
		bucket: process.env.DEEMIX_S3_BUCKET || "deemix-music",
		accessKeyId: process.env.DEEMIX_S3_ACCESS_KEY || "",
		secretAccessKey: process.env.DEEMIX_S3_SECRET_KEY || "",
		pathPrefix: process.env.DEEMIX_S3_PATH_PREFIX || "",
	};
}

function getClient() {
	if (_cachedClient) return { client: _cachedClient, bucket: _cachedBucket!, pathPrefix: _cachedPathPrefix! };

	const config = getS3Config();
	_cachedClient = new S3Client({
		endpoint: config.endpoint,
		region: config.region,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		forcePathStyle: true,
	});
	_cachedBucket = config.bucket;
	_cachedPathPrefix = config.pathPrefix;

	return { client: _cachedClient, bucket: _cachedBucket, pathPrefix: _cachedPathPrefix };
}

/**
 * Convert a storagePath (as saved in DownloadHistory) to an S3 key.
 * The storagePath includes the downloadLocation prefix (e.g. "/data/music/Artist/Album/Track.mp3").
 * We need to strip it, just like S3StorageProvider.toS3Key() does.
 */
export async function toS3Key(storagePath: string): Promise<string> {
	const { pathPrefix } = getClient();

	// Get downloadLocation from the app settings to strip it from the path
	let downloadLocation = "";
	try {
		const { getDeemixApp } = await import("@/lib/server-state");
		const app = await getDeemixApp();
		if (app?.settings?.downloadLocation) {
			downloadLocation = app.settings.downloadLocation;
		}
	} catch {
		// fallback: no stripping
	}

	let relative = storagePath;
	if (downloadLocation && relative.startsWith(downloadLocation)) {
		relative = relative.slice(downloadLocation.length);
	}
	// Normalize to forward slashes and strip leading slash
	relative = relative.replace(/\\/g, "/").replace(/^\/+/, "");
	return pathPrefix + relative;
}

/** Get the size and content type of an object in S3 */
export async function headObject(storagePath: string) {
	const { client, bucket } = getClient();
	const key = await toS3Key(storagePath);

	const response = await client.send(
		new HeadObjectCommand({ Bucket: bucket, Key: key })
	);

	return {
		contentLength: response.ContentLength || 0,
		contentType: response.ContentType || inferContentType(storagePath),
	};
}

/** Stream an object from S3, optionally with a byte range */
export async function streamObject(storagePath: string, range?: string) {
	const { client, bucket } = getClient();
	const key = await toS3Key(storagePath);

	const command = new GetObjectCommand({
		Bucket: bucket,
		Key: key,
		...(range ? { Range: range } : {}),
	});

	const response = await client.send(command);

	return {
		body: response.Body as Readable,
		contentLength: response.ContentLength || 0,
		contentRange: response.ContentRange,
		contentType: response.ContentType || inferContentType(storagePath),
		statusCode: range ? 206 : 200,
	};
}

function inferContentType(path: string): string {
	const ext = path.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "flac":
			return "audio/flac";
		case "mp4":
			return "audio/mp4";
		default:
			return "audio/mpeg";
	}
}
