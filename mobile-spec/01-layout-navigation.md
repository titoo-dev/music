# Mobile-First Spec — Layout & Navigation

## 1. Files in scope
- `src/app/(main)/layout.tsx` — 272 lines (main shell: top bar, sidebar, sheet, audio mounts)
- `src/app/layout.tsx` — 59 lines (root: fonts, viewport, ServiceWorker, TooltipProvider)
- `src/app/(auth)/layout.tsx` — 3 lines (bare wrapper for `/login`)
- `src/components/layout/Sidebar.tsx` — 82 lines (exports `Navigation` used in both desktop sidebar and mobile sheet)
- `src/components/layout/Breadcrumb.tsx` — 89 lines (mono breadcrumb, desktop-only today)
- Reference: `src/components/audio/MiniPlayer.tsx` — `fixed bottom-5 right-5 z-50` (will need to drop to `z-45`)
- Reference: `DESIGN.md` — 358 lines (single source of truth)

## 2. Mobile audit (current state)

Concrete issues found in the in-scope files:

1. **No bottom navigation exists.** `(main)/layout.tsx` mounts only `<aside>` (desktop, line 74) + `<Sheet>` drawer (line 240). Mobile users have to tap the hamburger (`(main)/layout.tsx:142-149`) on every navigation, which violates DESIGN.md §0 ("primary actions live in the bottom 60% of the viewport") and §7 (mandates a 5-tab bottom nav at `<md`).

2. **Hamburger button is undersized.** `(main)/layout.tsx:142-149` renders `<Button variant="ghost" size="icon">` — `size="icon"` is `size-9` (36×36) per DESIGN.md §5/§16. Mobile minimum is 44×44 → fails the touch baseline. The avatar dropdown trigger (`(main)/layout.tsx:178-181`) has the same defect.

3. **Top-bar `h-16` (64px) on mobile.** `(main)/layout.tsx:140` uses `h-16`. DESIGN.md §7 explicitly says "Top bar: 56px (currently `h-16` = 64px — keep 64px since it matches desktop)" — *we keep 64px but* the line has no `min-h-` constraint and no safe-area treatment for status bar overlap on `viewportFit: "cover"` (set in `app/layout.tsx:20-27`). Risk: notch overlap on Android Chrome with `display-cutout` modes.

4. **`pb-24` is too short.** `(main)/layout.tsx:232` sets `<main class="...pb-24...">` (96px). Once a 64px floating MiniPlayer + 64px+safe-area bottom nav stack co-exist, total occluded chrome ≈ 64 + 8 + 64 + safe-area ≈ 144–168px. DESIGN.md §14 mandates `pb-32` mobile / `sm:pb-24`. Currently last list rows are hidden behind chrome.

5. **Sheet width = `w-[280px]` on 360px viewports.** `(main)/layout.tsx:241` sets `w-[280px]` regardless of viewport. On a 360px-wide phone (Pixel 5, DESIGN.md §14 baseline) that leaves only 80px of backdrop — borderline tap-to-dismiss target. Should be `w-[80vw] max-w-[320px]` so the cream backdrop is always >60px.

6. **Breadcrumb is desktop-only and lacks current-screen fallback.** `(main)/layout.tsx:165-169` wraps Breadcrumb in `hidden md:flex`. On mobile there is *no* page-title indicator at all — user only sees the deemix logo + hamburger + avatar. DESIGN.md §7 says the mobile top bar should show "Logo + (current page label, truncated) + avatar dropdown."

7. **Breadcrumb overflow risk.** `Breadcrumb.tsx:59` declares `overflow-hidden` on the wrapper but each crumb is `shrink-0` (line 70) and the root `~/DEEMIX` is `shrink-0` (line 63). On narrow viewports between `md` and `lg` (768–900px) the breadcrumb will visually clip without an ellipsis, since only the *last* crumb has `truncate max-w-[16ch]`. No middle-collapse pattern (e.g. `… / current`).

8. **No `aria-label` on hamburger.** `(main)/layout.tsx:142-149` renders only the `<Menu>` icon — no accessible name. Same for the avatar trigger (line 178). Fails DESIGN.md §12 ("Icon-only buttons: Always `aria-label`") and the per-screen audit checklist (§15).

9. **MiniPlayer `z-50` collides with future bottom nav.** `MiniPlayer.tsx:40` uses `z-50`; the new bottom nav must also be `z-50` per DESIGN.md §7. They cannot share — MiniPlayer must drop to `z-45` (DESIGN.md §7 explicitly calls this out as 🆕 NEW).

10. **No safe-area handling on top bar or main.** `(main)/layout.tsx:139` sticky header has no `pt-[env(safe-area-inset-top)]`. With `viewportFit: "cover"` (`app/layout.tsx:26`), the top bar will sit under the status bar on iOS PWA / Android edge-to-edge. (Project is "Chrome-locked" per memory, so iOS not a hard target — but Android Chrome with edge-to-edge is.)

11. **Drawer renders the *full* nav (5+ items).** `(main)/layout.tsx:251` calls `<Navigation onNavigate={...}>` which renders Home, Search, Library, Playlists, Settings, About via `Sidebar.tsx:65-73`. After bottom nav ships, the drawer becomes redundant for primary destinations — needs to be slimmed to secondary-only.

12. **Active state styling not bottom-nav friendly.** `Sidebar.tsx:50-54` uses `border-l-[4px] border-l-accent bg-primary text-white` — perfect for a vertical sidebar but inverted for a horizontal bottom nav (we need `border-t-[4px] border-t-accent`, per DESIGN.md §7). Means the existing `Navigation` component cannot be re-used as-is for the bottom nav rail.

13. **`sidebarOpen` is global (Zustand) but only the mobile sheet uses it.** `(main)/layout.tsx:47-48,240` — fine today, but after bottom nav ships the drawer's purpose narrows to secondary destinations. Reconsider the store key (`secondaryDrawerOpen` vs. keeping `sidebarOpen`).

14. **Auth layout has no chrome.** `(auth)/layout.tsx` is a 3-line bare wrapper. The login page (`/login`) currently has zero top bar / nav. Consistent on mobile (good — focus mode), but the spec needs to confirm bottom nav does NOT bleed through into `(auth)`. Since `(auth)/layout.tsx` is a sibling group to `(main)`, the bottom nav lives in `(main)/layout.tsx` — it will not appear on `/login`. Verified.

15. **Mobile dropdown menu items lack icons matching nav.** `(main)/layout.tsx:196-214` exposes "My Playlists / About / Log out" via avatar dropdown. After bottom nav ships, "My Playlists" moves to the bottom nav (Playlists tab). The dropdown should slim to just About / Log out / username (and potentially version info per DESIGN.md §7).

## 3. Target architecture (mobile)

### Top bar (`<md`, 768px and below)
- **Height:** `h-16` (64px) preserved per DESIGN.md §7, sticky, `border-b-[3px] border-foreground bg-background z-30`.
- **Safe area:** add `pt-[env(safe-area-inset-top)]` and bump effective height with `min-h-[calc(64px+env(safe-area-inset-top))]`.
- **Contents (left → right):**
  1. Logo (`D` square + "deemix" wordmark) — keep current pattern (`(main)/layout.tsx:152-162`), but make it the *only* link on the left.
  2. Page-label slot: middle, mono uppercase 11px, `truncate max-w-[16ch]`. Sourced from `Breadcrumb.tsx` last-segment label OR a per-page `<PageTitle>` slot.
  3. Avatar dropdown (right) — tightened to: username, About, Logout. "My Playlists" removed (now a tab).
- **Hamburger removed.** No more `<Menu>` button. Secondary destinations move into the avatar dropdown (or a tertiary "More" sheet if it grows beyond ~5 items in future).

### Bottom nav (`<md` only) 🆕 NEW
- **Position:** `fixed inset-x-0 bottom-0 z-50`.
- **Height:** `min-h-[64px] pb-[env(safe-area-inset-bottom)]` → effective 64–88px depending on device.
- **Border / shadow:** `border-t-[3px] border-foreground bg-background` (no shadow — it sits on the page edge).
- **Tabs (5 cells, `grid grid-cols-5`, each `flex-1`):**
  | # | Path | Label | Icon | Auth-gated? |
  |---|---|---|---|---|
  | 1 | `/` | `HOME` | `Home` | no |
  | 2 | `/search` | `SEARCH` | `Search` | no |
  | 3 | `/library` | `LIBRARY` | `Library` | yes (hidden when not authed) |
  | 4 | `/my-playlists` | `PLAYLISTS` | `ListMusic` | yes |
  | 5 | `/settings` | `SETTINGS` | `Settings` | no |
- **Tab cell layout:** vertical stack — 24px icon (`size-6`) + 9px mono uppercase label (`text-[9px] font-mono font-bold tracking-[0.14em] uppercase`). Hit area `min-h-[56px]` per DESIGN.md §5 (full tab is the target, not just the icon).
- **Active state:** `bg-foreground text-background` + `border-t-[4px] border-t-accent` (lime). Inactive: `text-foreground/60 bg-background`. Active mirrors the sidebar's lime stripe (sidebar uses `border-l-[4px] border-l-accent`; bottom nav uses `border-t-[4px] border-t-accent`).
- **Pressed state:** `active:bg-foreground/5` (no transform — bottom nav is anchored).
- **Badge support:** small lime square (`8×8 bg-accent border-[2px] border-foreground`) absolute-positioned `top-1 right-2` on the icon when a count is non-zero. Initial use case: downloads in progress count for a future Downloads tab; for v1, only wire it for **Library** tab when there are unfinished imports — leave the rest no-badge.
- **Auth-aware variants:**
  - Authenticated: 5 tabs (Home, Search, Library, Playlists, Settings).
  - Unauthenticated: 3 tabs (Home, Search, Settings) — Library and Playlists are hidden, with `grid-cols-3` swap.
  - **No layout shift:** auth state is read on the client; render the unauthenticated 3-tab layout as the initial SSR fallback (since `useAuthStore` only hydrates client-side). Use `useAuthStore(s => s.isAuthenticated)` with a stable default (`false`). After hydration, the layout swaps from 3 → 5 tabs. Acceptable: tabs grow horizontally, no vertical shift.
- **`aria-current="page"`** on the active tab. Wrapper: `<nav aria-label="Primary">`.

### Hamburger / drawer (secondary only)
- **Removed from top bar.** No more `<Menu>` icon button on the header.
- **Survival path:** the existing `<Sheet>` in `(main)/layout.tsx:240-253` becomes a **secondary drawer** triggered from the avatar dropdown's *new* "More" item (or kept dormant for v2).
- **Contents when reduced:** About, version info, system status (S3 reachable? worker queue depth?). Logout already lives in the avatar dropdown — keep it there as primary surface.
- **z-60 when open** (Sheet primitive default `z-50` for content; bump container to `z-60` per DESIGN.md §7 stacking table).

### MiniPlayer position (mobile)
- **Currently:** `fixed bottom-5 right-5 z-50` (`MiniPlayer.tsx:40`).
- **Target:** `bottom: calc(64px + env(safe-area-inset-bottom) + 8px); right: 12px; z-45`. Floats 8px above the bottom nav. Width: `max-w-[calc(100vw-24px)]` so it never bleeds off-screen.
- **`md:` cascade:** restore desktop pin to `bottom-5 right-5 z-45` — desktop has no bottom nav so the 8px gap rule doesn't apply, but z-45 is consistent.

### Stacking order (mobile)
Re-stated from DESIGN.md §7 with target values:

| Layer | z-index | Component |
|---|---|---|
| Page chrome (top bar) | `z-30` | Sticky `<header>` in `(main)/layout.tsx:139` |
| Desktop sidebar | `z-40` | `<aside>` (mobile-irrelevant) |
| LyricsPanel / QueuePanel side drawers | `z-40` | `LyricsPanel.tsx:56`, `QueuePanel.tsx:90` |
| **MiniPlayer** | **`z-45`** 🆕 NEW (was `z-50`) | `MiniPlayer.tsx:40` |
| **Bottom nav** | **`z-50`** 🆕 NEW | New `BottomNav.tsx` |
| Modals / sheets / dropdowns | `z-50–z-60` | Sheet/Dialog/Dropdown primitives (already z-50) — bump container to `z-60` when open |
| FullscreenPlayer | `z-70` 🆕 NEW (was `z-[60]`) | `FullscreenPlayer.tsx:444` |
| LyricsImmersive | `z-80` (current `z-[80]`) | `LyricsImmersive.tsx:146` |

## 4. Target architecture (desktop ≥md)

Largely unchanged:

- **Sidebar:** 240px (`md:w-60`), fixed left, dark (`bg-foreground text-background`), `z-40`. Logo, primary nav, user/logout footer. Code at `(main)/layout.tsx:74-134`. **Preserved as-is.**
- **Top bar:** still 64px sticky (`(main)/layout.tsx:139-227`). Breadcrumb takes the center (current behavior, line 165-169). Avatar dropdown top-right (lines 175-224 — but on desktop, no mobile avatar shown today; the avatar lives in the sidebar footer at lines 92-124). **Preserved.**
- **No bottom nav.** Bottom nav is `md:hidden`. The existing 5-item vertical nav inside the sidebar already covers all destinations.
- **No hamburger.** Hamburger is `md:hidden` even today — removing it from mobile doesn't affect desktop.
- **MiniPlayer:** stays `bottom-5 right-5 z-45` (only the z-index changes; position unchanged from current `MiniPlayer.tsx:40`).
- **Breadcrumb:** unchanged on `md+` (full crumb chain visible). Will need a **mobile collapsed mode** (see §6).

## 5. ASCII wireframes (360px width)

### Mobile home screen — bottom nav + MiniPlayer floating

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [D] deemix     HOME           [▓ avatar ▓] ┃ ← top bar  z-30  h-16
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                              ┃
┃  GOOD EVENING.                               ┃
┃  ─────────────                               ┃
┃                                              ┃
┃  ┃ RECENT PLAYS                              ┃
┃  ┏━━━━━━┓ ┏━━━━━━┓                           ┃
┃  ┃      ┃ ┃      ┃                           ┃
┃  ┃ ▓▓▓▓ ┃ ┃ ▓▓▓▓ ┃   <— brutal cards        ┃
┃  ┃      ┃ ┃      ┃                           ┃
┃  ┗━━━━━━┛ ┗━━━━━━┛                           ┃
┃   Track 1   Track 2                          ┃
┃   Artist    Artist                           ┃
┃                                              ┃
┃  ┃ MADE FOR YOU                              ┃
┃  ┏━━━━━━┓ ┏━━━━━━┓                           ┃
┃  ┃      ┃ ┃      ┃                           ┃
┃  ┗━━━━━━┛ ┗━━━━━━┛                           ┃
┃                                              ┃
┃                  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓┃
┃                  ┃ ▓▓ Track ▶  🔊 ━━━━━━━━ ✕┃┃ ← MiniPlayer  z-45
┃                  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛┃    (8px gap above bottom nav)
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ▓▓▓▓▓▓▓ ━━━━━━ ━━━━━━ ━━━━━━ ━━━━━━ ━━━━━━ ┃ ← lime stripe (active tab)
┃  HOME    SRCH    LIB    PL     SET           ┃ ← bottom nav  z-50
┃   ⌂      🔍      📚     ♫     ⚙             ┃    h: 64px + safe-area
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Mobile drawer open (secondary destinations only)

```
┏━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━┓
┃ [▓] DEEMIX            ┃ ▓▓▓▓▓▓▓▓▓▓ backdrop┃
┃ NAVIGATION            ┃ (tap to dismiss)   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━┫                    ┃
┃                       ┃                    ┃
┃  ▓ ABOUT              ┃                    ┃
┃                       ┃                    ┃
┃  ▓ LOG OUT            ┃                    ┃  z-60 sheet content
┃                       ┃                    ┃  z-50 backdrop
┃  ──────────           ┃                    ┃
┃                       ┃                    ┃
┃  v1.4.2               ┃                    ┃
┃  S3: ✓ READY          ┃                    ┃
┃  WORKER: 0 JOBS       ┃                    ┃
┃                       ┃                    ┃
┃                       ┃                    ┃
┃                       ┃                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┫
┃   ⌂      🔍      📚     ♫     ⚙           ┃ ← bottom nav
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   still visible? NO
```

Note: when drawer opens, bottom nav is **covered by the backdrop** (z-50 backdrop ≥ z-50 nav, and Sheet content is z-60). Drawer width: `min(80vw, 320px)`.

### Desktop ≥768px (preserved — current behavior)

```
┏━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [▓] DEEMIX       ┃ ~/DEEMIX / LIBRARY / TRACKS              [▓ avatar v]      ┃
┃ ─────────────────┃                                                             ┃
┃ ┃ HOME           ┃─────────────────────────────────────────────────────────────┃
┃ ┃ SEARCH         ┃                                                             ┃
┃ ┃ ▓▓ LIBRARY ▓▓ ←┃ MY COLLECTION.                                             ┃
┃ ┃ PLAYLISTS      ┃                                                             ┃
┃ ─────────────────┃ ┏━━━━━━━━┓ ┏━━━━━━━━┓ ┏━━━━━━━━┓ ┏━━━━━━━━┓                ┃
┃ ┃ SETTINGS       ┃ ┃        ┃ ┃        ┃ ┃        ┃ ┃        ┃                ┃
┃ ┃ ABOUT          ┃ ┃ ▓▓▓▓▓▓ ┃ ┃ ▓▓▓▓▓▓ ┃ ┃ ▓▓▓▓▓▓ ┃ ┃ ▓▓▓▓▓▓ ┃                ┃
┃                  ┃ ┗━━━━━━━━┛ ┗━━━━━━━━┛ ┗━━━━━━━━┛ ┗━━━━━━━━┛                ┃
┃                  ┃                                                             ┃
┃                  ┃                                                             ┃
┃                  ┃                                                             ┃
┃ ─────────────────┃                                          ┏━━━━━━━━━━━━━━━━┓ ┃
┃ [a] dev          ┃                                          ┃▓▓ Track ▶ 🔊 ✕┃ ┃
┃ FLAC · ACTIVE  → ┃                                          ┗━━━━━━━━━━━━━━━━┛ ┃
┗━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
sidebar 240px       main, max-w-6xl, mx-auto                  MiniPlayer z-45
z-40
```

## 6. Components to modify

### `src/app/(main)/layout.tsx` (272 lines)
- **Remove (mobile only):** hamburger button at lines 142-149. Keep the JSX block but wrap in `hidden` (or delete; nothing else references it). The associated `setSidebarOpen(true)` call goes away from the top bar but stays alive for the secondary drawer trigger.
- **Add:** `<BottomNav />` import + render after `</aside>` and before `</div>` of the main flex container, around line 237. Keep it outside `<main>` so it sits above the scroll context, not within. Wrap with `md:hidden` *inside* the component (not at the call-site) so the component owns its own breakpoint.
- **Modify:** `<main class="...pb-24...">` at line 232 → `class="...pb-32 sm:pb-24..."`. Aligns with DESIGN.md §14 rule 6.
- **Modify:** top bar at line 140 — replace mobile section. Drop the `<Menu>` button. Keep mobile logo (lines 152-162). Add a new middle slot: `<div className="md:hidden flex-1 min-w-0 flex justify-center"><Suspense><Breadcrumb compact /></Suspense></div>`. The compact prop drives the new mobile-collapsed mode in `Breadcrumb.tsx`.
- **Modify:** mobile avatar dropdown content at lines 192-215. Remove "My Playlists" item (it's a tab now). Slim to: username header → About → Log out. Optionally add "More…" → opens secondary drawer.
- **Modify:** Sheet drawer at lines 240-253. Title stays "DEEMIX / NAVIGATION" or rename to "MORE." Render a slimmed `<Navigation variant="secondary" onNavigate={...} />` (new prop) that only emits secondary items.
- **Add:** `<Suspense>` wrap for breadcrumb compact mode (already wrapped on line 166-168 — extend the same pattern to the new mobile slot).
- **Wrap:** the entire `<header>` with `style={{ paddingTop: 'env(safe-area-inset-top)' }}` or use a Tailwind class `pt-[env(safe-area-inset-top)]` for status-bar safety on edge-to-edge Android Chrome.

### `src/components/layout/Sidebar.tsx` (82 lines)
- **Extract the items lists** (`navItems`, `authItems`, `secondaryItems` at lines 15-28) into a shared module: `src/components/layout/nav-items.ts` (new file). Export typed const arrays. Both `Navigation` (sidebar/drawer) and the new `BottomNav` consume them.
- **Add a `variant` prop:** `variant?: "sidebar" | "drawer-secondary"` (default `"sidebar"`). When `"drawer-secondary"`, only render `secondaryItems` minus `Settings` (Settings becomes a bottom-nav tab on mobile, but stays in the drawer for `md:` consistency; final decision: keep Settings only in sidebar/bottom nav, exclude from drawer to avoid duplication).
- **Active state:** unchanged — sidebar/drawer keep `border-l-[4px] border-l-accent`. The new bottom nav implements its own `border-t-[4px]` styling because the active visual is rotated 90°.
- **Touch targets in drawer:** the current `py-3 px-[18px]` rows compute to ~44px. Bump to `py-3.5` (gives ~48px) when used in the drawer to comply with DESIGN.md §5 mobile minimum.

### `src/components/layout/Breadcrumb.tsx` (89 lines)
- **Add a `compact` prop:** `compact?: boolean` (default `false`). When `true`, render only the **last** crumb's label as plain text (no `~/DEEMIX` root, no separators, no chain). This is the mobile top-bar mode.
- **Compact rendering:** `<span class="font-mono text-[11px] font-bold tracking-[0.12em] uppercase truncate">{lastCrumb.label}</span>` — fits in the middle slot of the 64px top bar.
- **Default rendering preserved:** desktop `≥md` keeps the full crumb chain. No regressions to the locked-in audit checklist.
- **Edge case:** when `pathname === "/"`, compact mode shows "HOME" (not nothing). Default mode shows just `~/DEEMIX` (current line 26 behavior).

## 7. Components to create (NEW)

### `src/components/layout/BottomNav.tsx` (new file)
- **Props:** none. Reads `usePathname()` and `useAuthStore(s => s.isAuthenticated)` directly.
- **Visibility:** root element `className="md:hidden ..."` — never rendered on desktop.
- **Position:** `fixed inset-x-0 bottom-0 z-50`.
- **Box:** `border-t-[3px] border-foreground bg-background pb-[env(safe-area-inset-bottom)]`.
- **Layout:** `<nav aria-label="Primary"><ul className="grid grid-cols-5">...</ul></nav>` (or `grid-cols-3` when unauthenticated).
- **Tab item:** `<Link href={...} aria-current={isActive ? "page" : undefined}>` wrapping a flex column with `min-h-[64px] py-2`, icon `size-6` + label `text-[9px] font-mono font-bold tracking-[0.14em] uppercase mt-1`. Active state: `bg-foreground text-background border-t-[4px] border-t-accent`. Inactive: `text-foreground/60 hover:bg-foreground/5`.
- **Reduced-motion:** no transitions on `bg`/`color` if `prefers-reduced-motion: reduce`. Currently MotionConfig handles motion divs; CSS transitions need an explicit guard via `[@media(prefers-reduced-motion:reduce)]:transition-none`.
- **Tap zone:** the entire `<Link>` is the target (`flex-1`, ≥64px tall). Per DESIGN.md §5, full-tab is the hit area, not just the icon.
- **No badge in v1.** Hook for v2: a `<span class="absolute top-1.5 right-1/2 translate-x-3 h-2 w-2 bg-accent border-[2px] border-foreground" />` overlay on the icon when `download.activeJobs > 0` for the Library tab.

### `src/hooks/useViewport.ts` (new file, optional)
- **Signature:** `() => { isMobile: boolean }`.
- **Implementation:** `window.matchMedia('(max-width: 767.98px)')` subscription with `addEventListener("change", ...)`. SSR-safe default `false`.
- **Use case:** components that need conditional behavior beyond CSS visibility — e.g., `MiniPlayer` deciding which `bottom` offset to compute (the spec prefers pure CSS via `bottom: calc(...)` and a `md:` override; `useViewport` is only needed if a component must render structurally different markup).
- **Verdict:** **skip in v1** unless a concrete need lands. Pure CSS handles all current cases.

### `src/components/layout/nav-items.ts` (new file, supporting)
Holds the shared `NAV_ITEMS_PRIMARY` (Home, Search), `NAV_ITEMS_AUTH` (Library, Playlists), `NAV_ITEMS_SECONDARY` (Settings, About) arrays. Imported by `Sidebar.tsx` and `BottomNav.tsx`. Pulled out of `Sidebar.tsx:15-28`.

## 8. Token/CSS additions

### `src/app/globals.css`
Add to `:root` block (around line 47, after `--shadow-brutal-active`):

```css
--top-bar-h: 64px;
--bottom-nav-h: calc(64px + env(safe-area-inset-bottom));
--mini-player-h: 64px;
--mini-player-gap: 8px;
```

Add to `@layer utilities` block (after `.brutal-stripe` at line 196):

```css
.pb-app-chrome {
  padding-bottom: calc(var(--bottom-nav-h) + var(--mini-player-h) + var(--mini-player-gap) + 16px);
}
@media (min-width: 768px) {
  .pb-app-chrome {
    padding-bottom: calc(var(--mini-player-h) + 24px);
  }
}
```

Apply `.pb-app-chrome` to the `<main>` in `(main)/layout.tsx:232` (replacing `pb-32 sm:pb-24`). Result: scroll containers always clear chrome, regardless of which chrome is active for the current breakpoint.

Also add **scroll-padding** so anchor/scrollIntoView calls don't hide content under fixed chrome:

```css
html {
  scroll-padding-top: var(--top-bar-h);
  scroll-padding-bottom: calc(var(--bottom-nav-h) + var(--mini-player-h) + var(--mini-player-gap));
}
@media (min-width: 768px) {
  html {
    scroll-padding-bottom: calc(var(--mini-player-h) + 24px);
  }
}
```

## 9. Z-index audit (cross-component impact)

| Component | File:line | Current | Target | Reason |
|---|---|---|---|---|
| Top bar `<header>` | `(main)/layout.tsx:139` | `z-30` | `z-30` | Unchanged |
| Desktop sidebar `<aside>` | `(main)/layout.tsx:74` | `md:z-40` | `md:z-40` | Unchanged |
| `LyricsPanel` | `LyricsPanel.tsx:56` | `z-40` | `z-40` | Unchanged (desktop side panel, doesn't conflict) |
| `QueuePanel` | `QueuePanel.tsx:90` | `z-40` | `z-40` | Unchanged |
| **`MiniPlayer`** | `MiniPlayer.tsx:40` | **`z-50`** | **`z-45`** 🆕 | Must sit *under* the bottom nav so the nav border-top reads as the page edge. DESIGN.md §7. |
| `Player` (legacy fixed bar) | `Player.tsx:113` | `z-50` | **`z-45`** 🆕 | Same reason — though this component is `fixed bottom-0 left-0 right-0` (full-width), if it's still mounted, it would collide. Drop to z-45 too, or hide on mobile via `md:` if it's desktop-only. (Component note: `(main)/layout.tsx:261` mounts `<Player />` — verify whether it renders alongside MiniPlayer or replaces it.) |
| `<Sheet>` backdrop | `sheet.tsx:31` | `z-50` | `z-50` | Unchanged — drawer + bottom nav can both be z-50; the Sheet content uses higher (z-60 implicitly from compositing). |
| Dropdown menu | `dropdown-menu.tsx:36,45` | `z-50` | `z-50` | Unchanged. The avatar dropdown opens above the bottom nav cleanly because it uses fixed positioning anchored to its trigger. |
| Search results popover | `search/page.tsx:280` | `z-50` | `z-50` | Unchanged — the popover anchors below the search input, well above the bottom nav baseline. Visually fine. |
| **`FullscreenPlayer`** | `FullscreenPlayer.tsx:444` | **`z-[60]`** | **`z-70`** 🆕 | DESIGN.md §7 mandate. Sits above sheets/modals. |
| `LyricsImmersive` | `LyricsImmersive.tsx:146` | `z-[80]` | `z-80` (rename to bare `z-80` if available, otherwise leave `z-[80]`) | Already correct numerically. DESIGN.md §7 lists `z-70` for it but the project file uses 80; treat as docs lag — keep 80 since it must sit above FullscreenPlayer (at z-70). |
| **`BottomNav`** 🆕 NEW | new file | — | **`z-50`** | Per DESIGN.md §7. |

**Net z-index changes:** 2 known regressions to avoid (`MiniPlayer` and `Player` from z-50 → z-45) + 1 NEW component at z-50 + 1 documentation alignment (`FullscreenPlayer` z-60 → z-70).

## 10. Implementation order (dependencies)

1. **CSS tokens + utilities** — add `--top-bar-h`, `--bottom-nav-h`, `--mini-player-h`, `--mini-player-gap`, `.pb-app-chrome`, `html { scroll-padding-* }` to `globals.css`. **No UI impact yet.**
2. **Extract `nav-items.ts`** — pull arrays out of `Sidebar.tsx`. Update `Sidebar.tsx` to import them. Verify desktop sidebar still renders identically. (Lock test: snapshot the rendered DOM of `<Navigation />` before/after.)
3. **Build `BottomNav.tsx`** — pure component, not yet mounted. Render it in isolation with Storybook or a temporary `/dev/bottom-nav-preview` route. Verify: 5-tab grid, 3-tab grid (logged out), active state, safe-area, `aria-current`, `aria-label`.
4. **Mount `BottomNav` in `(main)/layout.tsx`** — render after the main flex container, with `md:hidden` baked into the component. Test: appears on `<md`, hidden on `≥md`.
5. **Z-index audit pass** — bump `MiniPlayer.tsx:40` and `Player.tsx:113` from `z-50` → `z-45`. Bump `FullscreenPlayer.tsx:444` from `z-[60]` → `z-70`. Smoke-test all three components (open MiniPlayer, open FullscreenPlayer, open a Sheet) on a 360×640 viewport.
6. **MiniPlayer mobile bottom offset** — change `bottom-5` to a responsive `bottom-[calc(64px+env(safe-area-inset-bottom)+8px)] right-3 md:bottom-5 md:right-5`. (`MiniPlayer.tsx:40`).
7. **Bump `<main>` padding** — change `pb-24` → `pb-app-chrome` (or equivalent `pb-32 sm:pb-24`). (`(main)/layout.tsx:232`).
8. **Top bar surgery** — drop hamburger; add compact Breadcrumb mobile slot; trim avatar dropdown. (`(main)/layout.tsx:140-225`).
9. **Breadcrumb compact prop** — add `compact` prop and rendering branch. (`Breadcrumb.tsx`).
10. **Drawer slim-down** — Sheet now serves only secondary destinations. Adjust trigger (avatar dropdown "More…" or remove drawer entirely if it's empty). (`(main)/layout.tsx:240-253`).
11. **Smoke-test pass** — open every page on 360×640 (Pixel 5 emulator in Chrome DevTools). Check: bottom nav visible, MiniPlayer floats above it with 8px gap, no content cut off at scroll bottom, `aria-current` on active tab, dropdown still works.
12. **Auth-state shift test** — sign in/out and verify the 3 ↔ 5 tab transition doesn't cause a hover sticky or focus loss.

Optional follow-ups (out of v1 scope):
- `useViewport.ts` hook (if a component genuinely needs JS-based mode switching).
- Badge dot on Library tab for in-flight downloads.
- Replace Sheet drawer entirely with a fullscreen "More" page.

## 11. Effort estimate

| # | Task | Size |
|---|---|---|
| 1 | CSS tokens + `.pb-app-chrome` + scroll-padding | **S** (15min) |
| 2 | Extract `nav-items.ts` + refactor `Sidebar.tsx` | **S** (20min) |
| 3 | Build `BottomNav.tsx` (incl. active state, safe-area, auth-aware) | **M** (60min) |
| 4 | Mount in `(main)/layout.tsx` + responsive guards | **S** (15min) |
| 5 | Z-index audit & bumps (3 files) | **S** (15min) |
| 6 | MiniPlayer bottom offset + width clamp | **S** (15min) |
| 7 | `<main>` padding swap | **S** (5min) |
| 8 | Top bar surgery (drop hamburger, compact breadcrumb slot, slim avatar dropdown) | **M** (45min) |
| 9 | `Breadcrumb compact` prop | **S** (20min) |
| 10 | Drawer slim-down (secondary-only) | **S** (20min) |
| 11 | Smoke-test pass + manual QA on 360×640 | **M** (45min) |
| 12 | Auth-state hydration regression check | **S** (15min) |

**Total: ~5h** (approx, excluding any unforeseen z-index domino effects from `Player.tsx`).

## 12. Risks & open questions

1. **Should the secondary drawer survive at all?** Once primary destinations move to bottom nav, the drawer holds only "About" + "System info." That's two items — does it justify a Sheet? Alternative: collapse into avatar dropdown ("About," "Log out," "Version: v1.4.2 ✓"). Decision needed before §6 changes ship. **Default recommendation:** keep Sheet but trigger it from a *new* "More…" item in the avatar dropdown, only on mobile. On desktop the sidebar already exposes everything.

2. **Settings tab vs. Profile tab tradeoff.** Should the 5th bottom-nav tab be Settings (current pick, mirrors DESIGN.md §7) or "Profile" (avatar + name)? Argument for Profile: more touch-friendly than the 28×28 avatar in the top-right corner. Argument for Settings: DESIGN.md explicitly lists Settings as the 5th tab. **Default:** keep Settings per DESIGN.md; revisit if user-test feedback flags the avatar-corner reach.

3. **Auth-state-dependent tab count = layout shift?** When user logs in, `grid-cols-3` swaps to `grid-cols-5`. The two new tabs (Library, Playlists) appear in the middle, shifting Settings rightward. Visually noticeable but **not a CLS** (it's user-action-triggered, not initial paint). Mitigation: animate tab insertion with a 100ms width transition. Risk **low**.

4. **MiniPlayer width on 360px viewport with bottom nav.** Current MiniPlayer is `~280px wide` (cover 40 + info 140 + volume + buttons). At 360px viewport with `right-3` (12px), available space is 336px — fits. At 320px viewport (older devices), 296px available — tight. **Mitigation:** add `max-w-[calc(100vw-24px)]` and ensure track title `truncate` + volume slider hides on `<sm`.

5. **`Player.tsx` legacy fixed bar.** `Player.tsx:113` renders a `fixed bottom-0 left-0 right-0 z-50` bar with `pb-[env(safe-area-inset-bottom)]`. Is this *the same* component as MiniPlayer or a different one (full-width player bar)? If both are mounted simultaneously, they'd stack. Need to read `Player.tsx` body to confirm — outside this audit's read list. **Action item:** verify `Player.tsx` is mobile-mounted before bumping its z-index; if it duplicates MiniPlayer, consider unmounting one on mobile.

6. **Sticky hover on Tailwind 4.** DESIGN.md §6 warns about hover transforms persisting on Chrome Android tap. Bottom nav uses `hover:bg-foreground/5` (or its target equivalent); verify Tailwind 4's `hover:` is auto-gated to `(hover: hover)` per the docs. If not, replace with `[@media(hover:hover)]:hover:bg-foreground/5`. **Action:** spot-test on a real Android device before merging.

7. **`useAuthStore` SSR fallback.** Initial render on SSR has `isAuthenticated = false` (Zustand default). Bottom nav renders 3 tabs on first paint, then swaps to 5. For a logged-in user, this is a flash. **Mitigation:** read auth from a cookie set by better-auth during SSR (already a project pattern via `requireDeezerAndApp` helper) and pass an `initialIsAuthenticated` prop down. Lower priority — flash is <100ms in practice on Chrome.

8. **Breadcrumb `compact` prop name collision.** No existing `compact` prop on Breadcrumb. Safe.

9. **Settings page already has its own sub-nav.** Adding Settings as a bottom-nav tab is fine; the page's internal nav works inside the page chrome. No cross-cutting concern.

10. **Test coverage gap.** The locked-in test surface (`CLAUDE.md` table) does **not** include layout components. New `BottomNav.tsx` does not enter the coverage gate, but a regression test for `aria-current="page"` semantics + auth-aware tab count is cheap and prudent. Add `BottomNav.test.tsx` even though it's not gate-required — DESIGN.md §15 audit checklist makes it implicit policy.
