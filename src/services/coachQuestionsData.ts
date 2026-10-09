import { trovaUnitaPertinenti, getUnita } from '../../content/index';

export interface CoachQuestionItem {
  id: string;
  category: 'approccio' | 'bachata' | 'salsa' | 'chiusura' | 'psicologia';
  categoryLabel: string;
  question: string;
  summary: string;
  response: string;
}

export const COACH_50_QUESTIONS: CoachQuestionItem[] = [
  // ==========================================
  // CATEGORIA 1: APPROCCIO & INVITO (10 DOMANDE)
  // ==========================================
  {
    id: 'q_01_blocco_invito',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: "Mi blocco prima dell'invito e rimango a fissarla da lontano: come sblocco la paura?",
    summary: 'Sbloccare la paura prima dell\'invito',
    response: `Andiamo subito al cuore del blocco prima dell'invito con un ragionamento lucido.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Quando vedi una donna che ti attrae e resti fermo a fissarla da lontano, nella tua testa scatta il "copione dell'esame": ti chiedi *"Le piacerò? Mi dirà di sì? Cosa penserà la gente se mi rifiuta?"*. Questo dialogo interno dura più di tre secondi, il cortisolo sale e il corpo si congela. Dal bordo pista lei non vede un uomo che vuole condividere un ballo: percepisce uno sguardo pesante, teso e carico di aspettativa.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita la regola d'oro è invertire la domanda: non devi più chiederti *"Le piacerò?"*, ma ***"Mi piace lei? Voglio scoprirlo ballando con lei."***. Questo ribalta all'istante l'energia da "candidato supplicante" a "uomo curioso e centrato". Inoltre applichiamo la **Regola dei 3 Secondi**: dal momento in cui i tuoi occhi la incrociano, hai tre secondi per avviare il primo passo. Il cervello non ha il tempo biologico di fabbricare la paura.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Respira, Asse, Passo:** Espira a fondo sgonfiando la pancia, allunga la spina dorsale verso l'alto (il tuo Asse) e stacca il primo passo verso di lei prima del quarto secondo.
2. **Sguardo Ancora a 2 metri:** Mentre ti avvicini, mantieni uno sguardo morbido di 2-3 secondi accompagnato da un mezzo sorriso rilassato.
3. **L'Invito Diretto:** Porgi la mano aperta all'altezza della cintura e dille semplicemente: *"Balla con me questa."* oppure *"Facciamoci questa bachata."*. Niente scuse, niente esitazioni.

Approfondisci la psicologia dell'Asse in [[cap06]] e fai il protocollo sblocco prima di entrare in sala!`,
  },
  {
    id: 'q_02_regola_3_secondi',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Come applico esattamente la Regola dei 3 Secondi dal momento in cui incrocio il suo sguardo?',
    summary: 'La Regola dei 3 Secondi per invitare',
    response: `La Regola dei 3 Secondi è la leva neuroscientifica più potente del Metodo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Il cervello umano è programmato per risparmiare energia ed evitare il rischio sociale. Quando vedi una donna che ti piace, hai una finestra temporale biologica di circa tre secondi prima che l'amigdala prenda il sopravvento e cominci a formulare scuse ("aspetta la prossima canzone", "ha la faccia stanca", "sta parlando con l'amica"). Se aspetti 4 secondi, hai già perso l'inerzia.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La Regola dei 3 Secondi non serve a farti sembrare un robot impulsivo: serve a bypassare l'esitazione. Un uomo che esita prima di invitare comunica insicurezza nel corpo ancora prima di aprire bocca. Un uomo che si muove entro 3 secondi comunica decisione, presenza maschile e naturalezza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Punto Visivo:** Incrocia il suo sguardo. Conta mentalmente: 1...
2. **Primo Passo Fisico:** Al tempo 2 muovi il piede destro in avanti verso di lei. Il movimento fisico interrompe il circuito della paura nel cervello.
3. **Arrivo Rilassato:** Al tempo 3 sei davanti a lei con le spalle aperte e la mano offerta all'altezza della cintura.

Approfondisci la biochimica dell'invito in [[cap07]]!`,
  },
  {
    id: 'q_03_primi_10_minuti',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Cosa devo fare nei primi 10 minuti dal mio arrivo al locale per entrare nel giusto Asse?',
    summary: 'I primi 10 minuti all\'arrivo nel locale',
    response: `I primi 10 minuti decidono il destino dell'intera serata.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Cosa fa l'uomo medio quando entra in un locale latino? Va al bar, ordina da bere, si mette con la schiena appoggiata al bancone, tira fuori lo smartphone e scruta la pista con aria circospetta. Più rimani fermo a guardare, più la pista si trasforma in un mostro invalicabile e l'ansia aumenta esponenzialmente.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La **Regola dei 10 Minuti** stabilisce che devi scendere in pista per il tuo primo ballo entro dieci minuti esatti dal varco della porta d'ingresso. Non importa con chi: invita una ballerina facile, un'amica di corso o una signora simpatica. Lo scopo non è sedurre: è "scaldare il motore" e abituare corpo e mente alla musica.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Niente Telefono:** Appena entri, metti il telefono in tasca silenzioso e lascialo lì per tutta la serata.
2. **Postura Immediata:** Bevi mezzo bicchiere d'acqua, allunga il collo e fai una camminata rilassata lungo il perimetro della pista respirando a fondo.
3. **Il Primo Ballo di Riscaldamento:** Entro la seconda canzone invita la prima donna disponibile senza alcuna aspettativa di prestazione: una volta rotto il ghiaccio, sarai magnetico per tutta la notte.

Trovi la procedura completa nel Rituale Pre-Serata in [[bonus2]]!`,
  },
  {
    id: 'q_04_sguardo_ancora',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Come uso lo Sguardo Ancora e il sorriso a distanza prima di avvicinarmi a lei?',
    summary: 'Sguardo Ancora che non scappa e non invade',
    response: `Lo Sguardo Ancora è lo strumento più raffinato del Filo Invisibile.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Guardare una donna in un locale genera spesso due disastri: l'uomo che fissa insistentemente senza mai distogliere lo sguardo (effetto predatore inquietante) oppure l'uomo che appena lei ricambia abbassa gli occhi di scatto verso le scarpe (effetto timido sottomesso). Entrambi distruggono l'attrazione prima ancora di aver detto una parola.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Lo **Sguardo Ancora** è definito come *"lo sguardo che non scappa e non invade"*.
Dura tra i 2 e i 4 secondi: incontra i suoi occhi, accenna un sorriso autentico che parte dagli angoli della bocca e dagli occhi, e poi si sposta con lentezza e disinvoltura verso la pista. Dimostra che l'hai notata, che ti piace ciò che vedi, ma che sei perfettamente a tuo agio anche senza la sua approvazione.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Triangolazione Morbida:** Quando i suoi occhi incrociano i tuoi, guarda l'occhio sinistro, poi il destro e infine accenna un sorriso sereno.
2. **Spostamento Lento:** Non scattare via con la testa: sposta lo sguardo con calma verso la musica o il barista.
3. **Il Cabeceo di Invito:** Se vedi che lei ricambia il sorriso o il suo sguardo torna una seconda volta, fai un cenno morbido con il mento verso la pista: l'invito è già fatto a metà prima di muovere un passo.

Trovi tutti i dettagli tecnici dello Sguardo Ancora in [[cap04]]!`,
  },
  {
    id: 'q_05_gestione_rifiuto',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Se mi dice di no o che è stanca, come gestisco il rifiuto con eleganza senza sembrare ferito?',
    summary: 'Gestire il no con i 10 secondi eleganti',
    response: `Mettiamoci a tavolino e analizziamo il rifiuto da uomo a uomo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Il motivo per cui un no fa male è che la mente maschile attiva le trappole delle "Tre P": pensi che sia *Personale* ("non le piaccio io"), *Permanente* ("andrà sempre male stasera") e *Pervasivo* ("sono un fallimento"). Nella realtà il 90% dei rifiuti è contingente: tacchi doloranti, canzone non gradita, attesa del partner di ballo abituale.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Un no è la tua occasione d'oro per costruire una **Reputazione Magnetica** in sala. Le altre donne non ti giudicano per un rifiuto: guardano attentamente **come reagisci al rifiuto**. Se mostri fastidio, scappi o abbassi le spalle, perdi punti con tutta la sala. Se invece mostri totale imperturbabilità e classe, diventi immediatamente l'uomo più interessante della serata.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **I Dieci Secondi Eleganti:** Sorridi sinceramente e dille: *"Nessun problema, riposati! Ci vediamo dopo per un'altra."*.
2. **Girati con Calma:** Ruota il busto lentamente, spalle rilassate, respiro lungo, senza abbassare la testa.
3. **Nuovo Invito Entro 60 Secondi:** Vai a invitare un'altra donna prima che termini la canzone. Questo spegne all'istante ogni loop mentale di insicurezza.

Studia il protocollo dei 10 secondi eleganti in [[cap08]]!`,
  },
  {
    id: 'q_06_donna_nel_gruppo',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Lei è in mezzo a un gruppo di amiche o colleghi: come mi avvicino senza risultare invadente?',
    summary: 'Invitare una donna circondata da amiche',
    response: `Invitare una donna in un gruppo mette alla prova la tua padronanza sociale.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'errore comune è strisciare verso di lei ignorando le amiche, o al contrario sentirsi intimiditi dal "muro sociale" del cerchio femminile. Se provi a strapparla via con impazienza, le amiche scatteranno in modalità protettiva e lei dirà di no per non fare una brutta figura col gruppo.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita usiamo la **Validazione dell'Ecologia di Gruppo**: prima di invitare lei, riconosci e rispetta il cerchio. Un sorriso e un saluto a tutte fa capire che non sei un cacciatore furtivo ma un uomo educato e sicuro che porta valore e leggerezza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Sorriso Globale:** Avvicinati al tavolo o cerchio, fai un mezzo inchino col capo verso il gruppo e dì con un sorriso: *"Buonasera a tutte!"*.
2. **Sguardo di Scelta Calibrato:** Sposta gli occhi su di lei, porgi la mano e dille: *"Ti rubo per questa bachata, poi te le restituisco intatta."*.
3. **Rilassatezza Totale:** Le amiche sorrideranno e saranno loro stesse a incoraggiarla ad andare a ballare con te.

Trovi tutti i dettagli operativi per i gruppi in [[cap07]]!`,
  },
  {
    id: 'q_07_invito_su_salsa_veloce',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Parte una Salsa molto veloce: mi conviene invitare subito o aspettare una canzone più calma?',
    summary: 'Gestione del tempo e della scelta del brano',
    response: `La scelta del brano è una decisione strategica fondamentale.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Molti allievi partono su una Salsa a 210 BPM con una donna che non conoscono. Finiscono per ansimare, sbagliare i tempi della clave, tirare con le braccia e trovarsi a fine brano esausti senza aver scambiato uno sguardo sereno.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Se il tuo obiettivo è costruire il **Secondo Ballo** (la connessione emotiva), la Salsa veloce rischia di trasformarsi in una gara atletica dove vince la tecnica e muore il flirt. Se non padroneggi perfettamente i 200 BPM, un brano veloce amplifica lo stress della dama.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Ascolta i Primi 10 Secondi:** Lascia partire il brano per identificare il tempo. Se è una timba cubana furiosa e lei è una sconosciuta, non correre: resta a bordo pista e goditi la musica.
2. **Aspetta il Tempo Medio:** Scegli una salsa romantica o una bachata cadenzata (125-140 BPM). È su quei tempi che puoi respirare, guardarla negli occhi e applicare la Tensione Lenta.
3. **Se Sei Già in Pista:** Se parte veloce mentre sei con lei, riduci le figure complesse: fai passi base ampi, gioca col ritmo e sorridi senza fare acrobazie.

Rileggi la guida alla musicalità in [[bonus3]]!`,
  },
  {
    id: 'q_08_invito_non_verbale',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: "Cos'è il Mirada e Cabeceo e come invito una donna solo con gli occhi e il mento?",
    summary: 'L\'invito non verbale (Mirada e Cabeceo)',
    response: `L'invito puramente non verbale è il livello più alto di eleganza in pista.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Camminare per 15 metri attraverso tutta la pista per chiedere *"Balli?"* a voce alta espone al rischio di un no pubblico e può far sentire lei in trappola se non voleva ballare. L'invito verbale ravvicinato è spesso troppo improvviso.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Ripreso dalla tradizione più raffinata del tango e adattato alla salsa/bachata:
- **La Mirada:** Sguardo calmo a distanza (10-15 metri). Incroci i suoi occhi e mantieni il contatto per 3 secondi.
- **Il Cabeceo:** Un piccolo, quasi impercettibile cenno del mento verso l'alto o verso la pista, accompagnato da un sopracciglio appena sollevato e un mezzo sorriso.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. Trova una posizione strategica a bordo pista, spalle aperte e Asse eretto.
2. Fai la Mirada: aspetta che lei sostenga lo sguardo.
3. Fai il cenno col capo: se lei annuisce, ti sorride o fa un passo avanti, l'invito è accettato. A quel punto ti incammini verso di lei per prenderle la mano: zero imbarazzo, 100% classe.

Approfondisci i segnali non verbali in [[cap04]]!`,
  },
  {
    id: 'q_09_ansia_giudizio_altri',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Ho paura che gli altri ballerini o maestri mi guardino e giudichino se sbaglio un passo: come me ne libero?',
    summary: 'Distruggere l\'effetto riflettore in sala',
    response: `Questa paura è il classico "Effetto Riflettore" e blocca migliaia di ballerini.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Entri in pista e ti sembra che tutti gli occhi della sala siano puntati sui tuoi piedi, pronti a cogliere ogni esitazione. La verità scientifica della psicologia sociale è spietata: **in sala nessuno sta guardando te**. Ognuno è concentrato al 100% sulla propria partner, sul proprio aspetto o sulla propria paura di sbagliare.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo distinguiamo tra "Ballo per il Pubblico" e "Ballo per la Dama". I maestri e gli esibizionisti ballano per farsi applaudire dal bordo pista. Tu invece balli per creare un momento intimo e magnetico con la donna tra le tue braccia. A lei non importa nulla del parere dei maestri: le importa solo come la tratti e se la fai sentire femminile e rilassata.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Bolla Magnetica:** Prima di partire, guarda lei negli occhi e pensa: *"Per i prossimi 3 minuti esistiamo solo io, lei e questa canzone"*.
2. **Autoironia:** Se inciampi o perdi il tempo, sorridi apertamente e strizza l'occhio: riderà con te e la tensione svanirà all'istante.
3. **Respiro Basso:** Quando sale l'ansia, abbassa il baricentro e senti la pianta dei piedi radicata a terra.

Approfondisci la psicologia dell'Asse in [[cap01]] e [[cap06]]!`,
  },
  {
    id: 'q_10_trovare_partner_senza_conoscenti',
    category: 'approccio',
    categoryLabel: 'Invito & Blocco',
    question: 'Vado a ballare da solo in un locale dove non conosco nessuno: come creo subito connessione?',
    summary: 'Andare a ballare da soli come punto di forza',
    response: `Andare a ballare da soli non è un limite: è il tuo più grande vantaggio strategico!

🔍 **1. LA DIAGNOSI EMOTIVA:**
Chi va col gruppo di scuola spesso resta imprigionato nelle dinamiche di branco: si parla solo tra conoscenti, si beve al tavolo e si invitano sempre le solite compagne di corso. Da solo ti senti inizialmente vulnerabile, ma in realtà hai una libertà di manovra totale.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Un uomo solo, curato, che si muove con passo sicuro e non si nasconde dietro lo smartphone, comunica una rara indipendenza emotiva. Non hai bisogno dell'approvazione degli amici: sei lì per il piacere autentico della musica e delle persone.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Saluta il Personale:** Quando entri, saluta con calore il barista o chi sta all'ingresso. Ti fa entrare subito in modalità sociale calorosa.
2. **Punto Neutro:** Posizionati a un terzo della pista, mai negli angoli bui o con la schiena al muro.
3. **Primo Ballo Senza Pretese:** Entro 10 minuti invita una persona sorridente. Vedendoti ballare sereno, le altre donne in sala capiranno subito che sei un leader affidabile.

Studia il Piano per le serate in solitaria in [[bonus4]]!`,
  },

  // ==========================================
  // CATEGORIA 2: BACHATA & CONTATTO (10 DOMANDE)
  // ==========================================
  {
    id: 'q_11_bachata_vicinanza',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: 'Bachata Sensual: come gestisco la vicinanza fisica senza sembrare invadente o al contrario freddo?',
    summary: 'Vicinanza offerta e non imposta',
    response: `Nella Bachata Sensual la vicinanza fisica è il terreno più delicato di tutti.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'errore comune si divide in due estremi: l'uomo insicuro che mantiene mezzo metro di distanza rigida con le braccia tese (effetto cugino), e l'uomo frettoloso che trascina la donna al proprio petto fin dalla prima battuta (effetto invasore). In entrambi i casi la donna percepisce tensione e si irrigidisce nella schiena.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il principio fondamentale che insegno è: ***"La vicinanza si offre, non si impone."***.
Tu non devi tirare lei verso di te: devi allineare il tuo Asse, aprire il petto e proporre uno spazio sicuro. Sarà il corpo di lei a colmare la distanza nel momento in cui sente che non hai alcuna "fame" o urgenza di toccarla.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Scala della Distanza (Aperto → Medio → Vicino):** Balla il primo minuto e mezzo in posizione aperta o media per stabilire fiducia e ritmo.
2. **L'Invito Corporeo:** Porta la mano destra sulla sua scapola con una pressione leggerissima (3 su 10). Se lei rilassa il peso e si avvicina, accoglila dolcemente; se mantiene la distanza, rispetta il suo spazio con il sorriso.
3. **Non Stringere Mai:** L'abbraccio deve essere una cornice solida ma traspirante, mai una morsa.

Approfondisci la Scala della Distanza in [[cap09]]!`,
  },
  {
    id: 'q_12_tensione_lenta',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: "Cos'è la Tensione Lenta nella Bachata e come faccio a far rilassare la partner nel mio abbraccio?",
    summary: 'Tensione Lenta e rilassamento corporeo',
    response: `La Tensione Lenta è l'arma segreta dell'Effetto Calamita nella Bachata.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Spesso l'uomo crede che per essere sensuale nella Bachata debba muoversi in continuazione, fare onde repentine o cambi di direzione forzati. Questo agita la partner, che resta costantemente in allerta per non inciampare, impedendole di lasciarsi andare alla musica.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La **Tensione Lenta** è l'arte di rallentare, sospendere e respirare insieme alla musica.
Quando crei una pausa morbida, trattieni il respiro per un battito e mantieni il contatto visivo, l'intensità emotiva tra voi decuplica. Le donne amano gli uomini che sanno rallentare: comunica sicurezza primordiale e totale padronanza del tempo.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Pausa sui Tempi Morti:** Durante i passaggi lenti della canzone, fermati sul posto, riduci il passo base a un leggero dondolio e respira col diaframma.
2. **Pressione Graduale:** Non muovere le braccia a scatti: ogni transizione deve fluire come se vi muoveste nell'acqua tiepida.
3. **Sguardo di Sospensione:** Durante un rallentamento, guarda i suoi occhi per 2 secondi senza muovere figure complesse. Sentirai il suo respiro sincronizzarsi al tuo.

Trovi tutti gli esercizi di Tensione Lenta in [[cap09]]!`,
  },
  {
    id: 'q_13_bachata_tap',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: "Come guido il movimento d'anca e il Tap sui tempi 4 e 8 senza tirare con le braccia?",
    summary: 'Guida del Tap 4 e 8 col corpo',
    response: `Il Tap al tempo 4 e 8 è il punto in cui si misura la qualità della tua guida maschile.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Il disastro più comune: l'uomo che sul tempo 4 e 8 tira il braccio della donna, oppure spinge con le mani sui suoi fianchi per "costringerla" a muovere il bacino. Questo spezza l'armonia, crea fastidio e fa sembrare la guida pesante e rozza.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il Tap nella Bachata non si guida con le braccia: si guida con il **trasferimento del peso e la rotazione del busto**.
La donna muove l'anca spontaneamente quando sente che il tuo peso corporeo è arrivato completamente sul piede d'appoggio al tempo 3 (o al 7), lasciando la gamba libera di marcare il tempo 4 senza carico di peso.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Nessun Peso sul Tap:** Sul tempo 4 e 8 sfiora appena il pavimento con l'avampiede senza caricare neanche un grammo del tuo peso.
2. **Braccia Neutre:** Mantieni i gomiti rilassati e stabili. Non tirarla verso l'alto né verso il basso durante il Tap.
3. **Ascolto del Bongò:** Il colpo acuto del bongò ti avvisa quando arriva il Tap: ascoltalo con l'orecchio e lasciale lo spazio per esprimere la sua femminilità.

Esercitati con l'Allenatore di Ritmo integrato e rileggi [[cap09]]!`,
  },
  {
    id: 'q_14_lettura_segnali_bachata',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: 'Come faccio a capire se lei gradisce la vicinanza o se preferisce mantenere spazio?',
    summary: 'Leggere i segnali di comfort corporeo',
    response: `Saper leggere i micro-segnali corporei della donna è ciò che distingue il ballerino magnetico da tutti gli altri.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Molti uomini non sanno interpretare se lei è a suo agio o se sta solo sopportando la vicinanza per educazione. Questo dubbio crea ansia e fa perdere la sicurezza nell'Asse.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il corpo femminile comunica con una precisione millimetrica attraverso il **Radar dei Segnali**:
- **Segnali Verdi (Comfort & Attrazione):** La sua mano sinistra si appoggia morbida dietro il tuo collo o sulla spalla, il suo braccio non fa barriera sul tuo petto, il suo respiro è calmo e la sua testa si inclina leggermente verso di te.
- **Segnali Gialli/Rossi (Distanza & Rispetto):** Il suo avambraccio crea un cuneo rigido tra i vostri petti, il suo sguardo cerca continuamente le amiche a bordo pista, la sua schiena è arcuata all'indietro per allontanarsi.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Test del Rilascio di 5 Centimetri:** Fai un passo indietro di pochi centimetri. Se lei naturalmente ti segue e richiude la distanza, è attratta. Se rimane indietro, mantieni la posizione aperta con totale eleganza.
2. **Zero Pressione:** Se noti un segnale rosso, allarga immediatamente la presa senza alcun risentimento: apprezzerà il tuo rispetto all'istante.

Trovi il Radar dei Segnali dettagliato in [[cap12]]!`,
  },
  {
    id: 'q_15_bachata_dominicana_vs_sensual',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: 'Come passo dallo stile Dominicana (veloce coi piedi) a quello Sensual senza disorientare la partner?',
    summary: 'Adattamento tra Bachata Dominicana e Sensual',
    response: `La transizione tra Dominicana e Sensual è un segno di maestria e orecchio musicale.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Spesso l'uomo impone il proprio stile preferito a prescindere dal brano: tenta onde corporali su chitarre sincopate e veloci dominicane, oppure sbatte i piedi su una ballata lenta e sensuale. La dama si sente fuori sincrono e confusa.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La musica ti dice cosa fare:
- **Sezione di Chitarra Requinto (Dominicana):** ritmica serrata, piedi attivi, posizione prevalentemente aperta, spazio al gioco dei passi.
- **Sezione Romantica / Mambo lento (Sensual):** voce calda, linee melodiche lunghe, onde morbide guidate dal petto e contatto più stretto.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Ascolta il Basso:** Quando il basso rallenta e si allunga, riduci i passi veloci e apri il petto per guidare dal tronco.
2. **Annuncia la Transizione col Respiro:** Non tirarla a te di scatto: respira, rallenta il passo base e invitala all'abbraccio ravvicinato.
3. **Torna in Aperto sui Giri:** Quando il requinto riprende a picchiare sui tempi veloci, riapri la presa per farla girare e divertire.

Rileggi gli accorgimenti musicali in [[cap09]] e [[bonus3]]!`,
  },
  {
    id: 'q_16_guida_delle_onde',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: 'Onde e movimenti del busto in Bachata: come le guido senza afferrare la sua schiena con forza?',
    summary: 'Guidare le onde corporee senza sforzo',
    response: `Guidare le onde corporee senza invasività è la prova del nove della delicatezza.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'uomo che preme le dita contro le costole o la spina dorsale della donna per "piegarla" crea solo disagio fisico e allarme. Una donna non si piega perché la spingi: si muove perché si fida del tuo sostegno.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo l'onda non si crea con le mani: si crea con il **tuo stesso corpo**. Le tue mani sono solo cuscinetti d'appoggio morbidi. Se il tuo busto esegue un'onda fluida mantenendo il contatto con il suo, lei percepirà il disegno cinetico e lo seguirà spontaneamente.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Mano Scapolare Piatta:** Tieni la mano destra aperta sulla sua scapola, dita rilassate, senza stringere con i polpastrelli.
2. **Guida dal Petto:** Inizia il movimento dal tuo sterno, trasferendo l'intenzione attraverso il frame delle braccia.
3. **Calibrazione dell'Arco:** Non forzare mai archi ampi su ballerine che non conosci: accenna solo un'onda leggera e rispetta il limite naturale della sua flessibilità.

Approfondisci la tecnica del frame morbido in [[cap03]] e [[cap09]]!`,
  },
  {
    id: 'q_17_mano_sinistra_bachata',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: "Dove devo tenere la mia mano sinistra durante l'abbraccio chiuso di Bachata per non sembrare rigido?",
    summary: 'Posizionamento corretto della mano sinistra',
    response: `La mano sinistra dell'uomo nell'abbraccio chiuso spesso tradisce tutta la sua tensione interna.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Vedi uomini che tengono la mano sinistra sollevata in alto a candelabro, oppure la stringono come se dovessero stritolarle le dita, o peggio la lasciano penzolare floscia come uno straccio. Questo trasmette indecisione e rigidità.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La mano sinistra ha due funzioni: **sicurezza** e **comunicazione**. Nell'abbraccio chiuso può riposare morbidamente all'altezza del cuore o del petto, con le dita intrecciate in modo morbido (o dita su dita) senza chiudere il pollice a morsa.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Polso Neutro:** Il tuo polso non deve essere piegato a 90 gradi: allinea mano e avambraccio.
2. **Pressione Piuma:** Tieni una presa di 2 su 10. Se dovessi togliere la mano di colpo, la sua mano non dovrebbe cadere né sentirsi tirata.
3. **Alternativa al Petto:** Puoi portare delicatamente le mani congiunte vicino alla spalla o lasciarla appoggiare sul tuo braccio in modo accogliente.

Trovi tutti i dettagli posturali in [[cap03]]!`,
  },
  {
    id: 'q_18_evitare_sudorazione_contatto',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: 'Sudo molto durante la serata e in Bachata il contatto è ravvicinato: come gestisco questo disagio?',
    summary: 'Gestione della sudorazione e comfort fisico',
    response: `Questo è un problema pratico che tocca moltissimi uomini e distrugge l'autostima se non gestito bene.

🔍 **1. LA DIAGNOSI EMOTIVA:**
La paura di essere bagnati di sudore fa chiudere l'uomo in una postura rigida e distante, impedendogli di godersi il ballo e facendolo sentire inadeguato.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel ballo latino sudare è naturale: fa parte dell'attività fisica in sale spesso calde. Tuttavia, la cura dei dettagli fa parte del **Rispetto Magnetico** verso la dama. Non serve smettere di ballare: serve organizzarsi come un professionista.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Camicia di Ricambio:** Porta sempre in macchina una seconda camicia fresca e un asciugamano piccolo. Cambiati a metà serata: rinascerai all'istante.
2. **Maglietta Intima Tecnica:** Indossa sotto la camicia una canottiera in microfibra traspirante che assorbe il calore.
3. **Asciugati tra i Balli:** Prima di invitare per una bachata, passa dal bagno a darti una sciacquata ai polsi e al collo: entrerai in contatto fresco e profumato.

Trovi la checklist per la valigetta da ballo in [[bonus2]]!`,
  },
  {
    id: 'q_19_bachata_con_dama_alta',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: 'Ballo Bachata con una donna più alta di me (specie coi tacchi): come mantengo una postura autorevole?',
    summary: 'Gestire la statura e i tacchi alti',
    response: `L'altezza della partner mette in crisi solo gli uomini che dipendono dall'ego visivo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Molti uomini quando ballano con una donna più alta tendono a incurvarsi, oppure al contrario si mettono in punta di piedi con le spalle tese verso le orecchie. Questo trasmette immediatamente insicurezza fisica.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La vera altezza di un uomo in pista si misura nella **solidità del suo Asse**, non nei centimetri. Se hai una schiena dritta, radicata e respiri con calma, trasmetti una presenza molto più imponente di un uomo alto due metri che balla ingobbito.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Allunga la Colonna:** Immagina di essere tirato verso l'alto dalla cima della testa: spalle basse, petto aperto.
2. **Regola la Mano sulla Scapola:** Non cercare di raggiungere il suo collo con la spalla sollevata: appoggia la mano destra saldamente a metà della sua schiena o sulla fascia lombare alta.
3. **Falla Sentire una Regina:** Le donne alte coi tacchi spesso si sentono "troppo grandi" per i ballerini medi. Se la guidi con sicurezza e un sorriso sereno, ti adorerà.

Approfondisci la postura dell'Asse in [[cap06]]!`,
  },
  {
    id: 'q_20_musica_lenta_senza_imbarazzo',
    category: 'bachata',
    categoryLabel: 'Bachata & Contatto',
    question: 'La canzone rallenta tantissimo e ci fermiamo quasi sul posto: come evito il momento di imbarazzo?',
    summary: 'Trasformare il silenzio musicale in magnetismo',
    response: `Quel rallentamento non è un momento di imbarazzo: è il punto di svolta dove nasce l'attrazione!

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'uomo inesperto ha l'ansia del vuoto: appena la musica rallenta teme che lei si stufi, quindi si agita e comincia a inventare figure a caso per riempire il tempo. Invece di rilassarla, le trasmette tutta la sua ansia.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo insegniamo il **Silenzio Pieno**: un uomo a suo agio nel silenzio comunica una sicurezza primordiale immensa. Quando la musica muore e il tempo si sospende, la cosa più potente che puoi fare è **fermarsi con lei**, respirare piano e sostenerla con una calma totale.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Passo Base sul Posto:** Riduci il movimento a un dondolio impercettibile del peso tra i piedi.
2. **Sguardo Dolce:** Guarda i suoi occhi con un mezzo sorriso disteso: sentirai che la sua testa si appoggerà naturalmente al tuo petto o alla spalla.
3. **Riparti sul Battere:** Quando la melodia esplode di nuovo sul tempo 1, riprendi il passo base con decisione: l'effetto emotivo sarà memorabile.

Trovi tutti i segreti della Tensione Lenta in [[cap09]]!`,
  },

  // ==========================================
  // CATEGORIA 3: SALSA & TEMPO 1 (10 DOMANDE)
  // ==========================================
  {
    id: 'q_21_salsa_figure_vs_connessione',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: 'Nella Salsa mi concentro troppo sulle figure e dimentico la partner: come cambio focus?',
    summary: 'Dal Primo Ballo tecnico al Secondo Ballo emotivo',
    response: `Questo è il paradosso più grande della Salsa: più figure fai, meno magnetico risulti.

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

Rileggi il capitolo 1 sul Ballerino Invisibile in [[cap01]]!`,
  },
  {
    id: 'q_22_guida_corpo_braccia',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: 'Come elimino la rigidità nelle braccia e guido con il centro del corpo e la schiena?',
    summary: 'Guidare dal tronco e non con le mani',
    response: `Eliminare la forza nelle braccia è il salto di qualità definitivo di ogni leader in pista.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'uomo che guida con le braccia rigide lo fa per insicurezza: ha paura che lei non capisca il comando, quindi "spinge" e "tira" con i bicipiti. Il risultato è che lei sente una morsa meccanica dolorosa (braccio morsa) o al contrario braccia flosce senza intenzione (braccio spaghetto).

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita la regola aurea è: ***"Le braccia sono solo cavi di trasmissione: il motore è il tuo centro."***.
La guida parte dai piedi, passa attraverso l'Asse vertebrale e si trasmette con la rotazione del busto. Le tue mani devono mantenere una pressione costante e vellutata di **3 su 10**.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Gomiti Davanti al Busto:** Mantieni i gomiti sempre davanti alla linea delle tue costole, mai tirati indietro dietro la schiena.
2. **Guida con il Peso:** Prima di guidare una dama in un giro, fai un passo solido sul tuo Asse e ruota la spalla sinistra: vedrai che lei girerà senza che tu debba fare forza con le dita.
3. **Respiro Basso:** Quando senti che le braccia si irrigidiscono, espira profondamente e abbassa le spalle.

Studia il capitolo sul Contatto Zero in [[cap03]]!`,
  },
  {
    id: 'q_23_salsa_tempo_1',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: 'Come riconosco il tempo 1 nel montuno del pianoforte e nella clave senza contare come un robot?',
    summary: 'Sentire il tempo 1 e il respiro del basso',
    response: `Trovare il tempo 1 nella Salsa senza sembrare un robot è una questione di orecchio, non di matematica.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Chi conta ossessivamente 1-2-3... 5-6-7 nella testa ha lo sguardo spento e il corpo rigido. Il conteggio mentale ruba tutta la tua presenza, impedendoti di ascoltare le sfumature della partner.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La Salsa non è un metronomo da calcolare: è una band che respira.
Il **Tempo 1** è annunciato dal basso (Tumbao) e dall'accordo d'apertura del pianoforte (Montuno). Il tempo 4 e l'8 sono le sospensioni naturali in cui la musica prende aria per rilanciare sul tempo forte. Quando impari a sentire il respiro del basso anziché contare i numeri, il tuo corpo si muoverà prima ancora che la mente lo comandi.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Ascolta prima di Invitare:** Quando parte un brano di Salsa, non precipitarti in pista all'istante: resta fermo 10 secondi sul posto ad ascoltare dove entra la campana e il basso.
2. **Il Passo Sinistro sul Battere:** Quando senti l'accordo pieno del pianoforte, quello è l'1: affonda il passo sinistro in avanti con calma e decisione.
3. **Allenamento Dedicato:** Usa la sezione Musica dell'app con i brani a BPM comodi (148-152) per automatizzare l'orecchio.

Approfondisci la musicalità pratica in [[bonus3]]!`,
  },
  {
    id: 'q_24_partner_balla_sola',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: "Cosa fare se la partner 'balla da sola' o oppone resistenza alla guida?",
    summary: 'Guidare non è comandare: gestione partner rigida',
    response: `Trovarsi con una partner che sembra ballare da sola o oppone resistenza è un classico test di leadership.

🔍 **1. LA DIAGNOSI EMOTIVA:**
La reazione istintiva dell'uomo quando la partner non risponde alla guida è irrigidirsi e fare più forza per costringerla a seguire. Questo trasforma il ballo in una lotta greco-romana e distrugge ogni piacere per entrambi.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il principio cardine del Metodo è: ***"Guidare non è comandare. Guidare è proporre con chiarezza corporea."***.
Se lei oppone resistenza, molto spesso ha paura di sbagliare, ha avuto cattive esperienze con ballerini violenti o è abituata ad anticipare i comandi per difendersi. La tua risposta non deve essere la forza, ma l'iper-chiarezza e la calma olimpica.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Rallenta il Gioco:** Riduci drasticamente la complessità: fai solo passi base e giri semplici e puliti.
2. **Sospensione di Calibrazione:** Quando senti che lei parte in anticipo, fermati un istante sul passo base, sorridile negli occhi e falla respirare.
3. **Adattamento:** Accetta il suo livello senza volerle fare da insegnante. Chi insegna in pista perde all'istante ogni fascino seduttivo.

Trovi le regole del Galateo e della Leadership in [[cap05]]!`,
  },
  {
    id: 'q_25_distinguere_1_e_5',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: "Confondo spesso il tempo 1 con il tempo 5 nella Salsa: qual è la differenza acustica esatta per non sbagliare?",
    summary: 'Differenza acustica tra tempo 1 e tempo 5',
    response: `Distinguere il tempo 1 dal tempo 5 è il dubbio ritmico più comune in assoluto nella Salsa caraibica!

🔍 **1. LA DIAGNOSI EMOTIVA:**
Sia sull'1 che sul 5 c'è un cambio di direzione del passo e un accordo musicale, quindi l'orecchio non allenato tende a confonderli e a ballare "rovesciato" (partendo indietro sull'1 anziché avanti).

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel ciclo musicale a 8 tempi:
- **Il Tempo 1 è la Casa (Ripartenza Armonica):** la frase musicale e il cantante ricominciano la loro strofa. Il pianoforte (montuno) dà l'accordo più aperto e squillante.
- **Il Tempo 5 è il Ponte (Metà Frase):** è una continuazione o risposta melodica, non una ripartenza. Spesso è sostenuto da una percussione secondaria, ma non ha la potenza inaugurale dell'1.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Ascolta la Voce del Cantante:** Il cantante quasi sempre attacca sul tempo 1 o sul tempo 8 prima dell'1. Usa le parole come ancora.
2. **La Campana (Bongo cowbell):** Nel montuno forte la campana picchia sui tempi 1, 3, 5, 7, ma con accento discendente sull'1.
3. **Se Sbagli:** Non fermarti di colpo: fai una camminata morbida sul posto di 4 battute e riaggancia il passo sinistro in avanti sul battere successivo!

Allenati ogni giorno con l'Allenatore di Ritmo in [[bonus3]]!`,
  },
  {
    id: 'q_26_salsa_cubana_vs_linea',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: 'Che differenza c\'è nel guidare Salsa Cubana (rotatoria) rispetto alla Salsa in Linea (Portoricana)?',
    summary: 'Guida circolare cubana vs spaziale in linea',
    response: `La differenza tra Cubana e Linea non è solo tecnica: è un cambio completo di geometria spaziale.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Cercare di fare figure in linea con una dama abituata alla cubana (o viceversa) genera scontri e pestoni di piedi, creando tensione e imbarazzo immediato.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
- **Salsa Cubana (Casino):** È circolare, terrena, corporea e dinamica. Ballate ruotando intorno a un perno centrale condiviso. La guida è continua e fluida come un vortice.
- **Salsa in Linea:** È geometrica, lineare, basata sul cross-body lead (dile que no lineare). Richiede una linea retta immaginaria pulita e aperture nette.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Verifica nei Primi 30 Secondi:** Al primo passo base proponi un cross-body semplice: se lei cammina dritta, sa ballare in linea; se comincia a ruotare attorno a te, entra subito nel cerchio della cubana.
2. **Non Imporre la Tua Scuola:** Adattati al dialetto corporeo della partner con un sorriso.
3. **Mantieni l'Asse:** In entrambi gli stili, la postura eretta e le spalle rilassate rimangono l'ancora fondamentale.

Approfondisci la calibrazione con la partner in [[cap05]]!`,
  },
  {
    id: 'q_27_dile_que_no_fluido',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: "Il passaggio fondamentale 'Dile Que No': come lo guido in modo morbido senza strappare il braccio della dama?",
    summary: 'Guidare il Dile Que No senza strappi',
    response: `Il Dile Que No è il battito cardiaco della Salsa Cubana: se lo strappi, rovini l'intero ballo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Molti cavalieri guidano il Dile Que No tirando forte con la mano sinistra al tempo 5-6, come se dovessero trascinare una valigia pesante. La donna sente lo strappo alla spalla e perde la coordinazione dei piedi.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il Dile Que No si guida con l'apertura del busto del cavaliere al tempo 1-2-3 (apertura a 90 gradi) e il passaggio sul perno al tempo 5-6-7. È il cavaliere che le apre la porta invitandola a passare: non è lui che la tira dentro a forza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Tempo 1-2-3:** Fai il passo indietro aprendo il fianco sinistro verso l'esterno: la dama vedrà lo spazio libero davanti a sé.
2. **Tempo 5-6-7:** Appoggia la mano destra sulla sua schiena guidando con il palmo verso l'uscita: la mano sinistra fa solo da binario delicato.
3. **Peso Basso:** Piega leggermente le ginocchia per assorbire l'inerzia del movimento.

Trovi tutti i dettagli della guida non invasiva in [[cap03]]!`,
  },
  {
    id: 'q_28_gestione_spazio_pista_affollata',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: 'Pista affollata e gente che urta continuamente: come proteggo la partner senza perdere il ritmo?',
    summary: 'Protezione della dama in piste stracolme',
    response: `La protezione fisica della partner in una pista affollata è la più potente dimostrazione di mascolinità e valore.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Quando la pista è stipata, molti leader perdono la testa: continuano a lanciare la donna in giri spericolati, facendola urtare contro altri ballerini. Lei si sente in pericolo e non si fiderà mai più di te.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita la regola suprema è: ***"Tu sei il suo scudo, lei deve sentirsi al sicuro al 100%."***.
Una donna perdona qualsiasi errore di passo, ma non perdona mai un uomo che la lascia sbattere contro un gomito o un tacco altrui. Se la proteggi con prontezza, proverà una stima e un'attrazione istintiva enorme.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Radar Periferico:** Guarda continuamente con la coda dell'occhio lo spazio attorno a lei.
2. **Riduci il Raggio:** Fai passi base compatti di 20 centimetri e cancella le figure a braccia aperte.
3. **Lo Scudo Corporeo:** Se vedi qualcuno cadere all'indietro verso di lei, interponi la tua schiena o il tuo avambraccio per attutire l'urto e stringila dolcemente a te dicendole col sorriso: *"Tranquilla, ci sono io"*.

Approfondisci il ruolo del Leader Protetto in [[cap05]]!`,
  },
  {
    id: 'q_29_gestire_errore_di_tempo',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: 'Mi accorgo di essere andato fuori tempo a metà brano: come recupero il ritmo con disinvoltura?',
    summary: 'Recuperare il tempo perso con classe',
    response: `Capita a tutti i ballerini del mondo: la differenza sta nel modo in cui gestisci il recupero.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Quando si accorge di essere fuori tempo, l'uomo inesperto entra nel panico: fa scatti improvvisi, salta sul posto per cambiare piede, o peggio guarda per terra con aria colpevole. La partner percepisce il disagio e si irrigidisce.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo vige la regola: ***"Non esiste l'errore: esiste solo una variazione jazz temporanea."***.
La donna raramente è un metronomo implacabile: ciò che conta per lei è la fluidità. Se recuperi il tempo con un sorriso e una pausa calibrata, non sembrerà un errore ma una scelta musicale raffinata.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Non Saltare:** Non provare mai a cambiare piede a mezz'aria.
2. **La Camminata di Sospensione:** Fermati per due tempi facendo una mossa di stile o un dondolio sulle ginocchia.
3. **Ascolta l'Attacco Successivo:** Aspetta l'1 successivo della strofa e riparti con il piede sinistro in avanti con totale naturalezza.

Studia il recupero degli imprevisti in [[cap08]]!`,
  },
  {
    id: 'q_30_passi_liberi_pasitos',
    category: 'salsa',
    categoryLabel: 'Salsa & Tempo 1',
    question: 'Momento dei pasitos (passi liberi da soli): cosa faccio se non conosco coreografie complesse?',
    summary: 'Gestione del momento libero/pasitos con carisma',
    response: `I pasitos mettono il terrore a chi crede di dover fare l'esame all'accademia di danza.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Quando vi staccate per ballare da soli, molti uomini si sentono nudi: guardano le scarpe, muovono i piedi in modo frenetico e goffo cercando di ricordare combinazioni viste su Instagram. Risultato: zero carisma e imbarazzo palpabile.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nei pasitos non vince la ginnastica dei piedi: vince il **godimento corporeo e il contatto visivo**. Se fai tre passi base puliti, ma li fai guardandola negli occhi, sorridendo e muovendo le spalle a tempo di conga, sei infinitamente più attraente di chi fa 10 battute al secondo con lo sguardo perso nel vuoto.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Mantieni il Contatto Visivo:** Non guardare per terra. Guarda lei e interagisci col sorriso.
2. **Passo Base Largo con Spalle:** Fai suzy-q o passo base incrociato semplice, rilassando le ginocchia e le spalle.
3. **Invito a Tornare:** Dopo 16 battute allunga la mano con calma e riprendila nell'abbraccio con un complimento sussurrato: *"Bello questo stacco!"*.

Approfondisci la presenza scenica in [[cap04]] e [[cap11]]!`,
  },

  // ==========================================
  // CATEGORIA 4: CHIUSURA CALAMITA (10 DOMANDE)
  // ==========================================
  {
    id: 'q_31_ultimi_10_secondi',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Cosa devo fare negli ultimi 10 secondi del brano per non farla scappare via appena finisce la musica?',
    summary: 'Gli ultimi 10 secondi e la Regola del Picco',
    response: `Gli ultimi 10 secondi del brano sono lo spartiacque tra essere dimenticato o restare nel suo cuore.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Finisce la musica: nel 99% dei casi l'uomo molla la presa, dice un frettoloso *"Grazie"* e fa per andarsene. Lei ripete il copione meccanico e torna dalle amiche. L'opportunità è bruciata per sempre.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La psicologia umana è governata dalla **Regola del Picco e della Fine**: un'esperienza viene ricordata principalmente per il suo culmine emotivo e per **come finisce**.
Se il ballo è stato carino ma la fine è banale o sbrigativa, il valore percepito crolla. Negli ultimi 10 secondi non devi allontanarti: devi intensificare la presenza, rallentare i passi e preparare il terreno per la Chiusura Calamita.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Riconosci la Coda del Brano:** Quando senti che gli ottoni o il cantante stanno chiudendo la frase, smetti di fare figure e torna in posizione base ravvicinata o media.
2. **Il Finale Netto:** Chiudi l'ultimo battito con fermezza e un sorriso aperto.
3. **Mano Ferma:** Non ritrarre le braccia quando il suono tace: mantieni il contatto per due secondi pieni guardandola negli occhi.

Trovi tutti i dettagli del picco e della fine in [[cap04]]!`,
  },
  {
    id: 'q_32_chiusura_calamita',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Come eseguo la Chiusura Calamita trattenendo il contatto per 2 secondi senza sembrare appiccicoso?',
    summary: 'Trattenere la mano per 2 secondi con calma',
    response: `La Chiusura Calamita è il marchio di fabbrica di tutto il nostro percorso.

🔍 **1. LA DIAGNOSI EMOTIVA:**
La paura dell'uomo in questo frangente è sembrare invadente o "appiccicoso", quindi si stacca troppo in fretta. Ma staccarsi troppo in fretta comunica insicurezza e timidezza, mentre restare avvinghiati comunica bisogno.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La **Chiusura Calamita** si basa sui **Due Secondi di Sospensione Calma**:
Quando l'ultimo accordo muore, tu non lasci andare la mano. Resti lì con la postura eretta, il peso sui piedi, e la guardi negli occhi con un mezzo sorriso sincero per due secondi interi. È un momento magico in cui si crea una bolla di silenzio tra voi due mentre tutta la sala attorno applaudisce o si disperde.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **I Due Secondi:** Conta mentalmente "uno... due..." mantenendo il contatto visivo caldo.
2. **Il Rilascio Dolce:** Fai scivolare via le dita lentamente, senza scatti improvvisi.
3. **La Transizione:** Apri la postura lateralmente per rompere il congedo automatico e avviare la conversazione ponte.

Rivedi il protocollo Chiusura Calamita in [[cap04]]!`,
  },
  {
    id: 'q_33_cosa_dire_dopo',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: "Cosa le dico appena finisce la musica per rompere il classico congedo 'Grazie, balli benissimo'?",
    summary: 'Formula Apprezzamento + Domanda Ponte',
    response: `Rompere la frase automatica *"Grazie, balli benissimo"* è il tuo dovere principale a fine brano.

🔍 **1. LA DIAGNOSI EMOTIVA:**
La frase *"Grazie, balli benissimo"* è il bacio della morte dell'attrazione: è il complimento formale da cugino o da compagno di scuola che serve a congedarsi senza conseguenze. Se rispondi *"Grazie anche a te!"*, la conversazione è morta.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Devi usare la formula del Metodo: ***Apprezzamento Personale + Domanda Ponte***.
L'apprezzamento non deve riguardare la bravura tecnica, ma una qualità emotiva o ritmica di lei. E la domanda ponte deve portarla immediatamente fuori dal contesto banale del ballo.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **L'Apprezzamento:** Dille: *"Bello ballare con te, hai una musicalità rara e molto fluida."*.
2. **La Domanda Ponte:** Subito dopo aggiungi con curiosità genuina: *"Io mi chiamo Marco, tu come ti chiami? E quando non sei qui a ballare, cosa ti appassiona?"*.
3. **Ascolto Attivo:** Ascolta la risposta senza guardarti attorno e cogli un dettaglio su cui fare ping-pong verbale.

Trovi tutti gli schemi di conversazione in [[cap10]]!`,
  },
  {
    id: 'q_34_staccarsi_per_primi',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Come faccio a staccarmi io per primo lasciandole il desiderio di rivedermi più tardi?',
    summary: 'Staccarsi per primi per creare attrazione',
    response: `Staccarsi per primi è il segreto più potente per generare attrazione irresistibile.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'uomo inesperto quando trova una ragazza simpatica cerca di monopolizzarla: continua a parlare all'infinito finché la conversazione non si spegne per esaurimento argomenti, o finché lei non inventa una scusa per andare via. Questo fa crollare il valore percepito.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita la regola d'oro è: ***"Chiudi sempre sul picco della conversazione, mai sul calo."***.
Dopo 30-45 secondi di chiacchierata brillante e divertente, sei tu a congedarti per primo. Lasciarla sul più bello crea un vuoto emotivo che accende il desiderio di rivederti. Non sei tu a inseguire lei: è lei che vorrà ritrovarti più tardi.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Individua il Sorriso:** Appena ridete insieme per una battuta o un dettaglio, quello è il momento esatto.
2. **La Frase di Chiusura Calamita:** Dille guardandola negli occhi: *"Ora ti lascio rifiatare e tornare dalle tue amiche, ma più tardi ne facciamo un'altra."*.
3. **Congedo Sicuro:** Fai un passo indietro con un sorriso sicuro e allontanati con calma.

Studia l'arte del congedo strategico in [[cap10]]!`,
  },
  {
    id: 'q_35_chiedere_il_secondo_ballo',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Quando e come chiedo il secondo ballo consecutivo senza sembrare invadente?',
    summary: 'La regola del secondo ballo consecutivo',
    response: `Il secondo ballo consecutivo è una mossa ad alto rendimento se fatta con tempismo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Chiedere sempre due balli di fila a tutte le donne fa sembrare pigri o incapaci di cambiare partner. Chiederlo a una donna che è chiaramente stanca genera fastidio.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La regola è: **solo se c'è stato un segnale verde inequivocabile** durante il primo brano (sguardi ricambiati, risate condivise, morbidezza nel corpo). Il secondo ballo non si chiede con timidezza: si propone come un proseguimento naturale.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Ascolta la Canzone che Parte:** Se finisce una bachata e parte una bella salsa (o viceversa), cogli l'attimo.
2. **La Frase di Connessione:** Dille con un sorriso: *"Questa non possiamo lasciarla passare: balliamo anche questa."*.
3. **Leggere la Risposta:** Se dice *"Volentieri!"*, sei a cavallo. Se esita, chiudi immediatamente con grazia: *"Nessun problema, riposati, te la chiedo dopo!"*.

Trovi la strategia dei due balli in [[cap10]]!`,
  },
  {
    id: 'q_36_invitare_a_bere_al_bar',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Come passo dalla pista al bancone del bar per offrirle da bere in modo spontaneo?',
    summary: 'La transizione elegante verso il bar',
    response: `Spostare la donna dalla pista al bar è il primo grande passaggio di avvicinamento reale.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Spesso l'uomo propone il bar con aria pesante e solenne: sembra quasi un appuntamento formale a sorpresa, e molte donne rifiutano per difendere la loro libertà.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La transizione al bar deve essere giustificata da un **bisogno fisiologico e rilassato**: il caldo della sala e la sete dopo il ballo. Non le stai offrendo una cena di gala: state solo andando a rinfrescarvi insieme.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Constatazione Neutra:** A fine ballo, mentre camminate verso il bordo pista, dì: *"Faceva un caldo pazzesco lì in mezzo, vado a prendermi un bicchiere d'acqua fresca."*.
2. **L'Invito Leggero:** Guardala e aggiungi con spontaneità: *"Vieni anche tu, due sorsi d'acqua ci rimettono al mondo."*.
3. **Niente Alcol Forzato:** Non insistere con superalcolici pesanti: un'acqua tonica o un analcolico dimostrano rispetto e lucidità.

Approfondisci la psicologia del bar in [[cap14]]!`,
  },
  {
    id: 'q_37_chiedere_il_numero_di_telefono',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'In quale momento esatto e con quale frase chiedo il numero di telefono o Instagram?',
    summary: 'Il momento esatto per scambiarsi i contatti',
    response: `Chiedere il contatto nel momento sbagliato distrugge anche il miglior ballo della serata.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'errore madornale è chiedere il numero a bruciapelo sulla pista mentre la musica ricomincia, oppure all'uscita alle 3 di notte mentre lei cerca il cappotto stanca morta. Sembra un atto predatorio.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il contatto si scambia **sul picco emotivo di una conversazione interessante al tavolo o al bar**, quando avete scoperto un interesse comune (un locale preferito, una passione, un viaggio).

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **L'Ancora di Interesse Comune:** Se parlate di musica o di un festival, dì: *"C'è quella playlist di salsa rara di cui ti parlavo che devi assolutamente ascoltare."*.
2. **Il Passaggio Pratico:** Tira fuori il telefono, apri la rubrica e passaglielo con naturalezza: *"Scrivimi qui il tuo numero così domani ti mando il link."*.
3. **Niente Insistenza:** Se preferisce Instagram, accetta con un sorriso senza batter ciglio. Il valore sta nella calma con cui lo ricevi.

Trovi tutti i copioni per chiedere il numero in [[cap15]]!`,
  },
  {
    id: 'q_38_primo_messaggio_del_giorno_dopo',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Cosa le scrivo il giorno dopo per non cadere nella friendzone ed evitare il silenzio?',
    summary: 'Il primo messaggio WhatsApp post-serata',
    response: `Il primo messaggio del giorno dopo è un campo minato tra noia e pressione.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Cosa scrive l'uomo comune? *"Ciao bella, grazie per la bella serata di ieri, mi ha fatto tanto piacere ballare con te, buona domenica!"*. Questo messaggio è innocuo, noioso, impersonale e non stimola alcuna risposta emotiva.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il messaggio deve riaccendere un'**emozione vissuta insieme**, contenere un richiamo ironico a una battuta fatta e chiudersi con una domanda aperta leggera.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Tempistica:** Scrivi nel primo pomeriggio del giorno dopo (verso le 14:00 - 16:00), mai alle 8 del mattino.
2. **La Formula del Richiamo:** *"Ciao Elena, sopravvissuta alla maratona di bachata di ieri sera? Mi sto ancora riprendendo da quella seconda canzone a 200 all'ora! Tu come hai iniziato la domenica?"*.
3. **Regola della Lunghezza:** Non scrivere papiri: mantieni il messaggio breve, fresco e divertente.

Trovi i modelli di testo per le chat in [[cap15]]!`,
  },
  {
    id: 'q_39_salutare_a_fine_serata',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Prima di andarmene dal locale, devo cercarla per salutarla o è meglio andare via senza farmi notare?',
    summary: 'Il saluto finale della serata',
    response: `Il saluto finale della serata può consolidare il magnetismo o azzerarlo del tutto.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Cercarla disperatamente per mezz'ora tra la folla, interrompendo le sue conversazioni solo per dire un frettoloso ciao, trasmette bisogno e dipendenza. D'altra parte, sparire come un fantasma se c'è stata una bella chimica può sembrare scortese.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La regola aurea è la **Calibrazione della Disinvoltura**: se la incroci sulla strada verso il guardaroba o l'uscita, fai un saluto caldo e rapido di 10 secondi. Se è lontana o occupata a ballare con altri, non interrompere: un saluto a distanza con la mano e un sorriso basta e avanza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Se la Incroci:** Avvicinati, sorridi, toccale il braccio delicatamente e dì: *"Io vado, serata super. Ci vediamo alla prossima!"*.
2. **Niente Convenevoli Lunghi:** Non fermarti a chiacchierare per altri 20 minuti al freddo: sei un uomo che ha i suoi impegni e il suo riposo.
3. **Uscita Sicura:** Esci a testa alta e spalle aperte.

Approfondisci la psicologia della conclusione in [[cap10]]!`,
  },
  {
    id: 'q_40_se_lei_balla_con_un_altro',
    category: 'chiusura',
    categoryLabel: 'Chiusura Calamita',
    question: 'Subito dopo aver ballato con me, un altro la invita e lei accetta: come reagisco internamente ed esternamente?',
    summary: 'Imperturbabilità e sicurezza emotiva',
    response: `Vederla ballare subito con un altro è il più grande test di imperturbabilità maschile.

🔍 **1. LA DIAGNOSI EMOTIVA:**
L'uomo fragile si sente punto nell'orgoglio: guarda la pista con la fronte aggrottata, scruta ogni mossa del rivale e comincia a fare paragoni mentali. Questo veleno emotivo si legge sul volto e distrugge il tuo fascino agli occhi di tutte le altre donne della sala.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Siamo in una serata sociale: le persone vanno nei locali per ballare con più partner possibili, non per sposarsi dopo una bachata. Il fatto che balli con altri è la normalità assoluta. Il tuo Asse non dipende dalle scelte di lei. Anzi: la tua totale indifferenza rilassata è il tratto più magnetico che esista.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Girati Subito:** Non restare a fissare la pista come una statua: cammina verso un'altra zona del locale.
2. **Postura Rilassata:** Bevi un sorso d'acqua, scambia una battuta col barista o invita un'altra ballerina.
3. **Sorriso di Sicurezza:** Se durante il ballo i suoi occhi incrociano i tuoi, sostieni lo sguardo per un secondo con un sorriso accennato e tranquillo: capirà che sei un uomo superiore alle gelosie infantili.

Approfondisci la psicologia dell'Asse in [[cap06]]!`,
  },

  // ==========================================
  // CATEGORIA 5: PSICOLOGIA, ASSE & FLIRT (10 DOMANDE)
  // ==========================================
  {
    id: 'q_41_conversazione_flirt',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Cosa dire tra un ballo e l\'altro? Come trasformo le solite chiacchiere in una conversazione magnetica?',
    summary: 'Silenzio Pieno e Conversazione Ping-Pong',
    response: `La conversazione magnetica in pista ha regole completamente diverse dalle chiacchiere da bar.

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

Trovi tutti i frasari da pista in [[bonus1]] e [[cap10]]!`,
  },
  {
    id: 'q_42_ballerini_esperti',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Come supero la sensazione di sentirmi goffo o inferiore rispetto ai ballerini più esperti della sala?',
    summary: 'Smettere di paragonarsi ai ballerini della sala',
    response: `Questo è un complesso che blocca migliaia di allievi, ma la realtà è esattamente l'opposto di quello che credi.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Entri in sala, vedi il maestro con la camicia aperta o il ballerino acrobatico che fa girare tre donne contemporaneamente, e ti senti un pesce fuor d'acqua. Pensi: *"Perché mai una donna dovrebbe ballare con me quando ci sono loro?"*.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Le donne vanno a ballare per vivere un'emozione e sentirsi apprezzate, non per fare da assistenti di scena a un ballerino narcisista. Moltissimi "esperti" ballano per farsi guardare dalla sala, trascurando completamente la connessione con la donna. Un uomo che fa passi semplici, ma che ha un Asse solido, uno sguardo caldo e che la fa sentire al sicuro vince 10 a 0 su qualsiasi acrobata distratto.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Effetto Riflettore Spezzato:** Ricordati che in sala nessuno sta guardando te: ognuno è troppo occupato a preoccuparsi di se stesso.
2. **Punta sul Secondo Ballo:** Lascia a loro la ginnastica del Primo Ballo: tu vinci sul Secondo Ballo (il Filo Invisibile, la calma, la presenza).
3. **Autostima Radicata:** Quando inviti, non pensare al tuo livello tecnico: pensa al valore del momento che stai per regalarle.

Approfondisci la psicologia del ballerino invisibile in [[cap01]]!`,
  },
  {
    id: 'q_43_reset_serata_storta',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Cosa fare quando una serata sembra andare tutta storta per resettare la mente in 60 secondi?',
    summary: 'Il Protocollo Reset di 60 secondi al bagno',
    response: `Ogni grande ballerino ha avuto serate storte: la differenza sta in come ti resetti.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Hai preso due no di fila, hai sbagliato un tempo o ti senti stanco: la mente comincia a dirti *"È una serata persa, prendi e vai a casa"*. Se resti in pista con questa nuvola nera, il tuo corpo trasmette frustrazione e la serata peggiora.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il **Protocollo Reset di 60 Secondi** serve a interrompere all'istante lo stato emotivo negativo e riallineare l'Asse prima che contagi l'intera serata. Non servono ore di meditazione: basta un minuto di disciplina corporea.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Vai in Bagno per 60 Secondi:** Staccati dalla sala. Vai in bagno, apri il rubinetto e bagnati i polsi e la nuca con acqua fresca per abbassare il cortisolo.
2. **Tre Respiri Diaframmatici:** Davanti allo specchio, fai tre respiri profondi espirando molto lentamente, raddrizza la colonna e sorriditi.
3. **Rientro con Intenzione Chiara:** Rientra in sala con un solo obiettivo: invitare una persona qualunque per il puro piacere della musica, senza pretendere nulla. La serata ripartirà subito col piede giusto.

Trovi il protocollo di emergenza nella Guida Salva-Serata in [[bonus4]]!`,
  },
  {
    id: 'q_44_rituale_pre_serata_in_macchina',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: "Cosa faccio nei 5 minuti in macchina prima di entrare nel locale per allineare l'Asse e scaricare lo stress da lavoro?",
    summary: 'Il Rituale di 5 minuti in macchina',
    response: `I 5 minuti trascorsi in macchina prima di spegnere il motore sono il tuo santuario sacro.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Arrivi dal traffico, dalla giornata di lavoro o dai pensieri familiari: se varchi la porta del locale con quella pesantezza nella testa, sarai contratto nei muscoli e distratto negli occhi.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Il **Rituale Pre-Serata** serve a creare una cesura netta tra la tua giornata ordinaria e la tua identità di Leader Magnetico in pista. Il corpo deve scaricare la frenesia per accogliere il ritmo caraibico.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Spegni il Motore e Respira:** Chiudi gli occhi e fai 5 cicli di respirazione quadrata (inspira in 4 secondi, trattieni 4, espira 4, vuoto 4).
2. **Scrolla le Spalle:** Ruota le spalle all'indietro 5 volte e distendi la mandibola.
3. **L'Intenzione Chiara:** Ripeti a voce alta: *"Stasera non devo dimostrare niente a nessuno. Vado a divertirmi, a godermi la musica e a far sentire bene chi balla con me"*.

Trovi il rituale audio guidato in [[bonus2]]!`,
  },
  {
    id: 'q_45_gestione_della_timidezza_storica',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Sono sempre stato un uomo timido e introverso: posso davvero diventare magnetico in pista?',
    summary: 'La timidezza trasformata in fascino calmo',
    response: `Non solo puoi: gli uomini introversi spesso diventano i leader più magnetici in assoluto!

🔍 **1. LA DIAGNOSI EMOTIVA:**
Si pensa erroneamente che per piacere alle donne serva essere esuberanti, chiassosi o fare i galletti al centro della pista. Questo stereotipo allontana gli uomini riflessivi e sensibili.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Molte donne sono esauste dei ballerini esibizionisti e rumorosi. Ciò che cercano disperatamente è un uomo capace di **ascolto autentico, delicatezza nel tocco e calma interiore**. L'introversione, quando è unita a una postura solida (l'Asse), si trasforma in mistero, eleganza e fascino aristocratico.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Non Forzare l'Estroversione:** Non recitare un personaggio che non sei: sii te stesso nella versione più presente.
2. **Usa l'Ascolto:** Fai una domanda e ascolta davvero: il tuo silenzio attento varrà più di mille battute forzate.
3. **Presenza Fisica:** Ricorda che il ballo è un linguaggio non verbale: puoi comunicare sicurezza totale senza pronunciare cento parole.

Rileggi la parte sul Risveglio dell'Uomo Magnetico in [[cap02]]!`,
  },
  {
    id: 'q_46_ballare_dopo_una_separazione',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Ho quasi 50 anni, esco da una separazione dolorosa e mi sento arrugginito: come riparto da zero?',
    summary: 'Rinascita in pista per uomini separati o over 45',
    response: `Questa è la storia di tantissimi allievi della nostra Academy: la pista può essere la tua rinascita più bella.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Dopo una separazione l'autostima è spesso a terra: ti guardi attorno, vedi ventenni scattanti e pensi *"il mio tempo è passato, cosa ci faccio qui?"*. Ti senti giudicato e temi il confronto generazionale.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel ballo di coppia, l'età e l'esperienza di vita sono un **enorme vantaggio seduttivo**, non un limite. Le donne adulte cercano maturità emotiva, spalle larghe su cui appoggiarsi, rispetto e calma: tutte cose che un ragazzo di vent'anni difficilmente possiede. Un uomo di cinquant'anni ben vestito, sicuro e galante è una calamita potentissima.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Perdona la Ruggine:** Datti il permesso di sbagliare i primi passi: la coordinazione torna in poche settimane.
2. **Eleganza Senza Tempo:** Cura la camicia, un buon profumo e scarpe pulite: la classe batte sempre la giovinezza sguaiata.
3. **Un Passo alla Volta:** Segui il Piano 21 Serate dell'app come una mappa quotidiana per ricostruire la fiducia dentro e fuori dalla sala.

Approfondisci la guida dedicata alla rinascita in [[rip1]] e [[cap02]]!`,
  },
  {
    id: 'q_47_amico_del_corso_vs_uomo_desiderabile',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: "Tutte le ragazze della scuola mi vedono solo come 'il compagno di corso simpatico': come spezzo la friendzone?",
    summary: 'Uscire dalla friendzone della scuola di ballo',
    response: `La "Friendzone del Corso" è una prigione comoda da cui devi evadere subito.

🔍 **1. LA DIAGNOSI EMOTIVA:**
A lezione scherzi, aiuti tutte, fai il cavaliere disponibile per chiunque resti sola. Il risultato è che diventi il loro compagno di banco asessuato: ti raccontano dei loro amori, ma non ti vedono come un potenziale partner.

🧠 **2. IL RAGIONAMENTO del METODO:**
Per spezzare questa dinamica devi reintrodurre la **Tensione Sessuale Morbida e la Polarità Maschile**:
- Smetti di essere sempre disponibile e rassicurante a ogni richiesta.
- Cambia il contatto visivo: passa dallo sguardo da fratellino allo Sguardo Ancora di 3 secondi.
- Usa la Chiusura Calamita anche con le compagne di corso.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Invita Donne Fuori dalla Scuola:** Vai in locali diversi dove non ci sono i compagni di corso per testare la tua identità da leader con sconosciute.
2. **Togli il Pettegolezzo:** Non ascoltare i loro sfoghi sugli altri uomini: rispondi col sorriso e cambia argomento.
3. **Contatto Corporeo Intenzionale:** Quando balli con una compagna, smetti di ridacchiare sui passi: balla con serietà, intensità e presenza per tre minuti pieni. Vedrai che nei suoi occhi cambierà tutto.

Studia la dinamica della polarità in [[cap02]] e [[cap13]]!`,
  },
  {
    id: 'q_48_cosa_fa_scappare_le_donne',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: "Quali sono i 3 errori invisibili più gravi che fanno scappare una donna dopo un ballo senza che l'uomo se ne accorga?",
    summary: 'I 3 killer invisibili dell\'attrazione in pista',
    response: `Questi tre errori sono responsabili del 95% delle schiene che si allontanano a fine brano.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Spesso l'uomo è convinto che il ballo sia andato alla perfezione perché le figure sono riuscite tutte, e non si capacita del perché lei scappi via appena finisce la musica.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
I 3 killer invisibili dell'attrazione sono:
1. **L'Occhio Vagante:** Mentre balli con lei, guardi la sala, cerchi altre donne o controlli chi ti sta osservando. Lei sente che non sei presente con lei e si spegne il filo.
2. **Il Maestro Non Richiesto:** Farle notare gli errori o dirle *"qui dovevi girare a destra"* durante il ballo. È il repellente seduttivo numero uno: sei il suo partner di ballo, non il suo esaminatore!
3. **La Fuga Frettolosa a Fine Brano:** Mollare la presa al primo secondo di silenzio con un timido *"grazie"*.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. Guardala negli occhi con presenza esclusiva per tutta la canzone.
2. Non correggere MAI una dama in pista: adatta la tua guida al suo corpo.
3. Applica sempre i 2 secondi di Chiusura Calamita prima di lasciarle la mano.

Rileggi la lista degli errori invisibili in [[cap01]] e [[cap05]]!`,
  },
  {
    id: 'q_49_abbigliamento_stile_profumo',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: 'Quanto contano abbigliamento, scarpe e profumo nella percezione di un uomo magnetico in pista?',
    summary: 'Dettagli di stile, profumo e cura dell\'uomo leader',
    response: `L'impatto visivo e olfattivo prepara il terreno prima ancora di aver staccato il primo passo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Presentarsi in sala con magliette informi, scarpe da ginnastica sporche o senza un'adeguata cura personale comunica trascuratezza. Le donne passano ore a prepararsi per la serata con trucco, abiti e tacchi: se vedono un uomo che non ha dedicato neanche 10 minuti a se stesso, si sentono svalutate.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
L'abbigliamento non serve a farti sembrare un modello: serve a comunicare **rispetto per te stesso e per la partner**. Un uomo ordinato, vestito con taglio asciutto e che emana una scia di profumo discreto e caldo si distingue all'istante dall'80% della sala.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **La Camicia:** Scegli camicie traspiranti scure (blu notte, nero o bordeaux) che nascondono eventuali aloni di sudore.
2. **Le Scarpe:** Scarpe da ballo o sneakers eleganti pulite, comode per piroettare ma curate nei dettagli.
3. **Il Profumo sulla Nuca:** Metti due spruzzi di profumo sulla nuca e dietro le orecchie, non sul petto: quando lei si avvicina nella bachata, sarà la prima cosa gradevole che percepirà.

Trovi tutti i consigli di stile nella Guida Pre-Serata in [[bonus2]]!`,
  },
  {
    id: 'q_50_mantenere_la_sicurezza_fuori_dalla_sala',
    category: 'psicologia',
    categoryLabel: 'Psicologia & Asse',
    question: "Come trasferisco l'Asse e la sicurezza imparati in pista nella mia vita di tutti i giorni e sul lavoro?",
    summary: 'Portare l\'Asse nella vita quotidiana e nel lavoro',
    response: `Questo è il vero traguardo finale del Metodo Effetto Calamita: la pista è solo la palestra!

🔍 **1. LA DIAGNOSI EMOTIVA:**
Molti allievi imparano a essere magnetici per due ore il sabato sera, ma il lunedì mattina tornano a incurvare le spalle davanti al computer, a subire i colleghi o a sentirsi insicuri nelle relazioni ordinarie.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
I principi dell'Effetto Calamita sono leggi universali della dinamica umana:
- **L'Asse Posturale:** la colonna eretta e il respiro diaframmatico comunicano autorevolezza in qualsiasi riunione di lavoro.
- **Lo Sguardo Ancora:** sostenere lo sguardo senza scappare e senza aggredire crea rispetto immediato in qualsiasi trattativa.
- **La Calma nei Momenti di Silenzio:** non avere l'ansia di riempire i vuoti ti rende l'uomo più solido della stanza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Ogni Volta che Passi una Porta:** Quando entri in ufficio o al bar, immagina di entrare in pista: spalle aperte, respiro profondo, Asse eretto.
2. **Sguardo di Presenza:** Sostieni lo sguardo dei colleghi per due secondi pieni prima di rispondere.
3. **Leadership Calma:** Smetti di correre: chi si muove con calma controlla il tempo e lo spazio, nel ballo come nella vita.

Concludi il tuo percorso studiando [[cap16]] e il Piano 21 Serate!`,
  },
];
