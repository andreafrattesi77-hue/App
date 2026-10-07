import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Lock,
  Mail,
  Loader2,
  User,
} from 'lucide-react';
import { ACCESS_CODES, STRIPE_CHECKOUT_URL } from '../config';
import { saveUserData, getUserData } from '../services/storage';
import {
  loginWithEmail,
  registerWithEmail,
  saveUserToFirestore,
  loadUserFromFirestore,
} from '../services/firebase';

interface AuthScreenProps {
  onSuccess: (name: string, accessCode: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [activeMode, setActiveMode] = useState<'checkout' | 'code'>('checkout');
  const [accessMethod, setAccessMethod] = useState<'code' | 'email'>('code');
  const [emailMode, setEmailMode] = useState<'register' | 'login'>('register');

  // Input states
  const [code, setCode] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerCode, setRegisterCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Step 2 name modal for instant code access
  const [step, setStep] = useState<'auth' | 'name'>('auth');
  const [validCode, setValidCode] = useState('');
  const [name, setName] = useState('');
  const [isAutoUnlocked, setIsAutoUnlocked] = useState(false);

  // Initialize stored name if already saved previously
  useEffect(() => {
    const existing = getUserData();
    if (existing?.name) {
      setName(existing.name);
      setRegisterName(existing.name);
    }
  }, []);

  // Magic Link auto-detection on mount: ?codice=... o ?code=... e ?nome=... o ?name=...
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
        const isValid = ACCESS_CODES.some(
          (valid) => valid.toUpperCase() === queryCode
        );
        if (isValid) {
          const existing = getUserData();
          const targetName = queryName || existing?.name?.trim();
          if (targetName) {
            // Accesso istantaneo completo
            saveUserData({ accessCode: queryCode, name: targetName });
            window.history.replaceState({}, document.title, window.location.pathname);
            onSuccess(targetName, queryCode);
            return;
          } else {
            // Codice valido riconosciuto dal link, chiede subito il nome
            setValidCode(queryCode);
            setRegisterCode(queryCode);
            setIsAutoUnlocked(true);
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

  // Handle Instant Code verification
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMessage('Inserisci il codice di accesso ricevuto via email.');
      return;
    }

    const isValid = ACCESS_CODES.some(
      (valid) => valid.toUpperCase() === cleanCode
    );

    if (isValid) {
      // Se il nome è già in memoria, accede direttamente senza chiederlo di nuovo
      const existing = getUserData();
      const existingName = existing?.name?.trim() || name.trim();
      if (existingName) {
        saveUserData({
          accessCode: cleanCode,
          name: existingName,
        });
        onSuccess(existingName, cleanCode);
        return;
      }

      setValidCode(cleanCode);
      setStep('name');
    } else {
      setErrorMessage("Codice non valido. Inserisci il codice ricevuto dopo l'acquisto o contatta l'assistenza.");
    }
  };

  // Handle Step 2: save user name after instant code
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Inserisci il tuo nome per continuare.');
      return;
    }

    const resolvedCode = validCode || 'ACQUISTO_CONFERMATO';
    saveUserData({
      accessCode: resolvedCode,
      name: cleanName,
    });

    onSuccess(cleanName, resolvedCode);
  };

  // Handle Email Auth (Registration or Login)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage('Inserisci sia la tua email che la password.');
      return;
    }

    // CONTROLLO DI SICUREZZA: Per registrarsi è OBBLIGATORIO avere il codice di acquisto
    let validatedCode = 'ACQUISTO_CONFERMATO';
    if (emailMode === 'register') {
      if (!registerName.trim()) {
        setErrorMessage('Inserisci il tuo nome per completare la registrazione.');
        return;
      }

      const cleanRegCode = registerCode.trim().toUpperCase();
      if (!cleanRegCode) {
        setErrorMessage("Per creare un account devi inserire il codice di accesso ricevuto via email dopo l'acquisto. Se non hai acquistato, clicca su 'Acquista ora'.");
        return;
      }

      const isCodeValid = ACCESS_CODES.some(
        (valid) => valid.toUpperCase() === cleanRegCode
      );

      if (!isCodeValid) {
        setErrorMessage("Codice di accesso non valido. Controlla l'email di conferma acquisto oppure acquista l'accesso.");
        return;
      }

      validatedCode = cleanRegCode;
    }

    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      if (emailMode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPass,
            name: registerName.trim(),
            accessCode: validatedCode,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Errore nella registrazione.');
        }

        const resolvedUser = data.user;
        saveUserData({
          name: resolvedUser.name,
          accessCode: resolvedUser.accessCode,
        });
        onSuccess(resolvedUser.name, resolvedUser.accessCode);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPass,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Email o password non corretti.');
        }

        const resolvedUser = data.user;
        saveUserData({
          name: resolvedUser.name,
          accessCode: resolvedUser.accessCode || 'MAGNETICO',
          ...(resolvedUser.profile ? { profile: resolvedUser.profile } : {}),
        });
        onSuccess(resolvedUser.name, resolvedUser.accessCode || 'MAGNETICO');
      }
    } catch (err: unknown) {
      console.error('Email Auth error:', err);
      const msg = (err as Error)?.message || '';
      setErrorMessage(
        msg ||
          (emailMode === 'register'
            ? 'Errore nella registrazione. Controlla i dati e riprova.'
            : 'Accesso non riuscito. Controlla email e password.')
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-6 bg-[#042B58] relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-[#234C77]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#F9C03E]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="w-full pt-2 sm:pt-4 flex justify-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#234C77]/70 border border-[#88A5BF]/30 text-[#88A5BF] text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#F9C03E]" />
          <span>Accesso Riservato • Effetto Calamita</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md my-auto py-4 z-10">
        <div className="glass-card p-5 sm:p-7 text-center relative border border-[#88A5BF]/30 shadow-2xl">
          {/* Logo & Headline */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-wider text-white">
              EFFETTO CALAMITA
            </h1>
            <p className="text-sm font-medium text-[#F9C03E] mt-0.5 font-serif italic">
              Il metodo del flirt invisibile
            </p>
            <p className="text-xs text-slate-300 leading-relaxed mt-2">
              L'app per creare vera connessione nel ballo di Salsa e Bachata, di Andrea Frattesi.
            </p>
          </div>

          {step === 'auth' ? (
            <div className="space-y-4">
              {/* Main Tab Selector: Acquista ora vs Ho già il codice */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#021831]/80 rounded-xl border border-[#88A5BF]/25">
                <button
                  type="button"
                  onClick={() => {
                    if (activeMode === 'checkout') {
                      window.open(STRIPE_CHECKOUT_URL, '_blank');
                    } else {
                      setActiveMode('checkout');
                    }
                    setErrorMessage('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'checkout'
                      ? 'bg-[#F9C03E] text-[#042B58] shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Acquista ora</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('code');
                    setErrorMessage('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'code'
                      ? 'bg-[#F9C03E] text-[#042B58] shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Ho già il codice / Accedi</span>
                </button>
              </div>

              {/* MODE 1: Acquista ora (Lista completa di cosa ricevi) */}
              {activeMode === 'checkout' && (
                <div className="space-y-4 text-left animate-fadeIn">
                  <div className="p-4 rounded-xl bg-[#021831]/60 border border-[#88A5BF]/25 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#F9C03E]" />
                        <span>Cosa ricevi subito</span>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">Accesso Immediato</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-200">
                      {/* Coach AI in forte evidenza */}
                      <li className="flex items-start gap-2.5 p-2 rounded-lg bg-[#234C77]/40 border border-[#F9C03E]/30">
                        <Sparkles className="w-4 h-4 text-[#F9C03E] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#F9C03E] block font-semibold">Coach AI 24/7 (Il tuo mentore in tasca)</strong>
                          <span className="text-slate-300 text-[11px] leading-tight block mt-0.5">
                            Chiedi consiglio in qualsiasi momento prima, durante o dopo la serata. Risponde all'istante con il metodo pratico di Andrea Frattesi per sbloccare ogni situazione.
                          </span>
                        </div>
                      </li>

                      {/* Test personalizzato */}
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F9C03E] shrink-0 mt-0.5" />
                        <div>
                          <strong>Test personalizzato:</strong>
                          <span className="text-slate-300 ml-1">in base alla tua situazione personale (Tecnico, Congelato, Bravo Ragazzo, Collezionista) con piano d'azione mirato.</span>
                        </div>
                      </li>

                      {/* Ebook e bonus */}
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F9C03E] shrink-0 mt-0.5" />
                        <div>
                          <strong>Ebook Completo & 6 Bonus Pratici:</strong>
                          <span className="text-slate-300 ml-1">il Metodo in 5 parti, cosa dire, come chattare e la Guida Ripartire.</span>
                        </div>
                      </li>

                      {/* Piano 21 Serate */}
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F9C03E] shrink-0 mt-0.5" />
                        <div>
                          <strong>Piano 21 Serate & Diario:</strong>
                          <span className="text-slate-300 ml-1">monitora i progressi e ricevi il feedback del Coach dopo ogni serata.</span>
                        </div>
                      </li>

                      {/* Aggiornamenti continui */}
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F9C03E] shrink-0 mt-0.5" />
                        <div>
                          <strong>Aggiornamenti continui:</strong>
                          <span className="text-slate-300 ml-1">nuove lezioni e aggiornamenti ricevuti direttamente in App.</span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Pulsante Oro Stripe */}
                  <a
                    href={STRIPE_CHECKOUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      window.open(STRIPE_CHECKOUT_URL, '_blank');
                    }}
                    className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Acquista e Accedi Subito</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Spiegazione post-acquisto */}
                  <div className="p-2.5 rounded-lg bg-[#021831]/50 border border-[#88A5BF]/20 text-[11px] text-slate-300 leading-relaxed text-center">
                    💡 <span className="font-semibold text-white">Come funziona dopo l'acquisto?</span> Ricevi subito il codice di accesso via email per entrare istantaneamente o per creare il tuo account personale.
                  </div>

                  {/* Sicurezza e metodi */}
                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#88A5BF] pt-0.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Pagamento sicuro con Carta, Apple Pay e Google Pay</span>
                  </div>
                </div>
              )}

              {/* MODE 2: Accesso con Codice Istantaneo o Registrazione Email */}
              {activeMode === 'code' && (
                <div className="space-y-3.5 animate-fadeIn">
                  {/* Sub-selector: Codice Istantaneo vs Registrazione/Email */}
                  <div className="flex rounded-lg bg-[#021831] p-1 border border-[#88A5BF]/25">
                    <button
                      type="button"
                      onClick={() => {
                        setAccessMethod('code');
                        setErrorMessage('');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        accessMethod === 'code'
                          ? 'bg-[#234C77] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#F9C03E]" />
                      <span>Codice Istantaneo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccessMethod('email');
                        setErrorMessage('');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        accessMethod === 'email'
                          ? 'bg-[#234C77] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-[#F9C03E]" />
                      <span>Registrazione / Email</span>
                    </button>
                  </div>

                  {/* 1. OPZIONE CODICE ISTANTANEO */}
                  {accessMethod === 'code' && (
                    <form onSubmit={handleVerifyCode} className="space-y-3.5 text-left animate-fadeIn">
                      <div>
                        <label
                          htmlFor="accessCodeInput"
                          className="block text-xs font-semibold text-[#88A5BF] uppercase tracking-wider mb-1.5"
                        >
                          Inserisci il tuo codice di accesso
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            id="accessCodeInput"
                            type="text"
                            value={code}
                            onChange={(e) => {
                              setCode(e.target.value);
                              if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="inserisci codice"
                            className="w-full pl-10 pr-4 py-3 bg-[#021831]/80 border border-[#88A5BF]/40 rounded-xl text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-[#F9C03E] focus:ring-1 focus:ring-[#F9C03E]"
                            autoCapitalize="characters"
                            autoCorrect="off"
                            autoFocus
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Inserisci il codice di accesso ricevuto via email dopo l'acquisto.
                        </p>
                      </div>

                      {errorMessage && (
                        <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-xs text-red-200">
                          <p className="font-medium">{errorMessage}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn text-sm font-bold flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        <span>Verifica ed Entra Subito</span>
                        <ArrowRight className="w-4 h-4 text-[#042B58] group-hover:translate-x-1 transition-transform" />
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setAccessMethod('email');
                            setErrorMessage('');
                          }}
                          className="text-xs text-[#88A5BF] hover:text-[#F9C03E] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Preferisci registrarti con Email e Password? Clicca qui →</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 2. OPZIONE REGISTRAZIONE / ACCESSO EMAIL */}
                  {accessMethod === 'email' && (
                    <form onSubmit={handleEmailAuth} className="space-y-3.5 text-left animate-fadeIn">
                      {/* Mini Switch Registrati / Accedi */}
                      <div className="flex items-center justify-between p-1 bg-[#021831]/90 rounded-lg border border-[#88A5BF]/25">
                        <button
                          type="button"
                          onClick={() => {
                            setEmailMode('register');
                            setErrorMessage('');
                          }}
                          className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                            emailMode === 'register'
                              ? 'bg-[#F9C03E] text-[#042B58]'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          Crea Account (Registrati)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailMode('login');
                            setErrorMessage('');
                          }}
                          className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                            emailMode === 'login'
                              ? 'bg-[#F9C03E] text-[#042B58]'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          Accedi con Email
                        </button>
                      </div>

                      {/* Header spiegazione */}
                      <div className="text-center pt-1 pb-0.5">
                        <p className="text-xs font-semibold text-white">
                          {emailMode === 'register'
                            ? 'Crea il tuo Account Personale'
                            : 'Accedi al tuo Account'}
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {emailMode === 'register'
                            ? 'Per registrarti inserisci i tuoi dati e il codice di acquisto.'
                            : 'Inserisci email e password per accedere ai tuoi dati.'}
                        </p>
                      </div>

                      {/* Campo Nome (solo se registrazione) */}
                      {emailMode === 'register' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-[#88A5BF] uppercase tracking-wider mb-1">
                            Il tuo nome
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={registerName}
                              onChange={(e) => {
                                setRegisterName(e.target.value);
                                if (errorMessage) setErrorMessage('');
                              }}
                              placeholder="Es. Marco, Alessandro..."
                              className="w-full pl-9 pr-3 py-2.5 bg-[#021831]/80 border border-[#88A5BF]/30 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F9C03E]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Campo Codice di Acquisto (solo se registrazione: BLOCCO ANTI-INTRUSIONE) */}
                      {emailMode === 'register' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-[#88A5BF] uppercase tracking-wider mb-1">
                            Codice di acquisto (ricevuto via email)
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={registerCode}
                              onChange={(e) => {
                                setRegisterCode(e.target.value);
                                if (errorMessage) setErrorMessage('');
                              }}
                              placeholder="Codice ricevuto dopo l'acquisto"
                              className="w-full pl-9 pr-3 py-2.5 bg-[#021831]/80 border border-[#88A5BF]/30 rounded-lg text-white placeholder-slate-500 text-xs font-mono uppercase focus:outline-none focus:border-[#F9C03E]"
                              autoCapitalize="characters"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Richiesto per verificare l'acquisto e sbloccare l'account.
                          </p>
                        </div>
                      )}

                      {/* Campo Email */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#88A5BF] uppercase tracking-wider mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => {
                              setEmailInput(e.target.value);
                              if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="nome@esempio.com"
                            className="w-full pl-9 pr-3 py-2.5 bg-[#021831]/80 border border-[#88A5BF]/30 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F9C03E]"
                            autoCapitalize="none"
                            autoCorrect="off"
                          />
                        </div>
                      </div>

                      {/* Campo Password */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#88A5BF] uppercase tracking-wider mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => {
                              setPasswordInput(e.target.value);
                              if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="Almeno 6 caratteri"
                            className="w-full pl-9 pr-3 py-2.5 bg-[#021831]/80 border border-[#88A5BF]/30 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F9C03E]"
                          />
                        </div>
                      </div>

                      {errorMessage && (
                        <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-xs text-red-200">
                          <p className="font-medium">{errorMessage}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full py-3 px-4 rounded-xl gold-gradient-btn text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                      >
                        {isAuthenticating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#042B58]" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-[#042B58]" />
                        )}
                        <span>
                          {emailMode === 'register'
                            ? 'Crea Account ed Entra'
                            : 'Accedi al tuo Account'}
                        </span>
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setAccessMethod('code');
                            setErrorMessage('');
                          }}
                          className="text-xs text-[#88A5BF] hover:text-[#F9C03E] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Hai già un codice di accesso? Entra con codice istantaneo →</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Inserimento Nome Utente (solo se codice inserito la prima volta) */
            <form onSubmit={handleSaveName} className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#234C77] flex items-center justify-center border border-[#F9C03E]/40 mb-2">
                <UserCheck className="w-6 h-6 text-[#F9C03E]" />
              </div>

              {isAutoUnlocked ? (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    ✓ Pagamento Confermato
                  </span>
                  <h2 className="text-lg font-serif font-bold text-white">
                    Benvenuto in Effetto Calamita!
                  </h2>
                  <p className="text-xs text-slate-300">
                    Come ti chiami? Andrea e l'app ti chiameranno per nome.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <h2 className="text-lg font-serif font-bold text-white">
                    Codice verificato!
                  </h2>
                  <p className="text-xs text-slate-300">
                    Come ti chiami? Andrea e l'app ti chiameranno per nome.
                  </p>
                </div>
              )}

              <div className="text-left pt-2">
                <label
                  htmlFor="userNameInput"
                  className="block text-xs font-semibold text-[#88A5BF] uppercase tracking-wider mb-2"
                >
                  Il tuo nome
                </label>
                <input
                  id="userNameInput"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Es. Marco, Alessandro..."
                  autoFocus
                  className="w-full px-4 py-3 bg-[#021831]/80 border border-[#88A5BF]/40 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#F9C03E] focus:ring-1 focus:ring-[#F9C03E]"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-950/70 border border-red-500/40 rounded-xl text-left text-xs text-red-200">
                  <p>{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn text-sm font-bold flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Inizia il Metodo</span>
                <ArrowRight className="w-4 h-4 text-[#042B58] group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Signature footer */}
      <div className="w-full py-4 text-center z-10 px-4">
        <p className="text-sm sm:text-base text-slate-200 font-serif leading-relaxed">
          <span className="italic">«Faccio quello che insegno. Insegno quello che faccio.»</span>
          <span className="block mt-1 text-[#F9C03E] font-medium tracking-wide text-xs sm:text-sm not-italic">
            – Andrea Frattesi
          </span>
        </p>
      </div>
    </div>
  );
};
