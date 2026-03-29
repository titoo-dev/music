import BasePlugin from "@/lib/deemix/plugins/base";
import { type Deezer } from "@/lib/deezer";
import got from "got";
import { Downloader } from "./downloader";
import { LinkNotRecognized, LinkNotSupported } from "./errors";
import { generateTrackItem } from "./download-objects/generateTrackItem";
import { generateArtistTopItem } from "./download-objects/generateArtistTopItem";
import {
	generateArtistItem,
	generatePlaylistItem,
} from "./download-objects/generatePlaylistItem";
import { generateAlbumItem } from "./download-objects/generateAlbumItem";
import type { DownloadObject } from "./download-objects/DownloadObject";
import type { Listener } from "./types/listener";

async function parseLink(link: string) {
	if (link.includes("deezer.page.link")) {
		const response = await got.get(link, {
			https: { rejectUnauthorized: false },
		}); // Resolve URL shortner
		link = response.url;
	}
	// Remove extra stuff
	if (link.includes("?")) link = link.slice(0, link.indexOf("?"));
	if (link.includes("&")) link = link.slice(0, link.indexOf("&"));
	if (link.endsWith("/")) link = link.slice(0, -1); // Remove last slash if present

	let link_type: string | undefined;
	let link_id: string | undefined;

	if (!link.includes("deezer")) return [link, link_type, link_id]; // return if not a deezer link

	let match: RegExpMatchArray | null;
	if ((match = link.match(/\/track\/(.+)/))) {
		link_type = "track";
		link_id = match[1];
	} else if ((match = link.match(/\/playlist\/(\d+)/))) {
		link_type = "playlist";
		link_id = match[1];
	} else if ((match = link.match(/\/album\/(.+)/))) {
		link_type = "album";
		link_id = match[1];
	} else if ((match = link.match(/\/artist\/(\d+)\/top_track/))) {
		link_type = "artist_top";
		link_id = match[1];
	} else if ((match = link.match(/\/artist\/(\d+)\/(.+)/))) {
		link_type = `artist_${match[2]}`;
		link_id = match[1];
	} else if ((match = link.match(/\/artist\/(\d+)/))) {
		link_type = "artist";
		link_id = match[1];
	}

	return [link, link_type, link_id];
}

async function generateDownloadObject(
	dz: Deezer,
	link: string,
	bitrate: number,
	plugins: Record<string, BasePlugin> = {},
	listener: Listener
): Promise<DownloadObject | DownloadObject[]> {
	let link_type: string | null = null;
	let link_id: string | null = null;

	[link, link_type, link_id] = await parseLink(link);

	// Link is not deezer - try to find a plugin that can handle it
	if (!link_type || !link_id) {
		for (const pluginName in plugins) {
			const downloadObject = await plugins[pluginName].generateDownloadObject(
				dz,
				link,
				bitrate,
				listener
			);

			if (downloadObject) return downloadObject;
		}

		throw new LinkNotRecognized(link);
	}

	if (link_type === "track") return generateTrackItem(dz, link_id, bitrate);
	if (link_type === "album") return generateAlbumItem(dz, link_id, bitrate);
	if (link_type === "playlist")
		return generatePlaylistItem(dz, link_id, bitrate);
	if (link_type === "artist")
		return generateArtistItem(dz, link_id, bitrate, listener, "all");
	if (link_type === "artist_top")
		return generateArtistTopItem(dz, link_id, bitrate);
	if (link_type.startsWith("artist_")) {
		const tab = link_type.slice(7);
		return generateArtistItem(dz, link_id, bitrate, listener, tab);
	}
	throw new LinkNotSupported(link);
}

const itemgen = {
	generateTrackItem,
	generateAlbumItem,
	generatePlaylistItem,
	generateArtistItem,
	generateArtistTopItem,
};

export * as decryption from "./decryption";
export * from "./plugins/index";
export * from "./settings";
export * as tagger from "./tagger";
export * from "./types/index";
export * as utils from "./utils/index";
export * from "./download-objects/index";
export * from "./storage/index";
export * from "./config-store/index";

// Exporting the organized objects
export { Downloader, generateDownloadObject, itemgen, parseLink };
