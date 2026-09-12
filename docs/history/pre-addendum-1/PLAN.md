# Piano persistente

## Obiettivo
Alpha web multiplayer per playtest, 2–5 posti umani/bot, senza sfide. Specifiche confermate dall'autore nella conversazione del 9 settembre 2026.

## Incremento corrente
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
Numero pescate, dettaglio pagamento e limiti mano senza proposta univoca: non attivare come regole ufficiali. Fixture separate per i test tecnici. Sfide e dipendenze dalle Gemme sospese. Nessuna pubblicazione esterna prevista in questo incremento.

## Verifiche correnti
`npm test`: 33/33 superati (27 motore, 6 rete). `npm run test:browser`: 5/5 superati, inclusi due browser indipendenti con bot, mosse reali, zoom, refresh, ordine ciclico dei posti, tavoli 2–5 e ridimensionamento a 1100×850. Mano da 20 carte verificata con fixture DOM soltanto grafica. Due prove browser superate anche in modalità Vite dopo separazione del socket HMR. Typecheck e build produzione superati. Batch: 10 sessioni, 3.000 turni, 4.176 comandi, 0 errori; replay sessione 1: 423 comandi e 735 eventi identici. `npm audit`: 0 vulnerabilità al controllo; riconfermato `--omit=dev`. Nessun test o deployment Docker/Internet eseguito.
