# Copertura di contenuti e meccaniche

Aggiornamento verifiche: **10 settembre 2026**. Addendum e fonti originali conservano la data del 9 settembre 2026. Tipi ufficiali implementati e verificati: **0**. Denominatore del catalogo ufficiale: **non disponibile**. Copertura percentuale: **N/D**; non è possibile calcolare né attestare il traguardo di circa 30% previsto dalla specifica. Le carte fixture sono test tecnici e non entrano nel numeratore o nel denominatore.

L'incremento **0.2.1** aggiunge il catalogo consultabile dei 60 Demoni forniti dall'autore: 12 per elemento, con 39 costi abbinati dal JSON successivamente indicato, 19 costi mancanti e 2 alias da confermare. Il denominatore della sola lista Demoni è ora 60; quello dell'intero catalogo ufficiale resta da definire. **0/60 Demoni della nuova lista hanno un effetto abilitato nelle partite** in questo incremento di dati e interfaccia. Le 12 righe con timing non definito e le altre dipendenze sono distinte nell'[audit della lista](DEMON_LIST_AUDIT.md); dettagli dei nomi nel [confronto dei costi](DEMON_COST_MATCHES.md).

I percorsi del motore **0.2.0**, integrati con l'[Addendum 1](addendum-1.md), restano quelli verificati sotto. L’esclusione generale delle sfide è superata: i percorsi e le formule aperte sono distinti nell’[audit mirato](ADDENDUM_1_AUDIT.md). I risultati del motore precedente sono separati dalle verifiche del catalogo nuovo.

## Verifiche dell'incremento 0.2.1

- `npm test`: **96/96 superati**, inclusi 6 test di fedeltà della lista e 6 test dei costi, oltre alle regressioni di motore, bot, simulatore e rete.
- Typecheck e build superati; `npm start` 0.2.1 verificato su 2567. Health: 60 Demoni registrati, 39 costi associati, 19 mancanti, 2 alias pendenti, 0 giocabili; preset tecnici disponibili.
- Browser: **9/9 regressioni superate** nella suite completa; la nuova prova catalogo è stata ripetuta separatamente dopo aver corretto il selettore dei filtri nel test, **1/1 superata in 5,6 secondi, exit 0**. Verificati 60 testi e note, costi 39/19/2, ricerca, filtri, nomi distinti, vista mobile senza overflow e galleria originale. Screenshot desktop 1440×1000 e mobile a 390 pixel ispezionati.
- Audit documentale: 159 collegamenti/locatori e 10 hash verificati. Lista autore e Addendum identici agli allegati; bozza iniziale conservata.
- Nessuna modifica al motore o ai preset in questo incremento: i batch 0.2.0 riportati sotto restano risultati precedenti, senza attribuirli alle abilità dei nuovi Demoni.

## Stato delle fonti e del catalogo

| Contenuto | Implementata e testata | Da implementare | Sospesa per ambiguità | Dipendenza specifica dalle sfide | Asset mancante |
| --- | --- | --- | --- | --- | --- |
| 60 Demoni della lista autore del 10 settembre | Dati registrati; 0 effetti abilitati | Effetti da integrare e verificare per percorso | 12 timing irrisolti, note/testi e termini individuati nell'audit; 19 costi mancanti e 2 alias | Condizioni nelle Pile, blocco/liberazione, DEUS e manufatti dipendono dal testo specifico | Illustrazioni non fornite nella lista; nessun asset inventato |
| Tributo del PDF richiesto | 0 tipi attestati | Comportamenti sospesi; asset e testi trascritti | Precedenza eventuali testi PDF/immagini/Excel non confermata; rapporto Tributo/Rifornimento aperto | Trascrizioni, modalità e finestre delle singole varianti da integrare | PDF presente e 89 immagini distinte verificate; dettagli in `CARD_ASSETS.md` |
| `TRIBUTI AGGIORNAMENTO SFIDE.xlsx` | Nessun effetto implementabile dal solo file | Solo audit delle 269 celle di `Foglio1` | Notazione senza legenda, nomi varianti e 11 segnaposto; nessun testo effetto o regola generale | Addendum autorizza sviluppo; titolo e griglia non definiscono formule | Workbook presente, privo di immagini e del foglio `Demoni` |
| Nuovi PNG/SVG in `DEMONICUTE 2026_SFIDE` | Nessun effetto abilitato | Galleria di riferimenti aggiornata dall'audit asset | Corrispondenze/varianti conservate, nessuna precedenza automatica | Dipende da testi, dati pentagoni e percorsi realmente implementati | 90 carte PNG originali 744×1039 verificate; altri PNG/SVG/JFIF/font sono inventariati separatamente |
| `Venerare altri` | No | Galleria di riferimento; magia P identificata visivamente | Timing concreto da nuove regole e testo completo | Finestra Boss, mazzo e interruzione specifica da definire/integrare | Presente e verificato: JPEG 08.56.51, 744×1039 |
| `Succo di demone` | No | Galleria di riferimento; manufatto A identificato visivamente | Tributo, risveglio/addormentato, limiti manufatti e precedenza testi da chiarire | Nessuna dipendenza diretta da sfide dedotta dal testo JPEG | Presente e verificato: JPEG 08.56.26, 744×1039 |
| `Amuleto protettivo` | No | Nuovo riferimento PNG, nome presente anche in `Foglio1!A21` | Protezioni da sonno/spostamenti e limiti manufatti da chiarire | Nessuna dipendenza diretta da sfide dedotta dal testo | PNG originale presente e verificato |
| Famigli | No | Fonte e caratterizzazione da acquisire | Stelle, immunità, effetto e bersagliabilità da chiarire | Non determinabile | Sì |
| Boss/DEUS, duelli e carte dipendenti ufficiali | 0 tipi ufficiali attestati | Percorsi tecnici Addendum implementati; carte ufficiali da integrare | Formula Boss/stelle protette/poste/interruzioni ancora aperte | Valutazione per percorso, senza esclusione generale | Ymir/Boss ufficiale non identificato; illustrazioni dei nuovi Demoni non fornite |
| Fato | No | Catalogo da acquisire | Setup e timing da chiarire | Dipende dal testo reale | Sì |

Le righe per le carte nominate non inventano caratteristiche o quantità. La nuova lista fornita dall'autore stabilisce 60 Demoni nominali: non è un conteggio dedotto dal GDD, dai JSON precedenti o dalle immagini. Il JSON indicato successivamente è fonte dei soli costi per le associazioni certe. Il titolo `75x CARTE SFIDA`, le 90 occorrenze del PDF e il numero dei file grafici non definiscono il denominatore dell'intero catalogo ufficiale. Il workbook Tributi contiene 55 combinazioni in griglia elemento, 9 manufatti nominati più un segnaposto e 10 pergamene segnaposto; non è la fonte della nuova lista Demoni.

La galleria aggiornata contiene **60 riferimenti**: 20 nominali, 15 varianti Spostastelle e 25 gruppi risorsa. Sono conservati **181 file carta**: 90 PNG originali, 89 immagini PDF e 2 JPEG. Questi conteggi documentano reperibilità e varianti grafiche; non sono il denominatore ufficiale e non implicano effetti giocabili. In particolare i 25 gruppi risorsa non equivalgono meccanicamente alle varianti del pentagono superiore, ora rilevante per le sfide. Psicacogia è identificato dal nuovo nome file; il precedente dubbio grafico su `1,2,3... Stella!` è stato chiuso dalla verifica dell'originale, senza modifica dell'immagine.

## Incremento 0.2.0 — Addendum 1

Addendum preservato e integrato nei moduli esistenti. **84/84 test automatici superati**, con 27 base, 23 sfide, 17 bot, 9 simulatore e 8 rete; gli 8 test di rete sono stati ripetuti con successo dopo il controllo `inputReady`. Typecheck/build superati, audit npm 0 vulnerabilità. Browser finale: **9/9 superati in circa 1,2 minuti**, inclusi 5 regressioni, 3 layout e il nuovo flusso Boss/duello; avvio e chiusura automatici del server di test, exit 0 e ultimo CSS verificato senza sovrapposizioni. Il denominatore ufficiale resta N/D, i tipi ufficiali abilitati restano 0.

| Percorso | Regola confermata | Stato tecnico corrente | Limite specifico |
| --- | --- | --- | --- |
| Conteggio elementale | Globale, per Demone, minimo 0, giallo > X > numerici, OR singolo | Implementato e verificato nel motore; dettaglio di tutti i Magisti visibile, confronto limitato ai partecipanti | Riferimento delle stelle e passivi soltanto tecnico |
| Duello completo | Due partecipanti, un modificatore coperto ciascuno, swap gratuiti/no E, posta 1–2 gerarchica/mista, confronto stelle | Percorso motore `challenge-fixtures` verificato | Pareggio, disponibilità e dettagli trasferimento/reinserimento sono policy dichiarate |
| Boss completo | Rotazioni iniziali → prep → risposta → effetti/conteggio → esito; risposta Spostastelle può ruotare dopo prep; parità senza Gemma | Percorso motore verificato, incluse cinque posizioni e collisione ID giocatore `boss` | Mazzo, formula lati/passivo e sconfitta ulteriori non ufficiali |
| Spostastelle del testo confermato | Una modalità: rotazione oraria, oppure rifiuto/deviazione e pesca 1 nel contesto lecito | Fixture verificata; rifiuto/deviazione illegali senza pescata disponibile, rotazione indipendente dalla pesca | Priorità/numero/catene tecnici; le 15 varianti originali non sono abilitate in blocco |
| −1 per Gemma | Esistenza confermata | Blocco specifico verificato senza consumo o mutazioni | Formula, proprietà, scala, giallo/minimo aperti; nessun effetto vuoto |
| Privacy/rientro/idempotenza | Carta/alternativa nascoste fino alla rivelazione; bot senza futura risposta Boss | Test motore e rete superati, inclusi rientro coperto, duplicati, confronto con headless e timer in pausa | Refresh browser durante scelta coperta verificato nella suite finale; solo ambiente locale |
| UI, bot, batch, replay e report | Un unico motore, fasi e conteggio visibili, tempo virtuale; sfida distinta da partita e stop | Bot/simulatore/rete verificati; Boss geometrico a sinistra del Limbo e layout 3–5 posti superati | Nuovo flusso browser completo superato; nessun asset Ymir inventato |
| Carte ufficiali e Boss Ymir | Soltanto fonti reali, dati espliciti e percorsi completi | 0 carte ufficiali abilitate; nuova lista Demoni registrata separatamente | Costi mancanti e ambiguità della lista distinti dalla programmazione degli effetti; Ymir non identificato, pentagoni per variante da trascrivere |

Policy dichiarate lette in `src/content/challenges.ts` (`CHALLENGE_POLICY` e `CHALLENGE_BLOCKERS`), senza attribuire loro validità regolamentare:

- Costo tecnico sfida 1 azione, dal GDD provvisorio; riferimento stelle = stampate + passivo fixture della cima. Il giallo conserva quel riferimento tecnico.
- Setup Sfide TEST: mano 5, due Pile di due Demoni e una Gemma per Magista; 120 carte pesca, 48 Demoni, 48 risposte Boss e 60 Gemme totali. Mazzi finiti senza riciclo; quantità sintetiche dichiarate.
- Priorità Spostastelle seriale per posto, una carta per giocatore per sfida, finestra 5 secondi solo con risposta lecita. Contro Boss tutti possono ruotare; nel duello la fixture consente rifiuto/deviazione al solo difensore e una sola deviazione, senza nuova catena. Rifiuto/deviazione richiedono pescata disponibile dopo lo scarto; una mano di 20 carte ha lo spazio liberato dallo Spostastelle.
- Preparazione senza scadenza obbligatoria: la fixture permette nessun modificatore anche a mano vuota. Pronto blocca le sostituzioni.
- Mazzo risposta Boss separato e finito; carta priva di pentagono neutra, Spostastelle orario senza seconda pesca. Il Boss geometrico ha cinque lati di prova: 4/6/3/7/5, Terra/Fuoco/Acqua/Aria/Etere. Ogni lato conta come singola unità, senza passivo; secondari esposti senza formula. Un'alternativa Boss minimizza il margine attaccante meno Boss fra le sole opzioni stampate, con parità risolta nell'ordine delle opzioni: policy tecnica.
- Gemme generiche da riserva finita: vittoria stretta Boss assegna 1; parità/sconfitta senza altre conseguenze. Nessuna vittoria della partita definita.
- Posta tecnica verificata per entrambi alla dichiarazione e ricalcolata alla risoluzione; Gemme → cime → mano. Gemme/mani trasferite per ID ordinato, identità della mano non pubbliche e capienza verificata. Il perdente sceglie le cime, al massimo una perdita per Pila, ritorno in fondo evocazioni senza rimescolare. Pareggio duello senza posta; rifiuto senza rimborso azione.

Queste convenzioni permettono di collaudare percorsi completi; non chiudono i punti aperti elencati nell'[audit Addendum](ADDENDUM_1_AUDIT.md). Eventuali modifiche durante l'integrazione richiedono riallineamento di questa descrizione e nuovi risultati effettivi.

## Verifiche correnti e batch 0.2.0

| Ambito | Risultato verificato | Limite dell'attestazione |
| --- | --- | --- |
| Suite automatica | `npm test`: 84/84; 27 base + 23 sfide + 17 bot + 9 simulatore + 8 rete | Carte e policy di prova, nessun conteggio ufficiale |
| Rete dopo controllo disponibilità input | 8/8 ripetuti; client indipendenti, rientro coperto, idempotenza, equivalenza headless, pause/presentazione fuori dal timer e ack ripetuti | Prove su server locale; non deployment Internet |
| Compilazione, avvio e dipendenze | Typecheck/build superati, npm start 0.2.0 verificato su 2567 con health e preset; audit npm 0 vulnerabilità | Avvio locale e dipendenze controllate, non deployment remoto |
| Browser regressioni | 5/5 superati: menu/profilo/originali, due browser con bot e mosse reali, refresh e tavoli Base | Verifica delle funzionalità preesistenti dopo l'integrazione |
| Browser layout sfide | 3/3 superati nella suite finale: Boss e Limbo con 3, 4 e 5 posti, larghezze 1440 e 1100 pixel; controllo sovrapposizioni dell’ultimo CSS | Boss geometrico fixture a sinistra del Limbo; nessun asset ufficiale Boss attestato |
| Browser nuovo flusso e suite finale | 9/9 complessivi in circa 1,2 minuti, exit 0. Rotazione reale e lato DOM, impegno Fuoco coperto con reload, sostituzioni multiple, duello 8 contro 7 con posta 2: Gemma e Demone scelto dal perdente | Server Playwright dedicato su 2571 con seed 42 di test, avviato e chiuso automaticamente; il confronto resta fixture |
| Batch Sfide TEST | 10 sessioni, 300 turni, 1.941 comandi, 300 sfide (194 Boss e 106 duelli), 0 errori | 30 turni per sessione, soli bot medi e fixture; arresti tecnici, nessuna vittoria di partita |
| Batch timeout | 3 sessioni, 36 turni, 258 comandi, 36 sfide, 30 finestre scadute, 0 errori | Solo tempo virtuale; nessuna scadenza delle scelte obbligatorie |
| Batch Base | Comando richiesto: 10 sessioni, 3.000 turni, 4.176 comandi, 0 errori | Conferma della base; 2.406 turni senza azioni legali nel preset finito, nessuna misura di bilanciamento |
| Replay | Prima sessione di tutti e tre i batch riprodotta identicamente dopo le ultime correzioni del motore | Formato 2, hash/versioni, eventi, cronologia, metriche e stato; debug locale riservato |
| Docker/Internet | Non testati | Nessuna distribuzione remota attestata |

Report letti nel workspace: [Sfide TEST](../artifacts/simulations-challenges/batch.txt), [timeout](../artifacts/simulations-timeouts/batch.txt), [Base](../artifacts/simulations/batch.txt); JSON/CSV e replay nella stessa cartella di ciascun report. Il batch sfide registra inoltre 11 deviazioni, 47 rotazioni, 81 sostituzioni, 119 Gemme ottenute, 47 Gemme trasferite, 35 carte mano trasferite e 71 cime rimandate nel mazzo. Non registra rifiuti: quella modalità è verificata dai test mirati, non accreditata al batch. I conteggi descrivono operazioni tecniche e non sono percentuali di copertura del catalogo.

## Fixture tecniche della base precedente

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

## Verifiche della base precedente all’Addendum

Risultati effettivi conservati come baseline; non sono una nuova esecuzione né copertura delle sfide dell’Addendum.

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

La selezione iniziale dovrà rappresentare meccaniche completamente raggiungibili nei percorsi abilitati e verificati, comprese le sfide sufficientemente definite dall’Addendum. Una carta mista con una parte rinviata resta esclusa oppure viene accompagnata da una delimitazione esplicita degli scenari non abilitati; non si cancella la parte mancante per ottenere una carta diversa. La copertura ufficiale e la disponibilità dell'asset rimangono due misure separate.
