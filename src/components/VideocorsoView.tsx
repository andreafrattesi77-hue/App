import React from 'react';
import {
  Video,
  ExternalLink,
  Sparkles,
  BookOpen,
  ChevronRight,
  Clock,
  Flame,
} from 'lucide-react';
import { VIDEOCORSO, getUnita } from '../../content/index';
import { VIDEOCORSO_URL, AREA_RISERVATA_URL } from '../config';
import { UserData } from '../types';

interface VideocorsoViewProps {
  user?: UserData;
  initialSelectedModule?: number;
  onOpenUnita?: (id: string) => void;
  onUserDataUpdated?: (updated: UserData) => void;
}

export const VideocorsoView: React.FC<VideocorsoViewProps> = ({
  onOpenUnita,
}) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Scheda di Presentazione Principale */}
      <div className="glass-card p-5 sm:p-6 border border-[#F9C03E]/40 relative overflow-hidden space-y-4">
        {/* Glow di sfondo */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#F9C03E]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge in alto */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#234C77] flex items-center justify-center text-[#F9C03E] shadow-sm">
            <Video className="w-4 h-4" />
          </div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#F9C03E]">
            Videocorso Esclusivo • 120 Minuti
          </span>
        </div>

        {/* Titolo in IBM Plex Serif */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white leading-tight">
            Quello che leggi, lo vedi messo in pratica.
          </h2>
          <p className="text-sm font-medium text-[#F9C03E] font-serif leading-snug">
            Quello che insegno ai miei clienti negli incontri 1:1, racchiuso in un videocorso.
          </p>
        </div>

        {/* Testo descrittivo */}
        <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-sans">
          Il Contatto Zero, lo sguardo che attrae, la guida che la fa sentire al sicuro, gli ultimi secondi della canzone: alcune cose si capiscono davvero solo guardandole. 120 minuti di video pratici, dalle basi di Salsa e Bachata fino alle figure che la fanno restare. Da guardare quando vuoi, anche la sera prima di uscire.
        </p>

        {/* Pillole Caratteristiche */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-[#021831]/70 border border-[#88A5BF]/25 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F9C03E] shrink-0" />
            <span className="text-[11px] font-medium text-slate-200">120 minuti di video pratici</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#021831]/70 border border-[#88A5BF]/25 flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#F9C03E] shrink-0" />
            <span className="text-[11px] font-medium text-slate-200">Dalle basi alle figure d'impatto</span>
          </div>
        </div>

        {/* CTA Principale */}
        <div className="pt-2 space-y-3">
          <a
            href={VIDEOCORSO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Scopri il videocorso</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Testo piccolo con link all'Area Riservata */}
          <div className="text-center pt-1">
            <p className="text-xs text-slate-300">
              Hai già il videocorso? Lo trovi nella tua area riservata.{' '}
              <a
                href={AREA_RISERVATA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F9C03E] font-semibold underline underline-offset-2 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
              >
                <span>Accedi</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Intestazione Sezione Moduli */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F9C03E] block">
            I 9 Moduli del Videocorso
          </span>
          <p className="text-[11px] text-[#88A5BF]">Il programma completo passo dopo passo</p>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-300 bg-[#234C77] px-2.5 py-1 rounded-full border border-[#88A5BF]/30">
          9 MODULI
        </span>
      </div>

      {/* Elenco dei 9 Moduli (senza lucchetti e senza player) */}
      <div className="space-y-3">
        {VIDEOCORSO.map((mod) => {
          // Gestione campo evidenza opzionale (da content/videocorso.ts)
          const modEvidenza = (mod as { evidenza?: string }).evidenza;
          // Pulizia parola "break" se presente nella descrizione del modulo
          const cleanDescrizione = (mod.descrizione || '')
            .replace(/\bi break\b/gi, 'le pause')
            .replace(/\bbreak\b/gi, 'le pause');

          return (
            <div
              key={mod.numero}
              className="glass-card p-4 border border-[#88A5BF]/30 hover:border-[#F9C03E]/60 transition-all space-y-2.5 group"
            >
              <div className="flex items-start gap-3">
                {/* Badge Numero Modulo */}
                <div className="w-9 h-9 rounded-xl bg-[#234C77] border border-[#F9C03E]/40 flex items-center justify-center shrink-0 text-[#F9C03E] font-serif font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                  {mod.numero}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-[#88A5BF] block tracking-wide">
                    Modulo {mod.numero}
                  </span>
                  <h3 className="text-sm font-bold font-serif text-white group-hover:text-[#F9C03E] transition-colors leading-snug">
                    {mod.titolo}
                  </h3>
                </div>
              </div>

              {/* Descrizione del modulo proveniente dal file */}
              <p className="text-xs text-slate-300 leading-relaxed pl-12">
                {cleanDescrizione}
              </p>

              {/* Campo evidenza (se presente: corsivo IBM Plex Serif, colore oro #F9C03E, leggermente più grande) */}
              {modEvidenza && (
                <p className="font-serif italic text-sm text-[#F9C03E] pl-12 leading-relaxed">
                  {modEvidenza}
                </p>
              )}

              {/* Capitoli ebook collegati se presenti */}
              {onOpenUnita && mod.collegati && mod.collegati.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50 pl-12 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-semibold text-[#88A5BF] mr-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#F9C03E]" />
                    <span>Teoria collegata:</span>
                  </span>
                  {mod.collegati.map((id) => {
                    const u = getUnita(id);
                    if (!u) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => onOpenUnita(id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#021831] hover:bg-[#234C77] border border-slate-700 text-[10px] text-slate-200 hover:text-white transition-colors"
                      >
                        <span>{u.label}</span>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Richiamo CTA a fine pagina */}
      <div className="glass-card p-5 border border-[#F9C03E]/40 text-center space-y-3">
        <div className="w-10 h-10 mx-auto rounded-xl bg-[#234C77] flex items-center justify-center text-[#F9C03E]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold font-serif text-white">
            Porta il metodo con te in pista
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            120 minuti di video pratici per padroneggiare la presenza, la guida e la connessione.
          </p>
        </div>

        <a
          href={VIDEOCORSO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl gold-gradient-btn text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>Scopri il videocorso</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <p className="text-xs text-slate-300 pt-1">
          Hai già il videocorso? Lo trovi nella tua area riservata.{' '}
          <a
            href={AREA_RISERVATA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F9C03E] font-semibold underline underline-offset-2 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
          >
            <span>Accedi</span>
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        </p>
      </div>
    </div>
  );
};
