import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  ArrowRight,
  Sparkles,
  Check,
  Mail,
  Loader2,
  User,
  Star,
  Lock,
  Music2,
  Video,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { ACCESS_CODES, STRIPE_CHECKOUT_URL } from '../config';
import {
  saveUserData,
  getUserData,
  getSavedAccounts,
  switchAccount,
  removeSavedAccount,
  SavedAccountItem,
} from '../services/storage';
import { UnlockModal } from './UnlockModal';

interface AuthScreenProps {
  onSuccess: (name: string, accessCode: string) => void;
}

const TRIAL_PERKS = [
  '3 domande al Coach AI',
  "Canzoni da 30 secondi con l'Allenatore di Ritmo",
  'La lezione di introduzione del Videocorso',
  "Introduzione e prime pagine del capitolo 1 dell'Ebook",
  'Fai il test del tuo profilo per capire cosa ti blocca',
];

const CODE_UNLOCKED_FEATURES = [
  {
    icon: MessageCircle,
    title: 'Coach',
    text: '20 domande al giorno con le 100 più frequenti già impostate tra cui scegliere, più le tue domande libere coerenti con il metodo.',
  },
  {
    icon: Music2,
    title: 'Allenatore di ritmo',
    text: 'Le tue canzoni preferite per imparare a ballare a tempo.',
  },
  {
    icon: Video,
    title: 'Videocorso Completo',
    text: 'Tutti i 9 moduli da vedere quando vuoi.',
  },
  {
    icon: BookOpen,
    title: "L'Ebook completo",
    text: "L'Ebook completo, la Guida Ripartire e i 6 bonus.",
  },
  {
    icon: CalendarCheck,
    title: 'Piano 21 serate',
    text: 'Autoanalisi delle tue serate.',
  },
  {
    icon: ClipboardCheck,
    title: 'Diario e test',
    text: 'Test del tuo profilo attuale e monitoraggio dei tuoi progressi.',
  },
];

const TESTIMONIALS = [
  {
    text: 'Un efficace mix di tecniche per acquisire il magnetismo e la totale padronanza in pista con la salsa e la bachata.',
    name: 'Ugo Emanuele Mosconi',
  },
  {
    text: 'Il percorso che ho fatto è stato una bellissima esperienza che mi ha dato tanto. Andrea è stato un tutor che ha sempre cercato di stimolarmi in modo positivo.',
    name: 'Massimo',
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [activeMode, setActiveMode] = useState<'trial' | 'login'>('trial');
  const [loginMethod, setLoginMethod] = useState<'code' | 'email'>('code');

  // Input states
  const [code, setCode] = useState('');
  const [trialName, setTrialName] = useState('');
  const [trialEmail, setTrialEmail] = useState('');
  const [trialConsent, setTrialConsent] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountItem[]>(() => getSavedAccounts());

  const handleSelectAccount = (acc: SavedAccountItem) => {
    const switched = switchAccount(acc.email);
    if (switched) {
      onSuccess(switched.name, switched.accessCode || 'TRIAL');
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    removeSavedAccount(email);
    setSavedAccounts(getSavedAccounts());
  };

  // Email login states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Step 2 for code access if name not yet set
  const [step, setStep] = useState<'auth' | 'name'>('auth');
  const [validCode, setValidCode] = useState('');
  const [nameInput, setNameInput] = useState('');

  const formRef = useRef<HTMLDivElement>(null);

  // Magic link check on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryCode = (
        params.get('codice') ||
        params.get('code') ||
        params.get('accesso') ||
        ''
      )
        .trim()
        .toUpperCase();
      const queryName = (params.get('nome') || params.get('name') || '').trim();

      if (queryCode) {
        const isValid = ACCESS_CODES.some((c) => c.toUpperCase() === queryCode);
        if (isValid) {
          const existing = getUserData();
          const targetName = queryName || existing?.name?.trim();
          if (targetName) {
            saveUserData({ accessCode: queryCode, name: targetName });
            window.history.replaceState({}, document.title, window.location.pathname);
            onSuccess(targetName, queryCode);
            return;
          } else {
            setValidCode(queryCode);
            setStep('name');
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        }
      }
    } catch {
      // ignore
    }
  }, [onSuccess]);

function isValidRealEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domainPart] = parts;

  if (localPart.length < 2) return false;
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) return false;

  const domainName = domainParts[0];
  const tld = domainParts[domainParts.length - 1];

  if (domainName.length < 2) return false;
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return false;

  const fakeDomains = ['test.test', 'example.com', 'a.a', 'b.b', 'fake.com', 'mail.mail'];
  if (fakeDomains.includes(domainPart)) return false;

  return true;
}

  // Handle Trial submission
  const handleTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanName = trialName.trim();
    const cleanEmail = trialEmail.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setErrorMessage('Inserisci sia il tuo nome che la tua email per accedere.');
      return;
    }

    if (!isValidRealEmail(cleanEmail)) {
      setErrorMessage('Inserisci un indirizzo email valido ed esistente (es. nome@gmail.com o nome@libero.it).');
      return;
    }

    if (!trialConsent) {
      setErrorMessage('È necessario accettare la privacy policy per iniziare la prova.');
      return;
    }

    setIsLoading(true);

    try {
      let serverQuestionsUsed = 0;
      try {
        const res = await fetch('/api/trial-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, email: cleanEmail }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrorMessage(data?.error || 'Errore durante la registrazione. Verifica la tua email.');
          setIsLoading(false);
          return;
        }
        if (typeof data.trialCoachQuestionsUsed === 'number') {
          serverQuestionsUsed = data.trialCoachQuestionsUsed;
        }
      } catch (err) {
        console.warn('Lead submit note:', err);
      }

      // Isola i dati per questa specifica email
      const existing = getUserData(cleanEmail);
      const existingForEmail = existing?.email === cleanEmail ? (existing.trialCoachQuestionsUsed || 0) : 0;
      const finalQuestionsUsed = Math.max(serverQuestionsUsed, existingForEmail);

      saveUserData({
        accessCode: 'TRIAL',
        isTrial: true,
        name: cleanName,
        email: cleanEmail,
        trialCoachQuestionsUsed: finalQuestionsUsed,
      }, cleanEmail);

      onSuccess(cleanName, 'TRIAL');
    } catch {
      saveUserData({
        accessCode: 'TRIAL',
        isTrial: true,
        name: cleanName,
        email: cleanEmail,
      }, cleanEmail);
      onSuccess(cleanName, 'TRIAL');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Code verification
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMessage('Inserisci il codice di accesso ricevuto dopo l’acquisto.');
      return;
    }

    const isValid = ACCESS_CODES.some((valid) => valid.toUpperCase() === cleanCode);

    if (isValid) {
      const existing = getUserData();
      const existingName = existing?.name?.trim();
      if (existingName) {
        saveUserData({
          accessCode: cleanCode,
          name: existingName,
          isTrial: false,
          isVideocorsoUnlocked: true,
        });
        onSuccess(existingName, cleanCode);
        return;
      }
      setValidCode(cleanCode);
      setStep('name');
    } else {
      setErrorMessage("Codice non valido. Inserisci il codice ricevuto via email o contatta l'assistenza.");
    }
  };

  // Handle Step 2 name save
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setErrorMessage('Inserisci il tuo nome per continuare.');
      return;
    }
    const resolvedCode = validCode || 'ACQUISTO_CONFERMATO';
    saveUserData({
      accessCode: resolvedCode,
      name: cleanName,
      isTrial: false,
      isVideocorsoUnlocked: true,
    });
    onSuccess(cleanName, resolvedCode);
  };

  // Handle Email Auth login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage('Inserisci email e password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Email o password non corretti.');
      }
      const resolved = data.user;
      saveUserData({
        name: resolved.name,
        accessCode: resolved.accessCode || 'MAGNETICO',
        email: cleanEmail,
        isTrial: false,
        isVideocorsoUnlocked: true,
      });
      onSuccess(resolved.name, resolved.accessCode || 'MAGNETICO');
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Accesso non riuscito. Controlla i dati.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-5 sm:py-8">
      {/* Top Bar with brand mark and switch button */}
      <div className="flex items-center justify-between text-sm text-[#9da6b9]">
        <span className="font-display text-base tracking-[0.2em] text-[#f7f6f3] font-bold">
          EC
        </span>
        <button
          onClick={() => {
            setActiveMode(activeMode === 'trial' ? 'login' : 'trial');
            setErrorMessage('');
          }}
          className="transition-colors hover:text-[#E5B869] cursor-pointer"
        >
          {activeMode === 'trial' ? (
            <>
              Hai già un account?{' '}
              <span className="font-semibold text-[#E5B869]">Accedi</span>
            </>
          ) : (
            <>
              Nuovo qui?{' '}
              <span className="font-semibold text-[#E5B869]">Prova gratis</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Header */}
      <header className="mt-5 text-center animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-[0.06em] sm:text-4xl text-[#f7f6f3]">
          EFFETTO <span className="text-[#E5B869]">CALAMITA</span>
        </h1>
        <p className="mt-2 font-display text-base italic text-[#E5B869]">
          Il metodo del flirt invisibile
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#f7f6f3]/90">
          Smetti di ballare a caso: crea connessione vera in pista, già dalla prossima serata.
        </p>

        {/* Author Avatar Lockup */}
        <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-3 text-left text-sm leading-snug text-[#9da6b9]">
          <img
            src="/andrea-frattesi.png"
            alt="Andrea Frattesi"
            className="h-11 w-11 shrink-0 rounded-full object-cover object-top ring-2 ring-[#E5B869]/60 shadow-md"
          />
          <span>
            di <span className="font-semibold text-[#f7f6f3]">Andrea Frattesi</span>, Coach di seduzione nel ballo di Salsa e Bachata
          </span>
        </div>
      </header>

      {/* Main Interactive Form Card */}
      <section
        ref={formRef}
        className="mt-6 rounded-2xl border border-white/10 bg-[#182033]/85 p-5 shadow-card backdrop-blur-md animate-rise sm:p-7"
        style={{ animationDelay: '120ms' }}
      >
        {step === 'name' ? (
          // Step 2: Name Input for Verified Code
          <form onSubmit={handleSaveName} className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#f7f6f3]">
              Come ti chiami?
            </h2>
            <p className="text-sm text-[#9da6b9]">
              Codice confermato! Inserisci il tuo nome per personalizzare il Coach e le missioni.
            </p>
            <label className="block">
              <span className="text-sm font-semibold text-[#f7f6f3]">Il tuo nome</span>
              <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/12 bg-[#0d121e] px-4 py-3 focus-within:border-[#E5B869]">
                <User className="h-4 w-4 shrink-0 text-[#9da6b9]" />
                <input
                  required
                  type="text"
                  placeholder="Es. Marco"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-transparent text-base text-[#f7f6f3] outline-none placeholder:text-[#9da6b9]/70"
                />
              </span>
            </label>

            {errorMessage && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-lg p-2.5">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 text-base font-bold text-[#121622] shadow-gold transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Entra nell'app</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        ) : activeMode === 'trial' ? (
          // Trial Form with Multi-Account Switcher
          <div className="space-y-4">
            {savedAccounts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#0d121e]/90 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9da6b9]">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#E5B869]" />
                    Profili su questo dispositivo ({savedAccounts.length}):
                  </span>
                  <span className="text-[10px] text-[#E5B869]">Account separati</span>
                </div>

                <div className="space-y-1.5">
                  {savedAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#182033] hover:bg-[#212b42] border border-white/10 hover:border-[#E5B869]/50 transition-all text-left cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#E5B869] transition-colors">
                          {acc.name || 'Allievo'}{' '}
                          <span className="font-normal text-slate-400 text-[11px]">({acc.email})</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {acc.isTrial ? (
                            <span className="text-[#E5B869] font-medium">
                              Prova: {acc.questionsRemaining}/3 domande Coach rimaste
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium">Versione Completa Sbloccata</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAccount(e, acc.email)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Rimuovi da questo dispositivo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2.5 py-1 rounded bg-[#E5B869]/20 group-hover:bg-gradient-gold text-[#E5B869] group-hover:text-[#121622] text-[11px] font-bold transition-all">
                          Entra
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleTrialSubmit} className="space-y-3.5">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#f7f6f3]">
                  {savedAccounts.length > 0 ? 'Oppure accedi con un’altra email' : 'Prova gratis, senza carta'}
                </h2>
                <p className="text-xs text-[#9da6b9] mt-0.5">
                  Ogni email ha la sua prova indipendente (3 domande Coach e diario dedicato).
                </p>
              </div>

            <label className="block">
              <span className="text-sm font-semibold text-[#f7f6f3]">Il tuo nome</span>
              <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/12 bg-[#0d121e] px-4 py-3 focus-within:border-[#E5B869]">
                <User className="h-4 w-4 shrink-0 text-[#9da6b9]" />
                <input
                  required
                  type="text"
                  placeholder="Es. Marco"
                  value={trialName}
                  onChange={(e) => setTrialName(e.target.value)}
                  className="w-full bg-transparent text-base text-[#f7f6f3] outline-none placeholder:text-[#9da6b9]/70"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#f7f6f3]">La tua email</span>
              <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/12 bg-[#0d121e] px-4 py-3 focus-within:border-[#E5B869]">
                <Mail className="h-4 w-4 shrink-0 text-[#9da6b9]" />
                <input
                  required
                  type="email"
                  placeholder="nome@email.com"
                  value={trialEmail}
                  onChange={(e) => setTrialEmail(e.target.value)}
                  className="w-full bg-transparent text-base text-[#f7f6f3] outline-none placeholder:text-[#9da6b9]/70"
                />
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm leading-snug text-[#9da6b9] cursor-pointer pt-1">
              <input
                type="checkbox"
                required
                checked={trialConsent}
                onChange={(e) => setTrialConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#E5B869]"
              />
              <span>
                Accetto la{' '}
                <a
                  href="https://andreaseduzioneballo.com/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#E5B869]"
                >
                  privacy policy
                </a>{' '}
                e di ricevere i consigli di ballo di Andrea Frattesi.
              </span>
            </label>

            {errorMessage && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-lg p-2.5">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 text-base font-bold text-[#121622] shadow-gold transition-transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Prova gratis</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#9da6b9]">
              Nessuna carta richiesta · Accesso immediato
            </p>

            {/* Cosa vedi nella prova */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5B869]">
                Cosa vedi nella prova
              </p>
              <ul className="mt-3 space-y-2.5">
                {TRIAL_PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-[#f7f6f3]/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#E5B869]" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </form>
        </div>
      ) : (
          // Login Form (Code or Email)
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#f7f6f3]">
                Bentornato
              </h2>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0d121e] border border-white/10 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setLoginMethod('code')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    loginMethod === 'code'
                      ? 'bg-[#182033] text-[#E5B869] font-bold'
                      : 'text-[#9da6b9] hover:text-[#f7f6f3]'
                  }`}
                >
                  Codice
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    loginMethod === 'email'
                      ? 'bg-[#182033] text-[#E5B869] font-bold'
                      : 'text-[#9da6b9] hover:text-[#f7f6f3]'
                  }`}
                >
                  Email
                </button>
              </div>
            </div>

            {loginMethod === 'code' ? (
              <form onSubmit={handleVerifyCode} className="space-y-3.5">
                <label className="block">
                  <span className="text-sm font-semibold text-[#f7f6f3]">Il tuo codice di sblocco</span>
                  <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/12 bg-[#0d121e] px-4 py-3 focus-within:border-[#E5B869]">
                    <KeyRound className="h-4 w-4 shrink-0 text-[#9da6b9]" />
                    <input
                      required
                      type="text"
                      placeholder="Il codice ricevuto dopo l'acquisto"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-transparent text-base text-[#f7f6f3] outline-none placeholder:text-[#9da6b9]/70 uppercase font-mono tracking-wider"
                    />
                  </span>
                </label>

                {errorMessage && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-lg p-2.5">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 text-base font-bold text-[#121622] shadow-gold transition-transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Accedi</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsUnlockModalOpen(true)}
                    className="text-xs text-[#9da6b9] hover:text-[#E5B869] transition-colors underline cursor-pointer"
                  >
                    Non hai ancora acquistato? Sblocca l'accesso qui
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-3.5">
                <label className="block">
                  <span className="text-sm font-semibold text-[#f7f6f3]">La tua email</span>
                  <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/12 bg-[#0d121e] px-4 py-3 focus-within:border-[#E5B869]">
                    <Mail className="h-4 w-4 shrink-0 text-[#9da6b9]" />
                    <input
                      required
                      type="email"
                      placeholder="nome@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-transparent text-base text-[#f7f6f3] outline-none placeholder:text-[#9da6b9]/70"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-[#f7f6f3]">Password</span>
                  <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/12 bg-[#0d121e] px-4 py-3 focus-within:border-[#E5B869]">
                    <Lock className="h-4 w-4 shrink-0 text-[#9da6b9]" />
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-transparent text-base text-[#f7f6f3] outline-none placeholder:text-[#9da6b9]/70"
                    />
                  </span>
                </label>

                {errorMessage && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-lg p-2.5">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 text-base font-bold text-[#121622] shadow-gold transition-transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Accedi con Email</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      {/* Google Reviews Testimonials */}
      <div
        className="mt-8 grid gap-4 sm:grid-cols-2 animate-rise"
        style={{ animationDelay: '220ms' }}
      >
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="rounded-2xl border border-white/10 bg-[#182033]/60 p-5 text-center shadow-card backdrop-blur-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-center gap-1 text-[#E5B869]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-2.5 font-display text-sm italic leading-relaxed text-[#f7f6f3]/95">
                "{t.text}"
              </blockquote>
            </div>
            <figcaption className="mt-3 text-xs text-[#9da6b9]">
              {t.name} · <span className="text-[#E5B869]/80 font-medium">Recensione Google</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Section: Cosa sblocchi con il codice */}
      <section className="mt-12 animate-rise" style={{ animationDelay: '320ms' }}>
        <h2 className="text-center text-xs font-bold uppercase tracking-[0.25em] text-[#E5B869]">
          Cosa sblocchi con il codice
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-[#9da6b9]">
          Il codice arriva dopo l'acquisto e apre tutta l'app.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {CODE_UNLOCKED_FEATURES.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex gap-4 rounded-xl border border-white/10 bg-[#182033]/70 p-4 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-[#E5B869]">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-[#f7f6f3] text-sm">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#9da6b9]">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-[#9da6b9]">
        © {new Date().getFullYear()} Effetto Calamita · Andrea Frattesi
      </footer>

      {/* Unlock Modal for purchasing */}
      {isUnlockModalOpen && (
        <UnlockModal
          isOpen={isUnlockModalOpen}
          onClose={() => setIsUnlockModalOpen(false)}
        />
      )}
    </main>
  );
};
