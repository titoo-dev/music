import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "../../../_lib/helpers";
import { streamObject } from "@/lib/object-stream";
import { isStorageNotFound } from "@/lib/wavelet/storage/objects";
import { resolveShareForPlayback } from "@/lib/library";
import { classifyStreamError } from "@/lib/wavelet/progressive-stream";
import { capByLicence, loadStreamLicence } from "@/lib/wavelet/storage/cached-copy";
import { clientAddress, createRateLimiter } from "@/lib/wavelet/cache/rate-limit";
import { getWaveletApp, getOrLoginUserDz } from "@/lib/server-state";
import { parseRangeHeader, servePlay } from "../../../stream-progressive/_lib/play";

// The progressive fallback persists the file in after(); see stream-progressive.
export const maxDuration = 300;

/**
 * Deezer fallbacks (plays and seeks that open the CDN with the share owner's
 * account) per client address and 10 minutes, per instance.
 */
const fallbackLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

// GET /api/v1/shares/[shareId]/stream
// Public, no auth. Resolves the share, then either:
//   1. Streams the cached R2 copy of the track (found by trackId with the
//      shared rank rules, so a copy persisted after the share was created is
//      used and re-linked), OR
//   2. Re-streams via the progressive engine using the share creator's
//      stored Deezer credentials (rate-limited per client; same Range, lock
//      and persist-lease rules as /stream-progressive — the first visit
//      persists, later visits use R2).
// A play is counted once per listen: a successful request without Range,
// with "bytes=0-" or with "bytes=0-n" (Safari / AVPlayer, after their
// "bytes=0-1" probe) — not every seek, nor a refused or failed request.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ shareId: string }> }
) {
	try {
		const { shareId } = await params;

		const resolved = await resolveShareForPlayback(shareId);
		if (!resolved) return fail("NOT_FOUND", "Shared track not found.", 404);
		if (resolved.expired) return fail("EXPIRED", "This share link has expired.", 410);

		const { share, copy } = resolved;

		const rangeHeader = request.headers.get("range");
		const range = parseRangeHeader(rangeHeader);
		const listenStart =
			!rangeHeader?.trim() || (range.kind === "from-start" && (range.end === undefined || range.end > 1));
		// Set once this request is actually answered with audio.
		let served = false;
		if (listenStart) {
			// Increment play count after the response is sent
			after(() => {
				if (!served) return;
				prisma.sharedTrack
					.update({ where: { shareId }, data: { plays: { increment: 1 } } })
					.catch(() => {});
			});
		}

		// Fast path: file already cached in R2
		if (copy) {
			try {
				const res = await streamFromStorage(request, copy.storagePath);
				served = res.status < 400;
				return res;
			} catch (e) {
				if (isStorageNotFound(e)) {
					// Evicted between the DB lookup and the R2 fetch: drop the rows of
					// the missing object and detach the share.
					try {
						await prisma.storedTrack.deleteMany({ where: { storagePath: copy.storagePath } });
						await prisma.sharedTrack.update({ where: { id: share.id }, data: { storedTrackId: null } });
					} catch {}
				} else {
					console.error("[shares/stream] storage error, falling back:", e);
				}
			}
		}

		const quota = fallbackLimiter.take(clientAddress(request.headers));
		if (!quota.ok) {
			const res = fail("RATE_LIMITED", "Too many requests for this shared track. Try again later.", 429);
			res.headers.set("Retry-After", String(quota.retryAfterSec));
			return res;
		}

		// Fallback: re-stream via progressive using the share creator's ARL
		const res = await streamProgressive(request, share);
		served = res.status < 400;
		return res;
	} catch (e) {
		console.error("[shares/stream] failed:", e);
		const c = classifyStreamError(e);
		return c ? fail(c.code, c.message, c.status) : fail("INTERNAL_ERROR", "An unexpected error occurred.", 500);
	}
}

async function streamFromStorage(request: NextRequest, storagePath: string) {
	const rangeHeader = request.headers.get("range") ?? undefined;
	const { body, contentLength, contentRange, contentType, statusCode } =
		await streamObject(storagePath, rangeHeader);

	const headers: Record<string, string> = {
		"Content-Type": contentType,
		"Content-Length": String(contentLength),
		"Accept-Ranges": "bytes",
		"Cache-Control": "public, max-age=3600",
	};
	if (contentRange) headers["Content-Range"] = contentRange;

	return new Response(body, { status: statusCode, headers });
}

async function streamProgressive(request: NextRequest, share: { trackId: string; userId: string }) {
	const dz = await getOrLoginUserDz(share.userId);
	if (!dz) {
		return fail(
			"SHARE_OWNER_OFFLINE",
			"The share owner is no longer connected to Deezer.",
			410
		);
	}

	const app = await getWaveletApp();
	if (!app?.storageProvider) {
		return fail("STORAGE_UNAVAILABLE", "Storage provider not initialized.", 500);
	}

	const settings = await app.freshSettings();
	const bitrate = Number(settings.maxBitrate);
	// The owner's account persists the copy: key the lock / lease like the
	// owner's own plays.
	const ownerLicence = await loadStreamLicence(share.userId);

	return servePlay({
		request,
		dz,
		app,
		trackId: share.trackId,
		userId: share.userId,
		settings,
		bitrate,
		requestedBitrate: capByLicence(bitrate, ownerLicence),
		cacheControl: "public, max-age=3600",
	});
}
