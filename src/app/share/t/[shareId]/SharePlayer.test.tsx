import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SharePlayer } from "./SharePlayer";

/** Minimal stand-in for HTMLAudioElement: the player drives it through on* handlers. */
class FakeAudio {
	static last: FakeAudio;
	src = "";
	preload = "";
	crossOrigin: string | null = null;
	currentTime = 0;
	duration = NaN;
	paused = true;
	buffered = { length: 0, end: () => 0 };
	play = vi.fn(async () => {
		this.paused = false;
		this.onplay?.();
	});
	pause = vi.fn(() => {
		this.paused = true;
		this.onpause?.();
	});
	load = vi.fn();
	onloadedmetadata: (() => void) | null = null;
	ontimeupdate: (() => void) | null = null;
	onprogress: (() => void) | null = null;
	onended: (() => void) | null = null;
	oncanplay: (() => void) | null = null;
	onerror: (() => void) | null = null;
	onplay: (() => void) | null = null;
	onpause: (() => void) | null = null;
	onwaiting: (() => void) | null = null;
	onplaying: (() => void) | null = null;
	constructor() {
		FakeAudio.last = this;
	}
}

const props = { shareId: "abc123", title: "Nofy", artist: "Hosea Marlyn", album: null, coverUrl: null, duration: 295, sharedBy: "Tito" };

beforeEach(() => {
	vi.stubGlobal("Audio", FakeAudio);
	// The CTA reveals on scroll (motion `whileInView`).
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});

describe("SharePlayer", () => {
	it("loads nothing before Play (was: preload=auto counted a play and opened Deezer with the owner's account on every page view)", () => {
		render(<SharePlayer {...props} />);
		expect(FakeAudio.last.preload).toBe("none");
		expect(FakeAudio.last.play).not.toHaveBeenCalled();
		// The stored duration fills the seek bar until the stream's metadata arrives.
		expect(screen.getAllByText("4:55").length).toBeGreaterThan(0);
	});

	it("lets the listener press play before any metadata loaded (was: button disabled until loadedmetadata, which iOS Safari never fires before a tap)", async () => {
		render(<SharePlayer {...props} />);
		const play = screen.getByRole("button", { name: "Play" });
		expect(play).toBeEnabled();
		await userEvent.click(play);
		expect(FakeAudio.last.play).toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
	});

	it("shows an error with a retry when the stream fails (was: endless spinner on 404 / 410 / 429 / 500)", async () => {
		render(<SharePlayer {...props} />);
		act(() => FakeAudio.last.onerror?.());
		expect(screen.getByRole("alert")).toHaveTextContent(/can.t be played right now/i);

		const audio = FakeAudio.last;
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(audio.load).toHaveBeenCalled();
		expect(audio.play).toHaveBeenCalled();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("falls back to Play when the browser refuses play() (was: stuck on Pause with nothing playing)", async () => {
		render(<SharePlayer {...props} />);
		FakeAudio.last.play.mockImplementationOnce(async () => {
			throw new DOMException("blocked", "NotAllowedError");
		});
		await userEvent.click(screen.getByRole("button", { name: "Play" }));
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	it("follows pauses that come from outside the page", async () => {
		render(<SharePlayer {...props} />);
		await userEvent.click(screen.getByRole("button", { name: "Play" }));
		act(() => FakeAudio.last.pause());
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	describe("keyboard (HK-12)", () => {
		function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
			const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
			act(() => {
				target.dispatchEvent(e);
			});
			return e;
		}

		it("Space plays and pauses (was: Space scrolled the page, no shortcut at all)", () => {
			render(<SharePlayer {...props} />);
			expect(press(" ").defaultPrevented).toBe(true);
			expect(FakeAudio.last.play).toHaveBeenCalledOnce();
			press(" ");
			expect(FakeAudio.last.pause).toHaveBeenCalledOnce();
		});

		it("seeks 10 s with L / J and Shift+→ / Shift+←, inside the track", () => {
			render(<SharePlayer {...props} />);
			FakeAudio.last.currentTime = 100;
			press("l");
			expect(FakeAudio.last.currentTime).toBe(110);
			press("ArrowLeft", { shiftKey: true });
			press("j");
			expect(FakeAudio.last.currentTime).toBe(90);
			FakeAudio.last.currentTime = 290;
			press("ArrowRight", { shiftKey: true });
			expect(FakeAudio.last.currentTime).toBe(295);
			FakeAudio.last.currentTime = 3;
			press("j");
			expect(FakeAudio.last.currentTime).toBe(0);
		});

		it("leaves Space to a focused button and keys to dialogs, fields and held keys", () => {
			render(<SharePlayer {...props} />);
			const copy = screen.getByRole("button", { name: /copy link/i });
			expect(press(" ", {}, copy).defaultPrevented).toBe(false);
			const input = document.body.appendChild(document.createElement("input"));
			press(" ", {}, input);
			press(" ", { repeat: true });
			expect(FakeAudio.last.play).not.toHaveBeenCalled();
			input.remove();
		});
	});
});
