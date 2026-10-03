/**
 * Pure maths behind `useVirtualRows` (hooks/useVirtualRows.ts).
 *
 * Virtual lists here stay in normal document flow: only the visible rows
 * (plus overscan) are rendered, and the list container's padding stands in
 * for the rows above and below. Flow layout — rather than absolutely
 * positioned rows — keeps motion's `Reorder` and layout animations working.
 */

/** Below this many rows a list renders whole: virtualizing it buys nothing. */
export const VIRTUALIZE_MIN = 40;

/** Rows rendered beyond each edge of the viewport. */
export const VIRTUAL_OVERSCAN = 8;

export function shouldVirtualize(count: number, min: number = VIRTUALIZE_MIN): boolean {
	return count >= min;
}

/**
 * Container padding that replaces the unrendered rows.
 *
 * `items` are the rendered rows' extents in scroll coordinates (they include
 * `scrollMargin`), `totalSize` the virtualizer's full list size (which
 * already excludes it).
 */
export function listPadding(
	items: ReadonlyArray<{ start: number; end: number }>,
	totalSize: number,
	scrollMargin: number
): { paddingTop: number; paddingBottom: number } {
	if (items.length === 0) return { paddingTop: 0, paddingBottom: totalSize };
	const first = items[0];
	const last = items[items.length - 1];
	return {
		paddingTop: Math.max(0, first.start - scrollMargin),
		paddingBottom: Math.max(0, totalSize - (last.end - scrollMargin)),
	};
}

/**
 * Where a list starts inside its scroll container, in that container's
 * scroll coordinates. `scrollerTop` is 0 and `scrollTop` is `scrollY` for
 * the window.
 */
export function listOffset(listTop: number, scrollerTop: number, scrollTop: number): number {
	return Math.round(listTop - scrollerTop + scrollTop);
}
