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
  Check,
  RotateCcw,
  Plus,
  FileMusic,
  Disc3,
  Pause,
} from 'lucide-react';
import {
  harmonizedEngine,
  MUSIC_TRACKS,
  MusicTrack,
  DanceGenre,
  RhythmMixer,
} from '../services/rhythmAudio';

interface CustomTrack {
  id: string;
  name: string;
  url: string;
}

interface RhythmModalProps {
  isOpen: boolean;
  onClose: () => void;
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

  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const beatIntervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Stop everything immediately: both audio and beat counts
  const stopAllPlayback = () => {
    // 1. Synthesizer engine stop
    harmonizedEngine.stop();

    // 2. Custom audio pause
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }

    // 3. Clear simulated beat interval
    if (beatIntervalRef.current !== null) {
      window.clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }

    // 4. Force state to inactive
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveBeat(-1);
    setCurrentChordName('');
  };

  // Setup synthesizer engine callbacks
  useEffect(() => {
    harmonizedEngine.setOnBeat((beat, chordName) => {
      // Non fare avanzare mai i conteggi se la musica è spenta o in pausa
      if (!isPlayingRef.current) {
        setActiveBeat(-1);
        setCurrentChordName('');
        return;
      }
      setActiveBeat(beat);
      setCurrentChordName(chordName);
    });

    return () => {
      stopAllPlayback();
      harmonizedEngine.setOnBeat(() => {});
    };
  }, []);

  // When switching or selecting a catalog track
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
  };

  // Toggle Play / Stop
  const handleTogglePlay = () => {
    if (isPlayingRef.current) {
      // STOP PLAYBACK COMPLETELY: ferma musica e azzera conteggi
      stopAllPlayback();
    } else {
      // START PLAYBACK
      if (sourceMode === 'catalog') {
        stopAllPlayback();
        harmonizedEngine.selectTrack(selectedTrack.id);
        harmonizedEngine.mixer = { ...mixer };
        harmonizedEngine.start();
        isPlayingRef.current = true;
        setIsPlaying(true);
      } else {
        stopAllPlayback();
        if (customAudioRef.current && currentCustomTrack) {
          customAudioRef.current.play().then(() => {
            isPlayingRef.current = true;
            setIsPlaying(true);

            let b = 0;
            if (beatIntervalRef.current !== null) {
              window.clearInterval(beatIntervalRef.current);
            }
            beatIntervalRef.current = window.setInterval(() => {
              if (!isPlayingRef.current) {
                if (beatIntervalRef.current !== null) {
                  window.clearInterval(beatIntervalRef.current);
                  beatIntervalRef.current = null;
                }
                setActiveBeat(-1);
                return;
              }
              setActiveBeat(b);
              b = (b + 1) % 8;
            }, 460);
          }).catch((err) => {
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
      const newTrack: CustomTrack = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        url,
      };

      setCustomTracks((prev) => [newTrack, ...prev]);
      setSelectedCustomId(newTrack.id);
      setSourceMode('custom');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      } else {
        setSelectedCustomId(null);
        setSourceMode('catalog');
      }
    }
  };

  // Close modal safely
  const handleClose = () => {
    stopAllPlayback();
    onClose();
  };

  if (!isOpen) return null;

  const currentGenreTracks = MUSIC_TRACKS.filter((t) => t.genre === activeGenre);
  const currentCustomTrack = customTracks.find((t) => t.id === selectedCustomId);

  // Active track details to display
  const activeTitle =
    sourceMode === 'catalog'
      ? selectedTrack.title
      : currentCustomTrack?.name || 'Nessuna canzone selezionata';

  const activeGenreLabel =
    sourceMode === 'catalog'
      ? selectedTrack.genre === 'salsa'
        ? 'Salsa'
        : 'Bachata'
      : 'Audio Personale';

  const activeBpmInfo =
    sourceMode === 'catalog'
      ? `${selectedTrack.bpm} BPM`
      : 'Audio Utente';

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

  const beatLabels = activeGenre === 'salsa' ? salsaBeatLabels : bachataBeatLabels;

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#234C77]/60 to-transparent border-b border-[#88A5BF]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#021831] border border-[#F9C03E]/40 flex items-center justify-center text-[#F9C03E] shadow-sm">
              <Music className={`w-5 h-5 ${isPlaying ? 'animate-pulse text-[#F9C03E]' : ''}`} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide">
                Musica & Allenatore di Ritmo
              </h2>
              <p className="text-xs text-[#88A5BF]">
                Brani armonici Salsa & Bachata o la tua musica personale
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full bg-[#021831]/80 hover:bg-[#234C77] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-left">
          {/* Card Canzone Attualmente Scelta + Controllo Principale Play */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#021831] to-[#234C77]/60 border border-[#F9C03E]/40 shadow-lg space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5">
                  <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
                  <span>Canzone in Ascolto:</span>
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                  {activeTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#234C77] text-slate-200 border border-[#88A5BF]/30">
                    {activeGenreLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F9C03E]/15 text-[#F9C03E] border border-[#F9C03E]/30">
                    {activeBpmInfo}
                  </span>
                </div>
              </div>

              {/* Tasto Play / Ferma */}
              <button
                onClick={handleTogglePlay}
                disabled={sourceMode === 'custom' && !currentCustomTrack}
                className={`py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shrink-0 ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                    : 'gold-gradient-btn hover:brightness-105 shadow-[#F9C03E]/30 text-[#042B58]'
                } ${sourceMode === 'custom' && !currentCustomTrack ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>Ferma</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-[#042B58]" />
                    <span>Riproduci</span>
                  </>
                )}
              </button>
            </div>

            {/* Custom Audio Progress Bar (se la sorgente è un file utente) */}
            {sourceMode === 'custom' && currentCustomTrack && (
              <div className="pt-2 border-t border-[#88A5BF]/20 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
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
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#021831]/90 rounded-2xl border border-[#88A5BF]/25">
            <button
              onClick={() => {
                stopAllPlayback();
                setSourceMode('catalog');
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'catalog'
                  ? 'bg-gradient-to-r from-[#F9C03E] to-[#e6a820] text-[#042B58] shadow-md'
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
              className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'custom'
                  ? 'bg-gradient-to-r from-[#F9C03E] to-[#e6a820] text-[#042B58] shadow-md'
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
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    activeGenre === 'salsa'
                      ? 'bg-[#234C77] text-white border-[#F9C03E]'
                      : 'bg-[#021831]/60 text-slate-300 border-[#88A5BF]/20 hover:text-white'
                  }`}
                >
                  <span>💃 Salsa (6 brani)</span>
                </button>
                <button
                  onClick={() => handleSelectGenre('bachata')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    activeGenre === 'bachata'
                      ? 'bg-[#234C77] text-white border-[#F9C03E]'
                      : 'bg-[#021831]/60 text-slate-300 border-[#88A5BF]/20 hover:text-white'
                  }`}
                >
                  <span>🕺 Bachata (6 brani)</span>
                </button>
              </div>

              {/* Lista Brani del Metodo con Selezione Immediata */}
              <div className="glass-card p-3 rounded-2xl border border-[#88A5BF]/30 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>Seleziona un brano da ascoltare</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Clicca su una canzone per sceglierla
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
                  {currentGenreTracks.map((track) => {
                    const isSelected = sourceMode === 'catalog' && selectedTrack.id === track.id;
                    return (
                      <button
                        key={track.id}
                        onClick={() => handleSelectCatalogTrack(track)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#234C77] border-[#F9C03E] shadow-md scale-[1.01]'
                            : 'bg-[#021831]/80 hover:bg-[#234C77]/40 border-[#88A5BF]/25 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {track.title}
                            </span>
                            {isSelected && isPlaying && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#F9C03E] mt-0.5 truncate">
                            {track.mood}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {track.description}
                          </p>
                        </div>

                        <div className="shrink-0 text-right pl-2">
                          <span className="text-xs font-mono font-bold text-[#F9C03E] block">
                            {track.bpm} BPM
                          </span>
                          <span className={`text-[9px] uppercase tracking-wider font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Scelta' : 'Scegli'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mixer Strumenti per il Brano Attivo */}
              <div className="glass-card p-3 rounded-2xl border border-[#88A5BF]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Mixer Strumenti (Attiva / Disattiva)</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleToggleMixer('harmony')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.harmony
                        ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span className="truncate">🎹 {activeGenre === 'salsa' ? 'Piano Montuno' : 'Chitarra Arpeggiata'}</span>
                    {mixer.harmony ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#F9C03E] shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleMixer('bass')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.bass
                        ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span>🎸 Basso Latino</span>
                    {mixer.bass ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#F9C03E] shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleMixer('percussion')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.percussion
                        ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span className="truncate">🥁 {activeGenre === 'salsa' ? 'Congas & Clave' : 'Güira & Bongò'}</span>
                    {mixer.percussion ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#F9C03E] shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleMixer('countVoice')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.countVoice
                        ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span>🔢 Click Tempi</span>
                    {mixer.countVoice ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#F9C03E] shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEZIONE 2: LE MIE CANZONI PERSONALI */}
          {sourceMode === 'custom' && (
            <div className="space-y-3">
              {/* Tasto Carica Canzone */}
              <div className="p-3.5 rounded-2xl bg-[#021831]/90 border border-[#F9C03E]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#F9C03E]" />
                    <span>Carica una Canzone dalla tua libreria (MP3/Audio)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Puoi caricare più canzoni e passare liberamente dall'una all'altra ogni volta che vuoi.
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
                    className="py-2 px-3.5 rounded-xl bg-[#234C77] hover:bg-[#88A5BF]/30 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F9C03E]" />
                    <span>{customTracks.length > 0 ? 'Aggiungi un\'altra canzone' : 'Seleziona file audio MP3'}</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Nessun limite di canzoni
                  </span>
                </div>
              </div>

              {/* Lista delle canzoni caricate */}
              <div className="glass-card p-3 rounded-2xl border border-[#88A5BF]/30 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5">
                    <FileMusic className="w-3.5 h-3.5" />
                    <span>Le tue canzoni disponibili ({customTracks.length})</span>
                  </span>
                  {customTracks.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      Clicca su una canzone per sceglierla
                    </span>
                  )}
                </div>

                {customTracks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                    <p>Non hai ancora caricato nessuna canzone personale.</p>
                    <p className="text-[11px] text-[#F9C03E]">
                      Clicca sul pulsante sopra per caricare un MP3, oppure torna ai brani del Metodo!
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
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#234C77] border-[#F9C03E] shadow-md scale-[1.01]'
                              : 'bg-[#021831]/80 hover:bg-[#234C77]/40 border-[#88A5BF]/25 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">
                                {track.name}
                              </span>
                              {isSelected && isPlaying && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-[#F9C03E] block mt-0.5">
                              {isSelected ? '✓ Canzone selezionata' : 'Clicca per selezionare'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => handleDeleteCustomTrack(track.id, e)}
                              title="Rimuovi questa canzone"
                              className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
                  className="w-full py-2.5 px-3 rounded-xl bg-[#021831] border border-[#88A5BF]/30 hover:border-[#F9C03E] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#F9C03E]" />
                  <span>Torna ai brani del Metodo (Salsa & Bachata)</span>
                </button>
              </div>
            </div>
          )}

          {/* BEAT VISUALIZER 1 A 8 SINCRONIZZATO */}
          <div className="glass-card p-3.5 rounded-2xl border border-[#88A5BF]/30 text-center space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5" />
                <span>Conteggio Battute (8 Tempi)</span>
              </span>
              <span className="text-xs font-bold font-mono text-[#F9C03E]">
                {sourceMode === 'catalog' && currentChordName
                  ? `Accordo: ${currentChordName}`
                  : activeBpmInfo}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
              {beatLabels.map((item, idx) => {
                // Il conteggio è visivamente attivo SOLO quando la musica è in riproduzione
                const isActive = isPlaying && activeBeat === idx;
                const isStrong = item.strong;
                const isTap = 'tap' in item && item.tap;
                const isPause = 'pause' in item && item.pause;

                let borderBg = 'bg-[#021831]/80 border-[#88A5BF]/25 text-slate-300';
                if (isActive) {
                  borderBg = isTap
                    ? 'bg-pink-500 border-pink-300 text-white shadow-lg shadow-pink-500/50 scale-105'
                    : isStrong
                    ? 'bg-[#F9C03E] border-amber-200 text-[#042B58] shadow-lg shadow-[#F9C03E]/50 scale-105'
                    : 'bg-[#234C77] border-cyan-400 text-white shadow-md scale-105';
                } else if (isStrong) {
                  borderBg = 'bg-[#021831]/90 border-[#F9C03E]/40 text-[#F9C03E]';
                } else if (isTap) {
                  borderBg = 'bg-[#021831]/90 border-pink-400/30 text-pink-300';
                }

                return (
                  <div
                    key={idx}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-100 ${borderBg}`}
                  >
                    <span className="text-sm sm:text-base font-bold font-mono">
                      {item.num}
                    </span>
                    <span
                      className={`text-[8px] sm:text-[9px] font-semibold uppercase leading-tight truncate w-full text-center mt-0.5 ${
                        isActive
                          ? isStrong
                            ? 'text-[#042B58]'
                            : 'text-white'
                          : isTap
                          ? 'text-pink-300'
                          : isPause
                          ? 'text-slate-400'
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
                  'Musica spenta • Premi Riproduci per avviare la canzone e i conteggi'
                )}
              </span>
            </div>
          </div>

          {/* Consiglio di Andrea Frattesi per l'ascolto */}
          <div className="p-3 rounded-2xl bg-[#021831]/80 border border-[#F9C03E]/30 space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#F9C03E]">
              <Sparkles className="w-3.5 h-3.5 text-[#F9C03E]" />
              <span>Il Consiglio di Andrea per Sentire la Musica:</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              {activeGenre === 'salsa'
                ? '«Nella Salsa non contare nella testa come un robot: ascolta il basso e il pianoforte. Il basso entra sul battere che ti lancia sul tempo 1. Se impari a sentire quel respiro, il tuo corpo si muoverà prima ancora che tu ci pensi.»'
                : '«Nella Bachata la chitarra canta la melodia, ma è il colpo acuto del bongò che ti chiama il Tap sul tempo 4 e 8. Quando senti il Tap, solleva appena il tallone senza appoggiare il peso: ecco la magia della connessione fluida.»'}
            </p>
          </div>
        </div>

        {/* Hidden Audio Element for Custom Files */}
        {currentCustomTrack && (
          <audio
            ref={customAudioRef}
            src={currentCustomTrack.url}
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
            onPause={() => {
              stopAllPlayback();
            }}
            onEnded={() => {
              stopAllPlayback();
            }}
            onError={() => {
              stopAllPlayback();
            }}
            onEmptied={() => {
              stopAllPlayback();
            }}
          />
        )}
      </div>
    </div>
  );
};
