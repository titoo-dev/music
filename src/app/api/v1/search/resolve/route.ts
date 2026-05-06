import { NextRequest } from "next/server";
import { spotifyGet, getOrResolveMatch, SpotifyAPIError } from "@/lib/spotify";
import type { SpotifyTrackMeta } from "@/lib/spotify";
import { ok, fail, handleError, getGuestOrUserDz } from "../../_lib/helpers";

// POST /api/v1/search/resolve
// Body: { source: "spotify", sourceId: string, hint?: SpotifyTrackMeta }
//
// `hint` lets the client pass through the metadata it already has from the
// suggest call so we skip a redundant Spotify track fetch. If absent (e.g.
// page reload, deep link), we fetch from Spotify ourselves.

interface SpotifyTrackResponse {
	id: string;
	name: string;
	duration_ms: number;
	external_ids?: { isrc?: string };
	artists: Array<{ name: string }>;
	album: {
		id: string | null;
		name: string;
		images: Array<{ url: string }>;
	};
}

export async function POST(request: NextRequest) {
	try {
		const { dz } = await getGuestOrUserDz(request);
		if (!dz) {
			return fail(
				"NO_DEEZER",
				"Deezer is not available. Sign in or configure a service ARL.",
				503
			);
		}

		const body = await request.json().catch(() => ({}));
		const source = body?.source;
		const sourceId = body?.sourceId;

		if (source !== "spotify") {
			return fail("INVALID_SOURCE", `Unsupported source: ${source}`, 400);
		}
		if (!sourceId || typeof sourceId !== "string") {
			return fail("MISSING_SOURCE_ID", "sourceId is required.", 400);
		}

		const target = await buildTarget(sourceId, body?.hint);

		const resolved = await getOrResolveMatch(dz, target);
		return ok(resolved);
	} catch (e) {
		if (e instanceof SpotifyAPIError) {
			if (e.status === 404) {
				return fail("SOURCE_NOT_FOUND", "Track not found on source.", 404);
			}
			return fail("SPOTIFY_ERROR", e.message, 502);
		}
		return handleError(e);
	}
}

function isValidHint(hint: unknown): hint is SpotifyTrackMeta {
	if (!hint || typeof hint !== "object") return false;
	const h = hint as Partial<SpotifyTrackMeta>;
	return (
		typeof h.spotifyId === "string" &&
		typeof h.title === "string" &&
		Array.isArray(h.artists) &&
		typeof h.durationMs === "number"
	);
}

async function buildTarget(
	sourceId: string,
	hint: unknown
): Promise<SpotifyTrackMeta> {
	if (isValidHint(hint) && hint.spotifyId === sourceId) return hint;

	const t = await spotifyGet<SpotifyTrackResponse>(`tracks/${sourceId}`);
	return {
		spotifyId: t.id,
		title: t.name,
		artists: t.artists.map((a) => a.name).filter(Boolean),
		album: t.album?.name ?? "",
		albumId: t.album?.id ?? null,
		durationMs: t.duration_ms,
		isrc: t.external_ids?.isrc?.toUpperCase() ?? null,
		coverUrl: t.album?.images?.[0]?.url ?? null,
	};
}
