import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Square,
  Music,
  Sparkles,
  Upload,
  Trash2,
  Plus,
  FileMusic,
  Disc3,
  Bell,
  BellOff,
  Check,
  Target,
  GraduationCap,
  RotateCcw,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Globe,
  Cloud,
  Share2,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  DanceGenre,
  MusicTrack,
  MUSIC_TRACKS,
  harmonizedEngine,
} from '../services/rhythmAudio';
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
import {
  SharedTrack,
  fetchSharedTracks,
  publishTrackToServer,
  deleteSharedTrackFromServer,
} from '../services/sharedTracks';

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
  recognitionSource?: 'catalog' | 'dsp_waveform' | 'heuristic' | 'essentia_mir' | 'ghost_production_auto';
  details?: string;
}

interface RhythmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generatore di suono didattico: Campana Latina su Tempo 1 e click metronomo opzionale
let customAudioCtx: AudioContext | null = null;
function playCustomClickSound(beat: number, mode: 'bell' | 'all' | 'off' = 'bell') {
  try {
    if (mode === 'off') return;
    if (mode === 'bell' && beat !== 0) return; // Suona solo sul Tempo 1

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
    } else {
      // BATTUTE 2-8: Click metronomo secco per verificare l'allineamento a orecchio
      const osc = customAudioCtx.createOscillator();
      const gain = customAudioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(beat === 4 ? 1200 : 960, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(customAudioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // ignore audio errors
  }
}

export const RhythmModal: React.FC<RhythmModalProps> = ({ isOpen, onClose }) => {
  // Tab attiva: 'shared' (Basi per Tutti) | 'didactic' (Canzoni Didattiche) | 'custom' (Carica & Calibra)
  const [activeTab, setActiveTab] = useState<'shared' | 'didactic' | 'custom'>('shared');

  // Canzoni Didattiche native
  const [selectedDidacticId, setSelectedDidacticId] = useState<string>(
    MUSIC_TRACKS[0]?.id || 'did-bachata-01'
  );
  const [didacticFilter, setDidacticFilter] = useState<'all' | 'bachata' | 'salsa'>('all');

  // Libreria Condivisa Cloud/Server (disponibile per TUTTI gli allievi)
  const [sharedTracks, setSharedTracks] = useState<SharedTrack[]>([]);
  const [sharedFilter, setSharedFilter] = useState<'all' | 'bachata' | 'salsa'>('all');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Canzoni audio MP3 dell'utente (IndexedDB locale)
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null);
  const [customFilter, setCustomFilter] = useState<'all' | 'bachata' | 'salsa'>('all');

  // Gestione eliminazione canzoni con conferma modale integrata (no alert/confirm nativo)
  const [trackToDelete, setTrackToDelete] = useState<{
    id: string;
    name: string;
    artist?: string;
    genre?: 'bachata' | 'salsa';
    bpm?: number;
    isShared: boolean;
  } | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);

  // Tap-tempo per calcolo istantaneo del BPM
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Stato di riproduzione
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [currentChordName, setCurrentChordName] = useState<string>('');
  const [customCurrentTime, setCustomCurrentTime] = useState<number>(0);
  const [customDuration, setCustomDuration] = useState<number>(0);
  const [clickSoundMode, setClickSoundMode] = useState<'bell' | 'all' | 'off'>('bell');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const lastCustomBeatRef = useRef<number>(-1);
  const waitingForTempo1Ref = useRef<boolean>(true);
  const lastAudioSecRef = useRef<number>(-1);
  const smoothedSecRef = useRef<number>(0);
  const lastAudioPerfRef = useRef<number>(performance.now());

  // Interrompi ogni riproduzione quando la modale viene chiusa
  useEffect(() => {
    if (!isOpen) {
      stopAllPlayback();
    }
  }, [isOpen]);

  // Carica le canzoni salvate in memoria permanente IndexedDB
  useEffect(() => {
    let isMounted = true;

    getAllStoredTracks()
      .then(async (stored) => {
        if (!isMounted || !stored || stored.length === 0) return;

        const loadedTracks: CustomTrack[] = [];

        for (const s of stored) {
          loadedTracks.push({
            id: s.id,
            name: s.name,
            artist: s.artist,
            file: new File([s.audioBlob], `${s.name}.mp3`, {
              type: s.audioBlob.type || 'audio/mpeg',
            }),
            url: URL.createObjectURL(s.audioBlob),
            genre: s.genre,
            bpm: s.bpm,
            beatOffset: s.beatOffset,
            beats: s.beats,
            isAnalyzing: false,
            recognitionSource: s.recognitionSource as any,
            details: s.details,
          });
        }

        if (isMounted) {
          setCustomTracks(loadedTracks);
          if (loadedTracks.length > 0) {
            setSelectedCustomId(loadedTracks[0].id);
            if (customAudioRef.current) {
              customAudioRef.current.src = loadedTracks[0].url;
            }
          }
        }
      })
      .catch((err) => console.warn('Errore lettura tracce salvate:', err));

    // Carica i brani salvati nella libreria condivisa del server (disponibili per tutti gli allievi)
    fetchSharedTracks()
      .then((shared) => {
        if (isMounted && shared) {
          setSharedTracks(shared);
        }
      })
      .catch((err) => console.warn('Errore lettura brani condivisi:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Ferma qualsiasi riproduzione in corso (sia MP3 che motore didattico)
  const stopAllPlayback = () => {
    harmonizedEngine.stop();
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveBeat(-1);
    setCurrentChordName('');
    lastCustomBeatRef.current = -1;
    waitingForTempo1Ref.current = true;
  };

  // Seleziona e prepara un brano della Libreria Condivisa
  const handleSelectSharedTrack = (shared: SharedTrack) => {
    stopAllPlayback();
    const trackObj: CustomTrack = {
      id: shared.id,
      name: shared.name,
      artist: shared.artist,
      url: shared.audioUrl,
      genre: shared.genre,
      bpm: shared.bpm,
      beatOffset: shared.beatOffset,
      beats: shared.beats as BeatEvent[],
      isAnalyzing: false,
      details: 'Brano calibrato dalla Libreria Condivisa per tutti',
    };
    setCustomTracks((prev) => {
      const filtered = prev.filter((t) => t.id !== shared.id);
      return [trackObj, ...filtered];
    });
    setSelectedCustomId(shared.id);
    if (customAudioRef.current) {
      customAudioRef.current.src = shared.audioUrl;
      customAudioRef.current.currentTime = 0;
      smoothedSecRef.current = 0;
      lastAudioSecRef.current = -1;
      waitingForTempo1Ref.current = true;
      customAudioRef.current.load();
    }
  };

  // Pubblica il brano calibrato nella Libreria Condivisa per tutti gli allievi
  const handlePublishCurrentTrack = async () => {
    if (!currentCustomTrack) return;
    setIsPublishing(true);
    setSyncNotice('💾 Salvataggio nella Libreria Condivisa per tutti gli allievi...');

    try {
      const res = await publishTrackToServer(
        {
          id: currentCustomTrack.id,
          name: currentCustomTrack.name,
          artist: currentCustomTrack.artist,
          genre: currentCustomTrack.genre,
          bpm: currentCustomTrack.bpm,
          beatOffset: currentCustomTrack.beatOffset,
          beats: currentCustomTrack.beats || [],
          duration: customDuration,
        },
        currentCustomTrack.file
      );

      if (res.success && res.track) {
        const fresh = await fetchSharedTracks();
        setSharedTracks(fresh);
        setSyncNotice('✓ Brano salvato sul server! Ora è nella Libreria Basi per Tutti.');
        setActiveTab('shared');
      } else {
        setSyncNotice(`Errore pubblicazione: ${res.error || 'Errore server'}`);
      }
    } catch (err: any) {
      setSyncNotice('Errore salvataggio brano sul server.');
    } finally {
      setIsPublishing(false);
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  // Apertura modale conferma eliminazione brano della libreria condivisa
  const handleDeleteSharedTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const track = sharedTracks.find((t) => t.id === id);
    if (!track) return;
    setTrackToDelete({
      id: track.id,
      name: track.name,
      artist: track.artist,
      genre: track.genre,
      bpm: track.bpm,
      isShared: true,
    });
  };

  // Conferma ed esecuzione eliminazione brano (Server e/o Memoria Locale)
  const confirmDeleteTrack = async () => {
    if (!trackToDelete) return;
    const { id, name, isShared } = trackToDelete;
    stopAllPlayback();

    try {
      if (isShared) {
        await deleteSharedTrackFromServer(id);
        setSharedTracks((prev) => prev.filter((t) => t.id !== id));
      }

      // Rimuovi anche da IndexedDB se presente
      const local = customTracks.find((t) => t.id === id);
      if (local) {
        try {
          URL.revokeObjectURL(local.url);
        } catch {}
      }
      await deleteTrackFromStorage(id).catch(() => {});
      const updatedCustom = customTracks.filter((t) => t.id !== id);
      setCustomTracks(updatedCustom);

      if (selectedCustomId === id) {
        if (updatedCustom.length > 0) {
          setSelectedCustomId(updatedCustom[0].id);
          if (customAudioRef.current) {
            customAudioRef.current.src = updatedCustom[0].url;
            customAudioRef.current.load();
          }
        } else {
          setSelectedCustomId(null);
        }
      }

      setSyncNotice(`✓ Canzone «${name}» eliminata.`);
      setTimeout(() => setSyncNotice(null), 3500);
    } catch (err) {
      console.error('Errore eliminazione:', err);
      setSyncNotice('Errore durante l’eliminazione del brano.');
      setTimeout(() => setSyncNotice(null), 3500);
    } finally {
      setTrackToDelete(null);
    }
  };

  // Conferma ed esecuzione cancellazione di tutte le canzoni in memoria
  const confirmClearAll = async () => {
    setShowClearAllConfirm(false);
    stopAllPlayback();
    try {
      await clearAllStoredTracks();
      setCustomTracks([]);
      setSelectedCustomId(null);
      setSyncNotice('✓ Tutte le canzoni in memoria sono state cancellate.');
      setTimeout(() => setSyncNotice(null), 3000);
    } catch {
      setSyncNotice('Errore durante la cancellazione.');
      setTimeout(() => setSyncNotice(null), 3000);
    }
  };

  // Calcolo istantaneo del BPM tramite tocco a ritmo (Tap-Tempo)
  const handleTapTempo = () => {
    const now = performance.now();
    setTapTimes((prev) => {
      const recent = [...prev, now].filter((t) => now - t < 4000);
      if (recent.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < recent.length; i++) {
          intervals.push((recent[i] - recent[i - 1]) / 1000);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        let calculatedBpm = 60 / avgInterval;

        // Se tocca a battute intere (8 tempi):
        if (avgInterval > 2.0 && avgInterval < 5.0) {
          calculatedBpm = (60 * 8) / avgInterval;
        } else if (calculatedBpm < 90) {
          calculatedBpm *= 2;
        } else if (calculatedBpm > 240) {
          calculatedBpm /= 2;
        }

        const roundedBpm = Number(calculatedBpm.toFixed(1));
        handleChangeBpm(roundedBpm);
        setSyncNotice(`🥁 Tap Tempo: ${roundedBpm} BPM rilevati (${recent.length} tocchi)`);
        setTimeout(() => setSyncNotice(null), 2500);
      }
      return recent;
    });
  };

  const handleClose = () => {
    stopAllPlayback();
    onClose();
  };

  const currentDidacticTrack =
    MUSIC_TRACKS.find((t) => t.id === selectedDidacticId) || MUSIC_TRACKS[0];
  const currentCustomTrack = customTracks.find((t) => t.id === selectedCustomId);

  // --- CONTROLLO RIPRODUZIONE CANZONI DIDATTICHE ---
  const handleTogglePlayDidactic = async () => {
    if (isPlaying) {
      stopAllPlayback();
    } else {
      stopAllPlayback();
      harmonizedEngine.selectTrack(currentDidacticTrack.id);
      harmonizedEngine.mixer.countVoice = clickSoundMode !== 'off';

      harmonizedEngine.setOnBeat((beatNum, chordName) => {
        setActiveBeat(beatNum);
        setCurrentChordName(
          beatNum === 0
            ? 'Tempo 1'
            : beatNum === 4
            ? 'Tempo 5'
            : `Tempo ${beatNum + 1}`
        );
        if (clickSoundMode !== 'off' && beatNum === 0) {
          playCustomClickSound(0, clickSoundMode);
        }
      });

      try {
        await harmonizedEngine.start();
        isPlayingRef.current = true;
        setIsPlaying(true);
      } catch (err) {
        console.warn('Errore avvio motore didattico:', err);
      }
    }
  };

  const handleSelectDidacticTrack = (track: MusicTrack) => {
    const wasPlaying = isPlaying;
    stopAllPlayback();
    setSelectedDidacticId(track.id);
    if (wasPlaying) {
      harmonizedEngine.selectTrack(track.id);
      harmonizedEngine.start().then(() => {
        isPlayingRef.current = true;
        setIsPlaying(true);
      });
    }
  };

  // --- CONTROLLO RIPRODUZIONE CANZONI MP3 UTENTE ---
  const handleTogglePlayCustom = () => {
    if (isPlayingRef.current) {
      stopAllPlayback();
    } else {
      if (customAudioRef.current && currentCustomTrack) {
        harmonizedEngine.stop();
        if (!customAudioRef.current.src || !customAudioRef.current.src.includes(currentCustomTrack.url)) {
          customAudioRef.current.src = currentCustomTrack.url;
          customAudioRef.current.load();
        }

        const curTime = customAudioRef.current.currentTime || 0;
        smoothedSecRef.current = curTime;
        lastAudioSecRef.current = -1;
        lastAudioPerfRef.current = performance.now();
        lastCustomBeatRef.current = -1;

        const beats = currentCustomTrack.beats;
        const firstT1 = currentCustomTrack.beatOffset ?? (beats && beats[0] ? beats[0].time : 0);

        if (curTime < firstT1) {
          waitingForTempo1Ref.current = true;
          setActiveBeat(-1);
          setCurrentChordName('Intro musicale... In attesa del Tempo 1');
        } else {
          waitingForTempo1Ref.current = false;
          if (beats && beats.length > 0) {
            let low = 0;
            let high = beats.length - 1;
            let activeIdx = 0;
            while (low <= high) {
              const mid = (low + high) >> 1;
              if (beats[mid].time <= curTime) {
                activeIdx = mid;
                low = mid + 1;
              } else {
                high = mid - 1;
              }
            }
            const beatNum = beats[activeIdx].beat;
            setActiveBeat(beatNum);
            setCurrentChordName(
              beatNum === 0
                ? 'Tempo 1'
                : beatNum === 4
                ? 'Tempo 5'
                : `Tempo ${beatNum + 1}`
            );
          }
        }

        customAudioRef.current
          .play()
          .then(() => {
            isPlayingRef.current = true;
            setIsPlaying(true);
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

  const handleSelectCustomTrack = (track: CustomTrack) => {
    stopAllPlayback();
    setSelectedCustomId(track.id);
    if (customAudioRef.current) {
      customAudioRef.current.src = track.url;
      customAudioRef.current.currentTime = 0;
      smoothedSecRef.current = 0;
      lastAudioSecRef.current = -1;
      waitingForTempo1Ref.current = true;
      customAudioRef.current.load();
    }
  };

  const handleSeekCustom = (newTime: number) => {
    setCustomCurrentTime(newTime);
    if (customAudioRef.current) {
      customAudioRef.current.currentTime = newTime;
    }
    smoothedSecRef.current = newTime;
    lastAudioSecRef.current = -1;
    lastAudioPerfRef.current = performance.now();
    lastCustomBeatRef.current = -1;

    const beats = currentCustomTrack?.beats;
    const firstT1 = currentCustomTrack?.beatOffset ?? (beats && beats[0] ? beats[0].time : 0);

    if (newTime < firstT1) {
      waitingForTempo1Ref.current = true;
      setActiveBeat(-1);
      setCurrentChordName('Intro musicale... In attesa del Tempo 1');
    } else {
      waitingForTempo1Ref.current = false;
      if (beats && beats.length > 0) {
        let low = 0;
        let high = beats.length - 1;
        let activeIdx = 0;
        while (low <= high) {
          const mid = (low + high) >> 1;
          if (beats[mid].time <= newTime) {
            activeIdx = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        const beatNum = beats[activeIdx].beat;
        setActiveBeat(beatNum);
        setCurrentChordName(
          beatNum === 0
            ? 'Tempo 1'
            : beatNum === 4
            ? 'Tempo 5'
            : `Tempo ${beatNum + 1}`
        );
      }
    }
  };

  // Sincronizzazione audio continua ad altissima precisione per le tracce MP3
  useEffect(() => {
    let animId: number;

    const syncBeatWithAudio = () => {
      if (
        (activeTab === 'custom' || activeTab === 'shared') &&
        isPlayingRef.current &&
        customAudioRef.current &&
        !customAudioRef.current.paused &&
        currentCustomTrack
      ) {
        // Lettura diretta dal clock audio hardware: 0 ritardo e 0 rallentamenti
        const currentSec = customAudioRef.current.currentTime;

        let beats = currentCustomTrack.beats;

        if (!beats || beats.length === 0) {
          const trackBpm = currentCustomTrack.bpm || 130;
          const period = 60.0 / trackBpm;
          const offset = currentCustomTrack.beatOffset || 0;
          beats = [];
          for (let t = offset, b = 0; t < 600; t += period, b++) {
            beats.push({
              time: Number(t.toFixed(3)),
              beat: b % 8,
            });
          }
        }

        const firstT1 = currentCustomTrack.beatOffset ?? (beats.find((b) => b.beat === 0)?.time ?? beats[0].time);

        if (currentSec < firstT1) {
          waitingForTempo1Ref.current = true;
          setActiveBeat(-1);
          setCurrentChordName('Intro musicale... In attesa del Tempo 1');
          animId = requestAnimationFrame(syncBeatWithAudio);
          return;
        }

        waitingForTempo1Ref.current = false;

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

        if (activeIdx >= 0 && activeIdx < beats.length) {
          const beatObj = beats[activeIdx];
          const beatNum = beatObj.beat;

          setActiveBeat(beatNum);
          setCurrentChordName(
            beatNum === 0
              ? 'Tempo 1'
              : beatNum === 4
              ? 'Tempo 5'
              : `Tempo ${beatNum + 1}`
          );

          if (clickSoundMode !== 'off' && lastCustomBeatRef.current !== activeIdx) {
            lastCustomBeatRef.current = activeIdx;
            playCustomClickSound(beatNum, clickSoundMode);
          }
        } else {
          setActiveBeat(-1);
          setCurrentChordName('In riproduzione...');
        }
      }
      animId = requestAnimationFrame(syncBeatWithAudio);
    };

    animId = requestAnimationFrame(syncBeatWithAudio);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, currentCustomTrack, clickSoundMode]);

  // Aggancia 1 adesso: blocca l'1 nell'istante esatto del tocco e ricalcola l'intera canzone
  const handleHookTempo1Now = async () => {
    if (!currentCustomTrack) return;

    const audioEl = customAudioRef.current;
    const currentAudioTime = audioEl ? audioEl.currentTime : customCurrentTime;
    if (isNaN(currentAudioTime) || currentAudioTime < 0) return;

    const bpm = currentCustomTrack.bpm || 130;
    const beatPeriod = 60.0 / bpm;
    const songDuration = customDuration || 480;

    const newBeats: BeatEvent[] = [];
    const baseOffset = Number(currentAudioTime.toFixed(3));

    // Battiti in avanti dal punto di aggancio fino alla fine del brano
    let tFwd = baseOffset;
    let bFwd = 0;
    while (tFwd <= songDuration + 60) {
      newBeats.push({
        time: Number(tFwd.toFixed(3)),
        beat: bFwd % 8, // 0 = Tempo 1
      });
      tFwd += beatPeriod;
      bFwd++;
    }

    // Battiti a ritroso per coprire anche le battute precedenti
    let tBack = baseOffset - beatPeriod;
    let bBack = 7;
    while (tBack >= 0) {
      newBeats.unshift({
        time: Number(tBack.toFixed(3)),
        beat: bBack % 8,
      });
      tBack -= beatPeriod;
      bBack = (bBack - 1 + 8) % 8;
    }

    const updatedTrack: CustomTrack = {
      ...currentCustomTrack,
      beatOffset: baseOffset,
      beats: newBeats,
      details: `Tempo 1 agganciato a ${baseOffset.toFixed(2)}s (${bpm} BPM)`,
    };

    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? updatedTrack : t))
    );

    // Salva in modo permanente in memoria IndexedDB
    try {
      const stored = await getAllStoredTracks();
      const existing = stored?.find((s) => s.id === currentCustomTrack.id);
      if (existing) {
        await saveTrackToStorage({
          ...existing,
          beatOffset: baseOffset,
          beats: newBeats,
          engineVersion: 18,
        });
      } else if (currentCustomTrack.file) {
        await saveTrackToStorage({
          id: currentCustomTrack.id,
          name: currentCustomTrack.name,
          artist: currentCustomTrack.artist,
          genre: currentCustomTrack.genre,
          bpm: currentCustomTrack.bpm,
          beatOffset: baseOffset,
          beats: newBeats,
          audioBlob: currentCustomTrack.file,
          duration: currentCustomTrack.file.size,
          savedAt: Date.now(),
          engineVersion: 18,
        });
      }
    } catch (e) {
      console.warn('Errore salvataggio permanente Tempo 1:', e);
    }

    waitingForTempo1Ref.current = false;
    setActiveBeat(0);
    setCurrentChordName('Tempo 1');
    lastCustomBeatRef.current = -1;

    if (clickSoundMode !== 'off') {
      playCustomClickSound(0, clickSoundMode);
    }

    setSyncNotice(`🎯 Tempo 1 bloccato a ${baseOffset.toFixed(2)}s!`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  // Sposta la griglia di battiti (+4 = inverte 1 con 5, +1 = anticipa un quarto, -1 = ritarda un quarto)
  const handleShiftBeat = async (deltaBeats: number) => {
    if (!currentCustomTrack) return;
    const bpm = currentCustomTrack.bpm || 130;
    const beatPeriod = 60.0 / bpm;
    const deltaSec = deltaBeats * beatPeriod;
    const currentOffset = currentCustomTrack.beatOffset ?? 2.0;
    const newOffset = Math.max(0, Number((currentOffset + deltaSec).toFixed(3)));
    const songDuration = customDuration || 480;

    const newBeats: BeatEvent[] = [];
    let tFwd = newOffset;
    let bFwd = 0;
    while (tFwd <= songDuration + 60) {
      newBeats.push({ time: Number(tFwd.toFixed(3)), beat: bFwd % 8 });
      tFwd += beatPeriod;
      bFwd++;
    }
    let tBack = newOffset - beatPeriod;
    let bBack = 7;
    while (tBack >= 0) {
      newBeats.unshift({ time: Number(tBack.toFixed(3)), beat: bBack % 8 });
      tBack -= beatPeriod;
      bBack = (bBack - 1 + 8) % 8;
    }

    const label =
      deltaBeats === 4
        ? 'Invertito 1 ↔ 5'
        : deltaBeats === 1
        ? 'Spostato +1 battito'
        : 'Spostato -1 battito';

    const updatedTrack: CustomTrack = {
      ...currentCustomTrack,
      beatOffset: newOffset,
      beats: newBeats,
      details: `${label} (Tempo 1 a ${newOffset.toFixed(2)}s)`,
    };

    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? updatedTrack : t))
    );

    try {
      const stored = await getAllStoredTracks();
      const existing = stored?.find((s) => s.id === currentCustomTrack.id);
      if (existing) {
        await saveTrackToStorage({
          ...existing,
          beatOffset: newOffset,
          beats: newBeats,
          engineVersion: 18,
        });
      }
    } catch (err) {
      console.warn('Errore salvataggio:', err);
    }

    lastCustomBeatRef.current = -1;
    setSyncNotice(`✓ ${label}! Nuovo Tempo 1: ${newOffset.toFixed(2)}s`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  // Micro-regolazione millimetrica (+/- 50ms)
  const handleNudgeMillis = async (deltaMs: number) => {
    if (!currentCustomTrack) return;
    const deltaSec = deltaMs / 1000;
    const currentOffset = currentCustomTrack.beatOffset ?? 2.0;
    const newOffset = Math.max(0, Number((currentOffset + deltaSec).toFixed(3)));
    const bpm = currentCustomTrack.bpm || 130;
    const beatPeriod = 60.0 / bpm;
    const songDuration = customDuration || 480;

    const newBeats: BeatEvent[] = [];
    let tFwd = newOffset;
    let bFwd = 0;
    while (tFwd <= songDuration + 60) {
      newBeats.push({ time: Number(tFwd.toFixed(3)), beat: bFwd % 8 });
      tFwd += beatPeriod;
      bFwd++;
    }
    let tBack = newOffset - beatPeriod;
    let bBack = 7;
    while (tBack >= 0) {
      newBeats.unshift({ time: Number(tBack.toFixed(3)), beat: bBack % 8 });
      tBack -= beatPeriod;
      bBack = (bBack - 1 + 8) % 8;
    }

    const updatedTrack: CustomTrack = {
      ...currentCustomTrack,
      beatOffset: newOffset,
      beats: newBeats,
    };

    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? updatedTrack : t))
    );

    try {
      const stored = await getAllStoredTracks();
      const existing = stored?.find((s) => s.id === currentCustomTrack.id);
      if (existing) {
        await saveTrackToStorage({
          ...existing,
          beatOffset: newOffset,
          beats: newBeats,
          engineVersion: 18,
        });
      }
    } catch (err) {
      console.warn('Errore salvataggio:', err);
    }

    setSyncNotice(`Regolato ${deltaMs > 0 ? '+' : ''}${deltaMs}ms (1 a ${newOffset.toFixed(2)}s)`);
    setTimeout(() => setSyncNotice(null), 2000);
  };

  // Regolazione BPM (+1, -1, x2, /2)
  const handleChangeBpm = async (newBpm: number) => {
    if (!currentCustomTrack) return;
    const clampedBpm = Math.max(60, Math.min(260, Number(newBpm.toFixed(1))));
    const beatPeriod = 60.0 / clampedBpm;
    const offset = currentCustomTrack.beatOffset ?? 2.0;
    const songDuration = customDuration || 480;

    const newBeats: BeatEvent[] = [];
    let tFwd = offset;
    let bFwd = 0;
    while (tFwd <= songDuration + 60) {
      newBeats.push({ time: Number(tFwd.toFixed(3)), beat: bFwd % 8 });
      tFwd += beatPeriod;
      bFwd++;
    }
    let tBack = offset - beatPeriod;
    let bBack = 7;
    while (tBack >= 0) {
      newBeats.unshift({ time: Number(tBack.toFixed(3)), beat: bBack % 8 });
      tBack -= beatPeriod;
      bBack = (bBack - 1 + 8) % 8;
    }

    const updatedTrack: CustomTrack = {
      ...currentCustomTrack,
      bpm: clampedBpm,
      beats: newBeats,
    };

    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? updatedTrack : t))
    );

    try {
      const stored = await getAllStoredTracks();
      const existing = stored?.find((s) => s.id === currentCustomTrack.id);
      if (existing) {
        await saveTrackToStorage({
          ...existing,
          bpm: clampedBpm,
          beats: newBeats,
          engineVersion: 18,
        });
      }
    } catch (err) {
      console.warn('Errore salvataggio bpm:', err);
    }

    setSyncNotice(`✓ Velocità aggiornata a ${clampedBpm} BPM`);
    setTimeout(() => setSyncNotice(null), 2500);
  };

  // Cambio Genere rapido
  const handleSwitchCustomGenre = async (newGenre: DanceGenre) => {
    if (!currentCustomTrack || currentCustomTrack.genre === newGenre) return;
    let targetBpm = currentCustomTrack.bpm;
    if (newGenre === 'salsa' && targetBpm < 150) {
      targetBpm = Math.round(targetBpm * 1.33);
      if (targetBpm < 155 || targetBpm > 220) targetBpm = 175;
    } else if (newGenre === 'bachata' && targetBpm > 150) {
      targetBpm = Math.round(targetBpm * 0.75);
      if (targetBpm > 145 || targetBpm < 115) targetBpm = 128;
    }

    const beatPeriod = 60.0 / targetBpm;
    const offset = currentCustomTrack.beatOffset ?? 2.0;
    const songDuration = customDuration || 480;

    const newBeats: BeatEvent[] = [];
    let tFwd = offset;
    let bFwd = 0;
    while (tFwd <= songDuration + 60) {
      newBeats.push({ time: Number(tFwd.toFixed(3)), beat: bFwd % 8 });
      tFwd += beatPeriod;
      bFwd++;
    }
    let tBack = offset - beatPeriod;
    let bBack = 7;
    while (tBack >= 0) {
      newBeats.unshift({ time: Number(tBack.toFixed(3)), beat: bBack % 8 });
      tBack -= beatPeriod;
      bBack = (bBack - 1 + 8) % 8;
    }

    const updatedTrack: CustomTrack = {
      ...currentCustomTrack,
      genre: newGenre,
      bpm: targetBpm,
      beats: newBeats,
    };

    setCustomTracks((prev) =>
      prev.map((t) => (t.id === currentCustomTrack.id ? updatedTrack : t))
    );

    try {
      const stored = await getAllStoredTracks();
      const existing = stored?.find((s) => s.id === currentCustomTrack.id);
      if (existing) {
        await saveTrackToStorage({
          ...existing,
          genre: newGenre,
          bpm: targetBpm,
          beats: newBeats,
          engineVersion: 18,
        });
      }
    } catch (err) {
      console.warn('Errore salvataggio genere:', err);
    }

    setSyncNotice(`✓ Impostato come ${newGenre === 'salsa' ? 'Salsa' : 'Bachata'} (${targetBpm} BPM)`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  // Caricamento file audio MP3 originali (anche 30 o più contemporaneamente)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setSyncNotice(`⚡ Caricamento e analisi di ${fileList.length} canzoni...`);

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
          engineVersion: 18,
          recognitionSource: result.recognitionSource,
          details: result.details,
        });

        newTracks.push(trackItem);
      } catch (err) {
        console.warn('Analisi automatica fallita per:', file.name, err);
        const fallbackTrack: CustomTrack = {
          id: trackId,
          name: cleanName,
          file,
          url,
          genre: 'bachata',
          bpm: 128,
          beatOffset: 2.0,
          isAnalyzing: false,
        };
        await saveTrackToStorage({
          id: trackId,
          name: cleanName,
          genre: 'bachata',
          bpm: 128,
          beatOffset: 2.0,
          audioBlob: file,
          savedAt: Date.now(),
          engineVersion: 18,
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
      setActiveTab('custom');
    }

    if (newTracks.length === 1) {
      setSyncNotice(
        `✓ «${newTracks[0].name}»: ${newTracks[0].bpm} BPM calcolati in automatico! Canzone pronta.`
      );
    } else {
      setSyncNotice(
        `✓ ${newTracks.length} canzoni caricate con BPM calcolati in automatico!`
      );
    }
    setTimeout(() => setSyncNotice(null), 4000);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Apertura modale conferma eliminazione brano MP3 dell'utente
  const handleDeleteCustomTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const track = customTracks.find((t) => t.id === id);
    if (!track) return;
    setTrackToDelete({
      id: track.id,
      name: track.name,
      artist: track.artist,
      genre: track.genre,
      bpm: track.bpm,
      isShared: sharedTracks.some((st) => st.id === track.id),
    });
  };

  // Cancellazione di tutte le canzoni MP3 memorizzate
  const handleClearAllTracks = () => {
    setShowClearAllConfirm(true);
  };

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

  // Filtraggio canzoni condivise del server
  const filteredSharedTracks = sharedTracks.filter((t) => {
    if (sharedFilter === 'all') return true;
    return t.genre === sharedFilter;
  });

  // Filtraggio canzoni didattiche
  const filteredDidacticTracks = MUSIC_TRACKS.filter((t) => {
    if (didacticFilter === 'all') return true;
    return t.genre === didacticFilter;
  });

  // Filtraggio canzoni MP3 locali
  const filteredCustomTracks = customTracks.filter((t) => {
    if (customFilter === 'all') return true;
    return t.genre === customFilter;
  });

  const activeGenre =
    activeTab === 'didactic'
      ? currentDidacticTrack?.genre === 'salsa' ? 'Salsa' : 'Bachata'
      : currentCustomTrack?.genre === 'salsa' ? 'Salsa' : 'Bachata';

  const activeBpm =
    activeTab === 'didactic'
      ? currentDidacticTrack?.bpm || 130
      : currentCustomTrack?.bpm || 130;

  const activeTitle =
    activeTab === 'didactic'
      ? currentDidacticTrack?.title || 'Canzone Didattica'
      : currentCustomTrack?.name || 'Nessuna Canzone Selezionata';

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#021831]/90 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div className="w-full max-w-lg max-h-[94vh] bg-[#042B58] border border-[#88A5BF]/30 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col relative overflow-hidden my-auto">
        {/* Header Principale */}
        <div className="flex items-center justify-between pb-3 border-b border-[#88A5BF]/20 shrink-0">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#F9C03E]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white leading-tight">
                Accademia del Ritmo: Salsa & Bachata
              </h2>
              <p className="text-[10px] text-[#88A5BF]">
                Basi a tempo perfetto per tutti gli allievi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Esci dall'Allenatore di Ritmo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#021831] hover:bg-[#234C77] text-slate-200 hover:text-white border border-[#88A5BF]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <X className="w-4 h-4 text-[#F9C03E]" />
            <span>Esci</span>
          </button>
        </div>

        {/* Notifica di stato / Conferma */}
        {syncNotice && (
          <div className="mt-2 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-xs text-amber-200 flex items-center gap-2 animate-fadeIn shrink-0">
            <Sparkles className="w-4 h-4 text-[#F9C03E] shrink-0" />
            <span className="font-medium">{syncNotice}</span>
          </div>
        )}

        {/* Switcher a 3 Tab: Basi per Tutti, Didattiche, Carica & Calibra */}
        <div className="mt-3 grid grid-cols-3 p-1 rounded-2xl bg-[#021831] border border-[#88A5BF]/30 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'shared') {
                stopAllPlayback();
                setActiveTab('shared');
              }
            }}
            className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'shared'
                ? 'bg-[#F9C03E] text-[#042B58] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Basi per Tutti ({sharedTracks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'didactic') {
                stopAllPlayback();
                setActiveTab('didactic');
              }
            }}
            className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'didactic'
                ? 'bg-[#F9C03E] text-[#042B58] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Didattiche (30)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'custom') {
                stopAllPlayback();
                setActiveTab('custom');
              }
            }}
            className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#F9C03E] text-[#042B58] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carica & Calibra ({customTracks.length})</span>
          </button>
        </div>

        {/* Contenuto Scorrevole */}
        <div className="overflow-y-auto py-3 space-y-3 pr-1 my-1 flex-1 text-left">
          {/* Card Lettore Principale */}
          <div className="glass-card p-3 sm:p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                  <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin text-[#F9C03E]' : ''}`} />
                  <span>
                    {activeTab === 'didactic'
                      ? 'Traccia Didattica a Tempo'
                      : activeTab === 'shared'
                      ? '🏛️ Base della Libreria Condivisa'
                      : '🎧 Canzone in Calibrazione'}
                  </span>
                </span>
                <h3 className="text-sm font-semibold text-white truncate mt-0.5">
                  {activeTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#021831] text-amber-300 border border-[#F9C03E]/40 shrink-0">
                    {activeGenre === 'Salsa' ? '💃 Salsa' : '✨ Bachata'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#021831] text-[#F9C03E] border border-[#F9C03E]/40 shrink-0">
                    {activeBpm} BPM
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    ⚡ Auto-BPM
                  </span>
                  {currentChordName && isPlaying && (
                    <span className="text-[10px] text-amber-300 font-mono font-semibold animate-pulse truncate">
                      {currentChordName}
                    </span>
                  )}
                </div>
              </div>

              {/* Tasti Controllo Riproduzione ed Eliminazione Canzone */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={activeTab === 'didactic' ? handleTogglePlayDidactic : handleTogglePlayCustom}
                  disabled={activeTab !== 'didactic' && !currentCustomTrack}
                  className={`py-2 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-[#234C77] hover:bg-[#88A5BF]/30 text-white border border-[#88A5BF]/40 shadow-sm'
                      : 'gold-gradient-btn text-[#042B58] shadow-md'
                  } ${activeTab !== 'didactic' && !currentCustomTrack ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                {activeTab !== 'didactic' && currentCustomTrack && (
                  <button
                    type="button"
                    onClick={() => {
                      const isShared =
                        activeTab === 'shared' || sharedTracks.some((t) => t.id === currentCustomTrack.id);
                      setTrackToDelete({
                        id: currentCustomTrack.id,
                        name: currentCustomTrack.name,
                        artist: currentCustomTrack.artist,
                        genre: currentCustomTrack.genre,
                        bpm: currentCustomTrack.bpm,
                        isShared,
                      });
                    }}
                    title="Elimina questa canzone"
                    className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Elimina</span>
                  </button>
                )}
              </div>
            </div>

            {/* Barra avanzamento solo per MP3 e Basi condivise */}
            {activeTab !== 'didactic' && currentCustomTrack && (
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
                  onChange={(e) => handleSeekCustom(Number(e.target.value))}
                  className="w-full accent-[#F9C03E] cursor-pointer h-1.5 bg-[#021831] rounded-lg"
                />
              </div>
            )}
          </div>

          {/* BATTUTE MUSICALI (DA 1 A 8) - SEMPRE PERFETTE */}
          <div className="glass-card p-3 sm:p-4 text-center space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Battute Musicali (1-8)</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#F9C03E]">
                {activeBpm} BPM
              </span>
            </div>

            {/* Griglia 1 a 8 - Si accendono in oro brillante SOLO l'1 e il 5 */}
            <div className="grid grid-cols-8 gap-1 sm:gap-1.5 pt-1">
              {beatList.map((item, idx) => {
                const isTempo1 = idx === 0;
                const isTempo5 = idx === 4;
                const isActive = isPlaying && activeBeat === idx;

                let padClasses = '';
                if (isActive) {
                  if (isTempo1 || isTempo5) {
                    padClasses =
                      'bg-[#F9C03E] text-[#042B58] border-2 border-white shadow-[0_0_28px_rgba(249,192,62,1)] scale-110 -translate-y-1 font-black ring-4 ring-[#F9C03E] z-20';
                  } else {
                    padClasses =
                      'bg-slate-700/90 text-slate-100 border-2 border-slate-400/80 shadow-[0_0_12px_rgba(203,213,225,0.3)] scale-105 -translate-y-0.5 font-bold z-10';
                  }
                } else if (isTempo1 || isTempo5) {
                  padClasses =
                    'bg-slate-900/90 border border-[#F9C03E]/40 text-[#F9C03E] font-bold';
                } else {
                  padClasses =
                    'bg-slate-900/80 border border-slate-800 text-slate-500 font-medium';
                }

                return (
                  <div
                    key={idx}
                    className={`py-3 sm:py-3.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-75 select-none ${padClasses}`}
                  >
                    <span className="text-lg sm:text-2xl font-bold font-mono leading-none">
                      {item.num}
                    </span>
                    {isTempo1 ? (
                      <span
                        className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight mt-0.5 ${
                          isActive ? 'text-[#042B58]' : 'text-[#F9C03E]'
                        }`}
                      >
                        1°
                      </span>
                    ) : isTempo5 ? (
                      <span
                        className={`text-[8px] font-bold uppercase tracking-tight mt-0.5 ${
                          isActive ? 'text-[#042B58]' : 'text-[#F9C03E]'
                        }`}
                      >
                        5°
                      </span>
                    ) : (
                      <span
                        className={`text-[8px] font-semibold tracking-tight mt-0.5 transition-opacity ${
                          isActive ? 'text-slate-300 opacity-90' : 'opacity-0 select-none'
                        }`}
                      >
                        {item.num}°
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PANNELLO DI CALIBRAZIONE RITMICA AVANZATA (Visible on Custom tab or when calibrating) */}
            {activeTab === 'custom' && currentCustomTrack && (
              <div className="pt-3 flex flex-col gap-2.5 border-t border-[#88A5BF]/20 text-left bg-[#021831]/60 p-3 rounded-2xl border border-amber-500/20">
                {/* Intestazione Calibrazione con offset attuale */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Target className="w-4 h-4 text-[#F9C03E]" />
                    <span>Calibrazione Ritmo & Velocità Esatta</span>
                  </span>
                  <span className="text-[10px] text-amber-200 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    1 a {currentCustomTrack.beatOffset?.toFixed(2) || '2.00'}s • {currentCustomTrack.bpm} BPM
                  </span>
                </div>

                {/* GUIDA SONORA PER TROVARE IL TEMPO (in memoria per la calibrazione) */}
                <div className="p-2 rounded-xl bg-[#042B58]/80 border border-[#88A5BF]/20 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {clickSoundMode !== 'off' ? (
                      <Bell className="w-3.5 h-3.5 text-[#F9C03E] shrink-0" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="text-[10px] text-slate-200 font-bold">
                      Suono per Trovare il Tempo:
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setClickSoundMode('bell')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        clickSoundMode === 'bell'
                          ? 'bg-[#F9C03E] text-[#042B58] shadow-sm'
                          : 'bg-[#021831] text-slate-400 hover:text-white border border-[#88A5BF]/20'
                      }`}
                    >
                      🔔 Campana 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setClickSoundMode('all')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        clickSoundMode === 'all'
                          ? 'bg-[#F9C03E] text-[#042B58] shadow-sm'
                          : 'bg-[#021831] text-slate-400 hover:text-white border border-[#88A5BF]/20'
                      }`}
                    >
                      ⏱️ Click 1-8
                    </button>
                    <button
                      type="button"
                      onClick={() => setClickSoundMode('off')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        clickSoundMode === 'off'
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                          : 'bg-[#021831] text-slate-400 hover:text-white border border-[#88A5BF]/20'
                      }`}
                    >
                      🔕 Muto
                    </button>
                  </div>
                </div>

                {/* 1. REGOLAZIONE BPM DIRETTA E PRESET ISTANTANEI */}
                <div className="p-2.5 rounded-xl bg-[#042B58]/80 border border-[#88A5BF]/20 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-200 font-bold">
                      Velocità Canzone (BPM):
                    </span>

                    {/* Stepper + Input numerico BPM */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleChangeBpm((currentCustomTrack.bpm || 130) - 5)}
                        className="px-2 py-1 rounded bg-[#021831] hover:bg-[#234C77] text-amber-300 text-[10px] font-mono font-bold border border-[#88A5BF]/25 cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeBpm((currentCustomTrack.bpm || 130) - 1)}
                        className="px-2 py-1 rounded bg-[#021831] hover:bg-[#234C77] text-white text-[10px] font-mono font-bold border border-[#88A5BF]/25 cursor-pointer"
                      >
                        -1
                      </button>

                      <div className="flex items-center px-2 py-0.5 rounded bg-[#021831] border border-amber-400/50">
                        <input
                          type="number"
                          step="0.5"
                          min="60"
                          max="260"
                          value={currentCustomTrack.bpm || 130}
                          onChange={(e) => handleChangeBpm(Number(e.target.value))}
                          className="w-12 bg-transparent text-center font-mono font-bold text-amber-300 text-xs focus:outline-none"
                        />
                        <span className="text-[9px] text-[#88A5BF] font-bold">BPM</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChangeBpm((currentCustomTrack.bpm || 130) + 1)}
                        className="px-2 py-1 rounded bg-[#021831] hover:bg-[#234C77] text-white text-[10px] font-mono font-bold border border-[#88A5BF]/25 cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeBpm((currentCustomTrack.bpm || 130) + 5)}
                        className="px-2 py-1 rounded bg-[#021831] hover:bg-[#234C77] text-amber-300 text-[10px] font-mono font-bold border border-[#88A5BF]/25 cursor-pointer"
                      >
                        +5
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChangeBpm((currentCustomTrack.bpm || 130) / 2)}
                        title="Dimezza BPM"
                        className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 text-[9px] font-mono border border-slate-700 cursor-pointer"
                      >
                        /2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeBpm((currentCustomTrack.bpm || 130) * 2)}
                        title="Raddoppia BPM"
                        className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 text-[9px] font-mono border border-slate-700 cursor-pointer"
                      >
                        x2
                      </button>
                    </div>
                  </div>

                  {/* Preset rapidi per genere e Tap Tempo */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[#88A5BF]/15 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] text-[#88A5BF] uppercase font-bold">
                        Preset {currentCustomTrack.genre === 'salsa' ? 'Salsa' : 'Bachata'}:
                      </span>
                      {currentCustomTrack.genre === 'bachata' ? (
                        <>
                          {[124, 128, 130, 132, 136].map((bpmVal) => (
                            <button
                              key={bpmVal}
                              type="button"
                              onClick={() => handleChangeBpm(bpmVal)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                                Math.round(currentCustomTrack.bpm) === bpmVal
                                  ? 'bg-[#F9C03E] text-[#042B58]'
                                  : 'bg-[#021831] text-slate-300 hover:text-white border border-[#88A5BF]/20'
                              }`}
                            >
                              {bpmVal}
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          {[172, 180, 186, 192, 200].map((bpmVal) => (
                            <button
                              key={bpmVal}
                              type="button"
                              onClick={() => handleChangeBpm(bpmVal)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                                Math.round(currentCustomTrack.bpm) === bpmVal
                                  ? 'bg-[#F9C03E] text-[#042B58]'
                                  : 'bg-[#021831] text-slate-300 hover:text-white border border-[#88A5BF]/20'
                              }`}
                            >
                              {bpmVal}
                            </button>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Tasto Tap Tempo */}
                    <button
                      type="button"
                      onClick={handleTapTempo}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      🥁 Tap Tempo ({tapTimes.length > 0 ? `${tapTimes.length} tocchi` : 'Batti qui'})
                    </button>
                  </div>

                  {/* Indicatore calcolo automatico BPM */}
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <span className="flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3 text-[#F9C03E]" />
                      <span>BPM calcolato in automatico al caricamento</span>
                    </span>
                    <span className="font-mono font-bold text-white">{currentCustomTrack.bpm} BPM</span>
                  </div>
                </div>

                {/* 2. TASTO PRINCIPALE AGGANCIA 1 ADESSO */}
                <button
                  type="button"
                  onClick={handleHookTempo1Now}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-500 via-[#F9C03E] to-amber-500 hover:brightness-110 text-[#042B58] shadow-[0_0_20px_rgba(249,192,62,0.45)] active:scale-95"
                >
                  <Target className="w-4 h-4 text-[#042B58]" />
                  <span>🎯 AGGANCIA 1 ADESSO (Tocca sul battere dell&apos;1)</span>
                </button>

                {/* 3. TASTI DI CORREZIONE RAPIDA DELLE BATTUTE */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleShiftBeat(-1)}
                    title="Anticipa la battuta di 1 tempo intero"
                    className="py-1.5 px-2 rounded-lg bg-[#021831] hover:bg-[#234C77] text-slate-200 border border-[#88A5BF]/30 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[#F9C03E]" />
                    <span>-1 Battito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShiftBeat(4)}
                    title="Scambia l'1 con il 5 se la battuta è caduta a metà frase (errore più comune nei balli caraibici)"
                    className="py-1.5 px-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-400/40 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Inverti 1 ↔ 5</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShiftBeat(1)}
                    title="Posticipa la battuta di 1 tempo intero"
                    className="py-1.5 px-2 rounded-lg bg-[#021831] hover:bg-[#234C77] text-slate-200 border border-[#88A5BF]/30 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>+1 Battito</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#F9C03E]" />
                  </button>
                </div>

                {/* 4. RIFINITURA MILLIMETRICA (+/-50ms) E SWITCH GENERE */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#88A5BF]/15 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#88A5BF]">Micro-Shift:</span>
                    <button
                      type="button"
                      onClick={() => handleNudgeMillis(-50)}
                      title="Anticipa l'1 di 50 millisecondi"
                      className="px-2 py-0.5 rounded bg-[#021831] hover:bg-[#234C77] text-slate-300 text-[10px] font-mono border border-[#88A5BF]/25 cursor-pointer"
                    >
                      -50ms
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudgeMillis(+50)}
                      title="Ritarda l'1 di 50 millisecondi"
                      className="px-2 py-0.5 rounded bg-[#021831] hover:bg-[#234C77] text-slate-300 text-[10px] font-mono border border-[#88A5BF]/25 cursor-pointer"
                    >
                      +50ms
                    </button>
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleSwitchCustomGenre('salsa')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        currentCustomTrack.genre === 'salsa'
                          ? 'bg-[#F9C03E] text-[#042B58]'
                          : 'bg-[#021831] text-slate-400 hover:text-white border border-[#88A5BF]/20'
                      }`}
                    >
                      💃 Salsa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchCustomGenre('bachata')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        currentCustomTrack.genre === 'bachata'
                          ? 'bg-[#F9C03E] text-[#042B58]'
                          : 'bg-[#021831] text-slate-400 hover:text-white border border-[#88A5BF]/20'
                      }`}
                    >
                      ✨ Bachata
                    </button>
                  </div>
                </div>

                {/* 5. IL TASTO D'ORO: SALVA NELLA LIBRERIA CONDIVISA DEL SERVER */}
                <button
                  type="button"
                  onClick={handlePublishCurrentTrack}
                  disabled={isPublishing}
                  className="w-full mt-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4 text-white" />
                  <span>
                    {isPublishing
                      ? 'Salvataggio sul server in corso...'
                      : '💾 SALVA NELLA LIBRERIA CONDIVISA (Disponibile per tutti)'}
                  </span>
                </button>
                <p className="text-[10px] text-slate-300 text-center leading-tight">
                  Una volta salvato, il brano rimane nella memoria del server per sempre: chiunque apra l&apos;app potrà ballarlo a tempo perfetto senza dover toccare nulla.
                </p>
              </div>
            )}
          </div>

          {/* TAB 1: BASI PER TUTTI (LIBRERIA CONDIVISA SUL SERVER) */}
          {activeTab === 'shared' && (
            <div className="glass-card p-3 sm:p-4 space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Disc3 className="w-4 h-4 text-[#F9C03E]" />
                    <span>Basi Pronte per Tutti gli Allievi ({filteredSharedTracks.length})</span>
                  </span>
                  <p className="text-[10px] text-[#88A5BF]">
                    Brani calibrati con Tempo 1 esatto: premi Play e balla subito.
                  </p>
                </div>

                {/* Filtro genere per Basi Condivise */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSharedFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      sharedFilter === 'all'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Tutte ({sharedTracks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSharedFilter('bachata')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      sharedFilter === 'bachata'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Bachata ({sharedTracks.filter((t) => t.genre === 'bachata').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSharedFilter('salsa')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      sharedFilter === 'salsa'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Salsa ({sharedTracks.filter((t) => t.genre === 'salsa').length})
                  </button>
                </div>
              </div>

              {filteredSharedTracks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2 border border-dashed border-[#88A5BF]/30 rounded-2xl bg-[#021831]/50">
                  <Cloud className="w-8 h-8 text-[#F9C03E] mx-auto opacity-80" />
                  <p className="font-semibold text-white">Nessun brano ancora presente nella Libreria Condivisa.</p>
                  <p className="text-[11px] text-[#88A5BF] max-w-sm mx-auto">
                    Vai nella scheda <strong>&quot;Carica & Calibra&quot;</strong>, carica le tue canzoni, imposta il BPM e il Tempo 1, e premi <strong>&quot;Salva nella Libreria Condivisa&quot;</strong>: rimarranno qui per sempre per tutti gli allievi!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    className="mt-2 py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Vai a Carica & Calibra</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 pt-1 max-h-64 overflow-y-auto pr-1">
                  {filteredSharedTracks.map((track) => {
                    const isSelected = selectedCustomId === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectSharedTrack(track)}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#234C77] border-[#F9C03E]/70 shadow-sm'
                            : 'bg-[#021831]/70 hover:bg-[#234C77]/40 border-[#88A5BF]/25 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {track.name}
                            </span>
                            {track.artist && (
                              <span className="text-[10px] text-slate-300 truncate">
                                • {track.artist}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-[#F9C03E]">
                              {track.genre === 'salsa' ? '💃 Salsa' : '✨ Bachata'} • {track.bpm} BPM
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                              ✓ 1 a {track.beatOffset?.toFixed(2)}s
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && isPlaying ? (
                            <span className="w-7 h-7 rounded-lg bg-[#F9C03E] text-[#042B58] flex items-center justify-center font-bold">
                              <Disc3 className="w-4 h-4 animate-spin" />
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-lg bg-[#021831] text-slate-400 hover:text-white flex items-center justify-center border border-[#88A5BF]/20">
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSharedTrack(track.id, e)}
                            title="Rimuovi dalla libreria condivisa"
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
          )}

          {/* TAB 2: ELENCO DELLE 30 CANZONI DIDATTICHE */}
          {activeTab === 'didactic' && (
            <div className="glass-card p-3 sm:p-4 space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#F9C03E]" />
                  <span>Brani Didattici Progressivi ({filteredDidacticTracks.length})</span>
                </span>
                {/* Filtro genere */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDidacticFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      didacticFilter === 'all'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Tutte (30)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDidacticFilter('bachata')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      didacticFilter === 'bachata'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Bachata (15)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDidacticFilter('salsa')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      didacticFilter === 'salsa'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Salsa (15)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1 max-h-64 overflow-y-auto pr-1">
                {filteredDidacticTracks.map((track) => {
                  const isSelected = selectedDidacticId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectDidacticTrack(track)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
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
                        <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                          {track.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-[#F9C03E]">
                            {track.genre === 'salsa' ? '💃 Salsa' : '✨ Bachata'} • {track.bpm} BPM
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                            {track.mood}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected && isPlaying ? (
                          <span className="w-7 h-7 rounded-lg bg-[#F9C03E] text-[#042B58] flex items-center justify-center font-bold">
                            <Disc3 className="w-4 h-4 animate-spin" />
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-lg bg-[#021831] text-slate-400 hover:text-white flex items-center justify-center border border-[#88A5BF]/20">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CARICA E CALIBRA I BRANI MP3 */}
          {activeTab === 'custom' && (
            <div className="glass-card p-3 sm:p-4 space-y-3 text-left">
              {/* Tasto Carica file audio */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#88A5BF]/20">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileMusic className="w-4 h-4 text-[#F9C03E]" />
                    <span>Le Mie Canzoni in Memoria ({customTracks.length})</span>
                  </span>
                  <p className="text-[10px] text-[#88A5BF]">
                    🔒 <strong>Memoria privata:</strong> rimangono sul tuo dispositivo. Solo se premi &quot;Salva nella Libreria Condivisa&quot; le renderai disponibili anche agli altri.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="audio/*, .mp3, .m4a, .wav, .aac, .ogg, .flac, audio/mpeg, audio/mp4"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="custom-audio-file-input"
                  />
                  <label
                    htmlFor="custom-audio-file-input"
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-[#F9C03E] hover:brightness-110 text-[#042B58] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#042B58]" />
                    <span>Carica Canzoni MP3</span>
                  </label>

                  {customTracks.length > 0 && (
                    <button
                      onClick={handleClearAllTracks}
                      title="Svuota memoria temporanea"
                      className="text-[10px] text-rose-400 hover:text-rose-300 p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro genere per MP3 */}
              {customTracks.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCustomFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      customFilter === 'all'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Tutte ({customTracks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomFilter('bachata')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      customFilter === 'bachata'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Bachata ({customTracks.filter((t) => t.genre === 'bachata').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomFilter('salsa')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      customFilter === 'salsa'
                        ? 'bg-[#F9C03E] text-[#042B58]'
                        : 'bg-[#021831] text-slate-400 hover:text-white'
                    }`}
                  >
                    Salsa ({customTracks.filter((t) => t.genre === 'salsa').length})
                  </button>
                </div>
              )}

              {/* Lista MP3 caricati */}
              {customTracks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2 border border-dashed border-[#88A5BF]/30 rounded-2xl bg-[#021831]/50">
                  <Upload className="w-8 h-8 text-[#F9C03E] mx-auto opacity-80" />
                  <p className="font-semibold text-white">Nessuna canzone MP3 caricata al momento.</p>
                  <p className="text-[11px] text-[#88A5BF] max-w-xs mx-auto">
                    Premi il tasto giallo <strong>&quot;Carica Canzoni MP3&quot;</strong> qui sopra e seleziona le tue canzoni preferite da calibrare e salvare per sempre.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 pt-1 max-h-64 overflow-y-auto pr-1">
                  {filteredCustomTracks.map((track) => {
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
                                <Check className="w-3 h-3" /> In calibrazione
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
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
          )}
        </div>

        {/* MODALE CONFERMA ELIMINAZIONE CANZONE */}
        {trackToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#042B58] border-2 border-rose-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Elimina Canzone</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Decidi tu quali canzoni conservare o eliminare. Sei sicuro di voler eliminare definitivamente questo brano?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#021831] border border-[#88A5BF]/25 space-y-1">
                <div className="text-xs font-bold text-white truncate">
                  🎵 {trackToDelete.name}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>{trackToDelete.genre === 'salsa' ? '💃 Salsa' : '✨ Bachata'}</span>
                  <span>•</span>
                  <span className="font-mono text-[#F9C03E]">{trackToDelete.bpm || 130} BPM</span>
                  {trackToDelete.isShared && (
                    <>
                      <span>•</span>
                      <span className="text-amber-300 font-semibold">Libreria Condivisa</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTrackToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTrack}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sì, Elimina Canzone</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE CONFERMA CANCELLAZIONE TOTALE MEMORIA */}
        {showClearAllConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#042B58] border-2 border-rose-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Svuota Memoria Canzoni</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Vuoi davvero cancellare tutte le {customTracks.length} canzoni memorizzate localmente? Questa azione non può essere annullata.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={confirmClearAll}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sì, Cancella Tutte</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audio Element invisibile per MP3 */}
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
        />
      </div>
    </div>
  );
};
