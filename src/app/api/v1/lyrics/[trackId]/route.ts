import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireDeezer, ok, fail, handleError } from "../../_lib/helpers";

interface LrcLibResponse {
	id: number;
	trackName: string;
	artistName: string;
	albumName: string;
	duration: number;
	instrumental: boolean;
	plainLyrics: string | null;
	syncedLyrics: string | null;
}

// GET /api/v1/lyrics/[trackId] — Fetch lyrics from LRCLIB (primary) + Deezer GW (fallback)
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;

		// Try multiple sources for the title/artist metadata needed by LRCLIB:
		//   1. SavedTrack (user's library)
		//   2. RecentPlay (recently played)
		//   3. Query params (passed by the client when requesting)
		// The route stays usable for any track the user might be playing,
		// even one that isn't yet saved.
		const sp = request.nextUrl.searchParams;
		const queryTitle = sp.get("title");
		const queryArtist = sp.get("artist");
		const queryAlbum = sp.get("album");

		let title = queryTitle ?? "";
		let artist = queryArtist ?? "";
		let album: string | null = queryAlbum ?? null;

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

		if (!title || !artist) {
			return fail("MISSING_METADATA", "Track title/artist required for lyrics lookup.", 400);
		}
		// Duration from query param (seconds) — optional, improves LRCLIB matching
		const durationParam = request.nextUrl.searchParams.get("duration");
		const duration = durationParam ? parseInt(durationParam) : null;

		// 1. Try LRCLIB (free, no auth, has synced lyrics)
		try {
			const lrcResult = await fetchLrcLib(title, artist, album, duration);
			if (lrcResult) {
				return ok({
					source: "lrclib",
					syncedLyrics: lrcResult.syncedLyrics,
					plainLyrics: lrcResult.plainLyrics,
					instrumental: lrcResult.instrumental,
				});
			}
		} catch {
			// LRCLIB failed, try fallback
		}

		// 2. Fallback: Deezer GW API
		try {
			const deezerResult = await requireDeezer(request);
			if (!deezerResult.error) {
				const lyricsData = await deezerResult.dz.gw.get_track_lyrics(trackId);
				if (lyricsData) {
					const plainLyrics = lyricsData.LYRICS_TEXT || null;
					let syncedLyrics: string | null = null;

					if (lyricsData.LYRICS_SYNC_JSON) {
						syncedLyrics = lyricsData.LYRICS_SYNC_JSON
							.filter((line: any) => line.lrc_timestamp)
							.map((line: any) => `${line.lrc_timestamp}${line.line || ""}`)
							.join("\n");
					}

					if (plainLyrics || syncedLyrics) {
						return ok({
							source: "deezer",
							syncedLyrics,
							plainLyrics,
							instrumental: false,
						});
					}
				}
			}
		} catch {
			// Deezer lyrics not available (region restriction etc.)
		}

		// No lyrics found from any source
		return ok({
			source: null,
			syncedLyrics: null,
			plainLyrics: null,
			instrumental: false,
		});
	} catch (e) {
		return handleError(e);
	}
}

async function fetchLrcLib(
	title: string,
	artist: string,
	album: string | null,
	duration: number | null
): Promise<LrcLibResponse | null> {
	const params = new URLSearchParams({
		track_name: title,
		artist_name: artist,
	});
	if (album) params.set("album_name", album);
	if (duration) params.set("duration", String(duration));

	const res = await fetch(`https://lrclib.net/api/get?${params}`, {
		headers: { "User-Agent": "deemix-next/0.1.0" },
		signal: AbortSignal.timeout(5000),
	});

	if (!res.ok) return null;

	const data: LrcLibResponse = await res.json();
	if (!data.plainLyrics && !data.syncedLyrics && !data.instrumental) return null;

	return data;
}
