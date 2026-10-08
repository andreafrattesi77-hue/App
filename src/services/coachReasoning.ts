import { trovaUnitaPertinenti, getUnita, Unita } from '../../content/index';

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
 * Fornisce un ragionamento profondo, articolato e su misura per ogni dubbio in pista.
 */
export function generateCoachReasoning(params: CoachReasoningParams): string {
  const { message, userName, userProfile, currentMission, activeUnitId } = params;
  const msgLower = (message || '').toLowerCase();
  const studentName = userName?.trim() || '';
  const greeting = studentName ? `Ciao ${studentName}, ` : 'Ciao, ';

  // Trova unità più pertinenti
  const pertinentUnits = trovaUnitaPertinenti(message, 2);
  const primaryUnit = activeUnitId ? getUnita(activeUnitId) || pertinentUnits[0] : pertinentUnits[0];
  const unitRef = primaryUnit ? `[[${primaryUnit.id}]]` : '[[cap06]]';

  // Analisi Semantica dell'Intento e Dinamica Emotiva
  if (
    msgLower.includes('invit') ||
    msgLower.includes('blocc') ||
    msgLower.includes('paura') ||
    msgLower.includes('ansia') ||
    msgLower.includes('esit') ||
    msgLower.includes('vergogn')
  ) {
    return `${greeting}andiamo subito al cuore del problema con un ragionamento lucido.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Quando vedi una donna che ti attrae e resti fermo a fissarla, nella tua testa scatta il "copione dell'esame": ti chiedi *"Le piacerò? Mi dirà di sì? Cosa penserà la gente se mi rifiuta?"*. Questo dialogo interno dura più di tre secondi, il cortisolo sale e il corpo si congela. E sai cosa percepisce lei dal bordo pista? Non vede un uomo che vuole condividere un ballo: percepisce uno sguardo pesante, teso e carico di aspettativa.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita la regola d'oro è invertire la domanda: non devi più chiederti *"Le piacerò?"*, ma ***"Mi piace lei? Voglio scoprirlo ballando con lei."***. Questo ribalta all'istante l'energia da "candidato supplicante" a "uomo curioso e centrato". Inoltre applichiamo la **Regola dei 3 Secondi**: dal momento in cui i tuoi occhi la incrociano, hai tre secondi per avviare il primo passo. Il cervello non ha il tempo biologico di fabbricare la paura.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Respira, Asse, Passo:** Espira a fondo gonfiando la pancia, allunga la spina dorsale come se un filo ti tirasse verso l'alto (il tuo Asse), e stacca il primo passo verso di lei prima del quarto secondo.
2. **Sguardo Ancora a 2 metri:** Mentre ti avvicini, mantieni uno sguardo morbido di 2-3 secondi accompagnato da un mezzo sorriso rilassato.
3. **L'Invito Diretto:** Porgi la mano aperta all'altezza della cintura e dille semplicemente: *"Balla con me questa."* oppure *"Facciamoci questa bachata."*. Niente scuse, niente esitazioni.

Approfondisci la psicologia dell'Asse in ${unitRef} e fai il protocollo sblocco prima di entrare in sala!`;
  }

  // GESTIONE DEL RIFIUTO / NO
  if (
    msgLower.includes('no') ||
    msgLower.includes('rifiut') ||
    msgLower.includes('detto di no') ||
    msgLower.includes('palo') ||
    msgLower.includes('due di picche') ||
    msgLower.includes('stanca')
  ) {
    return `${greeting}mettiamoci a tavolino e analizziamo questo no da uomo a uomo.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Il motivo per cui un no brucia non è il no in sé, ma il significato che gli dai. La mente cade subito nelle trappole delle "Tre P": pensi che sia *Personale* ("non le piaccio io"), *Permanente* ("andrà sempre male") e *Pervasivo* ("sono inadeguato in pista"). La verità? Il 90% dei no in sala non riguarda te: lei ha i piedi doloranti, aspetta un amico, o semplicemente in quel momento voleva riposare.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita un no è il tuo miglior alleato di reputazione. Le altre donne in sala non ti giudicano perché ricevi un no: ti osservano per vedere **come reagisci al no**. Se abbassi lo sguardo, fai la faccia scura o scappi al bar con il telefono in mano, confermi di essere insicuro. Se invece incassi con un sorriso tranquillo e totale leggerezza, dimostri un Asse d'acciaio che le donne trovano irresistibilmente magnetico.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **I Dieci Secondi Eleganti:** Appena ti dice *"No, grazie, sono stanca"*, rispondi guardandola negli occhi con un sorriso autentico: *"Nessun problema, riposati! Ci vediamo dopo per un'altra."*.
2. **Girati con Calma:** Non fuggire a testa bassa. Ruota su te stesso lentamente, mantieni le spalle aperte e fai tre passi fluidi senza guardare a terra.
3. **La Caccia ai No:** La regola è invitare un'altra donna entro 60 secondi o massimo la canzone successiva. Questo spegne sul nascere il loop mentale del rifiuto.

Rivedi la tecnica dei 10 secondi in ${unitRef} e trasformala in un punteggio di sicurezza personale!`;
  }

  // BACHATA: VICINANZA, SENSUALITÀ, CONTATTO
  if (
    msgLower.includes('bachata') ||
    msgLower.includes('vicin') ||
    msgLower.includes('sensual') ||
    msgLower.includes('contatto') ||
    msgLower.includes('abbraccio') ||
    msgLower.includes('tocco') ||
    msgLower.includes('intimit')
  ) {
    return `${greeting}la Bachata è il terreno dove la psicologia maschile fa la differenza più netta.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Nella Bachata l'errore tipico oscilla tra due estremi: l'uomo che ha paura di sembrare invadente e balla a un metro di distanza con le braccia rigide (effetto cugino), oppure l'uomo che tira la donna a sé forzando la vicinanza (effetto provolone). Entrambi gli approcci distruggono l'attrazione. Lei percepisce la tensione e si irrigidisce nella schiena.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La regola aurea che insegno da 25 anni è: ***"La vicinanza si offre, non si impone."***.
Tu non devi tirarla a te: devi creare uno spazio sicuro con il tuo Asse, aprire la tua postura e lasciare che sia lei a scegliere di colmare la distanza. Questo si chiama **Tensione Lenta**. Quando una donna sente che non hai fame di toccarla, che il tuo tocco è fermo ma leggero come seta, abbassa tutte le difese e si appoggia al tuo petto in modo del tutto naturale.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Scala della Distanza (Livello 1 → Livello 2):** Inizia la prima metà della canzone in posizione aperta o media. Non forzare il contatto stretto prima del minuto e mezzo di ballo.
2. **Contatto Zero Calibrato:** Mano sulla sua scapola con pressione 3 su 10 (mai dita che artigliano). Lascia respirare la connessione.
3. **Il Tap col Respiro:** Sul tempo 4 e 8 della Bachata, mentre marchi il Tap con il piede senza caricare peso, espira e mantieni lo sguardo rilassato. Se lei si avvicina, accoglila; se mantiene spazio, rispettalo.

Rileggi con attenzione il capitolo dedicato alla Tensione Lenta in ${unitRef}!`;
  }

  // SALSA: RITMO, TEMPO 1, FIGURE, BRACCIA RIGIDE
  if (
    msgLower.includes('salsa') ||
    msgLower.includes('ritmo') ||
    msgLower.includes('tempo 1') ||
    msgLower.includes('clave') ||
    msgLower.includes('montuno') ||
    msgLower.includes('figur') ||
    msgLower.includes('passi') ||
    msgLower.includes('bracc')
  ) {
    return `${greeting}la Salsa è dove il 95% dei ballerini cade nella trappola del "primo ballo".

🔍 **1. LA DIAGNOSI EMOTIVA:**
Cosa succede quando la musica parte a 180 BPM? La mente va in sovraccarico: pensi a dove mettere i piedi, a non perdere il tempo 1 e a infilare la figura complicata che hai visto a lezione. Il risultato è disastroso: spalle contratte, braccia a morsa e sguardo perso nel vuoto. Stai ballando con la tua memoria, non con la donna davanti a te. Lei si sente usata come un birillo per le tue figure.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita distinguiamo categoricamente:
- Il **Primo Ballo** (la tecnica): fa di te un esecutore.
- Il **Secondo Ballo** (il Filo Invisibile): fa di te l'uomo che lei non dimentica.
Nessuna donna torna a casa dicendo: *"Che bello, ha fatto un setenta complicatissimo con doppio giro!"*. Si ricorda invece di come l'hai fatta sentire: se l'hai fatta sentire al sicuro, leggera, valorizzata e guardata negli occhi con sicurezza.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Dimezza le Figure:** Stasera usa solo 3 figure base che fai a occhi chiusi. Sposta tutta l'attenzione liberata sul sorriso di lei e sulla leggerezza delle mani.
2. **Guida dal Centro, non con le Mani:** La guida nella Salsa parte dal tronco e dal peso corporeo, mai tirando o spingendo con le braccia. Mantieni la presa morbida (pressione 3 su 10).
3. **Cerca il Basso sul Tempo 1:** Invece di contare ossessivamente 1-2-3-5-6-7, ascolta il pianoforte e il basso latino. Quando senti il battere, muovi il passo sinistro in avanti con calma.

Allenati con l'Allenatore di Ritmo in app e studia i principi di ${unitRef}!`;
  }

  // DOPO IL BALLO: CHIUSURA CALAMITA, ULTIMI 10 SECONDI, CONTATTO
  if (
    msgLower.includes('dopo') ||
    msgLower.includes('fine') ||
    msgLower.includes('grazie') ||
    msgLower.includes('chiusur') ||
    msgLower.includes('parl') ||
    msgLower.includes('numero') ||
    msgLower.includes('telefono') ||
    msgLower.includes('lascia')
  ) {
    return `${greeting}questo è il momento decisivo dell'intera serata: la **Chiusura Calamita**.

🔍 **1. LA DIAGNOSI EMOTIVA:**
La scena classica: finisce la canzone, lui lascia andare la mano di scatto, balbetta un *"Grazie mille"* imbarazzato e scappa via, oppure lei dice *"Grazie, balli benissimo"* con il tono da cugino e se ne torna al suo tavolo. Perché succede? Perché scatta il copione automatico di congedo: nessuno dei due sa come passare dal ballo alla conversazione senza imbarazzo.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
La psicologia umana è governata dalla **Regola del Picco e della Fine**: ricordiamo un'esperienza non per la sua durata totale, ma per come finisce. Se il ballo è stato carino ma la chiusura è frettolosa o goffa, il ricordo che le lasci è debole.
La Chiusura Calamita si gioca negli **ultimi 10 secondi** del brano: non lasci cadere la mano prima che l'ultimo accordo si sia spento, mantieni il contatto visivo e rompi il copione con una formula calibrata.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Trattieni il Contatto per 2 Secondi:** Quando la musica sfuma, non scappare. Mantieni la mano e la postura aperta per due secondi pieni guardandola negli occhi con un sorriso tranquillo.
2. **Apprezzamento + Domanda Ponte:** Dille una frase sincera e personale: *"Bello ballare con te, hai una musicalità rara. Come ti chiami?"*. Ascolta la risposta senza fretta.
3. **Staccati Tu per Primo:** Questo è il segreto magnetico. Dopo 30-40 secondi di chiacchierata piacevole, dille: *"Ora ti lascio rifiatare, ma più tardi ne facciamo un'altra."*. Lasciare lei con la voglia di rivederti crea l'Effetto Calamita immediato.

Studia il protocollo completo della Chiusura Calamita in ${unitRef}!`;
  }

  // CONVERSAZIONE, FLIRT, SILENZIO
  if (
    msgLower.includes('cosa dire') ||
    msgLower.includes('convers') ||
    msgLower.includes('parlare') ||
    msgLower.includes('silenzio') ||
    msgLower.includes('flirt') ||
    msgLower.includes('chiacchiere')
  ) {
    return `${greeting}affrontiamo il tema della comunicazione verbale in pista.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Molti uomini credono di dover fare battute continue o sfoggiare frasi da conquistatore mentre ballano. Risultato? Lei non riesce a godersi la musica, tu perdi il tempo e la conversazione suona artificiale. L'altra trappola è il silenzio imbarazzato: quel mutismo teso in cui lui evita di parlare perché teme di sbagliare.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Nel Metodo Effetto Calamita insegniamo il **Silenzio Pieno**: un silenzio confortevole, sicuro, in cui due corpi comunicano attraverso la musica senza bisogno di riempire ogni secondo d'aria. Le parole servono solo come "ponti leggeri". Non servono frasi ad effetto: serve curiosità autentica e calibrazione.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Durante il Ballo:** Riduci le parole al minimo. Un complimento sul ritmo o un sorriso complice sul tempo 4 bastano e avanzano.
2. **La Domanda Ponte:** Quando il ballo finisce, usa la formula: *"E quando non balli, cosa ti appassiona?"*. Ti porta subito fuori dal banale *"Da quanti anni balli?"* a cui rispondono 100 volte a sera.
3. **Tecnica del Ping-Pong:** Prendi un dettaglio della sua risposta, aggiungi un tuo pensiero breve e rilancia con leggerezza.

Trovi tutti i modelli di conversazione naturale in ${unitRef}!`;
  }

  // SGUARDO, OCCHI, CONTATTO VISIVO
  if (
    msgLower.includes('sguardo') ||
    msgLower.includes('occhi') ||
    msgLower.includes('guardare') ||
    msgLower.includes('fissare')
  ) {
    return `${greeting}lo sguardo in pista è il canale più potente del Filo Invisibile.

🔍 **1. LA DIAGNOSI EMOTIVA:**
Ci sono due errori opposti che rovinano la connessione: guardare costantemente a terra (comunica insicurezza e timidezza) oppure fissarla negli occhi in modo insistente e minaccioso (sguardo da predatore). Lei si sente a disagio in entrambi i casi.

🧠 **2. IL RAGIONAMENTO DEL METODO:**
Lo strumento del metodo è lo **Sguardo Ancora**: uno sguardo che *"non scappa e non invade"*.
È uno sguardo caldo, morbido, che dura tra i 2 e i 4 secondi, poi si sposta naturalmente sul movimento della pista o sulla spalla, e ritorna con un accenno di sorriso. Comunica che sei presente al 100%, ma senza alcuna pressione.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Altezza dello Sguardo:** Imponiti di tenere gli occhi sempre all'altezza del suo viso o dello spazio circostante, mai sui piedi.
2. **La Triangolazione:** Quando la guardi, passa dolcemente dal suo occhio sinistro al destro e poi alla bocca quando sorridete.
3. **Il Test dello Sguardo di Ritorno:** Più tardi nella serata, cercala con lo sguardo da lontano. Se incrocia i tuoi occhi e sorride, il filo è già acceso: vai a invitarla per il secondo ballo.

Approfondisci lo Sguardo Ancora in ${unitRef}!`;
  }

  // RAGIONAMENTO GENERALE ARTICOLATO (SU MISURA PER QUALSIASI ALTRO DUBBIO)
  const profileNotice = userProfile ? `Considerando il tuo profilo "${userProfile}", ` : '';
  const missionNotice = currentMission ? `nel contesto della tua ${currentMission}, ` : '';

  return `${greeting}analizziamo la tua situazione con il metodo e l'esperienza di 25 anni in pista. ${profileNotice}${missionNotice}

🔍 **1. LA DIAGNOSI EMOTIVA:**
Spesso in pista ci si sente sotto pressione perché si confonde l'approvazione con l'attrazione. Quando un uomo si sente insicuro, cerca conferme all'esterno: controlla le reazioni di lei, misura se sta sorridendo abbastanza, si irrigidisce al minimo errore nei passi. Questo atteggiamento mentale trasmette all'istante una frequenza di "bisogno", e il bisogno è il nemico numero uno del magnetismo.

🧠 **2. IL RAGIONAMENTO DEL METODO EFFETTO CALAMITA:**
Il cuore del Metodo si basa sull'**Asse Personale**: la capacità di restare centrato su te stesso qualunque cosa accada attorno a te. In pista non sei lì per sostenere un esame, né per dimostrare di essere il miglior ballerino del locale. Sei lì per goderti la musica, guidare con precisione rilassata e creare uno spazio confortevole dove lei possa sentirsi al sicuro e libera di esprimersi. Quando tu smetti di cercare il risultato, l'Effetto Calamita inizia a lavorare per te.

⚡ **3. L'AZIONE PRATICA IN PISTA:**
1. **Il Reset Corporeo di 60 Secondi:** Prima di entrare in sala o tra un ballo e l'altro, fermati, bevi un sorso d'acqua, allunga la schiena e respira col diaframma. Il tuo corpo deve ritrovare la calma prima dei tuoi pensieri.
2. **Priorità alla Connessione:** Nel prossimo ballo fai il 50% di figure in meno e raddoppia l'attenzione su come la fai sentire (pressione leggera sulle mani, sguardo presente, rispetto dei suoi spazi).
3. **Applicazione Immediata:** Scegli una singola azione da eseguire con costanza questa sera: un invito entro 3 secondi, un sorriso elegante dopo un no, o una Chiusura Calamita trattenuta per 2 secondi a fine brano.

Rileggi la guida pratica in ${unitRef} e porta questa sicurezza con te stasera!`;
}

/**
 * Genera il consiglio dettagliato per il Diario della Serata in 3 punti.
 */
export function generateEveningAdviceReasoning(params: EveningReasoningParams): string {
  const { evening, userName, userProfile, currentMission, previousAdvice } = params;
  const nameGreeting = userName?.trim() ? `Bravo ${userName.trim()}! ` : 'Bravo! ';

  const rating = evening.rating ?? 3;
  const invites = evening.invitesCount ?? 0;
  const elegantNos = evening.elegantNoCount ?? 0;
  const closures = evening.calamitaClosuresCount ?? 0;

  if (previousAdvice) {
    // Angolazione complementare
    return `${nameGreeting}Guardando la tua serata da un'altra prospettiva chiave:

1. **Cosa è andato bene:** La tua capacità di metterti in gioco e uscire dalla zona di comfort registrando i dettagli della pista.
2. **Punto su cui concentrarsi:** La gestione della Tensione Lenta negli ultimi 10 secondi del ballo. Non affrettare la separazione quando la musica finisce.
3. **Azione per la prossima serata:** Prima di uscire dalla pista, trattieni la mano per due secondi, guarda la partner con un sorriso autentico e usa una frase di apprezzamento sincero ([[cap04]]).`;
  }

  let positivePoint = 'Hai registrato la serata mantenendo la continuità, il vero segreto dei progressi.';
  if (invites >= 3) {
    positivePoint = `Hai fatto ben ${invites} inviti, superando la resistenza iniziale con determinazione.`;
  } else if (elegantNos > 0) {
    positivePoint = `Hai gestito ${elegantNos} no con eleganza e classe, rafforzando il tuo Asse personale.`;
  }

  let focusPoint = 'Lavora sulla calma pre-invito e sulla postura aperta prima di avvicinarti alla partner.';
  if (rating <= 2) {
    focusPoint = 'Rivedi il Contatto Zero: alleggerisci la pressione delle braccia per farla sentire al sicuro senza forzature.';
  } else if (closures === 0) {
    focusPoint = 'Concentrati sulla Chiusura Calamita a fine brano: non scappare via con un frettoloso ringraziamento.';
  }

  const actionPoint =
    invites < 2
      ? 'Alla prossima serata applica la Regola dei 10 Minuti: fai il primo invito entro dieci minuti dal tuo arrivo in sala ([[bonus2]]).'
      : 'Esegui almeno una Chiusura Calamita completa: mano trattenuta 2 secondi, sguardo caldo e apprezzamento + apertura ([[cap04]]).';

  return `${nameGreeting}Ecco l'analisi della tua serata secondo il Metodo Effetto Calamita:

1. **Cosa è andato bene:** ${positivePoint}
2. **Punto su cui concentrarsi:** ${focusPoint}
3. **Azione concreta per la prossima volta:** ${actionPoint}`;
}
