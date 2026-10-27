import type { ModuloVideo } from "./types";

// Elenco dei 9 moduli ufficiali del videocorso pratico "Effetto Calamita".
// I video possono essere caricati come file MP4/WebM nella cartella public/videos/ oppure collegati
// tramite link YouTube (non in elenco), Vimeo, Google Drive o URL video diretto.
export const VIDEOCORSO: ModuloVideo[] = [
  {
    numero: 1,
    titolo: "Parti con il piede giusto",
    descrizione: "Come è costruito il corso e come usarlo insieme all'ebook per vedere risultati già dalle prime serate.",
    evidenza: "Il video introduttivo pratico per iniziare il percorso.",
    videoUrl: "/assets/aistudio/Intro_Videocorso-1_cd289a2f.mp4",
    collegati: ["intro"],
    lezioni: [
      { numero: 1, titolo: "Benvenuto e introduzione al metodo", durata: "03:45" },
      { numero: 2, titolo: "Come integrare video ed ebook", durata: "04:12" },
    ],
  },
  {
    numero: 2,
    titolo: "Entra in pista con la testa giusta",
    descrizione: "Il modo di pensare che cambia come ti muovi, come guidi e come lei ti percepisce fin dal primo secondo.",
    evidenza: "La sicurezza interiore precede sempre il movimento del corpo.",
    videoUrl: "/videos/modulo2.mp4",
    collegati: ["cap06", "cap07"],
    lezioni: [
      { numero: 1, titolo: "Decostruzione dell'ansia da prestazione", durata: "06:10" },
      { numero: 2, titolo: "Presenza, respiro e postura d'asse", durata: "05:30" },
    ],
  },
  {
    numero: 3,
    titolo: "Ascolta la musica come la sente lei",
    descrizione: "Perché la musica decide il ballo e come usarla per creare emozione, invece di contare meccanicamente i passi.",
    evidenza: "Non contare i numeri ad alta voce: senti la clave e l'accento emotivo.",
    videoUrl: "/videos/modulo3.mp4",
    collegati: ["cap13"],
    lezioni: [
      { numero: 1, titolo: "Riconoscere i cambi di energia nel brano", durata: "07:20" },
      { numero: 2, titolo: "Interpretazione musicale e pause magnetiche", durata: "06:45" },
    ],
  },
  {
    numero: 4,
    titolo: "Rifai le basi della Salsa nel modo giusto",
    descrizione: "Passo base, guida e postura rivisti con un obiettivo nuovo: connettere, non eseguire figure in serie.",
    evidenza: "La mano che guida non spinge: invita e accoglie.",
    videoUrl: "/videos/modulo4.mp4",
    collegati: ["cap11", "cap13"],
    lezioni: [
      { numero: 1, titolo: "Il passo base senza tensioni", durata: "08:15" },
      { numero: 2, titolo: "Connessione della mano e del centro", durata: "06:50" },
    ],
  },
  {
    numero: 5,
    titolo: "Usa la Salsa per farla sentire al sicuro",
    descrizione: "Come guidare perché lei si fidi di te già dalle prime battute e si lasci condurre senza timori.",
    evidenza: "Una donna che si sente al sicuro chiude gli occhi e si abbandona al ballo.",
    videoUrl: "/videos/modulo5.mp4",
    collegati: ["cap11"],
    lezioni: [
      { numero: 1, titolo: "Chiarezza del segnale e morbidezza", durata: "07:35" },
      { numero: 2, titolo: "Protezione dello spazio in pista affollata", durata: "05:40" },
    ],
  },
  {
    numero: 6,
    titolo: "Le figure di Salsa che contano davvero",
    descrizione: "Poche figure scelte per creare vera connessione, spiegate ed eseguite passo per passo.",
    evidenza: "Non conta quante figure fai, conta l'intensità di ciò che provate in due.",
    videoUrl: "/videos/modulo6.mp4",
    collegati: ["cap13"],
    lezioni: [
      { numero: 1, titolo: "Cross Body Lead con sguardo ancorato", durata: "09:10" },
      { numero: 2, titolo: "Giro donna con transizione magnetica", durata: "08:25" },
    ],
  },
  {
    numero: 7,
    titolo: "Le basi della Bachata, senza errori",
    descrizione: "Strette, sguardi, vicinanza. Il tutto durante il ballo, sempre con rispetto e naturale eleganza.",
    evidenza: "La vicinanza non si impone, si crea creando lo spazio perché sia lei a volerla.",
    videoUrl: "/videos/modulo7.mp4",
    collegati: ["cap14"],
    lezioni: [
      { numero: 1, titolo: "Postura e passo base della Bachata autentica", durata: "06:40" },
      { numero: 2, titolo: "La corretta presa della mano e del fianco", durata: "07:15" },
    ],
  },
  {
    numero: 8,
    titolo: "Fai della Bachata un'esperienza che ricorda",
    descrizione: "Come usare vicinanza, ritmo e pause per tendere il Filo Invisibile e lasciare un ricordo indelebile.",
    evidenza: "Il flirt invisibile vive nei millimetri e nelle pause tra un battito e l'altro.",
    videoUrl: "/videos/modulo8.mp4",
    collegati: ["cap14", "cap04"],
    lezioni: [
      { numero: 1, titolo: "Vicinanza progressiva senza forzature", durata: "08:30" },
      { numero: 2, titolo: "I respiri sincronizzati sui tempi lenti", durata: "06:20" },
    ],
  },
  {
    numero: 9,
    titolo: "Le figure di Bachata che la fanno restare",
    descrizione: "Le figure mirate per creare intesa ed empatia emotiva, mostrate e spiegate una per una.",
    evidenza: "La chiusura perfetta: lasciarla con il desiderio di ballare ancora con te.",
    videoUrl: "/videos/modulo9.mp4",
    collegati: ["cap14", "cap16"],
    lezioni: [
      { numero: 1, titolo: "Onde e isolazioni guidate con delicatezza", durata: "09:40" },
      { numero: 2, titolo: "Finale magnetico e distacco elegante", durata: "06:55" },
    ],
  },
];
