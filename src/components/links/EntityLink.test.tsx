import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlbumLink, ArtistLink, ArtistLinks } from "./EntityLink";

describe("ArtistLink", () => {
	it("links to the artist page by id", () => {
		render(<ArtistLink id="27" name="Daft Punk" />);
		expect(screen.getByRole("link", { name: "Daft Punk" })).toHaveAttribute("href", "/artist?id=27");
	});

	it("links by name when the row has no artist id", () => {
		render(<ArtistLink id={null} name="Garou" />);
		expect(screen.getByRole("link", { name: "Garou" })).toHaveAttribute("href", "/artist?name=Garou");
	});

	it("does not trigger the row it sits in, but runs its own onClick", async () => {
		const row = vi.fn();
		const own = vi.fn();
		render(
			<div onClick={row}>
				<ArtistLink id="27" name="Daft Punk" onClick={(e) => (e.preventDefault(), own())} />
			</div>
		);
		await userEvent.click(screen.getByRole("link"));
		expect(own).toHaveBeenCalledOnce();
		expect(row).not.toHaveBeenCalled();
	});
});

it("keeps Enter / Space for itself inside keyboard-activated rows (queue rows jump on Enter)", () => {
	const rowKey = vi.fn();
	render(
		<div role="button" tabIndex={0} onKeyDown={rowKey}>
			<ArtistLink id="27" name="Daft Punk" />
		</div>
	);
	const link = screen.getByRole("link");
	fireEvent.keyDown(link, { key: "Enter" });
	fireEvent.keyDown(link, { key: " " });
	expect(rowKey).not.toHaveBeenCalled();
	fireEvent.keyDown(link, { key: "ArrowDown" });
	expect(rowKey).toHaveBeenCalledOnce();
});

describe("AlbumLink", () => {
	it("links to the album page by id", () => {
		render(<AlbumLink id="302127" title="Discovery" />);
		expect(screen.getByRole("link", { name: "Discovery" })).toHaveAttribute("href", "/album?id=302127");
	});

	it("links by title + artist when the row has no album id", () => {
		render(<AlbumLink id={null} title="Discovery" artist="Daft Punk" />);
		expect(screen.getByRole("link", { name: "Discovery" })).toHaveAttribute("href", "/album?title=Discovery&artist=Daft%20Punk");
	});

	it("renders plain text with neither id nor title", () => {
		render(<AlbumLink id={null} title="" />);
		expect(screen.queryByRole("link")).toBeNull();
	});
});

describe("ArtistLinks", () => {
	it("links every artist of a credit line", () => {
		const { container } = render(<ArtistLinks artists={[{ id: 1, name: "Dua Lipa" }, { name: "DaBaby" }]} />);
		expect(screen.getByRole("link", { name: "Dua Lipa" })).toHaveAttribute("href", "/artist?id=1");
		expect(screen.getByRole("link", { name: "DaBaby" })).toHaveAttribute("href", "/artist?name=DaBaby");
		expect(container).toHaveTextContent("Dua Lipa, DaBaby");
	});
});
