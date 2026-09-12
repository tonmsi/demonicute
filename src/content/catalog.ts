import type { CardDefinition } from '../shared/game.js';
import { CHALLENGE_CARD_DEFINITIONS } from './challenges.js';

/** No official cards: the authoritative Excel sheet has not been supplied. */
export const CATALOG_VERSION = 'technical-fixtures-plus-challenges-2';
export const RULES_VERSION = 'addendum-1-plus-declared-fixture-policies-2';
export const PRESET = Object.freeze({
  id: 'technical-fixtures',
  label: 'Fixture tecniche · nessuna carta ufficiale',
  officialCardCount: 0,
  playerRange: [2, 5] as const,
  actionsPerTurn: 2,
  slotsPerPlayer: 4,
  pileLimit: 3,
  limboSize: 5,
  startingHandSize: 5,
  drawCount: 1,
  handLimit: 20,
  resourceCopies: 120,
  demonCopiesPerDefinition: 16,
  defaultMaxTurns: 300,
  defaultMaxActions: 1_000,
  maxActionsMetric: 'accepted commands, including endTurn',
  exhaustionPolicy: 'finite decks; no recycling',
  paymentPolicy: 'exact cost in generic one-unit resources',
  sources: {
    actionsPerTurn: 'Proposta GDD, Appendice A',
    slotsPerPlayer: 'Proposta GDD, plancia personale',
    pileLimit: 'Proposta GDD 7.4',
    limboSize: 'Proposta B, GDD 6.4',
    startingHandSize: 'Proposta GDD 5.1',
    everythingElse: 'Fixture tecnica: non è un regolamento ufficiale',
  },
  notes: [
    'Evocazione dal Limbo; costo esatto in risorse generiche da 1 unità.',
    'Pesca di 1 risorsa; mano massima 20; nessun Famiglio.',
    'Solo il demone in cima contribuisce stelle ed effetti; la fixture P aggiunge 1 stella a sé stessa.',
    'Le azioni E e A pescano una risorsa, se disponibile e se la mano non è piena.',
    'Un effetto E senza risorse disponibili non annulla l’evocazione; A non è attivabile se non può pescare.',
    'Le pile non vengono smontate; mazzi finiti senza riciclo.',
    'Fine turno esplicita, anche con zero azioni; maxActions conta anche fine turno.',
    'Partite interrotte dai limiti tecnici senza vincitore; entrambe le sfide disabilitate.',
    'Nomi, stelle, costi, effetti e quantità sono fixture tecniche, non carte ufficiali.',
  ],
});

const fixture = (definition: Omit<CardDefinition, 'imagePath' | 'source' | 'fixture'>): CardDefinition =>
  Object.freeze({ ...definition, imagePath: null, source: 'Fixture tecnica locale; nessuna fonte ufficiale', fixture: true });

export const CARD_DEFINITIONS: Readonly<Record<string, CardDefinition>> = Object.freeze({
  ...CHALLENGE_CARD_DEFINITIONS,
  'fixture-resource': fixture({ id: 'fixture-resource', name: 'Risorsa fixture · 1', category: 'resource', element: 'generico', stars: 0, cost: 0, description: 'Fixture: paga una unità di costo generico.', effect: 'none' }),
  'fixture-none': fixture({ id: 'fixture-none', name: 'Fixture N · Nessun effetto', category: 'demon', element: 'fixture', stars: 1, cost: 0, description: 'Fixture tecnica: 1 stella, costo 0, nessun effetto.', effect: 'none' }),
  'fixture-entry': fixture({ id: 'fixture-entry', name: 'Fixture E · Entrata', category: 'demon', element: 'fixture', stars: 2, cost: 1, description: 'Fixture tecnica E: all’entrata pesca 1 risorsa, se possibile.', effect: 'entry-draw' }),
  'fixture-action': fixture({ id: 'fixture-action', name: 'Fixture A · Azione', category: 'demon', element: 'fixture', stars: 3, cost: 2, description: 'Fixture tecnica A: spendi 1 azione per pescare 1 risorsa.', effect: 'action-draw' }),
  'fixture-passive': fixture({ id: 'fixture-passive', name: 'Fixture P · Passiva', category: 'demon', element: 'fixture', stars: 3, cost: 3, description: 'Fixture tecnica P: vale +1 stella mentre è in cima.', effect: 'passive-star' }),
});

