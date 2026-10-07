import { ProfileType } from './config';

export interface UserData {
  id?: string;
  email?: string;
  accessCode: string;
  name: string;
  profile: ProfileType | null;
  quizAnswers: Record<number, ProfileType>;
  customIntentions: string[];
  ritualCompletedDates: string[]; // ISO dates (YYYY-MM-DD)
  readUnits: string[]; // array of unit IDs marked as completed
  readingPositions: Record<string, number>; // unitId -> progress percentage (0..100)
  lastOpenedUnitId: string | null;
  favorites: string[]; // bookmarked unit IDs
  readerTheme: 'notte' | 'giorno';
  readerFontSize: number; // in pixels, default 17
  isVideocorsoUnlocked: boolean;
  videoUnlockCode?: string;
  watchedVideos: number[]; // module numbers (1..9)
}

export interface EveningEntry {
  id: string;
  date: string; // YYYY-MM-DD
  venue: string;
  rating: number; // 1 to 5
  invitesCount: number;
  elegantNoCount: number;
  calamitaClosuresCount: number;
  missionCompleted: boolean;
  whatWorked: string;
  whatToImprove: string;
  coachAdvice?: string;
  createdAt: number;
}

export interface MissionProgress {
  completed: boolean;
  note: string;
  completedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: number;
}

export interface DailyCoachUsage {
  date: string; // YYYY-MM-DD
  count: number;
}
