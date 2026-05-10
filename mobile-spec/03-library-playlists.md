# Mobile-First Spec — Library & Playlists

> Source of truth: `DESIGN.md`. All token names, breakpoints, and z-index values reference that file. This spec is the per-screen application of those rules to the four "header + list" collection pages.

## 1. Files in scope

| File | Lines | Role |
|---|---:|---|
| `src/app/(main)/library/page.tsx` | 411 | `/library` — saved tracks + recent + albums + playlists tabs |
| `src/app/(main)/my-playlists/page.tsx` | 244 | `/my-playlists` — user's playlist grid |
| `src/app/(main)/my-playlists/[id]/page.tsx` | 185 | `/my-playlists/[id]` — playlist detail (owner) |
| `src/app/(main)/playlist/page.tsx` | 144 | `/playlist?id=` — public Deezer playlist viewer |
| `src/components/playlists/AddToPlaylist.tsx` | 204 | Inline "add to playlist" picker (DropdownMenu + Dialog) |
| `src/components/playlists/ImportSpotifyDialog.tsx` | 274 | Import-from-Spotify modal flow |
| `src/components/tracks/TrackRow.tsx` | 327 | Shared list row primitive |
| `src/components/tracks/TrackActionSheet.tsx` | 521 | Long-press bottom sheet (already mobile-aware) |

Total in-scope: ~2,310 lines across 8 files. Three of the four pages are already in `(main)` shell (top bar + future bottom nav clearance via `pb-32`); the fourth (`/playlist`) is too — they all benefit from the same chrome.

## 2. Mobile audit (current state)

Concrete file:line issues, grouped by symptom.

### 2.1 Hero too tall / wrong layout at <md

- `library/page.tsx:180-192` — header is OK in isolation (eyebrow + `text-brutal-xl` + subtitle), but `mb-7` (28px) plus the 48px tab strip `mb-6` push the first list row ~140px down on a 360×640 viewport. With the 64px top bar the user sees only ~340px of content above the MiniPlayer. Tighten to `mb-4 sm:mb-7`.
- `my-playlists/page.tsx:146-196` — header is a horizontal `flex items-center justify-between` with two side-by-side buttons (`Import from Spotify`, `New Playlist`). At 360px **the buttons wrap or collapse the title** because both buttons total ~280px. Verified: `text-brutal-lg` + 280px buttons cannot coexist below 480px. **Wrap** the action row to `flex-col sm:flex-row`, or move the actions into a sticky FAB/header secondary row.
- `my-playlists/[id]/page.tsx:131-162` — back-arrow + title + sort button is a 3-column flex with `gap-3`. The sort button reads `Oldest first` (~110px) and steals horizontal space from `text-brutal-lg`. On a 4-track playlist with a 30-character title, the title hyphen-truncates and the sort label shows. Move sort below the title on mobile.
- `playlist/page.tsx:70-89` — `flex flex-col md:flex-row` is correct; cover is `w-32 h-32` (128px) on mobile which is good. **But** the section between hero and tracklist is `space-y-10` (40px) — too generous on mobile. `space-y-6 sm:space-y-10`.

### 2.2 Action buttons not reachable / too small

- `library/page.tsx` — there is **no** primary "Play All" / "Shuffle" / "Download all" CTA on the saved-tracks tab. Users have to tap the tiny play overlay on the first row. **Missing primary action.**
- `my-playlists/[id]/page.tsx:131-162` — same: no Play All / Shuffle / Download All / Share buttons. Compare to `playlist/page.tsx:64-91` which also lacks them. **Both detail pages need a unified action row.**
- `my-playlists/page.tsx:222-232` — delete button is `size="icon-xs"` (~28×28) hidden behind `opacity-0 group-hover:opacity-100`. **On mobile this is invisible and unreachable.** Long-press should open a playlist-action sheet (TrackActionSheet variant) — wired nowhere today.
- `my-playlists/page.tsx:157,168` — `Button size="sm"` is 36×36 minimum, fine on desktop, **fails the 44×44 mobile minimum** from DESIGN §5.

### 2.3 Multi-select / batch UI: missing entirely

- No file in scope has multi-select wiring. `library/page.tsx` saved-tracks tab is the prime candidate (200 items default, line 130) and currently has zero way to bulk-remove or bulk-add-to-playlist. `Grep` for `useSelection|selectionMode|multiSelect` returned **0 hits across the whole repo**.
- This is the single biggest missing-feature in the collection pages.

### 2.4 ImportSpotifyDialog overflow on mobile

- `ImportSpotifyDialog.tsx:122` — `<DialogContent className="max-w-lg">` uses the desktop Dialog primitive, **not** the bottom-sheet primitive. On 360px width this collapses to ~344px; technically renders, but:
  - `ImportSpotifyDialog.tsx:142-167` — DialogFooter uses default flex which **stacks `Cancel` on top of `Import`** at <380px and the Import button's `gap-1.5` icon+text spinner overflows.
  - `ImportSpotifyDialog.tsx:239` — the `not-found` list uses `max-h-64 overflow-y-auto` (256px) plus `<DialogContent>` body padding. On a 640px-tall viewport, this **bumps the dialog above the viewport bottom**, hiding the close button.
  - `ImportSpotifyDialog.tsx:252` — "Search" anchor is `text-xs font-bold` with no explicit hit area; reads as text, not as a tap target.

### 2.5 Playlist cover grid breaking <360

- `library/page.tsx:275` — `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4` — at 360px - 24px container padding = 336px - 12px gap = 324px / 2 = **162px tile width**. Cover (162×162) + `p-2.5` + `text-[12px]` title = ~210px tall. Two columns of 8 playlists = 4 rows = 840px. That works but the title region is cramped.
- `my-playlists/page.tsx:207` — same grid but `gap-2 sm:gap-4`. **`gap-2` (8px) violates DESIGN §9 "never `gap-2` between cards (borders touch)"** — adjacent 2-3px borders visually merge.
- `my-playlists/page.tsx:217-219` — title is `text-sm font-bold truncate` (14px), meta is `text-[11px] font-mono`. Reads as ~52px of text below the cover. Mobile fine, but the absent date and "covers" arrangement makes it feel less informative than `library/page.tsx:283-292` which shows `{count} TR · {date}`.

### 2.6 Edit / delete affordance hidden behind hover

- `my-playlists/page.tsx:222-232` (already noted) — `opacity-0 group-hover:opacity-100` is the worst offender.
- `library/page.tsx:281` — playlist tile is a `<Link>` with no menu/edit anywhere. Tapping the cover opens detail; there is **no way to delete from the library tab**, only from `/my-playlists`. This is acceptable but should be documented as intentional.
- `my-playlists/[id]/page.tsx` — title is read-only. No inline-edit. The only way to rename a playlist is via the API. Missing affordance.
- `TrackRow.tsx:307-336` — the `<TrackActionMenu>` is `hidden md:block`. Long-press on mobile correctly opens TrackActionSheet (already wired, line 139-154). **OK.** The pattern works for tracks; we need the same for playlists.

### 2.7 Misc

- `library/page.tsx:195` — tab strip uses `border-b-[2px]` on the container but each tab has a `border-r-[2px]` divider. This is **not in DESIGN §6** explicitly but matches the brutalist eyebrow strip used on `/album`. Keep it.
- `library/page.tsx:254,377` — relative-time badges (`fmtRelative`) are `hidden md:block` with `right-[88px]` absolute positioning over the TrackRow. **Mobile users see no "saved at" / "played at" hint.** Consider promoting this to a metadata line on mobile (third line in TrackRow text col) or a sheet entry.
- `playlist/page.tsx:113-120` — `hidden sm:grid` column header: fine. But mobile gets nothing. Add a mono caption "TRACKLIST" before the rows on mobile (already done at line 96-104, partially) — rows are fine.
- `AddToPlaylist.tsx:124-173` — uses `<DropdownMenu>` not `<Sheet>`. **On mobile this opens a small floating menu near the trigger**, which collides with the TrackRow it was triggered from and feels like desktop chrome. The mobile flow already exists *inside* TrackActionSheet (via `PlaylistPicker`). The standalone `<AddToPlaylist>` should redirect to the same sheet on `<md`.

## 3. Unified collection page pattern

All four pages collapse to `<CollectionHeader>` + `<TrackListing>` (or `<CardGrid>` for `/library`'s tabs and `/my-playlists`). Document the unified pattern:

### `<CollectionHeader>` — mobile (<md)

```
┌──────────────────────────────────┐
│ EYEBROW · MONO 10px              │  brutal-label, text-muted
│                                  │
│ ┌────────────┐                   │
│ │            │                   │  cover ~40vw, max 200px
│ │   COVER    │                   │  square, border-2, shadow-brutal
│ │   200×200  │                   │  centered or left-aligned
│ │            │                   │
│ └────────────┘                   │
│                                  │
│ TITLE TEXT (truncate-2-lines)    │  text-brutal-lg, m-0
│                                  │
│ 12 TRACKS · 47:23                │  font-mono text-[10px] uppercase
│                                  │
│ ┌──────────────────────┐ ┌─┐ ┌─┐│
│ │  PLAY · 48px tall    │ │S│ │M││  primary button + 2-3 icons
│ └──────────────────────┘ └─┘ └─┘│  shuffle / share / more
└──────────────────────────────────┘
```

Specifics:
- Cover: `aspect-square w-[40vw] max-w-[200px]` mobile, `border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)]`. **Centered** on mobile (no side-by-side text — that breaks at 360).
- Title: `text-brutal-lg m-0`, optional `<span class="text-primary">.</span>` as the brutal accent ending. Truncate with `line-clamp-2`.
- Subtitle: `font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground` — track count, total duration, owner.
- Action row: `grid grid-cols-[1fr_44px_44px_44px] gap-2 mt-4` mobile.
  - **PLAY** is the primary brutal button: `h-12 w-full bg-primary text-white border-2 border-foreground shadow-[var(--shadow-brutal)] uppercase font-mono font-black tracking-[0.12em]`. Label: `▶ PLAY ALL` or `▶ SHUFFLE` toggle.
  - Then 3× 44×44 icon-only buttons: Shuffle (when distinct), Add-to-queue, Share, More (overflow → opens `<CollectionActionSheet>` for download/edit/delete).
- Stack vertically. **Never side-by-side cover/text on small screens** (current `playlist/page.tsx` is the sane baseline; `my-playlists/[id]` has no cover at all and needs one synthesised from track covers).

### `<CollectionHeader>` — desktop (≥md)

```
┌──────────────────────────────────────────────────────┐
│ EYEBROW                                              │
│                                                      │
│ ┌──────────┐  TITLE TEXT                            │
│ │          │                                         │
│ │  COVER   │  12 TRACKS · 47:23 · BY OWNER          │
│ │ 240×240  │                                         │
│ │          │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──┐ ┌──┐│
│ └──────────┘  │ PLAY │ │SHFFL │ │SHARE │ │+ │ │..││
│               └──────┘ └──────┘ └──────┘ └──┘ └──┘│
└──────────────────────────────────────────────────────┘
```

- Cover left (`md:w-60` = 240px), text+actions right.
- Action row sits beneath the title, **not** above it. Buttons get desktop sizes (`h-9`).

### `<TrackListing>` — both

- Wraps the list of `<TrackRow>` rows in the existing `border-2 sm:border-[3px] border-foreground bg-card overflow-hidden` shell.
- **Virtualization**: when `tracks.length > 50`, mount via `@tanstack/react-virtual` (already feasible with rowHeight ≈ 60px). Below 50, render all. Library saved tracks (`limit=200` per `library/page.tsx:130`) is the practical worst case.
- **Multi-select mode**: long-press on mobile, shift-click on desktop. Enter mode → checkbox slides in from the left of each row (animates `width: 0 → 32px`), `<SelectionActionBar>` slides down from below the page header (sticky-top, z-30, see §3 wireframe). Exit mode via Esc, "DONE" button, or empty selection.
- **Empty state**: brutal frame `<EmptyState>` already exists in `library/page.tsx:404-433`. Reuse, don't duplicate. Move to `src/components/ui/empty-state.tsx`.

### `<SelectionActionBar>` — mobile-first

```
┌──────────────────────────────────┐
│ ☑ 3 SELECTED      [×] DONE       │  sticky top-[64px] (below top bar)
│ [+ PLAYLIST] [⤓ DL] [♥] [🗑]    │  4 actions, 44×44, gap-2
└──────────────────────────────────┘
```

- `sticky top-16 z-30`, `bg-background border-b-[3px] border-foreground`.
- Left: count + Done button (44×44, ghost variant).
- Right: action grid. Actions vary by context — see per-page.
- Minimum height 56px. Animates with `motion.div` using existing iOS-style easing from DESIGN §11.

## 4. Per-page specs

### 4.1 `/library` (saved tracks + recent + albums + playlists tabs)

The most complex page. Already has 4 tabs; redesign keeps tabs but adds:

- **Sort/filter pills** below the tab strip on the saved-tracks and recent tabs:
  - Saved tracks: `All / Recently Added / By Artist / By Album`. Stored in `useUserPreferences` (already exists, see `useUserPreferences` import in `my-playlists/[id]/page.tsx:12`).
  - Recent: `Today / 7 Days / 30 Days / All Time`.
  - Implementation: horizontal scroll strip mirroring `library/page.tsx:195` tab pattern but with `rounded-none border-2` chips. Mobile: `overflow-x-auto scrollbar-hide`.

- **Bulk-action sticky bar** (selection mode):
  - Saved tracks tab: `Remove from library / Add to playlist / Download / Play next`.
  - Recent tab: `Save to library / Add to playlist / Clear from history`.
  - Albums tab: `Unsave / Open / Download all (all selected albums' tracks)`.
  - Playlists tab: `Delete / Duplicate / Export to Spotify (future)`.

- **No primary "Play All" CTA at the page level** (different content per tab) — instead, each tab can show its own `<CollectionHeader>` with appropriate actions. Saved tracks → "Play all liked". Recent → "Replay last". Albums tab → no header (it's a grid).

#### ASCII wireframe — `/library` (saved tracks tab, mobile)

```
┌──────────────────────────────────┐
│ ☰ ⌂ deemix          [👤]        │  64px top bar (z-30)
├──────────────────────────────────┤
│ LIBRARY                          │
│                                  │
│ MY COLLECTION.                   │  text-brutal-xl
│ 4 PLAYLISTS · 12 ALB · 87 TRACKS│
│                                  │
│ ┌───┬───┬───┬─────┐              │  tab strip
│ │REC│TRK│ALB│PLAY │              │  scroll-x
│ └───┴───┴───┴─────┘              │
│ ╔══════════════════════════════╗ │
│ ║ All  RecentAdd  Artist  Album║ │  sort pills (saved tab)
│ ╚══════════════════════════════╝ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ▶ PLAY ALL · 87 TRACKS       │ │  CollectionHeader inline action
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │  TrackListing
│ │ 01 [▣] Title             ♥ ⋯│ │  (long-press → action sheet
│ │ 02 [▣] Title             ♥ ⋯│ │   or → enters selection mode)
│ │ 03 [▣] Title             ♥ ⋯│ │
│ │ ...                          │ │
│ └──────────────────────────────┘ │
│                                  │
│              [MiniPlayer]        │  z-45, 8px above bottom nav
├──────────────────────────────────┤
│  HOME  SRCH  LIB  PL  ⚙          │  bottom nav z-50
└──────────────────────────────────┘
```

#### Concrete file:line changes (`library/page.tsx`)

| Line | Current | Change |
|---|---|---|
| 119-142 | All 4 lists fetched in parallel on mount | Keep, but split per-tab with `<Suspense>` boundaries so the active tab renders first |
| 169-175 | Whole-page `<Loader2>` | Replace with skeleton matching the active tab layout (per DESIGN §15 "no CLS") |
| 180-192 | `mb-7` page header | Tighten to `mb-4 sm:mb-7` |
| 195-221 | Tab strip | Reusable `<TabStrip>` component; keep markup but extract |
| 224-262 | Recent tab list | Wrap in `<TrackListing>`; show relative time on mobile (third line in TrackRow text col, or small chip) |
| 264-298 | Playlists grid | Move to `<PlaylistCardGrid>`; add long-press → `<PlaylistActionSheet>` for delete/edit/duplicate |
| 300-343 | Albums grid | Move to `<AlbumCardGrid>`; same long-press treatment |
| 345-385 | Saved tracks list | Wrap in `<TrackListing>` w/ multi-select enabled; add `<CollectionHeader>` with Play All button |
| 404-433 | `<EmptyState>` | Extract to `src/components/ui/empty-state.tsx` |

### 4.2 `/my-playlists` (user's playlists list)

- **Grid**: 2 / 3 / 4 / 5 cols (matches DESIGN §9 cascade). Fix `gap-2` → `gap-3 sm:gap-4` (line 207).
- **Card content**: cover + name + track count. Add updated-at on mobile too (currently only library shows it). Long-press → `<PlaylistActionSheet>` mirroring `<TrackActionSheet>` with: Open / Rename / Duplicate / Export / Delete.
- **"Create playlist" CTA**: **fixed FAB** bottom-right, **above MiniPlayer + bottom nav stack**. Placement: `fixed right-3 bottom-[calc(64px+env(safe-area-inset-bottom)+8px+64px+12px)]` on mobile (i.e. above MiniPlayer if active, else above bottom nav). On desktop, primary header button (current pattern). The FAB is `h-14 w-14`, `bg-primary text-white border-2 border-foreground shadow-[var(--shadow-brutal-hover)]`, lucide `<Plus />` 24px.
- **"Import from Spotify" CTA**: keep in header on desktop, but on mobile move to a top-right "+" dropdown / sheet that contains both `New playlist` and `Import from Spotify` — to keep the action surface lean.
- **Delete dialog (line 238-259)**: convert to a bottom-sheet on mobile via the same `Sheet` primitive used by TrackActionSheet (DESIGN §9 "Use the same `Sheet` primitive with `side="bottom"` for mobile, OR a `Dialog` for desktop").

#### ASCII wireframe — `/my-playlists` (mobile)

```
┌──────────────────────────────────┐
│ TOP BAR                          │
├──────────────────────────────────┤
│ MY PLAYLISTS                     │
│ 6 PLAYLISTS                      │
│                                  │
│ ┌─────────┐  ┌─────────┐         │  2-col grid, gap-3
│ │  COVER  │  │  COVER  │         │
│ │   2×2   │  │  single │         │
│ │ ▥▥▥▥▥▥▥ │  │   img   │         │
│ ├─────────┤  ├─────────┤         │
│ │ TITLE   │  │ TITLE   │         │
│ │ 12 TR   │  │ 4 TR    │         │
│ │ MAY 5   │  │ APR 12  │         │
│ └─────────┘  └─────────┘         │
│ ┌─────────┐  ┌─────────┐         │
│ │  ...    │  │  ...    │         │
│ └─────────┘  └─────────┘         │
│                                  │
│                          [ FAB ]│  56×56 fixed, above MiniPlayer
│                          [  +  ]│  bg-primary, lucide Plus
│              [MiniPlayer]        │
├──────────────────────────────────┤
│  HOME  SRCH  LIB  PL  ⚙          │
└──────────────────────────────────┘
```

#### Concrete file:line changes (`my-playlists/page.tsx`)

| Line | Current | Change |
|---|---|---|
| 145-196 | Header with inline 2 buttons | Replace with `<CollectionHeader variant="compact" />` (no cover, just title + count + actions on mobile collapse to a single overflow menu) |
| 207 | `grid ... gap-2 sm:gap-4` | `gap-3 sm:gap-4` |
| 222-232 | Hover-only delete button | Remove. Long-press card → `<PlaylistActionSheet>` |
| 165-194 | New-playlist Dialog | Keep on desktop; bottom-sheet on mobile (Sheet primitive) |
| 238-259 | Delete confirm Dialog | Same: bottom-sheet on mobile |
| n/a | (no FAB) | Add `<CreatePlaylistFab>` mobile-only |

### 4.3 `/my-playlists/[id]` (playlist detail, owner)

- **CollectionHeader with editable title**: tap title (or pencil icon next to it) → `<EditableTitle>` swaps to a brutal `<Input>`, autofocus, Enter or blur saves via `PATCH /api/v1/playlists/:id`. Esc reverts.
- **Synthesised cover**: re-use the 2×2 mosaic from `library/page.tsx:96-103` / `my-playlists/page.tsx:34-67`. Compute on the page from `playlist.tracks[0..3].coverUrl`.
- **Actions row**: PLAY ALL (primary, 60% width), Shuffle (44×44), Add tracks (44×44), Share (44×44), More (44×44 → opens `<PlaylistActionSheet>`).
- **Drag-to-reorder**: long-press on a row enters drag mode (mobile) — uses the existing `useLongPress` hook. The drag handle becomes visible, the row has `cursor: grabbing`, other rows shift to indicate drop target. Persist new order via `PATCH /api/v1/playlists/:id/tracks/reorder` (new endpoint — flag as TODO if not yet implemented). On desktop, a drag handle (≡ icon) appears on hover at the **left edge** of TrackRow, replacing/augmenting the track number column.
- **Tradeoff**: long-press is currently bound to "open TrackActionSheet" in `TrackRow.tsx:139-154`. The same gesture cannot do both. Resolve by:
  - **Recommended**: long-press *anywhere on the row* → TrackActionSheet (current behavior). Drag is initiated by long-pressing **the cover/track number column only** (small target, but explicit). On desktop, hover reveals the drag handle.
  - Alternative: in playlist-owner mode, the page toggles a "REORDER" mode (new chip/button in the action row). Inside that mode, the entire row is draggable; tap the chip again to exit.
- **Add tracks**: pinned bottom action when list is short (`tracks.length < 10`), or a button in the action row when long. Opens a `<TrackSearchSheet>` — bottom-sheet at 90vh that mounts a search input + result list. Tap a result → POST add. Sheet stays open for batch add.
- **Sort vs reorder collision**: `useUserPreferences().playlistSortOrder` (line 40-41) flips position direction. Disable sort while in REORDER mode (or remove sort entirely — playlist owners want manual order, listeners want sort).

#### ASCII wireframe — `/my-playlists/[id]` (mobile)

```
┌──────────────────────────────────┐
│ TOP BAR                          │
├──────────────────────────────────┤
│ ← PLAYLIST                       │  back arrow as ghost button
│                                  │  44×44, top-left
│       ┌────────────┐             │
│       │            │             │
│       │  2×2 cover │             │  ~40vw, centered
│       │  mosaic    │             │
│       │            │             │
│       └────────────┘             │
│                                  │
│ PLAYLIST NAME ✎                  │  tap title → inline edit
│                                  │
│ 12 TRACKS · 47:23                │
│                                  │
│ ┌──────────────┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐│
│ │ ▶ PLAY ALL  │ │S│ │+│ │↗│ │⋯││  shuffle, addQ, share, more
│ └──────────────┘ └─┘ └─┘ └─┘ └─┘│
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 01 [▣] Title             ♥  │ │  TrackListing
│ │ 02 [▣] Title             ♥  │ │  long-press anywhere → sheet
│ │ ...                          │ │  long-press on # col → drag
│ │                              │ │
│ │ ┌──────────────────────────┐ │ │  pinned bottom (sticky)
│ │ │  + ADD TRACKS            │ │ │  44px tall ghost button
│ │ └──────────────────────────┘ │ │
│ └──────────────────────────────┘ │
│              [MiniPlayer]        │
├──────────────────────────────────┤
│  HOME  SRCH  LIB  PL  ⚙          │
└──────────────────────────────────┘
```

#### Concrete file:line changes (`my-playlists/[id]/page.tsx`)

| Line | Current | Change |
|---|---|---|
| 130-162 | Header is `flex items-center gap-3` with back button + title + sort | Replace with `<CollectionHeader variant="playlist" editable />`. Move sort into More overflow sheet. |
| 75-95 | `handleRemoveTrack` | Keep; wire from TrackActionSheet's `onDelete` callback (already passed at line 190) |
| n/a | (no editable title) | Mount `<EditableTitle>`; PATCH endpoint TODO |
| n/a | (no drag) | Mount drag-and-drop on TrackListing; new endpoint TODO |
| n/a | (no Add tracks UI) | Pinned button at list bottom → `<TrackSearchSheet>` |
| 164-170 | Empty state | Reuse `<EmptyState>` with action "Add tracks" → opens search sheet |
| 172-196 | List render | Wrap in `<TrackListing>`; pass `selectionEnabled` and `reorderEnabled` props |

### 4.4 `/playlist` (public Deezer playlist viewer, read-only)

- Same `<CollectionHeader>` pattern. Cover from Deezer (`picture_xl`).
- **No edit** affordance.
- **"Save / Follow" CTA**: prominent. On mobile this is the primary action — replace "PLAY ALL" with a **two-button** row: PLAY ALL (60%) + SAVE (40%, shows ♥ filled when saved). Implementation: import any tracks from this playlist into a new local playlist or just save them as individual tracks (project decision).
- **Share**: secondary icon button (44×44) — copies the public Deezer URL or generates a deemix-next share URL via existing `<ShareDialog>`.

#### ASCII wireframe — `/playlist` (mobile)

```
┌──────────────────────────────────┐
│ TOP BAR                          │
├──────────────────────────────────┤
│ PLAYLIST · BY OWNER NAME         │
│                                  │
│       ┌────────────┐             │
│       │            │             │
│       │ 200×200    │             │
│       │ Deezer     │             │
│       │ cover      │             │
│       └────────────┘             │
│                                  │
│ PLAYLIST NAME.                   │
│                                  │
│ BY OWNER · 87 TRACKS · 4:21:47  │
│                                  │
│ ┌────────────┐ ┌──────┐ ┌─┐ ┌─┐│
│ │ ▶ PLAY     │ │ ♥SAVE│ │↗│ │⋯││  PLAY 50% / SAVE 30% / icons
│ └────────────┘ └──────┘ └─┘ └─┘│
│                                  │
│ TRACKLIST                        │
│ ┌──────────────────────────────┐ │
│ │ 01 [▣] Title          🎵320 │ │  bitrate badge visible
│ │ 02 [▣] Title          🎵FLAC│ │
│ │ ...                          │ │
│ └──────────────────────────────┘ │
│              [MiniPlayer]        │
├──────────────────────────────────┤
│  HOME  SRCH  LIB  PL  ⚙          │
└──────────────────────────────────┘
```

#### Concrete file:line changes (`playlist/page.tsx`)

| Line | Current | Change |
|---|---|---|
| 64-91 | Hero with side-by-side cover/text on `md` | Migrate to `<CollectionHeader variant="public" />`. Centered cover on mobile. |
| 93-104 | Tracklist heading w/ count | Move count to subtitle in CollectionHeader; remove redundant `border-b-[2px]` heading on mobile (becomes noise). Keep on desktop. |
| 105-110 | Empty state ad-hoc | Use `<EmptyState>` |
| 111-137 | TrackList wrapper | `<TrackListing>` (no selection, no reorder; just play-on-tap) |
| n/a | (no Save CTA) | Add SAVE button in CollectionHeader actions |

## 5. AddToPlaylist component (mobile)

Currently a `<DropdownMenu>` (line 124) + a `<Dialog>` (line 175). On mobile the dropdown opens as a tiny floating menu near the trigger — wrong primitive.

Recommended:
- **Drop the standalone dropdown**. The exact same flow already exists inside `<TrackActionSheet>` via `<PlaylistPicker>` (lines 99-278 of `TrackActionSheet.tsx`). Outside the action sheet, callers are: `TrackRow` (already opens action sheet on long-press), and any direct usage in tracklists.
- **Replacement contract**: `<AddToPlaylist>` becomes a thin trigger that opens the global TrackActionSheet directly to its Playlist view (`setView("playlists")`). The component shrinks to ~40 lines.
- Backward-compat: keep the desktop dropdown (`md:`) for power users; mobile (`<md`) just opens the sheet.
- **Hit area**: trigger button must be 44×44 mobile (currently `size="icon"` = 36×36).

## 6. ImportSpotifyDialog (mobile)

- **Convert to bottom sheet on mobile** via the `<Sheet>` primitive. The desktop `<Dialog>` is fine; gate with `md:` variant. Pattern: render `<Sheet>` for mobile and `<Dialog>` for desktop conditionally, or extract the form body and reuse it inside both shells.
- **Form layout**: full-width input (`h-12` on mobile per DESIGN §9), label `IMPORT FROM SPOTIFY` as eyebrow, helper text, single primary button below the input. **Stack** Cancel above Import, never side-by-side at <380px.
- **Loading state**: keep the spinner + "Matching tracks…" label. **Don't disable backdrop dismiss** (line 78-79 already disables close mid-import — that's correct for mobile too; pair with a visible "Matching" status pill so users know they aren't stuck).
- **Result state**: the not-found list (`max-h-64 overflow-y-auto`, line 239) needs to use `dvh` math. On a small phone with `max-h-[60dvh]` it has room; with the current `max-h-64 = 256px` plus dialog padding it can overflow. Switch to `flex-1 min-h-0 overflow-y-auto` inside a `flex flex-col max-h-[85dvh]` sheet.
- **"Search" link** (line 252): wrap in a `<Button variant="ghost" size="sm">` for proper hit area; current `inline-flex` text link is too small on mobile.
- **Show-more button** (line 263-271): convert to inline expand-in-place rather than a separate button — pulls focus in a sheet context.

## 7. Components to create (NEW)

| Component | Path (proposed) | Notes |
|---|---|---|
| `<CollectionHeader>` | `src/components/collections/CollectionHeader.tsx` | Props: `variant: "library" \| "playlist-owner" \| "playlist-public" \| "album"`, `cover`, `title`, `eyebrow`, `subtitle`, `actions`, `editable`. Renders mobile-stacked / desktop-side-by-side automatically. |
| `<TrackListing>` | `src/components/collections/TrackListing.tsx` | Props: `tracks`, `queue`, `selectionEnabled`, `reorderEnabled`, `onReorder`, `virtualize`, `emptyState`. Wraps `<TrackRow>` with multi-select wiring. |
| `<SelectionActionBar>` | `src/components/collections/SelectionActionBar.tsx` | Sticky-top bar surfaced when `useSelectionStore` has items. Actions are passed in by the page (page-specific). |
| `<EditableTitle>` | `src/components/ui/editable-title.tsx` | Click/tap → swap text for `<Input>`. Confirm on Enter or blur, Esc to revert. Calls `onSave` async; shows pending spinner. |
| `<PlaylistActionSheet>` | `src/components/playlists/PlaylistActionSheet.tsx` | Mirror of `<TrackActionSheet>`. Actions: Open / Play all / Rename / Duplicate / Export / Delete. Uses same Sheet primitive. |
| `<TrackSearchSheet>` | `src/components/tracks/TrackSearchSheet.tsx` | Bottom sheet with search + result list. Used by playlist-detail "Add tracks". |
| `<CreatePlaylistFab>` | `src/components/playlists/CreatePlaylistFab.tsx` | Mobile-only FAB, fixed bottom-right above MiniPlayer + bottom nav. Triggers same New-playlist sheet as the desktop button. |
| `<EmptyState>` | `src/components/ui/empty-state.tsx` | Extract from `library/page.tsx:404-433`. Reuse everywhere. |
| `<TabStrip>` | `src/components/ui/tab-strip.tsx` | Extract the brutal tab pattern from `library/page.tsx:195-221`. Generic, reusable. |
| `useSelection()` | `src/hooks/useSelection.ts` | Or Zustand store `useSelectionStore`. Track selected ids, mode boolean, page-scoped state, clear-on-route-change. |

## 8. Implementation order

Numbered sequence with dependencies. **S = small (≤2h)**, **M = medium (½–1d)**, **L = large (1–3d)**.

1. **[S] Extract `<EmptyState>` + `<TabStrip>`** from `library/page.tsx`. Drop-in replacements; write a Vitest snapshot per the locked-in surface contract (CLAUDE.md fix-bug-once rule).
2. **[S] Fix `gap-2 → gap-3`** on `my-playlists/page.tsx:207`. Tighten `mb-7 → mb-4 sm:mb-7` on `library/page.tsx:180`.
3. **[M] Build `<CollectionHeader>`**. Land it on `playlist/page.tsx` first (lowest risk, public route, no edit affordances). Add Save action stub.
4. **[M] Build `<TrackListing>` (no selection yet)**. Migrate `library/page.tsx` (saved tracks + recent), `my-playlists/[id]/page.tsx`, `playlist/page.tsx` to use it. Maintains current behavior; refactor only.
5. **[M] Add `useSelection` + `<SelectionActionBar>`**. Wire into `<TrackListing>` behind a `selectionEnabled` prop. Land on `library/page.tsx` saved-tracks tab first.
6. **[S] Migrate `AddToPlaylist`** to delegate to TrackActionSheet on mobile. Keep desktop dropdown.
7. **[M] Convert ImportSpotifyDialog** to bottom sheet on mobile. Extract form body to a shared `<ImportSpotifyForm>` component used inside both Sheet (mobile) and Dialog (desktop) shells.
8. **[M] Build `<EditableTitle>` + PATCH `/api/v1/playlists/:id`** endpoint. Wire into `my-playlists/[id]/page.tsx`.
9. **[M] Build `<PlaylistActionSheet>`**. Wire into `<my-playlists>` cards (long-press) and into `<my-playlists/[id]>` More button. Replace the hover-only delete button.
10. **[L] Build `<TrackSearchSheet>` + Add Tracks flow** for playlist-detail. Server route exists (POST `/api/v1/playlists/:id/tracks`); just need UI + search hookup.
11. **[L] Build drag-to-reorder** for playlist-detail. Add `PATCH /api/v1/playlists/:id/tracks/reorder` endpoint. UI uses `framer-motion` (already a dep) `Reorder.Group`. Test with `prefers-reduced-motion` to ensure fallback.
12. **[S] Add `<CreatePlaylistFab>`** for mobile, place above MiniPlayer + bottom nav.
13. **[S] Polish per-page**: relative time on TrackRow mobile (`/library` recent + saved tabs), bitrate badges visible on `/playlist` mobile, disable sort while in REORDER mode.

Approximate dependency graph:
- 1, 2 are independent and can land first.
- 3 unblocks 4. 4 unblocks 5, 8, 9.
- 6, 7 are independent and can land in parallel with 3-4.
- 10, 11 are the biggest swings; do last.
- 12 is a 1-hour job that can land any time after 2.

## 9. Effort estimate

| Task | Size | Approx hours |
|---|:--:|---:|
| 1. Extract EmptyState + TabStrip | S | 2 |
| 2. Spacing/gap fixes | S | 1 |
| 3. CollectionHeader | M | 6 |
| 4. TrackListing (no selection) | M | 8 |
| 5. useSelection + SelectionActionBar | M | 8 |
| 6. AddToPlaylist mobile delegate | S | 2 |
| 7. ImportSpotifyDialog → bottom sheet | M | 5 |
| 8. EditableTitle + PATCH endpoint | M | 4 |
| 9. PlaylistActionSheet | M | 6 |
| 10. TrackSearchSheet + Add Tracks flow | L | 12 |
| 11. Drag-to-reorder + endpoint | L | 16 |
| 12. CreatePlaylistFab | S | 1 |
| 13. Polish | S | 3 |

**Total: ~74 hours = ~9 working days.** Halve if a single engineer pair-programs and the larger pieces (10, 11) land in a single sitting; budget 2 sprints conservatively.

## 10. Risks & open questions

### Risks

- **Long-press collision** (R-1, high): TrackRow's long-press is currently the only path to TrackActionSheet on mobile. Adding drag-to-reorder must not steal that gesture. Recommendation: drag is initiated only on the track-number column (`# col`), not the whole row; long-press elsewhere keeps opening the action sheet. Verify with users — this is non-discoverable. Mitigate with a brief "REORDER" mode toggle button as fallback.
- **Multi-select discoverability** (R-2, medium): on mobile, "long-press to select multiple" is non-obvious. Pair with a visible "SELECT" button in the page action row. Show a one-time onboarding hint.
- **Virtualization regressions** (R-3, medium): the existing `TrackRow` does its own `IntersectionObserver` for prefetch (line 196-214). Virtualizing the list breaks that observer (unmounted rows). Either (a) virtualize but keep prefetch logic at the page level, sliding a window manually; (b) skip virtualization until lists exceed 200 (current cap) and accept the perf hit. Prefer (a).
- **Sticky FAB + MiniPlayer overlap** (R-4, medium): the FAB sits above the MiniPlayer; if MiniPlayer animates in/out, the FAB position must update. Use a single bottom-anchor stack manager or recompute via container queries on `:has(.miniplayer)`.
- **Reorder endpoint availability** (R-5, blocking task 11): no `PATCH /api/v1/playlists/:id/tracks/reorder` exists today. Need to add (Prisma `position` column update). Out of scope for this spec, must be tracked.
- **Selection-mode scroll behavior** (R-6, low): when SelectionActionBar appears, the page jumps by 56px. Use `position: sticky` so it doesn't disrupt scroll; fade-in opacity from 0 to 1 over 150ms.
- **Sticky hover on cards** (R-7, low, DESIGN §6): the `.brutal-card-hover` translate persists after tap on Chrome Android. Verify in DevTools Emulate Touch; if reproducible, gate `hover:` rules behind `[@media(hover:hover)]:`. Affects all collection grid cards.

### Open questions

- **Q1**: Should `/playlist` (public) save the entire playlist as a copy in the user's library, or save individual tracks one by one? Affects the Save CTA design and copy. Suggest: "Save all to library" (saves tracks individually as liked) + a separate "Duplicate as my playlist" option.
- **Q2**: Are the saved-tracks `limit=200` enough? At 200, no virtualization required for most users. If we lift the cap (e.g. user with 5k saved tracks), virtualization is mandatory.
- **Q3**: Does selection-mode persist across tab switches in `/library`? Recommendation: no — clearing selection on tab change is the simpler, less surprising contract.
- **Q4**: Should the sort UI on `my-playlists/[id]` (line 151-160) survive when reorder is enabled? Suggest: while reorder mode is on, hide sort. Tap reorder again to exit, sort returns. Document in inline help.
- **Q5**: Is "Import from Spotify" expected to work without user-Deezer-ARL? `ImportSpotifyDialog.tsx:43` shows `NO_DEEZER_ARL` is a known error. Should we surface a settings-deeplink before opening the sheet on mobile to avoid a dead-end flow.
- **Q6**: Drag-to-reorder on iOS Safari (out of scope per CLAUDE.md "Chrome-locked") — if a future Safari requirement appears, `<Reorder.Group>` from framer-motion is touch-OK but pointer-events need verification. Assume Chrome-only per project policy.
