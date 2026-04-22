import { useEffect, useRef, useState } from 'react';
import { getLevelsFromFirestore, type FullLevelDoc } from '../services/levelService';
import { getCompleted, getCapital, getPortfolioTotal } from '../utils/storage';
import { navigate } from '../utils/router';

interface Props { selectedLevelId?: number; }

const RISK_COLORS: Record<string, { hex: string; bg: string; border: string }> = {
  Foundation:  { hex: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.4)'  },
  Measured:    { hex: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.4)'  },
  Speculative: { hex: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)' },
  Frontier:    { hex: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)' },
  Abyssal:     { hex: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)'  },
};

// Alternate nodes: odd levels on left column, even on right column
function nodeLeft(lvlId: number): string {
  return lvlId % 2 === 1 ? '23%' : '67%';
}

export default function Explore({ selectedLevelId }: Props) {
  const [levels, setLevels] = useState<FullLevelDoc[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | undefined>(selectedLevelId);
  const [toast, setToast] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getLevelsFromFirestore()
      .then(data => setLevels(data))
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, []);

  useEffect(() => { setCompleted(getCompleted()); }, []);

  // Scroll to bottom (level 1) once levels have loaded and rendered
  useEffect(() => {
    if (!levelsLoading && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [levelsLoading]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleLevelClick(lvlId: number) {
    const isLocked = lvlId >= 2 && !completed.includes(lvlId - 1);
    if (isLocked) { showToast(`Complete Level ${lvlId - 1} first`); return; }
    setSelected(s => s === lvlId ? undefined : lvlId);
  }

  function handleEnterLevel(lvlId: number) {
    const capital = getCapital();
    const portfolioTotal = getPortfolioTotal();
    navigate('level', { level: lvlId, capital, portfolio_total: portfolioTotal });
  }

  const selectedLevel = selected ? (levels.find(l => l.id === selected) ?? null) : null;

  const NODE_H = 110;
  const TOP_PAD = 80;
  const mapH = TOP_PAD + levels.length * NODE_H + 80;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* ── Top bar ── */}
      <div style={{
        flexShrink: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '52px',
        background: 'var(--bg-nav)', borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(8px)',
      }}>
        <button className="btn-secondary" onClick={() => navigate('home')} style={{ padding: '6px 16px', fontSize: '11px' }}>
          ← BACK
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--color-cyan)' }}>
          LEVEL SELECT
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          {levelsLoading ? 'LOADING…' : `${completed.length} / ${levels.length} DONE`}
        </span>
      </div>

      {/* ── Body: map + panel ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Scrollable map ── */}
        <div
          ref={containerRef}
          style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative',
            transition: 'margin-right 200ms ease',
            marginRight: selectedLevel ? '300px' : '0',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: `${mapH}px` }}>

            {/* ── Center spine line ── */}
            <div style={{
              position: 'absolute',
              left: '50%', top: `${TOP_PAD + 20}px`,
              width: '2px', height: `${levels.length * NODE_H - 20}px`,
              background: 'linear-gradient(to bottom, transparent, rgba(56,189,248,0.15) 5%, rgba(56,189,248,0.15) 95%, transparent)',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }} />

            {levelsLoading ? (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.18em' }}>
                LOADING LEVELS…
              </div>
            ) : levels.length === 0 ? (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px' }}>NO LEVELS FOUND</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Use the Admin panel to seed levels to Firebase.</div>
              </div>
            ) : null}

            {/* ── Level nodes — reversed so L1 is at bottom ── */}
            {[...levels].reverse().map((lvl, idx) => {
              const isLocked = lvl.id >= 2 && !completed.includes(lvl.id - 1);
              const isDone   = completed.includes(lvl.id);
              const isSel    = selected === lvl.id;
              const rc       = RISK_COLORS[lvl.risk] ?? RISK_COLORS.Measured;
              const topPx    = TOP_PAD + idx * NODE_H;
              const leftPos  = nodeLeft(lvl.id);

              // Connector from node to spine
              const isLeft   = lvl.id % 2 === 1;

              return (
                <div
                  key={lvl.id}
                  style={{
                    position: 'absolute', top: `${topPx}px`, left: leftPos,
                    transform: 'translateX(-50%)',
                    animation: `nodeAppear 0.3s ease ${Math.min(idx, 15) * 20}ms both`,
                  }}
                >
                  {/* Horizontal connector to spine */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: isLeft ? '100%' : 'auto',
                    right: isLeft ? 'auto' : '100%',
                    width: `calc(50% - ${isLeft ? '23%' : '33%'})`,
                    height: '1px',
                    background: isSel
                      ? 'rgba(56,189,248,0.35)'
                      : isDone
                        ? `${rc.hex}44`
                        : 'rgba(56,189,248,0.1)',
                    pointerEvents: 'none',
                    minWidth: '40px',
                  }} />

                  <button
                    onClick={() => handleLevelClick(lvl.id)}
                    disabled={isLocked}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: isSel ? rc.bg : isDone ? 'rgba(56,189,248,0.06)' : 'var(--bg-card)',
                      border: `1.5px solid ${isSel ? rc.border : isDone ? `${rc.hex}55` : 'var(--border-dim)'}`,
                      borderRadius: '10px',
                      padding: '10px 14px',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.28 : 1,
                      transition: 'all 150ms ease',
                      width: '160px',
                      boxShadow: isSel ? `0 0 20px ${rc.hex}30, 0 4px 20px rgba(0,0,0,0.4)` : isDone ? `0 0 8px ${rc.hex}20` : 'none',
                      backdropFilter: 'blur(6px)',
                    }}
                    onMouseEnter={e => { if (!isLocked) { e.currentTarget.style.borderColor = rc.border; e.currentTarget.style.transform = 'scale(1.04)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isSel ? rc.border : isDone ? `${rc.hex}55` : 'var(--border-dim)'; e.currentTarget.style.transform = ''; }}
                  >
                    {/* Circle badge */}
                    <div style={{
                      flexShrink: 0, width: '38px', height: '38px', borderRadius: '50%',
                      background: isDone ? rc.bg : isSel ? rc.bg : 'rgba(56,189,248,0.08)',
                      border: `2px solid ${isSel || isDone ? rc.hex : 'rgba(56,189,248,0.25)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 900,
                      color: isSel || isDone ? rc.hex : 'var(--text-secondary)',
                      textShadow: isSel ? `0 0 10px ${rc.hex}` : 'none',
                    }}>
                      {isDone ? '✓' : lvl.id}
                    </div>
                    {/* Label */}
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 700,
                        color: isSel ? 'var(--text-primary)' : isDone ? rc.hex : 'var(--text-secondary)',
                        letterSpacing: '0.1em', marginBottom: '3px',
                        textShadow: isSel ? `0 0 8px ${rc.hex}` : 'none',
                      }}>
                        LVL {lvl.id}
                      </div>
                      <div style={{
                        fontSize: '9px', letterSpacing: '0.08em', padding: '1px 6px',
                        borderRadius: '3px', display: 'inline-block',
                        color: rc.hex, background: rc.bg,
                      }}>
                        {lvl.risk}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Side detail panel ── */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '300px',
          background: 'var(--bg-nav)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(12px)',
          transition: 'transform 220ms ease',
          transform: selectedLevel ? 'translateX(0)' : 'translateX(100%)',
          zIndex: 20,
        }}>
          {selectedLevel ? (
            <>
              {(() => {
                const rc = RISK_COLORS[selectedLevel.risk] ?? RISK_COLORS.Measured;
                const isDone = completed.includes(selectedLevel.id);
                return (
                  <>
                    {/* Panel header */}
                    <div style={{ padding: '22px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
                          LEVEL {selectedLevel.id}
                        </div>
                        <button
                          onClick={() => setSelected(undefined)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >✕</button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-block', fontSize: '9px', letterSpacing: '0.14em',
                          padding: '4px 12px', borderRadius: '20px', fontWeight: 700,
                          color: rc.hex, background: rc.bg, border: `1px solid ${rc.border}`,
                        }}>
                          {selectedLevel.risk.toUpperCase()}
                        </span>
                        {isDone && (
                          <span style={{
                            display: 'inline-block', fontSize: '9px', letterSpacing: '0.14em',
                            padding: '4px 12px', borderRadius: '20px', fontWeight: 700,
                            color: 'var(--color-green)', background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.3)',
                          }}>
                            ✓ COMPLETE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
                      {[
                        { label: 'CAPITAL DEPLOYED', value: selectedLevel.capital, color: 'var(--color-amber)' },
                        { label: 'POTENTIAL REWARD',  value: selectedLevel.reward,  color: 'var(--color-green)' },
                      ].map(row => (
                        <div key={row.label}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '5px' }}>{row.label}</div>
                          <div style={{ fontSize: '17px', color: row.color, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{row.value}</div>
                        </div>
                      ))}

                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '8px' }}>INVESTMENT NARRATIVE</div>
                        <div style={{
                          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8,
                          fontStyle: 'italic', padding: '14px 16px',
                          background: 'rgba(56,189,248,0.04)', border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                        }}>
                          "{selectedLevel.narrative}"
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>CAMPAIGN PROGRESS</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{completed.length}/{levels.length}</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(56,189,248,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '2px',
                            width: `${levels.length ? (completed.length / levels.length) * 100 : 0}%`,
                            background: 'linear-gradient(to right, var(--color-cyan), var(--color-green))',
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Enter button */}
                    <div style={{ padding: '16px 22px 24px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        className="btn-primary"
                        style={{
                          width: '100%', padding: '14px',
                          fontSize: '12px', letterSpacing: '0.2em',
                          background: rc.bg, borderColor: rc.border,
                          color: rc.hex, textShadow: `0 0 10px ${rc.hex}`,
                        }}
                        onClick={() => handleEnterLevel(selectedLevel.id)}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 20px ${rc.hex}50`; e.currentTarget.style.background = `${rc.bg}`; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
                      >
                        {isDone ? 'REPLAY LEVEL →' : 'ENTER LEVEL →'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          ) : null}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-nav)', border: '1px solid rgba(245,158,11,0.4)',
          color: 'var(--color-amber)', fontFamily: 'var(--font-mono)', fontSize: '12px',
          padding: '10px 24px', borderRadius: '6px', zIndex: 9999,
          letterSpacing: '0.08em', whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 0 14px rgba(245,158,11,0.15)', animation: 'fadeUp 0.3s ease both',
        }}>
          ⚠ {toast}
        </div>
      )}
    </div>
  );
}
