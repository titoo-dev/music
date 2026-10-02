import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeekBar } from "./SeekBar";

// A 200px-wide track at the viewport origin: clientX 50 → 25%.
const origRect = Element.prototype.getBoundingClientRect;
let width = 200;

beforeEach(() => {
	width = 200;
	Element.prototype.getBoundingClientRect = function () {
		return { x: 0, y: 0, left: 0, top: 0, width, height: 4, right: width, bottom: 4, toJSON: () => ({}) } as DOMRect;
	};
});

afterEach(() => {
	Element.prototype.getBoundingClientRect = origRect;
});

function setup(props: Partial<React.ComponentProps<typeof SeekBar>> = {}) {
	const onSeek = vi.fn();
	render(<SeekBar currentTime={30} duration={120} buffered={60} onSeek={onSeek} {...props} />);
	return { onSeek, slider: screen.getByRole("slider", { name: "Seek" }) };
}

describe("SeekBar", () => {
	it("exposes an accessible slider with the current position", () => {
		const { slider } = setup();
		expect(slider).toHaveAttribute("aria-valuenow", "30");
		expect(slider).toHaveAttribute("aria-valuemax", "120");
		expect(slider).toHaveAttribute("aria-valuetext", "0:30 of 2:00");
		expect(slider).toHaveAttribute("tabindex", "0");
	});

	it("draws progress and buffer as fractions of the duration", () => {
		setup();
		expect(screen.getByTestId("seek-progress").style.width).toBe("25%");
		expect(screen.getByTestId("seek-buffered").style.width).toBe("50%");
	});

	it("clamps progress and buffer to the track", () => {
		setup({ currentTime: 500, buffered: -3 });
		expect(screen.getByTestId("seek-progress").style.width).toBe("100%");
		expect(screen.getByTestId("seek-buffered").style.width).toBe("0%");
	});

	it("click seeks to the pointer position", () => {
		const { onSeek, slider } = setup();
		fireEvent.pointerDown(slider, { clientX: 50, pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: 50, pointerId: 1 });
		expect(onSeek).toHaveBeenCalledExactlyOnceWith(30);
	});

	it("dragging previews the position and seeks once on release (was: a seek per pointermove restarted the live stream)", () => {
		const { onSeek, slider } = setup();
		fireEvent.pointerDown(slider, { clientX: 20, pointerId: 1 });
		fireEvent.pointerMove(slider, { clientX: 100, pointerId: 1 });
		fireEvent.pointerMove(slider, { clientX: 150, pointerId: 1 });
		expect(onSeek).not.toHaveBeenCalled();
		expect(screen.getByTestId("seek-progress").style.width).toBe("75%");
		expect(screen.getByTestId("seek-bubble")).toHaveTextContent("1:30");
		expect(slider).toHaveAttribute("aria-valuenow", "90");

		fireEvent.pointerUp(slider, { clientX: 160, pointerId: 1 });
		expect(onSeek).toHaveBeenCalledExactlyOnceWith(96);
	});

	it("clamps drags past either end", () => {
		const { onSeek, slider } = setup();
		fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: 999, pointerId: 1 });
		fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: -50, pointerId: 1 });
		expect(onSeek.mock.calls).toEqual([[120], [0]]);
	});

	it("a cancelled drag does not seek", () => {
		const { onSeek, slider } = setup();
		fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
		fireEvent.pointerCancel(slider, { pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: 100, pointerId: 1 });
		expect(onSeek).not.toHaveBeenCalled();
		expect(screen.getByTestId("seek-progress").style.width).toBe("25%");
	});

	it("ignores secondary mouse buttons", () => {
		const { onSeek, slider } = setup();
		fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1, button: 2 });
		fireEvent.pointerUp(slider, { clientX: 100, pointerId: 1 });
		expect(onSeek).not.toHaveBeenCalled();
	});

	it("mouse hover shows the time under the pointer without seeking", () => {
		const { onSeek, slider } = setup();
		fireEvent.pointerMove(slider, { clientX: 100, pointerType: "mouse" });
		expect(screen.getByTestId("seek-bubble")).toHaveTextContent("1:00");
		expect(screen.getByTestId("seek-hover").style.width).toBe("50%");
		fireEvent.pointerLeave(slider);
		expect(screen.queryByTestId("seek-hover")).toBeNull();
		expect(onSeek).not.toHaveBeenCalled();
	});

	it("touch moves without a press don't open the hover preview", () => {
		const { slider } = setup();
		fireEvent.pointerMove(slider, { clientX: 100, pointerType: "touch" });
		expect(screen.queryByTestId("seek-hover")).toBeNull();
	});

	it("keyboard seeks by 5s, 15s with shift, and to the ends", () => {
		const { onSeek, slider } = setup();
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		fireEvent.keyDown(slider, { key: "ArrowLeft" });
		fireEvent.keyDown(slider, { key: "ArrowUp", shiftKey: true });
		fireEvent.keyDown(slider, { key: "ArrowDown", shiftKey: true });
		fireEvent.keyDown(slider, { key: "Home" });
		fireEvent.keyDown(slider, { key: "End" });
		fireEvent.keyDown(slider, { key: "a" });
		expect(onSeek.mock.calls).toEqual([[35], [25], [45], [15], [0], [120]]);
	});

	it("keyboard seeks stay inside the track", () => {
		const { onSeek, slider } = setup({ currentTime: 118 });
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		expect(onSeek).toHaveBeenLastCalledWith(120);
	});

	it("is inert without a duration", () => {
		const { onSeek, slider } = setup({ duration: 0 });
		expect(slider).toHaveAttribute("aria-disabled", "true");
		expect(slider).toHaveAttribute("tabindex", "-1");
		fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: 100, pointerId: 1 });
		fireEvent.keyDown(slider, { key: "End" });
		expect(onSeek).not.toHaveBeenCalled();
		expect(screen.getByTestId("seek-progress").style.width).toBe("0%");
	});

	it("seeks to 0 when the track has no width yet", () => {
		width = 0;
		const { onSeek, slider } = setup();
		fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: 100, pointerId: 1 });
		expect(onSeek).toHaveBeenCalledExactlyOnceWith(0);
	});

	it("shows elapsed and total times when asked", () => {
		setup({ showTimes: true, currentTime: 75 });
		expect(screen.getByTestId("seek-elapsed")).toHaveTextContent("1:15");
		expect(screen.getByTestId("seek-total")).toHaveTextContent("2:00");
	});

	it("runs the loading sheen only while loading", () => {
		const { rerender } = render(<SeekBar currentTime={0} duration={120} buffered={0} onSeek={vi.fn()} loading />);
		expect(screen.getByTestId("seek-loading")).toBeInTheDocument();
		expect(screen.getByRole("slider")).toHaveAttribute("aria-busy", "true");
		rerender(<SeekBar currentTime={0} duration={120} buffered={0} onSeek={vi.fn()} />);
		expect(screen.getByRole("slider")).not.toHaveAttribute("aria-busy");
	});
});
