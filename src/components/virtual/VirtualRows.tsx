"use client";

import { useCallback, type ReactNode } from "react";
import { useWindowRows, type Key } from "@/hooks/useVirtualRows";
import { cn } from "@/lib/utils";

interface VirtualRowsProps<T> {
	items: readonly T[];
	getKey: (item: T, index: number) => Key;
	render: (item: T, index: number) => ReactNode;
	/** Estimated height of a row in px (TrackRow ≈ 60). */
	estimateSize?: number | ((item: T, index: number) => number);
	/** Space between rows in px; applied as `space-y` would. */
	gap?: number;
	className?: string;
	/** Rows from which the list virtualizes; shorter lists render whole. */
	min?: number;
}

/**
 * A page-scrolling list that only mounts the rows near the viewport once it
 * grows past `min` rows. Each row is wrapped in a `flow-root` div so margins
 * inside it count toward its measured height.
 */
export function VirtualRows<T>({ items, getKey, render, estimateSize = 60, gap = 0, className, min }: VirtualRowsProps<T>) {
	const estimate = useCallback(
		(index: number) => (typeof estimateSize === "number" ? estimateSize : estimateSize(items[index], index)),
		[estimateSize, items]
	);
	const itemKey = useCallback((index: number) => getKey(items[index], index), [getKey, items]);
	const { listRef, rows, measureRef, style } = useWindowRows({ count: items.length, estimateSize: estimate, getItemKey: itemKey, gap, min });

	return (
		<div ref={listRef} className={cn("flex flex-col", className)} style={{ ...style, rowGap: gap }}>
			{rows.map(({ index, key }) => (
				<div key={key} data-index={index} ref={measureRef} className="flow-root">
					{render(items[index], index)}
				</div>
			))}
		</div>
	);
}
