# Project: deemix-next

Music download/streaming app built with Next.js 16, React 19, Prisma 7, Express, Zustand, Tailwind 4.

## Next.js 16 — Breaking Changes

This project uses Next.js 16 which has breaking changes from earlier versions. **Do not rely on training data for Next.js APIs.** Use Context7 MCP (`resolve-library-id` → `query-docs`) to look up any Next.js API before writing code.

## Stack

- **Frontend**: Next.js 16 (app router), React 19, Zustand stores, Tailwind CSS 4, shadcn/ui, Motion
- **Backend**: Next.js API routes (`src/app/api/v1/`) + BullMQ stems-worker (`stems-worker/`)
- **Database**: PostgreSQL via Prisma 7 (schema at `prisma/schema.prisma`)
- **Storage**: S3 (AWS SDK v3) or local filesystem — see `src/lib/deemix/storage/`
- **Auth**: better-auth (`src/lib/auth.ts`, `src/lib/auth-client.ts`)

## Project Map

```
src/
├── app/
│   ├── (auth)/              # Login flow
│   ├── (main)/              # Main app pages (home, search, playlists, albums, settings)
│   ├── api/                 # Legacy API routes (IGNORED — see note below)
│   ├── api/v1/              # Canonical API — downloads, library, search, shares, streaming
│   │   └── _lib/helpers.ts  # Shared helpers (ok, fail, handleError, requireDeezerAndApp)
│   └── share/t/[shareId]/   # Public share player + OG image
├── components/
│   ├── audio/               # Player, MiniPlayer, FullscreenPlayer, SeekBar, PlayButton
│   ├── downloads/           # DownloadPanel, QueueItem, progress tracking
│   ├── layout/              # Sidebar, SearchBar
│   ├── playlists/           # AddToPlaylist
│   ├── tracks/              # ShareButton, ShareDialog, TrackActionSheet
│   └── ui/                  # shadcn primitives (IGNORED — generated, rarely modified)
├── hooks/                   # useDownload, useSocket, useQueuePolling, useUserPreferences
├── lib/
│   ├── deemix/              # Core download engine (decryption, tagger, downloader, settings)
│   │   ├── download-objects/ # Single/Collection download items + generators
│   │   ├── plugins/         # Spotify integration
│   │   ├── storage/         # S3 / Local storage providers
│   │   ├── types/           # Track, Album, Artist, Playlist, Settings
│   │   └── utils/           # Crypto, bitrate, path templates, image download
│   ├── deezer/              # Deezer API client (api, gw, schemas, store)
│   ├── auth.ts              # Server-side auth config
│   ├── auth-client.ts       # Client-side auth
│   ├── prisma.ts            # Prisma client singleton
│   ├── s3-stream.ts         # S3 streaming helper
│   └── server-state.ts      # Shared server state
├── stores/                  # Zustand: useAppStore, usePlayerStore, useQueueStore, etc.
└── utils/                   # api helpers, volume adjustment, misc helpers
stems-worker/                # BullMQ consumer for Demucs stem separation
scripts/                     # DB check, icon generation, streaming tasks
prisma/schema.prisma         # Database schema
```

## Commands

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run studio       # Prisma Studio
npm test             # Vitest one-shot
npm run test:watch   # Vitest watch mode
npm run test:coverage # Coverage with thresholds (gate used by CI)
```

## Testing & Regression Prevention

This project uses **Vitest 4** + **vitest-mock-extended** for tests. Config at `vitest.config.ts`. Reusable helpers in `src/test/helpers/` (`nextRequest.ts`, `mockPrisma.ts`, `mockAuth.ts`). Reference test to mirror: `src/app/api/v1/stream-url/[trackId]/route.test.ts`.

CI runs on every PR (`.github/workflows/ci.yml`): tests + coverage gate + `tsc --noEmit` + ESLint. Coverage thresholds: lines 90, branches 85, functions 90, statements 90 (global, scoped to the modules locked in — see `vitest.config.ts` `include`).

### Locked-in surface (do not regress without a passing replacement test)

| Domain | Source | Test |
|---|---|---|
| Player store | `src/stores/usePlayerStore.ts` | `usePlayerStore.test.ts` (71 tests) |
| Preview store | `src/stores/usePreviewStore.ts` | `usePreviewStore.test.ts` (14 tests) |
| Track-action sheet | `src/stores/useTrackActionStore.ts` | `useTrackActionStore.test.ts` (5 tests) |
| Library logic | `src/lib/library.ts` | `library.test.ts` (26 tests) |
| API auth guards | `src/app/api/v1/_lib/helpers.ts` | `helpers.test.ts` (40 tests) |
| Streaming routes | `src/app/api/v1/stream{,-progressive,-url}/[trackId]/route.ts` | `route.test.ts` (32 tests) |
| Library routes | `src/app/api/v1/library/*` | `route.test.ts` (50 tests) |
| Recent plays | `src/app/api/v1/recent-plays/**` | `route.test.ts` (26 tests) |
| Preferences | `src/app/api/v1/preferences/route.ts` | `route.test.ts` (11 tests) |

### Fix-bug-once strategy (read this before fixing anything)

**Every bug fix must ship with a failing-then-passing test.** No exceptions. The workflow is:

1. **Reproduce the bug as a test first.** Before touching the source, write a test that captures the exact failure (status code, error message, redirect target, store state, whatever the symptom is). The test must fail.
2. **Fix the source.**
3. **Re-run the test — it must now pass.** Then run the whole suite to make sure nothing else broke.
4. **Name the test after the bug.** e.g. `it("does not redirect to /stream when S3 is unreachable (was: 500 ENOTFOUND in Network tab)")`. The "was:" tag makes the test self-documenting and grep-able when the same symptom returns.

This is non-negotiable for the locked-in modules above — CI enforces it via the coverage gate (a regression in those modules would have to delete an existing test, which is visible in the diff).

For new code outside the locked-in surface, write at minimum one test per branch you add. If you add a new error code path, write a test for it in the same PR. Untested new code is a future bug waiting to be re-fixed.

### When you find a non-blocking quirk

If you spot behavior that looks wrong but is intentional (or you don't have time to fix it), **lock it in with a test** that asserts the current behavior, plus a `// TODO:` comment explaining what the right behavior would be. This way:
- The current behavior can't silently change.
- The test fails the moment someone "fixes" it without updating the test — forcing them to consciously decide what the new contract should be.

Examples already in the suite (search for `TODO` in `*.test.ts`):
- `library/tracks` GET treats `limit=0` as default 100 instead of clamping to 1.
- `recent-plays` GET treats `limit=0` as default 50.
- `library/status` POST silently coerces non-array `trackIds`/`albumIds` to `[]` instead of 400.

### Out of scope (still to be locked)

- `AudioEngine.tsx` and audio prefetch helpers (`getTrackUrl`, `fetchPresignedUrl`, `preloadAudio`) — too coupled to `HTMLAudioElement` / `IndexedDB` for unit tests. Plan: extract pure helpers, then add Playwright for the full flow.
- Routes: `playlists/**`, `shares/**`, `search/**`, `lyrics/**`, `auth/**`, `settings/**`, `content/**`, `stream-warm/**`.
- Deemix engine: `decryption.ts`, `tagger.ts`, `progressive-stream.ts`, `downloader.ts` (need real Deezer/S3 — gate them behind `[skip]` until we have a recorded-cassette setup).
- Stores: `useAuthStore`, `useAppStore`, `useShareStore`, `useLyricsStore`, `useLoginStore`, `useErrorStore`.

When you finish locking in any of the above, append it to the table above and to `vitest.config.ts` `coverage.include`.

## Database Models (Prisma)

```
User            ── 1:many ── Session, Account, Playlist, DownloadHistory, Album, SharedTrack
                ── 1:1 ──── UserSettings (JSON blob), UserPreferences (JSON blob), DeezerCredential
Config          ── key/value store (userId + key composite PK, JSON value) — Spotify plugin & global settings
Playlist        ── 1:many ── PlaylistTrack (trackId, title, artist, album, coverUrl, position)
StoredTrack     ── deduplicated file storage (trackId + bitrate unique) — shared across users
                ── 1:many ── DownloadHistory, SharedTrack
DownloadHistory ── per-user download log, links to StoredTrack for file dedup
SharedTrack     ── public share links (shareId unique), optional expiresAt, play counter
Album           ── per-user album tracking (userId + deezerAlbumId unique)
Verification    ── better-auth verification tokens
```

## Legacy API Routes (`src/app/api/` non-v1)

These are the **original** route implementations — not thin proxies. They contain real logic but use the same `v1/_lib/helpers.ts` utilities. The `v1/` routes are the **canonical, refactored** API. When modifying API behavior, edit only `v1/` routes. Legacy routes are in `.claudeignore` — read on-demand only if specifically asked about them.

## Conventions

- API routes live in `src/app/api/v1/` (versioned). Legacy routes at `src/app/api/` are original implementations, ignored by default.
- State management: Zustand stores in `src/stores/`
- UI components: shadcn/ui in `src/components/ui/`, app components alongside their feature
- Deemix core logic is self-contained in `src/lib/deemix/` — modify carefully
- Storage is abstracted via StorageProvider interface (`src/lib/deemix/storage/`)

## Token-Optimized Navigation

Many internal files are in `.claudeignore` to save tokens. Only **entry points** are indexed.

### Always visible (entry points)
| Module | Visible files | Purpose |
|--------|--------------|---------|
| deemix | `index.ts`, `downloader.ts`, `settings.ts`, `decryption.ts`, `tagger.ts` | Core API + orchestration |
| deemix/types | `index.ts`, `Track.ts`, `Album.ts` | Domain models |
| deemix/download-objects | `index.ts`, `DownloadObject.ts`, `Single.ts`, `Collection.ts` | Download containers |
| deemix/storage | `index.ts`, `StorageProvider.ts`, `factory.ts` | Storage abstraction |
| deemix/config-store | `index.ts`, `ConfigStore.ts` | Config abstraction |
| deemix/plugins | `index.ts`, `base.ts` | Plugin contract |
| deezer | `index.ts`, `deezer.ts`, `api.ts`, `gw.ts` | Deezer API client |
| components/ui | `cover-image.tsx` only | Custom UI (shadcn primitives ignored) |

### Ignored (read on-demand when modifying)
- `src/app/api/` (non-v1) — legacy API routes
- `deemix/utils/*` — internal helpers (crypto, paths, bitrate, images)
- `deemix/download-objects/generate*.ts` — factory functions
- `deemix/storage/{Local,S3}StorageProvider.ts` — concrete implementations
- `deemix/config-store/PostgresConfigStore.ts` — concrete implementation
- `deemix/plugins/spotify.ts` — Spotify plugin implementation
- `deemix/types/{Artist,Playlist,Lyrics,Picture,CustomDate,listener,Settings}.ts` — secondary models
- `deemix/errors.ts`, `deezer/{types,utils,errors,store,schema/*}.ts` — internals
- `components/ui/*.tsx` — shadcn generated primitives
