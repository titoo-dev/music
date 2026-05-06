import { NextRequest } from "next/server";
import { clean_search_query } from "@/lib/deezer/utils";
import {
	spotifyMultiSearch,
	lookupCachedMatches,
	SpotifyConfigError,
	SpotifyAPIError,
	type SuggestTrackOut,
} from "@/lib/spotify";
import { ok, fail, handleError } from "../../_lib/helpers";

// Per-section limit — 5 keeps the dropdown compact and the response under ~3KB.
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

export async function GET(request: NextRequest) {
	try {
		const params = request.nextUrl.searchParams;
		const rawTerm = params.get("term") || "";
		const term = clean_search_query(rawTerm);
		if (!term) {
			return fail("MISSING_TERM", "Search term is required.", 400);
		}

		const limitParam = parseInt(params.get("limit") || `${DEFAULT_LIMIT}`, 10);
		const limit = Math.max(
			1,
			Math.min(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, MAX_LIMIT)
		);

		let suggestions;
		try {
			suggestions = await spotifyMultiSearch(term, { limit });
		} catch (e) {
			if (e instanceof SpotifyConfigError) {
				// No Spotify creds configured — graceful empty payload so the UI
				// can fall back to its existing Deezer-only search-on-Enter flow.
				return ok({
					tracks: [],
					albums: [],
					artists: [],
					source: "spotify",
					unavailable: "not_configured",
				});
			}
			if (e instanceof SpotifyAPIError) {
				console.error("[search/suggest] Spotify error:", {
					status: e.status,
					message: e.message,
				});
				return fail(
					"SPOTIFY_ERROR",
					`Spotify ${e.status ?? "?"}: ${e.message}`,
					502
				);
			}
			throw e;
		}

		// Annotate tracks with cached Deezer matches so the dropdown can show a
		// "deezer-ready" badge and the click handler can skip the resolve call.
		const matchMap = await lookupCachedMatches(
			suggestions.tracks.map((t) => t.sourceId)
		);

		const tracks: SuggestTrackOut[] = suggestions.tracks.map((t) => {
			const m = matchMap.get(t.sourceId);
			return {
				...t,
				matched: !!m && m.deezerTrackId !== null,
				deezerTrackId: m?.deezerTrackId ?? null,
			};
		});

		return ok({
			tracks,
			albums: suggestions.albums,
			artists: suggestions.artists,
			source: "spotify",
		});
	} catch (e) {
		return handleError(e);
	}
}
