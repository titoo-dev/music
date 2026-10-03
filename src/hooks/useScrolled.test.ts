import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useScrolled } from "./useScrolled";

function scrollTo(y: number) {
	act(() => {
		Object.defineProperty(window, "scrollY", { value: y, configurable: true });
		window.dispatchEvent(new Event("scroll"));
	});
}

beforeEach(() => {
	Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

describe("useScrolled", () => {
	it("is false at the top of the page", () => {
		const { result } = renderHook(() => useScrolled());
		expect(result.current).toBe(false);
	});

	it("turns true past the threshold and back to false at the top", () => {
		const { result } = renderHook(() => useScrolled(4));
		scrollTo(4);
		expect(result.current).toBe(false);
		scrollTo(5);
		expect(result.current).toBe(true);
		scrollTo(0);
		expect(result.current).toBe(false);
	});

	it("is already true when mounted on a scrolled page", () => {
		Object.defineProperty(window, "scrollY", { value: 300, configurable: true });
		const { result } = renderHook(() => useScrolled());
		expect(result.current).toBe(true);
	});
});
