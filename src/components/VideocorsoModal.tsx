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
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VIDEOCORSO } from '../../content/index';
import { ModuloVideo } from '../../content/types';
import { UserData } from '../types';
import { isTrialUser, saveUserData } from '../services/storage';
import { AREA_RISERVATA_URL, ACCESS_CODES } from '../config';

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
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(2); // Modulo 2 aperto a tendina di default
  const [quickCode, setQuickCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isUnlockedLocally, setIsUnlockedLocally] = useState(!isTrialUser(user));
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsUnlockedLocally(!isTrialUser(user));
  }, [user]);

  if (!isOpen) return null;

  const isTrial = !isUnlockedLocally;

  // Determine active lesson and video URL
  const currentLesson = selectedModule.lezioni?.[selectedLessonIndex];
  const activeVideoSrc = currentLesson?.videoUrl || selectedModule.videoUrl;
  const isLocalVideo = !!(activeVideoSrc && activeVideoSrc.startsWith('/assets/'));

  // Seleziona un modulo o apre/chiude il menù a tendina
  const handleToggleModuleAccordion = (modulo: ModuloVideo) => {
    if (modulo.lezioni && modulo.lezioni.length > 0) {
      // Toggle dropdown per i moduli con più lezioni
      setExpandedModuleId((prev) => (prev === modulo.numero ? null : modulo.numero));
      // Se il modulo cliccato non è quello attivo, impostalo come modulo selezionato
      if (selectedModule.numero !== modulo.numero) {
        setSelectedModule(modulo);
        setSelectedLessonIndex(0);
      }
    } else {
      // Modulo a lezione singola: seleziona e riproduci direttamente
      if (isTrial && modulo.numero > 1) {
        onOpenUnlock(
          `Sblocca il Modulo ${modulo.numero} e tutti i 9 moduli del videocorso completo a 97€!`
        );
        return;
      }
      setSelectedModule(modulo);
      setSelectedLessonIndex(0);
      if (contentContainerRef.current) {
        contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 150);
    }
  };

  // Seleziona una lezione specifica dal menù a tendina
  const handleSelectLessonFromDropdown = (modulo: ModuloVideo, lessonIdx: number) => {
    if (isTrial && modulo.numero > 1) {
      const lezTitle = modulo.lezioni?.[lessonIdx]?.titolo || '';
      onOpenUnlock(
        `Sblocca la lezione «${lezTitle}» del Modulo ${modulo.numero} e tutti i 9 moduli del videocorso a 97€!`
      );
      return;
    }

    setSelectedModule(modulo);
    setSelectedLessonIndex(lessonIdx);

    // Riporta lo scroll in alto sul player video
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Avvia la riproduzione del nuovo video caricato
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 150);
  };

  const handleQuickUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCode.trim().toUpperCase();
    if (!clean) return;
    const isValid = ACCESS_CODES.some((valid) => valid.toUpperCase() === clean);
    if (isValid) {
      saveUserData({ accessCode: clean, isTrial: false, isVideocorsoUnlocked: true });
      setIsUnlockedLocally(true);
      setCodeError('');
      setQuickCode('');
    } else {
      setCodeError('Codice non valido. Inserisci MAGNETICO.');
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
          {/* Active Video Player Section */}
          <div className="space-y-3">
            {/* SE È IL MODULO 1 (SEMPRE GRATIS) O SE L'UTENTE HA SBLOCCATO ED È DISPONIBILE IL VIDEO LOCALE */}
            {(selectedModule.numero === 1 || (!isTrial && isLocalVideo)) ? (
              <div className="space-y-2.5">
                {/* HTML5 Video Player con key per ricaricare la sorgente esatta in modo pulito */}
                <div className="relative rounded-2xl overflow-hidden border border-[#F9C03E]/50 shadow-xl bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    key={activeVideoSrc}
                    src={activeVideoSrc}
                    controls
                    playsInline
                    preload="auto"
                    className="w-full h-full object-contain"
                  >
                    <source src={activeVideoSrc} type="video/mp4" />
                    Il tuo browser non supporta la riproduzione video HTML5.
                  </video>
                </div>

                {/* Details Section: SOLO LA LEZIONE CORRENTE (come richiesto) */}
                <div className="glass-card p-3.5 border border-[#F9C03E]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2 py-0.5 rounded-full border border-[#F9C03E]/40">
                      Modulo {selectedModule.numero}
                      {currentLesson ? ` • Lezione ${currentLesson.numero} di ${selectedModule.lezioni?.length || 1}` : ''}
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
                      {currentLesson ? `${currentLesson.numero}. ${currentLesson.titolo}` : selectedModule.titolo}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {currentLesson?.descrizione || selectedModule.descrizione}
                    </p>
                  </div>

                  {/* Pulsante per sbloccare tutti i restanti moduli se in prova */}
                  {isTrial && (
                    <div className="pt-2 border-t border-[#88A5BF]/25">
                      <button
                        onClick={() =>
                          onOpenUnlock(
                            'Sblocca tutti i 9 moduli del videocorso pratico di Salsa e Bachata a 97€!'
                          )
                        }
                        className="w-full py-2.5 px-3 rounded-xl gold-gradient-btn text-xs font-bold text-[#042B58] flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#042B58]" />
                        <span>Sblocca i restanti 8 Moduli a 97€</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : isTrial ? (
              /* Locked Module Preview for Trial Users */
              <div className="rounded-2xl border border-[#F9C03E]/40 bg-gradient-to-b from-[#021831] to-[#042B58] p-4 sm:p-5 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2 py-0.5 rounded-full border border-[#F9C03E]/40">
                    Modulo {selectedModule.numero} • Riservato
                  </span>
                  <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#F9C03E]" />
                    Richiede sblocco
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedModule.titolo}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {selectedModule.descrizione}
                  </p>
                </div>

                {/* Quick Unlock Form with Access Code */}
                <form onSubmit={handleQuickUnlock} className="p-3 bg-[#021831] rounded-xl border border-[#88A5BF]/30 space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <KeyRound className="w-3.5 h-3.5 text-[#F9C03E]" />
                    <span>Hai il codice d'accesso? Inseriscilo per sbloccare subito:</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={quickCode}
                      onChange={(e) => {
                        setQuickCode(e.target.value);
                        setCodeError('');
                      }}
                      placeholder="MAGNETICO"
                      className="flex-1 px-3 py-2 bg-[#042B58] border border-[#88A5BF]/40 rounded-lg text-white text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#F9C03E]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-lg bg-[#F9C03E] hover:bg-[#fab722] text-[#042B58] text-xs font-bold cursor-pointer transition-colors shadow-sm"
                    >
                      Sblocca
                    </button>
                  </div>
                  {codeError && (
                    <p className="text-[11px] text-rose-400">{codeError}</p>
                  )}
                </form>

                <div className="pt-1">
                  <button
                    onClick={() =>
                      onOpenUnlock(
                        selectedModule.lezioni
                          ? `Sblocca il Modulo ${selectedModule.numero} (${selectedModule.lezioni.map((l) => l.titolo).join(', ')}) e tutti i 9 moduli del videocorso completo a 97€!`
                          : `Sblocca il Modulo ${selectedModule.numero} e tutti i restanti 8 moduli del videocorso completo a 97€!`
                      )
                    }
                    className="w-full py-3 px-4 rounded-xl gold-gradient-btn text-xs font-bold text-[#042B58] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-[#042B58]" />
                    <span>Sblocca Tutti i 9 Moduli a 97€</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Unlocked Module without local video yet: points to Area Riservata */
              <div className="glass-card p-4 border border-[#F9C03E]/40 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2 py-0.5 rounded-full border border-[#F9C03E]/40">
                    Modulo {selectedModule.numero}
                    {currentLesson ? ` • Lezione ${currentLesson.numero} di ${selectedModule.lezioni?.length || 1}` : ''}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Sbloccato
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {currentLesson ? `${currentLesson.numero}. ${currentLesson.titolo}` : selectedModule.titolo}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {currentLesson?.descrizione || selectedModule.descrizione}
                  </p>
                </div>

                {/* Area Riservata Access Button */}
                <div className="pt-2 border-t border-slate-700/50 space-y-2">
                  <a
                    href={AREA_RISERVATA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl gold-gradient-btn text-xs font-bold text-[#042B58] flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 transition-all"
                  >
                    <span>Guarda {currentLesson ? `la Lezione ${currentLesson.numero}` : 'il video'} nell'Area Riservata</span>
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

          {/* All 9 Modules List with Dropdown/Accordion Menù a Tendina */}
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
                const hasLessons = !!(modulo.lezioni && modulo.lezioni.length > 0);
                const isExpanded = expandedModuleId === modulo.numero;

                return (
                  <div
                    key={modulo.numero}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isSelectedModule
                        ? 'bg-[#234C77] border-[#F9C03E] shadow-md'
                        : isLocked
                        ? 'bg-[#021831]/70 border-[#88A5BF]/20 hover:border-[#88A5BF]/50 opacity-90'
                        : 'bg-[#021831] border-[#88A5BF]/30 hover:border-[#F9C03E]'
                    }`}
                  >
                    {/* Module Header Bar: cliccando qui si apre o chiude il menù a tendina */}
                    <div
                      onClick={() => handleToggleModuleAccordion(modulo)}
                      className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Module Icon */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isFirst
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : isLocked
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
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

                        {/* Module Info */}
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
                            {hasLessons && (
                              <span className="text-[9px] text-[#F9C03E] font-medium bg-[#021831] px-1.5 py-0.2 rounded-full border border-[#F9C03E]/30">
                                {modulo.lezioni?.length} Lezioni (menù a tendina)
                              </span>
                            )}
                            {isLocked && (
                              <span className="text-[9px] text-[#F9C03E] font-medium flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Riservato
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white truncate">
                            {modulo.titolo}
                          </h4>
                          <p className="text-[11px] text-slate-300 line-clamp-1">
                            {modulo.descrizione}
                          </p>
                        </div>
                      </div>

                      {/* Right Indicator: Chevron per menù a tendina o lucchetto */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isLocked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenUnlock(
                                modulo.lezioni
                                  ? `Sblocca il Modulo ${modulo.numero} (${modulo.lezioni.map((l) => l.titolo).join(', ')}) e tutti i 9 moduli del videocorso completo a 97€!`
                                  : `Sblocca il Modulo ${modulo.numero} e tutti i 9 moduli del videocorso a 97€!`
                              );
                            }}
                            className="py-1 px-2.5 rounded-lg bg-[#234C77]/80 hover:bg-[#F9C03E] text-[#F9C03E] hover:text-[#042B58] border border-[#F9C03E]/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Sblocca</span>
                          </button>
                        ) : hasLessons ? (
                          <div className="flex items-center gap-1 text-[11px] text-[#F9C03E] font-semibold bg-[#021831]/80 py-1 px-2 rounded-lg border border-[#88A5BF]/30">
                            <span>{isExpanded ? 'Chiudi' : 'Lezioni'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                        ) : (
                          <div className="py-1 px-2.5 rounded-lg bg-emerald-500/20 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                            <span>Apri</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* MENÙ A TENDINA DELLE LEZIONI (Dropdown) */}
                    {hasLessons && isExpanded && (
                      <div className="border-t border-[#88A5BF]/25 bg-[#021831]/95 divide-y divide-[#88A5BF]/15 animate-fadeIn">
                        {modulo.lezioni?.map((lez, idx) => {
                          const isCurrentActiveLesson =
                            isSelectedModule && selectedLessonIndex === idx;

                          return (
                            <div
                              key={lez.numero}
                              onClick={() => handleSelectLessonFromDropdown(modulo, idx)}
                              className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                isCurrentActiveLesson
                                  ? 'bg-[#234C77] text-white'
                                  : 'hover:bg-[#234C77]/50 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Number Badge */}
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isCurrentActiveLesson
                                      ? 'bg-[#F9C03E] text-[#042B58] shadow-sm'
                                      : 'bg-[#042B58] text-[#F9C03E] border border-[#88A5BF]/30'
                                  }`}
                                >
                                  {lez.numero}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-xs font-bold truncate">
                                      Lezione {lez.numero}: {lez.titolo}
                                    </h5>
                                    {isCurrentActiveLesson && (
                                      <span className="text-[9px] font-bold uppercase bg-[#F9C03E] text-[#042B58] px-1.5 py-0.2 rounded-full">
                                        In riproduzione
                                      </span>
                                    )}
                                  </div>
                                  {lez.descrizione && (
                                    <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                                      {lez.descrizione}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isLocked ? (
                                  <div className="py-1 px-2 rounded-lg bg-[#021831] text-[10px] text-[#F9C03E] border border-[#F9C03E]/30 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    <span>Bloccato</span>
                                  </div>
                                ) : isCurrentActiveLesson ? (
                                  <div className="py-1 px-2.5 rounded-lg bg-[#F9C03E] text-[#042B58] text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Attiva</span>
                                  </div>
                                ) : (
                                  <div className="py-1 px-2.5 rounded-lg bg-[#234C77] hover:bg-[#F9C03E] text-[#F9C03E] hover:text-[#042B58] text-[10px] font-bold flex items-center gap-1 transition-colors border border-[#F9C03E]/30">
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Riproduci</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
