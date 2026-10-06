import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { RESET_EMERGENCY_QUOTES } from '../config';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'inspira' | 'espira'>('inspira');
  const [breathSeconds, setBreathSeconds] = useState(4);

  // Pick random quote on open
  useEffect(() => {
    if (isOpen) {
      const idx = Math.floor(Math.random() * RESET_EMERGENCY_QUOTES.length);
      setQuoteIndex(idx);
      setSecondsLeft(60);
      setIsActive(true);
      setBreathPhase('inspira');
      setBreathSeconds(4);
    }
  }, [isOpen]);

  // Overall 60-second countdown
  useEffect(() => {
    if (!isOpen || !isActive) return;

    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, secondsLeft]);

  // Breathing cycle: 4s inhale, 6s exhale (10s total cycle)
  useEffect(() => {
    if (!isOpen || !isActive) return;

    const breathTimer = setInterval(() => {
      setBreathSeconds((prev) => {
        if (breathPhase === 'inspira') {
          if (prev <= 1) {
            setBreathPhase('espira');
            return 6;
          }
          return prev - 1;
        } else {
          if (prev <= 1) {
            setBreathPhase('inspira');
            return 4;
          }
          return prev - 1;
        }
      });
    }, 1000);

    return () => clearInterval(breathTimer);
  }, [isOpen, isActive, breathPhase]);

  if (!isOpen) return null;

  const currentQuote = RESET_EMERGENCY_QUOTES[quoteIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021831]/95 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#042B58] border border-[#F9C03E]/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#F9C03E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#234C77]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Close icon */}
        <button
          onClick={onClose}
          aria-label="Chiudi reset"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-semibold tracking-wide uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Reset di Emergenza
        </div>

        <h2 className="text-xl font-bold font-serif text-white mb-2">
          Respira. Ritrova il tuo Asse.
        </h2>

        {/* Anchor quote */}
        <div className="my-3 px-4 py-3 bg-[#234C77]/40 border border-[#88A5BF]/20 rounded-2xl w-full">
          <p className="text-[#F9C03E] text-base font-serif italic leading-relaxed">
            "{currentQuote}"
          </p>
        </div>

        {/* Animated breathing circle */}
        <div className="my-6 relative flex items-center justify-center w-52 h-52">
          {/* Outer pulsating ring */}
          <div
            className={`absolute rounded-full border-2 border-[#F9C03E]/30 transition-all duration-1000 ease-in-out ${
              breathPhase === 'inspira'
                ? 'w-48 h-48 bg-[#F9C03E]/15 scale-105'
                : 'w-32 h-32 bg-[#234C77]/40 scale-95'
            }`}
          />

          {/* Inner core circle */}
          <div
            className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border border-[#F9C03E]/50 shadow-inner z-10 transition-all duration-1000 ${
              breathPhase === 'inspira' ? 'bg-[#042B58]' : 'bg-[#021831]'
            }`}
          >
            <span className="text-[#F9C03E] text-xs font-bold uppercase tracking-widest mb-1">
              {breathPhase === 'inspira' ? 'Inspira' : 'Espira'}
            </span>
            <span className="text-3xl font-bold text-white font-mono">
              {breathSeconds}s
            </span>
            <span className="text-[10px] text-slate-400 mt-1">
              {breathPhase === 'inspira' ? '(4 secondi)' : '(6 secondi)'}
            </span>
          </div>
        </div>

        {/* Total remaining time */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-slate-300 text-sm">
            Tempo totale: <span className="font-mono font-bold text-white">{secondsLeft}s</span>
          </div>

          <button
            onClick={() => setIsActive(!isActive)}
            className="p-2 rounded-full bg-[#234C77] text-white hover:bg-[#88A5BF]/40 transition-colors"
            title={isActive ? 'Pausa' : 'Avvia'}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              setSecondsLeft(60);
              setBreathPhase('inspira');
              setBreathSeconds(4);
              setIsActive(true);
            }}
            className="p-2 rounded-full bg-[#234C77] text-slate-300 hover:text-white hover:bg-[#88A5BF]/40 transition-colors"
            title="Ricomincia 60s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Protocol summary */}
        <div className="text-xs text-slate-300 mb-6 bg-[#021831]/60 px-4 py-2.5 rounded-xl border border-slate-700/50 text-left w-full space-y-1">
          <p className="font-semibold text-slate-200">Protocollo Rapido:</p>
          <p>• <strong>Piedi</strong> saldi a terra, peso distribuito.</p>
          <p>• <strong>Colonna</strong> allungata verso l'alto, spalle basse.</p>
          <p>• <strong>Sguardo</strong> alto all'orizzonte: non nasconderti.</p>
        </div>

        {/* Exit button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl gold-gradient-btn text-base font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <span>Torno in pista</span>
          <span className="text-xs opacity-75 font-normal">→</span>
        </button>
      </div>
    </div>
  );
};
