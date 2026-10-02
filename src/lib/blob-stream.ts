import {
	get,
	head,
	issueSignedToken,
	presignUrl,
	BlobNotFoundError,
	BlobServiceNotAvailable,
	BlobServiceRateLimited,
	BlobStoreSuspendedError,
	type IssuedSignedToken,
} from "@vercel/blob";
import {
	BLOB_ACCESS,
	StorageNotFoundError,
	StorageUnavailableError,
	inferContentType,
	toBlobPathname,
} from "@/lib/wavelet/storage/blob";

// Read side of Vercel Blob: metadata, proxied streaming and presigned URLs.
// Every failure is normalized to StorageNotFoundError / StorageUnavailableError
// so routes can decide between "drop the stale row" and "fall back to live".

const NETWORK_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"]);

function toStorageError(e: unknown, pathname: string): unknown {
	if (e instanceof BlobNotFoundError) return new StorageNotFoundError(pathname);
	if (
		e instanceof BlobServiceNotAvailable ||
		e instanceof BlobServiceRateLimited ||
		e instanceof BlobStoreSuspendedError
	) {
		return new StorageUnavailableError(e);
	}
	// fetch() network failures surface as TypeError("fetch failed") with the
	// socket error code on `cause`; get() reports 5xx as a generic BlobError.
	const code = (e as { cause?: { code?: string } })?.cause?.code;
	if (code && NETWORK_CODES.has(code)) return new StorageUnavailableError(e);
	if (e instanceof Error && /Failed to fetch blob: 5\d\d/.test(e.message)) {
		return new StorageUnavailableError(e);
	}
	return e;
}

/** Get the size and content type of a blob */
export async function headObject(storagePath: string) {
	const pathname = toBlobPathname(storagePath);
	try {
		const meta = await head(pathname);
		return {
			contentLength: meta.size,
			contentType: meta.contentType || inferContentType(storagePath),
		};
	} catch (e) {
		throw toStorageError(e, pathname);
	}
}

/** Stream a blob through the server, optionally with a byte range */
export async function streamObject(storagePath: string, range?: string) {
	const pathname = toBlobPathname(storagePath);
	let result: Awaited<ReturnType<typeof get>>;
	try {
		result = await get(pathname, {
			access: BLOB_ACCESS,
			...(range ? { headers: { range } } : {}),
		});
	} catch (e) {
		throw toStorageError(e, pathname);
	}
	if (!result || result.statusCode !== 200) throw new StorageNotFoundError(pathname);

	const contentRange = result.headers.get("content-range") ?? undefined;
	return {
		body: result.stream,
		contentLength: Number(result.headers.get("content-length")) || result.blob.size,
		contentRange,
		contentType: result.blob.contentType || inferContentType(storagePath),
		statusCode: contentRange ? 206 : 200,
	};
}

// One store-wide read token is reused to sign every URL locally; it is
// refreshed once its remaining validity can't cover the requested expiry.
const READ_TOKEN_TTL_MS = 60 * 60 * 1000;
let _readToken: IssuedSignedToken | null = null;

async function getReadToken(minValidityMs: number): Promise<IssuedSignedToken> {
	if (_readToken && _readToken.validUntil - Date.now() > minValidityMs) return _readToken;
	_readToken = await issueSignedToken({
		pathname: "*",
		operations: ["get"],
		validUntil: Date.now() + Math.max(READ_TOKEN_TTL_MS, minValidityMs * 2),
	});
	return _readToken;
}

/** Generate a presigned URL for direct browser streaming */
export async function getPresignedUrl(storagePath: string, expiresIn = 900) {
	const pathname = toBlobPathname(storagePath);
	try {
		const token = await getReadToken(expiresIn * 1000);
		const { presignedUrl } = await presignUrl(token, {
			operation: "get",
			pathname,
			access: BLOB_ACCESS,
			validUntil: Date.now() + expiresIn * 1000,
		});
		return { url: presignedUrl, contentType: inferContentType(storagePath) };
	} catch (e) {
		throw toStorageError(e, pathname);
	}
}
