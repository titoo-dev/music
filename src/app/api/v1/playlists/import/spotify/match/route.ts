import { NextRequest } from "next/server";
import { matchTracks } from "@/lib/spotify";
import { MATCH_BATCH_SIZE, parseClientTracks } from "@/lib/spotify/import";
import { ok, fail, handleError, requireDeezer } from "../../../../_lib/helpers";

// A batch of 50 takes a few seconds (≤ 4 Deezer lookups per track).
export const maxDuration = 60;

const MATCH_CONCURRENCY = 8;

// POST /api/v1/playlists/import/spotify/match
// Body: { tracks: SpotifyTrack[] } — at most 50, from …/playlist or …/tracks
// Response: { results: MatchResult[] } — same order as `tracks`
export async function POST(request: NextRequest) {
	try {
		const { dz, error } = await requireDeezer(request);
		if (error) return error;

		const body = await request.json().catch(() => ({}));
		const tracks = parseClientTracks(body.tracks, { keepMeta: true });
		if (!tracks || tracks.length === 0) {
			return fail("INVALID_TRACKS", "`tracks` must be a non-empty list of Spotify tracks.", 400);
		}
		if (tracks.length > MATCH_BATCH_SIZE) {
			return fail("TOO_MANY_TRACKS", `At most ${MATCH_BATCH_SIZE} tracks per request.`, 400);
		}

		return ok({ results: await matchTracks(dz, tracks, { concurrency: MATCH_CONCURRENCY }) });
	} catch (e) {
		return handleError(e);
	}
}
