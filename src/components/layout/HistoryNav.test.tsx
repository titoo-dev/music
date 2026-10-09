import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const back = vi.fn();
const forward = vi.fn();
const replace = vi.fn();
let pathname = "/album";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ back, forward, replace, push: vi.fn() }) }));

import { HistoryNav, parentRoute } from "./HistoryNav";

let installed = true;
let nav: EventTarget & { canGoBack: boolean; canGoForward: boolean };

beforeEach(() => {
	back.mockReset();
	forward.mockReset();
	replace.mockReset();
	pathname = "/album";
	installed = true;
	window.matchMedia = vi.fn().mockImplementation((q: string) => ({
		matches: installed && /display-mode: (standalone|window-controls-overlay)/.test(q),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}));
	nav = Object.assign(new EventTarget(), { canGoBack: true, canGoForward: false });
	(window as unknown as { navigation: unknown }).navigation = nav;
});

afterEach(() => {
	delete (window as unknown as { navigation?: unknown }).navigation;
});

describe("HistoryNav (NAV-29)", () => {
	it("shows Back / Forward in the installed app (was: no way back in the PWA)", () => {
		render(<HistoryNav />);
		expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
	});

	it("stays out of a browser tab, which has its own arrows", () => {
		installed = false;
		render(<HistoryNav />);
		expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
	});

	it("goes back and forward through the history", async () => {
		nav.canGoForward = true;
		render(<HistoryNav />);
		await userEvent.click(screen.getByRole("button", { name: "Back" }));
		expect(back).toHaveBeenCalledOnce();
		await userEvent.click(screen.getByRole("button", { name: "Forward" }));
		expect(forward).toHaveBeenCalledOnce();
	});

	it("follows the history as it changes", () => {
		render(<HistoryNav />);
		expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
		act(() => {
			nav.canGoForward = true;
			nav.dispatchEvent(new Event("currententrychange"));
		});
		expect(screen.getByRole("button", { name: "Forward" })).toBeEnabled();
	});

	it("opened from a link with nothing behind it, Back goes up to the parent page", async () => {
		nav.canGoBack = false;
		pathname = "/my-playlists/abc";
		render(<HistoryNav />);
		await userEvent.click(screen.getByRole("button", { name: "Back" }));
		expect(back).not.toHaveBeenCalled();
		expect(replace).toHaveBeenCalledWith("/my-playlists");
	});

	it("on Home with nothing behind, Back is disabled", () => {
		nav.canGoBack = false;
		pathname = "/";
		render(<HistoryNav />);
		expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
	});
});

describe("parentRoute", () => {
	it("maps each page to the page above it", () => {
		expect(parentRoute("/album")).toBe("/search");
		expect(parentRoute("/artist")).toBe("/search");
		expect(parentRoute("/playlist")).toBe("/search");
		expect(parentRoute("/my-playlists/abc")).toBe("/my-playlists");
		expect(parentRoute("/errors")).toBe("/settings");
		expect(parentRoute("/about")).toBe("/settings");
		expect(parentRoute("/search")).toBe("/");
		expect(parentRoute("/library")).toBe("/");
		expect(parentRoute("/")).toBeNull();
	});
});
