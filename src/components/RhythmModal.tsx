import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Square,
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  Footprints,
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

export interface CustomTrack {
  id: string;
  name: string;
  url: string;
  genre: DanceGenre;
  bpm: number;
  beatOffset: number; // Downbeat (Tempo 1) offset in seconds
}

interface RhythmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Web Audio audio click sound generator for custom songs
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
    const osc = customAudioCtx.createOscillator();
    const gain = customAudioCtx.createGain();

    let freq = 440;
    let vol = 0.28;

    if (beat === 0) {
      freq = 880; // Tempo 1 (Forte)
      vol = 0.55;
    } else if (beat === 4) {
      freq = 660; // Tempo 5
      vol = 0.4;
    } else if (beat === 3 || beat === 7) {
      if (isSalsa) {
        freq = 330;
        vol = 0.12;
      } else {
        freq = 940; // Tap Bachata brillante
        vol = 0.48;
      }
    }

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(customAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch {
    // ignore
  }
}

// Background BPM Analyzer using Web Audio peak autocorrelation
async function estimateBpmFromBlob(blob: Blob): Promise<number | null> {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const tempCtx = new AudioCtx();
    // Prendi i primi 2.5MB per velocità
    const slice = blob.slice(0, 2.5 * 1024 * 1024);
    const arrayBuffer = await slice.arrayBuffer();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    tempCtx.close().catch(() => {});

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Finestre di 50ms
    const windowSize = Math.floor(sampleRate * 0.05);
    const numWindows = Math.floor(channelData.length / windowSize);
    const energies: number[] = [];

    for (let i = 0; i < numWindows; i++) {
      let sum = 0;
      const start = i * windowSize;
      for (let j = 0; j < windowSize; j += 4) {
        const val = channelData[start + j];
        sum += val * val;
      }
      energies.push(sum);
    }

    const mean = energies.reduce((a, b) => a + b, 0) / (energies.length || 1);
    const threshold = mean * 1.35;
    const peaks: number[] = [];

    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        peaks.push(i);
      }
    }

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const diffWindows = peaks[i] - peaks[i - 1];
      const diffSeconds = (diffWindows * windowSize) / sampleRate;
      let bpm = 60.0 / diffSeconds;
      while (bpm < 100) bpm *= 2;
      while (bpm > 220) bpm /= 2;
      if (bpm >= 100 && bpm <= 220) {
        intervals.push(Math.round(bpm));
      }
    }

    if (intervals.length === 0) return null;

    const buckets: Record<number, number> = {};
    intervals.forEach((b) => {
      const bucket = Math.round(b / 4) * 4;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });

    let bestBpm = 0;
    let maxVotes = 0;
    for (const [bpmStr, count] of Object.entries(buckets)) {
      if (count > maxVotes) {
        maxVotes = count;
        bestBpm = Number(bpmStr);
      }
    }

    return bestBpm > 0 ? bestBpm : null;
  } catch (err) {
    console.warn('Auto BPM estimation failed:', err);
    return null;
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
  const tapTimestampsRef = useRef<number[]>([]);

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
          const bpm = currentCustomTrack.bpm || 160;
          const secondsPerBeat = 60.0 / bpm;
          const elapsed = currentSec - (currentCustomTrack.beatOffset || 0);
          const totalBeats = Math.floor(elapsed / secondsPerBeat);
          const beat = ((totalBeats % 8) + 8) % 8;

          setActiveBeat(beat);

          // Audio click guide on custom track if enabled
          if (customClickEnabled && lastCustomBeatRef.current !== beat) {
            lastCustomBeatRef.current = beat;
            playCustomClickSound(beat, currentCustomTrack.genre === 'salsa');
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
          }
          customAudioRef.current
            .play()
            .then(() => {
              isPlayingRef.current = true;
              setIsPlaying(true);
            })
            .catch((err) => {
              console.error('Audio play error:', err);
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

  // Handle uploading a new custom MP3/audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopAllPlayback();
      const url = URL.createObjectURL(file);
      const defaultBpm = activeGenre === 'salsa' ? 165 : 125;
      const cleanName = file.name.replace(/\.[^/.]+$/, '');

      const newTrack: CustomTrack = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        url,
        genre: activeGenre,
        bpm: defaultBpm,
        beatOffset: 0,
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

      setSyncNotice('Caricamento completato! Rilevamento ritmo in corso...');

      // Background BPM analyzer
      estimateBpmFromBlob(file).then((detected) => {
        if (detected && detected >= 100 && detected <= 220) {
          setCustomTracks((prev) =>
            prev.map((t) => (t.id === newTrack.id ? { ...t, bpm: detected } : t))
          );
          setSyncNotice(`✓ Ritmo rilevato: ${detected} BPM!`);
          setTimeout(() => setSyncNotice(null), 3500);
        } else {
          setSyncNotice('✓ Pronto! Puoi sincronizzare il tempo o usare il Tap.');
          setTimeout(() => setSyncNotice(null), 3000);
        }
      });
    }
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

  // Sync Downbeat (Tempo 1) to exact millisecond
  const handleSyncTempo1 = () => {
    if (!customAudioRef.current || !currentCustomTrack) return;
    const currentSec = customAudioRef.current.currentTime;
    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? { ...t, beatOffset: currentSec } : t))
    );
    setSyncNotice('🎯 Tempo 1 agganciato all\'istante della musica!');
    setTimeout(() => setSyncNotice(null), 2500);
  };

  // Tap Tempo functionality
  const handleTapTempo = () => {
    const now = Date.now();
    const times = tapTimestampsRef.current;
    if (times.length > 0 && now - times[times.length - 1] > 2500) {
      times.length = 0;
    }
    times.push(now);
    if (times.length > 5) {
      times.shift();
    }
    if (times.length >= 2 && currentCustomTrack) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const computed = Math.min(230, Math.max(90, Math.round(60000 / avgMs)));
      setCustomTracks((prev) =>
        prev.map((t) => (t.id === currentCustomTrack.id ? { ...t, bpm: computed } : t))
      );
      setSyncNotice(`🥁 Tap Tempo: ${computed} BPM impostato!`);
      setTimeout(() => setSyncNotice(null), 2000);
    }
  };

  // Fine BPM adjuster
  const handleUpdateCustomBpm = (newBpm: number) => {
    if (!currentCustomTrack) return;
    const clamped = Math.max(90, Math.min(230, Math.round(newBpm)));
    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? { ...t, bpm: clamped } : t))
    );
  };

  // Genre switch for custom track
  const handleToggleCustomGenre = (genre: DanceGenre) => {
    if (!currentCustomTrack) return;
    setActiveGenre(genre);
    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? { ...t, genre } : t))
    );
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
      : currentCustomTrack
      ? `${currentCustomTrack.bpm} BPM`
      : 'BPM non impostato';

  // Labels for 8 beats
  const salsaBeatLabels = [
    { num: 1, label: 'Tempo 1', sub: 'Avanti sx', strong: true },
    { num: 2, label: 'Tempo 2', sub: 'Sul posto', strong: false },
    { num: 3, label: 'Tempo 3', sub: 'Ritorno', strong: false },
    { num: 4, label: 'Pausa', sub: 'Sospensione', pause: true },
    { num: 5, label: 'Tempo 5', sub: 'Indietro dx', strong: true },
    { num: 6, label: 'Tempo 6', sub: 'Sul posto', strong: false },
    { num: 7, label: 'Tempo 7', sub: 'Ritorno', strong: false },
    { num: 8, label: 'Pausa', sub: 'Sospensione', pause: true },
  ];

  const bachataBeatLabels = [
    { num: 1, label: 'Tempo 1', sub: 'Passo sx', strong: true },
    { num: 2, label: 'Tempo 2', sub: 'Chiudi dx', strong: false },
    { num: 3, label: 'Tempo 3', sub: 'Passo sx', strong: false },
    { num: 4, label: 'TAP', sub: 'Anca sx ✨', tap: true },
    { num: 5, label: 'Tempo 5', sub: 'Passo dx', strong: true },
    { num: 6, label: 'Tempo 6', sub: 'Chiudi sx', strong: false },
    { num: 7, label: 'Tempo 7', sub: 'Passo dx', strong: false },
    { num: 8, label: 'TAP', sub: 'Anca dx ✨', tap: true },
  ];

  const beatLabels = effectiveGenre === 'salsa' ? salsaBeatLabels : bachataBeatLabels;

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
                    accept="audio/*"
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

              {/* STRUMENTI DI SINCRONIZZAZIONE PER LA CANZONE ATTIVA */}
              {currentCustomTrack && (
                <div className="glass-card p-3.5 space-y-3 border border-[#F9C03E]/40">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#88A5BF]/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#F9C03E]" />
                      <span>Sincronizzazione Ritmo: {currentCustomTrack.name}</span>
                    </span>
                  </div>

                  {/* 1. Scelta Genere per il conteggio */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-300">Stile di ballo:</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleToggleCustomGenre('salsa')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          currentCustomTrack.genre === 'salsa'
                            ? 'bg-[#234C77] text-white border-[#F9C03E]'
                            : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                        }`}
                      >
                        💃 Salsa
                      </button>
                      <button
                        onClick={() => handleToggleCustomGenre('bachata')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          currentCustomTrack.genre === 'bachata'
                            ? 'bg-[#234C77] text-white border-[#F9C03E]'
                            : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                        }`}
                      >
                        ✨ Bachata
                      </button>
                    </div>
                  </div>

                  {/* 2. Sincronizzazione Tempo 1 & Tap Tempo */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleSyncTempo1}
                      title="Allinea il Tempo 1 al punto attuale della canzone"
                      className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      <Target className="w-4 h-4 text-amber-200" />
                      <span>Sincronizza Tempo 1</span>
                    </button>

                    <button
                      onClick={handleTapTempo}
                      title="Premi a tempo per impostare il BPM"
                      className="p-2.5 rounded-xl bg-[#234C77] hover:bg-[#88A5BF]/40 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-[#88A5BF]/40 shadow-sm cursor-pointer transition-all active:scale-95"
                    >
                      <span>🥁 Tap Tempo</span>
                    </button>
                  </div>

                  {/* 3. Regolazione BPM Fine & Preset */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Velocità BPM:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateCustomBpm(currentCustomTrack.bpm - 5)}
                          className="px-1.5 py-0.5 rounded bg-[#021831] hover:bg-[#234C77] text-slate-300 text-[10px] font-mono border border-[#88A5BF]/25"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleUpdateCustomBpm(currentCustomTrack.bpm - 1)}
                          className="px-1.5 py-0.5 rounded bg-[#021831] hover:bg-[#234C77] text-slate-300 text-[10px] font-mono border border-[#88A5BF]/25"
                        >
                          -1
                        </button>
                        <span className="font-mono font-bold text-sm text-[#F9C03E] px-2 py-0.5 rounded bg-[#021831] border border-[#F9C03E]/40">
                          {currentCustomTrack.bpm} BPM
                        </span>
                        <button
                          onClick={() => handleUpdateCustomBpm(currentCustomTrack.bpm + 1)}
                          className="px-1.5 py-0.5 rounded bg-[#021831] hover:bg-[#234C77] text-slate-300 text-[10px] font-mono border border-[#88A5BF]/25"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleUpdateCustomBpm(currentCustomTrack.bpm + 5)}
                          className="px-1.5 py-0.5 rounded bg-[#021831] hover:bg-[#234C77] text-slate-300 text-[10px] font-mono border border-[#88A5BF]/25"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    {/* Preset rapidi di velocità */}
                    <div className="flex gap-1.5 pt-1">
                      {currentCustomTrack.genre === 'salsa' ? (
                        <>
                          <button
                            onClick={() => handleUpdateCustomBpm(148)}
                            className="flex-1 py-1 rounded-lg text-[10px] bg-[#021831] hover:bg-[#234C77] text-slate-300 border border-[#88A5BF]/20"
                          >
                            Lenta (148)
                          </button>
                          <button
                            onClick={() => handleUpdateCustomBpm(165)}
                            className="flex-1 py-1 rounded-lg text-[10px] bg-[#021831] hover:bg-[#234C77] text-slate-300 border border-[#88A5BF]/20"
                          >
                            Media (165)
                          </button>
                          <button
                            onClick={() => handleUpdateCustomBpm(185)}
                            className="flex-1 py-1 rounded-lg text-[10px] bg-[#021831] hover:bg-[#234C77] text-slate-300 border border-[#88A5BF]/20"
                          >
                            Veloce (185)
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateCustomBpm(118)}
                            className="flex-1 py-1 rounded-lg text-[10px] bg-[#021831] hover:bg-[#234C77] text-slate-300 border border-[#88A5BF]/20"
                          >
                            Sensual (118)
                          </button>
                          <button
                            onClick={() => handleUpdateCustomBpm(126)}
                            className="flex-1 py-1 rounded-lg text-[10px] bg-[#021831] hover:bg-[#234C77] text-slate-300 border border-[#88A5BF]/20"
                          >
                            Classica (126)
                          </button>
                          <button
                            onClick={() => handleUpdateCustomBpm(134)}
                            className="flex-1 py-1 rounded-lg text-[10px] bg-[#021831] hover:bg-[#234C77] text-slate-300 border border-[#88A5BF]/20"
                          >
                            Moderna (134)
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 4. Click Guida Ritmico Toggle */}
                  <div className="pt-1 border-t border-[#88A5BF]/20 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      {customClickEnabled ? <Bell className="w-3.5 h-3.5 text-[#F9C03E]" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Click audio di guida sui tempi</span>
                    </div>
                    <button
                      onClick={() => setCustomClickEnabled((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                        customClickEnabled
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-[#021831] text-slate-400 border-[#88A5BF]/20'
                      }`}
                    >
                      {customClickEnabled ? 'Attivo' : 'Spento'}
                    </button>
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
                                {track.genre === 'salsa' ? 'Salsa' : 'Bachata'} • {track.bpm} BPM
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

          {/* BEAT VISUALIZER 1 A 8 - SINCRONIZZATO E CON COLORI UFFICIALI */}
          <div className="glass-card p-4 text-center space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Conteggio Battute (8 Tempi)</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#F9C03E]">
                {sourceMode === 'catalog' && currentChordName
                  ? `Accordo: ${currentChordName}`
                  : activeBpmInfo}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
              {beatLabels.map((item, idx) => {
                // Sincronizzato con precisione audio
                const isActive = isPlaying && activeBeat === idx;
                const isStrong = item.strong;
                const isTap = 'tap' in item && item.tap;

                let padClasses = 'bg-[#021831]/70 border border-[#88A5BF]/20 text-slate-300';
                if (isActive) {
                  if (isStrong) {
                    padClasses = 'bg-[#F9C03E] text-[#042B58] border border-[#F9C03E] shadow-lg shadow-[#F9C03E]/30 scale-105 font-bold';
                  } else if (isTap) {
                    padClasses = 'bg-gradient-to-r from-[#F9C03E] to-[#e6a820] text-[#042B58] border border-[#F9C03E] shadow-lg shadow-[#F9C03E]/30 scale-105 font-bold';
                  } else {
                    padClasses = 'bg-[#234C77] text-white border border-[#88A5BF]/60 shadow-md shadow-[#234C77]/40 scale-105 font-bold';
                  }
                } else if (isStrong) {
                  padClasses = 'bg-[#021831]/80 border border-[#F9C03E]/30 text-[#F9C03E]';
                } else if (isTap) {
                  padClasses = 'bg-[#021831]/80 border border-[#F9C03E]/20 text-amber-200/80';
                }

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all duration-75 ${padClasses}`}
                  >
                    <span className="text-base sm:text-lg font-bold font-mono">
                      {item.num}
                    </span>
                    <span
                      className={`text-[8px] sm:text-[9px] font-semibold uppercase leading-tight truncate w-full text-center mt-0.5 ${
                        isActive
                          ? isStrong || isTap
                            ? 'text-[#042B58]'
                            : 'text-white'
                          : isStrong
                          ? 'text-[#F9C03E]'
                          : 'text-slate-300'
                      }`}
                    >
                      {item.sub}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-0.5 text-center">
              <span className="text-[11px] text-slate-300">
                {isPlaying && activeBeat >= 0 ? (
                  <>
                    <strong className="text-white">Tempo {activeBeat + 1}:</strong>{' '}
                    <span className="text-[#F9C03E] font-medium">
                      {beatLabels[activeBeat].sub}
                    </span>
                  </>
                ) : (
                  'Musica ferma • Premi Riproduci per avviare il brano e i conteggi'
                )}
              </span>
            </div>
          </div>

          {/* Consiglio di Andrea Frattesi per l'ascolto */}
          <div className="glass-card p-4 space-y-1.5 text-left border border-[#F9C03E]/30">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F9C03E]">
              <Sparkles className="w-3.5 h-3.5 text-[#F9C03E]" />
              <span>Il Consiglio di Andrea per Sentire la Musica:</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              {effectiveGenre === 'salsa'
                ? '«Nella Salsa non contare nella testa come un robot: ascolta il basso e il pianoforte. Il basso entra sul battere che ti lancia sul tempo 1. Se impari a sentire quel respiro, il tuo corpo si muoverà prima ancora che tu ci pensi.»'
                : '«Nella Bachata la chitarra canta la melodia, ma è il colpo acuto del bongò che ti chiama il Tap sul tempo 4 e 8. Quando senti il Tap, solleva appena il tallone senza appoggiare il peso: ecco la magia della connessione fluida.»'}
            </p>
          </div>
        </div>

        {/* Stable Audio Element for Custom Files */}
        <audio
          ref={customAudioRef}
          preload="auto"
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
        />
      </div>
    </div>
  );
};
