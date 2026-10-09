/* eslint-disable @next/next/no-html-link-for-pages -- plain anchors stand in for any in-app link the loader must catch */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

let pathname = "/library";
let search = "";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useSearchParams: () => new URLSearchParams(search) }));

import { NavProgress } from "./NavProgress";
import { startNavProgress, resetNavProgress } from "@/lib/nav-progress";

function Page() {
	return (
		<>
			<NavProgress />
			<a href="/" onClick={(e) => e.preventDefault()}>
				All music
			</a>
			<a href="/library" onClick={(e) => e.preventDefault()}>
				Library
			</a>
			<a href="https://www.deezer.com/" onClick={(e) => e.preventDefault()}>
				Deezer
			</a>
		</>
	);
}

beforeEach(() => {
	vi.useFakeTimers();
	pathname = "/library";
	search = "";
	window.history.replaceState(null, "", "/library");
	resetNavProgress();
});
afterEach(() => vi.useRealTimers());

const bar = () => screen.queryByRole("progressbar", { name: "Loading page" });

describe("NavProgress (NAV-31)", () => {
	it("shows a bar while a clicked page loads, then clears it when the URL changes (was: no feedback at all)", () => {
		const { rerender } = render(<Page />);
		fireEvent.click(screen.getByText("All music"));
		act(() => vi.advanceTimersByTime(150));
		expect(bar()).toBeInTheDocument();
		pathname = "/";
		rerender(<Page />);
		act(() => vi.advanceTimersByTime(400));
		expect(bar()).toBeNull();
	});

	it("covers a query-only navigation such as /artist?id=1 → ?id=2 (NAV-26)", () => {
		pathname = "/artist";
		search = "id=1";
		window.history.replaceState(null, "", "/artist?id=1");
		const { rerender } = render(<Page />);
		act(() => startNavProgress("/artist?id=2"));
		act(() => vi.advanceTimersByTime(150));
		expect(bar()).toBeInTheDocument();
		search = "id=2";
		rerender(<Page />);
		act(() => vi.advanceTimersByTime(400));
		expect(bar()).toBeNull();
	});

	it("stays hidden for quick navigations", () => {
		const { rerender } = render(<Page />);
		fireEvent.click(screen.getByText("All music"));
		pathname = "/";
		rerender(<Page />);
		act(() => vi.advanceTimersByTime(1000));
		expect(bar()).toBeNull();
	});

	it("ignores new-tab clicks, external links and the page already shown", () => {
		render(<Page />);
		fireEvent.click(screen.getByText("All music"), { ctrlKey: true });
		fireEvent.click(screen.getByText("All music"), { button: 1 });
		fireEvent.click(screen.getByText("Deezer"));
		fireEvent.click(screen.getByText("Library"));
		act(() => vi.advanceTimersByTime(500));
		expect(bar()).toBeNull();
	});

	it("gives up after a while if the navigation never lands", () => {
		render(<Page />);
		fireEvent.click(screen.getByText("All music"));
		act(() => vi.advanceTimersByTime(150));
		expect(bar()).toBeInTheDocument();
		act(() => vi.advanceTimersByTime(20_000));
		act(() => vi.advanceTimersByTime(400));
		expect(bar()).toBeNull();
	});
});
