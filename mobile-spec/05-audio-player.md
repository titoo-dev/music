# Mobile-First Spec — Audio Player Suite

> The audio player is the most-touched UI in the app. Every other module borrows from this surface (MiniPlayer floats above every page, FullscreenPlayer/Lyrics swallow the viewport, the action sheet is the universal track menu). Every fix here compounds.

## 1. Files in scope

| File | Lines |
|---|---|
| `src/components/audio/MiniPlayer.tsx` | 144 (preview-only mini, separate from main `Player`) |
| `src/components/audio/Player.tsx` | 436 (the real bottom-pinned player; misnamed) |
| `src/components/audio/FullscreenPlayer.tsx` | 505 |
| `src/components/audio/QueuePanel.tsx` | 331 |
| `src/components/audio/LyricsPanel.tsx` | 102 |
| `src/components/audio/LyricsImmersive.tsx` | 232 |
| `src/components/audio/SeekBar.tsx` | 185 |
| `src/components/audio/PlayButton.tsx` | 80 |
| `src/components/audio/KaraokeToggle.tsx` | 146 |
| `src/components/tracks/TrackActionSheet.tsx` | 521 |
| `src/components/tracks/TrackActionMenu.tsx` | 472 |
| **Total** | **3,154** |

> NOTE: `MiniPlayer.tsx` is the **preview** mini (30s Deezer previews — `usePreviewStore`). `Player.tsx` is the actual playback player (full tracks — `usePlayerStore`). Naming is misleading. This spec uses **MiniPlayer (preview)** vs **Player (main)** consistently and proposes renaming Player.tsx → BottomPlayer.tsx (or keep, but document).

## 2. Mobile audit (current state)

### `MiniPlayer.tsx` (preview)

- **L40 — z-index conflict**: `z-50`. DESIGN.md §7 mandates `z-45` for floating MiniPlayer so the new bottom nav (`z-50`) sits above. **Critical.**
- **L40 — bottom positioning**: `bottom-5 right-5` is hard-coded — no safe-area, no bottom-nav offset. On a Pixel 5 with the new bottom nav, this lays the MiniPlayer *behind* the bottom nav.
- **L40 — anchored right**: floating right pill of `~340px` width starts at `right-5`. On a 360px viewport the title block is squeezed to `max-w-[140px]`, artist link is unreadable. Should span `left-3 right-3` on mobile.
- **L102 — Play/Pause is `h-8 w-8` (32×32)**: fails the 44×44 touch min in DESIGN §5. Loader and SVG live inside.
- **L134 — Close button `h-6 w-6` (24×24)**: explicitly called out as a fail in DESIGN §16.
- **L40 — `gap-3` between cover/text/volume/play/close on a 360px viewport** — total content width exceeds available space when artist name is long; truncation eats the entire title.
- **L86–94 — Volume slider on mobile**: `<input type="range" w-12 h-1>` is a native bare slider. Tap target effectively 4px tall. Useless on mobile.
- **L17–27 — Long-press affordance missing**: only `onContextMenu` (right-click) opens the action sheet. On mobile there is no way to reach it from the MiniPlayer except with a real long-press handler.
- **No swipe-to-dismiss / no swipe-to-skip / no progress bar.**
- **No tap-to-expand**: tapping cover/title does nothing on the preview MiniPlayer (whereas the main Player at `Player.tsx:131` does open fullscreen).

### `Player.tsx` (main bottom-pinned player)

- **L113 — `fixed bottom-0 left-0 right-0 z-50`**: full-bleed bar pinned to bottom. On mobile the bottom-nav (z-50) will collide. Per DESIGN §7 the **mobile** primary surface should be the floating MiniPlayer pattern (this Player is desktop-pattern). Mobile and desktop are sharing one component — split required.
- **L127 — `gap-3 sm:gap-4 px-3 sm:px-5 py-3`**: 56–64px tall total. Adequate height, but the entire Controls cluster (L159–276) shows Shuffle/Prev/Play/Next/Repeat in a row that requires ~5×40px = 200px. On a 360px viewport, after the 30%-width track block + 30%-width meta block, **the controls are pinched** and the "/30%" containers (`L130 w-[30%]`, `L279 w-[30%]`) starve the center cluster.
- **L170, L260 — Shuffle/Repeat `h-7 w-7 sm:h-8 sm:w-8` (28–32px)**: under 44×44.
- **L193 — Prev `h-8 w-8` (32×32)**: under 44×44.
- **L212 — Play/Pause `h-10 w-10` (40×40)**: under DESIGN's 48×48 mobile primary CTA recommendation (§5).
- **L239 — Next `h-8 w-8` (32×32)**: under 44×44.
- **L293, L328 — Queue/Lyrics `h-7 w-7 sm:h-8 sm:w-8` (28–32px)**: under 44×44.
- **L394, L439 — Audio settings + Close `h-7 w-7` (28×28)**: way under.
- **L113 — `pb-[env(safe-area-inset-bottom)]`** is wired correctly. ✓
- **L117 — SeekBar at `-top-4`**: sits *above* the player, occupying invisible space outside the bordered region. The bar itself is `h-8 thin` (effectively a 4px tall touch zone). Tapping above the player risks tapping page content. Should be flush at top inside the player.
- **L320–334 — Lyrics toggle `hidden md:inline-flex`**: hidden on mobile, accessible only inside FullscreenPlayer. OK pattern but means lyrics not reachable from the bottom bar on mobile — relegated to one entry point only.
- **L389–429 — Crossfade dropdown `hidden md:inline-flex`**: same.
- **L337–386 — Volume slider `hidden md:flex`**: hidden on mobile. ✓ correct (volume on mobile is system-level via hardware buttons).
- **L431–453 — Close button `h-7 w-7` (28×28)**: should not exist on mobile at all. Stop is a destructive intent and is reachable from the action sheet.
- **L113 — `md:left-60`**: leaves 240px sidebar gutter. ✓ correct.
- **No long-press handler**: `onContextMenu` (L132) is right-click only.
- **No swipe-to-skip / swipe-to-expand**.

### `FullscreenPlayer.tsx`

- **L444 — `fixed inset-0 z-[60]`**: DESIGN §7 mandates `z-70` (so it stacks over sheets at z-60). Currently equal to sheets — TrackActionSheet opening from inside fullscreen will overlap unpredictably.
- **L444 — `md:hidden`**: hard mobile-only. ✓ DESIGN says this is OK as a legitimate exception — no desktop equivalent built.
- **L444 — `bg-background`**: cream `#F0EBE3`, not the brutal-immersive black we'd want for art-forward. Maybe intentional. Note for review.
- **L444 — uses `inset-0` not `h-dvh`**: works because `inset-0` is dynamic; OK for Chrome.
- **L398 — `document.body.style.overflow = "hidden"`**: imperative scroll lock. Works, but bypasses Base UI sheet primitives. Acceptable since this is a custom drag-to-dismiss overlay.
- **L447–463 — drag handle**: `h-1.5 w-12` (6px×48px), `pt-3 pb-1`, total touch area ~30px tall. Acceptable but should be the **only** drag-zone — currently the entire shell is `drag="y"` (L436) but `dragListener={false}` and only the handle calls `dragControls.start(e)`. ✓ correctly scoped.
- **L466–519 — Header**: chevron (close, L471 `h-9 w-9` = 36×36), centered label, queue + lyrics buttons (L487, L509 `h-9 w-9`). All under 44×44 on mobile.
- **L483–502 — Queue button** opens queue but **closes fullscreen first**: jarring. Should be a layered sheet on top.
- **L504–518 — Lyrics toggle**: replaces the cover/visualizer with `<LyricsDisplay compact />`. OK pattern but no swipe gesture between cover ↔ lyrics — the toggle is the only entry.
- **L102–121 — CoverCarousel**: horizontal swipe ✓ wired. Switches track on snap. Good.
- **L102 — `max-w-[340px]`**: hardcoded. On a 360px viewport with `px-4` (16px each side = 32px total) the cover is 328px. ✓ fits but tight. On a 320px iPhone SE it's 288px. Recommend `max-w-[min(340px,85vw)]`.
- **L144 — TrackInfo `px-8`**: 32px each side = 64px of gutter. On 360px viewport that's 18% wasted. Recommend `px-6`.
- **L204–273 — Controls**: Play 72×72 ✓, Prev/Next 56×56 ✓, Shuffle/Repeat 48×48 ✓. **All meet DESIGN minimums.**
- **L283 — VolumeSection**: 18-px tall slider with the same opacity overlay trick. On mobile **volume should not be in the player** (system-level). Hide on mobile.
- **L329–378 — ExtraControls**: just a single 40×40 audio-settings dropdown. Could merge into a "More" sheet.
- **L530 — visualizer `h-8`**: 32px tall, only between cover and seekbar. Wastes vertical real estate on small phones. Hide on iPhone SE-sized viewports.
- **No swipe-down on hero to dismiss** (only the drag handle works). Unintuitive — modern players let you swipe anywhere.
- **No swipe-up to enter LyricsImmersive.**
- **No long-press on hero to open TrackActionSheet** (`onContextMenu` is wired at L128 but is desktop-only).
- **No share button surfaced in the fullscreen chrome.**

### `QueuePanel.tsx`

- **L91 — `inset-x-0 bottom-[96px] top-[calc(env(safe-area-inset-top,0px)+4px)]`**: takes nearly full viewport on mobile (top to 96px from bottom). DESIGN §9 says snap to 50%/90%, never full viewport. Currently no snap, no drag-to-dismiss.
- **L92 — `border-t-[3px]`**: top edge is sharp ✓ but no drag handle. Discoverability low.
- **L90 — `z-40`**: should be `z-60` per DESIGN §7 (sheets layer).
- **L113 — Close `w-8 h-8` (32×32)**: under 44×44.
- **L302–308 — Drag handle column** (`<GripVertical className="h-4 w-4">`): 16px wide on a 16-px row. Very small touch target for reorder. Should be a 24×40 dedicated grip column.
- **L341 — Remove button `opacity-0 group-hover:opacity-100`**: hover-only on mobile = unreachable. Need **swipe-left to remove** with brutal red action revealed.
- **L301–308 — `cursor-grab`** + reorder works on touch via Motion's `Reorder.Item` (touch events handled). ✓
- **L51 — `played` slice is rendered at the bottom**: actually appears below "Up Next" in the DOM. Visually OK but no scroll-to-now-playing affordance. The "Now Playing" section is at the **top** so user has to scroll past it to see what's next — but if they've scrolled back to "Played" they have no way back to current.
- **L226 — Footer "DRAG TO REORDER"**: copy is a hint but the visual affordance is the GripVertical alone — many users won't notice.
- **L84–86 — animation**: slides from the right (desktop) / bottom (mobile). Spring damping 28 ✓.
- **No virtualization**: 200-track queue → 200 DOM nodes in `Reorder.Group`. With Motion, that's a perf cliff. List should be virtualized at >50 tracks.

### `LyricsPanel.tsx`

- **L57 — same mobile layout as QueuePanel** (full-bleed almost). Same flaws: no drag handle, no swipe-down to dismiss, `z-40` should be `z-60`.
- **L80 — Close button** same `w-8 h-8` problem.
- **L96 — `<LyricsDisplay compact />`**: not read in this audit but presumably the compact lyrics renderer. Has a "THEATRE MODE" link in the footer (L102). ✓ entry point exists.
- **No tap-to-seek hint** (each lyric line is presumably tappable to seek but no visible affordance per line).

### `LyricsImmersive.tsx`

- **L146 — `z-[80]`**: above the DESIGN-prescribed `z-71`. ✓ effectively at top of stack.
- **L67–73 — Lyric line typography**: `text-[clamp(2rem,4.5vw,2.4rem)]` for inactive, `text-[clamp(2.6rem,6vw,3.5rem)]` for active. **On 360px viewport: 360×0.045 = 16.2px** — clamp floor `2rem` = 32px. ✓ readable. Active = `2.6rem` = 41.6px ✓. Excellent baseline.
- **L67 — `opacity-55` for inactive, `opacity-[0.22]` for past, `opacity-100` for active**: ✓ good progressive blur (`blur-[1px]` … `blur-[4px]` by distance).
- **L66 — `onClick={() => handleClick(line)}`**: tap-to-seek per line. ✓
- **L162 — Top bar `py-4 sm:py-5`**: 16–20px padding. Has cover (44×44 ✓), title, time chip (`hidden sm:block`), close (L182 `w-9 h-9` = 36×36 — under mobile 44×44).
- **L189 — `top-[88px] bottom-[88px]`**: 88px top chrome + 88px bottom progress = 176px reserved, leaving the rest for lyrics. On a 640dvh viewport that's 464px of lyrics column = ~10 lines. ✓ reasonable.
- **L218 — Bottom progress bar**: 3-px tall track + 11×11 thumb (L237) `opacity-0 group-hover:opacity-100`. **Hover-only on mobile.** Touch target ~3px tall = unusable.
- **L229 — `onClick={handleSeek}`**: tap-to-seek works on touch but no drag — touch users can only jump-tap.
- **No play/pause control** in immersive mode. To pause you have to exit. Big miss.
- **No prev/next** in immersive mode.
- **No karaoke toggle** in immersive (the design promises one).
- **L107–113 — `document.body.style.overflow = "hidden"`** correctly applied.
- **No swipe-down to dismiss** — only ESC and the close button.

### `SeekBar.tsx`

- **L137 — `style={{ touchAction: "none" }}`** ✓ prevents browser-native scroll while scrubbing.
- **L135 — `h-8` thin / `h-10` large**: outer container heights 32/40px. ✓ acceptable touch row.
- **L166–169 — Visual track**: thin = `h-1` (4px) → `h-[6px]` on hover; large = `h-2.5` (10px) with border. **Mobile thin variant is 4px visual** — DESIGN spec calls for 12px track. The 32px container fakes a tap area but the visual cue is tiny.
- **L191–199 — Thumb**: thin = `h-3.5 w-3.5 opacity-0 group-hover:opacity-100` (hover-only on touch — invisible during touch scrub except the active drag effect at L197). Large = `h-5 w-5` (20×20). DESIGN calls for 24×24 with brutal border.
- **L154–161 — Time bubble during drag**: `-top-9` (above the track), brutal border, foreground bg, mono time. ✓ already great. Just verify it doesn't overflow the player on the left/right edges (no clamp on `displayProgress`).
- **No haptic on scrub-end**: small but expected polish.
- **No "loading" state**: when buffering past the buffered window there's no striped pattern indicator (just the static `bg-foreground/25` for buffered).

### `PlayButton.tsx`

- **L37 — `size === "sm" ? "h-7 w-7" : "h-8 w-8"`** (28 / 32px): both fail 44×44 on mobile. Used in TrackRow contexts where DESIGN §5 says 44×44 minimum on mobile.
- **L72–82 — SVG 12×12** inside: tiny icon. ✓ visually correct given small button.
- **L40 — `rounded-full`**: contradicts brutalist square aesthetic (DESIGN §6: hard borders, no soft shadows). Should be `rounded-none` or just default.
- **L42 — `bg-primary text-primary-foreground` when playing**: hot-orange visible state. ✓ matches accent.
- **No long-press wired** (this is the inline track-row PlayButton; long-press is on the row itself, not this button).
- **L44–60 — hover-warm prefetch logic**: ✓ excellent, keeps. Don't break.

### `KaraokeToggle.tsx`

- **L138 — `hidden md:inline-flex`**: explicitly desktop-only. **Critical mobile gap.** Karaoke is the headline feature — invisible on mobile.
- **L138 — `h-7 ${showText ? "px-2 gap-1.5" : "w-7 px-0"}`**: 28-px button. Even on desktop borderline.
- **L116–120 — Icon variants** (Mic/MicOff/AlertCircle/Loader2): ✓ states are well-modeled.
- **L137 — `data-testid="karaoke-toggle"`**: ✓ tested.
- The toggle has 5 states (off, requesting, queued, processing, completed, failed) compressed into 3 visual styles (off, preparing, on, failed). ✓ acceptable.
- Tooltip dependency (L129–159): on mobile the Tooltip never shows on tap. Need an alternative affordance for first-time users to discover what the icon does.

### `TrackActionSheet.tsx`

- **L366 — `pb-[env(safe-area-inset-bottom)] max-h-[85vh] md:hidden`**: ✓ correct mobile sheet pattern. Uses Base UI `<Sheet side="bottom">`.
- **No drag handle**: DESIGN §9 says `drag handle convention` — apply same to TrackActionSheet. **Missing.**
- **L530–559 — `ActionRow`**: `px-4 py-3.5` (14-px top/bottom + line-height), 14px label text. Total row height ~52px on mobile. **DESIGN §10 for sheet rows says 56px tall.** Close — bump padding by 2px.
- **L196–201 — `<button>` Back row** in playlist picker: `px-4 py-3` text-only — no chevron-left icon visible (just `<ArrowLeft>`). ✓ but should be a 56px row.
- **L215 — `max-h-[40vh] overflow-y-auto`**: nested scroll inside a sheet. DESIGN §8 forbids nested scrolls. Needs to grow the sheet body and let the outer Sheet primitive scroll.
- **L246–265 — Inline Input + Create button** for new playlist: `h-9` input. DESIGN says mobile sheets should use `h-11` (44px) inputs.
- **L482–489 — Delete row**: properly destructive (text destructive). ✓
- **No haptic feedback on action tap** (L161 has it for playlist add). Should be uniform across all actions.
- **L388 — `<div className="flex flex-col pb-2">`** rows directly stacked. No dividers between rows besides the optional border at the playlist sub-list. Visual: brutal sheet with no line separators on the action list. Acceptable (matches DESIGN minimalism) but consider 1-px lines on `border-foreground/10` between rows for scannability.

### `TrackActionMenu.tsx` (desktop dropdown)

- **L363 — Trigger `w-7 h-7` (28×28)**: only used `hidden md:block` typically; but the menu trigger itself is reused on mobile in some contexts? Let me confirm — usage is via parent `hidden md:block`. ✓
- Otherwise this is desktop dropdown territory; pre-existing.
- **L172 — `max-h-[40vh] overflow-y-auto`**: nested scroll inside a dropdown. Acceptable for desktop.

## 3. MiniPlayer (preview, `MiniPlayer.tsx`) — mobile-first

The MiniPlayer is the **preview player** for 30s Deezer previews. It's smaller than the main Player and exists as a peripheral surface.

### Layout (<md)

- **Position**: `fixed left-3 right-3 z-45 bottom-[calc(var(--bottom-nav-h,64px)+env(safe-area-inset-bottom)+8px)]`. Floats above bottom nav with 8px gap.
- **Height**: 64px content, total visual ~64px (no safe-area intrusion since it sits above the nav, not on the OS chrome).
- **Layout**: `[ cover 48×48 ][ title/artist truncated ][ Play/Pause 44×44 ][ X swipe-down dismiss only ]`.
  - Cover 48×48 with brutal 2-px border, tap → opens FullscreenPlayer (preview tracks have no full track context — instead, opens a preview-focused dialog OR upgrades to the full player if the track is licensed).
  - Title `text-[13px] font-extrabold` truncate; artist link `text-[11px] text-muted-foreground` truncate.
  - Play/Pause: `h-11 w-11` (44×44) with 2px brutal border, primary fill when playing, foreground bg + accent text when paused. Centered SVG 16×16.
  - **Remove the close button on mobile** — preview is dismissed via swipe-down or by tapping a new track.
- **Long-press on cover/text** → opens TrackActionSheet (currently only `onContextMenu`; add proper long-press handler with 500ms hold).
- **Tap on cover/text** → opens FullscreenPlayer if track is licensed; otherwise expands to a "Preview Mode" inline expansion within the MiniPlayer (60px → 240px height) showing waveform + Save + Share.
- **Progress**: thin 2-px line at top edge of MiniPlayer, primary color, full width.
- **Volume slider removed on mobile** — system-level via hardware. Mute toggle inside the action sheet only.

### Layout (≥md)

Keep the current floating pill pattern at `bottom-5 right-5` with all controls visible (volume slider, close). No bottom nav on desktop, so no offset needed.

### ASCII wireframe

#### 360px (mobile)

```
                              [ top of bottom nav at y=∞-64 ]
┌─ y= 8px above nav ────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓ progress (2px primary) ▓▓▓▓▓▓▓▓▓▓░░░░░░│
│ ┌────┐                                                │
│ │COVR│  Wonderwall                              ▶/❚❚  │  64px
│ │48px│  OASIS                                  44×44  │
│ └────┘                                                │
└──────────────────────────────────────────────────────┘
   ↑ left:12px                                  right:12px ↑
```

#### 1280px (desktop)

```
                                                ┌──────────────────────────────────────┐
                                                │▓ progress (2px primary) ▓░░░░░░░░░░░░│
                                                │ ┌──┐ Wonderwall    🔊 ▮▮▮▮▮▮  ▶/❚❚ X│
                                                │ │40│ OASIS                            │
                                                │ └──┘                                  │
                                                └──────────────────────────────────────┘
                                                                          right: 20px ↑
                                                                          bottom: 20px ↑
```

### Concrete changes (file:line)

- `src/components/audio/MiniPlayer.tsx:40` → drop `z-50`, set `z-45`. Replace `bottom-5 right-5` with `bottom-[calc(var(--bottom-nav-h,64px)+env(safe-area-inset-bottom)+8px)] left-3 right-3 sm:bottom-5 sm:left-auto sm:right-5`.
- `src/components/audio/MiniPlayer.tsx:49` — wrap `<div ... onContextMenu={...}>` with a `useLongPress` hook that opens the action sheet on 500ms hold. Add `onClick={() => /* open fullscreen or expand */}`.
- `src/components/audio/MiniPlayer.tsx:67–95` — wrap volume in `hidden sm:flex`. Remove from mobile.
- `src/components/audio/MiniPlayer.tsx:98–127` — bump Play/Pause to `h-11 w-11 sm:h-9 sm:w-9 md:h-8 md:w-8`. Make SVG 16×16.
- `src/components/audio/MiniPlayer.tsx:130–147` — wrap close in `hidden sm:inline-flex`. Remove from mobile DOM entirely.
- `src/components/audio/MiniPlayer.tsx:30–41` — add `<motion.div>` swipe-down handler (`drag="y" dragConstraints={{top:0,bottom:0}} dragElastic={{top:0,bottom:0.5}} onDragEnd={(_,info)=>{ if(info.offset.y>60||info.velocity.y>400) stop(); }}`). Disable on `sm:` and up.
- Add a top-edge `<div className="absolute top-0 left-0 right-0 h-[2px] bg-muted overflow-hidden"><div className="h-full bg-primary transition-[width] duration-100" style={{width:`${(currentTime/duration)*100}%`}} /></div>` (subscribe via `usePreviewStore` ticks).

## 4. Player (main, `Player.tsx`) — mobile-first

The current Player.tsx mixes mobile (full-bleed bar) and desktop (240px-offset bar) patterns in one component. **Split into two render branches**:

- **Mobile (<md)**: render as a floating MiniPlayer-style bar. Same position/style as the preview MiniPlayer, but slightly taller (72px) and wired to `usePlayerStore`.
- **Desktop (≥md)**: keep the current bottom-pinned bar with all controls.

### Layout (<md)

- **Position**: `fixed left-3 right-3 z-45 bottom-[calc(var(--bottom-nav-h,64px)+env(safe-area-inset-bottom)+8px)]`. **Coexist with preview MiniPlayer** — when both are active, stack: preview on top, main player below, separated by 4px. Practically though, only one is active at a time per current store wiring.
- **Height**: 72px content. Slightly taller than preview MiniPlayer to fit Prev/Play/Next + cover + title.
- **Layout**: `[ cover 56×56 ][ title/artist 2 lines truncated ][ Prev 44×44 ][ Play 56×56 ][ Next 44×44 ]`.
  - No Shuffle/Repeat on mobile (move to FullscreenPlayer where there's room).
  - Tap on cover/text opens FullscreenPlayer (already wired at L131).
  - Long-press on cover/text opens TrackActionSheet (NEW — replace `onContextMenu`).
  - **Top edge progress bar** (2-px primary, same as preview).
- **No close button** — stop is via TrackActionSheet → "Close player" or by hitting Stop in fullscreen.

### Layout (≥md)

Keep current bottom-pinned bar at `fixed bottom-0 left-60 right-0` with full controls. Bump tap targets per DESIGN minimums (Shuffle/Repeat to `h-9 w-9`, Prev/Next to `h-10 w-10`, Play to `h-11 w-11`, Queue/Lyrics/Karaoke to `h-9 w-9`).

### ASCII wireframe

#### 360px (mobile)

```
                              [ top of bottom nav at y=∞-64 ]
┌─ y= 8px above nav ────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓ progress (2px primary) ▓▓▓▓▓▓▓▓▓▓░░░░░░│
│ ┌──────┐                                              │
│ │ COV  │  Wonderwall                                  │
│ │ 56px │  OASIS                  ◀◀  ▶/❚❚  ▶▶          │  72px
│ └──────┘                         44   56    44       │
└──────────────────────────────────────────────────────┘
   ↑ left:12                                  right:12 ↑
```

#### 1280px (desktop, current pattern, refined)

```
              ┌──────────────────────────────────────────────────────────────────────┐
              │▓ progress (3px primary at -2px) ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
              │ ┌────┐ Wonderwall   ⤤◀◀ ⏸️ ▶▶⤤  0:42 / 4:32  ☰ 🎤 📃 🔊▮▮▮ ⚙ ✕  │  64px
              │ │COV │ OASIS                                                         │
              │ │64px│                                                                │
              │ └────┘                                                                │
              └──────────────────────────────────────────────────────────────────────┘
              ↑ left:240px (sidebar)                                            right:0 ↑
```

### Concrete changes (file:line)

- `src/components/audio/Player.tsx:113` → split top-level into two branches: `if (isMobile) renderMobile(); else renderDesktop();`. The mobile branch uses `motion.div` with `fixed left-3 right-3 z-45 bottom-[calc(...)]` (matches MiniPlayer). The desktop branch keeps `fixed bottom-0 left-0 right-0 md:left-60 z-45`.
- `src/components/audio/Player.tsx:127` (mobile) — collapse the 30/40/30% layout into `[cover][text][prev][play][next]` flex with `gap-2`.
- `src/components/audio/Player.tsx:117–125` (mobile SeekBar) — move from `-top-4` (outside player chrome) to inside the player at `absolute top-0 left-0 right-0`, height 2px, primary color, no thumb.
- `src/components/audio/Player.tsx:159` Controls (mobile) — render only Prev (44×44), Play (56×56 with primary brutal), Next (44×44). Hide Shuffle/Repeat on mobile (`hidden sm:inline-flex`).
- `src/components/audio/Player.tsx:170, 193, 212, 239, 260, 293, 328, 394, 439` — bump all `h-7 w-7 sm:h-8 sm:w-8` → `h-9 w-9 sm:h-9 sm:w-9` (desktop). On mobile use `h-11 w-11`.
- `src/components/audio/Player.tsx:212` Play button (desktop) — bump `h-10 w-10` → `h-11 w-11`.
- `src/components/audio/Player.tsx:431–454` — wrap Close in `hidden sm:inline-flex`. Mobile drops the close button.
- `src/components/audio/Player.tsx:90` (`handleContextMenu`) — augment with `useLongPress` (500ms hold).
- `src/components/audio/Player.tsx:113` — change `z-50` → `z-45`.
- Add swipe-up on mobile player → opens FullscreenPlayer (currently `onClick` only on track-info block).

## 5. FullscreenPlayer (`FullscreenPlayer.tsx`) — mobile-first

### Layout (<md)

- **Slide-up from bottom**, motion 300ms cubic-bezier(0.32, 0.72, 0, 1) (current uses spring damping 30, stiffness 300 — fine).
- **`fixed inset-0 z-70 bg-background flex flex-col`**.
- **Top bar (60px)**: drag handle bar centered (4×40 px, brutal foreground), close chevron-down left (44×44), TrackActionMenu trigger right (44×44).
- **Hero artwork**: square, `aspect-square w-[min(85vw,360px)]` centered. Cover carousel as today (L102–121). 8px gap below hero before track meta.
- **Track meta**: title `text-brutal-md` (clamp 18–24px) 2-line clamp, artist as link `text-sm font-bold uppercase tracking-wide` 1 line, album as `brutal-label` caption.
- **SeekBar**: full-width inside `px-6` gutter, **large variant** (h-2.5 track + h-5 thumb today). DESIGN calls for **12px track + 24×24 thumb**. Bump to `large-mobile` variant: 12-px track, 24×24 thumb, brutal 2-px border on thumb.
- **Time labels**: mono small left/right under seek bar (`brutal-label tabular-nums`). ✓ already wired.
- **Controls row** (centered, even spacing, ~16-px gap):
  - Shuffle (44×44, `text-muted-foreground`, primary when on)
  - Prev (48×48)
  - **Play/Pause (64×64 PRIMARY BRUTAL)** — primary fill, foreground border (3px), brutal shadow.
  - Next (48×48)
  - Repeat (44×44, primary when on)
- **Secondary row** (4–5 icons, each 44×44): Lyrics toggle, Queue toggle, Share, Karaoke toggle, More (collapse audio-settings + visualizer toggle into More).
- **Bottom**: 16px + safe-area padding.

### Gestures

- **Swipe down on hero/empty area** → dismiss to MiniPlayer (currently the entire shell handles drag-y; **scope this strictly to hero + empty regions** so the swipe doesn't conflict with the cover-carousel horizontal swipe).
- **Swipe left/right on hero** → previous/next track via the cover carousel (already wired at L102–121).
- **Long-press on hero** → opens TrackActionSheet (NEW — replace `onContextMenu` at L128).
- **Swipe up on hero** → opens LyricsImmersive (NEW).
- **Tap on hero** → toggle a 1-line tap-feedback (e.g. show/hide visualizer). Currently no-op.

### Layout (≥md)

Currently `md:hidden` — fullscreen is mobile-only. Two options:

1. Keep mobile-only (current). Acceptable for an MVP.
2. Add a desktop fullscreen as a **modal at `max-w-4xl mx-auto`**, no swipe gestures, with the cover at left and queue/lyrics at right. Out of scope for this spec; mark as future work.

For this spec: **keep mobile-only**, add desktop later.

### ASCII wireframe — 360px portrait (FullscreenPlayer)

```
┌─────────────────────────────────────────┐
│             ▬▬▬▬ (drag handle 4×40)     │ 24px
├─────────────────────────────────────────┤
│ ⌄                            ⋮          │ 60px (close, [Now Playing label], more)
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         ┌───────────────────┐          │
│         │                   │          │
│         │                   │          │
│         │      COVER        │          │ ~306px (85vw of 360)
│         │      306×306      │          │
│         │                   │          │
│         │                   │          │
│         └───────────────────┘          │
│                                         │
├─────────────────────────────────────────┤
│  Wonderwall                             │ 32px brutal-md
│  OASIS · WHAT'S THE STORY               │ 18px caption
├─────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░     │ 12px track
│                          ⬤ 24×24 thumb  │
│  0:42                            4:32   │
├─────────────────────────────────────────┤
│                                         │
│   ⤤    ◀◀     ▶/❚❚      ▶▶    ⤤        │ 64px row (controls)
│   44   48      64        48    44       │
│                                         │
├─────────────────────────────────────────┤
│   📃    ☰      🎤      🔗     ⋯        │ 44px row (secondary)
│   44    44      44     44     44        │
├─────────────────────────────────────────┤
│        env(safe-area-inset-bottom)      │
└─────────────────────────────────────────┘
```

### Concrete changes (file:line)

- `src/components/audio/FullscreenPlayer.tsx:444` → `z-[60]` → `z-70`.
- `src/components/audio/FullscreenPlayer.tsx:447–463` (drag handle) — keep, but bump touch zone to `pt-3 pb-2` (currently `pt-3 pb-1`). Make `dragControls.start` available from the **entire top 60-px region**, not just the handle bar.
- `src/components/audio/FullscreenPlayer.tsx:466–519` (header) — bump close (L471) and queue/lyrics (L487, L509) buttons from `h-9 w-9` → `h-11 w-11`.
- `src/components/audio/FullscreenPlayer.tsx:483–502` (queue button) — change behavior: open queue sheet **on top of fullscreen** at `z-60`, do NOT close fullscreen. Currently `setFullscreenOpen(false); setQueuePanelOpen(true);` is jarring.
- `src/components/audio/FullscreenPlayer.tsx:504–518` (lyrics toggle) — keep behavior but add a parallel "Theatre Mode" trigger that opens LyricsImmersive directly.
- `src/components/audio/FullscreenPlayer.tsx:102` (CoverCarousel) — `max-w-[340px]` → `max-w-[min(340px,85vw)]`.
- `src/components/audio/FullscreenPlayer.tsx:107` — wrap CoverItem in `<SwipeableHero>` (NEW component) that handles swipe-down (dismiss), long-press (action sheet), swipe-up (lyrics immersive).
- `src/components/audio/FullscreenPlayer.tsx:144` (TrackInfo) — `px-8` → `px-6 sm:px-8`.
- `src/components/audio/FullscreenPlayer.tsx:170` SeekBar — pass `variant="large-mobile"` (NEW variant). Inside SeekBar, treat as: track 12px, thumb 24×24 always visible.
- `src/components/audio/FullscreenPlayer.tsx:204–273` Controls — redo to a single row with Shuffle/Prev/Play/Next/Repeat. Sizes: 44/48/64/48/44 (currently 48/56/72/56/48 — slight reduction to make room for the secondary row).
- `src/components/audio/FullscreenPlayer.tsx:278–326` VolumeSection — wrap in `hidden sm:flex`. Hide on mobile.
- `src/components/audio/FullscreenPlayer.tsx:329–378` ExtraControls — collapse into a "More" button at the secondary row that opens a sheet with crossfade + loudness norm + visualizer toggle.
- `src/components/audio/FullscreenPlayer.tsx:530–533` (visualizer 32px row) — hide below 360-px width with `hidden sm:block` OR remove from default layout and enable via the More sheet.
- Add **secondary row** at end of mobile layout: Lyrics toggle, Queue toggle, Share, Karaoke toggle, More — each 44×44.
- Add **swipe-up gesture** on hero to open LyricsImmersive.

## 6. SeekBar (`SeekBar.tsx`) — mobile-first

The SeekBar is shared between MiniPlayer (thin) and FullscreenPlayer (large). Add a third **mobile-large** variant for the FullscreenPlayer.

### Touch hit area expansion

- Add `before:absolute before:-inset-y-3 before:content-['']` on the bar wrapper — gives 30-px tall hit zone for a 12-px visual track. Already partially done by the `h-8`/`h-10` outer container, but the `before` pseudo lets us keep the visual at the right size while still hitting easily.

### Variants

| Variant | Track | Thumb | Use |
|---|---|---|---|
| `thin` (current) | 4px → 6px on hover | 14px hover-only | Player.tsx top edge |
| `large` (current) | 10px with border | 20×20 always | Desktop FullscreenPlayer |
| `large-mobile` (NEW) | **12px brutal border** | **24×24 brutal border thumb** | Mobile FullscreenPlayer |
| `progress-only` (NEW) | 2px solid | none | MiniPlayer top edge (no scrub) |

### Time bubble

- Already wired (L154–161). ✓
- ADD: clamp position so the bubble doesn't overflow the bar edges. `style={{ left: \`clamp(8px, ${displayProgress * 100}%, calc(100% - 8px))\` }}`.
- Bump bubble font size to `text-sm` (14-px) on mobile so it's readable mid-scrub.

### Loading state

- When `currentTime > buffered` AND `!isPlaying` (i.e., we're past the buffered window and stalled): render a striped brutal pattern over the buffered region. Pattern via `repeating-linear-gradient(45deg, var(--foreground) 0 4px, transparent 4px 8px)`. Animates left at 1s loop.

### Concrete changes (file:line)

- `src/components/audio/SeekBar.tsx:13` add `"large-mobile" | "progress-only"` to variant union.
- `src/components/audio/SeekBar.tsx:135` — extend className to include `before:absolute before:-inset-y-3 before:content-['']` for `thin` variant on mobile.
- `src/components/audio/SeekBar.tsx:166–169` — branch on `large-mobile`: track `h-3 border-2 border-foreground bg-muted`.
- `src/components/audio/SeekBar.tsx:191–200` — branch on `large-mobile`: thumb `h-6 w-6 border-[2px] border-foreground bg-foreground shadow-[var(--shadow-brutal-sm)]`.
- `src/components/audio/SeekBar.tsx:154–161` — clamp `left` style; bump `text-xs` → `text-sm`.
- Add stalled-loading striped overlay logic.

## 7. PlayButton (`PlayButton.tsx`) — mobile-first

The PlayButton is the inline track-row play button (used in TrackRow). Distinct from the player chrome's play/pause.

### Sizes

| Context | Mobile | Desktop |
|---|---|---|
| Inline track-row (sm) | **44×44** | 28×28 (current `h-7 w-7`) |
| Inline track-row (md) | **44×44** | 32×32 (current `h-8 w-8`) |
| MiniPlayer (preview) | 44×44 | 36×36 |
| Player main bar | 56×56 (mobile branch) | 44×44 (current `h-10 w-10` → bump) |
| FullscreenPlayer | **64×64** | n/a (mobile-only) |

### Visual

- Brutal: thick 2-px border (3-px sm:), hard shadow `var(--shadow-brutal-sm)`, primary fill when paused (orange-red on white), foreground bg + accent (lime) icon when playing.
- Drop `rounded-full` (`PlayButton.tsx:40`). Square brutalist matches DESIGN §13. Or keep round only for the inline track-row variant (subtle distinction from chrome).

### Concrete changes (file:line)

- `src/components/audio/PlayButton.tsx:37` — `size === "sm" ? "h-7 w-7" : "h-8 w-8"` → `size === "sm" ? "h-11 w-11 sm:h-7 sm:w-7" : "h-11 w-11 sm:h-8 sm:w-8"`.
- `src/components/audio/PlayButton.tsx:38` — drop `rounded-full`. Or gate to `rounded-full md:rounded-full` if intentional.
- `src/components/audio/PlayButton.tsx:42` — when playing, swap to `bg-foreground text-accent` (lime icon on black) for a more brutalist "active" look. Currently `bg-primary text-primary-foreground` (orange on white) which is fine but blends with primary CTAs elsewhere.
- `src/components/audio/PlayButton.tsx:73, 75, 80` — bump SVG from 12×12 → 16×16 (mobile) by passing `width={isLarge ? 16 : 12}`.

## 8. QueuePanel (`QueuePanel.tsx`) — mobile-first

### <md (mobile)

- **Bottom sheet via Base UI `<Sheet side="bottom">`** — replace the custom `motion.aside` with the same primitive used by TrackActionSheet for consistency.
- **Snap points**: 50% / 90% (max). Default opens at 50%.
- **Header (52px)**: drag handle (4×40) at top, "QUEUE" mono uppercase 11px label centered, current track count below in `brutal-label`. Right-side: clear-all (44×44, destructive-tinted), close (44×44).
- **Now playing pinned at top** (under header, before scroll): distinct visual — `bg-accent border-l-[4px] border-l-foreground`, brutal shadow. Tap → no-op (already playing).
- **Up next list**: each row 64px tall, virtualized via `react-window` if `queue.length > 50`.
  - Drag handle on left (24×40 grip column) for reorder.
  - **Swipe-left to remove** with brutal red action revealed (`bg-destructive`, "DELETE" mono label). Threshold 80px, snap-back if not committed.
  - Tap → jumpToIndex.
- **Played section** (collapsed by default, "SHOW PLAYED" expand toggle).
- **Footer**: 32px tall, `bg-foreground text-background`, mono "DRAG TO REORDER · SWIPE LEFT TO REMOVE" hint.

### ≥md (desktop)

- **Right drawer**, 360px wide (down from 420), full height, slides in from right. Same content layout as mobile.
- No bottom sheet behavior. No drag handle (just close button).

### ASCII wireframe — 360px (mobile QueuePanel)

```
┌─────────────────────────────────────────┐
│             ▬▬▬▬ (drag handle 4×40)     │ 16px
├─────────────────────────────────────────┤
│  QUEUE · 12 TRACKS · SHUFFLED      ✕    │ 52px header
│  Wonderwall — OASIS                     │
├─────────────────────────────────────────┤
│ ┌───┐                                   │
│ │■■■│  Wonderwall          (now playing)│ 64px (accent bg, foreground L border)
│ │40 │  OASIS                   ▮▮▮      │
│ └───┘                                   │
├─────────────────────────────────────────┤
│  UP NEXT                                │ 24px label
├─────────────────────────────────────────┤
│ ⋮⋮ ┌─┐ Don't Look Back in Anger      ✕  │ 64px row (drag handle, cover, title, swipe-X)
│ ⋮⋮ │ │ OASIS                            │
│    └─┘                                  │
├─────────────────────────────────────────┤
│ ⋮⋮ ┌─┐ Champagne Supernova          ✕  │ 64px
│ ⋮⋮ │ │ OASIS                            │
│    └─┘                                  │
├─────────────────────────────────────────┤
│  ▼ SHOW PLAYED (3)                      │ 32px collapsed
├─────────────────────────────────────────┤
│  DRAG TO REORDER · SWIPE LEFT TO REMOVE │ 32px footer
└─────────────────────────────────────────┘
```

### Concrete changes (file:line)

- `src/components/audio/QueuePanel.tsx:80–93` — replace `motion.aside` with `<Sheet side="bottom">` (mobile) / `<Sheet side="right">` (desktop, via responsive). Or keep motion.aside but add: drag handle, snap points (50/90), `z-60` not `z-40`.
- `src/components/audio/QueuePanel.tsx:90` — `z-40` → `z-60`.
- `src/components/audio/QueuePanel.tsx:113` — close button `w-8 h-8` → `w-11 h-11` mobile, `w-9 h-9` desktop.
- `src/components/audio/QueuePanel.tsx:336–349` — reveal Remove button on swipe-left (NEW gesture handler) instead of `opacity-0 group-hover:opacity-100`.
- `src/components/audio/QueuePanel.tsx:300–308` — bump GripVertical column to `w-6 h-10` for easier touch grip on the drag handle.
- `src/components/audio/QueuePanel.tsx:174–189` (Reorder.Group) — wrap in `react-window` `<FixedSizeList>` if `upNext.length > 50`. Otherwise keep current.
- `src/components/audio/QueuePanel.tsx:148–156` Now Playing block — bump visual: `bg-accent border-l-[4px] border-l-foreground py-3` (was `bg-accent border-2 border-foreground` — change to left-only border for the "active row" pattern from DESIGN §2).
- `src/components/audio/QueuePanel.tsx:193–209` Played section — collapse by default, add expand toggle.
- `src/components/audio/QueuePanel.tsx:84–87` (animation) — keep spring damping 28 ✓.

## 9. LyricsPanel & LyricsImmersive

### LyricsPanel (`LyricsPanel.tsx`)

The desktop side panel + mobile bottom sheet for lyrics. Currently nearly identical layout to QueuePanel — apply the same fixes.

#### Concrete changes (file:line)

- `src/components/audio/LyricsPanel.tsx:48–58` — replace `motion.aside` with `<Sheet side="bottom">` mobile / `<Sheet side="right">` desktop.
- `src/components/audio/LyricsPanel.tsx:56` — `z-40` → `z-60`.
- `src/components/audio/LyricsPanel.tsx:80` — close `w-8 h-8` → `w-11 h-11` mobile.
- Add drag handle at top (mobile only).
- Embed `<LyricsDisplay compact />` body — verify `compact` mode renders 16-px lines minimum on mobile.
- Footer "↗ THEATRE MODE" link (L102–107) — bump tap target to a 44×44 button with explicit "Theatre" label.

### LyricsImmersive (`LyricsImmersive.tsx`)

Full-bleed art-forward lyrics. Currently the strongest mobile surface in the suite — keep the typography (already excellent at clamp(2rem, 4.5vw, 2.4rem) inactive / clamp(2.6rem, 6vw, 3.5rem) active). But it's missing **playback controls**.

#### Layout (mobile)

- **Triggered by**: lyrics expand button in FullscreenPlayer header, OR swipe-up on hero in FullscreenPlayer (NEW).
- **Position**: `fixed inset-0 z-[80]` (current — keep, above the DESIGN-prescribed `z-71` floor).
- **Background**: `bg-foreground text-background` — pure black brutalist canvas. ✓ already.
- **Top bar (60px)**: minimal — track title small (mono 11-px, truncated), close (44×44 — bump from L182 `w-9 h-9`), karaoke toggle (44×44).
- **Lyrics column**: full-bleed, `px-[8vw] py-[35vh]` ✓ already great.
- **Bottom bar (88px → 100px to fit controls)**: 
  - Top row: small SeekBar (`progress-only` variant, 2-px tall, full width, tap-to-seek + drag).
  - Time labels (mono small).
  - **Play/Pause (44×44) centered** — ADD (currently missing).
  - Optional: Prev/Next on either side (40×40 each).

#### Concrete changes (file:line)

- `src/components/audio/LyricsImmersive.tsx:182` — close `w-9 h-9` → `w-11 h-11`.
- `src/components/audio/LyricsImmersive.tsx:218–246` (bottom progress) — bump bar from `h-[3px]` to `h-2`, thumb from `w-[11px] h-[11px] opacity-0` → `w-5 h-5 opacity-100` (always visible). Use the SeekBar `progress-only` variant for consistency.
- ADD: Play/Pause + Prev/Next under the progress bar in the bottom panel.
- ADD: KaraokeToggle in the top-right bar (next to close).
- ADD: swipe-down to dismiss (`drag="y"` with onDragEnd threshold).
- `src/components/audio/LyricsImmersive.tsx:162` Top bar — collapse the cover (L163 `h-11 w-11`) into the title block (cover already in the FullscreenPlayer bg blur — redundant) OR keep but explicit minimal. Check on a 360px viewport — title is squeezed.

## 10. KaraokeToggle (`KaraokeToggle.tsx`)

The headline feature. Needs to be visible on mobile.

### Mobile

- **44×44 button** in the FullscreenPlayer secondary row (NEW location). Also in LyricsImmersive top bar.
- **Visual states**:
  - **Off**: `border-transparent text-muted-foreground` (Mic icon).
  - **Loading/preparing**: `bg-accent border-foreground` with `Loader2 spin` + small percentage badge in corner (currently inline `${stems.progress}%`).
  - **On (ready)**: `bg-primary text-white border-foreground` (MicOff icon).
  - **Failed**: `bg-destructive/10 text-destructive border-destructive` (AlertCircle, tap-to-retry).
- **No tooltip on mobile** (Tooltip primitive doesn't fire on touch). Replace with: (a) bottom toast on first activation explaining what it does, (b) the action sheet's "Karaoke (remove vocals)" entry.

### Concrete changes (file:line)

- `src/components/audio/KaraokeToggle.tsx:138` — drop `hidden md:inline-flex`. Make available on both.
- `src/components/audio/KaraokeToggle.tsx:138` — bump `h-7 ... w-7` → `h-11 w-11 sm:h-9 sm:w-9 md:h-9 md:w-9`.
- `src/components/audio/KaraokeToggle.tsx:138` — bump SVG icons (L117–120) from `h-3.5 w-3.5` → `h-5 w-5` mobile, `h-4 w-4` desktop.
- `src/components/audio/KaraokeToggle.tsx:154` — when `showText`, switch from inline expansion to a small `text-[9px]` badge in the bottom-right corner of the icon button. Mobile icon-only buttons can't expand without breaking the row.
- Add a one-time toast on first karaoke activation: "Removing vocals — this can take a minute."

## 11. TrackActionSheet (`TrackActionSheet.tsx`)

Already a bottom sheet. Verify drag handle, snap point, brutal styling.

### Changes

- **Drag handle**: ADD a 4×40 brutal foreground bar at top of `<SheetContent>` (currently just a border-bottom on the header — no visible grip).
- **Snap points**: today is `max-h-[85vh]` (one snap). Add `min-h-[40vh]` so the sheet doesn't collapse to header-only on tiny content.
- **Row height**: `px-4 py-3.5` ≈ 52px → bump to `px-4 py-4` ≈ 56px to match DESIGN §10.
- **Drag-to-dismiss**: Base UI `<Sheet>` already supports backdrop-tap. Verify Chrome Android also lets the user pull down on the handle.
- **Haptic on every action tap**: add `navigator.vibrate(20)` after `onClick` in `ActionRow`.
- **Items currently**: Preview, Play next, Add to queue, Save/Remove, Add to playlist, Share, Album, Artist, Delete. ✓ comprehensive.
- ADD: Karaoke toggle row when track is the current player track ("Karaoke — remove vocals" / "Disable karaoke").
- ADD: Download row (links to `/downloads` with prefilled track or kicks off download).
- ADD: "Go to lyrics" row when current track has lyrics — opens LyricsImmersive.

### Concrete changes (file:line)

- `src/components/tracks/TrackActionSheet.tsx:367` — add `<div className="flex shrink-0 items-center justify-center pt-2 pb-1"><div className="h-1.5 w-12 bg-foreground rounded-sm" /></div>` at top of SheetContent (above SheetHeader).
- `src/components/tracks/TrackActionSheet.tsx:533` — `py-3.5` → `py-4`.
- `src/components/tracks/TrackActionSheet.tsx:533` — add `onClick` wrapper that calls `navigator.vibrate(20)` before invoking.
- `src/components/tracks/TrackActionSheet.tsx:215` — drop `max-h-[40vh] overflow-y-auto` on playlist picker; let outer Sheet scroll.
- `src/components/tracks/TrackActionSheet.tsx:253` — `<Input className="flex-1 h-9">` → `h-11`.

## 12. Z-index audit

DESIGN.md §7 mandates the following stack. Audit results:

| Layer | DESIGN z-index | Current | Required change |
|---|---|---|---|
| Top bar | z-30 | (other files) | n/a |
| Sidebar (md) | z-40 | (other files) | n/a |
| **MiniPlayer / Player (floating)** | **z-45** | `MiniPlayer.tsx:40` z-50, `Player.tsx:113` z-50 | **drop both to z-45** |
| **Bottom nav (mobile)** | z-50 | (NEW component) | n/a in this audit |
| **Sheets (TrackActionSheet, ShareDialog)** | z-60 | Base UI default — verify | confirm sheet primitive uses z-60 |
| **QueuePanel** | z-60 | `QueuePanel.tsx:90` z-40 | **bump to z-60** |
| **LyricsPanel** | z-60 | `LyricsPanel.tsx:56` z-40 | **bump to z-60** |
| **FullscreenPlayer** | z-70 | `FullscreenPlayer.tsx:444` z-[60] | **bump to z-70** |
| **LyricsImmersive** | z-71 | `LyricsImmersive.tsx:146` z-[80] | acceptable; align to z-71 for consistency |

### Concrete changes

- `MiniPlayer.tsx:40`: `z-50` → `z-45`.
- `Player.tsx:113`: `z-50` → `z-45`.
- `QueuePanel.tsx:90`: `z-40` → `z-60`.
- `LyricsPanel.tsx:56`: `z-40` → `z-60`.
- `FullscreenPlayer.tsx:444`: `z-[60]` → `z-70`.
- `LyricsImmersive.tsx:146`: `z-[80]` → `z-71`.

## 13. Components to create (NEW)

### `<SwipeableHero>` 

Wraps the FullscreenPlayer hero artwork. Exposes:

```ts
interface SwipeableHeroProps {
  children: React.ReactNode;       // the cover/carousel
  onSwipeDown?: () => void;        // dismiss
  onSwipeLeft?: () => void;        // next (deferred to internal carousel)
  onSwipeRight?: () => void;       // prev (deferred to internal carousel)
  onSwipeUp?: () => void;          // open lyrics immersive
  onLongPress?: () => void;        // open action sheet
  swipeThreshold?: number;         // default 60px
}
```

Internally uses Motion's drag with `axis="lock"` so vertical/horizontal don't fight the carousel. Long-press via 500ms timer + movement-cancellation.

### `<TimeBubble>`

Reusable time tooltip during scrub. Used in SeekBar. Takes `progress: number` and `duration: number`, renders the brutal time chip.

```tsx
<TimeBubble visible={dragProgress !== null} progress={displayProgress} duration={duration} />
```

Already inlined at `SeekBar.tsx:154–161` — extract for reuse if other surfaces (e.g., LyricsImmersive bottom progress) need it.

### `<DragHandle>`

Reusable 4×40 brutal foreground bar for sheet tops. Apply to TrackActionSheet, QueuePanel, LyricsPanel, FullscreenPlayer.

```tsx
<DragHandle pulsing />  // optional pulse animation
```

Replaces the inline `<motion.div className="h-1.5 w-12 bg-foreground rounded-sm" />` pattern.

### `<MobileSecondaryRow>` (helper for FullscreenPlayer)

A flex row of 5 brutal 44×44 icon buttons spaced evenly. Used at the bottom of the FullscreenPlayer mobile layout for Lyrics/Queue/Share/Karaoke/More.

## 14. Implementation order

> Note: **Bottom nav (from spec 01)** must land first. Without it, dropping MiniPlayer to z-45 makes it invisible-clickable below normal page content.

1. **[Blocked on spec 01 bottom nav]** Z-index migration — apply all six z-index changes in §12 in one PR. Test stack order in Chrome DevTools.
2. **MiniPlayer mobile reposition** (`MiniPlayer.tsx:40`) — switch from `bottom-5 right-5` to bottom-nav-aware positioning. Add long-press handler.
3. **Player mobile/desktop split** (`Player.tsx:113`) — branch render. Mobile floats above bottom nav with simplified controls; desktop keeps current bar.
4. **Touch target audit** — ALL `h-7 w-7`, `h-8 w-8`, `h-9 w-9` in player files: bump to mobile-44 with `sm:h-9 sm:w-9` cascade. Roughly 30 sites across 5 files.
5. **FullscreenPlayer enhancements** — header tap targets (44×44), z-70, queue-button-doesn't-close-fullscreen.
6. **SeekBar large-mobile variant** + time-bubble clamp.
7. **SwipeableHero component** (NEW) — replaces direct CoverCarousel mounting in FullscreenPlayer. Wires swipe-down/up/long-press.
8. **TrackActionSheet drag handle + 56-px rows + haptic on tap.**
9. **QueuePanel rebuild**: drag handle, snap points, swipe-left to remove, virtualization. Highest-effort module.
10. **LyricsPanel sheet refactor** (similar to QueuePanel but smaller).
11. **LyricsImmersive playback controls** (Play/Pause, Prev/Next, Karaoke at top, swipe-down dismiss).
12. **KaraokeToggle mobile visibility** — drop `hidden md:inline-flex`, surface in FullscreenPlayer secondary row + TrackActionSheet row.
13. **PlayButton inline 44-px on mobile** — touches every TrackRow consumer; do last to validate full regression.
14. **Optional: virtualized queue, swipe gestures on MiniPlayer.**

Dependencies between items:
- (1) blocks (2), (3), (5), (10).
- (7) blocks (5).
- (3) and (5) can ship independently after (1).
- (9) is independent of player chrome but benefits from drag handle from (8).

## 15. Effort estimate

| Item | Effort | Notes |
|---|---|---|
| 1. Z-index migration | **S** | 6-line diff, manual stack test. |
| 2. MiniPlayer reposition | **S** | ~30 lines. Long-press hook may exist. |
| 3. Player mobile/desktop split | **L** | Refactor 436-line file into branched render. Risk of behavior drift. |
| 4. Touch target audit | **M** | ~30 className tweaks across 5 files. Mechanical. |
| 5. FullscreenPlayer enhancements | **M** | Z-70, queue overlay, secondary row addition (~80 lines). |
| 6. SeekBar large-mobile | **S** | New variant branch (~25 lines). |
| 7. SwipeableHero | **M** | NEW component ~120 lines + integration. |
| 8. TrackActionSheet drag + rows + haptic | **S** | ~20 lines + DragHandle component. |
| 9. QueuePanel rebuild | **L** | Sheet primitive migration, virtualization, swipe-to-remove, snap points. ~200 lines touched. |
| 10. LyricsPanel sheet refactor | **S** | Mirrors QueuePanel pattern, but smaller. |
| 11. LyricsImmersive playback controls | **M** | Bottom-bar redesign + state subs. |
| 12. KaraokeToggle mobile | **S** | Class change + new mounting site in FullscreenPlayer + TrackActionSheet. |
| 13. PlayButton 44-px mobile | **M** | One file change but consumers (TrackRow) may need padding adjustments. |
| 14. Optional gestures | **M** | Polish. |
| **Total** | **~1.5–2 weeks** | for one engineer at full focus. |

## 16. Risks & open questions

### Risks

- **R1: Player.tsx mobile/desktop split could regress desktop UX.** Current behavior is well-tuned for desktop; refactor needs visual diff testing across widths 360–1920 plus Chrome Android emulation. Mitigation: keep desktop branch byte-identical to current for first PR, only add mobile branch.
- **R2: Drag-to-dismiss on FullscreenPlayer + swipe-on-hero may fight.** Motion's `drag` props need careful axis locking. The `dragListener={false}` + scoped `dragControls.start` pattern works for the handle today; extending to the hero requires `axis="y"` on hero swipe-down only when not already in a horizontal carousel drag. Mitigation: build SwipeableHero with explicit gesture priority logic (vertical wins over horizontal only after 30-px threshold).
- **R3: QueuePanel virtualization breaks Reorder.** Motion's `Reorder.Group` is not designed for virtualized lists. May need a custom drag-reorder implementation or fall back to non-virtualized + perf budget on queue length.
- **R4: Z-index drop on MiniPlayer (50→45) before bottom nav lands** — the MiniPlayer would become invisible below page content (since the page's `<main>` has no explicit z-index, defaults to 0, but ScrollArea may interpose). Mitigation: gate the z-45 change behind the bottom nav PR.
- **R5: Karaoke surface duplication.** Putting it in FullscreenPlayer secondary row + TrackActionSheet + LyricsImmersive top bar = three sources of truth. Mitigation: one shared `<KaraokeToggle>` component (already exists), three mounting sites — verify they all subscribe to the same store and that retry/preparing states stay in sync visually.
- **R6: Performance — animating sheet open + body scroll lock + Motion drag listeners adds JS frames on entry.** Chrome Android on mid-tier devices (360px viewport) may show jank. Mitigation: profile with DevTools after PR 9 (QueuePanel) lands; budget 60ms input latency.

### Open questions

- **Q1: Should the preview MiniPlayer be visible *while* the main Player is also active?** Today both can mount simultaneously (different stores). DESIGN.md doesn't cover this. Recommend: **only one mini-bar at a time** — when main Player has a track, hide preview MiniPlayer.
- **Q2: Should FullscreenPlayer support landscape orientation?** Currently the cover is `aspect-square w-full` which collapses badly in landscape. Recommend: detect orientation, swap to side-by-side cover + controls layout in landscape, or refuse rotation (lock to portrait).
- **Q3: LyricsImmersive vs FullscreenPlayer/lyrics-toggle — two different UX patterns.** Toggle is in-place inside FullscreenPlayer; immersive is full-bleed black. Are both needed? Recommend: **deprecate the in-place toggle**, always go to immersive. Reduces cognitive load.
- **Q4: Should swipe-left on the FullscreenPlayer hero advance to next track even when the carousel only has 1 item?** Currently the carousel (L102) shows the full queue, so swipe is "swipe through queue." Confirm behavior is intentional vs. swipe-to-skip.
- **Q5: Audio settings (crossfade + loudness norm) — surface on mobile?** Today they're `hidden md:inline-flex`. The "More" sheet from FullscreenPlayer secondary row is the natural home, but adds a sheet-on-sheet stack. Confirm UX decision.
- **Q6: Karaoke first-time onboarding** — toast vs. inline tutorial vs. sheet? First activation is a 30-60s wait. Recommend a one-time bottom-toast: "Removing vocals — this can take a minute."
- **Q7: Z-71 for LyricsImmersive vs the current `z-[80]` — does anything conflict at 72-80?** Toaster (sonner) defaults to `z-[9999]` typically, but if pinned to z-71 by override, it would sit below LyricsImmersive. Verify.
