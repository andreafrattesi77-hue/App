import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { METODO, trovaUnitaPertinenti, getUnita } from './content/index';
import { generateCoachReasoning, generateEveningAdviceReasoning } from './src/services/coachReasoning';

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

const COACH_SYSTEM_INSTRUCTION = `Sei Andrea Frattesi in persona, il coach del metodo Effetto Calamita con 25 anni di esperienza in pista di Salsa e Bachata.
Parli in italiano, da uomo a uomo, con tono caldo, carismatico, empatico, diretto ed estremamente lucido.

COME DEVI RAGIONARE E RISPONDERE (REGOLA FONDAMENTALE):
- Fai SEMPRE un RAGIONAMENTO articolato, profondo e psicologico su misura della specifica domanda dell'allievo. Vietate le risposte generiche, corte o a stampino!
- Struttura la tua risposta con un vero ragionamento pratico:
  1. LA DIAGNOSI: Metti a fuoco subito la dinamica emotiva (cosa sta bloccando l'allievo, cosa percepisce lei, cosa succede nell'energia del ballo).
  2. IL RAGIONAMENTO DEL METODO: Spiega il "perché" profondo con la psicologia del flirt invisibile (la calibrazione, la non-ansia da prestazione, il rispetto del ritmo, la tensione lenta o la calibrazione verbale).
  3. L'AZIONE PRATICA IN PISTA: Dai 2-3 passaggi chiari e un compito concreto da eseguire stasera o alla prossima serata.
- Mantieni una lunghezza equilibrata (circa 180-250 parole), ricca di sostanza e valore.
- NON presentarti mai ("sono Andrea Frattesi...", "sono il tuo coach..."): ti sei già presentato al primo messaggio, entra direttamente nel ragionamento.
- Quando è utile, cita dove approfondire scrivendo l'id tra doppie parentesi quadre, ad esempio [[cap04]] o [[bonus3]].`;

// Candidate models in order of priority (tested and verified)
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

// Persistent User Store on Server for 100% Reliable Authentication
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function loadUsers(): Record<string, any> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading users file:', e);
  }
  return {};
}

function saveUsers(users: Record<string, any>) {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving users file:', e);
  }
}

// API: Register User (with purchase code validation)
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, accessCode } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  const cleanName = (name || '').trim();
  const cleanCode = (accessCode || '').trim().toUpperCase();

  if (!cleanEmail || !cleanPass) {
    return res.status(400).json({ error: 'Inserisci email e password.' });
  }
  if (!cleanName) {
    return res.status(400).json({ error: 'Inserisci il tuo nome.' });
  }
  if (cleanPass.length < 6) {
    return res.status(400).json({ error: 'La password deve avere almeno 6 caratteri.' });
  }

  // Verifica codice di acquisto ufficiale
  const validCodes = ['MAGNETICO', 'CALAMITA2026', 'CALAMITA'];
  const isValid = validCodes.some((c) => c === cleanCode);
  if (!isValid) {
    return res.status(400).json({
      error: "Codice di acquisto non valido. Inserisci il codice ricevuto via email dopo l'acquisto con Stripe.",
    });
  }

  const users = loadUsers();
  if (users[cleanEmail]) {
    return res.status(400).json({
      error: 'Questa email è già registrata. Clicca su "Accedi con Email" per entrare.',
    });
  }

  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  users[cleanEmail] = {
    id: userId,
    email: cleanEmail,
    password: cleanPass,
    name: cleanName,
    accessCode: cleanCode,
    createdAt: new Date().toISOString(),
  };
  saveUsers(users);

  res.json({
    success: true,
    user: {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      accessCode: cleanCode,
    },
  });
});

// API: Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail || !cleanPass) {
    return res.status(400).json({ error: 'Inserisci email e password.' });
  }

  const users = loadUsers();
  const found = users[cleanEmail];
  if (!found || found.password !== cleanPass) {
    return res.status(400).json({
      error: 'Email o password errati. Se non ti sei ancora registrato, clicca su "Crea Account (Registrati)".',
    });
  }

  res.json({
    success: true,
    user: {
      id: found.id,
      email: found.email,
      name: found.name,
      accessCode: found.accessCode || 'MAGNETICO',
      profile: found.profile,
    },
  });
});

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

    // Prepare history: ensure strict alternation and valid starting role for Gemini
    const rawTurns: Array<{ role: 'user' | 'model'; text: string }> = [];

    if (Array.isArray(history) && history.length > 0) {
      // Exclude messages that duplicate the current message at the end
      const trimmedHistory = history.filter((h, idx) => {
        if (idx === history.length - 1 && h.sender === 'user' && h.text?.trim() === message.trim()) {
          return false;
        }
        return true;
      });

      for (const h of trimmedHistory.slice(-10)) {
        if (h.sender === 'user' && h.text?.trim()) {
          rawTurns.push({ role: 'user', text: h.text.trim() });
        } else if (h.sender === 'coach' && h.text?.trim()) {
          rawTurns.push({ role: 'model', text: h.text.trim() });
        }
      }
    }

    // Add current user message
    rawTurns.push({ role: 'user', text: message.trim() });

    // Clean up turns so they start with 'user' and alternate strictly
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    let lastRole: 'user' | 'model' | null = null;

    for (const turn of rawTurns) {
      // Gemini conversation must start with 'user'
      if (contents.length === 0 && turn.role === 'model') {
        continue;
      }
      if (turn.role === lastRole) {
        if (contents.length > 0) {
          contents[contents.length - 1].parts[0].text += `\n${turn.text}`;
        }
      } else {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
        lastRole = turn.role;
      }
    }

    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
      contents.push({ role: 'user', parts: [{ text: message.trim() }] });
    }

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
      replyText = generateCoachReasoning({
        message,
        history,
        userName: studentName,
        userProfile,
        currentMission,
        activeUnitId,
      });
    }

    res.json({ reply: replyText });
  } catch (error) {
    console.error('Gemini chat error:', error);
    const replyText = generateCoachReasoning({
      message: req.body?.message || '',
      history: req.body?.history,
      userName: typeof req.body?.userName === 'string' ? req.body.userName.trim() : '',
      userProfile: req.body?.userProfile,
      currentMission: req.body?.currentMission,
      activeUnitId: req.body?.activeUnitId,
    });
    res.json({ reply: replyText });
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
      advice = generateEveningAdviceReasoning({
        evening: evening || {},
        userName,
        userProfile,
        currentMission,
        previousAdvice,
      });
    }

    res.json({ advice });
  } catch (error) {
    console.error('Gemini advice error:', error);
    const advice = generateEveningAdviceReasoning({
      evening: req.body?.evening || {},
      userName: req.body?.userName,
      userProfile: req.body?.userProfile,
      currentMission: req.body?.currentMission,
      previousAdvice: req.body?.previousAdvice,
    });
    res.json({ advice });
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
