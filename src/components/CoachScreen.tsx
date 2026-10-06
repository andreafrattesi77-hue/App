import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  BookOpen,
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

interface CoachScreenProps {
  user?: UserData | null;
  initialPrompt?: string;
  activeUnitId?: string;
  onClearInitialPrompt?: () => void;
  onOpenUnita: (id: string) => void;
  onGoToRitual?: () => void;
  onGoToLibrary?: () => void;
}

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
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState(COACH_DAILY_LIMIT);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Come la invito?',
    'Mi ha detto di no',
    'Cosa le dico dopo il ballo?',
    'Come capisco se le interesso?',
    'Mi blocco prima dell\'invito',
    'Bachata: come gestisco la vicinanza?',
  ];

  // Load chat and daily limit
  useEffect(() => {
    setMessages(getChatMessages(currentUserName));
    const usage = getCoachDailyUsage();
    setRemainingToday(usage.remainingToday);
  }, [currentUserName]);

  // Handle incoming prompt (e.g. from Reader or Quiz)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputText(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    // Check daily limit
    const usage = getCoachDailyUsage();
    if (!usage.canSend) {
      setErrorNotice(
        `Hai usato i ${COACH_DAILY_LIMIT} messaggi di oggi. Il Coach torna disponibile domani. Intanto rileggi un capitolo o fai il Rituale Pre-Serata.`
      );
      return;
    }

    setErrorNotice(null);
    setInputText('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageContent,
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
        message: messageContent,
        history: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
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
    if (window.confirm('Vuoi iniziare una nuova conversazione con il Coach?')) {
      const initial = resetChatMessages(currentUserName);
      setMessages(initial);
      setErrorNotice(null);
    }
  };

  // Render text replacing [[id]] with clickable chips
  const renderMessageContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[\[([a-zA-Z0-9_-]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Push preceding plain text
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
        // Invalid ID, just show the ID text without brackets
        parts.push(id);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-[calc(100vh-135px)] md:h-[650px] relative">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#88A5BF]/20 bg-[#042B58]/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#234C77] flex items-center justify-center border border-[#F9C03E]/50">
              <Bot className="w-4 h-4 text-[#F9C03E]" />
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#042B58] absolute -bottom-0.5 -right-0.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-serif text-white">Andrea Frattesi</h2>
            <p className="text-[10px] text-[#F9C03E] font-medium">Il tuo coach di EFFETTO CALAMITA</p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="text-xs text-slate-400 hover:text-[#F9C03E] flex items-center gap-1 p-1.5 rounded-lg hover:bg-[#234C77]/40 transition-colors"
          title="Nuova conversazione"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[11px]">Nuova chat</span>
        </button>
      </div>

      {/* Quick Suggestions Chips */}
      <div className="overflow-x-auto py-2 px-3 border-b border-[#88A5BF]/15 shrink-0 scrollbar-none flex gap-1.5">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sug)}
            disabled={remainingToday <= 0 || isLoading}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[#234C77]/60 hover:bg-[#234C77] text-slate-200 hover:text-white border border-[#88A5BF]/30 transition-colors disabled:opacity-50"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => {
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
                className={`p-3.5 rounded-2xl max-w-[85%] text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#234C77] text-white rounded-tr-none border border-[#88A5BF]/30'
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
          <div className="flex items-start gap-2.5 animate-fadeIn">
            <div className="w-7 h-7 rounded-full bg-[#234C77] flex items-center justify-center shrink-0 border border-[#F9C03E]/40">
              <Bot className="w-3.5 h-3.5 text-[#F9C03E]" />
            </div>
            <div className="glass-card-subtle p-3 rounded-2xl rounded-tl-none border border-[#88A5BF]/25 flex items-center gap-1.5 text-xs text-[#88A5BF]">
              <Sparkles className="w-3.5 h-3.5 text-[#F9C03E] animate-spin" />
              <span>Andrea sta consultando il metodo...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error / Daily limit alert banner */}
      {errorNotice && (
        <div className="mx-3 mb-2 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-left text-xs text-red-200 flex flex-col gap-2">
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

      {/* Input area */}
      <div className="p-3 bg-[#021831]/90 border-t border-[#88A5BF]/20 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={remainingToday <= 0 || isLoading}
            placeholder={
              remainingToday > 0
                ? 'Chiedi al Coach su pista, sguardi, frasi...'
                : 'Hai usato i 20 messaggi di oggi.'
            }
            className="flex-1 bg-[#042B58] border border-[#88A5BF]/30 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#F9C03E] disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || remainingToday <= 0 || isLoading}
            className="w-10 h-10 rounded-xl gold-gradient-btn flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            title="Invia"
          >
            <Send className="w-4 h-4 text-[#042B58]" />
          </button>
        </form>

        {/* Daily limit counter */}
        <div className="flex items-center justify-between text-[11px] text-[#88A5BF] mt-1.5 px-1 font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#F9C03E]" />
            <span>Reset a mezzanotte</span>
          </div>
          <span>
            Messaggi rimasti oggi:{' '}
            <strong className={remainingToday <= 3 ? 'text-red-400' : 'text-white'}>
              {remainingToday}/{COACH_DAILY_LIMIT}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
