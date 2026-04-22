import {
  collection, getDocs, setDoc, updateDoc, deleteDoc, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Level, TutorialConfig } from '../data/gameData';

const COL = 'levels';

// The combined document stored in Firestore per level.
// Includes both the map data (Level) and the game config (TutorialConfig).
export interface FullLevelDoc {
  // Map fields
  id: number;
  risk: string;
  capital: string;
  reward: string;
  narrative: string;
  x: number;
  // Game config fields
  title: string;
  lesson: string;
  mode: 'tutorial' | 'game';
  focus: string[];       // display names: ['TEAM','MARKET'] or ['ALL']
  metric_keys: string[]; // storage keys: ['team','market'] or []
  threshold: number;
  rounds: number;
  invest_steps: number[];
  // Firestore meta
  _docId: string;
}

export type { Level };

export async function getLevelsFromFirestore(): Promise<FullLevelDoc[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map(d => ({ ...(d.data() as Omit<FullLevelDoc, '_docId'>), _docId: d.id }))
    .sort((a, b) => a.id - b.id);
}

export async function getLevelConfigFromFirestore(levelId: number): Promise<TutorialConfig | null> {
  try {
    const snap = await getDoc(doc(db, COL, String(levelId)));
    if (!snap.exists()) return null;
    const d = snap.data() as FullLevelDoc;
    return {
      title: d.title,
      lesson: d.lesson,
      focus: d.mode === 'game' ? 'ALL' : d.focus,
      metric_keys: d.metric_keys ?? [],
      threshold: d.threshold ?? 3,
      rounds: d.rounds ?? 3,
      mode: d.mode === 'game' ? 'game' : undefined,
      invest_steps: d.invest_steps ?? [50_000, 100_000, 250_000, 500_000],
    } as TutorialConfig;
  } catch {
    return null;
  }
}

export async function saveLevelToFirestore(level: Level): Promise<void> {
  // When seeding from local data we only have Level fields — fill config with defaults.
  const existing = await getDoc(doc(db, COL, String(level.id)));
  const existingData = existing.exists() ? (existing.data() as FullLevelDoc) : null;
  await setDoc(doc(db, COL, String(level.id)), {
    id: level.id,
    risk: level.risk,
    capital: level.capital,
    reward: level.reward,
    narrative: level.narrative,
    x: level.x,
    // Preserve existing config fields if present, otherwise fill with defaults
    title: existingData?.title ?? `Level ${level.id}`,
    lesson: existingData?.lesson ?? '',
    mode: existingData?.mode ?? 'game',
    focus: existingData?.focus ?? ['ALL'],
    metric_keys: existingData?.metric_keys ?? [],
    threshold: existingData?.threshold ?? 3,
    rounds: existingData?.rounds ?? 3,
    invest_steps: existingData?.invest_steps ?? [50_000, 100_000, 250_000, 500_000],
  });
}

export async function saveFullLevelToFirestore(doc_data: Omit<FullLevelDoc, '_docId'>): Promise<void> {
  await setDoc(doc(db, COL, String(doc_data.id)), doc_data);
}

export async function updateLevelInFirestore(docId: string, data: Partial<FullLevelDoc>): Promise<void> {
  const { _docId: _, ...clean } = data as FullLevelDoc;
  await updateDoc(doc(db, COL, docId), clean as Record<string, unknown>);
}

export async function deleteLevelFromFirestore(docId: string): Promise<void> {
  await deleteDoc(doc(db, COL, docId));
}
