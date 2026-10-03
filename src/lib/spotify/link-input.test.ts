import { describe, it, expect } from "vitest";
import { commitLinks, joinLinkInput, removeLink, splitLinkInput } from "./link-input";

const A = "2lXwrz6mp5xDB2XemuV2eC";
const B = "9MLlcTltfAAAAAAAAAAAAA";
const C = "4uLU6hMCjMI75M1A2tKUQC";
const url = (id: string) => `https://open.spotify.com/track/${id}`;

describe("splitLinkInput / joinLinkInput", () => {
	it("reads an empty field", () => {
		expect(splitLinkInput("")).toEqual({ ids: [], draft: "" });
		expect(joinLinkInput([], "")).toBe("");
	});

	it("keeps committed links on their own lines and the typed text last", () => {
		const input = joinLinkInput([A, B], "https://open.spot");
		expect(input).toBe(`${url(A)}\n${url(B)}\nhttps://open.spot`);
		expect(splitLinkInput(input)).toEqual({ ids: [A, B], draft: "https://open.spot" });
	});

	it("treats a lone playlist link as the draft", () => {
		const link = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
		expect(splitLinkInput(link)).toEqual({ ids: [], draft: link });
	});
});

describe("commitLinks", () => {
	it("turns every pasted track link into an item (was: links piled up under the label in one textarea)", () => {
		const pasted = `${url(A)}\r\n${url(B)}?si=x\n${url(C)}`;
		expect(splitLinkInput(commitLinks("", pasted)!)).toEqual({ ids: [A, B, C], draft: "" });
	});

	it("appends to existing items, drops repeats and folds the draft in", () => {
		const input = joinLinkInput([A], url(B));
		expect(splitLinkInput(commitLinks(input, `${url(A)}\n${url(C)}`)!)).toEqual({ ids: [A, B, C], draft: "" });
	});

	it("commits a typed link on its own", () => {
		expect(splitLinkInput(commitLinks(joinLinkInput([A], url(B)))!)).toEqual({ ids: [A, B], draft: "" });
	});

	it("returns null when there is no track link (a playlist link stays typed text)", () => {
		expect(commitLinks("", "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")).toBeNull();
		expect(commitLinks(joinLinkInput([A], "hello"))).toBeNull();
	});
});

describe("removeLink", () => {
	it("removes one item and keeps the draft", () => {
		expect(splitLinkInput(removeLink(joinLinkInput([A, B, C], "x"), B))).toEqual({ ids: [A, C], draft: "x" });
	});
});
