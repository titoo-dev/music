import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { addToPlaylist } from "@/lib/library";
import { parsePlaylistInput, fetchPlaylist, matchTracks, SpotifyAPIError } from "@/lib/spotify";
import type { SpotifyPlaylistMeta } from "@/lib/spotify";
import {
	MAX_IMPORT_TRACKS,
	SPOTIFY_TRACK_ID,
	collectMatches,
	parseClientTracks,
	unreadableRows,
	type NotFoundRow,
} from "@/lib/spotify/import";
import { ok, fail, handleError, requireDeezer } from "../../../_lib/helpers";
import { spotifyFailure } from "./_lib/errors";

// One-shot import (native clients). Matching 1000 tracks takes ~2 min; the
// web client goes through playlist → match (in batches) → save instead, which
// never gets near the timeout and reports real progress.
export const maxDuration = 300;

const MATCH_CONCURRENCY = 8;
const DEFAULT_TRACKS_TITLE = "Spotify import";

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
				? body.unreadable.filter((id: unknown) => typeof id === "string" && SPOTIFY_TRACK_ID.test(id)).slice(0, MAX_IMPORT_TRACKS)
				: [];
			const kept = tracks.slice(0, MAX_IMPORT_TRACKS);
			const total = Math.max(typeof body.total === "number" ? body.total : 0, tracks.length + unreadable.length);
			truncated = total > MAX_IMPORT_TRACKS;
			processed = Math.min(kept.length + unreadable.length, MAX_IMPORT_TRACKS);
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
			notFound.push(...unreadableRows(unreadable));
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
			truncated = spotify.tracks.length > MAX_IMPORT_TRACKS;
			if (truncated) spotify.tracks = spotify.tracks.slice(0, MAX_IMPORT_TRACKS);
			processed = spotify.tracks.length;
		}

		// 2. Match each Spotify track to a Deezer track; keep the misses (with
		//    their Spotify metadata, so the UI can offer a manual re-search).
		const matches = await matchTracks(dz, spotify.tracks, { concurrency: MATCH_CONCURRENCY });
		const { rows: matchedRows, notFound: misses } = collectMatches(spotify.tracks, matches);
		notFound.push(...misses);

		const report = {
			totalSpotify: spotify.totalTracks,
			processed,
			matched: matchedRows.length,
			notFound,
			truncated,
			limited: spotify.limited,
		};

		// 3. Create the playlist + persist matched tracks. We only create the
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
