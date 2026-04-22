import { useState } from 'react';
import { signUpEmail, signInEmail, signInGoogle } from '../services/authService';
import { navigate } from '../utils/router';

type Mode = 'login' | 'signup';

const G: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'var(--bg-base)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-mono)',
  padding: '16px',
};

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function clearError() { setError(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Display name is required.'); setLoading(false); return; }
        await signUpEmail(email, password, name.trim());
      } else {
        await signInEmail(email, password);
      }
      navigate('home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(friendlyError(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true); setError('');
    try {
      await signInGoogle();
      navigate('home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(friendlyError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={G}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(56,189,248,0.035) 1px, transparent 1px),linear-gradient(90deg, rgba(56,189,248,0.035) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(56,189,248,0.06) 0%, transparent 70%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: 'min(400px, 100%)',
        animation: 'fadeUp 0.4s ease both',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => navigate('landing')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.2em', color: 'var(--color-cyan)',
              textShadow: '0 0 12px var(--color-cyan)', marginBottom: '24px',
              display: 'block', margin: '0 auto 24px',
            }}
          >
            KEYSTONE VENTURES
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Sign in to resume your portfolio' : 'Join to start your VC journey'}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
          borderRadius: '14px', padding: '32px 28px',
          boxShadow: 'var(--glow-cyan)',
        }}>
          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
              borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
              fontSize: '13px', letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 150ms ease', marginBottom: '20px',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '6px' }}>
                  DISPLAY NAME
                </label>
                <input
                  className="game-input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => { setName(e.target.value); clearError(); }}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '6px' }}>
                EMAIL
              </label>
              <input
                className="game-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <input
                className="game-input"
                type="password"
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                value={password}
                onChange={e => { setPassword(e.target.value); clearError(); }}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div style={{
                fontSize: '12px', color: 'var(--color-red)',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '6px', padding: '10px 14px', lineHeight: 1.5,
              }}>
                ✕ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px', marginTop: '4px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          {/* Toggle */}
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', fontSize: '12px',
                textDecoration: 'underline', textUnderlineOffset: '3px',
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes('email-already-in-use'))  return 'This email is already registered. Try signing in.';
  if (msg.includes('user-not-found'))         return 'No account found with this email.';
  if (msg.includes('wrong-password'))         return 'Incorrect password. Please try again.';
  if (msg.includes('invalid-email'))          return 'Please enter a valid email address.';
  if (msg.includes('weak-password'))          return 'Password must be at least 6 characters.';
  if (msg.includes('popup-closed-by-user'))   return 'Sign-in popup was closed. Please try again.';
  if (msg.includes('network-request-failed')) return 'Network error. Check your connection.';
  if (msg.includes('invalid-credential'))     return 'Invalid email or password.';
  return 'Authentication failed. Please try again.';
}
