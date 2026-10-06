import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, MessageSquare, Award, CheckCircle2, BookOpen } from 'lucide-react';
import { QUIZ_QUESTIONS, PROFILES, ProfileType } from '../config';
import { getUnita } from '../../content/index';
import { saveUserData } from '../services/storage';

interface QuizScreenProps {
  initialProfile: ProfileType | null;
  onProfileAssigned: (profile: ProfileType) => void;
  onAskCoachWithPrompt: (prompt: string) => void;
  onOpenUnita?: (id: string) => void;
  onBackToHome?: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  initialProfile,
  onProfileAssigned,
  onAskCoachWithPrompt,
  onOpenUnita,
  onBackToHome,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, ProfileType>>({});
  const [resultProfile, setResultProfile] = useState<ProfileType | null>(initialProfile);
  const [isCompleted, setIsCompleted] = useState<boolean>(!!initialProfile);

  const question = QUIZ_QUESTIONS[currentQuestionIndex];
  const totalQuestions = QUIZ_QUESTIONS.length;

  const handleSelectOption = (profile: ProfileType) => {
    const updatedAnswers = { ...answers, [question.id]: profile };
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate winner
      const counts: Record<ProfileType, number> = {
        tecnico: 0,
        congelato: 0,
        bravo_ragazzo: 0,
        collezionista: 0,
      };

      Object.values(updatedAnswers).forEach((p) => {
        counts[p] = (counts[p] || 0) + 1;
      });

      let winner: ProfileType = 'tecnico';
      let maxCount = -1;

      (Object.keys(counts) as ProfileType[]).forEach((p) => {
        if (counts[p] > maxCount) {
          maxCount = counts[p];
          winner = p;
        }
      });

      setResultProfile(winner);
      setIsCompleted(true);
      saveUserData({
        profile: winner,
        quizAnswers: updatedAnswers,
      });
      onProfileAssigned(winner);
    }
  };

  const handleRestartQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
  };

  // Distribution calculation
  const getDistribution = () => {
    const counts: Record<ProfileType, number> = {
      tecnico: 0,
      congelato: 0,
      bravo_ragazzo: 0,
      collezionista: 0,
    };

    const entries = Object.values(answers);
    if (entries.length === 0 && resultProfile) {
      counts[resultProfile] = 10;
    } else {
      entries.forEach((p) => {
        counts[p] = (counts[p] || 0) + 1;
      });
    }

    const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));

    return {
      tecnico: Math.round((counts.tecnico / total) * 100),
      congelato: Math.round((counts.congelato / total) * 100),
      bravo_ragazzo: Math.round((counts.bravo_ragazzo / total) * 100),
      collezionista: Math.round((counts.collezionista / total) * 100),
    };
  };

  // If showing result
  if (isCompleted && resultProfile) {
    const profile = PROFILES[resultProfile];
    const distribution = getDistribution();

    return (
      <div className="w-full max-w-md mx-auto p-4 pb-24 space-y-4 animate-fadeIn">
        {/* Header navigation */}
        <div className="flex items-center justify-between pt-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs text-[#88A5BF] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Torna alla Home</span>
            </button>
          )}
          <button
            onClick={handleRestartQuiz}
            className="inline-flex items-center gap-1.5 text-xs text-[#F9C03E] hover:underline ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rifai il test</span>
          </button>
        </div>

        {/* Profile Result Card */}
        <div className="glass-card p-5 border border-[#F9C03E]/40 text-center relative overflow-hidden">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#234C77] flex items-center justify-center border border-[#F9C03E]/40 mb-3 shadow-lg">
            <Award className="w-8 h-8 text-[#F9C03E]" />
          </div>

          <div className="text-xs uppercase tracking-widest text-[#88A5BF] font-semibold mb-1">
            Il tuo profilo dominante
          </div>
          <h1 className="text-2xl font-bold font-serif text-white mb-2">
            {profile.name}
          </h1>
          <p className="text-sm font-serif italic text-[#F9C03E] px-2 mb-4 leading-snug">
            "{profile.tagline}"
          </p>

          <p className="text-xs text-slate-300 text-left leading-relaxed bg-[#021831]/60 p-4 rounded-xl border border-slate-700/60 mb-4">
            {profile.description}
          </p>

          <div className="bg-[#234C77]/50 border border-[#88A5BF]/30 p-3.5 rounded-xl text-left mb-4">
            <span className="text-[11px] font-bold text-[#F9C03E] uppercase tracking-wider block mb-1">
              Punto di svolta (Focus):
            </span>
            <p className="text-xs text-white font-medium">
              {profile.focus}
            </p>
          </div>

          {/* 3 Recommended Actions */}
          <div className="text-left space-y-2 mb-4">
            <span className="text-xs font-bold text-[#88A5BF] uppercase tracking-wider block">
              3 Azioni concrete consigliate:
            </span>
            {profile.actions.map((act, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-[#021831]/40 p-2.5 rounded-xl border border-slate-700/40 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#F9C03E] shrink-0 mt-0.5" />
                <span>{act}</span>
              </div>
            ))}
          </div>

          {/* Recommended Units to Read */}
          {profile.recommendedUnits && profile.recommendedUnits.length > 0 && onOpenUnita && (
            <div className="text-left space-y-2 mb-5 pt-1">
              <span className="text-xs font-bold text-[#F9C03E] uppercase tracking-wider block">
                Capitoli consigliati per te:
              </span>
              <div className="space-y-1.5">
                {profile.recommendedUnits.map((uId) => {
                  const u = getUnita(uId);
                  if (!u) return null;
                  return (
                    <button
                      key={uId}
                      onClick={() => onOpenUnita(u.id)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#234C77]/60 hover:bg-[#234C77] border border-[#88A5BF]/30 text-xs text-white flex items-center justify-between transition-colors"
                    >
                      <span className="truncate">
                        📖 {u.label} – {u.titolo}
                      </span>
                      <span className="text-[10px] text-[#F9C03E] font-bold shrink-0 ml-2">
                        Leggi →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Distribution chart */}
          <div className="text-left pt-2 pb-1 border-t border-[#88A5BF]/20">
            <span className="text-xs font-semibold text-[#88A5BF] block mb-2">
              Distribuzione delle tue risposte:
            </span>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Il Tecnico</span>
                  <span className="font-mono text-white">{distribution.tecnico}%</span>
                </div>
                <div className="w-full bg-[#021831] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#88A5BF] h-full rounded-full transition-all duration-500" style={{ width: `${distribution.tecnico}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Il Congelato</span>
                  <span className="font-mono text-white">{distribution.congelato}%</span>
                </div>
                <div className="w-full bg-[#021831] h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${distribution.congelato}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Il Bravo Ragazzo</span>
                  <span className="font-mono text-white">{distribution.bravo_ragazzo}%</span>
                </div>
                <div className="w-full bg-[#021831] h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${distribution.bravo_ragazzo}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Il Collezionista</span>
                  <span className="font-mono text-white">{distribution.collezionista}%</span>
                </div>
                <div className="w-full bg-[#021831] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#F9C03E] h-full rounded-full transition-all duration-500" style={{ width: `${distribution.collezionista}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA to Coach */}
        <button
          onClick={() => {
            const prompt = `Ho fatto il test del profilo ed è uscito che sono "${profile.name}". Il mio problema principale è: "${profile.tagline}". Come posso iniziare a lavorare sui miei punti deboli alla prossima serata?`;
            onAskCoachWithPrompt(prompt);
          }}
          className="w-full py-3.5 px-4 rounded-2xl gold-gradient-btn text-sm font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-[#042B58]" />
          <span>Chiedi al Coach come migliorare</span>
        </button>
      </div>
    );
  }

  // Quiz in progress
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-24 space-y-4">
      {/* Top back & progress */}
      <div className="flex items-center justify-between pt-2">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs text-[#88A5BF] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Esci dal test</span>
          </button>
        )}
        <div className="text-xs font-mono text-[#F9C03E] font-medium ml-auto">
          Domanda {currentQuestionIndex + 1} di {totalQuestions}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#021831] h-2 rounded-full overflow-hidden border border-slate-700/50">
        <div
          className="bg-gradient-to-r from-[#234C77] via-[#88A5BF] to-[#F9C03E] h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="glass-card p-5 md:p-6 border border-[#88A5BF]/30">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#88A5BF] mb-2 block">
          Situazione in pista #{question.id}
        </span>
        <h2 className="text-base md:text-lg font-serif font-bold text-white mb-5 leading-snug">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = answers[question.id] === option.profile;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option.profile)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs md:text-sm leading-relaxed transition-all duration-200 flex items-start gap-3 ${
                  isSelected
                    ? 'bg-[#234C77] border-[#F9C03E] text-white shadow-md'
                    : 'bg-[#021831]/70 border-slate-700/70 hover:border-[#88A5BF]/60 text-slate-200 hover:bg-[#234C77]/40'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                    isSelected
                      ? 'border-[#F9C03E] bg-[#F9C03E] text-[#042B58]'
                      : 'border-slate-500 text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center px-1">
        {currentQuestionIndex > 0 ? (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white py-2 px-3 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Precedente</span>
          </button>
        ) : (
          <div />
        )}

        {answers[question.id] && currentQuestionIndex < totalQuestions - 1 && (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="inline-flex items-center gap-1 text-xs text-[#F9C03E] font-medium py-2 px-3 rounded-lg hover:underline ml-auto"
          >
            <span>Avanti</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
