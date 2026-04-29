// Standalone smoke test for the Spotify module — verifies credentials and
// playlist fetch without needing auth or Deezer. Run with:
//   npx tsx scripts/test-spotify-import.ts <playlist-url>
// Defaults to "Today's Top Hits" if no URL is given.

import "dotenv/config";
import { fetchPlaylist, parsePlaylistInput } from "../src/lib/spotify";

const DEFAULT_URL = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";

async function main() {
	const arg = process.argv[2] || DEFAULT_URL;
	const id = parsePlaylistInput(arg);
	if (!id) {
		console.error("Could not parse playlist input:", arg);
		process.exit(1);
	}
	console.log(`Fetching playlist ${id}…`);

	const t0 = Date.now();
	const pl = await fetchPlaylist(id);
	const dt = Date.now() - t0;

	console.log(`\n✓ Fetched "${pl.title}" by ${pl.ownerName}`);
	console.log(`  ${pl.tracks.length} tracks (Spotify reports ${pl.totalTracks}) in ${dt}ms`);
	console.log(`\nFirst 5 tracks:`);
	for (const t of pl.tracks.slice(0, 5)) {
		const isrc = t.isrc ?? "—";
		console.log(
			`  • ${t.title} — ${t.artists.join(", ")} [${isrc}] (${Math.round(t.durationMs / 1000)}s)`
		);
	}

	const withIsrc = pl.tracks.filter((t) => t.isrc).length;
	console.log(`\nISRC coverage: ${withIsrc}/${pl.tracks.length} (${Math.round((withIsrc / pl.tracks.length) * 100)}%)`);
}

main().catch((e) => {
	console.error("✗ Test failed:", e);
	process.exit(1);
});
