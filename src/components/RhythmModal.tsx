import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  Info,
  Footprints,
  Flame,
} from 'lucide-react';
import {
  rhythmEngine,
  DanceGenre,
  RhythmInstruments,
} from '../services/rhythmAudio';

interface RhythmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RhythmModal: React.FC<RhythmModalProps> = ({ isOpen, onClose }) => {
  const [genre, setGenre] = useState<DanceGenre>('salsa');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [bpm, setBpm] = useState<number>(180);
  const [instruments, setInstruments] = useState<RhythmInstruments>({
    countVoice: true,
    clave: true,
    congas: true,
    cowbell: false,
    bongo: true,
    guira: true,
  });

  useEffect(() => {
    rhythmEngine.setOnBeat((beat) => {
      setActiveBeat(beat);
    });

    return () => {
      rhythmEngine.stop();
      rhythmEngine.setOnBeat(() => {});
    };
  }, []);

  // Sync state when genre changes
  const handleSelectGenre = (newGenre: DanceGenre) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      rhythmEngine.stop();
    }
    setGenre(newGenre);
    rhythmEngine.setGenre(newGenre);
    setBpm(rhythmEngine.getBpm());
    setInstruments({ ...rhythmEngine.instruments });
    setActiveBeat(-1);
    if (wasPlaying) {
      rhythmEngine.start();
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      rhythmEngine.stop();
      setIsPlaying(false);
      setActiveBeat(-1);
    } else {
      rhythmEngine.setGenre(genre);
      rhythmEngine.setBpm(bpm);
      rhythmEngine.instruments = { ...instruments };
      rhythmEngine.start();
      setIsPlaying(true);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(90, Math.min(230, newBpm));
    setBpm(clamped);
    rhythmEngine.setBpm(clamped);
  };

  const handleToggleInstrument = (key: keyof RhythmInstruments) => {
    const updated = {
      ...instruments,
      [key]: !instruments[key],
    };
    setInstruments(updated);
    rhythmEngine.instruments = updated;
  };

  const handleClose = () => {
    if (isPlaying) {
      rhythmEngine.stop();
      setIsPlaying(false);
      setActiveBeat(-1);
    }
    onClose();
  };

  if (!isOpen) return null;

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

  const currentBeatLabels = genre === 'salsa' ? salsaBeatLabels : bachataBeatLabels;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#234C77]/60 to-transparent border-b border-[#88A5BF]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#021831] border border-[#F9C03E]/30 flex items-center justify-center text-[#F9C03E] shadow-sm">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide flex items-center gap-2">
                <span>Allenatore di Ritmo</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F9C03E]/20 text-[#F9C03E] border border-[#F9C03E]/30">
                  Audio Interattivo
                </span>
              </h2>
              <p className="text-xs text-[#88A5BF]">
                Trova il tempo 1 e allena l'orecchio per la pista
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
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                genre === 'salsa'
                  ? 'bg-gradient-to-r from-[#F9C03E] to-[#e6a820] text-[#042B58] shadow-md scale-[1.01]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>💃 Salsa Cubana / Portoricana</span>
            </button>
            <button
              onClick={() => handleSelectGenre('bachata')}
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                genre === 'bachata'
                  ? 'bg-gradient-to-r from-[#F9C03E] to-[#e6a820] text-[#042B58] shadow-md scale-[1.01]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🕺 Bachata (Sensual & Tradizionale)</span>
            </button>
          </div>

          {/* Display Grande dei Tempi (1 a 8) */}
          <div className="glass-card p-4 rounded-2xl border border-[#88A5BF]/30 text-center space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5" />
                <span>Conteggio Battute (8 Tempi)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                {activeBeat >= 0 ? `Tempo ${activeBeat + 1}` : 'In attesa'}
              </span>
            </div>

            {/* Griglia 8 Beat Pads */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2 pt-1">
              {currentBeatLabels.map((item, idx) => {
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

            {/* Testo animato del tempo corrente */}
            <div className="pt-1 flex items-center justify-center gap-2">
              <span className="text-xs text-slate-300">
                {activeBeat >= 0 ? (
                  <>
                    <strong className="text-white">
                      Tempo {activeBeat + 1}:
                    </strong>{' '}
                    <span className="text-[#F9C03E] font-medium">
                      {currentBeatLabels[activeBeat].sub}
                    </span>
                  </>
                ) : (
                  'Premi Play per avviare il ritmo e ascoltare i tempi'
                )}
              </span>
            </div>
          </div>

          {/* Controlli Principali (Play/Stop + BPM) */}
          <div className="glass-card p-4 rounded-2xl border border-[#88A5BF]/30 space-y-3">
            <div className="flex items-center gap-3">
              {/* Pulsante PLAY / STOP */}
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
                    <span>Avvia Ritmo</span>
                  </>
                )}
              </button>

              {/* Controllo Velocità BPM */}
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

            {/* Slider BPM e Presets */}
            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={genre === 'salsa' ? 130 : 95}
                max={genre === 'salsa' ? 220 : 150}
                value={bpm}
                onChange={(e) => handleBpmChange(Number(e.target.value))}
                className="w-full accent-[#F9C03E] cursor-pointer"
              />

              {/* Bottoni Presets */}
              <div className="flex gap-1.5 justify-between">
                {genre === 'salsa' ? (
                  <>
                    <button
                      onClick={() => handleBpmChange(150)}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold cursor-pointer border transition-colors ${
                        bpm === 150
                          ? 'bg-[#F9C03E] text-[#042B58] border-[#F9C03E]'
                          : 'bg-[#021831] text-slate-300 border-[#88A5BF]/20'
                      }`}
                    >
                      Lento (150)
                    </button>
                    <button
                      onClick={() => handleBpmChange(180)}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold cursor-pointer border transition-colors ${
                        bpm === 180
                          ? 'bg-[#F9C03E] text-[#042B58] border-[#F9C03E]'
                          : 'bg-[#021831] text-slate-300 border-[#88A5BF]/20'
                      }`}
                    >
                      Medio (180)
                    </button>
                    <button
                      onClick={() => handleBpmChange(210)}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold cursor-pointer border transition-colors ${
                        bpm === 210
                          ? 'bg-[#F9C03E] text-[#042B58] border-[#F9C03E]'
                          : 'bg-[#021831] text-slate-300 border-[#88A5BF]/20'
                      }`}
                    >
                      Veloce (210)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleBpmChange(115)}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold cursor-pointer border transition-colors ${
                        bpm === 115
                          ? 'bg-[#F9C03E] text-[#042B58] border-[#F9C03E]'
                          : 'bg-[#021831] text-slate-300 border-[#88A5BF]/20'
                      }`}
                    >
                      Sensual (115)
                    </button>
                    <button
                      onClick={() => handleBpmChange(125)}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold cursor-pointer border transition-colors ${
                        bpm === 125
                          ? 'bg-[#F9C03E] text-[#042B58] border-[#F9C03E]'
                          : 'bg-[#021831] text-slate-300 border-[#88A5BF]/20'
                      }`}
                    >
                      Media (125)
                    </button>
                    <button
                      onClick={() => handleBpmChange(138)}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold cursor-pointer border transition-colors ${
                        bpm === 138
                          ? 'bg-[#F9C03E] text-[#042B58] border-[#F9C03E]'
                          : 'bg-[#021831] text-slate-300 border-[#88A5BF]/20'
                      }`}
                    >
                      Veloce (138)
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mixer Strumenti: Accendi e spegni singoli strumenti */}
          <div className="glass-card p-4 rounded-2xl border border-[#88A5BF]/30 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#88A5BF] block">
              Mixer Strumenti (Attiva / Disattiva per isolare i suoni)
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Voce Guida Conteggio */}
              <button
                onClick={() => handleToggleInstrument('countVoice')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  instruments.countVoice
                    ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                    : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                }`}
              >
                <span>Conteggio Tempi</span>
                {instruments.countVoice ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Bongò */}
              <button
                onClick={() => handleToggleInstrument('bongo')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  instruments.bongo
                    ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                    : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                }`}
              >
                <span>Bongò Martillo</span>
                {instruments.bongo ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Congas (Salsa) o Güira (Bachata) */}
              {genre === 'salsa' ? (
                <>
                  <button
                    onClick={() => handleToggleInstrument('congas')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      instruments.congas
                        ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span>Congas (Tumbao)</span>
                    {instruments.congas ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleInstrument('clave')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      instruments.clave
                        ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span>Clave Son 3-2</span>
                    {instruments.clave ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleToggleInstrument('guira')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      instruments.guira
                        ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span>Güira Dominicana</span>
                    {instruments.guira ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleInstrument('cowbell')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      instruments.cowbell
                        ? 'bg-[#234C77]/70 border-[#F9C03E]/40 text-white'
                        : 'bg-[#021831]/60 border-[#88A5BF]/15 text-slate-400'
                    }`}
                  >
                    <span>Campana</span>
                    {instruments.cowbell ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#F9C03E]" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pillola Pratica di Andrea Frattesi */}
          <div className="p-3.5 rounded-2xl bg-[#021831]/80 border border-[#F9C03E]/30 space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#F9C03E]">
              <Sparkles className="w-4 h-4 text-[#F9C03E]" />
              <span>Il Consiglio di Andrea per il Tempo:</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {genre === 'salsa'
                ? '«Nella Salsa non provare a contare tutti i numeri all’infinito. Focalizzati solo sull’1: ascolta lo schiocco acuto della conga o il cambio del cantante. Una volta preso l’1, il tuo corpo fa il resto naturalmente.»'
                : '«Nella Bachata il segreto è non anticipare il 4 e l’8. Il Tap non è un passo su cui appoggiare il peso: è una carezza al pavimento che prepara il bacino a cambiare direzione.»'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
