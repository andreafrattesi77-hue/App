import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Smartphone,
  Eye,
  Wind,
  Target,
  Edit2,
  Save,
} from 'lucide-react';
import { MISSIONS_21, OFFICIAL_SIGNATURE } from '../config';
import { getUserData, saveUserData, getMissionsProgress } from '../services/storage';

interface RitualScreenProps {
  onFinishRitual: () => void;
  onExit: () => void;
  onOpenUnita?: (id: string) => void;
}

export const RitualScreen: React.FC<RitualScreenProps> = ({
  onFinishRitual,
  onExit,
  onOpenUnita,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Step 2: 2-minute breathing timer (120s)
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inspira' | 'espira'>('inspira');
  const [phaseSeconds, setPhaseSeconds] = useState(4);

  // Step 3: Asse checklist
  const [checklist, setChecklist] = useState({
    piedi: false,
    colonna: false,
    spalle: false,
    respiro: false,
    sguardo: false,
  });

  // Step 5: Intentions
  const [intentions, setIntentions] = useState<string[]>([
    'Se vedo una donna che mi piace, allora la invito entro 3 secondi.',
    'Se ricevo un rifiuto, allora applico i 10 secondi eleganti col sorriso.',
    'Se entro in pista, allora faccio il Contatto Zero con calma prima di muovere un passo.',
  ]);
  const [editingIntentionIdx, setEditingIntentionIdx] = useState<number | null>(null);
  const [tempIntentionText, setTempIntentionText] = useState('');

  // Step 6: current mission from 21 plan
  const [currentMission, setCurrentMission] = useState(MISSIONS_21[0]);

  // Load intentions & current mission
  useEffect(() => {
    const user = getUserData();
    if (user?.customIntentions && user.customIntentions.length > 0) {
      setIntentions(user.customIntentions);
    }

    const prog = getMissionsProgress();
    const nextUnfinished = MISSIONS_21.find((m) => !prog[m.id]?.completed);
    if (nextUnfinished) {
      setCurrentMission(nextUnfinished);
    }
  }, []);

  // Step 2 timer tick
  useEffect(() => {
    if (currentStep !== 2 || !isTimerRunning) return;

    if (secondsLeft <= 0) {
      setIsTimerRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, isTimerRunning, secondsLeft]);

  // Step 2 breathing loop
  useEffect(() => {
    if (currentStep !== 2 || !isTimerRunning) return;

    const breathInterval = setInterval(() => {
      setPhaseSeconds((prev) => {
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

    return () => clearInterval(breathInterval);
  }, [currentStep, isTimerRunning, breathPhase]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecklistTicked = Object.values(checklist).every(Boolean);

  const handleSaveIntention = (idx: number) => {
    const updated = [...intentions];
    updated[idx] = tempIntentionText;
    setIntentions(updated);
    setEditingIntentionIdx(null);
    saveUserData({ customIntentions: updated });
  };

  const handleCompleteRitual = () => {
    const today = new Date().toISOString().slice(0, 10);
    const user = getUserData();
    const dates = user?.ritualCompletedDates || [];
    if (!dates.includes(today)) {
      dates.push(today);
      saveUserData({ ritualCompletedDates: dates });
    }
    onFinishRitual();
  };

  const formatMinutesSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-24 flex flex-col justify-between min-h-[82vh] animate-fadeIn">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pt-2 mb-3">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs text-[#88A5BF] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Esci</span>
          </button>
          <div className="text-xs font-mono font-semibold text-[#F9C03E]">
            Passo {currentStep} di {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#021831] h-1.5 rounded-full overflow-hidden border border-slate-700/40 mb-6">
          <div
            className="bg-gradient-to-r from-[#234C77] to-[#F9C03E] h-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* STEP 1: Phone off / sitting in car */}
        {currentStep === 1 && (
          <div className="glass-card p-6 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#234C77] flex items-center justify-center border border-[#88A5BF]/40 shadow-lg">
              <Smartphone className="w-8 h-8 text-[#F9C03E]" />
            </div>

            <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-widest block">
              Passo 1 • Il distacco dal mondo
            </span>

            <h2 className="text-xl md:text-2xl font-serif font-bold text-white leading-snug">
              Spegni le notifiche e siediti comodo in macchina.
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#021831]/60 p-4 rounded-2xl border border-slate-700/60">
              Metti il telefono in modalità "Non disturbare". Lascia fuori dall'auto il lavoro, i problemi quotidiani e le frecciate della mente. Stai per entrare nello spazio del ballo da uomo centrato e presente.
            </p>
          </div>
        )}

        {/* STEP 2: Breathing 2 minutes */}
        {currentStep === 2 && (
          <div className="glass-card p-6 text-center space-y-4 animate-fadeIn">
            <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-widest block">
              Passo 2 • Respirazione di decompressione
            </span>

            <h2 className="text-xl font-serif font-bold text-white leading-snug">
              2 Minuti di Respirazione (4-6)
            </h2>

            <p className="text-xs text-slate-300">
              Inspira 4 secondi dal naso, espira 6 secondi dalla bocca. Abbassa il cortisolo e attiva la calma maschile.
            </p>

            {/* Breathing Circle */}
            <div className="relative flex items-center justify-center w-48 h-48 mx-auto my-4">
              <div
                className={`absolute rounded-full border-2 border-[#F9C03E]/40 transition-all duration-1000 ${
                  breathPhase === 'inspira'
                    ? 'w-44 h-44 bg-[#F9C03E]/15 scale-105'
                    : 'w-28 h-28 bg-[#234C77]/40 scale-95'
                }`}
              />

              <div
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border border-[#F9C03E]/60 shadow-inner z-10 transition-all duration-1000 ${
                  breathPhase === 'inspira' ? 'bg-[#042B58]' : 'bg-[#021831]'
                }`}
              >
                <span className="text-[#F9C03E] text-xs font-bold uppercase tracking-widest mb-1">
                  {breathPhase === 'inspira' ? 'Inspira…' : 'Espira…'}
                </span>
                <span className="text-2xl font-bold text-white font-mono">
                  {phaseSeconds}s
                </span>
              </div>
            </div>

            {/* Timer controls */}
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-xs text-slate-300">
                Tempo residuo: <strong className="text-white">{formatMinutesSeconds(secondsLeft)}</strong>
              </span>

              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="py-1.5 px-3 rounded-xl bg-[#234C77] text-white hover:bg-[#88A5BF]/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'Pausa' : 'Avvia timer'}</span>
              </button>

              <button
                onClick={() => {
                  setSecondsLeft(120);
                  setPhaseSeconds(4);
                  setBreathPhase('inspira');
                  setIsTimerRunning(false);
                }}
                className="p-1.5 rounded-xl bg-[#021831] text-slate-400 hover:text-white text-xs border border-slate-700"
                title="Ricomincia 2m"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Controllo dell'Asse */}
        {currentStep === 3 && (
          <div className="glass-card p-6 space-y-4 animate-fadeIn">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-widest block">
                Passo 3 • Check del Corpo
              </span>
              <h2 className="text-xl font-serif font-bold text-white leading-snug">
                Controllo dell'Asse
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                La sicurezza non è una recita mentale: è una postura fisica. Spunta ogni punto mentre lo sperimenti.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                { key: 'piedi', label: 'Piedi a terra', desc: 'Senti il peso distribuito sui piedi, ben ancorato al suolo.' },
                { key: 'colonna', label: 'Colonna lunga', desc: 'Immagina un filo d\'oro che ti distende verso l\'alto.' },
                { key: 'spalle', label: 'Spalle basse', desc: 'Rilascia la tensione, scapole aperte e petto fiero.' },
                { key: 'respiro', label: 'Respiro lento', desc: 'Respira con il diaframma, senza fretta né affanno.' },
                { key: 'sguardo', label: 'Sguardo all\'orizzonte', desc: 'Non guardare a terra. Occhi dritti e sereni.' },
              ].map((item) => {
                const isChecked = checklist[item.key as keyof typeof checklist];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleChecklist(item.key as keyof typeof checklist)}
                    className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      isChecked
                        ? 'bg-[#234C77] border-[#F9C03E] text-white shadow-sm'
                        : 'bg-[#021831]/60 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked
                          ? 'border-[#F9C03E] bg-[#F9C03E] text-[#042B58]'
                          : 'border-slate-500'
                      }`}
                    >
                      {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[11px] text-slate-400">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: La Domanda Chiave */}
        {currentStep === 4 && (
          <div className="glass-card p-6 text-center space-y-5 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#234C77] flex items-center justify-center border border-[#F9C03E]/40 shadow-lg">
              <Eye className="w-7 h-7 text-[#F9C03E]" />
            </div>

            <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-widest block">
              Passo 4 • Il cambio di polarità
            </span>

            <h2 className="text-xl font-serif font-bold text-white">
              La Domanda Chiave
            </h2>

            <div className="p-5 bg-[#021831]/80 border border-[#F9C03E]/40 rounded-2xl">
              <p className="text-sm font-serif italic text-[#F9C03E] leading-relaxed">
                "Stasera non mi chiedo: 'le piacerò?'.
                <br />
                <strong className="text-white not-italic block mt-2 text-base font-sans">
                  Mi chiedo: 'mi piace lei? Voglio scoprirlo.'
                </strong>
              </p>
            </div>

            <p className="text-xs text-slate-300 text-left leading-relaxed bg-[#234C77]/30 p-3.5 rounded-xl border border-[#88A5BF]/20">
              Quando chiedi "le piacerò?", metti tutto il potere nelle sue mani e diventi un mendicante di approvazione. Quando chiedi "mi piace lei?", diventi l'uomo che sceglie e valuta con chi condividere il proprio tempo.
            </p>
          </div>
        )}

        {/* STEP 5: Intenzioni "se… allora" */}
        {currentStep === 5 && (
          <div className="glass-card p-6 space-y-4 animate-fadeIn">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-widest block">
                Passo 5 • Istruzioni per la mente
              </span>
              <h2 className="text-xl font-serif font-bold text-white">
                Intenzioni "Se… Allora"
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                La mente si blocca quando deve improvvisare sotto pressione. Programma le tue risposte automatiche:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {intentions.map((intent, idx) => (
                <div key={idx} className="p-3 bg-[#021831]/70 border border-slate-700 rounded-xl text-xs">
                  {editingIntentionIdx === idx ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempIntentionText}
                        onChange={(e) => setTempIntentionText(e.target.value)}
                        className="w-full p-2 bg-[#042B58] border border-[#F9C03E] rounded-lg text-white text-xs focus:outline-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingIntentionIdx(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                        >
                          Annulla
                        </button>
                        <button
                          onClick={() => handleSaveIntention(idx)}
                          className="px-2 py-1 bg-[#F9C03E] text-[#042B58] font-bold rounded text-[11px] flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Salva</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-slate-200 font-medium leading-relaxed">
                        • {intent}
                      </p>
                      <button
                        onClick={() => {
                          setEditingIntentionIdx(idx);
                          setTempIntentionText(intent);
                        }}
                        className="text-slate-400 hover:text-[#F9C03E] p-1 shrink-0"
                        title="Modifica intenzione"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Obiettivo della serata (Piano 21) */}
        {currentStep === 6 && (
          <div className="glass-card p-6 space-y-4 animate-fadeIn">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-widest block">
                Passo 6 • Focus Operativo
              </span>
              <h2 className="text-xl font-serif font-bold text-white">
                Obiettivo di Stasera
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Non andare alla rinfusa. Stasera hai un unico obiettivo specifico da completare:
              </p>
            </div>

            <div className="p-4 bg-[#234C77]/60 border border-[#F9C03E]/50 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2.5 py-0.5 rounded-full border border-[#F9C03E]/30">
                  {currentMission.phaseName}
                </span>
                <span className="text-xs font-mono text-slate-300 font-bold">
                  Serata {currentMission.id} di 21
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-white mb-2">
                {currentMission.title}
              </h3>

              <p className="text-xs text-slate-200 leading-relaxed bg-[#021831]/60 p-3 rounded-xl border border-slate-700/60">
                {currentMission.description}
              </p>
            </div>

            <div className="text-xs text-[#88A5BF] text-center italic">
              Non giudicare l'intera serata da quante figure fai: concentrati unicamente su questa missione.
            </div>
          </div>
        )}

        {/* STEP 7: Chiusura & Go */}
        {currentStep === 7 && (
          <div className="glass-card p-6 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#234C77] to-[#021831] flex items-center justify-center border border-[#F9C03E]/50 shadow-xl">
              <Sparkles className="w-8 h-8 text-[#F9C03E]" />
            </div>

            <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-widest block">
              Passo 7 • Il Lancio
            </span>

            <h2 className="text-2xl font-serif font-bold text-white">
              Sei pronto.
            </h2>

            <div className="p-4 bg-[#021831]/80 border border-[#88A5BF]/30 rounded-2xl">
              <p className="text-sm font-semibold text-white leading-relaxed">
                Entra in sala a testa alta e balla la prima canzone <span className="text-[#F9C03E]">entro dieci minuti</span>.
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Non aspettare il momento "perfetto" o l'invitata perfetta. Rompi il ghiaccio, ascolta la musica e lascia che il Filo Invisibile inizi a tendersi.
            </p>

            <button
              onClick={handleCompleteRitual}
              className="w-full py-4 px-6 rounded-2xl gold-gradient-btn text-base font-bold shadow-xl flex items-center justify-center gap-2 group"
            >
              <CheckCircle className="w-5 h-5 text-[#042B58]" />
              <span>Ho finito il rituale</span>
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onExit();
                  if (onOpenUnita) onOpenUnita('bonus2');
                }}
                className="text-xs text-[#F9C03E] hover:underline font-semibold"
              >
                Leggi il rituale completo (Bonus 2) →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons for steps 1-6 */}
      {currentStep < 7 && (
        <div className="flex items-center justify-between pt-4 mt-auto">
          {currentStep > 1 ? (
            <button
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white py-2.5 px-4 rounded-xl bg-[#021831] border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Indietro</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={currentStep === 3 && !allChecklistTicked}
            className={`inline-flex items-center gap-2 text-xs font-bold py-2.5 px-5 rounded-xl transition-all ml-auto ${
              currentStep === 3 && !allChecklistTicked
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'gold-gradient-btn shadow-md'
            }`}
          >
            <span>Avanti</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
