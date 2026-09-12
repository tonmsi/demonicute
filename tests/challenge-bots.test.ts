import test from 'node:test';
import assert from 'node:assert/strict';
import type { CardInstance, Difficulty, GameAction, PlayerSetup } from '../src/shared/game.js';
import { applyCommand, advanceTime, createGame, getView, type GameState } from '../src/engine/index.js';
import { chooseAction } from '../src/bots/index.js';
import { CARD_DEFINITIONS } from '../src/content/catalog.js';

const levels: Difficulty[] = ['easy', 'medium', 'hard'];
const configs: PlayerSetup[] = ['alice', 'bob', 'eve'].map(id => ({ id, name: id, kind: 'bot', difficulty: 'medium' }));
function inventory(state: GameState): string[] {
  return [...state.supply, ...state.invocations, ...state.limbo, ...state.discard, ...state.bossDeck, ...state.players.flatMap(player => [...player.hand, ...player.piles.flat()])].map(card => card.instanceId).sort();
}
const allGems = (state: GameState): string[] => [...state.gemSupply, ...state.players.flatMap(player => player.gems)].sort();
const setup = (): GameState => createGame(configs, 42, { preset: 'challenge-fixtures' });
function act(state: GameState, actorId: string, action: GameAction): GameState {
  const result = applyCommand(state, actorId, { id: `test-${state.version}`, expectedVersion: state.version, action }, state.lastNow + 1);
  assert.equal(result.ok, true, result.error);
  return result.state;
}
function prepare(state: GameState): GameState {
  while (state.challenge?.window) state = act(state, state.challenge.window.actorId, { type: 'challengePass' });
  return state;
}
function handOnly(state: GameState, actorId: string, definitions: string[]): CardInstance[] {
  const player = state.players.find(player => player.id === actorId)!;
  state.supply.push(...player.hand.splice(0));
  for (const definitionId of definitions) {
    const index = state.supply.findIndex(card => card.definitionId === definitionId);
    assert.notEqual(index, -1);
    player.hand.push(...state.supply.splice(index, 1));
  }
  return player.hand;
}
function setPiles(state: GameState, actorId: string, definitions: string[][]): void {
  const player = state.players.find(player => player.id === actorId)!;
  state.invocations.push(...player.piles.flat());
  player.piles = Array.from({ length: 4 }, () => []);
  definitions.forEach((pile, slot) => pile.forEach(definitionId => {
    const index = state.invocations.findIndex(card => card.definitionId === definitionId);
    assert.notEqual(index, -1);
    player.piles[slot].push(...state.invocations.splice(index, 1));
  }));
}
function botSession(players: number, difficulty: Difficulty, seed = 42): GameState {
  const actors: PlayerSetup[] = Array.from({ length: players }, (_, index) => ({ id: `bot-${index}`, name: `Bot ${index}`, kind: 'bot', difficulty }));
  let state = createGame(actors, seed, { preset: 'challenge-fixtures', maxTurns: 12, maxActions: 400 });
  const cards = inventory(state);
  const gems = allGems(state);
  let iterations = 0;
  while (state.phase === 'playing') {
    assert.ok(++iterations < 1_000, 'no preparation/replacement loop');
    const pending = getView(state, actors[0].id).pendingActorIds;
    assert.ok(pending.length > 0, 'every mandatory choice has an eligible actor');
    // Exercise optional timeout handling in the batch using virtual milliseconds only.
    if (state.challenge?.window && iterations % 7 === 0) {
      const advanced = advanceTime(state, state.challenge.window.expiresAt);
      assert.equal(advanced.ok, true);
      state = advanced.state;
      continue;
    }
    const actorId = pending[0];
    const view = getView(state, actorId);
    const untouched = structuredClone(view);
    assert.ok(view.players.find(player => player.id === actorId)!.hand);
    for (const other of view.players.filter(player => player.id !== actorId)) assert.equal(Object.hasOwn(other, 'hand'), false);
    for (const key of ['bossDeck', 'rngState', 'seed', 'commitments']) assert.equal(Object.hasOwn(view, key), false);
    const serialized = JSON.stringify(view);
    for (const response of state.bossDeck) assert.equal(serialized.includes(JSON.stringify(response.instanceId)), false);
    if (state.challenge?.phase === 'preparation') for (const id of state.challenge.participantIds.filter(id => id !== actorId)) {
      const commitment: { cardId: string | null; elementChoice?: string } | undefined = state.challenge.commitments[id];
      if (commitment?.cardId) assert.equal(serialized.includes(JSON.stringify(commitment.cardId)), false, 'opponent committed hand card remains hidden');
    }
    const action = chooseAction(view, difficulty);
    assert.deepEqual(view, untouched, 'bot does not mutate filtered view');
    assert.ok(view.legalActions.some(legal => JSON.stringify(legal) === JSON.stringify(action)), `${difficulty}: ${JSON.stringify(action)} must be legal for ${actorId}`);
    state = act(state, actorId, action);
    assert.deepEqual(inventory(state), cards);
    assert.deepEqual(allGems(state), gems);
    assert.ok(state.players.every(player => player.hand.length <= 20 && player.piles.every(pile => pile.length <= 3)));
  }
  assert.ok(state.challengeHistory.length > 0);
  assert.equal(state.winner, null);
  assert.ok(state.acceptedCommands < 400, 'turn limit should finish without a technical choice loop');
  const turns: number[] = [0];
  for (const event of state.events) {
    if (event.type === 'turnStarted') turns.push(0);
    if (event.type === 'challengeDeclared') turns[turns.length - 1]++;
  }
  assert.ok(turns.every(count => count === 1), `one representative challenge per turn: ${turns.join(', ')}`);
  return state;
}

for (const players of [2, 3, 4, 5]) for (const difficulty of levels) test(`${players} ${difficulty} bots complete challenge sessions from filtered views with legal moves, virtual time and conserved inventories`, () => {
  const first = botSession(players, difficulty);
  const replayed = botSession(players, difficulty);
  assert.deepEqual(replayed, first);
});

test('all bot levels identify the out-of-turn defender from its own hand and score modifiers globally', () => {
  for (const difficulty of levels) {
    let state = setup();
    setPiles(state, 'alice', [['fixture-earth'], ['fixture-earth'], ['fixture-earth']]);
    setPiles(state, 'bob', [['fixture-fire']]);
    const [malus] = handOnly(state, 'bob', ['fixture-minus-earth']);
    state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 }));
    const view = getView(state, 'bob');
    assert.equal(view.currentPlayerId, 'alice');
    assert.deepEqual(chooseAction(view, difficulty), { type: 'challengeCommit', cardId: malus.instanceId });
    state = act(state, 'bob', chooseAction(view, difficulty));
    assert.deepEqual(chooseAction(getView(state, 'bob'), difficulty), { type: 'challengeReady' });
  }
});

test('a globally harmful bonus is declined and Terra/Fuoco alternatives are selected by visible comparative utility', () => {
  for (const difficulty of levels) {
    let state = setup();
    setPiles(state, 'alice', [['fixture-earth'], ['fixture-earth'], ['fixture-earth']]);
    setPiles(state, 'bob', [['fixture-earth']]);
    handOnly(state, 'bob', ['fixture-plus-earth']);
    state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 }));
    assert.deepEqual(chooseAction(getView(state, 'bob'), difficulty), { type: 'challengeCommit', cardId: null });
    state = setup();
    setPiles(state, 'alice', [['fixture-earth']]);
    setPiles(state, 'bob', [['fixture-fire']]);
    const [choice] = handOnly(state, 'bob', ['fixture-choice']);
    state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 }));
    assert.deepEqual(chooseAction(getView(state, 'bob'), difficulty), { type: 'challengeCommit', cardId: choice.instanceId, elementChoice: 'Fuoco' });
  }
});

test('opponent commitments and future Boss response permutations cannot influence any bot decision', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-earth']]);
  setPiles(state, 'bob', [['fixture-fire']]);
  handOnly(state, 'alice', ['fixture-choice']);
  const [first, second] = handOnly(state, 'bob', ['fixture-plus-earth', 'fixture-minus-earth']);
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 }));
  const left = act(state, 'bob', { type: 'challengeCommit', cardId: first.instanceId });
  const right = act(state, 'bob', { type: 'challengeCommit', cardId: second.instanceId });
  right.bossDeck.reverse();
  const leftView = getView(left, 'alice');
  const rightView = getView(right, 'alice');
  assert.deepEqual(leftView, rightView);
  for (const difficulty of levels) assert.deepEqual(chooseAction(leftView, difficulty), chooseAction(rightView, difficulty));
});

test('bot replacements strictly increase visible top stars, terminate, and loss selection belongs to the actual loser', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-earth-passive'], ['fixture-earth-passive'], ['fixture-earth-passive']]);
  setPiles(state, 'bob', [['fixture-earth-passive', 'fixture-earth'], ['fixture-fire', 'fixture-earth']]);
  handOnly(state, 'bob', []);
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 2 }));
  let swaps = 0;
  while (!state.challenge!.committedIds.includes('bob')) {
    const before = getView(state, 'bob').players.find(player => player.id === 'bob')!.stars;
    const action = chooseAction(getView(state, 'bob'), 'hard');
    state = act(state, 'bob', action);
    if (action.type === 'challengeReplace') {
      swaps++;
      assert.ok(getView(state, 'bob').players.find(player => player.id === 'bob')!.stars > before);
    }
    assert.ok(swaps <= 2);
  }
  assert.equal(swaps, 2);
  state = act(state, 'bob', chooseAction(getView(state, 'bob'), 'hard'));
  state = act(state, 'alice', { type: 'challengeCommit', cardId: null });
  state = act(state, 'alice', { type: 'challengeReady' });
  assert.equal(state.challenge!.phase, 'stake');
  for (const difficulty of levels) {
    const action = chooseAction(getView(state, 'bob'), difficulty);
    assert.equal(action.type, 'challengeLoseDemon');
    if (action.type === 'challengeLoseDemon') assert.equal(action.cardId, state.players[1].piles[1].at(-1)!.instanceId, '2-star Fire is weaker than 3-star passive Earth');
  }
});

test('optional reaction strategies differ without granting spectator refusal or reading hidden cards', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-earth-passive'], ['fixture-earth-passive']]);
  setPiles(state, 'bob', [['fixture-earth']]);
  setPiles(state, 'eve', [['fixture-fire']]);
  handOnly(state, 'bob', ['fixture-shifter']);
  state = act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 });
  const view = getView(state, 'bob');
  const decisions = levels.map(level => chooseAction(view, level));
  assert.ok(decisions.every(action => action.type === 'challengeShift'));
  assert.deepEqual(decisions.map(action => action.type === 'challengeShift' && action.mode), ['refuse', 'redirect', 'refuse']);
  assert.deepEqual(getView(state, 'eve').legalActions, []);
  state = setup();
  handOnly(state, 'alice', []);
  handOnly(state, 'bob', ['fixture-shifter']);
  state = act(state, 'alice', { type: 'challengeBoss' });
  assert.equal(state.challenge!.window!.actorId, 'bob');
  assert.deepEqual(chooseAction(getView(state, 'bob'), 'easy'), { type: 'challengePass' });
  for (const difficulty of ['medium', 'hard'] as Difficulty[]) {
    const action = chooseAction(getView(state, 'bob'), difficulty);
    assert.equal(action.type, 'challengeShift');
    if (action.type === 'challengeShift') assert.equal(action.mode, 'rotate');
  }
});
