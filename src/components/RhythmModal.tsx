import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Square,
  Music,
  Sparkles,
  Upload,
  Trash2,
  RotateCcw,
  Plus,
  FileMusic,
  Disc3,
  Bell,
  BellOff,
  Check,
} from 'lucide-react';
import { DanceGenre } from '../services/rhythmAudio';
import {
  analyzeAudioFile,
  BeatEvent,
} from '../services/audioAnalyzer';
import {
  saveTrackToStorage,
  getAllStoredTracks,
  deleteTrackFromStorage,
  clearAllStoredTracks,
} from '../services/trackStorage';

export interface CustomTrack {
  id: string;
  name: string;
  artist?: string;
  file?: File;
  url: string;
  genre: DanceGenre;
  bpm: number;
  beatOffset: number; // Downbeat (Tempo 1) offset in seconds
  beats?: BeatEvent[]; // Array of exact beat timestamps
  isAnalyzing?: boolean;
  recognitionSource?: 'catalog' | 'dsp_waveform' | 'heuristic';
  details?: string;
}

interface RhythmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generatore di suono didattico: Campana Latina squillante UNICAMENTE sul Tempo 1
let customAudioCtx: AudioContext | null = null;
function playCustomClickSound(beat: number) {
  try {
    if (beat !== 0) return; // Suona solo ed esclusivamente sul Tempo 1
    if (!customAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      customAudioCtx = new AudioCtx();
    }
    if (customAudioCtx.state === 'suspended') {
      customAudioCtx.resume().catch(() => {});
    }
    const now = customAudioCtx.currentTime;

    // TEMPO 1: Campana Latina squillante
    const osc1 = customAudioCtx.createOscillator();
    const osc2 = customAudioCtx.createOscillator();
    const gain = customAudioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(840, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1480, now);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(customAudioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  } catch {
    // ignore audio errors
  }
}

export const RhythmModal: React.FC<RhythmModalProps> = ({ isOpen, onClose }) => {
  // Canzoni audio originali
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null);

  // Stato di riproduzione
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [currentChordName, setCurrentChordName] = useState<string>('');
  const [customCurrentTime, setCustomCurrentTime] = useState<number>(0);
  const [customDuration, setCustomDuration] = useState<number>(0);
  const [customClickEnabled, setCustomClickEnabled] = useState<boolean>(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const lastCustomBeatRef = useRef<number>(-1);

  // Carica i brani memorizzati su IndexedDB all'avvio
  useEffect(() => {
    getAllStoredTracks()
      .then((stored) => {
        if (stored && stored.length > 0) {
          const loadedTracks: CustomTrack[] = stored.map((s) => ({
            id: s.id,
            name: s.name,
            artist: s.artist,
            file: new File([s.audioBlob], `${s.name}.mp3`, { type: s.audioBlob.type || 'audio/mpeg' }),
            url: URL.createObjectURL(s.audioBlob),
            genre: s.genre,
            bpm: s.bpm,
            beatOffset: s.beatOffset,
            beats: s.beats,
            isAnalyzing: false,
            recognitionSource: 'dsp_waveform',
            details: `Brano memorizzato (${s.bpm} BPM)`,
          }));
          setCustomTracks(loadedTracks);
          if (loadedTracks.length > 0) {
            setSelectedCustomId(loadedTracks[0].id);
            if (customAudioRef.current) {
              customAudioRef.current.src = loadedTracks[0].url;
            }
          }
        }
      })
      .catch((err) => console.warn('Errore lettura brani salvati:', err));
  }, []);

  // Stop pulito
  const stopAllPlayback = () => {
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveBeat(-1);
    setCurrentChordName('');
    lastCustomBeatRef.current = -1;
  };

  const currentCustomTrack = customTracks.find((t) => t.id === selectedCustomId);

  // Sincronizza sorgente audio al cambio traccia
  useEffect(() => {
    if (customAudioRef.current && currentCustomTrack) {
      if (customAudioRef.current.src !== currentCustomTrack.url) {
        customAudioRef.current.src = currentCustomTrack.url;
        customAudioRef.current.load();
      }
    }
  }, [currentCustomTrack]);

  // Sincronizzazione ad alta precisione con il clock dell'audio reale
  useEffect(() => {
    let animId: number;

    const syncBeatWithAudio = () => {
      if (
        isPlayingRef.current &&
        customAudioRef.current &&
        !customAudioRef.current.paused &&
        currentCustomTrack
      ) {
        const currentSec = customAudioRef.current.currentTime;
        const beats = currentCustomTrack.beats;

        if (beats && beats.length > 0) {
          if (currentSec < beats[0].time) {
            setActiveBeat(-1);
            setCurrentChordName('Intro (Attesa 1)');
          } else {
            // Ricerca binaria del battito attivo corrispondente al secondo corrente
            let low = 0;
            let high = beats.length - 1;
            let activeIdx = -1;
            while (low <= high) {
              const mid = (low + high) >> 1;
              if (beats[mid].time <= currentSec) {
                activeIdx = mid;
                low = mid + 1;
              } else {
                high = mid - 1;
              }
            }

            if (activeIdx >= 0) {
              const beatObj = beats[activeIdx];
              const beatNum = beatObj.beat;
              setActiveBeat(beatNum);
              setCurrentChordName(`Tempo ${beatNum + 1}`);

              // Guida sonora campanella Latina solo all'ingresso del Tempo 1
              if (customClickEnabled && lastCustomBeatRef.current !== activeIdx) {
                lastCustomBeatRef.current = activeIdx;
                if (beatNum === 0) {
                  playCustomClickSound(0);
                }
              }
            }
          }
        } else {
          setActiveBeat(-1);
          setCurrentChordName('Pronto');
        }
      } else if (!isPlayingRef.current) {
        setActiveBeat(-1);
      }
      animId = requestAnimationFrame(syncBeatWithAudio);
    };

    animId = requestAnimationFrame(syncBeatWithAudio);
    return () => cancelAnimationFrame(animId);
  }, [currentCustomTrack, customClickEnabled]);

  // Seleziona un brano
  const handleSelectCustomTrack = (track: CustomTrack) => {
    stopAllPlayback();
    setSelectedCustomId(track.id);
    if (customAudioRef.current) {
      customAudioRef.current.src = track.url;
      customAudioRef.current.currentTime = 0;
      customAudioRef.current.load();
    }
  };

  // Play / Stop
  const handleTogglePlay = () => {
    if (isPlayingRef.current) {
      stopAllPlayback();
    } else {
      if (customAudioRef.current && currentCustomTrack) {
        if (!customAudioRef.current.src || !customAudioRef.current.src.includes(currentCustomTrack.url)) {
          customAudioRef.current.src = currentCustomTrack.url;
          customAudioRef.current.load();
        }

        customAudioRef.current
          .play()
          .then(() => {
            isPlayingRef.current = true;
            setIsPlaying(true);
            lastCustomBeatRef.current = -1;
          })
          .catch((err) => {
            console.warn('Errore riproduzione audio:', err);
            setSyncNotice('Tocca per avviare la riproduzione.');
            setTimeout(() => setSyncNotice(null), 3000);
            stopAllPlayback();
          });
      }
    }
  };

  // Caricamento file audio originali (multiplo o singolo)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setSyncNotice(`⚡ Analisi automatica del ritmo per ${fileList.length} canzoni...`);

    const newTracks: CustomTrack[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
      const trackId = `track-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
      const url = URL.createObjectURL(file);

      try {
        const result = await analyzeAudioFile(file);

        const trackItem: CustomTrack = {
          id: trackId,
          name: result.title || cleanName,
          artist: result.artist,
          file,
          url,
          genre: result.genre,
          bpm: result.bpm,
          beatOffset: result.beatOffset,
          beats: result.beats,
          isAnalyzing: false,
          recognitionSource: result.recognitionSource,
          details: result.details,
        };

        // Salvataggio permanente su IndexedDB
        await saveTrackToStorage({
          id: trackId,
          name: trackItem.name,
          artist: trackItem.artist,
          genre: trackItem.genre,
          bpm: trackItem.bpm,
          beatOffset: trackItem.beatOffset,
          beats: trackItem.beats,
          audioBlob: file,
          duration: file.size,
          savedAt: Date.now(),
        });

        newTracks.push(trackItem);
      } catch (err) {
        console.warn('Analisi fallita per:', file.name, err);
        const fallbackTrack: CustomTrack = {
          id: trackId,
          name: cleanName,
          file,
          url,
          genre: 'salsa',
          bpm: 182,
          beatOffset: 1.8,
          isAnalyzing: false,
        };
        await saveTrackToStorage({
          id: trackId,
          name: cleanName,
          genre: 'salsa',
          bpm: 182,
          beatOffset: 1.8,
          audioBlob: file,
          savedAt: Date.now(),
        });
        newTracks.push(fallbackTrack);
      }
    }

    setCustomTracks((prev) => {
      const updated = [...newTracks, ...prev.filter((p) => !newTracks.some((n) => n.name === p.name))];
      return updated;
    });

    if (newTracks.length > 0) {
      const first = newTracks[0];
      setSelectedCustomId(first.id);
      if (customAudioRef.current) {
        customAudioRef.current.src = first.url;
        customAudioRef.current.load();
      }
    }

    setSyncNotice(
      `✓ ${fileList.length} canzoni caricate: ritmo e tempo sincronizzati automaticamente!`
    );
    setTimeout(() => setSyncNotice(null), 4000);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Rianalisi automatica del brano
  const handleReanalyzeTrack = (track: CustomTrack) => {
    if (!track.file) return;
    setCustomTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, isAnalyzing: true } : t))
    );
    setSyncNotice('⚡ Calibrazione automatica del tempo e delle battute...');
    analyzeAudioFile(track.file)
      .then(async (result) => {
        const updatedTrack: CustomTrack = {
          ...track,
          name: result.title || track.name,
          artist: result.artist,
          genre: result.genre,
          bpm: result.bpm,
          beatOffset: result.beatOffset,
          beats: result.beats,
          isAnalyzing: false,
          recognitionSource: result.recognitionSource,
          details: result.details,
        };

        if (track.file) {
          await saveTrackToStorage({
            id: track.id,
            name: updatedTrack.name,
            artist: updatedTrack.artist,
            genre: updatedTrack.genre,
            bpm: updatedTrack.bpm,
            beatOffset: updatedTrack.beatOffset,
            beats: updatedTrack.beats,
            audioBlob: track.file,
            savedAt: Date.now(),
          });
        }

        setCustomTracks((prev) =>
          prev.map((t) => (t.id === track.id ? updatedTrack : t))
        );
        setSyncNotice(
          `✓ Ritmo calibrato: ${result.bpm} BPM, Tempo 1 allineato a ${result.beatOffset.toFixed(2)}s`
        );
        setTimeout(() => setSyncNotice(null), 4000);
      })
      .catch((err) => {
        console.warn('Rianalisi fallita:', err);
        setCustomTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, isAnalyzing: false } : t))
        );
      });
  };

  // Eliminazione singolo brano
  const handleDeleteCustomTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    stopAllPlayback();
    const trackToDelete = customTracks.find((t) => t.id === id);
    if (trackToDelete) {
      URL.revokeObjectURL(trackToDelete.url);
    }

    deleteTrackFromStorage(id).catch((err) => console.warn('Errore eliminazione:', err));

    const updated = customTracks.filter((t) => t.id !== id);
    setCustomTracks(updated);

    if (selectedCustomId === id) {
      if (updated.length > 0) {
        setSelectedCustomId(updated[0].id);
        if (customAudioRef.current) {
          customAudioRef.current.src = updated[0].url;
          customAudioRef.current.load();
        }
      } else {
        setSelectedCustomId(null);
      }
    }
  };

  // Svuota tutte le canzoni
  const handleClearAllTracks = async () => {
    stopAllPlayback();
    customTracks.forEach((t) => URL.revokeObjectURL(t.url));
    await clearAllStoredTracks().catch(() => {});
    setCustomTracks([]);
    setSelectedCustomId(null);
    setSyncNotice('Tutte le canzoni sono state rimosse.');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleClose = () => {
    stopAllPlayback();
    onClose();
  };

  if (!isOpen) return null;

  // Titolo della traccia attiva
  const activeTitle = currentCustomTrack
    ? currentCustomTrack.name
    : 'Nessuna canzone caricata';

  const activeGenreLabel = currentCustomTrack
    ? currentCustomTrack.genre === 'salsa'
      ? 'Salsa'
      : 'Bachata'
    : 'Salsa';

  const activeBpmInfo = currentCustomTrack
    ? `${currentCustomTrack.bpm} BPM`
    : '-- BPM';

  // 8 Battute musicali pulite
  const beatList = [
    { num: 1, strong: true },
    { num: 2, strong: false },
    { num: 3, strong: false },
    { num: 4, strong: false },
    { num: 5, strong: true },
    { num: 6, strong: false },
    { num: 7, strong: false },
    { num: 8, strong: false },
  ];

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021831]/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-md max-h-[92vh] bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#88A5BF]/20 shrink-0">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#F9C03E]" />
            <h2 className="text-lg font-bold font-serif text-white">
              Allenatore di Ritmo
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Chiudi"
            className="text-slate-400 hover:text-white p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifica di stato */}
        {syncNotice && (
          <div className="mt-2 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-xs text-amber-200 flex items-center gap-2 animate-fadeIn shrink-0">
            <Sparkles className="w-4 h-4 text-[#F9C03E] shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-3 space-y-4 pr-1 my-1 flex-1 text-left">
          {/* Card Canzone Attuale + Controllo Principale Play */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                  <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin text-[#F9C03E]' : ''}`} />
                  <span>Canzone Originale Audio</span>
                </span>
                <h3 className="text-sm font-semibold text-white truncate mt-0.5">
                  {activeTitle}
                </h3>
                {currentCustomTrack && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[#021831] text-[#88A5BF] border border-[#88A5BF]/30">
                      {activeGenreLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#021831] text-[#F9C03E] border border-[#F9C03E]/40">
                      {activeBpmInfo}
                    </span>
                    {currentChordName && isPlaying && (
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                        {currentChordName}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Tasto Play / Ferma */}
              <button
                onClick={handleTogglePlay}
                disabled={!currentCustomTrack}
                className={`py-2 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isPlaying
                    ? 'bg-[#234C77] hover:bg-[#88A5BF]/30 text-white border border-[#88A5BF]/40 shadow-sm'
                    : 'gold-gradient-btn text-[#042B58] shadow-md'
                } ${!currentCustomTrack ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Ferma</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-[#042B58] text-[#042B58]" />
                    <span>Riproduci</span>
                  </>
                )}
              </button>
            </div>

            {/* Audio Progress Bar */}
            {currentCustomTrack && (
              <div className="pt-2 border-t border-[#88A5BF]/20 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                  <span>{formatTime(customCurrentTime)}</span>
                  <span>{formatTime(customDuration)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={customDuration || 100}
                  value={customCurrentTime}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    setCustomCurrentTime(newTime);
                    if (customAudioRef.current) {
                      customAudioRef.current.currentTime = newTime;
                    }
                  }}
                  className="w-full accent-[#F9C03E] cursor-pointer h-1.5 bg-[#021831] rounded-lg"
                />
              </div>
            )}
          </div>

          {/* BATTUTE MUSICALI (1 A 8) - SINCRONIZZATE AUTOMATICAMENTE CON LA MUSICA */}
          <div className="glass-card p-3 sm:p-4 text-center space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Battute Musicali</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#F9C03E]">
                {currentCustomTrack?.bpm
                  ? `${currentCustomTrack.bpm} BPM`
                  : 'Sincronizzato con l\'Audio'}
              </span>
            </div>

            {/* Griglia a 8 caselle (da 1 a 8) */}
            <div className="grid grid-cols-8 gap-1 sm:gap-1.5 pt-1">
              {beatList.map((item, idx) => {
                const isActive = isPlaying && activeBeat === idx;
                const isStrong = item.strong;

                let padClasses = 'bg-[#021831]/80 border border-[#88A5BF]/20 text-slate-300';
                if (isActive) {
                  if (isStrong) {
                    padClasses = 'bg-[#F9C03E] text-[#042B58] border border-[#F9C03E] shadow-xl shadow-[#F9C03E]/50 scale-105 font-black ring-2 ring-[#F9C03E]';
                  } else {
                    padClasses = 'bg-[#234C77] text-white border border-[#88A5BF]/80 shadow-lg shadow-[#234C77]/50 scale-105 font-bold ring-1 ring-white/50';
                  }
                } else if (isStrong) {
                  padClasses = 'bg-[#021831]/90 border border-[#F9C03E]/40 text-[#F9C03E] font-semibold';
                }

                return (
                  <div
                    key={idx}
                    className={`py-3 sm:py-3.5 px-1 rounded-xl flex items-center justify-center transition-all duration-75 select-none ${padClasses}`}
                  >
                    <span className="text-lg sm:text-2xl font-bold font-mono">
                      {item.num}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Informazioni sincronizzazione automatica */}
            {currentCustomTrack && (
              <div className="pt-2 text-center border-t border-[#88A5BF]/15">
                <span className="text-[11px] text-[#88A5BF] font-mono">
                  Sincronizzazione automatica: Tempo 1 a {currentCustomTrack.beatOffset.toFixed(2)}s • {currentCustomTrack.bpm} BPM
                </span>
              </div>
            )}
          </div>

          {/* GUIDA DIDATTICA SUL TEMPO 1 (Campana Latina) */}
          <div className="glass-card p-3 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                {customClickEnabled ? (
                  <Bell className="w-3.5 h-3.5 text-[#F9C03E]" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Campana Didattica sul Tempo 1</span>
              </div>
              <button
                onClick={() => setCustomClickEnabled((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                  customClickEnabled
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                }`}
              >
                {customClickEnabled ? 'Attiva' : 'Disattivata'}
              </button>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              {customClickEnabled
                ? '🔔 Suona un tocco di campana esclusivamente sul Tempo 1 per abituare l\'orecchio all\'attacco della battuta senza sovrapporsi agli altri strumenti.'
                : 'Guida sonora disattivata: ascolti solo la canzone originale.'}
            </p>
          </div>

          {/* BOX CARICAMENTO FILE AUDIO MP3 ORIGINALI */}
          <div className="glass-card p-4 space-y-2 text-left">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#F9C03E]" />
              <span>Carica Canzoni Originali (MP3 / Audio)</span>
            </span>
            <p className="text-[11px] text-[#88A5BF]">
              Seleziona uno o più file MP3 dal tuo dispositivo (puoi selezionare anche tutte le canzoni insieme con selezione multipla). Rimangono salvate in memoria permanente con voce, parole e musica completa.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*, .mp3, .m4a, .wav, .aac, .ogg, .flac, audio/mpeg, audio/mp4, audio/wav, audio/x-m4a"
                onChange={handleFileUpload}
                className="hidden"
                id="custom-audio-file-input"
              />
              <label
                htmlFor="custom-audio-file-input"
                className="py-2.5 px-3.5 rounded-xl bg-[#234C77] hover:bg-[#88A5BF]/30 text-white text-xs font-medium border border-[#88A5BF]/30 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>
                  {customTracks.length > 0
                    ? `Aggiungi altre canzoni (${customTracks.length} memorizzate)`
                    : 'Seleziona i tuoi file MP3 originali'}
                </span>
              </label>

              {customTracks.length > 0 && (
                <button
                  onClick={handleClearAllTracks}
                  title="Elimina tutte le canzoni salvate"
                  className="py-2 px-2.5 rounded-xl bg-[#021831] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-medium border border-[#88A5BF]/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Svuota tutto</span>
                </button>
              )}
            </div>
          </div>

          {/* DETTAGLI RICONOSCIMENTO CANZONE ATTIVA */}
          {currentCustomTrack && (
            <div className="glass-card p-3.5 space-y-2.5 border border-[#F9C03E]/30 text-left">
              <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F9C03E]" />
                  <span>Dettagli Ritmici Brano</span>
                </span>
                {currentCustomTrack.file && (
                  <button
                    onClick={() => handleReanalyzeTrack(currentCustomTrack)}
                    disabled={currentCustomTrack.isAnalyzing}
                    className="text-[10px] text-amber-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-[#021831] border border-[#F9C03E]/30 cursor-pointer transition-colors"
                  >
                    <RotateCcw className={`w-3 h-3 ${currentCustomTrack.isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>Ricalibra</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#021831] border border-[#88A5BF]/30 text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stile</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-bold text-[#F9C03E]">
                      {currentCustomTrack.genre === 'salsa' ? '💃 Salsa' : '✨ Bachata'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#021831] border border-[#88A5BF]/30 text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Partenza (Tempo 1)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-bold font-mono text-[#F9C03E]">
                      {currentCustomTrack.beatOffset.toFixed(2)}s
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-400 block mt-0.5">
                    {currentCustomTrack.beats ? `${currentCustomTrack.beats.length} battiti agganciati` : 'Ritmica attiva'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PLAYLIST DELLE CANZONI ORIGINALI */}
          <div className="glass-card p-3 space-y-2 text-left">
            <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <FileMusic className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Le tue Canzoni Originali ({customTracks.length})</span>
              </span>
            </div>

            {customTracks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-white">Nessuna canzone ancora in memoria.</p>
                <p className="text-[10px] text-[#88A5BF]">
                  Carica i tuoi file MP3 dal tasto sopra per iniziare ad ascoltarle a tempo di battuta.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
                {customTracks.map((track) => {
                  const isSelected = selectedCustomId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectCustomTrack(track)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#234C77] border-[#F9C03E]/70 shadow-sm'
                          : 'bg-[#021831]/70 hover:bg-[#234C77]/40 border-[#88A5BF]/25 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-white truncate block">
                          {track.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-[#F9C03E]">
                            {track.genre === 'salsa' ? '💃 Salsa' : '✨ Bachata'} • {track.bpm} BPM
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> In riproduzione
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDeleteCustomTrack(track.id, e)}
                          title="Rimuovi questa canzone"
                          className="w-7 h-7 rounded-lg bg-[#021831] hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer border border-[#88A5BF]/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Audio Element invisibile dedicato alla traccia dell'utente */}
        <audio
          ref={customAudioRef}
          onTimeUpdate={() => {
            if (customAudioRef.current) {
              setCustomCurrentTime(customAudioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (customAudioRef.current) {
              setCustomDuration(customAudioRef.current.duration);
            }
          }}
          onEnded={stopAllPlayback}
          className="hidden"
          playsInline
        />
      </div>
    </div>
  );
};
