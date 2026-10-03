import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SpotifyLinksField } from "./SpotifyLinksField";

const A = "2lXwrz6mp5xDB2XemuV2eC";
const B = "9MLlcTltfAAAAAAAAAAAAA";
const C = "4uLU6hMCjMI75M1A2tKUQC";
const url = (id: string) => `https://open.spotify.com/track/${id}`;

function Harness({ initial = "", onSubmit = () => {} }: { initial?: string; onSubmit?: () => void }) {
	const [value, setValue] = useState(initial);
	return (
		<>
			<SpotifyLinksField label="Playlist or track links" value={value} onValueChange={setValue} onSubmit={onSubmit} />
			<output data-testid="value">{value}</output>
		</>
	);
}

const field = () => screen.getByLabelText("Playlist or track links") as HTMLInputElement;
const paste = (text: string) => fireEvent.paste(field(), { clipboardData: { getData: () => text } });
const items = () => screen.queryAllByRole("listitem").map((li) => li.textContent);

describe("SpotifyLinksField", () => {
	it("makes one list item per pasted link (was: 66 links overlapped the label in a 2-row textarea)", () => {
		render(<Harness />);
		paste(`${url(A)}\n${url(B)}\n${url(C)}`);
		expect(items()).toHaveLength(3);
		expect(items()[0]).toContain(A);
		expect(items()[2]).toContain(C);
		expect(field().value).toBe("");
	});

	it("lets a playlist link paste as plain text", () => {
		render(<Harness />);
		const link = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
		paste(link);
		// Not intercepted: the browser's default paste fills the input.
		fireEvent.change(field(), { target: { value: link } });
		expect(items()).toHaveLength(0);
		expect(screen.getByTestId("value").textContent).toBe(link);
	});

	it("removes an item with its button and the last one with Backspace", () => {
		render(<Harness />);
		paste(`${url(A)}\n${url(B)}\n${url(C)}`);
		fireEvent.click(screen.getByRole("button", { name: "Remove link 2" }));
		expect(items().map((t) => t?.includes(B))).toEqual([false, false]);
		fireEvent.keyDown(field(), { key: "Backspace" });
		expect(items()).toHaveLength(1);
		expect(items()[0]).toContain(A);
	});

	it("Enter commits a typed track link, otherwise submits", () => {
		const onSubmit = vi.fn();
		render(<Harness onSubmit={onSubmit} />);
		fireEvent.change(field(), { target: { value: url(A) } });
		fireEvent.keyDown(field(), { key: "Enter" });
		expect(items()).toHaveLength(1);
		expect(onSubmit).not.toHaveBeenCalled();
		fireEvent.keyDown(field(), { key: "Enter" });
		expect(onSubmit).toHaveBeenCalledOnce();
	});
});
