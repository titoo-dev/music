# STRATEGY.md — deemix-next mobile-first rollout

> Synthèse des 6 audits écrans (`mobile-spec/01..06`) en plan d'implémentation. Source de vérité visuelle: [`DESIGN.md`](./DESIGN.md). Aucun code n'est écrit ici — seulement la séquence des PRs, les composants partagés à extraire, les risques cross-cutting et la stratégie de test.

---

## 1. Diagnostic global (4 problèmes systémiques)

| # | Problème | Surface impactée | Sévérité |
|---|----------|------------------|----------|
| **A** | **Touch targets sous 44×44 partout** — `Button size="icon"` (36×36), MiniPlayer Play (`h-8`), Close (`h-6`), TrackRow cover (36×36), hamburger (`layout.tsx:142`), BrutalToggle (44×24), PillGroup pills (~28px), share "OPEN IN APP" (~36px). | Player suite, layout, TrackRow, Settings, Share, Login | 🔴 Critique |
| **B** | **Pas de bottom navigation** — hamburger-only à `<md`. `DESIGN.md §7` mandate 5 tabs. Drawer survit pour secondaires. | `(main)/layout.tsx`, `Sidebar.tsx`, `Breadcrumb.tsx` | 🔴 Critique |
| **C** | **Z-index domino bloqué** — `MiniPlayer` et `Player` à `z-50` collidant avec le futur bottom nav (`z-50`). DESIGN mandate `z-45` player / `z-50` bottom nav / `z-70` fullscreen / `z-71` lyrics immersive. | MiniPlayer, Player, FullscreenPlayer, LyricsImmersive, sheets | 🔴 Critique |
| **D** | **Sticky-hover Chrome Android** — `brutal-card-hover` translate reste collé après tap. Manque le wrap `[@media(hover:hover)]:`. | Toutes les cards (artist:192, my-playlists, library, search) | 🟠 Élevée |

Et 4 problèmes plus locaux mais à fort effet boomerang :

- **`KaraokeToggle.tsx:138` hidden md:inline-flex** → feature phare invisible sur mobile.
- **Token violations hardcodées** — `bg-[#fffdf6]` (about:67), `shadow-[8px_8px_0_var(--primary)]` (share:321), `min-h-screen` (login).
- **Search: split input + bouton GO + dropdown** mangé par le clavier (search/page.tsx:198-280).
- **`pb-24` trop court** — bottom nav (64+safe) + 8px gap + MiniPlayer (64) ≈ 150-170px. Doit devenir `pb-32` ou utility `.pb-app-chrome`.

---

## 2. Composants partagés à extraire (foundation layer)

Cette liste est l'épine dorsale du chantier. Tout PR qui modifie un écran sans extraire ces composants devra être réécrit.

### Tier 1 — bloquants (avant tout écran)

| Composant | Fichier proposé | Remplace |
|-----------|------------------|----------|
| 🆕 `<BottomNav>` | `src/components/layout/BottomNav.tsx` | rien (n'existe pas) |
| 🆕 `<Button size="icon-touch">` (variant) | `src/components/ui/button.tsx` | `size="icon"` sur mobile |
| 🆕 CSS tokens `--bottom-nav-h`, `--mini-player-h`, `.pb-app-chrome` | `src/app/globals.css` | `pb-24` magic number |

### Tier 2 — réutilisés ≥3 écrans

| Composant | Consommateurs |
|-----------|---------------|
| 🆕 `<EntityHero>` | Album, Artist, Playlist detail |
| 🆕 `<CollectionHeader>` | Library, my-playlists/[id], playlist (public) |
| 🆕 `<TrackListing>` | Library, my-playlists/[id], playlist, album, artist top tracks |
| 🆕 `<EmptyState>` | Library, search, queue, playlists |
| 🆕 `<TabBar>` (snap-x mobile) | Artist sections, Search filters |
| 🆕 `<DragHandle>` | Sheets (queue, action, lyrics) |
| 🆕 `<DetailRow>` | Settings, About versions, Errors source |
| 🆕 `<CollapsibleSection>` | Settings (5+ sections), About |
| 🆕 `<BrutalFormField>` (label+input+error) | Login, Settings, ImportSpotifyDialog |

### Tier 3 — uniques mais utiles à isoler

`<HorizontalCardRow>` (snap-x recommandations), `<SelectionActionBar>` (multi-select sticky), `<EditableTitle>` (inline-edit), `<TimeBubble>` (seekbar scrub), `<SwipeableHero>` (gestures fullscreen player), `<DangerZone>`, `<PublicTopBar>`, `<ShareCTA>`, `<KeyboardShortcutsTable>`, `<ErrorDetailSheet>`, `<RecentSearches>`, `<SearchFilters>`, `<SectionHeader>`.

---

## 3. Séquence d'implémentation (12 PRs ordonnées)

Chaque PR est conçue pour être mergée indépendamment. Les blocages sont explicites.

### Phase 1 — Foundation (bloquant tout le reste)

**PR-0 · CSS tokens & utilities** _(S, ~30min)_
- `--bottom-nav-h`, `--mini-player-h`, `.pb-app-chrome`, lint rules pour bannir `vh`/`min-h-screen`/`bg-[#...]`.
- Seul changement non-rétrocompatible : `pb-24` → `.pb-app-chrome` sur `(main)/layout.tsx:232`.

**PR-1 · Touch target Button variant** _(S, ~45min)_
- Nouveau variant `<Button size="icon-touch">` (44×44 mobile, 36×36 desktop via `[@media(hover:hover)]`).
- Codemod global : ~40 occurrences `size="icon"` qualifiées une par une (player suite, layout, TrackRow).
- Aucun test régressé (variant additif).

### Phase 2 — Navigation (bloquante player)

**PR-2 · BottomNav + top bar slim** _(M, ~90min)_ — bloqué par PR-0.
- `BottomNav.tsx` (5 tabs auth-aware, safe-area, z-50).
- `(main)/layout.tsx` : drop hamburger principal, drawer survit pour secondaires (About, Logout).
- `Breadcrumb.tsx` : mobile = current screen only.
- Smoke test 360×640.

**PR-3 · Z-index domino** _(S, ~30min)_ — bloqué par PR-2.
- `MiniPlayer.tsx:40` z-50→z-45, position floating `bottom-[calc(var(--bottom-nav-h)+8px)] left-3 right-3`.
- `Player.tsx:113` z-50→z-45, idem.
- `FullscreenPlayer` z-[60]→z-70.
- `LyricsImmersive` z-[60]→z-71.
- Tests visuels stacking.

### Phase 3 — Cross-cutting hygiene

**PR-4 · Sticky-hover Chrome Android fix** _(S, ~45min)_
- Wrap `brutal-card-hover` dans `@media (hover: hover)` (CSS class) ou `[@media(hover:hover)]:` (utilities Tailwind).
- Sweep des `hover:-translate-x-*` ad-hoc (artist/page.tsx:192, library cards, my-playlists cards, search results).

**PR-5 · Token compliance sweep** _(S, ~20min)_
- `about/page.tsx:67` `bg-[#fffdf6]` → `bg-card`.
- `share/[shareId]/page.tsx:321` `shadow-[8px_8px_0_var(--primary)]` → `brutal-shadow-hover`.
- `login/page.tsx` `min-h-screen` → `min-h-dvh`.
- Lint rule activée pour bloquer la régression.

**PR-6 · KaraokeToggle un-hide** _(XS, 15min)_
- Drop `hidden md:inline-flex` (`KaraokeToggle.tsx:138`).
- Mount additionnel : FullscreenPlayer secondary row, TrackActionSheet, LyricsImmersive top bar.

### Phase 4 — Player suite (la plus visible)

**PR-7 · Player suite mobile** _(L, ~6h)_ — bloqué par PR-3.
- SeekBar : touch hit-area `before:absolute before:-inset-y-3`, `<TimeBubble>` scrub.
- FullscreenPlayer : `dvh`, safe-area, swipe gestures (`<SwipeableHero>` left=next, right=prev, down=dismiss).
- QueuePanel : bottom sheet 50%/90%, drag handle.
- LyricsImmersive : `text-brutal-lg` accent active line, full-bleed.
- Player.tsx : split mobile (72px floating pill cover+meta+Prev/Play/Next) vs desktop (current bar).

### Phase 5 — Collections & entities

**PR-8 · EntityHero + Album/Artist** _(L, ~5h)_
- Extract `<EntityHero>`, `<TabBar>`, `<HorizontalCardRow>`.
- Album : add action row PLAY full-width 48px + 4 icon buttons 44×44.
- Artist : brutal-frame 16:9 banner + sticky `<TabBar>` mobile / persistent stack desktop.
- TrackRow : add `hideAlbum?`, `showTrackNumber?` props (+ tests).

**PR-9 · CollectionHeader unification** _(L, ~8h)_
- Extract `<CollectionHeader>` + `<TrackListing>`.
- Migrate library, my-playlists, my-playlists/[id], playlist (public) — ~600 LOC duplication supprimées.
- `<SelectionActionBar>` (multi-select), `<EditableTitle>` (inline rename).
- AddToPlaylist : Dialog → Sheet sur mobile.

### Phase 6 — Discovery & utility

**PR-10 · Search refactor** _(M, ~3h)_
- Sticky full-width input + Cancel link (drop le bouton GO).
- Fullscreen suggest sheet en `(hover:none)` (au lieu d'un dropdown buried par le clavier).
- `<SearchFilters>` snap-x pills, `<RecentSearches>` chips.

**PR-11 · Settings + utility pages** _(M, ~4h)_
- `<CollapsibleSection>` (first-group-open default, `<details>` avec `<summary>` brutal).
- Auto-save 600ms debounce (drop le bouton SAVE explicite).
- `<DangerZone>` rouge en bas.
- `<BrutalFormField>` propagation login + ImportSpotifyDialog.
- About : `<DetailRow>` versions, brutal-card sections.
- Errors : brutal full-bleed mobile + `<ErrorDetailSheet>`.

**PR-12 · Share page + OG image** _(M, ~2h)_
- `<PublicTopBar>` + `<ShareCTA>`.
- Vérifier `opengraph-image.tsx` (probable manque).
- Hero centré max-w-xl desktop / 85vw mobile.

### Phase 7 — Backlog (gaté sur backend)

**PR-13 · Drag-reorder + virtualization** _(L, ~10h, post-MVP)_
- ❗ **Backend bloquant** : créer `PATCH /api/v1/playlists/:id/tracks/reorder`.
- TrackRow IntersectionObserver prefetch (ligne 196-214) → lift au niveau page-level sliding window AVANT virtualization (sinon la virtualization casse le prefetch d'images).
- Virtualization react-virtuoso sur listings >50 items.

**PR-14 · Artist API gaps** _(M, ~3h, post-MVP)_
- ❗ **Backend bloquant** : Prisma migration `FollowedArtist`, GW additions pour bio + related-artists.
- Sinon stub UI avec placeholders.

---

## 4. Quick wins (ship immédiat, < 4h cumulé)

À pousser en un seul PR de "quick fixes" si besoin de momentum :

1. ✅ KaraokeToggle un-hide (15min) — PR-6
2. ✅ `min-h-screen` → `min-h-dvh` login (5min) — PR-5
3. ✅ Token violations About+Share (15min) — PR-5
4. ✅ Hamburger 36→44 hit-area (5min) — partiel PR-1
5. ✅ Z-index FullscreenPlayer z-[60]→z-70 (5min) — PR-3 partiel

Effet : feature phare visible mobile, bug clavier mobile résolu, conformité tokens, tap fiable. Aucun changement structurel.

---

## 5. Risques cross-cutting

| Risque | Mitigation |
|--------|-----------|
| **SSR auth flash sur BottomNav (3 vs 5 tabs)** | Render fixed-skeleton de 5 tabs, hydrate avec auth state, transition opacity. Évite layout shift. |
| **Virtualization casse `IntersectionObserver` prefetch** (TrackRow:196-214) | PR-13 lift le prefetch au page-level (sliding window 5±) AVANT toute virtualization. |
| **Drag-reorder collide long-press TrackActionSheet** | Drag uniquement depuis le numéro de piste (column 24px) — long-press track row ouvre toujours la sheet. |
| **Backend missing pour reorder + follow** | PR-13/14 gated explicit. UI-only PRs livrables avant. |
| **`<EntityHero>` / `<CollectionHeader>` non testés** | Ajouter tests Vitest + locker dans `vitest.config.ts coverage.include` au moment du merge (cf. CLAUDE.md fix-bug-once). |
| **Hover transforms restants** dans des inline classes Tailwind | Ajouter ESLint rule custom : interdire `hover:translate-*` non-wrapé. |

---

## 6. Stratégie de test mobile

### Viewports cibles (Chrome DevTools device toolbar)
- **360×640** — petit Android (Galaxy A series), seuil critique.
- **390×844** — iPhone 14/15 portrait.
- **412×915** — Pixel 7 portrait.
- **768×1024** — iPad portrait, breakpoint `md:`.
- **1280×800** — desktop laptop.

### Checklist par PR
Reprend `DESIGN.md §15` :
- [ ] Pas de scroll horizontal à 360px
- [ ] Tous tap targets ≥44×44, espacement ≥8px
- [ ] Body ≥14px, label ≥11px
- [ ] Action primaire dans bottom 60% du viewport
- [ ] Rien caché derrière MiniPlayer/BottomNav (`.pb-app-chrome` appliqué)
- [ ] Skeleton match layout final (no CLS)
- [ ] Empty / error states existent
- [ ] `prefers-reduced-motion` respecté
- [ ] Smoke test au clavier soft (search, settings)

### Tests automatisés (CLAUDE.md fix-bug-once)
- Chaque PR locke ses nouveaux composants dans `vitest.config.ts coverage.include`.
- TrackRow rejoint la locked-in surface au PR-9.
- Player suite : extraction de helpers purs (cf. CLAUDE.md "Out of scope") devient prérequis pour PR-7 si on veut couverture > 0.
- Playwright (post-MVP) pour gestures swipe.

---

## 7. Effort total & roadmap

| Phase | PRs | Effort |
|-------|-----|--------|
| 1 — Foundation | PR-0, PR-1 | ~1.5h |
| 2 — Navigation | PR-2, PR-3 | ~2h |
| 3 — Hygiene | PR-4, PR-5, PR-6 | ~1.5h |
| 4 — Player | PR-7 | ~6h |
| 5 — Collections | PR-8, PR-9 | ~13h |
| 6 — Discovery + utility | PR-10, PR-11, PR-12 | ~9h |
| 7 — Backlog (gated) | PR-13, PR-14 | ~13h |
| **Total MVP (1→6)** | **12 PRs** | **~33h ≈ 4-5 jours dev FT** |
| **+ Backlog** | **+2 PRs** | **+13h ≈ 2 jours** |

Roadmap proposée — 1 dev plein-temps :

- **Jour 1** : Phase 1 + 2 + 3 (Foundation, Navigation, Hygiene) → mobile shell utilisable end-to-end.
- **Jour 2** : Phase 4 (Player suite) → expérience d'écoute mobile complète.
- **Jour 3** : Phase 5 PR-8 (Album/Artist).
- **Jour 4** : Phase 5 PR-9 (Collections).
- **Jour 5** : Phase 6 (Search + utility + share).
- **+2 jours plus tard** (avec backend) : Phase 7.

---

## 8. Documents de référence

- [`DESIGN.md`](./DESIGN.md) — design system unifié (17 sections, 357 lignes).
- [`mobile-spec/01-layout-navigation.md`](./mobile-spec/01-layout-navigation.md) — ~296 lignes.
- [`mobile-spec/02-home-search.md`](./mobile-spec/02-home-search.md) — ~324 lignes.
- [`mobile-spec/03-library-playlists.md`](./mobile-spec/03-library-playlists.md) — ~395 lignes.
- [`mobile-spec/04-album-artist.md`](./mobile-spec/04-album-artist.md) — ~451 lignes.
- [`mobile-spec/05-audio-player.md`](./mobile-spec/05-audio-player.md) — ~578 lignes.
- [`mobile-spec/06-utility-pages.md`](./mobile-spec/06-utility-pages.md) — ~605 lignes.

Total spec : ~2,650 lignes / ~250 KB. Chaque fichier contient wireframes ASCII, file:line refs, contrats de composants, ordre d'implémentation, estimation S/M/L par tâche, risques.

---

## 9. Décisions ouvertes (à trancher avant PR-2)

1. **Drawer mobile : conserver ou supprimer après BottomNav ?** — recommandation : conserver pour secondaires (About, Logout) accessible via avatar-menu top bar.
2. **Settings auto-save vs SAVE explicite ?** — recommandation : auto-save 600ms debounce + toast confirm, sauf actions destructives.
3. **Artist tabs sticky vs persistent stack ≥md ?** — recommandation : persistent stack (tabs uniquement mobile), aligne avec Material You / iOS Music.
4. **Login fields locaux ou Deezer-only ?** — à confirmer avec better-auth config (`src/lib/auth.ts`). Si Deezer-only, drop le formulaire.
5. **OG image share** existe ? — vérifier `src/app/share/t/[shareId]/opengraph-image.tsx`.
