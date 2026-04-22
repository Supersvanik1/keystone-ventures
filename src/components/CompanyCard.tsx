import { type Company } from '../data/gameData';
import StarRating from './StarRating';

interface Metric { label: string; value: number; }

function getMetrics(company: Company): Metric[] {
  return [
    { label: 'TEAM',       value: company.team },
    { label: 'MARKET',     value: company.market },
    { label: 'TRACTION',   value: company.traction },
    { label: 'TECHNOLOGY', value: company.technology },
    { label: 'ECONOMICS',  value: company.unit_economics },
    { label: 'MOAT',       value: company.moat },
  ];
}

// Full card with all metrics visible
interface FullCardProps {
  company: Company;
  focus?: string | string[];
}

export function CompanyCard({ company, focus }: FullCardProps) {
  const focusSet = new Set(
    Array.isArray(focus) ? focus.map(f => f.toUpperCase()) :
    focus ? [focus.toUpperCase()] : []
  );

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-dim)',
      borderRadius: '12px',
      padding: '20px',
      fontFamily: 'var(--font-mono)',
    }}>
      {/* Company header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: '4px' }}>
          {company.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {company.tagline}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '14px' }}>
        {getMetrics(company).map(({ label, value }) => {
          const hl = focusSet.has(label);
          return (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 8px', borderRadius: '6px', marginBottom: '2px',
              background: hl ? 'rgba(56,189,248,0.06)' : 'transparent',
            }}>
              <span style={{
                fontSize: '11px', letterSpacing: '0.1em', fontFamily: 'var(--font-display)',
                color: hl ? 'var(--color-cyan)' : 'var(--text-secondary)',
                fontWeight: hl ? 700 : 400,
              }}>
                {label}
              </span>
              <StarRating score={value} />
            </div>
          );
        })}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.7,
        borderTop: '1px solid var(--border-subtle)', paddingTop: '12px',
      }}>
        {company.description}
      </div>
    </div>
  );
}

// Quiz card — only visible metrics shown, others hidden
interface QuizCardProps {
  company: Company;
  visibleMetrics: string[];
}

export function CompanyCardQuiz({ company, visibleMetrics }: QuizCardProps) {
  const visible  = visibleMetrics.map(m => m.toUpperCase());
  const nHidden  = 6 - visible.length;
  const focusStr = visible.join(' & ');

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-dim)',
      borderRadius: '12px',
      padding: '22px',
      fontFamily: 'var(--font-mono)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: '5px' }}>
          {company.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {company.tagline}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '14px' }}>
        {getMetrics(company).map(({ label, value }) => {
          if (visible.includes(label)) {
            return (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 10px',
                background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)',
                borderRadius: '8px', marginBottom: '4px',
              }}>
                <span style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'var(--color-cyan)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {label}
                </span>
                <StarRating score={value} size="lg" />
              </div>
            );
          }
          return (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 10px', borderRadius: '8px', marginBottom: '4px',
              opacity: 0.3,
            }}>
              <span style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', letterSpacing: '2px' }}>★★★★★</span>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{
        fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6,
        borderTop: '1px solid var(--border-subtle)', paddingTop: '10px',
        letterSpacing: '0.05em',
      }}>
        {nHidden} metric{nHidden !== 1 ? 's' : ''} classified · Evaluate <span style={{ color: 'var(--color-cyan)' }}>{focusStr}</span> only.
      </div>
    </div>
  );
}
