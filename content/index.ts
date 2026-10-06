import { Unita, ModuloVideo } from './types';
import { EBOOK } from './ebook';
import { RIPARTIRE } from './ripartire';
import { BONUS } from './bonus';
import { VIDEOCORSO } from './videocorso';
import { METODO } from './metodo';

export * from './types';
export { EBOOK } from './ebook';
export { RIPARTIRE } from './ripartire';
export { BONUS } from './bonus';
export { VIDEOCORSO } from './videocorso';
export { METODO } from './metodo';

export const TUTTE_LE_UNITA: Unita[] = [
  ...EBOOK,
  ...RIPARTIRE,
  ...BONUS,
];

export function getUnita(id: string): Unita | undefined {
  if (!id) return undefined;
  const cleanId = id.trim().toLowerCase();
  return TUTTE_LE_UNITA.find((u) => u.id.toLowerCase() === cleanId);
}

/**
 * Restituisce le unità più collegate alla domanda dell'utente (per dare contesto al Coach).
 */
export function trovaUnitaPertinenti(domanda: string, max = 2): Unita[] {
  if (!domanda || !domanda.trim()) {
    return TUTTE_LE_UNITA.slice(0, max);
  }

  const tokens = domanda
    .toLowerCase()
    .replace(/[^\w\sàèéìòù]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (tokens.length === 0) {
    return TUTTE_LE_UNITA.slice(0, max);
  }

  const scored = TUTTE_LE_UNITA.map((unita) => {
    let score = 0;
    const titleLower = unita.titolo.toLowerCase();
    const sintesiLower = unita.sintesi.toLowerCase();
    const testoLower = unita.testo.toLowerCase();
    const keywords = (unita.paroleChiave || []).map((k) => k.toLowerCase());

    tokens.forEach((token) => {
      // High score for keywords & title
      if (keywords.some((k) => k.includes(token))) score += 8;
      if (titleLower.includes(token)) score += 6;
      if (sintesiLower.includes(token)) score += 3;
      if (testoLower.includes(token)) score += 1;
    });

    return { unita, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const filtered = scored.filter((s) => s.score > 0).map((s) => s.unita);
  return filtered.length > 0 ? filtered.slice(0, max) : TUTTE_LE_UNITA.slice(0, max);
}

/**
 * Cerca un testo nella Libreria e restituisce le unità con un estratto del paragrafo corrispondente.
 */
export function cercaNellaLibreria(
  testo: string,
  max = 15
): { unita: Unita; estratto: string }[] {
  if (!testo || !testo.trim()) return [];

  const query = testo.trim().toLowerCase();
  const queryTokens = query.split(/\s+/).filter((t) => t.length > 1);

  const results: { unita: Unita; estratto: string; score: number }[] = [];

  TUTTE_LE_UNITA.forEach((unita) => {
    const rawText = unita.testo.replace(/#{1,6}\s/g, '').replace(/[*_`>]/g, '');
    const titleMatch = unita.titolo.toLowerCase().includes(query);
    const sintesiMatch = unita.sintesi.toLowerCase().includes(query);
    const rawLower = rawText.toLowerCase();
    const textIdx = rawLower.indexOf(query);

    let score = 0;
    if (titleMatch) score += 15;
    if (sintesiMatch) score += 8;
    if (textIdx >= 0) score += 10;

    queryTokens.forEach((tok) => {
      if (unita.titolo.toLowerCase().includes(tok)) score += 4;
      if (rawLower.includes(tok)) score += 1;
    });

    if (score > 0) {
      let estratto = unita.sintesi;
      if (textIdx >= 0) {
        const start = Math.max(0, textIdx - 40);
        const end = Math.min(rawText.length, textIdx + query.length + 80);
        estratto = (start > 0 ? '…' : '') + rawText.slice(start, end).trim() + (end < rawText.length ? '…' : '');
      }
      results.push({ unita, estratto, score });
    }
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, max).map((r) => ({ unita: r.unita, estratto: r.estratto }));
}
