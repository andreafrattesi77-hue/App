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
  const isPlayingRef = useRef<boolean>(false);

  // Stop everything immediately: both audio and beat visualizer
  const stopAllPlayback = () => {
    // 1. Synthesizer engine stop
    harmonizedEngine.stop();

    // 2. Custom audio pause
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }

    // 3. Force state to inactive
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveBeat(-1);
    setCurrentChordName('');
  };

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
          !customAudioRef.current.paused
        ) {
          const currentSec = customAudioRef.current.currentTime;
          // Calculate beat from playback timestamp: Salsa ~172 BPM, Bachata ~125 BPM
          const targetBpm = activeGenre === 'salsa' ? 172 : 125;
          const secondsPerBeat = 60.0 / targetBpm;
          const beat = Math.floor(currentSec / secondsPerBeat) % 8;
          setActiveBeat(beat);
        }
      } else {
        setActiveBeat(-1);
      }
      animId = requestAnimationFrame(syncBeatWithAudio);
    };

    animId = requestAnimationFrame(syncBeatWithAudio);
    return () => cancelAnimationFrame(animId);
  }, [sourceMode, activeGenre]);

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
        harmonizedEngine.start().then(() => {
          isPlayingRef.current = true;
          setIsPlaying(true);
        }).catch((err) => {
          console.error('Harmonized engine start error:', err);
          stopAllPlayback();
        });
      } else {
        stopAllPlayback();
        if (customAudioRef.current && currentCustomTrack) {
          customAudioRef.current.play().then(() => {
            isPlayingRef.current = true;
            setIsPlaying(true);
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
      : 'Audio Personale';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021831]/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden my-auto">
        {/* Header - Identico alle Impostazioni */}
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
                  <span>Brano Selezionato</span>
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
                  <span>🕺 Bachata (6 brani)</span>
                </button>
              </div>

              {/* Lista Brani del Metodo */}
              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#F9C03E]" />
                    <span>Seleziona un brano</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Clicca per scegliere
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1 max-h-52 overflow-y-auto pr-1">
                  {currentGenreTracks.map((track) => {
                    const isSelected = sourceMode === 'catalog' && selectedTrack.id === track.id;
                    return (
                      <button
                        key={track.id}
                        onClick={() => handleSelectCatalogTrack(track)}
                        className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#234C77] border-[#F9C03E]/70 shadow-sm'
                            : 'bg-[#021831]/70 hover:bg-[#234C77]/40 border-[#88A5BF]/25 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {track.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#F9C03E] mt-0.5 truncate">
                            {track.mood}
                          </p>
                        </div>

                        <div className="shrink-0 text-right pl-2">
                          <span className="text-xs font-mono font-bold text-[#F9C03E] block">
                            {track.bpm} BPM
                          </span>
                          <span className={`text-[9px] uppercase tracking-wider font-semibold ${isSelected ? 'text-[#F9C03E]' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Attivo' : 'Scegli'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mixer Strumenti per il Brano Attivo */}
              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Mixer Strumenti</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleToggleMixer('harmony')}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      mixer.harmony
                        ? 'bg-[#234C77] border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span className="truncate">🎹 {activeGenre === 'salsa' ? 'Piano Montuno' : 'Chitarra'}</span>
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
                        ? 'bg-[#234C77] border-[#F9C03E]/40 text-white'
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
                        ? 'bg-[#234C77] border-[#F9C03E]/40 text-white'
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
                        ? 'bg-[#234C77] border-[#F9C03E]/40 text-white'
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
              <div className="glass-card p-4 space-y-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#F9C03E]" />
                  <span>Carica una Canzone (MP3/Audio)</span>
                </span>
                <p className="text-[11px] text-[#88A5BF]">
                  Carica brani dalla tua libreria per allenare il ritmo.
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
                            <span className="text-[10px] text-[#F9C03E] block mt-0.5">
                              {isSelected ? '✓ Selezionata' : 'Clicca per scegliere'}
                            </span>
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
