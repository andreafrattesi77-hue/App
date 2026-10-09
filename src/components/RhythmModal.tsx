import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Square,
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  Radio,
  Sliders,
  Upload,
  Trash2,
  RotateCcw,
  Plus,
  FileMusic,
  Disc3,
  Target,
  Bell,
  BellOff,
  Activity,
  Check,
} from 'lucide-react';
import {
  harmonizedEngine,
  MUSIC_TRACKS,
  MusicTrack,
  DanceGenre,
  RhythmMixer,
} from '../services/rhythmAudio';
import { analyzeAudioFile, AudioRecognitionResult, BeatEvent } from '../services/audioAnalyzer';

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

// Generatore di suono didattico Web Audio per le canzoni caricate
// Accento di Campana Latina sul Tempo 1 per insegnare all'orecchio a riconoscere l'1 al primo ascolto
let customAudioCtx: AudioContext | null = null;
function playCustomClickSound(beat: number, isSalsa: boolean) {
  try {
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

    if (beat === 0) {
      // TEMPO 1: Campana Latina squillante (accento per insegnare a riconoscere l'1)
      const osc1 = customAudioCtx.createOscillator();
      const osc2 = customAudioCtx.createOscillator();
      const gain = customAudioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(840, now);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1480, now);

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(customAudioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } else if (beat === 4) {
      // TEMPO 5: Mezzo accento (inizio della seconda metà di battuta)
      const osc = customAudioCtx.createOscillator();
      const gain = customAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(customAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (beat === 3 || beat === 7) {
      if (isSalsa) {
        // Pausa Salsa sui tempi 4 e 8: silenzio completo per non disturbare la pausa del passo!
        return;
      } else {
        // TAP Bachata: tocco acuto del bongò sul 4 e sull'8
        const osc = customAudioCtx.createOscillator();
        const gain = customAudioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1100, now);
        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(customAudioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } else {
      // Tempi 2, 3, 6, 7: click chiaro e pulito a tempo di musica
      const osc = customAudioCtx.createOscillator();
      const gain = customAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(customAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch {
    // ignore
  }
}


export const RhythmModal: React.FC<RhythmModalProps> = ({ isOpen, onClose }) => {
  // Source selector: 'catalog' (Brani del Metodo) vs 'custom' (Le mie canzoni)
  const [sourceMode, setSourceMode] = useState<'catalog' | 'custom'>('catalog');

  // Metodo catalog state
  const [activeGenre, setActiveGenre] = useState<DanceGenre>('salsa');
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack>(MUSIC_TRACKS[0]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [currentChordName, setCurrentChordName] = useState<string>('');

  // Mixer for catalog tracks
  const [mixer, setMixer] = useState<RhythmMixer>({
    harmony: true,
    bass: true,
    countVoice: true,
    percussion: true,
  });

  // Custom user songs playlist
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null);
  const [customCurrentTime, setCustomCurrentTime] = useState<number>(0);
  const [customDuration, setCustomDuration] = useState<number>(0);
  const [customClickEnabled, setCustomClickEnabled] = useState<boolean>(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const lastCustomBeatRef = useRef<number>(-1);

  // Stop everything safely
  const stopAllPlayback = () => {
    // 1. Synthesizer engine stop
    harmonizedEngine.stop();

    // 2. Custom audio pause
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }

    // 3. Reset playback states
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveBeat(-1);
    setCurrentChordName('');
    lastCustomBeatRef.current = -1;
  };

  const currentCustomTrack = customTracks.find((t) => t.id === selectedCustomId);

  // Sync audio source when selected custom track changes
  useEffect(() => {
    if (customAudioRef.current && currentCustomTrack) {
      if (customAudioRef.current.src !== currentCustomTrack.url) {
        customAudioRef.current.src = currentCustomTrack.url;
        customAudioRef.current.load();
      }
    }
  }, [currentCustomTrack]);

  // High-precision frame synchronization with audio clock
  useEffect(() => {
    let animId: number;

    const syncBeatWithAudio = () => {
      if (isPlayingRef.current) {
        if (sourceMode === 'catalog') {
          const state = harmonizedEngine.getCurrentBeatState();
          if (state) {
            setActiveBeat(state.beat);
            setCurrentChordName(state.chordName);
          }
        } else if (
          sourceMode === 'custom' &&
          customAudioRef.current &&
          !customAudioRef.current.paused &&
          currentCustomTrack
        ) {
          const currentSec = customAudioRef.current.currentTime;
          const beats = currentCustomTrack.beats;

          if (beats && beats.length > 0) {
            if (currentSec < beats[0].time) {
              setActiveBeat(-1);
              setCurrentChordName('Intro');
            } else {
              // Ricerca binaria per trovare il battito attivo corrispondente al secondo corrente
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
                const nextBeatTime =
                  activeIdx + 1 < beats.length
                    ? beats[activeIdx + 1].time
                    : beatObj.time + 60.0 / (currentCustomTrack.bpm || 130);

                if (currentSec < nextBeatTime) {
                  const beatNum = beatObj.beat;
                  setActiveBeat(beatNum);
                  setCurrentChordName(`Tempo ${beatNum + 1}`);

                  // Guida sonora: scatta esattamente all'inizio di ogni nuovo battito
                  if (customClickEnabled && lastCustomBeatRef.current !== activeIdx) {
                    lastCustomBeatRef.current = activeIdx;
                    playCustomClickSound(beatNum, currentCustomTrack.genre === 'salsa');
                  }
                }
              }
            }
          } else {
            // Fallback matematico se la mappa dei battiti non è ancora pronta
            const bpm = currentCustomTrack.bpm || 130;
            const secondsPerBeat = 60.0 / bpm;
            const offset = currentCustomTrack.beatOffset || 0;

            if (currentSec < offset) {
              setActiveBeat(-1);
              setCurrentChordName('Intro');
            } else {
              const elapsed = currentSec - offset;
              const totalBeats = Math.floor(elapsed / secondsPerBeat);
              const beat = totalBeats % 8;

              setActiveBeat(beat);

              // Audio click guide on custom track if enabled
              if (customClickEnabled && lastCustomBeatRef.current !== totalBeats) {
                lastCustomBeatRef.current = totalBeats;
                playCustomClickSound(beat, currentCustomTrack.genre === 'salsa');
              }
            }
          }
        }
      } else {
        setActiveBeat(-1);
      }
      animId = requestAnimationFrame(syncBeatWithAudio);
    };

    animId = requestAnimationFrame(syncBeatWithAudio);
    return () => cancelAnimationFrame(animId);
  }, [sourceMode, currentCustomTrack, customClickEnabled]);

  // Select catalog track
  const handleSelectCatalogTrack = (track: MusicTrack) => {
    stopAllPlayback();
    setSourceMode('catalog');
    setSelectedTrack(track);
    setActiveGenre(track.genre);
    harmonizedEngine.selectTrack(track.id);
  };

  // Genre switch for catalog
  const handleSelectGenre = (genre: DanceGenre) => {
    stopAllPlayback();
    setActiveGenre(genre);
    const firstForGenre = MUSIC_TRACKS.find((t) => t.genre === genre) || MUSIC_TRACKS[0];
    handleSelectCatalogTrack(firstForGenre);
  };

  // Select a custom user track from playlist
  const handleSelectCustomTrack = (track: CustomTrack) => {
    stopAllPlayback();
    setSourceMode('custom');
    setSelectedCustomId(track.id);
    setActiveGenre(track.genre);
    if (customAudioRef.current) {
      customAudioRef.current.src = track.url;
      customAudioRef.current.currentTime = 0;
      customAudioRef.current.load();
    }
  };

  // Toggle Play / Stop (Bug-free without interrupting pause/play)
  const handleTogglePlay = () => {
    if (isPlayingRef.current) {
      // STOP
      stopAllPlayback();
    } else {
      // PLAY
      if (sourceMode === 'catalog') {
        if (customAudioRef.current) customAudioRef.current.pause();
        harmonizedEngine.selectTrack(selectedTrack.id);
        harmonizedEngine.mixer = { ...mixer };
        harmonizedEngine
          .start()
          .then(() => {
            isPlayingRef.current = true;
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error('Harmonized engine error:', err);
            stopAllPlayback();
          });
      } else {
        harmonizedEngine.stop();
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
            })
            .catch((err) => {
              console.error('Audio play error:', err);
              setSyncNotice('Tocca di nuovo Riproduci per avviare il file audio.');
              setTimeout(() => setSyncNotice(null), 3000);
              stopAllPlayback();
            });
        }
      }
    }
  };

  // Toggle mixer components for catalog tracks
  const handleToggleMixer = (key: keyof RhythmMixer) => {
    const updated = {
      ...mixer,
      [key]: !mixer[key],
    };
    setMixer(updated);
    harmonizedEngine.mixer = updated;
  };

  // Handle uploading a new custom MP3/audio file with automatic rhythm & genre recognition
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopAllPlayback();
      const url = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');

      const newTrack: CustomTrack = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        file,
        url,
        genre: activeGenre,
        bpm: 125,
        beatOffset: 0.0,
        isAnalyzing: true,
      };

      setCustomTracks((prev) => [newTrack, ...prev]);
      setSelectedCustomId(newTrack.id);
      setSourceMode('custom');

      if (customAudioRef.current) {
        customAudioRef.current.src = url;
        customAudioRef.current.load();
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSyncNotice('🔍 Decodifica audio in corso: estrazione battiti e calcolo Tempo 1...');

      // Background audio signal analyzer con ottimizzazione per il genere selezionato
      analyzeAudioFile(file, activeGenre)
        .then((result) => {
          setCustomTracks((prev) =>
            prev.map((t) =>
              t.id === newTrack.id
                ? {
                    ...t,
                    name: result.title || t.name,
                    artist: result.artist,
                    genre: result.genre,
                    bpm: result.bpm,
                    beatOffset: result.beatOffset,
                    beats: result.beats,
                    isAnalyzing: false,
                    recognitionSource: result.recognitionSource,
                    details: result.details,
                  }
                : t
            )
          );
          setActiveGenre(result.genre);
          setSyncNotice(
            `✓ Ritmo Riconosciuto (${result.genre.toUpperCase()}): Primo Tempo 1 a ${result.beatOffset.toFixed(2)}s (${result.beats.length} battiti agganciati)`
          );
          setTimeout(() => setSyncNotice(null), 4500);
        })
        .catch((err) => {
          console.warn('Analisi audio fallita:', err);
          setCustomTracks((prev) =>
            prev.map((t) => (t.id === newTrack.id ? { ...t, isAnalyzing: false } : t))
          );
          setSyncNotice('✓ Analisi audio completata.');
          setTimeout(() => setSyncNotice(null), 3000);
        });
    }
  };

  // Re-run automatic beat & downbeat analysis for a custom track
  const handleReanalyzeTrack = (track: CustomTrack) => {
    if (!track.file) return;
    setCustomTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, isAnalyzing: true } : t))
    );
    setSyncNotice('⚡ Decodifica e scansione dei transienti audio in corso...');
    analyzeAudioFile(track.file, track.genre || activeGenre)
      .then((result) => {
        setCustomTracks((prev) =>
          prev.map((t) =>
            t.id === track.id
              ? {
                  ...t,
                  name: result.title || t.name,
                  artist: result.artist,
                  genre: result.genre,
                  bpm: result.bpm,
                  beatOffset: result.beatOffset,
                  beats: result.beats,
                  isAnalyzing: false,
                  recognitionSource: result.recognitionSource,
                  details: result.details,
                }
              : t
          )
        );
        setActiveGenre(result.genre);
        setSyncNotice(
          `✓ Battiti Riconosciuti (${result.genre.toUpperCase()}): Primo Tempo 1 a ${result.beatOffset.toFixed(2)}s (${result.beats.length} battiti agganciati)`
        );
        setTimeout(() => setSyncNotice(null), 4500);
      })
      .catch((err) => {
        console.warn('Rianalisi fallita:', err);
        setCustomTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, isAnalyzing: false } : t))
        );
        setSyncNotice('✓ Analisi completata.');
        setTimeout(() => setSyncNotice(null), 2500);
      });
  };

  // Delete / Remove custom track from list
  const handleDeleteCustomTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    stopAllPlayback();
    const trackToDelete = customTracks.find((t) => t.id === id);
    if (trackToDelete) {
      URL.revokeObjectURL(trackToDelete.url);
    }

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
        setSourceMode('catalog');
      }
    }
  };

  // Genre switch for custom track con ricalibrazione ritmica automatica
  const handleToggleCustomGenre = (genre: DanceGenre) => {
    if (!currentCustomTrack) return;
    setActiveGenre(genre);
    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? { ...t, genre } : t))
    );

    if (currentCustomTrack.file) {
      setSyncNotice(`⚡ Ricalibrazione ritmo e battute per ${genre.toUpperCase()} in corso...`);
      analyzeAudioFile(currentCustomTrack.file, genre)
        .then((result) => {
          setCustomTracks((prev) =>
            prev.map((t) =>
              t.id === currentCustomTrack.id
                ? {
                    ...t,
                    genre: result.genre,
                    bpm: result.bpm,
                    beatOffset: result.beatOffset,
                    beats: result.beats,
                    details: result.details,
                  }
                : t
            )
          );
          setSyncNotice(`✓ Ritmo ${genre.toUpperCase()} sincronizzato: Tempo 1 a ${result.beatOffset.toFixed(2)}s`);
          setTimeout(() => setSyncNotice(null), 3500);
        })
        .catch(() => {});
    }
  };

  // Close modal safely
  const handleClose = () => {
    stopAllPlayback();
    onClose();
  };

  if (!isOpen) return null;

  const currentGenreTracks = MUSIC_TRACKS.filter((t) => t.genre === activeGenre);

  // Active track details to display
  const activeTitle =
    sourceMode === 'catalog'
      ? selectedTrack.title
      : currentCustomTrack?.name || 'Nessuna canzone selezionata';

  const effectiveGenre = sourceMode === 'catalog' ? selectedTrack.genre : currentCustomTrack?.genre || activeGenre;

  const activeGenreLabel =
    effectiveGenre === 'salsa' ? 'Salsa' : 'Bachata';

  const activeBpmInfo =
    sourceMode === 'catalog'
      ? `${selectedTrack.bpm} BPM`
      : 'Ritmo Dinamico Audio';

  // 8 Battute musicali (nessun movimento o testo sotto: solo battute a tempo di musica)
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

  // Format seconds to mm:ss
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

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-3 space-y-4 pr-1 my-1 flex-1 text-left">
          {/* Card Canzone Attualmente Scelta + Controllo Principale Play */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                  <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin text-[#F9C03E]' : ''}`} />
                  <span>{sourceMode === 'catalog' ? 'Brano del Metodo' : 'La tua Canzone'}</span>
                </span>
                <h3 className="text-sm font-semibold text-white truncate mt-0.5">
                  {activeTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[#021831] text-[#88A5BF] border border-[#88A5BF]/30">
                    {activeGenreLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#021831] text-[#F9C03E] border border-[#F9C03E]/40">
                    {activeBpmInfo}
                  </span>
                </div>
              </div>

              {/* Tasto Play / Ferma */}
              <button
                onClick={handleTogglePlay}
                disabled={sourceMode === 'custom' && !currentCustomTrack}
                className={`py-2 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isPlaying
                    ? 'bg-[#234C77] hover:bg-[#88A5BF]/30 text-white border border-[#88A5BF]/40 shadow-sm'
                    : 'gold-gradient-btn text-[#042B58] shadow-md'
                } ${sourceMode === 'custom' && !currentCustomTrack ? 'opacity-50 cursor-not-allowed' : ''}`}
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

            {/* Custom Audio Progress Bar */}
            {sourceMode === 'custom' && currentCustomTrack && (
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

          {/* BATTUTE MUSICALI (1 A 8) - VISIBILI SUBITO IN ALTO, NESSUN TESTO O SCHERMATA SOTTO */}
          <div className="glass-card p-3 sm:p-4 text-center space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Battute Musicali</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#F9C03E]">
                {sourceMode === 'catalog'
                  ? `${selectedTrack.bpm} BPM`
                  : currentCustomTrack?.bpm
                  ? `${currentCustomTrack.bpm} BPM`
                  : 'Sincronizzato con l\'Audio'}
              </span>
            </div>

            {/* Griglia a 8 caselle fisse pulite (da 1 a 8) */}
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
          </div>

          {/* SORGENTE: Scelta tra "Brani del Metodo" e "Le mie Canzoni personali" */}
          <div className="glass-card p-1 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                stopAllPlayback();
                setSourceMode('catalog');
              }}
              className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'catalog'
                  ? 'gold-gradient-btn text-[#042B58] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Brani del Metodo ({MUSIC_TRACKS.length})</span>
            </button>

            <button
              onClick={() => {
                stopAllPlayback();
                setSourceMode('custom');
              }}
              className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'custom'
                  ? 'gold-gradient-btn text-[#042B58] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileMusic className="w-3.5 h-3.5" />
              <span>Le mie Canzoni ({customTracks.length})</span>
            </button>
          </div>

          {/* SEZIONE 1: BRANI DEL METODO */}
          {sourceMode === 'catalog' && (
            <div className="space-y-3">
              {/* Selettore Stile: Salsa vs Bachata */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectGenre('salsa')}
                  className={`flex-1 py-2 px-3 rounded-xl font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border ${
                    activeGenre === 'salsa'
                      ? 'bg-[#234C77] text-white border-[#F9C03E]/60 shadow-sm'
                      : 'bg-[#021831]/60 text-slate-300 border-[#88A5BF]/20 hover:text-white'
                  }`}
                >
                  <span>💃 Salsa (6 brani)</span>
                </button>
                <button
                  onClick={() => handleSelectGenre('bachata')}
                  className={`flex-1 py-2 px-3 rounded-xl font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border ${
                    activeGenre === 'bachata'
                      ? 'bg-[#234C77] text-white border-[#F9C03E]/60 shadow-sm'
                      : 'bg-[#021831]/60 text-slate-300 border-[#88A5BF]/20 hover:text-white'
                  }`}
                >
                  <span>✨ Bachata (6 brani)</span>
                </button>
              </div>

              {/* Lista 6 Brani del genere attivo */}
              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF]">
                    Scegli un brano da ascoltare:
                  </span>
                  <span className="text-[10px] text-[#F9C03E] font-medium">
                    {activeGenre === 'salsa' ? '6 variazioni Salsa' : '6 variazioni Bachata'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
                  {currentGenreTracks.map((track) => {
                    const isSelected = selectedTrack.id === track.id;
                    return (
                      <button
                        key={track.id}
                        onClick={() => handleSelectCatalogTrack(track)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#234C77] border-[#F9C03E]/70 shadow-sm'
                            : 'bg-[#021831]/70 hover:bg-[#234C77]/40 border-[#88A5BF]/25 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-white block truncate">
                            {track.title}
                          </span>
                          <span className="text-[10px] text-slate-300 truncate block mt-0.5">
                            {track.mood}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono font-bold text-[#F9C03E] px-2 py-0.5 rounded bg-[#021831]/80 border border-[#F9C03E]/30">
                            {track.bpm} BPM
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mixer Strumenti per Brani del Metodo */}
              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#F9C03E]" />
                    <span>Mixer Strumenti (Attiva/Disattiva)</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleToggleMixer('harmony')}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.harmony
                        ? 'bg-[#234C77] text-white border-[#88A5BF]/50'
                        : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                    }`}
                  >
                    <span>{activeGenre === 'salsa' ? 'Piano Montuno' : 'Chitarra'}</span>
                    {mixer.harmony ? <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleToggleMixer('bass')}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.bass
                        ? 'bg-[#234C77] text-white border-[#88A5BF]/50'
                        : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                    }`}
                  >
                    <span>Basso Latino</span>
                    {mixer.bass ? <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleToggleMixer('percussion')}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.percussion
                        ? 'bg-[#234C77] text-white border-[#88A5BF]/50'
                        : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                    }`}
                  >
                    <span>{activeGenre === 'salsa' ? 'Clave & Congas' : 'Bongò & Güira'}</span>
                    {mixer.percussion ? <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleToggleMixer('countVoice')}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.countVoice
                        ? 'bg-[#234C77] text-white border-[#88A5BF]/50'
                        : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                    }`}
                  >
                    <span>Click Guida Tempi</span>
                    {mixer.countVoice ? <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEZIONE 2: LE MIE CANZONI PERSONALI */}
          {sourceMode === 'custom' && (
            <div className="space-y-3">
              {/* Notifica di sincronizzazione / stato */}
              {syncNotice && (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-xs text-amber-200 flex items-center gap-2 animate-fadeIn">
                  <Sparkles className="w-4 h-4 text-[#F9C03E] shrink-0" />
                  <span>{syncNotice}</span>
                </div>
              )}

              {/* Tasto Carica Canzone */}
              <div className="glass-card p-4 space-y-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#F9C03E]" />
                  <span>Carica una Canzone (MP3 o Audio)</span>
                </span>
                <p className="text-[11px] text-[#88A5BF]">
                  Carica brani dalla tua libreria: l'app legge il file e allinea i conteggi 1-8 alla tua musica.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*, .mp3, .m4a, .wav, .aac, .ogg, .flac, audio/mpeg, audio/mp4, audio/wav, audio/x-m4a"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="custom-audio-file-input"
                  />
                  <label
                    htmlFor="custom-audio-file-input"
                    className="py-2 px-3.5 rounded-xl bg-[#234C77] hover:bg-[#88A5BF]/30 text-white text-xs font-medium border border-[#88A5BF]/30 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F9C03E]" />
                    <span>{customTracks.length > 0 ? 'Aggiungi un\'altra canzone' : 'Seleziona file audio MP3'}</span>
                  </label>
                </div>
              </div>

              {/* SCHEDA RICONOSCIMENTO AUTOMATICO BATTITO & TEMPO 1 */}
              {currentCustomTrack && (
                <div className="glass-card p-3.5 space-y-3 border border-[#F9C03E]/40">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#88A5BF]/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F9C03E]" />
                      <span>Riconoscimento Automatico Ritmo & Tempo 1</span>
                    </span>
                    {currentCustomTrack.file && (
                      <button
                        onClick={() => handleReanalyzeTrack(currentCustomTrack)}
                        disabled={currentCustomTrack.isAnalyzing}
                        className="text-[10px] text-amber-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-[#021831] border border-[#F9C03E]/30 cursor-pointer transition-colors"
                        title="Rianalizza la traccia con il rilevatore intelligente"
                      >
                        <RotateCcw className={`w-3 h-3 ${currentCustomTrack.isAnalyzing ? 'animate-spin' : ''}`} />
                        <span>Rianalizza</span>
                      </button>
                    )}
                  </div>

                  {/* Stato Riconoscimento */}
                  {currentCustomTrack.isAnalyzing ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 flex items-center gap-2.5 animate-pulse">
                      <Disc3 className="w-4 h-4 text-[#F9C03E] animate-spin shrink-0" />
                      <div className="text-left">
                        <p className="font-semibold text-white">Scansione intelligente del ritmo in corso...</p>
                        <p className="text-[10px] text-amber-300/80">Decodifica dei transienti percussivi e calcolo automatico del Tempo 1.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#021831] border border-[#F9C03E]/40 text-xs text-slate-200 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Ritmo Decodificato dall'Audio Reale
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono">
                          {currentCustomTrack.beats ? `${currentCustomTrack.beats.length} battiti agganciati` : 'DSP attivo'}
                        </span>
                      </div>
                      {currentCustomTrack.details && (
                        <p className="text-[11px] text-slate-200 leading-snug">{currentCustomTrack.details}</p>
                      )}
                    </div>
                  )}

                  {/* Valori Rilevati in Automatico dal Segnale Audio della Canzone */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#021831] border border-[#88A5BF]/30 text-left">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stile Musicale</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-bold text-[#F9C03E]">
                          {currentCustomTrack.genre === 'salsa' ? '💃 Salsa' : '✨ Bachata'}
                        </span>
                      </div>
                      <span className="text-[9px] text-[#88A5BF] block mt-0.5">
                        Ciclo a 8 battute
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#021831] border border-[#88A5BF]/30 text-left">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Inizio Ritmica (Tempo 1)</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-bold font-mono text-[#F9C03E]">
                          {currentCustomTrack.beatOffset.toFixed(2)}s
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-400 block mt-0.5">
                        {currentCustomTrack.beats ? `${currentCustomTrack.beats.length} battiti sincronizzati` : 'Tracciamento audio attivo'}
                      </span>
                    </div>
                  </div>

                  {/* Selezione Stile per Allenamento */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#88A5BF]/20">
                    <span className="text-xs text-slate-300">Stile musicale da applicare:</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleToggleCustomGenre('salsa')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          currentCustomTrack.genre === 'salsa'
                            ? 'bg-[#234C77] text-white border-[#F9C03E]'
                            : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                        }`}
                      >
                        Salsa (8 Battute)
                      </button>
                      <button
                        onClick={() => handleToggleCustomGenre('bachata')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          currentCustomTrack.genre === 'bachata'
                            ? 'bg-[#234C77] text-white border-[#F9C03E]'
                            : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                        }`}
                      >
                        Bachata (8 Battute)
                      </button>
                    </div>
                  </div>

                  {/* Guida Sonora per Imparare a Sentire il Tempo 1 */}
                  <div className="p-2.5 rounded-xl bg-[#021831]/80 border border-[#F9C03E]/30 space-y-2 text-left">
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
                        ? '🔔 Suona un rintocco di campana latina sul Tempo 1 per abituare il tuo orecchio a riconoscere esattamente quando parte la battuta della canzone senza dover indovinare.'
                        : 'La guida sonora è disattivata: puoi allenare il tuo orecchio ad ascoltare solo la musica originale.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Lista delle canzoni caricate */}
              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                    <FileMusic className="w-3.5 h-3.5 text-[#F9C03E]" />
                    <span>Le tue canzoni ({customTracks.length})</span>
                  </span>
                </div>

                {customTracks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                    <p>Nessuna canzone personale caricata.</p>
                    <p className="text-[10px] text-[#88A5BF]">Carica un file audio dal tasto sopra per iniziare.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 pt-1 max-h-52 overflow-y-auto pr-1">
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
                                {track.genre === 'salsa' ? '💃 Salsa' : '✨ Bachata'} • {track.beats?.length ? `${track.beats.length} battiti` : 'Ritmo Sincronizzato'}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Attiva
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

              {/* Tasto Rapido per Tornare ai Brani del Metodo */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    stopAllPlayback();
                    setSourceMode('catalog');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#234C77] hover:bg-[#88A5BF]/30 text-white text-xs font-medium border border-[#88A5BF]/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#F9C03E]" />
                  <span>Torna ai brani del Metodo (Salsa & Bachata)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stable Audio Element for Custom Files */}
        <audio
          ref={customAudioRef}
          preload="auto"
          playsInline
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
          onPlay={() => {
            isPlayingRef.current = true;
            setIsPlaying(true);
          }}
          onPause={() => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            setActiveBeat(-1);
          }}
          onEnded={() => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            setActiveBeat(-1);
          }}
          onError={() => {
            setSyncNotice('Nota: Se il file audio non parte, tocca di nuovo Riproduci o prova un file MP3 standard.');
            setTimeout(() => setSyncNotice(null), 4000);
          }}
        />
      </div>
    </div>
  );
};
