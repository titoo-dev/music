/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as albums from "../albums.js";
import type * as auth from "../auth.js";
import type * as config from "../config.js";
import type * as deezerCredentials from "../deezerCredentials.js";
import type * as followedArtists from "../followedArtists.js";
import type * as http from "../http.js";
import type * as lib_util from "../lib/util.js";
import type * as playlists from "../playlists.js";
import type * as preferences from "../preferences.js";
import type * as recentPlays from "../recentPlays.js";
import type * as savedTracks from "../savedTracks.js";
import type * as settings from "../settings.js";
import type * as shares from "../shares.js";
import type * as stems from "../stems.js";
import type * as storedTracks from "../storedTracks.js";
import type * as trackMatch from "../trackMatch.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  albums: typeof albums;
  auth: typeof auth;
  config: typeof config;
  deezerCredentials: typeof deezerCredentials;
  followedArtists: typeof followedArtists;
  http: typeof http;
  "lib/util": typeof lib_util;
  playlists: typeof playlists;
  preferences: typeof preferences;
  recentPlays: typeof recentPlays;
  savedTracks: typeof savedTracks;
  settings: typeof settings;
  shares: typeof shares;
  stems: typeof stems;
  storedTracks: typeof storedTracks;
  trackMatch: typeof trackMatch;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
