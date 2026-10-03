import { describe, it, expect } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { CoverImage } from "./cover-image";

const DZ = (id: string) => `https://cdn-images.dzcdn.net/images/cover/${id}/250x250-000000-80-0-0.jpg`;
const imgs = (c: HTMLElement) => Array.from(c.querySelectorAll("img"));

describe("CoverImage", () => {
	it("requests the cover at its rendered size (was: every thumbnail fetched at 1000x1000)", () => {
		const { container } = render(<CoverImage src={DZ("a")} size={48} />);
		const [img] = imgs(container);
		expect(img.getAttribute("src")).toContain("/56x56-");
		expect(img.getAttribute("loading")).toBe("lazy");
	});

	it("shows a tiny blurred stand-in for large covers, then fades the real one in", () => {
		const { container } = render(<CoverImage src={DZ("b")} size={400} />);
		const [placeholder, full] = imgs(container);
		expect(placeholder.getAttribute("src")).toContain("/32x32-");
		expect(placeholder).toHaveAttribute("aria-hidden");
		expect(full.getAttribute("src")).toContain("/500x500-");
		expect(full.className).toContain("opacity-0");

		fireEvent.load(full);
		expect(full.className).toContain("opacity-100");
		expect(placeholder.className).toContain("opacity-0");
	});

	it("skips the placeholder for small covers", () => {
		const { container } = render(<CoverImage src={DZ("c")} size={40} />);
		expect(imgs(container)).toHaveLength(1);
	});

	it("shows an already-decoded cover sharp at once on re-mount (virtualized rows)", () => {
		const first = render(<CoverImage src={DZ("d")} size={400} />);
		fireEvent.load(imgs(first.container)[1]);
		first.unmount();

		const { container } = render(<CoverImage src={DZ("d")} size={400} />);
		const all = imgs(container);
		expect(all).toHaveLength(1);
		expect(all[0].className).toContain("opacity-100");
	});

	it("loads non-Deezer URLs as is", () => {
		const { container } = render(<CoverImage src="https://i.scdn.co/image/x" size={400} />);
		const all = imgs(container);
		expect(all).toHaveLength(1);
		expect(all[0].getAttribute("src")).toBe("https://i.scdn.co/image/x");
	});

	it("renders nothing to fetch until the box has a size", () => {
		const { container } = render(<CoverImage src={DZ("e")} />);
		expect(imgs(container)).toHaveLength(0);
	});

	it("falls back to the music glyph on a missing or broken image", () => {
		const empty = render(<CoverImage src={null} />);
		expect(imgs(empty.container)).toHaveLength(0);
		expect(empty.container.querySelector("svg")).not.toBeNull();

		const { container } = render(<CoverImage src={DZ("f")} size={40} />);
		fireEvent.error(imgs(container)[0]);
		expect(imgs(container)).toHaveLength(0);
		expect(container.querySelector("svg")).not.toBeNull();
	});
});
