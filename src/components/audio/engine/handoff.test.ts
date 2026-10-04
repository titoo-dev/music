import { describe, it, expect, vi } from "vitest";
import { startHandoff, type HandoffElement } from "./handoff";

class FakeElement extends EventTarget implements HandoffElement {
	currentTime = 0;
	duration = NaN;
	paused = false;
	override addEventListener(type: string, fn: () => void) {
		super.addEventListener(type, fn);
	}
	override removeEventListener(type: string, fn: () => void) {
		super.removeEventListener(type, fn);
	}
	fire(type: "timeupdate" | "ended") {
		this.dispatchEvent(new Event(type));
	}
}

function setup(current = { value: true }) {
	const head = new FakeElement();
	const full = new FakeElement();
	const swap = vi.fn();
	const discard = vi.fn();
	const cancel = startHandoff({ head, full, stillCurrent: () => current.value, swap, discard });
	return { head, full, swap, discard, cancel };
}

describe("startHandoff", () => {
	it("swaps to the full stream just before the head runs out, at the head's position", () => {
		const { head, full, swap, discard } = setup();
		head.duration = 3;
		head.currentTime = 2;
		head.fire("timeupdate");
		expect(swap).not.toHaveBeenCalled();
		head.currentTime = 2.8;
		head.fire("timeupdate");
		expect(swap).toHaveBeenCalledWith(full, { position: 2.8, wasPlaying: true });
		head.fire("ended");
		expect(swap).toHaveBeenCalledTimes(1);
		expect(discard).not.toHaveBeenCalled();
	});

	it("swaps on ended when no timeupdate came close enough", () => {
		const { head, swap } = setup();
		head.fire("ended");
		expect(swap).toHaveBeenCalledTimes(1);
	});

	it("drops the full stream when the track changed before the head ended", () => {
		const current = { value: true };
		const { head, full, swap, discard } = setup(current);
		current.value = false;
		head.fire("ended");
		expect(swap).not.toHaveBeenCalled();
		expect(discard).toHaveBeenCalledWith(full);
	});

	it("is cancelled by a track change: the full stream is discarded right away (was: it kept downloading — only the swap cleaned it up)", () => {
		const { head, full, swap, discard, cancel } = setup();
		cancel();
		expect(discard).toHaveBeenCalledWith(full);
		head.fire("ended");
		expect(swap).not.toHaveBeenCalled();
		cancel();
		expect(discard).toHaveBeenCalledTimes(1);
	});

	it("does nothing when cancelled after the swap", () => {
		const { head, swap, discard, cancel } = setup();
		head.fire("ended");
		cancel();
		expect(swap).toHaveBeenCalledTimes(1);
		expect(discard).not.toHaveBeenCalled();
	});
});
