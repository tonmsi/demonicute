import type { BossView, CardInstance, ChallengeModifier, ChallengeView, GameAction, PlayerStarCount, StarBreakdown } from '../shared/game.js';
import { CARD_DEFINITIONS, PRESET } from '../content/catalog.js';
import { CHALLENGE_BLOCKERS, CHALLENGE_POLICY, REACTION_MS } from '../content/challenges.js';
import type { GameState, PlayerState } from './index.js';

export interface ChallengeState extends Omit<ChallengeView, 'ownCommit'> {
  commitments: Record<string, { cardId: string | null; elementChoice?: string }>;
  reactionQueue: string[];
  lostSlots: number[];
  handLosses: number;
}
export function challengeEvent(state: GameState, type: string, text: string, now: number, actorId?: string, data?: Record<string, unknown>): void {
  state.events.push({ id: `event-${state.events.length + 1}`, version: state.version, type, text, timestamp: now, ...(actorId ? { actorId } : {}), ...(data ? { data } : {}) });
}
/** Confirmed precedence. The caller supplies a reference; this function never invents passives or Gem rules. */
export function countElementalStars(input: { cardId: string; definitionId: string; element: string; printed: number; passive?: number; reference: number }, modifiers: ChallengeModifier[]): StarBreakdown {
  if (!Number.isFinite(input.reference) || input.reference < 0 || !Number.isFinite(input.printed)) throw new TypeError('Riferimento stelle non valido.');
  if (modifiers.some(modifier => modifier.kind === 'choice' || modifier.kind === 'per-gem-undefined')) throw new TypeError('Modificatore non risolto: alternativa obbligatoria oppure −1 per Gemma indefinito.');
  if (modifiers.some(modifier => modifier.kind === 'numeric' && !Number.isFinite(modifier.amount))) throw new TypeError('Modificatore numerico non valido.');
  const relevant = modifiers.filter(modifier => 'element' in modifier && modifier.element === input.element);
  const protectedStars = relevant.some(modifier => modifier.kind === 'protect');
  const zero = relevant.some(modifier => modifier.kind === 'zero');
  const numeric = relevant.reduce((sum, modifier) => sum + (modifier.kind === 'numeric' ? modifier.amount : 0), 0);
  const numericChanges = relevant.flatMap(modifier => modifier.kind === 'numeric' ? [modifier.amount] : []).sort((left, right) => left - right);
  return {
    ...input, passive: input.passive ?? 0, numeric, numericChanges, ignoredChanges: protectedStars || zero ? numericChanges : [], protected: protectedStars, zeroed: zero && !protectedStars,
    ignoredNumeric: protectedStars || zero ? numeric : 0, ignoredZero: protectedStars && zero,
    final: protectedStars ? input.reference : zero ? 0 : Math.max(0, input.reference + numeric),
  };
}
export function countPlayerStars(player: Pick<PlayerState, 'id' | 'piles'>, modifiers: ChallengeModifier[] = []): PlayerStarCount {
  const demons = player.piles.flatMap(pile => {
    const card = pile.at(-1);
    if (!card) return [];
    const definition = CARD_DEFINITIONS[card.definitionId];
    const passive = definition.effect === 'passive-star' ? 1 : 0;
    return [countElementalStars({ cardId: card.instanceId, definitionId: card.definitionId, element: definition.element, printed: definition.stars, passive, reference: definition.stars + passive }, modifiers)];
  });
  return { playerId: player.id, before: demons.reduce((sum, card) => sum + card.reference, 0), after: demons.reduce((sum, card) => sum + card.final, 0), demons };
}
const hasShifter = (player: PlayerState): boolean => player.hand.some(card => CARD_DEFINITIONS[card.definitionId].starshifter);
const treasureCount = (player: PlayerState): number => player.gems.length + player.piles.filter(pile => pile.length).length + player.hand.length;
function stakePlan(player: PlayerState, quantity: number): { gems: number; demons: number; hand: number } {
  const gems = Math.min(quantity, player.gems.length);
  const demons = Math.min(quantity - gems, player.piles.filter(pile => pile.length).length);
  return { gems, demons, hand: quantity - gems - demons };
}
export function mayDeclareDuel(state: GameState, attacker: PlayerState, defender: PlayerState, quantity: number): boolean {
  if (attacker.id === defender.id || treasureCount(attacker) < quantity || treasureCount(defender) < quantity) return false;
  return attacker.hand.length + stakePlan(defender, quantity).hand <= PRESET.handLimit && defender.hand.length + stakePlan(attacker, quantity).hand <= PRESET.handLimit;
}
export function challengeView(state: GameState, viewerId: string): ChallengeView | null {
  const active = state.challenge;
  if (!active) return null;
  const { commitments, reactionQueue: _queue, lostSlots: _slots, handLosses: _hand, ...visible } = active;
  return { ...visible, ...(Object.hasOwn(commitments, viewerId) ? { ownCommit: commitments[viewerId] } : {}) };
}
function shiftActions(state: GameState, player: PlayerState): GameAction[] {
  const challenge = state.challenge!;
  const actions: GameAction[] = [];
  for (const card of player.hand) {
    const definition = CARD_DEFINITIONS[card.definitionId];
    if (!definition.starshifter) continue;
    if (challenge.kind === 'boss') actions.push({ type: 'challengeShift', cardId: card.instanceId, mode: 'rotate' });
    else if (player.id === challenge.defenderId && definition.starshifter.refuseOrRedirectAndDraw && state.supply.length > 0 && player.hand.length <= PRESET.handLimit) {
      actions.push({ type: 'challengeShift', cardId: card.instanceId, mode: 'refuse' });
      for (const target of state.players) if (target.id !== player.id && mayDeclareDuel(state, state.players.find(candidate => candidate.id === challenge.attackerId)!, target, challenge.stake!)) actions.push({ type: 'challengeShift', cardId: card.instanceId, mode: 'redirect', targetId: target.id });
    }
  }
  return actions;
}
export function challengeLegalActions(state: GameState, viewerId: string): GameAction[] {
  const challenge = state.challenge;
  const player = state.players.find(player => player.id === viewerId);
  if (!challenge || !player || state.phase !== 'playing') return [];
  if (challenge.phase === 'intervention') return challenge.window?.actorId === viewerId ? [...shiftActions(state, player), { type: 'challengePass' }] : [];
  if (challenge.phase === 'stake') {
    if (challenge.result?.loserId !== viewerId) return [];
    return player.piles.flatMap((pile, slot): GameAction[] => pile.length && !challenge.lostSlots.includes(slot) ? [{ type: 'challengeLoseDemon', cardId: pile.at(-1)!.instanceId }] : []);
  }
  if (!challenge.participantIds.includes(viewerId) || challenge.readyIds.includes(viewerId)) return [];
  const actions: GameAction[] = [];
  if (!Object.hasOwn(challenge.commitments, viewerId)) {
    actions.push({ type: 'challengeCommit', cardId: null });
    for (const card of player.hand) {
      const definition = CARD_DEFINITIONS[card.definitionId];
      if (!definition.modifier || definition.modifier.kind === 'per-gem-undefined') continue;
      if (challenge.kind === 'duel' && treasureCount(player) - 1 < challenge.stake!) continue;
      if (definition.modifier.kind === 'choice') for (const elementChoice of definition.modifier.elements) actions.push({ type: 'challengeCommit', cardId: card.instanceId, elementChoice });
      else actions.push({ type: 'challengeCommit', cardId: card.instanceId });
    }
  } else actions.push({ type: 'challengeReady' });
  for (let slot = 0; slot < player.piles.length; slot++) for (const card of player.piles[slot].slice(0, -1)) actions.push({ type: 'challengeReplace', slot, cardId: card.instanceId });
  return actions;
}
function beginPreparation(state: GameState, now: number): void {
  const challenge = state.challenge!;
  challenge.phase = 'preparation';
  delete challenge.window;
  challengeEvent(state, 'challengePreparation', 'Preparazione: scelte coperte e sostituzioni nelle proprie Pile; nessuna scadenza della scelta obbligatoria.', now, undefined, { challengeId: challenge.id, participantIds: challenge.participantIds, bossOrientation: state.boss?.orientation });
}
function nextWindow(state: GameState, now: number): void {
  const challenge = state.challenge!;
  delete challenge.window;
  while (challenge.reactionQueue.length) {
    const actorId = challenge.reactionQueue.shift()!;
    const player = state.players.find(player => player.id === actorId)!;
    if (!shiftActions(state, player).length) continue;
    challenge.window = { actorId, expiresAt: now + REACTION_MS, durationMs: REACTION_MS };
    challengeEvent(state, 'challengeWindow', 'Finestra facoltativa Spostastelle: 5 secondi di tempo di gioco.', now, actorId, { challengeId: challenge.id, expiresAt: challenge.window.expiresAt });
    return;
  }
  beginPreparation(state, now);
}
export function declareChallengeMutable(state: GameState, actorId: string, action: Extract<GameAction, { type: 'challengeBoss' | 'challengeMagist' }>, now: number): void {
  const duel = action.type === 'challengeMagist';
  state.challenge = {
    id: `challenge-${state.challengeHistory.length + 1}`, kind: duel ? 'duel' : 'boss', phase: 'intervention', attackerId: actorId,
    ...(duel ? { defenderId: action.targetId!, stake: action.stake! } : {}), participantIds: duel ? [actorId, action.targetId!] : [actorId],
    committedIds: [], readyIds: [], revealed: [], counts: [], substitutions: [], rotations: [], remainingDemonLosses: 0,
    policy: 'challenge-fixtures/Addendum-1; aperti risolti soltanto dalle policy tecniche pubbliche', blockedDependencies: [...CHALLENGE_BLOCKERS],
    commitments: {}, reactionQueue: duel ? [action.targetId!] : state.players.filter(hasShifter).map(player => player.id), lostSlots: [], handLosses: 0,
  };
  challengeEvent(state, 'challengeDeclared', duel ? `Duello dichiarato: posta ${action.stake} tesori.` : 'Sfida al Boss dichiarata.', now, actorId, { challengeId: state.challenge.id, kind: state.challenge.kind, participantIds: state.challenge.participantIds, ...(duel ? { stake: action.stake } : {}), fixture: true });
  nextWindow(state, now);
}
function rotateBoss(state: GameState, actorId: string, steps: number, source: 'intervention' | 'boss-response', now: number): void {
  const boss = state.boss!;
  const from = boss.orientation;
  boss.orientation = (from + steps) % boss.sides.length;
  const rotation = { actorId, from, to: boss.orientation, source };
  state.challenge!.rotations.push(rotation);
  challengeEvent(state, 'bossRotated', `Il Boss ruota di ${steps} posizione/i in senso orario: lato ${boss.sides[boss.orientation].label}.`, now, actorId, { challengeId: state.challenge!.id, ...rotation });
}
function completeChallenge(state: GameState, now: number): void {
  const challenge = state.challenge!;
  challengeEvent(state, 'challengeCleanup', 'Sfida conclusa: pulizia completata; le carte modificatore non attivano il testo principale.', now, undefined, { challengeId: challenge.id, result: challenge.result });
  const { commitments: _commitments, reactionQueue: _queue, lostSlots: _slots, handLosses: _hand, window: _window, ...publicRecord } = challenge;
  state.challengeHistory.push({ ...publicRecord, completedAt: now });
  state.challenge = null;
}
function transferHandAndFinish(state: GameState, now: number): void {
  const challenge = state.challenge!;
  const result = challenge.result!;
  if (challenge.handLosses) {
    const loser = state.players.find(player => player.id === result.loserId)!;
    const winner = state.players.find(player => player.id === result.winnerId)!;
    const selected = [...loser.hand].sort((a, b) => a.instanceId.localeCompare(b.instanceId)).slice(0, challenge.handLosses);
    const ids = new Set(selected.map(card => card.instanceId));
    loser.hand = loser.hand.filter(card => !ids.has(card.instanceId));
    winner.hand.push(...selected);
    const transfer = { from: loser.id, to: winner.id, count: selected.length };
    result.handTransfers.push(transfer);
    challengeEvent(state, 'challengeHandTransferred', `${selected.length} carte della mano trasferite secondo la policy fixture; identità riservate.`, now, loser.id, { challengeId: challenge.id, ...transfer });
  }
  completeChallenge(state, now);
}
function resolveStake(state: GameState, now: number): void {
  const challenge = state.challenge!;
  const result = challenge.result!;
  const loser = state.players.find(player => player.id === result.loserId)!;
  const winner = state.players.find(player => player.id === result.winnerId)!;
  const plan = stakePlan(loser, challenge.stake!);
  if (treasureCount(loser) < challenge.stake! || winner.hand.length + plan.hand > PRESET.handLimit) {
    result.outcome = 'interrupted';
    delete result.winnerId;
    delete result.loserId;
    challengeEvent(state, 'challengeInterrupted', 'Risoluzione posta bloccata: disponibilità/capienza insufficiente secondo la policy fixture; nessun trasferimento.', now, undefined, { challengeId: challenge.id });
    completeChallenge(state, now);
    return;
  }
  for (const gemId of [...loser.gems].sort().slice(0, plan.gems)) {
    loser.gems.splice(loser.gems.indexOf(gemId), 1);
    winner.gems.push(gemId);
    result.gemTransfers.push({ from: loser.id, to: winner.id, gemId });
  }
  if (plan.gems) challengeEvent(state, 'challengeGemsTransferred', `${plan.gems} Gemme della posta trasferite.`, now, loser.id, { challengeId: challenge.id, transfers: result.gemTransfers });
  challenge.remainingDemonLosses = plan.demons;
  challenge.handLosses = plan.hand;
  if (plan.demons) {
    challenge.phase = 'stake';
    challengeEvent(state, 'challengeDemonChoice', `Il perdente sceglie ${plan.demons} cima/e da rimandare nel mazzo, una per Pila.`, now, loser.id, { challengeId: challenge.id, count: plan.demons });
  } else transferHandAndFinish(state, now);
}
function normalizedModifier(card: CardInstance | null, elementChoice?: string): ChallengeModifier | undefined {
  if (!card) return;
  const modifier = CARD_DEFINITIONS[card.definitionId].modifier;
  if (modifier?.kind === 'choice') return { kind: 'numeric', element: elementChoice!, amount: modifier.amount };
  return modifier;
}
function revealAndResolve(state: GameState, now: number): void {
  const challenge = state.challenge!;
  let bossResponse: CardInstance | undefined;
  for (const actorId of challenge.participantIds) {
    const player = state.players.find(player => player.id === actorId)!;
    const commitment = challenge.commitments[actorId];
    const index = player.hand.findIndex(card => card.instanceId === commitment.cardId);
    const card = commitment.cardId === null ? null : player.hand.splice(index, 1)[0];
    if (card) state.discard.push(card);
    challenge.revealed.push({ actorId, source: 'player', card, ...(commitment.elementChoice ? { elementChoice: commitment.elementChoice } : {}), ...(normalizedModifier(card, commitment.elementChoice) ? { modifier: normalizedModifier(card, commitment.elementChoice) } : {}) });
  }
  if (challenge.kind === 'boss') {
    const card = state.bossDeck.shift()!;
    bossResponse = card;
    state.discard.push(card);
    const definition = CARD_DEFINITIONS[card.definitionId];
    let elementChoice: string | undefined;
    if (definition.modifier?.kind === 'choice') {
      // Declared fixture adversarial choice: smallest attacker-minus-Boss margin, ties in printed option order.
      let worst = Number.POSITIVE_INFINITY;
      const attacker = state.players.find(player => player.id === challenge.attackerId)!;
      for (const candidate of definition.modifier.elements) {
        const modifiers = [...challenge.revealed.flatMap(item => item.modifier ? [item.modifier] : []), normalizedModifier(card, candidate)!];
        const margin = countPlayerStars(attacker, modifiers).after - bossCount(state.boss!, modifiers).final;
        if (margin < worst) { worst = margin; elementChoice = candidate; }
      }
    }
    challenge.revealed.push({ actorId: 'boss', source: 'boss', card, ...(elementChoice ? { elementChoice } : {}), ...(normalizedModifier(card, elementChoice) ? { modifier: normalizedModifier(card, elementChoice) } : {}) });
  }
  challengeEvent(state, 'challengeRevealed', 'Rivelazione simultanea: carte e alternative impegnate sono ora pubbliche.', now, undefined, { challengeId: challenge.id, modifiers: challenge.revealed });
  if (bossResponse) {
    const shifter = CARD_DEFINITIONS[bossResponse.definitionId].starshifter;
    if (shifter) rotateBoss(state, 'boss', shifter.clockwiseSteps, 'boss-response', now);
  }
  const modifiers = challenge.revealed.flatMap(item => item.modifier ? [item.modifier] : []);
  challengeEvent(state, 'challengeModifiersApplied', 'Effetti globali per elemento: protezione gialla > X > numerici; minimo 0 per ciascun Demone.', now, undefined, { challengeId: challenge.id, modifiers });
  challenge.counts = state.players.map(player => countPlayerStars(player, modifiers));
  const attackerStars = challenge.counts.find(count => count.playerId === challenge.attackerId)!.after;
  let defenderStars: number;
  if (challenge.kind === 'boss') {
    challenge.bossCount = bossCount(state.boss!, modifiers);
    defenderStars = challenge.bossCount.final;
  } else defenderStars = challenge.counts.find(count => count.playerId === challenge.defenderId)!.after;
  challengeEvent(state, 'challengeCounted', `Conteggio finale: attaccante ${attackerStars}, ${challenge.kind === 'boss' ? 'Boss' : 'difensore'} ${defenderStars}.`, now, undefined, { challengeId: challenge.id, counts: challenge.counts, ...(challenge.bossCount ? { bossCount: challenge.bossCount, orientation: state.boss!.orientation } : {}) });
  const outcome = attackerStars > defenderStars ? 'attacker-wins' : attackerStars < defenderStars ? 'defender-wins' : 'tie';
  const winnerId = outcome === 'tie' ? undefined : outcome === 'attacker-wins' ? challenge.attackerId : challenge.defenderId;
  const loserId = outcome === 'tie' ? undefined : outcome === 'attacker-wins' ? challenge.defenderId : challenge.attackerId;
  challenge.result = { outcome, ...(winnerId ? { winnerId } : {}), ...(loserId ? { loserId } : {}), gemsAwarded: 0, removedDemonIds: [], gemTransfers: [], handTransfers: [] };
  challengeEvent(state, 'challengeOutcome', outcome === 'tie' ? 'Parità: nessuna Gemma Boss e nessuna posta nel duello fixture.' : outcome === 'attacker-wins' ? 'L’attaccante vince la sfida.' : 'Il difensore vince il confronto; nessuna vittoria della partita.', now, undefined, { challengeId: challenge.id, outcome, ...(winnerId ? { winnerId } : {}), ...(loserId ? { loserId } : {}) });
  if (challenge.kind === 'boss') {
    if (outcome === 'attacker-wins') {
      const gemId = state.gemSupply.shift()!;
      state.players.find(player => player.id === challenge.attackerId)!.gems.push(gemId);
      challenge.result.gemsAwarded = 1;
      challengeEvent(state, 'bossGemAwarded', 'Boss superato: ottenuta 1 Gemma fixture.', now, challenge.attackerId, { challengeId: challenge.id, gemId });
    }
    completeChallenge(state, now);
  } else if (outcome === 'tie') completeChallenge(state, now);
  else resolveStake(state, now);
}
function bossCount(boss: BossView, modifiers: ChallengeModifier[]): StarBreakdown {
  const side = boss.sides[boss.orientation];
  return countElementalStars({ cardId: `${boss.id}/side-${boss.orientation}`, definitionId: boss.id, element: side.element, printed: side.stars, reference: side.stars }, modifiers);
}
export function applyChallengeMutable(state: GameState, actorId: string, action: GameAction, now: number): void {
  const challenge = state.challenge!;
  const player = state.players.find(player => player.id === actorId)!;
  switch (action.type) {
    case 'challengePass':
      challengeEvent(state, 'challengePassed', 'Spostastelle: intervento facoltativo passato.', now, actorId, { challengeId: challenge.id });
      nextWindow(state, now);
      break;
    case 'challengeShift': {
      const [card] = player.hand.splice(player.hand.findIndex(card => card.instanceId === action.cardId), 1);
      const shifter = CARD_DEFINITIONS[card.definitionId].starshifter!;
      state.discard.push(card);
      challengeEvent(state, 'challengeStarshifter', `Spostastelle: modalità ${action.mode}.`, now, actorId, { challengeId: challenge.id, card, mode: action.mode });
      if (action.mode === 'rotate') { rotateBoss(state, actorId, shifter.clockwiseSteps, 'intervention', now); nextWindow(state, now); }
      else {
        // Legality guarantees this mandatory draw; spending the Shifter already freed a hand slot.
        player.hand.push(state.supply.shift()!);
        challengeEvent(state, 'challengeShiftDraw', 'Modalità rifiuto/deviazione: pescata una carta.', now, actorId, { challengeId: challenge.id });
        if (action.mode === 'refuse') {
          challenge.result = { outcome: 'refused', gemsAwarded: 0, removedDemonIds: [], gemTransfers: [], handTransfers: [] };
          challengeEvent(state, 'challengeRefused', 'Il difensore rifiuta la sfida.', now, actorId, { challengeId: challenge.id });
          completeChallenge(state, now);
        } else {
          const previousDefenderId = challenge.defenderId;
          challenge.defenderId = action.targetId!;
          challenge.participantIds = [challenge.attackerId, action.targetId!];
          challengeEvent(state, 'challengeRedirected', 'Sfida deviata verso un altro Magista; nessuna nuova catena nella fixture tecnica.', now, actorId, { challengeId: challenge.id, previousDefenderId, defenderId: action.targetId });
          challenge.reactionQueue = [];
          beginPreparation(state, now);
        }
      }
      break;
    }
    case 'challengeReplace': {
      const pile = player.piles[action.slot];
      const [card] = pile.splice(pile.findIndex(card => card.instanceId === action.cardId), 1);
      pile.push(card);
      const replacement = { playerId: actorId, slot: action.slot, cardId: action.cardId };
      challenge.substitutions.push(replacement);
      challengeEvent(state, 'challengeReplaced', `Sostituita la cima della Pila ${action.slot + 1}: nessuna azione, nessun effetto Entrata.`, now, actorId, { challengeId: challenge.id, ...replacement, stars: countPlayerStars(player) });
      break;
    }
    case 'challengeCommit':
      // Actor IDs are untrusted strings; define an own property even for '__proto__'.
      Object.defineProperty(challenge.commitments, actorId, { value: { cardId: action.cardId, ...(action.elementChoice ? { elementChoice: action.elementChoice } : {}) }, enumerable: true, configurable: true, writable: true });
      challenge.committedIds.push(actorId);
      challengeEvent(state, 'challengeCommitted', 'Scelta impegnata coperta; carta e alternativa restano riservate.', now, actorId, { challengeId: challenge.id });
      break;
    case 'challengeReady':
      challenge.readyIds.push(actorId);
      challengeEvent(state, 'challengeReady', 'Preparazione pronta: scelta e sostituzioni bloccate.', now, actorId, { challengeId: challenge.id });
      if (challenge.readyIds.length === challenge.participantIds.length) revealAndResolve(state, now);
      break;
    case 'challengeLoseDemon': {
      const slot = player.piles.findIndex(pile => pile.at(-1)?.instanceId === action.cardId);
      const card = player.piles[slot].pop()!;
      state.invocations.push(card);
      challenge.lostSlots.push(slot);
      challenge.remainingDemonLosses--;
      challenge.result!.removedDemonIds.push(card.instanceId);
      challengeEvent(state, 'challengeDemonReturned', `Cima della Pila ${slot + 1} rimandata in fondo al mazzo evocazioni fixture; il resto della Pila rimane.`, now, actorId, { challengeId: challenge.id, card, slot, remaining: challenge.remainingDemonLosses });
      if (!challenge.remainingDemonLosses) transferHandAndFinish(state, now);
      break;
    }
  }
}
export function expireChallengeWindowMutable(state: GameState, now: number): void {
  const challenge = state.challenge;
  if (!challenge?.window || now < challenge.window.expiresAt) return;
  challengeEvent(state, 'challengeWindowExpired', 'Scaduta la sola risposta facoltativa Spostastelle.', now, challenge.window.actorId, { challengeId: challenge.id });
  nextWindow(state, now);
}
export function interruptChallengeMutable(state: GameState, now: number): void {
  if (!state.challenge) return;
  state.challenge.result = { ...(state.challenge.result ?? { gemsAwarded: 0, removedDemonIds: [], gemTransfers: [], handTransfers: [] }), outcome: 'interrupted' };
  challengeEvent(state, 'challengeInterrupted', state.challenge.revealed.length ? 'Sfida interrotta dall’arresto tecnico; gli effetti già risolti restano registrati.' : 'Sfida interrotta dall’arresto tecnico; scelte non rivelate e carte ancora in mano.', now, undefined, { challengeId: state.challenge.id });
  completeChallenge(state, now);
}
export const challengePolicies = CHALLENGE_POLICY;
