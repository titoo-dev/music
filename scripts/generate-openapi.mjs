// Generates openapi.json (the API contract consumed by the Flutter app).
// Run: npm run openapi — then npm run openapi:dart to regenerate clients/dart.
// Keep in sync with src/app/api/v1/** whenever a route changes.

import { writeFileSync } from "node:fs";

const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const str = (extra = {}) => ({ type: "string", ...extra });
const nstr = (extra = {}) => ({ type: "string", nullable: true, ...extra });
const int = (extra = {}) => ({ type: "integer", ...extra });
const nint = (extra = {}) => ({ type: "integer", nullable: true, ...extra });
const bool = (extra = {}) => ({ type: "boolean", ...extra });
const dt = (extra = {}) => ({ type: "string", format: "date-time", ...extra });
const ndt = (extra = {}) => ({ type: "string", format: "date-time", nullable: true, ...extra });
const arr = (items, extra = {}) => ({ type: "array", items, ...extra });
const obj = (properties, required = [], extra = {}) => ({
	type: "object",
	properties,
	...(required.length ? { required } : {}),
	...extra,
});
const freeform = (description) => ({ type: "object", additionalProperties: true, description });

// ── Envelope helpers ──
const envelopes = {};
function env(name, dataSchema) {
	envelopes[name] = obj(
		{ success: bool({ enum: [true] }), data: dataSchema },
		["success", "data"]
	);
	return ref(name);
}
const json = (schema) => ({ "application/json": { schema } });
const okRes = (envName, dataSchema, description = "OK", status = "200") => ({
	[status]: { description, content: json(env(envName, dataSchema)) },
});
const err = (description) => ({ $ref: `#/components/responses/${description}` });
const body = (schema, required = true) => ({ required, content: json(schema) });
const pathParam = (name, description) => ({
	name,
	in: "path",
	required: true,
	description,
	schema: str(),
});
const query = (name, schema, description, required = false) => ({
	name,
	in: "query",
	required,
	description,
	schema,
});

const userAuth = [{ bearerAuth: [] }, { sessionCookie: [] }];
const optionalAuth = [{ bearerAuth: [] }, { sessionCookie: [] }, {}];
const noAuth = [];

// Common error sets
const E_USER = { 401: err("NotAuthenticated"), 500: err("InternalError") };
const E_DEEZER = {
	401: err("NotAuthenticatedOrDeezerLoginFailed"),
	403: err("NoDeezerArl"),
	500: err("InternalError"),
};
const E_GUEST = { 503: err("NoDeezer"), 500: err("InternalError") };
const E_400 = { 400: err("BadRequest") };
const E_404 = { 404: err("NotFound") };

const audioBinary = {
	"audio/mpeg": { schema: { type: "string", format: "binary" } },
	"audio/flac": { schema: { type: "string", format: "binary" } },
};

// ── Schemas ──
const schemas = {
	ErrorResponse: obj(
		{
			success: bool({ enum: [false] }),
			error: obj(
				{
					code: str({
						description: "Machine-readable error code (see `x-error-codes`).",
						example: "NOT_AUTHENTICATED",
					}),
					message: str({ example: "Please sign in to continue." }),
				},
				["code", "message"]
			),
		},
		["success", "error"]
	),

	AuthUser: obj(
		{ id: str(), name: str(), email: str({ format: "email" }), image: nstr({ format: "uri" }) },
		["id", "name", "email"]
	),

	DeezerUser: obj(
		{
			id: { oneOf: [int(), str()], description: "Deezer USER_ID" },
			name: str(),
			picture: str({ description: "Deezer picture hash (build URL via e-cdns-images.dzcdn.net/images/user/{hash}/...)" }),
			license_token: str(),
			can_stream_hq: bool(),
			can_stream_lossless: bool(),
			country: str(),
			language: str(),
			loved_tracks: { oneOf: [int(), str()], description: "Loved-tracks playlist id (may be absent)" },
		},
		[],
		{ description: "Deezer may send extra keys; they are ignored." }
	),

	DeezerLoginResult: obj(
		{
			user: ref("DeezerUser"),
			childs: arr(ref("DeezerUser"), { description: "Family / child accounts" }),
			currentChild: int({ description: "Index of the selected account in `childs`" }),
			hasMultipleAccounts: bool(),
		},
		["user", "childs", "currentChild", "hasMultipleAccounts"]
	),

	ChangeAccountResult: obj(
		{ user: ref("DeezerUser"), selectedAccount: int(), childs: arr(ref("DeezerUser")) },
		["user", "selectedAccount", "childs"]
	),

	Settings: freeform(
		"Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`."
	),

	SettingsBundle: obj(
		{
			settings: ref("Settings"),
			defaultSettings: ref("Settings"),
			spotifySettings: { ...freeform("Spotify plugin settings (may be absent)."), nullable: true },
		},
		["settings", "defaultSettings"]
	),

	ConnectStatus: obj(
		{
			authenticated: bool({ description: "A better-auth session is present" }),
			user: { type: "object", allOf: [ref("AuthUser")], nullable: true },
			deezerLoggedIn: bool(),
			deezerUser: { type: "object", allOf: [ref("DeezerUser")], nullable: true },
			deezerAvailable: str({ enum: ["yes", "no", "no-network"] }),
			settings: { ...freeform("Same shape as SettingsBundle, or `{}` if the app is not initialized.") },
		},
		["authenticated", "user", "deezerLoggedIn", "deezerUser", "deezerAvailable", "settings"]
	),

	MessageResult: obj({ message: str() }, ["message"]),

	// Raw Deezer payloads — passed through untouched
	DeezerPage: freeform("Raw Deezer GW page payload (`gw.get_page`). Contains `sections[]` with `items[]`."),
	DeezerApiList: obj(
		{
			data: arr(freeform("Deezer public API object (track / album / artist / playlist)")),
			total: int(),
			next: str({ format: "uri" }),
			prev: str({ format: "uri" }),
		},
		[],
		{ description: "Paginated Deezer public API list (api.deezer.com)." }
	),
	DeezerTracklist: freeform(
		"Raw Deezer GW payload. `type=album` → album page + `tracks[]`; `type=playlist` → playlist page + `tracks[]`; `type=artist` → artist page + `topTracks[]` + `discography`. GW objects use uppercase keys (SNG_ID, ALB_ID, ART_ID, …)."
	),
	DeezerSearchMain: freeform(
		"Merged GW search payload with `TRACK`, `ALBUM`, `ARTIST`, `PLAYLIST`, `TOP_RESULT`, `ORDER`, … Each bucket is `{ data: [], count }`. Items are GW objects (uppercase keys) possibly mixed with public-API objects (lowercase keys) appended for extra coverage."
	),

	SuggestTrack: obj(
		{
			source: str({ enum: ["deezer"] }),
			sourceId: str(),
			deezerTrackId: str(),
			title: str(),
			artists: arr(str()),
			artistId: nstr(),
			album: str(),
			albumId: nstr(),
			durationMs: int(),
			coverUrl: nstr({ format: "uri" }),
		},
		["source", "sourceId", "deezerTrackId", "title", "artists", "artistId", "album", "albumId", "durationMs", "coverUrl"]
	),
	SuggestAlbum: obj(
		{
			source: str({ enum: ["deezer"] }),
			sourceId: str(),
			deezerAlbumId: str(),
			title: str(),
			artists: arr(str()),
			coverUrl: nstr({ format: "uri" }),
		},
		["source", "sourceId", "deezerAlbumId", "title", "artists", "coverUrl"]
	),
	SuggestArtist: obj(
		{
			source: str({ enum: ["deezer"] }),
			sourceId: str(),
			deezerArtistId: str(),
			name: str(),
			imageUrl: nstr({ format: "uri" }),
		},
		["source", "sourceId", "deezerArtistId", "name", "imageUrl"]
	),
	Suggestions: obj(
		{
			tracks: arr(ref("SuggestTrack")),
			albums: arr(ref("SuggestAlbum")),
			artists: arr(ref("SuggestArtist")),
			source: str({ enum: ["deezer"] }),
		},
		["tracks", "albums", "artists", "source"]
	),

	// Library
	TrackMetaInput: obj(
		{
			trackId: str({ description: "Deezer track id", example: "3135556" }),
			title: str(),
			artist: str(),
			album: nstr(),
			albumId: nstr({ description: "Deezer album id" }),
			coverUrl: nstr({ format: "uri" }),
			duration: nint({ description: "Seconds" }),
		},
		["trackId", "title", "artist"]
	),
	SavedTrack: obj(
		{
			id: str(),
			userId: str(),
			trackId: str(),
			title: str(),
			artist: str(),
			album: nstr(),
			albumId: nstr(),
			coverUrl: nstr(),
			duration: nint(),
			savedAt: dt(),
		},
		["id", "userId", "trackId", "title", "artist", "album", "albumId", "coverUrl", "duration", "savedAt"]
	),
	AlbumTrackInput: obj(
		{
			trackId: str(),
			title: str(),
			artist: str(),
			coverUrl: nstr(),
			duration: nint({ description: "Seconds" }),
			trackNumber: nint(),
		},
		["trackId"]
	),
	SaveAlbumInput: obj(
		{
			deezerAlbumId: str(),
			title: str(),
			artist: str(),
			coverUrl: nstr({ format: "uri" }),
			tracks: arr(ref("AlbumTrackInput")),
		},
		["deezerAlbumId", "title", "artist", "tracks"]
	),
	Album: obj(
		{
			id: str({ description: "Internal id (cuid) — use this for /library/albums/{albumId}" }),
			userId: str(),
			deezerAlbumId: str(),
			title: str(),
			artist: str(),
			coverUrl: nstr(),
			trackCount: int(),
			savedAt: dt(),
		},
		["id", "userId", "deezerAlbumId", "title", "artist", "coverUrl", "trackCount", "savedAt"]
	),
	AlbumTrack: obj(
		{
			id: str(),
			albumId: str(),
			trackId: str(),
			title: str(),
			artist: str(),
			coverUrl: nstr(),
			duration: nint(),
			trackNumber: nint(),
		},
		["id", "albumId", "trackId", "title", "artist", "coverUrl", "duration", "trackNumber"]
	),
	AlbumWithTracks: {
		allOf: [ref("Album"), obj({ tracks: arr(ref("AlbumTrack")) }, ["tracks"])],
	},
	FollowArtistInput: obj(
		{ deezerArtistId: str(), name: str(), pictureUrl: nstr({ format: "uri" }) },
		["deezerArtistId", "name"]
	),
	FollowedArtist: obj(
		{
			id: str(),
			userId: str(),
			deezerArtistId: str(),
			name: str(),
			pictureUrl: nstr(),
			followedAt: dt(),
		},
		["id", "userId", "deezerArtistId", "name", "pictureUrl", "followedAt"]
	),
	LibraryStatusInput: obj({
		trackIds: arr(str(), { description: "Deezer track ids to check" }),
		albumIds: arr(str(), { description: "Deezer album ids to check" }),
	}),
	LibraryStatus: obj(
		{
			tracks: arr(str(), { description: "Subset of trackIds that are saved" }),
			albums: arr(str(), { description: "Subset of albumIds that are saved" }),
		},
		["tracks", "albums"]
	),

	// Playlists
	Playlist: obj(
		{
			id: str(),
			userId: str(),
			title: str(),
			description: nstr(),
			coverUrl: nstr(),
			isPublic: bool(),
			createdAt: dt(),
			updatedAt: dt(),
		},
		["id", "userId", "title", "description", "coverUrl", "isPublic", "createdAt", "updatedAt"]
	),
	PlaylistSummary: {
		allOf: [
			ref("Playlist"),
			obj(
				{
					_count: obj({ tracks: int() }, ["tracks"]),
					covers: arr(str(), { description: "Cover URLs of the first 4 tracks" }),
					containsTrack: bool({ description: "Only present when `?trackId=` is passed" }),
				},
				["_count", "covers"]
			),
		],
	},
	PlaylistTrack: obj(
		{
			id: str(),
			playlistId: str(),
			trackId: str(),
			title: str(),
			artist: str(),
			album: nstr(),
			albumId: nstr(),
			coverUrl: nstr(),
			duration: nint(),
			position: int(),
			addedAt: dt(),
		},
		["id", "playlistId", "trackId", "title", "artist", "album", "albumId", "coverUrl", "duration", "position", "addedAt"]
	),
	PlaylistWithTracks: {
		allOf: [ref("Playlist"), obj({ tracks: arr(ref("PlaylistTrack")) }, ["tracks"])],
	},
	CreatePlaylistInput: obj({ title: str({ minLength: 1 }), description: nstr() }, ["title"]),
	UpdatePlaylistInput: obj({ title: str(), description: nstr() }),
	PlaylistTrackInput: obj(
		{
			trackId: str(),
			title: str(),
			artist: str(),
			album: nstr(),
			albumId: nstr(),
			coverUrl: nstr(),
			duration: nint(),
		},
		["trackId"]
	),
	SpotifyImportReport: obj(
		{
			totalSpotify: int(),
			processed: int(),
			matched: int(),
			notFound: arr(
				obj(
					{ spotifyId: str(), title: str(), artist: str(), album: str(), reason: str() },
					["spotifyId", "title", "artist", "album", "reason"]
				)
			),
			truncated: bool({ description: "true when the playlist had more than 1000 tracks" }),
			limited: bool({ description: "true when Spotify only exposed the first 100 tracks of a playlist link (paste track links for the full list)" }),
		},
		["totalSpotify", "processed", "matched", "notFound", "truncated"]
	),
	SpotifyTrack: obj(
		{
			spotifyId: str({ description: "22-char Spotify track id" }),
			title: str(),
			artists: arr(str()),
			album: str(),
			albumId: nstr(),
			durationMs: int(),
			isrc: nstr(),
			coverUrl: nstr(),
		},
		["spotifyId", "title", "artists", "durationMs"]
	),
	SpotifyTrackBatch: obj(
		{
			tracks: arr(ref("SpotifyTrack")),
			failed: arr(str(), { description: "ids Spotify did not return (removed, region-locked)" }),
			rateLimited: arr(str(), { description: "ids not read because Spotify started refusing — retry after a pause" }),
		},
		["tracks", "failed", "rateLimited"]
	),
	SpotifyImportResult: obj(
		{
			playlist: { type: "object", allOf: [ref("Playlist")], nullable: true, description: "null when no track matched" },
			report: ref("SpotifyImportReport"),
		},
		["playlist", "report"]
	),
	SpotifyPlaylist: obj(
		{
			spotifyId: str(),
			title: str(),
			description: str(),
			ownerName: str(),
			coverUrl: nstr(),
			totalTracks: int({ description: "real size of the playlist (tracks is capped at 1000)" }),
			tracks: arr(ref("SpotifyTrack")),
			source: str({ enum: ["api", "embed"] }),
			limited: bool({ description: "true when Spotify only exposed the first 100 tracks" }),
		},
		["spotifyId", "title", "totalTracks", "tracks", "source", "limited"]
	),
	SpotifyMatchResult: obj(
		{
			status: str({ enum: ["matched", "not_found"] }),
			strategy: str({ enum: ["isrc", "advanced", "advanced-clean", "fuzzy"] }),
			confidence: { type: "number", description: "0…1" },
			deezerTrackId: str(),
			title: str(),
			artist: str(),
			album: str(),
			albumId: nstr(),
			coverUrl: nstr(),
			duration: int({ description: "seconds" }),
			reason: str({ description: "why nothing matched (not_found only)" }),
		},
		["status"]
	),
	ImportedTrack: obj(
		{
			trackId: str({ description: "Deezer track id" }),
			title: str(),
			artist: str(),
			album: nstr(),
			albumId: nstr(),
			coverUrl: nstr({ description: "https only" }),
			duration: nint({ description: "seconds" }),
		},
		["trackId", "title", "artist"]
	),

	// Preferences
	UserPreferences: obj(
		{
			playlistSortOrder: str({ enum: ["asc", "desc"] }),
			albumSortOrder: str({ enum: ["asc", "desc"] }),
			preCacheSaved: bool({ description: "Warm the R2 cache when saving a track/album" }),
		},
		[],
		{ additionalProperties: false }
	),

	// Recent plays
	RecentPlay: obj(
		{
			id: str(),
			userId: str(),
			trackId: str(),
			title: str(),
			artist: str(),
			album: nstr(),
			albumId: nstr(),
			coverUrl: nstr(),
			duration: nint(),
			playedAt: dt(),
		},
		["id", "userId", "trackId", "title", "artist", "album", "albumId", "coverUrl", "duration", "playedAt"]
	),
	RecentPlayInput: obj(
		{
			trackId: str(),
			title: str({ default: "" }),
			artist: str({ default: "" }),
			album: nstr(),
			albumId: nstr(),
			coverUrl: nstr(),
			duration: nint(),
		},
		["trackId"]
	),
	SkipResult: obj({
		kept: bool(),
		reason: str({ enum: ["already_played", "anchored"] }),
		evicted: bool(),
	}, [], { description: "Either `{ kept: true, reason }` or `{ evicted: true }`." }),

	// Lyrics
	Lyrics: obj(
		{
			source: { type: "string", enum: ["lrclib", "deezer"], nullable: true },
			syncedLyrics: nstr({ description: "LRC format (`[mm:ss.xx]line` per line)" }),
			plainLyrics: nstr(),
			instrumental: bool(),
		},
		["source", "syncedLyrics", "plainLyrics", "instrumental"]
	),

	// Shares
	CreateShareInput: obj(
		{
			trackId: str(),
			title: str(),
			artist: str(),
			album: nstr(),
			coverUrl: nstr(),
			duration: nint(),
			expiresIn: { type: "number", description: "Hours until expiry. Omit for a permanent link." },
		},
		["trackId"]
	),
	SharedTrack: obj(
		{
			id: str(),
			shareId: str({ description: "Public id used in /share/t/{shareId}" }),
			trackId: str(),
			userId: str(),
			title: str(),
			artist: str(),
			album: nstr(),
			coverUrl: nstr(),
			duration: nint(),
			storedTrackId: nstr(),
			expiresAt: ndt(),
			plays: int(),
			createdAt: dt(),
		},
		["id", "shareId", "trackId", "userId", "title", "artist", "album", "coverUrl", "duration", "storedTrackId", "expiresAt", "plays", "createdAt"]
	),
	PublicShare: obj(
		{
			shareId: str(),
			title: str(),
			artist: str(),
			album: nstr(),
			coverUrl: nstr(),
			duration: nint(),
			plays: int(),
			createdAt: dt(),
			expiresAt: ndt(),
			user: obj({ name: str(), image: nstr() }, ["name", "image"]),
		},
		["shareId", "title", "artist", "album", "coverUrl", "duration", "plays", "createdAt", "expiresAt", "user"]
	),

	// Streaming
	StreamUrl: obj(
		{
			url: nstr({ format: "uri", description: "Presigned Cloudflare R2 URL, valid ~15 min. null → use /stream-progressive." }),
			contentType: str({ example: "audio/mpeg" }),
			status: str({
				enum: ["not_cached", "unsupported_storage", "file_missing", "presigned_disabled"],
				description: "Present only when `url` is null",
			}),
		},
		["url"]
	),

	// better-auth
	SocialSignInInput: obj(
		{
			provider: str({ enum: ["google"] }),
			callbackURL: str({ description: "Where to land after the OAuth redirect flow (web flow only)" }),
			disableRedirect: bool(),
			idToken: obj(
				{
					token: str({ description: "Google ID token from the native Google Sign-In SDK" }),
					accessToken: str(),
					nonce: str(),
				},
				["token"],
				{ description: "Native mobile flow: no browser redirect, session cookie set directly on the response." }
			),
		},
		["provider"]
	),
	SocialSignInResult: obj(
		{
			redirect: bool(),
			url: str({ format: "uri", description: "Google consent URL (redirect flow)" }),
			token: str({ description: "Session token (idToken flow)" }),
			user: ref("BetterAuthUser"),
		},
		[],
		{ description: "better-auth may send extra keys; they are ignored." }
	),
	BetterAuthUser: obj(
		{
			id: str(),
			name: str(),
			email: str({ format: "email" }),
			emailVerified: bool(),
			image: nstr(),
			createdAt: dt(),
			updatedAt: dt(),
		},
		["id", "name", "email"]
	),
	BetterAuthSession: obj(
		{
			session: obj(
				{
					id: str(),
					userId: str(),
					token: str(),
					expiresAt: dt(),
					createdAt: dt(),
					updatedAt: dt(),
					ipAddress: nstr(),
					userAgent: nstr(),
				},
				["id", "userId", "token", "expiresAt"]
			),
			user: ref("BetterAuthUser"),
		},
		["session", "user"]
	),
};

// ── Paths ──
const paths = {
	// ─── better-auth ───
	"/api/auth/sign-in/social": {
		post: {
			tags: ["Auth (session)"],
			operationId: "signInSocial",
			summary: "Sign in with Google (better-auth)",
			description:
				"Managed by better-auth (not the `{ success, data }` envelope). For Flutter, use the **idToken** flow: get a Google ID token with `google_sign_in` (with the web client ID as `serverClientId`), POST it here, read the `set-auth-token` response header and send it as `Authorization: Bearer <token>` on every subsequent call.",
			security: noAuth,
			requestBody: body(ref("SocialSignInInput")),
			responses: {
				200: {
					description: "Signed in (idToken) or redirect URL returned",
					headers: {
						"set-auth-token": {
							description: "Session token for `Authorization: Bearer` (bearer plugin). Store it securely.",
							schema: str(),
						},
						"Set-Cookie": {
							description: "`__Secure-better-auth.session_token` (+ `session_data` cache cookie)",
							schema: str(),
						},
					},
					content: json(ref("SocialSignInResult")),
				},
				400: { description: "Invalid provider / token" },
				401: { description: "ID token rejected" },
			},
		},
	},
	"/api/auth/get-session": {
		get: {
			tags: ["Auth (session)"],
			operationId: "getSession",
			summary: "Current better-auth session",
			description: "Returns `null` (JSON) when no valid session cookie is sent.",
			security: optionalAuth,
			responses: {
				200: {
					description: "Session or null",
					content: json({ type: "object", allOf: [ref("BetterAuthSession")], nullable: true }),
				},
			},
		},
	},
	"/api/auth/sign-out": {
		post: {
			tags: ["Auth (session)"],
			operationId: "signOut",
			summary: "Sign out (invalidate the session)",
			security: userAuth,
			requestBody: body(obj({}), false),
			responses: {
				200: { description: "Signed out", content: json(obj({ success: bool() })) },
			},
		},
	},

	// ─── Deezer auth ───
	"/api/v1/auth/connect": {
		get: {
			tags: ["Deezer account"],
			operationId: "getConnectStatus",
			summary: "Bootstrap: session + Deezer status + app settings",
			description:
				"Call at app start. Works without auth (guest). When signed in, restores the Deezer session from the stored ARL (or the server's service ARL, which is then persisted for the user).",
			security: optionalAuth,
			responses: { ...okRes("ConnectStatusEnvelope", ref("ConnectStatus")), 500: err("InternalError") },
		},
	},
	"/api/v1/auth/login-arl": {
		post: {
			tags: ["Deezer account"],
			operationId: "loginDeezerArl",
			summary: "Connect a Deezer account with an ARL cookie",
			security: userAuth,
			requestBody: body(
				obj({ arl: str({ description: "Deezer `arl` cookie value" }), child: int({ default: 0, description: "Child account index" }) }, ["arl"])
			),
			responses: {
				...okRes("DeezerLoginEnvelope", ref("DeezerLoginResult")),
				400: err("BadRequest"),
				401: err("NotAuthenticatedOrDeezerLoginFailed"),
				500: err("InternalError"),
			},
			"x-error-codes": ["NOT_AUTHENTICATED", "MISSING_ARL", "LOGIN_FAILED", "INTERNAL_ERROR"],
		},
	},
	"/api/v1/auth/login-email": {
		post: {
			tags: ["Deezer account"],
			operationId: "loginDeezerEmail",
			summary: "Connect a Deezer account with email/password",
			security: userAuth,
			requestBody: body(obj({ email: str({ format: "email" }), password: str({ format: "password" }) }, ["email", "password"])),
			responses: {
				...okRes("DeezerLoginEnvelope", ref("DeezerLoginResult")),
				400: err("BadRequest"),
				401: err("NotAuthenticatedOrDeezerLoginFailed"),
				500: err("InternalError"),
			},
			"x-error-codes": ["NOT_AUTHENTICATED", "MISSING_CREDENTIALS", "LOGIN_FAILED", "INTERNAL_ERROR"],
		},
	},
	"/api/v1/auth/change-account": {
		post: {
			tags: ["Deezer account"],
			operationId: "changeDeezerAccount",
			summary: "Switch to another Deezer family/child account",
			security: userAuth,
			requestBody: body(obj({ child: int({ description: "Index in `childs`" }) }, ["child"])),
			responses: { ...okRes("ChangeAccountEnvelope", ref("ChangeAccountResult")), ...E_400, ...E_DEEZER },
			"x-error-codes": ["MISSING_CHILD_INDEX", "NOT_AUTHENTICATED", "NO_DEEZER_ARL", "DEEZER_LOGIN_FAILED"],
		},
	},
	"/api/v1/auth/logout": {
		post: {
			tags: ["Deezer account"],
			operationId: "logoutDeezer",
			summary: "Clear the in-memory Deezer session",
			description: "Does not delete the stored ARL nor the better-auth session (use `/api/auth/sign-out`).",
			security: optionalAuth,
			responses: { ...okRes("MessageEnvelope", ref("MessageResult")), 500: err("InternalError") },
		},
	},

	// ─── Content ───
	"/api/v1/content/home": {
		get: {
			tags: ["Browse"],
			operationId: "getHome",
			summary: "Deezer explore page (home feed)",
			security: optionalAuth,
			responses: { ...okRes("DeezerPageEnvelope", ref("DeezerPage")), ...E_GUEST },
		},
	},
	"/api/v1/content/new-releases": {
		get: {
			tags: ["Browse"],
			operationId: "getNewReleases",
			summary: "Editorial new releases (100 max)",
			security: optionalAuth,
			responses: { ...okRes("DeezerApiListEnvelope", ref("DeezerApiList")), ...E_GUEST },
		},
	},
	"/api/v1/content/tracklist": {
		get: {
			tags: ["Browse"],
			operationId: "getTracklist",
			summary: "Album / playlist / artist page with tracks",
			security: optionalAuth,
			parameters: [
				query("id", str(), "Deezer id", true),
				query("type", str({ enum: ["album", "playlist", "artist"] }), "Entity type", true),
			],
			responses: { ...okRes("DeezerTracklistEnvelope", ref("DeezerTracklist")), ...E_400, ...E_GUEST },
			"x-error-codes": ["MISSING_PARAMS", "INVALID_TYPE", "NO_DEEZER"],
		},
	},

	// ─── Search ───
	"/api/v1/search": {
		get: {
			tags: ["Search"],
			operationId: "search",
			summary: "Typed search (Deezer public API)",
			security: optionalAuth,
			parameters: [
				query("term", str(), "Search query", true),
				query("type", str({ enum: ["track", "album", "artist", "playlist"], default: "track" }), "Result type"),
				query("start", int({ default: 0 }), "Offset"),
				query("nb", int({ default: 100 }), "Page size"),
			],
			responses: { ...okRes("DeezerApiListEnvelope", ref("DeezerApiList")), ...E_400, ...E_GUEST },
			"x-error-codes": ["MISSING_TERM", "INVALID_TYPE", "NO_DEEZER"],
		},
	},
	"/api/v1/search/main": {
		get: {
			tags: ["Search"],
			operationId: "searchMain",
			summary: "Global search (all buckets, GW + API merged)",
			security: optionalAuth,
			parameters: [query("term", str(), "Search query", true)],
			responses: { ...okRes("DeezerSearchMainEnvelope", ref("DeezerSearchMain")), ...E_400, ...E_GUEST },
			"x-error-codes": ["MISSING_TERM", "NO_DEEZER"],
		},
	},
	"/api/v1/search/album": {
		get: {
			tags: ["Search"],
			operationId: "searchAlbum",
			summary: "Album search",
			security: optionalAuth,
			parameters: [
				query("term", str(), "Search query", true),
				query("start", int({ default: 0 }), "Offset"),
				query("nb", int({ default: 100 }), "Page size"),
			],
			responses: { ...okRes("DeezerApiListEnvelope", ref("DeezerApiList")), ...E_400, ...E_GUEST },
		},
	},
	"/api/v1/search/suggest": {
		get: {
			tags: ["Search"],
			operationId: "searchSuggest",
			summary: "Autocomplete suggestions (normalized)",
			security: optionalAuth,
			parameters: [
				query("term", str(), "Search query", true),
				query("limit", int({ default: 5, minimum: 1, maximum: 10 }), "Per-bucket limit (clamped 1–10)"),
			],
			responses: { ...okRes("SuggestionsEnvelope", ref("Suggestions")), ...E_400, ...E_GUEST },
		},
	},

	// ─── Library ───
	"/api/v1/library/tracks": {
		get: {
			tags: ["Library"],
			operationId: "listSavedTracks",
			summary: "Liked tracks (most recent first)",
			security: userAuth,
			parameters: [
				query("limit", int({ default: 100, minimum: 1, maximum: 500 }), "Page size (0 / invalid → 100)"),
				query("offset", int({ default: 0, minimum: 0 }), "Offset"),
			],
			responses: { ...okRes("SavedTrackListEnvelope", obj({ items: arr(ref("SavedTrack")) }, ["items"])), ...E_USER },
		},
		post: {
			tags: ["Library"],
			operationId: "saveTrack",
			summary: "Like a track (upsert)",
			security: userAuth,
			requestBody: body(ref("TrackMetaInput")),
			responses: { ...okRes("SavedTrackEnvelope", obj({ saved: ref("SavedTrack") }, ["saved"])), ...E_400, ...E_USER },
			"x-error-codes": ["INVALID_BODY"],
		},
	},
	"/api/v1/library/tracks/{trackId}": {
		parameters: [pathParam("trackId", "Deezer track id")],
		get: {
			tags: ["Library"],
			operationId: "isTrackSaved",
			summary: "Is this track liked?",
			security: userAuth,
			responses: { ...okRes("SavedFlagEnvelope", obj({ saved: bool() }, ["saved"])), ...E_USER },
		},
		delete: {
			tags: ["Library"],
			operationId: "unsaveTrack",
			summary: "Unlike a track (idempotent)",
			security: userAuth,
			responses: { ...okRes("UnsavedEnvelope", obj({ unsaved: bool({ enum: [true] }) }, ["unsaved"])), ...E_USER },
		},
	},
	"/api/v1/library/albums": {
		get: {
			tags: ["Library"],
			operationId: "listSavedAlbums",
			summary: "Saved albums",
			security: userAuth,
			responses: { ...okRes("AlbumListEnvelope", obj({ items: arr(ref("Album")) }, ["items"])), ...E_USER },
		},
		post: {
			tags: ["Library"],
			operationId: "saveAlbum",
			summary: "Save an album with its tracklist (upsert, re-syncs tracks)",
			security: userAuth,
			requestBody: body(ref("SaveAlbumInput")),
			responses: { ...okRes("SavedAlbumEnvelope", obj({ saved: ref("Album") }, ["saved"])), ...E_400, ...E_USER },
			"x-error-codes": ["INVALID_BODY"],
		},
	},
	"/api/v1/library/albums/{albumId}": {
		parameters: [pathParam("albumId", "Internal Album.id (cuid), NOT the Deezer album id")],
		get: {
			tags: ["Library"],
			operationId: "getSavedAlbum",
			summary: "Saved album with tracklist",
			security: userAuth,
			responses: { ...okRes("AlbumWithTracksEnvelope", ref("AlbumWithTracks")), ...E_404, ...E_USER },
		},
		delete: {
			tags: ["Library"],
			operationId: "unsaveAlbum",
			summary: "Remove a saved album",
			security: userAuth,
			responses: { ...okRes("UnsavedEnvelope", obj({ unsaved: bool({ enum: [true] }) }, ["unsaved"])), ...E_404, ...E_USER },
		},
	},
	"/api/v1/library/artists": {
		get: {
			tags: ["Library"],
			operationId: "listFollowedArtists",
			summary: "Followed artists",
			security: userAuth,
			responses: { ...okRes("FollowedArtistListEnvelope", obj({ items: arr(ref("FollowedArtist")) }, ["items"])), ...E_USER },
		},
		post: {
			tags: ["Library"],
			operationId: "followArtist",
			summary: "Follow an artist (upsert)",
			security: userAuth,
			requestBody: body(ref("FollowArtistInput")),
			responses: { ...okRes("FollowedArtistEnvelope", obj({ followed: ref("FollowedArtist") }, ["followed"])), ...E_400, ...E_USER },
			"x-error-codes": ["INVALID_BODY"],
		},
	},
	"/api/v1/library/artists/{deezerArtistId}": {
		parameters: [pathParam("deezerArtistId", "Deezer artist id")],
		delete: {
			tags: ["Library"],
			operationId: "unfollowArtist",
			summary: "Unfollow an artist (idempotent)",
			security: userAuth,
			responses: { ...okRes("UnfollowedEnvelope", obj({ unfollowed: bool({ enum: [true] }) }, ["unfollowed"])), ...E_USER },
		},
	},
	"/api/v1/library/status": {
		post: {
			tags: ["Library"],
			operationId: "getLibraryStatus",
			summary: "Batch: which of these tracks/albums are saved?",
			description: "Non-array `trackIds` / `albumIds` are silently treated as `[]`.",
			security: userAuth,
			requestBody: body(ref("LibraryStatusInput")),
			responses: { ...okRes("LibraryStatusEnvelope", ref("LibraryStatus")), ...E_USER },
		},
	},

	// ─── Playlists ───
	"/api/v1/playlists": {
		get: {
			tags: ["Playlists"],
			operationId: "listPlaylists",
			summary: "User playlists (most recently updated first)",
			security: userAuth,
			parameters: [query("trackId", str(), "If set, each playlist gets `containsTrack`")],
			responses: { ...okRes("PlaylistSummaryListEnvelope", arr(ref("PlaylistSummary"))), ...E_USER },
		},
		post: {
			tags: ["Playlists"],
			operationId: "createPlaylist",
			summary: "Create a playlist",
			security: userAuth,
			requestBody: body(ref("CreatePlaylistInput")),
			responses: { ...okRes("PlaylistEnvelope", ref("Playlist")), ...E_400, ...E_USER },
			"x-error-codes": ["MISSING_TITLE"],
		},
	},
	"/api/v1/playlists/{id}": {
		parameters: [pathParam("id", "Playlist id")],
		get: {
			tags: ["Playlists"],
			operationId: "getPlaylist",
			summary: "Playlist with tracks (ordered by position)",
			security: userAuth,
			responses: { ...okRes("PlaylistWithTracksEnvelope", ref("PlaylistWithTracks")), ...E_404, ...E_USER },
		},
		patch: {
			tags: ["Playlists"],
			operationId: "updatePlaylist",
			summary: "Rename / edit description",
			security: userAuth,
			requestBody: body(ref("UpdatePlaylistInput")),
			responses: { ...okRes("PlaylistEnvelope", ref("Playlist")), ...E_404, ...E_USER },
		},
		delete: {
			tags: ["Playlists"],
			operationId: "deletePlaylist",
			summary: "Delete a playlist",
			security: userAuth,
			responses: { ...okRes("DeletedEnvelope", obj({ deleted: bool({ enum: [true] }) }, ["deleted"])), ...E_404, ...E_USER },
		},
	},
	"/api/v1/playlists/{id}/tracks": {
		parameters: [pathParam("id", "Playlist id")],
		post: {
			tags: ["Playlists"],
			operationId: "addPlaylistTracks",
			summary: "Append track(s) (duplicates skipped)",
			security: userAuth,
			requestBody: body(obj({ tracks: arr(ref("PlaylistTrackInput"), { minItems: 1 }) }, ["tracks"])),
			responses: { ...okRes("AddedEnvelope", obj({ added: int() }, ["added"])), ...E_400, ...E_404, ...E_USER },
			"x-error-codes": ["MISSING_TRACKS", "NOT_FOUND"],
		},
		patch: {
			tags: ["Playlists"],
			operationId: "reorderPlaylistTracks",
			summary: "Reorder tracks",
			description: "`trackIds` must contain exactly the playlist's current trackIds in the new order.",
			security: userAuth,
			requestBody: body(obj({ trackIds: arr(str()) }, ["trackIds"])),
			responses: { ...okRes("ReorderedEnvelope", obj({ reordered: int() }, ["reordered"])), ...E_400, ...E_404, ...E_USER },
			"x-error-codes": ["MISSING_TRACK_IDS", "REORDER_LENGTH_MISMATCH", "REORDER_DUPLICATE_TRACK", "REORDER_UNKNOWN_TRACK"],
		},
		delete: {
			tags: ["Playlists"],
			operationId: "removePlaylistTracks",
			summary: "Remove track(s)",
			description: "⚠ DELETE with a JSON body. Make sure your HTTP client sends it (Dio does with `data:`).",
			security: userAuth,
			requestBody: body(obj({ trackIds: arr(str(), { minItems: 1 }) }, ["trackIds"])),
			responses: { ...okRes("RemovedEnvelope", obj({ removed: int() }, ["removed"])), ...E_400, ...E_404, ...E_USER },
			"x-error-codes": ["MISSING_TRACK_IDS", "NOT_FOUND"],
		},
	},
	"/api/v1/playlists/import/spotify": {
		post: {
			tags: ["Playlists"],
			operationId: "importSpotifyPlaylist",
			summary: "Import a Spotify playlist (matched to Deezer, max 1000 tracks)",
			description: "Synchronous; can take a couple of minutes on large playlists — use a long client timeout, or the chunked flow: POST /playlists/import/spotify/playlist (or …/tracks), then …/match in batches of 50, then …/save.",
			security: userAuth,
			requestBody: body({
				oneOf: [
					obj({ url: str({ description: "Spotify playlist URL, URI or id (first 100 tracks without API access)", example: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M" }) }, ["url"]),
					obj(
						{
							tracks: arr(ref("SpotifyTrack"), { minItems: 1, description: "tracks read with POST /playlists/import/spotify/tracks" }),
							unreadable: arr(str(), { description: "track ids that could not be read (reported as not found)" }),
							total: int({ description: "number of pasted links, for the truncated flag" }),
							title: str({ description: "name of the new playlist (default \"Spotify import\")" }),
						},
						["tracks"]
					),
				],
			}),
			responses: {
				...okRes("SpotifyImportEnvelope", ref("SpotifyImportResult")),
				400: err("BadRequest"),
				403: err("Forbidden"),
				404: err("NotFound"),
				429: err("RateLimited"),
				502: err("UpstreamError"),
				...E_DEEZER,
			},
			"x-error-codes": [
				"MISSING_URL", "INVALID_URL", "INVALID_TRACKS", "EMPTY_PLAYLIST", "SPOTIFY_NOT_FOUND",
				"SPOTIFY_FORBIDDEN", "SPOTIFY_RATE_LIMITED", "SPOTIFY_ERROR", "NO_DEEZER_ARL", "DEEZER_LOGIN_FAILED",
			],
		},
	},

	"/api/v1/playlists/import/spotify/tracks": {
		post: {
			tags: ["Playlists"],
			operationId: "readSpotifyTracks",
			summary: "Read up to 50 Spotify tracks from their public pages",
			description: "Step 1 of importing pasted track links. Call in batches; when `rateLimited` is non-empty, pause (20 s, then longer) and resend those ids, then send all tracks to POST /playlists/import/spotify.",
			security: userAuth,
			requestBody: body(obj({ ids: arr(str(), { minItems: 1, maxItems: 50 }) }, ["ids"])),
			responses: { ...okRes("SpotifyTrackBatchEnvelope", ref("SpotifyTrackBatch")), ...E_400, ...E_USER },
			"x-error-codes": ["INVALID_IDS", "TOO_MANY_IDS"],
		},
	},
	"/api/v1/playlists/import/spotify/playlist": {
		post: {
			tags: ["Playlists"],
			operationId: "readSpotifyPlaylist",
			summary: "Read a public Spotify playlist (no matching)",
			description: "Step 1 of the chunked import from a playlist link. `tracks` is capped at 1000; `totalTracks` keeps the real count.",
			security: userAuth,
			requestBody: body(obj({ url: str({ description: "Spotify playlist URL, URI or id" }) }, ["url"])),
			responses: {
				...okRes("SpotifyPlaylistEnvelope", ref("SpotifyPlaylist")),
				400: err("BadRequest"),
				403: err("Forbidden"),
				404: err("NotFound"),
				429: err("RateLimited"),
				502: err("UpstreamError"),
				...E_USER,
			},
			"x-error-codes": ["MISSING_URL", "INVALID_URL", "EMPTY_PLAYLIST", "SPOTIFY_NOT_FOUND", "SPOTIFY_FORBIDDEN", "SPOTIFY_RATE_LIMITED", "SPOTIFY_ERROR"],
		},
	},
	"/api/v1/playlists/import/spotify/match": {
		post: {
			tags: ["Playlists"],
			operationId: "matchSpotifyTracks",
			summary: "Match up to 50 Spotify tracks on Deezer",
			description: "Step 2 of the chunked import. `results` is in the order of `tracks`; send the matched ones to POST /playlists/import/spotify/save.",
			security: userAuth,
			requestBody: body(obj({ tracks: arr(ref("SpotifyTrack"), { minItems: 1, maxItems: 50 }) }, ["tracks"])),
			responses: { ...okRes("SpotifyMatchEnvelope", obj({ results: arr(ref("SpotifyMatchResult")) }, ["results"])), ...E_400, ...E_DEEZER },
			"x-error-codes": ["INVALID_TRACKS", "TOO_MANY_TRACKS", "NO_DEEZER_ARL", "DEEZER_LOGIN_FAILED"],
		},
	},
	"/api/v1/playlists/import/spotify/save": {
		post: {
			tags: ["Playlists"],
			operationId: "saveSpotifyImport",
			summary: "Create the imported playlist from matched tracks",
			description: "Step 3 of the chunked import. Duplicate track ids are dropped.",
			security: userAuth,
			requestBody: body(
				obj(
					{
						title: str({ description: "default \"Spotify import\"" }),
						description: str(),
						coverUrl: nstr({ description: "https only; else the first track's cover" }),
						tracks: arr(ref("ImportedTrack"), { minItems: 1, maxItems: 1000 }),
					},
					["tracks"]
				)
			),
			responses: { ...okRes("SpotifySaveEnvelope", obj({ playlist: ref("Playlist") }, ["playlist"])), ...E_400, ...E_USER },
			"x-error-codes": ["INVALID_TRACKS", "TOO_MANY_TRACKS"],
		},
	},

	// ─── Preferences / settings ───
	"/api/v1/preferences": {
		get: {
			tags: ["Settings"],
			operationId: "getPreferences",
			summary: "UI preferences",
			security: userAuth,
			responses: { ...okRes("UserPreferencesEnvelope", ref("UserPreferences")), ...E_USER },
		},
		patch: {
			tags: ["Settings"],
			operationId: "updatePreferences",
			summary: "Merge UI preferences (unknown keys → 400)",
			security: userAuth,
			requestBody: body(ref("UserPreferences")),
			responses: { ...okRes("UserPreferencesEnvelope", ref("UserPreferences")), ...E_400, ...E_USER },
			"x-error-codes": ["INVALID_KEY"],
		},
	},
	"/api/v1/settings": {
		get: {
			tags: ["Settings"],
			operationId: "getSettings",
			summary: "Engine settings (per-user overrides merged over global)",
			security: optionalAuth,
			responses: { ...okRes("SettingsBundleEnvelope", ref("SettingsBundle")), 500: err("InternalError") },
		},
		post: {
			tags: ["Settings"],
			operationId: "saveSettings",
			summary: "Save engine settings",
			description: "`settings` is stored per-user (replaces the previous object) when authenticated. `spotifySettings` is global.",
			security: optionalAuth,
			requestBody: body(obj({ settings: ref("Settings"), spotifySettings: freeform("Spotify plugin settings") })),
			responses: { ...okRes("SettingsBundleEnvelope", ref("SettingsBundle")), 500: err("InternalError") },
		},
	},
	"/api/v1/settings/quality": {
		get: {
			tags: ["Settings"],
			operationId: "getStreamingQuality",
			summary: "Server-wide streaming quality (maxBitrate)",
			description: "The one `maxBitrate` every stream uses (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Per-user `settings.maxBitrate` is not used for streaming.",
			security: optionalAuth,
			responses: { ...okRes("StreamingQualityEnvelope", obj({ maxBitrate: int({ enum: [1, 3, 9] }) }, ["maxBitrate"])), 500: err("InternalError") },
		},
		post: {
			tags: ["Settings"],
			operationId: "setStreamingQuality",
			summary: "Change the server-wide streaming quality",
			description: "Applies to every listener. Tracks already cached keep the bitrate they were stored in.",
			security: userAuth,
			requestBody: body(obj({ maxBitrate: int({ enum: [1, 3, 9] }) }, ["maxBitrate"])),
			responses: { ...okRes("StreamingQualityEnvelope", obj({ maxBitrate: int({ enum: [1, 3, 9] }) }, ["maxBitrate"])), ...E_400, ...E_USER },
			"x-error-codes": ["INVALID_BITRATE", "INVALID_BODY"],
		},
	},

	// ─── Recent plays ───
	"/api/v1/recent-plays": {
		get: {
			tags: ["Recent plays"],
			operationId: "listRecentPlays",
			summary: "Listening history (most recent first, cap 100)",
			security: userAuth,
			parameters: [query("limit", int({ default: 50, minimum: 1, maximum: 100 }), "Page size (0 / invalid → 50)")],
			responses: { ...okRes("RecentPlayListEnvelope", obj({ items: arr(ref("RecentPlay")) }, ["items"])), ...E_USER },
		},
		post: {
			tags: ["Recent plays"],
			operationId: "logRecentPlay",
			summary: "Log a play — call after 30 s of continuous playback",
			security: userAuth,
			requestBody: body(ref("RecentPlayInput")),
			responses: { ...okRes("LoggedEnvelope", obj({ logged: bool({ enum: [true] }) }, ["logged"])), ...E_400, ...E_USER },
			"x-error-codes": ["INVALID_BODY"],
		},
	},
	"/api/v1/recent-plays/{trackId}/skip": {
		parameters: [pathParam("trackId", "Deezer track id")],
		post: {
			tags: ["Recent plays"],
			operationId: "reportSkip",
			summary: "Report a skip before 30 s (lets the server free the cached file)",
			security: userAuth,
			responses: { ...okRes("SkipEnvelope", ref("SkipResult")), ...E_USER },
		},
	},

	// ─── Lyrics ───
	"/api/v1/lyrics/{trackId}": {
		parameters: [pathParam("trackId", "Deezer track id")],
		get: {
			tags: ["Lyrics"],
			operationId: "getLyrics",
			summary: "Lyrics (LRCLIB exact → Deezer → LRCLIB fuzzy search)",
			description: "Send title/artist/album/duration of the playing track for the best match; otherwise they come from the library, recent plays or the Deezer track API. Synced lyrics are only returned when the matched recording's length is within 3 s. No lyrics → 200 with `source: null`. 400 MISSING_METADATA only when there is no metadata and no Deezer session.",
			security: userAuth,
			parameters: [
				query("title", str(), "Track title"),
				query("artist", str(), "Artist name"),
				query("album", str(), "Album title"),
				query("duration", int(), "Duration in seconds (aligns synced lyrics; strongly recommended)"),
			],
			responses: { ...okRes("LyricsEnvelope", ref("Lyrics")), ...E_400, ...E_USER },
			"x-error-codes": ["MISSING_METADATA"],
		},
	},

	// ─── Shares ───
	"/api/v1/shares": {
		get: {
			tags: ["Shares"],
			operationId: "listShares",
			summary: "My share links",
			security: userAuth,
			responses: { ...okRes("SharedTrackListEnvelope", arr(ref("SharedTrack"))), ...E_USER },
		},
		post: {
			tags: ["Shares"],
			operationId: "createShare",
			summary: "Create (or reuse) a public share link for a track",
			description: "Returns 200 with the existing share if one already exists for this track, 201 otherwise. Public page: `https://wavelet.titosy.dev/share/t/{shareId}`.",
			security: userAuth,
			requestBody: body(ref("CreateShareInput")),
			responses: {
				...okRes("SharedTrackEnvelope", ref("SharedTrack"), "Existing share reused"),
				...okRes("SharedTrackEnvelope", ref("SharedTrack"), "Share created", "201"),
				...E_400,
				...E_USER,
			},
			"x-error-codes": ["MISSING_TRACK_ID"],
		},
	},
	"/api/v1/shares/{shareId}": {
		parameters: [pathParam("shareId", "Public share id")],
		get: {
			tags: ["Shares"],
			operationId: "getShare",
			summary: "Public share metadata (no auth)",
			security: noAuth,
			responses: { ...okRes("PublicShareEnvelope", ref("PublicShare")), ...E_404, 410: err("Gone"), 500: err("InternalError") },
			"x-error-codes": ["NOT_FOUND", "EXPIRED"],
		},
		delete: {
			tags: ["Shares"],
			operationId: "deleteShare",
			summary: "Revoke a share link (owner only)",
			security: userAuth,
			responses: { ...okRes("DeletedEnvelope", obj({ deleted: bool({ enum: [true] }) }, ["deleted"])), 403: err("Forbidden"), ...E_404, ...E_USER },
		},
	},
	"/api/v1/shares/{shareId}/stream": {
		parameters: [pathParam("shareId", "Public share id")],
		get: {
			tags: ["Shares", "Streaming"],
			operationId: "streamShare",
			summary: "Public audio stream of a shared track (no auth)",
			description: "Range supported when served from cache (206); live fallback has `Accept-Ranges: none`. Each call increments the play counter.",
			security: noAuth,
			parameters: [{ name: "Range", in: "header", required: false, schema: str({ example: "bytes=0-" }) }],
			responses: {
				200: { description: "Full audio body", content: audioBinary },
				206: { description: "Partial content (cached file)", content: audioBinary },
				...E_404,
				410: err("Gone"),
				500: err("InternalError"),
			},
			"x-error-codes": ["NOT_FOUND", "EXPIRED", "SHARE_OWNER_OFFLINE", "STORAGE_UNAVAILABLE"],
		},
	},

	// ─── Streaming ───
	"/api/v1/stream-url/{trackId}": {
		parameters: [pathParam("trackId", "Deezer track id")],
		get: {
			tags: ["Streaming"],
			operationId: "getStreamUrl",
			summary: "Step 1 — presigned direct URL if the track is cached",
			description:
				"Recommended playback flow:\n1. `GET /stream-url/{id}` → if `url` is set, play it directly (CDN, Range-capable, ~15 min validity).\n2. Otherwise play `GET /stream-progressive/{id}` (live from Deezer, persisted to R2 in the background).\n`/stream/{id}` is the same-origin proxy for cached files.",
			security: userAuth,
			responses: { ...okRes("StreamUrlEnvelope", ref("StreamUrl")), ...E_USER },
		},
	},
	"/api/v1/stream/{trackId}": {
		parameters: [pathParam("trackId", "Deezer track id")],
		get: {
			tags: ["Streaming"],
			operationId: "streamCached",
			summary: "Stream a cached track (Range supported)",
			description: "Cache miss → 302 to `/api/v1/stream-progressive/{trackId}`; storage down or refusing reads → 302 to `/api/v1/stream-progressive/{trackId}?live=1`. The audio player must follow redirects and keep sending the session cookie.",
			security: userAuth,
			parameters: [{ name: "Range", in: "header", required: false, schema: str({ example: "bytes=0-" }) }],
			responses: {
				200: { description: "Full audio body", content: audioBinary, headers: { "Accept-Ranges": { schema: str({ enum: ["bytes"] }) } } },
				206: { description: "Partial content", content: audioBinary, headers: { "Content-Range": { schema: str() } } },
				302: { description: "Not cached → redirect to /stream-progressive", headers: { Location: { schema: str() } } },
				...E_USER,
			},
		},
	},
	"/api/v1/stream-progressive/{trackId}": {
		parameters: [pathParam("trackId", "Deezer track id")],
		get: {
			tags: ["Streaming"],
			operationId: "streamProgressive",
			summary: "Live stream from Deezer (decrypted on the fly, persisted in background)",
			description: "No Range support (`Accept-Ranges: none`) — seeking beyond the buffer requires restarting the stream. Already cached → 302 to `/api/v1/stream/{trackId}`.",
			security: userAuth,
			parameters: [
				query("preview", str({ enum: ["1"] }), "Prefetch mode: no persistence, no download lock"),
				query("head", str({ enum: ["1"] }), "With preview=1: cap response at ~64 KB"),
				query("live", str({ enum: ["1"] }), "Skip the cache check and stream from Deezer (sent by /stream when storage refuses reads)"),
			],
			responses: {
				200: { description: "Audio body (chunked or with Content-Length)", content: audioBinary },
				302: { description: "Already cached → redirect to /stream", headers: { Location: { schema: str() } } },
				...E_DEEZER,
			},
			"x-error-codes": ["NO_DEEZER_ARL", "DEEZER_LOGIN_FAILED", "APP_NOT_INITIALIZED", "STORAGE_UNAVAILABLE"],
		},
	},
	"/api/v1/stream-warm/{trackId}": {
		parameters: [pathParam("trackId", "Deezer track id")],
		get: {
			tags: ["Streaming"],
			operationId: "warmStream",
			summary: "Prefetch Deezer metadata so the next play starts faster",
			description: "Fire-and-forget, always 204 on success. Call when a track is about to be played (e.g. next in queue).",
			security: userAuth,
			responses: { 204: { description: "Accepted (no body)" }, ...E_DEEZER },
		},
	},
};

// ── Shared error responses ──
const errorRes = (description) => ({ description, content: json(ref("ErrorResponse")) });
const responses = {
	BadRequest: errorRes("Invalid input"),
	NotAuthenticated: errorRes("`NOT_AUTHENTICATED` — no / expired session cookie"),
	NotAuthenticatedOrDeezerLoginFailed: errorRes("`NOT_AUTHENTICATED`, `DEEZER_LOGIN_FAILED` or `LOGIN_FAILED`"),
	NoDeezerArl: errorRes("`NO_DEEZER_ARL` — user has no Deezer account connected (send them to login-arl)"),
	Forbidden: errorRes("Forbidden"),
	NotFound: errorRes("`NOT_FOUND`"),
	Gone: errorRes("`EXPIRED` or `SHARE_OWNER_OFFLINE`"),
	RateLimited: errorRes("Upstream rate limit"),
	UpstreamError: errorRes("Upstream (Spotify) error"),
	ServiceUnavailable: errorRes("Service not configured"),
	NoDeezer: errorRes("`NO_DEEZER` — no user nor service Deezer session available"),
	InternalError: errorRes("`INTERNAL_ERROR`, `AUTH_ERROR`, `DEEZER_ERROR` or `APP_NOT_INITIALIZED`"),
};

const spec = {
	openapi: "3.0.3",
	info: {
		title: "Wavelet API",
		version: "1.0.0",
		description: [
			"Music streaming / library API behind wavelet (Next.js on Vercel).",
			"",
			"## Response envelope",
			"Every `/api/v1/*` JSON route returns `{ \"success\": true, \"data\": … }` or `{ \"success\": false, \"error\": { \"code\", \"message\" } }`.",
			"Branch on `error.code`, not on the message. `/api/auth/*` (better-auth) does NOT use this envelope.",
			"",
			"## Authentication",
			"better-auth session (Google only), accepted two ways:",
			"- **Bearer (native / Flutter)**: sign in with `POST /api/auth/sign-in/social` + Google `idToken`, read the `set-auth-token` response header, then send `Authorization: Bearer <token>` on every request — including the audio player's requests. Sessions last 30 days.",
			"- **Cookie (web)**: `__Secure-better-auth.session_token` (plus `__Secure-better-auth.session_data`, a 5-min signed cache).",
			"Many routes also need a connected Deezer account (`NO_DEEZER_ARL` → call `/api/v1/auth/login-arl`).",
			"",
			"## Ids",
			"`trackId`, `deezerAlbumId`, `deezerArtistId` are Deezer ids (as strings). `albumId` in `/library/albums/{albumId}` and playlist ids are internal cuids.",
		].join("\n"),
	},
	servers: [
		{ url: "https://wavelet.titosy.dev", description: "Production" },
		{ url: "http://localhost:3000", description: "Local dev (`npm run dev`)" },
	],
	tags: [
		{ name: "Auth (session)", description: "better-auth endpoints (not enveloped)" },
		{ name: "Deezer account", description: "Connect / switch the Deezer account used for streaming" },
		{ name: "Browse", description: "Raw Deezer content — works as guest" },
		{ name: "Search", description: "Works as guest" },
		{ name: "Library", description: "Liked tracks, saved albums, followed artists" },
		{ name: "Playlists", description: "User playlists + Spotify import" },
		{ name: "Recent plays", description: "Listening history (drives server-side file cache lifecycle)" },
		{ name: "Lyrics", description: "Synced (LRC) and plain lyrics" },
		{ name: "Shares", description: "Public track share links" },
		{ name: "Streaming", description: "Audio playback endpoints" },
		{ name: "Settings", description: "Engine settings and UI preferences" },
	],
	security: userAuth,
	paths,
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				description: "Session token from the `set-auth-token` header returned by `/api/auth/sign-in/social`.",
			},
			sessionCookie: {
				type: "apiKey",
				in: "cookie",
				name: "__Secure-better-auth.session_token",
				description: "better-auth session cookie (`better-auth.session_token` on http://localhost).",
			},
		},
		responses,
		schemas: { ...schemas, ...envelopes },
	},
};

writeFileSync(process.argv[2] ?? "openapi.json", JSON.stringify(spec, null, "\t") + "\n");
console.log(`paths: ${Object.keys(paths).length}, ops: ${Object.values(paths).reduce((n, p) => n + Object.keys(p).filter((k) => k !== "parameters").length, 0)}, schemas: ${Object.keys(spec.components.schemas).length}`);
