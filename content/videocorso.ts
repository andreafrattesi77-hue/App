import type { ModuloVideo } from "./types";
import { AREA_RISERVATA_URL } from "../src/config";

// Elenco dei moduli del videocorso. Solo il Modulo 1 (intro) è incorporato localmente per ragioni di performance e limiti di bundle.
export const VIDEOCORSO: ModuloVideo[] = [
  {
    numero: 1,
    titolo: "Parti con il piede giusto",
    descrizione: "Come è costruito il corso e come usarlo insieme all'ebook per vedere risultati già dalle prime serate.",
    videoUrl: "/assets/aistudio/Intro_Videocorso-1_cd289a2f.mp4",
    collegati: ["intro"],
  },
  {
    numero: 2,
    titolo: "Entra in pista con la testa giusta",
    descrizione: "Il modo di pensare che cambia come ti muovi, come guidi e come lei ti percepisce.",
    videoUrl: AREA_RISERVATA_URL,
    collegati: ["cap06", "cap07"],
  },
  {
    numero: 3,
    titolo: "Ascolta la musica come la sente lei",
    descrizione: "Perché la musica decide il ballo e come usarla per creare emozione, invece di contare i passi.",
    videoUrl: AREA_RISERVATA_URL,
    collegati: ["cap13"],
  },
  {
    numero: 4,
    titolo: "Rifai le basi della Salsa nel modo giusto",
    descrizione: "Passo base, guida e postura rivisti con un obiettivo nuovo: connettere, non eseguire.",
    videoUrl: AREA_RISERVATA_URL,
    collegati: ["cap11", "cap13"],
  },
  {
    numero: 5,
    titolo: "Usa la Salsa per farla sentire al sicuro",
    descrizione: "Come guidare perché lei si fidi di te già dalle prime battute.",
    videoUrl: AREA_RISERVATA_URL,
    collegati: ["cap11"],
  },
  {
    numero: 6,
    titolo: "Le figure di Salsa che contano davvero",
    descrizione: "Poche figure scelte per creare connessione, spiegate passo per passo.",
    evidenza: "Non conta cosa fai, conta come lo fai.",
    videoUrl: AREA_RISERVATA_URL,
    collegati: ["cap13"],
  },
  {
    numero: 7,
    titolo: "Le basi della Bachata, senza errori",
    descrizione: "Strette, sguardi, vicinanza. Il tutto durante il ballo, sempre con rispetto.",
    videoUrl: AREA_RISERVATA_URL,
    collegati: ["cap14"],
  },
  {
    numero: 8,
    titolo: "Fai della Bachata un'esperienza che ricorda",
    descrizione: "Come usare vicinanza, ritmo e pause per tendere il Filo Invisibile.",
    videoUrl: AREA_RISERVATA_URL,
    collegati: ["cap14", "cap04"],
  },
  {
    numero: 9,
    titolo: "Le figure di Bachata che la fanno restare",
    descrizione: "Le figure mirate per creare intesa, mostrate e spiegate una per una.",
    videoUrl: AREA_RISERVATA_URL,
    collegati: ["cap14", "cap16"],
  },
];
