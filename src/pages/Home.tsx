import { useEffect, useState } from 'react';
import { navigate } from '../utils/router';
import { getCapital, getPortfolio, getCompleted } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../services/authService';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() ?? '';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    overflow: 'hidden',
    padding: '60px 20px 80px',
  },
  grid: {
    position: 'fixed', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  radial: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(56,189,248,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  inner: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '10px',
    animation: 'fadeUp 0.5s ease both',
    width: '100%', maxWidth: '480px',
  },
  eyebrow: {
    fontSize: '10px', letterSpacing: '0.35em',
    color: 'var(--color-cyan)', textTransform: 'uppercase',
    textShadow: '0 0 12px var(--color-cyan)',
    marginBottom: '2px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(26px, 5vw, 48px)',
    fontWeight: 900,
    letterSpacing: '0.12em',
    color: 'var(--text-primary)',
    textShadow: '0 0 40px rgba(56,189,248,0.5), 0 0 80px rgba(56,189,248,0.2)',
    lineHeight: 1.1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '11px', color: 'var(--text-secondary)',
    letterSpacing: '0.12em', textAlign: 'center',
    marginBottom: '4px',
  },
  navCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: '4px', padding: '18px 20px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 160ms ease',
    textAlign: 'left',
    width: '100%',
  },
  navIcon: { fontSize: '20px', lineHeight: 1, marginBottom: '4px' },
  navLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'var(--text-primary)',
  },
  navDesc: { fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' },
  footer: {
    position: 'fixed', bottom: '24px',
    display: 'flex', gap: '20px', alignItems: 'center',
    zIndex: 10,
  },
  footerLink: {
    fontSize: '10px', color: 'var(--text-muted)',
    letterSpacing: '0.12em', cursor: 'pointer',
    background: 'none', border: 'none',
    fontFamily: 'var(--font-mono)',
    transition: 'color 140ms ease',
  },
};

export default function Home() {
  const { user } = useAuth();
  const isAdmin = !!user && !!ADMIN_EMAIL && user.email?.trim().toLowerCase() === ADMIN_EMAIL;

  const [capital, setCapitalState]         = useState(0);
  const [portfolioTotal, setPortfolioTotal] = useState(0);
  const [positions, setPositions]           = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const cap  = getCapital();
    const port = getPortfolio();
    const comp = getCompleted();
    const portTotal = Object.values(port).reduce((s, e) => s + (e.current_value ?? e.amount ?? 0), 0);
    setCapitalState(cap);
    setPortfolioTotal(portTotal);
    setPositions(Object.keys(port).length);
    setCompletedCount(comp.length);
  }, []);

  const netWorth = capital + portfolioTotal;

  async function handleSignOut() {
    await signOutUser();
    navigate('landing');
  }

  const navItems = [
    ...([
      { icon: '🗺️', label: 'EXPLORE', desc: `${completedCount} level${completedCount !== 1 ? 's' : ''} completed`, page: 'explore' as const },
      { icon: '💼', label: 'PORTFOLIO', desc: `${positions} position${positions !== 1 ? 's' : ''} · ${fmt(portfolioTotal)}`, page: 'portfolio' as const },
      { icon: '⚙️', label: 'SETTINGS', desc: 'Profile & preferences', page: 'settings' as const },
    ]),
    ...(isAdmin ? [{ icon: '📊', label: 'ADMIN', desc: 'Manage level data', page: 'admin' as const }] : []),
  ];

  return (
    <div style={S.wrap}>
      <div style={S.grid} />
      <div style={S.radial} />

      <div style={S.inner}>
        <div style={S.eyebrow}>Venture Capital Simulator</div>
        <div style={S.title}>KEYSTONE<br />VENTURES</div>
        <div style={S.subtitle}>Deploy capital. Build your portfolio. Master the market.</div>

        {/* ── Stats strip ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          width: '100%', marginBottom: '8px', marginTop: '8px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {[
            { label: 'CAPITAL',     value: fmt(capital),      color: 'var(--color-amber)' },
            { label: 'NET WORTH',   value: fmt(netWorth),     color: 'var(--color-cyan)'  },
            { label: 'PORTFOLIO',   value: fmt(portfolioTotal), color: portfolioTotal > 0 ? 'var(--color-green)' : 'var(--text-muted)' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '14px 0', textAlign: 'center',
              borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '5px' }}>
                {s.label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Nav cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px', width: '100%',
        }}>
          {navItems.map(item => (
            <button
              key={item.page}
              style={S.navCard}
              onClick={() => navigate(item.page)}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.background = 'var(--bg-card-hover)';
                el.style.borderColor = 'var(--border-dim)';
                el.style.transform = 'translateY(-2px)';
                el.style.boxShadow = 'var(--glow-cyan)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.background = 'var(--bg-card)';
                el.style.borderColor = 'var(--border-subtle)';
                el.style.transform = '';
                el.style.boxShadow = '';
              }}
            >
              <div style={S.navIcon}>{item.icon}</div>
              <div style={S.navLabel}>{item.label}</div>
              <div style={S.navDesc}>{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={S.footer}>
        <button
          style={S.footerLink}
          onClick={() => navigate('landing')}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-cyan)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          ← ABOUT
        </button>
        <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
        {user && (
          <span style={{ ...S.footerLink, cursor: 'default', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.displayName || user.email}
          </span>
        )}
        <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
        <button
          style={S.footerLink}
          onClick={handleSignOut}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-red)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
