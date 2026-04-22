import { useEffect, useState } from 'react';
import { parseRoute, navigate, type RouteState } from './utils/router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import Level from './pages/Level';
import Admin from './pages/Admin';

// Pages that require the user to be signed in
const PROTECTED: RouteState['page'][] = ['home', 'explore', 'portfolio', 'settings', 'level'];

function Router() {
  const [route, setRoute] = useState<RouteState>(parseRoute);
  const { user, loading } = useAuth();

  useEffect(() => {
    function onNav() { setRoute(parseRoute()); }
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  // While auth state is resolving, show a minimal loader
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: '11px',
        letterSpacing: '0.2em', color: 'var(--color-cyan)',
      }}>
        LOADING…
      </div>
    );
  }

  const { page, level } = route;

  // Redirect unauthenticated users away from protected pages
  if (!user && PROTECTED.includes(page)) {
    // Use setTimeout to avoid setState-during-render
    setTimeout(() => navigate('auth'), 0);
    return null;
  }

  if (page === 'level' && level) return <Level key={level} levelId={level} />;
  if (page === 'explore') return <Explore selectedLevelId={level} />;
  if (page === 'portfolio') return <Portfolio />;
  if (page === 'settings') return <Settings />;
  if (page === 'home') return <Home />;
  if (page === 'admin') return <Admin />;
  if (page === 'auth') return <AuthPage />;
  return <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}
