// App root — state, router, AppShell, and Design Canvas with all artboards.

const { useState: useState4, useEffect: useEffect4, useMemo: useMemo4, useCallback: useCallback4 } = React;

// ─── APP STATE ───
function useAppState() {
  const [route, setRoute] = useState4({ name: 'home', params: {} });
  const [sidebarCollapsed, setSidebarCollapsed] = useState4(false);
  const [downloadsOpen, setDownloadsOpen] = useState4(false);
  const [fullscreenOpen, setFullscreenOpen] = useState4(false);
  const [lyricsOpen, setLyricsOpen] = useState4(false);

  // Player state
  const [currentTrack, setCurrentTrack] = useState4(window.DMX_DATA.TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState4(true);
  const [pos, setPos] = useState4(84);
  const [volume] = useState4(72);
  const [queue, setQueue] = useState4(window.DMX_DATA.QUEUE);

  // Simulated progress
  useEffect4(() => {
    if (!isPlaying || !currentTrack) return;
    const int = setInterval(() => {
      setPos(p => {
        if (p >= currentTrack.duration - 1) return 0;
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(int);
  }, [isPlaying, currentTrack]);

  const player = {
    currentTrack, isPlaying, pos, volume, queue,
    toggle: () => setIsPlaying(p => !p),
    playTrack: (t) => { setCurrentTrack(t); setPos(0); setIsPlaying(true); },
    playQueue: (tracks, start = 0) => { setCurrentTrack(tracks[start]); setPos(0); setIsPlaying(true); },
    next: () => {
      const idx = window.DMX_DATA.TRACKS.findIndex(t => t.id === currentTrack.id);
      const nextT = window.DMX_DATA.TRACKS[(idx + 1) % window.DMX_DATA.TRACKS.length];
      setCurrentTrack(nextT); setPos(0);
    },
  };

  const nav = (name, params = {}) => {
    setRoute({ name, params });
    setDownloadsOpen(false);
  };

  return { route, nav, sidebarCollapsed, setSidebarCollapsed,
    downloadsOpen, setDownloadsOpen, fullscreenOpen, setFullscreenOpen,
    lyricsOpen, setLyricsOpen, player };
}

// ─── THE APP SHELL (used inside desktop artboard) ───
function DeemixApp({ tweaks, setTweaks, initialRoute = 'home' }) {
  const state = useAppState();
  const { route, nav, sidebarCollapsed, setSidebarCollapsed,
          downloadsOpen, setDownloadsOpen, fullscreenOpen, setFullscreenOpen,
          lyricsOpen, setLyricsOpen, player } = state;

  useEffect4(() => {
    if (initialRoute && initialRoute !== 'home') nav(initialRoute);
  }, []);

  const ctx = { ...state, tweaks, setTweaks };

  let Screen;
  switch (route.name) {
    case 'home':     Screen = <HomeScreen />; break;
    case 'search':   Screen = <SearchScreen />; break;
    case 'library':  Screen = <LibraryScreen />; break;
    case 'album':    Screen = <AlbumScreen id={route.params.id} />; break;
    case 'playlist': Screen = <PlaylistScreen id={route.params.id} />; break;
    case 'history':  Screen = <HistoryScreen />; break;
    case 'settings': Screen = <SettingsScreen />; break;
    default: Screen = <HomeScreen />;
  }

  return (
    <AppCtx.Provider value={ctx}>
      <div className={`dmx density-${tweaks.density}`}
        style={{
          width: '100%', height: '100%', display: 'flex',
          background: 'var(--bg)', color: 'var(--fg)',
          fontFamily: 'var(--font-sans)', overflow: 'hidden',
          position: 'relative',
        }}>
        <Sidebar route={route} nav={nav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar nav={nav} route={route}
            onOpenDownloads={() => setDownloadsOpen(o => !o)}
            downloadsOpen={downloadsOpen} />
          <div style={{ flex: 1, overflow: 'auto', padding: '32px 28px 28px' }}>
            {Screen}
          </div>
          <MiniPlayer onExpand={() => setFullscreenOpen(true)} />
        </div>
        {downloadsOpen && <DownloadsPanel onClose={() => setDownloadsOpen(false)} />}
        {fullscreenOpen && <FullscreenPlayer onClose={() => setFullscreenOpen(false)} />}
        {lyricsOpen && <LyricsPanel track={player.currentTrack} pos={player.pos} onClose={() => setLyricsOpen(false)} />}
      </div>
    </AppCtx.Provider>
  );
}

// ─── TWEAKS PANEL ───
function TweaksPanel({ tweaks, setTweaks, visible, onClose }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 280, zIndex: 500,
      background: '#fff', border: '3px solid #0D0D0D',
      boxShadow: '6px 6px 0 #0D0D0D',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
    }}>
      <div style={{ padding: '10px 14px', background: '#0D0D0D', color: '#F0EBE3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.1em' }}>TWEAKS</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#F0EBE3', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.14em', marginBottom: 6, color: '#6B6560' }}>ACCENT COLOR</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { name: 'RED', primary: '#FF2E00', accent: '#C8FF00' },
              { name: 'BLUE', primary: '#0500FF', accent: '#FFB800' },
              { name: 'LIME', primary: '#8DFF00', accent: '#FF00E5' },
              { name: 'PINK', primary: '#FF0088', accent: '#00FFD1' },
            ].map(s => (
              <button key={s.name} onClick={() => setTweaks(t => ({ ...t, primary: s.primary, accent: s.accent }))}
                style={{
                  flex: 1, height: 32, border: '2px solid #0D0D0D',
                  background: s.primary, cursor: 'pointer',
                  outline: tweaks.primary === s.primary ? '3px solid #0D0D0D' : 'none',
                  outlineOffset: 2,
                }} title={s.name}/>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.14em', marginBottom: 6, color: '#6B6560' }}>DENSITY</div>
          <div style={{ display: 'flex', gap: 0 }}>
            {['comfy', 'compact'].map(d => (
              <button key={d} onClick={() => setTweaks(t => ({ ...t, density: d }))}
                style={{
                  flex: 1, padding: '6px', border: '2px solid #0D0D0D', marginLeft: -2,
                  background: tweaks.density === d ? '#0D0D0D' : '#fff',
                  color: tweaks.density === d ? '#F0EBE3' : '#0D0D0D',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.14em', marginBottom: 6, color: '#6B6560' }}>BACKGROUND</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { name: 'BONE', bg: '#F0EBE3' },
              { name: 'PAPER', bg: '#FBFAF7' },
              { name: 'GREY', bg: '#E4E0D7' },
            ].map(s => (
              <button key={s.name} onClick={() => setTweaks(t => ({ ...t, bg: s.bg }))}
                style={{
                  flex: 1, height: 28, border: '2px solid #0D0D0D',
                  background: s.bg, cursor: 'pointer',
                  outline: tweaks.bg === s.bg ? '3px solid #0D0D0D' : 'none',
                  outlineOffset: 2,
                  fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                }}>{s.name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT — Design Canvas wrapping all artboards ───
function App() {
  const [tweaks, setTweaks] = useState4(/*EDITMODE-BEGIN*/{
    "primary": "#FF2E00",
    "accent": "#C8FF00",
    "bg": "#F0EBE3",
    "density": "comfy"
  }/*EDITMODE-END*/);

  const [tweakMode, setTweakMode] = useState4(false);

  // Apply tweaks as CSS variables
  useEffect4(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', tweaks.primary);
    root.style.setProperty('--accent', tweaks.accent);
    root.style.setProperty('--bg', tweaks.bg);
  }, [tweaks]);

  // Tweaks mode wiring
  useEffect4(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweakMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweakMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  // Persist on tweak change
  useEffect4(() => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*');
  }, [tweaks]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="sec-desktop" title="Desktop App" subtitle="Core experience — sidebar, downloads, player, full navigation">
          <DCArtboard id="home" label="01 · Home" width={1440} height={900}>
            <DeemixApp tweaks={tweaks} setTweaks={setTweaks} initialRoute="home" />
          </DCArtboard>
          <DCArtboard id="search" label="02 · Search" width={1440} height={900}>
            <DeemixApp tweaks={tweaks} setTweaks={setTweaks} initialRoute="search" />
          </DCArtboard>
          <DCArtboard id="album" label="03 · Album" width={1440} height={900}>
            <DeemixApp tweaks={tweaks} setTweaks={setTweaks} initialRoute="album" />
          </DCArtboard>
          <DCArtboard id="playlist" label="04 · Playlist" width={1440} height={900}>
            <DeemixApp tweaks={tweaks} setTweaks={setTweaks} initialRoute="playlist" />
          </DCArtboard>
          <DCArtboard id="library" label="05 · Library" width={1440} height={900}>
            <DeemixApp tweaks={tweaks} setTweaks={setTweaks} initialRoute="library" />
          </DCArtboard>
          <DCArtboard id="history" label="06 · Download History (Receipt)" width={1440} height={900}>
            <DeemixApp tweaks={tweaks} setTweaks={setTweaks} initialRoute="history" />
          </DCArtboard>
          <DCArtboard id="settings" label="07 · Settings" width={1440} height={900}>
            <DeemixApp tweaks={tweaks} setTweaks={setTweaks} initialRoute="settings" />
          </DCArtboard>
        </DCSection>

        <DCSection id="sec-player" title="Player" subtitle="Fullscreen playback with waveform and lyrics">
          <DCArtboard id="fullscreen" label="08 · Fullscreen Player" width={1440} height={900}>
            <PlayerArtboard tweaks={tweaks} />
          </DCArtboard>
          <DCArtboard id="downloads" label="09 · Downloads Panel Open" width={1440} height={900}>
            <DeemixApp tweaks={tweaks} setTweaks={setTweaks} initialRoute="home" />
            <DownloadsAutoOpen />
          </DCArtboard>
        </DCSection>

        <DCSection id="sec-lyrics" title="Lyrics Views" subtitle="Three takes — floating overlay, immersive theatre, brutalist karaoke">
          <DCArtboard id="lyrics-floating" label="L1 · Floating Panel — over the app" width={1440} height={900}>
            <LyricsPanelArtboard tweaks={tweaks} />
          </DCArtboard>
          <DCArtboard id="lyrics-theatre" label="L2 · Theatre — full-page immersive" width={1440} height={900}>
            <LyricsTheatreArtboard tweaks={tweaks} />
          </DCArtboard>
          <DCArtboard id="lyrics-karaoke" label="L3 · Karaoke Strip — full-page brutalist" width={1440} height={900}>
            <LyricsKaraokeArtboard tweaks={tweaks} />
          </DCArtboard>
        </DCSection>

        <DCSection id="sec-share" title="Public Pages" subtitle="Pages seen outside the app — unauthenticated">
          <DCArtboard id="login" label="10 · Login / First Run" width={1280} height={820}>
            <LoginPage />
          </DCArtboard>
          <DCArtboard id="share" label="11 · Shared Track Page" width={1200} height={1400}>
            <SharePage />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} visible={tweakMode} onClose={() => setTweakMode(false)} />
    </>
  );
}

// Artboard wrapper that forces fullscreen player open on mount
function PlayerArtboard({ tweaks }) {
  const [state, setState] = useState4({});
  useEffect4(() => {
    const t = setTimeout(() => {
      const btn = document.querySelector('[data-ab-id="fullscreen"] [title="Full screen"]');
      btn?.click();
    }, 100);
    return () => clearTimeout(t);
  }, []);
  return <DeemixApp tweaks={tweaks} setTweaks={() => {}} initialRoute="home" />;
}

// ─── Lyrics artboard wrappers — auto-advancing playhead so the view feels live
function useFakePlayhead(start = 88, max = 218) {
  const [pos, setPos] = useState4(start);
  useEffect4(() => {
    const id = setInterval(() => setPos(p => (p >= max - 1 ? start : p + 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return pos;
}

function LyricsPanelArtboard({ tweaks }) {
  const pos = useFakePlayhead(90);
  const track = window.DMX_DATA.TRACKS[0];
  return (
    <div className={`dmx density-${tweaks.density}`} style={{
      width: '100%', height: '100%', position: 'relative',
      background: 'var(--bg)', overflow: 'hidden',
    }}>
      {/* Static app preview behind */}
      <DeemixApp tweaks={tweaks} setTweaks={() => {}} initialRoute="album" />
      {/* Force the lyrics panel open via portal-style overlay */}
      <LyricsPanel track={track} pos={pos} onClose={() => {}} />
    </div>
  );
}

function LyricsTheatreArtboard({ tweaks }) {
  const pos = useFakePlayhead(90);
  const track = window.DMX_DATA.TRACKS[0];
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <LyricsTheatre track={track} pos={pos} onClose={() => {}} />
    </div>
  );
}

function LyricsKaraokeArtboard({ tweaks }) {
  const pos = useFakePlayhead(96);
  const track = window.DMX_DATA.TRACKS[0];
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <LyricsKaraoke track={track} pos={pos} onClose={() => {}} />
    </div>
  );
}

// Auto-opens the downloads panel in artboard 09
function DownloadsAutoOpen() {
  useEffect4(() => {
    setTimeout(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('DOWNLOADS'));
      btn?.click();
    }, 200);
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
