import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceTime, applyCommand, createGame, getView } from '../src/engine/index.js';
import { CARD_DEFINITIONS } from '../src/content/catalog.js';
import { CSV_COLUMNS, parseArguments, replaySession, sessionText, simulateSession, summariesCsv, type SimulationReplay } from '../src/simulator/index.js';

const cases = [
  { players: 3, difficulty: 'easy', seed: 42, preset: 'challenge-fixtures', maxTurns: 12, reactionPolicy: 'decide' },
  { players: 3, difficulty: 'medium', seed: 43, preset: 'challenge-fixtures', maxTurns: 12, reactionPolicy: 'timeout' },
  { players: 2, difficulty: 'hard', seed: 44, preset: 'challenge-fixtures', maxTurns: 12, reactionPolicy: 'decide' },
] as const;
const runs = cases.map(options => simulateSession(options));
const roundTrip = (replay: SimulationReplay): SimulationReplay => JSON.parse(JSON.stringify(replay)) as SimulationReplay;

for (const [index, options] of cases.entries()) test(`simulator ${options.players} ${options.difficulty} ${options.reactionPolicy}: JSON replay reproduces commands, events, history and complete engine state`, () => {
  const run = runs[index];
  assert.equal(run.metadata.formatVersion, 2);
  assert.equal(run.metadata.codeVersion, 'demonicute-alpha-0.2.0');
  assert.equal(run.metadata.preset.id, 'challenge-fixtures');
  assert.equal(run.metadata.options.preset, 'challenge-fixtures');
  assert.equal(run.summary.stopCategory, 'technical-turn-limit');
  assert.equal(run.summary.turns, 12);
  assert.equal(run.summary.challengesDeclared, 12);
  assert.ok(run.summary.modifierCardsPlayed > 0);
  assert.ok(run.summary.substitutions > 0);
  assert.equal(run.summary.problematicPendingChoices, 0);
  assert.deepEqual(run.summary.errors, []);
  assert.equal(run.summary.winner, null);
  assert.equal(run.metadata.safetyLimits.effectsPerCommand, 32);
  assert.equal(run.metadata.safetyLimits.pendingChoices, 5);
  const replayed = replaySession(roundTrip(run));
  assert.deepEqual(replayed, replaySession(run));
  assert.deepEqual(replayed.events, run.events);
  assert.deepEqual(replayed.challengeHistory, run.challengeHistory);
  assert.deepEqual(run.summary.challengeRecords, run.challengeHistory);
  assert.equal(run.summary.acceptedCommands, run.commands.length);
  assert.equal(run.summary.virtualDuration, replayed.lastNow);
  assert.deepEqual(run.steps.filter(step => step.type === 'command').map(({ actorId, command, now }) => ({ actorId, command, now })), run.commands);
});

test('timeout policy advances only legal optional windows to their exact virtual deadline; preparation still uses commands', () => {
  const run = runs[1];
  const timeSteps = run.steps.filter(step => step.type === 'time');
  assert.ok(timeSteps.length > 0);
  assert.equal(run.summary.reactionTimeouts, timeSteps.length);
  assert.ok(run.summary.virtualDuration >= timeSteps.length * 5_000);
  assert.ok(run.commands.some(item => item.command.action.type === 'challengeCommit'));
  assert.ok(run.commands.some(item => item.command.action.type === 'challengeReady'));
  assert.ok(run.commands.every(item => item.command.action.type !== 'challengePass' && item.command.action.type !== 'challengeShift'));
  let state = createGame(run.metadata.players, run.metadata.seed, run.metadata.options);
  for (const step of run.steps) {
    if (step.type === 'time') {
      assert.equal(state.challenge!.phase, 'intervention');
      assert.equal(step.now, state.challenge!.window!.expiresAt);
      state = advanceTime(state, step.now).state;
    } else if (step.type === 'command') {
      const eligible = getView(state, state.players[0].id).pendingActorIds;
      assert.equal(step.actorId, eligible[0] ?? state.currentPlayerId);
      state = applyCommand(state, step.actorId, step.command, step.now).state;
    } else assert.fail('normal test session must not require an external stop');
  }
  assert.equal(state.phase, 'ended');
  assert.ok(runs.filter(run => run.metadata.reactionPolicy === 'decide').every(run => run.steps.every(step => step.type !== 'time')));
});

test('challenge metrics derive from structured event data and actual revealed/history records', () => {
  for (const run of runs) {
    const summary = run.summary;
    const records = run.challengeHistory;
    const declared = run.events.filter(event => event.type === 'challengeDeclared');
    assert.equal(summary.challengesDeclared, declared.length);
    assert.equal(summary.bossChallenges, declared.filter(event => event.data?.kind === 'boss').length);
    assert.equal(summary.magistDuels, declared.filter(event => event.data?.kind === 'duel').length);
    assert.equal(summary.stakesOne, declared.filter(event => event.data?.stake === 1).length);
    assert.equal(summary.stakesTwo, declared.filter(event => event.data?.stake === 2).length);
    assert.equal(summary.challengesRefused, run.events.filter(event => event.type === 'challengeRefused').length);
    assert.equal(summary.challengesRedirected, run.events.filter(event => event.type === 'challengeRedirected').length);
    assert.equal(summary.challengesInterrupted, run.events.filter(event => event.type === 'challengeInterrupted').length);
    assert.equal(summary.rotations, records.reduce((sum, record) => sum + record.rotations.length, 0));
    assert.equal(summary.substitutions, records.reduce((sum, record) => sum + record.substitutions.length, 0));
    assert.equal(summary.modifierCardsPlayed, records.reduce((sum, record) => sum + record.revealed.filter(item => item.actorId !== 'boss' && item.card).length, 0));
    assert.equal(summary.bossResponsesRevealed, records.reduce((sum, record) => sum + record.revealed.filter(item => item.actorId === 'boss' && item.card).length, 0));
    assert.equal(summary.bossStarshifterResponses, records.reduce((sum, record) => sum + record.revealed.filter(item => item.actorId === 'boss' && item.card && CARD_DEFINITIONS[item.card.definitionId].starshifter).length, 0));
    assert.equal(summary.gemsAwarded, records.reduce((sum, record) => sum + (record.result?.gemsAwarded ?? 0), 0));
    assert.equal(summary.gemsTransferred, records.reduce((sum, record) => sum + (record.result?.gemTransfers.length ?? 0), 0));
    assert.equal(summary.handCardsTransferred, records.reduce((sum, record) => sum + (record.result?.handTransfers.reduce((count, transfer) => count + transfer.count, 0) ?? 0), 0));
    assert.equal(summary.demonsRemoved, records.reduce((sum, record) => sum + (record.result?.removedDemonIds.length ?? 0), 0));
    assert.equal(summary.participantStarsBefore, records.reduce((sum, record) => sum + record.counts.reduce((count, player) => count + player.before, 0), 0));
    assert.equal(summary.participantStarsAfter, records.reduce((sum, record) => sum + record.counts.reduce((count, player) => count + player.after, 0), 0));
    assert.ok(records.flatMap(record => record.counts.flatMap(player => player.demons)).every(demon => demon.reference >= 0 && demon.final >= 0));
    for (const [kind, outcome, field] of [
      ['boss', 'attacker-wins', 'bossWins'], ['boss', 'defender-wins', 'bossLosses'], ['boss', 'tie', 'bossTies'],
      ['duel', 'attacker-wins', 'duelAttackerWins'], ['duel', 'defender-wins', 'duelDefenderWins'], ['duel', 'tie', 'duelTies'],
    ] as const) assert.equal(summary[field], records.filter(record => record.kind === kind && record.result?.outcome === outcome).length);
  }
});

test('replay rejects altered command lists, timing, hidden alternatives, events, history, metrics and final state', () => {
  const source = runs[1];
  const changedCommand = roundTrip(source);
  changedCommand.commands[0].command.expectedVersion = 999;
  assert.throws(() => replaySession(changedCommand), /Replay non valido/);
  const changedTime = roundTrip(source);
  changedTime.steps.find(step => step.type === 'time')!.now++;
  assert.throws(() => replaySession(changedTime), /Replay non valido/);
  const changedStep = roundTrip(source);
  const step = changedStep.steps.find(step => step.type === 'command')!;
  if (step.type === 'command') step.actorId = 'wrong-player';
  assert.throws(() => replaySession(changedStep), /Replay non valido/);
  const changedEvents = roundTrip(source);
  changedEvents.events[0].text = 'alterato';
  assert.throws(() => replaySession(changedEvents), /eventi/);
  const changedHistory = roundTrip(source);
  changedHistory.challengeHistory[0].attackerId = 'alterato';
  assert.throws(() => replaySession(changedHistory), /cronologia/);
  const changedSummary = roundTrip(source);
  changedSummary.summary.gemsAwarded++;
  assert.throws(() => replaySession(changedSummary), /metriche/);
  const changedState = roundTrip(source);
  changedState.finalStateHash = '0'.repeat(64);
  assert.throws(() => replaySession(changedState), /stato finale/);
  const changedVersion = roundTrip(source);
  changedVersion.metadata.rulesVersion = 'alterata';
  assert.throws(() => replaySession(changedVersion), /incompatibili/);
  const changedLimit = roundTrip(source);
  changedLimit.metadata.safetyLimits.effectsPerCommand = 1;
  assert.throws(() => replaySession(changedLimit), /limite audit/);
  const choiceSource = runs.find(run => run.commands.some(item => item.command.action.type === 'challengeCommit' && item.command.action.elementChoice));
  assert.ok(choiceSource);
  const changedAlternative = roundTrip(choiceSource);
  const choiceCommand = changedAlternative.commands.find(item => item.command.action.type === 'challengeCommit' && item.command.action.elementChoice)!;
  const choiceStep = changedAlternative.steps.find(step => step.type === 'command' && step.command.id === choiceCommand.command.id)!;
  if (choiceCommand.command.action.type === 'challengeCommit' && choiceStep.type === 'command' && choiceStep.command.action.type === 'challengeCommit') {
    const alternative = choiceCommand.command.action.elementChoice === 'Terra' ? 'Fuoco' : 'Terra';
    choiceCommand.command.action.elementChoice = alternative;
    choiceStep.command.action.elementChoice = alternative;
  }
  assert.throws(() => replaySession(changedAlternative), /eventi/);
  const removedTime = roundTrip(source);
  removedTime.steps = removedTime.steps.filter(step => step.type !== 'time');
  assert.throws(() => replaySession(removedTime), /Replay non valido/);
});

test('lower audit limits produce a recorded safety stop and reproducible interrupted challenge, never a game victory', () => {
  for (const limit of [{ maxChoices: 0 }, { maxEffects: 1 }]) {
    const run = simulateSession({ players: 3, difficulty: 'easy', seed: 42, preset: 'challenge-fixtures', maxTurns: 12, ...limit });
    assert.equal(run.summary.stopCategory, 'safety');
    assert.equal(run.steps.at(-1)!.type, 'stop');
    assert.equal(run.summary.challengesInterrupted, 1);
    assert.equal(run.summary.winner, null);
    assert.ok(run.summary.peakPendingChoices > 0);
    assert.equal(replaySession(roundTrip(run)).phase, 'ended');
    assert.deepEqual(run.summary.errors, []);
  }
  const limited = simulateSession({ players: 3, difficulty: 'easy', seed: 42, preset: 'challenge-fixtures', maxActions: 1 });
  assert.equal(limited.summary.stopCategory, 'technical-command-limit');
  assert.equal(limited.summary.challengesInterrupted, 1);
  assert.equal(replaySession(roundTrip(limited)).winner, null);
});

test('CSV and text contain numerical challenge metrics and distinguish challenge results from game victory', () => {
  const summaries = runs.map(run => run.summary);
  const csv = summariesCsv(summaries);
  assert.equal(csv.trim().split('\n').length, summaries.length + 1);
  for (const key of ['challengesDeclared', 'stakesOne', 'stakesTwo', 'rotations', 'substitutions', 'modifierCardsPlayed', 'bossWins', 'duelDefenderWins', 'gemsAwarded', 'gemsTransferred', 'handCardsTransferred', 'demonsRemoved', 'participantStarsBefore', 'participantStarsAfter', 'reactionTimeouts'] as const) {
    assert.ok(CSV_COLUMNS.includes(key));
    assert.ok(csv.split('\n')[0].includes(`"${key}"`));
  }
  const text = sessionText(summaries[0]);
  assert.match(text, /Sfide dichiarate:/);
  assert.match(text, /Boss:/);
  assert.match(text, /Duelli:/);
  assert.match(text, /Vincitore della partita: non applicabile/);
  assert.doesNotMatch(text, /sfide.*disabilitate/i);
});

test('CLI accepts explicit reaction policy and meaningful preset-specific audit limits, preserving legacy defaults', () => {
  const legacy = parseArguments([]);
  assert.equal(legacy.options.preset, 'technical-fixtures');
  assert.equal(legacy.options.maxEffects, 1);
  assert.equal(legacy.options.maxChoices, 0);
  assert.equal(legacy.options.reactionPolicy, 'decide');
  const challenges = parseArguments(['--preset', 'challenge-fixtures', '--reactions', 'timeout', '--max-turns', '12']);
  assert.equal(challenges.options.maxEffects, 32);
  assert.equal(challenges.options.maxChoices, 5);
  assert.equal(challenges.options.reactionPolicy, 'timeout');
  assert.equal(parseArguments(['--preset', 'challenge-fixtures', '--max-choices', '0']).options.maxChoices, 0);
  for (const args of [['--reactions', 'random'], ['--preset', 'official'], ['--max-effects', '0'], ['--max-choices', '6'], ['--players', '3.5'], ['--reactions', 'decide', '--reactions', 'timeout']]) assert.throws(() => parseArguments(args));
  assert.throws(() => simulateSession({ players: 3, difficulty: 'easy', seed: 42, reactionPolicy: 'wrong' as never }));
});
