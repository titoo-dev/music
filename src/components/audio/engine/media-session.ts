// What the OS media controls (lock screen, notification, hardware keys)
// show for the current track.

const COVER_SIZES = [256, 512] as const;

export function mediaMetadataInit(track: {
	title: string;
	artist: string;
	album?: string | null;
	cover: string | null;
}): MediaMetadataInit {
	const cover = track.cover;
	const artwork: MediaImage[] = cover
		? COVER_SIZES.map((size) => ({
				src: cover.replace(/\/\d+x\d+-/, `/${size}x${size}-`),
				sizes: `${size}x${size}`,
				type: "image/jpeg",
			}))
		: [];
	return {
		title: track.title,
		artist: track.artist,
		// Was: no album on the lock screen.
		album: track.album ?? "",
		artwork,
	};
}
