import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, act } from "@testing-library/react";
import { AnimatePresence, MotionGlobalConfig, motion } from "motion/react";
import { Equalizer, LogoMark, PlayPauseIcon, ProgressRing, HeartGlyph, RepeatGlyph, ShuffleGlyph, waveLineFrames } from "./icons";

describe("LogoMark", () => {
	it("gives each instance its own gradient ids (was: second logo on a page rendered blank)", () => {
		const { container } = render(
			<>
				<LogoMark />
				<LogoMark />
			</>
		);
		const ids = Array.from(container.querySelectorAll("defs > *")).map((g) => g.id);
		expect(ids).toHaveLength(4);
		expect(new Set(ids).size).toBe(4);
		// Every fill / stroke reference resolves to a gradient inside the same svg.
		for (const svg of container.querySelectorAll("svg")) {
			const own = new Set(Array.from(svg.querySelectorAll("defs > *")).map((g) => g.id));
			const refs = Array.from(svg.querySelectorAll("*"))
				.flatMap((el) => [el.getAttribute("fill"), el.getAttribute("stroke")])
				.filter((v): v is string => !!v?.startsWith("url(#"))
				.map((v) => v.slice(5, -1));
			expect(refs.length).toBeGreaterThan(0);
			for (const r of refs) expect(own.has(r)).toBe(true);
		}
	});
});

// Motion applies updates on the next animation frame.
const frame = () => act(() => new Promise<void>((r) => setTimeout(r, 30)));

describe("Equalizer", () => {
	const bars = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>("[aria-hidden] > span"));

	it("bounces when it mounts already playing (was: three static dots on the now-playing row)", () => {
		const { container } = render(<Equalizer playing />);
		expect(bars(container)).toHaveLength(3);
		for (const b of bars(container)) expect(b.style.animationName).toBe("playback-eq");
	});

	it("bounces inside an AnimatePresence initial={false} (was: frozen dots in the floating player)", () => {
		const { container } = render(
			<AnimatePresence initial={false}>
				<motion.span key="eq">
					<Equalizer playing />
				</motion.span>
			</AnimatePresence>
		);
		for (const b of bars(container)) expect(b.style.animationName).toBe("playback-eq");
	});

	it("rests when paused", () => {
		const { container, rerender } = render(<Equalizer playing />);
		rerender(<Equalizer playing={false} />);
		for (const b of bars(container)) {
			expect(b.style.animationName).toBe("");
			expect(b.style.height).toBe("35%");
		}
	});
});

describe("animated icons", () => {
	beforeAll(() => {
		MotionGlobalConfig.skipAnimations = true;
	});
	afterAll(() => {
		MotionGlobalConfig.skipAnimations = false;
	});

	it("PlayPauseIcon morphs one path (was: hairline seam down the middle of ▶)", () => {
		const { container, rerender } = render(<PlayPauseIcon playing={false} />);
		const paths = container.querySelectorAll("path");
		expect(paths).toHaveLength(1);
		expect(paths[0].getAttribute("d")?.match(/M/g)).toHaveLength(2);
		rerender(<PlayPauseIcon playing />);
		expect(container.querySelectorAll("path")).toHaveLength(1);
	});

	it("ProgressRing hides its arc at 0 (was: a dot at 12 o'clock from the round cap)", async () => {
		const { container, rerender } = render(<ProgressRing value={0} />);
		const arc = () => container.querySelectorAll("circle")[1];
		expect(arc().getAttribute("opacity")).toBe("0");
		rerender(<ProgressRing value={0.5} />);
		await frame();
		expect(arc().getAttribute("opacity")).toBe("1");
	});

	it("HeartGlyph fades a solid fill instead of animating to currentColor (was: 'currentColor is not an animatable value' + snap)", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { container, rerender } = render(<HeartGlyph filled={false} />);
		const path = () => container.querySelector("path")!;
		expect(path().getAttribute("fill")).toBe("currentColor");
		expect(path().getAttribute("fill-opacity")).toBe("0");
		rerender(<HeartGlyph filled />);
		await frame();
		expect(path().getAttribute("fill-opacity")).toBe("1");
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	it("WaveLine frames travel without flattening (was: 3 keyframes, the line went flat mid-cycle)", () => {
		const frames = waveLineFrames(8);
		expect(frames.length).toBeGreaterThanOrEqual(16);
		expect(frames[0]).toBe(frames.at(-1));
		const peak = (d: string) => Math.max(...[...d.matchAll(/[ML][\d.]+ ([\d.-]+)/g)].map((m) => Math.abs(Number(m[1]) - 20)));
		for (const d of frames) expect(peak(d)).toBeGreaterThan(5);
	});

	it("RepeatGlyph always turns forward (was: one → off spun back a full turn)", async () => {
		const { container, rerender } = render(<RepeatGlyph mode="off" />);
		const turn = () => container.querySelector("svg")!.style.transform;
		rerender(<RepeatGlyph mode="all" />);
		await frame();
		expect(turn()).toBe("rotate(180deg)");
		rerender(<RepeatGlyph mode="one" />);
		await frame();
		expect(turn()).toBe("rotate(360deg)");
		rerender(<RepeatGlyph mode="off" />);
		await frame();
		expect(turn()).toBe("rotate(540deg)");
	});

	it("ShuffleGlyph redraws only when switched on (was: strands vanished and redrew on mount and on every toggle)", () => {
		const { container, rerender } = render(<ShuffleGlyph active />);
		const first = container.querySelector("path");
		expect(first?.style.strokeDasharray).not.toMatch(/^0(px)? /);
		rerender(<ShuffleGlyph active={false} />);
		expect(container.querySelector("path")).toBe(first);
		rerender(<ShuffleGlyph active />);
		expect(container.querySelector("path")).not.toBe(first);
	});
});
