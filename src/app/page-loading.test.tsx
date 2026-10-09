import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LibraryLoading from "./(main)/library/loading";
import SettingsLoading from "./(main)/settings/loading";
import AboutLoading from "./(main)/about/loading";
import ErrorsLoading from "./(main)/errors/loading";

describe("page skeletons (NAV-32)", () => {
	it.each([
		["library", LibraryLoading],
		["settings", SettingsLoading],
		["about", AboutLoading],
		["errors", ErrorsLoading],
	])("%s shows its own neutral skeleton (was: the Home skeleton, then a different layout)", (_, Loading) => {
		render(<Loading />);
		expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
	});
});
