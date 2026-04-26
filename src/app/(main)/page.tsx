import { serverFetch, getServerSession } from "@/lib/server-fetch";
import { HomeContent } from "./_components/HomeContent";

interface UserPlaylist {
	id: string;
	title: string;
	description: string | null;
	updatedAt: string;
	_count: { tracks: number };
	covers?: string[];
}

interface UserAlbum {
	id: string;
	deezerAlbumId: string;
	title: string;
	artist: string;
	coverUrl: string | null;
	trackCount: number;
	downloadedAt: string;
}

interface RecentPlayItem {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	albumId: string | null;
	coverUrl: string | null;
	duration: number | null;
	playedAt: string;
}

export default async function HomePage() {
	const session = await getServerSession();

	if (!session?.user) {
		return <HomeContent playlists={[]} albums={[]} recentPlays={[]} user={null} />;
	}

	const [playlists, albums, recent] = await Promise.all([
		serverFetch<UserPlaylist[]>("playlists").catch(() => null),
		serverFetch<UserAlbum[]>("albums").catch(() => null),
		serverFetch<{ items: RecentPlayItem[] }>("recent-plays?limit=12").catch(() => null),
	]);

	return (
		<HomeContent
			playlists={playlists || []}
			albums={albums || []}
			recentPlays={recent?.items || []}
			user={{ name: session.user.name }}
		/>
	);
}
