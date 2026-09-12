import type { ChallengeModifier, Difficulty, GameAction, GameView, PlayerView } from '../shared/game.js';
import { CARD_DEFINITIONS } from '../content/catalog.js';
import { countElementalStars, countPlayerStars } from '../engine/challenges.js';

type Commit = Extract<GameAction, { type: 'challengeCommit' }>;
type Declaration = Extract<GameAction, { type: 'challengeBoss' | 'challengeMagist' }>;
const topValue = (definitionId: string): number => {
  const card = CARD_DEFINITIONS[definitionId];
  return card.stars + (card.effect === 'passive-star' ? 1 : 0);
};
function committedModifier(view: GameView, self: PlayerView, action: Commit): ChallengeModifier[] {
  if (!action.cardId) return [];
  const card = self.hand?.find(card => card.instanceId === action.cardId);
  const modifier = card && CARD_DEFINITIONS[card.definitionId].modifier;
  if (!modifier || modifier.kind === 'per-gem-undefined') return [];
  return modifier.kind === 'choice' ? [{ kind: 'numeric', element: action.elementChoice!, amount: modifier.amount }] : [modifier];
}
/** Uses the same per-Demon arithmetic as the engine, with only visible tops and one's own card. */
function visibleMargin(view: GameView, self: PlayerView, opponentId: string | undefined, modifiers: ChallengeModifier[] = [], orientation = view.boss?.orientation): number {
  const own = countPlayerStars(self, modifiers).after;
  if (opponentId) {
    const opponent = view.players.find(player => player.id === opponentId)!;
    return own - countPlayerStars(opponent, modifiers).after;
  }
  if (!view.boss || orientation === undefined) return own;
  const side = view.boss.sides[orientation];
  return own - countElementalStars({ cardId: `${view.boss.id}/side-${orientation}`, definitionId: view.boss.id, element: side.element, printed: side.stars, reference: side.stars }, modifiers).final;
}
function visibleCommitments(self: PlayerView): Commit[] {
  const actions: Commit[] = [{ type: 'challengeCommit', cardId: null }];
  for (const card of self.hand ?? []) {
    const modifier = CARD_DEFINITIONS[card.definitionId].modifier;
    if (!modifier || modifier.kind === 'per-gem-undefined') continue;
    if (modifier.kind === 'choice') for (const elementChoice of modifier.elements) actions.push({ type: 'challengeCommit', cardId: card.instanceId, elementChoice });
    else actions.push({ type: 'challengeCommit', cardId: card.instanceId });
  }
  return actions;
}
function optionalReaction(view: GameView, self: PlayerView, difficulty: Difficulty): GameAction {
  const pass = view.legalActions.find(action => action.type === 'challengePass')!;
  const shifts = view.legalActions.filter((action): action is Extract<GameAction, { type: 'challengeShift' }> => action.type === 'challengeShift');
  const challenge = view.challenge!;
  if (!shifts.length) return pass;
  const attacker = view.players.find(player => player.id === challenge.attackerId)!;
  if (challenge.kind === 'boss') {
    const rotations = shifts.filter(action => action.mode === 'rotate');
    if (difficulty === 'easy') return view.turnNumber % 2 === 0 ? rotations[0] ?? pass : pass;
    const currentMargin = visibleMargin(view, attacker, undefined);
    const ranked = rotations.map(action => {
      const card = self.hand!.find(card => card.instanceId === action.cardId)!;
      const steps = CARD_DEFINITIONS[card.definitionId].starshifter!.clockwiseSteps;
      const orientation = (view.boss!.orientation + steps) % view.boss!.sides.length;
      const delta = visibleMargin(view, attacker, undefined, [], orientation) - currentMargin;
      const leader = attacker.gems.length >= Math.max(...view.players.map(player => player.gems.length));
      const score = attacker.id === self.id ? delta : (difficulty === 'hard' || leader) ? -delta : 0;
      return { action, score };
    }).sort((left, right) => right.score - left.score);
    return ranked[0]?.score > 0 ? ranked[0].action : pass;
  }
  const margin = visibleMargin(view, self, attacker.id);
  if (margin >= 0) return pass;
  const refuse = shifts.find(action => action.mode === 'refuse');
  if (difficulty === 'easy') return refuse ?? pass;
  const redirects = shifts.filter(action => action.mode === 'redirect').map(action => ({
    action, margin: visibleMargin(view, view.players.find(player => player.id === action.targetId)!, attacker.id),
  })).sort((left, right) => right.margin - left.margin);
  if (redirects[0] && (difficulty === 'medium' || redirects[0].margin >= 0)) return redirects[0].action;
  return refuse ?? redirects[0]?.action ?? pass;
}
function chooseChallengeAction(view: GameView, self: PlayerView, difficulty: Difficulty): GameAction {
  const actions = view.legalActions;
  if (view.challenge!.phase === 'intervention') return optionalReaction(view, self, difficulty);
  if (view.challenge!.phase === 'stake') {
    const losses = actions.filter((action): action is Extract<GameAction, { type: 'challengeLoseDemon' }> => action.type === 'challengeLoseDemon');
    return [...losses].sort((left, right) => {
      const leftCard = self.piles.flat().find(card => card.instanceId === left.cardId)!;
      const rightCard = self.piles.flat().find(card => card.instanceId === right.cardId)!;
      return topValue(leftCard.definitionId) - topValue(rightCard.definitionId);
    })[0] ?? actions[0];
  }
  // Once committed, finish preparation: never oscillate among equivalent tops.
  const ready = actions.find(action => action.type === 'challengeReady');
  if (ready) return ready;
  const replacements = actions.filter((action): action is Extract<GameAction, { type: 'challengeReplace' }> => action.type === 'challengeReplace').map(action => {
    const pile = self.piles[action.slot];
    const replacement = pile.find(card => card.instanceId === action.cardId)!;
    return { action, gain: topValue(replacement.definitionId) - topValue(pile.at(-1)!.definitionId) };
  }).filter(candidate => candidate.gain > 0);
  if (replacements.length) return difficulty === 'easy' ? replacements[0].action : replacements.sort((left, right) => right.gain - left.gain)[0].action;
  const commits = actions.filter((action): action is Commit => action.type === 'challengeCommit');
  const opponentId = view.challenge!.kind === 'duel' ? view.challenge!.participantIds.find(id => id !== self.id) : undefined;
  const baseline = visibleMargin(view, self, opponentId);
  const ranked = commits.map(action => ({ action, gain: visibleMargin(view, self, opponentId, committedModifier(view, self, action)) - baseline - (difficulty === 'hard' && action.cardId ? 0.25 : 0) }));
  if (difficulty === 'easy') return ranked.find(candidate => candidate.gain > 0)?.action ?? commits.find(action => action.cardId === null) ?? actions[0];
  return ranked.sort((left, right) => right.gain - left.gain || Number(left.action.cardId !== null) - Number(right.action.cardId !== null))[0]?.action ?? actions[0];
}
function declarationForTurn(view: GameView, self: PlayerView, difficulty: Difficulty, allowDevelopment = true): GameAction | undefined {
  const declarations = view.legalActions.filter((action): action is Declaration => action.type === 'challengeBoss' || action.type === 'challengeMagist');
  if (!declarations.length) return;
  const turnStart = [...view.events].reverse().find(event => event.type === 'turnStarted')?.version ?? 0;
  if (view.events.some(event => event.type === 'challengeDeclared' && event.actorId === self.id && event.version > turnStart)) return;
  // Fixture bots exercise one available challenge each turn, while reserving one action for development.
  if (allowDevelopment && difficulty !== 'easy' && view.actionsRemaining > 1 && view.legalActions.some(action => action.type === 'summon' || action.type === 'draw')) return;
  if (difficulty === 'easy') {
    const kind = view.turnNumber % 2 ? 'challengeBoss' : 'challengeMagist';
    return declarations.find(action => action.type === kind && (action.type !== 'challengeMagist' || action.stake === 1)) ?? declarations[0];
  }
  const candidates = declarations.map(action => {
    const opponentId = action.type === 'challengeMagist' ? action.targetId : undefined;
    const plainMargin = visibleMargin(view, self, opponentId);
    const margin = difficulty === 'hard' ? Math.max(...visibleCommitments(self).map(commit => visibleMargin(view, self, opponentId, committedModifier(view, self, commit)))) : plainMargin;
    const stake = action.type === 'challengeMagist' ? action.stake ?? 1 : 1;
    // A risky Boss comparison has no loss consequence in this declared fixture; a duel risks its stake.
    const score = margin > 0 ? 4 + Math.min(margin, 5) * 0.2 + stake * (difficulty === 'hard' ? 0.6 : 0.15) : action.type === 'challengeBoss' ? -0.5 + margin * 0.05 : -stake + margin * 0.1;
    return { action, score: score + (difficulty === 'medium' && view.turnNumber % 2 === 0 && action.type === 'challengeMagist' ? 0.25 : 0) };
  }).sort((left, right) => right.score - left.score);
  return candidates[0].action;
}

/** Bots deliberately accept only the already-filtered network view. No clock or hidden RNG. */
export function chooseAction(view: GameView, difficulty: Difficulty): GameAction {
  const actions = view.legalActions;
  if (actions.length === 0) return { type: 'endTurn' };
  const player = view.players.find(player => Object.hasOwn(player, 'hand'));
  if (!player) return actions[0];
  if (view.challenge) return chooseChallengeAction(view, player, difficulty);
  if (view.presetId === 'challenge-fixtures') {
    const declaration = declarationForTurn(view, player, difficulty);
    if (declaration) return declaration;
  }
  const summons = actions.filter((action): action is Extract<GameAction, { type: 'summon' }> => action.type === 'summon');
  const draw = actions.find(action => action.type === 'draw');
  const activate = actions.find(action => action.type === 'activate');
  if (difficulty === 'easy') {
    // A simple visible-state policy: alternates drawing and the first legal summon.
    if (view.actionsRemaining === 2 && draw) return draw;
    return summons[0] ?? draw ?? activate ?? actions.at(-1)!;
  }
  if (difficulty === 'medium') {
    // Cheap summons first, preferring empty slots; otherwise replenish the hand.
    const ranked = [...summons].sort((left, right) => {
      const a = CARD_DEFINITIONS[view.limbo.find(card => card.instanceId === left.cardId)!.definitionId];
      const b = CARD_DEFINITIONS[view.limbo.find(card => card.instanceId === right.cardId)!.definitionId];
      return Number(Boolean(player?.piles[left.slot].length)) - Number(Boolean(player?.piles[right.slot].length)) || a.cost - b.cost || b.stars - a.stars;
    });
    return ranked[0] ?? activate ?? draw ?? actions.at(-1)!;
  }
  // Hard estimates marginal visible stars, replacement cost and E/A resource value.
  // It preserves high-value tops instead of spending resources on every legal summon.
  const ranked = summons.map(action => {
    const definition = CARD_DEFINITIONS[view.limbo.find(card => card.instanceId === action.cardId)!.definitionId];
    const pile = player?.piles[action.slot] ?? [];
    const oldTop = pile.at(-1);
    const oldDefinition = oldTop ? CARD_DEFINITIONS[oldTop.definitionId] : undefined;
    const oldStars = oldDefinition ? oldDefinition.stars + (oldDefinition.effect === 'passive-star' ? 1 : 0) : 0;
    const newStars = definition.stars + (definition.effect === 'passive-star' ? 1 : 0);
    const effectValue = definition.effect === 'entry-draw' && view.supplyCount > 0 ? 0.9 : definition.effect === 'action-draw' && view.supplyCount > 0 && !player?.piles.some(pile => { const top = pile.at(-1); return top && CARD_DEFINITIONS[top.definitionId].effect === 'action-draw'; }) ? 0.3 : 0;
    return { action, score: (newStars - oldStars) * 2 + effectValue - definition.cost * 0.3 - pile.length * 0.1 };
  }).sort((left, right) => right.score - left.score);
  if (ranked[0]?.score > 0) return ranked[0].action;
  if ((player?.handCount ?? 0) < 6) return activate ?? draw ?? { type: 'endTurn' };
  return (view.presetId === 'challenge-fixtures' ? declarationForTurn(view, player, difficulty, false) : undefined) ?? { type: 'endTurn' };
}
