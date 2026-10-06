import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Video,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  Award,
  Layers,
} from 'lucide-react';
import {
  EBOOK,
  RIPARTIRE,
  BONUS,
  TUTTE_LE_UNITA,
  VIDEOCORSO,
  Unita,
  cercaNellaLibreria,
  getUnita,
} from '../../content/index';
import { UserData } from '../types';
import { VideocorsoView } from './VideocorsoView';

interface LibraryScreenProps {
  user: UserData;
  onOpenUnita: (id: string, targetHeading?: string) => void;
  onUserDataUpdated: (updated: UserData) => void;
}

type LibraryTab = 'tutto' | 'ebook' | 'ripartire' | 'bonus' | 'strumenti' | 'videocorso';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  user,
  onOpenUnita,
  onUserDataUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('tutto');
  const [searchQuery, setSearchQuery] = useState('');

  // Collapsible parts for Ebook
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({
    'Introduzione': true,
    'Parte I – La Trappola della Tecnica': true,
    'Parte II – L\'Uomo Magnetico': false,
    'Parte III – I Tre Momenti in Pista': false,
    'Conclusione': false,
  });

  const togglePart = (parte: string) => {
    setExpandedParts((prev) => ({
      ...prev,
      [parte]: !prev[parte],
    }));
  };

  const readUnitsCount = (user.readUnits || []).length;
  const totalUnitsCount = TUTTE_LE_UNITA.length;
  const favorites = (user.favorites || [])
    .map((id) => getUnita(id))
    .filter(Boolean) as Unita[];

  // Search results
  const searchResults = searchQuery.trim()
    ? cercaNellaLibreria(searchQuery.trim(), 12)
    : [];

  // Group Ebook chapters by "parte"
  const ebookByPart: Record<string, Unita[]> = {};
  EBOOK.forEach((u) => {
    const part = u.parte || 'Introduzione';
    if (!ebookByPart[part]) ebookByPart[part] = [];
    ebookByPart[part].push(u);
  });

  // Strumenti Rapidi items (with target headings)
  const rapidTools = [
    {
      title: 'Trenta frasi pronte',
      subtitle: 'All\'invito e alla Chiusura Calamita',
      unitId: 'bonus1',
      heading: 'Trenta esempi pronti',
      icon: <Sparkles className="w-3.5 h-3.5 text-[#F9C03E]" />,
    },
    {
      title: 'Le frasi da non dire mai',
      subtitle: 'Le dieci trappole che distruggono il filo',
      unitId: 'bonus1',
      heading: 'Le dieci frasi da non dire mai (e cosa dire al loro posto)',
      icon: <Zap className="w-3.5 h-3.5 text-red-400" />,
    },
    {
      title: 'Carta da portafoglio',
      subtitle: 'Il promemoria in 5 punti da fare in auto',
      unitId: 'bonus2',
      heading: 'Il Rituale Pre-Serata in sintesi: la carta da portafoglio',
      icon: <Compass className="w-3.5 h-3.5 text-[#F9C03E]" />,
    },
    {
      title: 'Situazioni difficili in chat',
      subtitle: 'Come rispondere a silenzi e risposte fredde',
      unitId: 'bonus3',
      heading: 'Dodici situazioni difficili, e come gestirle',
      icon: <Flame className="w-3.5 h-3.5 text-sky-400" />,
    },
    {
      title: 'I segnali di interesse',
      subtitle: 'I 7 indizi per capire se è solo educata',
      unitId: 'bonus4',
      heading: 'I sette segnali di interesse in pista',
      icon: <Award className="w-3.5 h-3.5 text-[#F9C03E]" />,
    },
    {
      title: 'Idee primo appuntamento',
      subtitle: '10 proposte fuori dalla pista per chi balla',
      unitId: 'bonus5',
      heading: 'Dieci idee per chi viene dal mondo del ballo',
      icon: <BookOpen className="w-3.5 h-3.5 text-emerald-400" />,
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto p-3.5 pb-36 space-y-3.5 animate-fadeIn">
      {/* Header and Total Progress */}
      <div className="flex items-center justify-between pt-1 px-0.5">
        <div>
          <h1 className="text-xl font-bold font-serif text-white">Libreria</h1>
          <p className="text-xs text-[#88A5BF]">Tutto il metodo di Andrea Frattesi</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-[#F9C03E]">
            {readUnitsCount}/{totalUnitsCount}
          </span>
          <p className="text-[10px] text-slate-300">Lette</p>
        </div>
      </div>

      {/* Search Bar (Compact) */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca nel metodo (es. sguardo, bachata, frasi)..."
          className="w-full pl-9 pr-8 py-2 bg-[#021831] border border-[#88A5BF]/30 rounded-xl text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#F9C03E]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-white absolute right-3 top-2.5"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery.trim() ? (
        <div className="space-y-2 animate-fadeIn">
          <span className="text-xs font-bold text-[#88A5BF] uppercase px-1 block">
            Risultati per "{searchQuery}" ({searchResults.length})
          </span>
          {searchResults.length === 0 ? (
            <div className="glass-card p-5 text-center text-xs text-slate-400">
              Nessun capitolo trovato con questo termine. Prova con un'altra parola chiave.
            </div>
          ) : (
            searchResults.map(({ unita, estratto }) => (
              <div
                key={unita.id}
                onClick={() => onOpenUnita(unita.id)}
                className="glass-card p-3 border border-[#88A5BF]/30 hover:border-[#F9C03E] cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#F9C03E] uppercase">
                    {unita.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {unita.minutiLettura}m
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">{unita.titolo}</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                  {estratto}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Grid of Sections for Instant Navigation without Hidden Horizontal Scroll */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {[
              { id: 'tutto', label: 'Tutto', count: totalUnitsCount, icon: Layers },
              { id: 'ebook', label: 'Ebook', count: EBOOK.length, icon: BookOpen },
              { id: 'ripartire', label: 'Ripartire', count: RIPARTIRE.length, icon: Compass },
              { id: 'bonus', label: 'Bonus', count: BONUS.length, icon: Sparkles },
              { id: 'strumenti', label: 'Strumenti', count: rapidTools.length, icon: Zap },
              { id: 'videocorso', label: 'Videocorso', count: VIDEOCORSO.length, icon: Video },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as LibraryTab)}
                  className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#F9C03E] border-[#F9C03E] text-[#042B58] shadow-md font-bold'
                      : 'bg-[#234C77]/50 hover:bg-[#234C77]/80 border-[#88A5BF]/25 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#042B58]' : 'text-[#F9C03E]'}`} />
                    <span className="text-xs font-semibold leading-none">{tab.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono leading-none ${
                      isActive ? 'text-[#042B58]/80 font-bold' : 'text-[#88A5BF]'
                    }`}
                  >
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bookmarks Section (if any exist) */}
          {favorites.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5 px-1">
                <Bookmark className="w-3 h-3 fill-[#F9C03E]" />
                <span>Preferiti ({favorites.length})</span>
              </span>
              <div className="space-y-1">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => onOpenUnita(fav.id)}
                    className="glass-card p-2.5 border border-[#F9C03E]/40 hover:border-[#F9C03E] cursor-pointer flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <span className="text-[9px] text-[#F9C03E] font-bold block uppercase">
                        {fav.label}
                      </span>
                      <h4 className="text-xs font-semibold text-white truncate">{fav.titolo}</h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STRUMENTI RAPIDI SECTION (Shown at top of 'tutto' or 'strumenti' for ultra-fast access) */}
          {(activeTab === 'tutto' || activeTab === 'strumenti') && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F9C03E] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Strumenti Rapidi (Pronto Uso)</span>
                </span>
                {activeTab === 'tutto' && (
                  <button
                    onClick={() => setActiveTab('strumenti')}
                    className="text-[11px] text-[#88A5BF] hover:text-white"
                  >
                    Filtra
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {rapidTools.map((tool, idx) => (
                  <button
                    key={idx}
                    onClick={() => onOpenUnita(tool.unitId, tool.heading)}
                    className="p-2.5 rounded-xl bg-[#234C77]/50 hover:bg-[#234C77] border border-[#88A5BF]/30 text-left transition-all flex flex-col justify-between group active:scale-[0.98]"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#042B58] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      {tool.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5 leading-snug">{tool.title}</h4>
                      <p className="text-[10px] text-slate-300 line-clamp-1 leading-tight">{tool.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EBOOK SECTION (Compact with accordion fold/unfold) */}
          {(activeTab === 'tutto' || activeTab === 'ebook') && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#88A5BF] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#F9C03E]" />
                  <span>Ebook – Effetto Calamita ({EBOOK.length})</span>
                </span>
                {activeTab === 'tutto' && (
                  <button
                    onClick={() => setActiveTab('ebook')}
                    className="text-[11px] text-[#F9C03E] font-semibold hover:underline"
                  >
                    Vedi solo Ebook
                  </button>
                )}
              </div>

              {Object.keys(ebookByPart).map((parte) => {
                const isPartOpen = activeTab === 'ebook' || !!expandedParts[parte];
                const partUnits = ebookByPart[parte];
                const readInPart = partUnits.filter((u) => (user.readUnits || []).includes(u.id)).length;

                return (
                  <div key={parte} className="glass-card p-3 space-y-1.5 border border-[#88A5BF]/25">
                    {/* Collapsible Accordion Header */}
                    <div
                      onClick={() => togglePart(parte)}
                      className="flex items-center justify-between cursor-pointer py-1 select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <h3 className="text-xs font-bold font-serif text-[#F9C03E] uppercase tracking-wide truncate">
                          {parte}
                        </h3>
                        <span className="text-[10px] text-[#88A5BF] font-mono shrink-0">
                          ({readInPart}/{partUnits.length})
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {isPartOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>

                    {/* Chapter items */}
                    {isPartOpen && (
                      <div className="divide-y divide-slate-700/40 pt-1">
                        {partUnits.map((unita) => {
                          const isRead = (user.readUnits || []).includes(unita.id);
                          const readingPos = user.readingPositions?.[unita.id] || 0;

                          return (
                            <div
                              key={unita.id}
                              onClick={() => onOpenUnita(unita.id)}
                              className="py-2 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-[#234C77]/30 px-1 rounded-lg transition-colors group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[10px] uppercase font-bold text-[#88A5BF]">
                                    {unita.label}
                                  </span>
                                  {isRead && (
                                    <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3" /> Letto
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#F9C03E] transition-colors">
                                  {unita.titolo}
                                </h4>
                                {readingPos > 0 && !isRead && (
                                  <div className="w-20 bg-[#021831] h-1 rounded-full mt-1 overflow-hidden">
                                    <div
                                      className="bg-[#F9C03E] h-full"
                                      style={{ width: `${readingPos}%` }}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                                <span className="text-[10px] font-mono">{unita.minutiLettura}m</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* GUIDA EXTRA RIPARTIRE */}
          {(activeTab === 'tutto' || activeTab === 'ripartire') && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#88A5BF] px-1 block flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>Guida Extra – Ripartire ({RIPARTIRE.length})</span>
              </span>

              {RIPARTIRE.map((rip) => {
                const isRead = (user.readUnits || []).includes(rip.id);
                return (
                  <div
                    key={rip.id}
                    onClick={() => onOpenUnita(rip.id)}
                    className="glass-card p-3 border border-[#88A5BF]/30 hover:border-[#F9C03E] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold text-[#F9C03E] uppercase">
                          {rip.label}
                        </span>
                        {isRead && (
                          <span className="text-[9px] text-emerald-400 font-bold">✓ Letto</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white mb-0.5 truncate">{rip.titolo}</h4>
                      <p className="text-[11px] text-slate-300 line-clamp-1">{rip.sintesi}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}

          {/* BONUS SECTION */}
          {(activeTab === 'tutto' || activeTab === 'bonus') && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#88A5BF] px-1 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F9C03E]" />
                <span>I 6 Bonus ({BONUS.length})</span>
              </span>

              <div className="space-y-1.5">
                {BONUS.map((b) => {
                  const isRead = (user.readUnits || []).includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => onOpenUnita(b.id)}
                      className="glass-card p-3 border border-[#88A5BF]/30 hover:border-[#F9C03E] cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-[#F9C03E] uppercase">
                            {b.label}
                          </span>
                          {isRead && (
                            <span className="text-[9px] text-emerald-400 font-bold">✓ Letto</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white mb-0.5 truncate">{b.titolo}</h4>
                        <p className="text-[11px] text-slate-300 line-clamp-1">{b.sintesi}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIDEOCORSO SECTION */}
          {(activeTab === 'tutto' || activeTab === 'videocorso') && (
            <div className="pt-1">
              <VideocorsoView
                user={user}
                onOpenUnita={onOpenUnita}
                onUserDataUpdated={onUserDataUpdated}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
