import { decode } from "html-entities";
import { formatLrcTime } from "./lrc";

// Server-only (html-entities is too heavy for the client bundle).

interface DeezerSyncLine {
	lrc_timestamp?: string;
	milliseconds?: string | number;
	line?: string;
}

/** Deezer GW `LYRICS_SYNC_JSON` → LRC text (HTML entities decoded). */
export function deezerSyncToLrc(sync: unknown): string | null {
	if (!Array.isArray(sync)) return null;
	const out: string[] = [];
	for (const l of sync as DeezerSyncLine[]) {
		if (!l || typeof l !== "object") continue;
		const ms = Number(l.milliseconds);
		const stamp = Number.isFinite(ms) && l.milliseconds !== "" && l.milliseconds != null
			? formatLrcTime(ms / 1000)
			: l.lrc_timestamp;
		if (!stamp) continue;
		out.push(`${stamp}${decode(l.line ?? "")}`);
	}
	return out.length ? out.join("\n") : null;
}
