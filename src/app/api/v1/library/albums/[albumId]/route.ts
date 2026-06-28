import { NextRequest } from "next/server";
import { requireUser, ok, fail, handleError } from "../../../_lib/helpers";
import { unsaveAlbum } from "@/lib/library";
import {
	getSavedAlbumWithTracks,
	getSavedAlbumDeezerId,
} from "@/lib/repositories/albums";

// GET /api/v1/library/albums/[albumId] — fetch saved album + its tracklist.
// `albumId` is the internal Album.id (cuid), not the Deezer album id.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ albumId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { albumId } = await params;
		const album = await getSavedAlbumWithTracks(albumId, userResult.userId);
		if (!album) return fail("NOT_FOUND", "Album not in your library.", 404);
		return ok(album);
	} catch (e) {
		return handleError(e);
	}
}

// DELETE /api/v1/library/albums/[albumId] — remove album + cleanup files
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ albumId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { albumId } = await params;
		const album = await getSavedAlbumDeezerId(albumId, userResult.userId);
		if (!album) return fail("NOT_FOUND", "Album not in your library.", 404);

		await unsaveAlbum(userResult.userId, album.deezerAlbumId);
		return ok({ unsaved: true });
	} catch (e) {
		return handleError(e);
	}
}
