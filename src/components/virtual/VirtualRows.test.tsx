import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { VirtualRows } from "./VirtualRows";

const ROW = 60;
const items = (n: number) => Array.from({ length: n }, (_, i) => `track-${i}`);

beforeEach(() => {
	// jsdom has no layout: give rows a height and pin the list to the top.
	vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
		return this.dataset.index != null ? ROW : 0;
	});
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

const renderList = (n: number) =>
	render(<VirtualRows items={items(n)} getKey={(t) => t} estimateSize={ROW} render={(t) => <p data-testid="row">{t}</p>} />);

describe("VirtualRows", () => {
	it("renders a short list whole", () => {
		const { getAllByTestId } = renderList(10);
		expect(getAllByTestId("row")).toHaveLength(10);
	});

	it("mounts only the rows near the viewport for a long list (was: 1000 TrackRows mounted at once)", () => {
		const { getAllByTestId, container } = renderList(1000);
		const rows = getAllByTestId("row");
		// jsdom's 768px viewport ≈ 13 rows, plus overscan
		expect(rows.length).toBeGreaterThan(10);
		expect(rows.length).toBeLessThan(40);
		expect(rows[0]).toHaveTextContent("track-0");

		// The unrendered rows are stood in for by padding, so the page keeps its full height.
		const list = container.firstElementChild as HTMLElement;
		const rendered = rows.length * ROW;
		expect(parseFloat(list.style.paddingBottom)).toBe(1000 * ROW - rendered);
	});
});
