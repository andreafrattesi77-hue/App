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
} from 'lucide-react';
import { ACCESS_CODES, STRIPE_CHECKOUT_URL } from '../config';
import { saveUserData, getUserData } from '../services/storage';
import {
  signInWithGoogle,
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
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState<'auth' | 'name'>('auth');
  const [validCode, setValidCode] = useState('');
  const [name, setName] = useState('');
  const [isAutoUnlocked, setIsAutoUnlocked] = useState(false);

  // Email / Firebase Auth states
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isEmailRegister, setIsEmailRegister] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Initialize stored name if already saved previously
  useEffect(() => {
    const existing = getUserData();
    if (existing?.name) {
      setName(existing.name);
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
      setErrorMessage("Codice non valido. Lo trovi nell'email di conferma acquisto.");
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Inserisci il tuo nome per continuare.');
      return;
    }

    saveUserData({
      accessCode: validCode || 'MAGNETICO',
      name: cleanName,
    });

    onSuccess(cleanName, validCode || 'MAGNETICO');
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage('');
    try {
      const fbUser = await signInWithGoogle();
      const cloudData = await loadUserFromFirestore(fbUser.uid);
      const resolvedName =
        cloudData?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Allievo';
      const resolvedCode = cloudData?.accessCode || 'MAGNETICO';

      saveUserData({
        name: resolvedName,
        accessCode: resolvedCode,
        ...(cloudData || {}),
      });

      await saveUserToFirestore(fbUser.uid, {
        id: fbUser.uid,
        name: resolvedName,
        email: fbUser.email || '',
        accessCode: resolvedCode,
      });

      onSuccess(resolvedName, resolvedCode);
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      setErrorMessage('Accesso con Google non completato. Riprova o usa il codice di accesso.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !passwordInput) {
      setErrorMessage('Inserisci sia email che password.');
      return;
    }
    setIsAuthenticating(true);
    setErrorMessage('');
    try {
      let fbUser;
      if (isEmailRegister) {
        fbUser = await registerWithEmail(cleanEmail, passwordInput, name || 'Allievo');
      } else {
        fbUser = await loginWithEmail(cleanEmail, passwordInput);
      }
      const cloudData = await loadUserFromFirestore(fbUser.uid);
      const resolvedName =
        cloudData?.name || fbUser.displayName || name.trim() || cleanEmail.split('@')[0];
      const resolvedCode = cloudData?.accessCode || 'MAGNETICO';

      saveUserData({
        name: resolvedName,
        accessCode: resolvedCode,
        ...(cloudData || {}),
      });

      await saveUserToFirestore(fbUser.uid, {
        id: fbUser.uid,
        name: resolvedName,
        email: cleanEmail,
        accessCode: resolvedCode,
      });

      onSuccess(resolvedName, resolvedCode);
    } catch (err: unknown) {
      console.error('Email Auth failed:', err);
      setErrorMessage(
        isEmailRegister
          ? 'Registrazione non riuscita (la password deve avere almeno 6 caratteri).'
          : 'Email o password non corretti. Controlla e riprova.'
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
          <span>Accesso Diretto • Effetto Calamita</span>
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
              {/* Tab Selector: Acquista ora vs Ho già il codice */}
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
                  <span>Ho già il codice</span>
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
                            Chiedi consiglio in qualsiasi momento prima, durante o dopo la serata. Risponde all'istante con il vero metodo pratico di Andrea Frattesi per sbloccare ogni situazione.
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

                  {/* Sicurezza e metodi */}
                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#88A5BF] pt-0.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Pagamento sicuro con Carta, Apple Pay e Google Pay</span>
                  </div>
                </div>
              )}

              {/* MODE 2: Inserimento Codice di Accesso */}
              {activeMode === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-4 animate-fadeIn">
                  <div className="text-left">
                    <label
                      htmlFor="accessCodeInput"
                      className="block text-xs font-semibold text-[#88A5BF] uppercase tracking-wider mb-2"
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
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-left text-xs text-red-200">
                      <p className="font-medium">{errorMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn text-sm font-bold flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Verifica ed Entra</span>
                    <ArrowRight className="w-4 h-4 text-[#042B58] group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Divisore con testo */}
                  <div className="relative py-2 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#88A5BF]/20" />
                    </div>
                    <span className="relative px-3 bg-[#042B58] text-[11px] text-[#88A5BF] uppercase tracking-wider font-medium">
                      Oppure accedi con account personale
                    </span>
                  </div>

                  {/* Pulsante Google */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isAuthenticating}
                    className="w-full py-3 px-4 rounded-xl bg-[#021831] hover:bg-[#234C77]/60 border border-[#88A5BF]/30 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isAuthenticating ? (
                      <Loader2 className="w-4 h-4 text-[#F9C03E] animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>Continua con Google</span>
                  </button>

                  {/* Pulsante Toggle Email */}
                  {!showEmailForm ? (
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-transparent hover:bg-[#234C77]/30 border border-[#88A5BF]/25 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#88A5BF]" />
                      <span>Accedi con Email e Password</span>
                    </button>
                  ) : (
                    <div className="p-3.5 bg-[#021831]/90 rounded-xl border border-[#88A5BF]/30 space-y-2.5 text-left animate-fadeIn">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                          {isEmailRegister ? 'Crea Account' : 'Accedi con Email'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEmailRegister(!isEmailRegister)}
                          className="text-[10px] text-[#F9C03E] hover:underline cursor-pointer"
                        >
                          {isEmailRegister ? 'Hai già un account? Accedi' : 'Nuovo account? Registrati'}
                        </button>
                      </div>

                      <div>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="La tua email"
                          className="w-full px-3 py-2 bg-[#042B58] border border-[#88A5BF]/30 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F9C03E]"
                        />
                      </div>

                      <div>
                        <input
                          type="password"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Password (min. 6 caratteri)"
                          className="w-full px-3 py-2 bg-[#042B58] border border-[#88A5BF]/30 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F9C03E]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleEmailAuth}
                        disabled={isAuthenticating}
                        className="w-full py-2.5 px-3 rounded-lg bg-[#F9C03E] text-[#042B58] font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 cursor-pointer disabled:opacity-50"
                      >
                        {isAuthenticating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isEmailRegister ? 'Registrati ed Entra' : 'Accedi'}</span>
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          ) : (
            /* STEP 2: Inserimento Nome Utente */
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
