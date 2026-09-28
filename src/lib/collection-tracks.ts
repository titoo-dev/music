import { fetchData } from "@/utils/api";
import { trackFromDeezerRaw, type TrackRowTrack } from "@/components/tracks/TrackRow";

export type CollectionType = "album" | "playlist";

export interface DeezerLink {
	type: "album" | "playlist" | "artist" | "track";
	id: string;
}

/** Recognise deezer.com / deezer.page.link style URLs (with or without locale). */
export function parseDeezerLink(input: string): DeezerLink | null {
	const v = input.trim();
	if (!/deezer\./i.test(v)) return null;
	const m = v.match(/\/(album|playlist|artist|track)\/(\d+)/i);
	if (!m) return null;
	return { type: m[1].toLowerCase() as DeezerLink["type"], id: m[2] };
}

export interface CollectionInfo {
	title: string;
	subtitle: string | null;
	cover: string | null;
	tracks: TrackRowTrack[];
}

/** Load an album or playlist tracklist in the normalized TrackRow shape. */
export async function fetchCollection(type: CollectionType, id: string): Promise<CollectionInfo> {
	const data = await fetchData("content/tracklist", { id, type });
	const meta = data?.DATA || data || {};
	const raw: unknown[] = data?.tracks || data?.SONGS?.data || [];
	const tracks = raw.map((t) => trackFromDeezerRaw(t));
	const picture = type === "album" ? meta.ALB_PICTURE : meta.PLAYLIST_PICTURE;
	const kind = type === "album" ? "cover" : meta.PICTURE_TYPE || "playlist";
	return {
		title: meta.ALB_TITLE || meta.TITLE || meta.title || "Untitled",
		subtitle: meta.ART_NAME || meta.PARENT_USERNAME || null,
		cover: picture
			? `https://e-cdns-images.dzcdn.net/images/${kind}/${picture}/250x250-000000-80-0-0.jpg`
			: tracks[0]?.cover ?? null,
		tracks,
	};
}
