import { NextRequest } from "next/server";
import { requireUser, ok, fail, handleError } from "../../_lib/helpers";
import { saveTrack, listSavedTracks, isPreCacheEnabled } from "@/lib/library";

// GET /api/v1/library/tracks — list user's saved tracks
export async function GET(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const url = new URL(request.url);
		const limit = Math.min(
			Math.max(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 1),
			500
		);
		const offset = Math.max(
			parseInt(url.searchParams.get("offset") || "0", 10) || 0,
			0
		);

		const items = await listSavedTracks(userResult.userId, { limit, offset });
		return ok({ items });
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/library/tracks — save a track to the user's library
export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const body = await request.json().catch(() => null);
		if (!body || typeof body.trackId !== "string" || !body.trackId) {
			return fail("INVALID_BODY", "trackId is required.", 400);
		}
		if (typeof body.title !== "string" || typeof body.artist !== "string") {
			return fail("INVALID_BODY", "title and artist are required.", 400);
		}

		const saved = await saveTrack(userResult.userId, {
			trackId: body.trackId,
			title: body.title,
			artist: body.artist,
			album: body.album ?? null,
			albumId: body.albumId ?? null,
			coverUrl: body.coverUrl ?? null,
			duration: body.duration ?? null,
		});

		// Optional pre-cache — fire-and-forget. Implemented in a later phase
		// with the progressive engine in persist-only mode.
		if (await isPreCacheEnabled(userResult.userId)) {
			// TODO: call ensureFileForPlayback(userId, trackId) when wired up
		}

		return ok({ saved });
	} catch (e) {
		return handleError(e);
	}
}
