import { useState } from 'react';
import { navigate } from '../utils/router';
import { useAuth } from '../context/AuthContext';
import { useTheme, type Theme } from '../context/ThemeContext';
import { updateProfileName, signOutUser } from '../services/authService';
import { resetUserProgress } from '../services/userProgressService';
import { hydrateFromFirestore } from '../utils/storage';

function getProvider(user: { providerData?: { providerId: string }[] } | null): 'google' | 'email' | 'unknown' {
  const id = user?.providerData?.[0]?.providerId;
  if (id === 'google.com') return 'google';
  if (id === 'password') return 'email';
  return 'unknown';
}

function initials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [nameEdit, setNameEdit] = useState(false);
  const [nameVal, setNameVal] = useState(user?.displayName ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState(false);

  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const provider = getProvider(user);
  const avatar = initials(user?.displayName, user?.email);

  async function handleSaveName() {
    if (!nameVal.trim()) { setNameError('Name cannot be empty.'); return; }
    setNameSaving(true); setNameError('');
    try {
      await updateProfileName(nameVal.trim());
      refreshUser();
      setNameEdit(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2500);
    } catch {
      setNameError('Failed to update name. Please try again.');
    } finally {
      setNameSaving(false);
    }
  }

  async function handleResetProgress() {
    if (!user) return;
    setResetting(true);
    try {
      await resetUserProgress(user.uid);
      hydrateFromFirestore({ capital: 1_000_000, completed: [], portfolio: {}, portfolioTotal: 0 });
      setResetConfirm(false);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    } catch {
      alert('Reset failed. Please try again.');
    } finally {
      setResetting(false);
    }
  }

  const sectionHead: React.CSSProperties = {
    fontSize: '9px', letterSpacing: '0.25em', color: 'var(--color-cyan)',
    fontFamily: 'var(--font-display)', marginBottom: '12px',
    paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)',
  };

  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: '12px', padding: '20px 22px', marginBottom: '16px',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>

      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px),linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '52px',
        background: 'var(--bg-nav)', borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(8px)',
      }}>
        <button className="btn-secondary" onClick={() => navigate('home')} style={{ padding: '6px 16px', fontSize: '11px' }}>
          ← BACK
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--color-cyan)' }}>
          SETTINGS
        </span>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 20px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── PROFILE ── */}
        <div style={sectionHead}>PROFILE</div>

        <div style={card}>
          {/* Avatar + identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              flexShrink: 0, width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(56,189,248,0.12)', border: '2px solid rgba(56,189,248,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 900,
              color: 'var(--color-cyan)', letterSpacing: '0.05em',
            }}>
              {avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || user?.email || 'Unknown User'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            {/* Provider badge */}
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '10px', letterSpacing: '0.1em', padding: '5px 10px', borderRadius: '20px',
              color: provider === 'google' ? '#4285F4' : 'var(--color-cyan)',
              background: provider === 'google' ? 'rgba(66,133,244,0.1)' : 'rgba(56,189,248,0.1)',
              border: `1px solid ${provider === 'google' ? 'rgba(66,133,244,0.3)' : 'rgba(56,189,248,0.3)'}`,
            }}>
              {provider === 'google' ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  GOOGLE
                </>
              ) : (
                <>✉ EMAIL</>
              )}
            </div>
          </div>

          {/* Display name edit */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '8px' }}>
              DISPLAY NAME
            </div>
            {nameEdit ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: 'column' }}>
                <input
                  className="game-input"
                  value={nameVal}
                  onChange={e => { setNameVal(e.target.value); setNameError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setNameEdit(false); }}
                  autoFocus
                  placeholder="Your display name"
                  style={{ fontSize: '14px' }}
                />
                {nameError && (
                  <div style={{ fontSize: '11px', color: 'var(--color-red)' }}>✕ {nameError}</div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-primary"
                    onClick={handleSaveName}
                    disabled={nameSaving}
                    style={{ padding: '7px 18px', fontSize: '10px', opacity: nameSaving ? 0.6 : 1 }}
                  >
                    {nameSaving ? 'SAVING…' : 'SAVE'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => { setNameEdit(false); setNameError(''); setNameVal(user?.displayName ?? ''); }}
                    style={{ padding: '7px 14px', fontSize: '10px' }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {user?.displayName || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>}
                </span>
                <button
                  className="btn-secondary"
                  onClick={() => { setNameVal(user?.displayName ?? ''); setNameEdit(true); }}
                  style={{ padding: '5px 14px', fontSize: '10px' }}
                >
                  EDIT
                </button>
              </div>
            )}
            {nameSuccess && (
              <div style={{ fontSize: '11px', color: 'var(--color-green)', marginTop: '8px' }}>
                ✓ Display name updated.
              </div>
            )}
          </div>
        </div>

        {/* ── APPEARANCE ── */}
        <div style={{ ...sectionHead, marginTop: '8px' }}>APPEARANCE</div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {theme === 'dark' ? 'Easy on the eyes in low light.' : 'Cleaner look for bright environments.'}
              </div>
            </div>
            {/* Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                flexShrink: 0, position: 'relative',
                width: '52px', height: '28px',
                borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: theme === 'dark' ? 'rgba(56,189,248,0.25)' : 'rgba(245,158,11,0.25)',
                transition: 'background 200ms ease',
                outline: 'none',
              }}
              aria-label="Toggle theme"
            >
              <span style={{
                position: 'absolute', top: '4px',
                left: theme === 'dark' ? '4px' : '24px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: theme === 'dark' ? 'var(--color-cyan)' : 'var(--color-amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', transition: 'left 200ms ease',
                boxShadow: theme === 'dark' ? '0 0 8px rgba(56,189,248,0.5)' : '0 0 8px rgba(245,158,11,0.5)',
              }}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>
          </div>

          {/* Theme swatches */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
            {(['dark', 'light'] as Theme[]).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                  background: theme === t ? (t === 'dark' ? 'rgba(56,189,248,0.1)' : 'rgba(245,158,11,0.1)') : 'transparent',
                  border: `1.5px solid ${theme === t ? (t === 'dark' ? 'rgba(56,189,248,0.5)' : 'rgba(245,158,11,0.5)') : 'var(--border-subtle)'}`,
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>{t === 'dark' ? '🌙' : '☀️'}</div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', color: theme === t ? (t === 'dark' ? 'var(--color-cyan)' : 'var(--color-amber)') : 'var(--text-secondary)' }}>
                  {t === 'dark' ? 'DARK' : 'LIGHT'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── PROGRESS ── */}
        <div style={{ ...sectionHead, marginTop: '8px', color: 'var(--color-red)', borderBottomColor: 'rgba(239,68,68,0.2)' }}>PROGRESS</div>

        <div style={{ ...card, border: '1px solid rgba(239,68,68,0.2)' }}>
          {resetDone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
              <div style={{ fontSize: '22px' }}>✓</div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--color-green)', fontWeight: 600, marginBottom: '2px' }}>Progress Reset</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Your progress has been cleared. Starting from Level 1.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>
                  Reset All Progress
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Clears completed levels, portfolio, and resets capital to $1,000,000. This cannot be undone.
                </div>
              </div>
              <button
                className="btn-danger"
                onClick={() => setResetConfirm(true)}
                style={{ flexShrink: 0, padding: '8px 16px', fontSize: '10px' }}
              >
                RESET
              </button>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <button
            className="btn-secondary"
            onClick={async () => { await signOutUser(); navigate('landing'); }}
            style={{ padding: '9px 28px', fontSize: '11px', color: 'var(--color-red)', borderColor: 'rgba(239,68,68,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'transparent'; }}
          >
            SIGN OUT
          </button>
        </div>
      </div>

      {/* ── Reset confirm modal ── */}
      {resetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-modal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '16px', animation: 'fadeIn 0.2s ease both',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '14px', padding: '32px 28px',
            maxWidth: '360px', width: '100%', textAlign: 'center',
            boxShadow: '0 0 40px rgba(239,68,68,0.15)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.14em', marginBottom: '10px', color: 'var(--color-red)' }}>
              RESET PROGRESS?
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.7 }}>
              All completed levels, your portfolio, and capital will be permanently cleared. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setResetConfirm(false)} style={{ padding: '10px 22px' }}>
                CANCEL
              </button>
              <button
                className="btn-danger"
                onClick={handleResetProgress}
                disabled={resetting}
                style={{ padding: '10px 22px', opacity: resetting ? 0.6 : 1 }}
              >
                {resetting ? 'RESETTING…' : 'CONFIRM RESET'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
