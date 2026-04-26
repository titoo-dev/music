// Primitives — buttons, icons, covers, EQ indicator, badges
// These compose the brutalist vocabulary across all screens.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── COVER ART — geometric brutalist placeholder ───
// Real app uses Deezer CDN URLs; for the prototype we generate deterministic
// colored covers so every card reads as a distinct "album."
function Cover({ seed = 0, title = '', size = 64, className = '', style = {} }) {
  const palettes = window.DMX_DATA.COVER_PALETTES;
  const [a, b] = palettes[seed % palettes.length];
  const letter = (title || '?').charAt(0);
  const pattern = seed % 4; // 0 split, 1 stripes, 2 diag, 3 circle
  const numSize = typeof size === 'number' ? size : 64;

  return (
    <div
      className={`dmx-cover ${className}`}
      style={{
        width: size, height: size, background: a, position: 'relative',
        border: '2px solid var(--border)', overflow: 'hidden',
        flexShrink: 0, ...style,
      }}
    >
      {pattern === 0 && (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)` }} />
      )}
      {pattern === 1 && (
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(90deg, ${a} 0 ${numSize/8}px, ${b} ${numSize/8}px ${numSize/4}px)` }} />
      )}
      {pattern === 2 && (
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(-45deg, ${a} 0 ${numSize/6}px, ${b} ${numSize/6}px ${numSize/3}px)` }} />
      )}
      {pattern === 3 && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: a }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '70%', height: '70%', borderRadius: '50%', background: b,
          }} />
        </>
      )}
      <div style={{
        position: 'absolute', bottom: 4, right: 6,
        fontFamily: 'var(--font-mono)', fontSize: Math.max(10, numSize/9),
        color: '#0d0d0d', fontWeight: 700, letterSpacing: '0.05em',
        mixBlendMode: 'difference', filter: 'invert(1)',
      }}>{letter}</div>
    </div>
  );
}

// ─── BUTTON ───
function Btn({ children, variant = 'default', size = 'md', className = '', onClick, disabled, title, style = {}, ...rest }) {
  const variants = {
    default: { bg: 'var(--fg)', color: 'var(--bg)', border: 'var(--fg)' },
    primary: { bg: 'var(--primary)', color: '#fff', border: 'var(--fg)' },
    accent:  { bg: 'var(--accent)', color: 'var(--fg)', border: 'var(--fg)' },
    ghost:   { bg: 'transparent', color: 'var(--fg)', border: 'transparent' },
    outline: { bg: 'var(--card)', color: 'var(--fg)', border: 'var(--fg)' },
  }[variant];
  const sizes = {
    sm: { height: 28, px: 10, fs: 11 },
    md: { height: 36, px: 14, fs: 12 },
    lg: { height: 48, px: 20, fs: 14 },
    icon: { height: 36, width: 36, px: 0, fs: 12 },
    iconSm: { height: 28, width: 28, px: 0, fs: 11 },
    iconLg: { height: 56, width: 56, px: 0, fs: 14 },
  }[size];

  const isGhost = variant === 'ghost';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 6,
        height: sizes.height, width: sizes.width, padding: `0 ${sizes.px}px`,
        fontFamily: 'var(--font-sans)', fontSize: sizes.fs, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        background: variants.bg, color: variants.color,
        border: isGhost ? '2px solid transparent' : 'var(--border-w) solid var(--border)',
        borderRadius: 0, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        boxShadow: isGhost ? 'none' : 'var(--shadow-brutal-sm)',
        transition: 'box-shadow .1s, transform .1s, background .08s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled || isGhost) return;
        e.currentTarget.style.boxShadow = 'var(--shadow-brutal)';
        e.currentTarget.style.transform = 'translate(-1px, -1px)';
      }}
      onMouseLeave={(e) => {
        if (disabled || isGhost) return;
        e.currentTarget.style.boxShadow = 'var(--shadow-brutal-sm)';
        e.currentTarget.style.transform = 'translate(0, 0)';
      }}
      onMouseDown={(e) => {
        if (disabled || isGhost) return;
        e.currentTarget.style.boxShadow = 'var(--shadow-brutal-active)';
        e.currentTarget.style.transform = 'translate(1px, 1px)';
      }}
      onMouseUp={(e) => {
        if (disabled || isGhost) return;
        e.currentTarget.style.boxShadow = 'var(--shadow-brutal)';
        e.currentTarget.style.transform = 'translate(-1px, -1px)';
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── ICONS — minimal line set, drawn inline ───
function Icon({ name, size = 16, strokeWidth = 2.4, style = {} }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  switch (name) {
    case 'play':    return <svg {...common} fill="currentColor" stroke="none" viewBox="0 0 12 12"><path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" /></svg>;
    case 'pause':   return <svg {...common} fill="currentColor" stroke="none" viewBox="0 0 12 12"><rect x="1" y="1" width="3.5" height="10"/><rect x="7.5" y="1" width="3.5" height="10"/></svg>;
    case 'next':    return <svg {...common} fill="currentColor" stroke="none"><rect x="19" y="4" width="3" height="16"/><path d="M2 4L15 12L2 20V4Z"/></svg>;
    case 'prev':    return <svg {...common} fill="currentColor" stroke="none"><rect x="2" y="4" width="3" height="16"/><path d="M22 4L9 12L22 20V4Z"/></svg>;
    case 'shuffle': return <svg {...common}><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
    case 'repeat':  return <svg {...common}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
    case 'home':    return <svg {...common}><path d="M3 12L12 4l9 8"/><path d="M5 10v10h14V10"/></svg>;
    case 'search':  return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>;
    case 'library': return <svg {...common}><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="11"/><line x1="14" y1="18" x2="21" y2="18"/><line x1="14" y1="21" x2="21" y2="21"/></svg>;
    case 'history': return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 10 9 10"/><path d="M12 7v5l3 2"/></svg>;
    case 'settings':return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>;
    case 'download':return <svg {...common}><path d="M12 3v13"/><polyline points="6 11 12 17 18 11"/><path d="M4 21h16"/></svg>;
    case 'check':   return <svg {...common}><polyline points="4 12 10 18 20 6"/></svg>;
    case 'x':       return <svg {...common}><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>;
    case 'menu':    return <svg {...common}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    case 'more':    return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></svg>;
    case 'share':   return <svg {...common}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>;
    case 'plus':    return <svg {...common}><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>;
    case 'volume':  return <svg {...common}><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
    case 'heart':   return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>;
    case 'info':    return <svg {...common}><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11"/><circle cx="12" cy="8" r="0.8" fill="currentColor"/></svg>;
    case 'fullscr': return <svg {...common}><polyline points="4 14 4 20 10 20"/><polyline points="20 10 20 4 14 4"/><line x1="4" y1="20" x2="10" y2="14"/><line x1="20" y1="4" x2="14" y2="10"/></svg>;
    case 'collapse':return <svg {...common}><polyline points="14 4 20 4 20 10"/><polyline points="10 20 4 20 4 14"/><line x1="20" y1="4" x2="14" y2="10"/><line x1="4" y1="20" x2="10" y2="14"/></svg>;
    case 'chev-r':  return <svg {...common}><polyline points="9 6 15 12 9 18"/></svg>;
    case 'chev-d':  return <svg {...common}><polyline points="6 9 12 15 18 9"/></svg>;
    case 'ext':     return <svg {...common}><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>;
    case 'queue':   return <svg {...common}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>;
    case 'loader':  return <svg {...common}><circle cx="12" cy="12" r="9" strokeDasharray="40 20" ><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>;
    case 'alert':   return <svg {...common}><path d="M12 3L2 20h20L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/></svg>;
    case 'disc':    return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/></svg>;
    case 'mic':     return <svg {...common}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="21"/></svg>;
    case 'filter':  return <svg {...common}><polygon points="22 3 2 3 10 13 10 20 14 22 14 13 22 3"/></svg>;
    case 'arrow-r': return <svg {...common}><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>;
    case 'clock':   return <svg {...common}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>;
    case 'bolt':    return <svg {...common} fill="currentColor" stroke="none"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>;
    default: return <svg {...common}></svg>;
  }
}

// ─── PLAYBACK EQ (animated bars) ───
function PlaybackEQ({ color = 'var(--primary)', style = {} }) {
  return (
    <span className="eq" style={{ color, ...style }}>
      <span/><span/><span/><span/>
    </span>
  );
}

// ─── BADGE — stamp-like label ───
function Badge({ children, tone = 'default', style = {} }) {
  const tones = {
    default: { bg: 'var(--fg)', color: 'var(--bg)' },
    accent:  { bg: 'var(--accent)', color: 'var(--fg)' },
    primary: { bg: 'var(--primary)', color: '#fff' },
    muted:   { bg: 'var(--muted)', color: 'var(--fg)' },
    card:    { bg: 'var(--card)', color: 'var(--fg)', border: '2px solid var(--fg)' },
  }[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 6px',
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      background: tones.bg, color: tones.color, border: tones.border || 'none',
      ...style,
    }}>{children}</span>
  );
}

// ─── Utility: fmt time seconds -> m:ss ───
function fmtTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}
function fmtDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

Object.assign(window, { Cover, Btn, Icon, PlaybackEQ, Badge, fmtTime, fmtDuration, fmtDate });
