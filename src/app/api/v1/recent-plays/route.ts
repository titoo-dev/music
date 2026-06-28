import { NextRequest } from "next/server";
import { requireUser, ok, fail, handleError } from "../_lib/helpers";
import { maybeEvictFile } from "@/lib/library";
import {
	listRecentPlays,
	recordPlayWithCap,
} from "@/lib/repositories/recentPlays";

const RECENT_PLAYS_CAP = 100;

// GET /api/v1/recent-plays — list recent plays (most recent first)
export async function GET(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const url = new URL(request.url);
		const limit = Math.min(
			Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1),
			RECENT_PLAYS_CAP
		);

		const rows = await listRecentPlays(userResult.userId, limit);

		return ok({ items: rows });
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/recent-plays — log a play (called by the client at 30s of
// continuous playback). Upserts on (userId, trackId) so replays just bump
// playedAt without duplicating rows. When the per-user cap is exceeded,
// evicts the oldest entries — releasing their S3 files but keeping nothing
// for them in RecentPlay (DownloadHistory metadata stays so the track can
// be re-streamed later).
export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;
		const userId = userResult.userId;

		const body = await request.json().catch(() => null);
		if (!body || typeof body.trackId !== "string" || !body.trackId) {
			return fail("INVALID_BODY", "trackId is required.", 400);
		}

		const {
			trackId,
			title = "",
			artist = "",
			album = null,
			albumId = null,
			coverUrl = null,
			duration = null,
		} = body as {
			trackId: string;
			title?: string;
			artist?: string;
			album?: string | null;
			albumId?: string | null;
			coverUrl?: string | null;
			duration?: number | null;
		};

		// Upsert + cap appliqués par le repository (Postgres autoritatif). Il
		// renvoie les trackIds évincés ; l'éviction S3 (maybeEvictFile) reste
		// ici car elle touche le stockage. maybeEvictFile vérifie tous les
		// ancrages (SavedTrack / AlbumTrack / SharedTrack / RecentPlay) avant
		// de libérer un fichier — un replay re-streame via progressive.
		const evicted = await recordPlayWithCap(
			userId,
			{ trackId, title, artist, album, albumId, coverUrl, duration },
			RECENT_PLAYS_CAP
		);

		for (const evictedTrackId of evicted) {
			await maybeEvictFile(evictedTrackId).catch((e) =>
				console.error("[recent-plays] eviction failed:", e)
			);
		}

		return ok({ logged: true });
	} catch (e) {
		return handleError(e);
	}
}
