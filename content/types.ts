export type TipoUnita = "ebook" | "ripartire" | "bonus";

export interface Unita {
  id: string;            // es. "cap04", "rip1", "bonus3"
  label: string;         // es. "Capitolo 4"
  titolo: string;
  parte: string | null;  // es. "Parte I · Il Risveglio"
  sintesi: string;
  paroleChiave: string[];
  collegati: string[];   // id di unità collegate
  minutiLettura: number;
  testo: string;         // Markdown (## titoli, **grassetto**, *corsivo*, elenchi, > citazioni)
}

export interface ModuloVideo {
  numero: number;
  titolo: string;
  descrizione: string;
  evidenza?: string;     // frase da mettere in risalto (oro, corsivo)
  videoUrl: string;      // link YouTube non in elenco / Vimeo / Systeme da incollare
  collegati: string[];
}
