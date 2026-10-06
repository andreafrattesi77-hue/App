import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { METODO, trovaUnitaPertinenti, getUnita } from './content/index';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI client with standard telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const COACH_SYSTEM_INSTRUCTION = `Sei Andrea Frattesi in persona, il coach del metodo Effetto Calamita. Balli Salsa e Bachata da 25 anni. Parli in italiano, da uomo a uomo, con tono caldo, diretto, pratico, amichevole ed empatico. Frasi incisive, niente gergo astratto, massimo 150 parole per risposta, chiudi spesso con un'azione concreta da provare alla prossima serata.
Rispondi sulla base della SINTESI DEL METODO e dei TESTI DEL CAPITOLO che ricevi.

IMPORTANTE SULLA VARIETÀ E PERTINENZA (NON ESSERE RIPETITIVO):
- Rispondi in modo SPECIFICO, FRESCO e MIRATO alla domanda precisa dell'allievo.
- NON dare risposte generiche o fotocopia. NON ripetere a ogni singola risposta sempre le stesse identiche frasi o gli stessi concetti fissi (come "torna all'Asse", "Contatto Zero" o "la regola dei 3 secondi"), a meno che la domanda non sia specificamente su quello.
- Adatta la risposta al tema sollevato:
  * Se chiede cosa dire, come parlare o come chattare: concentrati sulle Parole del Filo, sulla calibrazione verbale, sul non fare interrogatori e sui complimenti giusti ([[cap13]], [[cap14]], [[bonus1]], [[bonus4]]).
  * Se chiede del rifiuto o del no: insegna il No Elegante, a non prenderla sul personale e a ripartire leggeri ([[cap08]], [[bonus3]]).
  * Se chiede del dopo-ballo o di prendere il numero/contatto: spiega la Chiusura Calamita e i tempi giusti ([[cap15]], [[cap16]], [[bonus5]]).
  * Se chiede della Bachata o della vicinanza fisica: parla dei gradi di vicinanza e della Tensione Lenta, senza forzare ([[cap11]], [[cap12]], [[bonus6]]).
  * Se chiede di insicurezza o ansia prima di invitare: parla dello sblocco in pista e dell'invito con il palmo verso l'alto ([[cap07]], [[cap10]], [[bonus2]]).
- Quando è utile, indica dove approfondire scrivendo l'id tra doppie parentesi quadre, ad esempio [[cap04]] o [[bonus3]]: l'app lo trasformerà in un link. Usa solo id esistenti: intro, cap01…cap16, next, rip1, rip2, bonus1…bonus6.

Regole:
- NON presentarti mai più dicendo chi sei ("sono Andrea Frattesi...", "sono il tuo coach..."): ti sei già presentato nel messaggio di benvenuto. Nelle risposte devi SOLO rispondere alla domanda dell'allievo, senza preamboli ripetitivi.
- Promuovi sempre rispetto e consenso; non suggerire mai manipolazione o insistenza; se lei non è interessata, insegna a capirlo e a salutare con eleganza. L'assenza di un no non è un sì. Non dare consigli medici o psicologici. Se la domanda è fuori tema rispetto a ballo, sicurezza e relazioni, riporta gentilmente la conversazione sul metodo.`;

// Candidate models in order of priority (resilient to 503 spikes)
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

// API: Coach Chat
app.post('/api/coach/chat', async (req, res) => {
  try {
    const {
      message,
      history,
      userName,
      userProfile,
      currentMission,
      activeUnitId,
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Messaggio non fornito.' });
      return;
    }

    const studentName = typeof userName === 'string' ? userName.trim() : '';

    // Determine relevant units for context
    let unit1 = activeUnitId ? getUnita(activeUnitId) : undefined;
    let unit2: ReturnType<typeof getUnita> = undefined;

    if (!unit1) {
      const pert = trovaUnitaPertinenti(message, 2);
      unit1 = pert[0];
      unit2 = pert[1];
    } else {
      const pert = trovaUnitaPertinenti(message, 2);
      unit2 = pert.find((u) => u.id !== unit1?.id);
    }

    let contextualPrompt = `${COACH_SYSTEM_INSTRUCTION}

SINTESI DEL METODO:
${METODO}
`;

    if (unit1) {
      contextualPrompt += `
TESTO COMPLETO CAPITOLO CORRENTE/PERTINENTE (${unit1.label} - ${unit1.titolo}):
${unit1.testo}
`;
    }

    if (unit2) {
      contextualPrompt += `
CAPITOLO COLLEGATO SECONDARIO:
Label: ${unit2.label} - ${unit2.titolo} (id: ${unit2.id})
Sintesi: ${unit2.sintesi}
`;
    }

    if (studentName) {
      contextualPrompt += `\n\nREQUISITO SUL NOME DELL'ALLIEVO:
L'allievo con cui stai parlando si chiama "${studentName}".
Rivolgiti a lui chiamandolo per nome (es. "Ciao ${studentName}," oppure usando il nome nel testo) in modo caldo e diretto.
ATTENZIONE: NON ri-presentarti MAI ("sono Andrea Frattesi...", "sono il tuo coach..."). Sei già a conversazione avviata: vai dritto al punto rispondendo alla sua domanda.`;
    }
    if (userProfile) {
      contextualPrompt += `\nProfilo dell'allievo dal test: "${userProfile}".`;
    }
    if (currentMission) {
      contextualPrompt += `\nMissione corrente nel Piano 21 Serate: "${currentMission}".`;
    }

    // Prepare history: only last 10 messages
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-10)) {
        if (h.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: h.text }] });
        } else if (h.sender === 'coach') {
          contents.push({ role: 'model', parts: [{ text: h.text }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    let replyText = '';
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: contextualPrompt,
            temperature: 0.7,
          },
        });

        if (response.text && response.text.trim()) {
          replyText = response.text.trim();
          break;
        }
      } catch (err: unknown) {
        console.warn(`Model ${modelName} call failed, trying next fallback:`, (err as Error)?.message || err);
      }
    }

    if (!replyText) {
      const nameGreeting = studentName ? `Ciao ${studentName}, ` : 'Ciao, ';
      replyText = `${nameGreeting}qualunque sia la situazione in pista, mantieni la calma e ascolta il ritmo. Metti a fuoco la connessione con la partner senza fretta e ripassa [[cap06]] o il Rituale Pre-Serata in [[bonus2]]!`;
    }

    res.json({ reply: replyText });
  } catch (error) {
    console.error('Gemini chat error:', error);
    const studentName = typeof req.body?.userName === 'string' ? req.body.userName.trim() : '';
    const nameGreeting = studentName ? `Ciao ${studentName}, ` : 'Ciao, ';
    res.json({
      reply: `${nameGreeting}qualunque sia il dubbio in questo momento, concentrati sulla presenza e sul respiro. Alla prossima serata applica i consigli di [[cap06]] e divertiti in pista!`,
    });
  }
});

// API: Advice on evening diary
app.post('/api/coach/evening-advice', async (req, res) => {
  try {
    const { evening, currentMission, readingUnitId, userProfile, userName, previousAdvice } = req.body;

    const missionUnit = readingUnitId ? getUnita(readingUnitId) : undefined;

    const contextualPrompt = `${COACH_SYSTEM_INSTRUCTION}

SINTESI DEL METODO:
${METODO}

${
  missionUnit
    ? `TESTO GUIDA DELLA MISSIONE CORRENTE (${missionUnit.label} - ${missionUnit.titolo}):
${missionUnit.testo}`
    : ''
}
`;

    const previousAdviceInstruction = previousAdvice
      ? `
ATTENZIONE CRUCIALE: L'allievo ha già ricevuto questo consiglio per questa serata:
"""${previousAdvice}"""
Ha richiesto espressamente un NUOVO CONSIGLIO DIVERSO E COMPLEMENTARE!
NON ripetere assolutamente gli stessi punti o le stesse osservazioni già date sopra.
Analizza la sua serata da un'angolazione differente (ad esempio focalizzati sulla Tensione Lenta, sul dopo-ballo, sulla gestione dei no, sulla calibrazione verbale o sull'atteggiamento mentale).
Fornisci 3 punti freschi, inediti e un'azione concreta diversa per la prossima serata!`
      : '';

    const eveningContext = `
Dati della serata di ${userName || 'questo allievo'}:
- Locale: ${evening?.venue || 'Non specificato'}
- Termometro del filo (1 a 5): ${evening?.rating || 3}/5
- Inviti fatti: ${evening?.invitesCount ?? 0}
- No gestiti con eleganza: ${evening?.elegantNoCount ?? 0}
- Chiusure Calamita eseguite: ${evening?.calamitaClosuresCount ?? 0}
- Missione completata: ${evening?.missionCompleted ? 'Sì' : 'No'}
- Cosa ha funzionato: ${evening?.whatWorked || 'Nessuna nota'}
- Cosa migliorare: ${evening?.whatToImprove || 'Nessuna nota'}
${userProfile ? `- Profilo allievo: ${userProfile}` : ''}
${currentMission ? `- Missione attuale: ${currentMission}` : ''}
${previousAdviceInstruction}
    `.trim();

    let advice = '';
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Analizza questa serata dell'allievo e fornisci il tuo consiglio nello stile del Coach Andrea Frattesi. Rispondi con massimo 120 parole, diviso chiaramente in questi 3 punti (puoi includere link ad unità [[id]] se utile):
1. Cosa è andato bene
2. Un punto su cui concentrarsi
3. Un'azione concreta per la prossima serata

Ecco i dati:
${eveningContext}`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: contextualPrompt,
            temperature: previousAdvice ? 0.9 : 0.8,
          },
        });

        if (response.text && response.text.trim()) {
          advice = response.text.trim();
          break;
        }
      } catch (err: unknown) {
        console.warn(`Evening advice model ${modelName} failed:`, (err as Error)?.message || err);
      }
    }

    if (!advice) {
      const nameGreeting = userName ? `Bravo ${userName}! ` : 'Bravo! ';
      advice = `${nameGreeting}Scendere in pista è sempre la cosa più importante.\n\n1. Cosa è andato bene: Hai registrato la serata e mantenuto la continuità.\n2. Punto su cui concentrarsi: La presenza rilassata e la gestione del ritmo tra un ballo e l'altro.\n3. Azione per la prossima volta: Prima del prossimo invito, fai due respiri profondi e guarda il sorriso di lei prima di muovere i piedi!`;
    }

    res.json({ advice });
  } catch (error) {
    console.error('Gemini advice error:', error);
    const studentName = typeof req.body?.userName === 'string' ? req.body.userName.trim() : '';
    const nameGreeting = studentName ? `Bravo ${studentName}! ` : 'Bravo! ';
    res.json({
      advice: `${nameGreeting}Ogni serata in pista è un tassello prezioso. Concentrati sulla leggerezza e sulla connessione per la prossima volta: rileggi [[cap06]] o [[cap11]] e divertiti!`,
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Dev vs Prod Vite setup
const isProd =
  process.env.NODE_ENV === 'production' &&
  fs.existsSync(path.resolve(__dirname, 'dist'));

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
