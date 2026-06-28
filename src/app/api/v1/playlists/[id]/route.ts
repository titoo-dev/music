import { NextRequest } from "next/server";
import {
	getPlaylistWithTracks,
	updatePlaylist,
	deletePlaylist,
} from "@/lib/repositories/playlists";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

// GET /api/v1/playlists/[id] — Get playlist with tracks
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;

		const playlist = await getPlaylistWithTracks(id, userId);

		if (!playlist) {
			return fail("NOT_FOUND", "Playlist not found.", 404);
		}

		return ok(playlist);
	} catch (e) {
		return handleError(e);
	}
}

// PATCH /api/v1/playlists/[id] — Update playlist
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;
		const { title, description } = await request.json();

		const updated = await updatePlaylist(id, userId, {
			...(title !== undefined && { title: title.trim() }),
			...(description !== undefined && {
				description: description?.trim() || null,
			}),
		});
		if (!updated) {
			return fail("NOT_FOUND", "Playlist not found.", 404);
		}

		return ok(updated);
	} catch (e) {
		return handleError(e);
	}
}

// DELETE /api/v1/playlists/[id] — delete the playlist (metadata-only).
// Tracks belonging to this playlist are unlinked via the FK cascade. Audio
// files are NOT touched: playlists don't anchor file lifecycle in the new
// model — only SavedTrack / AlbumTrack / SharedTrack / RecentPlay do.
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;

		const deleted = await deletePlaylist(id, userId);
		if (!deleted) {
			return fail("NOT_FOUND", "Playlist not found.", 404);
		}

		return ok({ deleted: true });
	} catch (e) {
		return handleError(e);
	}
}
