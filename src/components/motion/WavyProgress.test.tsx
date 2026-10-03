import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WavyProgress, wavyCirclePath } from "./WavyProgress";

describe("wavyCirclePath", () => {
	it("starts at 12 o'clock and closes the ring", () => {
		const d = wavyCirclePath(100, 100, 80, 4, 10, 8);
		expect(d.startsWith("M100.00 20.00")).toBe(true);
		expect(d.endsWith("Z")).toBe(true);
		expect(d.match(/L/g)).toHaveLength(8);
	});

	it("is a plain circle with no amplitude", () => {
		const pts = [...wavyCirclePath(0, 0, 10, 0, 6, 12).matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)];
		for (const [, x, y] of pts) expect(Math.hypot(Number(x), Number(y))).toBeCloseTo(10, 1);
	});
});

describe("WavyProgress", () => {
	it("exposes its value to assistive tech", () => {
		render(<WavyProgress value={0.426} />);
		expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("43");
	});

	it("has no value while indeterminate", () => {
		render(<WavyProgress value={null} />);
		expect(screen.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(false);
	});
});
