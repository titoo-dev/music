// Classifies why a stream route refused to serve audio. "auth" and "deezer"
// failures hit every track in the queue, so the player must stop and tell
// the user what to fix instead of retrying and skipping track after track.

export type StreamFailureKind = "auth" | "deezer" | "track";

export interface StreamDiagnosis {
	kind: StreamFailureKind;
	status?: number;
	code?: string;
	message?: string;
	body?: string;
	url?: string;
	error?: unknown;
}

const DEEZER_CODES = new Set(["NO_DEEZER_ARL", "DEEZER_LOGIN_FAILED"]);

export function classifyStreamFailure(status: number, code?: string): StreamFailureKind {
	// DEEZER_LOGIN_FAILED is also a 401 — check it before the generic 401.
	if (code && DEEZER_CODES.has(code)) return "deezer";
	if (status === 401) return "auth";
	return "track";
}

// Re-fetches the failing URL once with credentials to read the server's
// actual error. The <audio> element only reports "Format error" for a JSON
// 401, so this is the only way to learn the real cause client-side.
export async function diagnoseStreamFailure(
	url: string,
	fetchImpl: typeof fetch = fetch,
	timeoutMs = 5000
): Promise<StreamDiagnosis> {
	try {
		const res = await fetchImpl(url, {
			credentials: "include",
			signal: AbortSignal.timeout(timeoutMs),
		});
		if (res.ok) {
			// Don't drain a successful audio stream
			res.body?.cancel().catch(() => {});
			return { kind: "track", status: res.status, url: res.url };
		}
		const body = await res.text().catch(() => "");
		let code: string | undefined;
		let message: string | undefined;
		try {
			const parsed = JSON.parse(body);
			code = parsed?.error?.code;
			message = parsed?.error?.message;
		} catch {
			// Non-JSON body — keep the raw slice below
		}
		return {
			kind: classifyStreamFailure(res.status, code),
			status: res.status,
			code,
			message,
			body: body.slice(0, 500),
			url: res.url,
		};
	} catch (error) {
		return { kind: "track", error };
	}
}
