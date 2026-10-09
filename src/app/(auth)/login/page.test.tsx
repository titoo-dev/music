import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const social = vi.fn();
const getSession = vi.fn();
vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { social: (o: unknown) => social(o) }, getSession: () => getSession() } }));
vi.mock("@/hooks/useDiscover", () => ({ useDiscover: () => ({ showcase: [] }) }));
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

import LoginPage from "./page";

beforeEach(() => {
	replace.mockReset();
	social.mockReset().mockResolvedValue({ data: null, error: { message: "stop here" } });
	getSession.mockReset().mockResolvedValue({ data: null });
});

function open(search: string) {
	window.history.replaceState(null, "", `/login${search}`);
	render(<LoginPage />);
}

async function signIn(search: string) {
	open(search);
	await userEvent.click(screen.getByRole("button", { name: /Continue with Google/ }));
}

describe("LoginPage — coming back (NAV-10)", () => {
	it("returns to the page the user came from (was: always Home)", async () => {
		await signIn("?next=%2Flibrary%3Ftab%3Dalbums");
		expect(social).toHaveBeenCalledWith(expect.objectContaining({ callbackURL: "/library?tab=albums" }));
	});

	it("ignores an off-site next (no open redirect)", async () => {
		await signIn("?next=https%3A%2F%2Fevil.example");
		expect(social).toHaveBeenCalledWith(expect.objectContaining({ callbackURL: "/" }));
	});
});

describe("LoginPage — OAuth errors (NAV-11)", () => {
	it("sends Google errors back to this page, keeping next (was: raw Better Auth error page)", async () => {
		await signIn("?next=%2Flibrary");
		expect(social).toHaveBeenCalledWith(expect.objectContaining({ errorCallbackURL: "/login?next=%2Flibrary" }));
	});

	it("explains a cancelled Google sign-in", () => {
		open("?error=access_denied");
		expect(screen.getByText("Google sign-in was cancelled. Try again when you're ready.")).toBeInTheDocument();
	});

	it("explains any other OAuth error", () => {
		open("?error=state_mismatch");
		expect(screen.getByText("Google sign-in didn't finish. Please try again.")).toBeInTheDocument();
	});
});

describe("LoginPage — already signed in (NAV-12)", () => {
	it("goes straight on to next, replacing /login (was: the sign-in form showed to a signed-in user)", async () => {
		getSession.mockResolvedValue({ data: { user: { id: "u" } } });
		open("?next=%2Fsettings");
		await waitFor(() => expect(replace).toHaveBeenCalledWith("/settings"));
	});

	it("the back arrow returns to the page the user came from", () => {
		open("?next=%2Flibrary");
		expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/library");
	});
});
