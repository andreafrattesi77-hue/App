import React from 'react';
import {
  Sparkles,
  Compass,
  MessageSquare,
  BookOpen,
  Flame,
  ArrowRight,
  ShieldAlert,
  Award,
  Calendar,
  Video,
  ExternalLink,
} from 'lucide-react';
import { MISSIONS_21, PROFILES, OFFICIAL_SIGNATURE, VIDEOCORSO_URL } from '../config';
import { getUnita } from '../../content/index';
import { UserData, EveningEntry, MissionProgress } from '../types';

interface HomeScreenProps {
  user: UserData;
  missionsProgress: Record<number, MissionProgress>;
  diaryEntries: EveningEntry[];
  onNavigateTab: (tab: 'home' | 'libreria' | 'coach' | 'piano' | 'diario') => void;
  onOpenReset: () => void;
  onOpenQuiz: () => void;
  onOpenRitual: () => void;
  onOpenUnita: (id: string) => void;
  onOpenVideocorsoTab: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  missionsProgress,
  diaryEntries,
  onNavigateTab,
  onOpenReset,
  onOpenQuiz,
  onOpenRitual,
  onOpenUnita,
  onOpenVideocorsoTab,
}) => {
  // Current active mission in 21 plan
  const currentMission =
    MISSIONS_21.find((m) => !missionsProgress[m.id]?.completed) || MISSIONS_21[20];
  const completedMissionsCount = MISSIONS_21.filter(
    (m) => missionsProgress[m.id]?.completed
  ).length;

  // Last opened unit for "Riprendi a leggere"
  const lastUnitId = user.lastOpenedUnitId || 'intro';
  const lastOpenedUnit = getUnita(lastUnitId);
  const lastReadingProgress = user.readingPositions?.[lastUnitId] || 0;

  // Rating stats
  const latestEntry = diaryEntries.length > 0 ? diaryEntries[0] : null;
  const recentEntries = diaryEntries.slice(0, 5);
  const averageLast5 =
    recentEntries.length > 0
      ? (
          recentEntries.reduce((sum, e) => sum + e.rating, 0) /
          recentEntries.length
        ).toFixed(1)
      : null;

  const userProfileInfo = user.profile ? PROFILES[user.profile] : null;

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-28 space-y-4 animate-fadeIn">
      {/* Top Welcome & Gold Reset Button Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-wider">
            Bentornato
          </span>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-white">
            Ciao {user.name || 'Ballerino'},
          </h1>
          <p className="text-xs text-slate-300">pronto per la prossima serata?</p>
        </div>

        {/* Gold Reset Button */}
        <button
          onClick={onOpenReset}
          className="py-2 px-3.5 rounded-2xl gold-gradient-btn text-[#042B58] font-bold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-all"
          title="Reset di Emergenza in pista"
        >
          <ShieldAlert className="w-4 h-4 text-[#042B58]" />
          <span className="tracking-wide">Reset</span>
        </button>
      </div>

      {/* Card "Riprendi a leggere" */}
      {lastOpenedUnit && (
        <div className="glass-card p-4 border border-[#88A5BF]/30 relative overflow-hidden flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] uppercase font-bold text-[#F9C03E]">
                Riprendi a leggere
              </span>
              <span className="text-[10px] text-slate-400">
                • {lastOpenedUnit.label}
              </span>
            </div>
            <h3 className="text-xs md:text-sm font-bold text-white truncate">
              {lastOpenedUnit.titolo}
            </h3>

            {/* Reading progress bar */}
            <div className="w-full bg-[#021831] h-1.5 rounded-full overflow-hidden border border-slate-700/50 mt-2">
              <div
                className="bg-[#F9C03E] h-full transition-all duration-300"
                style={{ width: `${Math.max(8, lastReadingProgress)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onOpenUnita(lastOpenedUnit.id)}
            className="py-2 px-3.5 rounded-xl gold-gradient-btn text-xs font-bold shrink-0 flex items-center gap-1 shadow-md"
          >
            <span>Continua</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#042B58]" />
          </button>
        </div>
      )}

      {/* Card "Prossima Missione" */}
      <div className="glass-card p-5 border border-[#F9C03E]/40 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F9C03E] bg-[#021831] px-2.5 py-0.5 rounded-full border border-[#F9C03E]/40">
            Prossima Missione
          </span>
          <span className="text-xs font-mono font-semibold text-slate-300">
            Serata {currentMission.id} di 21
          </span>
        </div>

        <h2 className="text-base font-serif font-bold text-white mb-1">
          {currentMission.title}
        </h2>

        <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed mb-3.5">
          {currentMission.description}
        </p>

        {/* Progress bar of 21 nights */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-[11px] text-[#88A5BF]">
            <span>Avanzamento del piano</span>
            <span className="font-mono text-white font-semibold">
              Serata {completedMissionsCount + 1} di 21 ({Math.round((completedMissionsCount / 21) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-[#021831] h-2 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className="bg-gradient-to-r from-[#234C77] via-[#88A5BF] to-[#F9C03E] h-full transition-all duration-500"
              style={{ width: `${(completedMissionsCount / 21) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('piano')}
          className="w-full py-2.5 px-4 rounded-xl gold-gradient-btn text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
        >
          <span>Vai alla missione</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#042B58]" />
        </button>
      </div>

      {/* Thermometer Highlights (Ultimo voto e media ultime 5) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3.5 text-center flex flex-col justify-between">
          <span className="text-[10px] text-[#88A5BF] uppercase font-semibold block mb-1">
            Ultimo Termometro
          </span>
          <div className="flex items-center justify-center gap-1 my-1">
            <Flame className="w-4 h-4 text-[#F9C03E]" />
            <span className="text-xl font-bold font-mono text-white">
              {latestEntry ? `${latestEntry.rating}/5` : '—'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {latestEntry ? latestEntry.venue : 'Nessuna serata'}
          </p>
        </div>

        <div className="glass-card p-3.5 text-center flex flex-col justify-between">
          <span className="text-[10px] text-[#88A5BF] uppercase font-semibold block mb-1">
            Media Ultime 5
          </span>
          <div className="flex items-center justify-center gap-1 my-1">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-xl font-bold font-mono text-white">
              {averageLast5 ? `${averageLast5}/5` : '—'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {diaryEntries.length > 0 ? `${Math.min(5, diaryEntries.length)} serate registrate` : 'Fai il primo ballo'}
          </p>
        </div>
      </div>

      {/* Card "Videocorso" */}
      <div className="glass-card p-4 border border-[#F9C03E]/40 flex items-center justify-between gap-3 bg-[#021831]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#234C77] flex items-center justify-center text-[#F9C03E]">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#F9C03E]">
              <span>Videocorso in pista</span>
            </div>
            <h4 className="text-xs font-bold text-white">
              Guarda il metodo in pista: 120 minuti di video pratici
            </h4>
          </div>
        </div>
        <a
          href={VIDEOCORSO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 rounded-xl gold-gradient-btn text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Scopri il videocorso</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#88A5BF] uppercase tracking-wider block px-1">
          Strumenti rapidi
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Rituale Pre-Serata */}
          <button
            onClick={onOpenRitual}
            className="p-3.5 rounded-2xl bg-[#234C77]/60 hover:bg-[#234C77] border border-[#88A5BF]/30 text-left transition-all flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#042B58] flex items-center justify-center text-[#F9C03E] mb-2 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-0.5">Fai il Rituale Pre-Serata</h4>
              <p className="text-[10px] text-slate-300">Centratura in auto (7 passi)</p>
            </div>
          </button>

          {/* Chiedi al Coach */}
          <button
            onClick={() => onNavigateTab('coach')}
            className="p-3.5 rounded-2xl bg-[#234C77]/60 hover:bg-[#234C77] border border-[#88A5BF]/30 text-left transition-all flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#042B58] flex items-center justify-center text-[#F9C03E] mb-2 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-0.5">Chiedi al Coach</h4>
              <p className="text-[10px] text-slate-300">Andrea Virtuale ti risponde</p>
            </div>
          </button>

          {/* Scrivi il diario */}
          <button
            onClick={() => onNavigateTab('diario')}
            className="p-3.5 rounded-2xl bg-[#234C77]/60 hover:bg-[#234C77] border border-[#88A5BF]/30 text-left transition-all flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#042B58] flex items-center justify-center text-[#F9C03E] mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-0.5">Scrivi il diario di stasera</h4>
              <p className="text-[10px] text-slate-300">Voto del Filo e feedback</p>
            </div>
          </button>

          {/* Scopri il tuo profilo */}
          <button
            onClick={onOpenQuiz}
            className="p-3.5 rounded-2xl bg-[#234C77]/60 hover:bg-[#234C77] border border-[#88A5BF]/30 text-left transition-all flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#042B58] flex items-center justify-center text-[#F9C03E] mb-2 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-0.5">
                {userProfileInfo ? `Profilo: ${userProfileInfo.name}` : 'Scopri il tuo profilo'}
              </h4>
              <p className="text-[10px] text-slate-300">Test dei 4 profili (10 q)</p>
            </div>
          </button>
        </div>
      </div>

      {/* Signature in calce */}
      <div className="pt-4 text-center">
        <p className="text-xs text-[#88A5BF] italic font-serif leading-relaxed px-4">
          "{OFFICIAL_SIGNATURE}"
        </p>
      </div>
    </div>
  );
};
