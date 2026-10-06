import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Lock,
  Sparkles,
  HelpCircle,
  FileText,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { MISSIONS_21, MissionItem } from '../config';
import { getUnita } from '../../content/index';
import { MissionProgress } from '../types';
import { getMissionsProgress, saveMissionProgress } from '../services/storage';

interface PlanScreenProps {
  onOpenUnita: (id: string) => void;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({ onOpenUnita }) => {
  const [progress, setProgress] = useState<Record<number, MissionProgress>>({});
  const [expandedMissionId, setExpandedMissionId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});
  const [justFinishedPhase, setJustFinishedPhase] = useState<number | null>(null);

  useEffect(() => {
    const data = getMissionsProgress();
    setProgress(data);

    const notesInit: Record<number, string> = {};
    Object.keys(data).forEach((idStr) => {
      const id = Number(idStr);
      notesInit[id] = data[id]?.note || '';
    });
    setEditingNotes(notesInit);

    // Auto-expand next uncompleted
    const nextUncompleted = MISSIONS_21.find((m) => !data[m.id]?.completed);
    if (nextUncompleted) {
      setExpandedMissionId(nextUncompleted.id);
    }
  }, []);

  const completedCount = MISSIONS_21.filter((m) => progress[m.id]?.completed).length;
  const progressPercent = Math.round((completedCount / MISSIONS_21.length) * 100);

  const isPhase1Done = [1, 2, 3, 4, 5, 6, 7].every((id) => progress[id]?.completed);
  const isPhase2Done = [8, 9, 10, 11, 12, 13, 14].every((id) => progress[id]?.completed);
  const isPhase3Done = [15, 16, 17, 18, 19, 20, 21].every((id) => progress[id]?.completed);

  const handleToggleCompleted = (mission: MissionItem) => {
    const isUnlocked = mission.id === 1 || progress[mission.id - 1]?.completed;
    if (!isUnlocked) return;

    const currentStatus = !!progress[mission.id]?.completed;
    const newStatus = !currentStatus;

    const updated = saveMissionProgress(mission.id, {
      completed: newStatus,
      note: editingNotes[mission.id] || progress[mission.id]?.note || '',
    });
    setProgress(updated);

    if (newStatus) {
      if (mission.id === 7 && [1, 2, 3, 4, 5, 6].every((id) => updated[id]?.completed)) {
        setJustFinishedPhase(1);
      } else if (mission.id === 14 && [8, 9, 10, 11, 12, 13].every((id) => updated[id]?.completed)) {
        setJustFinishedPhase(2);
      } else if (mission.id === 21 && [15, 16, 17, 18, 19, 20].every((id) => updated[id]?.completed)) {
        setJustFinishedPhase(3);
      }
    }
  };

  const handleSaveNote = (missionId: number) => {
    const text = editingNotes[missionId] || '';
    const updated = saveMissionProgress(missionId, { note: text });
    setProgress(updated);
  };

  const phases = [
    {
      num: 1 as const,
      name: 'FASE 1 – PRESENZA',
      subtitle: 'Costruire l\'Asse, il coraggio dell\'invito e il Contatto Zero.',
      range: [1, 7],
      isDone: isPhase1Done,
    },
    {
      num: 2 as const,
      name: 'FASE 2 – CONNESSIONE',
      subtitle: 'Lo Sguardo Ancora, la Tensione Lenta e la Chiusura Calamita.',
      range: [8, 14],
      isDone: isPhase2Done,
    },
    {
      num: 3 as const,
      name: 'FASE 3 – CONTINUITÀ',
      subtitle: 'Tirare il filo, il Radar dei segnali e passare dal ballo alla realtà.',
      range: [15, 21],
      isDone: isPhase3Done,
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-28 space-y-4 animate-fadeIn">
      {/* Celebration banner if phase completed */}
      {justFinishedPhase && (
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-[#F9C03E]/30 to-amber-500/20 border border-[#F9C03E] rounded-2xl text-center relative overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#F9C03E] animate-bounce" />
            <h3 className="font-serif font-bold text-white text-base">
              Complimenti! Hai completato la FASE {justFinishedPhase}
            </h3>
            <Sparkles className="w-5 h-5 text-[#F9C03E] animate-bounce" />
          </div>
          <p className="text-xs text-slate-200">
            Il tuo magnetismo in pista è già cambiato. Continua così alla prossima serata!
          </p>
          <button
            onClick={() => setJustFinishedPhase(null)}
            className="mt-2 text-[11px] underline text-[#F9C03E] font-medium"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="glass-card p-5 border border-[#88A5BF]/30">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold font-serif text-white">Piano 21 Serate</h1>
            <p className="text-xs text-[#88A5BF]">Il percorso completo per sbloccare l'Effetto Calamita</p>
          </div>
          <div className="text-right">
            <span className="text-base font-bold font-mono text-[#F9C03E]">
              {completedCount}/21
            </span>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider">Completate</p>
          </div>
        </div>

        {/* Link: Come funziona il piano */}
        <div className="pt-1 pb-2">
          <button
            onClick={() => onOpenUnita('bonus6')}
            className="text-xs text-[#F9C03E] hover:underline flex items-center gap-1 font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Come funziona il piano (leggi Bonus 6) →</span>
          </button>
        </div>

        {/* Overall progress bar */}
        <div className="w-full bg-[#021831] h-2.5 rounded-full overflow-hidden border border-slate-700/50 mt-2">
          <div
            className="bg-gradient-to-r from-[#234C77] via-[#88A5BF] to-[#F9C03E] h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Phase Groups */}
      <div className="space-y-5">
        {phases.map((phase) => {
          const phaseMissions = MISSIONS_21.filter((m) => m.phase === phase.num);
          const phaseCompletedCount = phaseMissions.filter((m) => progress[m.id]?.completed).length;

          return (
            <div key={phase.num} className="space-y-2.5">
              {/* Phase Header */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F9C03E] tracking-wider uppercase">
                      {phase.name}
                    </span>
                    {phase.isDone && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F9C03E]/20 text-[#F9C03E] border border-[#F9C03E]/40 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Fatta
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#88A5BF]">{phase.subtitle}</p>
                </div>
                <span className="text-xs font-mono text-slate-300">
                  {phaseCompletedCount}/7
                </span>
              </div>

              {/* Missions in this phase */}
              <div className="space-y-2">
                {phaseMissions.map((mission) => {
                  const isCompleted = !!progress[mission.id]?.completed;
                  const isUnlocked = mission.id === 1 || progress[mission.id - 1]?.completed;
                  const isExpanded = expandedMissionId === mission.id;
                  const linkedUnit = getUnita(mission.readingUnitId);

                  return (
                    <div
                      key={mission.id}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        !isUnlocked
                          ? 'bg-[#021831]/40 border-slate-800 opacity-60'
                          : isCompleted
                          ? 'glass-card border-emerald-500/40'
                          : 'glass-card border-[#88A5BF]/30'
                      }`}
                    >
                      {/* Mission summary row */}
                      <div
                        onClick={() => {
                          if (isUnlocked) {
                            setExpandedMissionId(isExpanded ? null : mission.id);
                          }
                        }}
                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer ${
                          !isUnlocked ? 'cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCompleted(mission);
                            }}
                            disabled={!isUnlocked}
                            className="shrink-0 text-left"
                            aria-label={`Segna missione ${mission.id} come completata`}
                          >
                            {!isUnlocked ? (
                              <div className="w-6 h-6 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            ) : isCompleted ? (
                              <div className="w-6 h-6 rounded-lg bg-emerald-600/90 text-white flex items-center justify-center">
                                <CheckSquare className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-[#021831] border border-slate-500 hover:border-[#F9C03E] flex items-center justify-center text-slate-400">
                                <Square className="w-4 h-4" />
                              </div>
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[#88A5BF] font-semibold">
                                #{mission.id}
                              </span>
                              <h3
                                className={`text-xs md:text-sm font-semibold truncate ${
                                  isCompleted ? 'text-slate-300 line-through' : 'text-white'
                                }`}
                              >
                                {mission.title}
                              </h3>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Pulsante "Rileggi" capitolo */}
                          {linkedUnit && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenUnita(mission.readingUnitId);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#234C77]/60 hover:bg-[#234C77] border border-[#88A5BF]/30 text-[10px] text-[#F9C03E] font-semibold flex items-center gap-1 transition-colors"
                              title={`Rileggi ${linkedUnit.label}`}
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Rileggi ({mission.readingUnitId})</span>
                            </button>
                          )}

                          {isUnlocked && (
                            isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )
                          )}
                        </div>
                      </div>

                      {/* Expanded Mission Details */}
                      {isUnlocked && isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-700/40 text-xs space-y-3 bg-[#021831]/50">
                          <p className="text-slate-200 leading-relaxed bg-[#042B58]/80 p-3 rounded-xl border border-[#88A5BF]/20">
                            {mission.description}
                          </p>

                          {/* Personal Note */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#88A5BF] flex items-center gap-1">
                              <FileText className="w-3 h-3 text-[#F9C03E]" />
                              <span>Nota personale per questa serata:</span>
                            </label>
                            <textarea
                              value={editingNotes[mission.id] || ''}
                              onChange={(e) =>
                                setEditingNotes({
                                  ...editingNotes,
                                  [mission.id]: e.target.value,
                                })
                              }
                              placeholder="Cosa è successo? Come è andata la missione?"
                              rows={2}
                              className="w-full p-2.5 bg-[#021831] border border-[#88A5BF]/30 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F9C03E]"
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSaveNote(mission.id)}
                                className="px-3 py-1 bg-[#234C77] hover:bg-[#88A5BF]/40 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Save className="w-3 h-3" />
                                <span>Salva nota</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* "Serata storta?" Section */}
      <div className="glass-card p-5 border border-amber-500/30 bg-[#021831]/70 mt-6 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#F9C03E]" />
          <h3 className="font-serif font-bold text-white text-sm">Serata storta?</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Tutti i più grandi ballerini hanno serate in cui non si sentono in sintonia o incassano no. Ecco le 3 regole auree del metodo:
        </p>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 bg-[#042B58]/80 rounded-xl border border-slate-700/50">
            <strong className="text-[#F9C03E] block mb-0.5">1. Non ricominciare da capo:</strong>
            <span className="text-slate-300">
              I progressi già fatti nel tuo Asse non spariscono per una serata no. Il cammino è progressivo.
            </span>
          </div>

          <div className="p-2.5 bg-[#042B58]/80 rounded-xl border border-slate-700/50">
            <strong className="text-[#F9C03E] block mb-0.5">2. Ripeti la missione:</strong>
            <span className="text-slate-300">
              Se non hai completato la missione di stasera, nessun problema: alla prossima serata riprova esattamente la stessa con mente fresca.
            </span>
          </div>

          <div className="p-2.5 bg-[#042B58]/80 rounded-xl border border-slate-700/50">
            <strong className="text-[#F9C03E] block mb-0.5">3. Ricorda le 3 P:</strong>
            <span className="text-slate-300">
              Un rifiuto o un ballo freddo <strong>non è personale</strong> (non conosce il tuo valore), <strong>non è permanente</strong> (la prossima canzone è un nuovo inizio), <strong>non è pervasivo</strong> (non definisce la tua vita).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
