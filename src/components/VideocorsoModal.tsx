import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Lock,
  ExternalLink,
  Video,
  Award,
  Check,
} from 'lucide-react';
import { ModuloVideo } from '../../content/types';
import { VIDEOCORSO } from '../../content/videocorso';
import { UserData } from '../types';
import { isTrialUser, saveUserData } from '../services/storage';
import { COURSE_PLATFORM_URL } from '../config';

interface VideocorsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onOpenUnlock: (notice?: string) => void;
  onUserDataUpdated?: (updated: UserData) => void;
}

export const VideocorsoModal: React.FC<VideocorsoModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenUnlock,
  onUserDataUpdated,
}) => {
  const [watchedVideos, setWatchedVideos] = useState<number[]>(() => user.watchedVideos || []);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setWatchedVideos(user.watchedVideos || []);
  }, [user, isOpen]);

  if (!isOpen) return null;

  // L'app è bloccata in prova gratuita se l'utente non ha un codice di acquisto confermato
  const isTrial = isTrialUser(user) || user?.isTrial === true || (user?.accessCode || '').trim().toUpperCase() === 'TRIAL';
  const isIntroWatched = watchedVideos.includes(1);

  const handleModuleClick = (modulo: ModuloVideo) => {
    if (modulo.numero === 1) {
      if (contentContainerRef.current) {
        contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (isTrial) {
      // In prova gratuita i moduli 2-9 sono bloccati e aprono SOLO il pop-up di acquisto
      onOpenUnlock(`Sblocca il Modulo ${modulo.numero}: ${modulo.titolo} e l'intero videocorso completo in 9 moduli!`);
      return;
    }

    // Se l'utente ha la versione acquistata/sbloccata, apre direttamente la lezione su andreafrattesi.com
    window.open(COURSE_PLATFORM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleToggleIntroWatched = () => {
    const next = isIntroWatched
      ? watchedVideos.filter((n) => n !== 1)
      : [...watchedVideos, 1];
    setWatchedVideos(next);
    const updated = saveUserData({ watchedVideos: next });
    onUserDataUpdated?.(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#021831]/95 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[94vh] bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#88A5BF]/20 flex items-center justify-between shrink-0 bg-[#042B58]/95">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#234C77] border border-[#F9C03E]/40 flex items-center justify-center text-[#F9C03E] shadow-sm">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-serif text-white leading-tight">
                Videocorso Effetto Calamita
              </h2>
              <p className="text-[11px] text-[#F9C03E] flex items-center gap-1.5">
                <span>9 Moduli Pratici</span>
                <span className="text-slate-400">•</span>
                <span className={isTrial ? 'text-amber-400' : 'text-emerald-400'}>
                  {isTrial ? 'Modulo 1 attivo (8 da sbloccare)' : 'Accesso completo sbloccato'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi videocorso"
            className="text-slate-400 hover:text-white p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div ref={contentContainerRef} className="overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* SEZIONE UNICA VIDEO IN-APP: MODULO 1 INTRODUZIONE VISIBILE A TUTTI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#042B58] bg-[#F9C03E] px-2 py-0.5 rounded-full">
                  Modulo 1 • Video Intro
                </span>
                <span className="text-xs font-bold text-white">
                  Parti con il piede giusto
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleIntroWatched}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all cursor-pointer ${
                  isIntroWatched
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-[#021831] border-[#88A5BF]/30 text-slate-300 hover:text-white'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>{isIntroWatched ? 'Visto' : 'Segna visto'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-[#F9C03E]/50 shadow-2xl bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                src="/assets/aistudio/Intro_Videocorso-1_cd289a2f.mp4"
                controls
                playsInline
                preload="auto"
                className="w-full h-full object-contain"
              >
                Il tuo browser non supporta la riproduzione video HTML5.
              </video>
            </div>
          </div>

          {/* INDICE DEI 9 MODULI */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Indice dei 9 Moduli Video</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {isTrial ? 'Clicca per sbloccare i moduli 2-9' : 'Clicca per aprire le lezioni'}
              </span>
            </div>

            <div className="space-y-2">
              {VIDEOCORSO.map((modulo) => {
                const isFirst = modulo.numero === 1;
                const isLocked = isTrial && !isFirst;
                const isDone = watchedVideos.includes(modulo.numero);

                return (
                  <div
                    key={modulo.numero}
                    onClick={() => handleModuleClick(modulo)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleModuleClick(modulo);
                      }
                    }}
                    className={`rounded-2xl border transition-all p-3 flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isFirst
                        ? 'bg-[#234C77]/60 border-[#F9C03E]/70 hover:border-[#F9C03E] shadow-sm'
                        : isLocked
                        ? 'bg-[#021831]/75 border-[#88A5BF]/25 hover:border-[#F9C03E]/60 hover:bg-[#021831]'
                        : 'bg-[#021831] border-emerald-500/30 hover:border-emerald-400 hover:bg-[#021831]/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icona Modulo */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isFirst
                            ? 'bg-[#F9C03E]/20 text-[#F9C03E] border border-[#F9C03E]/50'
                            : isLocked
                            ? 'bg-slate-800/90 text-[#F9C03E] border border-[#F9C03E]/40 shadow-sm'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : isFirst ? (
                          <Play className="w-4 h-4 fill-[#F9C03E] text-[#F9C03E] ml-0.5" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-[#F9C03E]" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>

                      {/* Informazioni Modulo */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isFirst
                                ? 'text-[#F9C03E]'
                                : isLocked
                                ? 'text-[#88A5BF]'
                                : 'text-emerald-400'
                            }`}
                          >
                            Modulo {modulo.numero}
                          </span>
                          {isFirst ? (
                            <span className="text-[9px] font-bold uppercase text-[#042B58] bg-[#F9C03E] px-1.5 py-0.2 rounded-full">
                              In-App
                            </span>
                          ) : isLocked ? (
                            <span className="text-[9px] text-[#F9C03E] font-medium flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Bloccato
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-0.5">
                              <ExternalLink className="w-2.5 h-2.5" /> andreafrattesi.com
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Visto
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {modulo.titolo}
                        </h4>
                      </div>
                    </div>

                    {/* Stato a destra */}
                    <div className="shrink-0 flex items-center">
                      {isFirst ? (
                        <div className="py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border bg-[#F9C03E]/15 text-[#F9C03E] border-[#F9C03E]/40">
                          <Play className="w-3 h-3 fill-current" />
                          <span>Guarda</span>
                        </div>
                      ) : isLocked ? (
                        <div className="py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border bg-slate-800/80 border-[#88A5BF]/30 text-[#F9C03E] hover:border-[#F9C03E]">
                          <Lock className="w-3 h-3 text-[#F9C03E]" />
                          <span>Sblocca</span>
                        </div>
                      ) : (
                        <div className="py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border bg-[#234C77] border-emerald-500/40 text-emerald-300 hover:brightness-110">
                          <ExternalLink className="w-3 h-3" />
                          <span>Apri</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};
