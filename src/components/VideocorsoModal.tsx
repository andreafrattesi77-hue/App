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
  Link as LinkIcon,
  Check,
  RotateCcw,
  Clock,
  BookOpen,
} from 'lucide-react';
import { ModuloVideo } from '../../content/types';
import { UserData } from '../types';
import { isTrialUser, saveUserData } from '../services/storage';
import { AREA_RISERVATA_URL } from '../config';
import {
  getVideoCourseModules,
  saveModuleVideoUrl,
  parseVideoEmbed,
  VideoEmbedInfo,
} from '../services/videocorsoStorage';

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
  const [modules, setModules] = useState<ModuloVideo[]>(() => getVideoCourseModules());
  const [selectedModule, setSelectedModule] = useState<ModuloVideo>(() => modules[0]);
  const [isUnlockedLocally, setIsUnlockedLocally] = useState(!isTrialUser(user));
  const [editingModuleNum, setEditingModuleNum] = useState<number | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<number[]>(() => user.watchedVideos || []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  // Aggiorna moduli e stato sblocco quando cambia l'utente o si apre la modale
  useEffect(() => {
    const refreshed = getVideoCourseModules();
    setModules(refreshed);
    const updatedSelected = refreshed.find((m) => m.numero === selectedModule.numero) || refreshed[0];
    setSelectedModule(updatedSelected);
    setIsUnlockedLocally(!isTrialUser(user));
    setWatchedVideos(user.watchedVideos || []);
  }, [user, isOpen]);

  // Reset errore video al cambio modulo
  useEffect(() => {
    setVideoLoadError(false);
    setEditingModuleNum(null);
  }, [selectedModule.numero]);

  if (!isOpen) return null;

  const isTrial = !isUnlockedLocally;
  const isModuleLocked = isTrial && selectedModule.numero !== 1;
  const isModuleWatched = watchedVideos.includes(selectedModule.numero);

  const embedInfo: VideoEmbedInfo = parseVideoEmbed(selectedModule.videoUrl);

  const handleSelectModule = (modulo: ModuloVideo) => {
    setSelectedModule(modulo);
    setVideoLoadError(false);
    setEditingModuleNum(null);
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (modulo.numero === 1 || !isTrial) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 150);
    }
  };

  const handleToggleWatched = (moduleNum: number) => {
    const next = isModuleWatched
      ? watchedVideos.filter((n) => n !== moduleNum)
      : [...watchedVideos, moduleNum];
    setWatchedVideos(next);
    const updated = saveUserData({ watchedVideos: next });
    onUserDataUpdated?.(updated);
  };

  const handleSaveCustomUrl = (moduleNum: number) => {
    if (!customUrlInput.trim()) return;
    saveModuleVideoUrl(moduleNum, customUrlInput.trim());
    const refreshed = getVideoCourseModules();
    setModules(refreshed);
    const updated = refreshed.find((m) => m.numero === moduleNum);
    if (updated) setSelectedModule(updated);
    setEditingModuleNum(null);
    setCustomUrlInput('');
    setVideoLoadError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#021831]/95 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[94vh] bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
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
                <span>9 Moduli Pratici Integrati</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-400 font-medium">
                  {watchedVideos.length}/9 completati
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
          {/* Sezione Player Video Attivo */}
          <div className="space-y-3">
            {isModuleLocked ? (
              /* MODULO BLOCCATO (PER UTENTI IN PROVA SUI MODULI 2-9) */
              <div className="space-y-2.5 animate-fadeIn">
                <div className="relative rounded-2xl overflow-hidden border border-[#F9C03E]/40 shadow-xl bg-gradient-to-b from-[#021831] via-[#042B58] to-[#021831] aspect-video flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#021831]/90 border border-[#F9C03E]/40 flex items-center justify-center text-[#F9C03E] shadow-inner mb-2">
                    <Lock className="w-6 h-6 text-[#F9C03E]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F9C03E]">
                    Modulo {selectedModule.numero} • Contenuto Riservato
                  </span>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                    Sblocca la versione completa per guardare questo video direttamente nell'app insieme a tutti i 9 moduli.
                  </p>
                </div>

                <div className="glass-card p-4 border border-[#F9C03E]/40 space-y-3 shadow-xl">
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
                    <h3 className="text-base font-bold text-white leading-snug">
                      {selectedModule.titolo}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                      {selectedModule.descrizione}
                    </p>
                    {selectedModule.evidenza && (
                      <div className="mt-2 text-xs italic text-[#F9C03E] bg-[#021831]/60 p-2 rounded-lg border-l-2 border-[#F9C03E]">
                        "{selectedModule.evidenza}"
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenUnlock(
                          `Sblocca il Modulo ${selectedModule.numero}: ${selectedModule.titolo} e l'intero videocorso in 9 moduli!`
                        )
                      }
                      className="w-full py-3 px-4 rounded-xl gold-gradient-btn text-xs sm:text-sm font-bold text-[#042B58] shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-[#042B58]" />
                      <span>Sblocca il Videocorso Completo</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* MODULO SBLOCCATO: PLAYER INTEGRATO NELL'APP */
              <div className="space-y-2.5 animate-fadeIn">
                {/* 1. PLAYER VIDEO RESPONSIVO (MP4, YouTube, Vimeo, Drive) */}
                <div className="relative rounded-2xl overflow-hidden border border-[#F9C03E]/50 shadow-2xl bg-black aspect-video flex items-center justify-center">
                  {embedInfo.type === 'html5' && !videoLoadError ? (
                    <video
                      ref={videoRef}
                      key={embedInfo.src}
                      src={embedInfo.src}
                      controls
                      playsInline
                      preload="auto"
                      onError={() => setVideoLoadError(true)}
                      className="w-full h-full object-contain"
                    >
                      <source src={embedInfo.src} type="video/mp4" />
                      Il tuo browser non supporta la riproduzione video HTML5.
                    </video>
                  ) : embedInfo.type === 'youtube' || embedInfo.type === 'vimeo' || embedInfo.type === 'drive' || embedInfo.type === 'iframe' ? (
                    <iframe
                      src={embedInfo.src}
                      title={`Videocorso - Modulo ${selectedModule.numero}: ${selectedModule.titolo}`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    /* PLACEHOLDER ELEGANTE SE IL FILE VIDEO LOCALE O LINK NON È ANCORA INSERITO */
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-[#021831] to-[#042B58]">
                      <div className="w-12 h-12 rounded-2xl bg-[#234C77] border border-[#F9C03E]/40 flex items-center justify-center text-[#F9C03E] mb-2 shadow-md">
                        <Video className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-white">
                        Modulo {selectedModule.numero}: {selectedModule.titolo}
                      </span>
                      <p className="text-[11px] text-slate-300 max-w-sm mt-1">
                        Video pronto per la riproduzione in-app. Inserisci il link video (YouTube non in elenco, Vimeo, Drive o file MP4) qui sotto.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingModuleNum(selectedModule.numero);
                          setCustomUrlInput(selectedModule.videoUrl || '');
                        }}
                        className="mt-3 py-1.5 px-3 rounded-lg bg-[#F9C03E] text-[#042B58] text-[11px] font-bold flex items-center gap-1.5 hover:brightness-105 transition-all shadow cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Imposta Link Video per questo Modulo</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. DETTAGLI DEL MODULO E AZIONI */}
                <div className="glass-card p-3.5 sm:p-4 border border-[#F9C03E]/30 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2.5 py-0.5 rounded-full border border-[#F9C03E]/40">
                        Modulo {selectedModule.numero}
                      </span>
                      {selectedModule.numero === 1 && (
                        <span className="text-[9px] font-bold uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Incluso Gratuito
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tasto per segnare come completato */}
                      <button
                        type="button"
                        onClick={() => handleToggleWatched(selectedModule.numero)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isModuleWatched
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#021831] border-[#88A5BF]/30 text-slate-300 hover:text-white hover:border-[#F9C03E]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isModuleWatched ? 'Completato' : 'Segna visto'}</span>
                      </button>

                      {/* Tasto per modificare/impostare il link del video */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingModuleNum(
                            editingModuleNum === selectedModule.numero ? null : selectedModule.numero
                          );
                          setCustomUrlInput(selectedModule.videoUrl || '');
                        }}
                        title="Modifica o incolla link video (YouTube/Vimeo/Drive/MP4)"
                        className="text-[11px] font-medium px-2 py-1 rounded-lg bg-[#021831] border border-[#88A5BF]/30 text-slate-300 hover:text-[#F9C03E] hover:border-[#F9C03E] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Link</span>
                      </button>
                    </div>
                  </div>

                  {/* FORM RAPIDO PER INCOLLARE O MODIFICARE IL LINK DEL VIDEO */}
                  {editingModuleNum === selectedModule.numero && (
                    <div className="p-3 rounded-xl bg-[#021831] border border-[#F9C03E]/40 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#F9C03E]">
                          Collega video per il Modulo {selectedModule.numero}:
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingModuleNum(null)}
                          className="text-slate-400 hover:text-white text-[10px]"
                        >
                          Chiudi
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-tight">
                        Incolla un link da <strong>YouTube</strong> (anche non in elenco), <strong>Vimeo</strong>, <strong>Google Drive</strong> o il percorso di un file <strong>MP4</strong>.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          placeholder="es. https://youtu.be/... o /videos/modulo2.mp4"
                          className="flex-1 bg-[#042B58] border border-[#88A5BF]/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F9C03E]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCustomUrl(selectedModule.numero)}
                          className="py-1.5 px-3 rounded-lg bg-[#F9C03E] text-[#042B58] text-xs font-bold hover:brightness-105 cursor-pointer shrink-0"
                        >
                          Salva
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {selectedModule.titolo}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {selectedModule.descrizione}
                    </p>
                    {selectedModule.evidenza && (
                      <div className="mt-2 text-xs italic text-[#F9C03E] bg-[#021831]/60 p-2.5 rounded-xl border-l-2 border-[#F9C03E]">
                        "{selectedModule.evidenza}"
                      </div>
                    )}
                  </div>

                  {/* Lezioni e punti chiave del modulo */}
                  {selectedModule.lezioni && selectedModule.lezioni.length > 0 && (
                    <div className="pt-2 border-t border-[#88A5BF]/20 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#F9C03E]" />
                        <span>Contenuti della lezione:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {selectedModule.lezioni.map((lez) => (
                          <div
                            key={lez.numero}
                            className="bg-[#021831]/70 border border-[#88A5BF]/20 rounded-lg p-2 flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-200 truncate pr-2">
                              {lez.numero}. {lez.titolo}
                            </span>
                            {lez.durata && (
                              <span className="text-[10px] text-[#F9C03E] font-mono shrink-0">
                                {lez.durata}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Upsell Banner if in Trial */}
          {isTrial && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#234C77]/60 via-[#042B58] to-[#234C77]/60 border border-[#F9C03E]/40 flex items-center justify-between gap-3 shadow-lg">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F9C03E] shrink-0" />
                  <span className="text-xs font-bold text-white">
                    Sblocca tutti i 9 Moduli Video
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Guarda tutte le dimostrazioni e le figure di Salsa e Bachata direttamente nell'app.
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

          {/* INDICE DI TUTTI I 9 MODULI CON SELEZIONE RAPIDA */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Indice dei 9 Moduli Video</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {isTrial ? 'Modulo 1 gratuito' : `${watchedVideos.length}/9 completati`}
              </span>
            </div>

            <div className="space-y-2">
              {modules.map((modulo) => {
                const isFirst = modulo.numero === 1;
                const isSelectedModule = selectedModule.numero === modulo.numero;
                const isLocked = isTrial && !isFirst;
                const isDone = watchedVideos.includes(modulo.numero);

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
                      {/* Icona Modulo */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isFirst
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isLocked
                            ? 'bg-slate-800/90 text-[#F9C03E] border border-[#F9C03E]/40 shadow-sm'
                            : 'bg-[#042B58] text-[#F9C03E] border border-[#F9C03E]/40'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : isFirst ? (
                          <Play className="w-4 h-4 fill-emerald-400 text-emerald-400 ml-0.5" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-[#F9C03E]" />
                        ) : (
                          <Video className="w-4 h-4 text-[#F9C03E]" />
                        )}
                      </div>

                      {/* Informazioni Modulo */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isDone ? 'text-emerald-400' : isFirst ? 'text-emerald-400' : 'text-[#88A5BF]'
                            }`}
                          >
                            Modulo {modulo.numero}
                          </span>
                          {isFirst && (
                            <span className="text-[9px] font-bold uppercase text-[#042B58] bg-[#F9C03E] px-1.5 py-0.2 rounded-full">
                              Gratuito
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[9px] text-[#F9C03E] font-medium flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Riservato
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Completato
                            </span>
                          )}
                        </div>
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelectedModule ? 'text-[#F9C03E]' : 'text-white'
                          }`}
                        >
                          {modulo.titolo}
                        </h4>
                      </div>
                    </div>

                    {/* Stato a destra */}
                    <div className="shrink-0 flex items-center">
                      {isLocked ? (
                        <div className="w-7 h-7 rounded-lg bg-slate-800/60 border border-[#88A5BF]/20 flex items-center justify-center text-[#F9C03E]/80">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div
                          className={`py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-[#234C77] text-[#F9C03E] border-[#F9C03E]/30'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isSelectedModule ? 'In riproduzione' : 'Guarda'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Riferimento opzionale all'area riservata esterna */}
          <div className="pt-2 pb-1 text-center">
            <a
              href={AREA_RISERVATA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#88A5BF] hover:text-[#F9C03E] transition-colors inline-flex items-center gap-1"
            >
              <span>Accedi all'area riservata esterna su andreafrattesi.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
