import { useCallback, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
	window.addEventListener("scroll", onChange, { passive: true });
	return () => window.removeEventListener("scroll", onChange);
}

/** True once the window has scrolled past `threshold` px (always false on the server). */
export function useScrolled(threshold = 4) {
	const getSnapshot = useCallback(() => window.scrollY > threshold, [threshold]);
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
