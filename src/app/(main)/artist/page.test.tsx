import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace, push: vi.fn() }),
	useSearchParams: () => new URLSearchParams("name=Daft%20Punk"),
}));
const fetchData = vi.fn();
vi.mock("@/utils/api", () => ({ fetchData: (...a: unknown[]) => fetchData(...a) }));

import ArtistPage from "./page";

beforeEach(() => {
	replace.mockReset();
	fetchData.mockReset();
});

describe("/artist?name= (NAV-23 / NAV-24)", () => {
	it("a failed search offers a retry instead of 'Artist not found' (was: permanent false 404)", async () => {
		fetchData.mockResolvedValue({ data: [{ id: 27, name: "Daft Punk" }] }).mockRejectedValueOnce(new TypeError("Failed to fetch"));
		render(<ArtistPage />);
		expect(await screen.findByText("Couldn't load this artist")).toBeInTheDocument();
		expect(screen.queryByText("Artist not found")).toBeNull();
		await userEvent.click(screen.getByRole("button", { name: /Try again/ }));
		await waitFor(() => expect(replace).toHaveBeenCalledWith("/artist?id=27"));
	});

	it("says 'not found' instead of opening an unrelated artist (was: Deezer's top result)", async () => {
		fetchData.mockResolvedValue({ data: [{ id: 99, name: "Someone Else" }] });
		render(<ArtistPage />);
		expect(await screen.findByText("Artist not found")).toBeInTheDocument();
		expect(replace).not.toHaveBeenCalled();
	});
});
