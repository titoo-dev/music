import { describe, it, expect } from "vitest";
import { parseLrc, hasUsableSync, formatLrcTime } from "./lrc";
import { deezerSyncToLrc } from "./deezer-sync";

describe("parseLrc", () => {
	it("parses standard [mm:ss.xx] lines and sorts them", () => {
		expect(parseLrc("[00:05.50]b\n[00:01.00]a")).toEqual([
			{ time: 1, text: "a" },
			{ time: 5.5, text: "b" },
		]);
	});

	it("accepts 1–3 digit fractions, no fraction, ':' separator and long minutes", () => {
		const lines = parseLrc("[00:01.5]a\n[00:02.123]b\n[00:03]c\n[00:04:25]d\n[100:00.00]e");
		expect(lines.map((l) => l.time)).toEqual([1.5, 2.123, 3, 4.25, 6000]);
	});

	it("expands repeated timestamps on one line (was: chorus lines with two stamps were dropped)", () => {
		expect(parseLrc("[00:10.00][01:20.00]Chorus")).toEqual([
			{ time: 10, text: "Chorus" },
			{ time: 80, text: "Chorus" },
		]);
	});

	it("handles CRLF, BOM, metadata headers and blank lines", () => {
		expect(parseLrc("﻿[ar:Artist]\r\n[ti:Title]\r\n\r\n[00:01.00]a\r\n")).toEqual([{ time: 1, text: "a" }]);
	});

	it("applies [offset:±ms] (positive shows lyrics earlier)", () => {
		expect(parseLrc("[offset:+500]\n[00:01.00]a")[0].time).toBe(0.5);
		expect(parseLrc("[offset:-250]\n[00:01.00]a")[0].time).toBe(1.25);
		expect(parseLrc("[offset:+5000]\n[00:01.00]a")[0].time).toBe(0);
	});

	it("strips enhanced-LRC word timings", () => {
		expect(parseLrc("[00:01.00]<00:01.00>Hello <00:01.50>world")[0].text).toBe("Hello world");
	});

	it("keeps empty (instrumental break) lines", () => {
		expect(parseLrc("[00:01.00]a\n[00:09.00]")).toEqual([
			{ time: 1, text: "a" },
			{ time: 9, text: "" },
		]);
	});
});

describe("hasUsableSync", () => {
	it("needs at least two timed lines at distinct times", () => {
		expect(hasUsableSync(null)).toBe(false);
		expect(hasUsableSync("")).toBe(false);
		expect(hasUsableSync("plain text only")).toBe(false);
		expect(hasUsableSync("[00:00.00]a\n[00:00.00]b")).toBe(false);
		expect(hasUsableSync("[00:01.00]a\n[00:02.00]")).toBe(false);
		expect(hasUsableSync("[00:01.00]a\n[00:02.00]b")).toBe(true);
	});
});

describe("formatLrcTime", () => {
	it("formats seconds as [mm:ss.xx]", () => {
		expect(formatLrcTime(0)).toBe("[00:00.00]");
		expect(formatLrcTime(83.456)).toBe("[01:23.46]");
		expect(formatLrcTime(-1)).toBe("[00:00.00]");
	});
});

describe("deezerSyncToLrc", () => {
	it("returns null for non-arrays and empty input", () => {
		expect(deezerSyncToLrc(undefined)).toBeNull();
		expect(deezerSyncToLrc("x")).toBeNull();
		expect(deezerSyncToLrc([])).toBeNull();
	});

	it("builds LRC from milliseconds and decodes HTML entities (was: '&#039;' shown in lyrics)", () => {
		expect(
			deezerSyncToLrc([
				{ lrc_timestamp: "[00:01.00]", milliseconds: "1000", line: "I&#039;m here" },
				{ lrc_timestamp: "[00:02.50]", milliseconds: 2500, line: "Rock &amp; roll" },
			])
		).toBe("[00:01.00]I'm here\n[00:02.50]Rock & roll");
	});

	it("falls back to lrc_timestamp and skips entries without any timing", () => {
		expect(
			deezerSyncToLrc([
				null,
				{ lrc_timestamp: "[00:03.00]", line: "a" },
				{ milliseconds: "", lrc_timestamp: "[00:04.00]" },
				{ line: "no time" },
			])
		).toBe("[00:03.00]a\n[00:04.00]");
	});
});
