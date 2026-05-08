import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// jsdom-only cleanup. Skipped under node env (API/store tests).
if (typeof window !== "undefined") {
	const { cleanup } = await import("@testing-library/react");
	afterEach(() => cleanup());

	// Stub localStorage so Zustand `persist` doesn't crash if jsdom resets it.
	if (!window.localStorage) {
		const store = new Map<string, string>();
		Object.defineProperty(window, "localStorage", {
			value: {
				getItem: (k: string) => store.get(k) ?? null,
				setItem: (k: string, v: string) => store.set(k, v),
				removeItem: (k: string) => store.delete(k),
				clear: () => store.clear(),
				key: (i: number) => Array.from(store.keys())[i] ?? null,
				get length() {
					return store.size;
				},
			},
		});
	}
}
