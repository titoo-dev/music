import { getServerSession } from "@/lib/server-fetch";
import { prisma } from "@/lib/prisma";
import { listSavedAlbums, listSavedTracks } from "@/lib/library";
import { listPlaylistSummaries } from "@/lib/playlist-summaries";
import {
	HomeContent,
	type UserPlaylist,
	type UserAlbum,
	type RecentPlayItem,
	type SavedTrackItem,
} from "./_components/HomeContent";

/** Same JSON the API routes return (dates as ISO strings), for the client component. */
const plain = <T,>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;
const orEmpty = <T,>(p: Promise<T>) => p.catch(() => null);

export default async function HomePage() {
	const session = await getServerSession();

	if (!session?.user) {
		return <HomeContent playlists={[]} albums={[]} recentPlays={[]} tracks={[]} user={null} />;
	}

	// Straight from the database: going through our own API cost four HTTP round trips and
	// four more session checks on every visit to "All music".
	const userId = session.user.id;
	const [playlists, albums, recent, tracks] = await Promise.all([
		orEmpty(listPlaylistSummaries(userId)),
		orEmpty(listSavedAlbums(userId)),
		orEmpty(prisma.recentPlay.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 24 })),
		orEmpty(listSavedTracks(userId, { limit: 500 })),
	]);

	return (
		<HomeContent
			playlists={plain<UserPlaylist[]>(playlists ?? [])}
			albums={plain<UserAlbum[]>(albums ?? [])}
			recentPlays={plain<RecentPlayItem[]>(recent ?? [])}
			tracks={plain<SavedTrackItem[]>(tracks ?? [])}
			user={{ name: session.user.name }}
		/>
	);
}
