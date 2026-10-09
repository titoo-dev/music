import { prisma } from "@/lib/prisma";

/**
 * A user's playlists for lists and cards: newest first, with the track count
 * and up to four cover URLs (`covers`) — the shape `GET /api/v1/playlists`
 * returns. Shared by that route and the Home page (which reads it directly).
 */
export async function listPlaylistSummaries(userId: string) {
	const playlists = await prisma.playlist.findMany({
		where: { userId },
		orderBy: { updatedAt: "desc" },
		include: {
			_count: { select: { tracks: true } },
			tracks: {
				take: 4,
				orderBy: { position: "asc" },
				select: { coverUrl: true },
			},
		},
	});
	return playlists.map((pl) => ({
		...pl,
		covers: pl.tracks.map((t) => t.coverUrl).filter(Boolean) as string[],
		tracks: undefined,
	}));
}
