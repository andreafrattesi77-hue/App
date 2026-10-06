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
    const cleanName = params.userName?.trim();
    const namePart = cleanName ? `Ciao ${cleanName}, ` : 'Ciao, ';
    return `${namePart}qualunque sia il dubbio in questo momento, torna subito all'Asse! Respira a fondo, allinea la postura e applica la regola dei 3 secondi prima dell'invito. Rivedi [[cap06]] o il Rituale Pre-Serata in [[bonus2]] prima del prossimo ballo!`;
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
    const cleanName = params.userName?.trim();
    const namePart = cleanName ? `Bravo ${cleanName}! ` : 'Bravo! ';
    return `${namePart}Scendere in pista è sempre la cosa più importante.\n\n1. Cosa è andato bene: Hai registrato la serata e mantenuto la continuità.\n2. Punto su cui concentrarsi: Il Contatto Zero e la calma all'invito.\n3. Azione per la prossima volta: Applica la regola dei 3 secondi entro i primi dieci minuti dall'arrivo!`;
  }
}
