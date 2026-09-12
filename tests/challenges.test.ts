import test from 'node:test';
import assert from 'node:assert/strict';
import type { CardInstance, ChallengeModifier, Command, GameAction, PlayerSetup } from '../src/shared/game.js';
import { advanceTime, applyCommand, countElementalStars, countPlayerStars, createGame, getView, stopGame, type GameState } from '../src/engine/index.js';
import { CARD_DEFINITIONS } from '../src/content/catalog.js';

const configs: PlayerSetup[] = ['alice', 'bob', 'eve'].map(id => ({ id, name: id, kind: 'human' }));
const setup = (): GameState => createGame(configs, 42, { preset: 'challenge-fixtures', maxActions: 500 });
function act(state: GameState, actorId: string, action: GameAction, now = state.lastNow + 1): GameState {
  const result = applyCommand(state, actorId, { id: `command-${state.version}`, expectedVersion: state.version, action }, now);
  assert.equal(result.ok, true, result.error);
  return result.state;
}
function reject(state: GameState, actorId: string, action: GameAction, now = state.lastNow + 1): void {
  const before = structuredClone(state);
  const result = applyCommand(state, actorId, { id: `reject-${state.version}`, expectedVersion: state.version, action }, now);
  assert.equal(result.ok, false);
  assert.strictEqual(result.state, state);
  assert.deepEqual(state, before);
}
function inventory(state: GameState): string[] {
  return [...state.supply, ...state.invocations, ...state.limbo, ...state.discard, ...state.bossDeck, ...state.players.flatMap(player => [...player.hand, ...player.piles.flat()])].map(card => card.instanceId).sort();
}
const gems = (state: GameState): string[] => [...state.gemSupply, ...state.players.flatMap(player => player.gems)].sort();
function give(state: GameState, playerId: string, definitionId: string): CardInstance {
  const player = state.players.find(player => player.id === playerId)!;
  const own = player.hand.find(card => card.definitionId === definitionId);
  if (own) return own;
  const index = state.supply.findIndex(card => card.definitionId === definitionId);
  assert.notEqual(index, -1);
  const [card] = state.supply.splice(index, 1);
  player.hand.push(card);
  return card;
}
function setPiles(state: GameState, playerId: string, definitions: string[][]): void {
  const player = state.players.find(player => player.id === playerId)!;
  state.invocations.push(...player.piles.flat());
  player.piles = Array.from({ length: 4 }, () => []);
  definitions.forEach((pile, slot) => pile.forEach(definitionId => {
    let index = state.invocations.findIndex(card => card.definitionId === definitionId);
    if (index === -1) {
      const limboIndex = state.limbo.findIndex(card => card.definitionId === definitionId);
      assert.notEqual(limboIndex, -1);
      state.invocations.push(...state.limbo.splice(limboIndex, 1));
      index = state.invocations.length - 1;
    }
    player.piles[slot].push(...state.invocations.splice(index, 1));
  }));
}
function bossResponse(state: GameState, definitionId: string): CardInstance {
  const index = state.bossDeck.findIndex(card => card.definitionId === definitionId);
  assert.notEqual(index, -1);
  [state.bossDeck[0], state.bossDeck[index]] = [state.bossDeck[index], state.bossDeck[0]];
  return state.bossDeck[0];
}
function prepare(state: GameState): GameState {
  while (state.challenge?.phase === 'intervention') state = act(state, state.challenge.window!.actorId, { type: 'challengePass' });
  assert.equal(state.challenge?.phase, 'preparation');
  return state;
}
function finishChoices(state: GameState, commitments: Record<string, { cardId: string | null; elementChoice?: string }> = {}): GameState {
  const ids = [...state.challenge!.participantIds];
  for (const id of ids) {
    if (!state.challenge!.committedIds.includes(id)) state = act(state, id, { type: 'challengeCommit', ...(Object.hasOwn(commitments, id) ? commitments[id] : { cardId: null }) });
    if (!state.challenge!.readyIds.includes(id)) state = act(state, id, { type: 'challengeReady' });
  }
  return state;
}
const earth = (stars = 1) => ({ cardId: 'fixture-unit', definitionId: 'fixture-earth', element: 'Terra', printed: stars, reference: stars });
const plus: ChallengeModifier = { kind: 'numeric', element: 'Terra', amount: 1 };
const minus: ChallengeModifier = { kind: 'numeric', element: 'Terra', amount: -2 };
const zero: ChallengeModifier = { kind: 'zero', element: 'Terra' };
const protect: ChallengeModifier = { kind: 'protect', element: 'Terra' };

test('confirmed elemental arithmetic is per Demon, order-independent, yellow > X > numeric, with minimum zero per Demon', () => {
  const state = setup();
  setPiles(state, 'alice', [['fixture-earth'], ['fixture-earth'], ['fixture-earth']]);
  const player = state.players[0];
  assert.equal(countPlayerStars(player, [plus]).after - countPlayerStars(player).before, 3);
  assert.equal(countElementalStars(earth(), [minus]).final, 0);
  assert.equal(countElementalStars(earth(5), [zero, plus]).final, 0);
  for (const modifiers of [[protect, zero, plus, minus], [minus, plus, zero, protect], [zero, protect, minus, plus]]) {
    const value = countElementalStars(earth(2), modifiers);
    assert.equal(value.final, 2);
    assert.equal(value.ignoredZero, true);
    assert.equal(value.ignoredNumeric, -1);
  }
  assert.equal(countElementalStars(earth(), [protect, plus]).final, 1);
  assert.equal(countElementalStars(earth(), [protect, minus]).final, 1);
  setPiles(state, 'alice', [['fixture-earth'], ['fixture-earth-passive']]);
  const count = countPlayerStars(player, [minus]);
  assert.deepEqual(count.demons.map(card => card.final), [0, 1]);
  assert.equal(count.after, 1, 'clamping only the circle total would wrongly yield zero');
  assert.equal(countPlayerStars(player, [protect, plus]).demons[1].final, 3, 'declared fixture reference includes the active fixture P');
  assert.throws(() => countElementalStars(earth(), [{ kind: 'per-gem-undefined' }]), /non risolto/);
  assert.throws(() => countElementalStars(earth(), [{ kind: 'choice', elements: ['Terra', 'Fuoco'], amount: 1 }]), /non risolto/);
});

test('preset identity and private Boss deck remain explicit; default old fixture deck is preserved', () => {
  const state = setup();
  assert.deepEqual(state, setup());
  assert.deepEqual(state.capabilities, { bossChallenges: true, magistDuels: true });
  assert.equal(state.boss!.fixture, true);
  assert.ok(state.boss!.sides.every(side => side.element && side.secondaryElements.length));
  assert.ok(getView(state, 'alice').challengePolicy.length > 5);
  for (const viewer of ['alice', 'bob', 'spectator']) {
    const view = getView(state, viewer);
    for (const key of ['bossDeck', 'gemSupply', 'commitments', 'rngState', 'seed']) assert.equal(Object.hasOwn(view, key), false);
    for (const card of state.bossDeck) assert.equal(JSON.stringify(view).includes(card.instanceId), false);
  }
  const legacy = createGame(configs, 42);
  assert.equal(legacy.presetId, 'technical-fixtures');
  assert.equal(legacy.bossDeck.length, 0);
  assert.ok([...legacy.invocations, ...legacy.limbo].every(card => !CARD_DEFINITIONS[card.definitionId].challengeFixture));
});

test('duel commitments hide identity and alternative until simultaneous reveal, spectators cannot commit, second/late cards fail atomically', () => {
  let state = setup();
  const card = give(state, 'alice', 'fixture-choice');
  const bobCard = give(state, 'bob', 'fixture-minus-earth');
  const originalCards = inventory(state);
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 }));
  reject(state, 'eve', { type: 'challengeCommit', cardId: state.players[2].hand[0].instanceId });
  state = act(state, 'alice', { type: 'challengeCommit', cardId: card.instanceId, elementChoice: 'Terra' });
  for (const viewer of ['bob', 'eve', 'spectator']) {
    const view = getView(state, viewer);
    assert.deepEqual(view.challenge!.committedIds, ['alice']);
    assert.equal(Object.hasOwn(view.challenge!, 'ownCommit'), false);
    assert.equal(JSON.stringify(view).includes(card.instanceId), false);
    assert.equal(JSON.stringify(view.events).includes('elementChoice'), false);
    assert.deepEqual(view.challenge!.revealed, []);
  }
  const reconnected = getView(structuredClone(state), 'bob');
  assert.deepEqual(reconnected, getView(state, 'bob'));
  assert.deepEqual(getView(state, 'alice').challenge!.ownCommit, { cardId: card.instanceId, elementChoice: 'Terra' });
  reject(state, 'alice', { type: 'challengeCommit', cardId: card.instanceId, elementChoice: 'Fuoco' });
  reject(state, 'alice', { type: 'challengeCommit', cardId: null });
  state = act(state, 'alice', { type: 'challengeReady' });
  reject(state, 'alice', { type: 'challengeReplace', slot: 0, cardId: state.players[0].piles[0][0].instanceId });
  state = act(state, 'bob', { type: 'challengeCommit', cardId: bobCard.instanceId });
  state = act(state, 'bob', { type: 'challengeReady' });
  const revealed = state.challenge?.revealed ?? state.challengeHistory.at(-1)!.revealed;
  assert.equal(revealed[0].elementChoice, 'Terra');
  assert.equal(revealed[0].card!.instanceId, card.instanceId);
  assert.equal(revealed[1].card!.instanceId, bobCard.instanceId);
  assert.equal(state.discard.filter(candidate => candidate.instanceId === card.instanceId).length, 1);
  assert.deepEqual(inventory(state), originalCards);
  reject(state, 'alice', { type: 'challengeCommit', cardId: card.instanceId, elementChoice: 'Fuoco' });
});

test('element modifiers affect all Magists in the public breakdown but only participants determine the duel', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-earth'], ['fixture-earth'], ['fixture-earth']]);
  setPiles(state, 'bob', [['fixture-earth'], ['fixture-earth']]);
  setPiles(state, 'eve', [['fixture-earth-passive'], ['fixture-earth-passive'], ['fixture-earth-passive']]);
  const card = give(state, 'alice', 'fixture-plus-earth');
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 }));
  state = finishChoices(state, { alice: { cardId: card.instanceId } });
  const record = state.challengeHistory.at(-1)!;
  assert.deepEqual(record.counts.map(count => [count.playerId, count.before, count.after]), [['alice', 3, 6], ['bob', 2, 4], ['eve', 9, 12]]);
  assert.deepEqual(record.participantIds, ['alice', 'bob']);
  assert.equal(record.result!.winnerId, 'alice', 'the spectator has more stars but cannot win this duel');
  for (const viewer of ['alice', 'bob', 'eve', 'observer']) {
    const publicRecord = getView(state, viewer).challengeHistory.at(-1)!;
    assert.deepEqual(publicRecord.counts, record.counts);
    assert.equal(publicRecord.result!.winnerId, 'alice');
    assert.equal(getView(state, viewer).events.find(event => event.type === 'challengeCounted')!.data!.counts instanceof Array, true);
  }
});

test('substitutions in multiple own Piles are free, recompute active passives and never activate Entrata', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-fire', 'fixture-earth'], ['fixture-earth-passive', 'fixture-earth']]);
  setPiles(state, 'bob', [['fixture-fire', 'fixture-earth'], ['fixture-earth-passive', 'fixture-earth']]);
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 }));
  const actions = state.actionsRemaining;
  const supply = state.supply.length;
  const cards = inventory(state);
  for (const actorId of ['alice', 'bob']) for (const slot of [0, 1]) {
    const player = state.players.find(player => player.id === actorId)!;
    state = act(state, actorId, { type: 'challengeReplace', slot, cardId: player.piles[slot][0].instanceId });
  }
  assert.equal(state.actionsRemaining, actions);
  assert.equal(state.supply.length, supply);
  assert.equal(state.events.filter(event => event.type === 'entryEffect').length, 0);
  assert.equal(getView(state, 'alice').players[0].stars, 5);
  assert.equal(state.challenge!.substitutions.length, 4);
  reject(state, 'alice', { type: 'challengeReplace', slot: 0, cardId: state.players[0].piles[1][0].instanceId });
  reject(state, 'alice', { type: 'challengeReplace', slot: 0, cardId: state.players[1].piles[0][0].instanceId });
  assert.deepEqual(inventory(state), cards);
});

test('Boss rotations precede preparation and Boss response rotation happens after reveal without second draw or reopened preparation', () => {
  let state = setup();
  const first = give(state, 'alice', 'fixture-shifter');
  const spectator = give(state, 'eve', 'fixture-shifter');
  bossResponse(state, 'fixture-shifter');
  const cards = inventory(state);
  const beforeSupply = state.supply.length;
  const beforeResponses = state.bossDeck.length;
  state = act(state, 'alice', { type: 'challengeBoss' });
  assert.equal(state.challenge!.phase, 'intervention');
  reject(state, 'alice', { type: 'challengeCommit', cardId: null });
  reject(state, 'eve', { type: 'challengeShift', cardId: spectator.instanceId, mode: 'refuse' });
  while (state.challenge!.phase === 'intervention') {
    const actor = state.challenge!.window!.actorId;
    const selected = actor === 'alice' ? first : actor === 'eve' ? spectator : null;
    state = act(state, actor, selected ? { type: 'challengeShift', cardId: selected.instanceId, mode: 'rotate' } : { type: 'challengePass' });
  }
  assert.equal(state.boss!.orientation, 2);
  assert.equal(state.supply.length, beforeSupply, 'rotation mode draws no card');
  assert.equal(state.challenge!.rotations.length, 2);
  reject(state, 'eve', { type: 'challengeCommit', cardId: null });
  state = finishChoices(state);
  assert.equal(state.boss!.orientation, 3);
  assert.equal(state.bossDeck.length, beforeResponses - 1);
  assert.equal(state.supply.length, beforeSupply);
  const record = state.challengeHistory.at(-1)!;
  assert.equal(record.rotations.at(-1)!.source, 'boss-response');
  const types = state.events.map(event => event.type);
  assert.ok(types.indexOf('bossRotated') < types.indexOf('challengePreparation'));
  assert.ok(types.lastIndexOf('bossRotated') > types.indexOf('challengeRevealed'));
  assert.ok(types.lastIndexOf('bossRotated') < types.indexOf('challengeCounted'));
  assert.equal(types.filter(type => type === 'challengePreparation').length, 1);
  assert.deepEqual(inventory(state), cards);
});

test('optional windows are serial and expire only with injected time; mandatory preparation has no timeout', () => {
  let state = setup();
  give(state, 'alice', 'fixture-shifter');
  give(state, 'bob', 'fixture-shifter');
  state = act(state, 'alice', { type: 'challengeBoss' });
  const deadline = state.challenge!.window!.expiresAt;
  assert.equal(state.challenge!.window!.durationMs, 5_000);
  assert.strictEqual(advanceTime(state, deadline - 1).state, state);
  reject(state, state.challenge!.window!.actorId, { type: 'challengePass' }, deadline);
  const expired = advanceTime(state, deadline);
  assert.equal(expired.ok, true);
  state = expired.state;
  assert.equal(state.version, 2);
  assert.equal(state.events.at(-2)!.type, 'challengeWindowExpired');
  assert.equal(state.challenge!.window!.actorId, 'bob');
  assert.equal(state.challenge!.window!.expiresAt, deadline + 5_000);
  state = prepare(state);
  const waiting = advanceTime(state, state.lastNow + 999_999);
  assert.equal(waiting.ok, true);
  assert.strictEqual(waiting.state, state);
  assert.equal(state.challenge!.committedIds.length, 0);
  assert.equal(advanceTime(state, -1).ok, false);
});

test('defender refusal and redirection use the alternative draw mode, retain one action cost and cannot be played by spectators', () => {
  for (const mode of ['refuse', 'redirect'] as const) {
    let state = setup();
    const shifter = give(state, 'bob', 'fixture-shifter');
    const spectator = give(state, 'eve', 'fixture-shifter');
    const supply = state.supply.length;
    const cards = inventory(state);
    state = act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 2 });
    assert.equal(state.challenge!.window!.actorId, 'bob');
    reject(state, 'eve', { type: 'challengeShift', cardId: spectator.instanceId, mode: 'refuse' });
    state = act(state, 'bob', { type: 'challengeShift', cardId: shifter.instanceId, mode, ...(mode === 'redirect' ? { targetId: 'eve' } : {}) });
    assert.equal(state.supply.length, supply - 1);
    assert.equal(state.actionsRemaining, 1);
    assert.equal(state.boss!.orientation, 0);
    assert.equal(state.discard.filter(card => card.instanceId === shifter.instanceId).length, 1);
    if (mode === 'refuse') assert.equal(state.challengeHistory.at(-1)!.result!.outcome, 'refused');
    else {
      assert.deepEqual(state.challenge!.participantIds, ['alice', 'eve']);
      assert.equal(state.challenge!.phase, 'preparation');
      assert.deepEqual(getView(state, 'bob').legalActions, []);
    }
    assert.deepEqual(inventory(state), cards);
  }
});

test('Boss ties award no Gem and do not apply loss consequences; strict wins transfer exactly one finite fixture Gem', () => {
  for (const expected of ['tie', 'attacker-wins', 'defender-wins'] as const) {
    let state = setup();
    setPiles(state, 'alice', [['fixture-earth']]);
    bossResponse(state, 'fixture-resource');
    state.boss!.sides[0].stars = expected === 'tie' ? 1 : expected === 'attacker-wins' ? 0 : 2;
    const originalGems = gems(state);
    const originalHand = state.players[0].hand.length;
    const originalPiles = structuredClone(state.players[0].piles);
    state = prepare(act(state, 'alice', { type: 'challengeBoss' }));
    state = finishChoices(state);
    assert.equal(state.challengeHistory.at(-1)!.result!.outcome, expected);
    assert.equal(state.players[0].gems.length, expected === 'attacker-wins' ? 2 : 1);
    assert.equal(state.players[0].hand.length, originalHand);
    assert.deepEqual(state.players[0].piles, originalPiles);
    assert.deepEqual(gems(state), originalGems);
    assert.equal(state.winner, null);
  }
});

test('mixed stake transfers one Gem and returns only the loser-selected top Demon to the deck, preserving its Pile', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-earth-passive'], ['fixture-earth-passive']]);
  setPiles(state, 'bob', [['fixture-fire', 'fixture-earth'], ['fixture-earth']]);
  const originalCards = inventory(state);
  const originalGems = gems(state);
  const winnerPiles = structuredClone(state.players[0].piles);
  const selected = state.players[1].piles[0].at(-1)!;
  const underlying = state.players[1].piles[0][0];
  const loserGem = state.players[1].gems[0];
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 2 }));
  state = finishChoices(state);
  assert.equal(state.challenge!.phase, 'stake');
  assert.equal(state.challenge!.remainingDemonLosses, 1);
  assert.ok(state.players[0].gems.includes(loserGem));
  assert.equal(state.players[1].gems.length, 0);
  reject(state, 'alice', { type: 'challengeLoseDemon', cardId: selected.instanceId });
  reject(state, 'bob', { type: 'challengeLoseDemon', cardId: underlying.instanceId });
  state = act(state, 'bob', { type: 'challengeLoseDemon', cardId: selected.instanceId });
  assert.deepEqual(state.players[1].piles[0], [underlying]);
  assert.deepEqual(state.players[0].piles, winnerPiles);
  assert.equal(state.invocations.at(-1)!.instanceId, selected.instanceId);
  assert.deepEqual(state.challengeHistory.at(-1)!.result!.removedDemonIds, [selected.instanceId]);
  assert.deepEqual(inventory(state), originalCards);
  assert.deepEqual(gems(state), originalGems);
});

test('the same stake applies when challenger loses and two Demon losses use distinct Piles under declared technical policy', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-fire', 'fixture-earth'], ['fixture-earth']]);
  setPiles(state, 'bob', [['fixture-earth-passive'], ['fixture-earth-passive']]);
  state.gemSupply.push(...state.players[0].gems.splice(0));
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 2 }));
  state = finishChoices(state);
  assert.equal(state.challenge!.result!.loserId, 'alice');
  assert.equal(state.challenge!.remainingDemonLosses, 2);
  state = act(state, 'alice', { type: 'challengeLoseDemon', cardId: state.players[0].piles[0].at(-1)!.instanceId });
  reject(state, 'alice', { type: 'challengeLoseDemon', cardId: state.players[0].piles[0].at(-1)!.instanceId });
  state = act(state, 'alice', { type: 'challengeLoseDemon', cardId: state.players[0].piles[1].at(-1)!.instanceId });
  assert.equal(state.challengeHistory.at(-1)!.result!.removedDemonIds.length, 2);
  assert.equal(state.players[0].piles[0].length, 1);
});

test('technical hand stake transfers preserve identities privately; undefined per-Gem modifier stays blocked', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-earth']]);
  setPiles(state, 'bob', []);
  state.gemSupply.push(...state.players[1].gems.splice(0));
  const originalCards = inventory(state);
  const handCount = state.players[0].hand.length;
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 }));
  const selected = [...state.players[1].hand].sort((a, b) => a.instanceId.localeCompare(b.instanceId))[0];
  state = finishChoices(state);
  assert.equal(state.players[0].hand.length, handCount + 1);
  assert.ok(state.players[0].hand.some(card => card.instanceId === selected.instanceId));
  assert.equal(JSON.stringify(getView(state, 'eve')).includes(selected.instanceId), false);
  assert.deepEqual(inventory(state), originalCards);
  state = setup();
  state.players[0].hand[0].definitionId = 'fixture-per-gem-undefined';
  state = prepare(act(state, 'alice', { type: 'challengeBoss' }));
  const result = applyCommand(state, 'alice', { id: 'undefined', expectedVersion: state.version, action: { type: 'challengeCommit', cardId: state.players[0].hand[0].instanceId } }, state.lastNow + 1);
  assert.equal(result.ok, false);
  assert.match(result.error!, /formula non definita/);
});

test('no-modifier and empty-hand preparation work only as declared fixture policy; used card never activates its main text', () => {
  let state = setup();
  state.discard.push(...state.players[0].hand.splice(0));
  bossResponse(state, 'fixture-resource');
  state = prepare(act(state, 'alice', { type: 'challengeBoss' }));
  assert.ok(getView(state, 'alice').legalActions.some(action => action.type === 'challengeCommit' && action.cardId === null));
  state = finishChoices(state);
  assert.equal(state.challengeHistory.at(-1)!.revealed[0].card, null);
  assert.equal(state.events.some(event => event.type === 'entryEffect' || event.type === 'actionEffect'), false);
});

test('idempotency and canonical fingerprints protect rotations, rewards and commitments; rejected malformed commands preserve state', () => {
  let state = setup();
  give(state, 'alice', 'fixture-shifter');
  state = act(state, 'alice', { type: 'challengeBoss' });
  const actor = state.challenge!.window!.actorId;
  const action = getView(state, actor).legalActions.find(action => action.type === 'challengeShift')!;
  const command: Command = { id: 'once', expectedVersion: state.version, action };
  const first = applyCommand(state, actor, command, state.lastNow + 1);
  assert.equal(first.ok, true);
  const retry = applyCommand(first.state, actor, command, 999_999);
  assert.equal(retry.duplicate, true);
  assert.strictEqual(retry.state, first.state);
  assert.equal(first.state.challenge!.rotations.length, 1);
  const different = applyCommand(first.state, actor, { ...command, action: { type: 'challengePass' } }, first.state.lastNow + 1);
  assert.equal(different.ok, false);
  state = prepare(first.state);
  for (const malformed of [
    { type: 'challengeCommit', cardId: null, elementChoice: null },
    { type: 'challengeReplace', cardId: 'x', slot: -1 },
    { type: 'challengeShift', cardId: 'x', mode: 'both' },
    { type: 'challengeReady', extra: true },
    { type: 'challengeMagist', targetId: 'bob', stake: 3 },
  ]) reject(state, 'alice', malformed as GameAction);
  const stale = applyCommand(state, 'alice', { id: 'stale', expectedVersion: 0, action: { type: 'challengeCommit', cardId: null } }, state.lastNow + 1);
  assert.equal(stale.ok, false);
});

test('pure engine replay matches online command timing, conserves inventories and strips secrets from interrupted choices', () => {
  const initial = setup();
  let online = initial;
  let headless = structuredClone(initial);
  const cards = inventory(initial);
  const originalGems = gems(initial);
  const dispatch = (actorId: string, action: GameAction): void => {
    const command: Command = { id: `replay-${online.version}`, expectedVersion: online.version, action };
    const now = online.lastNow + 10;
    const left = applyCommand(online, actorId, command, now);
    const right = applyCommand(headless, actorId, structuredClone(command), now);
    assert.equal(left.ok, true, left.error);
    assert.equal(right.ok, true, right.error);
    online = left.state; headless = right.state;
    assert.deepEqual(headless, online);
  };
  dispatch('alice', { type: 'challengeBoss' });
  while (online.challenge!.phase === 'intervention') {
    const now = online.challenge!.window!.expiresAt;
    online = advanceTime(online, now).state;
    headless = advanceTime(headless, now).state;
    assert.deepEqual(headless, online);
  }
  const commit = getView(online, 'alice').legalActions.find(action => action.type === 'challengeCommit' && action.cardId !== null) ?? { type: 'challengeCommit', cardId: null };
  dispatch('alice', commit as GameAction);
  dispatch('alice', { type: 'challengeReady' });
  assert.deepEqual(inventory(online), cards);
  assert.deepEqual(gems(online), originalGems);
  dispatch('alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 });
  while ((online as GameState).challenge!.phase === 'intervention') dispatch(online.challenge!.window!.actorId, { type: 'challengePass' });
  dispatch('alice', { type: 'challengeCommit', cardId: null });
  online = stopGame(online, online.lastNow + 1, 'Arresto tecnico del test');
  assert.equal(online.challenge, null);
  assert.equal(online.challengeHistory.at(-1)!.result!.outcome, 'interrupted');
  assert.equal(JSON.stringify(getView(online, 'bob')).includes('commitments'), false);
  assert.deepEqual(inventory(online), cards);
  assert.equal(online.winner, null);
});


test('a Demon with a modifier is discarded from hand without summoning or activating its Entrata text', () => {
  let state = setup();
  const index = state.invocations.findIndex(card => card.definitionId === 'fixture-fire');
  assert.notEqual(index, -1);
  const [card] = state.invocations.splice(index, 1);
  state.players[0].hand.push(card);
  const supply = state.supply.length;
  const piles = structuredClone(state.players[0].piles);
  const cards = inventory(state);
  bossResponse(state, 'fixture-resource');
  state = prepare(act(state, 'alice', { type: 'challengeBoss' }));
  state = finishChoices(state, { alice: { cardId: card.instanceId } });
  assert.ok(state.discard.some(candidate => candidate.instanceId === card.instanceId));
  assert.deepEqual(state.players[0].piles, piles);
  assert.equal(state.supply.length, supply);
  assert.equal(state.events.some(event => event.type === 'entryEffect' || event.type === 'summon'), false);
  assert.deepEqual(inventory(state), cards);
});

test('five Boss orientations wrap clockwise using reachable sides only', () => {
  let state = setup();
  assert.equal(state.boss!.sides.length, 5);
  state.boss!.orientation = 4;
  const shifter = give(state, 'alice', 'fixture-shifter');
  state = act(state, 'alice', { type: 'challengeBoss' });
  state = act(state, 'alice', { type: 'challengeShift', cardId: shifter.instanceId, mode: 'rotate' });
  assert.equal(state.boss!.orientation, 0);
  assert.deepEqual(state.challenge!.rotations[0], { actorId: 'alice', from: 4, to: 0, source: 'intervention' });
});

test('technical interruption during pending stake preserves already applied public transfers in the report', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-earth-passive'], ['fixture-earth-passive']]);
  setPiles(state, 'bob', [['fixture-earth'], ['fixture-earth']]);
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 2 }));
  state = finishChoices(state);
  assert.equal(state.challenge!.phase, 'stake');
  const transfers = structuredClone(state.challenge!.result!.gemTransfers);
  const beforeGems = gems(state);
  state = stopGame(state, state.lastNow + 1, 'Arresto host durante scelta obbligatoria');
  assert.equal(state.challengeHistory.at(-1)!.result!.outcome, 'interrupted');
  assert.deepEqual(state.challengeHistory.at(-1)!.result!.gemTransfers, transfers);
  assert.deepEqual(gems(state), beforeGems);
});

test('retried final reveal and loss commands never duplicate rewards, discards or Demon removal', () => {
  let state = setup();
  setPiles(state, 'alice', [['fixture-earth-passive'], ['fixture-earth-passive']]);
  bossResponse(state, 'fixture-resource');
  state = prepare(act(state, 'alice', { type: 'challengeBoss' }));
  state = act(state, 'alice', { type: 'challengeCommit', cardId: null });
  const ready: Command = { id: 'ready-once', expectedVersion: state.version, action: { type: 'challengeReady' } };
  const result = applyCommand(state, 'alice', ready, state.lastNow + 1);
  assert.equal(result.ok, true);
  assert.equal(result.state.players[0].gems.length, 2);
  const retried = applyCommand(result.state, 'alice', ready, result.state.lastNow + 99);
  assert.equal(retried.duplicate, true);
  assert.strictEqual(retried.state, result.state);
  state = setup();
  setPiles(state, 'alice', [['fixture-earth-passive'], ['fixture-earth-passive']]);
  setPiles(state, 'bob', [['fixture-fire', 'fixture-earth']]);
  state = prepare(act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 2 }));
  state = finishChoices(state);
  const loss: Command = { id: 'loss-once', expectedVersion: state.version, action: { type: 'challengeLoseDemon', cardId: state.players[1].piles[0].at(-1)!.instanceId } };
  const lost = applyCommand(state, 'bob', loss, state.lastNow + 1);
  assert.equal(lost.ok, true);
  const lostRetry = applyCommand(lost.state, 'bob', loss, lost.state.lastNow + 99);
  assert.equal(lostRetry.duplicate, true);
  assert.strictEqual(lostRetry.state, lost.state);
  assert.equal(lost.state.players[1].piles[0].length, 1);
});

test('arbitrary valid player IDs cannot mutate commitment prototypes or prevent readiness', () => {
  let state = createGame([{ id: '__proto__', name: 'Uno', kind: 'human' }, { id: 'constructor', name: 'Due', kind: 'human' }], 42, { preset: 'challenge-fixtures' });
  state = prepare(act(state, '__proto__', { type: 'challengeMagist', targetId: 'constructor', stake: 1 }));
  state = finishChoices(state);
  assert.equal(state.challenge, null);
  assert.equal(state.challengeHistory.length, 1);
  assert.equal(Object.hasOwn(getView(state, '__proto__'), 'commitments'), false);
});

test('a player named boss cannot collide with the actual Boss response, for null or real commitments', () => {
  for (const useModifier of [false, true]) {
    let state = createGame([{ id: 'boss', name: 'Magista boss', kind: 'human' }, { id: 'other', name: 'Altro', kind: 'human' }], 42, { preset: 'challenge-fixtures' });
    const modifier = useModifier ? give(state, 'boss', 'fixture-plus-earth') : null;
    const response = bossResponse(state, 'fixture-shifter');
    const before = inventory(state);
    state = prepare(act(state, 'boss', { type: 'challengeBoss' }));
    state = finishChoices(state, { boss: { cardId: modifier?.instanceId ?? null } });
    const record = state.challengeHistory.at(-1)!;
    assert.equal(record.revealed.length, 2);
    assert.deepEqual(record.revealed.map(item => [item.actorId, item.source]), [['boss', 'player'], ['boss', 'boss']]);
    assert.equal(record.revealed[0].card?.instanceId ?? null, modifier?.instanceId ?? null);
    assert.equal(record.revealed[1].card!.instanceId, response.instanceId);
    assert.equal(record.rotations.length, 1);
    assert.equal(record.rotations[0].source, 'boss-response');
    assert.equal(state.boss!.orientation, 1, 'the response Shifter still rotates when the player also has ID boss');
    assert.deepEqual(inventory(state), before);
    assert.deepEqual(getView(state, 'other').challengeHistory.at(-1)!.revealed, record.revealed);
  }
});

test('refusal and redirection require their draw and reject an empty deck atomically without a pointless window', () => {
  let state = setup();
  const card = give(state, 'bob', 'fixture-shifter');
  state.discard.push(...state.supply.splice(0));
  state = act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 });
  assert.equal(state.challenge!.phase, 'preparation');
  assert.equal(state.events.some(event => event.type === 'challengeWindow'), false);
  assert.equal(getView(state, 'bob').legalActions.some(action => action.type === 'challengeShift'), false);
  const actions = state.actionsRemaining;
  const hand = structuredClone(state.players[1].hand);
  const discards = structuredClone(state.discard);
  for (const mode of ['refuse', 'redirect'] as const) {
    reject(state, 'bob', { type: 'challengeShift', cardId: card.instanceId, mode, ...(mode === 'redirect' ? { targetId: 'eve' } : {}) });
  }
  assert.equal(state.actionsRemaining, actions);
  assert.deepEqual(state.players[1].hand, hand);
  assert.deepEqual(state.discard, discards);
  assert.equal(state.challengeHistory.length, 0);

  // Recheck availability when validating a command, even for an already-open window.
  state = setup();
  const waitingCard = give(state, 'bob', 'fixture-shifter');
  state = act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 });
  assert.equal(state.challenge!.window!.actorId, 'bob');
  state.discard.push(...state.supply.splice(0));
  assert.deepEqual(getView(state, 'bob').legalActions, [{ type: 'challengePass' }]);
  reject(state, 'bob', { type: 'challengeShift', cardId: waitingCard.instanceId, mode: 'refuse' });
  reject(state, 'bob', { type: 'challengeShift', cardId: waitingCard.instanceId, mode: 'redirect', targetId: 'eve' });
});

test('Shifter discard permits the mandatory draw at the hand limit, while rotation needs no supply', () => {
  let state = setup();
  const card = give(state, 'bob', 'fixture-shifter');
  state.players[1].hand.push(...state.supply.splice(0, 20 - state.players[1].hand.length));
  const before = inventory(state);
  const supply = state.supply.length;
  state = act(state, 'alice', { type: 'challengeMagist', targetId: 'bob', stake: 1 });
  assert.ok(getView(state, 'bob').legalActions.some(action => action.type === 'challengeShift' && action.mode === 'refuse'));
  state = act(state, 'bob', { type: 'challengeShift', cardId: card.instanceId, mode: 'refuse' });
  assert.equal(state.players[1].hand.length, 20);
  assert.equal(state.supply.length, supply - 1);
  assert.equal(state.events.filter(event => event.type === 'challengeShiftDraw').length, 1);
  assert.deepEqual(inventory(state), before);

  state = setup();
  const rotateCard = give(state, 'alice', 'fixture-shifter');
  state.discard.push(...state.supply.splice(0));
  state = act(state, 'alice', { type: 'challengeBoss' });
  assert.ok(getView(state, 'alice').legalActions.some(action => action.type === 'challengeShift' && action.mode === 'rotate'));
  state = act(state, 'alice', { type: 'challengeShift', cardId: rotateCard.instanceId, mode: 'rotate' });
  assert.equal(state.boss!.orientation, 1);
  assert.equal(state.supply.length, 0);
  assert.equal(state.events.some(event => event.type === 'challengeShiftDraw'), false);
});

