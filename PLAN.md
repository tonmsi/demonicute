# Piano persistente

## Obiettivo
Alpha web multiplayer per playtest, 2–5 posti umani/bot. La bozza iniziale è integrata da `docs/addendum-1.md` (9 settembre 2026), che supera l’esclusione generale delle sfide e il pentagono ignorato; conserva i moduli esistenti e sviluppa percorsi completi con regole confermate e policy tecniche separate.

## 12 settembre 2026 — Multiplayer online, accessi e Render

- [x] Destinazione GitHub confermata: `https://github.com/tonmsi/demonicute.git`. Collegata la cronologia remota iniziale, contenente il solo README; file locali conservati. Esclusi dal push cache, build, segreti locali e archivio originale delle carte; immagini del sito e fonti autore incluse.
- [x] Verificati accesso anonimo, ruoli host/ospiti, stanze pubbliche/private, capacità, dati filtrati, comandi versionati e rientro. Il nickname non è una credenziale e non serve un account.
- [x] Corretti revoca del vecchio socket, conferma dopo rientro, ritorno al menu da connessione chiusa, annullamento tentativi superati e recupero di una nuova sessione senza reclamare il posto precedente. Aggiunta chiusura lobby esplicita per host.
- [x] Protetta prenotazione Colyseus prima del WebSocket con sessione/origine/permessi, limite 30 richieste/minuto per sessione e corpo massimo 8 KiB. API: 300 richieste/minuto per sessione, prima del cookie per indirizzo del collegamento; health fuori quota. Sono guardie tecniche, non regole di gioco.
- [x] Preparati `render.yaml`, `.node-version`, guida `docs/DEPLOY_RENDER.md`, origine automatica Render e validazione HTTPS in produzione; una sola istanza, partite in memoria e deploy manuali.
- [x] `npm ci` riuscito con audit 0 vulnerabilità. Typecheck e build superati; build ripetuta fuori sandbox per il blocco di lettura esbuild su Windows. `npm test`: 102/102 superati; poi rimossa dal test HTTP la dipendenza accidentale da una build frontend precedente e ripetuti compile e i 4 test HTTP con successo.
- [x] Simulatore richiesto: 10 sessioni, 3.000 turni, 4.176 comandi, 0 errori. `npm start` verificato su porta locale dedicata: health `ok`, HTML 200.
- [x] Browser: 13/13 superati, compresi 3 nuovi scenari accessi. Prima esecuzione con tutti i casi superati ma chiusura processi bloccata dalla sandbox Windows; ripetizione autorizzata completa: 13/13, exit 0. `.gitattributes` preserva i byte delle fonti autore anche su checkout Linux.
- [ ] Deploy Render effettivo e prova multiplayer sul link pubblico da dispositivi/reti distinti. Stato e sessioni si perdono al riavvio; rientro possibile solo con cookie valido (12 ore) e stanza ancora presente. Nessuna carta ufficiale abilitata da questo controllo.

## Integrazione della lista autore del 10 settembre 2026

- [x] Identificata la fonte aggiornata esplicitamente fornita dall'autore: 60 Demoni, 12 per elemento. Non usare come sostituti i 60 del JSON storico o i 70 Demoni/5 Famigli dell'Excel `DEMONI.xlsx` individuato nei Download.
- [x] Conservare copia byte-identica e dati strutturati con locatori, senza inferire costi dalla colonna delle note: 60 righe, 6 test dedicati superati.
- [x] Integrare il catalogo completo consultabile con ricerca, filtri e costi, mantenendo separati testi registrati ed effetti realmente attivi: 60 schede, nessuna abilità ancora abilitata.
- [ ] Integrare e verificare gli effetti definiti nel motore condiviso, con la disponibilità delle carte dichiarata per percorso.
- [x] Ricevuta fonte costi esplicita `G:/Il mio Drive/cutes/2026/demonlord/demoni.json`, copiata senza modificare l'originale. Confronto: 39 corrispondenze certe, 19 nomi mancanti e 2 possibili alias da confermare; nessun costo dedotto dalle stelle o dalle note.
- [ ] Completare i 19 costi mancanti e chiarire KUKEGEN/Keukegen, BELLETH/Beleth e i timing o testi alternativi individuati nell'audit.
- [x] Verificare interfaccia e regressioni dell'incremento catalogo 0.2.1: 96/96 test automatici (anche rete e simulatore), typecheck/build, avvio locale; 9/9 regressioni browser e nuova prova catalogo 1/1 superata dopo correzione del selettore nel test. Screenshot desktop/mobile verificati. Nessuna modifica al motore o nuovo batch attribuito ai Demoni; copertura e cronologia aggiornate.

## Incremento precedente: 0.2.0, Addendum 1

- [x] Letto e copiato integralmente l'Addendum; preservata la bozza storica, aggiornate precedenza e AGENTS.
- [x] Audit mirato GDD/costi/cime/passivi/poste/mazzo Boss e inventario dei file; `cutes`/`Demoni` e Ymir non identificati nei progetti. Locatori e sole dipendenze aperte in `docs/ADDENDUM_1_AUDIT.md`.
- [x] Aggiornati audit, matrice, copertura, manifest fonti e riferimenti asset; gruppi grafici non equivalenze fra pentagoni.
- [x] Integrare dati e fasi sfida, conteggio elementale confermato, impegni privati, swap senza azioni/E e controlli atomici; verificati nei test del motore.
- [x] Completare percorsi Boss/duello/Spostastelle/poste nel motore `challenge-fixtures`, con tutte le formule e policy aperte dichiarate; mantenuto il preset di base.
- [x] Collegare server, interfaccia, bot, tempo virtuale, report e replay allo stesso motore; Boss geometrico fixture a sinistra del Limbo.
- [x] Eseguire e registrare 84 test automatici, regressioni, privacy/rientro/rete, batch/replay, typecheck/build e audit dipendenze.
- [x] Ripetere i 5 test browser della base e verificare 3 layout Boss/Limbo a 3–5 posti, 1440 e 1100 pixel.
- [x] Concludere la prova browser del nuovo flusso Boss/duello con scelte coperte, rientro e posta mista: suite finale 9/9 superata, inclusi layout e assenza di sovrapposizioni.
- [ ] Integrare carte ufficiali solo con fonti e regole sufficienti, trascrivendo i pentagoni per variante; niente percentuale ufficiale derivata dalle fixture.

Verifiche correnti: **`npm test` 84/84 superati** (27 base, 23 sfide, 17 bot, 9 simulatore, 8 rete); **8/8 rete ripetuti** dopo il controllo server `inputReady`. Typecheck e build superati, audit npm 0 vulnerabilità; `npm start` 0.2.0 verificato su 2567 con health e preset disponibili. Browser finale: **9/9 superati in circa 1,2 minuti**, con 5 regressioni, 3 layout e il nuovo flusso completo. Server di test avviato e chiuso automaticamente, exit 0; ultimo CSS con controllo delle sovrapposizioni incluso. Playwright usa un server di test dedicato su 2571, seed 42 solo in `NODE_ENV=test`, evitando il server ordinario con seed casuale.

Batch verificati: Sfide TEST **10 sessioni, 300 turni, 1.941 comandi, 300 sfide** (194 Boss, 106 duelli), **0 errori**; timeout virtuali **3 sessioni, 36 turni, 258 comandi, 36 sfide, 30 scadenze**, **0 errori**; Base con il comando richiesto **10 sessioni, 3.000 turni, 4.176 comandi, 0 errori**. Replay della prima sessione di tutti e tre i batch identici dopo le correzioni del motore. Dettagli in `docs/COVERAGE.md` e `docs/CHANGELOG.md`.

Contenuto ufficiale: **0 carte giocabili**, nessuna percentuale del sottoinsieme attestabile; **60 gruppi/riferimenti grafici** e 181 immagini conservate sono consultazione. Boss geometrico, setup e policy tecniche non sostituiscono Demoni/Ymir mancanti né chiariscono le formule aperte. Docker e deployment Internet non testati.

## Base precedente conservata
Primo incremento tecnico eseguibile: menu, stanze, sessioni, tavolo, motore con fixture dichiarate, bot e simulatore. PDF, JPEG, 90 PNG e workbook Tributi auditati; galleria con 60 riferimenti e 181 varianti. Il catalogo Demoni e le decisioni di gioco aperte restano necessari al sottoinsieme ufficiale.

- [x] Audit GDD, matrice regole e conflitti; PDF/JPEG/PNG e workbook Tributi verificati.
- [x] Motore puro con transizioni atomiche, privacy, costi, Pile, seed e test sulle fixture.
- [x] Stanze Colyseus, profilo, accesso pubblico/privato e autorizzazioni verificati tra client SDK.
- [x] Menu frontend collegato alle stanze, profilo persistente e galleria originali.
- [x] Tavolo tecnico per 2–5 posti, zoom separato dai comandi, narrazione e ritmo.
- [x] Rientro tramite sessione server, pausa sulle disconnessioni; verificati SDK e refresh browser.
- [x] Tre politiche bot e simulatore batch con report/replay e CLI di riproduzione con controllo hash.
- [x] Verifica tra client indipendenti e layout, README e configurazione remota preparata (deployment non eseguito).
- [ ] Integrare foglio Demoni e regole ufficiali; definire denominatore e sottoinsieme circa 30% usando gli asset ricevuti.
- [ ] Integrare reazioni solo per carte con timing determinato; espansione progressiva degli effetti.

## Vincoli aperti
Numero pescate, dettaglio pagamento e limiti mano senza proposta univoca: non attivare come regole ufficiali. Fixture separate per i test tecnici. Sfide autorizzate dall’Addendum per percorsi completi; formula Boss/riferimento stelle, dettagli poste e catene ancora aperti, isolati nel preset tecnico. Nessuna vittoria di partita inventata. Nessuna pubblicazione esterna prevista in questo incremento.

## Verifiche della base precedente all’Addendum
`npm test`: 33/33 superati (27 motore, 6 rete). `npm run test:browser`: 5/5 superati, inclusi due browser indipendenti con bot, mosse reali, zoom, refresh, ordine ciclico dei posti, tavoli 2–5 e ridimensionamento a 1100×850. Mano da 20 carte verificata con fixture DOM soltanto grafica. Due prove browser superate anche in modalità Vite dopo separazione del socket HMR. Typecheck e build produzione superati. Batch: 10 sessioni, 3.000 turni, 4.176 comandi, 0 errori; replay sessione 1: 423 comandi e 735 eventi identici. `npm audit`: 0 vulnerabilità al controllo; riconfermato `--omit=dev`. Nessun test o deployment Docker/Internet eseguito.
