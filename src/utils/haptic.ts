/**
 * Tiny wrapper around navigator.vibrate with sensible defaults for mobile
 * confirmation feedback. No-op on unsupported browsers + when the user has
 * disabled vibration via OS settings.
 */
export function haptic(pattern: number | number[] = 8) {
	if (typeof navigator === "undefined") return;
	if (typeof navigator.vibrate !== "function") return;
	try {
		navigator.vibrate(pattern);
	} catch {
		// Fail silently — vibrate may throw inside iframes / secure contexts
	}
}
