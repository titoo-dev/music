import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";

vi.mock("node:child_process", () => ({
	spawn: vi.fn(),
}));

import { spawn } from "node:child_process";
import { parseProgressLine, runSeparation } from "./separator";

const spawnMock = vi.mocked(spawn);

class FakeStream extends EventEmitter {
	setEncoding(_enc: string): this {
		return this;
	}
}

class FakeChild extends EventEmitter {
	stderr = new FakeStream();
	stdout = new FakeStream();
	killSignal: NodeJS.Signals | undefined;
	kill(signal: NodeJS.Signals = "SIGTERM"): boolean {
		this.killSignal = signal;
		this.emit("exit", null, signal);
		return true;
	}
}

describe("parseProgressLine", () => {
	it.each([
		[" 25%|##5       | 25/100 [00:08<00:24,  3.06it/s]", 25],
		["100%|##########| 100/100 [00:30<00:00, 3.30it/s]", 100],
		["  0%|          | 0/100", 0],
		["progress: 42%", 42],
	])("parses %j as %i", (line, expected) => {
		expect(parseProgressLine(line)).toBe(expected);
	});

	it.each([
		"no percent here",
		"",
		"abc 200%",
	])("returns null for %j", (line) => {
		expect(parseProgressLine(line)).toBeNull();
	});
});

describe("runSeparation", () => {
	beforeEach(() => {
		spawnMock.mockReset();
	});

	it("builds the six-stems CLI args correctly", async () => {
		const child = new FakeChild();
		spawnMock.mockReturnValue(child as any);

		const promise = runSeparation({
			mode: "six_stems",
			inputFile: "/tmp/input/track42.mp3",
			outputDir: "/tmp/out",
		});

		queueMicrotask(() => child.emit("exit", 0, null));
		const result = await promise;

		expect(spawnMock).toHaveBeenCalledTimes(1);
		const [, args] = spawnMock.mock.calls[0];
		expect(args).toEqual([
			"-n",
			"htdemucs_6s",
			"--mp3",
			"--mp3-bitrate",
			"320",
			"--device",
			"cpu",
			"-o",
			"/tmp/out",
			"/tmp/input/track42.mp3",
		]);
		expect(result.model).toBe("htdemucs_6s");
		expect(result.stemsDir.replace(/\\/g, "/")).toBe(
			"/tmp/out/htdemucs_6s/track42",
		);
	});

	it("adds --two-stems vocals and uses htdemucs in two_stems mode", async () => {
		const child = new FakeChild();
		spawnMock.mockReturnValue(child as any);

		const promise = runSeparation({
			mode: "two_stems",
			inputFile: "/tmp/input/song.mp3",
			outputDir: "/tmp/out",
		});

		queueMicrotask(() => child.emit("exit", 0, null));
		const result = await promise;

		const [, args] = spawnMock.mock.calls[0];
		expect(args).toContain("--two-stems");
		expect(args).toContain("vocals");
		expect(args).toContain("htdemucs");
		expect(args).not.toContain("htdemucs_6s");
		expect(result.model).toBe("htdemucs");
	});

	it("forwards parsed progress to onProgress, deduplicating identical values", async () => {
		const child = new FakeChild();
		spawnMock.mockReturnValue(child as any);

		const onProgress = vi.fn();
		const promise = runSeparation({
			mode: "six_stems",
			inputFile: "/tmp/input/track.mp3",
			outputDir: "/tmp/out",
			onProgress,
		});

		child.stderr.emit(
			"data",
			" 10%|##        | 10/100 [00:01<00:09]\n 10%|##        | 10/100 [00:01<00:09]\n 50%|#####     | 50/100 [00:05<00:05]\n",
		);
		queueMicrotask(() => child.emit("exit", 0, null));
		await promise;

		expect(onProgress.mock.calls.map((c) => c[0])).toEqual([10, 50]);
	});

	it("rejects when demucs exits non-zero, surfacing the tail of stderr", async () => {
		const child = new FakeChild();
		spawnMock.mockReturnValue(child as any);

		const promise = runSeparation({
			mode: "six_stems",
			inputFile: "/tmp/input/track.mp3",
			outputDir: "/tmp/out",
		});

		child.stderr.emit("data", "loading model\n");
		child.stderr.emit("data", "RuntimeError: model not found\n");
		queueMicrotask(() => child.emit("exit", 1, null));

		await expect(promise).rejects.toThrow(/code=1/);
		await expect(promise).rejects.toThrow(/model not found/);
	});

	it("rejects when spawn errors out", async () => {
		const child = new FakeChild();
		spawnMock.mockReturnValue(child as any);

		const promise = runSeparation({
			mode: "six_stems",
			inputFile: "/tmp/input/track.mp3",
			outputDir: "/tmp/out",
		});

		queueMicrotask(() => child.emit("error", new Error("ENOENT demucs")));

		await expect(promise).rejects.toThrow(/ENOENT demucs/);
	});

	it("respects the demucsBin override", async () => {
		const child = new FakeChild();
		spawnMock.mockReturnValue(child as any);

		const promise = runSeparation(
			{
				mode: "six_stems",
				inputFile: "/tmp/input/x.mp3",
				outputDir: "/tmp/out",
			},
			{ demucsBin: "/opt/demucs-venv/bin/demucs" },
		);
		queueMicrotask(() => child.emit("exit", 0, null));
		await promise;

		expect(spawnMock.mock.calls[0][0]).toBe("/opt/demucs-venv/bin/demucs");
	});

	it("kills the child on AbortSignal and rejects", async () => {
		const child = new FakeChild();
		spawnMock.mockReturnValue(child as any);

		const ac = new AbortController();
		const promise = runSeparation({
			mode: "six_stems",
			inputFile: "/tmp/input/x.mp3",
			outputDir: "/tmp/out",
			signal: ac.signal,
		});

		ac.abort();

		await expect(promise).rejects.toThrow();
		expect(child.killSignal).toBe("SIGTERM");
	});
});
