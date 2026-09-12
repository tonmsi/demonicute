import type { BossView, CardInstance, ChallengeRecord, Command, GameAction, GameEvent, GameView, PlayerSetup, PlayerView, PresetId } from '../shared/game.js';
import { CARD_DEFINITIONS, CATALOG_VERSION, PRESET, RULES_VERSION } from '../content/catalog.js';
import { CHALLENGE_BLOCKERS, CHALLENGE_POLICY, FIXTURE_BOSS } from '../content/challenges.js';
import { applyChallengeMutable, challengeLegalActions, challengeView, countPlayerStars, declareChallengeMutable, expireChallengeWindowMutable, interruptChallengeMutable, mayDeclareDuel, type ChallengeState } from './challenges.js';
export { countElementalStars, countPlayerStars } from './challenges.js';

export interface PlayerState extends PlayerSetup { hand: CardInstance[]; piles: CardInstance[][]; gems: string[] }
interface Receipt { actorId: string; id: string; fingerprint: string }
/** Private authoritative state. Only getView may cross the network or reach a bot. */
export interface GameState {
  version: number; rulesVersion: string; catalogVersion: string; presetId: string;
  phase: 'playing' | 'ended'; turnNumber: number; currentPlayerId: string; actionsRemaining: number;
  players: PlayerState[]; limbo: CardInstance[]; discard: CardInstance[];
  supply: CardInstance[]; invocations: CardInstance[]; events: GameEvent[];
  seed: number; rngState: number; receipts: Receipt[];
  acceptedCommands: number; maxTurns: number; maxActions: number; lastNow: number;
  stopReason?: string; winner: null;
  capabilities: { bossChallenges: boolean; magistDuels: boolean };
  challenge: ChallengeState | null; challengeHistory: ChallengeRecord[]; boss: BossView | null;
  bossDeck: CardInstance[]; gemSupply: string[];
}
export interface CommandResult { ok: boolean; state: GameState; error?: string; duplicate?: boolean }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function hasKeys(value: Record<string, unknown>, keys: string[], optional: string[] = []): boolean {
  return keys.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => keys.includes(key) || optional.includes(key));
}
const validId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 && id.length <= 120 && !/[\x00-\x1f\x7f]/.test(id);
const validTime = (now: number): boolean => Number.isFinite(now) && now >= 0;

function parseCommand(input: unknown): Command | undefined {
  if (!isRecord(input) || !hasKeys(input, ['id', 'expectedVersion', 'action']) || !validId(input.id) || !Number.isSafeInteger(input.expectedVersion) || (input.expectedVersion as number) < 0 || !isRecord(input.action)) return;
  const action = input.action;
  switch (action.type) {
    case 'draw': case 'endTurn': case 'challengeBoss': case 'challengePass': case 'challengeReady':
      if (!hasKeys(action, ['type'])) return;
      break;
    case 'challengeMagist':
      if (!hasKeys(action, ['type'], ['targetId', 'stake']) || (action.targetId !== undefined && !validId(action.targetId)) || (action.stake !== undefined && action.stake !== 1 && action.stake !== 2)) return;
      break;
    case 'challengeCommit':
      if (!hasKeys(action, ['type', 'cardId'], ['elementChoice']) || (action.cardId !== null && !validId(action.cardId)) || (action.elementChoice !== undefined && !validId(action.elementChoice))) return;
      break;
    case 'challengeShift':
      if (!hasKeys(action, ['type', 'cardId', 'mode'], ['targetId']) || !validId(action.cardId) || !['rotate', 'refuse', 'redirect'].includes(action.mode as string) || (action.targetId !== undefined && !validId(action.targetId))) return;
      break;
    case 'challengeReplace':
      if (!hasKeys(action, ['type', 'cardId', 'slot']) || !validId(action.cardId) || !Number.isInteger(action.slot) || (action.slot as number) < 0 || (action.slot as number) >= PRESET.slotsPerPlayer) return;
      break;
    case 'activate': case 'challengeLoseDemon':
      if (!hasKeys(action, ['type', 'cardId']) || !validId(action.cardId)) return;
      break;
    case 'summon':
      if (!hasKeys(action, ['type', 'cardId', 'slot', 'paymentIds']) || !validId(action.cardId) || !Number.isInteger(action.slot) || (action.slot as number) < 0 || (action.slot as number) >= PRESET.slotsPerPlayer || !Array.isArray(action.paymentIds) || action.paymentIds.length > PRESET.handLimit || !action.paymentIds.every(validId)) return;
      break;
    default: return;
  }
  return input as unknown as Command;
}

function fingerprint(command: Command): string {
  // Canonical property order also makes retries independent of JSON key ordering.
  const action = command.action;
  const entries = Object.entries(action).filter(([, value]) => value !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => [key, key === 'paymentIds' ? [...value as string[]].sort() : value]);
  return JSON.stringify([command.expectedVersion, entries]);
}
function random(state: { rngState: number }): number {
  state.rngState = (state.rngState + 0x6d2b79f5) >>> 0;
  let value = state.rngState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
}
function shuffle<T>(cards: T[], state: { rngState: number }): T[] {
  for (let index = cards.length - 1; index > 0; index--) {
    const other = Math.floor(random(state) * (index + 1));
    [cards[index], cards[other]] = [cards[other], cards[index]];
  }
  return cards;
}
function event(state: GameState, type: string, text: string, now: number, actorId?: string): void {
  state.events.push({ id: `event-${state.events.length + 1}`, version: state.version, type, text, timestamp: now, ...(actorId ? { actorId } : {}) });
}
const canDraw = (state: GameState, player: PlayerState): boolean => state.supply.length > 0 && player.hand.length < PRESET.handLimit;
function drawResource(state: GameState, player: PlayerState): boolean {
  if (!canDraw(state, player)) return false;
  player.hand.push(state.supply.shift()!);
  return true;
}
function stars(player: PlayerState): number {
  return player.piles.reduce((total, pile) => {
    const top = pile.at(-1);
    if (!top) return total;
    const definition = CARD_DEFINITIONS[top.definitionId];
    return total + definition.stars + (definition.effect === 'passive-star' ? 1 : 0);
  }, 0);
}
function validateLimit(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > 100_000) throw new TypeError(`${name} deve essere un intero tra 1 e 100000 (limite tecnico).`);
  return value;
}

export function createGame(players: PlayerSetup[], seed: number, options: { maxTurns?: number; maxActions?: number; now?: number; preset?: PresetId } = {}): GameState {
  if (!Array.isArray(players) || players.length < 2 || players.length > 5) throw new TypeError('Sono richiesti da 2 a 5 giocatori.');
  if (!Number.isSafeInteger(seed)) throw new TypeError('Seed non valido: richiesto un intero sicuro.');
  if (!isRecord(options) || !Object.keys(options).every(key => ['maxTurns', 'maxActions', 'now', 'preset'].includes(key)) || (options.preset !== undefined && !['technical-fixtures', 'challenge-fixtures'].includes(options.preset))) throw new TypeError('Opzioni non valide.');
  const challenges = options.preset === 'challenge-fixtures';
  const now = options.now ?? 0;
  if (!validTime(now)) throw new TypeError('Timestamp non valido.');
  const ids = new Set<string>();
  for (const player of players) {
    if (!isRecord(player) || !hasKeys(player, ['id', 'name', 'kind'], ['difficulty']) || !validId(player.id) || ids.has(player.id) || typeof player.name !== 'string' || player.name.trim().length === 0 || player.name.length > 80 || !['human', 'bot'].includes(player.kind as string) || (player.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(player.difficulty as string))) throw new TypeError('Configurazione giocatore non valida.');
    ids.add(player.id);
  }
  const state: GameState = {
    version: 0, rulesVersion: RULES_VERSION, catalogVersion: CATALOG_VERSION, presetId: options.preset ?? PRESET.id,
    phase: 'playing', turnNumber: 1, currentPlayerId: players[0].id, actionsRemaining: PRESET.actionsPerTurn,
    players: players.map(player => ({ ...player, name: player.name.trim(), hand: [], piles: Array.from({ length: PRESET.slotsPerPlayer }, () => []), gems: [] })),
    limbo: [], discard: [], supply: [], invocations: [], events: [], seed, rngState: seed >>> 0, receipts: [],
    acceptedCommands: 0, maxTurns: validateLimit(options.maxTurns ?? PRESET.defaultMaxTurns, 'maxTurns'), maxActions: validateLimit(options.maxActions ?? PRESET.defaultMaxActions, 'maxActions'), lastNow: now,
    winner: null, capabilities: { bossChallenges: challenges, magistDuels: challenges },
    challenge: null, challengeHistory: [], boss: challenges ? structuredClone(FIXTURE_BOSS) : null, bossDeck: [], gemSupply: [],
  };
  const supplyDefinitions = challenges ? ['fixture-resource', 'fixture-plus-earth', 'fixture-minus-earth', 'fixture-zero-earth', 'fixture-protect-earth', 'fixture-choice', 'fixture-shifter'] : ['fixture-resource'];
  state.supply = shuffle(Array.from({ length: PRESET.resourceCopies }, (_, index) => ({ instanceId: `resource-${index + 1}`, definitionId: supplyDefinitions[index % supplyDefinitions.length] })), state);
  state.invocations = shuffle(Object.values(CARD_DEFINITIONS).filter(card => card.category === 'demon' && (challenges ? card.challengeFixture : !card.challengeFixture)).flatMap(card => Array.from({ length: PRESET.demonCopiesPerDefinition }, (_, index) => ({ instanceId: `${card.id}-${index + 1}`, definitionId: card.id }))), state);
  for (const player of state.players) for (let index = 0; index < PRESET.startingHandSize; index++) drawResource(state, player);
  if (challenges) {
    state.bossDeck = shuffle(Array.from({ length: 48 }, (_, index) => ({ instanceId: `boss-response-${index + 1}`, definitionId: supplyDefinitions[index % supplyDefinitions.length] })), state);
    state.gemSupply = Array.from({ length: 60 }, (_, index) => `fixture-gem-${index + 1}`);
    for (const player of state.players) {
      player.gems.push(state.gemSupply.shift()!);
      for (let slot = 0; slot < 2; slot++) player.piles[slot].push(...state.invocations.splice(0, 2));
    }
  }
  state.limbo = state.invocations.splice(0, PRESET.limboSize);
  event(state, 'gameStarted', challenges ? 'Preset sfide fixture: Boss e duelli abilitati con policy tecniche dichiarate; nessuna vittoria della partita.' : 'Partita avviata con sole fixture tecniche. Le due sfide sono disabilitate in questo preset; nessuna condizione di vittoria.', now);
  return state;
}

function legalActions(state: GameState, viewerId: string): GameAction[] {
  if (state.challenge) return challengeLegalActions(state, viewerId);
  if (state.phase !== 'playing' || state.currentPlayerId !== viewerId) return [];
  const player = state.players.find(player => player.id === viewerId);
  if (!player) return [];
  const actions: GameAction[] = [];
  if (state.actionsRemaining > 0) {
    if (state.capabilities.bossChallenges && state.bossDeck.length && state.gemSupply.length) actions.push({ type: 'challengeBoss' });
    if (state.capabilities.magistDuels) for (const defender of state.players) for (const stake of [1, 2] as const) {
      if (mayDeclareDuel(state, player, defender, stake)) actions.push({ type: 'challengeMagist', targetId: defender.id, stake });
    }
    if (canDraw(state, player)) actions.push({ type: 'draw' });
    const resources = player.hand.filter(card => CARD_DEFINITIONS[card.definitionId].category === 'resource');
    for (const card of state.limbo) {
      const definition = CARD_DEFINITIONS[card.definitionId];
      if (resources.length < definition.cost) continue;
      for (let slot = 0; slot < PRESET.slotsPerPlayer; slot++) {
        if (player.piles[slot].length < PRESET.pileLimit) actions.push({ type: 'summon', cardId: card.instanceId, slot, paymentIds: resources.slice(0, definition.cost).map(resource => resource.instanceId) });
      }
    }
    if (canDraw(state, player)) for (const pile of player.piles) {
      const top = pile.at(-1);
      if (top && CARD_DEFINITIONS[top.definitionId].effect === 'action-draw') actions.push({ type: 'activate', cardId: top.instanceId });
    }
  }
  actions.push({ type: 'endTurn' });
  return actions;
}

export function getView(state: GameState, viewerId: string): GameView {
  const players: PlayerView[] = state.players.map(player => ({
    id: player.id, name: player.name, kind: player.kind, ...(player.difficulty ? { difficulty: player.difficulty } : {}),
    handCount: player.hand.length, ...(viewerId === player.id ? { hand: player.hand } : {}), piles: player.piles, stars: stars(player), gems: player.gems,
  }));
  return structuredClone({
    version: state.version, rulesVersion: state.rulesVersion, catalogVersion: state.catalogVersion, presetId: state.presetId,
    phase: state.phase, turnNumber: state.turnNumber, currentPlayerId: state.currentPlayerId, actionsRemaining: state.actionsRemaining,
    players, limbo: state.limbo, discard: state.discard, supplyCount: state.supply.length, invocationCount: state.invocations.length,
    events: state.events, legalActions: legalActions(state, viewerId), ...(state.stopReason ? { stopReason: state.stopReason } : {}),
    winner: null, capabilities: state.capabilities,
    challenge: challengeView(state, viewerId), challengeHistory: state.challengeHistory, boss: state.boss,
    pendingActorIds: state.players.filter(player => legalActions(state, player.id).length > 0).map(player => player.id),
    challengePolicy: CHALLENGE_POLICY, blockedCapabilities: CHALLENGE_BLOCKERS,
  });
}

export function applyCommand(state: GameState, actorId: string, input: Command, now: number): CommandResult {
  const fail = (error: string): CommandResult => ({ ok: false, state, error });
  const command = parseCommand(input);
  if (!command) return fail('Comando malformato.');
  const player = state.players.find(player => player.id === actorId);
  if (!player) return fail('Giocatore sconosciuto.');
  if (command.action.type === 'challengeBoss' && !state.capabilities.bossChallenges) return fail('Sfide Boss disabilitate in questo preset; usa Sfide fixture.');
  if (command.action.type === 'challengeMagist' && !state.capabilities.magistDuels) return fail('Duelli Magisti disabilitati in questo preset; usa Sfide fixture.');
  const print = fingerprint(command);
  const receipt = state.receipts.find(receipt => receipt.actorId === actorId && receipt.id === command.id);
  if (receipt) return receipt.fingerprint === print ? { ok: true, state, duplicate: true } : fail('ID comando già usato con un contenuto diverso.');
  if (command.expectedVersion !== state.version) return fail('Versione non aggiornata: sincronizza lo stato e riprova.');
  if (state.phase !== 'playing') return fail('La partita è terminata senza vincitore.');
  if (!validTime(now) || now < state.lastNow) return fail('Timestamp non valido o precedente allo stato corrente.');
  const action = command.action;
  if (state.challenge || action.type.startsWith('challenge')) {
    if (state.challenge?.window && now >= state.challenge.window.expiresAt) return fail('Finestra facoltativa scaduta; sincronizza il tempo di gioco.');
    const legal = legalActions(state, actorId);
    if (!legal.some(candidate => fingerprint({ ...command, action: candidate }) === print)) {
      if (action.type === 'challengeCommit' && action.cardId && player.hand.some(card => card.instanceId === action.cardId && CARD_DEFINITIONS[card.definitionId].modifier?.kind === 'per-gem-undefined')) return fail('−1 per Gemma bloccato: formula non definita.');
      return fail('Azione sfida non legale: verifica partecipante, fase, carta, scelta già impegnata e disponibilità della posta.');
    }
    const next = structuredClone(state);
    next.version++;
    next.lastNow = now;
    next.acceptedCommands++;
    next.receipts.push({ actorId, id: command.id, fingerprint: print });
    if (action.type === 'challengeBoss' || action.type === 'challengeMagist') {
      next.actionsRemaining--;
      declareChallengeMutable(next, actorId, action, now);
    } else applyChallengeMutable(next, actorId, action, now);
    if (next.acceptedCommands >= next.maxActions) endMutable(next, now, `Limite tecnico: ${next.maxActions} comandi accettati (fine turno incluso).`);
    return { ok: true, state: next };
  }
  if (state.currentPlayerId !== actorId) return fail('Non è il tuo turno.');
  if (action.type !== 'endTurn' && state.actionsRemaining <= 0) return fail('Azioni esaurite: termina il turno.');
  switch (action.type) {
    case 'draw':
      if (!canDraw(state, player)) return fail(state.supply.length === 0 ? 'Mazzo risorse esaurito: nessun riciclo nel preset tecnico.' : 'Limite tecnico della mano raggiunto (20).');
      break;
    case 'summon': {
      const card = state.limbo.find(card => card.instanceId === action.cardId);
      if (!card) return fail('Demone non presente nel Limbo.');
      if (player.piles[action.slot].length >= PRESET.pileLimit) return fail('Pila piena: massimo 3 carte.');
      const definition = CARD_DEFINITIONS[card.definitionId];
      if (definition.category !== 'demon') return fail('La carta non è un demone.');
      if (new Set(action.paymentIds).size !== action.paymentIds.length) return fail('Risorsa di pagamento duplicata.');
      if (action.paymentIds.length !== definition.cost) return fail('Il pagamento deve corrispondere esattamente al costo.');
      if (!action.paymentIds.every(id => player.hand.some(card => card.instanceId === id && CARD_DEFINITIONS[card.definitionId].category === 'resource'))) return fail('Il pagamento contiene risorse non disponibili nella tua mano.');
      break;
    }
    case 'activate': {
      const card = player.piles.map(pile => pile.at(-1)).find(card => card?.instanceId === action.cardId);
      if (!card || CARD_DEFINITIONS[card.definitionId].effect !== 'action-draw') return fail('Solo una fixture A in cima alla tua pila può attivarsi.');
      if (!canDraw(state, player)) return fail('La fixture A non può pescare: mano piena o mazzo esaurito.');
      break;
    }
  }
  // All validation precedes the copy and every mutation. Failures preserve the original object.
  const next = structuredClone(state);
  const current = next.players.find(player => player.id === actorId)!;
  next.version++;
  next.lastNow = now;
  next.acceptedCommands++;
  next.receipts.push({ actorId, id: command.id, fingerprint: print });
  if (action.type !== 'endTurn') next.actionsRemaining--;
  switch (action.type) {
    case 'draw':
      drawResource(next, current);
      event(next, 'draw', `${current.name} pesca una risorsa.`, now, actorId);
      break;
    case 'summon': {
      const index = next.limbo.findIndex(card => card.instanceId === action.cardId);
      const [card] = next.limbo.splice(index, 1);
      const payments = new Set(action.paymentIds);
      next.discard.push(...current.hand.filter(card => payments.has(card.instanceId)));
      current.hand = current.hand.filter(card => !payments.has(card.instanceId));
      current.piles[action.slot].push(card);
      const definition = CARD_DEFINITIONS[card.definitionId];
      event(next, 'summon', `${current.name} evoca ${definition.name} nello slot ${action.slot + 1}, pagando ${definition.cost}.`, now, actorId);
      if (definition.effect === 'entry-draw') {
        const drawn = drawResource(next, current);
        event(next, 'entryEffect', drawn ? 'Effetto E fixture: una risorsa pescata.' : 'Effetto E fixture senza pesca: mano piena o mazzo esaurito.', now, actorId);
      }
      if (next.invocations.length) next.limbo.splice(index, 0, next.invocations.shift()!);
      break;
    }
    case 'activate':
      drawResource(next, current);
      event(next, 'actionEffect', `${current.name} attiva una fixture A e pesca una risorsa (1 azione).`, now, actorId);
      break;
    case 'endTurn':
      event(next, 'endTurn', `${current.name} termina il turno.`, now, actorId);
      if (next.turnNumber >= next.maxTurns) endMutable(next, now, `Limite tecnico: ${next.maxTurns} turni.`);
      else {
        const index = next.players.findIndex(player => player.id === actorId);
        next.currentPlayerId = next.players[(index + 1) % next.players.length].id;
        next.turnNumber++;
        next.actionsRemaining = PRESET.actionsPerTurn;
        event(next, 'turnStarted', `Turno di ${next.players[(index + 1) % next.players.length].name}.`, now, next.currentPlayerId);
      }
      break;
  }
  if (next.phase === 'playing' && next.acceptedCommands >= next.maxActions) endMutable(next, now, `Limite tecnico: ${next.maxActions} comandi accettati (fine turno incluso).`);
  return { ok: true, state: next };
}

function endMutable(state: GameState, now: number, reason: string): void {
  interruptChallengeMutable(state, now);
  state.phase = 'ended';
  state.actionsRemaining = 0;
  state.stopReason = reason;
  event(state, 'gameStopped', `${reason} Nessun vincitore.`, now);
}
/** Advances only optional reaction windows. Mandatory preparation and loss choices never expire. */
export function advanceTime(state: GameState, now: number): CommandResult {
  if (!validTime(now) || now < state.lastNow) return { ok: false, state, error: 'Timestamp non valido o precedente allo stato corrente.' };
  if (state.phase !== 'playing' || !state.challenge?.window || now < state.challenge.window.expiresAt) return { ok: true, state };
  const next = structuredClone(state);
  next.version++;
  next.lastNow = now;
  expireChallengeWindowMutable(next, now);
  return { ok: true, state: next };
}
export function stopGame(state: GameState, now: number, reason: string): GameState {
  if (state.phase === 'ended') return state;
  if (!validTime(now) || now < state.lastNow || typeof reason !== 'string' || !reason.trim() || reason.length > 300) throw new TypeError('Interruzione non valida.');
  const next = structuredClone(state);
  next.version++;
  next.lastNow = now;
  endMutable(next, now, reason.trim());
  return next;
}
