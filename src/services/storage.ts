import { COACH_DAILY_LIMIT, MISSIONS_21 } from '../config';
import { UserData, EveningEntry, MissionProgress, ChatMessage, DailyCoachUsage } from '../types';

const STORAGE_KEYS = {
  USER: 'ec_user_data',
  ACTIVE_EMAIL: 'ec_active_email',
  ACCOUNTS_REGISTRY: 'ec_saved_accounts',
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

export function getActiveEmail(): string {
  try {
    return (localStorage.getItem(STORAGE_KEYS.ACTIVE_EMAIL) || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

export function setActiveEmail(email: string): void {
  try {
    const clean = email.trim().toLowerCase();
    if (clean) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_EMAIL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMAIL);
    }
  } catch {}
}

function getScopedKey(base: string, email?: string): string {
  const target = (email || getActiveEmail() || '').trim().toLowerCase();
  if (!target) return base;
  const safeTarget = target.replace(/[^a-z0-9]/g, '_');
  return `${base}__${safeTarget}`;
}

export interface SavedAccountItem {
  email: string;
  name: string;
  isTrial: boolean;
  accessCode: string;
  lastActive: number;
  questionsRemaining: number;
}

export function getSavedAccounts(): SavedAccountItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS_REGISTRY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function updateSavedAccountsRegistry(user: UserData): void {
  if (!user.email) return;
  try {
    const clean = user.email.trim().toLowerCase();
    const list = getSavedAccounts().filter((a) => a.email.toLowerCase() !== clean);
    const remaining = user.isTrial ? Math.max(0, 3 - (user.trialCoachQuestionsUsed || 0)) : 20;
    list.unshift({
      email: clean,
      name: user.name || '',
      isTrial: !!user.isTrial,
      accessCode: user.accessCode || '',
      lastActive: Date.now(),
      questionsRemaining: remaining,
    });
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS_REGISTRY, JSON.stringify(list.slice(0, 10)));
  } catch {}
}

export function getUserData(targetEmail?: string): UserData | null {
  try {
    const email = (targetEmail || getActiveEmail() || '').trim().toLowerCase();
    const scopedKey = email ? getScopedKey(STORAGE_KEYS.USER, email) : STORAGE_KEYS.USER;
    let raw = localStorage.getItem(scopedKey);
    if (!raw && !email) {
      raw = localStorage.getItem(STORAGE_KEYS.USER);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id || undefined,
      email: parsed.email || email,
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
      isTrial: parsed.isTrial !== undefined ? !!parsed.isTrial : (parsed.accessCode === 'TRIAL' || parsed.accessCode === 'DEMO'),
      trialCoachQuestionsUsed: Number(parsed.trialCoachQuestionsUsed) || 0,
    };
  } catch {
    return null;
  }
}

export function saveUserData(data: Partial<UserData>, targetEmail?: string): UserData {
  const target = (targetEmail || data.email || getActiveEmail() || '').trim().toLowerCase();

  if (target) {
    setActiveEmail(target);
  }

  // Load existing data for THIS SPECIFIC email (isolated from other accounts on the device)
  const current = (target ? getUserData(target) : null) || {
    id: undefined,
    email: target || '',
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
    isTrial: true,
    trialCoachQuestionsUsed: 0,
  };

  const incomingCode = (data.accessCode !== undefined ? data.accessCode : current.accessCode || '').trim().toUpperCase();
  const isExplicitTrialCode = incomingCode === 'TRIAL' || incomingCode === 'DEMO';
  const isPaidAccessCode = !!incomingCode && !isExplicitTrialCode;

  let resolvedIsTrial = current.isTrial;
  if (data.isTrial !== undefined) {
    resolvedIsTrial = data.isTrial;
  } else if (isPaidAccessCode) {
    resolvedIsTrial = false;
  } else if (isExplicitTrialCode) {
    resolvedIsTrial = true;
  }

  let resolvedVideocorso = current.isVideocorsoUnlocked;
  if (data.isVideocorsoUnlocked !== undefined) {
    resolvedVideocorso = data.isVideocorsoUnlocked;
  } else if (isPaidAccessCode) {
    resolvedVideocorso = true;
  }

  const updated: UserData = {
    ...current,
    ...data,
    accessCode: incomingCode || current.accessCode,
    email: target || data.email || current.email,
    customIntentions: data.customIntentions || current.customIntentions || DEFAULT_INTENTIONS,
    readUnits: data.readUnits !== undefined ? data.readUnits : current.readUnits,
    readingPositions: data.readingPositions !== undefined ? data.readingPositions : current.readingPositions,
    favorites: data.favorites !== undefined ? data.favorites : current.favorites,
    watchedVideos: data.watchedVideos !== undefined ? data.watchedVideos : current.watchedVideos,
    isTrial: resolvedIsTrial,
    isVideocorsoUnlocked: resolvedVideocorso,
    trialCoachQuestionsUsed: data.trialCoachQuestionsUsed !== undefined
      ? data.trialCoachQuestionsUsed
      : (current.trialCoachQuestionsUsed || 0),
  };

  if (target) {
    const scopedKey = getScopedKey(STORAGE_KEYS.USER, target);
    localStorage.setItem(scopedKey, JSON.stringify(updated));
    updateSavedAccountsRegistry(updated);
  }
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
  return updated;
}

export function isTrialUser(user?: UserData | null): boolean {
  if (!user) return true;
  const cleanCode = (user.accessCode || '').trim().toUpperCase();

  const validPurchaseCodes = ['MAGNETICO', 'CODICE', 'CALAMITA2026', 'CALAMITA', 'ACQUISTO_CONFERMATO'];
  if (validPurchaseCodes.includes(cleanCode)) {
    return false;
  }

  if (user.isTrial === true || cleanCode === 'TRIAL' || cleanCode === 'DEMO') {
    return true;
  }

  return true;
}

export function getTrialCoachRemaining(user?: UserData | null): number {
  if (!user) return 3;
  if (!isTrialUser(user)) return 999;
  return Math.max(0, 3 - (user.trialCoachQuestionsUsed || 0));
}

export function incrementTrialCoachQuestions(count?: number, email?: string): number {
  const target = email || getActiveEmail();
  const current = getUserData(target);
  const currentCount = current?.trialCoachQuestionsUsed || 0;
  const nextCount = typeof count === 'number' ? count : currentCount + 1;
  saveUserData({ trialCoachQuestionsUsed: nextCount }, target);
  return nextCount;
}

export function clearUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {}
}

export function removeSavedAccount(email: string): void {
  try {
    const clean = email.trim().toLowerCase();
    const list = getSavedAccounts().filter((a) => a.email.toLowerCase() !== clean);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS_REGISTRY, JSON.stringify(list));
    localStorage.removeItem(getScopedKey(STORAGE_KEYS.USER, clean));
    localStorage.removeItem(getScopedKey(STORAGE_KEYS.CHAT, clean));
    localStorage.removeItem(getScopedKey(STORAGE_KEYS.MISSIONS, clean));
    localStorage.removeItem(getScopedKey(STORAGE_KEYS.DIARY, clean));
    localStorage.removeItem(getScopedKey(STORAGE_KEYS.USAGE, clean));
    if (getActiveEmail() === clean) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch {}
}

export function switchAccount(email: string): UserData | null {
  const clean = email.trim().toLowerCase();
  const found = getUserData(clean);
  if (found) {
    setActiveEmail(clean);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(found));
    return found;
  }
  return null;
}

// Coach Usage & Daily Limit (isolated per email)
export function getCoachDailyUsage(email?: string): { usedToday: number; remainingToday: number; canSend: boolean } {
  const key = getScopedKey(STORAGE_KEYS.USAGE, email);
  const today = getTodayLocalDate();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { usedToday: 0, remainingToday: COACH_DAILY_LIMIT, canSend: true };
    }
    const usage: DailyCoachUsage = JSON.parse(raw);
    if (usage.date !== today) {
      const resetUsage: DailyCoachUsage = { date: today, count: 0 };
      localStorage.setItem(key, JSON.stringify(resetUsage));
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

export function incrementCoachUsage(email?: string): { remainingToday: number } {
  const key = getScopedKey(STORAGE_KEYS.USAGE, email);
  const today = getTodayLocalDate();
  const current = getCoachDailyUsage(email);
  const newCount = current.usedToday + 1;
  const newUsage: DailyCoachUsage = { date: today, count: newCount };
  localStorage.setItem(key, JSON.stringify(newUsage));
  return { remainingToday: Math.max(0, COACH_DAILY_LIMIT - newCount) };
}

// Chat History (isolated per email)
export function createInitialCoachMessage(userName?: string): ChatMessage {
  const cleanName = userName?.trim();
  const namePart = cleanName ? ` ${cleanName}, ` : ', ';
  return {
    id: 'init-coach',
    sender: 'coach',
    text: `Ciao${namePart}sono Andrea Frattesi il tuo coach di EFFETTO CALAMITA. Raccontami cosa è successo in pista o cosa ti blocca: ti rispondo subito con il metodo.`,
    timestamp: Date.now(),
  };
}

export function getChatMessages(userName?: string, email?: string): ChatMessage[] {
  const key = getScopedKey(STORAGE_KEYS.CHAT, email);
  try {
    const raw = localStorage.getItem(key);
    const initial = [createInitialCoachMessage(userName)];
    if (!raw) return initial;

    const msgs: ChatMessage[] = JSON.parse(raw);
    if (!Array.isArray(msgs) || msgs.length === 0) return initial;

    if (msgs.length === 1 && msgs[0].sender === 'coach') {
      return initial;
    }

    return msgs;
  } catch {
    return [createInitialCoachMessage(userName)];
  }
}

export function saveChatMessages(messages: ChatMessage[], email?: string): void {
  const key = getScopedKey(STORAGE_KEYS.CHAT, email);
  localStorage.setItem(key, JSON.stringify(messages));
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
}

export function resetChatMessages(userName?: string, email?: string): ChatMessage[] {
  const key = getScopedKey(STORAGE_KEYS.CHAT, email);
  const initial = [
    {
      ...createInitialCoachMessage(userName),
      id: `init-${Date.now()}`,
      timestamp: Date.now(),
    },
  ];
  localStorage.setItem(key, JSON.stringify(initial));
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(initial));
  return initial;
}

// Missions State (isolated per email)
export function getMissionsProgress(email?: string): Record<number, MissionProgress> {
  const key = getScopedKey(STORAGE_KEYS.MISSIONS, email);
  try {
    const raw = localStorage.getItem(key);
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
  data: Partial<MissionProgress>,
  email?: string
): Record<number, MissionProgress> {
  const key = getScopedKey(STORAGE_KEYS.MISSIONS, email);
  const current = getMissionsProgress(email);
  current[id] = {
    ...current[id],
    ...data,
    completedAt: data.completed ? data.completedAt || new Date().toISOString() : undefined,
  };
  localStorage.setItem(key, JSON.stringify(current));
  return { ...current };
}

// Diary entries (isolated per email)
export function getDiaryEntries(email?: string): EveningEntry[] {
  const key = getScopedKey(STORAGE_KEYS.DIARY, email);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const entries: EveningEntry[] = JSON.parse(raw);
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function saveDiaryEntry(entry: EveningEntry, email?: string): EveningEntry[] {
  const key = getScopedKey(STORAGE_KEYS.DIARY, email);
  const entries = getDiaryEntries(email);
  const existingIdx = entries.findIndex((e) => e.id === entry.id);
  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.unshift(entry);
  }
  localStorage.setItem(key, JSON.stringify(entries));
  return [...entries];
}

export function deleteDiaryEntry(id: string, email?: string): EveningEntry[] {
  const key = getScopedKey(STORAGE_KEYS.DIARY, email);
  const entries = getDiaryEntries(email).filter((e) => e.id !== id);
  localStorage.setItem(key, JSON.stringify(entries));
  return entries;
}

// Export and Wipe
export function exportAllData(email?: string): string {
  const target = email || getActiveEmail();
  const payload = {
    user: getUserData(target),
    missions: getMissionsProgress(target),
    diary: getDiaryEntries(target),
    chat: getChatMessages(undefined, target),
    usage: getCoachDailyUsage(target),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

export function wipeAllAppData(email?: string): void {
  const target = email || getActiveEmail();
  const current = getUserData(target);
  const preservedAccessCode = current?.accessCode || '';
  const preservedVideoUnlock = !!current?.isVideocorsoUnlocked;
  const preservedVideoCode = current?.videoUnlockCode;

  // Clear sub-storages for this email
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.MISSIONS, target));
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.DIARY, target));
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.CHAT, target));

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
  }, target);
}
