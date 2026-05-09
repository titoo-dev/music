import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { usePlayerStore } from "@/stores/usePlayerStore";

const requestSeparation = vi.fn();
let stemsState = {
	status: "idle" as
		| "idle"
		| "requesting"
		| "queued"
		| "processing"
		| "completed"
		| "failed",
	progress: 0,
	mode: null as "two_stems" | "six_stems" | null,
	errorMessage: null as string | null,
	files: [] as { stemName: string; fileSize: number | null }[],
};

vi.mock("@/hooks/useStems", () => ({
	useStems: vi.fn(() => ({
		...stemsState,
		requestSeparation,
		refresh: vi.fn(),
	})),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn() },
}));

import { KaraokeToggle } from "./KaraokeToggle";
import { toast } from "sonner";

const INITIAL_PLAYER = usePlayerStore.getState();

beforeEach(() => {
	requestSeparation.mockReset();
	stemsState = {
		status: "idle",
		progress: 0,
		mode: null,
		errorMessage: null,
		files: [],
	};
	usePlayerStore.setState(
		{
			...INITIAL_PLAYER,
			currentTrack: {
				trackId: "T1",
				title: "Song",
				artist: "Artist",
				cover: null,
				duration: 200,
			},
			karaokeMode: false,
			_retryLoadCount: 0,
		},
		true,
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("KaraokeToggle", () => {
	it("does not render when there is no current track", () => {
		usePlayerStore.setState({ currentTrack: null });
		const { container } = render(<KaraokeToggle />);
		expect(container.firstChild).toBeNull();
	});

	it("starts in inactive state with the default label", () => {
		render(<KaraokeToggle />);
		const btn = screen.getByTestId("karaoke-toggle");
		expect(btn).toHaveAttribute("aria-pressed", "false");
		expect(btn.getAttribute("aria-label")).toMatch(/Karaoke \(remove vocals\)/);
	});

	it("turning karaoke on flips the store flag", async () => {
		render(<KaraokeToggle />);
		await userEvent.click(screen.getByTestId("karaoke-toggle"));
		expect(usePlayerStore.getState().karaokeMode).toBe(true);
	});

	it("auto-requests two_stems separation once when karaoke goes on with idle stems", async () => {
		const { rerender } = render(<KaraokeToggle />);
		await userEvent.click(screen.getByTestId("karaoke-toggle"));
		await waitFor(() => {
			expect(requestSeparation).toHaveBeenCalledWith("two_stems");
		});
		expect(requestSeparation).toHaveBeenCalledTimes(1);

		// Re-render — should not POST again for the same trackId.
		rerender(<KaraokeToggle />);
		expect(requestSeparation).toHaveBeenCalledTimes(1);
	});

	it("does not auto-request when karaoke is off", () => {
		stemsState.status = "idle";
		render(<KaraokeToggle />);
		expect(requestSeparation).not.toHaveBeenCalled();
	});

	it("shows preparing state with progress while processing", () => {
		usePlayerStore.setState({ karaokeMode: true });
		stemsState.status = "processing";
		stemsState.progress = 42;
		render(<KaraokeToggle />);
		const btn = screen.getByTestId("karaoke-toggle");
		expect(btn.getAttribute("aria-label")).toMatch(/Preparing karaoke… 42%/);
		expect(btn.textContent).toContain("42%");
	});

	it("calls retryTrack when stems flip to completed (so AudioEngine swaps source)", async () => {
		usePlayerStore.setState({ karaokeMode: true });
		stemsState.status = "processing";
		stemsState.progress = 90;

		const { rerender } = render(<KaraokeToggle />);
		const before = usePlayerStore.getState()._retryLoadCount;

		// Simulate the hook reporting completion on the next render.
		stemsState.status = "completed";
		stemsState.mode = "two_stems";
		stemsState.progress = 100;
		stemsState.files = [{ stemName: "no_vocals", fileSize: 1 }];
		rerender(<KaraokeToggle />);

		await waitFor(() => {
			expect(usePlayerStore.getState()._retryLoadCount).toBe(before + 1);
		});
	});

	it("shows failed state with retry label and re-requests on click", async () => {
		usePlayerStore.setState({ karaokeMode: true });
		stemsState.status = "failed";
		stemsState.errorMessage = "boom";
		render(<KaraokeToggle />);

		const btn = screen.getByTestId("karaoke-toggle");
		expect(btn.getAttribute("aria-label")).toMatch(/Karaoke failed — retry/);
		expect(btn.textContent).toContain("RETRY");

		await userEvent.click(btn);
		expect(requestSeparation).toHaveBeenCalledWith("two_stems");
		// Karaoke must stay ON so the swap fires automatically once stems land.
		expect(usePlayerStore.getState().karaokeMode).toBe(true);
	});

	it("toasts when a separation error appears while karaoke is on", async () => {
		usePlayerStore.setState({ karaokeMode: true });
		stemsState.status = "processing";
		const { rerender } = render(<KaraokeToggle />);

		stemsState.status = "failed";
		stemsState.errorMessage = "Object name contains unsupported characters.";
		rerender(<KaraokeToggle />);

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				"Couldn't prepare karaoke",
				expect.objectContaining({
					description: "Object name contains unsupported characters.",
				}),
			),
		);
	});
});
