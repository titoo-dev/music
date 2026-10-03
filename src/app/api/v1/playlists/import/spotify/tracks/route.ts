import { NextRequest } from "next/server";
import { fetchTracksFromEmbed } from "@/lib/spotify";
import { ok, fail, handleError, requireUser } from "../../../../_lib/helpers";

// Small batches keep each call to a few seconds; the client (readTrackLinks)
// loops, pausing when Spotify rate-limits.
const MAX_IDS = 50;
const FETCH_CONCURRENCY = 3;
const TRACK_ID = /^[A-Za-z0-9]{22}$/;

// POST /api/v1/playlists/import/spotify/tracks
// Body: { ids: string[] } — Spotify track IDs (≤ 50)
// Response: { tracks: SpotifyTrackMeta[], failed: string[], rateLimited: string[] }
export async function POST(request: NextRequest) {
	try {
		const { error } = await requireUser(request);
		if (error) return error;

		const { ids } = await request.json().catch(() => ({}));
		if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string" && TRACK_ID.test(id))) {
			return fail("INVALID_IDS", "`ids` must be a non-empty array of Spotify track IDs.", 400);
		}
		if (ids.length > MAX_IDS) {
			return fail("TOO_MANY_IDS", `At most ${MAX_IDS} track IDs per request.`, 400);
		}

		return ok(await fetchTracksFromEmbed(ids, { concurrency: FETCH_CONCURRENCY }));
	} catch (e) {
		return handleError(e);
	}
}
