// Convex schema — migration cible des 16 tables APPLICATIVES de Prisma.
//
// Les tables d'authentification (user / session / account / verification) ne
// figurent PAS ici : elles sont gérées par le composant @convex-dev/better-auth
// (ajouté en Phase 4). Voir docs/CONVEX_MIGRATION.md.
//
// Conventions de migration (décision (A) du doc) :
//   • On CONSERVE l'identifiant cuid d'origine dans un champ `id: v.string()`
//     sur chaque table. Cela rend l'import idempotent (upsert par id d'origine)
//     et préserve toutes les FK (playlistId, albumId, separationId,
//     storedTrackId, userId) SANS remappage vers les `Id<"...">` de Convex.
//   • Les `_id` / `_creationTime` natifs Convex existent mais ne portent pas la
//     sémantique métier ; les dates métier triables sont stockées en epoch ms.
//   • Aucune contrainte UNIQUE / FK / CASCADE en base : reproduites dans les
//     mutations (lecture par index + écriture atomique).

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// ── Config key/value (plugin Spotify & réglages globaux) — PK [userId,key] ──
	config: defineTable({
		userId: v.string(),
		key: v.string(),
		value: v.any(),
		updatedAt: v.number(),
	}).index("by_user_key", ["userId", "key"]),

	// ── Credential Deezer (ARL + profil) — unique par userId ──
	deezerCredential: defineTable({
		id: v.string(),
		userId: v.string(),
		arl: v.string(),
		// Deezer user IDs tiennent largement dans float64 (< 2^53) → v.number()
		// plutôt que v.int64(), ce qui évite l'encodage int64 spécial à l'import.
		deezerUserId: v.optional(v.number()),
		deezerUserName: v.optional(v.string()),
		deezerPicture: v.optional(v.string()),
		canStreamHq: v.boolean(),
		canStreamLossless: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	// ── Réglages utilisateur (blob JSON) — unique par userId ──
	userSettings: defineTable({
		id: v.string(),
		userId: v.string(),
		settings: v.any(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	// ── Préférences utilisateur (blob JSON) — unique par userId ──
	userPreferences: defineTable({
		id: v.string(),
		userId: v.string(),
		preferences: v.any(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	// ── Playlists ──
	playlist: defineTable({
		id: v.string(),
		userId: v.string(),
		title: v.string(),
		description: v.optional(v.string()),
		coverUrl: v.optional(v.string()),
		isPublic: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_origin_id", ["id"])
		.index("by_user", ["userId"]),

	playlistTrack: defineTable({
		id: v.string(),
		playlistId: v.string(),
		trackId: v.string(),
		title: v.string(),
		artist: v.string(),
		album: v.optional(v.string()),
		albumId: v.optional(v.string()),
		coverUrl: v.optional(v.string()),
		duration: v.optional(v.number()),
		position: v.number(),
		addedAt: v.number(),
	})
		.index("by_playlist", ["playlistId"])
		.index("by_playlist_track", ["playlistId", "trackId"]),

	// ── Liked Songs ──
	savedTrack: defineTable({
		id: v.string(),
		userId: v.string(),
		trackId: v.string(),
		title: v.string(),
		artist: v.string(),
		album: v.optional(v.string()),
		albumId: v.optional(v.string()),
		coverUrl: v.optional(v.string()),
		duration: v.optional(v.number()),
		savedAt: v.number(),
	})
		.index("by_user_saved", ["userId", "savedAt"])
		.index("by_user_track", ["userId", "trackId"])
		.index("by_track", ["trackId"]),

	// ── Albums sauvegardés + tracklist ──
	album: defineTable({
		id: v.string(),
		userId: v.string(),
		deezerAlbumId: v.string(),
		title: v.string(),
		artist: v.string(),
		coverUrl: v.optional(v.string()),
		trackCount: v.number(),
		savedAt: v.number(),
	})
		.index("by_origin_id", ["id"])
		.index("by_user_saved", ["userId", "savedAt"])
		.index("by_user_album", ["userId", "deezerAlbumId"]),

	albumTrack: defineTable({
		id: v.string(),
		albumId: v.string(),
		trackId: v.string(),
		title: v.string(),
		artist: v.string(),
		coverUrl: v.optional(v.string()),
		duration: v.optional(v.number()),
		trackNumber: v.optional(v.number()),
	})
		.index("by_album", ["albumId"])
		.index("by_album_track", ["albumId", "trackId"])
		.index("by_track", ["trackId"]),

	// ── Artistes suivis ──
	followedArtist: defineTable({
		id: v.string(),
		userId: v.string(),
		deezerArtistId: v.string(),
		name: v.string(),
		pictureUrl: v.optional(v.string()),
		followedAt: v.number(),
	})
		.index("by_user_followed", ["userId", "followedAt"])
		.index("by_user_artist", ["userId", "deezerArtistId"]),

	// ── Cache fichiers (dédup global trackId+bitrate) ──
	storedTrack: defineTable({
		id: v.string(),
		trackId: v.string(),
		bitrate: v.number(),
		storagePath: v.string(),
		storageType: v.string(),
		fileSize: v.optional(v.number()),
		createdAt: v.number(),
	})
		.index("by_origin_id", ["id"])
		.index("by_track", ["trackId"])
		.index("by_track_bitrate", ["trackId", "bitrate"]),

	// ── Historique d'écoute (cap 100, compté à 30s) ──
	recentPlay: defineTable({
		id: v.string(),
		userId: v.string(),
		trackId: v.string(),
		title: v.string(),
		artist: v.string(),
		album: v.optional(v.string()),
		albumId: v.optional(v.string()),
		coverUrl: v.optional(v.string()),
		duration: v.optional(v.number()),
		playedAt: v.number(),
	})
		.index("by_user_played", ["userId", "playedAt"])
		.index("by_user_track", ["userId", "trackId"])
		.index("by_track", ["trackId"]),

	// ── Séparation de stems (jobs IA Demucs) ──
	stemSeparation: defineTable({
		id: v.string(),
		trackId: v.string(),
		status: v.string(), // pending | processing | completed | failed
		mode: v.string(), // two_stems | six_stems
		progress: v.number(),
		errorMessage: v.optional(v.string()),
		startedAt: v.optional(v.number()),
		completedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_origin_id", ["id"])
		.index("by_track", ["trackId"])
		.index("by_status", ["status"]),

	stemFile: defineTable({
		id: v.string(),
		separationId: v.string(),
		trackId: v.string(),
		stemName: v.string(),
		storagePath: v.string(),
		storageType: v.string(),
		fileSize: v.optional(v.number()),
		createdAt: v.number(),
	})
		.index("by_separation", ["separationId"])
		.index("by_track", ["trackId"])
		.index("by_track_stem", ["trackId", "stemName"]),

	// ── Cache de correspondance externe → Deezer ──
	trackMatch: defineTable({
		id: v.string(),
		source: v.string(),
		sourceId: v.string(),
		isrc: v.optional(v.string()),
		deezerTrackId: v.optional(v.string()),
		strategy: v.optional(v.string()),
		confidence: v.optional(v.number()),
		resolvedAt: v.number(),
	})
		.index("by_source", ["source", "sourceId"])
		.index("by_isrc", ["isrc"]),

	// ── Liens de partage publics ──
	sharedTrack: defineTable({
		id: v.string(),
		shareId: v.string(),
		trackId: v.string(),
		userId: v.string(),
		title: v.string(),
		artist: v.string(),
		album: v.optional(v.string()),
		coverUrl: v.optional(v.string()),
		duration: v.optional(v.number()),
		storedTrackId: v.optional(v.string()),
		expiresAt: v.optional(v.number()),
		plays: v.number(),
		createdAt: v.number(),
	})
		.index("by_share", ["shareId"])
		.index("by_user", ["userId"])
		.index("by_track", ["trackId"])
		.index("by_stored", ["storedTrackId"]),
});
