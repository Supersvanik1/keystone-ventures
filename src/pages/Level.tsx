import { useEffect, useReducer, useRef, useState } from 'react';
import {
  type TutorialConfig, METRIC_PROFILES, MK_LABEL,
  generateTutorialCompany, calcReturnMultiplier, type Company,
  COIN_REWARD, ROUNDS_PER_LEVEL,
} from '../data/gameData';
import { CompanyCard, CompanyCardQuiz } from '../components/CompanyCard';
import TopBar from '../components/TopBar';
import { navigate } from '../utils/router';
import {
  getCapital, setCapital, getPortfolio, setPortfolio, getPortfolioTotal,
  markCompleted, getCompleted, revaluePortfolio,
} from '../utils/storage';
import { getLevelConfigFromFirestore } from '../services/levelService';

// ── State ────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'question' | 'result' | 'complete';

interface Investment {
  name: string; tagline: string; amount: number; ask: number;
  team: number; market: number; traction: number;
  technology: number; unit_economics: number; moat: number;
  return_seed: number; portfolio_key: string;
  multiplier?: number; current_value?: number; pnl?: number; return_pct?: number;
}

interface LevelState {
  phase: Phase;
  seed: number;
  round: number;
  answer: 'invest' | 'pass' | null;
  investAmount: number;
  investments: Investment[];
  coinsEarned: number;
  rewarded: Record<number, true>;
  processed: Record<number, true>;
  returnsApplied: boolean;
  capital: number;
  portfolioTotal: number;
}

type Action =
  | { type: 'BEGIN' }
  | { type: 'ANSWER'; answer: 'invest' | 'pass'; amount?: number }
  | { type: 'NEXT'; seed: number }
  | { type: 'COMPLETE' }
  | { type: 'AWARD_COIN'; round: number; correct: boolean }
  | { type: 'PROCESS_INVEST'; round: number; inv: Investment | null; capital: number }
  | { type: 'APPLY_RETURNS'; investments: Investment[] };

function initState(levelId: number): LevelState {
  return {
    phase: 'intro',
    seed: levelId * 9973 + 12345,
    round: 0,
    answer: null,
    investAmount: 0,
    investments: [],
    coinsEarned: 0,
    rewarded: {},
    processed: {},
    returnsApplied: false,
    capital: getCapital(),
    portfolioTotal: getPortfolioTotal(),
  };
}

function reducer(state: LevelState, action: Action): LevelState {
  switch (action.type) {
    case 'BEGIN':
      return { ...state, phase: 'question' };
    case 'ANSWER':
      return { ...state, answer: action.answer, investAmount: action.amount ?? 0, phase: 'result' };
    case 'AWARD_COIN':
      if (state.rewarded[action.round]) return state;
      return {
        ...state,
        coinsEarned: state.coinsEarned + (action.correct ? COIN_REWARD : 0),
        rewarded: { ...state.rewarded, [action.round]: true },
      };
    case 'PROCESS_INVEST':
      if (state.processed[action.round]) return state;
      return {
        ...state,
        capital: action.capital,
        investments: action.inv ? [...state.investments, action.inv] : state.investments,
        processed: { ...state.processed, [action.round]: true },
      };
    case 'NEXT':
      return { ...state, answer: null, investAmount: 0, round: state.round + 1, seed: action.seed, phase: 'question' };
    case 'COMPLETE':
      return { ...state, phase: 'complete' };
    case 'APPLY_RETURNS':
      return { ...state, investments: action.investments, returnsApplied: true };
    default:
      return state;
  }
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
function Btn({
  onClick, children, variant = 'primary', disabled = false, style = {},
}: {
  onClick: () => void; children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'invest' | 'pass';
  disabled?: boolean; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontFamily: 'var(--font-display)',
    fontSize: '11px', letterSpacing: '0.14em',
    padding: '11px 16px', borderRadius: '8px',
    width: '100%', border: '1.5px solid',
    transition: 'all 150ms ease',
    userSelect: 'none',
    ...style,
  };

  const themes: Record<string, React.CSSProperties> = {
    primary:   { background: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.5)',  color: 'var(--color-cyan)',  textShadow: '0 0 8px var(--color-cyan)' },
    secondary: { background: 'transparent',           borderColor: 'var(--border-dim)',      color: 'var(--text-secondary)' },
    invest:    { background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.5)',  color: 'var(--color-green)', textShadow: '0 0 8px var(--color-green)' },
    pass:      { background: 'rgba(71,85,105,0.15)',  borderColor: 'rgba(71,85,105,0.4)',   color: 'var(--text-secondary)' },
  };

  const t = themes[variant] ?? themes.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...t }}
      onMouseEnter={e => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(-1px)';
        if (variant === 'primary') e.currentTarget.style.boxShadow = '0 0 18px rgba(56,189,248,0.35)';
        if (variant === 'invest')  e.currentTarget.style.boxShadow = '0 0 18px rgba(16,185,129,0.35)';
        if (variant === 'secondary' || variant === 'pass') e.currentTarget.style.borderColor = 'var(--border-accent)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        if (variant === 'secondary' || variant === 'pass') e.currentTarget.style.borderColor = 'var(--border-dim)';
      }}
    >
      {children}
    </button>
  );
}

function LessonBlock({ text }: { text: string }) {
  return (
    <div style={{
      borderLeft: '3px solid rgba(56,189,248,0.5)',
      padding: '14px 18px',
      background: 'rgba(56,189,248,0.04)',
      borderRadius: '0 8px 8px 0',
      fontSize: '13px', color: 'var(--text-secondary)',
      lineHeight: 1.8, marginBottom: '24px',
    }}>
      {text}
    </div>
  );
}

function SectionCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: '10px', padding: '18px 20px', marginBottom: '20px',
    }}>
      {title && (
        <div style={{ fontSize: '9px', color: 'var(--color-cyan)', letterSpacing: '0.2em', marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
          ■ {title}
        </div>
      )}
      {children}
    </div>
  );
}

function MetricTag({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '10px', letterSpacing: '0.12em',
      padding: '4px 10px', borderRadius: '4px',
      background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
      color: 'var(--color-cyan)',
    }}>
      {label}
    </span>
  );
}

// ── Intro screens ─────────────────────────────────────────────────────────────
function TutorialIntro({ levelId, cfg, onBegin }: { levelId: number; cfg: TutorialConfig; capital: number; onBegin: () => void }) {
  const focus = cfg.focus as string[];
  const rounds = cfg.rounds ?? ROUNDS_PER_LEVEL;
  const threshold = cfg.threshold ?? 3;

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ fontSize: '9px', color: 'var(--color-cyan)', letterSpacing: '0.28em', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
        LEVEL {levelId} · TUTORIAL
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, letterSpacing: '0.08em', marginBottom: '22px', color: 'var(--text-primary)' }}>
        {cfg.title}
      </h2>
      <LessonBlock text={cfg.lesson} />

      <SectionCard title="YOUR MISSION">
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.9 }}>
          You will evaluate <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{rounds} companies.</span>
          {' '}Only these metrics are visible — all others are classified:
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '12px 0' }}>
          {focus.map(m => <MetricTag key={m} label={m} />)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.9 }}>
          <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>INVEST</span> when every visible metric reaches{' '}
          <span style={{ color: 'var(--color-amber)' }}>{threshold}★ or higher.</span>{' '}
          <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>PASS</span> if any metric falls below.
          <br />Correct calls earn <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>★ {COIN_REWARD} coins</span> each round.
        </div>
      </SectionCard>

      <div style={{ maxWidth: '240px', margin: '0 auto' }}>
        <Btn onClick={onBegin} variant="invest">BEGIN ASSESSMENT →</Btn>
      </div>
    </div>
  );
}

function GameIntro({ levelId, cfg, capital, onBegin }: { levelId: number; cfg: TutorialConfig; capital: number; onBegin: () => void }) {
  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ fontSize: '9px', color: 'var(--color-amber)', letterSpacing: '0.28em', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
        LEVEL {levelId} · INVESTMENT RUN
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, letterSpacing: '0.08em', marginBottom: '22px', color: 'var(--text-primary)' }}>
        {cfg.title}
      </h2>
      <LessonBlock text={cfg.lesson} />

      <SectionCard title="YOUR BRIEF">
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.9 }}>
          Deployable capital:{' '}
          <span style={{ color: 'var(--color-amber)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '15px' }}>
            ${capital.toLocaleString()}
          </span>
        </div>
        <div style={{ height: '12px' }} />
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.9 }}>
          You will evaluate <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ROUNDS_PER_LEVEL} companies.</span>{' '}
          All six metrics are visible. Choose whether to{' '}
          <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>INVEST</span> and how much, or{' '}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>PASS</span>. Companies you back are added to your{' '}
          <span style={{ color: 'var(--color-cyan)' }}>portfolio</span>.
        </div>
      </SectionCard>

      <div style={{ maxWidth: '240px', margin: '0 auto' }}>
        <Btn onClick={onBegin} variant="primary">BEGIN RUN →</Btn>
      </div>
    </div>
  );
}

// ── Question screens ──────────────────────────────────────────────────────────
function TutorialQuestion({ cfg, company, round, onAnswer }: {
  cfg: TutorialConfig; company: Company; round: number;
  onAnswer: (a: 'invest' | 'pass') => void;
}) {
  const focus = cfg.focus as string[];
  const rounds = cfg.rounds ?? ROUNDS_PER_LEVEL;
  const roundLabel = focus.join(' & ');

  return (
    <div style={{ animation: 'fadeUp 0.3s ease both' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: 'var(--color-cyan)', letterSpacing: '0.22em', fontFamily: 'var(--font-display)' }}>
          {roundLabel} ASSESSMENT
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em' }}>
          COMPANY {round + 1} OF {rounds}
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
          {Array.from({ length: rounds }).map((_, i) => (
            <div key={i} style={{
              width: i === round ? '20px' : '6px', height: '6px', borderRadius: '3px',
              background: i < round ? 'var(--color-cyan)' : i === round ? 'var(--color-cyan)' : 'var(--border-subtle)',
              transition: 'all 200ms ease',
            }} />
          ))}
        </div>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <CompanyCardQuiz company={company} visibleMetrics={focus} />
        <div style={{ height: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Btn onClick={() => onAnswer('invest')} variant="invest">INVEST ↑</Btn>
          <Btn onClick={() => onAnswer('pass')} variant="pass">PASS →</Btn>
        </div>
      </div>
    </div>
  );
}

function GameQuestion({ cfg, company, round, capital, onAnswer }: {
  cfg: TutorialConfig; company: Company; round: number;
  capital: number; onAnswer: (a: 'invest' | 'pass', amount?: number) => void;
}) {
  const investSteps = cfg.invest_steps ?? [50_000, 100_000, 250_000, 500_000];
  const validAmounts = investSteps.filter(a => a <= capital);

  return (
    <div style={{ animation: 'fadeUp 0.3s ease both' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: 'var(--color-amber)', letterSpacing: '0.22em', fontFamily: 'var(--font-display)' }}>
          INVESTMENT DECISION
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em' }}>
          COMPANY {round + 1} OF {ROUNDS_PER_LEVEL}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
          {Array.from({ length: ROUNDS_PER_LEVEL }).map((_, i) => (
            <div key={i} style={{
              width: i === round ? '20px' : '6px', height: '6px', borderRadius: '3px',
              background: i < round ? 'var(--color-amber)' : i === round ? 'var(--color-amber)' : 'var(--border-subtle)',
              transition: 'all 200ms ease',
            }} />
          ))}
        </div>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <CompanyCard company={company} />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '12px', color: 'var(--text-secondary)',
          padding: '12px 4px', letterSpacing: '0.06em',
        }}>
          <span>Seeking: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${company.ask.toLocaleString()}</span></span>
          <span>Your capital: <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>${capital.toLocaleString()}</span></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${validAmounts.length + 1}, 1fr)`, gap: '8px' }}>
          {validAmounts.map(amount => (
            <Btn key={amount} onClick={() => onAnswer('invest', amount)} variant="invest">
              ${Math.floor(amount / 1000)}K
            </Btn>
          ))}
          <Btn onClick={() => onAnswer('pass')} variant="pass">PASS</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Result screens ────────────────────────────────────────────────────────────
function TutorialResult({ cfg, company, answer, isLast, onNext }: {
  cfg: TutorialConfig; company: Company;
  answer: 'invest' | 'pass'; isLast: boolean; onNext: () => void;
}) {
  const metricKeys = cfg.metric_keys ?? [];
  const threshold  = cfg.threshold ?? 3;
  const focus      = cfg.focus as string[];
  const scores: Record<string, number> = {};
  for (const mk of metricKeys) {
    scores[mk] = (company as unknown as Record<string, number>)[mk] ?? 0;
  }
  const allAbove     = Object.values(scores).every(s => s >= threshold);
  const correctAction = allAbove ? 'invest' : 'pass';
  const isCorrect    = answer === correctAction;

  const verdictColor = isCorrect ? 'var(--color-green)' : 'var(--color-red)';
  const correctStr   = allAbove
    ? `INVEST — all metrics ≥ ${threshold}★`
    : `PASS — ${metricKeys.filter(mk => scores[mk] < threshold).map(mk => MK_LABEL[mk]).join(' & ')} below ${threshold}★`;

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', animation: 'fadeUp 0.3s ease both' }}>
      {/* Verdict */}
      <div style={{
        textAlign: 'center', padding: '20px',
        background: isCorrect ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        borderRadius: '12px', marginBottom: '20px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{isCorrect ? '✓' : '✗'}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 900, color: verdictColor, letterSpacing: '0.1em', marginBottom: '6px' }}>
          {isCorrect ? 'CORRECT CALL' : 'WRONG CALL'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {isCorrect ? `+${COIN_REWARD} coins awarded` : 'No coins awarded'}
        </div>
      </div>

      {/* Analysis */}
      <SectionCard title={`${focus.join(' & ')} ANALYSIS`}>
        {metricKeys.map(mk => {
          const s       = scores[mk];
          const profile = METRIC_PROFILES[mk]?.[s];
          const above   = s >= threshold;
          return (
            <div key={mk} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--color-cyan)', letterSpacing: '0.1em', minWidth: '100px', fontFamily: 'var(--font-display)' }}>
                {MK_LABEL[mk]}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1, padding: '0 12px' }}>
                {s}★ — {profile?.label}
              </span>
              <span style={{ color: above ? 'var(--color-green)' : 'var(--color-red)', fontSize: '14px', fontWeight: 700 }}>
                {above ? '✓' : '✗'}
              </span>
            </div>
          );
        })}
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Correct call: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{correctStr}</span>
        </div>
      </SectionCard>

      <CompanyCard company={company} focus={focus} />
      <div style={{ height: '16px' }} />
      <Btn onClick={onNext} variant="primary">{isLast ? 'SEE RESULTS →' : 'NEXT COMPANY →'}</Btn>
    </div>
  );
}

function GameResult({ company, answer, investAmount, capital, isLast, onNext }: {
  company: Company; answer: 'invest' | 'pass'; investAmount: number;
  capital: number; isLast: boolean; onNext: () => void;
}) {
  const invested   = answer === 'invest';
  const statusColor = invested ? 'var(--color-green)' : 'var(--text-secondary)';

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', animation: 'fadeUp 0.3s ease both' }}>
      {/* Status banner */}
      <div style={{
        textAlign: 'center', padding: '18px',
        background: invested ? 'rgba(16,185,129,0.06)' : 'rgba(71,85,105,0.1)',
        border: `1px solid ${invested ? 'rgba(16,185,129,0.25)' : 'var(--border-subtle)'}`,
        borderRadius: '12px', marginBottom: '20px',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, color: statusColor, letterSpacing: '0.1em', marginBottom: '6px' }}>
          {invested ? `INVESTED $${investAmount.toLocaleString()}` : 'PASSED'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Capital remaining: <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>${capital.toLocaleString()}</span>
        </div>
      </div>

      <CompanyCard company={company} />
      <div style={{ height: '16px' }} />
      <Btn onClick={onNext} variant="primary">{isLast ? 'CLOSE RUN →' : 'NEXT COMPANY →'}</Btn>
    </div>
  );
}

// ── Complete screens ──────────────────────────────────────────────────────────
function TutorialComplete({ levelId, cfg, coinsEarned }: {
  levelId: number; cfg: TutorialConfig; coinsEarned: number;
}) {
  const focus   = cfg.focus as string[];
  const rounds  = cfg.rounds ?? ROUNDS_PER_LEVEL;
  const correct = Math.floor(coinsEarned / COIN_REWARD);
  const nextLevel = levelId + 1;

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ fontSize: '9px', color: 'var(--color-cyan)', letterSpacing: '0.28em', marginBottom: '10px', fontFamily: 'var(--font-display)' }}>
        LEVEL {levelId} COMPLETE
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '8px', color: 'var(--text-primary)' }}>
        {focus.join(' & ')} ASSESSED
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
        {correct}/{rounds} correct · <span style={{ color: 'var(--color-amber)' }}>★ {coinsEarned} coins earned</span>
      </div>

      <SectionCard title="KEY LESSON">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, textAlign: 'left' }}>{cfg.lesson}</p>
      </SectionCard>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <div style={{ width: '140px' }}>
          <Btn onClick={() => navigate('explore')} variant="secondary">← MAP</Btn>
        </div>
        <div style={{ width: '180px' }}>
          <Btn onClick={() => navigate('level', { level: nextLevel })} variant="primary">
            LEVEL {nextLevel} →
          </Btn>
        </div>
      </div>
    </div>
  );
}

function GameComplete({ levelId, investments, capital }: {
  levelId: number; investments: Investment[]; capital: number;
}) {
  const nextLevel = levelId + 1;
  const totalDeployed = investments.reduce((s, i) => s + i.amount, 0);
  const totalPnl      = investments.reduce((s, i) => s + (i.pnl ?? 0), 0);
  const pnlColor      = totalPnl >= 0 ? 'var(--color-green)' : 'var(--color-red)';
  const pnlSign       = totalPnl >= 0 ? '+' : '';

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ fontSize: '9px', color: 'var(--color-amber)', letterSpacing: '0.28em', marginBottom: '10px', fontFamily: 'var(--font-display)' }}>
        LEVEL {levelId} COMPLETE
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '8px', color: 'var(--text-primary)' }}>
        RUN CLOSED
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
        {investments.length}/{ROUNDS_PER_LEVEL} backed ·{' '}
        <span style={{ color: 'var(--color-amber)' }}>${totalDeployed.toLocaleString()} deployed</span> ·{' '}
        <span style={{ color: pnlColor }}>{pnlSign}${totalPnl.toLocaleString()} P&L</span>
      </div>

      {/* Returns table */}
      <SectionCard title="PORTFOLIO RETURNS">
        {investments.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0', textAlign: 'left' }}>
            No investments made this run.
          </div>
        ) : investments.map((inv, i) => {
          const pct  = inv.return_pct ?? 0;
          const curr = inv.current_value ?? inv.amount;
          const arrow = pct >= 0 ? '▲' : '▼';
          const col   = pct >= 5 ? 'var(--color-green)' : pct < -5 ? 'var(--color-red)' : 'var(--color-amber)';
          const sign  = pct >= 0 ? '+' : '';
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
              textAlign: 'left',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, flex: 1 }}>{inv.name}</span>
              <span style={{ fontSize: '12px', textAlign: 'right', flexShrink: 0 }}>
                <span style={{ color: col, fontWeight: 700 }}>{arrow} {sign}{pct.toFixed(1)}%</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>${inv.amount.toLocaleString()}</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                <span style={{ color: col, fontWeight: 700 }}>${curr.toLocaleString()}</span>
              </span>
            </div>
          );
        })}
      </SectionCard>

      {/* Capital remaining */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: '10px', marginBottom: '28px', textAlign: 'left', fontSize: '13px',
      }}>
        <span style={{ color: 'var(--text-secondary)' }}>Capital remaining</span>
        <span style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
          ${capital.toLocaleString()}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '120px' }}>
          <Btn onClick={() => navigate('explore')} variant="secondary">← MAP</Btn>
        </div>
        <div style={{ width: '150px' }}>
          <Btn onClick={() => navigate('portfolio')} variant="secondary">PORTFOLIO</Btn>
        </div>
        <div style={{ width: '160px' }}>
          <Btn onClick={() => navigate('level', { level: nextLevel })} variant="primary">
            LEVEL {nextLevel} →
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Main Level Component ──────────────────────────────────────────────────────
interface Props { levelId: number; }

export default function Level({ levelId }: Props) {
  const [cfg, setCfg] = useState<TutorialConfig | null>(null);
  const [cfgLoading, setCfgLoading] = useState(true);

  useEffect(() => {
    setCfgLoading(true);
    getLevelConfigFromFirestore(levelId)
      .then(c => { setCfg(c); })
      .catch(() => { setCfg(null); })
      .finally(() => setCfgLoading(false));
  }, [levelId]);
  const [state, dispatch] = useReducer(reducer, levelId, initState);
  const returnsRef   = useRef(false);
  const completedRef = useRef(false);

  const isGame      = cfg?.mode === 'game';
  const investSteps = cfg?.invest_steps;
  const company     = generateTutorialCompany(state.seed, isGame ? investSteps : undefined);
  const rounds      = cfg?.rounds ?? ROUNDS_PER_LEVEL;

  const currentLevelValue = isGame
    ? state.investments.reduce((s, inv) => s + (inv.current_value ?? inv.amount), 0)
    : 0;
  const netWorth = state.capital + state.portfolioTotal + currentLevelValue;

  // Apply returns once on complete (only for game levels with investments)
  useEffect(() => {
    if (state.phase === 'complete' && !returnsRef.current && isGame && state.investments.length > 0) {
      returnsRef.current = true;
      const updated = state.investments.map(inv => {
        const avg  = (inv.team + inv.market + inv.traction + inv.technology + inv.unit_economics + inv.moat) / 6.0;
        const mult = calcReturnMultiplier(avg, inv.return_seed);
        const curr_val = Math.round(inv.amount * mult);
        return { ...inv, multiplier: mult, current_value: curr_val, pnl: curr_val - inv.amount, return_pct: Math.round((mult - 1.0) * 100 * 10) / 10 };
      });
      dispatch({ type: 'APPLY_RETURNS', investments: updated });
    }
  }, [state.phase]);

  // Persist completion + portfolio once the phase is complete.
  // For game levels with investments we wait until returns are applied first.
  // For tutorial levels and game levels where everything was passed, fire immediately.
  useEffect(() => {
    if (state.phase !== 'complete') return;
    const needsReturns = isGame && state.investments.length > 0;
    if (needsReturns && !state.returnsApplied) return; // wait for returns
    if (completedRef.current) return;

    completedRef.current = true;
    markCompleted(levelId);
    setCapital(state.capital);

    if (isGame && state.investments.length > 0) {
      const p = getPortfolio();
      for (const inv of state.investments) {
        p[inv.portfolio_key] = {
          name: inv.name, tagline: inv.tagline, level: levelId,
          amount: inv.amount, ask: inv.ask,
          current_value: inv.current_value ?? inv.amount,
          return_pct: inv.return_pct ?? 0,
          status: 'valued',
          team: inv.team, market: inv.market, traction: inv.traction,
          technology: inv.technology, unit_economics: inv.unit_economics,
          moat: inv.moat, return_seed: inv.return_seed,
        };
      }
      setPortfolio(p);
      const completedCount = getCompleted().length;
      revaluePortfolio(completedCount);
    }
  }, [state.phase, state.returnsApplied]);

  // Award coins for tutorial
  useEffect(() => {
    if (state.phase === 'result' && !isGame && state.answer !== null && !state.rewarded[state.round]) {
      const metricKeys = cfg?.metric_keys ?? [];
      const threshold  = cfg?.threshold ?? 3;
      const scores: Record<string, number> = {};
      for (const mk of metricKeys) {
        scores[mk] = (company as unknown as Record<string, number>)[mk] ?? 0;
      }
      const allAbove     = Object.values(scores).every(s => s >= threshold);
      const correctAction = allAbove ? 'invest' : 'pass';
      dispatch({ type: 'AWARD_COIN', round: state.round, correct: state.answer === correctAction });
    }
  }, [state.phase, state.answer]);

  // Process game investments
  useEffect(() => {
    if (state.phase === 'result' && isGame && state.answer === 'invest' && state.investAmount > 0) {
      if (!state.processed[state.round]) {
        const newCapital   = state.capital - state.investAmount;
        const returnSeed   = state.seed + levelId * 37 + state.round * 7919;
        const portfolioKey = `${levelId}_${state.round}_${company.id}`;
        const inv: Investment = {
          name: company.name, tagline: company.tagline,
          amount: state.investAmount, ask: company.ask,
          team: company.team, market: company.market, traction: company.traction,
          technology: company.technology, unit_economics: company.unit_economics,
          moat: company.moat, return_seed: returnSeed, portfolio_key: portfolioKey,
        };
        dispatch({ type: 'PROCESS_INVEST', round: state.round, inv, capital: newCapital });
      }
    } else if (state.phase === 'result' && isGame && state.answer === 'pass') {
      if (!state.processed[state.round]) {
        dispatch({ type: 'PROCESS_INVEST', round: state.round, inv: null, capital: state.capital });
      }
    }
  }, [state.phase, state.answer]);

  if (cfgLoading) {
    return (
      <div style={{ paddingTop: '140px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.18em' }}>LOADING LEVEL CONFIG…</div>
      </div>
    );
  }

  if (!cfg) {
    return (
      <div style={{ paddingTop: '100px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>Level {levelId} has no configuration.</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>Add this level via the Admin panel to make it playable.</div>
        <button className="btn-secondary" onClick={() => navigate('explore')} style={{ padding: '9px 22px' }}>← MAP</button>
      </div>
    );
  }

  function handleAnswer(answer: 'invest' | 'pass', amount?: number) {
    dispatch({ type: 'ANSWER', answer, amount });
  }

  function handleNext() {
    const isLast = (state.round + 1) >= rounds;
    if (isLast) {
      dispatch({ type: 'COMPLETE' });
    } else {
      const newSeed = (state.seed * 6364136223846793005 + 1442695040888963407) >>> 0;
      dispatch({ type: 'NEXT', seed: newSeed % 100000 });
    }
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', fontFamily: 'var(--font-mono)' }}>
      {/* Subtle grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px),linear-gradient(90deg, rgba(56,189,248,0.025) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <TopBar capital={state.capital} netWorth={netWorth} />
      <div style={{ height: '52px' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '28px 20px 80px', maxWidth: '640px', margin: '0 auto' }}>
        {state.phase === 'intro' && (
          isGame
            ? <GameIntro levelId={levelId} cfg={cfg} capital={state.capital} onBegin={() => dispatch({ type: 'BEGIN' })} />
            : <TutorialIntro levelId={levelId} cfg={cfg} capital={state.capital} onBegin={() => dispatch({ type: 'BEGIN' })} />
        )}
        {state.phase === 'question' && (
          isGame
            ? <GameQuestion cfg={cfg} company={company} round={state.round} capital={state.capital} onAnswer={handleAnswer} />
            : <TutorialQuestion cfg={cfg} company={company} round={state.round} onAnswer={a => handleAnswer(a)} />
        )}
        {state.phase === 'result' && state.answer && (
          isGame
            ? <GameResult company={company} answer={state.answer} investAmount={state.investAmount} capital={state.capital} isLast={(state.round + 1) >= rounds} onNext={handleNext} />
            : <TutorialResult cfg={cfg} company={company} answer={state.answer} isLast={(state.round + 1) >= rounds} onNext={handleNext} />
        )}
        {state.phase === 'complete' && (
          isGame
            ? <GameComplete levelId={levelId} investments={state.investments} capital={state.capital} />
            : <TutorialComplete levelId={levelId} cfg={cfg} coinsEarned={state.coinsEarned} />
        )}
      </div>
    </div>
  );
}
