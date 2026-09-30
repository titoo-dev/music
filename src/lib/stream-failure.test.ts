import { describe, it, expect, vi } from "vitest";
import { classifyStreamFailure, diagnoseStreamFailure } from "./stream-failure";

function jsonResponse(status: number, code: string, message = "msg") {
	return new Response(JSON.stringify({ success: false, error: { code, message } }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

describe("classifyStreamFailure", () => {
	it("flags a signed-out 401 as auth (was: guest play retried 3× then skipped the queue with 'Can't play')", () => {
		expect(classifyStreamFailure(401, "NOT_AUTHENTICATED")).toBe("auth");
	});

	it("treats a 401 without a code as auth", () => {
		expect(classifyStreamFailure(401)).toBe("auth");
	});

	it("flags a missing or invalid Deezer ARL as deezer, even though the invalid ARL is a 401", () => {
		expect(classifyStreamFailure(403, "NO_DEEZER_ARL")).toBe("deezer");
		expect(classifyStreamFailure(401, "DEEZER_LOGIN_FAILED")).toBe("deezer");
	});

	it("keeps everything else track-scoped", () => {
		expect(classifyStreamFailure(404, "TRACK_NOT_FOUND")).toBe("track");
		expect(classifyStreamFailure(500, "DEEZER_ERROR")).toBe("track");
		expect(classifyStreamFailure(500)).toBe("track");
	});
});

describe("diagnoseStreamFailure", () => {
	it("returns auth with the server's code and message on a 401", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(
			jsonResponse(401, "NOT_AUTHENTICATED", "Please sign in to continue.")
		);
		const d = await diagnoseStreamFailure("/api/v1/stream-progressive/1", fetchImpl);
		expect(d).toMatchObject({
			kind: "auth",
			status: 401,
			code: "NOT_AUTHENTICATED",
			message: "Please sign in to continue.",
		});
		expect(fetchImpl).toHaveBeenCalledWith(
			"/api/v1/stream-progressive/1",
			expect.objectContaining({ credentials: "include" })
		);
	});

	it("keeps a raw body slice when the error body is not JSON", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(new Response("x".repeat(600), { status: 502 }));
		const d = await diagnoseStreamFailure("/s", fetchImpl);
		expect(d.kind).toBe("track");
		expect(d.status).toBe(502);
		expect(d.code).toBeUndefined();
		expect(d.body).toHaveLength(500);
	});

	it("treats an OK response as a media problem and cancels the body without draining it", async () => {
		const cancel = vi.fn().mockResolvedValue(undefined);
		const res = new Response("audio", { status: 200 });
		Object.defineProperty(res, "body", { value: { cancel } });
		const d = await diagnoseStreamFailure("/s", vi.fn().mockResolvedValue(res));
		expect(d).toMatchObject({ kind: "track", status: 200 });
		expect(cancel).toHaveBeenCalled();
	});

	it("falls back to track when the probe itself fails", async () => {
		const d = await diagnoseStreamFailure("/s", vi.fn().mockRejectedValue(new TypeError("offline")));
		expect(d.kind).toBe("track");
		expect(d.status).toBeUndefined();
		expect(d.error).toBeInstanceOf(TypeError);
	});
});
