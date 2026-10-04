import { describe, it, expect, vi } from "vitest";
import { classifySource, isMixedContent, needsResign, planRecovery, resolvePlaybackUrl } from "./source";
import { createPresignedUrls } from "./presigned-urls";
import type { TimeRangesLike } from "@/lib/seek";

function ranges(...pairs: [number, number][]): TimeRangesLike {
	return { length: pairs.length, start: (i) => pairs[i][0], end: (i) => pairs[i][1] };
}

describe("classifySource", () => {
	it("tells the four sources apart", () => {
		expect(classifySource("blob:https://app/1")).toBe("blob");
		expect(classifySource("https://app/api/v1/stream-progressive/1?preview=1")).toBe("progressive");
		expect(classifySource("/api/v1/stream/1")).toBe("proxy");
		expect(classifySource("https://bucket.r2.cloudflarestorage.com/t/1.flac?X-Amz-Signature=x")).toBe("presigned");
	});

	it("doesn't take a blob URL for a presigned one (was: a corrupt blob disabled presigned playback)", () => {
		expect(classifySource("blob:https://app/abc")).not.toBe("presigned");
	});

	it("treats an emptied element (src resolves to the page) as no source", () => {
		expect(classifySource("")).toBe("none");
		expect(classifySource(null)).toBe("none");
		expect(classifySource("https://app/playlist/1", "https://app")).toBe("none");
		expect(classifySource("about:blank")).toBe("none");
	});
});

describe("isMixedContent", () => {
	it("flags http audio on an https page only", () => {
		expect(isMixedContent("http://r2/a", "https:")).toBe(true);
		expect(isMixedContent("https://r2/a", "https:")).toBe(false);
		expect(isMixedContent("http://r2/a", "http:")).toBe(false);
	});
});

describe("planRecovery", () => {
	const base = { resigned: false, urlExpired: false, retryCount: 0, maxRetries: 2, knownGuest: false };

	it("removes a failing blob instead of retrying it", () => {
		expect(planRecovery({ ...base, source: "blob" })).toEqual({ action: "evict-blob" });
	});

	it("re-signs an expired presigned URL once (was: a 403 after a long pause killed presigned playback for the session)", () => {
		expect(planRecovery({ ...base, source: "presigned", urlExpired: true })).toEqual({ action: "resign" });
		expect(planRecovery({ ...base, source: "presigned", urlExpired: true, resigned: true })).toEqual({
			action: "proxy",
		});
	});

	it("goes straight to the proxy when a still-valid presigned URL fails (storage unreachable)", () => {
		expect(planRecovery({ ...base, source: "presigned" })).toEqual({ action: "proxy" });
	});

	it("retries the network stream with a growing delay, then gives up", () => {
		expect(planRecovery({ ...base, source: "progressive" })).toEqual({ action: "retry", delayMs: 1000 });
		expect(planRecovery({ ...base, source: "proxy", retryCount: 1 })).toEqual({ action: "retry", delayMs: 2000 });
		expect(planRecovery({ ...base, source: "progressive", retryCount: 2 })).toEqual({ action: "give-up" });
		expect(planRecovery({ ...base, source: "none" })).toEqual({ action: "retry", delayMs: 1000 });
	});

	it("gives up at once for a signed-out user", () => {
		expect(planRecovery({ ...base, source: "progressive", knownGuest: true })).toEqual({ action: "give-up" });
	});
});

describe("needsResign", () => {
	const now = 1_000_000;
	it("re-signs before resuming on an expired URL (was: a 403 then a restart from 0 after a long pause)", () => {
		expect(
			needsResign({ usableUntil: now - 1, now, currentTime: 60, duration: 200, buffered: ranges([0, 90]) })
		).toBe(true);
	});

	it("leaves a valid or unknown URL alone", () => {
		expect(needsResign({ usableUntil: now + 1, now, currentTime: 60, duration: 200, buffered: ranges() })).toBe(false);
		expect(needsResign({ usableUntil: null, now, currentTime: 60, duration: 200, buffered: ranges() })).toBe(false);
	});

	it("doesn't bother when the rest of the track is buffered", () => {
		expect(
			needsResign({ usableUntil: now - 1, now, currentTime: 60, duration: 200, buffered: ranges([0, 200]) })
		).toBe(false);
	});

	it("re-signs when the duration is unknown", () => {
		expect(needsResign({ usableUntil: now - 1, now, currentTime: 0, duration: NaN, buffered: ranges() })).toBe(true);
	});
});

describe("resolvePlaybackUrl", () => {
	function urlsWith(data: unknown) {
		const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ data }), { status: 200 }));
		return { urls: createPresignedUrls({ fetchImpl: fetchImpl as unknown as typeof fetch }), fetchImpl };
	}

	it("prefers the IndexedDB blob", async () => {
		const { urls, fetchImpl } = urlsWith({ url: "https://r2/a" });
		expect(await resolvePlaybackUrl("a", { urls, blobUrl: async () => "blob:x" })).toBe("blob:x");
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("skips the blob when asked (after a corrupt blob was removed)", async () => {
		const { urls } = urlsWith({ url: "https://r2/a" });
		const blobUrl = vi.fn(async () => "blob:x");
		expect(await resolvePlaybackUrl("a", { urls, blobUrl, skipBlob: true })).toBe("https://r2/a");
		expect(blobUrl).not.toHaveBeenCalled();
	});

	it("falls back to the progressive stream, or a non-persisting preview stream", async () => {
		const { urls } = urlsWith({ url: null, status: "not_cached" });
		expect(await resolvePlaybackUrl("a", { urls, blobUrl: async () => null })).toBe("/api/v1/stream-progressive/a");
		expect(await resolvePlaybackUrl("a", { urls, persist: false })).toBe("/api/v1/stream-progressive/a?preview=1");
	});

	it("refuses a mixed-content URL for that track only (was: disabled presigned URLs for the session)", async () => {
		const { urls } = urlsWith({ url: "http://r2/a" });
		expect(await resolvePlaybackUrl("a", { urls, pageProtocol: "https:" })).toBe("/api/v1/stream-progressive/a");
		expect(urls.isDenied("a")).toBe(true);
		expect(urls.isDenied("b")).toBe(false);
	});

	it("survives a failing blob lookup", async () => {
		const { urls } = urlsWith({ url: "https://r2/a" });
		expect(
			await resolvePlaybackUrl("a", { urls, blobUrl: () => Promise.reject(new Error("idb")) })
		).toBe("https://r2/a");
	});
});
