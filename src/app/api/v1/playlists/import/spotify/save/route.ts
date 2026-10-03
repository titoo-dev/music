import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { addToPlaylist } from "@/lib/library";
import { MAX_IMPORT_TRACKS, parseImportedRows } from "@/lib/spotify/import";
import { ok, fail, handleError, requireUser } from "../../../../_lib/helpers";

export const maxDuration = 60;

const DEFAULT_TITLE = "Spotify import";

// POST /api/v1/playlists/import/spotify/save
// Body: { title?: string, description?: string, coverUrl?: string, tracks: ImportedRow[] (1…1000) }
// Response: { playlist } — the new playlist holding the matched tracks
// Last step of the chunked import: the rows are …/match results.
export async function POST(request: NextRequest) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const body = await request.json().catch(() => ({}));
		const rows = parseImportedRows(body.tracks);
		if (!rows || rows.length === 0) {
			return fail("INVALID_TRACKS", "`tracks` must be a non-empty list of matched tracks.", 400);
		}
		if (rows.length > MAX_IMPORT_TRACKS) {
			return fail("TOO_MANY_TRACKS", `At most ${MAX_IMPORT_TRACKS} tracks per import.`, 400);
		}

		const seen = new Set<string>();
		const unique = rows.filter((r) => !seen.has(r.trackId) && !!seen.add(r.trackId));
		const title = (typeof body.title === "string" && body.title.trim().slice(0, 200)) || DEFAULT_TITLE;
		const description = typeof body.description === "string" ? body.description.trim().slice(0, 1000) : "";
		const coverUrl = typeof body.coverUrl === "string" && /^https:\/\//.test(body.coverUrl) ? body.coverUrl.slice(0, 500) : null;

		const playlist = await prisma.playlist.create({
			data: { userId, title, description: description || null, coverUrl: coverUrl ?? unique[0].coverUrl },
		});
		await addToPlaylist(playlist.id, unique);

		return ok({ playlist });
	} catch (e) {
		return handleError(e);
	}
}
