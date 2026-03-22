import { NextRequest } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getDeemixApp } from "@/lib/server-state";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/v1/albums/:id — Get album details with tracks from download history
export async function GET(request: NextRequest, ctx: RouteCtx) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;

		const album = await prisma.album.findUnique({
			where: { id },
		});

		if (!album || album.userId !== userId) {
			return fail("NOT_FOUND", "Album not found.", 404);
		}

		// Fetch tracks from download history that belong to this album
		const tracks = await prisma.downloadHistory.findMany({
			where: {
				userId,
				albumId: album.deezerAlbumId,
			},
			orderBy: { downloadedAt: "asc" },
		});

		return ok({
			...album,
			tracks: tracks.map((t) => ({
				id: t.id,
				trackId: t.trackId,
				title: t.title,
				artist: t.artist,
				album: t.album,
				coverUrl: t.coverUrl,
				duration: null,
				fileSize: t.fileSize,
			})),
		});
	} catch (e) {
		return handleError(e);
	}
}

// DELETE /api/v1/albums/:id — Delete album and its associated download history
export async function DELETE(request: NextRequest, ctx: RouteCtx) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;

		const album = await prisma.album.findUnique({
			where: { id },
		});

		if (!album || album.userId !== userId) {
			return fail("NOT_FOUND", "Album not found.", 404);
		}

		// Fetch tracks to get their storage paths before deleting
		const tracks = await prisma.downloadHistory.findMany({
			where: { userId, albumId: album.deezerAlbumId },
			select: { storagePath: true, storageType: true },
		});

		// Delete entire album directory from storage (tracks, covers, extras)
		const app = await getDeemixApp();
		const storageProvider = app?.storageProvider;
		if (storageProvider) {
			// Derive the album folder from the first track's storage path
			const firstPath = tracks.find((t) => t.storagePath)?.storagePath;
			if (firstPath) {
				const albumDir = path.dirname(firstPath);
				try {
					await storageProvider.deleteDirectory(albumDir);
				} catch {
					// Fall back to deleting individual track files
					for (const track of tracks) {
						if (track.storagePath) {
							try {
								await storageProvider.deleteFile(track.storagePath);
							} catch {
								// Continue even if a file deletion fails
							}
						}
					}
				}
			}
		}

		// Delete tracks from download history
		await prisma.downloadHistory.deleteMany({
			where: { userId, albumId: album.deezerAlbumId },
		});

		// Delete the album record
		await prisma.album.delete({ where: { id } });

		return ok({ deleted: true });
	} catch (e) {
		return handleError(e);
	}
}
