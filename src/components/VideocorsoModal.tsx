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
  Clock,
  Upload,
  FolderOpen,
  Trash2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { ModuloVideo, LezioneModulo } from '../../content/types';
import { UserData } from '../types';
import { isTrialUser, saveUserData } from '../services/storage';
import { AREA_RISERVATA_URL } from '../config';
import {
  getVideoCourseModules,
  saveModuleVideoUrl,
  saveLessonVideoUrl,
  parseVideoEmbed,
  VideoEmbedInfo,
} from '../services/videocorsoStorage';
import {
  saveVideoBlob,
  getVideoBlobUrl,
  hasVideoBlob,
  deleteVideoBlob,
} from '../services/videoBlobStorage';

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
  const [selectedLessonNum, setSelectedLessonNum] = useState<number>(1);
  const [isUnlockedLocally, setIsUnlockedLocally] = useState(!isTrialUser(user));
  const [editingUrl, setEditingUrl] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<number[]>(() => user.watchedVideos || []);

  // Stato video blob memorizzato in IndexedDB
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const [isLocalBlobPresent, setIsLocalBlobPresent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Chiave univoca per il salvataggio in IndexedDB del video
  const activeBlobKey = `mod_${selectedModule.numero}_lez_${selectedLessonNum}`;

  // Ricarica stato blob quando cambia modulo o lezione
  useEffect(() => {
    let active = true;
    async function checkBlob() {
      const hasBlob = await hasVideoBlob(activeBlobKey);
      if (!active) return;
      setIsLocalBlobPresent(hasBlob);
      if (hasBlob) {
        const url = await getVideoBlobUrl(activeBlobKey);
        if (active && url) {
          setLocalBlobUrl(url);
          setVideoLoadError(false);
        }
      } else {
        setLocalBlobUrl(null);
      }
    }
    checkBlob();
    return () => {
      active = false;
    };
  }, [activeBlobKey]);

  // Aggiorna moduli e stato sblocco quando cambia l'utente o si apre la modale
  useEffect(() => {
    const refreshed = getVideoCourseModules();
    setModules(refreshed);
    const updatedSelected = refreshed.find((m) => m.numero === selectedModule.numero) || refreshed[0];
    setSelectedModule(updatedSelected);
    setIsUnlockedLocally(!isTrialUser(user));
    setWatchedVideos(user.watchedVideos || []);
  }, [user, isOpen]);

  // Reset errore video al cambio modulo/lezione
  useEffect(() => {
    setVideoLoadError(false);
    setEditingUrl(false);
  }, [selectedModule.numero, selectedLessonNum]);

  if (!isOpen) return null;

  const isTrial = !isUnlockedLocally;
  const isModuleLocked = isTrial && selectedModule.numero !== 1;
  const isModuleWatched = watchedVideos.includes(selectedModule.numero);

  // Lezione attualmente attiva nel modulo
  const activeLesson: LezioneModulo | undefined =
    selectedModule.lezioni && selectedModule.lezioni.length > 0
      ? selectedModule.lezioni.find((l) => l.numero === selectedLessonNum) || selectedModule.lezioni[0]
      : undefined;

  // Calcolo URL video effettivo
  const rawTargetUrl = localBlobUrl
    ? localBlobUrl
    : activeLesson?.videoUrl || selectedModule.videoUrl;

  const embedInfo: VideoEmbedInfo = parseVideoEmbed(rawTargetUrl);

  const handleSelectModule = (modulo: ModuloVideo) => {
    setSelectedModule(modulo);
    setSelectedLessonNum(1);
    setVideoLoadError(false);
    setEditingUrl(false);
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectLesson = (lessonNum: number) => {
    setSelectedLessonNum(lessonNum);
    setVideoLoadError(false);
    setEditingUrl(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 150);
  };

  const handleToggleWatched = (moduleNum: number) => {
    const next = isModuleWatched
      ? watchedVideos.filter((n) => n !== moduleNum)
      : [...watchedVideos, moduleNum];
    setWatchedVideos(next);
    const updated = saveUserData({ watchedVideos: next });
    onUserDataUpdated?.(updated);
  };

  const handleSaveCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    if (activeLesson) {
      saveLessonVideoUrl(selectedModule.numero, activeLesson.numero, customUrlInput.trim());
    } else {
      saveModuleVideoUrl(selectedModule.numero, customUrlInput.trim());
    }
    const refreshed = getVideoCourseModules();
    setModules(refreshed);
    const updated = refreshed.find((m) => m.numero === selectedModule.numero);
    if (updated) setSelectedModule(updated);
    setEditingUrl(false);
    setCustomUrlInput('');
    setVideoLoadError(false);
  };

  // Caricamento file video locale in IndexedDB
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await saveVideoBlob(activeBlobKey, file);
      const url = URL.createObjectURL(file);
      setLocalBlobUrl(url);
      setIsLocalBlobPresent(true);
      setVideoLoadError(false);

      // Aggiorna l'URL come blob nella memoria dell'app
      if (activeLesson) {
        saveLessonVideoUrl(selectedModule.numero, activeLesson.numero, url);
      } else {
        saveModuleVideoUrl(selectedModule.numero, url);
      }
    } catch (err) {
      console.error('Errore salvataggio video locale in IndexedDB:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteLocalBlob = async () => {
    await deleteVideoBlob(activeBlobKey);
    setLocalBlobUrl(null);
    setIsLocalBlobPresent(false);
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
                    Sblocca la versione completa per guardare tutte le lezioni di questo modulo direttamente nell'app.
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
              <div className="space-y-3 animate-fadeIn">
                {/* SELETTORE DELLE LEZIONI DEL MODULO SE NE HA PIÙ DI UNA (es. MODULO 2: 3 LEZIONI) */}
                {selectedModule.lezioni && selectedModule.lezioni.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-[#F9C03E] uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Lezioni di questo Modulo:</span>
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {selectedModule.lezioni.length} video disponibili
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {selectedModule.lezioni.map((lez) => {
                        const isSelected = lez.numero === selectedLessonNum;
                        return (
                          <button
                            key={lez.numero}
                            type="button"
                            onClick={() => handleSelectLesson(lez.numero)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#234C77] border-[#F9C03E] shadow-md ring-1 ring-[#F9C03E]/50'
                                : 'bg-[#021831]/80 border-[#88A5BF]/30 hover:border-[#F9C03E]/60 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                  isSelected
                                    ? 'bg-[#F9C03E] text-[#042B58]'
                                    : 'bg-[#042B58] text-[#88A5BF]'
                                }`}
                              >
                                Video {lez.numero}
                              </span>
                              {lez.durata && (
                                <span className="text-[10px] font-mono text-[#F9C03E] flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {lez.durata}
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-xs font-bold leading-tight ${
                                isSelected ? 'text-white' : 'text-slate-200'
                              }`}
                            >
                              {lez.titolo}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 1. PLAYER VIDEO RESPONSIVO (MP4, YouTube, Vimeo, Drive, Blob locale) */}
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
                    /* STATO ATTESA CARICAMENTO VIDEO CON OPZIONI SEMPLICI */
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-[#021831] to-[#042B58]">
                      <div className="w-12 h-12 rounded-2xl bg-[#234C77] border border-[#F9C03E]/40 flex items-center justify-center text-[#F9C03E] mb-2 shadow-md">
                        <Video className="w-6 h-6" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {activeLesson
                          ? `Video ${activeLesson.numero}: ${activeLesson.titolo}`
                          : `Modulo ${selectedModule.numero}: ${selectedModule.titolo}`}
                      </span>
                      <p className="text-[11px] text-slate-300 max-w-sm mt-1 leading-relaxed">
                        Pronto per la riproduzione in-app. Puoi caricare direttamente il file MP4 salvato sul tuo computer oppure incollare il link.
                      </p>

                      <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="py-1.5 px-3 rounded-lg bg-[#F9C03E] text-[#042B58] text-[11px] font-bold flex items-center gap-1.5 hover:brightness-105 transition-all shadow cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Carica Video MP4 dal PC</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUrl(true);
                            setCustomUrlInput(activeLesson?.videoUrl || selectedModule.videoUrl || '');
                          }}
                          className="py-1.5 px-3 rounded-lg bg-[#021831] border border-[#88A5BF]/40 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 hover:border-[#F9C03E] transition-all cursor-pointer"
                        >
                          <LinkIcon className="w-3.5 h-3.5 text-[#F9C03E]" />
                          <span>Incolla Link Video</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* NOTIFICA FILE LOCALE / CONTROLLI VIDEO RAPIDI */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs bg-[#021831]/80 border border-[#88A5BF]/30 rounded-xl p-2.5">
                  <div className="flex items-center gap-2">
                    {isLocalBlobPresent ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        File video presente in memoria locale
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {activeLesson ? `Video ${activeLesson.numero}: ${activeLesson.titolo}` : selectedModule.titolo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Input file nascosto per caricare l'MP4 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="py-1 px-2.5 rounded-lg bg-[#234C77] border border-[#F9C03E]/40 text-[#F9C03E] text-[11px] font-bold flex items-center gap-1 hover:brightness-110 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{isUploading ? 'Salvataggio...' : isLocalBlobPresent ? 'Sostituisci MP4' : 'Carica MP4'}</span>
                    </button>

                    {isLocalBlobPresent && (
                      <button
                        type="button"
                        onClick={handleDeleteLocalBlob}
                        title="Rimuovi video dalla memoria locale"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingUrl(!editingUrl);
                        setCustomUrlInput(activeLesson?.videoUrl || selectedModule.videoUrl || '');
                      }}
                      className="py-1 px-2.5 rounded-lg bg-[#042B58] border border-[#88A5BF]/30 text-slate-300 text-[11px] font-medium flex items-center gap-1 hover:text-white hover:border-[#F9C03E] cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3 text-[#F9C03E]" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>

                {/* FORM PER INCOLLARE O MODIFICARE IL LINK DEL VIDEO */}
                {editingUrl && (
                  <div className="p-3 rounded-xl bg-[#021831] border border-[#F9C03E]/40 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#F9C03E]">
                        Collega link video per{' '}
                        {activeLesson
                          ? `Lezione ${activeLesson.numero}: ${activeLesson.titolo}`
                          : `Modulo ${selectedModule.numero}`}
                        :
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingUrl(false)}
                        className="text-slate-400 hover:text-white text-[10px]"
                      >
                        Chiudi
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Puoi incollare un link da <strong>YouTube</strong> (anche non in elenco), <strong>Vimeo</strong>, <strong>Google Drive</strong> o il percorso del file.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="es. https://youtu.be/... o /videos/modulo2_mentalita.mp4"
                        className="flex-1 bg-[#042B58] border border-[#88A5BF]/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F9C03E]"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomUrl}
                        className="py-1.5 px-3 rounded-lg bg-[#F9C03E] text-[#042B58] text-xs font-bold hover:brightness-105 cursor-pointer shrink-0"
                      >
                        Salva
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. DETTAGLI DEL MODULO / LEZIONE ATTIVA */}
                <div className="glass-card p-3.5 sm:p-4 border border-[#F9C03E]/30 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] bg-[#021831] px-2.5 py-0.5 rounded-full border border-[#F9C03E]/40">
                        Modulo {selectedModule.numero}
                      </span>
                      {activeLesson && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200 bg-[#234C77] px-2 py-0.5 rounded-full border border-[#88A5BF]/30">
                          Lezione {activeLesson.numero}
                        </span>
                      )}
                      {selectedModule.numero === 1 && (
                        <span className="text-[9px] font-bold uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Incluso Gratuito
                        </span>
                      )}
                    </div>

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
                      <span>{isModuleWatched ? 'Completato' : 'Segna modulo visto'}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {activeLesson ? activeLesson.titolo : selectedModule.titolo}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {activeLesson?.descrizione || selectedModule.descrizione}
                    </p>
                    {selectedModule.evidenza && (
                      <div className="mt-2 text-xs italic text-[#F9C03E] bg-[#021831]/60 p-2.5 rounded-xl border-l-2 border-[#F9C03E]">
                        "{selectedModule.evidenza}"
                      </div>
                    )}
                  </div>

                  {/* SCHEDA SPECIFICA MODULO 2: I PUNTI CHIAVE SPIEGATI DA ANDREA NEI 3 VIDEO */}
                  {selectedModule.numero === 2 && (
                    <div className="pt-2 border-t border-[#88A5BF]/20 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>Sintesi della lezione di Andrea Frattesi:</span>
                      </span>

                      {selectedLessonNum === 1 && (
                        <div className="bg-[#021831]/80 rounded-xl p-3 border border-[#88A5BF]/25 text-xs text-slate-200 space-y-2">
                          <p className="font-semibold text-[#F9C03E]">
                            I 5 Grandi Temi del Mindset:
                          </p>
                          <ul className="space-y-1.5 pl-2">
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Fiducia e Autostima:</strong> Supera la paura del giudizio. Fai in modo che ti guardino con ammirazione perché balli in modo differente. Non è importante quante figure fai, ma come le fai!</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Blocchi Mentali:</strong> 'Non sono portato', 'Non sono sexy', 'Le donne vogliono quelli belli'. Carismatici si diventa con la pratica. Lei non guarda se sei bello, vuole sentire la tua presenza e la tua guida!</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Difficoltà Tecniche:</strong> Confusione musicale, guida poco fluida, senso di rigidità. Impara la musica in macchina, lascia andare le gambe a ritmo di musica!</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Connessione:</strong> Il primo ballo serve da studio per capire chi hai davanti. Sguardi mirati, pause e tocchi leggeri: sedurre è una danza sottile.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Frustrazione Seduttiva:</strong> Non essere troppo forzato o invadente. Sii delicato ma deciso: l'uomo che guida sei tu!</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {selectedLessonNum === 2 && (
                        <div className="bg-[#021831]/80 rounded-xl p-3 border border-[#88A5BF]/25 text-xs text-slate-200 space-y-2">
                          <p className="font-semibold text-[#F9C03E]">
                            Le 6 Chiavi per Creare Connessione:
                          </p>
                          <ol className="space-y-1.5 pl-2 list-decimal list-inside">
                            <li><strong>Presenza Totale:</strong> Balla con lei e per lei, al suo ritmo, senza guardarti attorno o pensare alla prossima figura.</li>
                            <li><strong>Contatto Leggero ma Chiaro:</strong> Postura maschile d'asse, pressione dolce e sicura sulla schiena che la fa sentire protetta.</li>
                            <li><strong>Gioco di Sguardi:</strong> Guarda all'inizio e alla fine; sostieni lo sguardo e sorridi quando gli occhi si incrociano.</li>
                            <li><strong>Alterna Tensione e Rilascio:</strong> Pause magnetiche, gioca con le distanze per creare attesa e tensione sensuale.</li>
                            <li><strong>Accoglienza:</strong> Percepisci il suo stato emotivo: se è tesa rallenta, se è carica accompagnala con energia.</li>
                            <li><strong>Concludi con Rispetto e Intensità:</strong> Il finale è il ricordo più forte. Saluta con classe e chiedi: 'Ti va di ballare ancora?'.</li>
                          </ol>
                        </div>
                      )}

                      {selectedLessonNum === 3 && (
                        <div className="bg-[#021831]/80 rounded-xl p-3 border border-[#88A5BF]/25 text-xs text-slate-200 space-y-2">
                          <p className="font-semibold text-[#F9C03E]">
                            I 6 Consigli Base di Preparazione:
                          </p>
                          <ul className="space-y-1.5 pl-2">
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Magliette e Tessuti:</strong> Scegli colori scuri o tessuti tecnici dove il sudore non si vede, evitando cotoni chiari.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Pantaloni Lunghi:</strong> Più eleganti e mascolini per le serate nei locali.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Alito Fresco:</strong> Mentine o caramelle sempre in tasca tra un ballo e l'altro (senza masticare rumorosamente).</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Profumo Gradevole:</strong> Un profumo fresco e accattivante, senza colonie pesanti da dopobarba.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Sudore e Igiene:</strong> Doccia prima di uscire, deodorante efficace e una maglietta di ricambio sempre pronta.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-[#F9C03E] font-bold">•</span>
                              <span><strong>Accessori Sobri:</strong> Orologi e bracciali eleganti sì; evita cappellini parasole o asciugamani al collo in pista.</span>
                            </li>
                          </ul>
                        </div>
                      )}
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
                          {modulo.lezioni && modulo.lezioni.length > 0 && (
                            <span className="text-[9px] text-[#F9C03E] bg-[#042B58] px-1.5 py-0.2 rounded border border-[#F9C03E]/30 font-medium">
                              {modulo.lezioni.length} Lezioni
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
