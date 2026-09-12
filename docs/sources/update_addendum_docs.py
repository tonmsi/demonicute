"""Apply the documented Addendum 1 transition; originals remain unchanged."""
from pathlib import Path
import hashlib
import json
import shutil

root = Path(__file__).resolve().parents[2]
docs = root / 'docs'
history = docs / 'history' / 'pre-addendum-1'
history.mkdir(parents=True, exist_ok=True)
for name in ['SOURCE_AUDIT.md', 'RULES_MATRIX.md', 'COVERAGE.md', 'CARD_ASSETS.md']:
    destination = history / name
    if not destination.exists():
        shutil.copyfile(docs / name, destination)
plan_history = history / 'PLAN.md'
if not plan_history.exists():
    shutil.copyfile(root / 'PLAN.md', plan_history)

def edit(name, pairs):
    path = root / name
    text = path.read_text(encoding='utf-8-sig')
    for before, after in pairs:
        if before not in text:
            raise ValueError(f'Missing expected text in {name}: {before[:100]}')
        text = text.replace(before, after)
    path.write_text(text, encoding='utf-8', newline='\n')

edit('docs/SOURCE_AUDIT.md', [
    ('## Materiali verificati', 'Dal presente aggiornamento prevale l’[Addendum 1](addendum-1.md): sviluppare sfide per percorsi completi e verificati, con policy aperte isolate nelle fixture. L’audit mirato e le sole decisioni ancora necessarie sono in [ADDENDUM_1_AUDIT.md](ADDENDUM_1_AUDIT.md). La [versione precedente](history/pre-addendum-1/SOURCE_AUDIT.md) conserva le esclusioni storiche.\n\n## Materiali verificati'),
    ('| `docs/specification.md`, copia di `Demonicute_Prompt_Codex_Alpha_senza_sfide_v1.md` | Letta integralmente nel workspace. | Specifica adottata per il nuovo progetto. Conserva la distinzione fra decisioni dell\'autore, proposte tecniche e regole aperte. |', '| `docs/addendum-1.md` | Allegato esplicitamente richiesto dall’autore, letto integralmente e copiato byte per byte. | Fonte prevalente dal nuovo incremento per le disposizioni incompatibili; formule aperte non promosse a ufficiali. |\n| `docs/specification.md` e `docs/sources/base-specification-v1.md` | Bozza iniziale letta integralmente e preservata; specifica corrente con nota di precedenza. | Disposizioni non superate dall’Addendum, distinte da proposte GDD e policy tecniche. |'),
    ('non equivalente al file `cutes` e non autorizzazione alle sfide', 'non equivalente al file `cutes`; l’autorizzazione allo sviluppo sfide proviene ora dall’Addendum'),
    ('Il nome della cartella non cambia le due capacità sfida disabilitate.', 'Il nome della cartella non conferma regole: l’Addendum autorizza separatamente il nuovo modulo sfide.'),
    ('Il pentagono superiore non partecipa ai calcoli. Le stelle restano un valore distinto.', 'L’Addendum §§1–2 supera il precedente pentagono ignorato: il pentagono è un modificatore sfida distinto dal Tributo inferiore e dal testo principale. Conferma effetti globali per Demone, minimo 0 e precedenza giallo > X > numerici; riferimento stelle/passivi resta aperto.'),
    ('rimane rinviata per sfide disabilitate', 'resta da integrare per il suo specifico timing, mazzo e interruzione; l’esclusione generale delle sfide è superata'),
    ('Il pentagono superiore continua a essere escluso dalle meccaniche.', 'Il pentagono superiore ora richiede dati meccanici espliciti per ogni variante (Addendum §2); questa coincidenza numerica non ne fornisce la trascrizione.'),
    ('Rimozione dei demoni reali sospesa.', 'Addendum §5 conferma la perdita della cima scelta dal perdente e il ritorno nel mazzo; reinserimento concreto ancora aperto, con fondo mazzo eventualmente solo tecnico.'),
    ('Reazioni inattive nelle fixture. Cinque secondi è la configurazione futura richiesta, non una finestra già implementata o un\'autorizzazione al primo clic.', 'Il preset base conserva assenza di reazioni. Addendum §9 richiede finestre opzionali lecite da 5 secondi nel nuovo modulo; catene/priorità restano da isolare nelle policy tecniche. Nessuna scadenza automatica dell’intera preparazione.'),
    ('Specifica §4 prevalente: due capacità distinte e disabilitate, nessuna sfida numerica di ripiego, nessuna Gemma acquisibile e nessuna vittoria alternativa. Dipendenze dirette e indirette escluse.', 'Addendum §§1–8 supera la vecchia SPEC §4. Sviluppo dei percorsi Boss e duello, conteggio elementale confermato, poste e fasi esplicite; formula Boss, riferimento stelle, dettagli poste e interruzioni ancora isolati. Il preset challenge-fixtures verifica policy dichiarate, non carte ufficiali o vittoria della partita.'),
    ('nel preset senza sfide', 'nei percorsi effettivamente abilitati e verificati'),
    ('A consuma un\'azione; P non ne consuma; E richiede le condizioni d\'entrata; pentagono escluso.', 'A consuma un’azione; P non ne consuma; E richiede le condizioni d’entrata; il pentagono è modificatore distinto.'),
    ('Decisioni già esplicite in SPEC §2. Restano dipendenti dal testo eventuali costi, frequenze e momenti d\'uso.', 'SPEC §2 per A/P/E; Addendum §§1–4 per pentagono e sostituzioni sfida senza E. Restano dipendenti dal testo costi, frequenze e momenti d’uso.'),
    ('Boss e duelli restano disabilitati, senza vittoria alternativa.', 'Sfide da sviluppare progressivamente; nessuna formula o vittoria di partita inventata.'),
    ('SPEC §4. Né il percorso `SFIDE` né il titolo Excel cambiano questa decisione.', 'Addendum §§1,11 supera SPEC §4; ogni percorso ha stato e dipendenze propri.'),
    ('Non serve risolvere ora il sistema delle sfide o la legenda dei loro eventuali modificatori per continuare menu, rete, galleria e fixture. Le celle `X`, `o`, `§`, `+`/`-`, le alternative `oppure` e la variante `M11=2` rimangono registrate per il futuro modulo; vanno chiarite prima di usarle come regole, non prima di qualsiasi lavoro indipendente.', 'Non va riaperto ciò che l’Addendum chiarisce: autorità, pentagono, precedenza, partecipanti, scelte coperte, swap gratuiti/no E, posta 1–2 mista, cima scelta dal perdente e nuovo ordine Boss. Per i punti ancora aperti e i relativi locatori consultare [ADDENDUM_1_AUDIT.md](ADDENDUM_1_AUDIT.md). Le celle e le immagini restano varianti da mappare esplicitamente; una lacuna specifica non blocca tutti i percorsi tecnici.')
])

edit('docs/CARD_ASSETS.md', [
    ('manifest `original-references-2`', 'manifest `original-references-3`'),
    ('Le risorse sono raggruppate per **simbolo visibile e valore**, ignorando le differenze del pentagono superiore secondo l\'indicazione esplicita dell\'autore.', 'Le risorse sono raggruppate per **simbolo inferiore visibile e valore** secondo l’organizzazione grafica del primo incremento. L’[Addendum 1](addendum-1.md) §§1–2 supera l’istruzione storica di ignorare il pentagono superiore: questo raggruppamento non è un’equivalenza meccanica. Ogni variante conserva il proprio pentagono, da trascrivere e verificare nei dati prima dell’uso ufficiale.'),
    ('Sono tutti rinviati per dipendenza dalle sfide.', 'L’esclusione generale delle sfide è superata dall’Addendum. Le varianti restano riferimenti non giocabili finché trascrizione, modalità, finestra e catena pertinenti non sono implementate e verificate; il titolo comune non autorizza a usare lo stesso effetto per tutte.'),
    ('| Geomanzia | Magia | P | Sfide Boss |', '| Geomanzia | Magia | P | Formula specifica e finestra Boss da integrare |'),
    ('| Bididi Bodidi Bu! | Magia | A | Gemme non acquisibili senza sfide |', '| Bididi Bodidi Bu! | Magia | A | Dettagli dell’effetto Gemme e relativo percorso ufficiale |'),
    ('| Venerare altri | Magia | P | Sfide Boss |', '| Venerare altri | Magia | P | Mazzo, finestra Boss e interruzione specifica da integrare |'),
    ('- `npm run typecheck` eseguito con il manifest v2 completo: superato.', '- Storico precedente all’Addendum: `npm run typecheck` eseguito con il manifest v2 completo, superato. Il coordinatore ha aggiornato le descrizioni al manifest v3 senza alterare i 60 riferimenti o i 181 file; nuovi test applicativi dell’Addendum sono attestati separatamente in COVERAGE/CHANGELOG.')
])

edit('docs/COVERAGE.md', [
    ('## Stato delle fonti e del catalogo', 'Stato aggiornato all’avvio dell’[Addendum 1](addendum-1.md). L’esclusione generale delle sfide è superata: i percorsi e le formule aperte sono distinti nell’[audit mirato](ADDENDUM_1_AUDIT.md). I test riportati nella sezione della base precedente non provano il nuovo modulo.\n\n## Stato delle fonti e del catalogo'),
    ('| Rinviata per sfide |', '| Dipendenza specifica dalle sfide |'),
    ('Spostastelle e altre carte dipendenti escluse', 'Trascrizioni, modalità e finestre delle singole varianti da integrare'),
    ('Titolo «75x CARTE SFIDA» non abilita le sfide', 'Addendum autorizza sviluppo; titolo e griglia non definiscono formule'),
    ('Dipende dai testi; capacità sfida sempre disabilitate', 'Dipende da testi, dati pentagoni e percorsi realmente implementati'),
    ('Sì: utilizzabile durante sfida Boss, ora disabilitata', 'Finestra Boss, mazzo e interruzione specifica da definire/integrare'),
    ('| Boss/DEUS, duelli e carte dipendenti | No | Conservare dati/asset quando disponibili | Nuove regole attese | Sì, comprese acquisizione/uso Gemme | Non verificabile per tipo |', '| Boss/DEUS, duelli e carte dipendenti ufficiali | 0 tipi ufficiali attestati | Percorsi Addendum in sviluppo; preset tecnico separato | Formula Boss/stelle protette/poste/interruzioni ancora aperte | Valutazione per percorso, senza esclusione generale | Ymir/Boss ufficiale non identificato; Demoni autorizzati mancanti |'),
    ('Questi conteggi documentano reperibilità e varianti grafiche; non sono il denominatore ufficiale e non implicano effetti giocabili.', 'Questi conteggi documentano reperibilità e varianti grafiche; non sono il denominatore ufficiale e non implicano effetti giocabili. In particolare i 25 gruppi risorsa non equivalgono meccanicamente alle varianti del pentagono superiore, ora rilevante per le sfide.'),
    ('## Fixture tecniche separate', '## Fixture tecniche della base precedente'),
    ('## Verifiche e avanzamento', '## Verifiche della base precedente all’Addendum\n\nRisultati effettivi conservati come baseline; non sono una nuova esecuzione né copertura delle sfide dell’Addendum.'),
    ('La selezione iniziale dovrà rappresentare meccaniche raggiungibili senza sfide.', 'La selezione iniziale dovrà rappresentare meccaniche completamente raggiungibili nei percorsi abilitati e verificati, comprese le sfide sufficientemente definite dall’Addendum.')
])

edit('PLAN.md', [
    ('Alpha web multiplayer per playtest, 2–5 posti umani/bot, senza sfide. Specifiche confermate dall\'autore nella conversazione del 9 settembre 2026.', 'Alpha web multiplayer per playtest, 2–5 posti umani/bot. La bozza iniziale è integrata da `docs/addendum-1.md` (9 settembre 2026), che supera l’esclusione generale delle sfide e il pentagono ignorato; conserva i moduli esistenti e sviluppa percorsi completi con regole confermate e policy tecniche separate.'),
    ('## Incremento corrente\nPrimo incremento tecnico eseguibile:', '## Base precedente conservata\nPrimo incremento tecnico eseguibile:'),
    ('Sfide e dipendenze dalle Gemme sospese.', 'Sfide autorizzate dall’Addendum per percorsi completi; formula Boss/riferimento stelle, dettagli poste e catene ancora aperti, isolati nel preset tecnico. Nessuna vittoria di partita inventata.'),
    ('## Verifiche correnti', '## Verifiche della base precedente all’Addendum'),
])

manifest_path = docs / 'sources' / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
for source in manifest['sources']:
    if source['id'] == 'specification':
        path = docs / 'specification.md'
        source.update(bytes=path.stat().st_size, sha256=hashlib.sha256(path.read_bytes()).hexdigest(), authority='Bozza storica preservata con nota di precedenza Addendum 1; valgono le disposizioni non incompatibili')
    if source['id'] == 'gdd' and not (root / source['path']).exists():
        source['path'] = 'esempi di carte/Demonicute_GDD_Living_Document_v0_1_2.docx'
    if source['id'] == 'card_images':
        for item in source['files']:
            if item['id'] == 'source-venerarealtri':
                item['suspension_reason'] = 'specific-boss-window-deck-and-interruption-pending'
for source_id, relative, authority in [
    ('base_specification_v1_original', 'docs/sources/base-specification-v1.md', 'Originale storico byte per byte; disposizioni incompatibili superate da Addendum 1'),
    ('addendum_1', 'docs/addendum-1.md', 'Richiesta esplicita autore: prevalente sulle disposizioni incompatibili della bozza; regole aperte restano aperte'),
]:
    file = root / relative
    manifest['sources'] = [s for s in manifest['sources'] if s['id'] != source_id]
    entry = dict(id=source_id, path=relative, status='available_read_complete', bytes=file.stat().st_size, sha256=hashlib.sha256(file.read_bytes()).hexdigest(), authority=authority)
    if source_id == 'addendum_1':
        original = Path('C:/Users/tomma/.codex/attachments/deb0a918-77b6-4cf2-9ad8-b046a8186519/pasted-text.txt')
        assert original.read_bytes() == file.read_bytes()
        entry.update(original_path=str(original), copied_byte_identical=True, review_document='docs/ADDENDUM_1_AUDIT.md')
    manifest['sources'].append(entry)
manifest['sources'] = [s for s in manifest['sources'] if s['id'] != 'ymir_boss_asset']
manifest['sources'].append(dict(id='ymir_boss_asset', expected_name='Ymir / immagine Boss con lati', status='not_identified_in_project_directories', sha256=None, authority='Addendum §7 cita immagine; nome non trovato nelle cartelle verificate, nessun media GDD; JSON Boss storico non autorevole'))
manifest['precedence'] = ['addendum_1_for_incompatible_provisions', 'base_specification_unmodified_provisions', 'gdd_provisional_states', 'official_demons_only_authorized_Demoni_sheet']
manifest['update_note'] = 'Addendum 1 letto/copiato integralmente; esclusione generale sfide e pentagono ignorato superati. Modulo per percorsi verificati e policy tecniche separate; cutes/Demoni e Ymir non identificati nei progetti. 60 riferimenti grafici/181 file, nessuna equivalenza meccanica fra pentagoni diversi, 0 carte ufficiali attive; nuovi test da attestare separatamente.'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Updated Addendum documents and source manifest; original attachment unchanged.')
