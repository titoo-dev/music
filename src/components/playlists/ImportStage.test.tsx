import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchRing } from "./ImportStage";

describe("MatchRing", () => {
	it("hides the arc when nothing matched (was: a lone red dot at 12 o'clock)", () => {
		render(<MatchRing matched={0} total={12} failed />);
		const arc = screen.getByTestId("match-arc");
		expect(arc.getAttribute("opacity") ?? arc.style.opacity).toBe("0");
		expect(screen.getByText("of 12")).toBeInTheDocument();
	});
});
