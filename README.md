# Demonicute alpha 0.2.1

Un laboratorio web multiplayer in italiano con **Base** e **Sfide TEST**, per 2–5 posti umani/bot, anche con soli bot e host osservatore. L’Addendum 1 abilita lo sviluppo di Boss, duelli e modificatori. Il preset Sfide TEST offre percorsi completi con convenzioni tecniche dichiarate sui punti aperti; le carte attive sono ancora **fixture**, separate dai riferimenti originali. La vittoria di una sfida non conclude la partita. Non è ancora un playtest del regolamento ufficiale completo e non è stato raggiunto il sottoinsieme del 30%.

**Carte ufficiali giocabili: 0.** I 60 gruppi/riferimenti grafici in galleria e le 181 immagini conservate non sono carte abilitate né il denominatore di una percentuale. Il Boss geometrico è un segnaposto di prova.

La nuova pagina **Demoni** integra le 60 schede fornite dall'autore il 10 settembre, con ricerca, filtri, nomi, elementi, stelle, timing, note ed effetti preservati. I costi provengono esclusivamente dal JSON successivamente indicato: 39 associazioni certe, 19 nomi mancanti e 2 possibili alias da confermare. Queste schede sono consultabili; le loro abilità non sono ancora abilitate nelle partite. Elenco delle differenze in [docs/DEMON_COST_MATCHES.md](docs/DEMON_COST_MATCHES.md), audit degli effetti in [docs/DEMON_LIST_AUDIT.md](docs/DEMON_LIST_AUDIT.md).

## Avvio

Serve Node.js 22 o successivo e npm. Dalla cartella del progetto:

```powershell
npm ci
npm run build
npm start
```

Aprire **http://127.0.0.1:2567**. Se PowerShell blocca `npm.ps1`, usare `npm.cmd` al posto di `npm`.

Su Windows è disponibile anche `Avvia Demonicute.cmd`: installa le dipendenze se necessario, compila e avvia il server. Lasciare aperta la finestra durante la prova.

1. Scegliere il nickname in Profilo.
2. Creare una stanza scegliendo **Sfide TEST** oppure **Base**, 2–5 posti, visibilità e difficoltà dei bot. Riempire i posti liberi con bot o altri umani.
3. Ogni umano seleziona Pronto. L'host avvia il test quando tutti sono pronti.
4. Cliccare una carta per ingrandirla; usare i comandi esterni alla carta per evocare o attivare. Il turno termina con il comando dedicato, anche dopo aver consumato le due azioni.
5. Nel preset Sfide TEST usare il pannello delle sfide: dichiarare Boss o avversario/posta, rispondere alle eventuali finestre Spostastelle, impegnare carta e alternativa coperte, sostituire le cime desiderate e selezionare Pronto. Il perdente sceglie la cima da rimandare nel mazzo quando la posta lo richiede.
6. Il Boss si trova a sinistra del Limbo, in un cerchio con un pentagono rotante. Sono visibili orientamento, valori dei cinque lati e conteggi dettagliati. L'host può interrompere il test; il limite configurato termina la sessione senza vincitore della partita.

Per un secondo giocatore sullo stesso PC usare un altro profilo browser o una finestra privata. Due schede con lo stesso cookie rappresentano la stessa persona: la connessione più recente sostituisce quella precedente. Le stanze pubbliche sono ricercabili dal menu; le private richiedono il codice.

**Per giocare online senza account:** pubblicare il progetto su GitHub e collegarlo a un Web Service Render. È inclusa la configurazione [`render.yaml`](render.yaml); seguire la [guida GitHub e Render](docs/DEPLOY_RENDER.md). Basta aprire il link HTTPS, scegliere un nickname e condividere il codice della stanza privata. In lobby l'host può usare **Chiudi stanza** per chiudere il tavolo e riportare tutti al menu.

`npm run dev` compila il server e avvia Vite per il frontend. Le modifiche client si aggiornano tramite Vite; riavviare il comando dopo modifiche server/motore. Il canale di aggiornamento Vite usa la porta separata 24678, configurabile con `HMR_PORT`. `npm start` usa il frontend compilato se presente.

## Verifiche e simulazioni

```powershell
npm run typecheck
npm test
npm run build
npm run test:browser
npm run simulate -- --sessions 10 --players 3 --seed 42
npm run simulate -- --replay artifacts/simulations/session-0001.replay.json
npm run simulate -- --sessions 10 --players 3 --seed 42 --preset challenge-fixtures --max-turns 30 --out artifacts/simulations-challenges
npm run simulate -- --replay artifacts/simulations-challenges/session-0001.replay.json
npm run simulate -- --sessions 3 --players 3 --seed 42 --preset challenge-fixtures --reactions timeout --max-turns 12 --out artifacts/simulations-timeouts
```

`npm test` comprende test del motore e integrazione con un server locale dedicato e client indipendenti. Il server di test viene avviato/chiuso automaticamente. I test browser richiedono Chrome o un eseguibile Chromium indicato da `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; la configurazione prevista è in `playwright.config.ts`.

Verifiche 0.2.0: **84/84 test automatici**, typecheck e build superati; **8/8 test rete ripetuti** dopo il controllo `inputReady`; audit npm **0 vulnerabilità**. Browser finale: **9/9 superati** in circa 1,2 minuti, inclusi nuovo flusso Boss/duello, scelta coperta con rientro, posta mista, layout e assenza di sovrapposizioni. `npm start` 0.2.0 verificato localmente con health e preset disponibili. Playwright avvia per default un server dedicato su **2571**, con `NODE_ENV=test` e seed 42, distinto dal server ordinario su 2567; `TEST_BASE_URL` è un override esplicito per un server di test già preparato.

Batch verificati: Sfide TEST **300 sfide in 10 sessioni**, timeout **36 sfide e 30 scadenze virtuali in 3 sessioni**, Base **3.000 turni e 4.176 comandi in 10 sessioni**, tutti senza errori. La prima sessione di ciascun batch è stata riprodotta identicamente. Dettagli e limiti in [COVERAGE](docs/COVERAGE.md).

Il simulatore usa lo stesso motore delle stanze, senza browser né attese. Parametri: `--sessions`, `--players`, `--difficulty easy|medium|hard`, `--preset technical-fixtures|challenge-fixtures`, `--seed`, `--max-turns`, `--max-actions`, `--out`, `--reactions decide|timeout`. `timeout` fa avanzare il tempo virtuale fino alla scadenza delle sole reazioni facoltative. L’audit `--max-effects` misura eventi emessi per transizione (default 1 Base, 32 Sfide TEST), `--max-choices` attori con decisioni pendenti (0 Base, 5 Sfide TEST); sono limiti tecnici, non conteggi di effetti ufficiali. `max-actions` conta tutti i comandi accettati, inclusi preparazione e fine turno. Nelle stanze i limiti comandi sono 4 per turno configurato per Base, 40 per Sfide TEST.

Nella cartella `--out` vengono prodotti JSON/CSV/testo del batch e replay per ogni sessione. I report distinguono sfide dichiarate/rifiutate/deviate/interrotte, poste, rotazioni, modificatori, sostituzioni, stelle prima/dopo, esiti, Gemme e rimozioni. I replay formato 2 contengono seed, comandi, avanzamenti del tempo, versione/hash del codice, regole e catalogo: sono debug privato, non pubblicato dal server. Le versioni precedenti richiedono il codice con cui furono generate. I tempi misurano il calcolo, non la durata percepita online; le vittorie dei confronti sono separate dalla vittoria della partita e non attestano bilanciamento ufficiale.

## Regole e contenuti

Il preset Base conserva come proposte GDD: 2 azioni, 4 slot, Pile massimo 3, Limbo 5 e mano iniziale 5. Pesca singola, pagamento esatto con risorse generiche, limite mano 20, quantità dei mazzi e assenza di Famigli/Fato sono **fixture tecniche**, non decisioni dell'autore. Gli effetti E, A e P presenti sono esempi funzionanti. Sfide TEST aggiunge un setup di prova con due Pile da due Demoni e una Gemma per partecipante; usa mazzi e Boss sintetici descritti nelle convenzioni del tavolo e in `src/content/challenges.ts`.

Il conteggio elementale applica giallo > X > modifiche numeriche, per singolo Demone e con minimo zero. Gli effetti sono globali, il confronto riguarda i soli partecipanti. Le carte modificatore vengono scartate senza abilità principale. Una scelta coperta e la sua alternativa restano private anche dopo un rientro. Le sostituzioni avvengono nella stessa Pila, senza azioni né Entrata, e Pronto le blocca prima della risposta avversaria/Boss.

Restano da definire per il percorso ufficiale: riferimento delle stelle protette rispetto ai passivi, formula `−1 per Gemma` (bloccata), mazzo/formula della risposta Boss e dati dei lati, dettagli delle poste e dei pareggi, priorità/catene delle interruzioni. Le convenzioni TEST su questi punti non li trasformano in regole confermate. Il Boss geometrico ha cinque lati di prova; nessun valore o passivo di Ymir è stato dedotto da un’immagine mancante.

La cartella `esempi di carte` contiene il PDF Tributo, due JPEG e i nuovi originali in `DEMONICUTE 2026_SFIDE`: 90 carte PNG e il workbook Tributi. La galleria presenta 60 riferimenti con 181 immagini/varianti conservate, fonte e stato dell'implementazione. Per la nuova pagina Demoni prevalgono la lista incollata dall'autore e il JSON indicato per i soli costi, conservati in `docs/sources`. Non si usano immagini ufficiali per rappresentare effetti sintetici delle fixture.

Fonti, ambiguità, manifest e copertura sono in [docs/SOURCE_AUDIT.md](docs/SOURCE_AUDIT.md), [docs/RULES_MATRIX.md](docs/RULES_MATRIX.md) e [docs/COVERAGE.md](docs/COVERAGE.md). [Addendum 1](docs/addendum-1.md) prevale sui punti incompatibili della [specifica iniziale](docs/specification.md). I soli chiarimenti ancora necessari sono nell’[audit Addendum](docs/ADDENDUM_1_AUDIT.md); avanzamento in [PLAN.md](PLAN.md). Il vecchio `../demo` e i materiali originali non sono modificati.

## Architettura e sessioni

- `src/engine`: transizioni pure, RNG riproducibile e validazione atomica.
- `src/content`: catalogo, preset e asset, separati dal comportamento.
- `src/server`: Colyseus autoritativo, autenticazione, stanze, ritmo e viste filtrate.
- `src/client`: menu, tavolo, zoom e cronologia in italiano.
- `src/bots`: tre politiche che ricevono la sola vista del proprio posto.
- `src/simulator`: batch e replay senza grafica.

Il server usa un cookie casuale HttpOnly/SameSite Strict; l'ID pubblico e il nickname non consentono di occupare il posto altrui. Il rientro dopo refresh usa lo stesso cookie. Le sessioni scadono dopo 12 ore; lo stato è in memoria e non sopravvive al riavvio del server. Le stanze senza connessioni vengono eliminate dopo 30 minuti.

La disconnessione di un umano o dell'host sospende l'avanzamento. Il server aspetta la presentazione degli eventi a tutti prima della mossa successiva; un client in ritardo porta a una pausa esplicita. Non si sostituiscono automaticamente persone con bot. L'host può chiudere il test. Seed, ordine dei mazzi e mani avversarie non sono inviati nelle viste di rete.

Il clock delle reazioni conta solo tempo attivo, escludendo presentazione e pause. La finestra facoltativa dura 5 secondi; preparazione e scelta obbligatoria del perdente non scadono automaticamente. I bot decidono anche fuori turno dalla sola propria vista filtrata. I test di rete usano `NODE_ENV=test` e `DEMONICUTE_TEST_SEED=42` nel processo dedicato: questo seed non è accettato dalle API né usato in produzione.

## Server remoto

È incluso `render.yaml` per un Web Service Node con sito e WebSocket allo stesso indirizzo, una sola istanza e aggiornamenti manuali. La [guida di pubblicazione](docs/DEPLOY_RENDER.md) contiene i parametri già preparati. È disponibile anche un Dockerfile per un singolo processo; build e deployment Docker non sono stati verificati in questo ambiente. Nessuna distribuzione Internet è stata effettuata.

Configurare `HOST=0.0.0.0`, `PORT` e `NODE_ENV=production`. Su Render l'origine HTTPS viene letta automaticamente da `RENDER_EXTERNAL_URL`; altrove o con un dominio personalizzato impostare `PUBLIC_ORIGIN=https://nome-del-server`. Una configurazione di produzione priva di origine HTTPS valida interrompe l'avvio con un errore esplicito. Il server ascolta per default su `0.0.0.0` in produzione, su localhost negli altri ambienti. Client e API devono condividere l'origine; il proxy deve inoltrare anche WebSocket e cookie. In produzione avviare `node dist/runtime/src/server/index.js` dopo `npm ci --include=dev` e `npm run build`, oppure usare l'immagine Docker.

Per le prove coordinate non servono registrazione o database. **Riavvii e deploy cancellano sessioni e partite**; non abilitare repliche o autoscaling. Il piano Free di Render si sospende dopo 15 minuti senza traffico in ingresso; dettagli e fonte nella guida. Il recupero dopo refresh o disconnessione richiede lo stesso cookie non scaduto e la stessa istanza ancora attiva. Una prova locale non equivale a un deployment remoto verificato.

I controlli HTTP verificano il cookie e i permessi anche prima della prenotazione di un posto Colyseus. Limiti tecnici: 300 richieste API al minuto per sessione (prima del cookie, per indirizzo del collegamento), 30 tentativi matchmaking al minuto per sessione, corpo HTTP massimo 8 KiB e WebSocket massimo 16 KiB. I controlli di salute restano disponibili anche quando una sessione supera la quota. Non si usano header IP inviati dal browser per identificare i giocatori.

Le API Colyseus sono state confrontate con la [documentazione server](https://docs.colyseus.io/server), [autenticazione](https://docs.colyseus.io/auth/room) e [SDK](https://docs.colyseus.io/sdk). Le versioni esatte sono nel lockfile; gli override `nanoid` e `qs` mantengono le dipendenze transitive alle versioni corrette verificate con il progetto.
