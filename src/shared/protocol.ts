import type { Command, Difficulty, GameView } from './game.js';
export interface Seat { id: string; name: string; kind: 'human' | 'bot'; difficulty?: Difficulty; connected: boolean; ready: boolean }
export interface RoomView {
  roomId: string; code: string; name: string; capacity: number; isPrivate: boolean;
  hostId: string; viewerId: string; seats: Seat[];
  phase: 'lobby' | 'playing' | 'ended'; paused: boolean; pauseReason?: string;
  presentationUntil: number; serverNow: number; game: GameView | null;
  revision: number;
  presetId: 'technical-fixtures' | 'challenge-fixtures';
  gameNow: number;
  inputReady: boolean;
}
export interface RoomListing { roomId: string; code: string; name: string; capacity: number; occupied: number }
export interface CreateOptions { name: string; capacity: number; isPrivate: boolean; bots: Difficulty[]; botsOnly?: boolean; paceMs?: number; maxTurns?: number; presetId?: 'technical-fixtures' | 'challenge-fixtures' }
export type LobbyAction = { type: 'ready'; ready: boolean } | { type: 'addBot'; difficulty: Difficulty } | { type: 'removeBot'; id: string } | { type: 'removeSeat'; id: string } | { type: 'start' } | { type: 'stop' };
export interface SessionProfile { publicId: string; nickname: string }
export type GameMessage = Command;
