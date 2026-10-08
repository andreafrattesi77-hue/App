import { EveningEntry } from '../types';
import { generateCoachReasoning, generateEveningAdviceReasoning } from './coachReasoning';

export async function sendCoachChatMessage(params: {
  message: string;
  history: Array<{ sender: 'user' | 'coach'; text: string }>;
  userName?: string;
  userProfile?: string;
  currentMission?: string;
  activeUnitId?: string;
}): Promise<string> {
  try {
    const res = await fetch('/api/coach/chat', {
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
    return data.reply || generateCoachReasoning(params);
  } catch (error) {
    console.warn('Coach API call failed, generating reasoning from knowledge base:', error);
    return generateCoachReasoning(params);
  }
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
