# Audio UX Roadmap

État de l'audit UX du système audio. Ce fichier capture ce qui a été livré et ce qui reste à faire pour reprendre la session ultérieurement.

---

## ✅ Livré (commits `72d2d2a` + `8a4b191`)

### Session restore + bug refresh
- `AudioEngine.tsx` : restauration de la position de lecture après refresh / HMR via `currentTime` du store + backup `localStorage` écrit sur `pagehide` / `visibilitychange`
- Fix du `skipPlayEffectRef` posé inconditionnellement sur le track-load (qui bloquait le clic Play après refresh)

### Queue panel
- `QueuePanel.tsx` (Sheet base-ui à droite, z-70) : sections **Now Playing** / **Up Next** / **Played**
- Drag-reorder via `motion/react` `Reorder.Group` ; click pour jump ; bouton X pour supprimer ; bouton Clear avec toast de confirmation
- Action `jumpToIndex()` dans le store (synchronise `_shufflePos` en mode shuffle)
- Triggers dans `Player.tsx` (icône liste numérotée, mobile + desktop) et dans le header de `FullscreenPlayer.tsx`
- Auto-close du player quand la queue est épuisée (next() → stop() au lieu de pause())

### SeekBar
- Affichage du buffer (`audio.buffered`) en gris derrière la progression
- État disabled + `aria-disabled` quand `duration <= 0`
- `aria-orientation="horizontal"`
- Drag stable : commit `onSeek` avant `setDragProgress(null)` + `onTimeUpdate` skippe les writes au store quand `_seekTo !== null`

### Mute + Sleep timer
- Action `toggleMute()` dans le store avec `_lastNonZeroVolume` persisté
- Icône volume cliquable dans `Player.tsx` (avec icône croix quand muted)
- `<VolumeSection>` complet dans `FullscreenPlayer.tsx` (mute + slider + indicateur 0-100)
- `<SleepCountdown>` chip qui tick à 1 Hz à côté du temps

### Haptique + a11y
- `utils/haptic.ts` (wrapper `navigator.vibrate`)
- Vibration sur `toggle()` et `toggleMute()` côté store (s'applique partout)
- `<TrackAnnouncer>` : région `aria-live="polite"` sr-only "Now playing: Title by Artist", monté dans le layout

### Reduced motion
- `<MotionConfig reducedMotion="user">` englobe le layout
- `AudioVisualizer` n'exécute plus son rAF si `prefers-reduced-motion`
- Hook `usePrefersReducedMotion`

### Robustesse
- Compteur `consecutiveFailures` dans `AudioEngine` : 3 échecs d'affilée → on stoppe l'auto-skip et on affiche un toast "check your connection". Reset sur `onPlaying`
- Set `presignedDenied` au niveau module : refus de presigned **par track** au lieu de désactiver globalement après une erreur
- `_seekTo` avant audio prêt : si `audio.readyState < 1`, on défère via `resumePositionRef`
- Raccourcis clavier : skip Space/Arrow si focus sur élément avec `role` interactif (slider, switch, combobox, menuitem, option, tab, spinbutton)
- `PlayButton` hover warm debouncé 150 ms (cancel sur mouseLeave)
- `FullscreenPlayer` drag handle pulse en `scaleX` toutes les ~3 s

### Toast notifications (sonner)
- `Toaster` brutalisé dans `components/ui/sonner.tsx`
- Sur erreur : toast bottom-center avec **Retry** (rebuild audio element via `retryTrack()`) et **Skip** (next track) — `Skip` masqué si dernier de la queue
- Action `retryTrack()` dans le store : bump du compteur `_retryLoadCount` → `AudioEngine` reload
- Toast de confirmation sur `clearQueue` ("Cleared N tracks from queue")
- Bandeau d'erreur du Player retiré (remplacé par toast)

---

## 🚧 À faire (audit restant)

Ces items viennent du rapport d'audit du 27 avril 2026. Ordre suggéré : a11y d'abord, puis polish.

### Priorité haute — accessibilité

#### #20 Cibles tactiles 44 × 44 px
**Problème** : `Player.tsx:148` (shuffle/repeat icons) en `h-7 w-7` (28 px). WCAG recommande ≥ 44 px.
**Fix proposé** : garder l'icône à 28 px mais ajouter `min-h-[44px] min-w-[44px]` + `flex items-center justify-center` sur le `Button` shadcn pour étendre la zone tactile sans déformer le visuel. Audit composant par composant :
- `Player.tsx` : shuffle, repeat, queue, LRC, speed, sleep, close (vérifier tous)
- `MiniPlayer.tsx` : close (`h-6 w-6` !)
- `QueuePanel.tsx` : remove X (`h-7 w-7`, OK)
- `FullscreenPlayer.tsx` : OK majoritairement (h-9+)

#### #21 Focus ring visible
**Problème** : pas vérifié visuellement. Le `Button` shadcn doit avoir `focus-visible:ring-2 ring-primary ring-offset-2` ; à confirmer dans `components/ui/button.tsx`.
**Fix proposé** : audit visuel en navigant au clavier sur le player. Si manquant, ajouter `focus-visible:` classes aux variants ghost / icon. Particulièrement dans `FullscreenPlayer` (fond peut être sombre).

### Priorité moyenne — polish

#### #13 Crossfade visuel pendant track change
**Problème** : au changement de track, `currentTime` saute à 0 instantanément, puis l'audio met 100-500 ms à charger → la SeekBar est à 0 et `duration` peut être stale.
**Fix proposé** : ajouter une transition d'opacité 0.5 → 1 sur la zone seek+timer pendant `isBuffering` dans `Player.tsx` et `FullscreenPlayer.tsx`. Wrapper la SeekSection dans un `<motion.div animate={{ opacity: isBuffering ? 0.55 : 1 }}>`.

#### #14 Polish CoverCarousel
**Problème** : `FullscreenPlayer.tsx:106-124` carousel manque de "poids" au swipe.
**Fix proposé** : ajouter `whileDrag={{ scale: 0.98 }}` + `transition={{ type: "spring", damping: 20 }}` sur les `CarouselItem`. Vérifier que ça ne casse pas l'embla carousel sous-jacent.

#### #26 Crossfade prefetch agressif
**Problème** : `AudioEngine.tsx:1022` le crossfade ne fonctionne que si la prochaine track est préchargée à `readyState >= 3`. Si l'utilisateur active `crossfadeDuration > 0` mais que le préchargement n'a pas eu lieu, le crossfade est silencieusement absent.
**Fix proposé** : quand `crossfadeDuration > 0`, forcer un préchargement plus agressif via `preloadTrack` du `next` dès que la track courante est lancée. Optionnellement : tooltip dans `ExtraControls` "Crossfade requires the next track to be buffered".

### Priorité basse

#### #8 Skip < 30 s — feedback
**Problème** : `notifyTrackSkipped` évince silencieusement la track du cache S3. Surprise pour le user qui revient avec prev().
**Fix proposé** : optionnel — toast "Track removed from cache" la première fois, OU rendre l'éviction conditionnelle (uniquement après 5 skips).

#### #23 AudioPreview refactor
**Gros chantier** : `AudioPreview.tsx` utilise un JSX `<audio>` et un store séparé alors que `AudioEngine` est imperatif. Les deux peuvent jouer simultanément (fragile useEffect dans AudioEngine pour gérer ça).
**Fix proposé** : extraire un util "AudioController" partagé et le réutiliser dans les deux. À isoler dans une PR dédiée car ça touche plusieurs comportements (volume sync, normalization, web audio context). Estimer 4-6 h.

---

## Stack technique notable

- **Store** : Zustand `usePlayerStore` avec persist middleware. Voir `partialize` pour ce qui est restauré au refresh
- **AudioEngine** : composant impératif, pas de JSX `<audio>`. Tout passe par `audioRef.current` + handlers dans `handlersRef` pour ne pas reattacher à chaque render
- **Streaming** : path triple — IndexedDB blob > presigned S3 > `/api/v1/stream-progressive/`
- **Toast** : sonner v2.0.7, wrapper brutalisé dans `components/ui/sonner.tsx`
- **Drag-reorder** : `motion/react` `Reorder.Group` avec valeurs string (trackId)

## Ce qui fonctionne bien et qu'il ne faut pas casser

- La logique de session restore (HMR + refresh) est subtile — testée manuellement
- L'invariance de `queueIndex` via `moveInQueue` quand on déplace la track courante
- Le compteur `consecutiveFailures` qui se reset uniquement sur `onPlaying` (pas sur `oncanplay`, sinon une track buffered mais pas play-able masquerait le pattern d'échec)
- Le path `presignedDenied` per-track : ne pas revenir à un kill-switch global
