import React from 'react';
import { Home, BookOpen, MessageSquare, CheckSquare, Calendar, Sparkles } from 'lucide-react';

export type NavTab = 'home' | 'libreria' | 'coach' | 'piano' | 'diario';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isTrial?: boolean;
  onOpenUpgrade?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  isTrial = false,
  onOpenUpgrade,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'libreria' as NavTab, label: 'Libreria', icon: BookOpen },
    { id: 'coach' as NavTab, label: 'Coach', icon: MessageSquare },
    { id: 'piano' as NavTab, label: 'Piano', icon: CheckSquare },
    { id: 'diario' as NavTab, label: 'Diario', icon: Calendar },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center bg-[#021831]/95 backdrop-blur-lg border-t border-[#88A5BF]/20 pb-safe">
      {/* Voce fissa nel menu/navigazione per utenti gratuiti */}
      {isTrial && onOpenUpgrade && (
        <button
          type="button"
          onClick={onOpenUpgrade}
          className="w-full py-1.5 px-3 bg-gradient-to-r from-[#234C77] via-[#0A3A75] to-[#234C77] border-b border-[#F9C03E]/40 text-[#F9C03E] text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-sm tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F9C03E] shrink-0" />
          <span>⭐ Sblocca versione completa</span>
        </button>
      )}

      <div className="w-full max-w-md flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-[#F9C03E]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#F9C03E] absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium tracking-tight ${
                  isActive ? 'font-bold text-[#F9C03E]' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
