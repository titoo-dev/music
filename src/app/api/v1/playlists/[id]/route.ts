import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeemixApp } from "@/lib/server-state";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

// GET /api/v1/playlists/[id] — Get playlist with tracks
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;

		const playlist = await prisma.playlist.findFirst({
			where: { id, userId },
			include: {
				tracks: { orderBy: { position: "asc" } },
			},
		});

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

		const playlist = await prisma.playlist.findFirst({
			where: { id, userId },
		});
		if (!playlist) {
			return fail("NOT_FOUND", "Playlist not found.", 404);
		}

		const updated = await prisma.playlist.update({
			where: { id },
			data: {
				...(title !== undefined && { title: title.trim() }),
				...(description !== undefined && { description: description?.trim() || null }),
			},
		});

		return ok(updated);
	} catch (e) {
		return handleError(e);
	}
}

// DELETE /api/v1/playlists/[id] — Delete playlist
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;

		const playlist = await prisma.playlist.findFirst({
			where: { id, userId },
		});
		if (!playlist) {
			return fail("NOT_FOUND", "Playlist not found.", 404);
		}

		if (playlist.title === "Downloads") {
			return fail("PROTECTED", "The Downloads playlist cannot be deleted.", 403);
		}

		// Get all track IDs from this playlist
		const playlistTracks = await prisma.playlistTrack.findMany({
			where: { playlistId: id },
			select: { trackId: true },
		});
		const trackIds = playlistTracks.map((t) => t.trackId);

		// Look up storage paths from download history
		if (trackIds.length > 0) {
			const downloads = await prisma.downloadHistory.findMany({
				where: { userId, trackId: { in: trackIds } },
				select: { storagePath: true, trackId: true, storedTrackId: true },
			});

			// Delete download history entries for this user first
			await prisma.downloadHistory.deleteMany({
				where: { userId, trackId: { in: trackIds } },
			});

			// Only delete S3 files if no other users reference the same StoredTrack
			const app = await getDeemixApp();
			const storageProvider = app?.storageProvider;
			if (storageProvider && downloads.length > 0) {
				for (const dl of downloads) {
					if (!dl.storagePath) continue;

					if (dl.storedTrackId) {
						// Check if any other DownloadHistory still references this StoredTrack
						const otherRefs = await prisma.downloadHistory.count({
							where: { storedTrackId: dl.storedTrackId },
						});
						if (otherRefs > 0) continue; // Other users still need this file

						// No more references — safe to delete the file and StoredTrack record
						try {
							await storageProvider.deleteFile(dl.storagePath);
						} catch { /* ignore */ }
						try {
							await prisma.storedTrack.delete({ where: { id: dl.storedTrackId } });
						} catch { /* ignore */ }
					} else {
						// Legacy record without StoredTrack — delete directly
						try {
							await storageProvider.deleteFile(dl.storagePath);
						} catch { /* ignore */ }
					}
				}
			}
		}

		await prisma.playlist.delete({ where: { id } });

		return ok({ deleted: true });
	} catch (e) {
		return handleError(e);
	}
}
