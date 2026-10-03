import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHero } from "./PageHero";

describe("PageHero", () => {
	it("renders its content", () => {
		render(
			<PageHero covers={[]}>
				<h1>Library</h1>
			</PageHero>
		);
		expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
	});

	it("hides the artwork wall until there are covers", () => {
		const { rerender } = render(<PageHero covers={[]}>x</PageHero>);
		expect(screen.queryByTestId("page-hero-wall")).toBeNull();
		rerender(<PageHero covers={["https://e-cdns-images.dzcdn.net/images/cover/a/250x250.jpg"]}>x</PageHero>);
		expect(screen.getByTestId("page-hero-wall")).toBeInTheDocument();
	});

	it("merges the content className", () => {
		render(
			<PageHero covers={[]} className="md:flex-row">
				<span>copy</span>
			</PageHero>
		);
		expect(screen.getByText("copy").parentElement).toHaveClass("md:flex-row", "min-h-[220px]");
	});
});
