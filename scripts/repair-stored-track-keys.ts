// S1 one-off repair: deletes StoredTrack rows whose storagePath is shared with
// another row (legacy "music/{artist} - {title}.mp3" keys: versions of a song
// and MP3 128 vs 320 copies overwrote each other's object). Rows only — the
// next play of each track re-caches it under tracks/{trackId}/{bitrate}{ext}.
//
//   npx tsx scripts/repair-stored-track-keys.ts            # dry run (default)
//   npx tsx scripts/repair-stored-track-keys.ts --apply    # delete the rows
//
// Uses DATABASE_URL (.env.local, then .env, unless already set).
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
	const apply = process.argv.includes("--apply");
	const { repairSharedKeys } = await import("@/lib/wavelet/storage/key-repair");
	const { prisma } = await import("@/lib/prisma");
	try {
		const { scanned, plan, deleted } = await repairSharedKeys({ apply });
		console.log(`StoredTrack rows scanned: ${scanned}`);
		console.log(`Keys shared by different tracks: ${plan.crossTrackPaths.length}`);
		console.log(`Keys shared by bitrates of one track: ${plan.sameTrackPaths.length}`);
		for (const [path, rows] of plan.shared) {
			const owners = rows.map((r) => `${r.trackId}@${r.bitrate}`).join(", ");
			console.log(`  ${path}  <-  ${owners}`);
		}
		if (apply) {
			console.log(`Deleted ${deleted} row(s). Their tracks re-cache on the next play.`);
		} else {
			console.log(`Dry run: ${plan.rowIds.length} row(s) would be deleted. Re-run with --apply.`);
		}
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
