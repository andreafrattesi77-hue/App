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
  ExternalLink,
  Sliders,
  Wand2,
  Volume2,
  Save,
  Lock,
  Clock,
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
  getDeletedTrackIds,
} from '../services/sharedTracks';
import { DEFAULT_SHARED_TRACKS } from '../data/defaultSharedTracks';

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
  duration?: number;
  isAnalyzing?: boolean;
  recognitionSource?: 'catalog' | 'dsp_waveform' | 'heuristic' | 'essentia_mir' | 'ghost_production_auto';
  details?: string;
  isSaved?: boolean; // true se salvata nella memoria permanente dell'app
}

interface RhythmModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTrial?: boolean;
  onOpenUnlock?: (notice?: string) => void;
}

// Generatore di suono didattico: Campana Latina (1 e 5), Clave Cubana, Metronomo accentato
let customAudioCtx: AudioContext | null = null;
function playCustomClickSoundAtTime(
  beat: number,
  mode: 'bell' | 'clave' | 'all' | 'off' = 'bell',
  targetTime?: number,
  genre: 'salsa' | 'bachata' = 'salsa'
) {
  try {
    if (mode === 'off') return;
    if (mode === 'bell' && beat !== 0 && beat !== 4) return; // Suona su 1 e 5

    if (!customAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      customAudioCtx = new AudioCtx();
    }
    if (customAudioCtx.state === 'suspended') {
      customAudioCtx.resume().catch(() => {});
    }
    const t = Math.max(customAudioCtx.currentTime, targetTime ?? customAudioCtx.currentTime);

    if (mode === 'bell') {
      // CAMPANA LATINA (Tempo 1 e Tempo 5)
      const osc1 = customAudioCtx.createOscillator();
      const osc2 = customAudioCtx.createOscillator();
      const gain = customAudioCtx.createGain();

      const isTempo1 = beat === 0;
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(isTempo1 ? 840 : 640, t);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(isTempo1 ? 1480 : 1120, t);

      gain.gain.setValueAtTime(isTempo1 ? 0.60 : 0.42, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isTempo1 ? 0.28 : 0.20));

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(customAudioCtx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.3);
      osc2.stop(t + 0.3);
    } else if (mode === 'clave') {
      // CLAVE LATINA TRADIZIONALE (suono secco in legno naturale)
      const osc = customAudioCtx.createOscillator();
      const gain = customAudioCtx.createGain();
      const filter = customAudioCtx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, t);
      filter.Q.setValueAtTime(14, t);

      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, t);

      const vol = (beat === 0 || beat === 4) ? 0.45 : (beat === 3 || beat === 7 ? (genre === 'bachata' ? 0.32 : 0) : 0.26);
      if (vol <= 0) return;

      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(customAudioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } else {
      // METRONOMO ACCENTATO SULLE BATTUTE (1-8)
      const osc = customAudioCtx.createOscillator();
      const gain = customAudioCtx.createGain();

      osc.type = 'sine';
      let freq = 620;
      let vol = 0.24;

      if (beat === 0) {
        freq = 1200; // Tempo 1 squillante
        vol = 0.52;
      } else if (beat === 4) {
        freq = 960; // Tempo 5 deciso
        vol = 0.38;
      } else if (beat === 3 || beat === 7) {
        if (genre === 'salsa') {
          return; // Pausa Salsa sui passi 4 e 8: silenzio assoluto
        } else {
          freq = 780; // Tap Bachata brillante
          vol = 0.30;
        }
      }

      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(customAudioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    }
  } catch {
    // ignore
  }
}

export const RhythmModal: React.FC<RhythmModalProps> = ({
  isOpen,
  onClose,
  isTrial = false,
  onOpenUnlock,
}) => {
  // Tab attiva: 'shared' (Basi per Tutti) | 'didactic' (Canzoni Didattiche) | 'custom' (Carica & Calibra)
  const [activeTab, setActiveTab] = useState<'shared' | 'didactic' | 'custom'>('shared');

  // Canzoni Didattiche native
  const [selectedDidacticId, setSelectedDidacticId] = useState<string>(
    MUSIC_TRACKS[0]?.id || 'did-bachata-01'
  );
  const [didacticFilter, setDidacticFilter] = useState<'all' | 'bachata' | 'salsa'>('all');

  // Libreria Condivisa Cloud/Server (disponibile per TUTTI gli allievi: 15 Bachata + 15 Salsa)
  const [sharedTracks, setSharedTracks] = useState<SharedTrack[]>(() => {
    return DEFAULT_SHARED_TRACKS;
  });
  const [sharedFilter, setSharedFilter] = useState<'all' | 'bachata' | 'salsa'>('all');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Canzoni audio MP3 dell'utente (Memoria dell'app)
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>(() => {
    return DEFAULT_SHARED_TRACKS.map((s) => ({
      id: s.id,
      name: s.name,
      artist: s.artist,
      url: s.audioUrl,
      genre: s.genre,
      bpm: s.bpm,
      beatOffset: s.beatOffset,
      beats: s.beats as BeatEvent[],
      isAnalyzing: false,
      details: 'Canzone salvata nella memoria permanente dell\'app',
    }));
  });
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(() => {
    return DEFAULT_SHARED_TRACKS[0]?.id || null;
  });
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
  const [clickSoundMode, setClickSoundMode] = useState<'bell' | 'clave' | 'all' | 'off'>('bell');
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const lastCustomBeatRef = useRef<number>(-1);
  const scheduledBeatsRef = useRef<Set<number>>(new Set());
  const waitingForTempo1Ref = useRef<boolean>(true);
  const lastAudioSecRef = useRef<number>(-1);
  const smoothedSecRef = useRef<number>(0);
  const lastAudioPerfRef = useRef<number>(performance.now());
  const trial30sTriggeredRef = useRef<boolean>(false);
  const didactic30sTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interrompi ogni riproduzione quando la modale viene chiusa e precarica audio all'apertura
  useEffect(() => {
    if (!isOpen) {
      trial30sTriggeredRef.current = false;
      stopAllPlayback();
    } else {
      if (customAudioRef.current && selectedCustomId) {
        const found =
          sharedTracks.find((s) => s.id === selectedCustomId) ||
          customTracks.find((c) => c.id === selectedCustomId);
        if (found) {
          const targetUrl = 'audioUrl' in found ? (found as any).audioUrl : found.url;
          if (!customAudioRef.current.src || !customAudioRef.current.src.includes(targetUrl)) {
            customAudioRef.current.src = targetUrl;
            customAudioRef.current.load();
          }
        }
      }
    }
  }, [isOpen, selectedCustomId, sharedTracks, customTracks]);

  // Carica le canzoni salvate in memoria permanente dell'app (Server/Cloud + IndexedDB)
  useEffect(() => {
    let isMounted = true;

    async function initializeTrackLibrary() {
      try {
        // 1. Carica i brani dalla memoria del server (accessibili da qualsiasi dispositivo)
        const shared = await fetchSharedTracks();
        if (!isMounted) return;

        let activeId: string | null = null;

        if (shared && shared.length > 0) {
          setSharedTracks(shared);

          // Converti i brani salvati sul server in CustomTrack per il player integrato
          const sharedAsCustom: CustomTrack[] = shared.map((s) => ({
            id: s.id,
            name: s.name,
            artist: s.artist,
            url: s.audioUrl,
            genre: s.genre,
            bpm: s.bpm,
            beatOffset: s.beatOffset,
            beats: s.beats as BeatEvent[],
            isAnalyzing: false,
            details: 'Canzone salvata nella memoria permanente dell\'app',
          }));

          setCustomTracks(sharedAsCustom);
          activeId = shared[0].id;
          setSelectedCustomId(shared[0].id);

          if (customAudioRef.current) {
            customAudioRef.current.src = shared[0].audioUrl;
          }
        }

        // 2. Carica eventuali tracce salvate in IndexedDB e sincronizzale se non sono ancora sul server
        const stored = await getAllStoredTracks();
        if (!isMounted || !stored || stored.length === 0) return;

        const sharedMap = new Map((shared || []).map((s) => [s.id, s]));
        const localTracks: CustomTrack[] = [];

        for (const s of stored) {
          const trackItem: CustomTrack = {
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
            isSaved: true,
          };
          localTracks.push(trackItem);

          // Se questa traccia non è nel server O il server non ha il file audio fisico, caricala subito con il blob audio!
          const serverTrack = sharedMap.get(s.id);
          const needsUpload = !serverTrack || (serverTrack as any).hasAudioFile === false;

          if (needsUpload && s.audioBlob) {
            publishTrackToServer(
              {
                id: s.id,
                name: s.name,
                artist: s.artist,
                genre: s.genre,
                bpm: s.bpm,
                beatOffset: s.beatOffset,
                beats: s.beats || [],
                duration: s.duration,
              },
              s.audioBlob
            )
              .then((res) => {
                if (res.success) {
                  fetchSharedTracks().then((fresh) => {
                    if (isMounted && fresh) setSharedTracks(fresh);
                  });
                }
              })
              .catch(() => {});
          }
        }

        setCustomTracks((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const existingKeys = new Set(
            prev.map((p) => `${p.name.trim().toLowerCase()}|${(p.artist || '').trim().toLowerCase()}`)
          );
          const toAdd = localTracks.filter(
            (l) =>
              !existingIds.has(l.id) &&
              !existingKeys.has(`${l.name.trim().toLowerCase()}|${(l.artist || '').trim().toLowerCase()}`)
          );
          return [...prev, ...toAdd];
        });

        if (!activeId && localTracks.length > 0) {
          setSelectedCustomId(localTracks[0].id);
          if (customAudioRef.current) {
            customAudioRef.current.src = localTracks[0].url;
          }
        }
      } catch (err) {
        console.warn('Errore inizializzazione memoria canzoni:', err);
      }
    }

    initializeTrackLibrary();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ferma qualsiasi riproduzione in corso (sia MP3 che motore didattico)
  const stopAllPlayback = () => {
    if (didactic30sTimeoutRef.current) {
      clearTimeout(didactic30sTimeoutRef.current);
      didactic30sTimeoutRef.current = null;
    }
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
    if (selectedCustomId === shared.id) {
      handleTogglePlayCustom();
      return;
    }
    stopAllPlayback();
    trial30sTriggeredRef.current = false;
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
      isSaved: true,
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
      waitingForTempo1Ref.current = false;
      customAudioRef.current.load();
      customAudioRef.current
        .play()
        .then(() => {
          isPlayingRef.current = true;
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Playback autoplay notice:', err);
        });
    }
  };

  // Salva la canzone esaminata nella memoria dell'app quando l'utente decide che è a tempo
  const handleSaveExaminedTrack = async (track: CustomTrack, isUpdate = false) => {
    if (!track) return;
    setIsPublishing(true);
    setSyncNotice(
      isUpdate
        ? '💾 Aggiornamento calibrazione in memoria...'
        : '💾 Salvataggio della canzone nella memoria dell\'app...'
    );

    try {
      // 1. Recupera o prepara il blob/file audio completo
      let audioBlobToUpload: Blob | File | undefined = track.file;
      const stored = await getAllStoredTracks();
      const existing = stored?.find((s) => s.id === track.id);

      if (!audioBlobToUpload && existing?.audioBlob) {
        audioBlobToUpload = existing.audioBlob;
      } else if (!audioBlobToUpload && track.url && track.url.startsWith('blob:')) {
        try {
          const blobRes = await fetch(track.url);
          if (blobRes.ok) {
            audioBlobToUpload = await blobRes.blob();
          }
        } catch {}
      }

      // Salva nella memoria locale IndexedDB
      if (audioBlobToUpload) {
        await saveTrackToStorage({
          id: track.id,
          name: track.name,
          artist: track.artist,
          genre: track.genre,
          bpm: track.bpm,
          beatOffset: track.beatOffset,
          beats: track.beats || [],
          audioBlob: audioBlobToUpload,
          duration: track.duration || (audioBlobToUpload instanceof File ? audioBlobToUpload.size : undefined),
          savedAt: Date.now(),
          engineVersion: 19,
          recognitionSource: track.recognitionSource,
          details: track.details,
        });
      } else if (existing) {
        await saveTrackToStorage({
          ...existing,
          name: track.name,
          artist: track.artist,
          genre: track.genre,
          bpm: track.bpm,
          beatOffset: track.beatOffset,
          beats: track.beats || [],
          engineVersion: 19,
        });
      }

      // 2. Salva nel cloud/server per renderla disponibile su tutti i dispositivi (con file audio se presente)
      const res = await publishTrackToServer(
        {
          id: track.id,
          name: track.name,
          artist: track.artist,
          genre: track.genre,
          bpm: track.bpm,
          beatOffset: track.beatOffset,
          beats: track.beats || [],
          duration: track.duration || (audioBlobToUpload instanceof File ? audioBlobToUpload.size : customDuration),
        },
        audioBlobToUpload
      );

      // 3. Marca la traccia come salvata nello stato
      const updatedSavedTrack: CustomTrack = {
        ...track,
        isSaved: true,
        url: res.success && res.track?.audioUrl ? res.track.audioUrl : track.url,
      };

      setCustomTracks((prev) =>
        prev.map((t) => (t.id === track.id ? updatedSavedTrack : t))
      );

      // 4. Aggiorna la libreria condivisa delle canzoni in memoria
      const fresh = await fetchSharedTracks();
      if (fresh) {
        setSharedTracks(fresh);
      }

      setSyncNotice(`✓ «${track.name}» salvata a tempo nella memoria dell'app!`);
    } catch (err: any) {
      console.error('Errore salvataggio:', err);
      setSyncNotice('Errore durante il salvataggio nella memoria.');
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
    const { id, name } = trackToDelete;
    stopAllPlayback();

    try {
      // Elimina dal server e dalla memoria locale
      await Promise.all([
        deleteSharedTrackFromServer(id).catch(() => {}),
        deleteTrackFromStorage(id).catch(() => {}),
      ]);

      const local = customTracks.find((t) => t.id === id);
      if (local) {
        try {
          URL.revokeObjectURL(local.url);
        } catch {}
      }

      const remainingShared = sharedTracks.filter((t) => t.id !== id);
      const remainingCustom = customTracks.filter((t) => t.id !== id);
      setSharedTracks(remainingShared);
      setCustomTracks(remainingCustom);

      if (selectedCustomId === id) {
        const nextShared = remainingShared[0];
        const nextCustom = remainingCustom[0];
        if (nextShared) {
          setSelectedCustomId(nextShared.id);
          if (customAudioRef.current) {
            customAudioRef.current.src = nextShared.audioUrl;
            customAudioRef.current.load();
          }
        } else if (nextCustom) {
          setSelectedCustomId(nextCustom.id);
          if (customAudioRef.current) {
            customAudioRef.current.src = nextCustom.url;
            customAudioRef.current.load();
          }
        } else {
          setSelectedCustomId(null);
          if (customAudioRef.current) {
            customAudioRef.current.src = '';
          }
        }
      }

      setSyncNotice(`✓ Canzone «${name}» eliminata dalla memoria dell'app.`);
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
  const currentSharedTrack = sharedTracks.find((t) => t.id === selectedCustomId);
  const currentCustomTrack =
    customTracks.find((t) => t.id === selectedCustomId) ||
    (currentSharedTrack
      ? ({
          id: currentSharedTrack.id,
          name: currentSharedTrack.name,
          artist: currentSharedTrack.artist,
          url: currentSharedTrack.audioUrl,
          genre: currentSharedTrack.genre,
          bpm: currentSharedTrack.bpm,
          beatOffset: currentSharedTrack.beatOffset,
          beats: currentSharedTrack.beats as BeatEvent[],
          isAnalyzing: false,
          details: 'Canzone salvata nella memoria dell\'app',
        } as CustomTrack)
      : undefined);

  // --- CONTROLLO RIPRODUZIONE CANZONI DIDATTICHE ---
  const handleTogglePlayDidactic = async () => {
    if (isPlaying) {
      stopAllPlayback();
    } else {
      stopAllPlayback();
      trial30sTriggeredRef.current = false;
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
        if (clickSoundMode !== 'off') {
          playCustomClickSoundAtTime(beatNum, clickSoundMode, undefined, currentDidacticTrack.genre);
        }
      });

      try {
        await harmonizedEngine.start();
        isPlayingRef.current = true;
        setIsPlaying(true);

        // Timer di 30 secondi per la prova gratuita su brano didattico
        if (isTrial) {
          didactic30sTimeoutRef.current = setTimeout(() => {
            if (isPlayingRef.current && !trial30sTriggeredRef.current) {
              trial30sTriggeredRef.current = true;
              stopAllPlayback();
              onOpenUnlock?.('Hai ascoltato i 30 secondi di prova del brano. Sblocca la versione completa per allenarti senza limiti di tempo su tutti i 30 brani Salsa & Bachata!');
            }
          }, 30000);
        }
      } catch (err) {
        console.warn('Errore avvio motore didattico:', err);
      }
    }
  };

  const handleSelectDidacticTrack = (track: MusicTrack) => {
    stopAllPlayback();
    trial30sTriggeredRef.current = false;
    setSelectedDidacticId(track.id);
    harmonizedEngine.selectTrack(track.id);
    harmonizedEngine.setOnBeat((beatNum, chordName) => {
      setActiveBeat(beatNum);
      setCurrentChordName(
        beatNum === 0
          ? 'Tempo 1'
          : beatNum === 4
          ? 'Tempo 5'
          : `Tempo ${beatNum + 1}`
      );
      if (clickSoundMode !== 'off') {
        playCustomClickSoundAtTime(beatNum, clickSoundMode, undefined, track.genre);
      }
    });
    harmonizedEngine.start().then(() => {
      isPlayingRef.current = true;
      setIsPlaying(true);

      if (isTrial) {
        didactic30sTimeoutRef.current = setTimeout(() => {
          if (isPlayingRef.current && !trial30sTriggeredRef.current) {
            trial30sTriggeredRef.current = true;
            stopAllPlayback();
            onOpenUnlock?.('Hai ascoltato i 30 secondi di prova del brano. Sblocca la versione completa per allenarti senza limiti di tempo su tutti i 30 brani Salsa & Bachata!');
          }
        }, 30000);
      }
    });
  };

  // --- CONTROLLO RIPRODUZIONE CANZONI MP3 UTENTE ---
  const handleTogglePlayCustom = () => {
    if (isPlayingRef.current) {
      stopAllPlayback();
    } else {
      if (customAudioRef.current && currentCustomTrack) {
        harmonizedEngine.stop();
        trial30sTriggeredRef.current = false;
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
        const firstAudioTime = beats && beats.length > 0 ? beats[0].time : 0;

        if (curTime < firstAudioTime) {
          waitingForTempo1Ref.current = true;
          setActiveBeat(-1);
          setCurrentChordName('In attesa della prima battuta...');
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
    if (selectedCustomId === track.id) {
      handleTogglePlayCustom();
      return;
    }
    stopAllPlayback();
    trial30sTriggeredRef.current = false;
    setSelectedCustomId(track.id);
    if (customAudioRef.current) {
      customAudioRef.current.src = track.url;
      customAudioRef.current.currentTime = 0;
      smoothedSecRef.current = 0;
      lastAudioSecRef.current = -1;
      waitingForTempo1Ref.current = false;
      customAudioRef.current.load();
    }
  };

  const handleSeekCustom = (newTime: number) => {
    if (isTrial && newTime >= 30) {
      stopAllPlayback();
      if (customAudioRef.current) {
        customAudioRef.current.currentTime = 0;
        setCustomCurrentTime(0);
      }
      onOpenUnlock?.('In modalità prova puoi ascoltare i primi 30 secondi. Sblocca la versione completa per ascoltare il brano intero!');
      return;
    }
    trial30sTriggeredRef.current = false;
    setCustomCurrentTime(newTime);
    if (customAudioRef.current) {
      customAudioRef.current.currentTime = newTime;
    }
    smoothedSecRef.current = newTime;
    lastAudioSecRef.current = -1;
    lastAudioPerfRef.current = performance.now();
    lastCustomBeatRef.current = -1;

    const beats = currentCustomTrack?.beats;
    const firstAudioTime = beats && beats.length > 0 ? beats[0].time : 0;

    if (newTime < firstAudioTime) {
      waitingForTempo1Ref.current = true;
      setActiveBeat(-1);
      setCurrentChordName('In attesa della prima battuta...');
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
        const songGenre = currentCustomTrack.genre || 'bachata';

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
          let tBack = offset - period;
          let bBack = 7;
          while (tBack >= 0) {
            beats.unshift({
              time: Number(tBack.toFixed(3)),
              beat: bBack % 8,
            });
            tBack -= period;
            bBack = (bBack - 1 + 8) % 8;
          }
        } else if (beats.length > 0 && beats[0].time > 0.25) {
          // Se la traccia ha battute registrate che iniziano più tardi (es. dopo l'intro),
          // estrapoliamo all'indietro a tempo fino a 0s per consentire al metronomo e ai tempi 1 e 5 di accendersi subito
          const trackBpm = currentCustomTrack.bpm || 130;
          const period = 60.0 / trackBpm;
          const extended = [...beats];
          let tBack = extended[0].time - period;
          let bBack = (extended[0].beat - 1 + 8) % 8;
          while (tBack >= 0) {
            extended.unshift({
              time: Number(tBack.toFixed(3)),
              beat: bBack % 8,
            });
            tBack -= period;
            bBack = (bBack - 1 + 8) % 8;
          }
          beats = extended;
        }

        // 1. SCHEDULER AUDIO LOOKAHEAD AD ALTA PRECISIONE SU WEB AUDIO API
        // Pre-programma gli oscillatori sui millisecondi esatti del clock hardware
        if (clickSoundMode !== 'off' && beats.length > 0) {
          if (!customAudioCtx) {
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            customAudioCtx = new AudioCtx();
          }
          if (customAudioCtx.state === 'suspended') {
            customAudioCtx.resume().catch(() => {});
          }

          const lookaheadSec = 0.120; // Finestra di anticipo 120ms
          const ctxNow = customAudioCtx.currentTime;

          if (scheduledBeatsRef.current.size > 300) {
            scheduledBeatsRef.current.clear();
          }

          for (let i = 0; i < beats.length; i++) {
            const b = beats[i];
            if (b.time >= currentSec - 0.015 && b.time < currentSec + lookaheadSec) {
              const beatKey = Math.round(b.time * 1000);
              if (!scheduledBeatsRef.current.has(beatKey)) {
                scheduledBeatsRef.current.add(beatKey);
                const delay = Math.max(0, b.time - currentSec);
                const targetAudioTime = ctxNow + delay;
                playCustomClickSoundAtTime(b.beat, clickSoundMode, targetAudioTime, songGenre);
              }
            } else if (b.time >= currentSec + lookaheadSec) {
              break;
            }
          }
        }

        const firstBeatTime = beats[0]?.time ?? 0;

        if (currentSec < firstBeatTime) {
          waitingForTempo1Ref.current = true;
          setActiveBeat(-1);
          setCurrentChordName('In attesa della prima battuta...');
          animId = requestAnimationFrame(syncBeatWithAudio);
          return;
        }

        waitingForTempo1Ref.current = false;

        // Ricerca binaria per determinare quale battito è visivamente attivo
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

  // Sincronizzazione centralizzata modifiche traccia (State + IndexedDB + Cloud Server)
  const syncTrackUpdate = async (updated: CustomTrack, notice?: string) => {
    // 1. Aggiorna stato React customTracks
    setCustomTracks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );

    // Se la traccia è già salvata nella memoria permanente, sincronizza le modifiche su storage e server
    if (updated.isSaved) {
      // 2. Aggiorna stato React sharedTracks se presente
      setSharedTracks((prev) =>
        prev.map((t) =>
          t.id === updated.id
            ? {
                ...t,
                bpm: updated.bpm,
                beatOffset: updated.beatOffset,
                beats: updated.beats || [],
                genre: updated.genre,
              }
            : t
        )
      );

      // 3. Salva nella memoria locale IndexedDB
      try {
        const stored = await getAllStoredTracks();
        const existing = stored?.find((s) => s.id === updated.id);
        if (existing) {
          await saveTrackToStorage({
            ...existing,
            bpm: updated.bpm,
            beatOffset: updated.beatOffset,
            beats: updated.beats || [],
            genre: updated.genre,
            engineVersion: 19,
          });
        } else if (updated.file) {
          await saveTrackToStorage({
            id: updated.id,
            name: updated.name,
            artist: updated.artist,
            genre: updated.genre,
            bpm: updated.bpm,
            beatOffset: updated.beatOffset,
            beats: updated.beats || [],
            audioBlob: updated.file,
            duration: updated.file.size,
            savedAt: Date.now(),
            engineVersion: 19,
          });
        }
      } catch (e) {
        console.warn('Errore IndexedDB sync:', e);
      }

      // 4. Salva sul server per la sincronizzazione fra tutti i dispositivi
      try {
        await publishTrackToServer({
          id: updated.id,
          name: updated.name,
          artist: updated.artist,
          genre: updated.genre,
          bpm: updated.bpm,
          beatOffset: updated.beatOffset,
          beats: updated.beats || [],
        });
      } catch (e) {
        console.warn('Errore Server cloud sync:', e);
      }
    }

    scheduledBeatsRef.current.clear();
    lastCustomBeatRef.current = -1;

    if (notice) {
      setSyncNotice(notice);
      setTimeout(() => setSyncNotice(null), 3000);
    }
  };

  // Rianalisi intelligente del ritmo con Essentia MIR ad altissima definizione
  const handleReanalyzeCurrentTrack = async () => {
    if (!currentCustomTrack) return;
    setIsReanalyzing(true);
    setSyncNotice('🧠 Analisi ritmica profonda con Essentia MIR in corso...');

    try {
      let audioBlob: Blob | null = null;
      if (currentCustomTrack.file) {
        audioBlob = currentCustomTrack.file;
      } else if (currentCustomTrack.url) {
        const res = await fetch(currentCustomTrack.url);
        if (res.ok) {
          audioBlob = await res.blob();
        }
      }

      if (!audioBlob) {
        throw new Error('File audio non reperibile.');
      }

      const fileObj = new File([audioBlob], currentCustomTrack.name + '.mp3', {
        type: audioBlob.type || 'audio/mpeg',
      });
      const analysis = await analyzeAudioFile(fileObj, currentCustomTrack.genre);

      if (analysis && analysis.bpm && Array.isArray(analysis.beats) && analysis.beats.length > 0) {
        const updatedTrack: CustomTrack = {
          ...currentCustomTrack,
          bpm: analysis.bpm,
          beatOffset: analysis.beatOffset,
          beats: analysis.beats,
          genre: analysis.genre || currentCustomTrack.genre,
          details: analysis.details,
        };

        await syncTrackUpdate(
          updatedTrack,
          `✨ Calcolato con precisione: ${analysis.bpm} BPM • Tempo 1 a ${analysis.beatOffset.toFixed(2)}s!`
        );
      } else {
        setSyncNotice('⚠️ Rilevamento ritmico completato con parametri invariati.');
      }
    } catch (err) {
      console.warn('Errore rianalisi automatica:', err);
      setSyncNotice('⚠️ Impossibile eseguire la rianalisi automatica.');
    } finally {
      setIsReanalyzing(false);
      setTimeout(() => setSyncNotice(null), 3500);
    }
  };

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

    waitingForTempo1Ref.current = false;
    setActiveBeat(0);
    setCurrentChordName('Tempo 1');

    if (clickSoundMode !== 'off') {
      playCustomClickSoundAtTime(0, clickSoundMode);
    }

    await syncTrackUpdate(
      updatedTrack,
      `🎯 Tempo 1 bloccato a ${baseOffset.toFixed(2)}s! Sincronizzato su tutti i dispositivi.`
    );
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

    await syncTrackUpdate(
      updatedTrack,
      `✓ ${label}! Nuovo Tempo 1: ${newOffset.toFixed(2)}s`
    );
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

    await syncTrackUpdate(
      updatedTrack,
      `Regolato ${deltaMs > 0 ? '+' : ''}${deltaMs}ms (1 a ${newOffset.toFixed(2)}s)`
    );
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

    await syncTrackUpdate(
      updatedTrack,
      `✓ Velocità aggiornata a ${clampedBpm} BPM (Salvata nella memoria dell'app)`
    );
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

    await syncTrackUpdate(
      updatedTrack,
      `✓ Impostato come ${newGenre === 'salsa' ? 'Salsa' : 'Bachata'} (${targetBpm} BPM)`
    );
  };

  // Caricamento file audio MP3 originali per esame e calibrazione (NON salvati automaticamente)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setSyncNotice(`⚡ Caricamento ed esame di ${fileList.length} canzoni...`);

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
          isSaved: false, // In esame: salvataggio solo su richiesta esplicita dell'utente
        };

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
          isSaved: false, // In esame: salvataggio solo su richiesta esplicita dell'utente
        };

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
        customAudioRef.current.currentTime = 0;
        smoothedSecRef.current = 0;
        lastAudioSecRef.current = -1;
        waitingForTempo1Ref.current = false;
        customAudioRef.current.load();
      }
      setActiveTab('custom');
    }

    if (newTracks.length === 1) {
      setSyncNotice(
        `⚡ «${newTracks[0].name}» pronta da esaminare (${newTracks[0].bpm} BPM). Ascoltala e calibrala: quando è a tempo premi "Salva Canzone"!`
      );
    } else {
      setSyncNotice(
        `⚡ ${newTracks.length} canzoni caricate per l'esame. Ascoltale e salvale quando decidi che sono a tempo!`
      );
    }
    setTimeout(() => setSyncNotice(null), 5000);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div className="w-full max-w-xl max-h-[94vh] bg-[#182033] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-card flex flex-col relative overflow-hidden my-auto">
        {/* Header Principale */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gold-soft flex items-center justify-center text-[#E5B869] shadow-sm">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-[#f7f6f3] leading-tight">
                Accademia del Ritmo: Salsa & Bachata
              </h2>
              <p className="text-xs text-[#9da6b9]">
                Basi a tempo perfetto per tutti gli allievi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Esci dall'Allenatore di Ritmo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d121e] hover:bg-[#212b42] text-[#f7f6f3] border border-white/10 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <X className="w-4 h-4 text-[#E5B869]" />
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

        {/* Banner Modalità Prova Gratuita */}
        {isTrial && (
          <div className="mt-2 p-2.5 rounded-xl bg-[#F9C03E]/15 border border-[#F9C03E]/40 text-xs text-[#F9C03E] flex items-center justify-between gap-2 shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0 text-[#F9C03E]" />
              <span>Modalità Prova: <strong>30 secondi</strong> per brano</span>
            </span>
            <button
              onClick={() => onOpenUnlock?.('Sblocca la versione completa per ascoltare tutti i brani senza limiti di tempo e caricare la tua musica!')}
              className="text-[11px] underline font-bold hover:text-white cursor-pointer"
            >
              Sblocca Completa →
            </button>
          </div>
        )}

        {/* Switcher a 3 Tab: Canzoni in Memoria, Didattiche, Carica Nuova Canzone */}
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
            <span>In Memoria ({sharedTracks.length})</span>
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
            <span>Didattiche ({MUSIC_TRACKS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isTrial) {
                onOpenUnlock?.('Il caricamento e la calibrazione di brani personali sono riservati alla versione completa. Sblocca per caricare tutta la tua musica!');
                return;
              }
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
            {isTrial ? (
              <span className="flex items-center gap-1 text-[#F9C03E]">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Carica</span>
                <span className="text-[9px] px-1 bg-[#F9C03E]/20 rounded">PRO</span>
              </span>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Carica Canzone</span>
              </>
            )}
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
                      ? '🎵 Canzone Salvata in Memoria'
                      : currentCustomTrack?.isSaved === false
                      ? '🎧 Canzone in Esame (Non Salvata)'
                      : '🎧 Canzone MP3'}
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
                  {activeTab !== 'didactic' && currentCustomTrack && (
                    currentCustomTrack.isSaved === false ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0">
                        ⏳ In Esame (Non Salvata)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
                        ✓ Salvata in Memoria
                      </span>
                    )
                  )}
                  {currentChordName && isPlaying && (
                    <span className="text-[10px] text-amber-300 font-mono font-semibold animate-pulse truncate">
                      {currentChordName}
                    </span>
                  )}
                </div>
              </div>

              {/* Tasti Controllo Riproduzione, Salvataggio ed Eliminazione Canzone */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                {activeTab !== 'didactic' && currentCustomTrack && currentCustomTrack.isSaved === false && (
                  <button
                    type="button"
                    onClick={() => handleSaveExaminedTrack(currentCustomTrack)}
                    disabled={isPublishing}
                    title="Salva questa canzone nella memoria dell'app adesso che hai verificato che è a tempo"
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-[#021831] font-black text-xs flex items-center gap-1.5 shadow-md border border-emerald-300 transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5 text-[#021831]" />
                    <span>{isPublishing ? 'Salvataggio...' : 'Salva Canzone a Tempo'}</span>
                  </button>
                )}

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
              <div className="pt-2 border-t border-[#88A5BF]/20 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                  <span>{formatTime(customCurrentTime)}</span>
                  <span>{isTrial ? '00:30 (Anteprima Prova)' : formatTime(customDuration)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={isTrial ? 30 : (customDuration || 100)}
                  value={isTrial ? Math.min(30, customCurrentTime) : customCurrentTime}
                  onChange={(e) => handleSeekCustom(Number(e.target.value))}
                  className="w-full accent-[#F9C03E] cursor-pointer h-1.5 bg-[#021831] rounded-lg"
                />

                {/* Banner di avviso se la canzone è in esame e non ancora salvata */}
                {currentCustomTrack.isSaved === false && (
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-between gap-2 flex-wrap mt-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F9C03E] shrink-0" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block">
                          Canzone in Esame (Non Salvata)
                        </span>
                        <span className="text-[11px] text-amber-200 block">
                          Ascoltala, verifica le battute 1 e 5. Quando decidi tu che è a tempo, premi il pulsante per salvarla.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveExaminedTrack(currentCustomTrack)}
                      disabled={isPublishing}
                      className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-[#021831] text-xs font-black flex items-center gap-1.5 shadow-md border border-emerald-300 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5 text-[#021831]" />
                      <span>{isPublishing ? 'Salvataggio...' : 'Salva Canzone a Tempo'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BATTUTE MUSICALI (DA 1 A 8) */}
          <div className="glass-card p-3 sm:p-4 text-center space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#88A5BF]/20">
              <span className="text-xs font-semibold text-[#88A5BF]">
                Battute Musicali (1-8)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {isPlaying ? (activeBeat >= 0 ? `Battuta ${activeBeat + 1}` : 'In attesa') : 'Fermo'}
              </span>
            </div>

            {/* Griglia 1 a 8 - Si accendono in oro brillante SOLO l'1 e il 5 */}
            <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
              {beatList.map((item, idx) => {
                const isTempo1 = idx === 0;
                const isTempo5 = idx === 4;
                const isDownbeat = isTempo1 || isTempo5;
                const isActive = isPlaying && activeBeat === idx;

                let padClasses = '';
                if (isActive) {
                  if (isDownbeat) {
                    padClasses =
                      'bg-gradient-to-b from-[#FFF59D] via-[#F9C03E] to-[#D99B00] text-[#021831] border-2 border-white shadow-[0_0_35px_rgba(249,192,62,1),0_0_18px_rgba(255,255,255,0.9)] scale-110 -translate-y-1.5 font-black ring-4 ring-[#F9C03E] z-20';
                  } else {
                    padClasses =
                      'bg-slate-700/90 text-slate-100 border-2 border-slate-400/80 shadow-[0_0_12px_rgba(203,213,225,0.4)] scale-105 -translate-y-0.5 font-bold z-10';
                  }
                } else if (isDownbeat) {
                  padClasses =
                    'bg-[#021831]/85 border-2 border-[#F9C03E]/35 text-[#F9C03E]/75 font-bold hover:border-[#F9C03E]/60';
                } else {
                  padClasses =
                    'bg-[#021831]/60 border border-slate-800 text-slate-500 font-medium';
                }

                return (
                  <div
                    key={idx}
                    className={`py-3 sm:py-3.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-75 select-none relative overflow-hidden ${padClasses}`}
                  >
                    {/* Aura ripple per 1 e 5 */}
                    {isActive && isDownbeat && (
                      <span className="absolute inset-0 rounded-xl bg-white/35 animate-ping pointer-events-none" />
                    )}
                    <span
                      className={`text-lg sm:text-2xl font-bold font-mono leading-none ${
                        isActive && isDownbeat ? 'text-[#021831] font-black' : ''
                      }`}
                    >
                      {item.num}
                    </span>
                    {isTempo1 ? (
                      <span
                        className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight mt-0.5 ${
                          isActive ? 'text-[#021831] font-black' : 'text-[#F9C03E]'
                        }`}
                      >
                        1° Forte
                      </span>
                    ) : isTempo5 ? (
                      <span
                        className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight mt-0.5 ${
                          isActive ? 'text-[#021831] font-black' : 'text-[#F9C03E]'
                        }`}
                      >
                        5° Forte
                      </span>
                    ) : (
                      <span
                        className={`text-[8px] font-semibold tracking-tight mt-0.5 transition-opacity ${
                          isActive ? 'text-slate-200 opacity-90' : 'opacity-0 select-none'
                        }`}
                      >
                        {item.num === 4 || item.num === 8 ? 'Pausa' : `${item.num}°`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SELETTORE SUONO GUIDA RITMO (Disponibile per tutte le modalità) */}
            <div className="pt-2.5 flex flex-col gap-2.5 border-t border-[#88A5BF]/20 text-left">
              <div className="p-2.5 rounded-xl bg-[#042B58]/80 border border-[#88A5BF]/25 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {clickSoundMode === 'off' ? (
                    <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <Bell className="w-4 h-4 text-[#F9C03E] shrink-0" />
                  )}
                  <span className="text-xs text-white font-bold">
                    Suono Guida Ritmo:
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setClickSoundMode('bell')}
                    title="Campana Latina autentica sui tempi 1 e 5 (downbeat)"
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      clickSoundMode === 'bell'
                        ? 'bg-[#F9C03E] text-[#042B58] shadow-sm font-black'
                        : 'bg-[#021831] text-slate-300 hover:text-white border border-[#88A5BF]/20'
                    }`}
                  >
                    🔔 Campana (1 e 5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickSoundMode('clave')}
                    title="Clave Cubana tradizionale in legno"
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      clickSoundMode === 'clave'
                        ? 'bg-[#F9C03E] text-[#042B58] shadow-sm font-black'
                        : 'bg-[#021831] text-slate-300 hover:text-white border border-[#88A5BF]/20'
                    }`}
                  >
                    🪘 Clave
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickSoundMode('all')}
                    title="Metronomo accentato su tutte le battute (1-8)"
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      clickSoundMode === 'all'
                        ? 'bg-[#F9C03E] text-[#042B58] shadow-sm font-black'
                        : 'bg-[#021831] text-slate-300 hover:text-white border border-[#88A5BF]/20'
                    }`}
                  >
                    ⏱️ Click 1-8
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickSoundMode('off')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      clickSoundMode === 'off'
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                        : 'bg-[#021831] text-slate-400 hover:text-white border border-[#88A5BF]/20'
                    }`}
                  >
                    🔕 Muto
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: CANZONI NELLA MEMORIA DELL'APP */}
          {activeTab === 'shared' && (
            <div className="glass-card p-3 sm:p-4 space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Disc3 className="w-4 h-4 text-[#F9C03E]" />
                    <span>Canzoni nella Memoria dell&apos;App ({filteredSharedTracks.length})</span>
                  </span>
                  <p className="text-[10px] text-[#88A5BF]">
                    Salvate nella memoria dell&apos;app: disponibili da qualsiasi tuo dispositivo.
                  </p>
                </div>

                {/* Filtro genere per Canzoni in Memoria */}
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
                  <p className="font-semibold text-white">Nessuna canzone ancora salvata nella memoria dell&apos;app.</p>
                  <p className="text-[11px] text-[#88A5BF] max-w-sm mx-auto">
                    Vai nella scheda <strong>&quot;Carica Canzone&quot;</strong>: carica un brano, esaminalo e quando è perfettamente a tempo salvalo nella memoria dell&apos;app per renderlo disponibile su tutti i tuoi dispositivi!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    className="mt-2 py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carica Canzone</span>
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
                            <span className="w-7 h-7 rounded-lg bg-[#F9C03E] text-[#042B58] flex items-center justify-center font-bold shadow-sm">
                              <Disc3 className="w-4 h-4 animate-spin" />
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-lg bg-[#021831] text-[#F9C03E] hover:text-white flex items-center justify-center border border-[#88A5BF]/20 transition-colors">
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </span>
                          )}
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
                    Tutte ({MUSIC_TRACKS.length})
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
                    Bachata ({MUSIC_TRACKS.filter((t) => t.genre === 'bachata').length})
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
                    Salsa ({MUSIC_TRACKS.filter((t) => t.genre === 'salsa').length})
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
                    <span>Carica Canzoni MP3</span>
                  </span>
                  <p className="text-[10px] text-[#88A5BF]">
                    ⚡ <strong>Esamina prima di salvare:</strong> carica qualsiasi canzone MP3 per esaminarla. Verrà salvata nella memoria dell&apos;app solo quando decidi tu premendo il pulsante <strong>&quot;Salva Canzone&quot;</strong>!
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
                <div className="p-6 text-center text-xs text-slate-400 space-y-2.5 border border-dashed border-[#88A5BF]/30 rounded-2xl bg-[#021831]/50">
                  <Upload className="w-8 h-8 text-[#F9C03E] mx-auto opacity-80" />
                  <p className="font-semibold text-white">Carica le tue canzoni MP3 per esaminarle</p>
                  <p className="text-[11px] text-[#88A5BF] max-w-sm mx-auto leading-relaxed">
                    Premi il tasto giallo <strong>&quot;Carica Canzoni MP3&quot;</strong> qui sopra: potrai ascoltare la canzone, verificare le battute e salvarla nella memoria dell&apos;app solo quando decidi tu che è perfettamente a tempo!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 pt-1 max-h-64 overflow-y-auto pr-1">
                  {filteredCustomTracks.map((track) => {
                    const isSelected = selectedCustomId === track.id;
                    const isTrackSaved = track.isSaved !== false;
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
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold text-[#F9C03E]">
                              {track.genre === 'salsa' ? '💃 Salsa' : '✨ Bachata'} • {track.bpm} BPM
                            </span>
                            {isSelected && (
                              <span className="text-[10px] text-amber-300 flex items-center gap-0.5 font-semibold">
                                <Check className="w-3 h-3" /> In esame
                              </span>
                            )}
                            {isTrackSaved ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✓ Salvata in memoria
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                ⏳ Da esaminare (non salvata)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!isTrackSaved && (
                            <button
                              type="button"
                              onClick={() => handleSaveExaminedTrack(track)}
                              disabled={isPublishing}
                              title="Salva questa canzone nella memoria dell'app adesso che è a tempo"
                              className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-[#021831] font-black text-[10px] flex items-center gap-1 shadow cursor-pointer transition-all active:scale-95"
                            >
                              <Save className="w-3 h-3 text-[#021831]" />
                              <span>Salva</span>
                            </button>
                          )}

                          <button
                            type="button"
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
              const cur = customAudioRef.current.currentTime;
              setCustomCurrentTime(cur);

              // Limite 30 secondi per la prova: scatta quando la riproduzione raggiunge i 30 secondi
              if (isTrial && cur >= 30 && !trial30sTriggeredRef.current) {
                trial30sTriggeredRef.current = true;
                stopAllPlayback();
                if (customAudioRef.current) {
                  customAudioRef.current.currentTime = 0;
                  setCustomCurrentTime(0);
                }
                onOpenUnlock?.('Hai ascoltato i 30 secondi di prova del brano. Sblocca la versione completa per allenarti senza limiti di tempo su tutti i 30 brani Salsa & Bachata!');
              }
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
