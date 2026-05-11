# Mobile-First Spec — Utility Pages

> Scope: 5 utility pages (Login, Settings, About, Errors, Share). Each has different ergonomic concerns:
> Login is OAuth-only (no form fields today), Settings is a long-scrolling preferences list,
> Share is a public no-chrome page, About is static, Errors is a rare/diagnostic state.
> All sizing/tokens reference `DESIGN.md`. No code is written here — only direction.

## 1. Files in scope

| Path | Lines | Role |
|---|---:|---|
| `src/app/(auth)/login/page.tsx` | 179 | Google OAuth-only login screen, brutalist split layout |
| `src/app/(auth)/layout.tsx` | 3 | Auth-section shell (just `bg-background`, no top bar) |
| `src/app/(main)/settings/page.tsx` | 198 | User preferences (playback, account, cache) |
| `src/app/(main)/about/page.tsx` | 94 | Version info + receipt-style credits |
| `src/app/(main)/errors/page.tsx` | 100 | Download error log table |
| `src/app/share/t/[shareId]/page.tsx` | 80 | Server entry, fetch + metadata for share |
| `src/app/share/t/[shareId]/SharePlayer.tsx` | 351 | Public player UI (no app chrome) |
| `src/app/share/t/[shareId]/opengraph-image.tsx` | 306 | OG image generator (already implemented) |
| `src/components/audio/AudioCacheManager.tsx` | 147 | Cache control widget consumed by Settings |

Total in scope: 1,458 LOC.

## 2. Mobile audit summary (cross-page)

### Login — `(auth)/login/page.tsx`

- **L51** `grid min-h-screen lg:grid-cols-2` uses `min-h-screen` not `min-h-dvh` → mobile chrome bar shrinks the viewport mid-scroll. **Fix:** `min-h-dvh`.
- **L51** Mobile collapses to a single right-column padded `px-6 py-12 sm:px-10 lg:px-16`. The decorative left collage (`hidden ... lg:flex`) is desktop-only — good. But the form column is missing a logo + brand block sized for narrow phones; the existing one (L108–L111) works but has no version info or tagline.
- **L106** Form column uses `justify-center` over `min-h-screen` parent → on a 360×640 device the full content (heading + 5-line intro + 2 buttons + disclaimer) is ~520px. With justify-center it ends up clipped on devices where keyboard takes ~50% (when local-auth lands). Switch to `pt-12 pb-8` and rely on natural scroll.
- **L113** `max-w-[480px]` is fine on phones (full width). On tablets it should drop to `max-w-md` (`448px`) to avoid feeling stretched.
- **L120** Intro paragraph in ALL CAPS at `text-[14px]` is borderline. Per DESIGN §3 body default should be 14px+, but caps reduces readability. Lowercase or split into two short lines.
- **L124–141** Google button is `h-16 w-full` (64px). Per DESIGN §9 mobile primary CTA min is 48px; 64px is fine but oversized vs. spec. Keep at 56px (`h-14`) on mobile.
- **L160** "Continue as guest" button uses `h-13` → off-grid Tailwind value (`h-13` is 52px from JIT but not in default scale). Use `h-12` (48px) per DESIGN §9.
- **L143–149** Error toast appears below the button, no `role="alert"` / `aria-live="polite"` → screen readers miss the failure. Add live region.
- **L173** Corner version label is `hidden ... sm:block` → mobile loses the version info it needs (helpful for support). Move version inline above the disclaimer.
- **No form inputs exist today.** When local auth is added, every input must follow §8 (48px tall, `inputmode`, `autocomplete`, `enterkeyhint`). Spec'd in §3 below.
- **No safe-area-inset-bottom anywhere** — disclaimer + version corner can be hidden by the iOS Safari home indicator. Wrap the bottom region in `pb-[env(safe-area-inset-bottom)]`.

### Settings — `(main)/settings/page.tsx`

- **L13** Section header uses `text-[10px]` mono with `border-b-[2px]` — this falls below the 9px floor only barely. OK.
- **L33** `SettingRow` is a single horizontal flex row: `flex items-center gap-5 px-4 py-3.5`. Label + control on the same row. On 360px, the row is fine for toggles (44px wide) but the `PillGroup` (CROSSFADE) at L76–96 is 6 pills × `px-3 py-1.5` ≈ 240px wide — collides with the long label "CROSSFADE" + hint. **Fix:** stack `<label>` above `<control>` on `<sm` (`flex-col items-start sm:flex-row sm:items-center`).
- **L46–61** `BrutalToggle` is `w-11 h-6` (44×24). Per DESIGN §5 icon-only/touch min is 44×44. The track is 44px wide but only 24px tall → fails mobile touch baseline. Bump to `h-7` (28px) on mobile and add `before:` invisible pseudo-element to extend hit zone to 44×44 without changing visual size.
- **L65–96** `PillGroup` pill height is `py-1.5` ≈ 28px. Below 44×44 touch baseline. Bump to `py-2.5` (≈ 36–40px) on mobile and `py-1.5` desktop.
- **L84** Pills overlap borders via `-ml-[2px]` — on tap, focus rings clip into the next pill. Add `focus-visible:z-10` so the focused pill always renders on top.
- **No section is collapsible.** With 3 groups today and 5+ planned (Account, Audio, Downloads, Storage, Streaming, Lyrics, Stems, Notifications, Advanced) the page becomes a long scroll on mobile. **Fix:** wrap each `SettingsGroup` in a `<details>` with the brutal header as `<summary>`. Keep first group open by default.
- **No save button anywhere** — the page already auto-saves through Zustand stores + `useUserPreferences` hook. Good. **But** there's no saved-state indicator. Add a `SAVED · 14:32` mono label below the title that updates on any preference change (debounced).
- **L112** `mx-auto max-w-2xl` — content max-width is 672px. Page shell already enforces `max-w-6xl`. Keep `max-w-2xl` for form readability.
- **L184–190** "CACHE" group has manual border markup duplicating `SettingsGroup`. Refactor to use the shared component (out of scope of this spec but called out for consistency).
- **No destructive section.** Logout / clear cache live in different places (logout is in topbar dropdown, clear cache inside `AudioCacheManager`). Mobile users expect a "Danger zone" at the bottom — group these in a dedicated red brutal frame.

### About — `(main)/about/page.tsx`

- **L9** `max-w-2xl mx-auto` → 672px on desktop. OK.
- **L16** Logo block is `h-16 w-16` with `text-2xl` "D" — works on mobile.
- **L37, L46, L55** Three near-identical version rows duplicate the SettingRow pattern from `settings/page.tsx`. Extract as a shared `<DetailRow>` to avoid drift.
- **L67** Receipt-style credits use `border-[2px] sm:border-[3px]` and a custom off-white bg `#fffdf6` — not in `globals.css` tokens. **Token violation per DESIGN §2:** "Never invent a new color." Replace with `bg-card` or `bg-background` for consistency.
- **No tech-stack pill list** today (just the 4-row receipt). DESIGN spec for About says "Tech stack (mono pill list)" — add a row of pills (Next.js, React, Prisma, Tailwind, lucide, BullMQ, Demucs, S3) for skim-readable inventory.
- **No links to GitHub / issues / changelog / license.** This is the natural place for them.
- **No keyboard-shortcuts table.** DESIGN §12 says "Document in About page; don't surface mid-flow." → add a table.
- **No "What is this?" section.** Public-facing app, but only branding + credits. Add a 2-paragraph intro for first-timers.
- **L11–28** Page header uses `mb-10` with logo + h1 stacking via `flex items-end gap-5 flex-wrap` — works on phones but `flex-wrap` makes the version label slot below the title awkwardly. Constrain to a single column on mobile (`flex-col items-start sm:flex-row sm:items-end`).

### Errors — `(main)/errors/page.tsx`

- **L10** `max-w-3xl mx-auto` is wider than Settings/About (768px vs 672px). Inconsistent. Use `max-w-2xl` to match the rest.
- **L60** Errors table is a 3-column grid: `grid-cols-[28px_1fr_auto]`. On 360px viewport the `auto` (CODE column) takes 60–80px because the badge is `border-[2px]` + `px-2 py-1` + ~6 char errid. Total: 28 + 12 + 1fr + 12 + ~70 = ~120px taken from 360 → message column gets ~240px. Tight but workable. The bigger issue: long error messages (multi-line) wrap inside the 1fr column and the row keeps the grid baseline at the top — codes float at the top right while message wraps below. Use `items-start` (already there) — OK.
- **L72** `tabular-nums` row index works.
- **L86–93** Code badge is the only visual marker of severity. On mobile it's small (10px font, 2-3 chars). Consider making the entire row hit-area open a sheet with full error details (stacktrace if available, retry button, source URL, timestamp). Currently the row is read-only — no action.
- **No retry action per row** — user has to clear all and re-trigger downloads manually. Add a per-row `RETRY` icon button (right side).
- **L50–58** Empty state uses `∅` glyph + "NO ERRORS" — clean, brutal, on-spec. Keep.
- **L37–46** "SOURCE" card duplicates the `<DetailRow>` pattern — refactor.
- **No filter/search across many errors.** If 50+ errors stack up the user has no way to find one. Add a search input + status filter (mostly out of scope but flag as gap).
- **No `role="region" aria-label="Error log"`** — screen readers see a generic table. Add ARIA.
- **No timestamp** on errors. If `error.timestamp` exists in the store, surface it (mono, right-aligned in row).

### Share — `share/t/[shareId]/SharePlayer.tsx`

- **L168** Header uses `border-b-[2px] sm:border-b-[3px]` — matches DESIGN §6 borders. ✓
- **L168** `sticky top-0 z-10` — DESIGN §7 stack table has top bar at `z-30`. Bump for consistency, even though this page has no other chrome.
- **L169** Header padding `px-5 sm:px-10 py-4` → mobile gets 20px horizontal vs DESIGN §4 which says `px-3` (12px) for mobile container. Use `px-3 sm:px-6` to match the rest of the app.
- **L176–181** "OPEN IN APP" button is `px-3 py-2` mono — that's about 32–36px tall. Fails 44×44 touch baseline.
- **L185** Main container `max-w-6xl mx-auto px-5 sm:px-10 py-10 sm:py-14` — `py-10` (40px) on mobile leaves a lot of empty space below the sticky header. Use `py-6 sm:py-12` for breathing room without waste.
- **L187** Hero is `grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14`. On mobile this means: cover (square, full-width up to 420px), then info block stacked. Hero feels OK, but cover at `max-w-[420px]` is too big on a 360px viewport (will be 360 minus padding = ~320 wide). The spec calls for ~85vw cover hero. Use `max-w-[85vw] md:max-w-[420px]`.
- **L189** Cover wrapper has rotation sticker (L194–199, "SHARED WITH YOU"). On 360px, the `-top-4 -right-4` overflow + `transform: rotate(4deg)` clips into the header. Either reduce sticker to `-top-2 -right-2` on mobile or move it inline below the cover.
- **L195** Sticker shadow is `shadow-[4px_4px_0_var(--foreground)]` — inline style with token interpolation. On mobile the spec calls for `--shadow-brutal` (3px on mobile). Use the named utility instead.
- **L222–229** "PLAY" button is `px-5 py-3` ≈ 44px tall. Borderline OK. The spec asked for a **huge** play button (64px tall, full-width) on mobile. The current mini-button next to "GET IT" + "COPY LINK" creates a button salad. **Fix:** make play full-width and 64px-tall on mobile, secondary actions below in a 2-col row. Desktop keeps the inline arrangement.
- **L237–243** "COPY LINK" button has `border-2 sm:border-[3px] border-transparent` which means **no visible border on mobile** until hover (which doesn't fire on touch). It's invisible-until-tapped. Make the border always visible.
- **L253–294** Waveform card. Tap on a bar seeks → good. Bars `h-14 flex items-center gap-[2px]` and 80 bars on a ~300px width = ~3.5px per bar. On mobile that's tap-thin. Drop to 40 bars on mobile (`useMemo` with `length: useIsMobile ? 40 : 80`). Or better: keep bars visual, expose a separate full-width invisible `<input type="range">` overlaid with `opacity-0` + larger touch target.
- **L255–262** Standalone play button inside waveform card duplicates the hero PLAY button (same handler). Confusing for users. Drop one (keep the hero one as the primary, waveform card has play+seek inline).
- **L297–318** Stats strip 4-up: `grid-cols-2 sm:grid-cols-4`. On mobile it stacks 2x2. Each cell `p-5` with `text-2xl` value. On 360px, "DURATION" cell can be ≈ 170px wide; FLAC/PUBLIC/— values fit but if duration is e.g. "12:34" it's fine. OK.
- **L297–318** Borders use ad-hoc `border-l-2 border-r-2` per index → fragile and not token-driven. Refactor to a single 4-cell grid with consistent `border-2`.
- **L321–342** Massive CTA card uses `shadow-[8px_8px_0_var(--primary)]` → custom shadow offset, not in DESIGN §6 table. Per DESIGN §6 "Do not invent new shadow offsets." Use `--shadow-brutal-hover` (4-6px). Or, if a hero shadow is wanted, propose adding a `--shadow-brutal-xl` token.
- **L344–347** Footer says "DEEMIX.APP / SHARED / {shareId}" — `{shareId}` slice is 8 chars uppercase. Mono label. OK.
- **OG image**: `opengraph-image.tsx` exists and is well-built (1200×630, brutal styling, fetches Space Grotesk, includes cover, title, artist, "Shared by"). ✓ no gap. One nit: the font fetch happens on every OG render — cache hint via `export const revalidate = 86400` could help if pages.
- **No "TRY DEEMIX" CTA in the top bar.** Existing "OPEN IN APP" works as the equivalent but copy is weaker. Stronger CTA copy: "GET DEEMIX →" (matches the bottom CTA).

## 3. Login page — `/login`

### Layout (<md, mobile)

```
┌──────────────────────────────┐  ← min-h-dvh, bg-background
│  [■]  DEEMIX           v0.1  │  ← brutal mini-bar (no border-b — auth has no top bar)
│                              │     `pt-6 px-3` w/ logo + version-mono
├──────────────────────────────┤
│                              │
│  STEP 01 / 01 · CONNECT       │  ← mono eyebrow
│                              │
│  LOG IN.                     │  ← text-brutal-xl
│                              │
│  Sign in to sync playlists,  │  ← body-md, max 44ch
│  history, and preferences.    │
│                              │
│  ┌────────────────────────┐  │
│  │ G  CONTINUE WITH       │  │  ← h-14 (56px), full width
│  │    GOOGLE          →   │  │     bg-primary
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ ⚠ ERROR MESSAGE        │  │  ← live region (only on error)
│  └────────────────────────┘  │
│                              │
│  ────  OR  ─────             │  ← mono divider
│                              │
│  ┌────────────────────────┐  │
│  │  CONTINUE AS GUEST     │  │  ← h-12 (48px), full width
│  └────────────────────────┘  │     variant="outline"
│                              │
│  By continuing you agree     │  ← mono small, max 48ch
│  this is a self-hosted tool. │
│  Respect artist rights.      │
│                              │
│  v0.1.0 · AUTH · APR 2026    │  ← mono footer pinned to safe-area
└──────────────────────────────┘  ← pb-[env(safe-area-inset-bottom)]
```

**Key rules:**
- Full viewport height with `min-h-dvh` (NOT `min-h-screen`).
- No bottom nav (this route isn't in `(main)`). MiniPlayer not present.
- Logo top, mono tagline below at `mb-3`.
- Primary CTA is full-width 56px; secondary is 48px.
- "OR" divider has `tracking-[0.2em]` — already on-spec.
- Form column `max-w-sm` (384px) on mobile, `max-w-md` on desktop. Currently uses `max-w-[480px]` — too wide.
- No padding on hero `<svg>` — let it sit at full edge.

### Layout (≥md, desktop)

- 2-column grid kept (`lg:grid-cols-2`).
- Left collage panel (already brutal: huge "OWN YOUR LIBRARY." headline, 5 feature pills, repeating DEEMIX bg).
- Right column: same login card, centered, `max-w-md` (448px).

### Concrete changes (file:line)

| Line | Issue | Change |
|---|---|---|
| L51 | `min-h-screen` | `min-h-dvh` |
| L106 | `justify-center` + min-h-screen ancestor | `pt-10 pb-[env(safe-area-inset-bottom)+24px]` |
| L113 | `max-w-[480px]` | `max-w-sm md:max-w-md` |
| L120 | All-caps body intro | Lowercase, split into 2 lines max |
| L128 | `h-16 w-full` | `h-14 w-full` (56px) |
| L143 | Error block | Add `role="alert" aria-live="polite"` |
| L160 | `h-13 w-full` (off-scale) | `h-12 w-full` |
| L173 | Version `hidden ... sm:block` | Move version inline as a text line in the disclaimer (no absolute positioning) |
| (footer) | No safe-area | Wrap in `pb-[env(safe-area-inset-bottom)]` |

### Future-proofing (when local auth lands)

```
EMAIL                              ← uppercase mono label (above)
┌────────────────────────────┐
│ devpremium@wasiasup.com    │     ← inputmode="email" autocomplete="email"
└────────────────────────────┘     ← enterkeyhint="next" h-12

PASSWORD                           ← mono label
┌────────────────────────────┐
│ ••••••••                ◉ │     ← autocomplete="current-password"
└────────────────────────────┘     ← enterkeyhint="done" h-12

[FORGOT PASSWORD?]                  ← right-aligned link below

┌────────────────────────────┐
│         SIGN IN            │     ← h-12, full-width primary
└────────────────────────────┘

────  OR  ─────

[Google button as above]
```

## 4. Settings page — `/settings`

### Layout (<md, mobile)

```
┌──────────────────────────────┐
│   TOP BAR (z-30, h-16)       │  ← from (main)/layout.tsx
├──────────────────────────────┤
│  SETTINGS · V0.1.0           │  ← mono eyebrow
│  CONFIG.                     │  ← text-brutal-xl
│  SAVED · 14:32               │  ← mono saved indicator (auto)
│                              │
│  ┌──────────────────────┐   │
│  │ PLAYBACK         ▼   │   │  ← <details open> brutal frame
│  ├──────────────────────┤   │
│  │ VOLUME NORMALIZATION │   │  ← row 1 (label above on <sm)
│  │ Auto-adjust track... │   │     hint
│  │              [ON]    │   │     toggle (28px tall mobile)
│  ├──────────────────────┤   │
│  │ PRE-CACHE SAVED      │   │
│  │ Saving a track...    │   │
│  │              [OFF]   │   │
│  ├──────────────────────┤   │
│  │ CROSSFADE            │   │
│  │ Disabled — sharp...  │   │
│  │ ┌──┬──┬──┬──┬──┬──┐ │   │  ← PillGroup
│  │ │OFF│2s│4s│6s│8s│10s│ │   │     stacked under hint on mobile
│  │ └──┴──┴──┴──┴──┴──┘ │   │     each pill h-10 (40px) mobile
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ ACCOUNT           ▶  │   │  ← <details> collapsed by default
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ CACHE             ▶  │   │
│  └──────────────────────┘   │
│                              │
│  ────────────────────────    │
│  DANGER ZONE                  │  ← red brutal frame
│  ┌──────────────────────┐   │
│  │ ⚠ Logout              │   │
│  │   Sign out of...      │   │
│  │              [LOGOUT] │   │
│  ├──────────────────────┤   │
│  │ ⚠ Clear all cache     │   │
│  │   Free disk space.    │   │
│  │              [CLEAR]  │   │
│  └──────────────────────┘   │
│                              │
│  DEEMIX-NEXT · v0.1.0        │  ← footer mono
│                              │
└──────────────────────────────┘
   pb-32 (clears MiniPlayer + bottom nav)
```

**Key rules:**
- Each `SettingsGroup` becomes `<details>` with brutal header as `<summary>`. Chevron rotates 90deg when open (`group-open:rotate-90`).
- Open the first group (PLAYBACK) by default. All others collapsed.
- Each `SettingRow` stacks label-above-control on `<sm`, side-by-side on `sm:`. Use `flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5`.
- `BrutalToggle`: bump to `h-7` (28px) on mobile, keep `h-6` desktop. Wrap with `before:absolute before:inset-[-8px] before:content-['']` to extend hit zone to ≥44×44.
- `PillGroup`: pills `h-10 sm:h-9` (40 mobile / 36 desktop), `text-[12px]` instead of `text-[11px]` on mobile.
- **Auto-save (already de facto via Zustand+`useUserPreferences`)** — make it explicit with a "SAVED · HH:MM" mono label below the title that updates on each preference change (debounced 600ms). When saving in flight: "SAVING…" pulse.
- **No sticky save button.** Confirms the "auto-save vs explicit save" tradeoff in §12.
- **Danger zone** at the bottom in a red brutal frame: `border-destructive bg-destructive/5`. Each row has a destructive button right-aligned.

### Layout (≥md)

- Same stacked layout, capped at `max-w-2xl` (currently). Don't add a sidebar nav — the page is short enough that anchor links are unnecessary unless we end up with 8+ groups.
- If 8+ groups: add a sticky-right table of contents (mono, anchor links, `lg:` only).

### Concrete changes (file:line)

| Line | Issue | Change |
|---|---|---|
| L10 | `SettingsGroup` returns plain `<section>` | Wrap content in `<details open>` for the first group, `<details>` for others. Move `<div title>` block into a `<summary>`. |
| L16 | `divide-y-[1px] divide-foreground/15` | Keep but bump divider to `divide-foreground/20` for mobile contrast. |
| L33 | `flex items-center gap-5 px-4 py-3.5` | `flex flex-col items-start gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-5` |
| L51 | `w-11 h-6 border-[2px]` | `w-11 h-7 sm:h-6 border-[2px]` + `before:absolute before:inset-[-8px] before:content-['']` for hit zone |
| L83 | `px-3 py-1.5 ... text-[11px]` | `px-3 py-2.5 sm:py-1.5 text-[12px] sm:text-[11px]` (40px mobile / 36px desktop) |
| L84 | `-ml-[2px]` causes z-clipping on focus | Add `focus-visible:z-10 relative` |
| L99 | New: saved indicator | Add `<p className="text-[10px] font-mono text-muted-foreground mt-2">SAVED · HH:MM</p>` |
| L184–190 | Manual `CACHE` group bypasses `SettingsGroup` | Refactor to use `SettingsGroup title="CACHE"` |
| (new) | No danger zone | Append a `<section className="border-destructive ...">` with logout + clear-cache rows. Both wired to existing handlers. |
| L112 | `mx-auto max-w-2xl` | Add `pb-32 sm:pb-12` to clear MiniPlayer + bottom nav on mobile |

### ASCII wireframe (already above)

## 5. About page — `/about`

### Layout (<md, mobile)

```
┌──────────────────────────────┐
│   TOP BAR (z-30)             │
├──────────────────────────────┤
│  ABOUT · DEEMIX              │  ← mono eyebrow
│  ┌─┐                         │
│  │D│  DEEMIX NEXT.           │  ← logo + h1 stacked on mobile
│  └─┘                         │
│  Self-hosted music...         │
│                              │
│  ┌──────────────────────┐   │
│  │ WHAT IS THIS?        │   │  ← brutal-card
│  ├──────────────────────┤   │
│  │ DEEMIX is a self-     │   │
│  │ hosted music...       │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ TECH STACK           │   │
│  ├──────────────────────┤   │
│  │ [NEXT.JS 16] [REACT 19]│  │  ← mono pills, wrapping
│  │ [PRISMA 7] [POSTGRES] │   │
│  │ [TAILWIND 4] [BULLMQ] │   │
│  │ [DEMUCS] [S3]         │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ VERSION              │   │
│  ├──────────────────────┤   │
│  │ Current build  0.1.0 │   │
│  │ Latest         0.1.0 │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ KEYBOARD SHORTCUTS   │   │
│  ├──────────────────────┤   │
│  │ Space     Play/pause │   │
│  │ ←/→       Seek       │   │
│  │ ↑/↓       Volume     │   │
│  │ J/L       ±10s       │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ OPEN SOURCE          │   │
│  ├──────────────────────┤   │
│  │ → GITHUB             │   │
│  │ → ISSUES             │   │
│  │ → CHANGELOG          │   │
│  │ → LICENSE (MIT)      │   │
│  └──────────────────────┘   │
│                              │
│  [Receipt-style credits      │  ← keep current L67–91
│   block — already on-spec]   │
│                              │
└──────────────────────────────┘
   pb-32
```

### Layout (≥md)

- Centered `max-w-2xl mx-auto` (currently `max-w-2xl` — keep).
- All sections stacked, no sidebar.

### Concrete changes (file:line)

| Line | Issue | Change |
|---|---|---|
| L9 | `max-w-2xl mx-auto` | Keep, but add `pb-32 sm:pb-12` |
| L15 | `flex items-end gap-5 flex-wrap` | `flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-5` |
| L67 | `bg-[#fffdf6]` (token violation) | `bg-card` or `bg-background` per DESIGN §2 |
| (new) | No "What is this?" intro | Add brutal card before VERSION section |
| (new) | No tech-stack pill list | Add `TECH STACK` group with mono pills |
| (new) | No keyboard shortcuts table | Add (DESIGN §12 mandates About is the place) |
| (new) | No OSS links section | Add: GitHub, Issues, Changelog, License |
| L37,L46,L55 | Three near-identical version rows | Extract `<DetailRow>` shared component (cross-page refactor) |

## 6. Errors page — `/errors`

### Layout (any size)

```
┌──────────────────────────────┐
│   TOP BAR (z-30)             │
├──────────────────────────────┤
│  ERROR LOG · DOWNLOADS       │  ← mono eyebrow
│  ERRORS.                     │  ← text-brutal-xl
│  3 failed transactions...    │
│                  [CLEAR ALL] │  ← destructive button (only when errors > 0)
│                              │
│  ┌──────────────────────┐   │
│  │ SOURCE               │   │  ← only if downloadInfo
│  │ Album title          │   │
│  │ Artist · 12 tracks   │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ # MESSAGE      CODE  │   │  ← header row (foreground bg)
│  ├──────────────────────┤   │
│  │ 01 Track not found    │   │
│  │    Artist · ID 1234  │   │
│  │                  E12 │   │  ← code badge
│  │              [RETRY] │   │  ← per-row retry icon (NEW)
│  ├──────────────────────┤   │
│  │ 02 Decryption failed  │   │
│  │    Artist · ID 5678  │   │
│  │                  E07 │   │
│  │              [RETRY] │   │
│  └──────────────────────┘   │
│                              │
│  -- or empty state --        │
│                              │
│  ┌──────────────────────┐   │
│  │       ∅              │   │
│  │     NO ERRORS         │   │  ← brutal-card, py-20
│  │  All downloads...     │   │
│  └──────────────────────┘   │
│                              │
└──────────────────────────────┘
   pb-32 mobile, max-w-2xl tablet+
```

**Key rules:**
- Match Settings/About width: drop from `max-w-3xl` to `max-w-2xl`.
- Add `role="region" aria-label="Download error log"` on the list wrapper.
- Each row: tap (mobile) or click (desktop) opens a bottom sheet (`Sheet side="bottom"`) with full error details: stack, source URL, timestamp, retry button. The current grid layout is read-only — turn rows into buttons.
- Per-row retry icon (right side, `RotateCw` from lucide, 36×36 desktop / 44×44 mobile, `aria-label="Retry"`).
- Empty state already on-spec — don't change.

### Concrete changes (file:line)

| Line | Issue | Change |
|---|---|---|
| L10 | `max-w-3xl mx-auto` | `max-w-2xl mx-auto pb-32 sm:pb-12` |
| L37 | "SOURCE" card duplicates a `<DetailRow>` | Extract shared component |
| L60 | `<div className="border-... divide-y-[2px]">` | Wrap in `<section role="region" aria-label="Download error log">` |
| L67 | `<div key={idx}>` row with no action | Convert to `<button type="button" onClick={openDetailSheet}>` with full row click target |
| L86 | Code badge | Add per-row retry button to the right (new column in the grid) |
| (new) | No detail sheet | Add `<Sheet side="bottom">` with full error info — uses existing `Sheet` primitive |
| L72 | Index column at `mt-0.5` | Use `items-start` (already there) — OK |
| (new) | No timestamp | Surface `error.timestamp` if present in the store — mono text below the message |

## 7. Share page — `/share/t/[shareId]`

### Special: PUBLIC page, no main app chrome

- Lives in `app/share/` not `app/(main)/`. No sidebar, no bottom nav, no MiniPlayer of the user's session.
- Has its own minimal sticky top bar (currently L168–183).
- Should NOT inherit `(main)/layout.tsx`. It does NOT — it's at root `app/share/t/...` so it gets the root layout only. ✓ already correct.

### Layout (<md, mobile)

```
┌──────────────────────────────┐  ← sticky, border-b-[2px], z-30
│  [■] DEEMIX        [TRY IT→]  │  ← `PublicTopBar` (px-3 py-3, h-14)
├──────────────────────────────┤
│  TRACK · FLAC · 4:23         │  ← mono eyebrow
│                              │
│  ┌────────────────┐          │
│  │                │          │
│  │  COVER (85vw,   │          │  ← max-w-[85vw], aspect-square
│  │   max 360px)    │          │     border-[3px] shadow-brutal
│  │                │ [SHARED] │  ← sticker bottom-right (smaller)
│  └────────────────┘          │
│                              │
│  Track Title.                │  ← text-brutal-lg
│  BY ARTIST                   │  ← text-lg bold
│  FROM ALBUM Album            │  ← mono small
│                              │
│  ┌──────────────────────┐   │
│  │  ▶  PLAY              │   │  ← h-16 (64px) full-width
│  └──────────────────────┘   │     primary brutal
│                              │
│  ◉━━━━━━━━━━━━━━━━━━━━━━  │  ← seek (waveform underneath)
│  0:42 / 4:23                 │  ← mono time
│                              │
│  ┌──────────┬──────────┐    │
│  │ GET IT   │ COPY LINK │   │  ← 2-col secondary actions
│  └──────────┴──────────┘    │     h-12 each
│                              │
│  ← SHARED BY @username        │  ← mono caption
│                              │
│  ┌────┬────┬────┬────┐      │
│  │FRMT│DUR │YEAR│SHRD│      │  ← stats 4-up (already 2x2 mobile)
│  │FLAC│4:23│ — │PUB │      │
│  └────┴────┴────┴────┘      │
│                              │
│  ┌──────────────────────┐   │
│  │ DOWNLOAD YOUR        │   │
│  │ LIBRARY.             │   │  ← massive CTA
│  │ deemix is...         │   │
│  │                      │   │
│  │      [GET DEEMIX →]  │   │  ← full-width on mobile, 56px
│  └──────────────────────┘   │
│                              │
│  DEEMIX.APP / SHARED / ABCD  │  ← mono footer
└──────────────────────────────┘
   pb-[env(safe-area-inset-bottom)+24px]
```

### Layout (≥md)

- 2-col hero (cover + info side-by-side, `grid-cols-2 gap-10` — already there).
- Cover `max-w-[420px]`, info column max content width.
- Page max `max-w-xl mx-auto` for tablets, can stretch to `max-w-2xl` on `lg:`.
- Currently uses `max-w-6xl` — too wide for what is essentially a single-track marketing page.
- Massive CTA stays as 2-col grid (text + button). Button can be inline (not full-width).

### OG image

✓ Already implemented at `share/t/[shareId]/opengraph-image.tsx`. Brutal style, 1200×630, includes cover, title, artist, "Shared by". No gap. Optional improvements:
- Add `export const revalidate = 86400` to cache the image for a day (font fetch is the slow part).
- Consider Twitter/X-specific `summary_large_image` works — already declared in `metadata.twitter.card`.

### Concrete changes (file:line)

| Line | Issue | Change |
|---|---|---|
| L166 | `min-h-screen` | `min-h-dvh` |
| L168 | `sticky top-0 z-10` | `sticky top-0 z-30` (DESIGN §7) |
| L169 | `px-5 sm:px-10` | `px-3 sm:px-6 lg:px-8` (match DESIGN §4) |
| L176–181 | "OPEN IN APP" `px-3 py-2` (≈36px tall) | "GET DEEMIX →" `h-11` mobile / `h-9` desktop, stronger CTA copy |
| L185 | `max-w-6xl` | `max-w-xl mx-auto lg:max-w-2xl` (single track, narrower) |
| L185 | `px-5 sm:px-10 py-10 sm:py-14` | `px-3 sm:px-6 py-6 sm:py-12` |
| L189 | `max-w-[420px] mx-auto md:mx-0` | `max-w-[85vw] mx-auto md:max-w-[420px] md:mx-0` |
| L194–199 | Sticker overlap clips into header on small phones | Reduce to `-top-2 -right-2` or move below cover on `<sm` |
| L195 | `shadow-[4px_4px_0_var(--foreground)]` ad-hoc | Use `var(--shadow-brutal)` token |
| L222–229 | "PLAY" button at `px-5 py-3` is small | Make full-width, `h-16 w-full sm:h-12 sm:w-auto` mobile-first |
| L237–243 | "COPY LINK" border transparent until hover | Always-visible border; `border-2 border-foreground` |
| L253–294 | Waveform seek at 80 bars (touch-thin on mobile) | 40 bars on mobile, 80 on `sm:`; OR overlay an invisible `<input type="range">` for accurate touch |
| L255–262 | Standalone play in waveform card duplicates hero PLAY | Drop the standalone (waveform card has play+seek inline) OR drop the hero PLAY (keep waveform's). Pick the hero one — bigger, more thumb-friendly. |
| L297–318 | Stats strip ad-hoc per-cell borders | Use a single grid + `border-2 [&>*]:border-r-2 [&>*:last-child]:border-r-0` pattern |
| L321–342 | Massive CTA `shadow-[8px_8px_0_var(--primary)]` (off-token) | Use `var(--shadow-brutal-hover)` (4-6px) or propose new `--shadow-brutal-xl` token |
| L335–340 | "GET DEEMIX →" inline button | Full-width on mobile (`w-full md:w-auto`), 56px tall mobile |
| (footer) | No safe-area | Wrap outer `<div>` with `pb-[env(safe-area-inset-bottom)]` |

### ASCII wireframe (already above)

## 8. Form input patterns (cross-page)

Once local auth ships and Settings grows form fields, every input in the utility pages must follow:

| Attribute | Value | Why |
|---|---|---|
| Height (mobile) | `h-12` (48px) | DESIGN §9 |
| Height (desktop) | `h-9` (36px) | DESIGN §9 |
| Border | `.brutal-input` (2px mobile, 3px sm) | DESIGN §6 |
| Focus | `focus-visible:ring-2 ring-ring ring-offset-2` | DESIGN §12 |
| Label | Always visible above input. Mono uppercase, `text-[10px] tracking-[0.14em]`. Never placeholder-only. | DESIGN §12 |
| Error | Red mono below input + AlertCircle icon. `aria-describedby` link from input → error span. | A11y |
| `inputmode` | `email` for email, `numeric` for OTP/integer, `decimal` for prices, `tel` for phone, `search` for search. | Mobile keyboard quality |
| `autocomplete` | `email`, `current-password`, `new-password`, `one-time-code`, `off` as appropriate. | Browser/keychain UX |
| `enterkeyhint` | `next` between fields, `done` on last field, `go`/`send` for submit, `search` for search. | Mobile keyboard label |
| Floating labels | Forbidden — clashes with brutal style. Always static-above. | Visual consistency |
| Password show/hide | Eye icon button inside input, 36×36 hit zone padded to 44×44 on mobile, `aria-pressed`. | Touch + a11y |

Cross-page audit: today only Login has a button, no inputs. Settings has no text inputs (toggles + pills + cache widget). About is read-only. Errors is read-only. Share has no inputs.

**The pattern matters when:**
- Local auth lands (email + password on Login).
- "Custom S3 endpoint" lands (Settings → Storage section).
- Search input on `/search` (out of scope here — covered in `02-` spec).

## 9. Components to create (NEW)

| Component | Used by | Job |
|---|---|---|
| `<CollapsibleSection title>` | Settings, About | Brutal-frame `<details>` with `<summary>` header + chevron, `group-open:rotate-90`. Replaces the bare `SettingsGroup` in `settings/page.tsx`. |
| `<DetailRow label hint right>` | Settings, About, Errors | The 3-column `label / hint / right-slot` row used in 4 places today (3 of them duplicated). One source of truth. |
| `<BrutalFormField label hint error>` | Future Login, Settings | Wraps `<label> + <input> + <error>`. Auto-wires `aria-describedby`. |
| `<PublicTopBar cta>` | Share | Minimal sticky top bar with logo + single CTA button. No nav, no avatar. Used by `/share/...` and any future public pages (e.g. `/embed/...`). |
| `<ShareCTA href>` | Share | "Get the full app" call-to-action card (currently inlined L321–342). Also useful for embed/widget pages. |
| `<DangerZone>` | Settings | Red brutal frame at the bottom of pages with destructive actions. |
| `<KeyboardShortcutsTable>` | About | Tabular `<kbd>` + description rows. Reads from a static map. |
| `<ErrorDetailSheet error>` | Errors | Bottom sheet with full stacktrace, source URL, timestamp, retry button. Uses existing `Sheet` primitive. |

## 10. Implementation order

Order by impact-per-effort. Each step is independently shippable.

1. **Login `min-h-dvh` + safe-area + button heights** (15 min) — surfaces correctly on iOS Safari today.
2. **Settings: collapsible groups + label-above-control on mobile** (1.5h) — biggest mobile UX win.
3. **Settings: extract `<DetailRow>` and `<CollapsibleSection>` shared components** (1h) — refactor for reuse before more pages duplicate the markup.
4. **Settings: bump `BrutalToggle` and `PillGroup` to 44×44 hit zones** (30 min).
5. **Settings: add `DangerZone` (logout + clear-cache)** (1h).
6. **Share: hero CTA + waveform seek touch fixes + sticker repositioning** (1.5h).
7. **Share: drop second play button, refactor stats strip to token grid** (45 min).
8. **About: add "What is this?", tech stack pills, OSS links, keyboard shortcuts** (2h) — content-heavy.
9. **Errors: drop to `max-w-2xl`, ARIA region, per-row retry icon** (1h).
10. **Errors: detail sheet on row tap** (2h).
11. **Login: live-region error, version inlined, intro copy** (30 min).
12. **Cross-page: replace `bg-[#fffdf6]` and `shadow-[8px_8px_0_var(--primary)]` token violations** (15 min).

## 11. Effort estimate

| Page | Size | Notes |
|---|---|---|
| Login | **S** | Layout corrections only; no form fields yet. |
| Settings | **L** | Collapsible groups + danger zone + shared components + saved indicator. Most content. |
| About | **M** | Add 4 new sections (intro, tech stack, OSS, shortcuts). Mostly content + token cleanup. |
| Errors | **M** | Detail sheet is the bulk; everything else is light. |
| Share | **M** | Hero/CTA/waveform reflow; OG image already done. |

Total: **S + L + M + M + M ≈ 1–1.5 dev-weeks** including review and Playwright/Vitest coverage where the locked-in surface bumps into these (notably `useUserPreferences` already covered).

## 12. Risks & open questions

1. **Settings auto-save vs explicit save** — Recommend auto-save (already de facto via Zustand stores). Risk: users don't know "it saved." Mitigation: visible "SAVED · HH:MM" indicator that updates on each store change. Open question: should Account section (e.g. linking Deezer) require explicit confirmation? **Yes** — those are not in `useUserPreferences`, they're in `useAuthStore` and have side effects. Add a "LINK ACCOUNT" CTA there, not auto-save.

2. **Share page widget mode** — Today the share page is full-page. A common ask is `<iframe>`-embeddable. Out of scope here, but spec'd `<PublicTopBar>` + `<ShareCTA>` so the same components can be re-used in a `/embed/t/[shareId]` route later.

3. **OG image revalidation** — `opengraph-image.tsx` currently fetches the Space Grotesk font on every render. Adding `export const revalidate = 86400` would help, but the cover URL is per-track so caching is per-shareId already. Verify in production logs that this isn't a bottleneck before shipping.

4. **Errors detail sheet retry semantics** — When user taps RETRY, should it re-add the failed track to the queue and clear the error from the log? Or queue it without clearing (so they can see it once succeeded)? Recommend: queue + remove from log, with a toast "Re-queued." Confirms in the existing download panel.

5. **Login local auth** — Spec'd above as a future addition. Current implementation is Google-OAuth-only. If local auth lands, the keyboard handling, `inputmode`, `autocomplete`, `enterkeyhint` rules in §8 must apply.

6. **Token violations** — `bg-[#fffdf6]` in About L67 and `shadow-[8px_8px_0_var(--primary)]` in Share L321 violate DESIGN §2 / §6. Either fix to existing tokens or formally propose new tokens (e.g. `--paper-bg` for receipt warmth, `--shadow-brutal-xl` for hero CTAs) to `globals.css`. Recommend fixing first, deferring new tokens until pattern repeats elsewhere.

7. **Sticky-hover audit not yet automated** — Multiple share-page hover transforms (`hover:bg-accent`) rely on Tailwind 4's `hover:hover` gating. Spot-check on Chrome Android per release until a CI rule lands (DESIGN §6 open gap).

8. **No error boundary on `/share/t/[shareId]`** — If `audioRef.current.play()` throws (autoplay denied, network failure), the user sees no feedback. Needs an `onError` toast.

9. **`/errors` has no Prisma backing** — Errors are in-memory in `useErrorStore`. Reload = lost log. Out of scope for this audit but flag: a `DownloadError` Prisma model would make the page useful across sessions.
