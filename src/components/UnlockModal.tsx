import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2 } from 'lucide-react';
import { CHECKOUT_URL, ACCESS_CODES } from '../config';
import { saveUserData, getUserData } from '../services/storage';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLimitExhausted?: boolean;
  contextNotice?: string;
  onUnlocked?: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  onClose,
  isLimitExhausted = false,
  contextNotice,
  onUnlocked,
}) => {
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);

  if (!isOpen) return null;

  const isQuestionsLimit =
    isLimitExhausted ||
    (contextNotice && contextNotice.toLowerCase().includes('domand'));

  const handleUnlockWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setCodeError('Inserisci il codice di accesso ricevuto via email.');
      return;
    }

    const isValid = ACCESS_CODES.some((valid) => valid.toUpperCase() === clean);
    if (!isValid) {
      setCodeError('Codice non valido. Controlla l\'email di conferma acquisto.');
      return;
    }

    const current = getUserData();
    saveUserData({
      accessCode: clean,
      isTrial: false,
      isVideocorsoUnlocked: true,
      name: current?.name || 'Allievo Calamita',
      email: current?.email,
    });

    setCodeSuccess(true);
    setCodeError('');
    setTimeout(() => {
      onUnlocked?.();
      onClose();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] max-h-[92vh] overflow-y-auto rounded-[16px] bg-white text-slate-900 p-5 sm:p-6 shadow-2xl flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: '16px' }}
      >
        {/* Pulsante X in alto a destra */}
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Riga limite sopra il titolo (se ha usato le domande gratuite) */}
        {isQuestionsLimit && (
          <div className="mb-2.5 py-1.5 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-[13px] font-semibold text-center leading-snug">
            Hai usato le domande gratuite di oggi.
          </div>
        )}

        {/* 1) Piccola etichetta in alto */}
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#042B58] bg-[#042B58]/10 px-2.5 py-0.5 rounded-full mb-1">
            VERSIONE COMPLETA
          </span>
        </div>

        {/* 2) Titolo */}
        <h2 className="text-xl sm:text-[22px] font-bold font-serif text-[#042B58] leading-tight mt-0.5">
          Sblocca tutto il metodo Effetto Calamita
        </h2>

        {/* 3) Sottotitolo */}
        <p className="text-[15px] text-slate-600 mt-1 leading-snug">
          Hai provato l'App. Ora porta il metodo in pista, ogni serata.
        </p>

        {/* 4) Elenco con spunta (✓) */}
        <ul className="space-y-2 text-[15px] text-slate-800 text-left mt-3.5">
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span><strong>Sblocca il videocorso completo</strong> (tutti i 9 moduli pratici)</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span><strong>Coach</strong> AI 24/7 con 20 domande al giorno</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span>Test personalizzato con il tuo piano d'azione completo</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span>Piano 21 Serate & Diario completo</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span>Sezione ritmo completa</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span>Aggiornamenti continui inclusi</span>
          </li>
        </ul>

        {/* 5) Riquadro evidenziato "🎁 In omaggio" */}
        <div className="bg-[#FFF7E0] border border-[#F9C03E] rounded-xl p-3 sm:p-3.5 text-left space-y-2 mt-4">
          <div className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#042B58] flex items-center gap-1.5">
            <span>🎁 In omaggio:</span>
          </div>
          <div className="space-y-1.5 text-[15px] text-slate-800 leading-snug">
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-base">📘</span>
              <span>eBook Effetto Calamita + 6 bonus interattivi</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-base">🎬</span>
              <span>Videocorso in 9 moduli: metodi e strategie di seduzione da applicare a Salsa e Bachata</span>
            </div>
          </div>
        </div>

        {/* 6) Prezzo */}
        <div className="text-center pt-3.5 pb-1">
          <div className="flex items-baseline justify-center gap-2.5">
            <span className="text-xl sm:text-2xl text-slate-400 line-through font-semibold">
              444€
            </span>
            <span className="text-[40px] sm:text-[44px] font-extrabold text-[#042B58] leading-none tracking-tight">
              97€
            </span>
          </div>
          {/* Sotto il prezzo */}
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Pagamento unico · nessun abbonamento
          </p>
        </div>

        {/* 7) Pulsante grande a tutta larghezza: "Sblocca ora a 97€ →" */}
        <div className="pt-2 space-y-2">
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              window.open(CHECKOUT_URL, '_blank');
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-[#F9C03E] hover:bg-[#fab722] text-[#042B58] font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer text-center"
          >
            <span>Sblocca ora a 97€ →</span>
          </a>

          {/* Testo piccolo sotto il pulsante */}
          <p className="text-[12px] sm:text-[13px] text-slate-500 text-center font-medium leading-snug">
            🔒 Pagamento sicuro · Garanzia 14 giorni soddisfatto o rimborsato
          </p>
        </div>

        {/* 8) Link testuale piccolo in fondo: "Continua con la versione gratuita" */}
        <div className="pt-2 text-center space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs sm:text-[13px] text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer inline-block"
          >
            Continua con la versione gratuita
          </button>

          {/* Opzione riscatto codice per chi ha già acquistato */}
          <div className="pt-1 border-t border-slate-100">
            {!showCodeInput ? (
              <button
                type="button"
                onClick={() => setShowCodeInput(true)}
                className="text-[11px] text-slate-400 hover:text-[#042B58] transition-colors cursor-pointer"
              >
                Hai già acquistato? Inserisci il tuo codice di accesso
              </button>
            ) : (
              <form onSubmit={handleUnlockWithCode} className="space-y-1.5 pt-1 text-left">
                {codeSuccess ? (
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Versione completa attivata con successo!</span>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setCodeError('');
                        }}
                        placeholder="es. MAGNETICO"
                        className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#042B58]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-[#042B58] text-white text-xs font-bold hover:bg-[#063a75] transition-colors cursor-pointer"
                      >
                        Attiva
                      </button>
                    </div>
                    {codeError && (
                      <p className="text-[11px] text-red-600">{codeError}</p>
                    )}
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
