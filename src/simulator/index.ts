import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChallengeRecord, Command, Difficulty, GameEvent, GameView, PlayerSetup, PresetId } from '../shared/game.js';
import { advanceTime, applyCommand, createGame, getView, stopGame, type GameState } from '../engine/index.js';
import { chooseAction } from '../bots/index.js';
import { CARD_DEFINITIONS, CATALOG_VERSION, PRESET, RULES_VERSION } from '../content/catalog.js';
import { CHALLENGE_BLOCKERS, CHALLENGE_POLICY } from '../content/challenges.js';

export const CODE_VERSION = 'demonicute-alpha-0.2.0';
export interface SimulationOptions {
  players: number; difficulty: Difficulty; seed: number;
  maxTurns?: number; maxActions?: number; preset?: string;
  reactionPolicy?: 'decide' | 'timeout'; maxEffects?: number; maxChoices?: number;
}
export interface ReplayCommand { actorId: string; command: Command; now: number }
export type StopCategory = 'technical-turn-limit' | 'technical-command-limit' | 'stalled' | 'error' | 'safety' | 'host-stop';
export type ReplayStep =
  | ({ type: 'command' } & ReplayCommand)
  | { type: 'time'; now: number }
  | { type: 'stop'; now: number; reason: string; category: 'stalled' | 'error' | 'safety' | 'host-stop'; failedCommand?: ReplayCommand };
export interface SafetyLimits {
  effectsPerCommand: number; pendingChoices: number; timelineSteps: number;
  effectsMetric: 'main-ability-events-per-command' | 'emitted-events-per-transition';
  pendingChoicesMetric: string;
  auditNote: string;
}
export interface SessionSummary {
  seed: number; participants: number; difficulty: Difficulty; turns: number; acceptedCommands: number;
  gameActions: number; turnActionsSpent: number; draws: number; summons: number; stacks: number; activations: number; endTurns: number;
  cardsUsed: Record<string, number>; abilitiesUsed: Record<string, number>;
  resourcesPaid: number; finalHands: number[]; finalStars: number[]; finalGems: number[];
  turnsWithoutLegalAction: number; problematicPendingChoices: number; errors: string[]; errorCount: number;
  stopCategory: StopCategory; stopReason: string;
  winner: null; victoryAnalysis: 'not-applicable'; virtualDuration: number;
  challengesDeclared: number; bossChallenges: number; magistDuels: number;
  challengesRefused: number; challengesRedirected: number; challengesInterrupted: number;
  stakesOne: number; stakesTwo: number; modifierCardsPlayed: number; pentagonModifiersApplied: number;
  bossResponsesRevealed: number; starshiftersPlayed: number; bossStarshifterResponses: number;
  rotations: number; substitutions: number; bossWins: number; bossLosses: number; bossTies: number;
  duelAttackerWins: number; duelDefenderWins: number; duelTies: number;
  gemsAwarded: number; gemsTransferred: number; handCardsTransferred: number; demonsRemoved: number;
  participantStarsBefore: number; participantStarsAfter: number; bossStarsBefore: number; bossStarsAfter: number;
  reactionTimeouts: number; peakPendingChoices: number; maxTransitionEvents: number; peakAuditedEffects: number;
  challengeRecords: ChallengeRecord[];
}
type SimulationPreset = Omit<typeof PRESET, 'id' | 'label' | 'notes'> & { id: PresetId; label: string; notes: readonly string[] };
export interface SimulationReplay {
  metadata: {
    formatVersion: 2; codeVersion: string; codeHash?: string; rulesVersion: string;
    catalogVersion: string; preset: SimulationPreset; seed: number; players: PlayerSetup[];
    options: { maxTurns: number; maxActions: number; now: number; preset: PresetId };
    reactionPolicy: 'decide' | 'timeout'; privacy: string; virtualTimeUnit: string; safetyLimits: SafetyLimits;
  };
  commands: ReplayCommand[]; steps: ReplayStep[]; events: GameEvent[];
  challengeHistory: ChallengeRecord[]; finalStateHash: string; summary: SessionSummary;
}
function presetConfiguration(id: PresetId): SimulationPreset {
  return id === PRESET.id ? PRESET : { ...PRESET, id, label: 'Sfide Boss e duelli · sole fixture tecniche', notes: [...CHALLENGE_POLICY, ...CHALLENGE_BLOCKERS] };
}
function bounded(value: number, label: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new TypeError(`${label}: intero tra ${min} e ${max}.`);
  return value;
}
function safetyConfiguration(preset: PresetId, options: SimulationOptions, maxActions: number): SafetyLimits {
  return {
    effectsPerCommand: bounded(options.maxEffects ?? (preset === 'challenge-fixtures' ? 32 : 1), 'max-effects', 1, 1_000),
    pendingChoices: bounded(options.maxChoices ?? (preset === 'challenge-fixtures' ? 5 : 0), 'max-choices', 0, 5),
    timelineSteps: maxActions * 6 + 1,
    effectsMetric: preset === 'challenge-fixtures' ? 'emitted-events-per-transition' : 'main-ability-events-per-command',
    pendingChoicesMetric: 'Giocatori con risposta facoltativa o scelta di sfida attualmente legale; 0 fuori da una sfida. Audit tecnico, non effetti ufficiali.',
    auditNote: 'L’audit misura comandi di gioco e avanzamenti delle finestre. I messaggi diagnostici dell’arresto forzato sono esclusi. Il limite interrompe dopo la transizione atomica che lo supera, senza annullarla.',
  };
}
function initialSummary(options: SimulationOptions): SessionSummary {
  return {
    seed: options.seed, participants: options.players, difficulty: options.difficulty, turns: 0, acceptedCommands: 0,
    gameActions: 0, turnActionsSpent: 0, draws: 0, summons: 0, stacks: 0, activations: 0, endTurns: 0,
    cardsUsed: {}, abilitiesUsed: {}, resourcesPaid: 0, finalHands: [], finalStars: [], finalGems: [],
    turnsWithoutLegalAction: 0, problematicPendingChoices: 0, errors: [], errorCount: 0, stopCategory: 'technical-turn-limit', stopReason: '', winner: null, victoryAnalysis: 'not-applicable', virtualDuration: 0,
    challengesDeclared: 0, bossChallenges: 0, magistDuels: 0, challengesRefused: 0, challengesRedirected: 0, challengesInterrupted: 0,
    stakesOne: 0, stakesTwo: 0, modifierCardsPlayed: 0, pentagonModifiersApplied: 0, bossResponsesRevealed: 0, starshiftersPlayed: 0, bossStarshifterResponses: 0,
    rotations: 0, substitutions: 0, bossWins: 0, bossLosses: 0, bossTies: 0, duelAttackerWins: 0, duelDefenderWins: 0, duelTies: 0,
    gemsAwarded: 0, gemsTransferred: 0, handCardsTransferred: 0, demonsRemoved: 0,
    participantStarsBefore: 0, participantStarsAfter: 0, bossStarsBefore: 0, bossStarsAfter: 0,
    reactionTimeouts: 0, peakPendingChoices: 0, maxTransitionEvents: 0, peakAuditedEffects: 0, challengeRecords: [],
  };
}
function addCount(record: Record<string, number>, key: string): void { record[key] = (record[key] ?? 0) + 1; }
function measureCommand(summary: SessionSummary, view: GameView, item: ReplayCommand): void {
  const action = item.command.action;
  if (action.type === 'endTurn') {
    summary.endTurns++;
    if (view.actionsRemaining === PRESET.actionsPerTurn && view.legalActions.length === 1) summary.turnsWithoutLegalAction++;
  } else summary.gameActions++;
  if (['draw', 'summon', 'activate', 'challengeBoss', 'challengeMagist'].includes(action.type)) summary.turnActionsSpent++;
  if (action.type === 'draw') summary.draws++;
  if (action.type === 'activate') { summary.activations++; addCount(summary.abilitiesUsed, 'action-draw'); }
  if (action.type === 'summon') {
    summary.summons++;
    const player = view.players.find(player => player.id === item.actorId)!;
    if (player.piles[action.slot].length) summary.stacks++;
    const card = view.limbo.find(card => card.instanceId === action.cardId)!;
    const definition = CARD_DEFINITIONS[card.definitionId];
    addCount(summary.cardsUsed, card.definitionId);
    if (definition.effect === 'entry-draw' || definition.effect === 'passive-star') addCount(summary.abilitiesUsed, definition.effect);
    summary.resourcesPaid += action.paymentIds.length;
  }
  if (action.type === 'challengeShift') {
    const card = view.players.find(player => player.id === item.actorId)!.hand!.find(card => card.instanceId === action.cardId)!;
    addCount(summary.cardsUsed, card.definitionId);
  }
}
function pendingChoiceCount(state: GameState): number {
  return state.challenge ? getView(state, state.currentPlayerId).pendingActorIds.length : 0;
}
function auditTransition(before: GameState, after: GameState, summary: SessionSummary, limits: SafetyLimits): string | undefined {
  const emitted = after.events.slice(before.events.length);
  const effects = limits.effectsMetric === 'emitted-events-per-transition' ? emitted.length : emitted.filter(event => event.type === 'entryEffect' || event.type === 'actionEffect').length;
  const pending = pendingChoiceCount(after);
  summary.maxTransitionEvents = Math.max(summary.maxTransitionEvents, emitted.length);
  summary.peakAuditedEffects = Math.max(summary.peakAuditedEffects, effects);
  summary.peakPendingChoices = Math.max(summary.peakPendingChoices, pending);
  if (effects > limits.effectsPerCommand) return `Audit tecnico: ${effects} ${limits.effectsMetric}, limite ${limits.effectsPerCommand}.`;
  if (pending > limits.pendingChoices) return `Audit tecnico: ${pending} giocatori con scelta sfida disponibile, limite ${limits.pendingChoices}.`;
}
function finalizeSummary(summary: SessionSummary, state: GameState, steps: ReplayStep[]): void {
  const view = getView(state, state.players[0].id);
  summary.turns = state.turnNumber;
  summary.acceptedCommands = state.acceptedCommands;
  summary.finalHands = view.players.map(player => player.handCount);
  summary.finalStars = view.players.map(player => player.stars);
  summary.finalGems = view.players.map(player => player.gems.length);
  summary.stopReason = state.stopReason ?? '';
  summary.errorCount = summary.errors.length;
  summary.virtualDuration = state.lastNow;
  const last = steps.at(-1);
  summary.stopCategory = last?.type === 'stop' ? last.category : last?.type === 'command' && last.command.action.type === 'endTurn' && state.turnNumber >= state.maxTurns ? 'technical-turn-limit' : 'technical-command-limit';
  const count = (type: string): number => state.events.filter(event => event.type === type).length;
  const declared = state.events.filter(event => event.type === 'challengeDeclared');
  summary.challengesDeclared = declared.length;
  summary.bossChallenges = declared.filter(event => event.data?.kind === 'boss').length;
  summary.magistDuels = declared.filter(event => event.data?.kind === 'duel').length;
  summary.stakesOne = declared.filter(event => event.data?.stake === 1).length;
  summary.stakesTwo = declared.filter(event => event.data?.stake === 2).length;
  summary.challengesRefused = count('challengeRefused');
  summary.challengesRedirected = count('challengeRedirected');
  summary.challengesInterrupted = count('challengeInterrupted');
  summary.starshiftersPlayed = count('challengeStarshifter');
  summary.reactionTimeouts = count('challengeWindowExpired');
  summary.rotations = count('bossRotated');
  summary.substitutions = count('challengeReplaced');
  summary.challengeRecords = structuredClone(state.challengeHistory);
  for (const record of state.challengeHistory) {
    for (const revealed of record.revealed) {
      if (revealed.card && revealed.actorId !== 'boss') { summary.modifierCardsPlayed++; addCount(summary.cardsUsed, revealed.card.definitionId); }
      if (revealed.modifier) summary.pentagonModifiersApplied++;
      if (revealed.card && revealed.actorId === 'boss') {
        summary.bossResponsesRevealed++;
        if (CARD_DEFINITIONS[revealed.card.definitionId].starshifter) summary.bossStarshifterResponses++;
      }
    }
    for (const player of record.counts) { summary.participantStarsBefore += player.before; summary.participantStarsAfter += player.after; }
    if (record.bossCount) { summary.bossStarsBefore += record.bossCount.reference; summary.bossStarsAfter += record.bossCount.final; }
    const result = record.result;
    if (!result) continue;
    if (record.kind === 'boss') {
      if (result.outcome === 'attacker-wins') summary.bossWins++;
      if (result.outcome === 'defender-wins') summary.bossLosses++;
      if (result.outcome === 'tie') summary.bossTies++;
    } else {
      if (result.outcome === 'attacker-wins') summary.duelAttackerWins++;
      if (result.outcome === 'defender-wins') summary.duelDefenderWins++;
      if (result.outcome === 'tie') summary.duelTies++;
    }
    summary.gemsAwarded += result.gemsAwarded;
    summary.gemsTransferred += result.gemTransfers.length;
    summary.handCardsTransferred += result.handTransfers.reduce((sum, transfer) => sum + transfer.count, 0);
    summary.demonsRemoved += result.removedDemonIds.length;
  }
}
const stateHash = (state: GameState): string => createHash('sha256').update(JSON.stringify(state)).digest('hex');

/** Pure deterministic batch: bots receive only filtered views, optional waits consume virtual time. */
export function simulateSession(options: SimulationOptions): SimulationReplay {
  bounded(options.players, 'players', 2, 5);
  if (!['easy', 'medium', 'hard'].includes(options.difficulty)) throw new TypeError('difficulty: easy, medium o hard.');
  const preset = options.preset ?? PRESET.id;
  if (preset !== 'technical-fixtures' && preset !== 'challenge-fixtures') throw new TypeError('Preset disponibili: technical-fixtures, challenge-fixtures. Nessun catalogo ufficiale integrato.');
  const reactionPolicy = options.reactionPolicy ?? 'decide';
  if (reactionPolicy !== 'decide' && reactionPolicy !== 'timeout') throw new TypeError('reactions: decide oppure timeout.');
  const players: PlayerSetup[] = Array.from({ length: options.players }, (_, index) => ({ id: `bot-${index + 1}`, name: `Bot ${index + 1}`, kind: 'bot', difficulty: options.difficulty }));
  const engineOptions: SimulationReplay['metadata']['options'] = { maxTurns: options.maxTurns ?? PRESET.defaultMaxTurns, maxActions: options.maxActions ?? PRESET.defaultMaxActions, now: 0, preset };
  let state = createGame(players, options.seed, engineOptions);
  const limits = safetyConfiguration(preset, options, state.maxActions);
  const commands: ReplayCommand[] = [];
  const steps: ReplayStep[] = [];
  const summary = initialSummary(options);
  const halt = (category: Extract<ReplayStep, { type: 'stop' }>['category'], reason: string, failedCommand?: ReplayCommand): void => {
    const now = state.lastNow + 1;
    const safeReason = reason.slice(0, 300);
    steps.push({ type: 'stop', now, reason: safeReason, category, ...(failedCommand ? { failedCommand } : {}) });
    if (category === 'error') summary.errors.push(safeReason);
    if (category === 'stalled' || category === 'safety' && pendingChoiceCount(state)) summary.problematicPendingChoices++;
    state = stopGame(state, now, safeReason);
  };
  while (state.phase === 'playing') {
    if (steps.length >= limits.timelineSteps) { halt('safety', 'Audit tecnico: limite dei passi della timeline raggiunto.'); break; }
    const previous = state;
    if (reactionPolicy === 'timeout' && state.challenge?.window) {
      const now = state.challenge.window.expiresAt;
      const result = advanceTime(state, now);
      if (!result.ok || result.state === state) { halt('error', `Avanzamento del tempo fallito: ${result.error ?? 'nessuna transizione'}`); break; }
      steps.push({ type: 'time', now });
      state = result.state;
    } else {
      const turnView = getView(state, state.currentPlayerId);
      const actorId = turnView.pendingActorIds[0] ?? state.currentPlayerId;
      const view = actorId === state.currentPlayerId ? turnView : getView(state, actorId);
      if (!view.legalActions.length) { halt('stalled', 'Scelta obbligatoria bloccata: nessun attore dispone di un comando legale.'); break; }
      let item: ReplayCommand;
      try {
        const action = chooseAction(view, options.difficulty);
        item = { actorId, command: { id: `simulation-${commands.length + 1}`, expectedVersion: state.version, action }, now: state.lastNow + 1 };
      } catch (error) { halt('error', `Errore bot: ${error instanceof Error ? error.message : 'sconosciuto'}`); break; }
      const result = applyCommand(state, actorId, item.command, item.now);
      if (!result.ok || result.duplicate) { halt('error', `Comando bot rifiutato: ${result.error ?? 'duplicato'}`, item); break; }
      measureCommand(summary, view, item);
      commands.push(item);
      steps.push({ type: 'command', ...item });
      state = result.state;
    }
    const safety = auditTransition(previous, state, summary, limits);
    if (safety && state.phase === 'playing') { halt('safety', safety); break; }
  }
  finalizeSummary(summary, state, steps);
  return {
    metadata: {
      formatVersion: 2, codeVersion: CODE_VERSION, rulesVersion: RULES_VERSION, catalogVersion: CATALOG_VERSION,
      preset: presetConfiguration(preset), seed: options.seed, players, options: engineOptions, reactionPolicy,
      privacy: 'Debug locale riservato: seed, comandi e scelte complete sono inclusi. Non pubblicare durante una sessione online.',
      virtualTimeUnit: 'Millisecondi virtuali: +1 per comando; timeout facoltativi avanzano esattamente alla scadenza. Nessuna attesa reale.',
      safetyLimits: limits,
    },
    commands, steps, events: state.events, challengeHistory: state.challengeHistory, finalStateHash: stateHash(state), summary,
  };
}

/** Verify timeline, compatibility commands, events, history, metrics and complete final state. */
export function replaySession(replay: SimulationReplay): GameState {
  const metadata = replay?.metadata;
  if (!metadata || metadata.formatVersion !== 2 || metadata.codeVersion !== CODE_VERSION || metadata.rulesVersion !== RULES_VERSION || metadata.catalogVersion !== CATALOG_VERSION || !['technical-fixtures', 'challenge-fixtures'].includes(metadata.preset?.id) || metadata.options?.preset !== metadata.preset.id || JSON.stringify(metadata.preset) !== JSON.stringify(presetConfiguration(metadata.preset.id))) throw new Error('Versioni del replay incompatibili.');
  if (!Array.isArray(replay.steps) || !Array.isArray(replay.commands)) throw new Error('Replay non valido: timeline o comandi mancanti.');
  const projected = replay.steps.flatMap(step => step.type === 'command' ? [{ actorId: step.actorId, command: step.command, now: step.now }] : []);
  if (JSON.stringify(projected) !== JSON.stringify(replay.commands)) throw new Error('Replay non valido: comandi e timeline non corrispondono.');
  if (!['decide', 'timeout'].includes(metadata.reactionPolicy)) throw new Error('Replay non valido: politica reazioni.');
  const limits = safetyConfiguration(metadata.preset.id, { players: metadata.players.length, difficulty: metadata.players[0]?.difficulty ?? 'medium', seed: metadata.seed, maxEffects: metadata.safetyLimits.effectsPerCommand, maxChoices: metadata.safetyLimits.pendingChoices }, metadata.options.maxActions);
  if (JSON.stringify(limits) !== JSON.stringify(metadata.safetyLimits)) throw new Error('Replay non valido: limiti audit alterati.');
  let state = createGame(metadata.players, metadata.seed, metadata.options);
  const summary = initialSummary({ players: metadata.players.length, difficulty: metadata.players[0].difficulty ?? 'medium', seed: metadata.seed });
  let pendingSafety: string | undefined;
  for (const [index, step] of replay.steps.entries()) {
    if (state.phase !== 'playing' || !Number.isFinite(step.now) || step.now <= state.lastNow) throw new Error('Replay non valido: transizione tardiva o tempo non crescente.');
    if ((pendingSafety || index >= limits.timelineSteps) && (step.type !== 'stop' || step.category !== 'safety')) throw new Error('Replay non valido: manca l’arresto richiesto dal limite audit.');
    const previous = state;
    if (step.type === 'command') {
      if (step.now !== state.lastNow + 1) throw new Error('Replay non valido: tempo del comando alterato.');
      const view = getView(state, step.actorId);
      const result = applyCommand(state, step.actorId, step.command, step.now);
      if (!result.ok || result.duplicate) throw new Error(`Replay non valido al comando ${step.command.id}: ${result.error ?? 'duplicato'}`);
      measureCommand(summary, view, step);
      state = result.state;
    } else if (step.type === 'time') {
      if (metadata.reactionPolicy !== 'timeout' || !state.challenge?.window || step.now !== state.challenge.window.expiresAt) throw new Error('Replay non valido: timeout fuori dalla finestra facoltativa.');
      const result = advanceTime(state, step.now);
      if (!result.ok || result.state === state) throw new Error('Replay non valido: avanzamento tempo senza effetto.');
      state = result.state;
    } else if (step.type === 'stop') {
      if (!['stalled', 'error', 'safety', 'host-stop'].includes(step.category) || step.now !== state.lastNow + 1) throw new Error('Replay non valido: arresto tecnico.');
      if (step.category === 'safety' && step.reason !== pendingSafety && !(index >= limits.timelineSteps && step.reason === 'Audit tecnico: limite dei passi della timeline raggiunto.')) throw new Error('Replay non valido: arresto safety senza limite superato.');
      if (step.category === 'stalled' && getView(state, state.currentPlayerId).pendingActorIds.length) throw new Error('Replay non valido: arresto stalled con azioni disponibili.');
      if (step.failedCommand && applyCommand(state, step.failedCommand.actorId, step.failedCommand.command, step.failedCommand.now).ok) throw new Error('Replay non valido: il comando dichiarato fallito è legale.');
      if (step.category === 'error') summary.errors.push(step.reason);
      if (step.category === 'stalled' || step.category === 'safety' && pendingChoiceCount(state)) summary.problematicPendingChoices++;
      state = stopGame(state, step.now, step.reason);
      continue;
    } else throw new Error('Replay non valido: tipo di passo sconosciuto.');
    pendingSafety = auditTransition(previous, state, summary, limits);
  }
  if (state.phase !== 'ended') throw new Error('Replay non valido: sessione non conclusa.');
  if (JSON.stringify(state.events) !== JSON.stringify(replay.events)) throw new Error('Gli eventi del replay non corrispondono.');
  if (JSON.stringify(state.challengeHistory) !== JSON.stringify(replay.challengeHistory)) throw new Error('La cronologia delle sfide del replay non corrisponde.');
  finalizeSummary(summary, state, replay.steps);
  if (JSON.stringify(summary) !== JSON.stringify(replay.summary)) throw new Error('Le metriche del replay non corrispondono agli eventi e alle sfide.');
  if (stateHash(state) !== replay.finalStateHash) throw new Error('Lo stato finale del replay non corrisponde.');
  return state;
}

export function sessionText(summary: SessionSummary): string {
  return [
    `DEMONICUTE · SESSIONE TECNICA · seed ${summary.seed}`,
    `${summary.participants} bot · ${summary.difficulty} · solo fixture tecniche`,
    `Turni: ${summary.turns}; comandi accettati: ${summary.acceptedCommands} (fine turno incluso).`,
    `Azioni turno spese: ${summary.turnActionsSpent}; pesche: ${summary.draws}; evocazioni: ${summary.summons}; impilamenti: ${summary.stacks}; attivazioni A: ${summary.activations}.`,
    `Risorse pagate: ${summary.resourcesPaid}; stelle finali visibili: ${summary.finalStars.join(', ')}; Gemme finali: ${summary.finalGems.join(', ')}.`,
    `Sfide dichiarate: ${summary.challengesDeclared} (${summary.bossChallenges} Boss, ${summary.magistDuels} duelli); rifiutate ${summary.challengesRefused}, deviate ${summary.challengesRedirected}, interrotte ${summary.challengesInterrupted}.`,
    `Poste: ${summary.stakesOne} da 1 tesoro, ${summary.stakesTwo} da 2. Modificatori giocati dai Magisti: ${summary.modifierCardsPlayed}; risposte Boss: ${summary.bossResponsesRevealed}; pentagoni applicati: ${summary.pentagonModifiersApplied}.`,
    `Spostastelle giocati: ${summary.starshiftersPlayed}; risposte Boss Spostastelle: ${summary.bossStarshifterResponses}; rotazioni: ${summary.rotations}; sostituzioni: ${summary.substitutions}; finestre scadute: ${summary.reactionTimeouts}.`,
    `Stelle partecipanti prima/dopo: ${summary.participantStarsBefore}/${summary.participantStarsAfter}; Boss prima/dopo: ${summary.bossStarsBefore}/${summary.bossStarsAfter}. Dettagli per Demone nei record JSON.`,
    `Boss: ${summary.bossWins} superati, ${summary.bossLosses} confronti persi, ${summary.bossTies} parità. Duelli: ${summary.duelAttackerWins} vittorie attaccante, ${summary.duelDefenderWins} vittorie difensore, ${summary.duelTies} parità fixture.`,
    `Gemme ottenute dal Boss: ${summary.gemsAwarded}; Gemme trasferite: ${summary.gemsTransferred}; carte mano trasferite: ${summary.handCardsTransferred}; cime Demoni rimandate nel mazzo: ${summary.demonsRemoved}.`,
    `Carte usate: ${JSON.stringify(summary.cardsUsed)}. Abilità fixture: ${JSON.stringify(summary.abilitiesUsed)}.`,
    `Audit: picco ${summary.maxTransitionEvents} eventi/transizione, ${summary.peakAuditedEffects} unità nella metrica effetti dichiarata, ${summary.peakPendingChoices} giocatori con scelta sfida.`,
    `Turni senza azioni legali: ${summary.turnsWithoutLegalAction}; scelte pendenti problematiche: ${summary.problematicPendingChoices}; errori: ${summary.errors.length}.`,
    `Arresto: ${summary.stopCategory} — ${summary.stopReason}`,
    `Tempo virtuale: ${summary.virtualDuration} ms. Vincitore della partita: non applicabile; vincere una sfida non definisce una vittoria della partita.`,
    'Le metriche riguardano solo le fixture attive, non il bilanciamento o la copertura delle carte ufficiali.',
    ...summary.challengeRecords.map(record => `${record.id} · ${record.kind} · ${record.result?.outcome ?? 'nessun esito'} · ${record.counts.map(count => `${count.playerId} ${count.before}→${count.after}`).join('; ')}${record.bossCount ? `; Boss ${record.bossCount.reference}→${record.bossCount.final}` : ''} · posta ${record.stake ?? '—'}; rotazioni ${record.rotations.length}; sostituzioni ${record.substitutions.length}.`),
  ].join('\n') + '\n';
}
export const CSV_COLUMNS: (keyof SessionSummary)[] = [
  'seed', 'participants', 'difficulty', 'turns', 'acceptedCommands', 'gameActions', 'turnActionsSpent', 'draws', 'summons', 'stacks', 'activations', 'endTurns', 'resourcesPaid',
  'challengesDeclared', 'bossChallenges', 'magistDuels', 'challengesRefused', 'challengesRedirected', 'challengesInterrupted', 'stakesOne', 'stakesTwo', 'modifierCardsPlayed', 'pentagonModifiersApplied', 'bossResponsesRevealed', 'starshiftersPlayed', 'bossStarshifterResponses', 'rotations', 'substitutions', 'bossWins', 'bossLosses', 'bossTies', 'duelAttackerWins', 'duelDefenderWins', 'duelTies', 'gemsAwarded', 'gemsTransferred', 'handCardsTransferred', 'demonsRemoved', 'participantStarsBefore', 'participantStarsAfter', 'bossStarsBefore', 'bossStarsAfter', 'reactionTimeouts', 'peakPendingChoices', 'maxTransitionEvents', 'peakAuditedEffects', 'virtualDuration',
  'turnsWithoutLegalAction', 'problematicPendingChoices', 'errorCount', 'stopCategory', 'stopReason', 'victoryAnalysis',
];
const csvCell = (value: unknown): string => `"${String(value).replaceAll('"', '""')}"`;
export function summariesCsv(summaries: SessionSummary[]): string {
  return [CSV_COLUMNS.map(csvCell).join(','), ...summaries.map(summary => CSV_COLUMNS.map(column => csvCell(summary[column])).join(','))].join('\n') + '\n';
}
export function parseArguments(argv: string[]): { sessions: number; out: string; options: SimulationOptions } {
  const parsed: Record<string, string> = {};
  const allowed = ['sessions', 'players', 'difficulty', 'seed', 'max-turns', 'max-actions', 'out', 'preset', 'max-effects', 'max-choices', 'reactions'];
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index].replace(/^--/, '');
    if (!argv[index].startsWith('--') || !allowed.includes(key) || argv[index + 1] === undefined || Object.hasOwn(parsed, key)) throw new TypeError(`Parametro non valido: ${argv[index]}`);
    parsed[key] = argv[index + 1];
  }
  function number(key: string, fallback: number, min: number, max: number): number {
    const raw = parsed[key];
    if (raw !== undefined && !/^-?\d+$/.test(raw)) throw new TypeError(`${key}: intero tra ${min} e ${max}.`);
    return bounded(raw === undefined ? fallback : Number(raw), key, min, max);
  }
  const preset = parsed.preset ?? PRESET.id;
  const reactionPolicy = parsed.reactions ?? 'decide';
  if (!['technical-fixtures', 'challenge-fixtures'].includes(preset)) throw new TypeError('preset: technical-fixtures oppure challenge-fixtures.');
  if (!['decide', 'timeout'].includes(reactionPolicy)) throw new TypeError('reactions: decide oppure timeout.');
  return {
    sessions: number('sessions', 10, 1, 10_000), out: resolve(parsed.out ?? 'artifacts/simulations'),
    options: {
      players: number('players', 3, 2, 5), difficulty: (parsed.difficulty ?? 'medium') as Difficulty,
      seed: number('seed', 42, -2_147_483_648, 4_294_967_295), maxTurns: number('max-turns', PRESET.defaultMaxTurns, 1, 100_000), maxActions: number('max-actions', PRESET.defaultMaxActions, 1, 100_000),
      preset, reactionPolicy: reactionPolicy as 'decide' | 'timeout', maxEffects: number('max-effects', preset === 'challenge-fixtures' ? 32 : 1, 1, 1_000), maxChoices: number('max-choices', preset === 'challenge-fixtures' ? 5 : 0, 0, 5),
    },
  };
}

async function main(): Promise<void> {
  if (process.argv.includes('--help')) {
    console.log('npm run simulate -- --sessions 10 --players 3 --difficulty medium --seed 42 --max-turns 300 --max-actions 1000 --preset challenge-fixtures --reactions decide --out artifacts/simulations\nReazioni: decide (bot) oppure timeout (salto alla scadenza virtuale di 5000 ms).\nReplay: npm run simulate -- --replay artifacts/simulations/session-0001.replay.json\nAudit baseline: --max-effects 1 (eventi abilità principali), --max-choices 0. Audit sfide: --max-effects 32 (eventi per transizione), --max-choices 5 (giocatori con scelta legale). Metriche tecniche, non effetti ufficiali. Limiti inferiori arrestano il test. Replay JSON riservati, CSV e report testo. Max-actions include fine turno e comandi sfida.');
    return;
  }
  const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
  const sourcePaths = ['../engine/index', '../engine/challenges', '../content/catalog', '../content/challenges', '../shared/game', '../bots/index', './index'];
  const sources = await Promise.all(sourcePaths.map(path => readFile(new URL(`${path}.${extension}`, import.meta.url))));
  const hash = createHash('sha256');
  sources.forEach((source, index) => { hash.update(sourcePaths[index]); hash.update(source); });
  const codeHash = hash.digest('hex');
  if (process.argv[2] === '--replay') {
    if (process.argv.length !== 4) throw new Error('Usa --replay seguito dal percorso di un replay JSON locale.');
    const replay = JSON.parse(await readFile(resolve(process.argv[3]), 'utf8')) as SimulationReplay;
    if (replay.metadata?.codeHash !== codeHash) throw new Error('Hash del codice diverso: usa la revisione del codice che ha prodotto il replay.');
    const state = replaySession(replay);
    console.log(`Replay verificato: ${state.acceptedCommands} comandi, ${state.events.length} eventi e ${state.challengeHistory.length} sfide identici. Stato: ${state.phase}; nessun vincitore della partita.`);
    return;
  }
  const { sessions, out, options } = parseArguments(process.argv.slice(2));
  await mkdir(out, { recursive: true });
  const summaries: SessionSummary[] = [];
  const computeStarted = performance.now();
  let computeMs = 0;
  for (let index = 0; index < sessions; index++) {
    const sessionStarted = performance.now();
    const replay = simulateSession({ ...options, seed: (options.seed + index) >>> 0 });
    computeMs += performance.now() - sessionStarted;
    replay.metadata.codeHash = codeHash;
    summaries.push(replay.summary);
    const name = `session-${String(index + 1).padStart(4, '0')}`;
    await writeFile(resolve(out, `${name}.replay.json`), JSON.stringify(replay, null, 2) + '\n', 'utf8');
    await writeFile(resolve(out, `${name}.txt`), sessionText(replay.summary), 'utf8');
  }
  const peakMetrics = ['peakPendingChoices', 'maxTransitionEvents', 'peakAuditedEffects'];
  const numericTotals = Object.fromEntries(CSV_COLUMNS.filter(key => typeof summaries[0]?.[key] === 'number' && !['seed', 'participants'].includes(key)).map(key => [key, peakMetrics.includes(key) ? Math.max(...summaries.map(summary => summary[key] as number)) : summaries.reduce((sum, summary) => sum + (summary[key] as number), 0)]));
  const limits = safetyConfiguration(options.preset as PresetId, options, options.maxActions!);
  const batch = {
    metadata: { codeVersion: CODE_VERSION, codeHash, rulesVersion: RULES_VERSION, catalogVersion: CATALOG_VERSION, preset: presetConfiguration(options.preset as PresetId), configuration: { sessions, ...options }, seedPolicy: '(base seed + session index) modulo 2^32', computeMs, elapsedMsWithIO: performance.now() - computeStarted, safetyLimits: limits, winner: null, victoryAnalysis: 'not-applicable' },
    sessions: summaries,
    totals: { ...numericTotals, sessions: summaries.length, turns: summaries.reduce((sum, item) => sum + item.turns, 0), acceptedCommands: summaries.reduce((sum, item) => sum + item.acceptedCommands, 0), errors: summaries.reduce((sum, item) => sum + item.errors.length, 0), challengesDeclared: summaries.reduce((sum, item) => sum + item.challengesDeclared, 0), problematicPendingChoices: summaries.reduce((sum, item) => sum + item.problematicPendingChoices, 0) },
  };
  const report = [
    'DEMONICUTE · BATCH DI FIXTURE TECNICHE',
    `Codice ${CODE_VERSION} (${codeHash}); regole ${RULES_VERSION}; catalogo ${CATALOG_VERSION}.`,
    `Configurazione: ${JSON.stringify({ sessions, ...options })}`,
    `Sessioni eseguite: ${batch.totals.sessions}; turni: ${batch.totals.turns}; comandi: ${batch.totals.acceptedCommands}; sfide dichiarate: ${batch.totals.challengesDeclared}.`,
    `Errori: ${batch.totals.errors}; scelte pendenti problematiche: ${batch.totals.problematicPendingChoices}.`,
    `Tempo di calcolo: ${computeMs.toFixed(2)} ms. Il batch usa millisecondi virtuali senza attese reali.`,
    `Limiti audit: ${JSON.stringify(limits)}. Non misurano la copertura di effetti ufficiali.`,
    'Nessuna vittoria della partita definita. Gli esiti di Boss e duelli sono analizzati separatamente dall’arresto tecnico.',
    'Carte ufficiali: 0; denominatore ufficiale sconosciuto. Le fixture non contano nella copertura.',
    'Seed e replay completi sono debug locale riservato; non condividere durante partite online.',
    '', ...summaries.map(sessionText),
  ].join('\n');
  await writeFile(resolve(out, 'batch.json'), JSON.stringify(batch, null, 2) + '\n', 'utf8');
  await writeFile(resolve(out, 'batch.csv'), summariesCsv(summaries), 'utf8');
  await writeFile(resolve(out, 'batch.txt'), report, 'utf8');
  console.log(`${batch.totals.sessions} sessioni · ${batch.totals.turns} turni · ${batch.totals.acceptedCommands} comandi · ${batch.totals.challengesDeclared} sfide · ${batch.totals.errors} errori. Nessun vincitore della partita.\nReport e replay riservati: ${out}\nCalcolo: ${computeMs.toFixed(2)} ms; il tempo online non è misurato.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error instanceof Error ? error.message : 'Errore simulatore.'); process.exitCode = 1; });
}
