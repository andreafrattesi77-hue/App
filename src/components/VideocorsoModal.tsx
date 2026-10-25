import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Lock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Video,
  Award,
} from 'lucide-react';
import { VIDEOCORSO } from '../../content/index';
import { ModuloVideo } from '../../content/types';
import { UserData } from '../types';
import { isTrialUser } from '../services/storage';
import { AREA_RISERVATA_URL } from '../config';

interface VideocorsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onOpenUnlock: (notice?: string) => void;
}

export const VideocorsoModal: React.FC<VideocorsoModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenUnlock,
}) => {
  const [selectedModule, setSelectedModule] = useState<ModuloVideo>(VIDEOCORSO[0]);
  const [isUnlockedLocally, setIsUnlockedLocally] = useState(!isTrialUser(user));
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsUnlockedLocally(!isTrialUser(user));
  }, [user]);

  if (!isOpen) return null;

  const isTrial = !isUnlockedLocally;
  const isLocalVideo = !!(selectedModule.videoUrl && selectedModule.videoUrl.startsWith('/assets/'));

  // Seleziona qualsiasi modulo e scorre in cima alla sezione di visualizzazione
  const handleSelectModule = (modulo: ModuloVideo) => {
    setSelectedModule(modulo);
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (modulo.numero === 1) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 150);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#021831]/95 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg max-h-[94vh] bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-[#88A5BF]/20 flex items-center justify-between shrink-0 bg-[#042B58]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#234C77] border border-[#F9C03E]/40 flex items-center justify-center text-[#F9C03E]">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-serif text-white leading-tight">
                Videocorso Effetto Calamita
              </h2>
              <p className="text-[11px] text-[#F9C03E]">
                9 Moduli pratici con Andrea Frattesi
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
          {/* Active Video Player / Module Detail Section (in cima) */}
          <div className="space-y-3">
            {/* 1. SE È IL MODULO 1 (VIDEO GRATUITO INCLUSO) */}
            {(selectedModule.numero === 1 || (!isTrial && isLocalVideo)) ? (
              <div className="space-y-2.5">
                {/* HTML5 Video Player */}
                <div className="relative rounded-2xl overflow-hidden border border-[#F9C03E]/50 shadow-xl bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    key={selectedModule.videoUrl}
                    src={selectedModule.videoUrl}
                    controls
                    playsInline
                    preload="auto"
                    className="w-full h-full object-contain"
                  >
                    <source src={selectedModule.videoUrl} type="video/mp4" />
                    Il tuo browser non supporta la riproduzione video HTML5.
                  </video>
                </div>

                {/* Details Section Modulo 1 */}
                <div className="glass-card p-3.5 border border-[#F9C03E]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2 py-0.5 rounded-full border border-[#F9C03E]/40">
                      Modulo {selectedModule.numero} • Video Introduttivo Gratuito
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.play().catch(() => {});
                        }
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Avvia riproduzione</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {selectedModule.titolo}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {selectedModule.descrizione}
                    </p>
                  </div>

                  {/* Pulsante per sbloccare tutti i restanti moduli se in prova */}
                  {isTrial && (
                    <div className="pt-2 border-t border-[#88A5BF]/25">
                      <button
                        onClick={() =>
                          onOpenUnlock(
                            'Sblocca tutti i 9 moduli del videocorso pratico di Salsa e Bachata!'
                          )
                        }
                        className="w-full py-2.5 px-3 rounded-xl gold-gradient-btn text-xs font-bold text-[#042B58] flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#042B58]" />
                        <span>Sblocca i restanti 8 Moduli</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : isTrial ? (
              /* 2. SE È UN MODULO DAL 2 AL 9 E L'UTENTE È IN PROVA (BLOCCATO) */
              <div className="space-y-2.5 animate-fadeIn">
                {/* Riquadro Anteprima con Lucchetto e Visual elegante */}
                <div className="relative rounded-2xl overflow-hidden border border-[#F9C03E]/40 shadow-xl bg-gradient-to-b from-[#021831] via-[#042B58] to-[#021831] aspect-video flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#021831]/90 border border-[#F9C03E]/40 flex items-center justify-center text-[#F9C03E] shadow-inner mb-2">
                    <Lock className="w-6 h-6 text-[#F9C03E]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F9C03E]">
                    Modulo {selectedModule.numero} • Contenuto Riservato
                  </span>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">
                    Disponibile nella versione completa del videocorso.
                  </p>
                </div>

                {/* Sezione con Titolo, Descrizione e Tasto per sbloccare */}
                <div className="glass-card p-4 border border-[#F9C03E]/40 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2 py-0.5 rounded-full border border-[#F9C03E]/40">
                      Modulo {selectedModule.numero}
                    </span>
                    <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#F9C03E]" />
                      Richiede sblocco
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {selectedModule.titolo}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                      {selectedModule.descrizione}
                    </p>
                  </div>

                  {/* TASTO PRINCIPALE LUNGO PER SBLOCCARE CON APERTURA DEL POP-UP (SENZA PREZZO) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenUnlock(
                          `Sblocca il Modulo ${selectedModule.numero}: ${selectedModule.titolo} e tutti i 9 moduli del videocorso completo!`
                        )
                      }
                      className="w-full py-3 px-4 rounded-xl gold-gradient-btn text-xs sm:text-sm font-bold text-[#042B58] shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-[#042B58]" />
                      <span>Sblocca il Videocorso</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 3. SE L'UTENTE HA GIÀ SBLOCCATO LA VERSIONE COMPLETA */
              <div className="glass-card p-4 border border-[#F9C03E]/40 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2 py-0.5 rounded-full border border-[#F9C03E]/40">
                    Modulo {selectedModule.numero}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Sbloccato
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedModule.titolo}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {selectedModule.descrizione}
                  </p>
                </div>

                {/* Pulsante di accesso ad Area Riservata */}
                <div className="pt-2 border-t border-slate-700/50 space-y-2">
                  <a
                    href={AREA_RISERVATA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl gold-gradient-btn text-xs font-bold text-[#042B58] flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 transition-all"
                  >
                    <span>Guarda il modulo nell'Area Riservata</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#042B58]" />
                  </a>
                  <p className="text-[11px] text-slate-300 text-center">
                    Tutti i 9 moduli pratici in alta definizione sono disponibili nella tua Area Riservata.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upsell Banner if in Trial */}
          {isTrial && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#234C77]/60 via-[#042B58] to-[#234C77]/60 border border-[#F9C03E]/40 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F9C03E] shrink-0" />
                  <span className="text-xs font-bold text-white">
                    Hai visto la Lezione 1?
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Sblocca gli altri 8 Moduli con tutte le dimostrazioni e le figure di Salsa e Bachata.
                </p>
              </div>
              <button
                onClick={() =>
                  onOpenUnlock(
                    'Accedi al videocorso completo in 9 moduli: strategie e metodi di seduzione applicati a Salsa e Bachata.'
                  )
                }
                className="py-2 px-3 rounded-xl gold-gradient-btn text-xs font-bold text-[#042B58] shrink-0 shadow-md cursor-pointer hover:brightness-105 active:scale-95 transition-all"
              >
                Sblocca Tutto
              </button>
            </div>
          )}

          {/* All 9 Modules List (senza tasti singoli sblocca) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Indice dei 9 Moduli</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {isTrial ? '1/9 sbloccato' : '9/9 completi'}
              </span>
            </div>

            <div className="space-y-2">
              {VIDEOCORSO.map((modulo) => {
                const isFirst = modulo.numero === 1;
                const isSelectedModule = selectedModule.numero === modulo.numero;
                const isLocked = isTrial && !isFirst;

                return (
                  <div
                    key={modulo.numero}
                    onClick={() => handleSelectModule(modulo)}
                    className={`rounded-2xl border transition-all p-3 flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isSelectedModule
                        ? 'bg-[#234C77] border-[#F9C03E] shadow-md ring-1 ring-[#F9C03E]/40'
                        : isLocked
                        ? 'bg-[#021831]/75 border-[#88A5BF]/25 hover:border-[#F9C03E]/50'
                        : 'bg-[#021831] border-[#88A5BF]/30 hover:border-[#F9C03E]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Module Icon: Play per il Modulo 1, Lucchetto dorato per i successivi 8 */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isFirst
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isLocked
                            ? 'bg-slate-800/90 text-[#F9C03E] border border-[#F9C03E]/40 shadow-sm'
                            : 'bg-[#042B58] text-[#F9C03E] border border-[#F9C03E]/40'
                        }`}
                      >
                        {isFirst ? (
                          <Play className="w-4 h-4 fill-emerald-400 text-emerald-400 ml-0.5" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-[#F9C03E]" />
                        ) : (
                          <Video className="w-4 h-4 text-[#F9C03E]" />
                        )}
                      </div>

                      {/* Module Info: solo i titoli puliti */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isFirst ? 'text-emerald-400' : 'text-[#88A5BF]'
                            }`}
                          >
                            Modulo {modulo.numero}
                          </span>
                          {isFirst && (
                            <span className="text-[9px] font-bold uppercase text-[#042B58] bg-[#F9C03E] px-1.5 py-0.2 rounded-full font-bold">
                              Gratuito
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[9px] text-[#F9C03E] font-medium flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Riservato
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs sm:text-sm font-bold truncate ${isSelectedModule ? 'text-[#F9C03E]' : 'text-white'}`}>
                          {modulo.titolo}
                        </h4>
                      </div>
                    </div>

                    {/* Nessun tasto singolo sblocca: solo indicatore discreto */}
                    <div className="shrink-0 flex items-center">
                      {isFirst ? (
                        <div className="py-1 px-2.5 rounded-lg bg-emerald-500/20 text-[10px] font-bold text-emerald-300 flex items-center gap-1 border border-emerald-500/30">
                          <Play className="w-3 h-3 fill-current" />
                          <span>Gratis</span>
                        </div>
                      ) : isLocked ? (
                        <div className="w-7 h-7 rounded-lg bg-slate-800/60 border border-[#88A5BF]/20 flex items-center justify-center text-[#F9C03E]/80">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="py-1 px-2.5 rounded-lg bg-[#234C77] text-[10px] font-bold text-[#F9C03E] flex items-center gap-1 border border-[#F9C03E]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sbloccato</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* External Login Reference */}
          <div className="pt-2 pb-1 text-center">
            <a
              href={AREA_RISERVATA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#88A5BF] hover:text-[#F9C03E] transition-colors inline-flex items-center gap-1"
            >
              <span>Hai già acquistato? Accedi all'area riservata esterna</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
