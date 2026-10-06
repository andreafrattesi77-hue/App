import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  TrendingUp,
  Plus,
  Minus,
  Sparkles,
  Bot,
  Award,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  Flame,
  BookOpen,
  Video,
} from 'lucide-react';
import { EveningEntry, UserData } from '../types';
import {
  getDiaryEntries,
  saveDiaryEntry,
  deleteDiaryEntry,
  getUserData,
  getMissionsProgress,
  getCoachDailyUsage,
  incrementCoachUsage,
} from '../services/storage';
import { getEveningAdvice } from '../services/api';
import { MISSIONS_21, PROFILES } from '../config';
import { getUnita, TUTTE_LE_UNITA } from '../../content/index';

interface DiaryScreenProps {
  user: UserData;
  onOpenUnita: (id: string) => void;
}

const THERMOMETER_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Nessuna connessione (freddo/distacco)', color: 'text-slate-400' },
  2: { text: 'Poco ascolto (meccanico/frettoloso)', color: 'text-sky-300' },
  3: { text: 'Buon ballo (piacevole ma convenzionale)', color: 'text-[#88A5BF]' },
  4: { text: 'Forte connessione (sguardi vivi, intesa reale)', color: 'text-amber-400' },
  5: { text: 'Lei ha voluto restare (Filo magnetico)', color: 'text-[#F9C03E]' },
};

export const DiaryScreen: React.FC<DiaryScreenProps> = ({ user, onOpenUnita }) => {
  const [activeTab, setActiveTab] = useState<'compila' | 'progressi'>('compila');
  const [entries, setEntries] = useState<EveningEntry[]>([]);

  // Form states
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [venue, setVenue] = useState('');
  const [rating, setRating] = useState<number>(3);
  const [invitesCount, setInvitesCount] = useState<number>(3);
  const [elegantNoCount, setElegantNoCount] = useState<number>(0);
  const [calamitaClosuresCount, setCalamitaClosuresCount] = useState<number>(1);
  const [missionCompleted, setMissionCompleted] = useState<boolean>(true);
  const [whatWorked, setWhatWorked] = useState('');
  const [whatToImprove, setWhatToImprove] = useState('');

  // Selected entry for viewing/editing or receiving advice
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [adviceNotice, setAdviceNotice] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getDiaryEntries());
  }, []);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue.trim()) {
      alert('Inserisci il nome del locale o evento.');
      return;
    }

    const newEntry: EveningEntry = {
      id: savedEntryId || `evening-${Date.now()}`,
      date,
      venue: venue.trim(),
      rating,
      invitesCount,
      elegantNoCount,
      calamitaClosuresCount,
      missionCompleted,
      whatWorked: whatWorked.trim(),
      whatToImprove: whatToImprove.trim(),
      coachAdvice: savedEntryId
        ? entries.find((e) => e.id === savedEntryId)?.coachAdvice
        : undefined,
      createdAt: savedEntryId
        ? entries.find((e) => e.id === savedEntryId)?.createdAt || Date.now()
        : Date.now(),
    };

    const updated = saveDiaryEntry(newEntry);
    setEntries(updated);
    setSavedEntryId(newEntry.id);
    setAdviceNotice('Serata salvata nel tuo diario!');
  };

  const handleRequestCoachAdvice = async (entryToAdvise?: EveningEntry) => {
    const target = entryToAdvise || entries.find((e) => e.id === savedEntryId);
    if (!target) return;

    // Check daily limit
    const usage = getCoachDailyUsage();
    if (!usage.canSend) {
      alert(
        'Hai usato i 20 messaggi del Coach previsti per oggi. Il Coach torna disponibile domani a mezzanotte!'
      );
      return;
    }

    setIsGettingAdvice(true);
    setAdviceNotice(null);

    // Consume 1 message
    incrementCoachUsage();

    const userData = getUserData();
    const profileName = userData?.profile ? PROFILES[userData.profile]?.name : undefined;

    const missionsProg = getMissionsProgress();
    const curMission = MISSIONS_21.find((m) => !missionsProg[m.id]?.completed) || MISSIONS_21[0];
    const missionName = `Serata ${curMission.id}: ${curMission.title}`;

    try {
      const advice = await getEveningAdvice({
        evening: target,
        currentMission: missionName,
        readingUnitId: curMission.readingUnitId,
        userProfile: profileName,
        userName: userData?.name,
        previousAdvice: target.coachAdvice,
      });

      const updatedEntry = { ...target, coachAdvice: advice };
      const updatedList = saveDiaryEntry(updatedEntry);
      setEntries(updatedList);
      setAdviceNotice('Consiglio del Coach ricevuto e salvato!');
    } catch {
      alert('Il Coach è momentaneamente occupato, riprova tra poco.');
    } finally {
      setIsGettingAdvice(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Vuoi eliminare questa serata dal diario?')) {
      const updated = deleteDiaryEntry(id);
      setEntries(updated);
      if (savedEntryId === id) setSavedEntryId(null);
    }
  };

  const handleNewEveningForm = () => {
    setSavedEntryId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setVenue('');
    setRating(3);
    setInvitesCount(3);
    setElegantNoCount(0);
    setCalamitaClosuresCount(1);
    setMissionCompleted(true);
    setWhatWorked('');
    setWhatToImprove('');
    setAdviceNotice(null);
    setActiveTab('compila');
  };

  // Helper to render text with [[id]] as chips
  const renderAdviceText = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[\[([a-zA-Z0-9_-]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const id = match[1];
      const targetUnit = getUnita(id);

      if (targetUnit) {
        parts.push(
          <button
            key={`link-${match.index}`}
            type="button"
            onClick={() => onOpenUnita(targetUnit.id)}
            className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-1 rounded-full bg-[#042B58] hover:bg-[#F9C03E] text-[#F9C03E] hover:text-[#042B58] border border-[#F9C03E]/50 text-[11px] font-bold transition-colors align-middle shadow-sm"
          >
            <BookOpen className="w-3 h-3" />
            <span>
              {targetUnit.label} – {targetUnit.titolo}
            </span>
          </button>
        );
      } else {
        parts.push(id);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Progress metrics calculation
  const totalInvites = entries.reduce((sum, e) => sum + (e.invitesCount || 0), 0);
  const totalNoCount = entries.reduce((sum, e) => sum + (e.elegantNoCount || 0), 0);
  const averageRating =
    entries.length > 0
      ? (
          entries.slice(0, 5).reduce((sum, e) => sum + e.rating, 0) /
          Math.min(5, entries.length)
        ).toFixed(1)
      : '0.0';

  const readChaptersCount = (user.readUnits || []).length;
  const watchedVideosCount = (user.watchedVideos || []).length;

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-28 space-y-4 animate-fadeIn">
      {/* Tab toggle */}
      <div className="flex bg-[#021831] p-1 rounded-2xl border border-slate-700/60">
        <button
          onClick={() => setActiveTab('compila')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'compila'
              ? 'bg-[#234C77] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {savedEntryId ? 'Modifica Serata' : 'Compila Serata'}
        </button>
        <button
          onClick={() => setActiveTab('progressi')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'progressi'
              ? 'bg-[#234C77] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>I miei progressi ({entries.length})</span>
        </button>
      </div>

      {activeTab === 'compila' ? (
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <div className="glass-card p-5 space-y-4 border border-[#88A5BF]/30">
            <div className="flex items-center justify-between pb-2 border-b border-[#88A5BF]/20">
              <h2 className="text-base font-serif font-bold text-white">
                Diario della Serata
              </h2>
              {savedEntryId && (
                <button
                  type="button"
                  onClick={handleNewEveningForm}
                  className="text-xs text-[#F9C03E] hover:underline"
                >
                  + Nuova Serata
                </button>
              )}
            </div>

            {/* Date & Venue */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#88A5BF] uppercase mb-1">
                  Data
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 bg-[#021831] border border-[#88A5BF]/30 rounded-xl text-white text-xs focus:outline-none focus:border-[#F9C03E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#88A5BF] uppercase mb-1">
                  Locale / Evento
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Es. Palacavicchi, Tropicana"
                    required
                    className="w-full pl-8 pr-2 py-2 bg-[#021831] border border-[#88A5BF]/30 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F9C03E]"
                  />
                </div>
              </div>
            </div>

            {/* Termometro del Filo (Slider 1 - 5) */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-[#88A5BF] uppercase">
                  Termometro del Filo
                </label>
                <span className="font-mono font-bold text-sm text-[#F9C03E]">
                  {rating}/5
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full accent-[#F9C03E] cursor-pointer h-2 bg-[#021831] rounded-lg"
              />

              <div className="mt-1.5 p-2 bg-[#021831]/70 rounded-xl border border-slate-700/60 text-center">
                <p className={`text-xs font-semibold ${THERMOMETER_LABELS[rating].color}`}>
                  {THERMOMETER_LABELS[rating].text}
                </p>
              </div>
            </div>

            {/* Numeric Counters */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              {/* Invites */}
              <div className="bg-[#021831]/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-[#88A5BF] block font-semibold uppercase leading-tight mb-1">
                  Inviti Fatti
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvitesCount(Math.max(0, invitesCount - 1))}
                    className="w-6 h-6 rounded-md bg-[#234C77] text-white flex items-center justify-center text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-white text-sm w-4">
                    {invitesCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInvitesCount(invitesCount + 1)}
                    className="w-6 h-6 rounded-md bg-[#234C77] text-white flex items-center justify-center text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Elegant No's */}
              <div className="bg-[#021831]/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-[#88A5BF] block font-semibold uppercase leading-tight mb-1">
                  No Eleganti (10s)
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setElegantNoCount(Math.max(0, elegantNoCount - 1))}
                    className="w-6 h-6 rounded-md bg-[#234C77] text-white flex items-center justify-center text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-white text-sm w-4">
                    {elegantNoCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setElegantNoCount(elegantNoCount + 1)}
                    className="w-6 h-6 rounded-md bg-[#234C77] text-white flex items-center justify-center text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Calamita Closures */}
              <div className="bg-[#021831]/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-[#88A5BF] block font-semibold uppercase leading-tight mb-1">
                  Chiusure Calamita
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalamitaClosuresCount(Math.max(0, calamitaClosuresCount - 1))}
                    className="w-6 h-6 rounded-md bg-[#234C77] text-white flex items-center justify-center text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-white text-sm w-4">
                    {calamitaClosuresCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalamitaClosuresCount(calamitaClosuresCount + 1)}
                    className="w-6 h-6 rounded-md bg-[#234C77] text-white flex items-center justify-center text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mission completed toggle */}
            <div className="flex items-center justify-between p-3 bg-[#021831]/80 rounded-xl border border-slate-700">
              <span className="text-xs text-white font-medium">
                Missione della serata completata?
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMissionCompleted(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    missionCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sì</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMissionCompleted(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    !missionCompleted
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>No</span>
                </button>
              </div>
            </div>

            {/* What worked */}
            <div>
              <label className="block text-xs font-semibold text-[#88A5BF] mb-1">
                Cosa ha funzionato stasera?
              </label>
              <textarea
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                placeholder="Es. Il Contatto Zero con due secondi di attesa ha creato subito sorriso e complicità..."
                rows={2}
                className="w-full p-2.5 bg-[#021831] border border-[#88A5BF]/30 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F9C03E]"
              />
            </div>

            {/* What to improve */}
            <div>
              <label className="block text-xs font-semibold text-[#88A5BF] mb-1">
                Cosa migliorare alla prossima serata?
              </label>
              <textarea
                value={whatToImprove}
                onChange={(e) => setWhatToImprove(e.target.value)}
                placeholder="Es. Non scappare con la mano subito alla fine della canzone; tenere lo Sguardo Ancora..."
                rows={2}
                className="w-full p-2.5 bg-[#021831] border border-[#88A5BF]/30 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F9C03E]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl gold-gradient-btn text-xs font-bold shadow-md"
            >
              Salva Serata nel Diario
            </button>
          </div>

          {adviceNotice && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 text-center animate-fadeIn">
              {adviceNotice}
            </div>
          )}

          {/* Coach Advice Block */}
          {savedEntryId && (
            <div className="glass-card p-5 border border-[#F9C03E]/40 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#F9C03E]" />
                <h3 className="font-serif font-bold text-white text-sm">
                  Consiglio della Serata (Andrea)
                </h3>
              </div>

              {entries.find((e) => e.id === savedEntryId)?.coachAdvice ? (
                <div className="bg-[#021831]/80 p-3.5 rounded-xl border border-slate-700 space-y-2 text-xs text-slate-200">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {renderAdviceText(
                      entries.find((e) => e.id === savedEntryId)?.coachAdvice || ''
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-300">
                  Invia i dati di questa serata al Coach per ricevere un feedback in 3 punti: cosa è andato bene, su cosa concentrarti e l'azione concreta per la prossima volta.
                </p>
              )}

              <button
                type="button"
                onClick={() => handleRequestCoachAdvice()}
                disabled={isGettingAdvice}
                className="w-full py-2.5 px-4 rounded-xl bg-[#234C77] hover:bg-[#234C77]/80 border border-[#F9C03E]/40 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-[#F9C03E] ${isGettingAdvice ? 'animate-spin' : ''}`} />
                <span>
                  {isGettingAdvice
                    ? 'Andrea sta analizzando la serata...'
                    : entries.find((e) => e.id === savedEntryId)?.coachAdvice
                    ? 'Richiedi nuovo consiglio'
                    : 'Ricevi il consiglio del Coach'}
                </span>
              </button>
              <p className="text-[10px] text-[#88A5BF] text-center font-mono">
                Conta come 1 messaggio dal tuo limite giornaliero.
              </p>
            </div>
          )}
        </form>
      ) : (
        /* Progress Tab */
        <div className="space-y-4 animate-fadeIn">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3.5 text-center">
              <span className="text-[10px] text-[#88A5BF] uppercase font-semibold block mb-0.5">
                Capitoli Letti
              </span>
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="w-4 h-4 text-[#F9C03E]" />
                <span className="text-xl font-bold font-mono text-white">
                  {readChaptersCount}
                </span>
                <span className="text-xs text-slate-400">/{TUTTE_LE_UNITA.length}</span>
              </div>
            </div>

            <div className="glass-card p-3.5 text-center">
              <span className="text-[10px] text-[#88A5BF] uppercase font-semibold block mb-0.5">
                Moduli Video Visti
              </span>
              <div className="flex items-center justify-center gap-1">
                <Video className="w-4 h-4 text-sky-400" />
                <span className="text-xl font-bold font-mono text-white">
                  {watchedVideosCount}
                </span>
                <span className="text-xs text-slate-400">/9</span>
              </div>
            </div>

            <div className="glass-card p-3.5 text-center">
              <span className="text-[10px] text-[#88A5BF] uppercase font-semibold block mb-0.5">
                Media Filo (ultime 5)
              </span>
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-[#F9C03E]" />
                <span className="text-xl font-bold font-mono text-white">{averageRating}</span>
                <span className="text-xs text-slate-400">/5</span>
              </div>
            </div>

            <div className="glass-card p-3.5 text-center">
              <span className="text-[10px] text-[#88A5BF] uppercase font-semibold block mb-0.5">
                Serate Registrate
              </span>
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-bold font-mono text-white">{entries.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <span className="text-[10px] text-[#88A5BF] uppercase block">Totale Inviti</span>
              <span className="text-lg font-bold font-mono text-white">{totalInvites}</span>
            </div>
            <div className="glass-card p-3 text-center">
              <span className="text-[10px] text-[#88A5BF] uppercase block">No Eleganti (10s)</span>
              <span className="text-lg font-bold font-mono text-white">{totalNoCount}</span>
            </div>
          </div>

          {/* Visual chart of rating over time */}
          {entries.length > 0 && (
            <div className="glass-card p-4 border border-[#88A5BF]/30">
              <span className="text-xs font-bold text-white block mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#F9C03E]" />
                <span>Andamento Termometro del Filo</span>
              </span>

              <div className="flex items-end justify-between gap-1.5 h-28 pt-4 pb-2 px-1 border-b border-slate-700">
                {entries
                  .slice(0, 7)
                  .reverse()
                  .map((e, idx) => {
                    const heightPercent = (e.rating / 5) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] font-mono text-[#F9C03E] font-bold">
                          {e.rating}
                        </span>
                        <div
                          className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[#234C77] to-[#F9C03E] transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[9px] text-slate-400 font-mono truncate w-full text-center">
                          {e.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <div className="flex justify-between text-[10px] text-[#88A5BF] mt-1 font-mono">
                <span>1 = Nessuna connessione</span>
                <span>5 = Ha voluto restare</span>
              </div>
            </div>
          )}

          {/* List of past evenings */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#88A5BF]">
              Storico delle serate ({entries.length})
            </h3>

            {entries.length === 0 ? (
              <div className="glass-card p-6 text-center text-xs text-slate-400">
                Non hai ancora registrato serate nel diario. Fai il tuo primo ballo e compila la scheda!
              </div>
            ) : (
              entries.map((entry) => {
                const isExpanded = expandedEntryId === entry.id;
                return (
                  <div key={entry.id} className="glass-card p-3.5 border border-[#88A5BF]/25 space-y-2">
                    <div
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{entry.venue}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#234C77] text-[#F9C03E] font-bold">
                            Filo: {entry.rating}/5
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{entry.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-700/60 text-xs space-y-2.5 text-slate-200 animate-fadeIn">
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-[#021831]/60 p-2 rounded-xl">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Inviti</span>
                            <strong className="text-white">{entry.invitesCount}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">No Eleganti</span>
                            <strong className="text-white">{entry.elegantNoCount}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Chiusure</span>
                            <strong className="text-white">{entry.calamitaClosuresCount}</strong>
                          </div>
                        </div>

                        {entry.whatWorked && (
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-400 block">
                              Ha funzionato:
                            </span>
                            <p className="text-slate-300 bg-[#021831]/50 p-2 rounded-lg">
                              {entry.whatWorked}
                            </p>
                          </div>
                        )}

                        {entry.whatToImprove && (
                          <div>
                            <span className="text-[11px] font-semibold text-amber-400 block">
                              Da migliorare:
                            </span>
                            <p className="text-slate-300 bg-[#021831]/50 p-2 rounded-lg">
                              {entry.whatToImprove}
                            </p>
                          </div>
                        )}

                        {entry.coachAdvice && (
                          <div className="p-3 bg-[#234C77]/50 rounded-xl border border-[#F9C03E]/30 space-y-1">
                            <span className="text-[11px] font-bold text-[#F9C03E] flex items-center gap-1">
                              <Bot className="w-3.5 h-3.5" />
                              <span>Consiglio di Andrea:</span>
                            </span>
                            <div className="text-white leading-relaxed">
                              {renderAdviceText(entry.coachAdvice)}
                            </div>
                          </div>
                        )}

                        {!entry.coachAdvice && (
                          <button
                            type="button"
                            onClick={() => handleRequestCoachAdvice(entry)}
                            disabled={isGettingAdvice}
                            className="w-full py-2 px-3 rounded-lg bg-[#234C77] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#F9C03E]" />
                            <span>Ricevi il consiglio del Coach per questa serata</span>
                          </button>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <button
                            onClick={() => {
                              setSavedEntryId(entry.id);
                              setDate(entry.date);
                              setVenue(entry.venue);
                              setRating(entry.rating);
                              setInvitesCount(entry.invitesCount);
                              setElegantNoCount(entry.elegantNoCount);
                              setCalamitaClosuresCount(entry.calamitaClosuresCount);
                              setMissionCompleted(entry.missionCompleted);
                              setWhatWorked(entry.whatWorked || '');
                              setWhatToImprove(entry.whatToImprove || '');
                              setActiveTab('compila');
                            }}
                            className="text-xs text-[#F9C03E] hover:underline"
                          >
                            Modifica dati serata
                          </button>

                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-slate-400 hover:text-red-400 p-1"
                            title="Elimina serata"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
