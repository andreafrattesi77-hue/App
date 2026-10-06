import { COACH_DAILY_LIMIT, MISSIONS_21 } from '../config';
import { UserData, EveningEntry, MissionProgress, ChatMessage, DailyCoachUsage } from '../types';

const STORAGE_KEYS = {
  USER: 'ec_user_data',
  MISSIONS: 'ec_missions_progress',
  DIARY: 'ec_evening_diary',
  CHAT: 'ec_coach_chat',
  USAGE: 'ec_coach_usage',
};

const DEFAULT_INTENTIONS = [
  'Se vedo una donna che mi piace, allora la invito entro 3 secondi.',
  'Se ricevo un rifiuto, allora applico i 10 secondi eleganti col sorriso.',
  'Se entro in pista, allora faccio il Contatto Zero con calma prima di muovere un passo.',
];

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUserData(): UserData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      accessCode: parsed.accessCode || '',
      name: parsed.name || '',
      profile: parsed.profile || null,
      quizAnswers: parsed.quizAnswers || {},
      customIntentions: parsed.customIntentions || DEFAULT_INTENTIONS,
      ritualCompletedDates: parsed.ritualCompletedDates || [],
      readUnits: parsed.readUnits || [],
      readingPositions: parsed.readingPositions || {},
      lastOpenedUnitId: parsed.lastOpenedUnitId || null,
      favorites: parsed.favorites || [],
      readerTheme: parsed.readerTheme || 'notte',
      readerFontSize: parsed.readerFontSize || 17,
      isVideocorsoUnlocked: !!parsed.isVideocorsoUnlocked,
      videoUnlockCode: parsed.videoUnlockCode || undefined,
      watchedVideos: parsed.watchedVideos || [],
    };
  } catch {
    return null;
  }
}

export function saveUserData(data: Partial<UserData>): UserData {
  const current = getUserData() || {
    accessCode: '',
    name: '',
    profile: null,
    quizAnswers: {},
    customIntentions: DEFAULT_INTENTIONS,
    ritualCompletedDates: [],
    readUnits: [],
    readingPositions: {},
    lastOpenedUnitId: null,
    favorites: [],
    readerTheme: 'notte' as const,
    readerFontSize: 17,
    isVideocorsoUnlocked: false,
    watchedVideos: [],
  };

  const updated: UserData = {
    ...current,
    ...data,
    customIntentions: data.customIntentions || current.customIntentions || DEFAULT_INTENTIONS,
    readUnits: data.readUnits !== undefined ? data.readUnits : current.readUnits,
    readingPositions: data.readingPositions !== undefined ? data.readingPositions : current.readingPositions,
    favorites: data.favorites !== undefined ? data.favorites : current.favorites,
    watchedVideos: data.watchedVideos !== undefined ? data.watchedVideos : current.watchedVideos,
  };

  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
  return updated;
}

export function clearUserData(): void {
  // Logout: removes access code
  const current = getUserData();
  if (current) {
    saveUserData({ accessCode: '' });
  }
}

// Coach Usage & Daily Limit
export function getCoachDailyUsage(): { usedToday: number; remainingToday: number; canSend: boolean } {
  const today = getTodayLocalDate();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USAGE);
    if (!raw) {
      return { usedToday: 0, remainingToday: COACH_DAILY_LIMIT, canSend: true };
    }
    const usage: DailyCoachUsage = JSON.parse(raw);
    if (usage.date !== today) {
      const resetUsage: DailyCoachUsage = { date: today, count: 0 };
      localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(resetUsage));
      return { usedToday: 0, remainingToday: COACH_DAILY_LIMIT, canSend: true };
    }
    const remaining = Math.max(0, COACH_DAILY_LIMIT - usage.count);
    return {
      usedToday: usage.count,
      remainingToday: remaining,
      canSend: remaining > 0,
    };
  } catch {
    return { usedToday: 0, remainingToday: COACH_DAILY_LIMIT, canSend: true };
  }
}

export function incrementCoachUsage(): { remainingToday: number } {
  const today = getTodayLocalDate();
  const current = getCoachDailyUsage();
  const newCount = current.usedToday + 1;
  const newUsage: DailyCoachUsage = { date: today, count: newCount };
  localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(newUsage));
  return { remainingToday: Math.max(0, COACH_DAILY_LIMIT - newCount) };
}

// Chat History
const INITIAL_COACH_MESSAGE: ChatMessage = {
  id: 'init-coach',
  sender: 'coach',
  text: 'Ciao, sono il tuo coach Effetto Calamita. Raccontami cosa è successo in pista o cosa ti blocca: ti rispondo con il metodo.',
  timestamp: Date.now(),
};

export function getChatMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (!raw) return [INITIAL_COACH_MESSAGE];
    const msgs: ChatMessage[] = JSON.parse(raw);
    return msgs.length > 0 ? msgs : [INITIAL_COACH_MESSAGE];
  } catch {
    return [INITIAL_COACH_MESSAGE];
  }
}

export function saveChatMessages(messages: ChatMessage[]): void {
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
}

export function resetChatMessages(): ChatMessage[] {
  const initial = [
    {
      ...INITIAL_COACH_MESSAGE,
      id: `init-${Date.now()}`,
      timestamp: Date.now(),
    },
  ];
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(initial));
  return initial;
}

// Missions State
export function getMissionsProgress(): Record<number, MissionProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (!raw) {
      const initial: Record<number, MissionProgress> = {};
      MISSIONS_21.forEach((m) => {
        initial[m.id] = { completed: false, note: '' };
      });
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    const initial: Record<number, MissionProgress> = {};
    MISSIONS_21.forEach((m) => {
      initial[m.id] = { completed: false, note: '' };
    });
    return initial;
  }
}

export function saveMissionProgress(
  id: number,
  data: Partial<MissionProgress>
): Record<number, MissionProgress> {
  const current = getMissionsProgress();
  current[id] = {
    ...current[id],
    ...data,
    completedAt: data.completed ? data.completedAt || new Date().toISOString() : undefined,
  };
  localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(current));
  return { ...current };
}

// Diary entries
export function getDiaryEntries(): EveningEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DIARY);
    if (!raw) return [];
    const entries: EveningEntry[] = JSON.parse(raw);
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function saveDiaryEntry(entry: EveningEntry): EveningEntry[] {
  const entries = getDiaryEntries();
  const existingIdx = entries.findIndex((e) => e.id === entry.id);
  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.unshift(entry);
  }
  localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(entries));
  return [...entries];
}

export function deleteDiaryEntry(id: string): EveningEntry[] {
  const entries = getDiaryEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(entries));
  return entries;
}

// Export and Wipe
export function exportAllData(): string {
  const payload = {
    user: getUserData(),
    missions: getMissionsProgress(),
    diary: getDiaryEntries(),
    chat: getChatMessages(),
    usage: localStorage.getItem(STORAGE_KEYS.USAGE),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Azzera i progressi, le note, il diario e le letture,
 * MA PRESERVA i codici di accesso e di sblocco videocorso come richiesto.
 */
export function wipeAllAppData(): void {
  const current = getUserData();
  const preservedAccessCode = current?.accessCode || '';
  const preservedVideoUnlock = !!current?.isVideocorsoUnlocked;
  const preservedVideoCode = current?.videoUnlockCode;

  // Clear sub-storages
  localStorage.removeItem(STORAGE_KEYS.MISSIONS);
  localStorage.removeItem(STORAGE_KEYS.DIARY);
  localStorage.removeItem(STORAGE_KEYS.CHAT);

  // Reset user data keeping codes
  saveUserData({
    accessCode: preservedAccessCode,
    isVideocorsoUnlocked: preservedVideoUnlock,
    videoUnlockCode: preservedVideoCode,
    profile: null,
    quizAnswers: {},
    readUnits: [],
    readingPositions: {},
    lastOpenedUnitId: null,
    favorites: [],
    watchedVideos: [],
    customIntentions: DEFAULT_INTENTIONS,
    ritualCompletedDates: [],
  });
}
