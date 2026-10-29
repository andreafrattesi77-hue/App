import React from 'react';
import { Home, Library, MessageCircle, ListChecks, NotebookPen, Sparkles } from 'lucide-react';

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
    { id: 'libreria' as NavTab, label: 'Libreria', icon: Library },
    { id: 'coach' as NavTab, label: 'Coach', icon: MessageCircle },
    { id: 'piano' as NavTab, label: 'Piano', icon: ListChecks },
    { id: 'diario' as NavTab, label: 'Diario', icon: NotebookPen },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl bg-[#141a2a]/95 border-t border-white/10 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl shadow-2xl">
      {/* Banner fisso per utenti in prova */}
      {isTrial && onOpenUpgrade && (
        <button
          type="button"
          onClick={onOpenUpgrade}
          className="w-full py-1.5 px-3 bg-gradient-to-r from-[#182033] via-[#242f4c] to-[#182033] border-b border-[#E5B869]/30 text-[#E5B869] text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-sm tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E5B869] shrink-0" />
          <span>Sblocca la versione completa</span>
        </button>
      )}

      <ul className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <li key={tab.id} className="flex-1">
              <button
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#E5B869]'
                    : 'text-[#9da6b9] hover:text-[#f7f6f3]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'}`} />
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#E5B869] absolute -bottom-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_6px_#E5B869]" />
                  )}
                </div>
                <span
                  className={`text-[11px] mt-1.5 tracking-tight transition-colors ${
                    isActive ? 'font-bold text-[#E5B869]' : 'font-medium text-[#9da6b9]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
