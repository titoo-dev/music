import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickTile } from "./Tiles";

const art = <span data-testid="art" />;

describe("QuickTile", () => {
	it("shows the title and subtitle", () => {
		render(<QuickTile title="L'adieu" subtitle="Garou" art={art} onClick={() => {}} />);
		expect(screen.getByRole("button", { name: "L'adieu · Garou" })).toBeInTheDocument();
		expect(screen.getByText("L'adieu")).toBeInTheDocument();
		expect(screen.getByText("Garou")).toBeInTheDocument();
	});

	it("plays on click", async () => {
		const onClick = vi.fn();
		render(<QuickTile title="Destin" art={art} onClick={onClick} />);
		await userEvent.click(screen.getByRole("button", { name: /Destin/ }));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it("renders as a link when it has an href, without the play key", () => {
		render(<QuickTile title="Liked songs" art={art} href="/library" />);
		expect(screen.getByRole("link", { name: /Liked songs/ })).toHaveAttribute("href", "/library");
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("links the subtitle to the artist without playing the tile (was: artist name not clickable)", async () => {
		const onClick = vi.fn();
		render(<QuickTile title="L'adieu" subtitle="Garou" subtitleHref="/artist?name=Garou" art={art} onClick={onClick} />);
		const link = screen.getByRole("link", { name: "Garou" });
		expect(link).toHaveAttribute("href", "/artist?name=Garou");
		expect(screen.getByRole("button", { name: "L'adieu · Garou" })).not.toContainElement(link);
		link.addEventListener("click", (e) => e.preventDefault());
		await userEvent.click(link);
		expect(onClick).not.toHaveBeenCalled();
	});

	it("keeps the artwork wash visible only for the current track", () => {
		const { rerender } = render(<QuickTile title="Vole" art={art} onClick={() => {}} />);
		expect(screen.getByTestId("quick-tile-wash").className).toContain("opacity-0");
		rerender(<QuickTile title="Vole" art={art} onClick={() => {}} current playing />);
		expect(screen.getByTestId("quick-tile-wash").className).not.toContain(" opacity-0");
		expect(screen.getByText("Vole").className).toContain("text-highlight");
	});
});
