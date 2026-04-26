// Lyrics views — floating panel + 2 full-page variants
// Design language stays brutalist: hard borders, mono labels, primary accent on the active line.

const { useEffect: useEffectL, useState: useStateL, useRef: useRefL, useMemo: useMemoL } = React;

// ─── shared: parse + find active line ───
function useActiveLine(lines, pos) {
  return useMemoL(() => {
    let active = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].t <= pos) active = i;
      else break;
    }
    return active;
  }, [lines, pos]);
}

// Auto-scroll a line into vertical center of its container
function useAutoScroll(refMap, activeIdx, containerRef) {
  useEffectL(() => {
    const el = refMap.current[activeIdx];
    const c = containerRef.current;
    if (!el || !c) return;
    const elRect = el.getBoundingClientRect();
    const cRect = c.getBoundingClientRect();
    const offset = elRect.top - cRect.top - cRect.height / 2 + elRect.height / 2;
    c.scrollTo({ top: c.scrollTop + offset, behavior: 'smooth' });
  }, [activeIdx]);
}

// Cover swatch reused (same gradient logic as Cover primitive)
function coverGradient(seed) {
  const palettes = window.DMX_DATA.COVER_PALETTES;
  const [a, b] = palettes[seed % palettes.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

// ════════════════════════════════════════════════════════════════════
// FLOATING PANEL — right-docked overlay over the app
// ════════════════════════════════════════════════════════════════════
function LyricsPanel({ track, pos, onClose }) {
  const lines = window.DMX_DATA.LYRICS[track.id] || window.DMX_DATA.LYRICS.t01;
  const active = useActiveLine(lines, pos);
  const containerRef = useRefL(null);
  const lineRefs = useRefL({});
  useAutoScroll(lineRefs, active, containerRef);

  const mins = Math.floor(track.duration / 60);
  const secs = String(track.duration % 60).padStart(2, '0');

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 72, // leave space for mini player
      width: 420, background: '#FBFAF7',
      borderLeft: '3px solid #0D0D0D',
      boxShadow: '-8px 0 0 rgba(13,13,13,0.06)',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, fontFamily: '"Space Grotesk", system-ui, sans-serif',
    }}>
      {/* header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '3px solid #0D0D0D',
        background: '#F0EBE3',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, background: coverGradient(track.seed),
          border: '2px solid #0D0D0D', flexShrink: 0,
        }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.18em', color: '#6B6560' }}>
            NOW PLAYING · LYRICS
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track.title}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#6B6560', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track.artist}
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, border: '2px solid #0D0D0D', background: '#fff',
          cursor: 'pointer', fontSize: 16, fontWeight: 800, lineHeight: 1, padding: 0,
          fontFamily: 'JetBrains Mono, monospace',
        }}>×</button>
      </div>

      {/* progress strip */}
      <div style={{
        padding: '8px 18px',
        borderBottom: '2px solid #0D0D0D',
        background: '#fff',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
        letterSpacing: '0.12em', color: '#6B6560',
      }}>
        <span>SYNCED · LRC</span>
        <span>{Math.floor(pos/60)}:{String(pos%60).padStart(2,'0')} / {mins}:{secs}</span>
      </div>

      {/* lyrics */}
      <div ref={containerRef} style={{
        flex: 1, overflowY: 'auto', padding: '40% 24px',
        scrollbarWidth: 'thin',
      }}>
        {lines.map((l, i) => {
          const isActive = i === active;
          const isPast = i < active;
          const isTag = l.kind === 'tag';
          const isEmpty = l.line === '';
          if (isEmpty) return <div key={i} style={{ height: 14 }} ref={el => lineRefs.current[i] = el}/>;
          if (isTag) return (
            <div key={i} ref={el => lineRefs.current[i] = el} style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
              color: isActive ? 'var(--primary)' : '#6B6560',
              padding: '12px 0 6px',
              borderTop: '1px solid #E4E0D7',
              marginTop: 8,
            }}>{l.line}</div>
          );
          return (
            <div key={i} ref={el => lineRefs.current[i] = el} style={{
              fontSize: isActive ? 22 : 18,
              fontWeight: isActive ? 800 : 600,
              lineHeight: 1.35,
              letterSpacing: isActive ? '-0.015em' : '-0.005em',
              color: isActive ? '#0D0D0D' : (isPast ? '#B4ADA3' : '#0D0D0D'),
              opacity: isActive ? 1 : (isPast ? 0.4 : 0.65),
              padding: '6px 0',
              transition: 'all 280ms cubic-bezier(0.2, 0.7, 0.3, 1)',
              textWrap: 'balance',
              position: 'relative',
            }}>
              {isActive && (
                <span style={{
                  position: 'absolute', left: -12, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 4, height: 22, background: 'var(--primary)',
                }}/>
              )}
              {l.line}
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div style={{
        padding: '10px 18px', borderTop: '2px solid #0D0D0D',
        background: '#0D0D0D', color: '#F0EBE3',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.14em', display: 'flex', justifyContent: 'space-between',
      }}>
        <span>SOURCE · MUSIXMATCH</span>
        <span>↗ POP OUT</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// FULL PAGE — VARIANT A — "THEATRE"
// Dark immersive room. Blurred cover backdrop. Big serif-ish display lines.
// ════════════════════════════════════════════════════════════════════
function LyricsTheatre({ track, pos, onClose }) {
  const lines = window.DMX_DATA.LYRICS[track.id] || window.DMX_DATA.LYRICS.t01;
  const active = useActiveLine(lines, pos);
  const containerRef = useRefL(null);
  const lineRefs = useRefL({});
  useAutoScroll(lineRefs, active, containerRef);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: '#0D0D0D',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      color: '#F0EBE3', overflow: 'hidden',
    }}>
      {/* Atmospheric backdrop — large blurred cover */}
      <div style={{
        position: 'absolute', inset: '-10%',
        background: coverGradient(track.seed),
        filter: 'blur(120px) saturate(1.4)',
        opacity: 0.55,
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(13,13,13,0) 0%, rgba(13,13,13,0.85) 80%)',
      }}/>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
        padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: '1px solid rgba(240,235,227,0.1)',
      }}>
        <div style={{
          width: 44, height: 44, background: coverGradient(track.seed),
          border: '2px solid #F0EBE3', flexShrink: 0,
        }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(240,235,227,0.55)' }}>
            LYRICS · THEATRE MODE
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>
            {track.title} <span style={{ opacity: 0.5, fontWeight: 500 }}>— {track.artist}</span>
          </div>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', color: 'rgba(240,235,227,0.7)',
          padding: '6px 12px', border: '1px solid rgba(240,235,227,0.25)',
        }}>
          {Math.floor(pos/60)}:{String(pos%60).padStart(2,'0')} / {Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')}
        </div>
        <button onClick={onClose} style={{
          width: 36, height: 36, border: '2px solid #F0EBE3', background: 'transparent',
          color: '#F0EBE3', cursor: 'pointer', fontSize: 18, fontWeight: 800, lineHeight: 1,
          fontFamily: 'JetBrains Mono, monospace',
        }}>×</button>
      </div>

      {/* Lyrics column */}
      <div ref={containerRef} style={{
        position: 'absolute', top: 84, bottom: 80, left: 0, right: 0,
        overflowY: 'auto', padding: '35vh 8vw',
        scrollbarWidth: 'none',
      }}>
        <style>{`.theatre-scroll::-webkit-scrollbar { display: none; }`}</style>
        {lines.map((l, i) => {
          const isActive = i === active;
          const isPast = i < active;
          const isFuture = i > active;
          const distance = Math.abs(i - active);
          const isTag = l.kind === 'tag';
          const isEmpty = l.line === '';
          if (isEmpty) return <div key={i} style={{ height: 24 }} ref={el => lineRefs.current[i] = el}/>;
          if (isTag) return (
            <div key={i} ref={el => lineRefs.current[i] = el} style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.3em',
              color: isActive ? 'var(--accent)' : 'rgba(240,235,227,0.35)',
              padding: '24px 0 8px',
              opacity: distance > 4 ? 0.3 : 1,
              transition: 'all 400ms ease',
            }}>— {l.line.replace(/[\[\]]/g, '').trim()} —</div>
          );
          return (
            <div key={i} ref={el => lineRefs.current[i] = el} style={{
              fontSize: isActive ? 56 : 38,
              fontWeight: isActive ? 800 : 600,
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
              color: '#F0EBE3',
              opacity: isActive ? 1 : (isPast ? 0.22 : 0.55) * (distance > 5 ? 0.5 : 1),
              filter: isActive ? 'none' : (distance > 3 ? `blur(${Math.min(distance - 2, 4)}px)` : 'none'),
              padding: '12px 0',
              transition: 'all 380ms cubic-bezier(0.2, 0.7, 0.3, 1)',
              textWrap: 'balance',
              transform: isActive ? 'translateX(0)' : 'translateX(0)',
            }}>
              {l.line}
            </div>
          );
        })}
      </div>

      {/* Bottom progress */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
        padding: '18px 32px',
        background: 'linear-gradient(to top, #0D0D0D, transparent)',
      }}>
        <div style={{
          height: 3, background: 'rgba(240,235,227,0.15)', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${(pos / track.duration) * 100}%`,
            background: 'var(--primary)',
          }}/>
          <div style={{
            position: 'absolute', top: -4, left: `${(pos / track.duration) * 100}%`,
            width: 11, height: 11, background: 'var(--primary)',
            border: '2px solid #F0EBE3', transform: 'translateX(-50%)',
          }}/>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// FULL PAGE — VARIANT B — "KARAOKE STRIP"
// Brutalist horizontal strip. Single line at a time, huge. Per-word fill.
// ════════════════════════════════════════════════════════════════════
function LyricsKaraoke({ track, pos, onClose }) {
  const lines = window.DMX_DATA.LYRICS[track.id] || window.DMX_DATA.LYRICS.t01;
  const active = useActiveLine(lines, pos);

  // Find next non-empty / non-tag line
  const findNext = (start, dir = 1) => {
    let i = start;
    while (i >= 0 && i < lines.length) {
      if (lines[i].line !== '' && lines[i].kind !== 'tag') return i;
      i += dir;
    }
    return -1;
  };

  const currentIdx = active >= 0 ? (lines[active]?.line === '' || lines[active]?.kind === 'tag' ? findNext(active - 1, -1) : active) : -1;
  const nextIdx = findNext(currentIdx + 1, 1);
  const prevIdx = findNext(currentIdx - 1, -1);

  const current = currentIdx >= 0 ? lines[currentIdx] : { line: '...', t: 0 };
  const next = nextIdx >= 0 ? lines[nextIdx] : null;
  const prev = prevIdx >= 0 ? lines[prevIdx] : null;

  // Per-word progress for current line
  const lineEnd = nextIdx >= 0 ? lines[nextIdx].t : track.duration;
  const lineProgress = currentIdx >= 0 ? Math.max(0, Math.min(1, (pos - current.t) / (lineEnd - current.t))) : 0;
  const words = current.line.split(/(\s+)/);
  const wordCount = words.filter(w => w.trim()).length;
  const filledWords = Math.floor(lineProgress * wordCount);

  let wordIdx = 0;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: '#F0EBE3',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      color: '#0D0D0D', overflow: 'hidden',
    }}>
      {/* Top brutalist bar */}
      <div style={{
        background: '#0D0D0D', color: '#F0EBE3',
        padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: '4px solid #0D0D0D',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.2em', padding: '4px 10px',
          background: 'var(--primary)', color: '#F0EBE3',
        }}>● KARAOKE</div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {track.title} <span style={{ opacity: 0.5, fontWeight: 500, marginLeft: 12 }}>{track.artist}</span>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        }}>
          LINE {currentIdx + 1} / {lines.filter(l => l.line && l.kind !== 'tag').length}
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, border: '2px solid #F0EBE3', background: 'transparent',
          color: '#F0EBE3', cursor: 'pointer', fontSize: 14, fontWeight: 800, lineHeight: 1,
          fontFamily: 'JetBrains Mono, monospace',
        }}>×</button>
      </div>

      {/* Previous line — small, faded, top */}
      <div style={{
        padding: '40px 60px 0', minHeight: 80,
        fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em',
        color: '#6B6560', opacity: 0.4, textWrap: 'balance', textAlign: 'center',
      }}>
        {prev?.line || ''}
      </div>

      {/* Active line — center stage */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 60px', position: 'relative',
      }}>
        {/* Big tick marks at edges */}
        <div style={{
          position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)',
          fontSize: 80, fontWeight: 900, color: 'var(--primary)',
          fontFamily: 'JetBrains Mono, monospace', lineHeight: 0.8,
        }}>►</div>
        <div style={{
          fontSize: 88, fontWeight: 900, lineHeight: 1.05,
          letterSpacing: '-0.035em', textAlign: 'center', textWrap: 'balance',
          textTransform: 'uppercase', maxWidth: 1100,
        }}>
          {words.map((w, i) => {
            if (!w.trim()) return <span key={i}>{w}</span>;
            const myIdx = wordIdx++;
            const isFilled = myIdx < filledWords;
            const isCurrent = myIdx === filledWords;
            return (
              <span key={i} style={{
                color: isFilled ? 'var(--primary)' : '#0D0D0D',
                opacity: isFilled || isCurrent ? 1 : 0.35,
                textDecoration: isCurrent ? 'underline' : 'none',
                textDecorationThickness: '6px',
                textUnderlineOffset: '12px',
                textDecorationColor: 'var(--primary)',
                transition: 'all 200ms ease',
              }}>{w}</span>
            );
          })}
        </div>
      </div>

      {/* Next line — small, peeking, bottom */}
      <div style={{
        padding: '0 60px 24px', minHeight: 80,
        fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em',
        color: '#6B6560', opacity: 0.55, textWrap: 'balance', textAlign: 'center',
      }}>
        {next?.line || ''}
      </div>

      {/* Bottom: ticker + progress */}
      <div style={{
        background: '#0D0D0D', color: '#F0EBE3',
        padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16,
        borderTop: '4px solid #0D0D0D',
      }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em' }}>
          {String(Math.floor(pos/60)).padStart(2,'0')}:{String(pos%60).padStart(2,'0')}
        </span>
        <div style={{ flex: 1, height: 6, background: 'rgba(240,235,227,0.18)', position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0, width: `${(pos / track.duration) * 100}%`,
            background: 'var(--primary)',
          }}/>
          {/* tick marks at line boundaries */}
          {lines.filter(l => l.line && l.kind !== 'tag').map((l, i) => (
            <div key={i} style={{
              position: 'absolute', top: -2, left: `${(l.t / track.duration) * 100}%`,
              width: 2, height: 10, background: 'rgba(240,235,227,0.4)',
            }}/>
          ))}
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em' }}>
          {String(Math.floor(track.duration/60)).padStart(2,'0')}:{String(track.duration%60).padStart(2,'0')}
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { LyricsPanel, LyricsTheatre, LyricsKaraoke });
