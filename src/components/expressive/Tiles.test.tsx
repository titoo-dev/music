import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickTile } from "./Tiles";

const art = <span data-testid="art" />;

describe("QuickTile", () => {
	it("shows the title and subtitle", () => {
		render(<QuickTile title="L'adieu" subtitle="Garou" art={art} onClick={() => {}} />);
		const tile = screen.getByRole("button", { name: /L'adieu/ });
		expect(tile).toHaveTextContent("L'adieu");
		expect(tile).toHaveTextContent("Garou");
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

	it("keeps the artwork wash visible only for the current track", () => {
		const { rerender } = render(<QuickTile title="Vole" art={art} onClick={() => {}} />);
		expect(screen.getByTestId("quick-tile-wash").className).toContain("opacity-0");
		rerender(<QuickTile title="Vole" art={art} onClick={() => {}} current playing />);
		expect(screen.getByTestId("quick-tile-wash").className).not.toContain(" opacity-0");
		expect(screen.getByText("Vole").className).toContain("text-highlight");
	});
});
