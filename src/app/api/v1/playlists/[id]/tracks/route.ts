import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../../../_lib/helpers";

// POST /api/v1/playlists/[id]/tracks — Add track(s) to playlist
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

		const { tracks } = await request.json();
		if (!Array.isArray(tracks) || tracks.length === 0) {
			return fail("MISSING_TRACKS", "tracks array is required.", 400);
		}

		// Get current max position
		const lastTrack = await prisma.playlistTrack.findFirst({
			where: { playlistId: id },
			orderBy: { position: "desc" },
		});
		let nextPosition = (lastTrack?.position ?? -1) + 1;

		const created = [];
		for (const track of tracks) {
			try {
				const result = await prisma.playlistTrack.upsert({
					where: {
						playlistId_trackId: {
							playlistId: id,
							trackId: String(track.trackId),
						},
					},
					update: {},
					create: {
						playlistId: id,
						trackId: String(track.trackId),
						title: track.title || "",
						artist: track.artist || "",
						album: track.album || null,
						coverUrl: track.coverUrl || null,
						duration: track.duration || null,
						position: nextPosition++,
					},
				});
				created.push(result);
			} catch {
				// Skip duplicates or errors
			}
		}

		// Update playlist timestamp
		await prisma.playlist.update({
			where: { id },
			data: { updatedAt: new Date() },
		});

		return ok(created);
	} catch (e) {
		return handleError(e);
	}
}

// DELETE /api/v1/playlists/[id]/tracks — Remove track(s) from playlist
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

		const { trackIds } = await request.json();
		if (!Array.isArray(trackIds) || trackIds.length === 0) {
			return fail("MISSING_TRACK_IDS", "trackIds array is required.", 400);
		}

		await prisma.playlistTrack.deleteMany({
			where: {
				playlistId: id,
				trackId: { in: trackIds.map(String) },
			},
		});

		return ok({ removed: trackIds.length });
	} catch (e) {
		return handleError(e);
	}
}
