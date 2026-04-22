import { useEffect, useState } from 'react';
import { navigate } from '../utils/router';
import { useAuth } from '../context/AuthContext';
import { LEVELS, LEVEL_TUTORIALS } from '../data/gameData';
import {
  getLevelsFromFirestore,
  saveFullLevelToFirestore, updateLevelInFirestore,
  deleteLevelFromFirestore, type FullLevelDoc,
} from '../services/levelService';

const ADMIN_EMAIL  = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() ?? '';
const RISK_OPTIONS = ['Foundation', 'Measured', 'Speculative', 'Frontier', 'Abyssal'];

// All six metrics with display label ↔ storage key mapping
const METRICS: { label: string; key: string }[] = [
  { label: 'TEAM',       key: 'team' },
  { label: 'MARKET',     key: 'market' },
  { label: 'TRACTION',   key: 'traction' },
  { label: 'TECHNOLOGY', key: 'technology' },
  { label: 'ECONOMICS',  key: 'unit_economics' },
  { label: 'MOAT',       key: 'moat' },
];

const RISK_STYLE: Record<string, React.CSSProperties> = {
  Foundation:  { color: '#10b981', background: 'rgba(16,185,129,0.1)',  border: '1px solid rgba(16,185,129,0.25)' },
  Measured:    { color: '#38bdf8', background: 'rgba(56,189,248,0.1)',  border: '1px solid rgba(56,189,248,0.25)' },
  Speculative: { color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' },
  Frontier:    { color: '#f97316', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' },
  Abyssal:     { color: '#ef4444', background: 'rgba(239,68,68,0.1)',  border: '1px solid rgba(239,68,68,0.25)' },
};

type FormMode = 'tutorial' | 'game';

interface FormData {
  // Map fields
  id: string; risk: string; capital: string; reward: string; narrative: string; x: string;
  // Config fields
  title: string; lesson: string; mode: FormMode;
  focusKeys: string[];  // selected metric keys (tutorial mode)
  threshold: string; rounds: string;
  invest_steps: string; // comma-separated e.g. "50000,100000,250000"
}

const EMPTY_FORM: FormData = {
  id: '', risk: 'Foundation', capital: '$250,000', reward: '2.5x potential', narrative: '', x: '50',
  title: '', lesson: '', mode: 'game',
  focusKeys: [], threshold: '3', rounds: '3',
  invest_steps: '50000,100000,250000,500000',
};

function formFromDoc(lvl: FullLevelDoc): FormData {
  return {
    id: String(lvl.id), risk: lvl.risk, capital: lvl.capital, reward: lvl.reward,
    narrative: lvl.narrative, x: String(lvl.x),
    title: lvl.title ?? '', lesson: lvl.lesson ?? '',
    mode: (lvl.mode === 'game' ? 'game' : 'tutorial') as FormMode,
    focusKeys: lvl.metric_keys ?? [],
    threshold: String(lvl.threshold ?? 3),
    rounds: String(lvl.rounds ?? 3),
    invest_steps: (lvl.invest_steps ?? [50000, 100000, 250000, 500000]).join(','),
  };
}

function Label({ text }: { text: string }) {
  return (
    <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '6px' }}>
      {text}
    </div>
  );
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!user && !!ADMIN_EMAIL && user.email?.trim().toLowerCase() === ADMIN_EMAIL;

  const [levels,  setLevels]  = useState<FullLevelDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [seedDone, setSeedDone] = useState(false);
  const [seeding,  setSeeding] = useState(false);

  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<FullLevelDoc | null>(null);
  const [form,        setForm]        = useState<FormData>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<FullLevelDoc | null>(null);

  // ── Firebase ──────────────────────────────────────────────────────────────
  async function loadLevels() {
    setLoading(true); setFbError(null);
    try {
      const data = await getLevelsFromFirestore();
      setLevels(data);
    } catch (err) {
      setFbError(`Firebase error: ${err instanceof Error ? err.message : String(err)}`);
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (isAdmin) loadLevels(); }, [isAdmin]);

  // ── Seed ──────────────────────────────────────────────────────────────────
  async function handleSeedAll() {
    if (!confirm(`Seed all ${LEVELS.length} default levels to Firebase?\nThis will overwrite any existing level data.`)) return;
    setSeeding(true); setSeedDone(false); setFbError(null);
    try {
      await Promise.all(LEVELS.map(lvl => {
        const cfg = LEVEL_TUTORIALS[lvl.id];
        const fullDoc: Omit<FullLevelDoc, '_docId'> = {
          id: lvl.id,
          risk: lvl.risk,
          capital: lvl.capital,
          reward: lvl.reward,
          narrative: lvl.narrative,
          x: lvl.x,
          title: cfg?.title ?? `Level ${lvl.id}`,
          lesson: cfg?.lesson ?? '',
          mode: cfg?.mode === 'game' ? 'game' : (cfg ? 'tutorial' : 'game'),
          focus: cfg ? (Array.isArray(cfg.focus) ? cfg.focus : ['ALL']) : ['ALL'],
          metric_keys: cfg?.metric_keys ?? [],
          threshold: cfg?.threshold ?? 3,
          rounds: cfg?.rounds ?? 3,
          invest_steps: cfg?.invest_steps ?? [50000, 100000, 250000, 500000],
        };
        return saveFullLevelToFirestore(fullDoc);
      }));
      setSeedDone(true);
      await loadLevels();
    } catch (err) {
      setFbError(`Seed failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeeding(false);
    }
  }

  // ── Form helpers ──────────────────────────────────────────────────────────
  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(lvl: FullLevelDoc) { setEditTarget(lvl); setForm(formFromDoc(lvl)); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditTarget(null); }

  function toggleFocusKey(key: string) {
    setForm(f => ({
      ...f,
      focusKeys: f.focusKeys.includes(key)
        ? f.focusKeys.filter(k => k !== key)
        : [...f.focusKeys, key],
    }));
  }

  async function handleSave() {
    const idNum = parseInt(form.id, 10);
    if (!form.id || isNaN(idNum) || !form.title || !form.lesson || !form.capital || !form.reward || !form.narrative) {
      alert('Please fill all required fields (ID, Title, Lesson, Capital, Reward, Narrative).'); return;
    }
    if (form.mode === 'tutorial' && form.focusKeys.length === 0) {
      alert('Tutorial mode requires at least one focus metric.'); return;
    }

    const steps = form.invest_steps.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

    const docData: Omit<FullLevelDoc, '_docId'> = {
      id: idNum,
      risk: form.risk,
      capital: form.capital,
      reward: form.reward,
      narrative: form.narrative,
      x: parseFloat(form.x) || 50,
      title: form.title,
      lesson: form.lesson,
      mode: form.mode,
      focus: form.mode === 'game'
        ? ['ALL']
        : form.focusKeys.map(k => METRICS.find(m => m.key === k)?.label ?? k.toUpperCase()),
      metric_keys: form.mode === 'game' ? [] : form.focusKeys,
      threshold: parseInt(form.threshold, 10) || 3,
      rounds: parseInt(form.rounds, 10) || 3,
      invest_steps: steps.length ? steps : [50000, 100000, 250000, 500000],
    };

    setSaving(true);
    try {
      if (editTarget) {
        await updateLevelInFirestore(editTarget._docId, docData);
      } else {
        await saveFullLevelToFirestore(docData);
      }
      await loadLevels();
      closeForm();
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lvl: FullLevelDoc) {
    setSaving(true);
    try {
      await deleteLevelFromFirestore(lvl._docId);
      await loadLevels();
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
      setDeleteConfirm(null);
    }
  }

  // ── Auth loading ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--color-cyan)' }}>
        LOADING…
      </div>
    );
  }

  // ── Access denied ─────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px),linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div style={{ position: 'relative', zIndex: 1, width: 'min(380px, 90vw)', padding: '40px 36px', background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px' }}>🔒</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.18em', marginBottom: '8px', color: 'var(--color-red)' }}>
            ACCESS DENIED
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '28px' }}>
            {!user
              ? 'You must be signed in to access this panel.'
              : 'Your account does not have admin privileges.'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!user && (
              <button className="btn-primary" onClick={() => navigate('auth')} style={{ padding: '11px' }}>
                SIGN IN →
              </button>
            )}
            <button className="btn-secondary" onClick={() => navigate(user ? 'home' : 'landing')} style={{ padding: '9px' }}>
              ← {user ? 'BACK TO HOME' : 'BACK TO HOME'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main panel ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '52px', background: 'var(--bg-nav)', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(8px)' }}>
        <button className="btn-secondary" onClick={() => navigate('landing')} style={{ padding: '6px 14px', fontSize: '10px' }}>← EXIT ADMIN</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--color-cyan)' }}>ADMIN PANEL</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleSeedAll} disabled={seeding} style={{ padding: '6px 14px', fontSize: '10px', opacity: seeding ? 0.6 : 1 }}>
            {seeding ? '⏳ SEEDING…' : '☁ SEED LEVELS'}
          </button>
          <button className="btn-primary" onClick={openAdd} style={{ padding: '6px 16px', fontSize: '10px' }}>+ ADD LEVEL</button>
        </div>
      </div>

      <div style={{ maxWidth: '940px', margin: '0 auto', padding: '28px 20px 80px', position: 'relative' }}>

        {/* Banners */}
        {seedDone && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', fontSize: '11px', color: 'var(--color-green)', display: 'flex', justifyContent: 'space-between' }}>
            <span>✓ Seeded {LEVELS.length} levels to Firebase.</span>
            <button onClick={() => setSeedDone(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {fbError && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '11px', color: 'var(--color-red)', lineHeight: 1.6 }}>
            ⚠ {fbError}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'TOTAL LEVELS', value: levels.length },
            { label: 'GAME LEVELS',  value: levels.filter(l => l.mode === 'game').length },
            { label: 'TUTORIALS',    value: levels.filter(l => l.mode !== 'game').length },
          ].map(s => (
            <div key={s.label} style={{ padding: '12px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', flex: '1 0 80px' }}>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-cyan)', fontFamily: 'var(--font-display)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Section label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.22em' }}>
          <span>LEVELS ({levels.length})</span>
          {loading && <span style={{ color: 'var(--color-cyan)' }}>LOADING…</span>}
        </div>

        {/* Levels list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>Fetching from Firebase…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {levels.map(lvl => (
              <div key={lvl._docId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', transition: 'border-color 140ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                {/* Badge */}
                <div style={{ flexShrink: 0, width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--color-cyan)' }}>
                  {lvl.id}
                </div>
                {/* Mode tag */}
                <span style={{ flexShrink: 0, fontSize: '9px', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.1em', color: lvl.mode === 'game' ? 'var(--color-amber)' : 'var(--color-cyan)', background: lvl.mode === 'game' ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.1)', border: lvl.mode === 'game' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(56,189,248,0.25)' }}>
                  {lvl.mode === 'game' ? 'GAME' : 'TUTORIAL'}
                </span>
                {/* Risk */}
                <span style={{ flexShrink: 0, fontSize: '9px', padding: '3px 9px', borderRadius: '4px', letterSpacing: '0.1em', ...(RISK_STYLE[lvl.risk] || {}) }}>
                  {lvl.risk?.toUpperCase()}
                </span>
                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px', color: 'var(--text-primary)' }}>
                    {lvl.title || `Level ${lvl.id}`}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>{lvl.capital} · {lvl.reward}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lvl.mode !== 'game' && lvl.focus?.length ? `Focus: ${lvl.focus.join(', ')} · ` : ''}{lvl.narrative}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button className="btn-secondary" onClick={() => openEdit(lvl)} style={{ padding: '5px 12px', fontSize: '10px' }}>EDIT</button>
                  <button className="btn-danger" onClick={() => setDeleteConfirm(lvl)} style={{ padding: '5px 12px', fontSize: '10px' }}>DEL</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px', animation: 'fadeIn 0.2s ease both' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '14px', padding: '28px 26px', width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 0 60px rgba(0,0,0,0.7)' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em' }}>
                {editTarget ? `EDIT LEVEL ${editTarget.id}` : 'ADD NEW LEVEL'}
              </div>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* ── Section: Map data ── */}
              <div style={{ fontSize: '9px', color: 'var(--color-cyan)', letterSpacing: '0.2em', fontFamily: 'var(--font-display)', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>MAP DATA</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label text="LEVEL ID *" />
                  <input className="game-input" type="number" placeholder="e.g. 41" value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value }))} disabled={!!editTarget} />
                </div>
                <div>
                  <Label text="MAP X POSITION (0–100)" />
                  <input className="game-input" type="number" min="0" max="100" placeholder="50" value={form.x}
                    onChange={e => setForm(f => ({ ...f, x: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label text="RISK TIER *" />
                <select className="game-input" value={form.risk} onChange={e => setForm(f => ({ ...f, risk: e.target.value }))} style={{ appearance: 'none', cursor: 'pointer' }}>
                  {RISK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label text="CAPITAL *" />
                  <input className="game-input" placeholder="e.g. $500,000" value={form.capital} onChange={e => setForm(f => ({ ...f, capital: e.target.value }))} />
                </div>
                <div>
                  <Label text="REWARD *" />
                  <input className="game-input" placeholder="e.g. 3.5x potential" value={form.reward} onChange={e => setForm(f => ({ ...f, reward: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label text="NARRATIVE *" />
                <textarea className="game-input" placeholder="A short description of this level's investment thesis…" value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))} />
              </div>

              {/* ── Section: Game config ── */}
              <div style={{ fontSize: '9px', color: 'var(--color-amber)', letterSpacing: '0.2em', fontFamily: 'var(--font-display)', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)', marginTop: '6px' }}>GAME CONFIGURATION</div>

              <div>
                <Label text="LEVEL TITLE *" />
                <input className="game-input" placeholder="e.g. THE DEEP END" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <Label text="LESSON TEXT *" />
                <textarea className="game-input" placeholder="What should the player learn from this level?" value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))} />
              </div>

              {/* Mode toggle */}
              <div>
                <Label text="LEVEL MODE *" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['tutorial', 'game'] as FormMode[]).map(m => (
                    <button key={m} onClick={() => setForm(f => ({ ...f, mode: m }))}
                      style={{
                        flex: 1, padding: '9px', borderRadius: '7px', cursor: 'pointer',
                        fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.12em',
                        border: `1px solid ${form.mode === m ? (m === 'game' ? 'rgba(245,158,11,0.5)' : 'rgba(56,189,248,0.5)') : 'var(--border-subtle)'}`,
                        background: form.mode === m ? (m === 'game' ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.1)') : 'transparent',
                        color: form.mode === m ? (m === 'game' ? 'var(--color-amber)' : 'var(--color-cyan)') : 'var(--text-muted)',
                      }}>
                      {m === 'game' ? '⚡ GAME MODE' : '📚 TUTORIAL MODE'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label text="ROUNDS PER LEVEL" />
                  <input className="game-input" type="number" min="1" max="10" value={form.rounds} onChange={e => setForm(f => ({ ...f, rounds: e.target.value }))} />
                </div>
                {form.mode === 'tutorial' && (
                  <div>
                    <Label text="INVEST THRESHOLD (STARS)" />
                    <input className="game-input" type="number" min="1" max="5" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
                  </div>
                )}
              </div>

              {/* Tutorial: focus metrics */}
              {form.mode === 'tutorial' && (
                <div>
                  <Label text="FOCUS METRICS (SELECT 1–3) *" />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {METRICS.map(m => {
                      const active = form.focusKeys.includes(m.key);
                      return (
                        <button key={m.key} onClick={() => toggleFocusKey(m.key)}
                          style={{
                            padding: '7px 14px', borderRadius: '6px', cursor: 'pointer',
                            fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.12em',
                            border: `1px solid ${active ? 'rgba(56,189,248,0.5)' : 'var(--border-subtle)'}`,
                            background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
                            color: active ? 'var(--color-cyan)' : 'var(--text-muted)',
                            transition: 'all 120ms ease',
                          }}>
                          {active ? '✓ ' : ''}{m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Game: invest steps */}
              {form.mode === 'game' && (
                <div>
                  <Label text="INVEST STEP AMOUNTS (COMMA-SEPARATED)" />
                  <input className="game-input" placeholder="e.g. 50000,100000,250000,500000" value={form.invest_steps} onChange={e => setForm(f => ({ ...f, invest_steps: e.target.value }))} />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px' }}>
                    These become the investment size buttons shown to the player.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button className="btn-secondary" onClick={closeForm} style={{ flex: 1, padding: '10px' }}>CANCEL</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'SAVING…' : editTarget ? 'SAVE CHANGES →' : 'CREATE LEVEL →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, animation: 'fadeIn 0.2s ease both' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '12px', padding: '28px 32px', maxWidth: '340px', textAlign: 'center', width: '90vw' }}>
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', marginBottom: '8px' }}>DELETE LEVEL {deleteConfirm.id}?</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '22px', lineHeight: 1.7 }}>
              This permanently removes the level from Firebase. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 20px' }}>CANCEL</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)} disabled={saving} style={{ padding: '9px 20px', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'DELETING…' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
