import React from 'react';
import {
  Sparkles,
  Compass,
  MessageCircle,
  BookOpen,
  Flame,
  ArrowRight,
  ShieldAlert,
  Award,
  CalendarCheck,
  Music2,
  Video,
  Clock,
} from 'lucide-react';
import { MISSIONS_21, PROFILES } from '../config';
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
  onOpenRhythm: () => void;
  onOpenUnita: (id: string) => void;
  onOpenVideocorso?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  missionsProgress,
  diaryEntries,
  onNavigateTab,
  onOpenReset,
  onOpenQuiz,
  onOpenRitual,
  onOpenRhythm,
  onOpenUnita,
  onOpenVideocorso,
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
    <div className="w-full max-w-xl mx-auto px-5 py-5 pb-32 space-y-6">
      {/* Top Welcome & Emergency Reset Header */}
      <header className="flex items-start justify-between gap-4 animate-rise">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E5B869]">
            Bentornato
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[0.02em] text-[#f7f6f3]">
            Ciao {user.name || 'Ballerino'},
          </h1>
          <p className="mt-1 text-sm sm:text-base text-[#9da6b9]">
            pronto per la prossima serata?
          </p>
        </div>

        {/* Gold Reset Button */}
        <button
          onClick={onOpenReset}
          className="shrink-0 flex items-center gap-1.5 py-2.5 px-4 rounded-xl gold-gradient-btn text-xs font-bold shadow-gold cursor-pointer"
          title="Reset di Emergenza in pista"
        >
          <ShieldAlert className="w-4 h-4 text-[#121622]" />
          <span>Reset</span>
        </button>
      </header>

      {/* Card "Riprendi a leggere" */}
      {lastOpenedUnit && (
        <section className="animate-rise" style={{ animationDelay: '80ms' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5B869] mb-3">
            Riprendi a leggere
          </h2>
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#182033]/80 p-4 sm:p-5 shadow-card backdrop-blur-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-[#E5B869]">
              <BookOpen className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#9da6b9]">
                • {lastOpenedUnit.label}
              </p>
              <p className="font-display text-base font-semibold text-[#f7f6f3] truncate mt-0.5">
                {lastOpenedUnit.titolo}
              </p>
              <div className="w-full bg-[#0d121e] h-1.5 rounded-full overflow-hidden border border-white/5 mt-2">
                <div
                  className="bg-gradient-gold h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(12, lastReadingProgress)}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => onOpenUnita(lastOpenedUnit.id)}
              className="shrink-0 rounded-lg bg-gold-soft px-3.5 py-2 text-sm font-bold text-[#E5B869] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Continua</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Card "Prossima Missione" */}
      <section className="animate-rise" style={{ animationDelay: '140ms' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5B869] mb-3">
          Prossima missione
        </h2>
        <div className="rounded-2xl border border-white/10 bg-[#182033]/80 p-5 sm:p-6 shadow-card backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#E5B869]">
              Serata {currentMission.id} di 21
            </p>
            <CalendarCheck className="h-5 w-5 text-[#9da6b9]" />
          </div>

          <p className="mt-1 font-display text-xl font-semibold text-[#f7f6f3]">
            {currentMission.title}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-[#9da6b9]">
            {currentMission.description}
          </p>

          {/* Progress bar of 21 nights */}
          <div className="mt-4 pt-2 border-t border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-[#9da6b9]">Avanzamento del piano</span>
              <span className="font-semibold text-[#f7f6f3] tabular-nums">
                Serata {completedMissionsCount + 1} di 21 ({Math.round((completedMissionsCount / 21) * 100)}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0d121e]">
              <div
                className="h-full rounded-full bg-gradient-gold transition-all duration-500"
                style={{ width: `${Math.max(5, (completedMissionsCount / 21) * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('piano')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3.5 text-sm font-bold text-[#121622] shadow-gold cursor-pointer"
          >
            <span>Vai alla missione</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Quick Stats Grid: Ultimo termometro & Media */}
      <section className="grid grid-cols-2 gap-3.5 animate-rise" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => onNavigateTab('diario')}
          className="rounded-2xl border border-white/10 bg-[#182033]/80 p-4 shadow-card transition-colors hover:border-[#E5B869]/50 text-left cursor-pointer"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#E5B869]">
            Ultimo termometro
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <p className="font-display text-2xl sm:text-3xl font-semibold text-[#f7f6f3] tabular-nums">
              {latestEntry ? `${latestEntry.rating}/5` : '—'}
            </p>
          </div>
          <p className="mt-1 text-xs text-[#9da6b9] truncate">
            {latestEntry ? latestEntry.venue : 'Nessuna serata'}
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('diario')}
          className="rounded-2xl border border-white/10 bg-[#182033]/80 p-4 shadow-card transition-colors hover:border-[#E5B869]/50 text-left cursor-pointer"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#E5B869]">
            Media ultime 5
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <p className="font-display text-2xl sm:text-3xl font-semibold text-[#f7f6f3] tabular-nums">
              {averageLast5 ? `${averageLast5}/5` : '—'}
            </p>
          </div>
          <p className="mt-1 text-xs text-[#9da6b9]">
            {diaryEntries.length > 0 ? `${diaryEntries.length} registrate` : 'Fai il primo ballo'}
          </p>
        </button>
      </section>

      {/* Card "Allenatore di Ritmo & Clave" */}
      <section className="animate-rise" style={{ animationDelay: '260ms' }}>
        <div className="rounded-2xl border border-white/10 bg-[#182033]/80 p-5 shadow-card backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#E5B869]">
            Nuovo • Audio interattivo
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-[#f7f6f3]">
            Allenatore di Ritmo & Clave
          </p>
          <p className="mt-1 text-sm text-[#9da6b9]">
            Salsa & Bachata — impara a trovare il tempo 1, la clave e il tap su 31 canzoni calibrate
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={onOpenRhythm}
              className="rounded-lg bg-gold-soft px-3.5 py-2 text-sm font-bold text-[#E5B869] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Music2 className="w-4 h-4" />
              <span>Allena il Tempo</span>
            </button>
            <span className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-[#9da6b9]">
              <Clock className="h-3.5 w-3.5 text-[#E5B869]" />
              <span>31 basi in libreria</span>
            </span>
          </div>
        </div>
      </section>

      {/* Card "Videocorso Completo (9 Moduli)" */}
      <section className="animate-rise" style={{ animationDelay: '300ms' }}>
        <div className="rounded-2xl border border-white/10 bg-[#182033]/80 p-5 shadow-card backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#E5B869]">
            Incluso • 9 Moduli Pratici
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-[#f7f6f3]">
            Videocorso Completo
          </p>
          <p className="mt-1 text-sm text-[#9da6b9]">
            Guarda le video lezioni sulle tecniche del flirt invisibile e la dinamica di coppia
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={onOpenVideocorso}
              className="flex items-center gap-2 rounded-lg bg-gold-soft px-3.5 py-2 text-sm font-bold text-[#E5B869] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Video className="h-4 w-4" />
              <span>Guarda i Moduli</span>
            </button>
            <span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-[#9da6b9]">
              Con schede pratiche
            </span>
          </div>
        </div>
      </section>

      {/* Section: Strumenti Rapidi (2x2 Grid) */}
      <section className="animate-rise" style={{ animationDelay: '340ms' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5B869] mb-3">
          Strumenti rapidi
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Rituale Pre-Serata */}
          <button
            onClick={onOpenRitual}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#182033]/80 p-4 shadow-card transition-colors hover:border-[#E5B869]/50 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center text-[#E5B869] group-hover:scale-105 transition-transform">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-snug text-[#f7f6f3]">
                Fai il Rituale Pre-Serata
              </p>
              <p className="text-xs text-[#9da6b9] mt-0.5">
                Centratura in auto (7 passi)
              </p>
            </div>
          </button>

          {/* Chiedi al Coach */}
          <button
            onClick={() => onNavigateTab('coach')}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#182033]/80 p-4 shadow-card transition-colors hover:border-[#E5B869]/50 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center text-[#E5B869] group-hover:scale-105 transition-transform">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-snug text-[#f7f6f3]">
                Chiedi al Coach
              </p>
              <p className="text-xs text-[#9da6b9] mt-0.5">
                Andrea ti risponde sul metodo
              </p>
            </div>
          </button>

          {/* Scrivi il diario */}
          <button
            onClick={() => onNavigateTab('diario')}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#182033]/80 p-4 shadow-card transition-colors hover:border-[#E5B869]/50 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center text-[#E5B869] group-hover:scale-105 transition-transform">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-snug text-[#f7f6f3]">
                Scrivi il diario di stasera
              </p>
              <p className="text-xs text-[#9da6b9] mt-0.5">
                Voto del Filo e feedback
              </p>
            </div>
          </button>

          {/* Scopri il tuo profilo */}
          <button
            onClick={onOpenQuiz}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#182033]/80 p-4 shadow-card transition-colors hover:border-[#E5B869]/50 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center text-[#E5B869] group-hover:scale-105 transition-transform">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-snug text-[#f7f6f3] truncate">
                {userProfileInfo ? userProfileInfo.name : 'Scopri il tuo profilo'}
              </p>
              <p className="text-xs text-[#9da6b9] mt-0.5">
                Test dei 4 profili (10 q)
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Signature in calce */}
      <figure className="pt-6 pb-2 text-center animate-rise" style={{ animationDelay: '380ms' }}>
        <blockquote className="font-display text-base sm:text-lg italic leading-relaxed text-[#f7f6f3]">
          «Faccio quello che insegno. Insegno quello che faccio.»
        </blockquote>
        <figcaption className="mt-2 text-sm text-[#9da6b9]">
          – <span className="font-medium text-[#E5B869]">Andrea Frattesi</span>
        </figcaption>
      </figure>
    </div>
  );
};
