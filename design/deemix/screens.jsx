// Screens — Home, Search, Album, Playlist, Library, History, Settings
// All receive `nav` and read player state via context.

const {
  useState: useState2, useEffect: useEffect2, useMemo: useMemo2, useCallback: useCallback2, useContext, createContext,
} = React;

const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// ─── PAGE HEADER — consistent shell on each screen ───
function PageHeader({ eyebrow, title, subtitle, right, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {eyebrow && (
        <div className="lbl" style={{ color: 'var(--muted-fg)', marginBottom: 10 }}>
          {eyebrow}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="t-xl" style={{ margin: 0, maxWidth: '15ch' }}>{title}</h1>
          {subtitle && <div style={{ marginTop: 10, color: 'var(--muted-fg)', fontSize: 14, fontWeight: 600, letterSpacing: '0.03em' }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ─── SECTION TITLE ───
function SectionHead({ title, meta, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, borderBottom: '2px solid var(--fg)', paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 className="t-md" style={{ margin: 0 }}>{title}</h2>
        {meta && <span className="lbl" style={{ color: 'var(--muted-fg)' }}>{meta}</span>}
      </div>
      {action}
    </div>
  );
}

// ─── ALBUM CARD — grid tile ───
function AlbumCard({ album, onClick, onPlay }) {
  return (
    <div
      onClick={onClick}
      className="card-hover b"
      style={{
        background: 'var(--card)', cursor: 'pointer',
        boxShadow: 'var(--shadow-brutal)',
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Cover seed={album.seed} title={album.title} size="100%" style={{ width: '100%', aspectRatio: '1/1', border: 'none' }} />
        <button
          onClick={(e) => { e.stopPropagation(); onPlay?.(album); }}
          style={{
            position: 'absolute', bottom: 8, right: 8,
            width: 40, height: 40, border: '2px solid var(--fg)', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: 'var(--shadow-brutal-sm)', color: 'var(--fg)',
          }}
        >
          <Icon name="play" size={14} />
        </button>
      </div>
      <div style={{ padding: 10, borderTop: '2px solid var(--fg)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.15, textTransform: 'uppercase', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {album.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted-fg)' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.artist}</span>
          <span>{album.year}</span>
        </div>
      </div>
    </div>
  );
}

// ─── PLAYLIST CARD — 2x2 cover grid ───
function PlaylistCard({ pl, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card-hover b"
      style={{ background: 'var(--card)', cursor: 'pointer', boxShadow: 'var(--shadow-brutal)' }}
    >
      <div style={{ width: '100%', aspectRatio: '1/1', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
        {pl.seeds.map((s, i) => (
          <Cover key={i} seed={s} title={pl.title} size="100%" style={{ width: '100%', height: '100%', border: 'none' }} />
        ))}
      </div>
      <div style={{ padding: 10, borderTop: '2px solid var(--fg)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.15, textTransform: 'uppercase', marginBottom: 4 }}>
          {pl.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted-fg)' }}>
          <span>{pl.tracks} TR</span>
          <span>{fmtDuration(pl.duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── TRACK ROW ───
function TrackRow({ track, index, isCurrent, isPlaying, onPlay, dense }) {
  const padY = dense ? 8 : 12;
  return (
    <div
      className="row-hover"
      onClick={() => onPlay?.(track)}
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 40px 1fr auto auto auto',
        gap: 12, alignItems: 'center',
        padding: `${padY}px 10px`,
        borderBottom: '1px solid rgba(13,13,13,0.12)',
        cursor: 'pointer',
        background: isCurrent ? 'var(--accent)' : 'transparent',
      }}
    >
      <div className="mono" style={{ fontSize: 11, color: 'var(--muted-fg)', textAlign: 'right' }}>
        {isCurrent && isPlaying ? <PlaybackEQ color="var(--primary)" /> : String(index + 1).padStart(2, '0')}
      </div>
      <Cover seed={track.seed} title={track.title} size={40} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {track.artist}
        </div>
      </div>
      <Badge tone="muted">{track.bitrate}</Badge>
      <div className="mono" style={{ fontSize: 11, color: 'var(--muted-fg)', width: 48, textAlign: 'right' }}>
        {fmtTime(track.duration)}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)' }}
        >
          <Icon name="download" size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)' }}
        >
          <Icon name="more" size={14} />
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SCREEN: HOME
// ══════════════════════════════════════════════
function HomeScreen() {
  const { nav, player } = useApp();
  const { PLAYLISTS, ALBUMS, TRACKS } = window.DMX_DATA;

  const recent = TRACKS.slice(0, 6);

  return (
    <div>
      <PageHeader
        eyebrow="04:22 · Tue · Apr 21"
        title={<>WELCOME BACK, <span style={{ color: 'var(--primary)' }}>TITO.</span></>}
        subtitle="238 TRACKS DOWNLOADED · 12.4 GB ON DISK"
        right={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="accent" onClick={() => nav('search')}><Icon name="search" size={14}/> PASTE LINK</Btn>
          </div>
        }
      />

      {/* Receipt ticker — recent downloads marquee */}
      <div className="b" style={{
        background: 'var(--fg)', color: 'var(--accent)',
        padding: '8px 0', marginBottom: 32, overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}>
        <div className="ticker lbl" style={{ gap: 40 }}>
          {[...Array(2)].flatMap((_, k) => recent.map((t, i) => (
            <span key={`${k}-${i}`} style={{ marginRight: 40 }}>
              ▸ {t.title} · {t.artist} · {t.bitrate} ·
            </span>
          )))}
        </div>
      </div>

      <section style={{ marginBottom: 44 }}>
        <SectionHead title="MY PLAYLISTS" meta={`${PLAYLISTS.length} COLLECTIONS`} action={<button onClick={() => nav('library')} className="lbl" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>VIEW ALL →</button>} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {PLAYLISTS.slice(0, 6).map(pl => <PlaylistCard key={pl.id} pl={pl} onClick={() => nav('playlist', { id: pl.id })} />)}
        </div>
      </section>

      <section style={{ marginBottom: 44 }}>
        <SectionHead title="MY ALBUMS" meta={`${ALBUMS.length} RECORDS`} action={<span className="mono" style={{ fontSize: 11, color: 'var(--muted-fg)' }}>SORT BY DATE ↓</span>} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {ALBUMS.slice(0, 8).map(al => <AlbumCard key={al.id} album={al} onClick={() => nav('album', { id: al.id })} onPlay={() => player.playTrack(TRACKS[al.seed])} />)}
        </div>
      </section>

      <section>
        <SectionHead title="JUST ADDED" meta="LAST 24 HOURS" />
        <div className="b" style={{ background: 'var(--card)' }}>
          {recent.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              index={i}
              isCurrent={player.currentTrack?.id === t.id}
              isPlaying={player.isPlaying}
              onPlay={() => player.playTrack(t)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════
// SCREEN: SEARCH
// ══════════════════════════════════════════════
function SearchScreen() {
  const { nav, player } = useApp();
  const { SEARCH_RESULTS } = window.DMX_DATA;
  const [q, setQ] = useState2('KAYTRANADA');
  const [tab, setTab] = useState2('all');

  const tabs = ['ALL', 'TRACKS', 'ALBUMS', 'ARTISTS'];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="lbl" style={{ color: 'var(--muted-fg)', marginBottom: 10 }}>SEARCH / DEEZER</div>
        <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
          <div className="b" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--card)', boxShadow: 'var(--shadow-brutal)' }}>
            <Icon name="search" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ARTIST, TRACK, ALBUM, OR DEEZER LINK…"
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                padding: '18px 12px', fontSize: 18, fontWeight: 700,
                fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em',
                color: 'var(--fg)',
              }}
            />
            {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-fg)' }}><Icon name="x" size={16}/></button>}
          </div>
          <Btn variant="primary" size="lg" style={{ height: 'auto' }}>GO</Btn>
        </div>
        <div className="mono" style={{ marginTop: 8, fontSize: 10, color: 'var(--muted-fg)', letterSpacing: '0.05em' }}>
          TIP: PASTE A DEEZER URL TO QUEUE AN ENTIRE ALBUM OR PLAYLIST.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--fg)' }}>
        {tabs.map(t => {
          const active = tab === t.toLowerCase();
          return (
            <button
              key={t}
              onClick={() => setTab(t.toLowerCase())}
              style={{
                padding: '12px 20px', border: 'none', background: active ? 'var(--fg)' : 'transparent',
                color: active ? 'var(--bg)' : 'var(--fg)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                borderRight: '2px solid var(--fg)',
              }}
            >{t}</button>
          );
        })}
      </div>

      {(tab === 'all' || tab === 'tracks') && (
        <section style={{ marginBottom: 36 }}>
          <SectionHead title="TRACKS" meta={`${SEARCH_RESULTS.tracks.length} RESULTS`} />
          <div className="b" style={{ background: 'var(--card)' }}>
            {SEARCH_RESULTS.tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i}
                isCurrent={player.currentTrack?.id === t.id} isPlaying={player.isPlaying}
                onPlay={() => player.playTrack(t)} />
            ))}
          </div>
        </section>
      )}

      {(tab === 'all' || tab === 'albums') && (
        <section style={{ marginBottom: 36 }}>
          <SectionHead title="ALBUMS" meta={`${SEARCH_RESULTS.albums.length} RESULTS`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {SEARCH_RESULTS.albums.map(a => <AlbumCard key={a.id} album={a} onClick={() => nav('album', { id: a.id })} onPlay={() => player.playTrack(window.DMX_DATA.TRACKS[a.seed])} />)}
          </div>
        </section>
      )}

      {(tab === 'all' || tab === 'artists') && (
        <section>
          <SectionHead title="ARTISTS" meta={`${SEARCH_RESULTS.artists.length} RESULTS`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {SEARCH_RESULTS.artists.map(ar => (
              <div key={ar.id} className="card-hover b" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-brutal)', padding: 16, display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }}>
                <Cover seed={ar.seed} title={ar.name} size={72} style={{ borderRadius: '50%' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ar.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--muted-fg)' }}>{(ar.fans / 1_000_000).toFixed(2)}M FANS</div>
                </div>
                <Icon name="chev-r" size={16} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// SCREEN: ALBUM DETAIL
// ══════════════════════════════════════════════
function AlbumScreen({ id }) {
  const { player } = useApp();
  const { ALBUMS, TRACKS } = window.DMX_DATA;
  const album = ALBUMS.find(a => a.id === id) || ALBUMS[0];
  // Build a tracklist from the first N TRACKS
  const tracklist = TRACKS.slice(0, 10).map((t, i) => ({ ...t, seed: (album.seed + i) % 12 }));
  const downloaded = true; // pretend this album is downloaded

  return (
    <div>
      {/* Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'flex-end', marginBottom: 28 }}>
        <Cover seed={album.seed} title={album.title} size={260} style={{ boxShadow: 'var(--shadow-brutal)', border: '3px solid var(--fg)' }} />
        <div style={{ minWidth: 0 }}>
          <div className="lbl" style={{ color: 'var(--muted-fg)', marginBottom: 12 }}>
            ALBUM · {album.year} · {album.genre}
          </div>
          <h1 className="t-xl" style={{ margin: 0, marginBottom: 12 }}>{album.title}</h1>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--fg)' }}>
            BY <span style={{ color: 'var(--primary)' }}>{album.artist}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 12 }}>
            <span className="mono">{album.tracks} TRACKS</span>
            <span className="mono">·</span>
            <span className="mono">{fmtDuration(album.duration)}</span>
            <span className="mono">·</span>
            <span className="mono" style={{ color: 'var(--primary)' }}>FLAC · 1411 KBPS</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="primary" size="lg" onClick={() => player.playQueue(tracklist)}><Icon name="play" size={14}/> PLAY ALBUM</Btn>
            <Btn variant="outline" size="lg"><Icon name="shuffle" size={14}/> SHUFFLE</Btn>
            {downloaded ? (
              <Btn variant="accent" size="lg" disabled><Icon name="check" size={14}/> DOWNLOADED</Btn>
            ) : (
              <Btn variant="outline" size="lg"><Icon name="download" size={14}/> DOWNLOAD</Btn>
            )}
            <Btn variant="ghost" size="lg"><Icon name="share" size={14}/></Btn>
            <Btn variant="ghost" size="lg"><Icon name="more" size={14}/></Btn>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 40px 1fr auto auto', gap: 12, padding: '8px 10px', borderBottom: '2px solid var(--fg)' }}>
        <div className="lbl" style={{ textAlign: 'right', color: 'var(--muted-fg)' }}>#</div>
        <div />
        <div className="lbl" style={{ color: 'var(--muted-fg)' }}>TITLE / ARTIST</div>
        <div className="lbl" style={{ color: 'var(--muted-fg)' }}>BITRATE</div>
        <div className="lbl" style={{ color: 'var(--muted-fg)', width: 48, textAlign: 'right' }}><Icon name="clock" size={11}/></div>
      </div>
      <div className="b-b b-l b-r" style={{ background: 'var(--card)' }}>
        {tracklist.map((t, i) => (
          <div key={t.id} className="row-hover" onClick={() => player.playQueue(tracklist, i)}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 40px 1fr auto auto',
              gap: 12, alignItems: 'center',
              padding: '10px 10px',
              borderBottom: i === tracklist.length - 1 ? 'none' : '1px solid rgba(13,13,13,0.12)',
              cursor: 'pointer',
              background: player.currentTrack?.id === t.id ? 'var(--accent)' : 'transparent',
            }}
          >
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted-fg)', textAlign: 'right' }}>
              {player.currentTrack?.id === t.id && player.isPlaying ? <PlaybackEQ color="var(--primary)"/> : String(i + 1).padStart(2, '0')}
            </div>
            <Cover seed={t.seed} title={t.title} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 2, fontWeight: 500 }}>{t.artist}</div>
            </div>
            <Badge tone="muted">{t.bitrate}</Badge>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted-fg)', width: 48, textAlign: 'right' }}>
              {fmtTime(t.duration)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SCREEN: LIBRARY (my-playlists + albums)
// ══════════════════════════════════════════════
function LibraryScreen() {
  const { nav } = useApp();
  const { PLAYLISTS, ALBUMS } = window.DMX_DATA;
  const [tab, setTab] = useState2('playlists');

  return (
    <div>
      <PageHeader
        eyebrow="LIBRARY"
        title="MY COLLECTION"
        subtitle={`${PLAYLISTS.length} PLAYLISTS · ${ALBUMS.length} ALBUMS · 238 TRACKS`}
        right={<Btn variant="primary"><Icon name="plus" size={14}/> NEW PLAYLIST</Btn>}
      />

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--fg)' }}>
        {['PLAYLISTS', 'ALBUMS', 'TRACKS'].map(t => {
          const active = tab === t.toLowerCase();
          return (
            <button
              key={t}
              onClick={() => setTab(t.toLowerCase())}
              style={{
                padding: '12px 20px', border: 'none', background: active ? 'var(--fg)' : 'transparent',
                color: active ? 'var(--bg)' : 'var(--fg)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                borderRight: '2px solid var(--fg)',
              }}
            >{t}</button>
          );
        })}
      </div>

      {tab === 'playlists' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {PLAYLISTS.map(pl => <PlaylistCard key={pl.id} pl={pl} onClick={() => nav('playlist', { id: pl.id })} />)}
        </div>
      )}
      {tab === 'albums' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {ALBUMS.map(al => <AlbumCard key={al.id} album={al} onClick={() => nav('album', { id: al.id })} />)}
        </div>
      )}
      {tab === 'tracks' && (
        <div className="b" style={{ background: 'var(--card)' }}>
          {window.DMX_DATA.TRACKS.slice(0, 15).map((t, i) => <TrackRow key={t.id} track={t} index={i} />)}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// SCREEN: PLAYLIST DETAIL
// ══════════════════════════════════════════════
function PlaylistScreen({ id }) {
  const { player } = useApp();
  const { PLAYLISTS, TRACKS } = window.DMX_DATA;
  const pl = PLAYLISTS.find(p => p.id === id) || PLAYLISTS[0];
  const tracks = TRACKS.slice(0, 12).map((t, i) => ({ ...t, seed: pl.seeds[i % 4] }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'flex-end', marginBottom: 28 }}>
        <div className="b sh" style={{ width: 260, height: 260, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
          {pl.seeds.map((s, i) => <Cover key={i} seed={s} size="100%" style={{ width: '100%', height: '100%', border: 'none' }} />)}
        </div>
        <div>
          <div className="lbl" style={{ color: 'var(--muted-fg)', marginBottom: 12 }}>PLAYLIST · PERSONAL</div>
          <h1 className="t-xl" style={{ margin: 0, marginBottom: 12 }}>{pl.title}</h1>
          {pl.description && <div style={{ fontSize: 15, marginBottom: 16, maxWidth: '60ch', fontWeight: 500, color: 'var(--muted-fg)' }}>{pl.description}</div>}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 20 }}>
            <span className="mono">{pl.tracks} TRACKS</span>
            <span className="mono">·</span>
            <span className="mono">{fmtDuration(pl.duration)}</span>
            <span className="mono">·</span>
            <span className="mono">UPDATED 3 DAYS AGO</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="primary" size="lg" onClick={() => player.playQueue(tracks)}><Icon name="play" size={14}/> PLAY</Btn>
            <Btn variant="outline" size="lg"><Icon name="shuffle" size={14}/> SHUFFLE</Btn>
            <Btn variant="outline" size="lg"><Icon name="download" size={14}/> DOWNLOAD ALL</Btn>
            <Btn variant="ghost" size="lg"><Icon name="share" size={14}/></Btn>
            <Btn variant="ghost" size="lg"><Icon name="more" size={14}/></Btn>
          </div>
        </div>
      </div>

      <div className="b" style={{ background: 'var(--card)' }}>
        {tracks.map((t, i) => (
          <TrackRow key={`${t.id}-${i}`} track={t} index={i}
            isCurrent={player.currentTrack?.id === t.id} isPlaying={player.isPlaying}
            onPlay={() => player.playQueue(tracks, i)} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SCREEN: DOWNLOAD HISTORY — receipt tape
// ══════════════════════════════════════════════
function HistoryScreen() {
  const { DOWNLOAD_HISTORY } = window.DMX_DATA;
  // Group by date
  const grouped = {};
  DOWNLOAD_HISTORY.forEach(it => {
    const d = new Date(it.date).toDateString();
    (grouped[d] ||= []).push(it);
  });
  const total = DOWNLOAD_HISTORY.reduce((s, h) => s + parseFloat(h.size), 0);

  return (
    <div>
      <PageHeader
        eyebrow="DOWNLOAD HISTORY"
        title="THE RECEIPTS"
        subtitle={`${DOWNLOAD_HISTORY.length} TRANSACTIONS · ${total.toFixed(1)} MB TOTAL · ALL TIME`}
        right={<Btn variant="outline"><Icon name="filter" size={14}/> FILTER</Btn>}
      />

      {/* Receipt-style */}
      <div style={{ maxWidth: 640 }}>
        <div className="b sh" style={{ background: '#fffdf6', padding: '20px 24px', fontFamily: 'var(--font-mono)' }}>
          {/* Receipt header */}
          <div style={{ textAlign: 'center', borderBottom: '2px dashed var(--fg)', paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.2em' }}>DEEMIX</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>── DOWNLOAD RECEIPT ──</div>
            <div style={{ fontSize: 10, marginTop: 2, color: 'var(--muted-fg)' }}>APR 2026 · TX LOG</div>
          </div>

          {Object.entries(grouped).map(([day, items]) => (
            <div key={day} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
                {day}
              </div>
              {items.map(it => (
                <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, fontSize: 12, padding: '4px 0', alignItems: 'baseline' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700 }}>{it.title}</span>
                    <span style={{ color: 'var(--muted-fg)' }}> · {it.artist}</span>
                  </div>
                  <div style={{ color: 'var(--muted-fg)', fontSize: 10 }}>{it.bitrate}</div>
                  <div style={{ fontWeight: 700 }}>{it.size}</div>
                  <div style={{ color: 'var(--muted-fg)', fontSize: 10, width: 48, textAlign: 'right' }}>{fmtDate(it.date)}</div>
                </div>
              ))}
            </div>
          ))}

          {/* Receipt total */}
          <div style={{ borderTop: '2px dashed var(--fg)', paddingTop: 10, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 13 }}>
              <span>TOTAL</span><span>{total.toFixed(1)} MB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted-fg)', marginTop: 4 }}>
              <span>{DOWNLOAD_HISTORY.length} TRACKS</span>
              <span>PAID IN BANDWIDTH</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '2px dashed var(--fg)', paddingTop: 10, marginTop: 14, fontSize: 10, color: 'var(--muted-fg)' }}>
            *** THANK YOU ***<br/>
            KEEP THIS RECEIPT FOR YOUR RECORDS
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SCREEN: SETTINGS
// ══════════════════════════════════════════════
function SettingsScreen() {
  const { tweaks, setTweaks } = useApp();
  const [bitrate, setBitrate] = useState2('FLAC');
  const [concurrency, setConcurrency] = useState2(3);
  const [autoplay, setAutoplay] = useState2(true);
  const [normalize, setNormalize] = useState2(false);

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader eyebrow="SETTINGS · V0.1.0" title="CONFIG" />

      <SettingsGroup title="DOWNLOADS">
        <SettingRow label="PREFERRED BITRATE" hint="FLAC = lossless, 320 = high-quality MP3">
          <div style={{ display: 'flex', gap: 0 }}>
            {['FLAC', '320', '128'].map(b => (
              <button key={b} onClick={() => setBitrate(b)}
                style={{
                  padding: '8px 14px', border: '2px solid var(--fg)', marginLeft: -2,
                  background: bitrate === b ? 'var(--fg)' : 'var(--card)',
                  color: bitrate === b ? 'var(--bg)' : 'var(--fg)',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.1em',
                }}>{b}</button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="CONCURRENCY" hint="How many tracks download simultaneously">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min="1" max="8" value={concurrency} onChange={e => setConcurrency(e.target.value)}
              style={{ width: 140, accentColor: 'var(--primary)' }} />
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, minWidth: 30 }}>{concurrency}×</span>
          </div>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="PLAYBACK">
        <SettingRow label="AUTO-PLAY NEXT TRACK" hint="Continue to the next track in queue automatically">
          <Toggle on={autoplay} onChange={setAutoplay} />
        </SettingRow>
        <SettingRow label="LOUDNESS NORMALIZATION" hint="Evens out track volume across the queue">
          <Toggle on={normalize} onChange={setNormalize} />
        </SettingRow>
        <SettingRow label="CROSSFADE" hint="Seconds of overlap between tracks">
          <select style={{ padding: '8px 12px', border: '2px solid var(--fg)', background: 'var(--card)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <option>OFF</option><option>1s</option><option>3s</option><option>5s</option>
          </select>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="APPEARANCE">
        <SettingRow label="DENSITY" hint="Compact shows more rows per screen">
          <div style={{ display: 'flex', gap: 0 }}>
            {['COMFY', 'COMPACT'].map(d => (
              <button key={d} onClick={() => setTweaks(t => ({ ...t, density: d.toLowerCase() }))}
                style={{
                  padding: '8px 14px', border: '2px solid var(--fg)', marginLeft: -2,
                  background: tweaks.density === d.toLowerCase() ? 'var(--fg)' : 'var(--card)',
                  color: tweaks.density === d.toLowerCase() ? 'var(--bg)' : 'var(--fg)',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.1em',
                }}>{d}</button>
            ))}
          </div>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="ACCOUNT">
        <SettingRow label="DEEZER CONNECTION" hint="Linked to titoo-dev@gmail.com">
          <Badge tone="accent">CONNECTED</Badge>
        </SettingRow>
        <SettingRow label="SPOTIFY IMPORT" hint="Sync playlists from Spotify">
          <Btn variant="outline" size="sm">CONNECT</Btn>
        </SettingRow>
      </SettingsGroup>

      <div className="lbl mono" style={{ marginTop: 40, color: 'var(--muted-fg)', letterSpacing: '0.2em' }}>
        DEEMIX-NEXT · v0.1.0 · BUILT 2026-04-19 17:42 UTC
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div className="lbl" style={{ borderBottom: '2px solid var(--fg)', paddingBottom: 6, marginBottom: 0 }}>{title}</div>
      <div className="b-l b-r b-b" style={{ background: 'var(--card)' }}>
        {children}
      </div>
    </div>
  );
}
function SettingRow({ label, hint, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '14px 16px',
      borderBottom: '1px solid rgba(13,13,13,0.12)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 3, fontWeight: 500 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, border: '2px solid var(--fg)', background: on ? 'var(--primary)' : 'var(--card)',
        cursor: 'pointer', padding: 0, position: 'relative',
      }}>
      <div style={{
        position: 'absolute', top: 0, left: on ? 20 : 0, width: 20, height: 20,
        background: on ? '#fff' : 'var(--fg)',
        transition: 'left .12s',
      }}/>
    </button>
  );
}

Object.assign(window, {
  AppCtx, useApp,
  PageHeader, SectionHead, AlbumCard, PlaylistCard, TrackRow,
  HomeScreen, SearchScreen, AlbumScreen, LibraryScreen, PlaylistScreen,
  HistoryScreen, SettingsScreen,
});
