import { serverFetch, getServerSession } from "@/lib/server-fetch";
import {
	HomeContent,
	type UserPlaylist,
	type UserAlbum,
	type RecentPlayItem,
	type SavedTrackItem,
} from "./_components/HomeContent";

export default async function HomePage() {
	const session = await getServerSession();

	if (!session?.user) {
		return <HomeContent playlists={[]} albums={[]} recentPlays={[]} tracks={[]} user={null} />;
	}

	const [playlists, albums, recent, tracks] = await Promise.all([
		serverFetch<UserPlaylist[]>("playlists").catch(() => null),
		serverFetch<{ items: UserAlbum[] }>("library/albums").catch(() => null),
		serverFetch<{ items: RecentPlayItem[] }>("recent-plays", { limit: "24" }).catch(() => null),
		serverFetch<{ items: SavedTrackItem[] }>("library/tracks", { limit: "500" }).catch(() => null),
	]);

	return (
		<HomeContent
			playlists={playlists || []}
			albums={albums?.items || []}
			recentPlays={recent?.items || []}
			tracks={tracks?.items || []}
			user={{ name: session.user.name }}
		/>
	);
}
