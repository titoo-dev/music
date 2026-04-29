// Internal, normalized shapes used by the matcher and import route.
// Independent from the raw Spotify Web API response so changes upstream
// don't ripple into the rest of the codebase.

export interface SpotifyTrackMeta {
	spotifyId: string;
	title: string;
	artists: string[]; // ordered, primary first
	album: string;
	albumId: string | null;
	durationMs: number;
	isrc: string | null;
	coverUrl: string | null;
}

export interface SpotifyPlaylistMeta {
	spotifyId: string;
	title: string;
	description: string;
	ownerName: string;
	coverUrl: string | null;
	totalTracks: number;
	tracks: SpotifyTrackMeta[];
}
