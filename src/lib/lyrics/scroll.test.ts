import { describe, it, expect, vi } from "vitest";
import { centerLine } from "./scroll";

function box(top: number, height: number) {
	return { top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON() {} } as DOMRect;
}

/** A scrolling column (top 88, 600 tall) holding one line, inside an overlay that must never move. */
function setup({ scrollTop = 0, lineTop = 500, lineHeight = 60 } = {}) {
	const overlay = document.createElement("div");
	const container = document.createElement("div");
	const line = document.createElement("p");
	container.appendChild(line);
	overlay.appendChild(container);
	container.scrollTop = scrollTop;
	container.getBoundingClientRect = () => box(88, 600);
	line.getBoundingClientRect = () => box(lineTop, lineHeight);
	container.scrollTo = vi.fn() as typeof container.scrollTo;
	line.scrollIntoView = vi.fn();
	overlay.scrollTo = vi.fn() as typeof overlay.scrollTo;
	return { overlay, container, line };
}

describe("centerLine", () => {
	it("scrolls the lyrics column so the line sits in its middle", () => {
		const { container, line } = setup({ scrollTop: 100, lineTop: 500, lineHeight: 60 });
		centerLine(container, line);
		// line centre (530) - column centre (388) + current scroll (100)
		expect(container.scrollTo).toHaveBeenCalledWith({ top: 242, behavior: "smooth" });
	});

	it("never scrolls the overlay around it (was: theatre top bar pushed off-screen near the end of a track)", () => {
		const { overlay, container, line } = setup({ lineTop: 1400 });
		centerLine(container, line);
		expect(line.scrollIntoView).not.toHaveBeenCalled();
		expect(overlay.scrollTo).not.toHaveBeenCalled();
	});

	it("clamps to the top instead of asking for a negative offset", () => {
		const { container, line } = setup({ scrollTop: 0, lineTop: 100, lineHeight: 40 });
		centerLine(container, line, "auto");
		expect(container.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
	});
});
