// App shell — sidebar, mini player, fullscreen player
// Plus special pages: Share, Login, DownloadsPanel

const { useState: useState3, useEffect: useEffect3, useRef: useRef3, useMemo: useMemo3 } = React;

// ─── SIDEBAR ───
function Sidebar({ route, nav, collapsed, setCollapsed }) {
  const nav_items = [
    { id: 'home',     label: 'HOME',     icon: 'home' },
    { id: 'search',   label: 'SEARCH',   icon: 'search' },
    { id: 'library',  label: 'LIBRARY',  icon: 'library' },
    { id: 'history',  label: 'HISTORY',  icon: 'history' },
    { id: 'settings', label: 'SETTINGS', icon: 'settings' },
  ];
  const width = collapsed ? 72 : 240;

  return (
    <aside style={{
      width, flexShrink: 0, background: 'var(--fg)', color: 'var(--bg)',
      borderRight: '3px solid var(--fg)',
      display: 'flex', flexDirection: 'column',
      transition: 'width .15s',
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 12px' : '20px 18px',
        borderBottom: '2px solid var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        {!collapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, background: 'var(--primary)', border: '2px solid var(--bg)' }}/>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em' }}>DEEMIX</div>
            </div>
            <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', color: 'var(--bg)', cursor: 'pointer', opacity: 0.6 }}>
              <Icon name="collapse" size={14} />
            </button>
          </>
        ) : (
          <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', color: 'var(--bg)', cursor: 'pointer', margin: '0 auto' }}>
            <div style={{ width: 24, height: 24, background: 'var(--primary)', border: '2px solid var(--bg)' }}/>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav_items.map(it => {
          const active = route.name === it.id;
          return (
            <button key={it.id} onClick={() => nav(it.id)}
              title={collapsed ? it.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '12px' : '12px 18px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                border: 'none', background: active ? 'var(--primary)' : 'transparent',
                color: 'var(--bg)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                borderLeft: active ? '4px solid var(--accent)' : '4px solid transparent',
                transition: 'background .08s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={it.icon} size={16} />
              {!collapsed && <span>{it.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Playlists section */}
      {!collapsed && (
        <div style={{ borderTop: '2px solid var(--bg)', padding: '12px 18px 8px' }}>
          <div className="lbl" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>MY PLAYLISTS</span>
            <button style={{ background: 'none', border: '1px solid var(--bg)', color: 'var(--bg)', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon name="plus" size={10} />
            </button>
          </div>
          {window.DMX_DATA.PLAYLISTS.slice(0, 4).map(pl => (
            <button key={pl.id} onClick={() => nav('playlist', { id: pl.id })}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '6px 0', border: 'none', background: 'transparent',
                color: 'var(--bg)', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                textTransform: 'uppercase',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                opacity: 0.7,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              → {pl.title}
            </button>
          ))}
        </div>
      )}

      {/* User badge */}
      <div style={{ padding: collapsed ? '12px' : '14px 18px', borderTop: '2px solid var(--bg)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--bg)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)', fontWeight: 900, fontSize: 14 }}>T</div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>TITOO-DEV</div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.1em' }}>FLAC · ACTIVE</div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── TOP BAR — downloads popover trigger ───
function TopBar({ nav, route, onOpenDownloads, downloadsOpen }) {
  const active = window.DMX_DATA.ACTIVE_DOWNLOADS.filter(d => d.status === 'downloading').length;
  const queued = window.DMX_DATA.ACTIVE_DOWNLOADS.filter(d => d.status === 'inQueue').length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 28px', borderBottom: '2px solid var(--fg)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 40,
      height: 60,
    }}>
      {/* Breadcrumb */}
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--muted-fg)' }}>
        <span style={{ fontWeight: 700 }}>~/DEEMIX</span> /  <span style={{ color: 'var(--fg)', fontWeight: 700 }}>{route.name.toUpperCase()}</span>
        {route.params?.id && <span> / {route.params.id.toUpperCase()}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Downloads pill */}
        <button onClick={onOpenDownloads}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', height: 36,
            border: '2px solid var(--fg)',
            background: downloadsOpen ? 'var(--fg)' : (active > 0 ? 'var(--primary)' : 'var(--card)'),
            color: downloadsOpen ? 'var(--bg)' : (active > 0 ? '#fff' : 'var(--fg)'),
            cursor: 'pointer', boxShadow: 'var(--shadow-brutal-sm)',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          }}
        >
          <Icon name="download" size={14} />
          <span>DOWNLOADS</span>
          {active > 0 && (
            <span style={{ background: 'var(--accent)', color: 'var(--fg)', padding: '2px 6px', fontSize: 10, fontWeight: 900, border: '1px solid var(--fg)' }}>
              {active}
            </span>
          )}
        </button>
        <Btn variant="outline" size="icon" title="Notifications"><Icon name="alert" size={14}/></Btn>
      </div>
    </div>
  );
}

// ─── DOWNLOADS POPOVER ───
function DownloadsPanel({ onClose }) {
  const { ACTIVE_DOWNLOADS } = window.DMX_DATA;
  const [tab, setTab] = useState3('all');

  const filtered = ACTIVE_DOWNLOADS.filter(d => {
    if (tab === 'all') return true;
    if (tab === 'active') return d.status === 'downloading' || d.status === 'inQueue';
    if (tab === 'done') return d.status === 'completed';
    if (tab === 'failed') return d.status === 'failed';
    return true;
  });

  return (
    <div style={{
      position: 'absolute', top: 56, right: 28, width: 440, zIndex: 100,
      background: 'var(--card)', border: '3px solid var(--fg)', boxShadow: '6px 6px 0 var(--fg)',
      maxHeight: 520, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '2px solid var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--fg)', color: 'var(--bg)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.08em' }}>DOWNLOAD QUEUE</div>
          <div className="mono" style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>3× CONCURRENT · 4.2 MB/S</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--bg)', cursor: 'pointer' }}>
          <Icon name="x" size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--fg)' }}>
        {['ALL', 'ACTIVE', 'DONE', 'FAILED'].map(t => {
          const active = tab === t.toLowerCase();
          return (
            <button key={t} onClick={() => setTab(t.toLowerCase())}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRight: '2px solid var(--fg)',
                background: active ? 'var(--accent)' : 'transparent',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                cursor: 'pointer',
              }}>{t}</button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(d => (
          <div key={d.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(13,13,13,0.1)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <Cover seed={d.seed} title={d.title} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--muted-fg)', whiteSpace: 'nowrap' }}>
                  {d.downloaded}/{d.size}
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted-fg)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{d.artist}</div>
              {/* Chunked progress */}
              <div style={{ display: 'flex', gap: 2, height: 8 }}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const pct = (i + 1) * 5;
                  const filled = d.status === 'completed' || pct <= d.progress;
                  const active = d.status === 'downloading' && pct > d.progress && pct <= d.progress + 5;
                  return (
                    <div key={i} style={{
                      flex: 1,
                      background: d.status === 'failed' ? (i < 4 ? 'var(--destructive)' : 'var(--muted)') :
                        filled ? (d.status === 'completed' ? 'var(--accent)' : 'var(--primary)') :
                        active ? '#FF8060' : 'var(--muted)',
                      border: '1px solid var(--fg)',
                    }} />
                  );
                })}
              </div>
              <div className="mono" style={{ fontSize: 9, marginTop: 4, color: 'var(--muted-fg)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{d.bitrate} · {
                  d.status === 'completed' ? <span style={{ color: 'var(--accent)', fontWeight: 700, mixBlendMode: 'difference' }}>✓ DONE</span> :
                  d.status === 'failed' ? <span style={{ color: 'var(--destructive)', fontWeight: 700 }}>✗ {d.error}</span> :
                  d.status === 'inQueue' ? 'WAITING' :
                  `${d.progress}% · 2.1 MB/S`
                }</span>
                {d.status === 'downloading' && <span>~{Math.round((100 - d.progress) / 10)}s</span>}
              </div>
            </div>
            <button style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted-fg)' }}>
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 18px', borderTop: '2px solid var(--fg)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--muted-fg)' }}>
          {ACTIVE_DOWNLOADS.filter(d => d.status === 'downloading' || d.status === 'inQueue').length} PENDING
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn size="sm" variant="ghost">PAUSE ALL</Btn>
          <Btn size="sm" variant="outline">CLEAR DONE</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── MINI PLAYER ───
function MiniPlayer({ onExpand }) {
  const { player, setLyricsOpen } = useApp();
  const t = player.currentTrack;
  if (!t) return null;

  return (
    <div style={{
      height: 80, borderTop: '3px solid var(--fg)',
      background: 'var(--card)',
      display: 'grid', gridTemplateColumns: '300px 1fr 300px',
      alignItems: 'center', padding: '0 20px', gap: 16,
    }}>
      {/* Track info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, cursor: 'pointer' }} onClick={onExpand}>
        <Cover seed={t.seed} title={t.title} size={56} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 2, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.artist}</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted-fg)' }}>
          <Icon name="heart" size={16} />
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Btn variant="ghost" size="iconSm" title="Shuffle"><Icon name="shuffle" size={14}/></Btn>
          <Btn variant="ghost" size="iconSm" title="Previous"><Icon name="prev" size={14}/></Btn>
          <Btn variant="primary" size="icon" onClick={player.toggle}>
            <Icon name={player.isPlaying ? 'pause' : 'play'} size={12} />
          </Btn>
          <Btn variant="ghost" size="iconSm" title="Next" onClick={player.next}><Icon name="next" size={14}/></Btn>
          <Btn variant="ghost" size="iconSm" title="Repeat"><Icon name="repeat" size={14}/></Btn>
        </div>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 520 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--muted-fg)', width: 36, textAlign: 'right' }}>{fmtTime(player.pos)}</span>
          <div style={{ flex: 1, height: 8, border: '2px solid var(--fg)', background: 'var(--bg)', position: 'relative', cursor: 'pointer' }}>
            <div style={{ height: '100%', width: `${(player.pos / t.duration) * 100}%`, background: 'var(--primary)', transition: 'width .3s linear' }} />
            <div style={{ position: 'absolute', top: -4, left: `calc(${(player.pos / t.duration) * 100}% - 6px)`, width: 12, height: 16, background: 'var(--fg)' }} />
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--muted-fg)', width: 36 }}>{fmtTime(t.duration)}</span>
        </div>
      </div>

      {/* Right: quality + volume */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <Badge tone="accent">{t.bitrate}</Badge>
        <Btn variant="ghost" size="iconSm" title="Lyrics" onClick={() => setLyricsOpen(true)}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>LRC</span>
        </Btn>
        <Btn variant="ghost" size="iconSm" title="Queue"><Icon name="queue" size={14}/></Btn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="volume" size={14} />
          <div style={{ width: 80, height: 6, border: '2px solid var(--fg)', background: 'var(--bg)' }}>
            <div style={{ height: '100%', width: `${player.volume}%`, background: 'var(--fg)' }}/>
          </div>
        </div>
        <Btn variant="outline" size="iconSm" onClick={onExpand} title="Full screen"><Icon name="fullscr" size={12}/></Btn>
      </div>
    </div>
  );
}

// ─── FULLSCREEN PLAYER ───
function FullscreenPlayer({ onClose }) {
  const { player, setLyricsOpen } = useApp();
  const { QUEUE } = window.DMX_DATA;
  const t = player.currentTrack;
  if (!t) return null;

  const palettes = window.DMX_DATA.COVER_PALETTES;
  const [pa, pb] = palettes[t.seed % palettes.length];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg)',
      display: 'grid', gridTemplateRows: 'auto 1fr auto',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '2px solid var(--fg)' }}>
        <div>
          <div className="lbl" style={{ color: 'var(--muted-fg)' }}>NOW PLAYING</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>FROM · <span style={{ color: 'var(--primary)' }}>{t.album}</span></div>
        </div>
        <Btn variant="outline" size="lg" onClick={onClose}><Icon name="collapse" size={14}/> COLLAPSE</Btn>
      </div>

      {/* Main */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, padding: 40, overflow: 'hidden' }}>
        {/* Left: cover */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Cover seed={t.seed} title={t.title} size={360} style={{ boxShadow: '10px 10px 0 var(--fg)', border: '4px solid var(--fg)' }} />
            {/* Accent mark */}
            <div style={{ position: 'absolute', top: -16, left: -16, width: 60, height: 60, background: 'var(--accent)', border: '3px solid var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 0 var(--fg)' }}>
              <Icon name="disc" size={28} />
            </div>
          </div>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div className="lbl" style={{ color: 'var(--muted-fg)', marginBottom: 8 }}>TRACK 03 · OF 14 · BITRATE {t.bitrate}</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 10 }}>{t.title}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted-fg)' }}>{t.artist}</div>
          </div>
        </div>

        {/* Right: lyrics / queue */}
        <div className="b sh" style={{ background: 'var(--card)', padding: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--fg)', marginBottom: 18, alignItems: 'stretch' }}>
            {['LYRICS', 'QUEUE', 'INFO'].map((tab, i) => (
              <button key={tab}
                style={{
                  padding: '8px 14px', border: 'none', borderRight: '2px solid var(--fg)',
                  background: i === 0 ? 'var(--fg)' : 'transparent',
                  color: i === 0 ? 'var(--bg)' : 'var(--fg)',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.12em', cursor: 'pointer',
                }}>{tab}</button>
            ))}
            <button onClick={() => setLyricsOpen(true)}
              style={{
                marginLeft: 'auto', padding: '8px 14px',
                border: 'none', borderLeft: '2px solid var(--fg)',
                background: 'var(--accent)', color: 'var(--fg)',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900,
                letterSpacing: '0.12em', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <Icon name="fullscr" size={12}/> SYNC MODE
            </button>
          </div>
          {/* Lyrics — synced feel */}
          <div style={{ flex: 1, overflow: 'hidden', fontSize: 18, lineHeight: 1.45, fontWeight: 600, letterSpacing: '-0.01em' }}>
            <p style={{ opacity: 0.35, margin: '0 0 10px' }}>HELLO DARLING, I WISH THE LIGHTS</p>
            <p style={{ opacity: 0.35, margin: '0 0 10px' }}>WOULD STOP FLICKERING — OUTSIDE</p>
            <p style={{ color: 'var(--primary)', fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', background: 'var(--accent)', padding: '4px 8px', display: 'inline-block', margin: '0 0 12px' }}>
              AND I KNOW YOU DON'T REALLY WANT TO STAY
            </p>
            <br/>
            <p style={{ opacity: 0.5, margin: '0 0 10px', fontSize: 22 }}>BUT BABY, GOOD LUCK</p>
            <p style={{ opacity: 0.5, margin: '0 0 10px' }}>I KNOW IT'S LATE BUT COULD</p>
            <p style={{ opacity: 0.35, margin: '0 0 10px' }}>YOU STAY A LITTLE LONGER?</p>
            <p style={{ opacity: 0.35, margin: '0 0 10px' }}>THERE'S A REASON I'M A-SKING</p>
            <p style={{ opacity: 0.2, margin: '0 0 10px' }}>─────────────────────────</p>
          </div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--muted-fg)', marginTop: 12, letterSpacing: '0.1em' }}>
            LYRICS PROVIDED BY MUSIXMATCH · SYNCED ◉
          </div>
        </div>
      </div>

      {/* Bottom: transport + waveform */}
      <div style={{ borderTop: '2px solid var(--fg)', padding: '20px 40px', background: 'var(--card)' }}>
        {/* Waveform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, width: 48 }}>{fmtTime(player.pos)}</span>
          <div style={{ flex: 1, height: 48, position: 'relative', display: 'flex', alignItems: 'center', gap: 1 }}>
            {Array.from({ length: 120 }).map((_, i) => {
              const h = 10 + Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.3) * 36);
              const pct = (i / 120) * 100;
              const past = pct <= (player.pos / t.duration) * 100;
              return (
                <div key={i} style={{
                  flex: 1, height: h,
                  background: past ? 'var(--primary)' : 'var(--muted)',
                  transition: 'background .2s',
                }}/>
              );
            })}
          </div>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, width: 48, textAlign: 'right' }}>{fmtTime(t.duration)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn variant="outline" size="sm"><Icon name="heart" size={12}/></Btn>
            <Btn variant="outline" size="sm"><Icon name="share" size={12}/></Btn>
            <Btn variant="outline" size="sm"><Icon name="download" size={12}/></Btn>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Btn variant="ghost" size="icon"><Icon name="shuffle" size={16}/></Btn>
            <Btn variant="outline" size="icon"><Icon name="prev" size={16}/></Btn>
            <Btn variant="primary" size="iconLg" onClick={player.toggle}>
              <Icon name={player.isPlaying ? 'pause' : 'play'} size={20} />
            </Btn>
            <Btn variant="outline" size="icon" onClick={player.next}><Icon name="next" size={16}/></Btn>
            <Btn variant="ghost" size="icon"><Icon name="repeat" size={16}/></Btn>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Badge tone="accent">FLAC · 1411KBPS</Badge>
            <Icon name="volume" size={16} />
            <div style={{ width: 120, height: 8, border: '2px solid var(--fg)', background: 'var(--bg)' }}>
              <div style={{ height: '100%', width: `${player.volume}%`, background: 'var(--fg)' }}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SHARE PAGE ───
function SharePage() {
  const t = window.DMX_DATA.TRACKS[0];
  return (
    <div className="dmx" style={{ minHeight: 900, background: 'var(--bg)', padding: 40 }}>
      {/* Header strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '3px solid var(--fg)', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, background: 'var(--primary)', border: '2px solid var(--fg)' }}/>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em' }}>DEEMIX</div>
        </div>
        <Btn variant="outline">OPEN IN APP <Icon name="ext" size={12}/></Btn>
      </div>

      {/* Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', marginBottom: 40 }}>
        <div style={{ position: 'relative' }}>
          <Cover seed={t.seed} title={t.title} size={420} style={{ boxShadow: '10px 10px 0 var(--fg)', border: '4px solid var(--fg)' }} />
          <div style={{
            position: 'absolute', top: -20, right: -20,
            background: 'var(--accent)', border: '3px solid var(--fg)',
            padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900,
            letterSpacing: '0.12em', transform: 'rotate(4deg)', boxShadow: '4px 4px 0 var(--fg)',
          }}>
            SHARED WITH YOU
          </div>
        </div>
        <div>
          <div className="lbl" style={{ color: 'var(--muted-fg)', marginBottom: 12 }}>TRACK · FLAC · 3:38</div>
          <h1 className="t-xl" style={{ margin: 0, marginBottom: 14 }}>{t.title}</h1>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>BY <span style={{ color: 'var(--primary)' }}>{t.artist}</span></div>
          <div style={{ fontSize: 14, marginBottom: 28, fontWeight: 500, color: 'var(--muted-fg)', maxWidth: '40ch' }}>
            FROM THE ALBUM <strong style={{ color: 'var(--fg)' }}>{t.album}</strong> ({t.year})
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
            <Btn variant="primary" size="lg"><Icon name="play" size={14}/> PLAY PREVIEW</Btn>
            <Btn variant="outline" size="lg"><Icon name="download" size={14}/> GET IT</Btn>
            <Btn variant="ghost" size="lg"><Icon name="share" size={14}/> COPY LINK</Btn>
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: '0.1em' }}>
            ← SHARED BY <strong style={{ color: 'var(--fg)' }}>@TITOO</strong> · 2 HOURS AGO
          </div>
        </div>
      </div>

      {/* Audio preview waveform */}
      <div className="b sh" style={{ background: 'var(--card)', padding: 24, marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Btn variant="primary" size="iconLg"><Icon name="play" size={16}/></Btn>
          <div style={{ flex: 1 }}>
            <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 2 }}>
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 10 + Math.abs(Math.sin(i * 0.5) * Math.cos(i * 0.2) * 40),
                  background: i < 20 ? 'var(--primary)' : 'var(--muted)',
                }} />
              ))}
            </div>
            <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--muted-fg)' }}>
              <span>0:42 / 3:38</span>
              <span>30-SECOND PREVIEW · GET APP FOR FULL TRACK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginBottom: 40 }}>
        {[
          { k: 'PLAYS', v: '218M' },
          { k: 'DOWNLOADS', v: '1.4K' },
          { k: 'YEAR', v: t.year },
          { k: 'BITRATE', v: 'FLAC' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: 20, borderTop: '2px solid var(--fg)', borderBottom: '2px solid var(--fg)',
            borderRight: i < 3 ? '2px solid var(--fg)' : 'none',
            borderLeft: i === 0 ? '2px solid var(--fg)' : 'none',
            background: i % 2 === 0 ? 'var(--card)' : 'var(--bg)',
          }}>
            <div className="lbl" style={{ color: 'var(--muted-fg)', marginBottom: 6 }}>{s.k}</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* CTA — massive */}
      <div className="b" style={{ background: 'var(--fg)', color: 'var(--bg)', padding: '40px 32px', boxShadow: '8px 8px 0 var(--primary)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div className="lbl" style={{ color: 'var(--accent)', marginBottom: 10 }}>SELF-HOSTED · OPEN-SOURCE · FLAC</div>
            <div className="t-lg" style={{ margin: 0, marginBottom: 8 }}>DOWNLOAD YOUR LIBRARY.</div>
            <div style={{ fontSize: 16, maxWidth: '52ch', opacity: 0.8, fontWeight: 500 }}>
              DEEMIX IS A DESKTOP APP FOR DOWNLOADING HIGH-QUALITY MUSIC FROM DEEZER. NO ACCOUNTS. NO ADS. YOUR FILES, YOUR DISK.
            </div>
          </div>
          <Btn variant="accent" size="lg" style={{ height: 64, padding: '0 32px', fontSize: 16 }}>GET DEEMIX →</Btn>
        </div>
      </div>

      {/* footer */}
      <div className="mono" style={{ textAlign: 'center', padding: '40px 0 0', fontSize: 10, color: 'var(--muted-fg)', letterSpacing: '0.14em' }}>
        DEEMIX.APP / TRACK / T01 · NOT AFFILIATED WITH DEEZER
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───
function LoginPage() {
  return (
    <div className="dmx" style={{ minHeight: 900, background: 'var(--bg)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left: brutalist collage */}
      <div style={{ background: 'var(--fg)', padding: 48, color: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Repeating label bg */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, fontSize: 80, fontWeight: 900, whiteSpace: 'nowrap', letterSpacing: '-0.03em', lineHeight: 0.9, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i}>DEEMIX · DEEMIX · DEEMIX · DEEMIX</div>
          ))}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
          <div style={{ width: 28, height: 28, background: 'var(--primary)', border: '2px solid var(--bg)' }}/>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>DEEMIX</div>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="lbl" style={{ color: 'var(--accent)', marginBottom: 20 }}>V0.1.0 · OPEN-SOURCE · SELF-HOSTED</div>
          <h1 style={{ fontSize: 80, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.88, margin: 0 }}>
            OWN YOUR<br/>
            <span style={{ background: 'var(--primary)', color: '#fff', padding: '0 10px' }}>LIBRARY.</span>
          </h1>
          <p style={{ fontSize: 18, maxWidth: '38ch', marginTop: 24, opacity: 0.8, fontWeight: 500, lineHeight: 1.4 }}>
            DOWNLOAD LOSSLESS FLAC FROM DEEZER. NO ACCOUNTS. NO STREAMS. JUST FILES ON YOUR DISK.
          </p>

          <div style={{ marginTop: 40, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['FLAC / 1411 KBPS', '3× CONCURRENT DOWNLOADS', 'ALBUMS · PLAYLISTS · ARTISTS', 'LYRICS SYNCED', 'SPOTIFY IMPORT'].map(f => (
              <div key={f} className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', padding: '6px 10px', border: '2px solid var(--bg)', background: 'transparent' }}>
                ▸ {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginTop: 40, fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.1em' }}>
          <span>GITHUB.COM/TITOO-DEV/MUSIC</span>
          <span>APR 2026</span>
        </div>
      </div>

      {/* Right: login form */}
      <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 560 }}>
        <div className="lbl" style={{ color: 'var(--muted-fg)', marginBottom: 12 }}>STEP 01 / 01 · CONNECT DEEZER</div>
        <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, marginBottom: 14 }}>LOG IN.</h2>
        <p style={{ fontSize: 14, color: 'var(--muted-fg)', marginBottom: 36, fontWeight: 500, maxWidth: '44ch', lineHeight: 1.5 }}>
          PASTE YOUR DEEZER ARL COOKIE TO AUTHORIZE DOWNLOADS. WE NEVER SEND THIS VALUE TO ANY SERVER — IT STAYS ON YOUR MACHINE.
        </p>

        <div style={{ marginBottom: 18 }}>
          <label className="lbl" style={{ marginBottom: 6, display: 'block' }}>EMAIL OR USERNAME</label>
          <input type="text" defaultValue="titoo-dev@gmail.com"
            style={{
              width: '100%', border: '2px solid var(--fg)', padding: '14px 16px',
              fontSize: 15, fontWeight: 600, outline: 'none', boxShadow: 'var(--shadow-brutal-sm)',
              background: 'var(--card)', fontFamily: 'var(--font-sans)',
            }}/>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label className="lbl" style={{ marginBottom: 6, display: 'block' }}>PASSWORD</label>
          <input type="password" defaultValue="••••••••••••••"
            style={{
              width: '100%', border: '2px solid var(--fg)', padding: '14px 16px',
              fontSize: 15, fontWeight: 600, outline: 'none', boxShadow: 'var(--shadow-brutal-sm)',
              background: 'var(--card)', fontFamily: 'var(--font-sans)',
            }}/>
        </div>

        <div className="b" style={{ padding: '14px 16px', background: 'var(--card)', marginBottom: 24, display: 'flex', gap: 10, boxShadow: 'var(--shadow-brutal-sm)' }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--fg)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Icon name="check" size={10} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: 'var(--muted-fg)' }}>
            <strong style={{ color: 'var(--fg)' }}>REMEMBER CREDENTIALS</strong> · STORED LOCALLY IN ENCRYPTED KEYSTORE. AUTO-REFRESH EVERY 30 DAYS.
          </div>
        </div>

        <Btn variant="primary" size="lg" style={{ width: '100%', height: 64, fontSize: 16 }}>
          CONNECT DEEZER ACCOUNT →
        </Btn>

        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 2, background: 'var(--fg)' }}/>
          <span className="lbl" style={{ color: 'var(--muted-fg)' }}>OR</span>
          <div style={{ flex: 1, height: 2, background: 'var(--fg)' }}/>
        </div>

        <Btn variant="outline" size="lg" style={{ width: '100%', height: 52 }}>
          PASTE ARL COOKIE DIRECTLY
        </Btn>

        <div className="mono" style={{ marginTop: 40, fontSize: 10, color: 'var(--muted-fg)', lineHeight: 1.6, letterSpacing: '0.08em' }}>
          BY CONTINUING YOU AGREE THIS IS A SELF-HOSTED TOOL. RESPECT ARTIST RIGHTS.<br/>
          DEEMIX IS NOT AFFILIATED WITH DEEZER S.A.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, TopBar, DownloadsPanel, MiniPlayer, FullscreenPlayer, SharePage, LoginPage });
