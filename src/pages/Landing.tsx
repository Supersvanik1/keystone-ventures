import { navigate } from '../utils/router';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() ?? '';

const FEATURES = [
  {
    icon: '🎯',
    title: 'PROGRESSIVE LEVELS',
    desc: '40 procedurally generated investment levels, each harder than the last. From Foundation to Abyssal risk tiers.',
  },
  {
    icon: '📊',
    title: 'REAL METRICS',
    desc: 'Evaluate companies across 6 key VC metrics: Team, Market, Traction, Technology, Unit Economics, and Moat.',
  },
  {
    icon: '🧠',
    title: 'LEARN BY DOING',
    desc: 'Tutorial levels teach you how to read signals before you risk real capital. Build intuition through play.',
  },
  {
    icon: '💼',
    title: 'PORTFOLIO MANAGEMENT',
    desc: 'Track your investments, watch returns crystallise, and sell positions back to redeploy capital.',
  },
  {
    icon: '⚡',
    title: 'DYNAMIC RETURNS',
    desc: 'Returns are calculated from metric averages with seeded randomness — skill and luck, just like real VC.',
  },
  {
    icon: '🔐',
    title: 'ADMIN CONTROLS',
    desc: 'Instructors can add, edit, and remove levels in real-time via the Firebase-backed admin panel.',
  },
];

const HOW_TO_PLAY = [
  {
    step: '01',
    title: 'START WITH TUTORIALS',
    desc: 'Early levels teach you to read company metrics one category at a time. Master the fundamentals before deploying capital.',
  },
  {
    step: '02',
    title: 'EVALUATE & INVEST',
    desc: 'In game levels, you receive a capital allocation. Review companies, size your bets, and commit to investments.',
  },
  {
    step: '03',
    title: 'BUILD YOUR PORTFOLIO',
    desc: 'Watch your portfolio grow (or shrink). Sell winning positions to free up capital for the next level.',
  },
];

export default function Landing() {
  const { user } = useAuth();
  const isAdmin = !!user && !!ADMIN_EMAIL && user.email?.trim().toLowerCase() === ADMIN_EMAIL;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', overflowX: 'hidden' }}>

      {/* ── Grid bg ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(56,189,248,0.035) 1px, transparent 1px),linear-gradient(90deg, rgba(56,189,248,0.035) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* ── Radial glow ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56,189,248,0.06) 0%, transparent 70%)',
      }} />

      {/* ── Nav bar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px, 5vw, 60px)', height: '56px',
        background: 'var(--bg-nav)', borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700,
          letterSpacing: '0.18em', color: 'var(--color-cyan)',
          textShadow: '0 0 14px var(--color-cyan)',
        }}>
          KEYSTONE
        </span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isAdmin && (
            <button className="btn-secondary" onClick={() => navigate('admin')} style={{ padding: '6px 14px', fontSize: '10px' }}>ADMIN</button>
          )}
          {user ? (
            <button className="btn-primary" onClick={() => navigate('home')} style={{ padding: '8px 20px', fontSize: '10px' }}>PLAY NOW →</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => navigate('auth')} style={{ padding: '6px 16px', fontSize: '10px' }}>SIGN IN</button>
              <button className="btn-primary" onClick={() => navigate('auth')} style={{ padding: '8px 20px', fontSize: '10px' }}>GET STARTED →</button>
            </>
          )}
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ══════════ HERO ══════════ */}
        <section style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 56px)',
          padding: 'clamp(40px, 8vw, 100px) clamp(16px, 5vw, 60px)',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block', fontSize: '10px', letterSpacing: '0.3em',
            color: 'var(--color-cyan)', padding: '4px 16px',
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '20px', marginBottom: '28px',
            animation: 'fadeUp 0.5s ease both',
          }}>
            VENTURE CAPITAL SIMULATION PLATFORM
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 8vw, 80px)',
            fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '0.08em',
            color: 'var(--text-primary)',
            textShadow: '0 0 60px rgba(56,189,248,0.35), 0 0 120px rgba(56,189,248,0.15)',
            marginBottom: '24px',
            animation: 'fadeUp 0.5s 0.1s ease both',
          }}>
            KEYSTONE<br />
            <span style={{ color: 'var(--color-cyan)' }}>VENTURES</span>
          </h1>

          <p style={{
            maxWidth: '520px', fontSize: 'clamp(13px, 2vw, 16px)',
            color: 'var(--text-secondary)', lineHeight: 1.8,
            marginBottom: '44px',
            animation: 'fadeUp 0.5s 0.2s ease both',
          }}>
            Master the art of venture capital through gamified, progressive simulations.
            Evaluate startups, deploy capital, and build a portfolio that outperforms the market.
          </p>

          <div style={{
            display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center',
            animation: 'fadeUp 0.5s 0.3s ease both',
          }}>
            <button
              className="btn-primary"
              onClick={() => navigate(user ? 'home' : 'auth')}
              style={{ padding: '14px 36px', fontSize: '12px', letterSpacing: '0.2em' }}
            >
              {user ? 'CONTINUE GAME →' : 'START PLAYING →'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => document.getElementById('how-to-play')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '14px 28px', fontSize: '11px' }}
            >
              HOW IT WORKS
            </button>
          </div>

          {/* Stat row */}
          <div style={{
            display: 'flex', gap: '0', marginTop: '64px',
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', overflow: 'hidden',
            animation: 'fadeUp 0.5s 0.4s ease both',
          }}>
            {[
              { val: '40', label: 'LEVELS' },
              { val: '6', label: 'METRICS' },
              { val: '5', label: 'RISK TIERS' },
              { val: '∞', label: 'COMPANIES' },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: '18px 32px', textAlign: 'center',
                borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: 'var(--color-cyan)', marginBottom: '4px' }}>
                  {s.val}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ FEATURES ══════════ */}
        <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 60px)', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ fontSize: '9px', color: 'var(--color-cyan)', letterSpacing: '0.3em', marginBottom: '12px' }}>
              WHAT'S INSIDE
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, letterSpacing: '0.08em' }}>
              PLATFORM FEATURES
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                style={{
                  padding: '24px 24px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  transition: 'all 160ms ease',
                  animationDelay: `${i * 60}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-dim)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', marginBottom: '10px', color: 'var(--color-cyan)' }}>
                  {f.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ HOW TO PLAY ══════════ */}
        <section id="how-to-play" style={{ padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 60px)', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ fontSize: '9px', color: 'var(--color-amber)', letterSpacing: '0.3em', marginBottom: '12px' }}>
              GET STARTED
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, letterSpacing: '0.08em' }}>
              HOW TO PLAY
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {HOW_TO_PLAY.map((step, i) => (
              <div
                key={step.step}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '24px',
                  padding: '26px 28px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  transition: 'border-color 160ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <div style={{
                  flexShrink: 0, width: '48px', height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 900,
                  color: 'var(--color-cyan)',
                  textShadow: '0 0 10px var(--color-cyan)',
                }}>
                  {step.step}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', marginBottom: '8px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {step.desc}
                  </div>
                </div>
                <div style={{
                  marginLeft: 'auto', flexShrink: 0,
                  fontSize: '24px', opacity: 0.2,
                  fontFamily: 'var(--font-display)', fontWeight: 900,
                  color: 'var(--color-cyan)',
                }}>
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section style={{
          padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 60px)',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '600px', margin: '0 auto',
            padding: '52px 40px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            boxShadow: 'var(--glow-cyan)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '16px' }}>
              READY TO INVEST?
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.8, marginBottom: '32px' }}>
              Jump into the simulation and start building your VC instincts. No real money required.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate(user ? 'home' : 'auth')}
              style={{ padding: '16px 48px', fontSize: '13px', letterSpacing: '0.22em' }}
            >
              {user ? 'LAUNCH GAME →' : 'SIGN IN TO PLAY →'}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '24px clamp(16px, 5vw, 60px)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--color-cyan)', letterSpacing: '0.15em' }}>
            KEYSTONE VENTURES
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            Educational VC Simulation Platform
          </span>
          {isAdmin && (
            <button
              className="btn-secondary"
              onClick={() => navigate('admin')}
              style={{ padding: '5px 14px', fontSize: '10px' }}
            >
              ADMIN PANEL
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
