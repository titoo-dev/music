import { describe, it, expect, beforeEach } from "vitest";
import { useCommandStore } from "./useCommandStore";

const INITIAL = useCommandStore.getState();
beforeEach(() => useCommandStore.setState(INITIAL, true));

describe("useCommandStore", () => {
	it("opens on the search view by default", () => {
		useCommandStore.getState().open();
		expect(useCommandStore.getState()).toMatchObject({ isOpen: true, view: "search", query: "" });
	});

	it("opens with a query and view", () => {
		useCommandStore.getState().open("daft punk", "downloads");
		expect(useCommandStore.getState()).toMatchObject({
			isOpen: true,
			view: "downloads",
			query: "daft punk",
		});
	});

	it("keeps the previous query when reopened without one", () => {
		const s = useCommandStore.getState();
		s.setQuery("abc");
		s.close();
		s.open();
		expect(useCommandStore.getState().query).toBe("abc");
	});

	it("toggle flips open state", () => {
		useCommandStore.getState().toggle();
		expect(useCommandStore.getState().isOpen).toBe(true);
		useCommandStore.getState().toggle();
		expect(useCommandStore.getState().isOpen).toBe(false);
	});

	it("setView switches the view", () => {
		useCommandStore.getState().setView("downloads");
		expect(useCommandStore.getState().view).toBe("downloads");
	});
});
