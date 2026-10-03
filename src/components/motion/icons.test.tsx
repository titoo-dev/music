import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LogoMark } from "./icons";

describe("LogoMark", () => {
	it("gives each instance its own gradient ids (was: second logo on a page rendered blank)", () => {
		const { container } = render(
			<>
				<LogoMark />
				<LogoMark />
			</>
		);
		const ids = Array.from(container.querySelectorAll("defs > *")).map((g) => g.id);
		expect(ids).toHaveLength(4);
		expect(new Set(ids).size).toBe(4);
		// Every fill / stroke reference resolves to a gradient inside the same svg.
		for (const svg of container.querySelectorAll("svg")) {
			const own = new Set(Array.from(svg.querySelectorAll("defs > *")).map((g) => g.id));
			const refs = Array.from(svg.querySelectorAll("*"))
				.flatMap((el) => [el.getAttribute("fill"), el.getAttribute("stroke")])
				.filter((v): v is string => !!v?.startsWith("url(#"))
				.map((v) => v.slice(5, -1));
			expect(refs.length).toBeGreaterThan(0);
			for (const r of refs) expect(own.has(r)).toBe(true);
		}
	});
});
