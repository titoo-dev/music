import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeemixApp } from "@/lib/server-state";
import { ok, fail, handleError, requireUser } from "../../../_lib/helpers";

type RouteCtx = { params: Promise<{ id: string }> };

// DELETE /api/v1/albums/:id/tracks — Remove individual tracks from an album
export async function DELETE(request: NextRequest, ctx: RouteCtx) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;
		const body = await request.json();
		const trackIds: string[] = body.trackIds;

		if (!Array.isArray(trackIds) || trackIds.length === 0) {
			return fail("BAD_REQUEST", "trackIds array is required.", 400);
		}

		const album = await prisma.album.findUnique({
			where: { id },
		});

		if (!album || album.userId !== userId) {
			return fail("NOT_FOUND", "Album not found.", 404);
		}

		// Find the tracks to delete
		const tracks = await prisma.downloadHistory.findMany({
			where: {
				userId,
				albumId: album.deezerAlbumId,
				trackId: { in: trackIds },
			},
			select: {
				id: true,
				trackId: true,
				storagePath: true,
				storageType: true,
				storedTrackId: true,
			},
		});

		if (tracks.length === 0) {
			return fail("NOT_FOUND", "No matching tracks found.", 404);
		}

		// Delete download history entries
		await prisma.downloadHistory.deleteMany({
			where: {
				id: { in: tracks.map((t) => t.id) },
			},
		});

		// Clean up S3 files if no other references
		const app = await getDeemixApp();
		const storageProvider = app?.storageProvider;
		if (storageProvider) {
			for (const track of tracks) {
				const storagePath = track.storagePath;
				if (!storagePath) continue;

				if (track.storedTrackId) {
					const otherRefs = await prisma.downloadHistory.count({
						where: { storedTrackId: track.storedTrackId },
					});
					if (otherRefs > 0) continue;

					try {
						await storageProvider.deleteFile(storagePath);
					} catch { /* ignore */ }
					try {
						await prisma.storedTrack.delete({ where: { id: track.storedTrackId } });
					} catch { /* ignore */ }
				} else {
					try {
						await storageProvider.deleteFile(storagePath);
					} catch { /* ignore */ }
				}
			}
		}

		// Check if album still has tracks — if not, delete the album record too
		const remaining = await prisma.downloadHistory.count({
			where: { userId, albumId: album.deezerAlbumId },
		});

		if (remaining === 0) {
			await prisma.album.delete({ where: { id } });
		}

		return ok({ deleted: tracks.map((t) => t.trackId), albumDeleted: remaining === 0 });
	} catch (e) {
		return handleError(e);
	}
}
