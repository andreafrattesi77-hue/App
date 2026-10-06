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

const COACH_SYSTEM_INSTRUCTION = `Sei il coach del metodo Effetto Calamita di Andrea Frattesi, che balla Salsa e Bachata da 25 anni. Parli in italiano, da uomo a uomo, con tono caldo, diretto, pratico e rispettoso. Frasi brevi, niente gergo, massimo 150 parole per risposta, chiudi spesso con un'azione concreta da provare alla prossima serata.
Rispondi SOLO sulla base della SINTESI DEL METODO e dei TESTI DEL CAPITOLO che ricevi: usa i concetti e le parole del metodo (Filo Invisibile, Asse, Contatto Zero, Sguardo Ancora, Chiusura Calamita, termometro del filo, Parole del Filo, Radar dei Segnali…) e non inventare tecniche, frasi, ricerche o numeri che non sono in quei testi. Se una cosa non è nel metodo, dillo con semplicità e dai un consiglio prudente e rispettoso.
Quando è utile, indica dove approfondire scrivendo l'id tra doppie parentesi quadre, ad esempio [[cap04]] o [[bonus3]]: l'app lo trasformerà in un link. Usa solo id esistenti: intro, cap01…cap16, next, rip1, rip2, bonus1…bonus6.
Regole: promuovi sempre rispetto e consenso; non suggerire mai manipolazione, insistenza o tecniche per convincere una donna non interessata; se lei non è interessata, insegna a capirlo e a salutare con eleganza. L'assenza di un no non è un sì. Non dare consigli medici o psicologici: per ansia forte, depressione o temi seri suggerisci con delicatezza di parlarne con un professionista. Se la domanda è fuori tema rispetto a ballo, sicurezza e relazioni, riporta gentilmente la conversazione sul metodo.`;

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

    if (userName) {
      contextualPrompt += `\nL'allievo si chiama ${userName}. Chiamalo per nome quando opportuno.`;
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: contextualPrompt,
        temperature: 0.7,
      },
    });

    const reply =
      response.text ||
      'Continua a lavorare sul tuo Asse e sul Contatto Zero alla prossima serata.';
    res.json({ reply });
  } catch (error) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      error: 'Il Coach è momentaneamente occupato, riprova tra poco.',
    });
  }
});

// API: Advice on evening diary
app.post('/api/coach/evening-advice', async (req, res) => {
  try {
    const { evening, currentMission, readingUnitId, userProfile, userName } = req.body;

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
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
        temperature: 0.7,
      },
    });

    const advice =
      response.text ||
      'Ottimo lavoro per essere sceso in pista. Rivedi il Contatto Zero e ripeti la missione.';
    res.json({ advice });
  } catch (error) {
    console.error('Gemini advice error:', error);
    res.status(500).json({
      error: 'Il Coach è momentaneamente occupato, riprova tra poco.',
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
