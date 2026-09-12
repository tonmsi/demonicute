# Corrispondenze dei costi dei Demoni

Fonte costi richiesta dall’autore il 10 settembre 2026: `G:/Il mio Drive/cutes/2026/demonlord/demoni.json`. È stata analizzata esclusivamente la copia autorizzata in [author-demon-costs-2026-09-10.json](sources/author-demon-costs-2026-09-10.json).

La lista dei nomi e degli effetti resta [author-demons-2026-09-10.tsv](sources/author-demons-2026-09-10.tsv). Dal JSON sono estratti soltanto `costo`, `costo_tipo`, `costo_tipo_minimo`, usando il nome per l’associazione. Livelli, elementi, effetti, timing e quantità del JSON non vengono importati.

SHA-256 della copia costi: `1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478`. Dimensione: 20288 byte. Il numero di riga registrato nei dati è la posizione del record JSON (base 1); il locator usa il JSON Pointer base 0.

## Esito

| Misura | Conteggio |
|---|---:|
| Demoni nella lista autore | 60 |
| Record nella fonte costi | 60 |
| Corrispondenze certe del nome normalizzato | 39 |
| Nomi autore senza costo associato | 21 |
| Di cui senza corrispondenza nominale | 19 |
| Di cui alias da confermare | 2 |
| Record JSON non associati alla lista | 21 |

**21 nomi della lista non hanno un costo associato**, di cui 19 assenti dal confronto nominale e 2 varianti da confermare. L’eventuale conferma di entrambe le varianti porterebbe le associazioni a 41, lasciando comunque 19 nomi senza costo.

La normalizzazione riguarda esclusivamente maiuscole/minuscole, spazi e apostrofi (per esempio `BELZEBU` / `Belzebu'`). Non corregge lettere, non fonde `LEPRECAUNO` e `LEPRECHAUN` e non usa la somiglianza degli effetti.

## Nomi senza costo associato

| Nome lista autore | Stato | Eventuale nome JSON |
|---|---|---|
| MEDUSA | Assente nel confronto nominale | — |
| LEPRECAUNO | Assente nel confronto nominale | — |
| BAKU | Assente nel confronto nominale | — |
| LEPRECHAUN | Assente nel confronto nominale | — |
| BUNJIP | Assente nel confronto nominale | — |
| AMMIT | Assente nel confronto nominale | — |
| PUKA | Assente nel confronto nominale | — |
| MOLOCH | Assente nel confronto nominale | — |
| PASAN | Assente nel confronto nominale | — |
| IMP | Assente nel confronto nominale | — |
| RYUTO | Assente nel confronto nominale | — |
| LENGHELO | Assente nel confronto nominale | — |
| KUKEGEN | Alias da confermare | Keukegen |
| KOTOBUKI | Assente nel confronto nominale | — |
| NUE | Assente nel confronto nominale | — |
| MAZMURELLO | Assente nel confronto nominale | — |
| BELLETH | Alias da confermare | Beleth |
| ZIZ | Assente nel confronto nominale | — |
| ARPIA | Assente nel confronto nominale | — |
| ANEMOS | Assente nel confronto nominale | — |
| CAMAZOTZ | Assente nel confronto nominale | — |

**KUKEGEN / Keukegen:** il JSON riporta costo `0` per Keukegen; il valore zero è preservato nel record sorgente ma non assegnato a KUKEGEN senza confermare il nome. **BELLETH / Beleth:** il JSON riporta costo `5`, tipo `ENERGIA_TERRA`, minimo `3`; anche questa associazione resta sospesa.

## Corrispondenze certe

| Nome autore | Nome JSON | Costo | Tipo costo | Minimo riportato | Record JSON |
|---|---|---:|---|---|---:|
| HAFGUFA | Hafgufa | 5 | ENERGIA_ACQUA | 3 | 42 |
| WINDIGO | Windigo | 5 | ENERGIA_ACQUA | 2 | 21 |
| KRAMPUS | Krampus | 4 | ENERGIA_ACQUA | 2 | 23 |
| ZIN | Zin | 3 | ENERGIA_ACQUA | 2 | 13 |
| KAPPA | Kappa | 3 | ENERGIA_ACQUA | 1 | 19 |
| BOTO COR DE ROSA | Boto Cor De Rosa | 3 | ENERGIA_ACQUA | 2 | 28 |
| SELKIE | Selkie | 2 | ENERGIA_ACQUA | 1 | 8 |
| SIBILLA | Sibilla | 2 | ENERGIA_ETERE | 1 | 15 |
| GUAEKO | Guaeko | 2 | non indicato | non indicato | 7 |
| NEKOMATA | Nekomata | 2 | non indicato | non indicato | 14 |
| LEVIATANO | Leviatano | 6 | ENERGIA_ACQUA | 4 | 59 |
| KRAKEN | Kraken | 4 | ENERGIA_ACQUA | 1 | 60 |
| GLASYABO | Glasyabo | 3 | ENERGIA_FUOCO | 1 | 24 |
| EL COCO | El Coco | 1 | non indicato | non indicato | 58 |
| MAMMON | Mammon | 5 | ENERGIA_TERRA | 3 | 32 |
| SAMAEL | Samael | 6 | ENERGIA_ACQUA | 4 | 45 |
| LUCIFERO | Lucifero | 5 | ENERGIA_ETERE | 2 | 52 |
| TIFONE | Tifone | 6 | ENERGIA_FUOCO | 5 | 41 |
| ORIAS | Orias | 3 | ENERGIA_FUOCO | 2 | 27 |
| HULI | Huli | 3 | ENERGIA_FUOCO | 3 | 33 |
| RAKTABIJA | Raktabija | 4 | non indicato | non indicato | 39 |
| BABI | Babi | 2 | ENERGIA_FUOCO | 1 | 10 |
| AMY | Amy | 6 | ENERGIA_FUOCO | 3 | 46 |
| JINN | Jinn | 2 | ENERGIA_FUOCO | 1 | 11 |
| JAKALOPE | Jakalope | 2 | ENERGIA_TERRA | 1 | 9 |
| EURIDICE | Euridice | 2 | ENERGIA_TERRA | 1 | 5 |
| YOWIE | Yowie | 4 | ENERGIA_TERRA | 1 | 34 |
| BAFOMETTO | Bafometto | 5 | ENERGIA_FUOCO | 3 | 47 |
| AKERBELTZ | Akerbeltz | 3 | ENERGIA_TERRA | 3 | 37 |
| BADALISCHIO | Badalischio | 1 | ENERGIA_TERRA | 1 | 1 |
| ORA | Ora | 4 | ENERGIA_ARIA | 2 | 38 |
| ECHIDNA | Echidna | 3 | ENERGIA_TERRA | 3 | 25 |
| BEHEMOTH | Behemoth | 6 | ENERGIA_TERRA | 3 | 49 |
| BELFAGOR | Belfagor | 7 | ENERGIA_TERRA | 2 | 56 |
| LILITH | Lilith | 5 | ENERGIA_ARIA | 3 | 22 |
| BELZEBU | Belzebu' | 6 | ENERGIA_ARIA | 4 | 40 |
| STOLAS | Stolas | 4 | ENERGIA_ARIA | 2 | 17 |
| BANSHEE | Banshee | 3 | ENERGIA_ARIA | 1 | 12 |
| TENGU | Tengu | 4 | ENERGIA_ARIA | 1 | 36 |

## Nomi JSON esterni alla lista

Questi record rimangono riferimenti della fonte costi e non aggiungono Demoni alla lista autore. Sono inclusi i due alias ancora non confermati.

- Keukegen (record 2)
- Nemea (record 3)
- Glatisant (record 4)
- Nefele (record 6)
- Furie (record 16)
- Golem (record 18)
- Humbaba (record 20)
- Kelpie (record 26)
- Asmodeo (record 29)
- Azael (record 30)
- Aamon (record 31)
- Orione (record 35)
- Abraxas (record 43)
- Jalandhara (record 44)
- Beleth (record 48)
- Pazuzu (record 50)
- Arimane (record 51)
- Yaldabaoth (record 53)
- Abaddon (record 54)
- Valak (record 55)
- Amduscias (record 57)

## Limiti e invarianti

- `null` significa campo non presente; non equivale a costo zero. La presenza dei campi originali è verificabile in `rawFields`.
- La fonte non specifica l’unità di `costo_tipo_minimo`. Questo incremento conserva il numero e il tipo senza dedurre regole di pagamento, jolly, resto o eccedenza dal codice storico.
- Il valore `AuthorDemon.cost` della trascrizione TSV resta `null`: la UI può mostrare il costo della fonte aggiuntiva soltanto attraverso una corrispondenza certa, con provenienza distinta.
- Nessun requisito viene ricavato dalla quinta colonna del TSV e nessun costo viene esteso a un Demone con effetto simile.
- Nessun costo importato abilita automaticamente evocazione o abilità. I dati fonte e le capacità del motore restano distinti.

Verifiche eseguite: controllo SHA-256 e confronto completo dei nomi; `npm run compile` superato; `node --test dist/runtime/tests/author-demon-costs.test.js` superato, 6 test su 6. Successiva verifica dell'intero incremento: `npm test` 96/96 superati, typecheck e build riusciti; ulteriori risultati in `CHANGELOG.md`.
