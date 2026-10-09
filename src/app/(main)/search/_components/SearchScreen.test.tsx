import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push, replace }),
	useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("../_lib/useSearch", () => ({ useMainSearch: () => ({ data: null, loading: false, error: null }) }));
vi.mock("@/hooks/useDownloadedAlbums", () => ({ useDownloadedAlbums: () => ({ albumMap: new Map() }) }));
vi.mock("./Browse", () => ({ Browse: () => <div>browse</div> }));
vi.mock("./Suggestions", () => ({ Suggestions: ({ term }: { term: string }) => <div>suggestions for {term}</div> }));
vi.mock("./Results", () => ({ AllResults: () => <div>all results</div>, TypedResults: () => <div>typed results</div> }));

import { SearchScreen } from "./SearchScreen";
import { recentSearches } from "../_lib/useRecentSearches";
import { useCommandStore } from "@/stores/useCommandStore";
import { act } from "@testing-library/react";

beforeEach(() => {
	push.mockReset();
	replace.mockReset();
	search = "";
	recentSearches.clear?.();
});

async function submit(value: string) {
	render(<SearchScreen />);
	const input = screen.getByLabelText("Search Deezer");
	await userEvent.click(input);
	await userEvent.type(input, `${value}{Enter}`);
}

describe("SearchScreen — Deezer links (NAV-19)", () => {
	it("opens a pasted album link instead of searching its URL (was: Enter searched the URL → No results)", async () => {
		await submit("https://www.deezer.com/album/302127");
		expect(push).toHaveBeenCalledWith("/album?id=302127");
		expect(push).not.toHaveBeenCalledWith(expect.stringContaining("/search?term="), expect.anything());
	});

	it("opens a pasted artist link", async () => {
		await submit("https://www.deezer.com/fr/artist/27");
		expect(push).toHaveBeenCalledWith("/artist?id=27");
	});

	it("keeps a pasted track link on the link card (was: the card vanished for an empty search)", async () => {
		await submit("https://www.deezer.com/track/3135556");
		expect(push).not.toHaveBeenCalled();
		expect(screen.getByText(/suggestions for https:\/\/www.deezer.com\/track\/3135556/)).toBeInTheDocument();
	});

	it("still searches plain text", async () => {
		await submit("daft punk");
		expect(push).toHaveBeenCalledWith("/search?term=daft%20punk", { scroll: true });
	});
});

describe("SearchScreen — palette 'See all results' (NAV-22)", () => {
	it("shows the palette's results over an unsubmitted draft, even on the same URL (was: the draft's suggestions stayed)", async () => {
		search = "term=daft";
		render(<SearchScreen />);
		const input = screen.getByLabelText("Search Deezer");
		await userEvent.click(input);
		await userEvent.clear(input);
		await userEvent.type(input, "daft punk");
		expect(await screen.findByText(/suggestions for daft punk/)).toBeInTheDocument();
		act(() => useCommandStore.getState().submitSearch("daft"));
		expect(await screen.findByText("all results")).toBeInTheDocument();
		expect(input).toHaveValue("daft");
	});
});
