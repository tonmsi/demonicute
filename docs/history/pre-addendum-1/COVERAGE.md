# Copertura di contenuti e meccaniche

Data: 9 settembre 2026. Tipi ufficiali implementati e verificati: **0**. Denominatore del catalogo ufficiale: **non disponibile**. Copertura percentuale: **N/D**; non è possibile calcolare né attestare il traguardo di circa 30% previsto dalla specifica. Le carte fixture sono test tecnici e non entrano nel numeratore o nel denominatore.

## Stato delle fonti e del catalogo

| Contenuto | Implementata e testata | Da implementare | Sospesa per ambiguità | Rinviata per sfide | Asset mancante |
| --- | --- | --- | --- | --- | --- |
| Demoni del foglio `Demoni` | 0 tipi attestati | Catalogo da importare quando disponibile | Casi da individuare dal testo reale | Casi da individuare, incluse dipendenze Gemme | Non verificabili senza Excel/immagini |
| Tributo del PDF richiesto | 0 tipi attestati | Comportamenti sospesi; asset e testi trascritti | Precedenza eventuali testi PDF/immagini/Excel non confermata; rapporto Tributo/Rifornimento aperto | Spostastelle e altre carte dipendenti escluse | PDF presente e 89 immagini distinte verificate; dettagli in `CARD_ASSETS.md` |
| `TRIBUTI AGGIORNAMENTO SFIDE.xlsx` | Nessun effetto implementabile dal solo file | Solo audit delle 269 celle di `Foglio1` | Notazione senza legenda, nomi varianti e 11 segnaposto; nessun testo effetto o regola generale | Titolo «75x CARTE SFIDA» non abilita le sfide | Workbook presente, privo di immagini e del foglio `Demoni` |
| Nuovi PNG/SVG in `DEMONICUTE 2026_SFIDE` | Nessun effetto abilitato | Galleria di riferimenti aggiornata dall'audit asset | Corrispondenze/varianti conservate, nessuna precedenza automatica | Dipende dai testi; capacità sfida sempre disabilitate | 90 carte PNG originali 744×1039 verificate; altri PNG/SVG/JFIF/font sono inventariati separatamente |
| `Venerare altri` | No | Galleria di riferimento; magia P identificata visivamente | Timing concreto da nuove regole e testo completo | Sì: utilizzabile durante sfida Boss, ora disabilitata | Presente e verificato: JPEG 08.56.51, 744×1039 |
| `Succo di demone` | No | Galleria di riferimento; manufatto A identificato visivamente | Tributo, risveglio/addormentato, limiti manufatti e precedenza testi da chiarire | Nessuna dipendenza diretta da sfide dedotta dal testo JPEG | Presente e verificato: JPEG 08.56.26, 744×1039 |
| `Amuleto protettivo` | No | Nuovo riferimento PNG, nome presente anche in `Foglio1!A21` | Protezioni da sonno/spostamenti e limiti manufatti da chiarire | Nessuna dipendenza diretta da sfide dedotta dal testo | PNG originale presente e verificato |
| Famigli | No | Fonte e caratterizzazione da acquisire | Stelle, immunità, effetto e bersagliabilità da chiarire | Non determinabile | Sì |
| Boss/DEUS, duelli e carte dipendenti | No | Conservare dati/asset quando disponibili | Nuove regole attese | Sì, comprese acquisizione/uso Gemme | Non verificabile per tipo |
| Fato | No | Catalogo da acquisire | Setup e timing da chiarire | Dipende dal testo reale | Sì |

Le righe per le carte nominate non inventano caratteristiche o quantità. I 60 demoni del GDD sono una quantità proposta e i 60 JSON del vecchio Python un catalogo storico: nessuno dei due può sostituire il denominatore derivato dal foglio autorizzato. Nemmeno il titolo `75x CARTE SFIDA`, le 90 occorrenze del PDF o il numero di nuovi file grafici definiscono i tipi unici ufficiali. Il nuovo workbook contiene 55 combinazioni in griglia elemento, 9 manufatti nominati più un segnaposto e 10 pergamene segnaposto; non contiene `Demoni` e non completa il catalogo richiesto.

La galleria aggiornata contiene **60 riferimenti**: 20 nominali, 15 varianti Spostastelle e 25 gruppi risorsa. Sono conservati **181 file carta**: 90 PNG originali, 89 immagini PDF e 2 JPEG. Questi conteggi documentano reperibilità e varianti grafiche; non sono il denominatore ufficiale e non implicano effetti giocabili. Psicacogia è identificato dal nuovo nome file; il precedente dubbio grafico su `1,2,3... Stella!` è stato chiuso dalla verifica dell'originale, senza modifica dell'immagine.

## Fixture tecniche separate

Il primo incremento usa definizioni con identificativi dedicati, provenienza dichiarata e `fixture: true`. Le immagini delle fixture sono segnaposto esplicitamente riconoscibili. Non rappresentano carte di Demonicute e non soddisfano il requisito delle immagini originali. PDF e JPEG ricevuti alimentano una galleria separata: non sostituiscono l'immagine di una fixture facendola apparire ufficiale e non attivano nuovi effetti.

| Famiglia fixture | Comportamento previsto | Provenienza dei parametri | Criterio tecnico di copertura |
| --- | --- | --- | --- |
| Risorsa generica | Valore 1; pagamento esatto; nessun elemento/jolly/cambio. | Scelta tecnica di prova, non regola ufficiale. | Consumo atomico, ID unici, nessuna duplicazione/perdita. |
| Demone senza abilità | Stelle e costo di prova dichiarati. `none` significa assenza intenzionale di abilità. | Fixture sintetica. | Evocazione, impilamento, contributo della cima. |
| Demone `E` pesca | Pesca di prova all'ingresso in Cerchia. | Fixture sintetica; semantica Entrata distinta da scopertura. | Una risoluzione per ingresso/comando valido. |
| Demone `A` pesca | Attivazione della cima che consuma un'azione e pesca. | Fixture sintetica; nessuna frequenza ufficiale dedotta. | Legalità, costo azione singolo, nessuna attivazione sottostante. |
| Demone `P` stella | Bonus continuo di prova mentre la carta è in cima. | Fixture sintetica, non modello di tutti i passivi. | Copertura disattiva il bonus; nessuna azione consumata. |

Preset implementato: 2 azioni, 4 slot e massimo 3 demoni per Pila, Limbo 5 e mano iniziale 5 dalle proposte GDD esplicitamente scelte. Soltanto per le fixture: pesca per azione 1, risorsa unitaria con pagamento esatto, limite mano 20, nessun Famiglio/Fato/Gemma, nessun riciclo dei mazzi. Il catalogo tecnico contiene 120 risorse e 16 copie di ciascuno dei quattro demoni fixture (64 demoni): `N` costo 0/stella 1; `E` costo 1/stelle 2; `A` costo 2/stelle 3; `P` costo 3/stelle 3 e bonus continuo +1 su sé stesso in cima. `E` risolve senza pesca se mano piena o mazzo vuoto; `A` è illegale se non può pescare. Limite predefinito 300 turni/1.000 comandi accettati; il conteggio comandi include fine turno. Questi valori non costituiscono un bilanciamento ufficiale.

L'effetto `none` non è usato per sostituire un'abilità reale mancante. Nessuna carta ufficiale con effetto parziale o vuoto può entrare nel mazzo attivo. Effetti obbligatori, reazioni, scelte multiple, blocco, sonno, rimozioni e poteri legati alle sfide non sono accreditati alle semplici fixture.

## Verifiche e avanzamento

| Ambito | Stato al momento dell'audit | Evidenza |
| --- | --- | --- |
| Lettura integrale GDD e specifica | Completata | 1.346/1.346 paragrafi corpo e 53/53 tabelle estratti; nessun media DOCX; hash conservato. |
| Regole e conflitti | Documentati | [SOURCE_AUDIT.md](SOURCE_AUDIT.md) e [RULES_MATRIX.md](RULES_MATRIX.md). |
| Avvio del prototipo Python | Verificato come non funzionante | BOM riprodotto; secondo errore dei 12 handler verificato con lettura corretta solo in memoria. |
| Motore e fixture | 27 test del motore superati; suite completa rieseguita insieme ai 6 test di rete, 33/33 | Costi esatti e costo zero, Pile/cime, E/A/P reali delle fixture, limiti mano/mazzi, idempotenza, comandi illegali, privacy, seed/replay e arresto tecnico. |
| Multiplayer e sessioni | 6 test d'integrazione superati con server reale avviato; conferma anche nei test browser finali | Due client SDK indipendenti, cookie, privacy/autorità, idempotenza, sfide disabilitate, rientro, gate presentazione e pausa host osservatore; rimozione esplicita di assente dalla lobby, rate limit sconosciuti e nuove sessioni dopo tre test conclusi. Due browser indipendenti con bot verificano mosse reali e refresh con lo stesso stato e la stessa mano. |
| Browser sulla build di produzione | Suite finale 5/5 superata in 47,7 s; dopo gli ultimi ritocchi grafici, test menu/profilo/galleria ripetuto 1/1 in 9,0 s | Galleria di 60 riferimenti con zoom originale, due browser e bot, pesca/evocazione/fine turno/stop reali, refresh/rientro, ordine ciclico, tavoli 2–5, viewport 1100×850 e Limbo espanso. Ispezionati screenshot home, galleria caricata, zoom, tavolo a 5, mano affollata e vista ospite. |
| Tavolo e mano affollata | Verificati nei test browser finali | Slot visibili 1–4, posizione personale in basso e ordine ciclico anche per l'ospite, mano scorrevole e narrazione fissa. Stress con 20 carte inserite solo nel DOM: prima e ultima raggiungibili; è una verifica grafica, non un nuovo test del motore o della capienza regolamentare. |
| Modalità sviluppo | 2 test browser superati in 35,7 s | Menu/profilo/galleria e due browser con bot, mosse e refresh/rientro. HMR Vite usa una porta separata configurabile, predefinita 24678. |
| Bot e simulatore | Politiche distinte verificate; batch rigenerato e replay CLI verificato | `npm run simulate -- --sessions 10 --players 3 --seed 42`: 3.000 turni, 4.176 comandi, 360 evocazioni, 240 impilamenti, 0 errori, 8.343,46 ms. Replay sessione 1: 423 comandi, 735 eventi identici e hash codice verificato. |
| Audit nuovo workbook | Completato in sola lettura | Unico `Foglio1`, 269 celle coordinate, nessun `Demoni`, nessuna formula/errore memorizzato; nessuna definizione generale pesca/pagamento/mano. Fonte invariata, estrazione MD/JSON in `docs/sources`. |
| Dipendenze | Audit finale delle dipendenze di produzione: 0 vulnerabilità | Stack Colyseus core 0.18.12 / SDK 0.18.2 / WebSocket 0.18.2, override `nanoid` 3.3.18 e `qs` 6.16.0. |
| Compilazione e avvio | Typecheck superato; build di produzione rieseguita con successo dopo gli ultimi ritocchi; controllo finale `/api/health` riuscito | Anteprime home con proporzioni originali 744×1039 e immagini contenute integralmente; zoom senza ID di pagamento o identificativi locali. I test browser usano la build di produzione. |
| Container e distribuzione remota | Docker e deployment Internet non testati | Le prove locali, inclusa la build di produzione, non attestano una distribuzione remota funzionante. |

Il [CHANGELOG](CHANGELOG.md) registra i comandi e i risultati comunicati dal coordinatore e il report batch letto nel workspace. I dieci test batch sono terminati per limite tecnico: i numerosi turni finali senza azioni disponibili riflettono mazzi finiti e Pile piene del preset. Il tempo di calcolo non misura la durata percepita online e il batch non attesta bilanciamento o vittorie. Il superamento tecnico delle fixture e la presenza di immagini originali in galleria non cambiano il totale ufficiale 0 né il denominatore N/D.

## Requisiti per una riga ufficiale

Quando arriva il catalogo, ogni tipo di carta richiede: ID stabile, nome, tipo e quantità di copie; file/foglio/riga o pagina/ritaglio della fonte; stato della decisione; immagine e hash; caratteristiche; costo; sottotipo effetto e timing; bersagli; testo integrale di riferimento; comportamento implementato; limiti/frequenza/durata; dipendenze; test deterministici e loro esito. Una copia stampata ripetuta aggiorna la quantità, non crea un nuovo tipo.

La selezione iniziale dovrà rappresentare meccaniche raggiungibili senza sfide. Una carta mista con una parte rinviata resta esclusa oppure viene accompagnata da una delimitazione esplicita degli scenari non abilitati; non si cancella la parte mancante per ottenere una carta diversa. La copertura ufficiale e la disponibilità dell'asset rimangono due misure separate.
