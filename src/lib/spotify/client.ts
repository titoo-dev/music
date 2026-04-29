// Server-only Spotify client using Client Credentials.
// Token is cached in-process; refreshed ~1 min before expiry.

import got, { type Got } from "got";

export class SpotifyConfigError extends Error {
	code = "SPOTIFY_NOT_CONFIGURED";
}

export class SpotifyAPIError extends Error {
	code = "SPOTIFY_API_ERROR";
	constructor(message: string, public status?: number) {
		super(message);
	}
}

interface CachedToken {
	value: string;
	expiresAt: number;
}

let cachedToken: CachedToken | null = null;
let inflight: Promise<string> | null = null;

function readCredentials() {
	const clientId = process.env.SPOTIFY_CLIENT_ID;
	const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new SpotifyConfigError(
			"SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set."
		);
	}
	return { clientId, clientSecret };
}

async function fetchToken(): Promise<string> {
	const { clientId, clientSecret } = readCredentials();
	const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

	let body: { access_token?: string; expires_in?: number };
	try {
		body = await got
			.post("https://accounts.spotify.com/api/token", {
				headers: {
					Authorization: `Basic ${basic}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				form: { grant_type: "client_credentials" },
			})
			.json();
	} catch (e) {
		const err = e as { response?: { statusCode?: number; body?: unknown }; message?: string };
		throw new SpotifyAPIError(
			`Token request failed: ${err.message ?? "unknown error"}`,
			err.response?.statusCode
		);
	}

	if (!body.access_token || !body.expires_in) {
		throw new SpotifyAPIError("Token response missing access_token/expires_in");
	}

	cachedToken = {
		value: body.access_token,
		expiresAt: Date.now() + (body.expires_in - 60) * 1000,
	};
	return cachedToken.value;
}

async function getAccessToken(): Promise<string> {
	if (cachedToken && cachedToken.expiresAt > Date.now()) {
		return cachedToken.value;
	}
	if (inflight) return inflight;
	inflight = fetchToken().finally(() => {
		inflight = null;
	});
	return inflight;
}

const baseClient: Got = got.extend({
	prefixUrl: "https://api.spotify.com/v1/",
	responseType: "json",
	throwHttpErrors: false,
	retry: { limit: 0 },
});

export async function spotifyGet<T = unknown>(
	path: string,
	searchParams?: Record<string, string | number>
): Promise<T> {
	const token = await getAccessToken();
	const cleanPath = path.replace(/^\/+/, "");

	for (let attempt = 0; attempt < 2; attempt++) {
		const res = await baseClient.get(cleanPath, {
			searchParams,
			headers: { Authorization: `Bearer ${token}` },
		});

		if (res.statusCode === 401 && attempt === 0) {
			cachedToken = null;
			continue;
		}
		if (res.statusCode === 429) {
			const retryAfter = Number(res.headers["retry-after"] ?? 1);
			await new Promise((r) => setTimeout(r, Math.min(retryAfter, 10) * 1000));
			continue;
		}
		if (res.statusCode >= 200 && res.statusCode < 300) {
			return res.body as T;
		}

		const bodyMessage =
			(res.body as { error?: { message?: string } })?.error?.message ??
			res.statusMessage ??
			"Unknown error";
		throw new SpotifyAPIError(
			`GET ${cleanPath} failed: ${bodyMessage}`,
			res.statusCode
		);
	}

	throw new SpotifyAPIError(`GET ${cleanPath} failed after retries`);
}

// Test hook — clears cached token (used in dev when rotating creds).
export function _resetSpotifyToken() {
	cachedToken = null;
}
