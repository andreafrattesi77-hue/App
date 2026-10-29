import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  BookOpen,
  HelpCircle,
  Search,
  MessageSquarePlus,
  ChevronDown,
  ChevronUp,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { COACH_DAILY_LIMIT, PROFILES, MISSIONS_21 } from '../config';
import { getUnita } from '../../content/index';
import { ChatMessage, UserData } from '../types';
import {
  getChatMessages,
  saveChatMessages,
  resetChatMessages,
  getCoachDailyUsage,
  incrementCoachUsage,
  getUserData,
  saveUserData,
  getMissionsProgress,
  isTrialUser,
  incrementTrialCoachQuestions,
} from '../services/storage';
import { sendCoachChatMessage } from '../services/api';
import { OFFICIAL_COACH_QUESTIONS, CoachQuestionItem, generateCoachReasoning } from '../services/coachReasoning';

interface CoachScreenProps {
  user?: UserData | null;
  initialPrompt?: string;
  activeUnitId?: string;
  onClearInitialPrompt?: () => void;
  onOpenUnita: (id: string) => void;
  onGoToRitual?: () => void;
  onGoToLibrary?: () => void;
  onOpenUnlock?: (notice?: string) => void;
  onUserDataUpdated?: (updated: UserData) => void;
}

type CategoryFilter = 'all' | 'approccio' | 'bachata' | 'salsa' | 'chiusura' | 'psicologia';

export const CoachScreen: React.FC<CoachScreenProps> = ({
  user,
  initialPrompt,
  activeUnitId,
  onClearInitialPrompt,
  onOpenUnita,
  onGoToRitual,
  onGoToLibrary,
  onOpenUnlock,
  onUserDataUpdated,
}) => {
  const currentUserName = user?.name || getUserData()?.name || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState(COACH_DAILY_LIMIT);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuestionPickerExpanded, setIsQuestionPickerExpanded] = useState(false);
  const [freeQuestion, setFreeQuestion] = useState('');

  const categoryScrollRefTop = useRef<HTMLDivElement>(null);
  const categoryScrollRefBottom = useRef<HTMLDivElement>(null);

  const scrollCategories = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const offset = direction === 'left' ? -180 : 180;
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const isTrial = isTrialUser(user);
  const [trialUsed, setTrialUsed] = useState<number>(() => {
    return user?.trialCoachQuestionsUsed ?? getUserData()?.trialCoachQuestionsUsed ?? 0;
  });
  const trialRemaining = Math.max(0, 3 - trialUsed);

  // Sync trial usage from server whenever user/email changes or on mount
  useEffect(() => {
    const currentStoredUsed = user?.trialCoachQuestionsUsed ?? getUserData()?.trialCoachQuestionsUsed ?? 0;
    setTrialUsed(currentStoredUsed);

    const email = (user?.email || getUserData()?.email || '').trim().toLowerCase();
    if (isTrial && email) {
      fetch(`/api/coach/trial-status?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.questionsUsed === 'number') {
            setTrialUsed(data.questionsUsed);
            const updated = saveUserData({ trialCoachQuestionsUsed: data.questionsUsed });
            onUserDataUpdated?.(updated);
          }
        })
        .catch(() => {});
    }
  }, [user?.trialCoachQuestionsUsed, user?.email, isTrial, onUserDataUpdated]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);

  // Load chat and daily limit
  useEffect(() => {
    setMessages(getChatMessages(currentUserName));
    const usage = getCoachDailyUsage();
    setRemainingToday(usage.remainingToday);
  }, [currentUserName]);

  // Handle incoming prompt (e.g. from Reader or Quiz)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Scroll to make sure the latest response is immediately visible from its start
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        if (latestMessageRef.current) {
          latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    // Strict check on 3 trial questions limit
    if (isTrial && trialRemaining <= 0) {
      onOpenUnlock?.(
        'Hai esaurito le 3 domande gratuite al Coach per la tua email. Sblocca la versione completa per continuare a parlare con Andrea Frattesi!'
      );
      return;
    }

    // Check daily limit for full users
    const usage = getCoachDailyUsage();
    if (!isTrial && !usage.canSend) {
      setErrorNotice(
        `Hai usato le ${COACH_DAILY_LIMIT} domande di oggi. Il Coach torna disponibile domani alle 00:00. Intanto rileggi un capitolo o fai il Rituale Pre-Serata.`
      );
      return;
    }

    setErrorNotice(null);
    setIsQuestionPickerExpanded(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    saveChatMessages(newHistory);
    setIsLoading(true);

    // Decrement usage for daily limits
    const { remainingToday: newRemaining } = incrementCoachUsage();
    setRemainingToday(newRemaining);

    // Get user context
    const userData = getUserData();
    const profileName = userData?.profile ? PROFILES[userData.profile]?.name : undefined;

    const missionsProg = getMissionsProgress();
    const currentMissionObj = MISSIONS_21.find((m) => !missionsProg[m.id]?.completed);
    const currentMissionStr = currentMissionObj
      ? `Serata ${currentMissionObj.id}: ${currentMissionObj.title}`
      : undefined;

    try {
      const response = await sendCoachChatMessage({
        message: trimmed,
        history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        userName: currentUserName,
        userEmail: user?.email || getUserData()?.email || '',
        isTrial,
        accessCode: user?.accessCode || getUserData()?.accessCode || '',
        userProfile: profileName,
        currentMission: currentMissionStr,
        activeUnitId: activeUnitId,
      });

      if (isTrial) {
        const nextUsed = typeof response.trialCoachQuestionsUsed === 'number'
          ? response.trialCoachQuestionsUsed
          : trialUsed + 1;
        setTrialUsed(nextUsed);
        const updated = saveUserData({ trialCoachQuestionsUsed: nextUsed });
        onUserDataUpdated?.(updated);
      }

      const coachMessage: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: response.reply,
        timestamp: Date.now(),
      };

      const finalHistory = [...newHistory, coachMessage];
      setMessages(finalHistory);
      saveChatMessages(finalHistory);
    } catch (err: any) {
      if (err?.trialLimitReached) {
        setTrialUsed(3);
        const updated = saveUserData({ trialCoachQuestionsUsed: 3 });
        onUserDataUpdated?.(updated);
        // Rollback message so they don't see an unanswered user bubble
        setMessages(messages);
        saveChatMessages(messages);
        onOpenUnlock?.(
          'Hai raggiunto il limite massimo di 3 domande gratuite al Coach per la tua email. Sblocca la versione completa per continuare!'
        );
        return;
      }

      const smartReply = generateCoachReasoning({
        message: trimmed,
        userName: currentUserName,
        userProfile: profileName,
        currentMission: currentMissionStr,
        activeUnitId,
        history: messages.map((m) => ({ sender: m.sender, text: m.text })),
      });
      const fallbackMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: smartReply,
        timestamp: Date.now(),
      };
      const finalHistory = [...newHistory, fallbackMsg];
      setMessages(finalHistory);
      saveChatMessages(finalHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Vuoi cancellare la cronologia e iniziare una nuova sessione con il Coach?')) {
      const initial = resetChatMessages(currentUserName);
      setMessages(initial);
      setErrorNotice(null);
      setIsQuestionPickerExpanded(true);
    }
  };

  // Categories definition
  const categories: Array<{ id: CategoryFilter; label: string; count: number; icon: string }> = [
    { id: 'all', label: 'Tutte', count: OFFICIAL_COACH_QUESTIONS.length, icon: '📋' },
    {
      id: 'approccio',
      label: 'Invito & Blocco',
      count: OFFICIAL_COACH_QUESTIONS.filter((q) => q.category === 'approccio').length,
      icon: '🎯',
    },
    {
      id: 'bachata',
      label: 'Bachata & Contatto',
      count: OFFICIAL_COACH_QUESTIONS.filter((q) => q.category === 'bachata').length,
      icon: '💃',
    },
    {
      id: 'salsa',
      label: 'Salsa & Tempo 1',
      count: OFFICIAL_COACH_QUESTIONS.filter((q) => q.category === 'salsa').length,
      icon: '🎺',
    },
    {
      id: 'chiusura',
      label: 'Chiusura Calamita',
      count: OFFICIAL_COACH_QUESTIONS.filter((q) => q.category === 'chiusura').length,
      icon: '🧲',
    },
    {
      id: 'psicologia',
      label: 'Psicologia & Asse',
      count: OFFICIAL_COACH_QUESTIONS.filter((q) => q.category === 'psicologia').length,
      icon: '🧠',
    },
  ];

  // Temi visivi distinti per le 5 sezioni da 20 domande ciascuna
  const SECTION_THEMES: Record<
    string,
    {
      number: number;
      title: string;
      subtitle: string;
      icon: string;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      titleColor: string;
      lineGradient: string;
      headerBg: string;
      headerBorder: string;
    }
  > = {
    approccio: {
      number: 1,
      title: 'Sezione 1: Invito & Blocco Emotivo',
      subtitle: '20 Domande (1 – 20) • Gestione ansia, approccio e superamento del rifiuto',
      icon: '🎯',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-[#F9C03E]',
      badgeBorder: 'border-amber-400/40',
      titleColor: 'text-[#F9C03E]',
      lineGradient: 'from-transparent via-[#F9C03E]/70 to-transparent',
      headerBg: 'bg-gradient-to-r from-[#042B58] via-amber-950/40 to-[#042B58]',
      headerBorder: 'border-[#F9C03E]/40',
    },
    bachata: {
      number: 2,
      title: 'Sezione 2: Bachata & Contatto Fisico',
      subtitle: '20 Domande (1 – 20) • Posizione chiusa, guida e sensualità senza invadenza',
      icon: '💃',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-300',
      badgeBorder: 'border-rose-400/40',
      titleColor: 'text-rose-300',
      lineGradient: 'from-transparent via-rose-500/70 to-transparent',
      headerBg: 'bg-gradient-to-r from-[#042B58] via-rose-950/40 to-[#042B58]',
      headerBorder: 'border-rose-500/40',
    },
    salsa: {
      number: 3,
      title: 'Sezione 3: Salsa & Tempo 1',
      subtitle: '20 Domande (1 – 20) • Ritmo, musicalità e guida maschile sicura in pista',
      icon: '🎺',
      badgeBg: 'bg-sky-500/15',
      badgeText: 'text-sky-300',
      badgeBorder: 'border-sky-400/40',
      titleColor: 'text-sky-300',
      lineGradient: 'from-transparent via-sky-500/70 to-transparent',
      headerBg: 'bg-gradient-to-r from-[#042B58] via-sky-950/40 to-[#042B58]',
      headerBorder: 'border-sky-500/40',
    },
    chiusura: {
      number: 4,
      title: 'Sezione 4: Chiusura Calamita',
      subtitle: '20 Domande (1 – 20) • Fine brano, aggancio verbale, numero e ripartenza',
      icon: '🧲',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-400/40',
      titleColor: 'text-emerald-300',
      lineGradient: 'from-transparent via-emerald-500/70 to-transparent',
      headerBg: 'bg-gradient-to-r from-[#042B58] via-emerald-950/40 to-[#042B58]',
      headerBorder: 'border-emerald-500/40',
    },
    psicologia: {
      number: 5,
      title: 'Sezione 5: Psicologia Maschile & Asse',
      subtitle: '20 Domande (1 – 20) • Mindset, carisma, sicurezza interna e presenza dominante',
      icon: '🧠',
      badgeBg: 'bg-purple-500/15',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-400/40',
      titleColor: 'text-purple-300',
      lineGradient: 'from-transparent via-purple-500/70 to-transparent',
      headerBg: 'bg-gradient-to-r from-[#042B58] via-purple-950/40 to-[#042B58]',
      headerBorder: 'border-purple-500/40',
    },
  };

  // Numerazione progressiva da 1 a 20 per ogni sezione/categoria
  const getQuestionNumberLabel = (q: CoachQuestionItem) => {
    const catQuestions = OFFICIAL_COACH_QUESTIONS.filter((item) => item.category === q.category);
    const catIndex = catQuestions.findIndex((item) => item.id === q.id);
    const numInCat = catIndex >= 0 ? catIndex + 1 : 1;
    return `${numInCat}`;
  };

  // Filter questions
  const filteredQuestions = OFFICIAL_COACH_QUESTIONS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Render text replacing [[id]] with clickable chips
  const renderMessageContent = (text: string) => {
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
            className="inline-flex items-center gap-1 px-2.5 py-1 my-0.5 mx-1 rounded-full bg-[#042B58] hover:bg-[#F9C03E] text-[#F9C03E] hover:text-[#042B58] border border-[#F9C03E]/50 text-[11px] font-bold transition-all align-middle shadow-sm cursor-pointer"
          >
            <BookOpen className="w-3 h-3 shrink-0" />
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

  const hasMessages = messages.length > 0;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[720px] relative overflow-hidden bg-transparent">
      {/* Top Header: Full profile on empty state, Ultra-compact bar during conversation */}
      {!hasMessages ? (
        <>
          {/* Coach Profile Card */}
          <section className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#182033]/85 p-4 shadow-card animate-rise m-4 mb-2 shrink-0 backdrop-blur-md">
            <img
              src="/andrea-frattesi.png"
              alt="Andrea Frattesi"
              className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full object-cover object-top ring-2 ring-[#E5B869]/60 shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-lg sm:text-xl font-semibold text-[#f7f6f3]">
                  Andrea Frattesi
                </h1>
                <button
                  onClick={handleResetChat}
                  className="text-xs text-[#9da6b9] hover:text-[#E5B869] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0d121e] border border-white/10 transition-colors cursor-pointer"
                  title="Nuova consultazione"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Nuova</span>
                </button>
              </div>
              <p className="text-xs leading-snug text-[#E5B869] font-medium mt-0.5">
                Coach di seduzione nel ballo di Salsa e Bachata
              </p>
              <p className="mt-0.5 text-xs text-[#9da6b9]">
                100 domande del metodo
              </p>
            </div>
          </section>

          {/* Daily Limits Card */}
          <section className="mx-4 mb-2 rounded-2xl border border-white/10 bg-[#182033]/60 p-3.5 animate-rise shadow-sm shrink-0">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-[#f7f6f3]">Domande rimaste oggi</span>
              <span className="font-display text-base sm:text-lg font-bold text-[#E5B869] tabular-nums">
                {isTrial ? `${trialRemaining}/3` : `${remainingToday}/20`}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#0d121e]">
              <div
                className="h-full rounded-full bg-gradient-gold transition-all duration-300"
                style={{
                  width: `${isTrial ? (trialRemaining / 3) * 100 : (remainingToday / 20) * 100}%`,
                }}
              />
            </div>
          </section>
        </>
      ) : (
        <section className="flex items-center justify-between gap-3 px-4 py-2 bg-[#182033]/95 border-b border-white/10 shrink-0 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/andrea-frattesi.png"
              alt="Andrea Frattesi"
              className="h-8 w-8 shrink-0 rounded-full object-cover object-top ring-1.5 ring-[#E5B869]/70 shadow-xs"
            />
            <div className="min-w-0">
              <h2 className="font-display text-xs sm:text-sm font-semibold text-[#f7f6f3] truncate">
                Andrea Frattesi
              </h2>
              <p className="text-[10px] text-[#E5B869] font-medium truncate">
                Coach Effetto Calamita
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0d121e] border border-white/10 text-[#E5B869] font-bold">
              {isTrial ? `${trialRemaining}/3 prova` : `${remainingToday}/20`}
            </span>
            <button
              onClick={handleResetChat}
              className="text-[11px] text-[#9da6b9] hover:text-[#E5B869] flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0d121e] border border-white/10 transition-colors cursor-pointer"
              title="Nuova consultazione (svuota cronologia)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Nuova</span>
            </button>
          </div>
        </section>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Empty state: Welcome card & 20 Questions directory */}
        {!hasMessages && (
          <div className="space-y-4 animate-fadeIn">
            <div className="glass-card p-4 space-y-2 text-left border border-[#F9C03E]/30 shadow-lg">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#F9C03E]" />
                <h3 className="text-sm font-bold font-serif text-white">
                  Consulenza Strategica con Andrea Frattesi
                </h3>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentUserName ? `Ciao ${currentUserName}! ` : 'Ciao! '}
                Per offrirti risposte della massima profondità psicologica e perfettamente allineate al <strong>Metodo Effetto Calamita</strong>, seleziona una delle <strong>100 domande del Metodo</strong> qui sotto suddivise per categoria (20 domande numerate da 1 a 20 per ciascuna sezione).
              </p>
              <div className="p-2 rounded-xl bg-[#021831]/80 border border-[#88A5BF]/20 text-[11px] text-[#88A5BF] flex items-center justify-between">
                <span>🎯 100 Domande ufficiali (20 per sezione, numerate 1-20)</span>
                <span className="text-[#F9C03E] font-semibold font-mono">
                  {isTrial ? `Domande di prova: ${trialRemaining}/3` : `Disponibili: ${remainingToday}/20`}
                </span>
              </div>
            </div>

            {/* Category tabs with smooth mobile scroll and touch buttons */}
            <div className="relative flex items-center w-full">
              <button
                type="button"
                onClick={() => scrollCategories(categoryScrollRefTop, 'left')}
                className="h-8 w-7 shrink-0 flex items-center justify-center rounded-l-xl bg-[#042B58] hover:bg-[#234C77] text-[#88A5BF] hover:text-[#F9C03E] border border-r-0 border-[#88A5BF]/30 transition-all z-10 cursor-pointer shadow-xs"
                aria-label="Scorri categorie a sinistra"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div
                ref={categoryScrollRefTop}
                className="flex-1 overflow-x-auto touch-pan-x overscroll-x-contain py-1.5 px-1 scrollbar-none flex gap-1.5 items-center [-webkit-overflow-scrolling:touch]"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl shrink-0 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                      activeCategory === cat.id
                        ? 'gold-gradient-btn text-[#042B58] font-bold shadow-sm'
                        : 'bg-[#042B58] text-slate-300 hover:text-white border-[#88A5BF]/30'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="text-[10px] opacity-75">({cat.count})</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollCategories(categoryScrollRefTop, 'right')}
                className="h-8 w-7 shrink-0 flex items-center justify-center rounded-r-xl bg-[#042B58] hover:bg-[#234C77] text-[#88A5BF] hover:text-[#F9C03E] border border-l-0 border-[#88A5BF]/30 transition-all z-10 cursor-pointer shadow-xs"
                aria-label="Scorri categorie a destra"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Questions List cards */}
            <div className="space-y-2 text-left">
              <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-wider block px-1">
                Tocca una domanda per ricevere l'analisi del Coach:
              </span>

              {filteredQuestions.map((q: CoachQuestionItem, idx: number) => {
                const numLabel = getQuestionNumberLabel(q);
                const catQuestions = OFFICIAL_COACH_QUESTIONS.filter((item) => item.category === q.category);
                const catIndex = catQuestions.findIndex((item) => item.id === q.id);
                const isFirstOfCategory =
                  activeCategory !== 'all'
                    ? catIndex === 0
                    : idx === 0 || filteredQuestions[idx - 1].category !== q.category;

                const theme = SECTION_THEMES[q.category] || SECTION_THEMES.approccio;

                return (
                  <React.Fragment key={q.id}>
                    {isFirstOfCategory && (
                      <div className="pt-4 pb-1 space-y-1.5">
                        {/* Riga divisoria tra sezioni con sfumatura colorata */}
                        <div className={`h-[2px] w-full bg-gradient-to-r ${theme.lineGradient}`} />
                        {/* Intestazione Sezione con titolo di colore dedicato */}
                        <div className={`p-3 rounded-2xl border ${theme.headerBorder} ${theme.headerBg} shadow-md flex items-center justify-between`}>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl shrink-0 p-1.5 rounded-xl bg-[#021831]/80 border border-white/10 shadow-xs">
                              {theme.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badgeBorder} ${theme.badgeBg} ${theme.badgeText}`}>
                                  SEZIONE {theme.number} • 20 DOMANDE
                                </span>
                              </div>
                              <h4 className={`text-sm font-bold font-serif ${theme.titleColor} mt-0.5`}>
                                {theme.title}
                              </h4>
                              <p className="text-[11px] text-slate-300">
                                {theme.subtitle}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border ${theme.badgeBorder} ${theme.badgeBg} ${theme.badgeText} shrink-0 hidden sm:inline-block`}>
                            1 – 20
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleSendMessage(q.question)}
                      disabled={remainingToday <= 0 || isLoading}
                      className="w-full p-3 rounded-2xl bg-[#042B58]/80 hover:bg-[#234C77] border border-[#88A5BF]/25 hover:border-[#F9C03E]/60 text-left transition-all duration-150 flex flex-col gap-2 group cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Frase in giallo SENZA numero: solo etichetta categoria */}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#021831] text-[#F9C03E] border border-[#F9C03E]/30">
                          {q.categoryLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-[#F9C03E] transition-colors">
                          Consulta →
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Solo nella domanda in bianco è presente il numero */}
                        <p className="text-xs font-semibold text-white group-hover:text-amber-100 transition-colors leading-snug">
                          {numLabel}. {q.question}
                        </p>
                        <span className="text-[11px] text-[#88A5BF] block mt-1">
                          💡 {q.summary}
                        </span>
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat message bubbles */}
        {hasMessages &&
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const isLast = idx === messages.length - 1;
            return (
              <div
                key={msg.id}
                ref={isLast ? latestMessageRef : undefined}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                    isUser
                      ? 'bg-gradient-gold text-[#121622] font-bold text-xs'
                      : 'ring-1 ring-[#E5B869]/60'
                  }`}
                >
                  {isUser ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <img
                      src="/andrea-frattesi.png"
                      alt="Andrea Frattesi"
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-[88%] text-xs md:text-sm leading-relaxed text-left ${
                    isUser
                      ? 'bg-[#212b42] text-[#f7f6f3] rounded-tr-none border border-white/10 shadow-sm'
                      : 'bg-[#182033]/90 text-[#f7f6f3] rounded-tl-none border border-white/10 shadow-card'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {renderMessageContent(msg.text)}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 animate-fadeIn text-left">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-[#E5B869]/60 shrink-0">
              <img
                src="/andrea-frattesi.png"
                alt="Andrea Frattesi"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="bg-[#182033]/90 p-3 rounded-2xl rounded-tl-none border border-white/10 flex items-center gap-2 text-xs text-[#9da6b9]">
              <Sparkles className="w-3.5 h-3.5 text-[#E5B869] animate-spin" />
              <span>Andrea sta elaborando la diagnosi del Metodo...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error / Daily limit alert banner */}
      {errorNotice && (
        <div className="mx-3 mb-2 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-left text-xs text-red-200 flex flex-col gap-2 shrink-0">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorNotice}</span>
          </div>

          {remainingToday <= 0 && (
            <div className="flex gap-2 pt-1">
              {onGoToLibrary && (
                <button
                  onClick={onGoToLibrary}
                  className="px-2.5 py-1 bg-[#234C77] text-white rounded-lg text-[11px] font-semibold"
                >
                  Rileggi un capitolo
                </button>
              )}
              {onGoToRitual && (
                <button
                  onClick={onGoToRitual}
                  className="px-2.5 py-1 bg-[#234C77] text-white rounded-lg text-[11px] font-semibold"
                >
                  Fai il Rituale
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Panel: Free Question Input + 100 Questions Directory */}
      <div className="p-3 bg-[#042B58] border-t border-[#88A5BF]/25 shrink-0 flex flex-col gap-2 shadow-lg">
        {/* Trial Status or Lock Card */}
        {isTrial && trialRemaining <= 0 ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#234C77] to-[#021831] border border-[#F9C03E]/40 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9C03E]/20 text-[#F9C03E] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3 Domande di Prova Utilizzate</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Hai completato le 3 domande della prova con Andrea Frattesi. Sblocca la versione completa per continuare ad avere fino a 20 consulti al giorno prima, durante e dopo ogni serata!
            </p>
            <button
              onClick={() => onOpenUnlock?.('Hai usato le 3 domande gratuite di prova.')}
              className="py-2.5 px-4 rounded-xl gold-gradient-btn text-xs font-bold text-[#042B58] shadow-lg hover:brightness-105 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Sblocca Coach Completo (20 al giorno)</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Free-form Question Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!freeQuestion.trim() || isLoading) return;
                if (isTrial && trialRemaining <= 0) {
                  onOpenUnlock?.(
                    'Hai raggiunto il limite di 3 domande gratuite al Coach per la tua email. Sblocca la versione completa per continuare!'
                  );
                  return;
                }
                if (!isTrial && remainingToday <= 0) {
                  setErrorNotice('Hai usato le 20 domande di oggi. Il Coach torna disponibile a mezzanotte.');
                  return;
                }
                handleSendMessage(freeQuestion);
                setFreeQuestion('');
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={freeQuestion}
                  onChange={(e) => setFreeQuestion(e.target.value)}
                  disabled={isLoading || (isTrial ? trialRemaining <= 0 : remainingToday <= 0)}
                  placeholder={
                    isTrial && trialRemaining <= 0
                      ? 'Limite domande raggiunto'
                      : 'Fai una domanda libera al Coach (es. come sblocco lo sguardo?)...'
                  }
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#021831] border border-[#88A5BF]/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F9C03E] focus:ring-1 focus:ring-[#F9C03E] disabled:opacity-50 transition-all shadow-inner"
                />
                {freeQuestion.trim() && (
                  <button
                    type="button"
                    onClick={() => setFreeQuestion('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                    title="Cancella testo"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  !freeQuestion.trim() ||
                  isLoading ||
                  (isTrial ? trialRemaining <= 0 : remainingToday <= 0)
                }
                className="h-10 px-4 rounded-xl gold-gradient-btn text-xs font-bold text-[#042B58] flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 transition-all"
                title="Invia domanda ad Andrea Frattesi"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invia</span>
              </button>
            </form>

            {/* Toggle button to expand/collapse full question browser when in active conversation */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                onClick={() => setIsQuestionPickerExpanded((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-semibold text-white hover:text-[#F9C03E] transition-colors cursor-pointer py-0.5"
              >
                <MessageSquarePlus className="w-4 h-4 text-[#F9C03E]" />
                <span>
                  {isQuestionPickerExpanded
                    ? 'Nascondi lista 100 domande'
                    : 'Oppure scegli tra le 100 domande del Metodo'}
                </span>
                {isQuestionPickerExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#F9C03E]" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-[#F9C03E]" />
                )}
              </button>

              <span className="text-[10px] font-mono text-[#88A5BF]">
                {isTrial ? (
                  <strong className="text-[#F9C03E]">{trialRemaining}/3 prova</strong>
                ) : (
                  <>Rimasti: <strong className={remainingToday <= 3 ? 'text-red-400' : 'text-white'}>{remainingToday}/{COACH_DAILY_LIMIT}</strong></>
                )}
              </span>
            </div>
          </>
        )}

        {/* Expandable / Collapsible Question Drawer (ONLY when user explicitly opens it) */}
        {isQuestionPickerExpanded && (
          <div className="space-y-2 border-t border-[#88A5BF]/20 pt-2 animate-fadeIn">
            {/* Category Pills Bar inside the drawer */}
            <div className="relative flex items-center w-full">
              <button
                type="button"
                onClick={() => scrollCategories(categoryScrollRefBottom, 'left')}
                className="h-7 w-6 shrink-0 flex items-center justify-center rounded-l-lg bg-[#021831] hover:bg-[#234C77] text-[#88A5BF] hover:text-[#F9C03E] border border-r-0 border-[#88A5BF]/30 transition-all cursor-pointer z-10"
                aria-label="Scorri categorie a sinistra"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div
                ref={categoryScrollRefBottom}
                className="flex-1 overflow-x-auto touch-pan-x overscroll-x-contain py-1 px-1 scrollbar-none flex gap-1.5 items-center [-webkit-overflow-scrolling:touch]"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer border ${
                      activeCategory === cat.id
                        ? 'bg-[#234C77] text-white border-[#F9C03E] font-medium'
                        : 'bg-[#021831]/70 text-slate-300 hover:text-white border-[#88A5BF]/20'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollCategories(categoryScrollRefBottom, 'right')}
                className="h-7 w-6 shrink-0 flex items-center justify-center rounded-r-lg bg-[#021831] hover:bg-[#234C77] text-[#88A5BF] hover:text-[#F9C03E] border border-l-0 border-[#88A5BF]/30 transition-all cursor-pointer z-10"
                aria-label="Scorri categorie a destra"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-left">
              {/* Search box among the 100 questions */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca tra le 100 domande (es. salsa, rifiuto, tempo 1, sguardo...)"
                  className="w-full pl-8 pr-3 py-1.5 bg-[#021831] border border-[#88A5BF]/30 rounded-xl text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#F9C03E]"
                />
              </div>

              <div className="space-y-1.5">
                {filteredQuestions.map((q: CoachQuestionItem, idx: number) => {
                  const numLabel = getQuestionNumberLabel(q);
                  const catQuestions = OFFICIAL_COACH_QUESTIONS.filter((item) => item.category === q.category);
                  const catIndex = catQuestions.findIndex((item) => item.id === q.id);
                  const isFirstOfCategory =
                    activeCategory !== 'all'
                      ? catIndex === 0
                      : idx === 0 || filteredQuestions[idx - 1].category !== q.category;
                  const theme = SECTION_THEMES[q.category] || SECTION_THEMES.approccio;

                  return (
                    <React.Fragment key={q.id}>
                      {isFirstOfCategory && (
                        <div className={`mt-3 mb-1 px-3 py-1.5 rounded-xl border ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{theme.icon}</span>
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.titleColor}`}>
                              {theme.title}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${theme.badgeBorder} ${theme.badgeBg} ${theme.badgeText}`}>
                            20 Domande (1–20)
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setIsQuestionPickerExpanded(false);
                          if (isTrial && trialRemaining <= 0) {
                            onOpenUnlock?.(
                              'Hai raggiunto il limite massimo di 3 domande gratuite al Coach per la tua email. Sblocca la versione completa per continuare!'
                            );
                            return;
                          }
                          handleSendMessage(q.question);
                        }}
                        disabled={(isTrial ? trialRemaining <= 0 : remainingToday <= 0) || isLoading}
                        className="w-full p-2.5 rounded-xl bg-[#021831]/80 hover:bg-[#234C77] border border-[#88A5BF]/20 hover:border-[#F9C03E]/50 text-left transition-all flex flex-col gap-1 group cursor-pointer disabled:opacity-40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#F9C03E]">
                            {q.categoryLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 group-hover:text-white font-medium">
                            Invia →
                          </span>
                        </div>
                        <p className="text-xs text-white group-hover:text-amber-100 font-medium leading-snug">
                          {numLabel}. {q.question}
                        </p>
                      </button>
                    </React.Fragment>
                  );
                })}

                {filteredQuestions.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Nessuna domanda trovata per questa ricerca.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
