# Mobile-First Spec — Album & Artist

## 1. Files in scope

| File | Lines | Role |
|---|---|---|
| `src/app/(main)/album/page.tsx` | 235 | Album detail page (header + tracklist) |
| `src/app/(main)/artist/page.tsx` | 253 | Artist detail page (hero + top tracks + discography tabs) |
| `src/components/tracks/TrackRow.tsx` | 340 | Single row primitive, used by both above |
| `src/components/tracks/TrackActionMenu.tsx` | 509 | Desktop 3-dot menu (mobile is sheet via `useTrackActionStore`) |
| `src/components/tracks/SaveButton.tsx` | 52 | Heart toggle (size-7, 28×28 — fails 44×44 mobile baseline) |

Total: 1,389 lines.

## 2. Mobile audit (current state)

Concrete issues, ordered by visual severity at 360px:

### Album page (`album/page.tsx`)

- **L141** `flex flex-col md:flex-row gap-8` — vertical stack with **gap-8 (32px)** on mobile is too generous, hero burns 280–320px before any tracks visible. Should be `gap-3` mobile, `md:gap-8`.
- **L145** Cover is `w-32 h-32 sm:w-48 sm:h-48` (128px → 192px). DESIGN spec asks ~50vw centered max 240px. At 360px viewport the 128px cover lands left-aligned on a tall column, looks postage-stamped. Move to `w-[50vw] max-w-[240px] mx-auto sm:mx-0`.
- **L147** `flex flex-col justify-end gap-3` — `justify-end` with no fixed parent height does nothing on mobile; meant for the desktop horizontal row. On mobile the metadata floats with no rhythm hook. Switch to `items-center md:items-start text-center md:text-left`.
- **L148–150** `<Badge variant="secondary">` for record-type. Brutalist style — keep, but it's the only badge with no follow/save status visible at a glance. Move `albumSaved` indicator into the badge stack.
- **L154** `flex items-center gap-2 text-sm text-muted-foreground` for metadata row — at 360px a long artist name + " · 12 tracks · 2024-01-15" wraps unpredictably. Should be **mono label** per DESIGN §3 (`brutal-label` / `text-[10px] font-mono font-bold uppercase tracking-[0.14em]`), and the dot separator must be replaced with `<span aria-hidden="true">·</span>` or vertical divider; `text-border` on a separator (L158) is **invisible** on `--card`.
- **L151** `<h1 className="text-brutal-lg">` — fine per DESIGN, but no `line-clamp-2`. Long album titles ("The Suburbs (Deluxe Edition with Bonus Tracks)") will run 4 lines on mobile and steamroll the viewport.
- **L169** `AlbumSaveButton` is **the only action**. No PLAY button. No Shuffle. No Share. No More. The page is download-engine-driven; there's no "play album" CTA — the implicit affordance is "tap any TrackRow." This is a **major mobile ergonomic failure**: per DESIGN §0, primary actions live in bottom 60%. Mobile users have no one-tap way to play the album.
- **L34** `w-fit mt-1 gap-2` on the save button — `w-fit` makes it 130px wide; on mobile it should be **full-width 48px** (per spec §3 below).
- **L177** `<Separator />` between hero and tracklist — spec asks no soft separators, brutalist uses 2px borders on rows themselves. Drop or replace with `border-t-[2px] border-foreground` on the tracklist container.
- **L190–199** Tracklist `<div>` has the desktop column-header but it's `hidden sm:grid` — fine. But the outer wrapper has `border-2 sm:border-[3px]` + `overflow-hidden` — at 360px viewport with `px-3` page padding (12px each side), the rows abut the edge cleanly. No horizontal-scroll risk because `TrackRow` already has `overflow-hidden`. OK.
- **L207–214** `TrackRow` rendered with `trackNumber={Number(trackNum)}`. Good. But **`showBitrate` defaults true** — on mobile rows with FLAC labels at 360px the title column gets squeezed. Should pass `showBitrate={false}` on mobile (already hidden via responsive grid in TrackRow's gridClass — verify visually).
- No `priority` / explicit `sizes` attribute on hero `CoverImage`. CLS risk on slow connections; LCP candidate is the hero cover.
- **L116–121** Loading spinner is `min-h-[50vh]` centered — **no skeleton**. DESIGN §15 requires loading skeletons matching final layout. Replace with stub hero + 6 row skeletons.

### Artist page (`artist/page.tsx`)

- **L92** `flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8` — `gap-6` on mobile (24px) between centered photo and centered text — fine, but the **circular photo** at `w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52` (128/176/208px) inside a brutalist site with `rounded-full overflow-hidden` (L96) is a **style violation** per DESIGN §0 (no soft shadows, hard borders, no gradient mush). Round artist heads contradict the brutalist box vocabulary. Spec proposes a brutal frame instead.
- **L99** `<h1 className="text-brutal-xl m-0">{artistName}<span className="text-primary">.</span></h1>` — text-brutal-xl is `clamp(2rem, 5vw, 4rem)`. At 360px this is 32px which is fine, but **the text is centered on mobile** (L98 `text-center md:text-left`), and the trailing primary dot floats orphaned next to whatever wraps. Add `text-balance` and pin alignment.
- **L102–106** Fan count rendered twice: L89–91 eyebrow ("ARTIST · 1,234 FANS") and L102 body ("1,234 FANS · DEEZER"). Redundant; collapse to one location.
- **No follow/save action.** No share. No shuffle-discography button. No play-top-tracks button. The artist page is **read-only** at the hero level — major mobile gap. Top tracks have to be tapped one at a time.
- **L116** `<h2 className="text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0">TOP TRACKS</h2>` — only 16px on mobile, fine for a section title but on a long artist page the **section header is undifferentiated from the TrackRow titles** (also bold, similar weight). Bump to `text-brutal-md` per DESIGN §3.
- **L167–174** Discography uses `<Tabs>` (Base UI primitive). On mobile with 6 tab keys ("All / Albums / Singles / EPs / Featured / More"), `<TabsList>` will likely overflow horizontally. Need to verify `TabsList` has `overflow-x-auto scrollbar-hide` baked in. If not, the labels truncate or wrap.
- **L171** `{tabLabels[key] || key} ({discography[key].length})` — count in parens at the end of each label means "Albums (24)" is at minimum ~80px wide. 6 of these = 480px and **overflows 360px viewport**.
- **L178** Discography grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4`. Per DESIGN §9 cards should never have `gap-2` (borders touch). This is **wrong on mobile**. Should be `gap-3 sm:gap-4`.
- **L192** `border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px]` — **sticky-hover risk** per DESIGN §6. Wrap hover transforms in `[@media(hover:hover)]:`. The same issue affects every card on the page on Chrome Android.
- **L201–206** "Saved" badge: `absolute top-1.5 right-1.5 ... bg-accent text-foreground text-[10px] font-bold uppercase px-1.5 py-0.5 border-2`. Good brutalist pattern. Keep.
- **L211** `<Link className="text-sm font-medium truncate block">` — `truncate` clips long titles. On mobile this is fine but combined with the small font (14px) and `text-muted-foreground` mono date below (L215), the card is hard to scan. Bump title to `text-[13px] font-bold`.
- **No artist bio**. The fetch returns no biography data. Either add a fetch or document it as gap.
- **No "related artists" section.** Discovery surface for the artist is sparse on mobile.

### TrackRow (in album/artist context)

- **L221–224** `gap-2 sm:gap-3 items-center px-2 sm:px-3 py-2 sm:py-2.5`. Mobile row is ~52px tall — DESIGN §9 wants `min-h-[64px]` mobile for thumb comfort. Bump.
- **L264–286** Artist + Album linkage rendered together in subtitle. On the **album page**, the album linkback is **redundant** (already on the album you're viewing). On the **artist page top tracks**, the album link is useful. Need a `hideAlbum?: boolean` prop.
- **L307–337** Save + 3-dot column. SaveButton is `size-7` (28×28) — **fails 44×44 mobile** (DESIGN §5). The 3-dot menu is `hidden md:block`, so on mobile only the save heart is visible. Long-press → sheet is the mobile path, but there's no visible affordance.

### TrackActionMenu (desktop only on these pages)

- L362 trigger is `w-7 h-7` (28×28). Same touch failure on tablet-portrait (which still hits `md:`). At desktop OK.
- Menu width `w-64` (256px) — fine; sheet on mobile already wired separately.

### SaveButton

- L43 `size-7` (28×28). **Fails touch baseline** even on tablets. Bump to `h-11 w-11 md:h-9 md:w-9`.

## 3. Album page — mobile-first

### Hero (<md)

```
- <50vw cover, max 240px, centered>
- TYPE badge ("ALBUM" / "SINGLE" / "COMPILATION") in mono brutal-label
- Title: text-brutal-lg, line-clamp-2, text-balance
- Artist link below title (text-primary, underline on tap)
  → routes to /artist?id=
- Metadata mono row: YEAR · TRACK_COUNT · DURATION (in brutal-label)
- Action stack:
  ▸ PLAY ALBUM (primary, full-width 48px, fills tracks into player queue)
  ▸ Icon row of 4 buttons (44×44 each, gap-2):
      [SAVE / heart]  [SHUFFLE]  [SHARE]  [MORE]
  ▸ Total action stack: ~110px tall, sits in bottom 60%
- Section divider: border-t-[2px] border-foreground (no Separator)
```

### Hero (≥md)

```
- 240px square cover left
- Right column: badge / title / artist / metadata / actions row
- Actions sit on a single line below text (PLAY first, then 4 icon buttons)
- gap-6 between cover and text column
```

### Track listing

- `TrackRow` with `trackNumber` prefix shown (mono label, 24px right-aligned column).
- Pass `hideAlbum={true}` (NEW prop) — album column is redundant.
- "Play All" implied by hero PLAY button. Tapping any individual row also enqueues from that point.
- Header row stays `hidden sm:grid` (no column header on mobile — labels are noise at 360px).

### "More by Artist" / "You may also like"

NEW section, below tracklist:

- Mobile: horizontal-scroll snap-x card row, 144px square cards, 4 visible-edge cards.
- Desktop: 4-col grid (`md:grid-cols-4`).
- Lazy-load (`loading="lazy"`).
- Source: artist's discography filtered to exclude the current album, top 6.

### ASCII wireframe (360px)

```
┌──────────────────────────────────────┐
│ [≡] DEEMIX            [SEARCH] [👤] │  64px top bar, sticky
├──────────────────────────────────────┤
│                                      │
│           ┌──────────────┐           │
│           │              │           │
│           │   COVER IMG  │  240px sq, brutal frame +3px shadow
│           │   240×240    │  (50vw clamped)
│           │              │           │
│           └──────────────┘           │
│                                      │
│  [ ALBUM ]                           │  badge mono brutal-label
│                                      │
│  THE SUBURBS                         │  text-brutal-lg (32px)
│  ARCADE FIRE                         │  primary, underline-on-tap
│                                      │
│  2010 · 16 TRACKS · 64:01            │  brutal-label mono row
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ▶  PLAY ALBUM                  │  full-width primary 48px
│  └────────────────────────────────┘  │
│                                      │
│  [ ♡ ] [ 🔀 ] [ ↗ ] [ ⋯ ]            │  4 icon buttons, 44×44, gap-2
│                                      │
├══════════════════════════════════════┤  border-t 2px brutal divider
│                                      │
│ TRACKLIST                            │  brutal-label section header
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 01 [▶] The Suburbs       4:34    │ │  TrackRow, 64px tall mobile
│ │ 02 [▶] Ready To Start    4:14    │ │
│ │ 03 [▶] Modern Man        4:39    │ │
│ │ 04 [▶] Rococo            3:55    │ │
│ │ ...                              │ │
│ └──────────────────────────────────┘ │  brutal frame 2px
│                                      │
├──────────────────────────────────────┤
│ MORE FROM ARCADE FIRE                │  brutal-label
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│ │ A  │ │ B  │ │ C  │ │ D  │ →        │  horizontal-scroll snap-x
│ └────┘ └────┘ └────┘ └────┘          │  144px each
│                                      │
│                          ▌MiniPlayer▌│  z-45 floating, 8px above bnav
├──────────────────────────────────────┤
│   HOME  SRCH  LIB   PL   ⚙           │  bottom nav z-50, 64px+safe-area
└──────────────────────────────────────┘
```

### Concrete changes

- `src/app/(main)/album/page.tsx:141` → flex direction stays `flex-col md:flex-row`, but `gap-3 md:gap-6`, drop the `gap-8`.
- `src/app/(main)/album/page.tsx:142–146` → cover → `w-[50vw] max-w-[240px] mx-auto md:mx-0 md:w-60 md:h-60 aspect-square`. Add `priority` and `sizes="(max-width: 768px) 50vw, 240px"`.
- `src/app/(main)/album/page.tsx:147` → swap `justify-end` for `items-center md:items-start text-center md:text-left`.
- `src/app/(main)/album/page.tsx:151` → `<h1 className="text-brutal-lg line-clamp-2 text-balance">`.
- `src/app/(main)/album/page.tsx:154–168` → metadata becomes brutal-label: `<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground">{year} · {nbTracks} TRACKS · {totalDur}</p>`. Drop `text-border` separator dots.
- `src/app/(main)/album/page.tsx:155–156` → artist as separate `<Link>` with `text-primary underline-offset-2 hover:underline`, displayed below title above the metadata row.
- `src/app/(main)/album/page.tsx:169–173` → replace `AlbumSaveButton` with new `<EntityActionRow>` block: PLAY full-width primary 48px + icon row [Save, Shuffle, Share, More]. Each icon button 44×44 mobile, 36×36 desktop.
- `src/app/(main)/album/page.tsx:177` → drop `<Separator />`, rely on `border-t-[2px]` on tracklist container.
- `src/app/(main)/album/page.tsx:181` → section header → `<h2 className="text-brutal-md uppercase mb-3">TRACKLIST</h2>`.
- `src/app/(main)/album/page.tsx:207–214` → pass `hideAlbum={true}`. Pass `showBitrate={false}` on `<sm` (or rely on TrackRow internal responsive grid — verify).
- `src/app/(main)/album/page.tsx:116–121` → replace spinner with skeleton matching final hero + 6 row stubs.
- `src/app/(main)/album/page.tsx:20–44` → delete `AlbumSaveButton`, replaced by EntityHero's action row.
- NEW: at end of `AlbumContent`, add `<HorizontalCardRow title="More from {artist}" items={...} />` fed by `discography` of the current artist (need extra fetch or share with artist page).

## 4. Artist page — mobile-first

### Hero (<md)

```
- Artist photo: full-bleed-ish (px-3 page padding only), 16:9 aspect, max-h 220px.
- Brutalist treatment: NO blur. NO gradient. NO rounded-full circle.
  Brutal frame (2px border, 3px 3px shadow). Photo cropped to 16:9 with object-cover.
- Title overlaid bottom-left INSIDE the frame, on a `bg-foreground text-background` 
  block with `px-2 py-1`, brutal eyebrow above.
  → text-brutal-xl on the name, primary "." accent kept.
- Below frame:
  - Eyebrow: "ARTIST · 1,234,567 FANS" (brutal-label)
  - Action stack:
      ▸ FOLLOW (primary 48px, full-width)
      ▸ Icon row: [SHUFFLE DISCOGRAPHY] [SHARE] [MORE]
```

### Hero (≥md)

```
- Banner-style 3:1 aspect ratio, max-h 320px, full content-width.
- Same brutal frame + offset shadow.
- Title overlay bottom-left inside frame.
- Below frame: actions row inline (PLAY/FOLLOW first, then icon buttons).
```

### Tabs / sections (<md)

Sticky tab bar **below top bar** (sticky `top-16`, z-25):

```
[ OVERVIEW ] [ TOP TRACKS ] [ ALBUMS ] [ SINGLES ] [ RELATED ] [ ABOUT ]
   ←————————— horizontal-scroll, snap-x mandatory ———————————→
```

- Each tab is `min-w-fit px-3 py-2 brutal-label` (10px mono) with `border-b-[3px] border-transparent` default, `border-foreground` active.
- Tab bar height: 44px content + 1px bottom border line.

Section content rules:

- **OVERVIEW**: Top 3 tracks + "More tracks →" link, plus 4 latest releases. Acts as fast-glance landing.
- **TOP TRACKS**: TrackRow list (full top 10), each row shows album cover thumbnail (TrackRow already does this — keep `hideAlbum={false}`).
- **ALBUMS / SINGLES / EPs**: card grid. Mobile `grid-cols-2 gap-3`, then DESIGN cascade.
- **RELATED**: horizontal-scroll snap-x card row (artist photos w/ brutal frame).
- **ABOUT**: artist bio (need data — see open questions).

### Tabs / sections (≥md)

**Recommendation: persistent stack**, no tabs. Each section has a section header (`text-brutal-md uppercase`), and the page scrolls naturally. Reasons:

- Tabs hide content from primary scroll; on a deep desktop viewport, vertical scroll is cheap.
- Discoverability is higher when albums + singles + related are all visible.
- Matches Bandcamp-style brutalist precedent.
- Reduces complexity: no tab-state sync between mobile/desktop.

If tabs must persist on desktop, dock them as **sidebar tabs** in a `md:grid md:grid-cols-[200px_1fr]` layout, fixed-position rail on the left.

### ASCII wireframe (360px)

```
┌──────────────────────────────────────┐
│ [≡] ARCADE FIRE       [SRCH]  [👤]   │  top bar 64px sticky
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │  16:9 photo
│ │░░░░░ARTIST PHOTO (object-cover)░░│ │  brutal frame 2px
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │  shadow 3px 3px
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
│ │  ┏━━━━━━━━━━━━━━━━━━━┓           │ │
│ │  ┃ ARTIST            ┃           │ │  brutal-label, bg-foreground
│ │  ┃ ARCADE FIRE.      ┃           │ │  text-brutal-xl, "." in primary
│ │  ┗━━━━━━━━━━━━━━━━━━━┛           │ │
│ └──────────────────────────────────┘ │
│                                      │
│  ARTIST · 1,234,567 FANS · DEEZER    │  brutal-label
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ★  FOLLOW                      │  full-width 48px primary
│  └────────────────────────────────┘  │
│                                      │
│  [ 🔀 ] [ ↗ ] [ ⋯ ]                  │  44×44 icon row (note: no save heart for artist)
│                                      │
├══════════════════════════════════════┤
│ ┌─OVERVIEW│TOP│ALBUMS│SINGL│REL│ABT─┐│  sticky tab bar z-25
│ │  ━━━━━━━│   │      │     │   │   ││  active = bottom border 3px
│ └──────────────────────────────────┘ │  scrolls horizontally, snap-x
├──────────────────────────────────────┤
│ TOP TRACKS                            │  brutal-label
│ ┌──────────────────────────────────┐ │
│ │ 01 [▶] Wake Up           5:36    │ │  TrackRow with album thumb
│ │ 02 [▶] Reflektor         7:34    │ │  (hideAlbum=false)
│ │ ...                              │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ALBUMS (8)                           │  brutal-label
│ ┌────┐ ┌────┐                        │
│ │ A  │ │ B  │                        │  grid-cols-2 mobile, gap-3
│ └────┘ └────┘                        │
│ ┌────┐ ┌────┐                        │
│ │ C  │ │ D  │                        │
│ └────┘ └────┘                        │
│                                      │
│ RELATED ARTISTS                      │  brutal-label
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│ │ ●  │ │ ●  │ │ ●  │ │ ●  │ →        │  horizontal-scroll
│ └────┘ └────┘ └────┘ └────┘          │
│                                      │
│ ABOUT                                │
│ Lorem ipsum bio text...              │  body, 4-line clamp + "Read more"
│                                      │
│                          ▌MiniPlayer▌│
├──────────────────────────────────────┤
│   HOME  SRCH  LIB   PL   ⚙           │  bottom nav z-50
└──────────────────────────────────────┘
```

### Concrete changes

- `src/app/(main)/artist/page.tsx:88–109` → replace entire artist hero block.
- `src/app/(main)/artist/page.tsx:96` → drop `rounded-full overflow-hidden`. Use 16:9 framed photo. Replace `w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52` with a full-width container with `aspect-[16/9] md:aspect-[3/1] md:max-h-80 relative overflow-hidden border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)]`.
- `src/app/(main)/artist/page.tsx:99–101` → move title into an absolutely-positioned overlay block: `absolute bottom-0 left-0 bg-foreground text-background px-3 py-2 border-t-[2px] border-r-[2px] border-foreground`.
- `src/app/(main)/artist/page.tsx:89–91` → drop the standalone eyebrow (move it under hero, alongside fan count).
- `src/app/(main)/artist/page.tsx:102–106` → consolidate into one fan-count brutal-label below the framed photo.
- `src/app/(main)/artist/page.tsx:N (after hero)` → NEW action stack: FOLLOW button (primary 48px) + icon row [Shuffle Discography, Share, More]. (Note: there's no follow API yet — see open questions; for now the button can call save-artist-as-favorite, or be marked TODO.)
- `src/app/(main)/artist/page.tsx:111–152` → wrap Top Tracks + Discography in a section system that mounts a `<TabBar>` (NEW component) on `<md`, a persistent stack on `>=md`. On mobile, only the active tab's section is rendered. The tab bar sticks at `top-16` (below top bar) with `z-25`.
- `src/app/(main)/artist/page.tsx:117` → replace `text-base sm:text-lg font-black uppercase tracking-[0.05em] m-0` with `text-brutal-md uppercase`.
- `src/app/(main)/artist/page.tsx:124–150` → in TOP TRACKS, pass `showTrackNumber={true}` and `hideAlbum={false}` (default). Currently top tracks already render with track numbers via `trackNumber={idx + 1}` — keep.
- `src/app/(main)/artist/page.tsx:178` → discography grid `gap-2 sm:gap-4` → `gap-3 sm:gap-4` per DESIGN §9.
- `src/app/(main)/artist/page.tsx:192` → wrap `hover:` translate in `[@media(hover:hover)]:hover:` to kill sticky-hover on Chrome Android.
- `src/app/(main)/artist/page.tsx:N (new section)` → Add RELATED ARTISTS horizontal-scroll row, fed by Deezer's related artists endpoint (need API addition).
- `src/app/(main)/artist/page.tsx:N (new section)` → Add ABOUT section with bio text + 4-line clamp + Read More expander. Need bio in fetch payload.
- `src/app/(main)/artist/page.tsx:50–55` → loading state → skeleton matching final layout (framed banner + tab strip + 4 row stubs).

## 5. TrackRow context-specific

NEW props to add to `TrackRow`:

```tsx
export interface TrackRowProps {
  // ...existing
  /** Hide the album link in the subtitle. Default false. Album page passes true. */
  hideAlbum?: boolean;
  /** Force-show track number prefix even when trackNumber is undefined (rare). Default false. */
  showTrackNumber?: boolean;
}
```

Behavior:

- **Album page**: pass `hideAlbum={true}`, render `trackNumber={trackPosition}`. Subtitle becomes "{artist}" only.
- **Artist top tracks**: default `hideAlbum={false}`, render `trackNumber={idx+1}`. Subtitle stays "{artist} · {album}". Album link valuable for discovery.
- **Playlist detail (out of scope here)**: `hideAlbum={false}` (helpful), `showTrackNumber={true}` per row.
- **Library / search results (out of scope)**: defaults — no number prefix, both columns shown.

Implementation:

- L262–290 of `TrackRow.tsx`: gate the album section with `{!hideAlbum && track.album && (...)}`.
- The grid template strings (L165–184) stay; album doesn't have a dedicated column — it lives in the subtitle line, so the layout cost of the prop is zero.

## 6. Components to create (NEW)

### `<EntityHero>` (generic)

```tsx
interface EntityHeroProps {
  variant: "square" | "circle-deprecated" | "banner";
  cover: string;
  alt: string;
  eyebrow?: string;          // "ALBUM" | "ARTIST" | "PLAYLIST"
  title: string;             // text-brutal-lg or -xl based on variant
  subtitle?: ReactNode;      // artist link, owner link, etc.
  metadata?: string[];       // ["2010", "16 TRACKS", "64:01"]
  primaryAction: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    loading?: boolean;
    pressed?: boolean;       // for FOLLOW / SAVE toggles
  };
  secondaryActions: Array<{
    icon: ReactNode;
    label: string;            // a11y label
    onClick: () => void;
    pressed?: boolean;        // SAVE state
  }>;
}
```

Reused by Album, Artist, and (future) Playlist detail. Encodes the responsive layout (vertical mobile, horizontal desktop) and action-row baseline.

### `<TabBar>` (mobile horizontal-scroll tabs)

```tsx
interface TabBarProps {
  tabs: Array<{ value: string; label: string; count?: number }>;
  active: string;
  onChange: (value: string) => void;
  sticky?: boolean;     // when true, sticks at top-16, z-25
}
```

- Sticky implementation: `sticky top-16 z-25 bg-background border-b-[2px] border-foreground`.
- `overflow-x-auto scrollbar-hide snap-x snap-mandatory`.
- Each tab: `snap-start min-w-fit px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-[0.14em]`, active = `border-b-[3px] border-foreground`.
- Counts in parens optional, deferred to a separate text node so they can wrap independently.

### `<HorizontalCardRow>` (snap-x card scroll)

```tsx
interface HorizontalCardRowProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  cardWidth?: string;   // default "w-36" (144px)
  className?: string;
}
```

- Mobile: `flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-3 -mx-3 pb-2`.
- Desktop ≥md: same scroll mechanic kept (works at any width); no special grid mode required (call site can wrap in a grid if needed).
- Lazy load images by default (`loading="lazy"`) — caller passes images already with this attr.

## 7. Performance & images

- **Hero cover (album)**: `priority` on `CoverImage` for first paint, explicit `sizes="(max-width: 768px) 50vw, 240px"`.
- **Hero photo (artist)**: `priority`, `sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1024px"`.
- **Discography cards**: `loading="lazy"` (already set on L197). Keep.
- **Top tracks row covers**: 56px from Deezer CDN — already small. No further work.
- **Aspect-ratio reservations** to prevent CLS:
  - Album hero cover: container has `aspect-square` (or `w-60 h-60`).
  - Artist hero photo: container has `aspect-[16/9] md:aspect-[3/1]`.
  - Discography cards: `aspect-square` on the inner image wrapper (already L198 `w-full aspect-square`).
- **Skeletons**: replace centered spinner (`L116–121` album, `L51–55` artist) with skeleton blocks of matching dimensions. Use `bg-muted animate-pulse` per DESIGN tokens.
- **No client fetches of images** beyond `<CoverImage>`. Avoid `useEffect` for image preloads — `priority` + browser-native lazy already gets us to LCP < 2s on 4G.

## 8. Implementation order

1. **Refactor TrackRow** (smallest, unblocks both pages): add `hideAlbum?` + `showTrackNumber?` props, bump min-h to 64px mobile, fix SaveButton sizing to `h-11 w-11 md:h-9 md:w-9`. Lock with regression tests if TrackRow is on the locked-in surface (it isn't yet — but write a `TrackRow.test.tsx` for the new prop shape so future regressions are caught).
2. **Build `<EntityHero>`** (new component, dependency for both pages). Place at `src/components/entity/EntityHero.tsx`. Storybook-style render variants: square / banner.
3. **Refactor Album page** to use `<EntityHero>`. Add PLAY/Save/Shuffle/Share/More action row. Add skeleton. Verify at 360px viewport via DevTools.
4. **Build `<TabBar>`** + **`<HorizontalCardRow>`** (Artist deps).
5. **Refactor Artist page**: hero with brutal-framed banner photo, drop circle, action row, mobile tab bar / desktop persistent stack.
6. **Add "More from artist"** horizontal row to Album page (uses `<HorizontalCardRow>`).
7. **Add "Related Artists" + "About"** to Artist page (requires API additions or stubbed UI behind feature flag).
8. **Verify sticky-hover fixes** in Chrome Android emulator on every card.
9. **Update DESIGN.md** if new patterns emerge from implementation (currently spec-only changes).

## 9. Effort estimate

| Step | Size | Time |
|---|---|---|
| 1. TrackRow refactor + tests | S | 2h |
| 2. EntityHero | M | 4h |
| 3. Album page | M | 4h |
| 4. TabBar + HorizontalCardRow | M | 4h |
| 5. Artist page | L | 8h |
| 6. More-from-artist | S | 1.5h |
| 7. Related + About (with API stubs) | M | 4h |
| 8. Sticky-hover audit | S | 1h |
| 9. Tests + screenshot diff verification | M | 4h |
| **Total** | **L** | **~32h** (~4 dev-days) |

## 10. Risks & open questions

1. **No FOLLOW API for artists.** Current backend has no concept of "followed artist." Either add a `FollowedArtist` Prisma model (1:many on User) and wire endpoints, or stub the FOLLOW button as a TODO that maps to "save first album" semantics. Recommendation: add the model — it's a small schema migration and unlocks an artist library tab later.
2. **No artist bio in current fetch.** `data?.DATA` from `content/tracklist?type=artist` doesn't include biography. Need a Deezer GW call or a new API endpoint to fetch bio.
3. **No related-artists endpoint exposed.** Deezer has `/artist/{id}/related`. Need to surface it through `src/lib/deezer/api.ts`.
4. **Tab vs persistent stack on desktop**: spec recommends persistent stack. If product chooses tabs anyway, the spec's `<TabBar>` already supports both via `sticky` prop, but UX behavior diverges between mobile/desktop and the "scroll lands you on Top Tracks" intuition is lost.
5. **Album action row's SHUFFLE button** requires `usePlayerStore.shuffle()` semantics — verify the store has a one-shot shuffle that takes a queue. If not, implement before this UI ships.
6. **Sticky-hover Tailwind 4 default**: DESIGN §6 says Tailwind 4 *should* gate `hover:` to `hover:hover` automatically, but recommends manual verification. Audit all hero cards on Chrome Android emulator.
7. **Hero photo aspect cropping**: full-bleed banner crop can decapitate artist photos that are portrait. Use `object-cover object-[center_top]` to bias the crop upward (face-safe).
8. **AlbumSaveButton's "match by deezerAlbumId" hack** (L78–86) survives but is ugly — should be folded into the new EntityHero's primary-action `pressed` state with the lookup encapsulated in a hook (`useSavedAlbum(deezerAlbumId)`).
9. **Bottom nav not yet shipped** (per DESIGN §7) — until it lands, hero CTAs that respect bottom-60% one-thumb reach are slightly off-target on Android. Acceptable transitional state.
10. **TrackRow on the locked-in surface?** Not currently. Adding props without tests is a future-bug surface. Recommend writing `TrackRow.test.tsx` covering `hideAlbum` branches as part of step 1.
