import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Portfolio } from '../utils/storage';

export interface UserProgress {
  capital: number;
  completed: number[];
  portfolio: Portfolio;
  portfolioTotal: number;
  updatedAt?: unknown;
}

const DEFAULT_PROGRESS: UserProgress = {
  capital: 1_000_000,
  completed: [],
  portfolio: {},
  portfolioTotal: 0,
};

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

export async function loadUserProgress(uid: string): Promise<UserProgress> {
  try {
    const snap = await getDoc(userDoc(uid));
    if (!snap.exists()) return { ...DEFAULT_PROGRESS };
    const d = snap.data() as UserProgress;
    return {
      capital: d.capital ?? DEFAULT_PROGRESS.capital,
      completed: d.completed ?? [],
      portfolio: d.portfolio ?? {},
      portfolioTotal: d.portfolioTotal ?? 0,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export async function saveUserProgress(uid: string, progress: Partial<UserProgress>): Promise<void> {
  try {
    const ref = userDoc(uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { ...progress, updatedAt: serverTimestamp() });
    } else {
      await setDoc(ref, { ...DEFAULT_PROGRESS, ...progress, updatedAt: serverTimestamp() });
    }
  } catch {
    // Silently fail — localStorage is the fallback
  }
}

export async function resetUserProgress(uid: string): Promise<void> {
  try {
    await setDoc(userDoc(uid), {
      ...DEFAULT_PROGRESS,
      updatedAt: serverTimestamp(),
    }, { merge: false });
  } catch { /* noop */ }
}
