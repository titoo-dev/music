"use client";

import { useRef, useCallback } from "react";

interface LongPressOptions {
	ms?: number;
	vibrate?: number;
}

export function useLongPress(callback: () => void, options?: LongPressOptions) {
	const { ms = 500, vibrate = 50 } = options || {};
	const timerRef = useRef<number>(undefined);
	const isLongPressRef = useRef(false);
	const startPos = useRef({ x: 0, y: 0 });

	const start = useCallback(
		(e: React.TouchEvent) => {
			startPos.current = {
				x: e.touches[0].clientX,
				y: e.touches[0].clientY,
			};
			isLongPressRef.current = false;
			timerRef.current = window.setTimeout(() => {
				isLongPressRef.current = true;
				if (vibrate && navigator.vibrate) navigator.vibrate(vibrate);
				callback();
			}, ms);
		},
		[callback, ms, vibrate]
	);

	const move = useCallback((e: React.TouchEvent) => {
		const dx = e.touches[0].clientX - startPos.current.x;
		const dy = e.touches[0].clientY - startPos.current.y;
		if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
			clearTimeout(timerRef.current);
		}
	}, []);

	const end = useCallback(() => {
		clearTimeout(timerRef.current);
	}, []);

	const contextMenu = useCallback((e: React.MouseEvent) => {
		if (isLongPressRef.current) {
			e.preventDefault();
		}
	}, []);

	return {
		onTouchStart: start,
		onTouchMove: move,
		onTouchEnd: end,
		onContextMenu: contextMenu,
	};
}

/**
 * Non-hook version for use inside .map() or other non-hook contexts.
 * Creates fresh handler closures — safe to call on every render.
 */
export function longPressHandlers(callback: () => void, ms = 500) {
	let timer: number | undefined;
	let isLP = false;
	let sx = 0,
		sy = 0;

	return {
		onTouchStart: (e: React.TouchEvent) => {
			sx = e.touches[0].clientX;
			sy = e.touches[0].clientY;
			isLP = false;
			timer = window.setTimeout(() => {
				isLP = true;
				if (navigator.vibrate) navigator.vibrate(50);
				callback();
			}, ms);
		},
		onTouchMove: (e: React.TouchEvent) => {
			if (
				Math.abs(e.touches[0].clientX - sx) > 10 ||
				Math.abs(e.touches[0].clientY - sy) > 10
			)
				clearTimeout(timer);
		},
		onTouchEnd: () => clearTimeout(timer),
		onContextMenu: (e: React.MouseEvent) => {
			if (isLP) e.preventDefault();
		},
	};
}
