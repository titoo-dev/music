// Spawns Demucs and parses tqdm-style progress lines from stderr. Pure
// orchestration — no S3 / DB concerns; the pipeline glues this together.

import { spawn } from "node:child_process";
import path from "node:path";

export type SeparationMode = "two_stems" | "six_stems";

export interface SeparatorConfig {
	demucsBin?: string;
	twoStemsModel?: string;
	sixStemsModel?: string;
	mp3Bitrate?: number;
}

export interface SeparatorRunOptions {
	mode: SeparationMode;
	inputFile: string;
	outputDir: string;
	onProgress?: (percent: number) => void;
	signal?: AbortSignal;
}

export interface SeparatorResult {
	model: string;
	stemsDir: string;
}

const DEFAULT_TWO_STEMS_MODEL = "htdemucs";
const DEFAULT_SIX_STEMS_MODEL = "htdemucs_6s";
const DEFAULT_MP3_BITRATE = 320;

function buildArgs(
	options: SeparatorRunOptions,
	config: Required<SeparatorConfig>,
): { args: string[]; model: string } {
	const model =
		options.mode === "two_stems"
			? config.twoStemsModel
			: config.sixStemsModel;

	const args: string[] = [
		"-n",
		model,
		"--mp3",
		"--mp3-bitrate",
		String(config.mp3Bitrate),
		"--device",
		"cpu",
		"-o",
		options.outputDir,
	];

	if (options.mode === "two_stems") {
		args.push("--two-stems", "vocals");
	}

	args.push(options.inputFile);
	return { args, model };
}

// Demucs writes tqdm progress to stderr. Lines look like:
//   ` 25%|##5       | 25/100 [00:08<00:24,  3.06it/s]`
// We pull the first percent we see on each line and forward it.
const PROGRESS_RE = /\b(\d{1,3})\s*%/;

export function parseProgressLine(line: string): number | null {
	const m = line.match(PROGRESS_RE);
	if (!m) return null;
	const n = parseInt(m[1], 10);
	if (!Number.isFinite(n) || n < 0 || n > 100) return null;
	return n;
}

export async function runSeparation(
	options: SeparatorRunOptions,
	configOverrides: SeparatorConfig = {},
): Promise<SeparatorResult> {
	const config: Required<SeparatorConfig> = {
		demucsBin: configOverrides.demucsBin ?? "demucs",
		twoStemsModel: configOverrides.twoStemsModel ?? DEFAULT_TWO_STEMS_MODEL,
		sixStemsModel: configOverrides.sixStemsModel ?? DEFAULT_SIX_STEMS_MODEL,
		mp3Bitrate: configOverrides.mp3Bitrate ?? DEFAULT_MP3_BITRATE,
	};

	const { args, model } = buildArgs(options, config);

	return new Promise<SeparatorResult>((resolve, reject) => {
		const child = spawn(config.demucsBin, args, {
			stdio: ["ignore", "pipe", "pipe"],
		});

		let lastProgress = -1;
		let stderrBuffer = "";

		const onAbort = () => {
			child.kill("SIGTERM");
		};
		options.signal?.addEventListener("abort", onAbort, { once: true });

		child.stderr.setEncoding("utf8");
		child.stderr.on("data", (chunk: string) => {
			stderrBuffer += chunk;
			const lines = chunk.split(/\r?\n|\r/);
			for (const line of lines) {
				const pct = parseProgressLine(line);
				if (pct !== null && pct !== lastProgress) {
					lastProgress = pct;
					options.onProgress?.(pct);
				}
			}
			// Trim buffer to avoid unbounded growth.
			if (stderrBuffer.length > 8192) {
				stderrBuffer = stderrBuffer.slice(-4096);
			}
		});

		child.on("error", (err) => {
			options.signal?.removeEventListener("abort", onAbort);
			reject(err);
		});

		child.on("exit", (code, signal) => {
			options.signal?.removeEventListener("abort", onAbort);
			if (code === 0) {
				const baseName = path.basename(
					options.inputFile,
					path.extname(options.inputFile),
				);
				const stemsDir = path.join(options.outputDir, model, baseName);
				resolve({ model, stemsDir });
				return;
			}
			const msg = stderrBuffer.trim().split(/\r?\n/).slice(-3).join("\n");
			reject(
				new Error(
					`demucs exited with code=${code} signal=${signal}\n${msg}`,
				),
			);
		});
	});
}
