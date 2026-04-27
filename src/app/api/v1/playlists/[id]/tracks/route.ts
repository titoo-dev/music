import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../../../_lib/helpers";
import { addToPlaylist, removeFromPlaylist } from "@/lib/library";

// POST /api/v1/playlists/[id]/tracks — add track(s) to playlist
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;
		const playlist = await prisma.playlist.findFirst({ where: { id, userId } });
		if (!playlist) return fail("NOT_FOUND", "Playlist not found.", 404);

		const { tracks } = await request.json();
		if (!Array.isArray(tracks) || tracks.length === 0) {
			return fail("MISSING_TRACKS", "tracks array is required.", 400);
		}

		const result = await addToPlaylist(
			id,
			tracks.map((t: any) => ({
				trackId: String(t.trackId),
				title: String(t.title || ""),
				artist: String(t.artist || ""),
				album: t.album ?? null,
				albumId: t.albumId ?? null,
				coverUrl: t.coverUrl ?? null,
				duration: t.duration ?? null,
			}))
		);
		return ok(result);
	} catch (e) {
		return handleError(e);
	}
}

// DELETE /api/v1/playlists/[id]/tracks — unlink tracks from a playlist.
// Pure metadata operation: playlists don't anchor file lifecycle in the new
// model, so removing a track from a playlist never touches storage.
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;
		const playlist = await prisma.playlist.findFirst({ where: { id, userId } });
		if (!playlist) return fail("NOT_FOUND", "Playlist not found.", 404);

		const { trackIds } = await request.json();
		if (!Array.isArray(trackIds) || trackIds.length === 0) {
			return fail("MISSING_TRACK_IDS", "trackIds array is required.", 400);
		}

		const result = await removeFromPlaylist(id, trackIds.map(String));
		return ok(result);
	} catch (e) {
		return handleError(e);
	}
}
