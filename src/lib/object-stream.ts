import { inferContentType, toObjectKey } from "@/lib/wavelet/storage/objects";
import { assertOk, objectUrl, presignGet, r2Fetch } from "@/lib/wavelet/storage/r2";

// Read side of the R2 bucket: metadata, proxied streaming and presigned URLs.
// Failures arrive as StorageNotFoundError / StorageUnavailableError (see r2.ts)
// so routes can decide between "drop the stale row" and "fall back to live".

/** Get the size and content type of an object */
export async function headObject(storagePath: string) {
	const key = toObjectKey(storagePath);
	const res = await assertOk(await r2Fetch(objectUrl(key), { method: "HEAD" }), key);
	return {
		contentLength: Number(res.headers.get("content-length")) || 0,
		contentType: res.headers.get("content-type") || inferContentType(storagePath),
	};
}

/** Stream an object through the server, optionally with a byte range */
export async function streamObject(storagePath: string, range?: string) {
	const key = toObjectKey(storagePath);
	const res = await assertOk(
		await r2Fetch(objectUrl(key), range ? { headers: { range } } : {}),
		key
	);
	const contentRange = res.headers.get("content-range") ?? undefined;
	return {
		body: res.body as ReadableStream<Uint8Array>,
		contentLength: Number(res.headers.get("content-length")) || 0,
		contentRange,
		contentType: res.headers.get("content-type") || inferContentType(storagePath),
		statusCode: res.status === 206 || contentRange ? 206 : 200,
	};
}

/** Generate a presigned URL for direct browser streaming */
export async function getPresignedUrl(storagePath: string, expiresIn = 900) {
	const url = await presignGet(toObjectKey(storagePath), expiresIn);
	return { url, contentType: inferContentType(storagePath) };
}
