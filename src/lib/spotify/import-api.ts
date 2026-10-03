import { postToServer } from "@/utils/api";
import type { ImportApi } from "./import-run";

const BASE = "playlists/import/spotify";

/** The chunked import's server steps, over the v1 API. */
export const importApi: ImportApi = {
	readPlaylist: (url, signal) => postToServer(`${BASE}/playlist`, { url }, { signal }),
	readTracks: (ids, signal) => postToServer(`${BASE}/tracks`, { ids }, { signal }),
	match: (tracks, signal) => postToServer(`${BASE}/match`, { tracks }, { signal }),
	save: (body, signal) => postToServer(`${BASE}/save`, body, { signal }),
};
