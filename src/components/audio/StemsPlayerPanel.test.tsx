import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StemsPlayerPanel } from "./StemsPlayerPanel";

// jsdom doesn't ship a real <audio> implementation. Stub the prototype
// methods we exercise so the component can wire them up without crashes.
class MockAudio {
	src = "";
	currentTime = 0;
	listeners: Record<string, () => void> = {};
	pause = vi.fn();
	play = vi.fn().mockResolvedValue(undefined);
	addEventListener = vi.fn((event: string, fn: () => void) => {
		this.listeners[event] = fn;
	});
}
const audioInstances: MockAudio[] = [];

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

const fetchMock = vi.fn();

beforeEach(() => {
	audioInstances.length = 0;
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
	// Wrap MockAudio in a function that's a real constructor (`vi.fn(() => obj)`
	// returns a mock that can't be called with `new`).
	function AudioCtor(this: MockAudio) {
		const inst = new MockAudio();
		audioInstances.push(inst);
		return inst;
	}
	vi.stubGlobal("Audio", AudioCtor);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const SIX_STEMS = [
	{ stemName: "vocals", fileSize: 1 },
	{ stemName: "drums", fileSize: 1 },
	{ stemName: "bass", fileSize: 1 },
	{ stemName: "guitar", fileSize: 1 },
	{ stemName: "piano", fileSize: 1 },
	{ stemName: "other", fileSize: 1 },
];

describe("StemsPlayerPanel", () => {
	it("renders one row per stem in canonical order (vocals first)", () => {
		render(<StemsPlayerPanel trackId="T1" stems={SIX_STEMS} />);
		const buttons = screen.getAllByRole("button");
		const labels = buttons.map((b) => b.getAttribute("aria-label"));
		expect(labels[0]).toMatch(/Vocals/);
		expect(labels[1]).toMatch(/Drums/);
		expect(labels[2]).toMatch(/Bass/);
		expect(labels[3]).toMatch(/Guitar/);
		expect(labels[4]).toMatch(/Piano/);
		expect(labels[5]).toMatch(/Other/);
	});

	it("uses the friendly Instrumental label for no_vocals", () => {
		render(
			<StemsPlayerPanel
				trackId="T1"
				stems={[{ stemName: "no_vocals", fileSize: 1 }]}
			/>,
		);
		expect(
			screen.getByLabelText(/Play Instrumental \(no vocals\)/),
		).toBeInTheDocument();
	});

	it("fetches the presigned url and starts playback when a stem is clicked", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(200, {
				success: true,
				data: { url: "https://example.test/vocals.mp3", contentType: "audio/mpeg" },
			}),
		);

		render(<StemsPlayerPanel trackId="T1" stems={SIX_STEMS} />);
		await userEvent.click(screen.getByLabelText(/Play Vocals/));

		await waitFor(() => expect(audioInstances[0]?.play).toHaveBeenCalled());
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/v1/stems/T1/vocals/url",
			expect.objectContaining({ credentials: "include" }),
		);
		expect(audioInstances[0]?.src).toBe("https://example.test/vocals.mp3");
	});

	it("toggles back to Stop when the same stem is clicked again", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, {
				success: true,
				data: { url: "https://example.test/drums.mp3", contentType: "audio/mpeg" },
			}),
		);

		render(<StemsPlayerPanel trackId="T1" stems={SIX_STEMS} />);
		await userEvent.click(screen.getByLabelText(/Play Drums/));
		await waitFor(() =>
			expect(screen.getByLabelText(/Stop Drums/)).toBeInTheDocument(),
		);

		await userEvent.click(screen.getByLabelText(/Stop Drums/));
		await waitFor(() =>
			expect(screen.getByLabelText(/Play Drums/)).toBeInTheDocument(),
		);
		expect(audioInstances[0]?.pause).toHaveBeenCalled();
	});

	it("stops the current stem when another stem is started (mutual exclusion)", async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: { url: "https://example.test/vocals.mp3" },
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse(200, {
					success: true,
					data: { url: "https://example.test/drums.mp3" },
				}),
			);

		render(<StemsPlayerPanel trackId="T1" stems={SIX_STEMS} />);
		await userEvent.click(screen.getByLabelText(/Play Vocals/));
		await waitFor(() =>
			expect(screen.getByLabelText(/Stop Vocals/)).toBeInTheDocument(),
		);
		await userEvent.click(screen.getByLabelText(/Play Drums/));

		// Same Audio instance is reused — the existing one is paused before the
		// new src is loaded, so .pause is called at least once before the second .play.
		await waitFor(() => {
			expect(audioInstances[0]?.pause).toHaveBeenCalled();
			expect(audioInstances[0]?.play).toHaveBeenCalledTimes(2);
		});
		expect(audioInstances[0]?.src).toBe("https://example.test/drums.mp3");
	});

	it("does not start playback when the url endpoint fails", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(500, { success: false, error: { code: "X", message: "no" } }),
		);

		render(<StemsPlayerPanel trackId="T1" stems={SIX_STEMS} />);
		await userEvent.click(screen.getByLabelText(/Play Vocals/));

		// No Audio constructed because the fetch failed before instantiation.
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		expect(audioInstances.length).toBe(0);
		expect(screen.getByLabelText(/Play Vocals/)).toBeInTheDocument();
	});

	it("stops playback when unmounted", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, {
				success: true,
				data: { url: "https://example.test/vocals.mp3" },
			}),
		);

		const { unmount } = render(
			<StemsPlayerPanel trackId="T1" stems={SIX_STEMS} />,
		);
		await userEvent.click(screen.getByLabelText(/Play Vocals/));
		await waitFor(() => expect(audioInstances[0]?.play).toHaveBeenCalled());

		unmount();
		expect(audioInstances[0]?.pause).toHaveBeenCalled();
		expect(audioInstances[0]?.src).toBe("");
	});
});
