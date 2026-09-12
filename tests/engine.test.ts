import test from 'node:test';
import assert from 'node:assert/strict';
import type { CardInstance, Command, Difficulty, GameAction, PlayerSetup } from '../src/shared/game.js';
import { applyCommand, createGame, getView, stopGame, type GameState } from '../src/engine/index.js';
import { CARD_DEFINITIONS, PRESET } from '../src/content/catalog.js';
import { chooseAction } from '../src/bots/index.js';
import { replaySession, simulateSession } from '../src/simulator/index.js';

const players: PlayerSetup[] = [{ id: 'alice', name: 'Alice', kind: 'human' }, { id: 'bob', name: 'Bob', kind: 'bot', difficulty: 'medium' }];
const setup = (seed = 42): GameState => createGame(players, seed);
function act(state: GameState, action: GameAction, actorId = state.currentPlayerId, id = `command-${state.version}`): GameState {
  const result = applyCommand(state, actorId, { id, expectedVersion: state.version, action }, state.lastNow + 1);
  assert.equal(result.ok, true, result.error);
  return result.state;
}
function cardIds(state: GameState): string[] {
  return [...state.supply, ...state.invocations, ...state.limbo, ...state.discard, ...state.players.flatMap(player => [...player.hand, ...player.piles.flat()])].map(card => card.instanceId).sort();
}
function expose(state: GameState, definitionId: string): CardInstance {
  const present = state.limbo.find(card => card.definitionId === definitionId);
  if (present) return present;
  const index = state.invocations.findIndex(card => card.definitionId === definitionId);
  assert.notEqual(index, -1, `Fixture non disponibile: ${definitionId}`);
  [state.limbo[0], state.invocations[index]] = [state.invocations[index], state.limbo[0]];
  return state.limbo[0];
}
function readyTurn(state: GameState, actorId: string): GameState {
  state = act(state, { type: 'endTurn' });
  while (state.currentPlayerId !== actorId) state = act(state, { type: 'endTurn' });
  return state;
}
function summon(state: GameState, definitionId: string, slot = 0): GameState {
  const card = expose(state, definitionId);
  return act(state, { type: 'summon', cardId: card.instanceId, slot, paymentIds: state.players.find(player => player.id === state.currentPlayerId)!.hand.slice(0, CARD_DEFINITIONS[definitionId].cost).map(card => card.instanceId) });
}

test('setup is reproducible, finite, and uses zero official cards', () => {
  const state = setup();
  assert.deepEqual(state, setup());
  assert.notDeepEqual(state.invocations, setup(43).invocations);
  assert.equal(state.limbo.length, 5);
  assert.equal(state.players[0].hand.length, 5);
  assert.equal(state.players[0].piles.length, 4);
  assert.equal(state.supply.length, 110);
  assert.equal(state.invocations.length, 59);
  assert.equal(cardIds(state).length, 184);
  assert.equal(new Set(cardIds(state)).size, 184);
  assert.equal(PRESET.officialCardCount, 0);
  assert.ok(Object.values(CARD_DEFINITIONS).every(card => card.fixture && card.imagePath === null));
  assert.equal(state.winner, null);
  assert.deepEqual(state.capabilities, { bossChallenges: false, magistDuels: false });
});

test('runtime setup rejects bad player counts, duplicate identities, unsupported parameters and clocks', () => {
  assert.throws(() => createGame([], 42));
  assert.throws(() => createGame(Array.from({ length: 6 }, (_, i) => ({ id: `p-${i}`, name: 'P', kind: 'human' })), 42));
  assert.throws(() => createGame([players[0], players[0]], 42));
  assert.throws(() => createGame(players, Number.NaN));
  assert.throws(() => createGame(players, 1, { maxTurns: 0 }));
  assert.throws(() => createGame(players, 1, { maxActions: 100_001 }));
  assert.throws(() => createGame(players, 1, { now: Number.POSITIVE_INFINITY }));
  assert.throws(() => createGame(players, 1, { unofficial: true } as never));
  assert.throws(() => createGame([{ id: 'p', name: '', kind: 'human' }, players[1]], 42));
});

test('views are deep copies with only the viewer hand and no seed, decks or receipts', () => {
  const state = setup();
  const view = getView(state, 'alice');
  assert.ok(view.players[0].hand);
  assert.equal(Object.hasOwn(view.players[1], 'hand'), false);
  assert.equal(view.players[1].handCount, 5);
  for (const key of ['seed', 'rngState', 'supply', 'invocations', 'receipts', 'lastNow']) assert.equal(Object.hasOwn(view, key), false);
  const serialized = JSON.stringify(view);
  for (const card of state.players[1].hand) assert.equal(serialized.includes(`"${card.instanceId}"`), false);
  for (const card of state.supply) assert.equal(serialized.includes(`"${card.instanceId}"`), false);
  assert.deepEqual(getView(state, 'spectator').legalActions, []);
  assert.ok(getView(state, 'spectator').players.every(player => !Object.hasOwn(player, 'hand')));
  view.players[0].hand!.pop();
  view.events[0].text = 'changed';
  view.limbo.pop();
  assert.equal(state.players[0].hand.length, 5);
  assert.equal(state.limbo.length, 5);
  assert.notEqual(state.events[0].text, 'changed');
});

test('draw consumes one action once, preserves every card, and keeps card IDs out of public events', () => {
  const initial = setup();
  const before = structuredClone(initial);
  const next = act(initial, { type: 'draw' });
  assert.equal(next.players[0].hand.length, 6);
  assert.equal(next.supply.length, initial.supply.length - 1);
  assert.equal(next.actionsRemaining, 1);
  assert.equal(next.version, 1);
  assert.deepEqual(initial, before);
  assert.deepEqual(cardIds(next), cardIds(initial));
  const publicEvents = JSON.stringify(next.events);
  for (const player of next.players) for (const card of player.hand) assert.equal(publicEvents.includes(card.instanceId), false);
  const exhaustedActions = act(next, { type: 'draw' });
  assert.deepEqual(getView(exhaustedActions, 'alice').legalActions, [{ type: 'endTurn' }]);
  const rejected = applyCommand(exhaustedActions, 'alice', { id: 'extra', expectedVersion: 2, action: { type: 'draw' } }, 3);
  assert.equal(rejected.ok, false);
  assert.strictEqual(rejected.state, exhaustedActions);
});

test('malformed, stale, foreign-turn and challenge commands are atomic', () => {
  const state = setup();
  const before = structuredClone(state);
  const invalid: unknown[] = [null, [], {}, { id: 'x', expectedVersion: -1, action: { type: 'draw' } }, { id: '', expectedVersion: 0, action: { type: 'draw' } },
    { id: 'x', expectedVersion: 0, action: { type: 'draw', leak: true } }, { id: 'x', expectedVersion: 0, action: { type: 'unknown' } },
    { id: 'x', expectedVersion: 0, action: { type: 'summon', cardId: 'x', slot: 4, paymentIds: [] } },
    { id: 'x', expectedVersion: 0, action: { type: 'summon', cardId: 'x', slot: 0.1, paymentIds: [] } },
    { id: 'x', expectedVersion: 0, action: { type: 'summon', cardId: 'x', slot: 0, paymentIds: 'x' } },
    { id: 'x', expectedVersion: 0, action: { type: 'activate', cardId: null } },
    { id: 'x', expectedVersion: Number.NaN, action: { type: 'draw' } }];
  for (const command of invalid) {
    const result = applyCommand(state, 'alice', command as Command, 1);
    assert.equal(result.ok, false);
    assert.strictEqual(result.state, state);
    assert.deepEqual(state, before);
  }
  for (const action of [{ type: 'challengeBoss' }, { type: 'challengeMagist', targetId: 'bob' }] as GameAction[]) {
    const result = applyCommand(state, 'alice', { id: action.type, expectedVersion: 0, action }, 1);
    assert.equal(result.ok, false);
    assert.match(result.error!, /disabilitat/);
    assert.strictEqual(result.state, state);
    assert.deepEqual(state, before);
  }
  for (const [actor, version, now] of [['bob', 0, 1], ['unknown', 0, 1], ['alice', 99, 1], ['alice', 0, Number.NaN], ['alice', 0, -1]] as const) {
    const result = applyCommand(state, actor, { id: 'invalid', expectedVersion: version, action: { type: 'draw' } }, now);
    assert.equal(result.ok, false);
    assert.strictEqual(result.state, state);
  }
  const next = act(state, { type: 'draw' });
  assert.equal(applyCommand(next, 'alice', { id: 'old', expectedVersion: 0, action: { type: 'draw' } }, 2).ok, false);
  assert.equal(applyCommand(next, 'alice', { id: 'clock', expectedVersion: 1, action: { type: 'draw' } }, 0).ok, false);
});

test('retries are idempotent per actor and conflicting reuse fails', () => {
  const state = setup();
  const command: Command = { id: 'request-1', expectedVersion: 0, action: { type: 'draw' } };
  const first = applyCommand(state, 'alice', command, 1);
  assert.equal(first.ok, true);
  const duplicate = applyCommand(first.state, 'alice', command, 999);
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.strictEqual(duplicate.state, first.state);
  assert.equal(first.state.players[0].hand.length, 6);
  const conflicting = applyCommand(first.state, 'alice', { ...command, action: { type: 'endTurn' } }, 2);
  assert.equal(conflicting.ok, false);
  assert.strictEqual(conflicting.state, first.state);
  const nextTurn = act(first.state, { type: 'endTurn' });
  const bob = applyCommand(nextTurn, 'bob', { id: 'request-1', expectedVersion: nextTurn.version, action: { type: 'draw' } }, 3);
  assert.equal(bob.ok, true);
  assert.notEqual(bob.duplicate, true);
  assert.equal(applyCommand(bob.state, 'alice', command, 4).duplicate, true);
});

test('summoning pays the exact owned generic resources, atomically rejects every invalid cost', () => {
  const state = setup();
  const card = expose(state, 'fixture-action');
  const owned = state.players[0].hand.map(card => card.instanceId);
  const attempts: GameAction[] = [
    { type: 'summon', cardId: card.instanceId, slot: 0, paymentIds: [] },
    { type: 'summon', cardId: card.instanceId, slot: 0, paymentIds: owned.slice(0, 3) },
    { type: 'summon', cardId: card.instanceId, slot: 0, paymentIds: [owned[0], owned[0]] },
    { type: 'summon', cardId: card.instanceId, slot: 0, paymentIds: [owned[0], state.players[1].hand[0].instanceId] },
    { type: 'summon', cardId: state.invocations[0].instanceId, slot: 0, paymentIds: owned.slice(0, 2) },
  ];
  const before = structuredClone(state);
  for (const action of attempts) {
    const result = applyCommand(state, 'alice', { id: 'invalid-pay', expectedVersion: 0, action }, 1);
    assert.equal(result.ok, false);
    assert.strictEqual(result.state, state);
    assert.deepEqual(state, before);
  }
  const next = act(state, { type: 'summon', cardId: card.instanceId, slot: 0, paymentIds: owned.slice(0, 2) });
  assert.equal(next.players[0].hand.length, 3);
  assert.equal(next.discard.length, 2);
  assert.equal(next.players[0].piles[0][0].instanceId, card.instanceId);
  assert.equal(next.limbo.length, 5);
  assert.equal(next.invocations.length, state.invocations.length - 1);
  assert.equal(next.actionsRemaining, 1);
  assert.deepEqual(cardIds(next), cardIds(state));
});

test('entry and action fixtures apply real draws and A consumes an action', () => {
  const state = setup();
  const originalIds = cardIds(state);
  const entry = summon(state, 'fixture-entry');
  assert.equal(entry.players[0].hand.length, 5, 'pay 1 then E draws 1');
  assert.equal(entry.supply.length, state.supply.length - 1);
  assert.equal(entry.discard.length, 1);
  assert.equal(entry.actionsRemaining, 1);
  assert.equal(entry.events.filter(event => event.type === 'entryEffect').length, 1);
  assert.deepEqual(cardIds(entry), originalIds);
  const withA = summon(setup(), 'fixture-action');
  const id = withA.players[0].piles[0][0].instanceId;
  const activated = act(withA, { type: 'activate', cardId: id });
  assert.equal(activated.players[0].hand.length, 4);
  assert.equal(activated.actionsRemaining, 0);
  assert.equal(activated.events.at(-1)!.type, 'actionEffect');
  assert.deepEqual(cardIds(activated), cardIds(withA));
});

test('only pile tops supply stars and abilities, P is passive, and fourth cards are rejected', () => {
  let state = summon(setup(), 'fixture-passive');
  assert.equal(getView(state, 'alice').players[0].stars, 4);
  assert.equal(state.actionsRemaining, 1, 'P does not consume an additional action');
  state = summon(state, 'fixture-none');
  assert.equal(getView(state, 'alice').players[0].stars, 1);
  state = readyTurn(state, 'alice');
  state = summon(state, 'fixture-none');
  assert.equal(state.players[0].piles[0].length, 3);
  const fourth = expose(state, 'fixture-none');
  const rejected = applyCommand(state, 'alice', { id: 'fourth', expectedVersion: state.version, action: { type: 'summon', cardId: fourth.instanceId, slot: 0, paymentIds: [] } }, state.lastNow + 1);
  assert.equal(rejected.ok, false);
  assert.strictEqual(rejected.state, state);
  assert.ok(getView(state, 'alice').legalActions.every(action => action.type !== 'summon' || action.slot !== 0));
  let coveredA = summon(setup(), 'fixture-action');
  const aId = coveredA.players[0].piles[0][0].instanceId;
  coveredA = summon(coveredA, 'fixture-none');
  coveredA = readyTurn(coveredA, 'alice');
  assert.equal(applyCommand(coveredA, 'alice', { id: 'covered-A', expectedVersion: coveredA.version, action: { type: 'activate', cardId: aId } }, coveredA.lastNow + 1).ok, false);
  assert.ok(getView(coveredA, 'alice').legalActions.every(action => action.type !== 'activate'));
});

test('hand cap and finite resources reject draw/A; E resolves without a draw when exhausted', () => {
  let capped = summon(setup(), 'fixture-action');
  while (capped.players[0].hand.length < PRESET.handLimit) capped.players[0].hand.push(capped.supply.shift()!);
  const aId = capped.players[0].piles[0][0].instanceId;
  for (const action of [{ type: 'draw' }, { type: 'activate', cardId: aId }] as GameAction[]) {
    const result = applyCommand(capped, 'alice', { id: 'cap', expectedVersion: capped.version, action }, capped.lastNow + 1);
    assert.equal(result.ok, false);
    assert.strictEqual(result.state, capped);
  }
  assert.ok(getView(capped, 'alice').legalActions.every(action => action.type !== 'draw' && action.type !== 'activate'));
  const finite = setup();
  finite.discard.push(...finite.supply.splice(0));
  const beforeIds = cardIds(finite);
  assert.equal(applyCommand(finite, 'alice', { id: 'empty', expectedVersion: 0, action: { type: 'draw' } }, 1).ok, false);
  const entry = summon(finite, 'fixture-entry');
  assert.equal(entry.players[0].hand.length, 4);
  assert.equal(entry.supply.length, 0);
  assert.equal(entry.actionsRemaining, 1);
  assert.match(entry.events.at(-1)!.text, /senza pesca/);
  assert.deepEqual(cardIds(entry), beforeIds);
});

test('empty invocation deck does not recycle and Limbo shrinks naturally', () => {
  const state = setup();
  state.discard.push(...state.invocations.splice(0));
  const freeCard = state.limbo.find(card => CARD_DEFINITIONS[card.definitionId].cost <= 3)!;
  const cost = CARD_DEFINITIONS[freeCard.definitionId].cost;
  const next = act(state, { type: 'summon', cardId: freeCard.instanceId, slot: 0, paymentIds: state.players[0].hand.slice(0, cost).map(card => card.instanceId) });
  assert.equal(next.limbo.length, 4);
  assert.equal(next.invocations.length, 0);
  assert.deepEqual(cardIds(next), cardIds(state));
});

test('technical limits and host stop end tests without winner; duplicate last command remains safe', () => {
  const turnLimited = createGame(players, 42, { maxTurns: 1 });
  const ended = act(turnLimited, { type: 'endTurn' });
  assert.equal(ended.phase, 'ended');
  assert.equal(ended.turnNumber, 1);
  assert.equal(ended.winner, null);
  assert.match(ended.stopReason!, /turni/);
  assert.deepEqual(getView(ended, 'alice').legalActions, []);
  const actionLimited = createGame(players, 42, { maxActions: 1 });
  const command: Command = { id: 'last', expectedVersion: 0, action: { type: 'draw' } };
  const result = applyCommand(actionLimited, 'alice', command, 1);
  assert.equal(result.state.phase, 'ended');
  assert.equal(result.state.acceptedCommands, 1);
  assert.match(result.state.stopReason!, /comandi accettati/);
  assert.equal(applyCommand(result.state, 'alice', command, 2).duplicate, true);
  assert.equal(applyCommand(result.state, 'alice', { ...command, id: 'after', expectedVersion: 1 }, 2).ok, false);
  const hostEnded = stopGame(setup(), 100, 'Arresto dell’host');
  assert.equal(hostEnded.phase, 'ended');
  assert.equal(hostEnded.winner, null);
  assert.equal(hostEnded.version, 1);
  assert.strictEqual(stopGame(hostEnded, 101, 'Again'), hostEnded);
  assert.throws(() => stopGame(setup(), -1, 'invalid'));
});

test('legalActions are accepted on independent branches and use minimal exact payments', () => {
  const state = setup();
  for (const action of getView(state, 'alice').legalActions) {
    if (action.type === 'summon') {
      const card = state.limbo.find(card => card.instanceId === action.cardId)!;
      assert.equal(action.paymentIds.length, CARD_DEFINITIONS[card.definitionId].cost);
      assert.equal(new Set(action.paymentIds).size, action.paymentIds.length);
    }
    assert.equal(applyCommand(state, 'alice', { id: 'branch', expectedVersion: 0, action }, 1).ok, true);
  }
  assert.deepEqual(getView(state, 'bob').legalActions, []);
});

test('three bot levels make distinct decisions from a shared filtered view', () => {
  const state = setup();
  expose(state, 'fixture-none');
  expose(state, 'fixture-passive');
  const view = getView(state, 'alice');
  const easy = chooseAction(view, 'easy');
  const medium = chooseAction(view, 'medium');
  const hard = chooseAction(view, 'hard');
  assert.equal(easy.type, 'draw');
  assert.equal(medium.type, 'summon');
  assert.equal(hard.type, 'summon');
  if (medium.type === 'summon' && hard.type === 'summon') {
    assert.notEqual(medium.cardId, hard.cardId);
    assert.equal(CARD_DEFINITIONS[view.limbo.find(card => card.instanceId === medium.cardId)!.definitionId].cost, 0);
    assert.equal(CARD_DEFINITIONS[view.limbo.find(card => card.instanceId === hard.cardId)!.definitionId].effect, 'passive-star');
  }
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    const before = structuredClone(view);
    chooseAction(view, difficulty);
    assert.deepEqual(view, before, 'bot must not mutate its view');
  }
});

for (const count of [2, 3, 4, 5]) for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
  test(`${count} ${difficulty} bots preserve cards, privacy and legality for a deterministic session`, () => {
    const configs: PlayerSetup[] = Array.from({ length: count }, (_, index) => ({ id: `bot-${index}`, name: `Bot ${index}`, kind: 'bot', difficulty }));
    let state = createGame(configs, 42, { maxTurns: 24, maxActions: 80 });
    const initialIds = cardIds(state);
    while (state.phase === 'playing') {
      const actor = state.currentPlayerId;
      const view = getView(state, actor);
      for (const player of view.players) if (player.id !== actor) assert.equal(Object.hasOwn(player, 'hand'), false);
      assert.equal(JSON.stringify(view).includes('rngState'), false);
      const action = chooseAction(view, difficulty);
      assert.ok(view.legalActions.some(legal => JSON.stringify(legal) === JSON.stringify(action)), `${difficulty} chooses a legal action`);
      state = act(state, action);
      assert.deepEqual(cardIds(state), initialIds);
      for (const player of state.players) {
        assert.ok(player.hand.length <= PRESET.handLimit);
        assert.ok(player.piles.every(pile => pile.length <= PRESET.pileLimit));
      }
    }
    assert.equal(state.winner, null);
    assert.ok(state.acceptedCommands <= 80);
    assert.ok(state.turnNumber <= 24);
    const options = { players: count, difficulty, seed: 42, maxTurns: 12, maxActions: 40 };
    const run = simulateSession(options);
    assert.deepEqual(run, simulateSession(options));
    const replay = replaySession(run);
    assert.equal(replay.phase, 'ended');
    assert.equal(replay.winner, null);
    assert.deepEqual(replay.events, run.events);
    assert.deepEqual(run.summary.errors, []);
    assert.deepEqual(cardIds(replay), initialIds);
  });
}

test('tampered and incompatible debug replays are rejected', () => {
  const replay = simulateSession({ players: 2, difficulty: 'easy', seed: 42, maxTurns: 2 });
  const alteredVersion = structuredClone(replay);
  alteredVersion.metadata.catalogVersion = 'unsupported';
  assert.throws(() => replaySession(alteredVersion), /incompatibili/);
  const alteredEvents = structuredClone(replay);
  alteredEvents.events[0].text = 'forged';
  assert.throws(() => replaySession(alteredEvents), /eventi/);
  const alteredCommand = structuredClone(replay);
  alteredCommand.commands[0].command.expectedVersion = 999;
  assert.throws(() => replaySession(alteredCommand), /Replay non valido/);
});
