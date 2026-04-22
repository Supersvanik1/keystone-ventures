import { auth } from '../firebase';
import { saveUserProgress } from '../services/userProgressService';

// LocalStorage keys
export const KEYS = {
  capital: 'kv_capital',
  portfolio: 'kv_portfolio',
  portfolioTotal: 'kv_portfolio_total',
  completed: 'kv_completed',
};

export interface PortfolioEntry {
  name: string;
  tagline: string;
  level: number;
  amount: number;
  ask: number;
  current_value: number;
  return_pct: number;
  status: 'active' | 'valued';
  team: number;
  market: number;
  traction: number;
  technology: number;
  unit_economics: number;
  moat: number;
  return_seed: number;
}

export type Portfolio = Record<string, PortfolioEntry>;

// ── Sync helpers ──────────────────────────────────────────────────────────────
function syncToFirestore(partial: Parameters<typeof saveUserProgress>[1]) {
  const uid = auth.currentUser?.uid;
  if (uid) saveUserProgress(uid, partial);
}

// ── Reads ──────────────────────────────────────────────────────────────────────
export function getCapital(): number {
  try {
    const v = localStorage.getItem(KEYS.capital);
    return v ? parseInt(v, 10) || 1_000_000 : 1_000_000;
  } catch { return 1_000_000; }
}

export function getPortfolio(): Portfolio {
  try {
    const raw = localStorage.getItem(KEYS.portfolio) || '{}';
    return JSON.parse(raw) as Portfolio;
  } catch { return {}; }
}

export function getPortfolioTotal(): number {
  try { return parseInt(localStorage.getItem(KEYS.portfolioTotal) || '0', 10) || 0; } catch { return 0; }
}

export function getCompleted(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.completed) || '[]') as number[];
  } catch { return []; }
}

// ── Writes ─────────────────────────────────────────────────────────────────────
export function setCapital(val: number): void {
  try { localStorage.setItem(KEYS.capital, String(val)); } catch { /* noop */ }
  syncToFirestore({ capital: val });
}

export function setPortfolio(p: Portfolio): void {
  try {
    localStorage.setItem(KEYS.portfolio, JSON.stringify(p));
    const total = Object.values(p).reduce((acc, e) => acc + (e.current_value ?? e.amount ?? 0), 0);
    localStorage.setItem(KEYS.portfolioTotal, String(total));
    syncToFirestore({ portfolio: p, portfolioTotal: total });
  } catch { /* noop */ }
}

export function markCompleted(levelId: number): void {
  try {
    const c = getCompleted();
    if (!c.includes(levelId)) {
      c.push(levelId);
      localStorage.setItem(KEYS.completed, JSON.stringify(c));
      syncToFirestore({ completed: c });
    }
  } catch { /* noop */ }
}

export function resetGame(): void {
  try {
    localStorage.setItem(KEYS.capital, String(1_000_000));
    localStorage.removeItem(KEYS.portfolio);
    localStorage.removeItem(KEYS.portfolioTotal);
    syncToFirestore({ capital: 1_000_000, portfolio: {}, portfolioTotal: 0 });
  } catch { /* noop */ }
}

// ── Load from Firestore into localStorage (called on login) ───────────────────
export function hydrateFromFirestore(progress: {
  capital: number; completed: number[]; portfolio: Portfolio; portfolioTotal: number;
}): void {
  try {
    localStorage.setItem(KEYS.capital, String(progress.capital));
    localStorage.setItem(KEYS.completed, JSON.stringify(progress.completed));
    localStorage.setItem(KEYS.portfolio, JSON.stringify(progress.portfolio));
    localStorage.setItem(KEYS.portfolioTotal, String(progress.portfolioTotal));
  } catch { /* noop */ }
}

// ── Re-value portfolio ─────────────────────────────────────────────────────────
export function revaluePortfolio(completedCount: number): void {
  try {
    const p = getPortfolio();
    function pseudoRnd(seed: number): number {
      const x = Math.sin(seed + 1) * 10000;
      return x - Math.floor(x);
    }
    function calcMult(avg: number, noiseSeed: number): number {
      const base = Math.pow(avg / 3.0, 2.5);
      const noise = 0.80 + pseudoRnd(noiseSeed + completedCount * 31337) * 0.40;
      return Math.max(0.05, Math.min(5.0, base * noise));
    }
    for (const k in p) {
      const e = p[k];
      if (e.team === undefined) continue;
      const avg = (e.team + e.market + e.traction + e.technology + e.unit_economics + e.moat) / 6.0;
      const mult = calcMult(avg, e.return_seed || 0);
      e.current_value = Math.round(e.amount * mult);
      e.return_pct = Math.round((mult - 1.0) * 100 * 10) / 10;
      e.status = 'valued';
    }
    setPortfolio(p); // also syncs to Firestore
  } catch { /* noop */ }
}
