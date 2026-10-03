export interface LyricLine {
	time: number; // seconds
	text: string;
}

// [mm:ss], [mm:ss.x], [mm:ss.xx], [mm:ss.xxx], [mm:ss:xx], [mmm:ss.xx]
const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const LEADING_TAGS = /^(?:\s*\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\])+/;
// Enhanced-LRC word timings: <mm:ss.xx>
const WORD_TAG = /<\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?>/g;
const OFFSET_TAG = /^\s*\[offset:\s*([+-]?\d+)\s*\]/i;

/**
 * Parse LRC into sorted lines. Handles repeated stamps on one line
 * (`[00:10.00][01:20.00]chorus`), missing / 1–3 digit fractions, the
 * `[offset:±ms]` header, word-level `<mm:ss.xx>` tags and CRLF files.
 */
export function parseLrc(lrc: string): LyricLine[] {
	const lines: LyricLine[] = [];
	let offset = 0;
	for (const raw of lrc.replace(/^﻿/, "").split(/\r?\n/)) {
		const off = raw.match(OFFSET_TAG);
		if (off) {
			offset = parseInt(off[1], 10) / 1000;
			continue;
		}
		const lead = raw.match(LEADING_TAGS);
		if (!lead) continue;
		const text = raw.slice(lead[0].length).replace(WORD_TAG, "").replace(/\s+/g, " ").trim();
		for (const m of lead[0].matchAll(TIME_TAG)) {
			const frac = m[3] ? parseInt(m[3].padEnd(3, "0"), 10) / 1000 : 0;
			const time = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + frac;
			// LRC spec: a positive offset shows lyrics earlier.
			lines.push({ time: Math.max(0, time - offset), text });
		}
	}
	return lines.sort((a, b) => a.time - b.time);
}

/** True when the LRC carries real timings (not an empty file or all-zero stamps). */
export function hasUsableSync(lrc: string | null | undefined): lrc is string {
	if (!lrc) return false;
	const lines = parseLrc(lrc).filter((l) => l.text);
	return lines.length >= 2 && new Set(lines.map((l) => l.time)).size >= 2;
}

export function formatLrcTime(seconds: number): string {
	const cs = Math.round(Math.max(0, seconds) * 100);
	const min = Math.floor(cs / 6000);
	const sec = Math.floor((cs % 6000) / 100);
	return `[${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}]`;
}
