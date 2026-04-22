import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { loadUserProgress } from '../services/userProgressService';
import { hydrateFromFirestore } from '../utils/storage';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, refreshUser: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const progress = await loadUserProgress(u.uid);
        hydrateFromFirestore(progress);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  function refreshUser() {
    // Re-read the current user from Firebase Auth (e.g. after profile update)
    setUser(auth.currentUser ? { ...auth.currentUser } as User : null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
