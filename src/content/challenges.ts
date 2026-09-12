import type { BossView, CardDefinition } from '../shared/game.js';

export const CHALLENGE_POLICY = [
  'Preset esclusivamente tecnico: nessuna carta o formula ufficiale; una sfida costa 1 azione.',
  'Setup fixture: mano di 5 carte, 2 Pile di 2 Demoni e 1 Gemma per Magista; 120 carte pesca, 48 Demoni, 48 risposte Boss e 60 Gemme totali. Mazzi finiti senza riciclo.',
  'Riferimento tecnico delle stelle: stampate più il passivo fixture della cima attiva; il giallo conserva quel riferimento.',
  'Spostastelle: priorità seriale nell’ordine dei posti, una carta per giocatore per sfida; finestra facoltativa di 5000 ms solo se esiste una risposta legale.',
  'Contro il Boss tutti possono ruotare; nel duello solo il difensore può rifiutare/deviare, soltanto se può pescare la carta prevista dopo lo scarto dello Spostastelle. Una sola deviazione, senza nuova catena di reazioni.',
  'Preparazione obbligatoria senza scadenza: è permesso impegnare nessun modificatore, anche a mano vuota. Pronto blocca anche le sostituzioni.',
  'Mazzo risposte Boss fixture separato e finito; una risposta senza pentagono vale neutra. Spostastelle ruota solo in senso orario senza seconda pescata.',
  'Scelta alternativa del Boss fixture: minimizza stelle attaccante meno stelle Boss tra le sole opzioni stampate; parità risolta nell’ordine stampato.',
  'Formula Boss fixture a 5 lati: il lato è una singola unità con valore stampato, elemento primario e nessun passivo; i secondari sono dati esposti senza formula. Valori 4/6/3/7/5 ed elementi Terra/Fuoco/Acqua/Aria/Etere sono soltanto test.',
  'Gemme fixture generiche: la vittoria stretta sul Boss prende 1 Gemma dalla riserva finita; parità/sconfitta non hanno altre conseguenze.',
  'Posta tecnica: disponibilità ricalcolata alla risoluzione, Gemme prima, poi cime Demoni, poi mano; entrambe le parti devono coprire la posta alla dichiarazione.',
  'Non è legale impegnare una carta che rende la propria posta insufficiente; una successiva indisponibilità o mano ricevente piena interrompe la posta prima dei trasferimenti.',
  'Gemme trasferite per ID ordinato; carte mano trasferite per ID ordinato senza identità pubblica; capienza del ricevente verificata alla dichiarazione.',
  'Il perdente sceglie ogni cima da rimuovere. Ogni Pila contribuisce al massimo una perdita per sfida; ritorno in fondo al mazzo evocazioni senza rimescolare.',
  'Pareggio tra Magisti fixture: nessuna posta; sfida rifiutata non restituisce l’azione. Nessuna vittoria della partita definita.',
];
export const CHALLENGE_BLOCKERS = [
  'Regole ufficiali ancora aperte: riferimento delle stelle protette/passivi, formula e mazzo Boss, pareggio duelli, dettagli poste e interruzioni.',
  '−1 per Gemma bloccato: proprietà delle Gemme, scala del malus, protezione e minimo non definiti.',
  'Nessun Demone ufficiale: il foglio Demoni dell’Excel richiesto non è disponibile; nessun Ymir o testo passivo inventato.',
];
export const REACTION_MS = 5_000;
export const FIXTURE_BOSS: BossView = {
  id: 'fixture-boss', name: 'Boss geometrico · fixture tecnica', fixture: true, orientation: 0,
  sides: [
    { label: 'I', stars: 4, element: 'Terra', secondaryElements: ['Aria'] },
    { label: 'II', stars: 6, element: 'Fuoco', secondaryElements: ['Acqua'] },
    { label: 'III', stars: 3, element: 'Acqua', secondaryElements: ['Terra'] },
    { label: 'IV', stars: 7, element: 'Aria', secondaryElements: ['Fuoco'] },
    { label: 'V', stars: 5, element: 'Etere', secondaryElements: ['Terra'] },
  ],
};
const fixture = (value: Omit<CardDefinition, 'fixture' | 'imagePath' | 'source' | 'challengeFixture'>): CardDefinition => ({ ...value, fixture: true, challengeFixture: true, imagePath: null, source: 'Fixture tecnica Addendum 1; nessun originale' });
const pentagon = (id: string, name: string, modifier: CardDefinition['modifier']): CardDefinition => fixture({ id, name, modifier, category: 'resource', element: 'generico', stars: 0, cost: 0, effect: 'none', description: `Fixture pentagono: ${name}. Il testo principale non si attiva quando usata come modificatore.` });
export const CHALLENGE_CARD_DEFINITIONS: Record<string, CardDefinition> = {
  'fixture-earth': fixture({ id: 'fixture-earth', name: 'Demone Terra · fixture', category: 'demon', element: 'Terra', stars: 1, cost: 0, effect: 'none', description: 'Fixture: Terra, 1 stella.' }),
  'fixture-fire': fixture({ id: 'fixture-fire', name: 'Demone Fuoco E · fixture', category: 'demon', element: 'Fuoco', stars: 2, cost: 1, effect: 'entry-draw', modifier: { kind: 'numeric', element: 'Fuoco', amount: 1 }, description: 'Fixture: Fuoco, 2 stelle; Entrata pesca una carta. Pentagono fixture +1 Fuoco, distinto dal testo E.' }),
  'fixture-earth-passive': fixture({ id: 'fixture-earth-passive', name: 'Demone Terra P · fixture', category: 'demon', element: 'Terra', stars: 2, cost: 2, effect: 'passive-star', description: 'Fixture: Terra, 2 stelle; passivo +1 solo in cima.' }),
  'fixture-plus-earth': pentagon('fixture-plus-earth', '+1 Terra · fixture', { kind: 'numeric', element: 'Terra', amount: 1 }),
  'fixture-minus-earth': pentagon('fixture-minus-earth', '−2 Terra · fixture', { kind: 'numeric', element: 'Terra', amount: -2 }),
  'fixture-zero-earth': pentagon('fixture-zero-earth', 'X Terra · fixture', { kind: 'zero', element: 'Terra' }),
  'fixture-protect-earth': pentagon('fixture-protect-earth', 'Giallo Terra · fixture', { kind: 'protect', element: 'Terra' }),
  'fixture-choice': pentagon('fixture-choice', '+1 Terra oppure Fuoco · fixture', { kind: 'choice', elements: ['Terra', 'Fuoco'], amount: 1 }),
  'fixture-per-gem-undefined': pentagon('fixture-per-gem-undefined', '−1 per Gemma · BLOCCATO', { kind: 'per-gem-undefined' }),
  'fixture-shifter': fixture({ id: 'fixture-shifter', name: 'Spostastelle · fixture del testo confermato', category: 'resource', element: 'generico', stars: 0, cost: 0, effect: 'none', description: 'Una modalità: ruota il Boss di 1 posizione oraria; oppure rifiuta/devia una sfida e pesca una carta. Finestre e priorità sono tecniche.', starshifter: { clockwiseSteps: 1, refuseOrRedirectAndDraw: true } }),
};
