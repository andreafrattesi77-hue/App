import React, { useState } from 'react';
import { KeyRound, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { ACCESS_CODES, LANDING_URL, OFFICIAL_SIGNATURE } from '../config';
import { saveUserData } from '../services/storage';

interface AuthScreenProps {
  onSuccess: (name: string, accessCode: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState<'code' | 'name'>('code');
  const [validCode, setValidCode] = useState('');
  const [name, setName] = useState('');

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
      setValidCode(cleanCode);
      setStep('name');
    } else {
      setErrorMessage("Codice non valido. Lo trovi nell'email di acquisto.");
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
      accessCode: validCode,
      name: cleanName,
    });

    onSuccess(cleanName, validCode);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-5 bg-[#042B58] relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-[#234C77]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#F9C03E]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top spacer */}
      <div className="w-full pt-6 flex justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#234C77]/60 border border-[#88A5BF]/30 text-[#88A5BF] text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#F9C03E]" />
          <span>Area Riservata Acquirenti</span>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-sm my-auto">
        <div className="glass-card p-6 md:p-8 text-center relative z-10 border border-[#88A5BF]/30">
          {/* Logo */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold font-serif tracking-wider text-white">
              EFFETTO CALAMITA
            </h1>
            <p className="text-sm font-medium text-[#F9C03E] mt-1 font-serif italic">
              Il metodo del Filo Invisibile
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            L'app per creare vera connessione durante il ballo di Salsa e Bachata, di Andrea Frattesi.
          </p>

          {step === 'code' ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
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
                    placeholder="Es. CALAMITA2026"
                    className="w-full pl-10 pr-4 py-3 bg-[#021831]/80 border border-[#88A5BF]/40 rounded-xl text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-[#F9C03E] focus:ring-1 focus:ring-[#F9C03E]"
                    autoCapitalize="characters"
                    autoCorrect="off"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#88A5BF]">
                  <span>Codice di esempio:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCode('CALAMITA2026');
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="text-[#F9C03E] hover:underline font-mono font-semibold"
                  >
                    CALAMITA2026 (inserisci)
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-left text-xs text-red-200">
                  <p className="font-medium">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn text-sm font-bold flex items-center justify-center gap-2 group"
              >
                <span>Entra</span>
                <ArrowRight className="w-4 h-4 text-[#042B58] group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="pt-2">
                <a
                  href={LANDING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#88A5BF] hover:text-[#F9C03E] transition-colors underline underline-offset-4 inline-block"
                >
                  Non hai ancora l'app? Scopri Effetto Calamita
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveName} className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#234C77] flex items-center justify-center border border-[#F9C03E]/40 mb-2">
                <UserCheck className="w-6 h-6 text-[#F9C03E]" />
              </div>

              <h2 className="text-lg font-serif font-bold text-white">
                Codice verificato!
              </h2>
              <p className="text-xs text-slate-300">
                Come ti chiami? Andrea e l'app ti chiameranno per nome.
              </p>

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
                className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn text-sm font-bold flex items-center justify-center gap-2 group"
              >
                <span>Inizia il Metodo</span>
                <ArrowRight className="w-4 h-4 text-[#042B58] group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Signature footer */}
      <div className="w-full py-4 text-center z-10">
        <p className="text-[11px] text-[#88A5BF] italic font-serif">
          "{OFFICIAL_SIGNATURE}"
        </p>
      </div>
    </div>
  );
};
