import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WaveSeek } from "./WaveSeek";

const W = 300;
const offW = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth")!;
const origRect = Element.prototype.getBoundingClientRect;
let width = W;

beforeEach(() => {
	width = W;
	Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => width });
	Element.prototype.getBoundingClientRect = function () {
		return { x: 0, y: 0, left: 0, top: 0, width, height: 28, right: width, bottom: 28, toJSON: () => ({}) } as DOMRect;
	};
});

afterEach(() => {
	Object.defineProperty(HTMLElement.prototype, "offsetWidth", offW);
	Element.prototype.getBoundingClientRect = origRect;
});

function setup(props: Partial<React.ComponentProps<typeof WaveSeek>> = {}) {
	const onSeek = vi.fn();
	render(<WaveSeek currentTime={30} duration={120} buffered={60} playing={false} onSeek={onSeek} {...props} />);
	return { onSeek, slider: screen.getByRole("slider", { name: "Seek" }) };
}

describe("WaveSeek", () => {
	it("exposes an accessible slider and elapsed / remaining labels", () => {
		const { slider } = setup();
		expect(slider).toHaveAttribute("aria-valuenow", "30");
		expect(slider).toHaveAttribute("aria-valuemax", "120");
		expect(slider).toHaveAttribute("aria-valuetext", "0:30 of 2:00");
		expect(screen.getByText("0:30")).toBeInTheDocument();
		expect(screen.getByText("-1:30")).toBeInTheDocument();
	});

	it("draws the played part up to the playhead and the buffered part beyond it", () => {
		setup();
		// 30/120 of 300px = 75px; flat while paused.
		expect(screen.getByTestId("wave-played").getAttribute("d")).toMatch(/^M0 14 .* L75 14$/);
		expect(screen.getByTestId("wave-buffered")).toHaveAttribute("x2", "150");
	});

	it("hides the buffered segment once the playhead is past it", () => {
		setup({ buffered: 10 });
		expect(screen.queryByTestId("wave-buffered")).toBeNull();
	});

	it("only ripples while playing", () => {
		const { slider } = setup({ playing: true });
		expect(slider).toHaveAttribute("data-playing", "true");
	});

	it("stays flat while paused", () => {
		const { slider } = setup();
		expect(slider).not.toHaveAttribute("data-playing");
	});

	it("does not draw before it has a width", () => {
		width = 0;
		setup();
		expect(screen.queryByTestId("wave-played")).toBeNull();
	});

	it("previews while dragging and seeks once on release", () => {
		const { onSeek, slider } = setup({ playing: true });
		fireEvent.pointerDown(slider, { clientX: 150, pointerId: 1 });
		expect(slider).not.toHaveAttribute("data-playing"); // wave calms down under the finger
		fireEvent.pointerMove(slider, { clientX: 225 });
		expect(screen.getByText("1:30")).toBeInTheDocument(); // preview label follows the finger
		expect(onSeek).not.toHaveBeenCalled();
		fireEvent.pointerUp(slider, { clientX: 225 });
		expect(onSeek).toHaveBeenCalledTimes(1);
		expect(onSeek.mock.calls[0][0]).toBeCloseTo(90);
	});

	it("clamps drags outside the bar and ignores stray moves / ups", () => {
		const { onSeek, slider } = setup();
		fireEvent.pointerMove(slider, { clientX: 100 });
		fireEvent.pointerUp(slider, { clientX: 100 });
		expect(onSeek).not.toHaveBeenCalled();
		fireEvent.pointerDown(slider, { clientX: -40, pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: -40 });
		fireEvent.pointerDown(slider, { clientX: 900, pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: 900 });
		expect(onSeek.mock.calls.map((c) => c[0])).toEqual([0, 120]);
	});

	it("cancelling a drag does not seek", () => {
		const { onSeek, slider } = setup();
		fireEvent.pointerDown(slider, { clientX: 150, pointerId: 1 });
		fireEvent.pointerCancel(slider);
		fireEvent.pointerUp(slider, { clientX: 150 });
		expect(onSeek).not.toHaveBeenCalled();
	});

	it("keyboard seeks by 5s, 15s with shift, and to the ends", () => {
		const { onSeek, slider } = setup();
		for (const [key, shiftKey] of [
			["ArrowRight", false],
			["ArrowLeft", true],
			["Home", false],
			["End", false],
			["ArrowUp", false],
			["ArrowDown", false],
			["a", false],
		] as const) {
			fireEvent.keyDown(slider, { key, shiftKey });
		}
		expect(onSeek.mock.calls.map((c) => c[0])).toEqual([35, 15, 0, 120, 35, 25]);
	});

	it("does nothing without a duration", () => {
		const { onSeek, slider } = setup({ duration: 0, currentTime: 0 });
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		fireEvent.pointerDown(slider, { clientX: 150, pointerId: 1 });
		fireEvent.pointerUp(slider, { clientX: 150 });
		expect(onSeek).not.toHaveBeenCalled();
	});

	it("stretches the playhead on hover", () => {
		const { slider } = setup();
		fireEvent.pointerEnter(slider);
		fireEvent.pointerLeave(slider);
		expect(slider).toBeInTheDocument();
	});

	it("draws around the middle of a custom height and can drop the labels and thumb (mini player line)", () => {
		setup({ height: 10, showTimes: false, thumb: false });
		expect(screen.getByTestId("wave-played").getAttribute("d")).toMatch(/^M0 5 .* L75 5$/);
		expect(screen.queryByText("0:30")).toBeNull();
		expect(screen.queryByText("-1:30")).toBeNull();
		expect(screen.getByTestId("wave-seek").querySelector("rect")).toBeNull();
	});

	it("paints the played wave in primary with the primary tone", () => {
		setup({ tone: "primary" });
		expect(screen.getByTestId("wave-played")).toHaveClass("text-primary");
		expect(screen.getByTestId("wave-buffered")).toHaveClass("text-primary/35");
	});

	it("highlights the elapsed label while dragging", () => {
		const { slider } = setup();
		fireEvent.pointerDown(slider, { clientX: 225, pointerId: 1 });
		expect(screen.getByText("1:30")).toHaveClass("text-primary");
		fireEvent.pointerUp(slider, { clientX: 225, pointerId: 1 });
	});
});
