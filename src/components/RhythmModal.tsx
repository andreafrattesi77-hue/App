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
} from 'lucide-react';
import {
  harmonizedEngine,
  MUSIC_TRACKS,
  MusicTrack,
  DanceGenre,
  RhythmMixer,
} from '../services/rhythmAudio';

interface RhythmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RhythmModal: React.FC<RhythmModalProps> = ({ isOpen, onClose }) => {
  const [activeGenre, setActiveGenre] = useState<DanceGenre>('salsa');
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack>(MUSIC_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [currentChordName, setCurrentChordName] = useState<string>('');
  const [bpm, setBpm] = useState<number>(MUSIC_TRACKS[0].bpm);

  const [mixer, setMixer] = useState<RhythmMixer>({
    harmony: true,
    bass: true,
    countVoice: true,
    percussion: true,
  });

  // Custom user MP3 audio state
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    harmonizedEngine.setOnBeat((beat, chordName) => {
      setActiveBeat(beat);
      setCurrentChordName(chordName);
    });

    return () => {
      harmonizedEngine.stop();
      harmonizedEngine.setOnBeat(() => {});
      if (customAudioRef.current) {
        customAudioRef.current.pause();
      }
    };
  }, []);

  const handleSelectTrack = (track: MusicTrack) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      harmonizedEngine.stop();
    }
    setSelectedTrack(track);
    setActiveGenre(track.genre);
    harmonizedEngine.selectTrack(track.id);
    setBpm(track.bpm);
    setActiveBeat(-1);
    setCurrentChordName('');

    if (wasPlaying) {
      harmonizedEngine.start();
    }
  };

  const handleSelectGenre = (genre: DanceGenre) => {
    setActiveGenre(genre);
    const firstForGenre = MUSIC_TRACKS.find((t) => t.genre === genre) || MUSIC_TRACKS[0];
    handleSelectTrack(firstForGenre);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      harmonizedEngine.stop();
      setIsPlaying(false);
      setActiveBeat(-1);
      if (customAudioRef.current) {
        customAudioRef.current.pause();
      }
    } else {
      harmonizedEngine.selectTrack(selectedTrack.id);
      harmonizedEngine.setBpm(bpm);
      harmonizedEngine.mixer = { ...mixer };
      harmonizedEngine.start();
      setIsPlaying(true);

      if (customAudioRef.current && customAudioUrl) {
        customAudioRef.current.currentTime = 0;
        customAudioRef.current.play().catch(() => {});
      }
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(90, Math.min(230, newBpm));
    setBpm(clamped);
    harmonizedEngine.setBpm(clamped);
  };

  const handleToggleMixer = (key: keyof RhythmMixer) => {
    const updated = {
      ...mixer,
      [key]: !mixer[key],
    };
    setMixer(updated);
    harmonizedEngine.mixer = updated;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAudioUrl(url);
      setCustomAudioName(file.name);
    }
  };

  const handleClose = () => {
    if (isPlaying) {
      harmonizedEngine.stop();
      setIsPlaying(false);
      setActiveBeat(-1);
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentGenreTracks = MUSIC_TRACKS.filter((t) => t.genre === activeGenre);

  // Labels for beats
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#234C77]/60 to-transparent border-b border-[#88A5BF]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#021831] border border-[#F9C03E]/40 flex items-center justify-center text-[#F9C03E] shadow-sm">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide flex items-center gap-2">
                <span>Musica & Allenatore di Ritmo</span>
              </h2>
              <p className="text-xs text-[#88A5BF]">
                Brani armonici per allenare l'orecchio a Salsa e Bachata
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#021831]/80 hover:bg-[#234C77] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Selettore Stile: Salsa vs Bachata */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#021831]/90 rounded-2xl border border-[#88A5BF]/25">
            <button
              onClick={() => handleSelectGenre('salsa')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeGenre === 'salsa'
                  ? 'bg-gradient-to-r from-[#F9C03E] to-[#e6a820] text-[#042B58] shadow-md scale-[1.01]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>💃 Salsa (Cubana & Portoricana)</span>
            </button>
            <button
              onClick={() => handleSelectGenre('bachata')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeGenre === 'bachata'
                  ? 'bg-gradient-to-r from-[#F9C03E] to-[#e6a820] text-[#042B58] shadow-md scale-[1.01]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🕺 Bachata (Sensual & Dominicana)</span>
            </button>
          </div>

          {/* Scegli il Brano (Playlist Musicale Armonica) */}
          <div className="glass-card p-3.5 rounded-2xl border border-[#88A5BF]/30 space-y-2 text-left">
            <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Scegli il Brano Musicale</span>
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                {currentGenreTracks.length} brani armonici
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {currentGenreTracks.map((track) => {
                const isSelected = selectedTrack.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#234C77] border-[#F9C03E] shadow-md scale-[1.01]'
                        : 'bg-[#021831]/80 hover:bg-[#234C77]/40 border-[#88A5BF]/25 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {track.title}
                        </span>
                        {isSelected && isPlaying && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#F9C03E] mt-0.5 line-clamp-1">
                        {track.mood}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {track.description}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-xs font-mono font-bold text-[#F9C03E] block">
                        {track.bpm} BPM
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400">
                        {isSelected ? 'In riproduzione' : 'Seleziona'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Beat Visualizer 1 a 8 sincronizzato con gli accordi */}
          <div className="glass-card p-4 rounded-2xl border border-[#88A5BF]/30 text-center space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5" />
                <span>Conteggio Battute (8 Tempi)</span>
              </span>
              <span className="text-xs font-bold font-mono text-[#F9C03E]">
                {currentChordName ? `Accordo: ${currentChordName}` : `BPM: ${bpm}`}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2 pt-1">
              {beatLabels.map((item, idx) => {
                const isActive = activeBeat === idx;
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
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-100 ${borderBg}`}
                  >
                    <span className="text-base sm:text-lg font-bold font-mono">
                      {item.num}
                    </span>
                    <span
                      className={`text-[9px] font-semibold uppercase leading-tight truncate w-full text-center mt-0.5 ${
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

            <div className="pt-1 flex items-center justify-center gap-2">
              <span className="text-xs text-slate-300">
                {activeBeat >= 0 ? (
                  <>
                    <strong className="text-white">
                      Tempo {activeBeat + 1}:
                    </strong>{' '}
                    <span className="text-[#F9C03E] font-medium">
                      {beatLabels[activeBeat].sub}
                    </span>
                  </>
                ) : (
                  'Premi Play per avviare il brano e sentire la band'
                )}
              </span>
            </div>
          </div>

          {/* Controlli Principali (Play/Stop + BPM) */}
          <div className="glass-card p-4 rounded-2xl border border-[#88A5BF]/30 space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePlay}
                className={`py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shrink-0 ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                    : 'gold-gradient-btn hover:brightness-105 shadow-[#F9C03E]/30'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>Ferma</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-[#042B58]" />
                    <span>Riproduci Brano</span>
                  </>
                )}
              </button>

              <div className="flex-1 bg-[#021831]/80 p-2.5 rounded-xl border border-[#88A5BF]/25 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#88A5BF] uppercase font-bold block">
                    Velocità
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-white">
                      {bpm}
                    </span>
                    <span className="text-[10px] text-slate-400">BPM</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleBpmChange(bpm - 5)}
                    className="w-7 h-7 rounded-lg bg-[#234C77] text-white font-bold text-xs flex items-center justify-center hover:bg-[#88A5BF]/30 cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleBpmChange(bpm + 5)}
                    className="w-7 h-7 rounded-lg bg-[#234C77] text-white font-bold text-xs flex items-center justify-center hover:bg-[#88A5BF]/30 cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={activeGenre === 'salsa' ? 130 : 95}
                max={activeGenre === 'salsa' ? 220 : 155}
                value={bpm}
                onChange={(e) => handleBpmChange(Number(e.target.value))}
                className="w-full accent-[#F9C03E] cursor-pointer"
              />
            </div>
          </div>

          {/* Mixer Componenti Armoniche (Accendi e Spegni gli Strumenti) */}
          <div className="glass-card p-4 rounded-2xl border border-[#88A5BF]/30 space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Mixer Strumenti (Attiva / Disattiva)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleToggleMixer('harmony')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  mixer.harmony
                    ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                    : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                }`}
              >
                <span>🎹 {activeGenre === 'salsa' ? 'Piano Montuno' : 'Chitarra Arpeggiata'}</span>
                {mixer.harmony ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              <button
                onClick={() => handleToggleMixer('bass')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  mixer.bass
                    ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                    : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                }`}
              >
                <span>🎸 Basso Latino</span>
                {mixer.bass ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              <button
                onClick={() => handleToggleMixer('percussion')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  mixer.percussion
                    ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                    : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                }`}
              >
                <span>🥁 {activeGenre === 'salsa' ? 'Congas & Clave' : 'Güira & Bongò'}</span>
                {mixer.percussion ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              <button
                onClick={() => handleToggleMixer('countVoice')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  mixer.countVoice
                    ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                    : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                }`}
              >
                <span>🔢 Guida Tempi (Click)</span>
                {mixer.countVoice ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Carica il tuo brano MP3 / Audio personale */}
          <div className="p-3.5 rounded-2xl bg-[#021831]/70 border border-[#88A5BF]/25 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Vuoi allenarti con una tua canzone (MP3)?</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-300">
              Carica una canzone dalla tua libreria per ascoltarla mentre alleni il conteggio dei tempi.
            </p>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#234C77] file:text-white hover:file:bg-[#88A5BF]/30 cursor-pointer"
            />
            {customAudioName && (
              <p className="text-[10px] text-emerald-400 font-medium">
                ✓ Canzone caricata: {customAudioName}
              </p>
            )}
            {customAudioUrl && (
              <audio ref={customAudioRef} src={customAudioUrl} />
            )}
          </div>

          {/* Pillola Pratica di Andrea Frattesi */}
          <div className="p-3.5 rounded-2xl bg-[#021831]/80 border border-[#F9C03E]/30 space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#F9C03E]">
              <Sparkles className="w-4 h-4 text-[#F9C03E]" />
              <span>Il Consiglio di Andrea per Sentire l'Armonia:</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {activeGenre === 'salsa'
                ? '«Il pianoforte e il basso nella Salsa non sono solo melodia: sono la tua bussola. Il basso entra sempre sul battere che prepara l’1. Se ascolti il respiro degli strumenti invece di contare rigidamente nella testa, il tuo corpo si muoverà prima ancora che tu ci pensi.»'
                : '«Nella Bachata la chitarra canta la melodia, ma è il bongò che ti chiama il Tap sul tempo 4 e 8. Quando senti il colpo acuto del bongò, solleva appena il tallone senza caricare il peso: ecco la magia della connessione fluida.»'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
