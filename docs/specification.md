# Specifica corrente: Addendum 1 e lista Demoni dell'autore

Il 10 settembre 2026 l'autore ha chiesto di integrare i 60 Demoni della [nuova lista](sources/author-demons-2026-09-10.tsv), poi ha indicato `G:/Il mio Drive/cutes/2026/demonlord/demoni.json` come fonte dei soli costi e requisiti, conservata in [questa copia](sources/author-demon-costs-2026-09-10.json). Per questi 60 Demoni le due richieste specifiche superano il precedente vincolo della sola fonte Excel: nomi, elementi, stelle, timing, note ed effetti provengono dalla lista nuova. Non sostituire effetti o valori con quelli del JSON dei costi. Associazioni mancanti o incerte e ambiguità del testo restano esplicite; importazione nel catalogo non equivale ad abilitazione nel motore.

Dal 9 settembre 2026 questa bozza si legge insieme a [Addendum 1](addendum-1.md), richiesta esplicita dell'autore che prevale su ogni disposizione incompatibile. In particolare sono superate l'esclusione generale delle sfide, l'istruzione di ignorare il pentagono superiore, i modificatori Boss aperti a tutti, il duello elementale e il trasferimento obbligatorio del Demone perso al vincitore. Restano valide le disposizioni non modificate e il carattere provvisorio delle proposte GDD.

Il testo storico seguente è conservato integralmente; la sua copia byte per byte precedente a questa nota è [base-specification-v1.md](sources/base-specification-v1.md). Non interpretare le vecchie esclusioni come stato corrente: consultare [matrice](RULES_MATRIX.md), [audit](SOURCE_AUDIT.md) e [copertura](COVERAGE.md) per ciascun percorso. Le fixture non risolvono le formule ufficiali aperte.

---

# DEMONICUTE — Prompt di sviluppo per Codex
## Bozza 1 · Alpha multiplayer di playtest, senza sfide

Questo documento contiene le istruzioni di progetto. Le decisioni esplicitamente confermate dall'autore sono distinte dalle scelte tecniche proposte e dai punti del regolamento ancora aperti. Non considerare questa bozza un nuovo regolamento completo.

## 1. Obiettivo

Realizza una nuova versione web di Demonicute, gioco da tavolo di carte non collezionabile, accessibile da browser per giocare a distanza con amici. Il precedente prototipo era in Python: usalo soltanto come riferimento, se disponibile, senza tradurlo automaticamente e senza sovrascriverlo.

Il progetto deve supportare da 2 a 5 partecipanti, in combinazioni di umani e bot; anche un umano con soli bot e sessioni esclusivamente tra bot. Deve avere una visuale falso 3D, carte originali, regole automatiche, una sequenza delle azioni comprensibile e un motore utilizzabile anche per simulazioni senza interfaccia.

Obiettivo attuale: un'alpha multiplayer realmente interattiva per testare le meccaniche implementate. La gestione delle sfide verrà riscritta dall'autore e NON va implementata adesso. Non presentare questa alpha come una partita completa con una condizione di vittoria già verificabile.

## 2. Fonti e precedenze

Individua nel workspace i seguenti materiali. Non presumere di poter accedere agli allegati di un'altra conversazione: verifica quali file sono effettivamente disponibili e segnala quelli mancanti.

- `Demonicute_GDD_Living_Document_v0_1_2.docx`: base provvisoria delle regole generali. Identifica la fonte con il nome del file, anche se l'intestazione interna riporta una versione diversa.
- `cutes 26-07-12.xlsx`: per caratteristiche ed effetti dei demoni usa ESCLUSIVAMENTE il foglio `Demoni`.
- `90 X CARTE TRIBUTO_STAMPA A4_08 09 2026.pdf`: immagini e testi delle carte Tributo da esaminare.
- Immagini originali delle carte fornite dall'autore, comprese quelle di `Venerare altri` e `Succo di demone`, ed eventuali ulteriori asset presenti.
- Vecchio progetto Python, soltanto se fornito: riferimento per problemi e interazioni, non fonte prevalente del regolamento.

Le seguenti indicazioni esplicite dell'autore prevalgono sui documenti:

1. Per i demoni fa fede il foglio `Demoni`.
2. `A` significa Azione: l'attivazione consuma un'azione.
3. `P` significa Passivo: non consuma un'azione. Non implica automaticamente assenza di altri costi, attivazioni illimitate o uso in qualsiasi momento.
4. `E` significa Entrata. Condizioni ed eventuali riattivazioni dipendono dal testo e dalle regole, non da supposizioni.
5. Il pentagono nella parte superiore delle carte va ignorato nelle meccaniche. Può restare nell'immagine originale, ma non dà bonus e non entra nei calcoli. Questa esclusione NON riguarda automaticamente le stelle o gli altri valori della carta.
6. Le sfide sono temporaneamente rinviate.

Per magie e manufatti la prevalenza del PDF rispetto a eventuali testi diversi nell'Excel non è ancora stata confermata. Usa le immagini originali come asset, ma non risolvere autonomamente i conflitti tra testi. Registra le varianti e sospendi l'abilitazione della carta interessata finché la scelta non è chiarita. Non bloccare per questo le parti indipendenti del progetto.

Non importare automaticamente i fogli di proposte, confronti o vecchie versioni. Non fondere alternative diverse per ottenere un effetto apparentemente completo.

## 3. Regolamento provvisorio e punti aperti

Leggi il GDD conservando le distinzioni tra Definita, Proposta, Da confermare e TBD. L'autorizzazione a usarlo come base non trasforma tutte le sue proposte in regole definitive.

Come riferimento iniziale, l'Appendice A propone 2 azioni per turno, 4 slot Demone con Famiglio separato, impilamento in Cerchia e contributo delle sole cime delle Pile a stelle ed effetti. Mantieni il carattere provvisorio dei parametri. Per l'Entrata consulta anche il capitolo 7; non equiparare automaticamente lo scoprire una carta sottostante a una nuova entrata.

Crea una matrice delle regole con: identificativo, fonte precisa, formulazione, stato della decisione, implementazione, test e dipendenze. Le scelte ancora aperte devono essere configurabili o sospese, non nascoste in costanti distribuite nel codice.

Presta particolare attenzione a: numero di carte pescate per azione; pagamento dei tributi; mano iniziale e limite mano; capienza del Limbo; limiti delle Pile; gestione dei Famigli; differenze tra addormentato, bloccato e inattivo; condizioni di risveglio; limiti di utilizzo dei passivi; limiti dei manufatti; Fato al setup; esaurimento dei mazzi; priorità delle reazioni. Il GDD non fornisce necessariamente una scelta univoca su tutti questi punti.

Non presumere che Tributo e Rifornimento siano mazzi distinti oppure sinonimi senza verificare i materiali. Registra gli eventuali conflitti terminologici.

Puoi usare una proposta esplicita del GDD come preset di sviluppo provvisorio, identificandone fonte e stato. Quando manca anche una proposta sufficientemente determinata, chiedi un chiarimento mirato prima di abilitare la meccanica. Per i test tecnici puoi creare fixture con parametri dichiarati: non presentarle come regole dell'autore.

## 4. Esclusione temporanea delle sfide

Nell'alpha disabilita sia le sfide ai Boss/DEUS sia i duelli tra Magisti, predisponendo due capacità separate, entrambe inizialmente disattivate. Non implementare la vecchia risoluzione numerica del GDD come ripiego.

- Il server deve rifiutare i comandi di sfida senza consumare azioni o risorse e senza alterare lo stato.
- L'interfaccia deve spiegare che la funzione è in attesa delle nuove regole, non sembrare guasta.
- Conserva un punto di integrazione semplice per il futuro modulo sfide, senza costruire un sottosistema speculativo.
- Conserva dati e asset delle carte dipendenti dalle sfide, ma non inserirle nel mazzo attivo del primo sottoinsieme quando la loro funzionalità non è gestibile.
- Considera anche le dipendenze indirette: acquisizione delle Gemme, effetti utilizzabili soltanto con Gemme e modificatori della sfida. Non dichiarare utili o testati effetti che nel preset non hanno condizioni raggiungibili.
- Non riscrivere una carta mista per eliminarne arbitrariamente il pezzo mancante. Tienila esclusa oppure documenta esplicitamente quali scenari non sono ancora abilitati.

Non inventare una vittoria alternativa basata su stelle, turni, demoni evocati o punteggi. Le sessioni possono terminare per arresto dell'host o limite tecnico di turni/azioni configurabile. Si tratta di fine del test, non di vittoria o pareggio.

## 5. Architettura proposta

Scelta tecnica per questa bozza: frontend HTML/CSS e TypeScript; backend Node.js con Colyseus. Usa versioni compatibili e documentate, verifica le API ufficiali e mantieni un lockfile. Non aggiungere servizi a pagamento o dipendenze complesse senza una necessità concreta.

Separa chiaramente:

- `engine`: stato, regole, validazione, scelte pendenti, eventi, gestione della casualità;
- `content`: catalogo carte, effetti, asset e preset delle regole;
- `server`: stanze, sessioni, autorizzazioni, sincronizzazione e scadenze;
- `client`: menu, tavolo, input, zoom, animazioni e narrazione;
- `bots`: politiche decisionali;
- `simulator`: esecuzione batch e report.

Il motore deve essere indipendente da DOM, grafica e rete. Browser, server, bot e simulatore non devono contenere versioni divergenti delle stesse regole. Non inserire pause o attese grafiche nelle funzioni del motore.

Il server è autoritativo: il client propone una mossa, il server verifica identità, fase, costo, bersagli e validità, quindi applica la transizione. Anche le mosse dei bot passano dalla medesima validazione.

La casualità deve essere riproducibile con seed e stato del generatore. Il tempo deve essere iniettato dall'esterno: reale nelle stanze, virtuale nei test e nel batch. Usa identificativi di comando/evento e versioni dello stato per impedire che doppio clic, ritrasmissioni o riconnessioni applichino due volte la stessa mossa.

## 6. Menu, profilo e multiplayer

Menu iniziale in italiano: Crea partita, Cerca partita / Inserisci codice, Profilo, Come si gioca. La ricerca deve poter trovare le stanze rese visibili dall'host; l'accesso con codice deve supportare stanze private.

Chi crea la stanza sceglie 2–5 posti, aggiunge/rimuove bot e ne seleziona la difficoltà. Un partecipante umano occupa il proprio posto, senza poter impersonare altri giocatori. Mostra chi è connesso e chi è pronto. L'host organizza la stanza; il server centrale gestisce la partita, non il computer dell'host.

Proposta tecnica per il profilo: nickname, identificativo pubblico casuale e preferenze persistenti nel localStorage, non riconoscimento basato sull'IP. Distingui l'identificativo pubblico dall'autenticazione: non deve bastare modificare il localStorage per occupare il posto altrui. Usa una sessione server adeguatamente protetta; non memorizzare segreti nei log o negli asset pubblici. Non richiedere account OAuth nella prima versione.

Prevedi rientro dopo refresh/disconnessione. Come comportamento tecnico provvisorio, durante una disconnessione rilevante sospendi l'avanzamento e consenti rientro oppure chiusura del test da parte dell'host. Non introdurre automaticamente sconfitta, cambio di controllo o sostituzione con bot: queste politiche non sono ancora state confermate.

Ogni client deve ricevere solo le informazioni consentite. Le carte avversarie non vanno semplicemente coperte con CSS: identità delle carte in mano, ordine dei mazzi e altri dati riservati non devono essere inviati ai client non autorizzati, nemmeno nei log o nei metadati delle animazioni.

## 7. Tavolo e carte originali

Realizza un tavolo falso 3D visto dall'alto, leggermente a tre quarti. Ogni partecipante deve trovarsi visivamente in basso dal proprio punto di vista; l'ordine logico dei posti resta identico sul server. Adatta la disposizione a 2, 3, 4 e 5 giocatori.

La mano personale è in basso, gli avversari attorno. Mostra le loro mani coperte e il conteggio delle carte, oltre alle informazioni pubbliche delle Cerchie. Il Limbo deve avere un'area ampia, senza sovrapposizioni ingestibili. Supporta un'espansione o uno zoom della zona quando necessario, senza cambiare la capienza regolamentare per esigenze grafiche.

Usa le immagini vere delle carte, con proporzioni conservate e testi non tagliati. Cliccando una carta si apre un ingrandimento frontale leggibile con informazioni e comandi esterni all'immagine. Selezione della carta e attivazione devono essere azioni distinte: aprire lo zoom non deve giocarla accidentalmente.

Quando una carta o abilità della mano/Cerchia è legalmente utilizzabile, mostra il comando e i bersagli validi. Altrimenti mostra il motivo. Le Pile devono essere ispezionabili nei limiti delle informazioni pubbliche, distinguendo cima e carte sottostanti senza attivare queste ultime per errore.

Importa gli asset mantenendo un manifest che collega ID carta, fonte e immagine. Se occorre ricavare le carte da un PDF, controlla visivamente i ritagli: una pagina resa nera o illeggibile non prova che gli asset originali siano assenti. Non trattare copie stampate come tipi distinti. Non inventare immagini mancanti; un segnaposto è ammesso soltanto come debug esplicitamente segnalato e non soddisfa il requisito grafico finale.

Priorità tecnica proposta: esperienza desktop con ridimensionamento del browser. L'ottimizzazione completa per smartphone non è un requisito già confermato.

## 8. Ritmo e casella narrativa

Il giocatore deve capire cosa fanno bot e avversari. Mantieni un riquadro narrativo fisso ispirato al funzionamento delle caselle di dialogo dei giochi Pokémon, senza copiarne asset o grafica. Mostra l'evento corrente e una cronologia consultabile.

La narrazione deve derivare dagli eventi reali del motore. Una sequenza tipica è: attivazione della carta, scelta del bersaglio, eventuale risposta, risoluzione ed esito. L'ordine concreto deve seguire il timing dell'effetto: non forzare tutti gli effetti nella stessa sequenza.

Mostra chi agisce, quale carta usa, su cosa interviene e cosa cambia. Non annunciare un risultato prima che le scelte o le reazioni necessarie siano terminate. I testi pubblici non devono rivelare carte private.

Usa evidenziazioni e movimenti brevi ma leggibili; niente salti di interi turni e niente conferma obbligatoria per ogni riga. Rendi regolabili le durate di presentazione. Il coordinamento del server deve impedire ai bot di accumulare decine di azioni mentre il giocatore sta ancora osservando la prima.

Separare animazioni e motore non significa permettere input riferiti a uno stato ormai superato. Associa richieste di scelta, finestre e comandi agli eventi/versioni corretti; evita che l'animazione faccia perdere il tempo disponibile per reagire. Una connessione lenta non deve poter bloccare una stanza indefinitamente: gestisci il problema con la politica di disconnessione, senza falsificare mosse.

## 9. Effetti, scelte e reazioni fuori turno

Rappresenta esplicitamente azioni, effetti continui, entrate, inneschi, sostituzioni e reazioni. L'icona P da sola non identifica il sottotipo né il momento di utilizzo. Costi, obbligatorietà, condizioni, durata e frequenza devono derivare dai testi e dalle regole attive.

Le scelte facoltative restano facoltative. Le decisioni a più passaggi devono avere uno stato pendente esplicito e riprendibile; non ricorrere a finestre locali scollegate dallo stato server.

Per le reazioni implementate, mostra la finestra soltanto ai giocatori che hanno effettivamente una risposta legale. Durata richiesta: 4–5 secondi; usa 5 secondi come configurazione iniziale modificabile. L'autorità sulla scadenza resta sul server. I bot decidono in base alla convenienza e non devono essere costretti a giocare ogni risposta disponibile.

Le questioni non ancora confermate — priorità tra risposte concorrenti, risposte alle risposte e tempo per completare carta/bersaglio — vanno indicate nella matrice. Il capitolo 9.3 del GDD fornisce una priorità consigliata, non una definizione completa di tutte le catene di risposta. Non introdurre il criterio «vince chi clicca prima». Abilita soltanto gli scenari il cui timing è definibile dalla fonte o da un preset provvisorio esplicito.

La scadenza senza risposta equivale a non esercitare la risposta facoltativa disponibile in quella finestra; non può eliminare un effetto obbligatorio. Non aprire finestre relative alle sfide disabilitate.

## 10. Sottoinsieme iniziale e integrazione delle carte

Il primo traguardo di contenuto è circa il 30% dei tipi di carta, non il 30% delle copie fisiche scelte casualmente. Definisci il denominatore dal catalogo effettivamente disponibile. Seleziona un sottoinsieme rappresentativo delle meccaniche NON rinviate, mantenendo documentate quantità e composizione dei mazzi.

Per ogni carta selezionata servono identificativo stabile, fonte, immagine disponibile o mancante, caratteristiche, costi, timing, bersagli, effetto, limiti, dipendenze e test. Immagine e comportamento devono essere separati. Non usare il nome visualizzato come unica chiave logica.

Crea una tabella di copertura con almeno: implementata e testata, da implementare, sospesa per ambiguità, rinviata per sfide, asset mancante. Una carta che produce un messaggio ma non applica l'effetto NON è implementata.

Non inserire nel mazzo attivo effetti parziali o vuoti. Costruisci le famiglie di effetti a partire dalle carte reali, senza progettare un linguaggio universale sproporzionato. L'espansione al resto del catalogo dovrà riutilizzare questi componenti.

## 11. Bot e simulazioni senza grafica

Prevedi tre livelli: facile, intermedio e difficile. Il facile sceglie mosse legali con criteri semplici; l'intermedio valuta costi, sviluppo della Cerchia e interazioni; il difficile può valutare più continuazioni compatibili con le informazioni disponibili. Documenta la differenza effettiva: non usare soltanto tre etichette per lo stesso comportamento.

Tutti i livelli vedono solo ciò che un umano nello stesso posto può conoscere. Non passare alle politiche dei bot lo stato completo, l'ordine dei mazzi o il seed che permetterebbe di ricostruirli. Nella prima alpha la competenza riguarda i moduli attivi: non promettere strategia completa di vittoria senza sfide.

Il simulatore deve funzionare da terminale, senza browser, animazioni o attese reali, usando lo stesso motore e le stesse carte delle stanze. Parametri: numero di sessioni, partecipanti, difficoltà, preset, seed, limite di turni/azioni e limiti di sicurezza per scelte/effetti.

Ogni sessione produce un registro eventi strutturato e un riepilogo scritto leggibile. Il batch produce CSV/JSON e un riepilogo testuale con configurazioni, sessioni eseguite, turni, azioni, evocazioni, impilamenti, carte/abilità utilizzate, scelte pendenti problematiche, errori e motivi di arresto. Distingui tempo di calcolo e durata in turni: il batch non misura direttamente la durata percepita di una partita online.

Con sfide disabilitate usa vincitore non applicabile e dichiara l'assenza dell'analisi delle vittorie. Non convertire il raggiungimento del limite in pareggio. Distingui fine del test, arresto dell'host, stallo e errore. I risultati di questa alpha descrivono funzionamento ed economia dei moduli attivi, non il bilanciamento complessivo di Demonicute.

Permetti di riprodurre un problema con versione del codice, versione regole, catalogo/preset, seed e sequenza dei comandi. Seed e log completi sono dati di debug riservati: non esportarli indiscriminatamente ai giocatori di una partita in corso.

## 12. Modalità manuale e aggiornamenti

La modalità principale è automatica. L'autore ha proposto anche uno switch manuale/automatico, ma non ne ha ancora definito l'estensione. Predisponi la separazione; per questa bozza la proposta è un successivo «Playtest assistito» con correzioni autorizzate dall'host, non un tavolo totalmente libero richiesto già nel primo incremento.

Le correzioni, se abilitate, avvengono in pausa, hanno autorizzazione server, registrano prima/dopo e verificano la coerenza prima della ripresa. Una sessione modificata deve essere identificabile nei report ed esclusa dalle future statistiche standard salvo scelta esplicita.

Mantieni versione delle regole e del catalogo in stanze, replay e report. Non applicare nuove regole a una sessione già iniziata senza una migrazione esplicita. Quando arrivano integrazioni dell'autore, confronta le fonti, aggiorna i moduli interessati, aggiungi test di regressione e aggiorna la cronologia. Non riscrivere l'intero progetto.

## 13. Sviluppo incrementale e criteri di completamento

Non tentare di completare tutto con un unico blocco di codice non verificato. Organizza il lavoro in incrementi eseguibili:

1. Audit delle fonti, matrice regole/conflitti, catalogo e piano del sottoinsieme. Prepara i documenti di lavoro senza modificare gli originali.
2. Motore minimo con setup e primi effetti non ambigui; test di transizioni, costi, azioni, Pile e informazioni private. I blocchi del regolamento vanno isolati e dichiarati.
3. Prima sessione online dal menu al tavolo, con almeno due client indipendenti e bot, carte originali dove disponibili, zoom e narrazione.
4. Estensione e verifica a 2–5 posti, reazioni supportate, riconnessione e simulatore batch.
5. Copertura progressiva del sottoinsieme iniziale e differenziazione dei bot. Poi ulteriori carte; le sfide attendono le nuove regole.

Per ogni incremento esegui test e controlli realmente disponibili. Verifica in particolare: nessuna carta duplicata o persa; comandi illegali senza effetti collaterali; costi/azioni applicati una sola volta; demoni coperti senza bonus impropri; selezioni obsolete rifiutate; mosse duplicate idempotenti; dati privati non trasmessi; bot senza accesso privilegiato; fine dei test senza falsa vittoria; comandi di sfida respinti.

Verifica anche manualmente o con test browser la grafica nelle configurazioni 2–5 giocatori, le aree affollate, lo zoom, la lettura della narrazione e la sincronizzazione tra client. Se un test non può essere eseguito nell'ambiente, dillo: non dichiararlo superato.

Fornisci README e comandi funzionanti per installare, avviare client/server, eseguire test e lanciare un batch. Prepara la configurazione per un server remoto e spiega cosa serve per il deployment, senza acquistare servizi, pubblicare credenziali o effettuare distribuzioni esterne non autorizzate. Una prova su localhost non equivale a un deployment Internet verificato.

## 14. Prima esecuzione di questo incarico

Inizia verificando i materiali disponibili e produci un riepilogo breve di: fonti lette, decisioni applicabili, moduli sospesi, conflitti essenziali e primo incremento realizzabile. Crea un piano persistente e un `AGENTS.md` conciso con vincoli durevoli, comandi reali di verifica e rimando alle specifiche; non duplicarvi tutto il catalogo.

Poi avvia il primo incremento non bloccato. Chiedi chiarimenti soltanto per decisioni di gioco necessarie a quel passo e non ricavabili dalle fonti. Non chiedere nuovamente decisioni già esplicitate qui. Non fermare menu, rete o rendering per attendere il futuro regolamento delle sfide.

Alla fine di ogni sessione riporta ciò che è stato implementato, come avviarlo, quali verifiche sono state eseguite, cosa rimane incompleto e il prossimo incremento. Non equiparare schermate statiche, mock, effetti vuoti o test non eseguiti a una funzionalità completata.
