import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireDeezer, ok, fail, handleError } from "../../_lib/helpers";
import { findLyrics, type DeezerLyrics } from "@/lib/lyrics/resolve";
import { deezerSyncToLrc } from "@/lib/lyrics/deezer-sync";
import { getCachedLyrics, setCachedLyrics } from "@/lib/lyrics/cache";
import { normalize } from "@/lib/lyrics/match";

// GET /api/v1/lyrics/[trackId] — LRCLIB (exact get → fuzzy search) + Deezer GW,
// best synced match wins. Cascade and scoring live in `src/lib/lyrics/`.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;

		// Metadata for LRCLIB, first source wins per field:
		//   1. query params (the client sends the playing track's metadata)
		//   2. SavedTrack (user's library)
		//   3. RecentPlay (recently played)
		//   4. Deezer public track API (any Deezer track id)
		const sp = request.nextUrl.searchParams;
		let title = sp.get("title")?.trim() ?? "";
		let artist = sp.get("artist")?.trim() ?? "";
		let album: string | null = sp.get("album")?.trim() || null;
		const durationParam = Number(sp.get("duration"));
		let duration: number | null = Number.isFinite(durationParam) && durationParam > 0 ? durationParam : null;

		if (!title || !artist) {
			const saved = await prisma.savedTrack.findUnique({
				where: { userId_trackId: { userId: userResult.userId, trackId } },
				select: { title: true, artist: true, album: true },
			});
			if (saved) {
				title = title || saved.title;
				artist = artist || saved.artist;
				album = album ?? saved.album;
			}
		}
		if (!title || !artist) {
			const recent = await prisma.recentPlay.findUnique({
				where: { userId_trackId: { userId: userResult.userId, trackId } },
				select: { title: true, artist: true, album: true },
			});
			if (recent) {
				title = title || recent.title;
				artist = artist || recent.artist;
				album = album ?? recent.album;
			}
		}

		// Deezer session, resolved at most once and only when needed.
		let dzP: ReturnType<typeof requireDeezer> | null = null;
		const deezer = async () => {
			dzP ??= requireDeezer(request);
			const r = await dzP;
			return r.error ? null : r.dz;
		};

		if (!title || !artist || !duration) {
			try {
				const dz = await deezer();
				const t = dz ? await dz.api.getTrack(trackId) : null;
				if (t) {
					title = title || t.title;
					artist = artist || t.artist.name;
					album = album ?? t.album.title ?? null;
					duration = duration ?? (t.duration || null);
				}
			} catch {
				// Not a Deezer id / API unavailable — carry on with what we have.
			}
		}

		const hasMeta = !!(title && artist);
		if (!hasMeta && !(await deezer())) {
			return fail("MISSING_METADATA", "Track title/artist required for lyrics lookup.", 400);
		}

		const cacheKey = `${trackId}|${normalize(title)}|${normalize(artist)}|${duration ? Math.round(duration) : ""}`;
		const cached = getCachedLyrics(cacheKey);
		if (cached) return ok(cached);

		const result = await findLyrics(hasMeta ? { title, artist, album, duration } : null, {
			deezer: async (): Promise<DeezerLyrics | null> => {
				const dz = await deezer();
				if (!dz) return null;
				const data = await dz.gw.get_track_lyrics(trackId);
				if (!data) return null;
				return {
					plainLyrics: data.LYRICS_TEXT || null,
					syncedLyrics: deezerSyncToLrc(data.LYRICS_SYNC_JSON),
				};
			},
		});
		setCachedLyrics(cacheKey, result);
		return ok(result);
	} catch (e) {
		return handleError(e);
	}
}
