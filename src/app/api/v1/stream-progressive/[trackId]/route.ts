import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDeezerAndApp, fail, handleError } from "../../_lib/helpers";
import { startProgressiveStream } from "@/lib/deemix/progressive-stream";

// GET /api/v1/stream-progressive/[trackId]
// Spotify-like progressive playback: streams live from Deezer, decrypts
// on the fly, persists to S3 in parallel. If the file is already cached
// (StoredTrack exists), redirects to /api/v1/stream for fast Range support.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const auth = await requireDeezerAndApp(request);
		if (auth.error) return auth.error;
		const { userId, dz, app } = auth;

		const { trackId } = await params;
		// Preview mode: hover-prefetch from the client. Streams audio bytes
		// to the browser without persisting to S3 / DB and without taking
		// the per-track download lock — so it never blocks a real play.
		const preview = request.nextUrl.searchParams.get("preview") === "1";
		// Head mode (only valid with preview=1): cap the response at ~64 KB
		// so a sliding-window prefetch over a search-results list doesn't
		// burn megabytes per track. ~64 KB is enough for an MP3 320 / FLAC
		// header + a couple of seconds of audio — the browser's audio element
		// gets to readyState >= 2 (canplay) and fires duration metadata.
		const head = preview && request.nextUrl.searchParams.get("head") === "1";
		const headBytes = head ? 64 * 1024 : 0;

		// Already cached → fast path through /stream
		const stored = await prisma.storedTrack.findFirst({
			where: { trackId },
			select: { id: true },
			orderBy: { bitrate: "desc" },
		});
		if (stored) {
			return NextResponse.redirect(
				new URL(`/api/v1/stream/${trackId}`, request.url),
				302
			);
		}

		// Not cached — open a progressive stream
		const settings = app.settings;
		const preferredBitrate = settings.maxBitrate;

		// Dedup lock: only used for real (persisting) plays. Preview streams
		// run lock-free so a hover never delays a click that wants the same
		// track, and the persisting branch always wins the StoredTrack row.
		let lockRelease: (() => void) | undefined;
		if (!preview) {
			const lock = app.acquireDownloadLock(
				String(trackId),
				Number(preferredBitrate)
			);
			if (lock.alreadyInProgress) {
				await lock.waitForExisting();
				return NextResponse.redirect(
					new URL(`/api/v1/stream/${trackId}`, request.url),
					302
				);
			}
			lockRelease = lock.release;

			if (!app.storageProvider) {
				lock.release();
				return fail(
					"STORAGE_UNAVAILABLE",
					"Storage provider not initialized.",
					500
				);
			}
		}

		const { body, contentType, contentLength } = await startProgressiveStream({
			dz,
			trackId: String(trackId),
			bitrate: Number(preferredBitrate),
			settings,
			storageProvider: app.storageProvider,
			userId,
			lock: lockRelease ? { release: lockRelease } : undefined,
			persist: !preview,
			maxBytes: headBytes || undefined,
		}).catch((e) => {
			lockRelease?.();
			throw e;
		});

		const headers: Record<string, string> = {
			"Content-Type": contentType,
			"Cache-Control": "no-store",
			"Accept-Ranges": "none",
		};
		if (contentLength > 0) {
			headers["Content-Length"] = String(contentLength);
		}

		return new Response(body, { status: 200, headers });
	} catch (e) {
		return handleError(e);
	}
}
