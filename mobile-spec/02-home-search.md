# Mobile-First Spec — Home & Search

## 1. Files in scope

- `src/app/(main)/page.tsx` — 57 lines (server shell, fetches playlists/albums/recent-plays)
- `src/app/(main)/_components/HomeContent.tsx` — 329 lines (client renderer, hero + 3 sections)
- `src/app/(main)/search/page.tsx` — 1067 lines (BrutalSearchBar + SuggestDropdown + tabs + 4 result types)
- `src/components/tracks/TrackRow.tsx` — 340 lines (used in Home recent + Search results)
- `src/components/skeletons.tsx` — 164 lines (HomeSkeleton, SearchResultsSkeleton, GridCardSkeleton)
- `src/components/layout/Breadcrumb.tsx` — 89 lines (kept for context — desktop chrome only)

## 2. Mobile audit (current state)

Concrete issues with `file:line`:

- **Search input is split into input + GO button row** (`search/page.tsx:198-240`). At 360px the right-hand `GO` chip eats 80–96px (`px-5 sm:px-7`) of horizontal space, squeezing the actual input to ~240px and crushing the placeholder "ARTIST, TRACK, ALBUM, OR DEEZER LINK…" (`search/page.tsx:211`). Mobile users almost never tap GO — they hit the keyboard `Go`/Enter. Button is wasted screen real estate.
- **Search input not sticky** (`search/page.tsx:198`). Once results scroll, the user must scroll back to the top to refine the query. Top bar is sticky at `z-30` per DESIGN §7 but the search input is in the page body.
- **Suggest dropdown anchors absolute under the input** (`search/page.tsx:280` — `absolute left-0 right-0 top-full mt-2 max-h-[70vh]`). On mobile keyboard this creates a 70vh dropdown over a 60vh viewport — the bottom half is hidden behind the soft keyboard. No `bottom: 100%` flip, no fallback to bottom-sheet pattern.
- **Tabs strip uses horizontal scroll** (`search/page.tsx:634` — `overflow-x-auto scrollbar-hide`) but no `snap-x snap-mandatory`. Tabs glide past target, no visual scroll indicator. Each tab is `px-4 py-2.5` (≈40px tall) — under DESIGN §5 mobile minimum of 44×44.
- **Album/Artist/Playlist grid is `grid-cols-2`** (`search/page.tsx:778, 804, 826, 967, 986, 1047`) which works at 360px but `gap-2 sm:gap-4` (`search/page.tsx:778`) means 8px gap mobile — DESIGN §9 says "never `gap-2` between cards (borders touch)". At 360px with `px-3` shell padding (12px each side), each card is `(360 − 24 − 8) / 2 = 164px` square, which is fine, but the `border-2` shadows on adjacent cards visually merge.
- **Card title uses `text-sm`** (`search/page.tsx:887, 928, 1031`) — 14px is the body default per DESIGN §3, but DESIGN §3 also defines list-row title as `text-[13px]` and metadata as `text-[11px]`. Album cards on tile grids should align with the typography scale; `text-xs` (12px) for `artistName` (`search/page.tsx:892`) is borderline at 360px wrapped.
- **`text-brutal-xl` clamp** is `clamp(2rem, 5vw, 4rem)` (DESIGN §3). At 360px viewport: `5vw = 18px`, falling back to the floor 32px. Hero "WELCOME BACK, NAME." (`HomeContent.tsx:137-142`) is 32px bold-900 across two lines — fits, but the `max-w-[15ch]` (`HomeContent.tsx:137`) may force awkward wraps with long names ("WELCOME BACK, ALEXANDRINE." breaks unevenly).
- **No `next/image`, no `sizes` prop anywhere** (`search/page.tsx:411` raw `<img>`, `HomeContent.tsx:54-59` and `253-289` use `<CoverImage>` but the contract is unknown — needs audit). Album/playlist tiles rely on Deezer CDN fixed-size URLs (`getCoverUrl(hash, 250)` `search/page.tsx:486-490`) which is fine for 2-col mobile but wastes bytes on `lg:grid-cols-5` desktop where 200px tiles get the same 250px asset — and at `xl:grid-cols-6` it's worse.
- **Suggest debounce is 200ms** (`search/page.tsx:24`) — DESIGN doesn't mandate, but mobile users typing on glass typically benefit from 250–300ms to avoid mid-word lookups. 200ms fires on every fast keypress.
- **Receipt ticker** (`HomeContent.tsx:150-161`) uses `animate-[ticker_40s_linear_infinite]` continuously even when off-screen and on `prefers-reduced-motion: reduce`. DESIGN §11 says reduced-motion respected globally via MotionConfig, but a CSS keyframe animation outside Motion is exempt. Battery + accessibility hit on mobile.
- **TrackRow on Home recent-plays** (`HomeContent.tsx:198-205`) sets `showDuration={true}` but TrackRow hides duration `<sm` (`TrackRow.tsx:303` — `hidden sm:inline`). So the prop is inert at 360px — fine, just confusing.
- **Empty state for search "no term"** (`search/page.tsx:599-612`) repeats the search bar then a hero "FIND SOMETHING." — but no recent-searches list, no popular-searches, no "paste Deezer link" affordance prominently surfaced. Missed opportunity.
- **Loader UX**: search loading is a centered spinner (`search/page.tsx:657-660`) — no skeleton matching final layout. Causes layout flash when results land.
- **Auto-focus is implicit** (`search/page.tsx:203` — `<input ref={inputRef}>` with no `autoFocus`). Currently no autofocus; this is correct for mobile (no keyboard pop) but loses desktop affordance. Should be conditional on `(hover: hover)`.
- **No "Cancel" affordance on mobile** when input is focused. iOS/Android pattern is a Cancel link to dismiss the keyboard and reset state. Without it, users tap outside the input — which closes the dropdown but leaves the keyboard up.
- **Search results blow past the bottom nav reservation**. Page shell sets `pb-24` (DESIGN §4) but when MiniPlayer + bottom nav are both visible (DESIGN §7) the floating MiniPlayer (`bottom: calc(64px + env(safe-area-inset-bottom) + 8px)`) overlaps the last `Load more` button and the last few result rows.
- **Hero headline "GET STARTED WITH DEEMIX." for guest** (`HomeContent.tsx:99-101`) uses `text-brutal-xl` which clamps to 32px at 360px. With `<br />` between "GET STARTED" and "WITH DEEMIX." this is two-line and fine, but `max-w-3xl mx-auto py-10` (`HomeContent.tsx:95`) is a desktop-first container — no mobile padding adjust beyond the shell's `px-3`.

## 3. Home page — mobile-first spec

### Visual hierarchy (<md)

- **Top bar** (existing): logo + breadcrumb (collapse to current page label only on mobile) + avatar.
- **Hero greeting block**: brutal eyebrow `GOOD MORNING / EVENING / NIGHT` (time-aware, replaces today-stamp) + brutal-xl name. Stack vertically, full-bleed. Drop the `today-label` mono row to a single-line caption below the H1 ("ALBUM count · PLAYLIST count · TRACK count" — already present).
- **Receipt ticker**: keep, but gate behind `(prefers-reduced-motion: no-preference)` and `IntersectionObserver` (pause when off-screen). Make it tappable — link the whole ticker to `/library?tab=recent`.
- **Quick actions row** (NEW): 2 buttons full-width on mobile, side-by-side on `sm`. Primary `Open Search` (red CTA), secondary `Browse Library` (outline). Lives between hero and "Recently Played" so the first-time-visitor with no recent plays still has a destination.
- **Recently played**: keep TrackRow list at 64px row height (mobile bump per DESIGN §9) — list density is already correct. Truncate to top 6 on mobile (vs 8) to clear MiniPlayer + bottom nav within first scroll.
- **My Playlists**: 2-col grid mobile (existing), `sm:3-col`, `md:4-col`, `lg:5-col`. Slice to 6 mobile (vs 10) — show "VIEW ALL" link to `/my-playlists`.
- **My Albums**: identical pattern.
- **Bottom nav** (per DESIGN §7) and floating MiniPlayer: handled at layout level, not in this spec.

### ASCII wireframe (360px width)

```
┌──────────────────────────────────────────┐
│ ☰  ~/DEEMIX/HOME              ◯  Avatar │ ← top bar 64px, z-30
├──────────────────────────────────────────┤
│ 14:23 · MON · MAY 10                     │ ← brutal-label eyebrow
│                                          │
│ GOOD AFTERNOON,                          │ ← brutal-xl, 2 lines
│ ALEX.                                    │   (red ".")
│                                          │
│ 12 ALBUMS · 4 PLAYLISTS · 187 TRACKS     │ ← caption, mono
│                                          │
├──────────────────────────────────────────┤
│ ▸ RANDOM ACCESS · DAFT PUNK · 13 TR …    │ ← receipt ticker (motion-gated)
├──────────────────────────────────────────┤
│ ┌──────────────────┐  ┌────────────────┐ │
│ │  ▶ OPEN SEARCH   │  │ ⌂  LIBRARY    │ │ ← quick actions, h-12, gap-3
│ └──────────────────┘  └────────────────┘ │
│                                          │
│ ─── RECENTLY PLAYED ─────────── VIEW → ──│ ← section header
│ ┌──────────────────────────────────────┐ │
│ │ ▶ Cover  Track Title       3:42  ♥   │ │ ← TrackRow 64px
│ │ ▶ Cover  Track Title       4:01  ♥   │ │
│ │ ▶ Cover  Track Title       2:58  ♥   │ │
│ │ ▶ Cover  Track Title       3:22  ♥   │ │
│ │ ▶ Cover  Track Title       5:14  ♥   │ │
│ │ ▶ Cover  Track Title       3:00  ♥   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ─── MY PLAYLISTS ────────────── VIEW → ──│
│ ┌──────────────┐  ┌──────────────┐       │
│ │  [cover art] │  │  [cover art] │       │ ← 2-col grid
│ │              │  │              │       │   gap-3 (12px)
│ │ MIX 01       │  │ DAILY VIBES  │       │
│ │ 24 TR        │  │ 17 TR        │       │
│ └──────────────┘  └──────────────┘       │
│ ┌──────────────┐  ┌──────────────┐       │
│ │  [cover art] │  │  [cover art] │       │
│ │              │  │              │       │
│ └──────────────┘  └──────────────┘       │
│                                          │
│ ─── MY ALBUMS ──────────────── DATE↓ ────│
│ ┌──────────────┐  ┌──────────────┐       │
│ │  [cover art] │  │  [cover art] │       │
│ │ ALBUM TITLE  │  │ ALBUM TITLE  │       │
│ │ Artist · 12  │  │ Artist · 9   │       │
│ └──────────────┘  └──────────────┘       │
│                                          │
│            ╭─────────────────────╮       │
│            │ MiniPlayer (z-45)   │       │ ← floating, above nav
│            ╰─────────────────────╯       │
├──────────────────────────────────────────┤
│ HOME  SRCH  LIB   PL   ⚙                 │ ← bottom nav 64px, z-50
└──────────────────────────────────────────┘
```

### Concrete changes

- `src/app/(main)/_components/HomeContent.tsx:84-90` — replace `todayLabel()` with a `greeting()` helper returning `"GOOD MORNING|AFTERNOON|EVENING|NIGHT"` based on local hour, render the timestamp as a smaller eyebrow above the brutal-xl headline.
- `src/app/(main)/_components/HomeContent.tsx:95` — guest container `max-w-3xl mx-auto py-10` → `max-w-3xl mx-auto py-6 sm:py-10`. Reduce vertical breathing on mobile.
- `src/app/(main)/_components/HomeContent.tsx:106-119` — guest CTA row: change `Button size="lg"` to mobile-first `className="h-12 sm:h-9"` to hit DESIGN §5 mobile primary CTA 48px.
- `src/app/(main)/_components/HomeContent.tsx:137` — drop `max-w-[15ch]` on the `<h1>` to let names breathe at small viewport. Use `break-words`.
- `src/app/(main)/_components/HomeContent.tsx:150-161` — wrap ticker in `motion-safe:` Tailwind variant or explicit `@media (prefers-reduced-motion: no-preference)`. Add `IntersectionObserver` to pause when off-screen (or use `aria-hidden` and `[content-visibility:auto]`). Wrap in `<Link href="/library?tab=recent">` for tappability.
- `src/app/(main)/_components/HomeContent.tsx:163-209` — recent-plays: add a NEW component `<QuickActions />` BEFORE this section (see §6).
- `src/app/(main)/_components/HomeContent.tsx:186` — change `recentPlays.slice(0, 8)` to `slice(0, isMobile ? 6 : 8)` — but avoid `useMediaQuery` in SSR; use Tailwind `hidden sm:contents` to render rows 7–8 only `≥sm`.
- `src/app/(main)/_components/HomeContent.tsx:231` — playlist grid: change `gap-3 sm:gap-4` to `gap-3 sm:gap-4` (already correct; just confirm it's not `gap-2` per DESIGN §9). Slice 10 → 6 on mobile, render extras `hidden sm:block`.
- `src/app/(main)/_components/HomeContent.tsx:271` — same for albums.
- `src/app/(main)/_components/HomeContent.tsx:278-289` — wrap `<CoverImage>` in `<div class="aspect-square">` to reserve space (kill CLS). Add `sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 200px"` once `<CoverImage>` exposes it.
- `src/app/(main)/_components/HomeContent.tsx:240, 291` — card title `text-[12px] font-extrabold` is acceptable per DESIGN §3 (list-row title is 13px, but tile titles can run smaller). Keep but bump to `text-[13px]` to match TrackRow title size for vertical-rhythm consistency.
- `src/app/(main)/page.tsx:42-46` — `Promise.all` inside the page is fine (server-side parallel). No change needed for data fetching.

## 4. Search page — mobile-first spec

### Visual hierarchy (<md)

- **Sticky search input** below top bar, full-width, 48px tall, 100% width minus shell padding. Drop the GO button on mobile (keyboard Enter is the affordance); keep on `sm:` and up as a visible click target. Replace with a `Cancel` link when input has focus.
- **Quick filters**: horizontal pills below input (ALL / TRACKS / ALBUMS / ARTISTS / PLAYLISTS), `overflow-x-auto snap-x snap-mandatory`, each pill `min-w-fit h-11 px-4` (44px tall hit). Active pill: `bg-foreground text-background`, inactive `bg-card`. Sticky together with input (`sticky top-[64px]`) so it stays available while scrolling results.
- **Results**:
  - Tracks tab: TrackRow list inside brutal-card border (existing). Bumped to `min-h-16` per DESIGN §9.
  - Albums/Artists/Playlists tabs: 2-col grid mobile, gap-3, aspect-square cover.
  - "ALL" tab: stacked sections (top 5 tracks, top 6 albums, top 6 artists, top 6 playlists), each section header is sticky-section-style with VIEW ALL → switching to dedicated tab.
- **Empty state (no term)**: full-bleed brutal frame with "TYPE TO SEARCH" + recent searches chips (NEW component) + "PASTE A DEEZER URL" affordance.
- **Loading state**: skeleton rows matching TrackRow height (use `TrackListSkeleton` from `skeletons.tsx`); for grid tabs use `HomeGridSkeleton` already shaped right.
- **No-results state**: brutal frame with "∅ NO MATCHES FOR <term>" + retry suggestions ("Try fewer words · Check spelling · Browse by artist") — keep existing pattern but elevate above the fold.

### Search input behavior

- **Auto-focus**: on desktop only. Detect via `(hover: hover)` media query at mount: `if (window.matchMedia("(hover: hover)").matches) inputRef.current?.focus()`. On mobile, do NOT auto-focus (avoids keyboard pop on page entry, matches OS expectations).
- **Debounce 300ms** on type (bumped from 200ms `search/page.tsx:24`). Already mobile-friendly.
- **Clear button (X)** appears when input has value. Bump to 44×44 hit area: replace `shrink-0 text-muted-foreground` (`search/page.tsx:227`) with `shrink-0 size-11 sm:size-9 -mr-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors`.
- **Cancel button** (NEW, mobile-only): appears right of input when input is focused OR has a value. `flex shrink min-w-fit px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground`. Tapping clears `q`, blurs input, closes dropdown.
- **Suggest dropdown**: on mobile (<md), do NOT use absolute positioning. Render inline below the input as a fullscreen-feeling list (`fixed inset-x-0 top-[120px] bottom-0 z-40` with `bg-card border-t-[2px] border-foreground`). On desktop, keep absolute dropdown.
- **Submit on keyboard Enter** triggers `goFullSearch` (existing `search/page.tsx:152-162`). Keep.

### ASCII wireframe (360px width)

```
┌──────────────────────────────────────────┐
│ ☰  ~/DEEMIX/SEARCH            ◯  Avatar │ ← top bar 64px, z-30
├──────────────────────────────────────────┤  ─┐
│ ┌──────────────────────────┐ ┌───────┐  │   │ sticky top-[64px]
│ │ 🔍 ARTIST, TRACK, ALBUM..│ │CANCEL │  │   │ z-29 (under top bar)
│ └──────────────────────────┘ └───────┘  │   │ h-12 input
│                                          │   │
│ [ALL][TRKS][ALBM][ARTS][PLST] →         │   │ pills row, snap-x
├──────────────────────────────────────────┘  ─┘
│                                          │
│ RESULTS FOR                              │
│ "DAFT PUNK".                             │ ← brutal-lg
│                                          │
│ ─── TRACKS · 142 RESULTS ────────────────│
│ ┌──────────────────────────────────────┐ │
│ │ ▶ ▢  Get Lucky                  4:08│ │ ← TrackRow 64px
│ │ ▶ ▢  Around the World           7:09│ │
│ │ ▶ ▢  One More Time              5:20│ │
│ │ ▶ ▢  Harder Better Faster       3:44│ │
│ │ ▶ ▢  Da Funk                    5:28│ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ─── ALBUMS · 48 RESULTS ─────────────────│
│ ┌──────────────┐  ┌──────────────┐       │
│ │  [cover art] │  │  [cover art] │       │ ← 2-col grid
│ │ RANDOM ACCESS│  │ DISCOVERY    │       │
│ │ Daft Punk    │  │ Daft Punk    │       │
│ └──────────────┘  └──────────────┘       │
│                                          │
│ ─── ARTISTS · 8 RESULTS ─────────────────│
│ ┌──────────────┐  ┌──────────────┐       │
│ │  [round img] │  │  [round img] │       │
│ │   DAFT PUNK  │  │ DAFT PUNK ⌐  │       │
│ └──────────────┘  └──────────────┘       │
│                                          │
│            ╭─────────────────────╮       │
│            │ MiniPlayer (z-45)   │       │ ← floating
│            ╰─────────────────────╯       │
├──────────────────────────────────────────┤
│ HOME  SRCH  LIB   PL   ⚙                 │ ← bottom nav z-50
└──────────────────────────────────────────┘
```

Empty-state wireframe (no term):

```
┌──────────────────────────────────────────┐
│ Top bar                                  │
├──────────────────────────────────────────┤
│ 🔍 [search input full-width]             │ sticky
├──────────────────────────────────────────┤
│ FIND                                     │
│ SOMETHING.                               │ brutal-xl
│                                          │
│ TYPE AN ARTIST, ALBUM OR TRACK ABOVE.    │
│                                          │
│ ─── RECENT SEARCHES ────────────────────│
│ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ daft punk│ │ tame imp.│ │  jorja   │  │ ← chips row, snap-x
│ └──────────┘ └──────────┘ └──────────┘  │
│ ┌──────────┐ ┌──────────┐                │
│ │ kendrick │ │ glass anim│               │
│ └──────────┘ └──────────┘                │
│                                          │
│ ─── PASTE A DEEZER URL ──────────────────│
│ ┌──────────────────────────────────────┐ │
│ │ Drop a deezer.com link to queue an   │ │
│ │ entire album or playlist directly.   │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Concrete changes

- `src/app/(main)/search/page.tsx:24` — `SUGGEST_DEBOUNCE_MS = 200` → `300`. Mobile-friendly.
- `src/app/(main)/search/page.tsx:49-258` — extract `BrutalSearchBar` to its own file `src/components/search/SearchInput.tsx` so it can be made sticky from the page-level layout. Or wrap in `<div className="sticky top-[64px] z-29 -mx-3 sm:-mx-6 px-3 sm:px-6 bg-background pt-3 pb-3 border-b-[2px] border-foreground">` at page-level usage.
- `src/app/(main)/search/page.tsx:198-240` — flatten the input + GO row on mobile:
  - Drop GO button on mobile (`hidden sm:flex` on the button container).
  - Bump input height: `py-3.5 sm:py-4` → `py-3 sm:py-3.5` with `h-12 sm:h-11` on the wrapper. Match DESIGN §9 input mobile baseline.
  - Add Cancel link (NEW): `<button type="button" onClick={() => { setQ(""); inputRef.current?.blur(); setOpen(false); }} className="sm:hidden flex items-center px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">CANCEL</button>` rendered when `q || focused`.
- `src/app/(main)/search/page.tsx:217-231` — clear button (X): bump to 44×44 hit area `size-11 sm:size-9` with internal `<X className="size-4">` icon stays the same visual size.
- `src/app/(main)/search/page.tsx:280` — dropdown shell: detect mobile via `(hover: none)` and switch to `fixed inset-x-0 top-[128px] bottom-0 z-40 max-h-none` mobile, keep `absolute` desktop.
- `src/app/(main)/search/page.tsx:201` — autofocus: add `useEffect(() => { if (window.matchMedia("(hover:hover)").matches) inputRef.current?.focus(); }, [])`.
- `src/app/(main)/search/page.tsx:629-654` — tabs strip: each tab bump to `h-11 px-4 sm:px-4` (44px mobile). Add `snap-x snap-mandatory` to the strip and `snap-start` to each tab. Wrap in `<div className="sticky top-[120px] z-28 bg-background border-b-[2px] border-foreground">` so filter pills stay visible while scrolling results.
- `src/app/(main)/search/page.tsx:598-612` — empty state (no term): replace with `<EmptySearchState onSelectChip={(term) => router.push("/search?term=" + encodeURIComponent(term))} />` (NEW component, see §6). Drop the inline brutal-xl since the search bar is already prominent.
- `src/app/(main)/search/page.tsx:656-660` — loading state: replace centered spinner with `<SearchResultsSkeleton />` (already exists in `skeletons.tsx:119-130`). Choose skeleton variant per active tab.
- `src/app/(main)/search/page.tsx:778, 804, 826, 967, 986, 1047` — grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4` → `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4`. Eliminate `gap-2` per DESIGN §9.
- `src/app/(main)/search/page.tsx:411` — replace raw `<img>` in `DropdownCover` with `<CoverImage>` for consistent rendering and built-in lazy loading.
- `src/app/(main)/search/page.tsx:867, 913, 1017` — card hover effects (`hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px]`): per DESIGN §6 sticky-hover rule, audit on Chrome Android. Wrap in `[@media(hover:hover)]:hover:` if sticky hover appears. Spot-check before merge.
- `src/app/(main)/search/page.tsx:687-693` — no-results state: keep but elevate (no inline `mt-6` margin), and add retry suggestions list ("· Try fewer words", "· Check spelling", "· Browse by artist").
- `src/app/(main)/search/page.tsx:700-720` — `LoadMoreButton`: bump to `h-12 sm:h-9` mobile, full-width on mobile.

## 5. TrackRow mobile concerns

- **Title truncation**: `text-[13px] font-bold tracking-[-0.005em] truncate leading-tight` (`TrackRow.tsx:260`). Correct per DESIGN §3 list-row title spec. ✓
- **Artist line size**: `text-[11px] text-muted-foreground` (`TrackRow.tsx:263`). Correct per DESIGN §3 list-row meta. ✓
- **Action menu hit area at <md**: `<TrackActionMenu>` is `hidden md:block` (`TrackRow.tsx:321`). On mobile, only the long-press affordance is wired. **Issue**: long-press has no visible alternative on mobile per DESIGN §5/§9 ("Pair with visible UI"). The play button (`size-9`, 36×36, `TrackRow.tsx:241`) and the heart save button cover the row, but no visible "more" action.
- **Recommendation**: add a `md:hidden` 3-dot button at the right of the row at 44×44 that opens TrackActionSheet. This makes the action discoverable without long-press. Place between `<SaveButton>` and the desktop `<TrackActionMenu>` block.
- **Row min-height**: row currently sits at ~48–52px mobile (`py-2 sm:py-2.5` = 16px/20px vertical padding + 36px cover + meta wrap). DESIGN §9 mandates `min-h-16` (64px) on mobile. Add `min-h-16 sm:min-h-12` to the row container (`TrackRow.tsx:222`).
- **Cover button hit area**: `size-9` (36×36) is below mobile 44×44 baseline (DESIGN §5). Wrap in 44×44 padded button: change `relative shrink-0 size-9` to `relative shrink-0 size-11 sm:size-9 flex items-center justify-center` and let the inner `<CoverImage>` stay at `size-9`. The hit area extends to 44 without changing visual size.
- **`hover:bg-foreground/5`** (`TrackRow.tsx:223`): sticky-hover risk on Chrome Android per DESIGN §6. Verify, wrap in `[@media(hover:hover)]:hover:` if sticky.
- **`group-hover:opacity-60` on cover image** (`TrackRow.tsx:247`): same sticky-hover risk. Same fix.

## 6. Components to create (NEW)

### `src/components/search/SearchInput.tsx`
- Extracted from `BrutalSearchBar` so it can be portaled / made sticky from the search page layout.
- Props: `initialTerm: string`, `onSubmit: (term: string) => void`, `dropdownVariant?: "absolute" | "sheet"`.
- Encapsulates: input + clear (X) + cancel (mobile) + suggest dropdown.
- Internal logic: debounced suggest fetch, keyboard nav, dropdown open/close.

### `src/components/search/SearchFilters.tsx`
- Horizontal scroll pill row for tab filtering.
- Props: `tabs: ReadonlyArray<{value: string; label: string; count?: number}>`, `value: string`, `onChange: (v: string) => void`.
- `snap-x snap-mandatory`, sticky-able, 44×44 hit per pill.

### `src/components/search/EmptySearchState.tsx`
- Mobile-first empty state for `/search` with no term.
- Props: `recentSearches: string[]`, `onSelectChip: (term: string) => void`, `onPasteUrl?: (url: string) => void`.
- Sections: "TYPE TO SEARCH" hero + recent-searches chip row + Deezer-link affordance.
- Persist recent searches via `localStorage` (key: `deemix.search.recent`, max 10 items, dedup).

### `src/components/search/SectionHeader.tsx`
- Reusable section header `<div className="flex items-baseline justify-between gap-3 pb-2 mb-4 border-b-[2px] border-foreground">…</div>` already inlined 5+ times in HomeContent and search page. Extract to single component with props `title`, `count?`, `viewAllHref?`, `icon?`.
- Reduces duplication and locks the typography contract.

### `src/components/home/QuickActions.tsx`
- 2-button row for Home above-the-fold.
- Static buttons: "OPEN SEARCH" (primary, `/search`), "BROWSE LIBRARY" (outline, `/library`).
- Mobile: stacked full-width `h-12`. `sm:` side-by-side.

## 7. Image strategy

- **`<Image>` from `next/image`** with explicit `sizes` for all album/artist/playlist tiles. Audit `<CoverImage>` (`src/components/ui/cover-image.tsx` — not in scope but referenced) — if it doesn't currently use `next/image`, retrofit it to accept and forward a `sizes` prop. Tile grids use:
  - Home/search 2-col tiles: `sizes="(max-width:640px) 50vw, (max-width:768px) 33vw, (max-width:1024px) 25vw, 200px"`.
  - TrackRow cover (36px): `sizes="44px"` (request 88px DPR-2 asset).
  - Suggest dropdown cover (40px): `sizes="56px"`.
- **Aspect ratio reserved** (no CLS): every cover wrapper has `aspect-square`. Already present in HomeContent (`HomeContent.tsx:42, 51, 278`) and search (`search/page.tsx:874, 915, 1024`). Verify on Hero artwork too.
- **Priority on first viewport hero only**. Currently no images above the fold on Home (the hero is text). On Album/Artist detail pages (out of scope here), `priority` should be on the hero cover. **For Home recently-played row 1 cover**: don't set priority (TrackRow uses `<CoverImage>` already with `loading="lazy"`).
- **Replace raw `<img>` with `<CoverImage>`**: `search/page.tsx:411` (DropdownCover). Lazy loading should be the default everywhere.
- **`loading="lazy"`** is already applied on all CoverImage instances I can see (`HomeContent.tsx:46, 57, 283`, `search/page.tsx:873, 919, 1023`). Keep.
- **Decode hint**: add `decoding="async"` on TrackRow covers and tile covers to deprioritize main-thread decode. Forward through `<CoverImage>` API.

## 8. Implementation order

1. **Sticky search input refactor** (extract `SearchInput.tsx`, make sticky, drop GO button on mobile, add Cancel) — biggest UX win for mobile search.
2. **Filter pills component** (`SearchFilters.tsx` with snap-x, 44px hit) — improves search reachability and density.
3. **Empty/loading/error states** (`EmptySearchState.tsx`, swap spinner for skeleton, no-results frame) — perceived performance + discoverability.
4. **Suggest dropdown mobile sheet** — switch to fixed-positioned full-width list on mobile to avoid keyboard overlap.
5. **TrackRow mobile bumps** (min-h-16, 44×44 hit areas, visible 3-dot menu mobile) — affects every list, do once.
6. **Home page hero refactor** (greeting, quick actions, mobile-first slice counts) — secondary; works as-is, polishes for mobile.
7. **Image sizes audit** (retrofit `<CoverImage>` if needed, add `sizes` props) — perf. Can ship behind feature flag.
8. **Section header extract** (`SectionHeader.tsx`) — refactor pass at the end after all callsites stabilize.

## 9. Effort estimate

| # | Task | Size |
|---|---|---|
| 1 | Sticky search input refactor | M |
| 2 | Filter pills component | S |
| 3 | Empty / loading / error states | M |
| 4 | Suggest dropdown mobile sheet | M |
| 5 | TrackRow mobile bumps | S |
| 6 | Home hero refactor + QuickActions | S |
| 7 | Image sizes audit + CoverImage retrofit | M |
| 8 | SectionHeader extract | S |

Total: 8 tasks, ~3 M + ~5 S. Realistic team-week if one engineer; ~3 working days at typical pace.

## 10. Risks & open questions

- **`<CoverImage>` contract is unknown** — is it already a `next/image` wrapper, or a raw `<img>` with cover sizing? If raw `<img>`, retrofit to `next/image` ripples through every list and tile (Risk: M). Read `src/components/ui/cover-image.tsx` first; if it's a `<picture>` or `<img>`, add a `sizes` passthrough prop and migrate gradually.
- **Sticky-hover audit not automated** — DESIGN §6 calls out the gap; until lint rule lands, every `hover:` we keep on mobile-visible elements is a potential ghost. Schedule manual Chrome Android pass before each release.
- **Recent searches persistence** — `localStorage` bound to device, not user. If we want cross-device recent searches, route through a server preference. For now `localStorage` is simpler and correct (mobile = single user / device usually).
- **Filter pill count badges** — should pills show result counts? "TRACKS · 142" inside a 100px pill is tight at 360px. Decide: counts only on `sm:` and up, or counts always (truncation acceptable).
- **Tab change keyboard behavior** — when user types in search input and switches tab, currently the `useEffect(() => { doSearch() }, [tab, term])` re-fetches. On mobile this is fine (no scroll-jacking) but watch for double-fetch on initial mount (`tabParam` from URL + first render).
- **`<CoverImage>` inside button** (TrackRow play button `TrackRow.tsx:241-258`) — bumping the button to `size-11` on mobile while keeping the inner CoverImage at `size-9` requires the cover to be centered inside the button. Verify no layout shift in the row grid (the `40px` column width in `gridClass` `TrackRow.tsx:167-184` will need a bump to `44px` on mobile).
- **Receipt ticker accessibility** — the ticker is decorative motion. Should it have `role="marquee"` (deprecated), `aria-live="off"`, or `aria-hidden="true"`? Recommendation: `aria-hidden="true"` since the same data is in the My Albums section right below.
- **Auto-focus on desktop** — `(hover: hover)` is a heuristic, not a definite mobile detector. Hybrid devices (Surface, iPad with mouse) may still dislike auto-focus. Acceptable risk.
- **Search input z-index when sticky** — DESIGN §7 z-index table doesn't define a sticky-content layer between `z-30` (top bar) and `z-40` (sidebar). Recommendation: use `z-29` for the sticky search bar (below top bar, above page content), and `z-28` for the secondary sticky filter pill row. Document in DESIGN if adopted.
