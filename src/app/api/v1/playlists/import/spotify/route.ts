import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { addToPlaylist } from "@/lib/library";
import { parsePlaylistInput, fetchPlaylist, matchTracks, SpotifyAPIError } from "@/lib/spotify";
import type { SpotifyPlaylistMeta, SpotifyTrackMeta } from "@/lib/spotify";
import { ok, fail, handleError, requireDeezer } from "../../../_lib/helpers";

// Matching 500 tracks takes ~1 min; keep the sync path under the timeout.
export const maxDuration = 300;

const MAX_TRACKS_SYNC = 500;
const MATCH_CONCURRENCY = 8;
const DEFAULT_TRACKS_TITLE = "Spotify import";
const TRACK_ID = /^[A-Za-z0-9]{22}$/;

interface NotFoundRow {
	spotifyId: string;
	title: string;
	artist: string;
	album: string;
	reason: string;
}

function spotifyFailure(e: SpotifyAPIError) {
	if (e.status === 404) {
		return fail("SPOTIFY_NOT_FOUND", "Playlist not found, private, or unavailable in this region.", 404);
	}
	if (e.status === 403) {
		return fail("SPOTIFY_FORBIDDEN", `Spotify denied the request: ${e.message}.`, 403);
	}
	if (e.status === 429) {
		return fail("SPOTIFY_RATE_LIMITED", "Spotify is rate-limiting requests. Please try again in a moment.", 429);
	}
	return fail("SPOTIFY_ERROR", e.message, 502);
}

// Tracks the browser already read from pasted links (see readTrackLinks).
// Only the fields the matcher needs are kept; anything malformed rejects the batch.
function parseClientTracks(input: unknown[]): SpotifyTrackMeta[] | null {
	const out: SpotifyTrackMeta[] = [];
	for (const raw of input) {
		const t = raw as Partial<SpotifyTrackMeta> | null;
		if (
			!t ||
			typeof t.spotifyId !== "string" ||
			!TRACK_ID.test(t.spotifyId) ||
			typeof t.title !== "string" ||
			!t.title.trim() ||
			!Array.isArray(t.artists) ||
			!t.artists.every((a) => typeof a === "string") ||
			typeof t.durationMs !== "number"
		) {
			return null;
		}
		out.push({
			spotifyId: t.spotifyId,
			title: t.title.slice(0, 300),
			artists: t.artists.slice(0, 20).map((a) => a.slice(0, 200)),
			album: "",
			albumId: null,
			durationMs: t.durationMs,
			isrc: null,
			coverUrl: null,
		});
	}
	return out;
}

// POST /api/v1/playlists/import/spotify
// Body: { url: string }                                     — a playlist link, or
//       { tracks, unreadable?: string[], total?: number, title?: string }
//                                                           — tracks read from pasted links
// Response: { playlist, report: { totalSpotify, processed, matched, notFound, truncated, limited } }
export async function POST(request: NextRequest) {
	try {
		const { userId, dz, error } = await requireDeezer(request);
		if (error) return error;

		const body = await request.json().catch(() => ({}));

		// 1. Collect the Spotify tracks
		let spotify: SpotifyPlaylistMeta;
		let truncated = false;
		let processed: number;
		const notFound: NotFoundRow[] = [];

		if (Array.isArray(body.tracks)) {
			const tracks = parseClientTracks(body.tracks);
			if (!tracks || tracks.length === 0) {
				return fail("INVALID_TRACKS", "`tracks` must be a non-empty list of Spotify tracks.", 400);
			}
			const unreadable: string[] = Array.isArray(body.unreadable)
				? body.unreadable.filter((id: unknown) => typeof id === "string" && TRACK_ID.test(id)).slice(0, MAX_TRACKS_SYNC)
				: [];
			const kept = tracks.slice(0, MAX_TRACKS_SYNC);
			const total = Math.max(
				typeof body.total === "number" ? body.total : 0,
				tracks.length + unreadable.length
			);
			truncated = total > MAX_TRACKS_SYNC;
			processed = Math.min(kept.length + unreadable.length, MAX_TRACKS_SYNC);
			spotify = {
				spotifyId: "",
				title: (typeof body.title === "string" && body.title.trim().slice(0, 200)) || DEFAULT_TRACKS_TITLE,
				description: "",
				ownerName: "",
				coverUrl: null,
				totalTracks: total,
				tracks: kept,
				source: "embed",
				limited: false,
			};
			for (const spotifyId of unreadable) {
				notFound.push({
					spotifyId,
					title: `spotify:track:${spotifyId}`,
					artist: "",
					album: "",
					reason: "Couldn't read this track from Spotify",
				});
			}
		} else {
			const { url } = body;
			if (!url || typeof url !== "string") {
				return fail("MISSING_URL", "A Spotify playlist URL is required.", 400);
			}
			const playlistId = parsePlaylistInput(url);
			if (!playlistId) {
				return fail("INVALID_URL", "Could not extract a Spotify playlist ID from the input.", 400);
			}
			try {
				spotify = await fetchPlaylist(playlistId);
			} catch (e) {
				if (e instanceof SpotifyAPIError) return spotifyFailure(e);
				throw e;
			}
			if (spotify.tracks.length === 0) {
				return fail("EMPTY_PLAYLIST", "Playlist has no importable tracks.", 400);
			}
			truncated = spotify.tracks.length > MAX_TRACKS_SYNC;
			if (truncated) spotify.tracks = spotify.tracks.slice(0, MAX_TRACKS_SYNC);
			processed = spotify.tracks.length;
		}

		const tracksToMatch = spotify.tracks;

		// 2. Match each Spotify track to a Deezer track
		const matches = await matchTracks(dz, tracksToMatch, {
			concurrency: MATCH_CONCURRENCY,
		});

		// 3. Build inputs for addToPlaylist + the not-found report (preserves
		//    Spotify metadata so the UI can offer a manual re-search).
		const matchedRows: Parameters<typeof addToPlaylist>[1] = [];
		const seen = new Set<string>();

		matches.forEach((m, i) => {
			const src = tracksToMatch[i];
			if (m.status === "matched") {
				if (seen.has(m.deezerTrackId)) return; // dedupe within the import
				seen.add(m.deezerTrackId);
				matchedRows.push({
					trackId: m.deezerTrackId,
					title: m.title,
					artist: m.artist,
					album: m.album,
					albumId: m.albumId,
					coverUrl: m.coverUrl,
					duration: m.duration,
				});
			} else {
				notFound.push({
					spotifyId: src.spotifyId,
					title: src.title,
					artist: src.artists.join(", "),
					album: src.album,
					reason: m.reason,
				});
			}
		});

		const report = {
			totalSpotify: spotify.totalTracks,
			processed,
			matched: matchedRows.length,
			notFound,
			truncated,
			limited: spotify.limited,
		};

		// 4. Create the playlist + persist matched tracks. We only create the
		//    playlist if there's at least one matched track; otherwise we'd
		//    leave an empty playlist behind on a fully-failed import.
		if (matchedRows.length === 0) {
			return ok({ playlist: null, report });
		}

		const playlist = await prisma.playlist.create({
			data: {
				userId,
				title: spotify.title,
				description: spotify.description || null,
				coverUrl: spotify.coverUrl ?? matchedRows[0].coverUrl ?? null,
			},
		});

		await addToPlaylist(playlist.id, matchedRows);

		return ok({ playlist, report });
	} catch (e) {
		return handleError(e);
	}
}
