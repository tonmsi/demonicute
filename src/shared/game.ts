export type Difficulty = 'easy' | 'medium' | 'hard';
export type PresetId = 'technical-fixtures' | 'challenge-fixtures';
export interface PlayerSetup { id: string; name: string; kind: 'human' | 'bot'; difficulty?: Difficulty }
export interface CardInstance { instanceId: string; definitionId: string }
export type ChallengeModifier =
  | { kind: 'numeric'; element: string; amount: number }
  | { kind: 'zero' | 'protect'; element: string }
  | { kind: 'choice'; elements: string[]; amount: number }
  | { kind: 'per-gem-undefined' };
export interface CardDefinition {
  id: string; name: string; category: 'resource' | 'demon'; element: string;
  stars: number; cost: number; description: string;
  effect: 'none' | 'entry-draw' | 'action-draw' | 'passive-star';
  imagePath: string | null; source: string; fixture: boolean;
  modifier?: ChallengeModifier;
  starshifter?: { clockwiseSteps: number; refuseOrRedirectAndDraw: boolean };
  challengeFixture?: boolean;
}
export type GameAction =
  | { type: 'draw' }
  | { type: 'endTurn' }
  | { type: 'summon'; cardId: string; slot: number; paymentIds: string[] }
  | { type: 'activate'; cardId: string }
  | { type: 'challengeBoss' }
  | { type: 'challengeMagist'; targetId?: string; stake?: 1 | 2 }
  | { type: 'challengePass' }
  | { type: 'challengeShift'; cardId: string; mode: 'rotate' | 'refuse' | 'redirect'; targetId?: string }
  | { type: 'challengeReplace'; slot: number; cardId: string }
  | { type: 'challengeCommit'; cardId: string | null; elementChoice?: string }
  | { type: 'challengeReady' }
  | { type: 'challengeLoseDemon'; cardId: string };
export interface Command { id: string; expectedVersion: number; action: GameAction }
export interface GameEvent { id: string; version: number; type: string; text: string; actorId?: string; timestamp: number; data?: Record<string, unknown> }
export interface StarBreakdown {
  cardId: string; definitionId: string; element: string; printed: number; passive: number;
  reference: number; numeric: number; protected: boolean; zeroed: boolean;
  numericChanges: number[]; ignoredChanges: number[]; ignoredNumeric: number; ignoredZero: boolean; final: number;
}
export interface PlayerStarCount { playerId: string; before: number; after: number; demons: StarBreakdown[] }
export interface RevealedModifier { actorId: string; source?: 'player' | 'boss'; card: CardInstance | null; elementChoice?: string; modifier?: ChallengeModifier }
export interface BossSide { label: string; stars: number; element: string; secondaryElements: string[] }
export interface BossView { id: string; name: string; fixture: true; orientation: number; sides: BossSide[] }
export interface ChallengeResult {
  outcome: 'attacker-wins' | 'defender-wins' | 'tie' | 'refused' | 'interrupted';
  winnerId?: string; loserId?: string; gemsAwarded: number; removedDemonIds: string[];
  gemTransfers: { from: string; to: string; gemId: string }[];
  handTransfers: { from: string; to: string; count: number }[];
}
export interface ChallengeView {
  id: string; kind: 'boss' | 'duel'; phase: 'intervention' | 'preparation' | 'stake';
  attackerId: string; defenderId?: string; participantIds: string[]; stake?: 1 | 2;
  committedIds: string[]; readyIds: string[];
  ownCommit?: { cardId: string | null; elementChoice?: string };
  window?: { actorId: string; expiresAt: number; durationMs: number };
  revealed: RevealedModifier[]; counts: PlayerStarCount[]; bossCount?: StarBreakdown;
  substitutions: { playerId: string; slot: number; cardId: string }[];
  rotations: { actorId: string; from: number; to: number; source: 'intervention' | 'boss-response' }[];
  result?: ChallengeResult; remainingDemonLosses: number;
  policy: string; blockedDependencies: string[];
}
export interface ChallengeRecord extends Omit<ChallengeView, 'ownCommit' | 'window'> { completedAt: number }
export interface PlayerView extends PlayerSetup {
  handCount: number; hand?: CardInstance[]; piles: CardInstance[][]; stars: number; gems: string[];
}
export interface GameView {
  version: number; rulesVersion: string; catalogVersion: string; presetId: string;
  phase: 'playing' | 'ended'; turnNumber: number; currentPlayerId: string;
  actionsRemaining: number; players: PlayerView[]; limbo: CardInstance[];
  discard: CardInstance[]; supplyCount: number; invocationCount: number;
  events: GameEvent[]; legalActions: GameAction[]; pendingActorIds: string[];
  challenge: ChallengeView | null; challengeHistory: ChallengeRecord[]; boss: BossView | null;
  challengePolicy: string[]; blockedCapabilities: string[];
  stopReason?: string; winner: null;
  capabilities: { bossChallenges: boolean; magistDuels: boolean };
}
