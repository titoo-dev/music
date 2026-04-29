import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { addToPlaylist } from "@/lib/library";
import {
	parsePlaylistInput,
	fetchPlaylist,
	matchTracks,
	SpotifyConfigError,
	SpotifyAPIError,
} from "@/lib/spotify";
import { ok, fail, handleError, requireDeezer } from "../../../_lib/helpers";

// Hard cap so the synchronous path stays well below the 300s function
// timeout. Larger playlists should later use the background-job variant.
const MAX_TRACKS_SYNC = 500;
const MATCH_CONCURRENCY = 8;

// POST /api/v1/playlists/import/spotify
// Body: { url: string }
// Response: { playlist, report: { totalSpotify, matched, notFound: [...] } }
export async function POST(request: NextRequest) {
	try {
		const { userId, dz, error } = await requireDeezer(request);
		if (error) return error;

		const { url } = await request.json().catch(() => ({}));
		if (!url || typeof url !== "string") {
			return fail("MISSING_URL", "A Spotify playlist URL is required.", 400);
		}

		const playlistId = parsePlaylistInput(url);
		if (!playlistId) {
			return fail(
				"INVALID_URL",
				"Could not extract a Spotify playlist ID from the input.",
				400
			);
		}

		// 1. Fetch from Spotify
		let spotify;
		try {
			spotify = await fetchPlaylist(playlistId);
		} catch (e) {
			if (e instanceof SpotifyConfigError) {
				return fail("SPOTIFY_NOT_CONFIGURED", e.message, 503);
			}
			if (e instanceof SpotifyAPIError) {
				if (e.status === 404) {
					return fail(
						"SPOTIFY_NOT_FOUND",
						"Playlist not found, private, or unavailable in this region.",
						404
					);
				}
				if (e.status === 403) {
					// Spotify uses 403 for both "owner of the dev app needs Premium"
					// and rate-limit-style restrictions. Surface a hint either way —
					// the underlying message often explains it.
					return fail(
						"SPOTIFY_FORBIDDEN",
						`Spotify denied the request: ${e.message}. The developer account that owns the Spotify app must have an active Premium subscription.`,
						403
					);
				}
				if (e.status === 429) {
					return fail(
						"SPOTIFY_RATE_LIMITED",
						"Spotify is rate-limiting requests. Please try again in a moment.",
						429
					);
				}
				return fail("SPOTIFY_ERROR", e.message, 502);
			}
			throw e;
		}

		if (spotify.tracks.length === 0) {
			return fail("EMPTY_PLAYLIST", "Playlist has no importable tracks.", 400);
		}

		const truncated = spotify.tracks.length > MAX_TRACKS_SYNC;
		const tracksToMatch = truncated
			? spotify.tracks.slice(0, MAX_TRACKS_SYNC)
			: spotify.tracks;

		// 2. Match each Spotify track to a Deezer track
		const matches = await matchTracks(dz, tracksToMatch, {
			concurrency: MATCH_CONCURRENCY,
		});

		// 3. Build inputs for addToPlaylist + the not-found report (preserves
		//    Spotify metadata so the UI can offer a manual re-search).
		const matchedRows: Parameters<typeof addToPlaylist>[1] = [];
		const notFound: Array<{
			spotifyId: string;
			title: string;
			artist: string;
			album: string;
			reason: string;
		}> = [];
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

		// 4. Create the playlist + persist matched tracks. We only create the
		//    playlist if there's at least one matched track; otherwise we'd
		//    leave an empty playlist behind on a fully-failed import.
		if (matchedRows.length === 0) {
			return ok({
				playlist: null,
				report: {
					totalSpotify: spotify.totalTracks,
					processed: tracksToMatch.length,
					matched: 0,
					notFound,
					truncated,
				},
			});
		}

		const playlist = await prisma.playlist.create({
			data: {
				userId,
				title: spotify.title,
				description: spotify.description || null,
				coverUrl: spotify.coverUrl,
			},
		});

		await addToPlaylist(playlist.id, matchedRows);

		return ok({
			playlist,
			report: {
				totalSpotify: spotify.totalTracks,
				processed: tracksToMatch.length,
				matched: matchedRows.length,
				notFound,
				truncated,
			},
		});
	} catch (e) {
		return handleError(e);
	}
}
