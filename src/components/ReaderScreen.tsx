import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Compass,
  List,
  MessageSquare,
  Moon,
  Sun,
  Video,
  ChevronLeft,
  ChevronRight,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Unita, TUTTE_LE_UNITA, getUnita, VIDEOCORSO } from '../../content/index';
import { VIDEOCORSO_URL } from '../config';
import { UserData } from '../types';
import { saveUserData } from '../services/storage';

interface ReaderScreenProps {
  unita: Unita;
  user: UserData;
  targetHeading?: string; // target header to scroll to
  onBack: () => void;
  onOpenUnita: (id: string, targetHeading?: string) => void;
  onAskCoachWithPrompt: (prompt: string, unitId?: string) => void;
  onOpenVideocorso: (moduleNum?: number) => void;
  onUserDataUpdated: (updated: UserData) => void;
}

export const ReaderScreen: React.FC<ReaderScreenProps> = ({
  unita,
  user,
  targetHeading,
  onBack,
  onOpenUnita,
  onAskCoachWithPrompt,
  onOpenVideocorso,
  onUserDataUpdated,
}) => {
  const [theme, setTheme] = useState<'notte' | 'giorno'>(user.readerTheme || 'notte');
  const [fontSize, setFontSize] = useState<number>(user.readerFontSize || 17);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    (user.favorites || []).includes(unita.id)
  );
  const [isRead, setIsRead] = useState<boolean>(
    (user.readUnits || []).includes(unita.id)
  );
  const [showToc, setShowToc] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);

  // Extract all ## headings for table of contents
  const headings: string[] = [];
  const lines = unita.testo.split('\n');
  lines.forEach((line) => {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      headings.push(match[1].trim());
    }
  });

  // Track scroll and restore reading position
  useEffect(() => {
    // Record this unit as last opened
    const updated = saveUserData({ lastOpenedUnitId: unita.id });
    onUserDataUpdated(updated);

    // If target heading is specified, scroll to it
    if (targetHeading) {
      setTimeout(() => {
        const el = document.getElementById(slugify(targetHeading));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } else {
      // Restore previous scroll position if saved
      const savedPercent = user.readingPositions?.[unita.id] || 0;
      if (savedPercent > 5 && contentRef.current) {
        setTimeout(() => {
          if (contentRef.current) {
            const scrollable = contentRef.current.scrollHeight - contentRef.current.clientHeight;
            contentRef.current.scrollTop = (savedPercent / 100) * scrollable;
          }
        }, 150);
      }
    }
  }, [unita.id]);

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) return;
    const percent = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
    setScrollProgress(percent);

    // Save position periodically
    saveUserData({
      readingPositions: {
        ...(user.readingPositions || {}),
        [unita.id]: percent,
      },
    });
  };

  const toggleBookmark = () => {
    const favs = new Set(user.favorites || []);
    if (favs.has(unita.id)) {
      favs.delete(unita.id);
      setIsBookmarked(false);
    } else {
      favs.add(unita.id);
      setIsBookmarked(true);
    }
    const updated = saveUserData({ favorites: Array.from(favs) });
    onUserDataUpdated(updated);
  };

  const toggleReadStatus = () => {
    const read = new Set(user.readUnits || []);
    if (read.has(unita.id)) {
      read.delete(unita.id);
      setIsRead(false);
    } else {
      read.add(unita.id);
      setIsRead(true);
    }
    const updated = saveUserData({ readUnits: Array.from(read) });
    onUserDataUpdated(updated);
  };

  const handleThemeChange = (newTheme: 'notte' | 'giorno') => {
    setTheme(newTheme);
    const updated = saveUserData({ readerTheme: newTheme });
    onUserDataUpdated(updated);
  };

  const handleFontSizeChange = (delta: number) => {
    const nextSize = Math.max(14, Math.min(24, fontSize + delta));
    setFontSize(nextSize);
    const updated = saveUserData({ readerFontSize: nextSize });
    onUserDataUpdated(updated);
  };

  const scrollToHeading = (headingText: string) => {
    setShowToc(false);
    const el = document.getElementById(slugify(headingText));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Find previous and next units in the overall collection
  const currentIndex = TUTTE_LE_UNITA.findIndex((u) => u.id === unita.id);
  const prevUnit = currentIndex > 0 ? TUTTE_LE_UNITA[currentIndex - 1] : null;
  const nextUnit = currentIndex < TUTTE_LE_UNITA.length - 1 ? TUTTE_LE_UNITA[currentIndex + 1] : null;

  // Find linked video modules
  const linkedVideo = VIDEOCORSO.find((v) => (v.collegati || []).includes(unita.id));

  // Connected units
  const connectedUnits = (unita.collegati || [])
    .map((id) => getUnita(id))
    .filter(Boolean) as Unita[];

  const isNight = theme === 'notte';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-200 ${
        isNight ? 'bg-[#042B58] text-slate-100' : 'bg-[#FAF7F0] text-[#17222F]'
      }`}
    >
      {/* Top Fixed Navigation & Progress */}
      <header
        className={`sticky top-0 z-30 px-3 py-2.5 border-b flex items-center justify-between transition-colors ${
          isNight
            ? 'bg-[#042B58]/95 border-[#88A5BF]/20 backdrop-blur-md'
            : 'bg-[#FAF7F0]/95 border-[#88A5BF]/30 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-xl transition-colors ${
              isNight ? 'hover:bg-[#234C77] text-slate-300' : 'hover:bg-amber-100 text-[#042B58]'
            }`}
            title="Torna alla Libreria"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="truncate max-w-[190px]">
            <span className="text-[10px] uppercase font-bold text-[#F9C03E] tracking-wider block">
              {unita.label}
            </span>
            <h2 className="text-xs font-serif font-bold truncate">
              {unita.titolo}
            </h2>
          </div>
        </div>

        {/* Reader controls */}
        <div className="flex items-center gap-1">
          {/* Index / TOC */}
          {headings.length > 0 && (
            <button
              onClick={() => setShowToc(!showToc)}
              className={`p-1.5 rounded-xl text-xs flex items-center gap-1 ${
                isNight ? 'hover:bg-[#234C77] text-slate-300' : 'hover:bg-amber-100 text-[#042B58]'
              }`}
              title="Indice capitolo"
            >
              <List className="w-4 h-4 text-[#F9C03E]" />
            </button>
          )}

          {/* Font Size A- / A+ */}
          <button
            onClick={() => handleFontSizeChange(-1)}
            className={`px-1.5 py-1 text-[11px] font-bold rounded-lg ${
              isNight ? 'hover:bg-[#234C77] text-slate-300' : 'hover:bg-amber-100 text-[#042B58]'
            }`}
            title="Riduci testo"
          >
            A−
          </button>
          <button
            onClick={() => handleFontSizeChange(1)}
            className={`px-1.5 py-1 text-xs font-bold rounded-lg ${
              isNight ? 'hover:bg-[#234C77] text-slate-300' : 'hover:bg-amber-100 text-[#042B58]'
            }`}
            title="Ingrandisci testo"
          >
            A+
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => handleThemeChange(isNight ? 'giorno' : 'notte')}
            className={`p-1.5 rounded-xl transition-colors ${
              isNight ? 'hover:bg-[#234C77] text-[#F9C03E]' : 'hover:bg-amber-100 text-[#042B58]'
            }`}
            title={isNight ? 'Tema Giorno (crema)' : 'Tema Notte (navy)'}
          >
            {isNight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className={`p-1.5 rounded-xl transition-colors ${
              isNight ? 'hover:bg-[#234C77]' : 'hover:bg-amber-100'
            }`}
            title={isBookmarked ? 'Rimuovi dai preferiti' : 'Salva nei preferiti'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-[#F9C03E]" />
            ) : (
              <Bookmark className={`w-4 h-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
            )}
          </button>
        </div>

        {/* Scroll Progress line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/30">
          <div
            className="bg-[#F9C03E] h-full transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </header>

      {/* Table of contents dropdown modal */}
      {showToc && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-center p-4 pt-16 animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border max-h-[70vh] flex flex-col ${
              isNight ? 'bg-[#042B58] border-[#88A5BF]/30 text-white' : 'bg-[#FAF7F0] border-amber-200 text-[#042B58]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 mb-3">
              <h3 className="font-serif font-bold text-sm">Indice dei paragrafi</h3>
              <button
                onClick={() => setShowToc(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Chiudi
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 py-1 pr-1 text-xs">
              {headings.map((h, i) => (
                <button
                  key={i}
                  onClick={() => scrollToHeading(h)}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors font-medium flex items-center gap-2 ${
                    isNight
                      ? 'hover:bg-[#234C77] text-slate-200'
                      : 'hover:bg-amber-100 text-[#042B58]'
                  }`}
                >
                  <span className="text-[#F9C03E] font-bold text-[10px]">§</span>
                  <span className="truncate">{h}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Scroll Area */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-6 max-w-xl mx-auto w-full"
      >
        {/* Unit Header */}
        <div className="mb-6 pb-4 border-b border-[#88A5BF]/25">
          <span className="text-xs uppercase font-bold tracking-widest text-[#F9C03E] block mb-1">
            {unita.label}
          </span>
          <h1
            className={`font-serif font-bold text-2xl md:text-3xl leading-tight mb-3 ${
              isNight ? 'text-white' : 'text-[#042B58]'
            }`}
          >
            {unita.titolo}
          </h1>
          <div className="flex items-center gap-3 text-xs opacity-75">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#F9C03E]" />
              <span>{unita.minutiLettura} min di lettura</span>
            </span>
            {isRead && (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Letto</span>
              </span>
            )}
          </div>
        </div>

        {/* Markdown Content */}
        <article
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
          className="reading-content space-y-4"
        >
          <ReactMarkdown
            components={{
              h2: ({ children }) => {
                const text = String(children);
                const id = slugify(text);
                return (
                  <h2
                    id={id}
                    className={`font-serif font-bold text-xl md:text-2xl mt-8 mb-3 pt-3 border-t ${
                      isNight
                        ? 'text-white border-[#88A5BF]/20'
                        : 'text-[#042B58] border-amber-200'
                    }`}
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => (
                <h3
                  className={`font-serif font-bold text-lg mt-6 mb-2 ${
                    isNight ? 'text-[#F9C03E]' : 'text-[#234C77]'
                  }`}
                >
                  {children}
                </h3>
              ),
              p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
              strong: ({ children }) => (
                <strong
                  className={`font-semibold ${
                    isNight ? 'text-[#F9C03E]' : 'text-[#042B58]'
                  }`}
                >
                  {children}
                </strong>
              ),
              blockquote: ({ children }) => (
                <blockquote
                  className={`my-4 pl-4 border-l-4 border-[#F9C03E] italic p-2 rounded-r-xl ${
                    isNight ? 'bg-[#234C77]/30 text-slate-200' : 'bg-amber-50 text-[#17222F]'
                  }`}
                >
                  {children}
                </blockquote>
              ),
              ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-4">{children}</ol>,
              hr: () => (
                <hr
                  className={`my-6 ${
                    isNight ? 'border-[#88A5BF]/20' : 'border-amber-200'
                  }`}
                />
              ),
            }}
          >
            {unita.testo}
          </ReactMarkdown>
        </article>

        {/* Footer Unit Actions */}
        <div className="mt-10 pt-6 border-t border-[#88A5BF]/30 space-y-4">
          {/* Mark as read button */}
          <button
            onClick={toggleReadStatus}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
              isRead
                ? 'bg-emerald-700 text-white'
                : 'gold-gradient-btn'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isRead ? 'Segnato come letto (tocca per deselezionare)' : 'Segna capitolo come letto'}</span>
          </button>

          {/* Ask Coach about this unit */}
          <button
            onClick={() => {
              const prompt = `Ho appena letto «${unita.titolo}». Come lo metto in pratica sabato alla prossima serata?`;
              onAskCoachWithPrompt(prompt, unita.id);
            }}
            className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              isNight
                ? 'bg-[#234C77]/70 hover:bg-[#234C77] border-[#F9C03E]/40 text-white'
                : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-[#042B58]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#F9C03E]" />
            <span>Chiedi al Coach su questo capitolo</span>
          </button>

          {/* Linked Videocorso Card (if any) */}
          {linkedVideo && (
            <a
              href={VIDEOCORSO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                isNight
                  ? 'bg-[#021831]/80 border-[#F9C03E]/40 hover:border-[#F9C03E]'
                  : 'bg-white border-amber-300 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#234C77] flex items-center justify-center text-[#F9C03E] group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#F9C03E]">
                      Videocorso • Modulo {linkedVideo.numero}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold">{linkedVideo.titolo}</h4>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F9C03E] shrink-0">
                <span className="hidden sm:inline">Scopri il videocorso</span>
                <ExternalLink className="w-4 h-4 text-[#F9C03E]" />
              </div>
            </a>
          )}

          {/* Connected Units / Approfondisci */}
          {connectedUnits.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F9C03E] block">
                Approfondisci nel metodo:
              </span>
              <div className="space-y-2">
                {connectedUnits.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => onOpenUnita(conn.id)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      isNight
                        ? 'bg-[#234C77]/40 hover:bg-[#234C77]/70 border-[#88A5BF]/25 text-white'
                        : 'bg-white hover:bg-amber-50 border-amber-200 text-[#042B58]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-[#F9C03E] font-bold block uppercase">
                        {conn.label}
                      </span>
                      <h4 className="text-xs font-semibold">{conn.titolo}</h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prev / Next chapter navigation */}
          <div className="flex justify-between items-center pt-4">
            {prevUnit ? (
              <button
                onClick={() => onOpenUnita(prevUnit.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1 ${
                  isNight
                    ? 'bg-[#021831] border-slate-700 text-slate-300'
                    : 'bg-white border-amber-200 text-[#042B58]'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Precedente</span>
              </button>
            ) : (
              <div />
            )}

            {nextUnit && (
              <button
                onClick={() => onOpenUnita(nextUnit.id)}
                className="py-2 px-4 rounded-xl gold-gradient-btn text-xs font-bold flex items-center gap-1"
              >
                <span>Successivo</span>
                <ChevronRight className="w-4 h-4 text-[#042B58]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
}
