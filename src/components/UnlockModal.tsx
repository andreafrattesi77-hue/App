import React from 'react';
import { X } from 'lucide-react';
import { CHECKOUT_URL } from '../config';

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
}) => {
  if (!isOpen) return null;

  const isQuestionsLimit =
    isLimitExhausted ||
    (contextNotice && contextNotice.toLowerCase().includes('domand'));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
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
            <span><strong>Coach</strong>: 20 domande al giorno con le 100 più frequenti già impostate tra cui scegliere, più le tue domande libere coerenti con il metodo</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span><strong>Allenatore di ritmo</strong>: le tue canzoni preferite per imparare a ballare a tempo</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span><strong>Videocorso Completo</strong>: tutti i 9 moduli da vedere quando vuoi</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span><strong>L'Ebook completo</strong>, la Guida Ripartire e i 6 bonus</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span><strong>Piano 21 serate</strong>: autoanalisi delle tue serate</span>
          </li>
          <li className="flex items-start gap-2.5 leading-snug">
            <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
            <span><strong>Diario e test</strong>: test del tuo profilo attuale e monitoraggio dei tuoi progressi</span>
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

        {/* 7) Pulsante grande a tutta larghezza: SENZA IL PREZZO SUL PULSANTE */}
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
            <span>Sblocca ora →</span>
          </a>

          {/* Testo piccolo sotto il pulsante */}
          <p className="text-[12px] sm:text-[13px] text-slate-500 text-center font-medium leading-snug">
            🔒 Pagamento sicuro · Garanzia 14 giorni soddisfatto o rimborsato
          </p>
        </div>

        {/* 8) Link testuale in fondo */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs sm:text-[13px] text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer inline-block"
          >
            Continua con la versione gratuita
          </button>
        </div>
      </div>
    </div>
  );
};
