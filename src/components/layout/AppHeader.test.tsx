import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
let pathname = "/library";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace, push: vi.fn() }) }));
const signOutEverywhere = vi.fn();
vi.mock("@/lib/sign-out", () => ({ signOutEverywhere: () => signOutEverywhere() }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import { toast } from "sonner";
import { AppHeader } from "./AppHeader";
import { useAuthStore } from "@/stores/useAuthStore";

beforeEach(() => {
	replace.mockReset();
	signOutEverywhere.mockReset();
	vi.mocked(toast.error).mockReset();
	pathname = "/library";
	window.history.replaceState(null, "", "/library?tab=albums");
	useAuthStore.setState({ isAuthenticated: true, isLoading: false, user: { id: "u", name: "Ada", email: "ada@example.com" } as never });
});

async function logOut() {
	render(<AppHeader />);
	await userEvent.click(screen.getByRole("button", { name: "Account" }));
	await userEvent.click(await screen.findByRole("menuitem", { name: /Log out/ }));
}

describe("AppHeader — Log out (NAV-08)", () => {
	it("leaves the page once signed out (was: stayed on a private page)", async () => {
		signOutEverywhere.mockResolvedValue(true);
		await logOut();
		await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
	});

	it("says so when signing out failed, and stays put (was: silent failure)", async () => {
		signOutEverywhere.mockResolvedValue(false);
		await logOut();
		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(replace).not.toHaveBeenCalled();
	});
});

describe("AppHeader — Sign in (NAV-10)", () => {
	it("comes back to the current page after signing in (was: always Home)", () => {
		useAuthStore.setState({ isAuthenticated: false, user: null });
		render(<AppHeader />);
		expect(screen.getByText("Sign in").closest("a")).toHaveAttribute("href", "/login?next=%2Flibrary%3Ftab%3Dalbums");
	});
});
