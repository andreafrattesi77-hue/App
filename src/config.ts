/**
 * Configurazione principale di "Effetto Calamita – L'app"
 * Modifica qui codici di accesso, link ufficiali e parametri operativi.
 */

// Codici di accesso validi per l'App principale
export const ACCESS_CODES: string[] = ['CALAMITA2026', 'CALAMITA', 'FILOINVISIBILE', 'ANDREA2026'];

// Link esterni ufficiali
export const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/aFadR84YobTbdYa6bkdwc0b';
export const VIDEOCORSO_URL = 'https://www.andreafrattesi.com/landing';
export const AREA_RISERVATA_URL = 'https://www.andreafrattesi.com/it/login';
export const LANDING_URL = 'https://www.andreafrattesi.com/landingeffettocalamita';
export const INSTAGRAM_URL = 'https://www.instagram.com/andreaseduzioneballo';
export const SUPPORT_EMAIL = 'info@andreafrattesi.com';

// Limiti operativi per il Coach AI Gemini
export const COACH_DAILY_LIMIT = 20;
export const COACH_HISTORY_MESSAGES = 10;

// Firma ufficiale di Andrea Frattesi
export const OFFICIAL_SIGNATURE =
  'Faccio quello che insegno. Insegno quello che faccio. – Andrea Frattesi';

// Frasi per il Reset di Emergenza
export const RESET_EMERGENCY_QUOTES = [
  "Un no è un'informazione, non una sentenza.",
  'Non è personale, non è permanente, non è pervasivo.',
  "Torna all'Asse: piedi, colonna, respiro, sguardo.",
  'Il prossimo invito è entro la prossima canzone.',
  'Mi piace lei? Voglio scoprirlo.',
];

// Tipologie di profilo dal Test
export type ProfileType = 'tecnico' | 'congelato' | 'bravo_ragazzo' | 'collezionista';

export interface ProfileDetails {
  id: ProfileType;
  name: string;
  tagline: string;
  description: string;
  focus: string;
  recommendedUnits: string[]; // id capitoli consigliati
  actions: string[];
}

export const PROFILES: Record<ProfileType, ProfileDetails> = {
  tecnico: {
    id: 'tecnico',
    name: 'Il Tecnico',
    tagline: 'Balla benissimo, conosce decine di figure, ma resta invisibile come uomo.',
    description:
      'In pista sei preciso, esegui combinazioni complesse e non perdi mai il tempo. Tuttavia, tutta la tua attenzione è sulle braccia, sui passi e sul prossimo giro. La donna segue il ballerino, ma non sente l\'uomo: finita la musica, ringrazia con un sorriso formale e torna dalle amiche.',
    focus: 'Meno figure, più presenza, Contatto Zero e Sguardo Ancora.',
    recommendedUnits: ['cap11', 'cap12', 'cap13'],
    actions: [
      'Riduci le figure: fai al massimo tre figure strategiche a canzone e riempi lo spazio con la presenza.',
      'Contatto Zero rigoroso: aspetta due secondi prima di partire con il primo passo, guardandola negli occhi.',
      'Usa la Tensione Lenta: rallenta una preparazione e ascolta il respiro di lei anziché pensare al giro successivo.',
    ],
  },
  congelato: {
    id: 'congelato',
    name: 'Il Congelato',
    tagline: 'Vede la donna che gli piace, conta fino a tre e resta fermo.',
    description:
      'Vedi quella donna con cui vorresti ballare. Inizi a pensare a cosa dirle, aspetti la canzone "giusta", calcoli se è libera, ti chiedi se ti dirà di no. Passano i minuti, qualcun altro la invita o lei si siede. La tua serata diventa un accumulo di occasioni mancate e frustrazione silenziosa.',
    focus: 'Asse, regola dei 3 secondi, rituale pre-serata, rifiuto riscritto.',
    recommendedUnits: ['cap06', 'cap07', 'cap08'],
    actions: [
      'Applica la Regola dei 3 Secondi: appena la vedi, muovi i piedi verso di lei prima che la mente inizi a negoziare.',
      'Protocollo Respira, Asse, Passo: un respiro profondo, colonna eretta, un passo deciso in avanti.',
      'Riscrivi il rifiuto: se dice di no, hai vinto un punto di coraggio e puoi applicare i 10 secondi eleganti.',
    ],
  },
  bravo_ragazzo: {
    id: 'bravo_ragazzo',
    name: 'Il Bravo Ragazzo',
    tagline: 'Gentile con tutte, ma nessuna lo cerca dopo il ballo.',
    description:
      'Sei super rispettoso, attento a non metterla a disagio, chiedi scusa al minimo errore e fai di tutto per compiacere chi hai davanti. Il problema è che cerchi costantemente la sua approvazione. La gentilezza senza polarità crea affetto fraterno, ma non tensione magnetica.',
    focus: 'Sicurezza interiore, smettere di cercare approvazione, Chiusura Calamita.',
    recommendedUnits: ['cap05', 'cap06', 'cap16'],
    actions: [
      'Sostituisci "Le piacerò?" con la domanda chiave: "Mi piace lei? Voglio scoprirlo."',
      'Smetti di scusarti se un passo non viene perfetto: un sorriso tranquillo vale più di mille giustificazioni.',
      'Esegui la Chiusura Calamita: resta nei suoi occhi per gli ultimi 10 secondi con presenza ferma e apprezza con autenticità.',
    ],
  },
  collezionista: {
    id: 'collezionista',
    name: 'Il Collezionista',
    tagline: 'Raccoglie numeri e contatti che non portano mai a un incontro.',
    description:
      'Non hai paura di invitare o chiedere il contatto Instagram o WhatsApp. Alla fine hai la rubrica piena di numeri, ma quando scrivi il giorno dopo i messaggi muoiono, le risposte sono fredde o sparisce nel nulla. Chiedi il numero prima che sia nato il vero Filo Invisibile.',
    focus: 'Connessione prima del numero, Radar dei Segnali, dal numero all\'aperitivo.',
    recommendedUnits: ['cap04', 'bonus4', 'bonus3'],
    actions: [
      'Zero contatti chiesti se non c\'è stata almeno una doppia canzone consecutiva o un momento di intesa forte.',
      'Usa il Radar dei Segnali: osserva lo sguardo di ritorno e la vicinanza fisica reale prima di fare qualsiasi proposta.',
      'Se proponi il contatto, collegalo subito a un pretesto naturale e concreto, mai al banale "così ci sentiamo".',
    ],
  },
};

// Domande del Quiz
export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    profile: ProfileType;
    text: string;
  }[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Cosa fai normalmente appena finisce una canzone in pista?',
    options: [
      { profile: 'bravo_ragazzo', text: 'Dico subito "grazie mille, scusa per gli errori!" con un sorriso timido.' },
      { profile: 'tecnico', text: 'Penso subito se ho fatto bene le figure complesse e sciolgo la presa velocemente.' },
      { profile: 'congelato', text: 'Accenno un mezzo inchino, mi scuso e mi allontano rapidamente a bordo pista.' },
      { profile: 'collezionista', text: 'Chiedo subito il nome e se posso cercarla su Instagram prima che vada via.' },
    ],
  },
  {
    id: 2,
    question: 'Cosa ti passa per la testa appena vedi una donna che ti piace davvero in sala?',
    options: [
      { profile: 'congelato', text: '"Aspetto la canzone giusta, forse adesso è occupata, e se mi dice di no davanti a tutti?"' },
      { profile: 'bravo_ragazzo', text: '"Spero di non disturbarla... chissà se ha voglia di ballare con uno come me."' },
      { profile: 'tecnico', text: '"Devo farle vedere quanto so guidare bene la salsa così capirà che sono bravo."' },
      { profile: 'collezionista', text: '"Punto al bersaglio: la invito, poi a fine canzone provo a strappare il contatto."' },
    ],
  },
  {
    id: 3,
    question: 'Come reagisci interiormente quando una donna ti dice: "No grazie, riposo"?',
    options: [
      { profile: 'congelato', text: 'Mi sento umiliato, resto bloccato per mezz\'ora e non invito più nessuno.' },
      { profile: 'bravo_ragazzo', text: 'Mi sento in colpa per averla disturbata e le chiedo mille volte scusa.' },
      { profile: 'tecnico', text: 'Mi dico che forse non capisce la tecnica del ballo e vado a cercare una ballerina avanzata.' },
      { profile: 'collezionista', text: 'Passo subito alla ragazza successiva senza elaborare nulla, come una lotteria di numeri.' },
    ],
  },
  {
    id: 4,
    question: 'Durante il ballo, qual è la tua principale preoccupazione?',
    options: [
      { profile: 'tecnico', text: 'Non sbagliare i tempi delle combinazioni e variare le figure senza ripetermi.' },
      { profile: 'bravo_ragazzo', text: 'Che lei sia comoda e che non pensi che io stia esagerando o approfittando.' },
      { profile: 'congelato', text: 'Cercare di non fare figuracce e sperare che la canzone finisca senza intoppi.' },
      { profile: 'collezionista', text: 'Trovare il momento per farle qualche battuta brillante per impressionarla.' },
    ],
  },
  {
    id: 5,
    question: 'Come gestisci lo sguardo durante una bachata o una salsa romantica?',
    options: [
      { profile: 'congelato', text: 'Guardo a terra o sopra la sua testa, ho paura di sembrare troppo insistente.' },
      { profile: 'tecnico', text: 'Guardo le sue mani o lo spazio libero intorno per controllare la traiettoria dei giri.' },
      { profile: 'bravo_ragazzo', text: 'La guardo negli occhi, ma appena lei sostiene lo sguardo distolgo per rispetto.' },
      { profile: 'collezionista', text: 'Fisso intensamente sperando di apparire seducente, a volte esagerando.' },
    ],
  },
  {
    id: 6,
    question: 'Cosa succede solitamente al contatto iniziale della mano (primo secondo)?',
    options: [
      { profile: 'tecnico', text: 'Afferro subito le dita con decisione e inizio immediatamente con il passo base.' },
      { profile: 'bravo_ragazzo', text: 'Prendo la mano in modo timidissimo, quasi scivolando via per non stringere.' },
      { profile: 'congelato', text: 'Ho le mani fredde o sudate dall\'ansia e vorrei solo che partisse la musica.' },
      { profile: 'collezionista', text: 'Stringo sicuro per trasmettere mascolinità e trascino subito a centro pista.' },
    ],
  },
  {
    id: 7,
    question: 'Qual è il tuo bilancio tipico di una serata latina?',
    options: [
      { profile: 'congelato', text: 'Ho ballato con 1 o 2 conoscenti e passato il resto del tempo a guardare gli altri.' },
      { profile: 'bravo_ragazzo', text: 'Ho fatto ballare tante donne ma nessuna mi ha degnato di uno sguardo dopo.' },
      { profile: 'tecnico', text: 'Grande sudata, ottime figure eseguite, ma torno a casa vuoto e solo.' },
      { profile: 'collezionista', text: 'Ho ottenuto 2 contatti social, ma domani scoprirò che non rispondono ai messaggi.' },
    ],
  },
  {
    id: 8,
    question: 'In Bachata sensual o moderna, come ti relazioni con la vicinanza del corpo?',
    options: [
      { profile: 'bravo_ragazzo', text: 'Mantengo sempre una distanza di sicurezza siderale per paura di sembrare invadente.' },
      { profile: 'congelato', text: 'Divento rigido come un tronco di legno e mi sento in imbarazzo se lei si avvicina.' },
      { profile: 'tecnico', text: 'Applico le guide d\'anca e d\'onda in modo accademico, senza ascoltare il suo assenso.' },
      { profile: 'collezionista', text: 'Cerco subito la chiusura stretta sperando che scatti l\'attrazione fisica.' },
    ],
  },
  {
    id: 9,
    question: 'Quando una donna balla bene e sorride con te, cosa pensi?',
    options: [
      { profile: 'bravo_ragazzo', text: '"Che carina ed educata, è gentile con tutti."' },
      { profile: 'tecnico', text: '"Ha apprezzato la fluidità dei miei passaggi di livello avanzato."' },
      { profile: 'congelato', text: '"Speriamo di non fare cavolate adesso, rilassati prima che se ne accorga."' },
      { profile: 'collezionista', text: '"Perfetto, questa ci sta, a fine canzone le chiedo il numero."' },
    ],
  },
  {
    id: 10,
    question: 'Se dovessi riassumere il tuo più grande desiderio nel ballo oggi:',
    options: [
      { profile: 'congelato', text: 'Sbloccare la mia sicurezza, superare l\'ansia dell\'invito ed essere spontaneo.' },
      { profile: 'tecnico', text: 'Imparare a trasformare la mia abilità tecnica in autentica attrazione maschile.' },
      { profile: 'bravo_ragazzo', text: 'Far sentire la mia presenza d\'uomo senza paura e creare una vera attrazione magnetica.' },
      { profile: 'collezionista', text: 'Creare una vera connessione che porti ad appuntamenti reali, non solo follower fantasma.' },
    ],
  },
];

// Piano 21 Serate con unità collegate da rileggere
export interface MissionItem {
  id: number;
  phase: 1 | 2 | 3;
  phaseName: string;
  title: string;
  description: string;
  readingUnitId: string; // capitolo/bonus collegato da rileggere
}

export const MISSIONS_21: MissionItem[] = [
  // FASE 1 – PRESENZA
  {
    id: 1,
    phase: 1,
    phaseName: 'FASE 1 – PRESENZA',
    title: 'Il rituale e il primo ballo',
    description: 'Fare il Rituale Pre-Serata completo e ballare la prima canzone entro dieci minuti dall\'arrivo.',
    readingUnitId: 'bonus2',
  },
  {
    id: 2,
    phase: 1,
    phaseName: 'FASE 1 – PRESENZA',
    title: "L'Asse",
    description: 'Fare il controllo dell\'Asse prima di ogni invito, con la domanda "Mi piace lei? Voglio scoprirlo."',
    readingUnitId: 'cap06',
  },
  {
    id: 3,
    phase: 1,
    phaseName: 'FASE 1 – PRESENZA',
    title: 'I tre secondi',
    description: 'Applicare la regola dei tre secondi con le intenzioni "se… allora" e il protocollo Respira, Asse, Passo.',
    readingUnitId: 'cap07',
  },
  {
    id: 4,
    phase: 1,
    phaseName: 'FASE 1 – PRESENZA',
    title: 'La caccia ai no',
    description: 'Un punto per ogni invito, due per ogni no gestito con i dieci secondi eleganti, tre per ogni no seguito da un altro invito entro la canzone successiva.',
    readingUnitId: 'cap08',
  },
  {
    id: 5,
    phase: 1,
    phaseName: 'FASE 1 – PRESENZA',
    title: 'Il Contatto Zero',
    description: 'In ogni ballo mani asciutte, presa senza pollice, pressione leggera, pausa di due secondi prima di partire, sguardo e sorriso.',
    readingUnitId: 'cap11',
  },
  {
    id: 6,
    phase: 1,
    phaseName: 'FASE 1 – PRESENZA',
    title: 'Il solo passo base',
    description: 'Almeno tre balli con passo base e varianti semplicissime, tutta l\'attenzione sulla connessione.',
    readingUnitId: 'cap11',
  },
  {
    id: 7,
    phase: 1,
    phaseName: 'FASE 1 – PRESENZA',
    title: 'Farsi vedere',
    description: 'Salutare tutti quelli che conosci, compreso il personale del locale, e presentarti a persone nuove.',
    readingUnitId: 'cap09',
  },

  // FASE 2 – CONNESSIONE
  {
    id: 8,
    phase: 2,
    phaseName: 'FASE 2 – CONNESSIONE',
    title: 'Lo Sguardo Ancora',
    description: 'Usarlo nei quattro momenti chiave (inizio, dopo ogni giro, un momento speciale della musica, fine).',
    readingUnitId: 'cap12',
  },
  {
    id: 9,
    phase: 2,
    phaseName: 'FASE 2 – CONNESSIONE',
    title: 'Il ritorno',
    description: 'Concentrarti sul ritorno dello sguardo dopo ogni giro, in tutti i balli.',
    readingUnitId: 'cap12',
  },
  {
    id: 10,
    phase: 2,
    phaseName: 'FASE 2 – CONNESSIONE',
    title: 'Cinque figure e la Tensione Lenta',
    description: 'Solo le tue cinque figure strategiche più il passo base, con almeno due momenti di Tensione Lenta per ballo.',
    readingUnitId: 'cap13',
  },
  {
    id: 11,
    phase: 2,
    phaseName: 'FASE 2 – CONNESSIONE',
    title: 'Il silenzio pieno',
    description: 'Due balli in silenzio pieno e tre balli con al massimo tre frasi brevi.',
    readingUnitId: 'cap15',
  },
  {
    id: 12,
    phase: 2,
    phaseName: 'FASE 2 – CONNESSIONE',
    title: 'La scala della distanza',
    description: 'In Bachata partire dal livello aperto, offrire più vicinanza solo dopo segnali positivi, tornare spesso a una distanza più ampia. (Se non balli Bachata: tre balli costruiti come una piccola storia in tre atti.)',
    readingUnitId: 'cap14',
  },
  {
    id: 13,
    phase: 2,
    phaseName: 'FASE 2 – CONNESSIONE',
    title: 'La Chiusura Calamita',
    description: 'Cinque chiusure di fila, finendo con la musica e con la frase apprezzamento + apertura.',
    readingUnitId: 'cap16',
  },
  {
    id: 14,
    phase: 2,
    phaseName: 'FASE 2 – CONNESSIONE',
    title: 'Il ballo completo',
    description: 'Almeno tre balli con rituale, invito, Contatto Zero, Sguardo Ancora, poche figure, Tensione Lenta e Chiusura Calamita.',
    readingUnitId: 'cap04',
  },

  // FASE 3 – CONTINUITÀ
  {
    id: 15,
    phase: 3,
    phaseName: 'FASE 3 – CONTINUITÀ',
    title: 'Tirare il filo',
    description: 'Almeno tre conversazioni dopo il ballo, prendendo un dettaglio dalla sua risposta e chiedendo di saperne di più.',
    readingUnitId: 'bonus1',
  },
  {
    id: 16,
    phase: 3,
    phaseName: 'FASE 3 – CONTINUITÀ',
    title: 'Oltre il ballo',
    description: 'Portare ogni conversazione su un argomento diverso dal ballo e chiudere tu sul momento bello.',
    readingUnitId: 'bonus1',
  },
  {
    id: 17,
    phase: 3,
    phaseName: 'FASE 3 – CONTINUITÀ',
    title: 'Il Radar',
    description: 'Dopo ogni ballo con una donna nuova fai una previsione (interesse, cortesia o solo un ballo) e verificala con lo sguardo di ritorno.',
    readingUnitId: 'bonus4',
  },
  {
    id: 18,
    phase: 3,
    phaseName: 'FASE 3 – CONTINUITÀ',
    title: 'Diventare un ponte',
    description: 'Presentare tra loro persone che non si conoscono e accogliere chi è appena arrivato.',
    readingUnitId: 'cap09',
  },
  {
    id: 19,
    phase: 3,
    phaseName: 'FASE 3 – CONTINUITÀ',
    title: 'Il numero',
    description: 'Solo se nasce una connessione reale, proporre lo scambio di contatti in modo diretto o con un pretesto naturale.',
    readingUnitId: 'bonus3',
  },
  {
    id: 20,
    phase: 3,
    phaseName: 'FASE 3 – CONTINUITÀ',
    title: 'Il ponte',
    description: 'Se hai una chat attiva, proporre un incontro concreto rendendo facile anche la risposta.',
    readingUnitId: 'bonus3',
  },
  {
    id: 21,
    phase: 3,
    phaseName: 'FASE 3 – CONTINUITÀ',
    title: "L'uomo magnetico",
    description: 'Nessuna missione. Sii l\'uomo che hai costruito in queste venti serate: centrato, presente, curioso, rispettoso.',
    readingUnitId: 'next',
  },
];
