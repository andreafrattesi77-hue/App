import React from 'react';
import { ShieldAlert, Settings } from 'lucide-react';

interface TopHeaderProps {
  onOpenReset: () => void;
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenReset,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#042B58]/90 backdrop-blur-md border-b border-[#88A5BF]/20">
      <div className="w-full max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F9C03E] shadow-sm" />
          <div>
            <h1 className="text-sm font-bold font-serif tracking-wider text-white leading-tight">
              EFFETTO CALAMITA
            </h1>
            <p className="text-[10px] text-[#F9C03E] font-serif italic -mt-0.5">
              Il metodo del Filo Invisibile
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Gold Reset button */}
          <button
            onClick={onOpenReset}
            className="px-2.5 py-1 rounded-xl gold-gradient-btn text-[#042B58] text-[11px] font-bold shadow-md flex items-center gap-1 active:scale-95 transition-transform"
            title="Reset di Emergenza in pista"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Settings (Gear) */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-[#234C77]/60 hover:bg-[#234C77] text-slate-300 hover:text-white border border-[#88A5BF]/20 transition-colors"
            title="Impostazioni"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
