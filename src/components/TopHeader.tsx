import React from 'react';
import { Settings, Sparkles } from 'lucide-react';

interface TopHeaderProps {
  onOpenReset?: () => void;
  onOpenSettings: () => void;
  isTrial?: boolean;
  onOpenUpgrade?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenSettings,
  isTrial = false,
  onOpenUpgrade,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#121622]/90 backdrop-blur-md border-b border-white/10">
      <div className="w-full max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#E5B869] shadow-[0_0_8px_rgba(229,184,105,0.8)]" />
          <div>
            <h1 className="text-sm sm:text-base font-bold font-serif tracking-[0.14em] text-white leading-tight">
              EFFETTO <span className="text-[#E5B869]">CALAMITA</span>
            </h1>
            <p className="text-[11px] text-[#E5B869] font-serif italic tracking-wide -mt-0.5">
              Il metodo del flirt invisibile
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Sblocca versione completa per utenti gratuiti */}
          {isTrial && onOpenUpgrade && (
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="py-1 px-3 rounded-full bg-gradient-gold text-[#121622] text-[11px] font-bold flex items-center gap-1.5 shadow-gold active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#121622]" />
              <span>Sblocca</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-[#182033]/80 hover:bg-[#212b42] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Impostazioni"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
