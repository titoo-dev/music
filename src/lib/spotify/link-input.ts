import { parseTrackLinks } from "./parse-url";

// The import field's value as one string (what `detectInput` and the import
// read): one committed track link per line, then the line being typed.

export const trackUrl = (id: string) => `https://open.spotify.com/track/${id}`;

export function splitLinkInput(input: string): { ids: string[]; draft: string } {
	const lines = input.split(/\r?\n/);
	const draft = lines.pop() ?? "";
	return { ids: parseTrackLinks(lines.join("\n")), draft };
}

export function joinLinkInput(ids: string[], draft = ""): string {
	return [...ids.map(trackUrl), draft].join("\n");
}

/**
 * Commits the track links in the draft plus `text` (a paste) as items, after
 * the existing ones, without repeats. Null when there is no track link — a
 * playlist link or half-typed text stays in the draft.
 */
export function commitLinks(input: string, text = ""): string | null {
	const { ids, draft } = splitLinkInput(input);
	const found = parseTrackLinks(`${draft}\n${text}`);
	if (!found.length) return null;
	return joinLinkInput([...new Set([...ids, ...found])]);
}

export function removeLink(input: string, id: string): string {
	const { ids, draft } = splitLinkInput(input);
	return joinLinkInput(ids.filter((x) => x !== id), draft);
}
