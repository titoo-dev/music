// Live smoke test (needs WAVELET_SERVICE_ARL): login, resolve, decrypt one track.
// npx tsx scripts/smoke-deezer.ts <trackId> <bitrate 1|3|9>
import "dotenv/config";
import { Deezer, utils } from "@/lib/deezer";
import Track from "@/lib/wavelet/types/Track";
import { getPreferredBitrate } from "@/lib/wavelet/utils/getPreferredBitrate";
import { streamTrackToReadable } from "@/lib/wavelet/decryption";
import { formatsName } from "@/lib/wavelet/types/Track";

async function main() {
	const dz = new Deezer();
	const ok = await dz.loginViaArl(process.env.WAVELET_SERVICE_ARL!);
	console.log("login", ok, "hq", dz.currentUser?.can_stream_hq, "lossless", dz.currentUser?.can_stream_lossless);
	const id = process.argv[2] || "3135556";
	const gw = await dz.gw.get_track_with_fallback(id);
	const track = new Track();
	track.parseEssentialData(utils.mapGwTrackToDeezer(gw));
	const br = await getPreferredBitrate(dz, track, Number(process.argv[3] || 3), true, false, "", null);
	track.bitrate = br as any;
	track.downloadURL = track.urls[formatsName[br]];
	console.log("bitrate", br, "host", new URL(track.downloadURL).host);
	const { readable, contentLengthPromise } = streamTrackToReadable(track);
	let n = 0; let head: Buffer | null = null;
	for await (const c of readable) { if (!head) head = c as Buffer; n += (c as Buffer).length; }
	console.log("upstream len", await contentLengthPromise, "decoded", n, "head", head!.subarray(0, 4).toString("hex"));
}
main().catch((e) => { console.error("FAIL", e?.name, e?.code, e?.message); process.exit(1); });
