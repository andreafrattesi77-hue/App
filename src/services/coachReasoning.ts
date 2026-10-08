import { trovaUnitaPertinenti, getUnita, Unita } from '../../content/index';

export interface CoachQuestionItem {
  id: string;
  category: 'approccio' | 'bachata' | 'salsa' | 'chiusura' | 'psicologia';
  categoryLabel: string;
  question: string;
  summary: string;
}

export const OFFICIAL_COACH_QUESTIONS: CoachQuestionItem[] = [
  // CATEGORIA 1: APPROCCIO & INVITO (5)
  {
    id: 'q_blocco_invito',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: "Mi blocco prima dell'invito e rimango a fissarla da lontano: come sblocco la paura?",
    summary: 'Sbloccare la paura prima dell\'invito',
  },
  {
    id: 'q_regola_3_secondi',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Come applico esattamente la Regola dei 3 Secondi dal momento in cui incrocio il suo sguardo?',
    summary: 'La Regola dei 3 Secondi per invitare',
  },
  {
    id: 'q_primi_10_minuti',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Cosa devo fare nei primi 10 minuti dal mio arrivo al locale per entrare nel giusto Asse?',
    summary: 'I primi 10 minuti all\'arrivo nel locale',
  },
  {
    id: 'q_sguardo_ancora',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Come uso lo Sguardo Ancora e il sorriso a distanza prima di avvicinarmi a lei?',
    summary: 'Sguardo Ancora che non scappa e non invade',
  },
  {
    id: 'q_gestione_rifiuto',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Se mi dice di no o che è stanca, come gestisco il rifiuto con eleganza senza sembrare ferito?',
    summary: 'Gestire il no con i 10 secondi eleganti',
  },

  // CATEGORIA 2: BACHATA & CONNESSIONE (4)
  {
    id: 'q_bachata_vicinanza',
    category: 'bachata',
    categoryLabel: 'Bachata & Connessione',
    question: 'Bachata Sensual: come gestisco la vicinanza fisica senza sembrare invadente o al contrario freddo?',
    summary: 'Vicinanza offerta e non imposta',
  },
  {
    id: 'q_tensione_lenta',
    category: 'bachata',
    categoryLabel: 'Bachata & Connessione',
    question: "Cos'è la Tensione Lenta nella Bachata e come faccio a far rilassare la partner nel mio abbraccio?",
    summary: 'Tensione Lenta e rilassamento corporeo',
  },
  {
    id: 'q_bachata_tap',
    category: 'bachata',
    categoryLabel: 'Bachata & Connessione',
    question: 'Come guido il movimento d\'anca e il Tap sui tempi 4 e 8 senza tirare con le braccia?',
    summary: 'Guida del Tap 4 e 8 col corpo',
  },
  {
    id: 'q_lettura_segnali_bachata',
    category: 'bachata',
    categoryLabel: 'Bachata & Connessione',
    question: 'Come faccio a capire se lei gradisce la vicinanza o se preferisce mantenere spazio?',
    summary: 'Leggere i segnali di comfort corporeo',
  },

  // CATEGORIA 3: SALSA & MUSICALITÀ (4)
  {
    id: 'q_salsa_figure_vs_connessione',
    category: 'salsa',
    categoryLabel: 'Salsa & Musicalità',
    question: 'Nella Salsa mi concentro troppo sulle figure e dimentico la partner: come cambio focus?',
    summary: 'Dal Primo Ballo tecnico al Secondo Ballo emotivo',
  },
  {
    id: 'q_guida_corpo_braccia',
    category: 'salsa',
    categoryLabel: 'Salsa & Musicalità',
    question: 'Come elimino la rigidità nelle braccia e guido con il centro del corpo e la schiena?',
    summary: 'Guidare dal tronco e non con le mani',
  },
  {
    id: 'q_salsa_tempo_1',
    category: 'salsa',
    categoryLabel: 'Salsa & Musicalità',
    question: 'Come riconosco il tempo 1 nel montuno del pianoforte e nella clave senza contare come un robot?',
    summary: 'Sentire il tempo 1 e il respiro del basso',
  },
  {
    id: 'q_partner_balla_sola',
    category: 'salsa',
    categoryLabel: 'Salsa & Musicalità',
    question: "Cosa fare se la partner 'balla da sola' o oppone resistenza alla guida?",
    summary: 'Guidare non è comandare: gestione partner rigida',
  },

  // CATEGORIA 4: FINE BALLO & CHIUSURA (4)
  {
    id: 'q_ultimi_10_secondi',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Cosa devo fare negli ultimi 10 secondi del brano per non farla scappare via appena finisce la musica?',
    summary: 'Gli ultimi 10 secondi e la Regola del Picco',
  },
  {
    id: 'q_chiusura_calamita',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Come eseguo la Chiusura Calamita trattenendo il contatto per 2 secondi senza sembrare appiccicoso?',
    summary: 'Trattenere la mano per 2 secondi con calma',
  },
  {
    id: 'q_cosa_dire_dopo',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: "Cosa le dico appena finisce la musica per rompere il classico congedo 'Grazie, balli benissimo'?",
    summary: 'Formula Apprezzamento + Domanda Ponte',
  },
  {
    id: 'q_staccarsi_per_primi',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Come faccio a staccarmi io per primo lasciandole il desiderio di rivedermi più tardi?',
    summary: 'Staccarsi per primi per creare attrazione',
  },

  // CATEGORIA 5: PSICOLOGIA, ASSE & FLIRT (3)
  {
    id: 'q_conversazione_flirt',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Cosa dire tra un ballo e l\'altro? Come trasformo le solite chiacchiere in una conversazione magnetica?',
    summary: 'Silenzio Pieno e Conversazione Ping-Pong',
  },
  {
    id: 'q_ballerini_esperti',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Come supero la sensazione di sentirmi goffo o inferiore rispetto ai ballerini più esperti della sala?',
    summary: 'Smettere di paragonarsi ai ballerini della sala',
  },
  {
    id: 'q_reset_serata_storta',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Cosa fare quando una serata sembra andare tutta storta per resettare la mente in 60 secondi?',
    summary: 'Il Protocollo Reset di 60 secondi al bagno',
  },
];

interface CoachReasoningParams {
  message: string;
  userName?: string;
  userProfile?: string;
  currentMission?: string;
  activeUnitId?: string;
  history?: Array<{ sender: 'user' | 'coach'; text: string }>;
}

interface EveningReasoningParams {
  evening: {
    venue?: string;
    rating?: number;
    invitesCount?: number;
    elegantNoCount?: number;
    calamitaClosuresCount?: number;
    missionCompleted?: boolean;
    whatWorked?: string;
    whatToImprove?: string;
  };
  userName?: string;
  userProfile?: string;
  currentMission?: string;
  previousAdvice?: string;
}

/**
 * Motore di Ragionamento Psicologico & Strategico di Andrea Frattesi.
 * Risponde con profondità, diagnosi psicologica, metodo Effetto Calamita e azione pratica.
 */
export function generateCoachReasoning(params: CoachReasoningParams): string {
  const { message, userName, userProfile, currentMission, activeUnitId } = params;
  const msgLower = (message || '').toLowerCase();
  const studentName = userName?.trim() || '';
  const greeting = studentName ? `Ciao ${studentName}, ` : 'Ciao, ';

  // Trova unità pertinenti
  const pertinentUnits = trovaUnitaPertinenti(message, 2);
  const primaryUnit = activeUnitId ? getUnita(activeUnitId) || pertinentUnits[0] : pertinentUnits[0];
  const unitRef = primaryUnit ? `[[${primaryUnit.id}]]` : '[[cap06]]';

  // 1. BLOCCO PRIMA DELL'INVITO
  if (msgLower.includes('blocco') || msgLower.includes('fissarla') || msgLower.includes('paura') || msgLower.includes('ansia')) {
    return `${greeting}andiamo subito al cuore del blocco prima dell'invito con un ragionamento lucido.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Quando vedi una donna che ti attrae e resti fermo a fissarla, nella tua testa scatta il "copione dell'esame": ti chiedi *"Le piacerò? Mi dirà di sì? Cosa penserà la gente se mi rifiuta?"*. Questo dialogo interno dura più di tre secondi, il cortisolo sale e il corpo si congela. Dal bordo pista lei non vede un uomo che vuole condividere un ballo: percepisce uno sguardo pesante, teso e carico di aspettativa.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita la regola d'oro è invertire la domanda: non devi più chiederti *"Le piacerò?"*, ma ***"Mi piace lei? Voglio scoprirlo ballando con lei."***. Questo ribalta all'istante l'energia da "candidato supplicante" a "uomo curioso e centrato". Inoltre applichiamo la **Regola dei 3 Secondi**: dal momento in cui i tuoi occhi la incrociano, hai tre secondi per avviare il primo passo. Il cervello non ha il tempo biologico di fabbricare la paura.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Respira, Asse, Passo:** Espira a fondo gonfiando la pancia, allunga la spina dorsale come se un filo ti tirasse verso l'alto (il tuo Asse), e stacca il primo passo verso di lei prima del quarto secondo.
2. **Sguardo Ancora a 2 metri:** Mentre ti avvicini, mantieni uno sguardo morbido di 2-3 secondi accompagnato da un mezzo sorriso rilassato.
3. **L'Invito Diretto:** Porgi la mano aperta all'altezza della cintura e dille semplicemente: *"Balla con me questa."* oppure *"Facciamoci questa bachata."*. Niente scuse, niente esitazioni.

Approfondisci la psicologia dell'Asse in ${unitRef} e fai il protocollo sblocco prima di entrare in sala!`;
  }

  // 2. REGOLA DEI 3 SECONDI
  if (msgLower.includes('3 secondi') || msgLower.includes('tre secondi')) {
    return `${greeting}la Regola dei 3 Secondi è la leva neuroscientifica più potente del Metodo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Il cervello umano è programmato per risparmiare energia ed evitare il rischio sociale. Quando vedi una donna che ti piace, hai una finestra temporale biologica di circa tre secondi prima che l'amigdala prenda il sopravvento e cominci a formulare scuse ("aspetta la prossima canzone", "ha la faccia stanca", "sta parlando con l'amica"). Se aspetti 4 secondi, hai già perso.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La Regola dei 3 Secondi non serve a farti sembrare un robot impulsivo: serve a bypassare l'esitazione. Un uomo che esita prima di invitare comunica insicurezza nel corpo ancora prima di aprire bocca. Un uomo che si muove entro 3 secondi comunica decisione, presenza maschile e naturalezza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Punto Visivo:** Incrocia il suo sguardo. Conta mentalmente: 1...
2. **Primo Passo Fisico:** Al tempo 2 muovi il piede destro in avanti verso di lei. Il movimento fisico interrompe il circuito della paura nel cervello.
3. **Arrivo Rilassato:** Al tempo 3 sei davanti a lei con le spalle aperte e la mano offerta all'altezza della cintura.

Approfondisci la biochimica dell'invito in [[cap07]]!`;
  }

  // 3. PRIMI 10 MINUTI AL LOCALE
  if (msgLower.includes('10 minuti') || msgLower.includes('dieci minuti') || msgLower.includes('arrivo al locale')) {
    return `${greeting}i primi 10 minuti decidono il destino dell'intera serata.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Cosa fa l'uomo medio quando entra in un locale latino? Va al bar, ordina da bere, si mette con la schiena appoggiata al bancone, tira fuori lo smartphone e scruta la pista con aria circospetta. Più rimani fermo a guardare, più la pista si trasforma in un mostro invalicabile e l'ansia aumenta esponenzialmente.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La **Regola dei 10 Minuti** stabilisce che devi scendere in pista per il tuo primo ballo entro dieci minuti esatti dal varco della porta d'ingresso. Non importa con chi: invita una ballerina facile, un'amica di corso o una signora simpatica. Lo scopo non è sedurre: è "scaldare il motore" e abituare corpo e mente alla musica.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Niente Telefono:** Appena entri, metti il telefono in tasca silenzioso e lascialo lì.
2. **Postura Immediata:** Bevi mezzo bicchiere d'acqua, allunga il collo e fai una camminata rilassata lungo il perimetro della pista.
3. **Il Primo Ballo di Riscaldamento:** Entro la seconda canzone invita la prima donna disponibile senza alcuna aspettativa di risultato. Una volta rotto il ghiaccio, sarai caldo per tutta la serata.

Trovi la procedura completa nel Rituale Pre-Serata in [[bonus2]]!`;
  }

  // 4. SGUARDO ANCORA
  if (msgLower.includes('sguardo ancora') || msgLower.includes('sorriso a distanza')) {
    return `${greeting}lo Sguardo Ancora è lo strumento più raffinato del Filo Invisibile.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Guardare una donna in un locale genera spesso due disastri: l'uomo che fissa insistentemente senza mai distogliere lo sguardo (effetto predatore inquietante) oppure l'uomo che appena lei ricambia abbassa gli occhi di scatto verso le scarpe (effetto timido sottomesso). Entrambi distruggono l'attrazione prima ancora di aver detto una parola.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Lo **Sguardo Ancora** è definito come *"lo sguardo che non scappa e non invade"*.
Dura tra i 2 e i 4 secondi: incontra i suoi occhi, accenna un sorriso autentico che parte dagli angoli della bocca e dagli occhi, e poi si sposta con lentezza e disinvoltura verso la pista. Dimostra che l'hai notata, che ti piace ciò che vedi, ma che sei perfettamente a tuo agio anche senza la sua approvazione.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Triangolazione Morbida:** Quando i suoi occhi incrociano i tuoi, guarda l'occhio sinistro, poi il destro e infine accenna un sorriso sereno.
2. **Spostamento Lento:** Non scattare via con la testa: sposta lo sguardo con calma verso la musica o il barista.
3. **Il Cabeceo di Invito:** Se vedi che lei ricambia il sorriso o il suo sguardo torna una seconda volta, fai un cenno morbido con il mento verso la pista: l'invito è già fatto a metà prima di muovere un passo.

Trovi tutti i dettagli tecnici dello Sguardo Ancora in [[cap04]]!`;
  }

  // 5. GESTIONE DEL RIFIUTO (I 10 SECONDI ELEGANTI)
  if (msgLower.includes('rifiuto') || msgLower.includes('dice di no') || msgLower.includes('stanca') || msgLower.includes('palo')) {
    return `${greeting}mettiamoci a tavolino e analizziamo il rifiuto da uomo a uomo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Il motivo per cui un no fa male è che la mente maschile attiva le trappole delle "Tre P": pensi che sia *Personale* ("non le piaccio io"), *Permanente* ("andrà sempre male stasera") e *Pervasivo* ("sono un fallimento"). Nella realtà il 90% dei rifiuti è contingente: tacchi doloranti, canzone non gradita, attesa del partner di ballo abituale.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Un no è la tua occasione d'oro per costruire una **Reputazione Magnetica** in sala. Le altre donne non ti giudicano per un rifiuto: guardano attentamente **come reagisci al rifiuto**. Se mostri fastidio, scappi o abbassi le spalle, perdi punti con tutta la sala. Se invece mostri totale imperturbabilità e classe, diventi immediatamente l'uomo più interessante della serata.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **I Dieci Secondi Eleganti:** Sorridi sinceramente e dille: *"Nessun problema, riposati! Ci vediamo dopo per un'altra."*.
2. **Girati con Calma:** Ruota il busto lentamente, spalle rilassate, respiro lungo, senza abbassare la testa.
3. **Nuovo Invito Entro 60 Secondi:** Vai a invitare un'altra donna prima che termini la canzone. Questo spegne all'istante ogni loop mentale di insicurezza.

Studia il protocollo dei 10 secondi eleganti in [[cap08]]!`;
  }

  // 6. BACHATA VICINANZA (Offri non imporre)
  if (msgLower.includes('bachata') && (msgLower.includes('vicinanza') || msgLower.includes('invadente') || msgLower.includes('freddo'))) {
    return `${greeting}nella Bachata Sensual la vicinanza è il terreno più delicato di tutti.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'errore comune si divide in due estremi: l'uomo insicuro che mantiene mezzo metro di distanza rigida con le braccia tese (effetto cugino), e l'uomo frettoloso che trascina la donna al proprio petto fin dalla prima battuta (effetto invasore). In entrambi i casi la donna percepisce tensione e si irrigidisce nella schiena.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il principio fondamentale che insegno è: ***"La vicinanza si offre, non si impone."***.
Tu non devi tirare lei verso di te: devi allineare il tuo Asse, aprire il petto e proporre uno spazio sicuro. Sarà il corpo di lei a colmare la distanza nel momento in cui sente che non hai alcuna "fame" o urgenza di toccarla.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Scala della Distanza (Aperto → Medio → Vicino):** Balla il primo minuto e mezzo in posizione aperta o media per stabilire fiducia e ritmo.
2. **L'Invito Corporeo:** Porta la mano destra sulla sua scapola con una pressione leggerissima (3 su 10). Se lei rilassa il peso e si avvicina, accoglila dolcemente; se mantiene la distanza, rispetta il suo spazio con il sorriso.
3. **Non Stringere Mai:** L'abbraccio deve essere una cornice solida ma traspirante, mai una morsa.

Approfondisci la Scala della Distanza in [[cap09]]!`;
  }

  // 7. TENSIONE LENTA NELLA BACHATA
  if (msgLower.includes('tensione lenta') || msgLower.includes('rilassare la partner') || msgLower.includes('abbraccio')) {
    return `${greeting}la Tensione Lenta è l'arma segreta dell'Effetto Calamita nella Bachata.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Spesso l'uomo crede che per essere sensuale nella Bachata debba muoversi in continuazione, fare onde repentine o cambi di direzione forzati. Questo agita la partner, che resta costantemente in allerta per non inciampare, impedendole di lasciarsi andare alla musica.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La **Tensione Lenta** è l'arte di rallentare, sospendere e respirare insieme alla musica.
Quando crei una pausa morbida, trattieni il respiro per un battito e mantieni il contatto visivo, l'intensità emotiva tra voi decuplica. Le donne amano gli uomini che sanno rallentare: comunica sicurezza primordiale e totale padronanza del tempo.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Pausa sui Tempi Morti:** Durante i passaggi lenti della canzone, fermati sul posto, riduci il passo base a un leggero dondolio e respira col diaframma.
2. **Pressione Graduale:** Non muovere le braccia a scatti: ogni transizione deve fluire come se vi muoveste nell'acqua tiepida.
3. **Sguardo di Sospensione:** Durante un rallentamento, guarda i suoi occhi per 2 secondi senza muovere figure complesse. Sentirai il suo respiro sincronizzarsi al tuo.

Trovi tutti gli esercizi di Tensione Lenta in [[cap09]]!`;
  }

  // 8. BACHATA TAP SUI TEMPI 4 E 8
  if (msgLower.includes('tap') || (msgLower.includes('anca') && msgLower.includes('bachata'))) {
    return `${greeting}il Tap al tempo 4 e 8 è il punto in cui si misura la qualità della tua guida maschile.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Il disastro più comune: l'uomo che sul tempo 4 e 8 tira il braccio della donna, oppure spinge con le mani sui suoi fianchi per "costringerla" a muovere il bacino. Questo spezza l'armonia, crea fastidio e fa sembrare la guida pesante e rozza.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il Tap nella Bachata non si guida con le braccia: si guida con il **trasferimento del peso e la rotazione del busto**.
La donna muove l'anca spontaneamente quando sente che il tuo peso corporeo è arrivato completamente sul piede d'appoggio al tempo 3 (o al 7), lasciando la gamba libera di marcare il tempo 4 senza carico di peso.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Nessun Peso sul Tap:** Sul tempo 4 e 8 sfiora appena il pavimento con l'avampiede senza caricare neanche un grammo del tuo peso.
2. **Braccia Neutre:** Mantieni i gomiti rilassati e stabili. Non tirarla verso l'alto né verso il basso durante il Tap.
3. **Ascolto del Bongò:** Il colpo acuto del bongò ti avvisa quando arriva il Tap: ascoltalo con l'orecchio e lasciale lo spazio per esprimere la sua femminilità.

Esercitati con l'Allenatore di Ritmo integrato e rileggi [[cap09]]!`;
  }

  // 9. LEGGERE I SEGNALI NELLA BACHATA
  if (msgLower.includes('gradisce la vicinanza') || msgLower.includes('segnali') || msgLower.includes('spazio')) {
    return `${greeting}saper leggere i micro-segnali corporei della donna è ciò che distingue il ballerino magnetico da tutti gli altri.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Molti uomini non sanno interpretare se lei è a suo agio o se sta solo sopportando la vicinanza per educazione. Questo dubbio crea ansia e fa perdere la sicurezza nell'Asse.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il corpo femminile comunica con una precisione millimetrica attraverso il **Radar dei Segnali**:
- **Segnali Verdi (Comfort & Attrazione):** La sua mano sinistra si appoggia morbida dietro il tuo collo o sulla spalla, il suo braccio non fa barriera sul tuo petto, il suo respiro è calmo e la sua testa si inclina leggermente verso di te.
- **Segnali Gialli/Rossi (Distanza & Rispetto):** Il suo avambraccio crea un cuneo rigido tra i vostri petti, il suo sguardo cerca continuamente le amiche a bordo pista, la sua schiena è arcuata all'indietro per allontanarsi.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Test del Rilascio di 5 Centimetri:** Fai un passo indietro di pochi centimetri. Se lei naturalmente ti segue e richiude la distanza, è attratta. Se rimane indietro, mantieni la posizione aperta con totale eleganza.
2. **Zero Pressione:** Se noti un segnale rosso, allarga immediatamente la presa senza alcun risentimento: apprezzerà il tuo rispetto all'istante.

Trovi il Radar dei Segnali dettagliato in [[cap12]]!`;
  }

  // 10. SALSA FIGURE VS CONNESSIONE
  if (msgLower.includes('figure') && (msgLower.includes('salsa') || msgLower.includes('connessione') || msgLower.includes('troppe'))) {
    return `${greeting}questo è il paradosso più grande della Salsa: più figure fai, meno magnetico risulti.

🔍 **1. LA DIAGNOSI EMOTIVA:**
In sala vedi uomini che eseguono sequenze chilometriche a 190 BPM con la faccia tesa e concentrata. La donna viene centrifugata come un burattino senza un secondo di respiro. A fine ballo lei dice *"Grazie, balli benissimo"* ed è la fine: complimento alla ginnastica, zero attrazione.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Distinguiamo nettamente:
- **Il Primo Ballo (tecnico):** riguarda la tua memoria e i tuoi passi.
- **Il Secondo Ballo (il Filo Invisibile):** riguarda come la fai sentire mentre ballate.
Nessuna donna torna a casa ricordando il nome di un setenta o di una vacilala. Si ricorda se l'hai guardata negli occhi con calma, se le hai dato il tempo di esprimere il suo stile e se si è sentita protetta e guidata con dolcezza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Regola del 3x3:** Per stasera seleziona solo 3 figure che conosci alla perfezione e usa solo quelle per l'intera serata.
2. **Libera la Testa:** Con la testa sgombra dalla memoria tecnica, sposta il 100% dell'attenzione sui suoi occhi, sul suo sorriso e sul tempo musicale.
3. **Lasciala Brillare:** Nei momenti aperti dai a lei lo spazio per muovere le spalle e fare i suoi giri con calma.

Rileggi il capitolo 1 sul Ballerino Invisibile in [[cap01]]!`;
  }

  // 11. GUIDA COL CENTRO E NON CON LE BRACCIA
  if (msgLower.includes('rigidit') || msgLower.includes('centro del corpo') || msgLower.includes('braccia') || msgLower.includes('schiena')) {
    return `${greeting}eliminare la forza nelle braccia è il salto di qualità definitivo di ogni leader in pista.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'uomo che guida con le braccia rigide lo fa per insicurezza: ha paura che lei non capisca il comando, quindi "spinge" e "tira" con i bicipiti. Il risultato è che lei sente una morsa meccanica dolorosa (braccio morsa) o al contrario braccia flosce senza intenzione (braccio spaghetto).

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita la regola aurea è: ***"Le braccia sono solo cavi di trasmissione: il motore è il tuo centro."***.
La guida parte dai piedi, passa attraverso l'Asse vertebrale e si trasmette con la rotazione del busto. Le tue mani devono mantenere una pressione costante e vellutata di **3 su 10**.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Gomiti Davanti al Busto:** Mantieni i gomiti sempre davanti alla linea delle tue costole, mai tirati indietro dietro la schiena.
2. **Guida con il Peso:** Prima di guidare una dama in un giro, fai un passo solido sul tuo Asse e ruota la spalla sinistra: vedrai che lei girerà senza che tu debba fare forza con le dita.
3. **Respiro Basso:** Quando senti che le braccia si irrigidiscono, espira profondamente e abbassa le spalle.

Studia il capitolo sul Contatto Zero in [[cap03]]!`;
  }

  // 12. RICONOSCERE IL TEMPO 1 NELLA SALSA
  if (msgLower.includes('tempo 1') || msgLower.includes('montuno') || msgLower.includes('clave') || msgLower.includes('robot')) {
    return `${greeting}trovare il tempo 1 nella Salsa senza sembrare un robot è una questione di orecchio, non di matematica.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Chi conta ossessivamente 1-2-3... 5-6-7 nella testa ha lo sguardo spento e il corpo rigido. Il conteggio mentale ruba tutta la tua presenza, impedendoti di ascoltare le sfumature della partner.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La Salsa non è un metronomo da calcolare: è una band che respira.
Il **Tempo 1** è annunciato dal basso (Tumbao) e dall'accordo d'apertura del pianoforte (Montuno). Il tempo 4 e l'8 sono le sospensioni naturali in cui la musica prende aria per rilanciare sul tempo forte. Quando impari a sentire il respiro del basso anziché contare i numeri, il tuo corpo si muoverà prima ancora che la mente lo comandi.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Ascolta prima di Invitare:** Quando parte un brano di Salsa, non precipitarti in pista all'istante: resta fermo 10 secondi sul posto ad ascoltare dove entra la campana e il basso.
2. **Il Passo Sinistro sul Battere:** Quando senti l'accordo pieno del pianoforte, quello è l'1: affonda il passo sinistro in avanti con calma e decisione.
3. **Allenamento Dedicato:** Usa la sezione Musica dell'app con i brani a BPM comodi (148-152) per automatizzare l'orecchio.

Approfondisci la musicalità pratica in [[bonus3]]!`;
  }

  // 13. PARTNER CHE BALLA DA SOLA
  if (msgLower.includes('balla da sola') || msgLower.includes('resistenza') || msgLower.includes('non segue')) {
    return `${greeting}trovarsi con una partner che sembra ballare da sola o oppone resistenza è un classico test di leadership.

🔍 **1. LA DIAGNOSI EMOTIVA:**
La reazione istintiva dell'uomo quando la partner non risponde alla guida è irrigidirsi e fare più forza per costringerla a seguire. Questo trasforma il ballo in una lotta greco-romana e distrugge ogni piacere per entrambi.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il principio cardine del Metodo è: ***"Guidare non è comandare. Guidare è proporre con chiarezza corporea."***.
Se lei oppone resistenza, molto spesso ha paura di sbagliare, ha avuto cattive esperienze con ballerini violenti o è abituata ad anticipare i comandi per difendersi. La tua risposta non deve essere la forza, ma l'iper-chiarezza e la calma olimpica.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Rallenta il Gioco:** Riduci drasticamente la complessità: fai solo passi base e giri semplici e puliti.
2. **Sospensione di Calibrazione:** Quando senti che lei parte in anticipo, fermati un istante sul passo base, sorridile negli occhi e falla respirare.
3. **Adattamento:** Accetta il suo livello senza volerle fare da insegnante. Chi insegna in pista perde all'istante ogni fascino seduttivo.

Trovi le regole del Galateo e della Leadership in [[cap05]]!`;
  }

  // 14. ULTIMI 10 SECONDI DEL BRANO
  if (msgLower.includes('ultimi 10 secondi') || msgLower.includes('non farla scappare') || msgLower.includes('fine del brano')) {
    return `${greeting}gli ultimi 10 secondi del brano sono lo spartiacque tra essere dimenticato o restare nel suo cuore.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Finisce la musica: nel 99% dei casi l'uomo molla la presa, dice un frettoloso *"Grazie"* e fa per andarsene. Lei ripete il copione meccanico e torna dalle amiche. L'opportunità è bruciata per sempre.

🧠 **2. IL RAGIONAMENTO del METODO:**
La psicologia umana è governata dalla **Regola del Picco e della Fine**: un'esperienza viene ricordata principalmente per il suo culmine emotivo e per **come finisce**.
Se il ballo è stato carino ma la fine è banale o sbrigativa, il valore percepito crolla. Negli ultimi 10 secondi non devi allontanarti: devi intensificare la presenza, rallentare i passi e preparare il terreno per la Chiusura Calamita.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Riconosci la Coda del Brano:** Quando senti che gli ottoni o il cantante stanno chiudendo la frase, smetti di fare figure e torna in posizione base ravvicinata o media.
2. **Il Finale Netto:** Chiudi l'ultimo battito con fermezza e un sorriso aperto.
3. **Mano Ferma:** Non ritrarre le braccia quando il suono tace: mantieni il contatto per due secondi pieni guardandola negli occhi.

Trovi tutti i dettagli del picco e della fine in [[cap04]]!`;
  }

  // 15. CHIUSURA CALAMITA
  if (msgLower.includes('chiusura calamita') || msgLower.includes('trattenere il contatto') || msgLower.includes('2 secondi')) {
    return `${greeting}la Chiusura Calamita è il marchio di fabbrica di tutto il nostro percorso.

🔍 **1. LA DIAGNOSI EMOTIVA:**
La paura dell'uomo in questo frangente è sembrare invadente o "appiccicoso", quindi si stacca troppo in fretta. Ma staccarsi troppo in fretta comunica insicurezza e timidezza, mentre restare avvinghiati comunica bisogno.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La **Chiusura Calamita** si basa sui **Due Secondi di Sospensione Calma**:
Quando l'ultimo accordo muore, tu non lasci andare la mano. Resti lì con la postura eretta, il peso sui piedi, e la guardi negli occhi con un mezzo sorriso sincero per due secondi interi. È un momento magico in cui si crea una bolla di silenzio tra voi due mentre tutta la sala attorno applaudisce o si disperde.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **I Due Secondi:** Conta mentalmente "uno... due..." mantenendo il contatto visivo caldo.
2. **Il Rilascio Dolce:** Fai scivolare via le dita lentamente, senza scatti improvvisi.
3. **La Transizione:** Apri la postura lateralmente per rompere il congedo automatico e avviare la conversazione ponte.

Rivedi il protocollo Chiusura Calamita in [[cap04]]!`;
  }

  // 16. COSA DIRE DOPO IL BALLO
  if (msgLower.includes('cosa le dico') || msgLower.includes('dopo il ballo') || msgLower.includes('balli benissimo') || msgLower.includes('rompere')) {
    return `${greeting}rompere la frase automatica *"Grazie, balli benissimo"* è il tuo dovere principale a fine brano.

🔍 **1. LA DIAGNOSI EMOTIVA:**
La frase *"Grazie, balli benissimo"* è il bacio della morte dell'attrazione: è il complimento formale da cugino o da compagno di scuola che serve a congedarsi senza conseguenze. Se rispondi *"Grazie anche a te!"*, la conversazione è morta.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Devi usare la formula del Metodo: ***Apprezzamento Personale + Domanda Ponte***.
L'apprezzamento non deve riguardare la bravura tecnica, ma una qualità emotiva o ritmica di lei. E la domanda ponte deve portarla immediatamente fuori dal contesto banale del ballo.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **L'Apprezzamento:** Dille: *"Bello ballare con te, hai una musicalità rara e molto fluida."*.
2. **La Domanda Ponte:** Subito dopo aggiungi con curiosità genuina: *"Io mi chiamo Marco, tu come ti chiami? E quando non sei qui a ballare, cosa ti appassiona?"*.
3. **Ascolto Attivo:** Ascolta la risposta senza guardarti attorno e cogli un dettaglio su cui fare ping-pong verbale.

Trovi tutti gli schemi di conversazione in [[cap10]]!`;
  }

  // 17. STACCARSI PER PRIMI
  if (msgLower.includes('staccar') || msgLower.includes('per primo') || msgLower.includes('desiderio') || msgLower.includes('lasciare')) {
    return `${greeting}staccarsi per primi è il segreto più potente per generare attrazione irresistibile.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'uomo inesperto quando trova una ragazza simpatica cerca di monopolizzarla: continua a parlare all'infinito finché la conversazione non si spegne per esaurimento argomenti, o finché lei non inventa una scusa per andare via. Questo fa crollare il valore percepito.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita la regola d'oro è: ***"Chiudi sempre sul picco della conversazione, mai sul calo."***.
Dopo 30-45 secondi di chiacchierata brillante e divertente, sei tu a congedarti per primo. Lasciarla sul più bello crea un vuoto emotivo che accende il desiderio di rivederti. Non sei tu a inseguire lei: è lei che vorrà ritrovarti più tardi.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Individua il Sorriso:** Appena ridete insieme per una battuta o un dettaglio, quello è il momento esatto.
2. **La Frase di Chiusura Calamita:** Dille guardandola negli occhi: *"Ora ti lascio rifiatare e tornare dalle tue amiche, ma più tardi ne facciamo un'altra."*.
3. **Congedo Sicuro:** Fai un passo indietro con un sorriso sicuro e allontanati con calma.

Studia l'arte del congedo strategico in [[cap10]]!`;
  }

  // 18. CONVERSAZIONE E FLIRT TRA UN BALLO E L'ALTRO
  if (msgLower.includes('conversazione') || msgLower.includes('chiacchiere') || msgLower.includes('flirt') || msgLower.includes('tra un ballo')) {
    return `${greeting}la conversazione magnetica in pista ha regole completamente diverse dalle chiacchiere da bar.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Molti uomini pensano di dover fare battute continue da cabarettista o sfoggiare complimenti pesanti. Questo mette la donna sulla difensiva. L'altro estremo è il silenzio imbarazzato.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo insegniamo il **Silenzio Pieno** e la **Tecnica del Ping-Pong**:
- Il Silenzio Pieno dimostra che non hai l'ansia di riempire ogni secondo e che stai bene con te stesso.
- Il Ping-Pong verbale consiste nel prendere una parola della risposta di lei, aggiungere un micro-dettaglio tuo e rimandarle la palla con leggerezza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Evita le 3 Domande Bandite:** Mai chiedere *"Da quanti anni balli?"*, *"Vieni spesso qui?"* o *"Con chi sei venuta?"*. Le sentono cento volte a sera.
2. **Curiosità Autentica:** Chiedile delle sue passioni, dei suoi viaggi o della musica che preferisce ascoltare in macchina.
3. **Calibrazione:** Mantieni il tono della voce caldo, leggermente più basso del volume della sala, costringendola ad avvicinarsi per ascoltarti.

Trovi tutti i frasari da pista in [[bonus1]] e [[cap10]]!`;
  }

  // 19. SENTIRSI INFERIORE AI BALLERINI ESPERTI
  if (msgLower.includes('inferiore') || msgLower.includes('esperti') || msgLower.includes('maestri') || msgLower.includes('goffo')) {
    return `${greeting}questo è un complesso che blocca migliaia di allievi, ma la realtà è esattamente l'opposto di quello che credi.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Entri in sala, vedi il maestro con la camicia aperta o il ballerino acrobatico che fa girare tre donne contemporaneamente, e ti senti un pesce fuor d'acqua. Pensi: *"Perché mai una donna dovrebbe ballare con me quando ci sono loro?"*.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Le donne vanno a ballare per vivere un'emozione e sentirsi apprezzate, non per fare da assistenti di scena a un ballerino narcisista. Moltissimi "esperti" ballano per farsi guardare dalla sala, trascurando completamente la connessione con la donna. Un uomo che fa passi semplici, ma che ha un Asse solido, uno sguardo caldo e che la fa sentire al sicuro vince 10 a 0 su qualsiasi acrobata distratto.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Effetto Riflettore Spezzato:** Ricordati che in sala nessuno sta guardando te: ognuno è troppo occupato a preoccuparsi di se stesso.
2. **Punta sul Secondo Ballo:** Lascia a loro la ginnastica del Primo Ballo: tu vinci sul Secondo Ballo (il Filo Invisibile, la calma, la presenza).
3. **Autostima Radicata:** Quando inviti, non pensare al tuo livello tecnico: pensa al valore del momento che stai per regalarle.

Approfondisci la psicologia del ballerino invisibile in [[cap01]]!`;
  }

  // 20. RESET SERATA STORTA IN 60 SECONDI
  if (msgLower.includes('serata storta') || msgLower.includes('reset') || msgLower.includes('60 secondi') || msgLower.includes('tutto storto')) {
    return `${greeting}ogni grande ballerino ha avuto serate storte: la differenza sta in come ti resetti.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Hai preso due no di fila, hai sbagliato un tempo o ti senti stanco: la mente comincia a dirti *"È una serata persa, prendi e vai a casa"*. Se resti in pista con questa nuvola nera, il tuo corpo trasmette frustrazione e la serata peggiora.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il **Protocollo Reset di 60 Secondi** serve a interrompere all'istante lo stato emotivo negativo e riallineare l'Asse prima che contagi l'intera serata. Non servono ore di meditazione: basta un minuto di disciplina corporea.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Vai in Bagno per 60 Secondi:** Staccati dalla sala. Vai in bagno, apri il rubinetto e bagnati i polsi e la nuca con acqua fresca per abbassare il cortisolo.
2. **Tre Respiri Diaframmatici:** Davanti allo specchio, fai tre respiri profondi espirando molto lentamente, raddrizza la colonna e sorriditi.
3. **Rientro con Intenzione Chiara:** Rientra in sala con un solo obiettivo: invitare una persona qualunque per il puro piacere della musica, senza pretendere nulla. La serata ripartirà subito col piede giusto.

Trovi il protocollo di emergenza nella Guida Salva-Serata in [[bonus4]]!`;
  }

  // RISPOSTA GENERALE SUL METODO
  return `${greeting}analizziamo la tua situazione con l'esperienza di 25 anni in pista.

🔍 **1. LA DIAGNOSI EMOTIVA:**
In pista la sicurezza non nasce dal fare le cose perfettamente, ma dall'essere presente a te stesso. Quando smetti di cercare approvazione, il tuo corpo si rilassa e le donne percepiscono un uomo solido.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il Metodo Effetto Calamita si basa sul tuo Asse, sul Contatto Zero e sulla capacità di creare connessione profonda nel Secondo Ballo. 

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. Respira profondamente prima di ogni invito.
2. Concentrati sul sorriso di lei e sulla musica.
3. Esegui la Chiusura Calamita a fine brano.

Approfondisci i dettagli in ${unitRef}!`;
}

/**
 * Genera il consiglio dettagliato per il Diario della Serata in 3 punti.
 */
export function generateEveningAdviceReasoning(params: EveningReasoningParams): string {
  const { evening, userName, previousAdvice } = params;
  const nameGreeting = userName?.trim() ? `Bravo ${userName.trim()}! ` : 'Bravo! ';

  const rating = evening.rating ?? 3;
  const invites = evening.invitesCount ?? 0;
  const elegantNos = evening.elegantNoCount ?? 0;
  const closures = evening.calamitaClosuresCount ?? 0;

  if (previousAdvice) {
    return `${nameGreeting}Guardando la tua serata da un'altra angolazione:

1. **Cosa è andato bene:** La tua costanza e il coraggio di metterti in gioco in pista.
2. **Punto su cui concentrarsi:** La Tensione Lenta negli ultimi 10 secondi del ballo.
3. **Azione per la prossima serata:** Prima di uscire dalla pista, trattieni la mano per due secondi e usa una frase di apprezzamento sincero ([[cap04]]).`;
  }

  let positivePoint = 'Hai registrato la serata mantenendo la continuità, il vero segreto dei progressi.';
  if (invites >= 3) {
    positivePoint = `Hai fatto ben ${invites} inviti, superando la resistenza iniziale con determinazione.`;
  } else if (elegantNos > 0) {
    positivePoint = `Hai gestito ${elegantNos} no con eleganza e classe, rafforzando il tuo Asse personale.`;
  }

  let focusPoint = 'Lavora sulla calma pre-invito e sulla postura aperta prima di avvicinarti alla partner.';
  if (rating <= 2) {
    focusPoint = 'Rivedi il Contatto Zero: alleggerisci la pressione delle braccia per farla sentire al sicuro.';
  } else if (closures === 0) {
    focusPoint = 'Concentrati sulla Chiusura Calamita a fine brano: non scappare via con un frettoloso ringraziamento.';
  }

  const actionPoint =
    invites < 2
      ? 'Alla prossima serata applica la Regola dei 10 Minuti: fai il primo invito entro dieci minuti dal tuo arrivo in sala ([[bonus2]]).'
      : 'Esegui almeno una Chiusura Calamita completa: mano trattenuta 2 secondi, sguardo caldo e apprezzamento ([[cap04]]).';

  return `${nameGreeting}Ecco l'analisi della tua serata secondo il Metodo Effetto Calamita:

1. **Cosa è andato bene:** ${positivePoint}
2. **Punto su cui concentrarsi:** ${focusPoint}
3. **Azione concreta per la prossima volta:** ${actionPoint}`;
}
