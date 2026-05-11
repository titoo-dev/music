# DESIGN.md — deemix-next mobile-first design system

Single source of truth for the visual language. Brutalist, Chrome-only, mobile-first. All tokens reference `src/app/globals.css`. Anything tagged `🆕 NEW` is a proposed extension to fill an explicit gap.

## 0. Philosophy
- Mobile is the default canvas. Desktop is a progressive enhancement, never the inverse.
- Brutalist: explicit borders, hard shadows, mono labels, no gradient mush, no soft shadows.
- Touch-first: every interactive surface is reachable with a thumb without re-gripping.
- One-hand reach: primary actions live in the bottom 60% of the viewport on mobile.
- Performance: respect `prefers-reduced-motion`, use Chrome-modern APIs (`@container`, `dvh`, `:has()`), no CLS.

## 1. Breakpoints & responsive cascade

Tailwind 4 defaults; mobile-first cascade. Base styles target <640.

| Token | Min width | Border | Shadow | Layout shift | Notes |
|---|---|---|---|---|---|
| (base) | 0 | `2px` (`--border-w`) | `3px 3px` (`--shadow-brutal`) | Single column, full-bleed | Bottom nav + floating MiniPlayer |
| `sm:` | 640 | `3px` (`--border-w` upgrade) | `4px 4px` (`--shadow-brutal` upgrade) | 2-col grids start | Hover shadow `6px 6px` |
| `md:` | 768 | `3px` | `4px 4px` | Sidebar appears, bottom nav drops | Desktop chrome takes over |
| `lg:` | 1024 | `3px` | `4px 4px` | 4-col grids | Wider content rails |
| `xl:` | 1280 | `3px` | `4px 4px` | 5-col grids | Max practical column count |
| `2xl:` | 1536 | `3px` | `4px 4px` | Cap content at `max-w-6xl` | Avoid stretched line lengths |

Border + shadow upgrades happen automatically at `sm` via `@media (min-width: 640px)` in `globals.css` — do not redefine them per-component.

## 2. Color tokens

Light brutalist only. No dark mode planned. Pull from `globals.css` verbatim.

| Token | Hex | Semantic intent |
|---|---|---|
| `--background` | `#F0EBE3` | Cream page background, default canvas |
| `--foreground` | `#0D0D0D` | Body text, all borders, dark surfaces |
| `--card` | `#FFFFFF` | Elevated surfaces, list rows, brutal cards |
| `--card-foreground` | `#0D0D0D` | Text on cards |
| `--popover` | `#FFFFFF` | Dropdowns, menus |
| `--primary` | `#FF2E00` | CTAs, active state, hot accent (red-orange) |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--secondary` | `#0D0D0D` | Inverted dark buttons, sidebar bg |
| `--secondary-foreground` | `#F0EBE3` | Text on dark surfaces |
| `--muted` | `#DDD8CF` | Skeletons, subtle fills, disabled tracks |
| `--muted-foreground` | `#6B6560` | Mono labels, secondary metadata |
| `--accent` | `#C8FF00` | Lime highlight — active row, FLAC badge, focus inversion |
| `--accent-foreground` | `#0D0D0D` | Text on accent |
| `--destructive` | `#FF0044` | Delete, logout, error |
| `--border` / `--input` | `#0D0D0D` | Universal hard border |
| `--ring` | `#FF2E00` | Focus outline |
| `--sidebar` | `#FFFFFF` | (UNUSED — desktop sidebar is `--foreground`) |

**Rules:**
- Never invent a new color. If you need a tint, use `bg-foreground/5`, `bg-foreground/15`, `bg-background/30`, etc.
- Active list row = `bg-accent`. Hover = `bg-foreground/5`.
- Destructive actions: text in `--destructive`, never as background fill outside `<Button variant="destructive">`.
- Selection highlight (already wired): `::selection { background: var(--accent) }`.

## 3. Typography scale

Sans is the default font (`--font-sans`); mono (`--font-mono`) is reserved for labels, badges, tabular numerics, and timestamps. Headings use the same sans family with extreme weight.

### Display (`.text-brutal-*` from globals.css)
| Class | Size (clamp) | Weight | Use |
|---|---|---|---|
| `.text-brutal-xl` | `clamp(2rem, 5vw, 4rem)` | 900 | Page hero (`MY COLLECTION.`) |
| `.text-brutal-lg` | `clamp(1.5rem, 3vw, 2.5rem)` | 800 | Section title |
| `.text-brutal-md` | `clamp(1.125rem, 2vw, 1.5rem)` | 700 | Now-playing title, modal title |

### Body 🆕 NEW — explicit scale
| Use | Mobile | `sm:` ≥640 | Weight |
|---|---|---|---|
| Body default | `text-sm` (14px) | `text-base` (16px) | 500 |
| List row title | `text-[13px]` | `text-[13px]` | 700 (bold) |
| List row meta | `text-[11px]` | `text-[11px]` | 500 (font-medium) |
| Caption / hint | `text-xs` (12px) | `text-xs` | 500 |

### Labels (uppercase, mono, tracked)
| Class / pattern | Size | Use |
|---|---|---|
| `.brutal-label` | `0.65rem` (10.4px), `letter-spacing: 0.1em` | Section eyebrows, tab counts |
| `text-[10px] font-mono font-bold uppercase tracking-[0.14em]` | 10px | Page eyebrow (`LIBRARY`) |
| `text-[11px] font-mono font-bold tracking-[0.14em] uppercase` | 11px | Nav items, tab labels |
| `text-[9px] font-mono tracking-[0.1em] uppercase` | 9px | User status (`FLAC · ACTIVE`) |

**Rule:** never shrink a label below 9px even on mobile — readability over hierarchy.

## 4. Spacing & rhythm

8pt-aligned. Tailwind `p-1`/`p-2`/`p-3`/`p-4`/`p-6`/`p-8` are the only sizes you should reach for.

### Container padding (page shell)
| Breakpoint | Horizontal | Class |
|---|---|---|
| Mobile | 12px | `px-3` |
| `sm` ≥640 | 24px | `sm:px-6` |
| `lg` ≥1024 | 32px | `lg:px-8` |

Already wired in `(main)/layout.tsx`: `mx-auto w-full max-w-6xl px-3 pt-6 pb-24 sm:px-6 lg:px-8`. Keep `pb-24` minimum on mobile to clear MiniPlayer + bottom nav (see §7).

### Vertical rhythm
| Surface | Inner padding | Gap |
|---|---|---|
| List row | `py-2 sm:py-2.5` | `gap-2 sm:gap-3` |
| Card | `py-4` (`sm` keeps) | `gap-4` |
| Sheet header | `p-4` | `gap-0.5` |
| Section between blocks | — | `mb-6` mobile, `mb-7` desktop |

**Rule:** never use values outside the {0, 1, 2, 3, 4, 6, 8, 12, 24} Tailwind scale unless replicating an existing pixel-perfect constant (`px-[18px]` for sidebar — already locked in).

## 5. Touch targets & hit areas 🆕 NEW

The current codebase has icon buttons as small as 24×24 (`h-6 w-6` close button on MiniPlayer). On mobile these violate the touch baseline. New rules:

| Context | Min size mobile | Min size desktop | Spacing between targets |
|---|---|---|---|
| Primary CTA | 48×48 | 40×40 | 12px |
| Secondary button | 44×44 | 36×36 | 8px |
| Icon-only button | **44×44** | 36×36 | 8px |
| Nav item (bottom nav) | 56×56 (full tab) | n/a | 0px (adjacent) |
| List row | 64px tall | 48px tall | 0 (rows abut, divider line only) |
| Inline anchor inside text | 24px line-height | 20px line-height | n/a |

**Implementation patterns:**
- Icon-only `<Button size="icon">` is currently `size-9` (36×36) — this is **OK on desktop, too small on mobile**. Audit & wrap with `before:absolute before:inset-[-4px] before:content-['']` to extend the hit area without changing visual size, OR upgrade size class with `class="h-11 w-11 md:h-9 md:w-9"`.
- Tap zone overlap: never. Use grid gaps or `gap-2` minimum.
- Long-press is a recognized affordance (`useLongPress` in `TrackRow.tsx`). Always pair it with a visible alternative (3-dot menu on `md:` and up).

## 6. Borders & shadows

Already locked in via tokens. **Do not invent new border widths or shadow offsets.**

| Token | Value | When to use |
|---|---|---|
| `--border-w` | 2px mobile, 3px ≥sm | All borders, all the time |
| `--shadow-brutal` | `3px 3px 0` mobile, `4px 4px 0` ≥sm | Default elevation |
| `--shadow-brutal-sm` | `2px 2px 0` | Inputs on focus, secondary chips |
| `--shadow-brutal-hover` | `4px 4px 0` mobile, `6px 6px 0` ≥sm | Hover state on cards |
| `--shadow-brutal-active` | `1px 1px 0` | Pressed state on buttons |

### Composite utilities (use these, don't reimplement)
- `.brutal-card` = border + shadow + white bg.
- `.brutal-card-hover` = adds the `-2px / -2px` translate on hover, `+2px / +2px` on active.
- `.brutal-input` = border only; shadow appears on `:focus`.
- `.brutal-divider` = top border using `--border-w`.

### Hover-on-touch rule 🆕 NEW
The `.brutal-card-hover` translate creates "sticky hover" on touch devices (the transform persists after tap on Chrome Android until the next interaction). Wrap hover transforms in `@media (hover: hover)`:

```css
@media (hover: hover) {
  .brutal-card-hover:hover { /* existing rule */ }
}
```

Where `globals.css` is locked, in component code use `hover:` together with the implicit Tailwind hover variant — Tailwind 4 already gates `hover:` to `hover:hover` in modern Chrome. **Verify this assumption by spot-checking with DevTools "Emulate touch."** If sticky hover appears, replace `hover:bg-foreground/5` with `[@media(hover:hover)]:hover:bg-foreground/5`.

## 7. Navigation strategy (CRITICAL)

### Mobile (<md, 768px) 🆕 NEW bottom nav
- **Top bar**: 56px (currently `h-16` = 64px — keep 64px since it matches desktop). Sticky, `border-b-[3px] border-foreground bg-background z-30`. Logo + (current page label, truncated) + avatar dropdown. **Hamburger removed** — replaced by bottom nav for primary destinations.
- **Bottom navigation bar 🆕 NEW**: 5-tab grid, fixed bottom, `z-50`. Tabs: `Home / Search / Library / Playlists / Settings`. Each tab is `flex-1`, 56×56 minimum hit, mono uppercase 9px label below 20px lucide icon. Active tab: `bg-foreground text-background` with `border-t-[4px] border-l-[0px] border-r-[0px] border-b-[0px] border-accent` (lime stripe top, mirroring the sidebar's `border-l-[4px] border-l-accent`).
- **Drawer (left sheet)**: kept for **secondary** destinations only (About, Logout, version info). Triggered from the avatar dropdown's "More" item — not a top-level hamburger. The current full-nav sheet stays as fallback during transition.
- **Bottom nav height**: 64px content + `env(safe-area-inset-bottom)` padding. Total visual height ≈ 64–88px depending on device.
- **MiniPlayer**: floats above bottom nav with **8px gap**, 64px tall, `bottom: calc(64px + env(safe-area-inset-bottom) + 8px)` mobile, `right: 20px` (current pattern: `fixed bottom-5 right-5`).

### Desktop (≥md)
- **Sidebar**: 240px (`md:w-60`), fixed left, dark (`bg-foreground text-background`). Logo, primary nav, user/logout. **No bottom nav, no hamburger.**
- **Top bar**: still sticky, but breadcrumb takes the center; avatar dropdown top-right.
- **MiniPlayer**: stays floating bottom-right (current pattern). Optional future: pin to a 72px-tall bar spanning content width — mark as future work, not in scope yet.

### Stacking order (z-index discipline)
| Layer | z-index | Component |
|---|---|---|
| Page chrome top | `z-30` | Top bar |
| Desktop sidebar | `z-40` | `<aside class="md:z-40">` |
| MiniPlayer (mobile floating) | `z-45` 🆕 NEW | Currently `z-50` — drop to `z-45` so bottom nav sits on top edge |
| Bottom nav (mobile) 🆕 NEW | `z-50` | New component |
| Modals / sheets | `z-60` | TrackActionSheet, ShareDialog |
| Fullscreen player / lyrics immersive | `z-70` | Currently `z-[60]` — bump to `z-70` (existing only conflicts at `z-60`) |

**Rule:** never use ad-hoc `z-[99]` or `z-[9999]`. All layers must come from this table.

## 8. Layout patterns

### Page shell (current, formalize)
```
┌──────────────────────────┐  z-30 top bar (h-16)
│         TOP BAR          │
├──────────────────────────┤
│                          │
│        SCROLLABLE        │  ScrollArea with main content,
│         <main>           │  px-3 sm:px-6 lg:px-8, pb-32 mobile
│                          │
├ ─ ─ MiniPlayer (z-45) ─ ─┤  floating, bottom-right, 8px above bottom nav
├──────────────────────────┤  z-50 bottom nav (mobile only)
│  HOME  SRCH  LIB  PL  ⚙ │
└──────────────────────────┘
```

### Safe areas 🆕 NEW
- All bottom-anchored chrome must use `padding-bottom: env(safe-area-inset-bottom)` or `bottom: env(safe-area-inset-bottom)`.
- Already wired in TrackActionSheet (`pb-[env(safe-area-inset-bottom)]`). Apply same to bottom nav and floating MiniPlayer.

### Viewport units
- Use `dvh` (dynamic viewport height) over `vh`. Already used in main shell (`h-dvh`). Modals and sheets that span the viewport must use `dvh` too — `h-screen` is forbidden.

### Content max-width
- `max-w-6xl` (currently used) on desktop. Mobile is full-bleed. Never widen beyond this — line lengths get unreadable past ~75ch.

### Scroll containers
- One scroll context per viewport (the main `ScrollArea`). Sheets and dialogs lock body scroll. Never nest scrolls.
- Long lists: `overflow-x-auto scrollbar-hide` for tab strips (already used in library). Never `overflow-x-auto` on a primary content column.

## 9. Component patterns

### Buttons (`src/components/ui/button.tsx`)
Already has variants `default | outline | secondary | ghost | destructive | link` and sizes `xs | sm | default | lg | icon | icon-sm | icon-lg | icon-xs`.

🆕 NEW size guidance:
| Variant | Mobile min | Desktop min | Notes |
|---|---|---|---|
| `default` (primary) | `h-12` (48px) | `h-9` (36px) — current `default` | Use `size="lg"` on mobile-only CTAs |
| `outline` | same | `h-9` | |
| `ghost` | `h-11 w-11` for icon | `size-9` | Pad to 44×44 on mobile |
| `icon` | 44×44 | 36×36 | Add responsive class until `Button` is updated |

The `default` variant already has the brutalist hover (`-translate-x-[1px] -translate-y-[1px]` + bigger shadow) and active (`translate-x-[1px] translate-y-[1px]` + small shadow). Don't override these.

### Inputs
- Use `.brutal-input` baseline. Mobile `h-12` (48px), desktop `h-9` (36px). Currently sheets use `h-9` — bump to `h-11` mobile.
- Search input on `/search` page must be sticky-top on mobile, sticky directly below top bar.
- Inputs always have visible label OR `aria-label`. Never rely on placeholder as label.

### Cards (`src/components/ui/card.tsx`)
Already uses `border-2 sm:border-[3px] border-foreground bg-card shadow-[var(--shadow-brutal)]`.

Grid responsive cascade for card grids:
| Use | Mobile | `sm:` ≥640 | `md:` ≥768 | `lg:` ≥1024 |
|---|---|---|---|---|
| Album/playlist tiles | `grid-cols-2` | `sm:grid-cols-3` | `md:grid-cols-4` | `lg:grid-cols-5` |
| Wide feature cards | `grid-cols-1` | `sm:grid-cols-2` | `md:grid-cols-2` | `lg:grid-cols-3` |
| Stat tiles | `grid-cols-2` | `sm:grid-cols-4` | `md:grid-cols-4` | `lg:grid-cols-4` |

Gap: `gap-3 sm:gap-4`. Never `gap-2` between cards (borders touch).

### List rows (`TrackRow.tsx`)
Current implementation: 9-column grid varying by `showBitrate`/`showDuration`/`trackNumber`. Keep as-is. Heights:
- Default: ~52px (mobile), ~56px (desktop). 🆕 NEW guidance: bump to `min-h-[64px]` on mobile via `min-h-16 sm:min-h-12` for thumb comfort.
- Cover: 36×36 (`size-9`) — keep.
- Overflow menu: hidden `<md`, replaced by long-press → TrackActionSheet (already wired). The desktop 3-dot menu (`hidden md:block`) stays.

### Bottom sheets (`Sheet` primitive `side="bottom"`)
- Wired via `@base-ui/react/dialog` — already brutalist (3px top border, `shadow-brutal-hover`).
- 🆕 NEW: drag handle convention. The fullscreen player has one (4px×48px bar at top, `bg-foreground rounded-sm`). Apply the same to TrackActionSheet and any future bottom sheets — visual cue + grab affordance.
- Snap points: 50% / 90% (max). Use `max-h-[85vh]` (current) or `max-h-[90vh]` for picker views. Never full viewport — leave 10vh of backdrop visible so the user knows it's dismissable.
- Backdrop: `bg-black/10` (current). Tap-to-dismiss is on by default.
- Body scroll locks via Base UI primitive — verify in Chrome that `<main>` does not scroll while sheet is open. (TrackActionSheet currently relies on this.)

### Modals / full-page overlays
- Use the same `Sheet` primitive with `side="bottom"` for mobile, OR a `Dialog` for desktop. Avoid building custom Motion overlays unless the interaction demands drag-to-dismiss (FullscreenPlayer is the legitimate exception).
- Slide-up from bottom on mobile (matches OS expectation), fade on desktop ≥md.

## 10. Audio player layering

### MiniPlayer (current)
- 64px tall, floats `bottom-5 right-5` on desktop, **🆕 NEW move to** `bottom: calc(64px + env(safe-area-inset-bottom) + 8px); right: 12px` on mobile so it stacks above the bottom nav.
- Border `2px sm:3px`, `bg-background`, `shadow-[var(--shadow-brutal-hover)]`.
- Tap on cover/title → opens FullscreenPlayer. Long-press → opens TrackActionSheet (currently right-click only via `onContextMenu` — 🆕 NEW: also wire long-press on mobile).

### FullscreenPlayer (current)
- Mobile only (`md:hidden`), `inset-0 z-[60]` → 🆕 NEW bump to `z-70`.
- Vertical stack: drag handle / header / cover carousel (square, max 340px, 90vw) / track info / visualizer / seek / volume / extras / controls.
- Hero artwork: `aspect-square w-full max-w-[340px]` with `border-[3px] border-foreground shadow-[var(--shadow-brutal)]`. Don't enlarge it — leaves room for one-thumb access to controls below.
- Play button: 72×72 (current `h-[72px] w-[72px]`). Prev/Next: 56×56 (`h-14 w-14`). Shuffle/Repeat: 48×48 (`h-12 w-12`). All within thumb reach in the bottom 35% of the screen — keep this layout.
- Drag-to-dismiss: pull down >100px or velocity >500 → close. Currently wired.

### QueuePanel
- Bottom sheet on mobile (90% height), right drawer on desktop. Match the `Sheet` primitive — no custom panel.

### LyricsPanel / LyricsImmersive
- LyricsPanel = side panel on desktop, embedded in FullscreenPlayer on mobile (toggle button in header — current behavior).
- LyricsImmersive = full-bleed mode, `z-70`, swipe up from FullscreenPlayer, swipe down to dismiss.

## 11. Motion principles

`MotionConfig reducedMotion="user"` is wired in `(main)/layout.tsx`. All motion respects `prefers-reduced-motion: reduce` automatically.

| Interaction | Duration | Easing |
|---|---|---|
| Hover / tap feedback | 100ms | `ease-out` (or just `transition-colors`) |
| Page transition | 200ms | View Transitions API (Chrome) where viable |
| Sheet open/close | 200ms | `cubic-bezier(0.32, 0.72, 0, 1)` (iOS-style ease) — already feels right with Base UI |
| FullscreenPlayer open | spring | `damping: 30, stiffness: 300` (current) |
| MiniPlayer enter/exit | spring | `damping: 25, stiffness: 300` (current) |
| Drag handle pulse | 1.6s loop | `easeInOut`, `repeatDelay: 1.4` (current) |

**No-go list:**
- No parallax on scroll.
- No scroll-jacking. Brutalist = direct.
- No content fade-ins on initial render unless paired with skeleton (avoid CLS).
- No full-page transitions that delay first paint.

## 12. Accessibility

| Concern | Rule |
|---|---|
| Focus ring | `focus-visible:ring-2 focus-visible:ring-ring` (already in Button). Apply to every custom interactive element. |
| Color contrast | Verify foreground/background AAA (#0D0D0D on #F0EBE3 ≈ 17:1 ✓). Primary on white: #FF2E00 on #FFFFFF ≈ 4.0:1 — borderline AA, **never use primary text on white smaller than 14px bold**. Use `--primary` as fill, not text, for small UI. |
| Icon-only buttons | Always `aria-label`. Audit existing components — TrackActionMenu trigger and similar must be checked. |
| Bottom nav 🆕 NEW | `<nav role="navigation" aria-label="Primary">`, current item `aria-current="page"`. |
| Audio announcements | `TrackAnnouncer` already mounted (polite live region). Don't add a second live region elsewhere. |
| Form labels | Every input either has a visible `<label>` or `aria-label`. |
| Long-press affordance | Pair with visible UI on `md:` and up (already done with `TrackActionMenu`). |
| Keyboard shortcuts | `useKeyboardShortcuts` mounted globally. Document in About page; don't surface mid-flow. |

## 13. Iconography

- `lucide-react` only (already the dependency).
- Stroke-width: 2 default, 2.5 for emphasis (large player buttons), 3 for arrow chevrons in tight spaces.
- Sizes: 16px inline (`size-4`), 20px default (`size-5`), 24px prominent (`size-6`), 28px hero (`size-7`).
- Custom SVGs (play/pause/prev/next/shuffle/repeat in player) intentionally diverge from lucide for thicker, more brutalist geometry. Keep them — don't replace with lucide variants.

## 14. Mobile-first authoring rules (engineer checklist)

1. **Always start CSS mobile-first.** Base styles target <640px. Layer `sm:` then `md:` then `lg:`. Never start with desktop and override down.
2. **Never use `hidden md:block` to swap content.** Build one component that adapts via responsive classes. The only legit `md:hidden` use is for *truly* mobile-only chrome (FullscreenPlayer, bottom nav) where the desktop equivalent is a different component pattern.
3. **Don't use desktop hover as primary affordance.** Every hover behavior must have a touch equivalent (long-press, sheet, explicit visible button). Current TrackRow does this correctly with `useLongPress`.
4. **Test at 360×640, 390×844, 768×1024, 1280×800.** Smallest is 360 (Pixel 5/budget Android). Anything that breaks at 360 is broken.
5. **`min-w-0` on flex children** that contain truncated text. Already the convention — don't drop it.
6. **`pb-32` on scroll containers** when MiniPlayer + bottom nav can be active. Currently the main shell uses `pb-24` — 🆕 NEW bump to `pb-32` mobile, `sm:pb-24` to clear the floating MiniPlayer + bottom nav stack.

## 15. Per-screen audit checklist

Run this before merging any new screen.

- [ ] Top bar reachable, no horizontal scroll at 360px viewport
- [ ] Every interactive target ≥44×44 with ≥8px gap on mobile
- [ ] Body text ≥14px on mobile, no font under 9px even for labels
- [ ] Primary action sits in the bottom 60% of the viewport (one-thumb reach)
- [ ] No content hidden behind MiniPlayer or bottom nav (`pb-32` mobile / `sm:pb-24` on scroll containers)
- [ ] Loading skeletons match final layout (matching dimensions = no CLS)
- [ ] Empty state: full-bleed brutal frame with CTA (mirror `EmptyState` in `library/page.tsx`)
- [ ] Error state: brutal frame with retry + plain-language message
- [ ] Works without hover (use DevTools "Emulate touch" to verify)
- [ ] `prefers-reduced-motion: reduce` removes spring/transition (already auto via MotionConfig — verify drop-in motion divs respect it)
- [ ] All icon buttons have `aria-label`
- [ ] `dvh` not `vh` for any viewport-height measurement
- [ ] Tokens used: no inline hex, no off-scale spacing values
- [ ] Sheet/modal backdrop dismisses; body scroll locks
- [ ] If route adds nav destination, verify bottom nav 🆕 NEW reflects it (or it lives in the secondary drawer)

## 16. Open gaps (not blocking, track in issues)

- `Button size="icon"` is 36×36 — needs a `size="icon-touch"` variant at 44×44 for mobile-only contexts. Until then, override with `className="h-11 w-11 md:h-9 md:w-9"`.
- `MiniPlayer` close button is `h-6 w-6` (24×24) — fails touch min. Wrap in 44×44 padded zone.
- Sticky-hover audit not yet automated — manual verification on Chrome Android per release until a `@media(hover:hover)` lint rule lands.
- Bottom nav component (🆕 NEW) is unimplemented as of this writing. Until shipped, hamburger sheet remains the mobile primary nav.
- Dark mode: not planned. The `@custom-variant dark` and `data-slot` dark variants in `globals.css`/components are inert — leave them, don't extend them.
