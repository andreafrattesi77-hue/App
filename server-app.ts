import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { METODO, trovaUnitaPertinenti, getUnita } from './content/index';
import { generateCoachReasoning, generateEveningAdviceReasoning } from './src/services/coachReasoning';
import { analyzeWithEssentia } from './src/services/essentiaServer';
import { DEFAULT_SHARED_TRACKS } from './src/data/defaultSharedTracks';

dotenv.config();

const ROOT_DIR = process.cwd();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: ['application/octet-stream', 'audio/*'], limit: '50mb' }));

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
- Quando è utile, cita dove approfondire scrivendo l'id tra doppie parentesi quadre, ad esempio [[cap04]] o [[bonus3]].

CONFINI ED ESCLUSIVITÀ DI RUOLO (REGOLA ANTI OFF-TOPIC):
Rispondi ESCLUSIVAMENTE su temi pertinenti:
- Ballo sociale (Salsa, Bachata, pista, serate, locali, musicalità, ritmo, guida, posture, connessione).
- Dinamiche di seduzione, flirt invisibile, attrazione, gestione dell'ansia da approccio, inviti, rifiuti, comunicazione verbale e non verbale.
- Metodo Effetto Calamita, capitoli dell'ebook, bonus e Piano 21 Serate.
Se l'allievo fa domande completamente fuori tema (es. ricette, cucina, tecnologia, programmazione, politica, compiti, finanza, meteo, medicina):
NON rispondere come un'enciclopedia o assistente generico!
Rifiuta cordialmente ma con tono fermo, diretto e carismatico:
"Io sono qui per farti diventare l'uomo magnetico che ogni donna ricorda in pista di Salsa e Bachata. Lasciamo da parte queste distrazioni: dimmi piuttosto cosa ti blocca prima dell'invito o su quale ballo vuoi lavorare stasera."`;

// Candidate models in order of priority (tested and verified)
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

// Persistent User Store on Server for 100% Reliable Authentication
const USERS_FILE = path.resolve(ROOT_DIR, 'data', 'users.json');

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

// Persistent Coach Trial Usage Store on Server (tracks questions asked per email)
const COACH_TRIAL_FILE = path.resolve(ROOT_DIR, 'data', 'coach_trial_usage.json');

interface CoachTrialUsageRecord {
  email: string;
  count: number;
  lastUsedAt: string;
  history?: Array<{ question: string; time: string }>;
}

function loadCoachTrialUsage(): Record<string, CoachTrialUsageRecord> {
  try {
    if (fs.existsSync(COACH_TRIAL_FILE)) {
      const raw = fs.readFileSync(COACH_TRIAL_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading coach trial usage:', e);
  }
  return {};
}

function saveCoachTrialUsage(data: Record<string, CoachTrialUsageRecord>) {
  try {
    fs.mkdirSync(path.dirname(COACH_TRIAL_FILE), { recursive: true });
    fs.writeFileSync(COACH_TRIAL_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving coach trial usage:', e);
  }
}

function getCoachTrialQuestionsUsed(email: string): number {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return 0;
  const store = loadCoachTrialUsage();
  return store[cleanEmail]?.count || 0;
}

function incrementCoachTrialQuestions(email: string, questionText?: string): number {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return 0;
  const store = loadCoachTrialUsage();
  const existing = store[cleanEmail] || {
    email: cleanEmail,
    count: 0,
    lastUsedAt: new Date().toISOString(),
    history: [],
  };
  existing.count = (existing.count || 0) + 1;
  existing.lastUsedAt = new Date().toISOString();
  if (!Array.isArray(existing.history)) existing.history = [];
  if (questionText) {
    existing.history.push({
      question: questionText.slice(0, 300),
      time: new Date().toISOString(),
    });
  }
  store[cleanEmail] = existing;
  saveCoachTrialUsage(store);
  return existing.count;
}

// API: Check Coach Trial Status by Email
app.get('/api/coach/trial-status', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email non specificata' });
  }
  const count = getCoachTrialQuestionsUsed(email);
  const remaining = Math.max(0, 3 - count);
  res.json({
    email,
    questionsUsed: count,
    remaining,
    isLimitReached: count >= 3,
  });
});

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
  const {
    message,
    history,
    userName,
    userEmail,
    isTrial,
    accessCode,
    userProfile,
    currentMission,
    activeUnitId,
  } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Messaggio non fornito.' });
    return;
  }

  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  const cleanCode = String(accessCode || '').trim().toUpperCase();
  const validPurchaseCodes = ['MAGNETICO', 'CALAMITA2026', 'CALAMITA', 'CODICE'];
  const isPaidUser = validPurchaseCodes.includes(cleanCode);
  const isTrialUserRequest = isTrial === true || cleanCode === 'TRIAL' || cleanCode === 'DEMO' || !isPaidUser;

  // Se è utente in prova, controlla il limite di 3 domande memorizzato per questa email sul server
  if (isTrialUserRequest) {
    if (!cleanEmail) {
      return res.status(403).json({
        error: 'Email non specificata. Per usufruire della prova gratuita è necessario inserire la propria email.',
        trialLimitReached: true,
        remaining: 0,
      });
    }

    const currentUsed = getCoachTrialQuestionsUsed(cleanEmail);
    if (currentUsed >= 3) {
      return res.status(403).json({
        error: 'Hai raggiunto il limite massimo di 3 domande gratuite della prova per questa email.',
        trialLimitReached: true,
        questionsUsed: currentUsed,
        remaining: 0,
      });
    }
  }

  try {
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

    let newTrialCount: number | undefined = undefined;
    let newTrialRemaining: number | undefined = undefined;

    if (isTrialUserRequest && cleanEmail) {
      newTrialCount = incrementCoachTrialQuestions(cleanEmail, message);
      newTrialRemaining = Math.max(0, 3 - newTrialCount);
    }

    res.json({
      reply: replyText,
      trialCoachQuestionsUsed: newTrialCount,
      trialRemaining: newTrialRemaining,
      trialLimitReached: newTrialRemaining !== undefined ? newTrialRemaining <= 0 : false,
    });
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

    let newTrialCount: number | undefined = undefined;
    let newTrialRemaining: number | undefined = undefined;

    if (isTrialUserRequest && cleanEmail) {
      newTrialCount = incrementCoachTrialQuestions(cleanEmail, message);
      newTrialRemaining = Math.max(0, 3 - newTrialCount);
    }

    res.json({
      reply: replyText,
      trialCoachQuestionsUsed: newTrialCount,
      trialRemaining: newTrialRemaining,
      trialLimitReached: newTrialRemaining !== undefined ? newTrialRemaining <= 0 : false,
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

// API: Analisi Ritmica Professionale con Essentia.js MIR
app.post(['/api/audio/analyze-rhythm', '/api/analyze-rhythm'], (req, res) => {
  try {
    let samples: Float32Array | null = null;
    let sampleRate = 22050;
    let preferredGenre: 'salsa' | 'bachata' | 'auto' = 'auto';

    if (Buffer.isBuffer(req.body)) {
      const srHeader = Number(req.headers['x-sample-rate']);
      if (!isNaN(srHeader) && srHeader > 0) sampleRate = srHeader;
      const genreHeader = String(req.headers['x-genre'] || '').toLowerCase();
      if (genreHeader === 'salsa' || genreHeader === 'bachata') preferredGenre = genreHeader;
      samples = new Float32Array(req.body.buffer, req.body.byteOffset, req.body.byteLength / 4);
    } else if (req.body) {
      if (req.body.sampleRate) sampleRate = Number(req.body.sampleRate);
      if (req.body.preferredGenre) preferredGenre = req.body.preferredGenre;

      if (req.body.samplesBase64) {
        const buf = Buffer.from(req.body.samplesBase64, 'base64');
        samples = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
      } else if (Array.isArray(req.body.samples)) {
        samples = new Float32Array(req.body.samples);
      }
    }

    if (!samples || samples.length === 0) {
      return res.status(400).json({ error: 'Nessun campione audio ricevuto.' });
    }

    const result = analyzeWithEssentia(samples, sampleRate, preferredGenre);
    if (!result) {
      return res.status(500).json({ error: 'Errore durante l\'analisi con Essentia.js.' });
    }

    res.json(result);
  } catch (error) {
    console.error('Errore API analyze-rhythm:', error);
    res.status(500).json({ error: 'Errore interno analisi ritmica.' });
  }
});

// --- LIBRERIA CONDIVISA PERMANENTE DEI BRANI (DISPONIBILE PER TUTTI GLI ALLIEVI) ---
const TRACKS_DIR = path.resolve(ROOT_DIR, 'data', 'tracks');
const TRACKS_FILE = path.resolve(ROOT_DIR, 'data', 'shared_tracks.json');
const PUBLIC_TRACKS_DIR = path.resolve(ROOT_DIR, 'public', 'tracks');
const PUBLIC_TRACKS_FILE = path.resolve(ROOT_DIR, 'public', 'shared_tracks.json');
const DIST_TRACKS_DIR = path.resolve(ROOT_DIR, 'dist', 'tracks');
const DIST_TRACKS_FILE = path.resolve(ROOT_DIR, 'dist', 'shared_tracks.json');

if (!fs.existsSync(TRACKS_DIR)) {
  fs.mkdirSync(TRACKS_DIR, { recursive: true });
}

// Serve /tracks staticamente da qualsiasi cartella disponibile
app.use('/tracks', express.static(PUBLIC_TRACKS_DIR));
app.use('/tracks', express.static(DIST_TRACKS_DIR));
app.use('/tracks', express.static(TRACKS_DIR));

interface SharedTrackRecord {
  id: string;
  name: string;
  artist?: string;
  genre: 'salsa' | 'bachata';
  bpm: number;
  beatOffset: number;
  beats: Array<{ time: number; beat: number }>;
  duration?: number;
  fileName?: string;
  audioUrl?: string;
  mimeType?: string;
  uploadedAt: number;
  isCalibrated: boolean;
}

function getStoredSharedTracks(): SharedTrackRecord[] {
  const possibleFiles = [TRACKS_FILE, PUBLIC_TRACKS_FILE, DIST_TRACKS_FILE];
  for (const file of possibleFiles) {
    if (fs.existsSync(file)) {
      try {
        const data = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
  }
  // Fallback garantito al dataset predefinito di 32 brani (17 Bachata + 15 Salsa)
  return (DEFAULT_SHARED_TRACKS as unknown as SharedTrackRecord[]) || [];
}

function saveStoredSharedTracks(tracks: SharedTrackRecord[]) {
  try {
    fs.mkdirSync(path.dirname(TRACKS_FILE), { recursive: true });
    fs.writeFileSync(TRACKS_FILE, JSON.stringify(tracks, null, 2), 'utf-8');
  } catch {}
  try {
    fs.mkdirSync(path.dirname(PUBLIC_TRACKS_FILE), { recursive: true });
    fs.writeFileSync(PUBLIC_TRACKS_FILE, JSON.stringify(tracks, null, 2), 'utf-8');
  } catch {}
  try {
    if (fs.existsSync(path.dirname(DIST_TRACKS_FILE))) {
      fs.writeFileSync(DIST_TRACKS_FILE, JSON.stringify(tracks, null, 2), 'utf-8');
    }
  } catch {}
  try {
    const SRC_TRACKS_FILE = path.resolve(ROOT_DIR, 'src', 'data', 'defaultSharedTracks.ts');
    const tsCode = `import { SharedTrack } from "../services/sharedTracks";\n\nexport const DEFAULT_SHARED_TRACKS: SharedTrack[] = ${JSON.stringify(tracks, null, 2)};\n`;
    fs.writeFileSync(SRC_TRACKS_FILE, tsCode, 'utf-8');
  } catch (e) {
    console.error('Errore aggiornamento defaultSharedTracks.ts:', e);
  }
}

// 1. Ottieni la lista di tutti i brani condivisi disponibili per tutti gli allievi
app.get('/api/shared-tracks', (_req, res) => {
  try {
    const list = getStoredSharedTracks();
    const formatted = list.map((t) => {
      const fileName =
        t.fileName ||
        (t.audioUrl ? path.basename(t.audioUrl) : `${t.id}.mp3`);
      const hasAudioFile =
        fs.existsSync(path.join(TRACKS_DIR, fileName)) ||
        fs.existsSync(path.join(PUBLIC_TRACKS_DIR, fileName)) ||
        fs.existsSync(path.join(DIST_TRACKS_DIR, fileName));
      return {
        ...t,
        fileName,
        hasAudioFile,
        audioUrl: `/api/shared-tracks/audio/${t.id}`,
      };
    });
    res.json(formatted);
  } catch (err) {
    console.error('Errore lettura brani condivisi:', err);
    res.status(500).json({ error: 'Errore lettura libreria condivisa' });
  }
});

// 2. Pubblica un nuovo brano o aggiorna la calibrazione (disponibile per tutti)
app.post('/api/shared-tracks', (req, res) => {
  try {
    const {
      id,
      name,
      artist,
      genre,
      bpm,
      beatOffset,
      beats,
      duration,
      audioBase64,
      fileExtension = 'mp3',
      mimeType = 'audio/mpeg',
    } = req.body;

    if (!id || !name || !bpm || beatOffset === undefined) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti (id, name, bpm, beatOffset).' });
    }

    const currentTracks = getStoredSharedTracks();
    let existingIndex = currentTracks.findIndex((t) => t.id === id);

    let fileName = `${id}.${fileExtension.replace(/^\./, '')}`;
    const filePath = path.join(TRACKS_DIR, fileName);

    // Se è presente l'audio base64, scrivilo su disco in tutte le directory disponibili
    if (audioBase64) {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      fs.writeFileSync(filePath, audioBuffer);
      try {
        fs.mkdirSync(PUBLIC_TRACKS_DIR, { recursive: true });
        fs.writeFileSync(path.join(PUBLIC_TRACKS_DIR, fileName), audioBuffer);
      } catch {}
      try {
        if (fs.existsSync(DIST_TRACKS_DIR)) {
          fs.writeFileSync(path.join(DIST_TRACKS_DIR, fileName), audioBuffer);
        }
      } catch {}
    } else if (existingIndex >= 0 && currentTracks[existingIndex].fileName) {
      // Mantieni il fileName precedente
      fileName = currentTracks[existingIndex].fileName;
    }

    const record: SharedTrackRecord = {
      id,
      name,
      artist: artist || '',
      genre: genre === 'salsa' ? 'salsa' : 'bachata',
      bpm: Number(bpm),
      beatOffset: Number(beatOffset),
      beats: Array.isArray(beats) ? beats : [],
      duration: duration ? Number(duration) : undefined,
      fileName,
      audioUrl: `/tracks/${fileName}`,
      mimeType: mimeType || 'audio/mpeg',
      uploadedAt: existingIndex >= 0 ? currentTracks[existingIndex].uploadedAt : Date.now(),
      isCalibrated: true,
    };

    if (existingIndex >= 0) {
      currentTracks[existingIndex] = record;
    } else {
      currentTracks.push(record);
    }

    saveStoredSharedTracks(currentTracks);
    res.json({
      success: true,
      track: {
        ...record,
        hasAudioFile:
          fs.existsSync(path.join(TRACKS_DIR, fileName)) ||
          fs.existsSync(path.join(PUBLIC_TRACKS_DIR, fileName)) ||
          fs.existsSync(path.join(DIST_TRACKS_DIR, fileName)),
        audioUrl: `/api/shared-tracks/audio/${record.id}`,
      },
    });
  } catch (err) {
    console.error('Errore salvataggio brano condiviso:', err);
    res.status(500).json({ error: 'Errore salvataggio brano condiviso' });
  }
});

// 3. Streaming audio del brano condiviso con supporto per Range requests (seek bar)
app.get('/api/shared-tracks/audio/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tracks = getStoredSharedTracks();
    const track = tracks.find((t) => t.id === id);

    if (!track) {
      return res.status(404).send('Brano non trovato nella libreria condivisa.');
    }

    const fileName =
      track.fileName ||
      (track.audioUrl ? path.basename(track.audioUrl) : `${track.id}.mp3`);

    let filePath = path.join(TRACKS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PUBLIC_TRACKS_DIR, fileName);
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_TRACKS_DIR, fileName);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File audio fisico non trovato sul server.');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': track.mimeType || 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': track.mimeType || 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Errore streaming audio condiviso:', err);
    res.status(500).send('Errore streaming audio.');
  }
});

// 4. Eliminazione brano condiviso
app.delete('/api/shared-tracks/:id', (req, res) => {
  try {
    const { id } = req.params;
    let tracks = getStoredSharedTracks();
    const track = tracks.find((t) => t.id === id);

    if (track) {
      const fileName =
        track.fileName ||
        (track.audioUrl ? path.basename(track.audioUrl) : `${track.id}.mp3`);
      const filePath = path.join(TRACKS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
      tracks = tracks.filter((t) => t.id !== id);
      saveStoredSharedTracks(tracks);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Errore eliminazione brano condiviso:', err);
    res.status(500).json({ error: 'Errore eliminazione brano' });
  }
});

// 5. Proxy Song BPM Finder embed di The Ghost Production per caricamento fluido senza vincoli iframe
app.get('/api/tool-embed/song-bpm-finder', async (_req, res) => {
  try {
    const upstreamRes = await fetch('https://theghostproduction.com/tool-embed/song-bpm-finder/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Impossibile caricare il tool Song BPM Finder');
    }
    let html = await upstreamRes.text();
    // Inietta <base> per caricare stili e script da theghostproduction.com
    html = html.replace('<head>', '<head><base href="https://theghostproduction.com/">');
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.removeHeader('X-Frame-Options');
    res.send(html);
  } catch (err) {
    console.error('Errore proxy Song BPM finder:', err);
    res.status(500).send('Errore caricamento strumento BPM');
  }
});

// --- REGISTRAZIONE E GESTIONE LEAD PROVA GRATUITA (SYSTEME.IO & BACKUP) ---
interface TrialLead {
  name: string;
  email: string;
  createdAt: string;
  status: string;
  source: string;
}

const TRIAL_LEADS_FILE = path.resolve(ROOT_DIR, 'data', 'trial_leads.json');

function getStoredTrialLeads(): TrialLead[] {
  try {
    if (fs.existsSync(TRIAL_LEADS_FILE)) {
      const raw = fs.readFileSync(TRIAL_LEADS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveStoredTrialLeads(leads: TrialLead[]) {
  try {
    fs.mkdirSync(path.dirname(TRIAL_LEADS_FILE), { recursive: true });
    fs.writeFileSync(TRIAL_LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch {}
}

const SYSTEME_IO_API_KEY =
  process.env.SYSTEME_IO_API_KEY ||
  'aglqtfw4ilfr1z33q4b8zwc2d230eby743pyhh1gh82octrjcaufchhbsoqqzlcc';
const SYSTEME_IO_TAG_ID = 2247225; // Tag "Prova Gratuita App" creato su Systeme.io

async function syncContactToSystemeIo(name: string, email: string): Promise<boolean> {
  if (!SYSTEME_IO_API_KEY) return false;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 1. Crea il contatto su Systeme.io
    let contactId: number | null = null;
    const createRes = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'X-API-Key': SYSTEME_IO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        fields: [{ slug: 'first_name', value: cleanName }],
      }),
    });

    if (createRes.ok) {
      const data = await createRes.json();
      contactId = data?.id || null;
    } else {
      // Se il contatto esiste già in Systeme.io, cerchiamo il suo id tramite email
      const searchRes = await fetch(
        `https://api.systeme.io/api/contacts?email=${encodeURIComponent(cleanEmail)}`,
        {
          headers: {
            'X-API-Key': SYSTEME_IO_API_KEY,
            'Accept': 'application/json',
          },
        }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          contactId = searchData.items[0].id;
        }
      }
    }

    // 2. Assegna il Tag "Prova Gratuita App" per far partire la campagna email
    if (contactId) {
      await fetch(`https://api.systeme.io/api/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: {
          'X-API-Key': SYSTEME_IO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ tagId: SYSTEME_IO_TAG_ID }),
      });
      console.log(`[Systeme.io] Contatto ${cleanEmail} sincronizzato con tag Prova Gratuita App (ID ${SYSTEME_IO_TAG_ID})`);
      return true;
    }
  } catch (err) {
    console.error('[Systeme.io Sync Error]:', err);
  }
  return false;
}

// 1. Registra un nuovo contatto dalla prova gratuita
app.post('/api/trial-lead', async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Nome ed email valida sono obbligatori.' });
    }

    const currentLeads = getStoredTrialLeads();
    const existingIndex = currentLeads.findIndex((l) => l.email === cleanEmail);

    const leadRecord: TrialLead = {
      name: cleanName,
      email: cleanEmail,
      createdAt: existingIndex >= 0 ? currentLeads[existingIndex].createdAt : new Date().toISOString(),
      status: 'trial_active',
      source: 'app_prova_gratuita',
    };

    if (existingIndex >= 0) {
      currentLeads[existingIndex] = leadRecord;
    } else {
      currentLeads.push(leadRecord);
    }
    saveStoredTrialLeads(currentLeads);

    // Inoltro automatico diretto via API ufficiale a Systeme.io
    syncContactToSystemeIo(cleanName, cleanEmail).catch(() => {});

    const currentQuestionsUsed = getCoachTrialQuestionsUsed(cleanEmail);
    res.json({
      success: true,
      lead: leadRecord,
      trialCoachQuestionsUsed: currentQuestionsUsed,
      trialCoachRemaining: Math.max(0, 3 - currentQuestionsUsed),
    });
  } catch (err) {
    console.error('Errore salvataggio lead prova:', err);
    res.status(500).json({ error: 'Errore interno salvataggio contatto.' });
  }
});

// 2. Esportazione CSV per Systeme.io
app.get('/api/trial-leads/export', (_req, res) => {
  try {
    const leads = getStoredTrialLeads();
    // Intestazione compatibile con l'import contatti di Systeme.io
    let csv = 'First Name,Email,Registration Date,Status,Tag\n';
    leads.forEach((l) => {
      const safeName = `"${l.name.replace(/"/g, '""')}"`;
      const safeEmail = `"${l.email.replace(/"/g, '""')}"`;
      const date = l.createdAt ? l.createdAt.split('T')[0] : '';
      csv += `${safeName},${safeEmail},${date},${l.status},"Prova Gratuita App"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
    res.setHeader('Content-Disposition', 'attachment; filename="iscritti_prova_systeme_io.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Errore esportazione CSV lead:', err);
    res.status(500).send('Errore esportazione contatti.');
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Explicitly serve public/assets for reliable video streaming with byte-ranges
app.use(
  '/assets',
  express.static(path.resolve(ROOT_DIR, 'public', 'assets'), {
    maxAge: '1d',
    fallthrough: true,
  })
);

// Explicitly serve public/videos and dist/videos
app.use(
  '/videos',
  express.static(path.resolve(ROOT_DIR, 'public', 'videos'), {
    maxAge: '1d',
    fallthrough: true,
  })
);
app.use(
  '/videos',
  express.static(path.resolve(ROOT_DIR, 'dist', 'videos'), {
    maxAge: '1d',
    fallthrough: true,
  })
);

// Streaming video endpoint with robust range request support
app.get('/api/videos/stream/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const possiblePaths = [
    path.resolve(ROOT_DIR, 'public', 'videos', name),
    path.resolve(ROOT_DIR, 'dist', 'videos', name),
    path.resolve(ROOT_DIR, 'public', 'assets', 'aistudio', name),
    path.resolve(ROOT_DIR, 'public', 'assets', name),
  ];
  const found = possiblePaths.find((p) => fs.existsSync(p));
  if (!found) {
    return res.status(404).json({ error: 'Video non trovato' });
  }

  const stat = fs.statSync(found);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(found, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(found).pipe(res);
  }
});

const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const isProd =
  process.env.NODE_ENV === 'production' ||
  import.meta.url.includes('/dist/') ||
  (fs.existsSync(path.resolve(DIST_DIR, 'index.html')) && process.env.NODE_ENV !== 'development');

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
  app.use(
    express.static(DIST_DIR, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('.json')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    })
  );
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
