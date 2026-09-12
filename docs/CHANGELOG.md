# Cronologia dell'incremento

Le voci seguenti conservano le decisioni e i risultati al momento di ciascun incremento. Dal nuovo Addendum 1 sono superate le precedenti esclusioni generali delle sfide e del pentagono; la nuova fase è registrata in fondo, senza riscrivere i risultati storici.

## 9 settembre 2026 — Audit fonti e base tecnica in sviluppo

Avviato il nuovo progetto in `demo_due`; il prototipo `../demo` e il GDD originale rimangono riferimenti in sola lettura. La specifica richiede un'alpha multiplayer senza sfide Boss e senza duelli fra Magisti. Le due capacità restano separate; nessuna vittoria alternativa è autorizzata.

Completata la lettura della specifica e del GDD `Demonicute_GDD_Living_Document_v0_1_2.docx`, identificato dal nome del file anche se l'intestazione interna riporta 0.1. Aggiunti estrazione completa con locatori, inventario delle fonti, matrice di regole/conflitti e stato della copertura. Il catalogo ufficiale non è stato importato: Excel `Demoni`, PDF Tributo e immagini originali non sono stati trovati nelle due cartelle di progetto e i percorsi sono stati richiesti all'autore.

Scelte esplicite per il preset provvisorio: 2 azioni, 4 slot, massimo 3 carte per Pila, Limbo 5 e mano iniziale 5 dalle proposte GDD. Le fixture tecniche aggiungono pesca 1, sole risorse generiche unitarie con pagamento esatto, limite mano 20 e assenza di Famigli/Fato/Gemme/riciclo. Nessuna di queste fixture conta nel circa 30% ufficiale. Denominatore: non disponibile; tipi ufficiali implementati e verificati: 0.

Sospesi i comportamenti non determinati di Famigli, blocco/sonno/risveglio, magie/manufatti in conflitto, reazioni e catene. Cinque secondi rimane la configurazione iniziale richiesta per future reazioni supportate. Scoprire una carta sotto la cima non produce automaticamente una nuova Entrata.

Verifiche realmente eseguite per l'audit:

- Estrattore `docs/sources/extract_gdd.py` eseguito con `C:/Users/tomma/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`: 1.346 paragrafi del corpo estratti su 1.346 presenti, 53 tabelle su 53; 1.352 paragrafi incluse parti aggiuntive, nessuna immagine incorporata, nessuna revisione tracciata. Hash SHA-256 del DOCX in `docs/sources/gdd-extraction.json`.
- Lettura integrale di tutti i paragrafi estratti e di `docs/specification.md`; nessun rendering o modifica del DOCX.
- Verifica dei 61 collegamenti/locatori nei quattro documenti di audit: nessun file o ancoraggio mancante. Hash di GDD e copia della specifica ricontrollati contro `docs/sources/manifest.json`.
- `python -B main.py` in `../demo`: errore BOM su `game/imprevisti.json` riprodotto. Correzione del lettore soltanto in memoria: `AttributeError` per il primo handler imprevisto mancante; AST conferma dodici riferimenti a metodi inesistenti. Gli originali non sono stati modificati.

In questa prima fase motore, server, interfaccia, bot e simulatore erano sviluppati in parallelo; typecheck, test applicativi, build, batch e prove browser non erano ancora attestati. Gli esiti successivi sono registrati nelle voci seguenti. Una prova localhost non attesta un deployment Internet.

Aggiornamento tecnico durante l'integrazione: Colyseus core 0.18.12, trasporto WebSocket 0.18.2 e SDK 0.18.2 sostituiscono la selezione iniziale 0.16 prima dell'avvio, per evitare dipendenze obsolete. Il coordinatore ha verificato le API nella documentazione ufficiale Colyseus. Runtime Node >=22 e TypeScript compilato con `tsc` in `dist/runtime`; frontend Vite. L'esecuzione diretta con `tsx` è stata sostituita dalla compilazione e da Node per un'incompatibilità di `os.userInfo` nella sandbox Windows.

## 9 settembre 2026 — Fonti grafiche ricevute e test tecnici superati

L'autore ha aggiunto `esempi di carte/`, con il PDF `90 X CARTE TRIBUTO_STAMPA A4_08 09 2026.pdf` e due JPEG WhatsApp. Aggiornati audit, matrice, copertura e manifest fonti con disponibilità e hash. Lettura/estrazione PDF e controllo delle immagini sono assegnati all'audit asset, che aggiorna `docs/CARD_ASSETS.md`; nessuna estrazione PDF duplicata è stata effettuata dall'agente documentazione. I nuovi asset sono riferimenti in galleria, non carte con comportamenti abilitati. L'Excel `Demoni` manca ancora e nessun tipo ufficiale è conteggiato come implementato.

L'agente asset ha identificato visivamente i due JPEG: `08.56.26` è `Succo di demone`, manufatto A con dipendenze da Tributo e risveglio; `08.56.51` è `Venerare altri`, magia P legata alle sfide Boss. Entrambi sono leggibili a 744×1039. Dopo l'aggiornamento sono stati ricontrollati 61 link/locatori e 5 hash sorgente (GDD, specifica, PDF, due JPEG), senza errori.

Verifiche effettivamente eseguite dal coordinatore e dall'agente motore, con report consultati nel workspace:

- `npm test`: **30/30 test superati**, di cui 27 motore e 3 integrazione su server reale avviato. Coprono costi/Pile, fixture E/A/P, legalità e conservazione, privacy/idempotenza/seed/replay, sessioni/cookie, due client SDK indipendenti, impersonificazione, sfide disabilitate, comandi obsoleti/duplicati, pausa/rientro, HTTP/origine e stanze per 2–5 bot. Il rientro SDK non è una prova browser di refresh.
- `npm run simulate -- --sessions 10 --players 3 --seed 42`: **10 sessioni**, **3.000 turni**, **4.176 comandi**, **360 evocazioni**, **240 impilamenti**, **0 errori** e **0 scelte pendenti problematiche**. Tempo di calcolo registrato: **6.280,57 ms**. Report JSON/CSV/testo e replay in `artifacts/simulations`. Tutte le sessioni terminano per limite tecnico; nessun vincitore o pareggio, nessuna conclusione sul bilanciamento ufficiale o sulla durata online.
- `npm audit`: **0 vulnerabilità** al controllo del coordinatore, con override `nanoid` 3.3.18 e `qs` 6.16.0 nel manifest delle dipendenze.

Build del frontend e prove browser/visive non sono ancora state eseguite al momento di questo aggiornamento. L'integrazione grafica dei riferimenti originali resta distinta dal collaudo del motore e dalla futura abilitazione delle carte reali.

## 9 settembre 2026 — Workbook Tributi e originali PNG ricevuti

Ricevuta `esempi di carte/DEMONICUTE 2026_SFIDE`, con il workbook `TRIBUTI AGGIORNAMENTO SFIDE.xlsx` e asset originali. Letto il workbook integralmente con la skill Spreadsheets e il Python bundled, senza modificarlo: un solo foglio visibile `Foglio1`, 269 celle non vuote in A1:V35, nessun foglio `Demoni`, nessuna formula o errore di cella memorizzato, drawing XML vuoto e nessuna immagine incorporata. Estrazione completa con coordinate in `docs/sources/tributes-extracted.md` e `.json`, script riproducibile `extract_tributes.py`, hash sorgente conservato.

Verifica indipendente sull'XML del workbook: 269 celle con valori contro 269 estratte. Ricontrollati 67 collegamenti/locatori dei documenti e 6 hash sorgente, senza errori. Il workbook originale conserva il medesimo SHA-256 dopo l'estrazione.

La tabella titola «75x CARTE SFIDA» e contiene 55 combinazioni in griglie elemento, 9 manufatti nominati più un segnaposto e 10 pergamene segnaposto. Non contiene testi delle abilità o definizioni generali di pesca, pagamento, mano o risveglio. Conservate senza fusione le varianti `VENTO`/Aria e `kit goezia`/Kit Goetia, le alternative numeriche e `M11=2` rispetto ai simboli `§` degli altri blocchi. Nessuna interpretazione meccanica della cartella SFIDE è stata attivata: Boss e duelli restano disabilitati, nessuna vittoria alternativa.

L'agente asset ha verificato 90 carte PNG originali 744×1039, con 89 corrispondenze al PDF e il nuovo Amuleto protettivo. Galleria aggiornata a 60 riferimenti e 181 file carta conservati; testo ed effetto di Amuleto restano un riferimento senza comportamento attivo. Il nome file `15_PSICACOGIA.png` chiude il dubbio sul titolo Psicacogia. Una nuova ispezione dell'originale conferma integri i simboli di `1,2,3... Stella!`: il dubbio precedente derivava dall'anteprima e non è un difetto della fonte. Font e logo sono asset di presentazione. Dettagli e verifiche in `docs/CARD_ASSETS.md`, mantenuto dall'agente asset.

Verifiche tecniche aggiornate comunicate dal coordinatore:

- **33 test superati**: 27 motore e 6 rete. Aggiunti casi per gate di presentazione, disconnessione dell'host osservatore, rimozione esplicita di un umano assente dalla lobby, limite anche sui messaggi sconosciuti e creazione di nuovi test dopo tre conclusi. Il limite globale di 100 stanze conservate resta una guardia di memoria intenzionale, distinta dalla quota per host; cleanup delle stanze vuote dopo 30 minuti.
- Batch rigenerato con `npm run simulate -- --sessions 10 --players 3 --seed 42`: **10 sessioni, 3.000 turni, 4.176 comandi, 360 evocazioni, 240 impilamenti, 0 errori**, tempo registrato **8.343,46 ms**. Report/replay correnti in `artifacts/simulations`.
- `npm run simulate -- --replay artifacts/simulations/session-0001.replay.json`: **423 comandi e 735 eventi identici**, hash del codice verificato dalla CLI. Vincitore non applicabile; i dati non misurano bilanciamento complessivo o durata percepita online.

Aggiornati audit, matrice e copertura con fonti nuove e un elenco separato dei chiarimenti già chiusi e ancora necessari al primo sottoinsieme ufficiale. `cutes 26-07-12.xlsx`/`Demoni` resta mancante. Nessuna carta reale è stata abilitata o accreditata al 30% grazie alla sola aggiunta del workbook o degli asset. Build e prove browser restano da attestare con i risultati effettivi dell'integrazione.

## 9 settembre 2026 — Verifica finale della base tecnica locale

Completata l'integrazione del frontend con il server e il motore delle fixture. Il tavolo mantiene l'ordine ciclico dei posti anche dalla vista dell'ospite, mostra gli slot 1–4, offre una mano scorrevole e una narrazione fissa durante lo scorrimento. La galleria presenta 60 riferimenti originali con zoom, separati dalle carte giocabili di prova. Corretta l'interferenza del WebSocket HMR di Vite con la connessione di gioco: in sviluppo HMR usa una porta separata configurabile, inizialmente 24678.

Esiti finali confermati dal coordinatore:

- **Typecheck e build di produzione superati.**
- **33/33 test motore e rete superati in un'unica esecuzione**, comprendenti i 27 test del motore e i 6 di integrazione server.
- **Audit delle dipendenze di produzione: 0 vulnerabilità.**
- **Modalità sviluppo: 2/2 test browser superati in 35,7 s.** Verificati menu, profilo, galleria e una sessione con due browser indipendenti più bot, mosse reali e refresh/rientro.
- **Suite finale sulla build di produzione: 5/5 test browser superati in 47,7 s.** Verificati due browser indipendenti con bot, comandi reali di pesca/evocazione/fine turno/stop, refresh con lo stesso stato e la stessa mano, ordine ciclico dei posti anche per l'ospite, zoom degli originali, tavoli con 2–5 posti, viewport 1100×850 e Limbo espanso. Lo screenshot della galleria è stato acquisito con immagini caricate e ispezionato.
- **Stress grafico della mano:** venti carte inserite soltanto nel DOM per verificare scorrimento e raggiungibilità della prima e dell'ultima. Questa prova non modifica lo stato del motore e non aggiunge copertura regolamentare o di effetti.

Restano validi gli esiti del batch rigenerato e del replay CLI nella voce precedente. Docker e deployment Internet non sono stati testati. Il risultato verificato è una base tecnica locale con fixture e galleria originale: `cutes`/`Demoni` manca ancora, i comportamenti ufficiali non sono abilitati, il denominatore del 30% resta N/D ed entrambe le sfide rimangono disabilitate.

Ultimo ritocco di presentazione: le anteprime originali nella home conservano il rapporto 744×1039 con immagine interamente visibile; dallo zoom sono stati rimossi gli ID di pagamento e gli identificativi locali. **Build rieseguita con successo** e **test browser menu/profilo/galleria ripetuto: 1/1 in 9,0 s**. Il coordinatore ha ispezionato gli screenshot di home, galleria con immagini caricate, zoom, tavolo a 5 posti a 1100×850, mano con 20 carte DOM e vista dell'ospite. **Controllo finale `/api/health` riuscito.** Nessuna nuova regola o copertura di effetti deriva da questi ritocchi grafici.

## 9 settembre 2026 — Addendum 1, nuova fase delle sfide

Ricevuta richiesta esplicita dell'autore nell'allegato `pasted-text.txt`; letta integralmente e copiata senza modifiche in `docs/addendum-1.md`. SHA-256 della copia e dell'originale: `f0040c036f2684829f54868f27461f19775f108c192806d3c0694fdf57d6d781`. La specifica conserva la bozza iniziale e aggiunge la precedenza dell'Addendum; una copia byte per byte della bozza è in `docs/sources/base-specification-v1.md`, SHA-256 `8bfcd1666995a9b6c186c11426a1a39ca92481a4bd5cd2265af4315c852e3382`. AGENTS e PLAN sono allineati; le versioni precedenti degli audit e del piano sono preservate in `docs/history/pre-addendum-1/`.

L'Addendum supera l'esclusione generale delle sfide, il pentagono ignorato, i pentagoni Boss aperti agli spettatori, il duello tramite elementi che si battono e il trasferimento necessario del Demone perso al vincitore. Conferma modificatori globali per Demone, minimo 0, giallo > X > numerici, impegni coperti limitati ai coinvolti, sostituzioni in più Pile gratuite e senza E, posta 1–2 gerarchica/mista e cima scelta dal perdente, modalità alternative dello Spostastelle e nuovo ordine Boss con possibile rotazione anche dalla risposta. La parità Boss non assegna Gemma; non chiude pareggio Magisti o altre conseguenze.

Completato l'audit mirato `docs/ADDENDUM_1_AUDIT.md`, con locatori: costo 1 azione GDD P0377/P0380 ancora provvisorio; cime P0538–45/P0613/P0619; passivi P0717–25 senza formula del riferimento protetto; fondo mazzo P0507 suggerito, non conferma della risoluzione posta; mazzo Boss P0311–13/P0643 distinto dalla nuova pescata di risposta, non determinata; vecchio timing P0700–06 e duello P1291–98 superati. Il nome Ymir non compare nell'estratto GDD, che non contiene media. La ricerca per nome file nelle due cartelle di progetto non identifica `cutes`/`Demoni` o asset Ymir/Boss; i JSON storici non diventano fonti normative. Il workbook Tributi disponibile ha soltanto `Foglio1`, già letto integralmente nella fase precedente.

Aggiornati SOURCE_AUDIT, RULES_MATRIX, COVERAGE, CARD_ASSETS e manifest fonti. I riferimenti originali passano alle descrizioni `original-references-3` del coordinatore, mantenendo **60 riferimenti e 181 immagini**: i 25 gruppi grafici risorsa non equivalgono meccanicamente alle varianti dei pentagoni. Nessuna nuova estrazione o modifica degli originali, nessun effetto ufficiale abilitato, denominatore ufficiale N/D e tipi ufficiali 0.

In sviluppo il preset separato `challenge-fixtures`, preservando il preset base. Sono state lette e documentate le convenzioni in `CHALLENGE_POLICY`/`CHALLENGE_BLOCKERS`: riferimento stelle, priorità/limite Spostastelle, nessun modificatore facoltativo, mazzo/formula Boss sintetici, Gemme generiche e dettagli delle poste. Queste policy non chiudono le regole ancora aperte; −1 per Gemma ha un blocco specifico. Motore, UI, rete, bot e report saranno verificati sui percorsi effettivi. **Nessun nuovo risultato di test applicativi è attestato da questa voce**; i successi precedenti sopra restano lo storico della base, non copertura dell'Addendum.

Verifica documentale eseguita con il Python bundled e `docs/sources/verify_addendum_docs.py`: **116 collegamenti/locatori e 8 hash sorgente controllati, nessun errore**. Confermate identità byte per byte dell'Addendum con l'allegato e conservazione integrale del testo della bozza nella specifica corrente. Questa verifica riguarda documenti e fonti, non l'esecuzione del nuovo modulo.

## 9 settembre 2026 — Motore sfide e correzioni della review

Il motore condiviso implementa i percorsi `challenge-fixtures` con fasi, conteggio elementale, scelte coperte, sostituzioni, Spostastelle, Boss e risoluzione poste; formule aperte conservate nelle policy tecniche. L'agente motore ha inizialmente verificato 20 test sfide e 27 regressioni. La review ha riprodotto due casi e li ha corretti con regressioni aggiuntive:

- Un ID giocatore legale `boss` collideva con la ricerca della risposta tramite `actorId`, causando errore con modificatore nullo. Il motore mantiene ora un riferimento diretto alla carta Boss; le rivelazioni aggiungono `source: 'player' | 'boss'`, senza riservare nomi o falsificare il vincitore. Testati impegno nullo e reale con risposta Spostastelle e conservazione inventario.
- Rifiuto/deviazione potevano scartare lo Spostastelle senza pescare quando il mazzo era esaurito. La legalità richiede ora la pescata disponibile, evita finestre inutili e respinge i comandi atomicamente. Verificati anche mano a 20 carte, che libera lo spazio scartando, e rotazione Boss valida a mazzo pesca vuoto.
- Il conteggio globale corretto dal coordinatore include tutti i Magisti nei dettagli pubblici, mantenendo il confronto tramite gli ID dei partecipanti. La regressione verifica due duellanti, uno spettatore con più stelle di entrambi e le viste dei tre più un osservatore esterno.

Verifiche realmente eseguite dopo le correzioni: **`npm run compile` superato**; **`node --test dist/runtime/tests/challenges.test.js dist/runtime/tests/engine.test.js`: 50/50 superati**, 23 sfide e 27 regressioni, circa 1.004 ms. Nessuna prova di rete è stata eseguita dall'agente review durante l'integrazione. Le correzioni dell'interfaccia, il clock server, il batch e le prove finali saranno attestati separatamente; questi test non abilitano carte ufficiali né chiudono le formule aperte.

## 10 settembre 2026 — Integrazione e verifiche 0.2.0

Collegati allo stesso motore server, interfaccia, tre politiche bot e simulatore formato 2. Il preset Base è preservato; Sfide TEST offre dichiarazione Boss/duello, impegni coperti, sostituzioni, Spostastelle, confronto e poste secondo policy tecniche visibili. Il Boss geometrico a cinque lati è a sinistra del Limbo, dentro il cerchio/pentagono con orientamento, valori e dettagli: è una fixture dichiarata, senza immagine o passivo Ymir inventato.

Il clock server conta soltanto tempo attivo delle reazioni facoltative, escludendo presentazione e disconnessioni; gli ack ripetuti non prolungano il timer. Il controllo `inputReady` impedisce invii prima che la presentazione sia completata. La preparazione e la scelta obbligatoria della cima non hanno una scadenza automatica. I bot reagiscono fuori turno dalla propria vista filtrata, valutano i modificatori con il conteggio condiviso e terminano le sostituzioni senza cicli. La provenienza delle rivelazioni distingue giocatore e Boss anche quando un ID giocatore è `boss`; il titolo del risultato Boss non dipende da un ID giocatore fittizio.

File e moduli interessati nell'incremento:

- Motore: `src/engine/challenges.ts` e `src/engine/index.ts`, per fasi, conteggio, impegni, poste, viste e tempo.
- Contenuti: `src/content/catalog.ts`, `challenges.ts`, `original-assets.ts` e `src/client/public/cards/manifest.json`; preset tecnici e descrizioni aggiornati, originali conservati.
- Protocollo/rete: `src/shared/game.ts`, `protocol.ts`, `src/server/room.ts` e `index.ts`; dati sfida, riservatezza, clock e disponibilità dei comandi.
- Interfaccia: `src/client/main.ts`, `style.css`, `challenge-ui.ts`; selezione preset, Boss geometrico, comandi sfida, conteggi e correzioni del narratore.
- Bot/simulatore: `src/bots/index.ts`, `src/simulator/index.ts`; politiche, tempo virtuale, report e replay formato 2.
- Verifiche: `tests/challenges.test.ts`, `challenge-bots.test.ts`, `challenge-simulator.test.ts`, `network.test.ts`, `browser.spec.ts`, `challenge-browser.spec.ts` e `playwright.config.ts`.
- Documentazione: `AGENTS.md`, `PLAN.md`, `README.md`, specifica/Addendum, audit/matrice/copertura/cronologia e `docs/sources/manifest.json`, con fonti e storico preservati.
- Versione progetto 0.2.0 nei manifest npm `package.json` e `package-lock.json`.

Esiti effettivi comunicati dal coordinatore:

- **`npm test`: 84/84 superati**, 27 base + 23 sfide + 17 bot + 9 simulatore + 8 rete. Le 17 prove bot comprendono 2–5 posti per tre difficoltà, ripetizione deterministica e verifiche mirate su scelte, privacy, modificatori, sostituzioni e perdite.
- **8/8 test rete ripetuti con successo** dopo il controllo `inputReady`, inclusi rientro durante impegni coperti, duplicati, equivalenza motore/headless e clock durante presentazione/disconnessione.
- **Typecheck superato; build 0.2.0 nuovamente superata** dopo gli ultimi controlli UI/server. **Audit npm: 0 vulnerabilità.**
- **Browser: 5/5 regressioni superate**, per menu/profilo/galleria, due browser e bot, mosse/refresh e tavoli Base; **3/3 layout Boss/Limbo superati**, con 3–5 posti a 1440 e 1100 pixel.
- **Suite browser finale: `npm.cmd run test:browser`, 9/9 superati in circa 1,2 minuti, exit 0.** Include il nuovo flusso completo Boss/duello: rotazione reale e lato DOM, impegno Fuoco coperto con reload, sostituzioni multiple e duello 8 contro 7 con posta 2 mista, Gemma e cima scelta dal perdente. Una prima prova mirata era passata in 37,6 secondi; la suite finale comprende l’ultimo CSS e il controllo delle sovrapposizioni del narratore. Playwright avvia e chiude automaticamente il processo dedicato su 2571, NODE_ENV=test e seed 42, distinto dal server ordinario con seed casuale.
- **npm start 0.2.0 verificato** su 2567: health riuscito, preset disponibili e frontend locale servito correttamente.

Batch eseguiti dal coordinatore; report JSON/testo letti per conferma dall'agente documentazione:

| Comando | Risultato |
| --- | --- |
| `npm run simulate -- --sessions 10 --players 3 --seed 42 --preset challenge-fixtures --max-turns 30 --out artifacts/simulations-challenges` | 10 sessioni, 300 turni, 1.941 comandi, 300 sfide: 194 Boss e 106 duelli. 11 deviazioni, 47 rotazioni, 81 sostituzioni, 119 Gemme ottenute, 47 Gemme trasferite, 35 carte mano trasferite e 71 cime rimosse. 0 errori e 0 scelte pendenti problematiche; circa 7.140 ms di calcolo. |
| `npm run simulate -- --sessions 3 --players 3 --seed 42 --preset challenge-fixtures --reactions timeout --max-turns 12 --out artifacts/simulations-timeouts` | 3 sessioni, 36 turni, 258 comandi, 36 sfide, 30 scadenze facoltative virtuali. 0 errori e 0 scelte pendenti problematiche; circa 775 ms di calcolo. |
| `npm run simulate -- --sessions 10 --players 3 --seed 42` | 10 sessioni Base, 3.000 turni, 4.176 comandi, 360 evocazioni, 240 impilamenti, 0 errori. 2.406 turni senza azioni legali nel preset con mazzi finiti/Pile piene. |

Riprodotta identicamente la **prima sessione di ciascuno dei tre batch** con `--replay`, dopo le ultime correzioni del motore. I replay formato 2 comprendono comandi, avanzamenti del tempo e stop, verificano hash/versioni, eventi, cronologia, metriche e stato; rimangono debug locale riservato. I limiti di audit misurano eventi per transizione e attori con scelte pendenti, non effetti ufficiali. Il tempo virtuale non misura la durata percepita online e le sessioni terminano per limite tecnico, senza vincitore della partita. Il batch sfide non registra rifiuti: quel percorso è attestato dai test mirati, non dai conteggi batch.

Aggiornati README, PLAN e COVERAGE. **Carte ufficiali giocabili: 0; nessuna percentuale del sottoinsieme attestata.** La galleria conserva 60 gruppi/riferimenti grafici e 181 immagini originali, con varianti dei pentagoni non equivalenti meccanicamente. `cutes`/`Demoni` e Ymir ufficiale rimangono mancanti nelle fonti identificate; riferimento stelle/passivi, −1 per Gemma, mazzo/formula Boss, dettagli poste/pareggi e catene restano aperti per il regolamento ufficiale. L'Addendum originale resta datato 9 settembre e non è stato modificato. Docker e deployment Internet non testati.

QA documentale finale: **119 collegamenti/locatori nei documenti di audit, altri 8 collegamenti locali in README/PLAN e 8 hash sorgente verificati, nessun errore**. Addendum identico byte per byte all'allegato e bozza iniziale integralmente conservata. La matrice A1 è allineata ai percorsi e alle verifiche 0.2.0; nessuna voce browser corrente rimane pendente. Il server ordinario 0.2.0 su 2567 risponde al controllo health finale.

## 10 settembre 2026 — Catalogo Demoni e costi 0.2.1

L'autore ha chiesto di integrare la lista incollata di 60 Demoni, quindi ha indicato `G:/Il mio Drive/cutes/2026/demonlord/demoni.json` per i soli costi e ha chiesto quali nomi manchino. Le nuove fonti sono conservate in `docs/sources`: TSV byte-identico all'allegato, JSON estratto del TSV e copia del JSON dei costi. La lista nuova resta prevalente per nomi, elementi, stelle, timing, note ed effetti. Nessun testo, livello, elemento o quantità del JSON dei costi sostituisce i dati aggiornati.

Il catalogo `src/content/author-demons.ts` contiene 60 righe distinte, 12 per elemento, con 12 timing irrisolti preservati. Il modulo separato `author-demon-costs.ts` associa costo, tipo e minimo elementale per nome certo: **39 corrispondenze**, **19 nomi mancanti**, **2 possibili alias non applicati** (KUKEGEN/Keukegen e BELLETH/Beleth). BELZEBU/Belzebu' è una normalizzazione di apostrofo; il costo zero di Keukegen è conservato nella fonte e non attribuito automaticamente a KUKEGEN. Le colonne delle note e le stelle non generano costi.

Interfaccia in `src/client/author-demons-ui.ts`, collegata da `main.ts` con stili in `style.css`: pagina Demoni con ricerca, filtri e schede complete, stato di ogni costo e separazione fra testo registrato e abilità realmente disponibile. Nessun nuovo preset o effetto dei Demoni è abilitato in questo incremento del catalogo; Base e Sfide TEST continuano a usare i contenuti di prova. Non aumenta la copertura meccanica ufficiale. Audit per carta in `DEMON_LIST_AUDIT.md`, abbinamenti completi in `DEMON_COST_MATCHES.md`; aggiornati precedenza, manifest, README, PLAN e copertura.

Verifiche completate: **6/6 test della lista**, **6/6 test dei costi**, poi **`npm test` 96/96 superati** in circa 22,6 secondi, incluse le precedenti regressioni del motore, bot, simulatore e rete. **Typecheck e build superati**. **`npm start` 0.2.1 verificato** su 2567: health con 60 Demoni registrati, 39 costi associati, 19 nomi assenti, 2 alias pendenti e 0 giocabili; entrambi i preset tecnici disponibili. Audit documentale: **159 collegamenti/locatori e 10 hash verificati**; lista autore e Addendum identici agli allegati, bozza iniziale conservata.

Browser: la prima suite completa ha superato **9/9 regressioni** e rilevato un selettore non corrispondente nel nuovo test del catalogo. Corretto il test usando il ruolo accessibile dei due menu a tendina; nessuna modifica all'applicazione necessaria. Ripetuto `npm.cmd run test:browser -- tests/author-demons-browser.spec.ts`: **1/1 superato in 5,6 secondi, exit 0**. Tutti i 10 casi sono quindi verificati nei due passaggi. Il nuovo caso controlla fedeltà dei 60 testi e note, conteggi dei costi, filtri, ricerca senza perdita del focus, distinzione LEPRECAUNO/LEPRECHAUN, costo SELKIE, alias KUKEGEN senza costo inventato, nota alternativa STOLAS, mobile 390 pixel senza overflow e galleria originale da 60 riferimenti. Ispezionati `artifacts/browser/author-demons-desktop.png` e `author-demons-mobile.png`: testi leggibili, controlli visibili e nessuna sovrapposizione. Server Playwright dedicato avviato e chiuso automaticamente; server ordinario 0.2.1 lasciato disponibile su 2567.

## 12 settembre 2026 — Accesso online senza account e GitHub/Render

Audit e correzioni del multiplayer per la pubblicazione sul repository indicato dall'autore, `tonmsi/demonicute`. Il nickname rimane un nome visualizzato; l'identità usa una sessione casuale server e cookie HttpOnly/SameSite Strict, Secure in produzione. Nessuna registrazione con password aggiunta.

Corretto il passaggio tra finestre: il socket precedente perde subito tutti i permessi e il nuovo conferma la presentazione anche se la versione del gioco non cambia. Il rientro non resta bloccato; la chiusura tardiva del vecchio socket non scollega il nuovo. Il client annulla tentativi superati, torna al menu anche da socket già chiuso, aggiorna la sessione prima di creare/entrare e dimentica il vecchio posto quando cambia identità. In lobby l'host può chiudere la stanza; gli ospiti tornano al menu senza ritentare l'ingresso.

Gli endpoint matchmaking Colyseus sono protetti nel loro router, prima della prenotazione: cookie, origine, ammissione, solo ingresso per ID, 30 tentativi al minuto per sessione e corpo massimo 8 KiB anche se trasmesso a blocchi. Restano le verifiche WebSocket. Le API hanno quota di 300 richieste al minuto per sessione; prima del cookie si usa l'indirizzo del collegamento, senza fidarsi di header IP del client. Health è fuori quota, così un browser troppo attivo non causa falsi guasti. Sono limiti tecnici, dichiarati nel README.

Preparati `render.yaml` per un Web Service Node, `.node-version` e `docs/DEPLOY_RENDER.md`; la produzione legge `RENDER_EXTERNAL_URL` se non viene impostata `PUBLIC_ORIGIN`. Origine HTTPS non valida: avvio interrotto con errore esplicito. Configurati un solo processo/istanza, build con dipendenze di sviluppo e deploy manuali. Git/Docker escludono cache, artefatti, credenziali locali e archivio originale delle carte; restano immagini pubbliche e fonti TSV/JSON autorizzate. `.gitattributes` protegge i byte delle fonti dal cambio automatico di fine riga Windows/Linux. Fonti Render primarie citate nella guida; build Docker e deploy Internet non eseguiti.

Verifiche eseguite su Windows/Node 24.13.0:

- `npm ci` riuscito, audit 0 vulnerabilità. Typecheck e build produzione superati; build ripetuta con autorizzazione fuori sandbox per un blocco di lettura esbuild.
- `npm test`: **102/102**, inclusi 4 nuovi test HTTP e 2 fixture socket. Rimossa poi un'asserzione del test HTTP che richiedeva la build frontend prima di `npm test`; compile e 4/4 test HTTP ripetuti con successo.
- Browser: **13/13 superati**. Il primo passaggio ha completato i casi ma la sandbox Windows ha bloccato la chiusura dei processi. Chiusi soltanto i processi di prova e ripetuta la suite con autorizzazione: **13/13, exit 0**, circa 1,7 minuti. Tre nuovi casi coprono passaggio/rientro tra finestre, chiusura lobby con ospite, perdita cookie e nuovo accesso senza appropriazione del vecchio posto.
- `npm start`: health `ok` e pagina HTML 200 su porta dedicata, server poi chiuso. Simulatore richiesto: **10 sessioni, 3.000 turni, 4.176 comandi, 0 errori**, senza vincitore della partita; report in `artifacts/simulations`.

Restano espliciti: stato in memoria, cookie valido 12 ore, stanze vuote eliminate dopo 30 minuti, perdita delle partite a ogni riavvio/deploy e sospensione per inattività del piano Render Free. Resta da provare il link pubblico con due dispositivi. L'audit non abilita effetti ufficiali né modifica le fonti o le regole del gioco.
