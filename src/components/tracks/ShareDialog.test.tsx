import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShareDialog } from "./ShareDialog";
import { useShareStore } from "@/stores/useShareStore";

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockReset();
	fetchMock.mockResolvedValue({ json: async () => ({ success: true, data: { shareId: "abc123" } }) });
	vi.stubGlobal("fetch", fetchMock);
	useShareStore.setState({ shared: new Map(), loaded: true });
});

describe("ShareDialog", () => {
	it("sends the track metadata with the share (was: only trackId, so the public page had an empty title)", async () => {
		render(
			<ShareDialog
				open
				onOpenChange={() => {}}
				trackId="42"
				duration={200}
				title="Nofy"
				artist="Hosea Marlyn"
				album="Fitiavana"
				cover="https://cdn/cover.jpg"
			/>
		);
		await userEvent.click(screen.getByRole("button", { name: /Create link/ }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("/api/v1/shares");
		expect(JSON.parse(init.body)).toEqual({
			trackId: "42",
			title: "Nofy",
			artist: "Hosea Marlyn",
			album: "Fitiavana",
			coverUrl: "https://cdn/cover.jpg",
			duration: 200,
			expiresIn: 168,
		});
		await waitFor(() => expect(useShareStore.getState().shared.get("42")).toBe("abc123"));
	});
});
