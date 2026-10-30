import React, { useState } from 'react';
import {
  X,
  User,
  Trash2,
  LogOut,
  Check,
  HelpCircle,
  ShieldAlert,
  ExternalLink,
  Instagram,
  FileText,
  Music,
  Video,
  Play,
} from 'lucide-react';
import { wipeAllAppData, saveUserData, isTrialUser, getTrialCoachRemaining } from '../services/storage';
import { exportAndPrintReport } from '../services/reportExport';
import { logoutFirebase } from '../services/firebase';
import { AREA_RISERVATA_URL, INSTAGRAM_URL } from '../config';
import { UserData } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onNameUpdate: (newName: string) => void;
  onRetakeQuiz: () => void;
  onOpenRhythm?: () => void;
  onOpenVideocorso?: () => void;
  onLogout: () => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onNameUpdate,
  onRetakeQuiz,
  onOpenRhythm,
  onOpenVideocorso,
  onLogout,
  onDataReset,
}) => {
  const [nameInput, setNameInput] = useState(user.name || '');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    saveUserData({ name: nameInput.trim() });
    onNameUpdate(nameInput.trim());
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleExport = () => {
    exportAndPrintReport();
  };

  const handleConfirmWipe = () => {
    wipeAllAppData();
    setShowConfirmReset(false);
    onDataReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg max-h-[90vh] bg-[#182033] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-card flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-display text-[#f7f6f3]">Impostazioni</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi impostazioni"
            className="text-slate-400 hover:text-white p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-3 space-y-4 pr-1 my-1">

          {/* Account Profile Card */}
          <div className="glass-card p-4 border border-[#E5B869]/25 bg-[#0d121e]/80">
            <div className="flex items-start justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold tracking-wider text-[#E5B869] uppercase block mb-1">
                  Account Attivo
                </span>
                <p className="text-sm font-bold text-white truncate">
                  {user.name || 'Allievo'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.email || 'Nessuna email registrata'}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  isTrialUser(user)
                    ? 'bg-amber-500/20 text-[#E5B869] border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isTrialUser(user)
                  ? `Prova: ${getTrialCoachRemaining(user)}/3 domande`
                  : 'Versione Completa'}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400">
                Vuoi accedere con un'altra email o nuova prova?
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-colors shrink-0 cursor-pointer"
              >
                Cambia email / Esci
              </button>
            </div>
          </div>

          {/* Change Name */}
          <div className="glass-card p-4">
            <label className="block text-xs font-semibold text-[#88A5BF] uppercase tracking-wider mb-2">
              Il tuo nome
            </label>
            <form onSubmit={handleSaveName} className="flex gap-2">
              <div className="relative flex-1">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Inserisci il tuo nome"
                  className="w-full pl-9 pr-3 py-2 bg-[#021831]/70 border border-[#88A5BF]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#F9C03E]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl gold-gradient-btn text-xs font-semibold shrink-0 flex items-center gap-1"
              >
                {isSavedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvato</span>
                  </>
                ) : (
                  <span>Salva</span>
                )}
              </button>
            </form>
          </div>

          {/* Retake Profile Test */}
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Test del Profilo</h3>
              <p className="text-xs text-[#88A5BF]">
                Rifai il test per scoprire i capitoli consigliati
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onRetakeQuiz();
              }}
              className="py-2 px-3 rounded-xl bg-[#234C77] hover:bg-[#88A5BF]/30 text-white text-xs font-medium border border-[#88A5BF]/30 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#F9C03E]" />
              <span>Rifai il test</span>
            </button>
          </div>

          {/* Link Utili Section */}
          <div className="glass-card p-4 space-y-2.5">
            <span className="text-xs font-semibold text-[#88A5BF] uppercase tracking-wider block">
              Strumenti & Link Utili
            </span>

            {/* Allenatore di Ritmo */}
            {onOpenRhythm && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRhythm();
                }}
                className="w-full p-2.5 rounded-xl bg-[#021831] hover:bg-[#234C77]/50 border border-[#88A5BF]/30 text-xs text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#88A5BF]" />
                  <span>Allenatore di Ritmo (Salsa & Bachata)</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}


            {/* Guarda Videocorso nell'App (Lezione 1 Gratis) */}
            {onOpenVideocorso && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVideocorso();
                }}
                className="w-full p-2.5 rounded-xl bg-[#021831] hover:bg-[#234C77]/50 border border-amber-400/40 text-xs text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#F9C03E]" />
                  <span className="font-semibold text-white">Videocorso (Guarda Lezione 1)</span>
                </div>
                <Play className="w-3.5 h-3.5 fill-[#F9C03E] text-[#F9C03E]" />
              </button>
            )}

            {/* Accedi all'Area Riservata esterna */}
            <a
              href={AREA_RISERVATA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  const win = window.open(AREA_RISERVATA_URL, '_blank', 'noopener,noreferrer');
                  if (!win || win.closed || typeof win.closed === 'undefined') {
                    window.location.href = AREA_RISERVATA_URL;
                  }
                } catch {
                  window.location.href = AREA_RISERVATA_URL;
                }
              }}
              className="p-2.5 rounded-xl bg-[#021831] hover:bg-[#234C77]/50 border border-[#88A5BF]/30 text-xs text-white flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#88A5BF]" />
                <span className="text-slate-300">Login Area Riservata esterna</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* Instagram */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#021831] hover:bg-[#234C77]/50 border border-[#88A5BF]/30 text-xs text-white flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-[#F9C03E]" />
                <span>Instagram @andreaseduzioneballo</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Export Data as PDF */}
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Esporta i miei dati (PDF)</h3>
              <p className="text-xs text-[#88A5BF]">Scarica o stampa il report completo in PDF (profilo e diario)</p>
            </div>
            <button
              onClick={handleExport}
              className="py-2 px-3 rounded-xl bg-[#234C77] hover:bg-[#88A5BF]/30 text-white text-xs font-medium border border-[#88A5BF]/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-[#F9C03E]" />
              <span>Scarica PDF</span>
            </button>
          </div>

          {/* Reset All Data (preserves access and video unlock codes) */}
          <div className="glass-card p-4 border-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-red-300">Azzera tutto</h3>
                <p className="text-xs text-slate-400">Cancella diario, letture e chat (mantiene i codici)</p>
              </div>
              <button
                onClick={() => setShowConfirmReset(true)}
                className="py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Azzera</span>
              </button>
            </div>

            {showConfirmReset && (
              <div className="mt-3 p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-left animate-fadeIn">
                <div className="flex items-start gap-2 mb-2 text-red-200 text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    Sei sicuro? Questa azione azzera diario, chat e letture. I tuoi codici di accesso e sblocco non verranno cancellati.
                  </span>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleConfirmWipe}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    Sì, azzera
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="pt-2">
            <button
              onClick={() => {
                logoutFirebase();
                onLogout();
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#021831] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Esci (disconnetti da questo dispositivo)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
