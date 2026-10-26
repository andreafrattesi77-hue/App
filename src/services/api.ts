import { EveningEntry } from '../types';
import { generateCoachReasoning, generateEveningAdviceReasoning } from './coachReasoning';

export interface CoachChatResponse {
  reply: string;
  trialCoachQuestionsUsed?: number;
  trialRemaining?: number;
  trialLimitReached?: boolean;
}

export async function sendCoachChatMessage(params: {
  message: string;
  history: Array<{ sender: 'user' | 'coach'; text: string }>;
  userName?: string;
  userEmail?: string;
  isTrial?: boolean;
  accessCode?: string;
  userProfile?: string;
  currentMission?: string;
  activeUnitId?: string;
}): Promise<CoachChatResponse> {
  const res = await fetch('/api/coach/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.trialLimitReached) {
    if (res.status === 403 || data.trialLimitReached) {
      const err = new Error(data.error || 'Limite di 3 domande di prova raggiunto.');
      (err as any).trialLimitReached = true;
      (err as any).questionsUsed = data.questionsUsed ?? 3;
      (err as any).remaining = data.remaining ?? 0;
      throw err;
    }
    throw new Error(data.error || `Server returned status ${res.status}`);
  }

  return {
    reply: data.reply || generateCoachReasoning(params),
    trialCoachQuestionsUsed: data.trialCoachQuestionsUsed,
    trialRemaining: data.trialRemaining,
    trialLimitReached: data.trialLimitReached,
  };
}

export async function getEveningAdvice(params: {
  evening: EveningEntry;
  currentMission?: string;
  readingUnitId?: string;
  userProfile?: string;
  userName?: string;
  previousAdvice?: string;
}): Promise<string> {
  try {
    const res = await fetch('/api/coach/evening-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return data.advice || generateEveningAdviceReasoning(params);
  } catch (error) {
    console.warn('Evening advice API call failed, generating reasoning:', error);
    return generateEveningAdviceReasoning(params);
  }
}
