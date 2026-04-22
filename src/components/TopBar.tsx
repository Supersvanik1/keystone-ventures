import { navigate } from '../utils/router';

interface Props { capital: number; netWorth: number; }

export default function TopBar({ capital, netWorth }: Props) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
      height: '52px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
      background: 'var(--bg-nav)',
      borderBottom: '1px solid var(--border-subtle)',
      backdropFilter: 'blur(8px)',
      fontFamily: 'var(--font-mono)',
    }}>
      <button
        onClick={() => navigate('explore')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: 'var(--text-secondary)', letterSpacing: '0.1em',
          padding: '6px 0',
          transition: 'color 140ms ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-cyan)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        ← MAP
      </button>

      <div style={{ display: 'flex', gap: '2px', alignItems: 'stretch' }}>
        {[
          { label: 'CAPITAL', value: `$${capital.toLocaleString()}`, color: 'var(--color-amber)' },
          { label: 'NET WORTH', value: `$${netWorth.toLocaleString()}`, color: 'var(--text-primary)' },
        ].map((item, i) => (
          <div key={item.label} style={{
            padding: '4px 18px',
            borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '3px' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '13px', color: item.color, fontWeight: 700, letterSpacing: '0.04em' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
