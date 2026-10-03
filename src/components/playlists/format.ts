// Pure formatting helpers shared by the Library and Playlists pages (the web
// side of the Flutter client's `shared/format.dart`).

/** "1 track" / "12 tracks". */
export function plural(n: number, one: string, many?: string): string {
	return `${n} ${n === 1 ? one : (many ?? `${one}s`)}`;
}

/** Total listening time: "3 h 20 min", "42 min" (never "0 min"); "" for nothing. */
export function formatTotal(seconds: number): string {
	if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) return "";
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (h > 0) return `${h} h ${m} min`;
	return `${Math.min(Math.max(m, 1), 59)} min`;
}

/** "Just now", "5m ago", "3h ago", "2d ago", then "Mar 4". "" when unknown. */
export function formatRelative(iso: string | null | undefined, now: number = Date.now()): string {
	if (!iso) return "";
	const t = new Date(iso).getTime();
	if (Number.isNaN(t)) return "";
	const min = Math.floor(Math.max(0, now - t) / 60_000);
	if (min < 1) return "Just now";
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	if (day < 7) return `${day}d ago`;
	return new Date(t).toLocaleDateString("en", { month: "short", day: "numeric" });
}

/** The relative time folded into a sentence: "2h ago" stays, "Just now" → "just now". */
export function relativePhrase(iso: string | null | undefined, now?: number): string {
	const r = formatRelative(iso, now);
	return r === "Just now" ? "just now" : r;
}

export type RecentBucket = "Today" | "Yesterday" | "This week" | "This month" | "Earlier";

/** Calendar-day bucket of a play, relative to [now] (local time). */
export function recentBucket(iso: string | null | undefined, now: Date = new Date()): RecentBucket {
	if (!iso) return "Earlier";
	const t = new Date(iso);
	if (Number.isNaN(t.getTime())) return "Earlier";
	const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	const days = Math.round((startOf(now) - startOf(t)) / 86_400_000);
	if (days <= 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return "This week";
	if (days < 30) return "This month";
	return "Earlier";
}

export interface Group<T> {
	label: RecentBucket;
	items: { item: T; index: number }[];
}

/**
 * Groups [items] (newest first) into Today / Yesterday / … buckets, keeping
 * the original order and each item's index in the full list.
 */
export function groupByDay<T>(items: T[], dateOf: (item: T) => string | null | undefined, now: Date = new Date()): Group<T>[] {
	const groups: Group<T>[] = [];
	items.forEach((item, index) => {
		const label = recentBucket(dateOf(item), now);
		let g = groups.find((x) => x.label === label);
		if (!g) {
			g = { label, items: [] };
			groups.push(g);
		}
		g.items.push({ item, index });
	});
	return groups;
}

/** Unique, non-empty covers in order, capped at [max]. */
export function uniqueCovers(lists: (string | null | undefined)[][], max: number): string[] {
	const out = new Set<string>();
	for (const list of lists) {
		for (const c of list) {
			if (c) out.add(c);
			if (out.size >= max) return [...out];
		}
	}
	return [...out];
}
