import { useEffect, useState } from 'react';
import { navigate } from '../utils/router';
import { getCapital, getPortfolio, setCapital, setPortfolio, type Portfolio } from '../utils/storage';

function fmt(n: number) { return Number(n).toLocaleString(); }

function returnInfo(pct: number, valued: boolean): { color: string; bg: string; border: string; label: string } {
  if (!valued) return { color: 'var(--color-amber)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'ACTIVE' };
  if (pct >= 20)  return { color: 'var(--color-green)', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  label: `▲ +${pct.toFixed(1)}%` };
  if (pct >= 0)   return { color: '#a3e635',            bg: 'rgba(163,230,53,0.1)',  border: 'rgba(163,230,53,0.25)', label: `▲ +${pct.toFixed(1)}%` };
  if (pct >= -30) return { color: 'var(--color-orange)', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', label: `▼ ${pct.toFixed(1)}%` };
  return           { color: 'var(--color-red)',          bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  label: `▼ ${pct.toFixed(1)}%` };
}

export default function PortfolioScreen() {
  const [capital, setCapitalState] = useState(1_000_000);
  const [portfolio, setPortfolioState] = useState<Portfolio>({});
  const [sellConfirm, setSellConfirm] = useState<{ key: string; name: string; curr: number } | null>(null);

  useEffect(() => {
    setCapitalState(getCapital());
    setPortfolioState(getPortfolio());
  }, []);

  const entries = Object.entries(portfolio);
  let totalDep = 0, totalCurr = 0;
  for (const [, e] of entries) {
    totalDep  += e.amount ?? 0;
    totalCurr += e.current_value ?? e.amount ?? 0;
  }
  const pnl = totalCurr - totalDep;
  const netWorth = capital + totalCurr;

  function confirmSell() {
    if (!sellConfirm) return;
    const p = { ...portfolio };
    const e = p[sellConfirm.key];
    if (e) {
      const curr = e.current_value ?? e.amount;
      setCapital(capital + curr);
      setCapitalState(capital + curr);
      delete p[sellConfirm.key];
      setPortfolio(p);
      setPortfolioState(p);
    }
    setSellConfirm(null);
  }

  const statCards = [
    { label: 'LIQUID CAPITAL', value: `$${fmt(capital)}`,   color: 'var(--color-amber)' },
    { label: 'PORTFOLIO VALUE', value: `$${fmt(totalCurr)}`, color: 'var(--text-primary)' },
    { label: 'NET WORTH',       value: `$${fmt(netWorth)}`,  color: 'var(--color-cyan)' },
    {
      label: 'TOTAL P&L',
      value: (pnl >= 0 ? '+' : '') + `$${fmt(Math.abs(pnl))}`,
      color: pnl >= 0 ? 'var(--color-green)' : 'var(--color-red)',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '52px',
        background: 'var(--bg-nav)', borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(8px)',
      }}>
        <button
          className="btn-secondary"
          onClick={() => navigate('home')}
          style={{ padding: '6px 16px', fontSize: '11px' }}
        >
          ← BACK
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--color-cyan)' }}>
          PORTFOLIO
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          {entries.length} POSITION{entries.length !== 1 ? 'S' : ''}
        </span>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '28px 20px 80px', position: 'relative' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
          {statCards.map(s => (
            <div key={s.label} style={{
              padding: '16px 18px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px',
            }}>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '6px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Section title */}
        <div style={{
          fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.22em',
          marginBottom: '14px', paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          INVESTMENTS
        </div>

        {/* Empty state */}
        {entries.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '14px', opacity: 0.3 }}>📊</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 2, letterSpacing: '0.05em' }}>
              No investments yet.<br />Complete a game level to see companies here.
            </div>
          </div>
        )}

        {/* Investment rows */}
        {entries.map(([key, e]) => {
          const amt   = e.amount ?? 0;
          const curr  = e.current_value ?? amt;
          const pct   = e.return_pct ?? 0;
          const valued = e.status === 'valued';
          const ri    = returnInfo(pct, valued);

          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', marginBottom: '8px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', transition: 'border-color 140ms ease',
            }}
            onMouseEnter={e2 => (e2.currentTarget.style.borderColor = 'var(--border-dim)')}
            onMouseLeave={e2 => (e2.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              {/* Left: name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                  {e.name || '—'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.tagline || ''}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  LEVEL {e.level || '?'}
                </div>
              </div>

              {/* Right: value + badge */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: ri.color, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                  ${fmt(curr)}
                </div>
                {valued && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    ${fmt(amt)} cost
                  </div>
                )}
                <span style={{
                  display: 'inline-block', fontSize: '9px', padding: '2px 8px', borderRadius: '4px',
                  letterSpacing: '0.08em', fontWeight: 600,
                  color: ri.color, background: ri.bg, border: `1px solid ${ri.border}`,
                }}>
                  {ri.label}
                </span>
              </div>

              {/* Sell */}
              {valued && (
                <button
                  onClick={() => setSellConfirm({ key, name: e.name || '', curr })}
                  className="btn-secondary"
                  style={{ flexShrink: 0, padding: '6px 12px', fontSize: '10px' }}
                >
                  SELL
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Sell confirm overlay */}
      {sellConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-modal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          animation: 'fadeIn 0.2s ease both',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
            borderRadius: '12px', padding: '28px 32px', maxWidth: '320px',
            textAlign: 'center', width: '90vw',
            boxShadow: '0 0 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.22em', marginBottom: '12px' }}>
              CONFIRM SELL
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
              {sellConfirm.name}
            </div>
            <div style={{ fontSize: '18px', color: 'var(--color-green)', fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
              ${fmt(sellConfirm.curr)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '22px' }}>
              Proceeds will be added to liquid capital.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => setSellConfirm(null)}
                style={{ padding: '9px 20px' }}
              >
                CANCEL
              </button>
              <button
                className="btn-primary"
                onClick={confirmSell}
                style={{ padding: '9px 20px', background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.45)', color: 'var(--color-green)', textShadow: '0 0 8px var(--color-green)' }}
              >
                SELL →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
