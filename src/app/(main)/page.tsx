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

export default async function HomePage() {
	const session = await getServerSession();

	if (!session?.user) {
		return <HomeContent playlists={[]} albums={[]} user={null} />;
	}

	const [playlists, albums] = await Promise.all([
		serverFetch<UserPlaylist[]>("playlists").catch(() => null),
		serverFetch<UserAlbum[]>("albums").catch(() => null),
	]);

	return (
		<HomeContent
			playlists={playlists || []}
			albums={albums || []}
			user={{ name: session.user.name }}
		/>
	);
}
