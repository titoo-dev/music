# Project: wavelet

Music download/streaming app built with Next.js 16, React 19, Prisma 7, Zustand, Tailwind 4. Hosted on Vercel — everything runs inside Next.js, no external Node service (setup: `docs/vercel.md`).

## Next.js 16 — Breaking Changes

This project uses Next.js 16 which has breaking changes from earlier versions. **Do not rely on training data for Next.js APIs.** Use Context7 MCP (`resolve-library-id` → `query-docs`) to look up any Next.js API before writing code.

## Stack

- **Frontend**: Next.js 16 (app router), React 19, Zustand stores, Tailwind CSS 4, shadcn/ui, Motion
- **Backend**: Next.js API routes (`src/app/api/v1/`) on Vercel Functions (Fluid compute). Background work after a response goes through `after()` — a bare fire-and-forget promise is frozen when the response ends.
- **Database**: PostgreSQL (Neon via Vercel Marketplace) through Prisma 7 + `pg` pool attached with `attachDatabasePool` (schema at `prisma/schema.prisma`; migrations in `prisma/migrations/` are applied by `prisma migrate deploy` during the Vercel build — create new ones with `npm run db:migrate`)
- **Storage**: private Cloudflare R2 buckets (`wavelet-music` prod/preview, `wavelet-music-dev` dev; `R2_*` env vars) — writes via `R2StorageProvider` (`src/lib/wavelet/storage/`, signed with `aws4fetch` in `r2.ts`), reads/presigned URLs via `src/lib/object-stream.ts`. Moved off Vercel Blob after its Hobby quota suspended the stores (setup: `docs/vercel.md`). `/tmp` is the only writable path.
- **Auth**: better-auth (`src/lib/auth.ts`, `src/lib/auth-client.ts`)

## Design language — Geist minimal + the mobile app's expressive layer

The base stays Vercel / Geist: monochrome surfaces, hairline borders, the sticky glass header with its nav, Geist semibold with tight tracking, one blue accent (`--highlight`) for focus and now-playing. On top of it sit the "stunning" moments of the Flutter client (`~/dev/wavelet`): when you build or touch UI, add them rather than replacing the base.

- **Expressive layer** (`src/components/expressive`, reuse first): `HeroBanner` (aurora + drifting `ArtworkWall`, white copy, `HeroTitle` with the sky → indigo → pink `.brand-text` line), `CoverTheme` (re-themes a subtree's accents from artwork via `.cover-theme`; maths in `lib/cover-palette.ts`), `CollectionScaffold` (album / playlist / artist hero), `ArtCarousel` / `CardCarousel`, `BigPlayButton` (glowing), `QuickTile`, `FilterPills`, `SlidingSegments`, `SectionTitle`, `Medallion` (empty states), motion tokens (`DUR`, `EASE`, `entrance(i)`, `swap`).
- **Tokens** (`src/app/globals.css`): the shadcn tokens are the Geist palette; the extra roles (`surface-{low,container,high,highest}`, `primary-container`, `tertiary-container`, `.bg-tonal-gradient`) are neutral greys and faint brand tints that `.cover-theme` swaps for artwork colours. `.type-display` / `.type-eyebrow` for hero titles and eyebrows. Don't name custom utilities `text-*` — `cn()` (tailwind-merge) drops them.
- Heroes bleed to the viewport edges with `mx-[calc(50%-50vw)] px-[calc(50vw-50%)]` (`html` has `overflow-x: clip`); sticky sub-bars sit at `top-[var(--header-h)]` (the whole header, nav row included on phones).

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
│   ├── audio/               # Player (floating pill, bottom-center), MiniPlayer (preview pill), FullscreenPlayer, SeekBar
│   ├── layout/              # AppHeader (glass top bar: nav + ⌘K trigger)
│   ├── expressive/          # Design kit mirroring the Flutter app (heroes, pills, carousels, CoverTheme, CollectionScaffold)
│   ├── command/             # CommandPalette — ⌘K search + downloads (single entry point)
│   ├── cards/               # MediaCard grid cards (hover play / download)
│   ├── motion/              # Motion-driven SVG primitives (PlayPauseIcon, ProgressRing, …)
│   ├── playlists/           # AddToPlaylist
│   ├── tracks/              # ShareButton, ShareDialog, TrackActionSheet
│   └── ui/                  # shadcn primitives (IGNORED — generated, rarely modified)
├── hooks/                   # useDownload, useSocket, useQueuePolling, useUserPreferences
├── lib/
│   ├── wavelet/              # Core download engine (decryption, tagger, downloader, settings)
│   │   ├── download-objects/ # Single/Collection download items + generators
│   │   ├── plugins/         # Spotify integration
│   │   ├── storage/         # R2 provider + client (r2.ts) + pure key/error helpers (objects.ts)
│   │   ├── types/           # Track, Album, Artist, Playlist, Settings
│   │   └── utils/           # Crypto, bitrate, path templates, image download
│   ├── deezer/              # Deezer API client (api, gw, schemas, store)
│   ├── auth.ts              # Server-side auth config
│   ├── auth-client.ts       # Client-side auth
│   ├── prisma.ts            # Prisma client singleton
│   ├── object-stream.ts     # R2 head / proxied stream / presigned URLs
│   └── server-state.ts      # Shared server state
├── stores/                  # Zustand: useAppStore, usePlayerStore, useQueueStore, etc.
└── utils/                   # api helpers, volume adjustment, misc helpers
scripts/                     # DB check, icon generation (`npm run icons`), streaming tasks
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
npm run openapi      # Regenerate openapi.json (scripts/generate-openapi.mjs) — update it when a v1 route changes
npm run openapi:dart # Regenerate the Dart client in clients/dart (Docker + Dart SDK)
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
| Download queue | `src/stores/useDownloadStore.ts`, `src/lib/download.ts` | `useDownloadStore.test.ts`, `download.test.ts` |
| ⌘K palette | `src/components/command/CommandPalette.tsx`, `src/stores/useCommandStore.ts` | `CommandPalette.test.tsx`, `useCommandStore.test.ts` |
| Theme | `src/lib/theme.ts` | `theme.test.ts` |
| Keyboard shortcuts | `src/hooks/useKeyboardShortcuts.ts` | `useKeyboardShortcuts.test.ts` |
| Player seek bar | `src/components/audio/SeekBar.tsx` | `SeekBar.test.tsx` (+ `Player.test.tsx`) |
| Seeking on the live stream | `src/lib/seek.ts` (used by `AudioEngine.tsx` seek / resume paths) | `seek.test.ts` |
| DB connection string | `src/lib/db-url.ts` (used by `prisma.ts`, `PostgresConfigStore.ts`) | `db-url.test.ts` |
| Fullscreen wave seek | `src/components/audio/WaveSeek.tsx`, `src/lib/wave.ts`, `src/lib/spectrum.ts` | `WaveSeek.test.tsx`, `wave.test.ts`, `spectrum.test.ts` (+ `FullscreenPlayer.test.tsx`) |
| Stream failure diagnosis | `src/lib/stream-failure.ts` (used by `AudioEngine.tsx` give-up path) | `stream-failure.test.ts` |
| Logo / icons | `src/lib/logo.ts` (shared by `LogoMark`, OG image, `scripts/generate-icons.ts`) | `logo.test.ts` |
| Object storage (R2) | `src/lib/object-stream.ts`, `src/lib/wavelet/storage/{objects,r2,R2StorageProvider}.ts` | `object-stream.test.ts`, `objects.test.ts`, `R2StorageProvider.test.ts` |
| Cover palette (CoverTheme seed) | `src/lib/cover-palette.ts` | `cover-palette.test.ts` |
| Home discover parsing | `src/lib/discover.ts` (used by `hooks/useDiscover.ts`) | `discover.test.ts` |
| Bearer auth (native clients) | `src/lib/auth.ts` (better-auth `bearer()` plugin) | `auth.test.ts` |
| Lyrics lookup (LRCLIB get → Deezer → scored search) | `src/lib/lyrics/{match,lrc,deezer-sync,resolve,cache}.ts`, `src/app/api/v1/lyrics/[trackId]/route.ts`, `src/stores/useLyricsStore.ts` | `match.test.ts`, `lrc.test.ts`, `resolve.test.ts`, `cache.test.ts`, `route.test.ts`, `useLyricsStore.test.ts` |

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
- Routes: `playlists/**`, `shares/**`, `search/**`, `auth/**`, `settings/**`, `content/**`, `stream-warm/**`.
- Wavelet engine: `decryption.ts`, `tagger.ts`, `progressive-stream.ts`, `downloader.ts` (need real Deezer/R2 — gate them behind `[skip]` until we have a recorded-cassette setup).
- Stores: `useAuthStore`, `useAppStore`, `useShareStore`, `useLoginStore`, `useErrorStore`.

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
- Wavelet core logic is self-contained in `src/lib/wavelet/` — modify carefully
- Storage is abstracted via StorageProvider interface (`src/lib/wavelet/storage/`)

## Token-Optimized Navigation

Many internal files are in `.claudeignore` to save tokens. Only **entry points** are indexed.

### Always visible (entry points)
| Module | Visible files | Purpose |
|--------|--------------|---------|
| wavelet | `index.ts`, `downloader.ts`, `settings.ts`, `decryption.ts`, `tagger.ts` | Core API + orchestration |
| wavelet/types | `index.ts`, `Track.ts`, `Album.ts` | Domain models |
| wavelet/download-objects | `index.ts`, `DownloadObject.ts`, `Single.ts`, `Collection.ts` | Download containers |
| wavelet/storage | `index.ts`, `StorageProvider.ts`, `factory.ts`, `objects.ts`, `r2.ts`, `R2StorageProvider.ts` | Storage abstraction + Cloudflare R2 |
| wavelet/config-store | `index.ts`, `ConfigStore.ts` | Config abstraction |
| wavelet/plugins | `index.ts`, `base.ts` | Plugin contract |
| deezer | `index.ts`, `deezer.ts`, `api.ts`, `gw.ts` | Deezer API client |
| components/ui | `cover-image.tsx` only | Custom UI (shadcn primitives ignored) |

### Ignored (read on-demand when modifying)
- `src/app/api/` (non-v1) — legacy API routes
- `wavelet/utils/*` — internal helpers (crypto, paths, bitrate, images)
- `wavelet/download-objects/generate*.ts` — factory functions
- `wavelet/config-store/PostgresConfigStore.ts` — concrete implementation
- `wavelet/plugins/spotify.ts` — Spotify plugin implementation
- `wavelet/types/{Artist,Playlist,Lyrics,Picture,CustomDate,listener,Settings}.ts` — secondary models
- `wavelet/errors.ts`, `deezer/{types,utils,errors,store,schema/*}.ts` — internals
- `components/ui/*.tsx` — shadcn generated primitives
