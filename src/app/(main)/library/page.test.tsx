import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let search = "tab=albums";
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	useSearchParams: () => new URLSearchParams(search),
	usePathname: () => "/library",
}));
vi.mock("@/utils/api", () => ({
	fetchData: vi.fn(async () => ({ items: [] })),
	postToServer: vi.fn(),
}));

import LibraryPage from "./page";
import { useAuthStore } from "@/stores/useAuthStore";

beforeEach(() => {
	search = "tab=albums";
	useAuthStore.setState({ isAuthenticated: true, isLoading: false });
});

const selected = () => screen.getByRole("tab", { selected: true });

describe("Library tabs follow the URL (NAV-02)", () => {
	it("opens the tab named in ?tab=", async () => {
		render(<LibraryPage />);
		expect(await screen.findByRole("tab", { selected: true })).toHaveTextContent(/Albums/);
	});

	it("goes back to Recent when the URL loses ?tab= (was: the header's Library link kept Albums)", async () => {
		const { rerender } = render(<LibraryPage />);
		expect(await screen.findByRole("tab", { selected: true })).toHaveTextContent(/Albums/);
		search = "";
		rerender(<LibraryPage />);
		expect(selected()).toHaveTextContent(/Recent/);
	});
});
