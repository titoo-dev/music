# Deemix API v1 Documentation

Base URL: `/api/v1`

## Response Format

All endpoints return a consistent JSON envelope:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_LOGGED_IN` | 401 | Authentication required |
| `LOGIN_FAILED` | 401 | Invalid credentials |
| `MISSING_ARL` | 400 | ARL token not provided |
| `MISSING_CREDENTIALS` | 400 | Email or password not provided |
| `MISSING_TERM` | 400 | Search term not provided |
| `MISSING_PARAMS` | 400 | Required parameters missing |
| `MISSING_URL` | 400 | Download URL not provided |
| `MISSING_UUID` | 400 | Download UUID not provided |
| `MISSING_CHILD_INDEX` | 400 | Child account index not provided |
| `MISSING_SPOTIFY_USER` | 400 | Spotify username not provided |
| `INVALID_TYPE` | 400 | Invalid type parameter |
| `LINK_NOT_RECOGNIZED` | 400 | URL could not be parsed |
| `NO_USER_ID` | 400 | User ID not available |
| `ITEM_NOT_FOUND` | 404 | Queue item not found |
| `INVALID_SPOTIFY_USER` | 404 | Spotify user not found |
| `SPOTIFY_NOT_ENABLED` | 400 | Spotify not configured |
| `APP_NOT_INITIALIZED` | 500 | Server not ready |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Authentication

### `GET /api/v1/auth/connect`

Check connection status and retrieve current session data.

**Response:**
```json
{
  "success": true,
  "data": {
    "loggedIn": true,
    "deezerAvailable": true,
    "spotifyEnabled": false,
    "settings": { ... },
    "currentUser": {
      "id": 123456,
      "name": "John",
      "picture": "https://..."
    },
    "queue": {
      "queue": {},
      "queueOrder": []
    }
  }
}
```

---

### `POST /api/v1/auth/login-arl`

Login using a Deezer ARL token.

**Body:**
```json
{
  "arl": "your_arl_token",
  "child": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `arl` | string | Yes | Deezer ARL authentication token |
| `child` | number | No | Child account index (default: 0) |

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123456,
      "name": "John",
      "picture": "https://...",
      "can_stream_lossless": true,
      "can_stream_hq": true,
      "country": "FR"
    },
    "childs": [...],
    "currentChild": 0,
    "hasMultipleAccounts": false
  }
}
```

---

### `POST /api/v1/auth/login-email`

Login using email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Deezer account email |
| `password` | string | Yes | Deezer account password |

**Response:** Same as `login-arl`.

---

### `POST /api/v1/auth/logout`

Logout and clear the current session.

**Body:** None

**Response:**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully." }
}
```

---

### `POST /api/v1/auth/change-account`

Switch to a different child account.

**Auth required:** Yes

**Body:**
```json
{
  "child": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `child` | number | Yes | Child account index |

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "selectedAccount": 1,
    "childs": [...]
  }
}
```

---

## Search

### `GET /api/v1/search`

Search music by type using the GW API (rich metadata).

**Auth required:** Yes

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `term` | string | Yes | — | Search query |
| `type` | string | No | `track` | One of: `track`, `album`, `artist`, `playlist` |
| `start` | number | No | `0` | Pagination offset |
| `nb` | number | No | `100` | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "count": 50,
    "total": 500
  }
}
```

---

### `GET /api/v1/search/main`

Unified search across all types. Merges results from both GW API and public API for better coverage.

**Auth required:** Yes

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `term` | string | Yes | Search query |

**Response:**
```json
{
  "success": true,
  "data": {
    "TRACK": { "data": [...], "count": 100 },
    "ALBUM": { "data": [...], "count": 50 },
    "ARTIST": { "data": [...], "count": 25 },
    "PLAYLIST": { "data": [...], "count": 10 }
  }
}
```

---

### `GET /api/v1/search/album`

Search albums using the public API (better ranking).

**Auth required:** Yes

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `term` | string | Yes | — | Search query |
| `start` | number | No | `0` | Pagination offset |
| `nb` | number | No | `100` | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 200
  }
}
```

---

## Content

### `GET /api/v1/content/tracklist`

Get detailed tracklist for an album, playlist, or artist.

**Auth required:** Yes

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Content ID |
| `type` | string | Yes | One of: `album`, `playlist`, `artist` |

**Response (album):**
```json
{
  "success": true,
  "data": {
    "DATA": { "ALB_ID": "123", "ALB_TITLE": "Album Name", ... },
    "tracks": { "data": [...], "count": 12, "total": 12 }
  }
}
```

**Response (artist):**
```json
{
  "success": true,
  "data": {
    "DATA": { "ART_ID": "456", "ART_NAME": "Artist Name", ... },
    "topTracks": { "data": [...] },
    "discography": { ... }
  }
}
```

---

### `GET /api/v1/content/home`

Get home/explore page data (editorial channels).

**Auth required:** Yes

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### `GET /api/v1/content/new-releases`

Get editorial new releases.

**Auth required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      { "id": 123, "title": "New Album", "artist": { ... }, ... }
    ]
  }
}
```

---

## Library (User Collection)

All library endpoints require authentication.

### `GET /api/v1/library/playlists`

Get the current user's playlists (up to 2000).

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      { "PLAYLIST_ID": "123", "TITLE": "My Playlist", "NB_SONG": 50, ... }
    ],
    "count": 10
  }
}
```

---

### `GET /api/v1/library/tracks`

Get the current user's liked tracks (up to 2000).

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      { "SNG_ID": "789", "SNG_TITLE": "Song", "ART_NAME": "Artist", ... }
    ],
    "count": 150
  }
}
```

---

### `GET /api/v1/library/albums`

Get the current user's saved albums (up to 2000).

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      { "ALB_ID": "456", "ALB_TITLE": "Album", "ART_NAME": "Artist", ... }
    ],
    "count": 30
  }
}
```

---

### `GET /api/v1/library/artists`

Get the current user's followed artists (up to 2000).

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      { "ART_ID": "321", "ART_NAME": "Artist", ... }
    ],
    "count": 20
  }
}
```

---

## Downloads

### `GET /api/v1/downloads/queue`

Get the current download queue.

**Response:**
```json
{
  "success": true,
  "data": {
    "queue": {
      "uuid-1": {
        "uuid": "uuid-1",
        "title": "Song Title",
        "artist": "Artist",
        "cover": "https://...",
        "status": "downloading",
        "progress": 45,
        "bitrate": 3,
        "type": "track"
      }
    },
    "queueOrder": ["uuid-1"]
  }
}
```

**Download Status Values:**
- `inQueue` — Waiting to start
- `downloading` — Currently downloading
- `cancelling` — Cancellation in progress
- `completed` — Successfully downloaded
- `withErrors` — Completed with some errors
- `failed` — Download failed

---

### `POST /api/v1/downloads/queue`

Add URL(s) to the download queue.

**Auth required:** Yes

**Body:**
```json
{
  "url": "https://www.deezer.com/track/123456",
  "bitrate": 3
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string \| string[] | Yes | Deezer/Spotify URL or array of URLs |
| `bitrate` | number | No | Override bitrate (1=128, 3=320, 9=FLAC). Defaults to settings. |

**Bitrate Values:**
| Value | Format |
|-------|--------|
| `1` | MP3 128 kbps |
| `3` | MP3 320 kbps |
| `9` | FLAC |

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### `POST /api/v1/downloads/cancel`

Cancel a specific download.

**Body:**
```json
{
  "uuid": "download-uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "message": "Download cancelled." }
}
```

---

### `POST /api/v1/downloads/cancel-all`

Cancel all active downloads.

**Body:** None

**Response:**
```json
{
  "success": true,
  "data": { "message": "All downloads cancelled." }
}
```

---

### `POST /api/v1/downloads/clear-finished`

Remove completed downloads from the queue.

**Body:** None

**Response:**
```json
{
  "success": true,
  "data": { "message": "Finished downloads cleared." }
}
```

---

### `POST /api/v1/downloads/retry`

Retry a failed download.

**Auth required:** Yes

**Body:**
```json
{
  "uuid": "failed-download-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

## Settings

### `GET /api/v1/settings`

Get current application settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadLocation": "/path/to/downloads",
    "maxBitrate": 3,
    "fallbackBitrate": true,
    "fallbackSearch": false,
    "queueConcurrency": 3,
    "tracknameTemplate": "%artist% - %title%",
    "albumNameTemplate": "%artist% - %album%",
    "createM3U8File": false,
    "embeddedArtworkSize": 800,
    "saveArtwork": true,
    ...
  }
}
```

---

### `POST /api/v1/settings`

Update application settings.

**Body:**
```json
{
  "settings": {
    "downloadLocation": "/new/path",
    "maxBitrate": 9,
    "queueConcurrency": 5
  },
  "spotifySettings": {
    "clientId": "your_spotify_client_id",
    "clientSecret": "your_spotify_client_secret"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `settings` | object | No | Download/app settings to update |
| `spotifySettings` | object | No | Spotify integration credentials |

**Response:** Returns updated settings (same format as GET).

---

## Spotify

### `GET /api/v1/spotify/status`

Get Spotify integration status.

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "credentials": {
      "clientId": "abc...",
      "clientSecret": "xyz..."
    }
  }
}
```

---

### `GET /api/v1/spotify/playlists`

Get playlists from a Spotify user.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `spotifyUser` | string | Yes | Spotify username(s), comma-separated |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "spotify_playlist_id",
      "title": "Playlist Name",
      "picture_medium": "https://...",
      "nb_tracks": 50
    }
  ]
}
```

---

## System

### `GET /api/v1/system/check-updates`

Check if a newer version is available.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentVersion": "1.0.0",
    "latestVersion": "1.1.0",
    "updateAvailable": true
  }
}
```

---

## Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/auth/connect` | No | Check connection & session status |
| `POST` | `/api/v1/auth/login-arl` | No | Login with ARL token |
| `POST` | `/api/v1/auth/login-email` | No | Login with email/password |
| `POST` | `/api/v1/auth/logout` | No | Logout |
| `POST` | `/api/v1/auth/change-account` | Yes | Switch child account |
| `GET` | `/api/v1/search` | Yes | Search by type (GW API) |
| `GET` | `/api/v1/search/main` | Yes | Unified multi-source search |
| `GET` | `/api/v1/search/album` | Yes | Album search (public API) |
| `GET` | `/api/v1/content/tracklist` | Yes | Get album/playlist/artist details |
| `GET` | `/api/v1/content/home` | Yes | Home/explore data |
| `GET` | `/api/v1/content/new-releases` | Yes | New releases |
| `GET` | `/api/v1/library/playlists` | Yes | User's playlists |
| `GET` | `/api/v1/library/tracks` | Yes | User's liked tracks |
| `GET` | `/api/v1/library/albums` | Yes | User's saved albums |
| `GET` | `/api/v1/library/artists` | Yes | User's followed artists |
| `GET` | `/api/v1/downloads/queue` | No | Get download queue |
| `POST` | `/api/v1/downloads/queue` | Yes | Add to download queue |
| `POST` | `/api/v1/downloads/cancel` | No | Cancel a download |
| `POST` | `/api/v1/downloads/cancel-all` | No | Cancel all downloads |
| `POST` | `/api/v1/downloads/clear-finished` | No | Clear finished downloads |
| `POST` | `/api/v1/downloads/retry` | Yes | Retry a failed download |
| `GET` | `/api/v1/settings` | No | Get settings |
| `POST` | `/api/v1/settings` | No | Update settings |
| `GET` | `/api/v1/spotify/status` | No | Spotify status |
| `GET` | `/api/v1/spotify/playlists` | No | Spotify user playlists |
| `GET` | `/api/v1/system/check-updates` | No | Check for updates |
