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
  getMissionsProgress,
} from '../services/storage';
import { sendCoachChatMessage } from '../services/api';
import { OFFICIAL_COACH_QUESTIONS, CoachQuestionItem } from '../services/coachReasoning';

interface CoachScreenProps {
  user?: UserData | null;
  initialPrompt?: string;
  activeUnitId?: string;
  onClearInitialPrompt?: () => void;
  onOpenUnita: (id: string) => void;
  onGoToRitual?: () => void;
  onGoToLibrary?: () => void;
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
}) => {
  const currentUserName = user?.name || getUserData()?.name || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState(COACH_DAILY_LIMIT);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuestionPickerExpanded, setIsQuestionPickerExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    // Check daily limit
    const usage = getCoachDailyUsage();
    if (!usage.canSend) {
      setErrorNotice(
        `Hai usato i ${COACH_DAILY_LIMIT} consulti di oggi. Il Coach torna disponibile domani alle 00:00. Intanto rileggi un capitolo o fai il Rituale Pre-Serata.`
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

    // Decrement usage
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
      const reply = await sendCoachChatMessage({
        message: trimmed,
        history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        userName: currentUserName,
        userProfile: profileName,
        currentMission: currentMissionStr,
        activeUnitId: activeUnitId,
      });

      const coachMessage: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: reply,
        timestamp: Date.now(),
      };

      const finalHistory = [...newHistory, coachMessage];
      setMessages(finalHistory);
      saveChatMessages(finalHistory);
    } catch {
      const namePart = currentUserName ? `Ciao ${currentUserName}, ` : 'Ciao, ';
      const fallbackReply = `${namePart}qualunque sia il dubbio in questo momento, torna subito al tuo Asse: respira profondo, allinea la postura e applica la regola dei 3 secondi. Rivedi [[cap06]] o il Rituale Pre-Serata in [[bonus2]] prima del prossimo ballo!`;
      const fallbackMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: fallbackReply,
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

  // Map category questions to get sequential number 1..N within category (and 1..10 inside each category tab)
  const getQuestionNumberLabel = (q: CoachQuestionItem) => {
    if (activeCategory === 'all') {
      // Nel tab Tutte: mostriamo il numero progressivo nella sua categoria (1..10 o 1..20) e globale
      const catQuestions = OFFICIAL_COACH_QUESTIONS.filter((item) => item.category === q.category);
      const catIndex = catQuestions.findIndex((item) => item.id === q.id);
      const numInCat = catIndex >= 0 ? (catIndex % 10) + 1 : 1;
      return `${numInCat}`;
    }
    // Nel tab di specifica categoria: numerazione da 1 a 10 (o successivi se oltre 10)
    const catQuestions = OFFICIAL_COACH_QUESTIONS.filter((item) => item.category === q.category);
    const catIndex = catQuestions.findIndex((item) => item.id === q.id);
    const numInCat = catIndex >= 0 ? (catIndex % 10) + 1 : 1;
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
    <div className="w-full max-w-md mx-auto flex flex-col h-[calc(100vh-135px)] md:h-[680px] relative overflow-hidden bg-[#021831]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#88A5BF]/20 bg-[#042B58]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#234C77] flex items-center justify-center border border-[#F9C03E]/50 shadow-sm">
              <Bot className="w-4 h-4 text-[#F9C03E]" />
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#042B58] absolute -bottom-0.5 -right-0.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-serif text-white">Andrea Frattesi</h2>
            <p className="text-[10px] text-[#F9C03E] font-medium">Coach Ufficiale • 100 Domande del Metodo</p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="text-xs text-slate-300 hover:text-[#F9C03E] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#021831]/60 hover:bg-[#234C77]/50 border border-[#88A5BF]/20 transition-colors cursor-pointer"
          title="Inizia nuova consultazione"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Nuova chat</span>
        </button>
      </div>

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
                Per offrirti risposte della massima profondità psicologica e perfettamente allineate al <strong>Metodo Effetto Calamita</strong>, seleziona una delle <strong>100 domande del Metodo</strong> qui sotto suddivise per categoria (numerate da 1 a 10).
              </p>
              <div className="p-2 rounded-xl bg-[#021831]/80 border border-[#88A5BF]/20 text-[11px] text-[#88A5BF] flex items-center justify-between">
                <span>🎯 100 Domande ufficiali del Metodo</span>
                <span className="text-[#F9C03E] font-semibold font-mono">Disponibili: {remainingToday}/20</span>
              </div>
            </div>

            {/* Category tabs */}
            <div className="overflow-x-auto pb-1 scrollbar-none flex gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
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

            {/* Questions List cards */}
            <div className="space-y-2 text-left">
              <span className="text-[11px] font-semibold text-[#88A5BF] uppercase tracking-wider block px-1">
                Tocca una domanda per ricevere l'analisi del Coach:
              </span>

              {filteredQuestions.map((q: CoachQuestionItem) => {
                const numLabel = getQuestionNumberLabel(q);
                return (
                  <button
                    key={q.id}
                    onClick={() => handleSendMessage(q.question)}
                    disabled={remainingToday <= 0 || isLoading}
                    className="w-full p-3 rounded-2xl bg-[#042B58]/80 hover:bg-[#234C77] border border-[#88A5BF]/25 hover:border-[#F9C03E]/60 text-left transition-all duration-150 flex flex-col gap-1.5 group cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-[#F9C03E] text-[#042B58] font-mono font-black text-[11px] flex items-center justify-center shadow-xs">
                          {numLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#021831] text-[#F9C03E] border border-[#F9C03E]/30">
                          {q.categoryLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover:text-[#F9C03E] transition-colors">
                        Consulta →
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white group-hover:text-amber-100 transition-colors leading-snug">
                      {q.question}
                    </p>
                    <span className="text-[11px] text-[#88A5BF]">
                      💡 {q.summary}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat message bubbles */}
        {hasMessages &&
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#F9C03E] text-[#042B58]'
                      : 'bg-[#234C77] text-[#F9C03E] border border-[#F9C03E]/40'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] text-xs md:text-sm leading-relaxed text-left ${
                    isUser
                      ? 'bg-[#234C77] text-white rounded-tr-none border border-[#88A5BF]/30 shadow-sm'
                      : 'glass-card-subtle text-slate-100 rounded-tl-none border border-[#88A5BF]/25 shadow-md'
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
            <div className="w-7 h-7 rounded-full bg-[#234C77] flex items-center justify-center shrink-0 border border-[#F9C03E]/40">
              <Bot className="w-3.5 h-3.5 text-[#F9C03E]" />
            </div>
            <div className="glass-card-subtle p-3 rounded-2xl rounded-tl-none border border-[#88A5BF]/25 flex items-center gap-2 text-xs text-[#88A5BF]">
              <Sparkles className="w-3.5 h-3.5 text-[#F9C03E] animate-spin" />
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

      {/* Bottom Panel: 100 Questions Directory (Replaces free text input) */}
      <div className="p-3 bg-[#042B58] border-t border-[#88A5BF]/25 shrink-0 flex flex-col gap-2">
        {/* Toggle button to expand/collapse full question browser when in active conversation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsQuestionPickerExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-white hover:text-[#F9C03E] transition-colors cursor-pointer py-1"
          >
            <MessageSquarePlus className="w-4 h-4 text-[#F9C03E]" />
            <span>
              {isQuestionPickerExpanded
                ? 'Nascondi lista domande'
                : 'Scegli una domanda per il Coach (100 disponibili)'}
            </span>
            {isQuestionPickerExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#F9C03E]" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-[#F9C03E]" />
            )}
          </button>

          <span className="text-[10px] font-mono text-[#88A5BF]">
            Rimasti: <strong className={remainingToday <= 3 ? 'text-red-400' : 'text-white'}>{remainingToday}/{COACH_DAILY_LIMIT}</strong>
          </span>
        </div>

        {/* Category Pills Bar (Always accessible) */}
        <div className="overflow-x-auto py-1 scrollbar-none flex gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setIsQuestionPickerExpanded(true);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer border ${
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

        {/* Expandable / Collapsible Question Drawer */}
        {isQuestionPickerExpanded && (
          <div className="mt-1 space-y-2 max-h-64 overflow-y-auto pr-1 animate-fadeIn border-t border-[#88A5BF]/15 pt-2 text-left">
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
              {filteredQuestions.map((q: CoachQuestionItem) => {
                const numLabel = getQuestionNumberLabel(q);
                return (
                  <button
                    key={q.id}
                    onClick={() => handleSendMessage(q.question)}
                    disabled={remainingToday <= 0 || isLoading}
                    className="w-full p-2.5 rounded-xl bg-[#021831]/80 hover:bg-[#234C77] border border-[#88A5BF]/20 hover:border-[#F9C03E]/50 text-left transition-all flex flex-col gap-1 group cursor-pointer disabled:opacity-40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-md bg-[#F9C03E] text-[#042B58] font-mono font-black text-[10px] flex items-center justify-center">
                          {numLabel}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#F9C03E]">
                          {q.categoryLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover:text-white font-medium">
                        Invia →
                      </span>
                    </div>
                    <p className="text-xs text-white group-hover:text-amber-100 font-medium leading-snug">
                      {q.question}
                    </p>
                  </button>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-400">
                  Nessuna domanda trovata per questa ricerca.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Suggestion buttons when drawer is closed and messages exist */}
        {!isQuestionPickerExpanded && hasMessages && (
          <div className="overflow-x-auto py-1 scrollbar-none flex gap-1.5">
            {filteredQuestions.slice(0, 5).map((q) => {
              const numLabel = getQuestionNumberLabel(q);
              return (
                <button
                  key={q.id}
                  onClick={() => handleSendMessage(q.question)}
                  disabled={remainingToday <= 0 || isLoading}
                  className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#021831] hover:bg-[#234C77] text-slate-200 hover:text-white border border-[#88A5BF]/30 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <span className="w-4 h-4 rounded bg-[#F9C03E] text-[#042B58] font-mono font-bold text-[10px] flex items-center justify-center">
                    {numLabel}
                  </span>
                  <span className="max-w-[180px] truncate">{q.summary}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer info: Reset time & Daily limit */}
        <div className="flex items-center justify-between text-[11px] text-[#88A5BF] pt-1 px-1 font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#F9C03E]" />
            <span>Reset automatico a mezzanotte</span>
          </div>
          <span>
            {remainingToday > 0 ? `${remainingToday} consulti disponibili` : 'Limite giornaliero raggiunto'}
          </span>
        </div>
      </div>
    </div>
  );
};
