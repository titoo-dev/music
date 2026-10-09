import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trailingSend } from "./trailing-send";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("trailingSend", () => {
	it("sends only the last value once things settle", () => {
		const send = vi.fn();
		const s = trailingSend(send, 250);
		s.schedule(["a"]);
		s.schedule(["b"]);
		vi.advanceTimersByTime(249);
		expect(send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(send).toHaveBeenCalledOnce();
		expect(send).toHaveBeenCalledWith(["b"], { leaving: false });
	});

	it("flush sends a pending value right away (NAV-27, was: leaving within 250 ms dropped the new order)", () => {
		const send = vi.fn();
		const s = trailingSend(send, 250);
		s.schedule(["c"]);
		s.flush();
		expect(send).toHaveBeenCalledWith(["c"], { leaving: true });
		vi.advanceTimersByTime(500);
		expect(send).toHaveBeenCalledOnce();
	});

	it("flush with nothing pending sends nothing", () => {
		const send = vi.fn();
		trailingSend(send, 250).flush();
		expect(send).not.toHaveBeenCalled();
	});
});
