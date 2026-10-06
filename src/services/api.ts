import { EveningEntry } from '../types';

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
    return data.reply || 'Continua a lavorare sul tuo Asse e sul Contatto Zero alla prossima serata.';
  } catch (error) {
    console.error('Coach API call failed:', error);
    throw new Error('Il Coach è momentaneamente occupato, riprova tra poco.');
  }
}

export async function getEveningAdvice(params: {
  evening: EveningEntry;
  currentMission?: string;
  readingUnitId?: string;
  userProfile?: string;
  userName?: string;
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
    return data.advice || 'Ottimo lavoro per essere sceso in pista. Rivedi il Contatto Zero e ripeti la missione.';
  } catch (error) {
    console.error('Evening advice API call failed:', error);
    throw new Error('Il Coach è momentaneamente occupato, riprova tra poco.');
  }
}
