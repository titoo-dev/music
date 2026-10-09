import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const social = vi.fn();
vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { social: (o: unknown) => social(o) } } }));
vi.mock("@/hooks/useDiscover", () => ({ useDiscover: () => ({ showcase: [] }) }));

import LoginPage from "./page";

beforeEach(() => {
	social.mockReset().mockResolvedValue({ data: null, error: { message: "stop here" } });
});

async function signIn(search: string) {
	window.history.replaceState(null, "", `/login${search}`);
	render(<LoginPage />);
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
