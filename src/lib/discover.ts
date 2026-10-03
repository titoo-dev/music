/**
 * Discover content for the home page (the Flutter `browse_providers`): the
 * editorial new releases and the album sections of Deezer's explore page.
 */

export interface AlbumSummary {
	id: string;
	title: string;
	artist: string | null;
	cover: string | null;
}

export interface HomeSection {
	title: string;
	albums: AlbumSummary[];
}

type Json = Record<string, unknown>;

const CDN = "https://e-cdns-images.dzcdn.net/images";

const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : typeof v === "number" ? String(v) : null);

/** A Deezer picture md5 → CDN URL (full URLs pass through). */
export function deezerImage(md5: string | null, kind = "cover", size = 500): string | null {
	if (!md5) return null;
	if (md5.startsWith("http")) return md5;
	return `${CDN}/${kind}/${md5}/${size}x${size}-000000-80-0-0.jpg`;
}

/** Any raw album (GW `ALB_*` or public API) → summary. */
export function albumFromRaw(raw: unknown): AlbumSummary | null {
	const a = obj(raw);
	const id = str(a.ALB_ID ?? a.id);
	if (!id) return null;
	return {
		id,
		title: str(a.ALB_TITLE ?? a.title) ?? "Untitled",
		artist: str(a.ART_NAME ?? obj(a.artist).name),
		cover: str(a.cover_big ?? a.cover_xl ?? a.cover_medium) ?? deezerImage(str(a.ALB_PICTURE ?? a.md5_image)),
	};
}

/** `content/new-releases` payload → albums. */
export function parseNewReleases(data: unknown): AlbumSummary[] {
	return list(obj(data).data)
		.map(albumFromRaw)
		.filter((a): a is AlbumSummary => a !== null);
}

/** Album sections of the explore page (`content/home`); other items are skipped. */
export function parseExploreSections(page: unknown): HomeSection[] {
	const out: HomeSection[] = [];
	for (const s of list(obj(page).sections)) {
		const section = obj(s);
		const albums: AlbumSummary[] = [];
		for (const it of list(section.items)) {
			const item = obj(it);
			if (item.type !== "album") continue;
			const data = obj(item.data);
			if ("ALB_ID" in data) {
				const a = albumFromRaw(data);
				if (a) albums.push(a);
				continue;
			}
			const id = str(item.id);
			if (!id) continue;
			const pic = obj(list(item.pictures)[0]);
			albums.push({
				id,
				title: str(item.title) ?? "Untitled",
				artist: str(item.subtitle),
				cover: deezerImage(str(pic.md5), str(pic.type) ?? "cover"),
			});
		}
		const title = str(section.title);
		if (title && albums.length) out.push({ title, albums });
	}
	return out;
}

/** Every pictured item on the explore page, for decorative artwork walls. */
export function explorePictures(page: unknown): string[] {
	const out: string[] = [];
	for (const s of list(obj(page).sections)) {
		for (const it of list(obj(s).items)) {
			const pic = obj(list(obj(it).pictures)[0]);
			const url = deezerImage(str(pic.md5), str(pic.type) ?? "cover");
			if (url) out.push(url);
		}
	}
	return out;
}
