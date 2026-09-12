# Asset originali: inventario e verifica visiva

Stato al 9 settembre 2026, manifest `original-references-3`: **60 riferimenti consultabili, effetti ufficiali non abilitati**. Il foglio Excel `Demoni` manca ancora: il nuovo `TRIBUTI AGGIORNAMENTO SFIDE.xlsx` non lo contiene (audit separato in `docs/sources/tributes-extracted.md`). La prevalenza dei testi PDF, PNG ed Excel non è stata decisa. Questi riferimenti non entrano nel catalogo giocabile delle fixture e non costituiscono il denominatore della copertura ufficiale.

## Fonti effettivamente lette

- `esempi di carte/90 X CARTE TRIBUTO_STAMPA A4_08 09 2026.pdf`: 10 pagine A4, 90 occorrenze di carte in griglie 3 × 3. Nessun livello di testo estraibile nelle 10 pagine.
- `esempi di carte/WhatsApp Image 2026-09-08 at 08.56.26.jpeg`: verificata visivamente come **Succo di demone**, manufatto con icona A; 744 × 1039 pixel.
- `esempi di carte/WhatsApp Image 2026-09-08 at 08.56.51.jpeg`: verificata visivamente come **Venerare altri**, magia con icona P; 744 × 1039 pixel.
- `esempi di carte/DEMONICUTE 2026_SFIDE/90 X CARTE TRIBUTO/`: **90 PNG sorgenti da 744 × 1039 pixel**, nelle cartelle 10 X MANUFATTI, 10 X MAGIE, 15 X SPOSTASTELLE e 55 X ELEMENTI.
- `esempi di carte/DEMONICUTE 2026_SFIDE/ASSETS/`: font originale `DemonicuteTypo-Regular.otf` e logo `edition_logo.png` verificato visivamente, 1254 × 1254 pixel. Gli altri asset forniti restano disponibili negli originali e non sono conteggiati come carte.

I file forniti sono rimasti inalterati. PNG e JPEG pubblici sono copie identiche byte per byte. I nuovi PNG più leggibili sono le visualizzazioni principali; le versioni PDF e JPEG restano registrate come varianti. La preferenza grafica non attribuisce precedenza regolamentare a una fonte.

## Estrazione e problema delle pagine nere

Sono state rese tutte le 10 pagine con Poppler `pdftoppm`, a 90 dpi. Le pagine 3-10 risultano quasi completamente nere nella zona delle carte. Nel PDF ogni pagina conserva nove immagini individuali delle carte, da 372 × 520 pixel; le pagine 3-10 hanno inoltre un'immagine a pagina quasi intera da 2316 × 3203 pixel sovrapposta alle altre.

Le immagini individuali sono state estratte direttamente dagli XObject con `pypdf`, evitando il ritaglio della resa nera. I file pubblicati conservano i byte delle immagini restituite dall'estrattore: nessun ridisegno, ritocco, ritaglio, ingrandimento artificiale o generazione di immagini. Le otto immagini sovrapposte a pagina intera non vengono trattate come carte. Una copia dell'immagine sovrapposta è conservata nell'audit per diagnosi.

Le **89 immagini distinte delle carte** sono state controllate visivamente nelle otto tavole di contatto `artifacts/asset-audit/contact-01.png` ... `contact-08.png`. I due JPEG sono stati aperti e controllati separatamente. I nomi e i testi sono trascrizioni visive manuali, con le icone descritte tra parentesi quadre quando non hanno un nome testuale sulla carta. Le immagini restano il riferimento per grafica, simboli e testo esatto.

## Integrazione dei PNG sorgenti

Ogni PNG è stato confrontato con le immagini già estratte dal PDF. Per 89 PNG la corrispondenza più vicina ha un errore assoluto medio RGB tra 0,029 e 0,250 su 255 dopo ridimensionamento di confronto; non è un confronto di hash identici, poiché la risoluzione cambia. Le associazioni, gli hash e i valori sono conservati in `artifacts/asset-audit/source-png-comparison.json`. Il confronto è evidenza di corrispondenza grafica, non risolve la prevalenza dei testi sulle altre fonti.

La sola nuova carta nominale è **Amuleto protettivo**, verificata visivamente nel PNG 06_AMULETO PROTETTIVO.png e non presente tra le 19 carte nominali del PDF. **Bacchetta magica era già nel PDF**, a pagina 1, riga 2, colonna 1. La doppia copia del Distributore nel PDF non è stata convertita in un nuovo tipo.

È stata riesaminata individualmente **1,2,3... Stella!**: i simboli inferiori sono completi sia nel PNG sorgente sia nell'estratto PDF visualizzato a dettaglio originale. Il precedente sospetto di un taglio era un falso positivo dell'anteprima e non un difetto della fonte; l'avviso è stato rimosso. Nessun asset è stato ritoccato.

Il titolo **Psicacogia** è confermato dalla grafica e dal filename `15_PSICACOGIA.png`: non viene corretto in un'altra parola. L'incertezza precedente della sola trascrizione è risolta; il timing dell'effetto resta sospeso. I nomi **Terra, Vento, Acqua, Etere, Fuoco** ora provengono dai filename dei PNG; la variante terminologica **Vento / Aria nel GDD** resta registrata senza risoluzione automatica.

## Deduplicazione e conteggi

| Misura | Quantità | Significato |
|---|---:|---|
| Pagine PDF | 10 | Fonti di stampa |
| Occorrenze di carte nel PDF | 90 | Copie fisiche collocate sulle pagine |
| Immagini di carta distinte nel PDF | 89 | Deduplicazione per hash dei pixel RGBA |
| Magie/manufatti nominali | 20 | 19 nel PDF + Amuleto protettivo nel PNG |
| Varianti Spostastelle | 15 | Testi, rotazioni, opzioni o simboli diversi; tutte conservate |
| Risorse elementali nel PDF | 55 | Non sono 55 tipi diversi |
| Gruppi grafici risorsa | 25 | Cinque simboli × valori visibili 2, 3, 4, 5, 6 |
| PNG sorgenti di carte | 90 | 744 × 1039 pixel, senza trasformazioni |
| Riferimenti in galleria | 60 | 20 nominali + 15 varianti Spostastelle + 25 gruppi risorsa |
| File pubblici delle carte | 181 | 90 PNG sorgenti + 89 immagini PDF distinte + 2 JPEG |
| Asset branding pubblici | 2 | Font e logo, esclusi dai conteggi carte |
| Carte ufficiali giocabili integrate | 0 | Le fixture tecniche non contano |
| Denominatore ufficiale dei tipi | N/D | Non ricavabile dal solo conteggio di asset |

`Distributore di caramelle` appare con pixel identici a pagina 1, riga 2, colonna 2 e pagina 2, riga 1, colonna 2: un solo riferimento e un'immagine condivisa, due posizioni di fonte registrate.

Le risorse sono raggruppate per **simbolo inferiore visibile e valore** secondo l’organizzazione grafica del primo incremento. L’[Addendum 1](addendum-1.md) §§1–2 supera l’istruzione storica di ignorare il pentagono superiore: questo raggruppamento non è un’equivalenza meccanica. Ogni variante conserva il proprio pentagono, da trascrivere e verificare nei dati prima dell’uso ufficiale. Tutte le varianti originali restano disponibili nel manifest e come file. Gli ID iniziali basati sulle descrizioni «rocce marroni», «simbolo verde», «gocce blu», «simbolo viola» e «fiamme arancioni» restano stabili; i nomi visualizzati usano ora Terra, Vento, Acqua, Etere e Fuoco dai filename sorgenti. Il raggruppamento non stabilisce equivalenze complete nel futuro regolamento né abilita il pagamento elementale.

Gli Spostastelle conservano 15 riferimenti distinti, identificati dalla posizione originale, poiché il titolo comune non basta a fondere testi e simboli differenti. L’esclusione generale delle sfide è superata dall’Addendum. Le varianti restano riferimenti non giocabili finché trascrizione, modalità, finestra e catena pertinenti non sono implementate e verificate; il titolo comune non autorizza a usare lo stesso effetto per tutte. Quindici varianti consultabili non equivalgono automaticamente a quindici tipi ufficiali.

## Carte nominali riconosciute

| Titolo trascritto | Categoria stampata | Icona | Motivo principale della sospensione |
|---|---|---|---|
| L'unto | Manufatto | A | Stati addormentato e risveglio |
| Kit Goetia del Magista | Manufatto | P | Pagamento elementale e limiti |
| Distributore di caramelle | Manufatto | P | Pagamento elementale e modificatori |
| Bacchetta magica | Manufatto | P | Catalogo Demoni, livello e modificatori |
| Necronomicon | Manufatto | P | Carta mista con sfide e risveglio |
| Abadir | Manufatto | P | Boss e finestra prima delle azioni |
| Psicacogia | Magia | P | Timing e «almeno»; titolo confermato dal PNG |
| Geomanzia | Magia | P | Formula specifica e finestra Boss da integrare |
| Karma istantaneo | Magia | P | Reazioni, durata e catalogo Demoni |
| Bididi Bodidi Bu! | Magia | A | Dettagli dell’effetto Gemme e relativo percorso ufficiale |
| Pranayama | Magia | P | Reazione alla pesca e scelte |
| Abracadabra | Magia | P | Timing e scelta in più passaggi |
| Illuminazione | Magia | A | Catalogo Demoni e copia di abilità |
| 1,2,3... Stella! | Magia | P | Risposta agli Spostastelle |
| Specchio nero | Manufatto | P | Reazioni e annullamenti |
| Succo di demone | Manufatto | A | Risveglio e terminologia Tributo |
| Sfera di cristallo | Manufatto | P | Finestra prima delle azioni e mazzo Risorse |
| Richiamo magico | Magia | A | Boss e Famigli |
| Venerare altri | Magia | P | Mazzo, finestra Boss e interruzione specifica da integrare |
| Amuleto protettivo | Manufatto | P | Protezione, stati ed effetti di altri Demoni |

L'icona P è trascritta come simbolo della fonte; non viene convertita automaticamente in un effetto continuo o in un permesso d'uso fuori turno. Nessun pezzo di una carta mista è stato eliminato per renderla artificialmente utilizzabile.

Il workbook Tributi usa «kit goezia del magista», mentre PNG e PDF riportano «Kit Goetia del Magista»: entrambe le formulazioni restano nell'audit/manifest. Nessuna riga numerica del workbook o differenza di nome viene tradotta in un nuovo effetto.

## Manifest e integrazione

- `src/content/original-assets.ts`: export `ORIGINAL_ASSETS`, versionato, con `status: 'reference-only'` per ogni riferimento. Non è importato dal motore o dal catalogo delle fixture.
- `src/client/public/cards/manifest.json`: manifest completo, con ID stabili, fonte, pagina/riga/colonna, coordinate, dimensioni, hash, varianti, testi trascritti, ambiguità e motivi della sospensione.
- `artifacts/asset-audit/extraction-inventory.json`: tutte le occorrenze PDF e la deduplicazione dei pixel.
- `artifacts/asset-audit/source-png-comparison.json`: confronto delle 90 sorgenti PNG con il PDF, dimensioni, hash e associazioni.
- `artifacts/asset-audit/verified-manifest.json`: copia locale del manifest verificato.
- `artifacts/asset-audit/extract_originals.py`, `inspect_source_pngs.py` e `build_manifest.py`: estrazione, confronto e pubblicazione riproducibili; mantengono separati gli asset dalle regole.
- `src/client/public/cards/branding/manifest.json`: fonte e hash del font/logo originali. Il font è destinato a titoli e branding; non al testo di istruzioni. Il logo non introduce bonus di gioco.

L'ingrandimento in galleria deve conservare le proporzioni dell'immagine (`object-fit: contain`), presentare i comandi fuori dall'illustrazione e consentire consultazione delle varianti disponibili. Aprire un riferimento non deve giocare una carta.

## Verifiche eseguite e limiti

- `pdfinfo`: 10 pagine, PDF non cifrato, formato A4.
- `pdftoppm`: rendering completato di tutte le pagine; verificato il problema nero su pagine campione e confermata la presenza dell'immagine sovrapposta sulle otto pagine interessate.
- Estrazione con `pypdf` e posizioni con `pdfplumber`: 90 occorrenze, 89 immagini distinte, 8 immagini sovrapposte escluse.
- Ispezione visiva di tutte le 89 immagini individuali nelle otto tavole di contatto, più verifica individuale dei due JPEG e di tre titoli/testi meno chiari.
- Confronto automatico delle 90 PNG sorgenti con il PDF; 89 corrispondenze grafiche, una nuova carta. Controllo individuale di Amuleto protettivo, Stella PNG e logo originale; nuova verifica a dettaglio originale di Stella PDF.
- Controllo automatico di esistenza e hash di tutti i **181 file pubblici delle carte**; dimensioni e proporzioni originali mantenute. Font e logo copiati senza modifiche, hash registrati separatamente.
- Storico precedente all’Addendum: `npm run typecheck` eseguito con il manifest v2 completo, superato. Il coordinatore ha aggiornato le descrizioni al manifest v3 senza alterare i 60 riferimenti o i 181 file; nuovi test applicativi dell’Addendum sono attestati separatamente in COVERAGE/CHANGELOG.

La risoluzione delle varianti PDF resta 372 × 520 pixel; le immagini principali PNG sono ora 744 × 1039. L'ingrandimento non crea dettaglio aggiuntivo. Non esiste un livello testuale nel PDF e il confronto delle fonti non assegna nuove precedenze regolamentari. La verifica browser della galleria è registrata separatamente dai test d'integrazione, quando effettivamente eseguita. Non è stata dimostrata alcuna copertura di effetti ufficiali grazie all'aggiunta di queste immagini.
