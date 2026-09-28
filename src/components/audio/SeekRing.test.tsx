import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeekRing, tooltipTranslate } from "./SeekRing";

// A 200×60 pill with 18px corners, placed at the viewport origin.
const W = 200;
const H = 60;
const origRect = Element.prototype.getBoundingClientRect;
const origStyle = window.getComputedStyle;
const offW = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth")!;
const offH = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight")!;
let layout = { w: W, h: H };
let screenRect = { left: 0, top: 0, width: W, height: H };

beforeEach(() => {
	layout = { w: W, h: H };
	screenRect = { left: 0, top: 0, width: W, height: H };
	Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => layout.w });
	Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => layout.h });
	Element.prototype.getBoundingClientRect = function () {
		const r = screenRect;
		return { x: r.left, y: r.top, ...r, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => ({}) } as DOMRect;
	};
	window.getComputedStyle = ((el: Element) => {
		const s = origStyle(el);
		return new Proxy(s, { get: (t, k) => (k === "borderTopLeftRadius" ? "18px" : Reflect.get(t, k)) });
	}) as typeof window.getComputedStyle;
});

afterEach(() => {
	Object.defineProperty(HTMLElement.prototype, "offsetWidth", offW);
	Object.defineProperty(HTMLElement.prototype, "offsetHeight", offH);
	Element.prototype.getBoundingClientRect = origRect;
	window.getComputedStyle = origStyle;
});

function setup(props: Partial<React.ComponentProps<typeof SeekRing>> = {}) {
	const onSeek = vi.fn();
	render(
		<SeekRing currentTime={30} duration={120} buffered={60} loading={false} onSeek={onSeek} {...props}>
			<span>content</span>
		</SeekRing>
	);
	return { onSeek };
}

describe("SeekRing", () => {
	it("wraps the player content and draws the rim", () => {
		setup();
		expect(screen.getByText("content")).toBeInTheDocument();
		expect(screen.getByTestId("seek-ring")).toBeInTheDocument();
		expect(screen.getByTestId("seek-hit").getAttribute("d")).toMatch(/^M/);
	});

	it("does not draw before the pill has a size", () => {
		layout = { w: 0, h: 0 };
		setup();
		expect(screen.queryByTestId("seek-ring")).toBeNull();
	});

	it("exposes an accessible slider with the current position", () => {
		setup();
		const slider = screen.getByRole("slider", { name: "Seek" });
		expect(slider).toHaveAttribute("aria-valuenow", "30");
		expect(slider).toHaveAttribute("aria-valuemax", "120");
		expect(slider).toHaveAttribute("aria-valuetext", "0:30 of 2:00");
	});

	it("keyboard seeks by 5s, 15s with shift, and to the ends", () => {
		const { onSeek } = setup();
		const slider = screen.getByRole("slider");
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		fireEvent.keyDown(slider, { key: "ArrowLeft", shiftKey: true });
		fireEvent.keyDown(slider, { key: "Home" });
		fireEvent.keyDown(slider, { key: "End" });
		fireEvent.keyDown(slider, { key: "ArrowUp" });
		fireEvent.keyDown(slider, { key: "ArrowDown" });
		fireEvent.keyDown(slider, { key: "a" });
		expect(onSeek.mock.calls.map((c) => c[0])).toEqual([35, 15, 0, 120, 35, 25]);
	});

	it("ignores keyboard seeking without a duration", () => {
		const { onSeek } = setup({ duration: 0 });
		fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
		expect(onSeek).not.toHaveBeenCalled();
	});

	it("clicking the rim seeks to that point (right edge ≈ 25%)", () => {
		const { onSeek } = setup();
		fireEvent.pointerDown(screen.getByTestId("seek-hit"), { clientX: 200, clientY: 30, pointerId: 1 });
		expect(onSeek).toHaveBeenCalledTimes(1);
		expect(onSeek.mock.calls[0][0]).toBeCloseTo(30, 0);
	});

	it("dragging keeps seeking until pointer up; hover alone only shows the time", () => {
		const { onSeek } = setup();
		const hit = screen.getByTestId("seek-hit");
		fireEvent.pointerMove(hit, { clientX: 100, clientY: 60 });
		expect(onSeek).not.toHaveBeenCalled();
		expect(screen.getByText("1:00")).toBeInTheDocument(); // bottom-center = 50% of 2:00

		fireEvent.pointerDown(hit, { clientX: 100, clientY: 0, pointerId: 1 });
		fireEvent.pointerMove(hit, { clientX: 100, clientY: 60 });
		fireEvent.pointerUp(hit);
		fireEvent.pointerMove(hit, { clientX: 0, clientY: 30 });
		expect(onSeek).toHaveBeenCalledTimes(2);
		expect(onSeek.mock.calls[1][0]).toBeCloseTo(60, 0);
	});

	it("sizes the rim from layout, not the scaled-in box (was: rim 4% short, hit area covering the More button)", () => {
		// Mounted mid scale-in animation: the screen box is 96% of the layout box.
		screenRect = { left: 4, top: 1.2, width: W * 0.96, height: H * 0.96 };
		const { onSeek } = setup();
		// Rim path spans the full layout width (PAD 10 + 0.5 → right edge at 10.5 + 199).
		expect(screen.getByTestId("seek-hit").getAttribute("d")).toContain("A17.5 17.5 0 0 1 209.5 28");
		// A click on the scaled right edge still maps to 25%.
		fireEvent.pointerDown(screen.getByTestId("seek-hit"), { clientX: 4 + W * 0.96, clientY: 1.2 + (H * 0.96) / 2, pointerId: 1 });
		expect(onSeek.mock.calls[0][0]).toBeCloseTo(30, 0);
	});

	it("does not seek when the duration is unknown", () => {
		const { onSeek } = setup({ duration: 0 });
		fireEvent.pointerDown(screen.getByTestId("seek-hit"), { clientX: 200, clientY: 30, pointerId: 1 });
		expect(onSeek).not.toHaveBeenCalled();
	});

	it("runs the border comet only while loading", () => {
		const { unmount } = render(
			<SeekRing currentTime={0} duration={0} buffered={0} loading onSeek={vi.fn()}>
				<span />
			</SeekRing>
		);
		expect(screen.getByTestId("seek-loading")).toBeInTheDocument();
		expect(screen.getByRole("slider")).toHaveAttribute("aria-busy", "true");
		unmount();
		setup();
		expect(screen.queryByTestId("seek-loading")).toBeNull();
		expect(screen.getByRole("slider")).not.toHaveAttribute("aria-busy");
	});
});

describe("tooltipTranslate", () => {
	const box = { w: 200, h: 60, r: 18 };
	it("pushes the label outward from the nearest edge", () => {
		expect(tooltipTranslate({ x: 100, y: 0 }, box)).toBe("-50% calc(-100% - 12px)");
		expect(tooltipTranslate({ x: 100, y: 60 }, box)).toBe("-50% 12px");
		expect(tooltipTranslate({ x: 0, y: 30 }, box)).toBe("calc(-100% - 12px) -50%");
		expect(tooltipTranslate({ x: 200, y: 30 }, box)).toBe("12px -50%");
	});
});
