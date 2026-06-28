import { NextRequest } from "next/server";
import {
	findHighestStored,
	deleteStoredRows,
} from "@/lib/repositories/storedTracks";
import { requireUser, fail, handleError } from "../../_lib/helpers";
import { streamObject } from "@/lib/s3-stream";

// GET /api/v1/stream/[trackId] — stream a track from the global file cache.
// Auth-gated but NOT user-scoped: any authenticated user can stream any
// cached track (since playback is allowed for any track via the progressive
// engine anyway, gating per-user makes no sense).
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	const { trackId } = await params;
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		// Pick the highest-quality cached version
		const stored = await findHighestStored(trackId);
		// Cache miss — bounce back to /stream-progressive so the live Deezer
		// fallback runs. Returning 404 here would kill the <audio> element with
		// no recovery path, even though the track is fully streamable live.
		if (!stored) {
			return new Response(null, {
				status: 302,
				headers: { Location: `/api/v1/stream-progressive/${trackId}` },
			});
		}

		if (stored.storageType !== "s3") {
			return fail("UNSUPPORTED_STORAGE", "Only S3 storage is supported for streaming.", 400);
		}

		const rangeHeader = request.headers.get("range");

		if (!rangeHeader) {
			const { body, contentLength, contentType } = await streamObject(stored.storagePath);
			return new Response(body, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Content-Length": String(contentLength),
					"Accept-Ranges": "bytes",
					"Cache-Control": "private, max-age=86400",
				},
			});
		}

		const { body, contentLength, contentRange, contentType, statusCode } =
			await streamObject(stored.storagePath, rangeHeader);

		const headers: Record<string, string> = {
			"Content-Type": contentType,
			"Content-Length": String(contentLength),
			"Accept-Ranges": "bytes",
			"Cache-Control": "private, max-age=86400",
		};
		if (contentRange) headers["Content-Range"] = contentRange;

		return new Response(body, { status: statusCode, headers });
	} catch (e: any) {
		if (e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404) {
			// Stale StoredTrack: DB row points to a file that no longer exists
			// in S3 (manual cleanup, lifecycle policy, migration). Drop every
			// row for this trackId so the redirect below falls through to a
			// live Deezer stream in /stream-progressive.
			try {
				await deleteStoredRows(trackId);
			} catch {}
			return new Response(null, {
				status: 302,
				headers: { Location: `/api/v1/stream-progressive/${trackId}` },
			});
		}
		// Network / DNS / permissions failure — S3 is unreachable but the file
		// might still exist. Bounce to /stream-progressive (which will detect
		// the same problem and serve a live Deezer stream instead of 500ing)
		// so the user can keep playing while storage is down. Don't delete the
		// row: it's still valid once storage comes back.
		const code = (e as { code?: string })?.code;
		const status = (e as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
		if (
			code === "ENOTFOUND" ||
			code === "ECONNREFUSED" ||
			code === "ETIMEDOUT" ||
			code === "EAI_AGAIN" ||
			(typeof status === "number" && status >= 500)
		) {
			console.warn("[stream] storage unreachable — falling back to live stream:", e);
			return new Response(null, {
				status: 302,
				headers: { Location: `/api/v1/stream-progressive/${trackId}` },
			});
		}
		return handleError(e);
	}
}
