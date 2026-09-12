import { Room, ServerError, type Client, type AuthContext } from '@colyseus/core';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { createGame, applyCommand, advanceTime, getView, stopGame, type GameState } from '../engine/index.js';
import { chooseAction } from '../bots/index.js';
import type { Command, Difficulty } from '../shared/game.js';
import type { CreateOptions, RoomView, Seat, SessionProfile } from '../shared/protocol.js';
import { cleanName, originAllowed, sessionFromHeaders } from './auth.js';

export const rooms = new Map<string, DemonicuteRoom>();
export const creationTickets = new Map<string, { owner: SessionProfile; options: CreateOptions }>();
export const isDifficulty = (x: unknown): x is Difficulty => x === 'easy' || x === 'medium' || x === 'hard';
export function validateOptions(raw: unknown): CreateOptions {
  if (!raw || typeof raw !== 'object') throw new Error('Configurazione stanza non valida.');
  const x = raw as Record<string, unknown>;
  if (!Number.isInteger(x.capacity) || Number(x.capacity) < 2 || Number(x.capacity) > 5) throw new Error('Scegli da 2 a 5 posti.');
  if (!Array.isArray(x.bots) || !x.bots.every(isDifficulty) || x.bots.length > Number(x.capacity) - (x.botsOnly === true ? 0 : 1)) throw new Error('Configurazione bot non valida.');
  if (x.botsOnly === true && x.bots.length !== x.capacity) throw new Error('Nelle sessioni tra bot riempi tutti i posti.');
  const paceMs = x.paceMs ?? 800, maxTurns = x.maxTurns ?? 60;
  const presetId = x.presetId ?? 'technical-fixtures';
  if (presetId !== 'technical-fixtures' && presetId !== 'challenge-fixtures') throw new Error('Preset non disponibile.');
  if (!Number.isInteger(paceMs) || Number(paceMs) < 100 || Number(paceMs) > 3000) throw new Error('Ritmo consentito: 100–3000 ms.');
  if (!Number.isInteger(maxTurns) || Number(maxTurns) < 2 || Number(maxTurns) > 500) throw new Error('Limite tecnico: 2–500 turni.');
  return { capacity: Number(x.capacity), name: cleanName(x.name, 'Cerchia di playtest'), bots: x.bots, botsOnly: x.botsOnly === true, isPrivate: x.isPrivate === true, paceMs: Number(paceMs), maxTurns: Number(maxTurns), presetId };
}

export class DemonicuteRoom extends Room {
  code = ''; title = ''; capacity = 2; privateRoom = false; hostId = ''; botsOnly = false;
  seats: Seat[] = []; game: GameState | null = null; revision = 0;
  paceMs = 800; maxTurns = 60; presentationUntil = 0;
  presetId: 'technical-fixtures' | 'challenge-fixtures' = 'technical-fixtures';
  private gameNow = 0;
  private lastClockWall = Date.now();
  private lastClockPublish = 0;
  private lastInputReady = false;
  private presentationDeadline = 0;
  private peers = new Map<string, Client>();
  private identities = new Map<string, string>();
  private presented = new Map<string, number>();
  private admitted = new Set<string>();
  private lastActive = Date.now();
  private rate = new Map<string, { start: number; count: number }>();

  async onCreate(options: { ticket?: unknown }) {
    const ticket = typeof options?.ticket === 'string' ? creationTickets.get(options.ticket) : undefined;
    if (!ticket) throw new ServerError(403, 'Crea la stanza dal menu.');
    creationTickets.delete(options.ticket as string);
    const { owner, options: config } = ticket;
    this.autoDispose = false;
    this.maxClients = 12; // Seats are validated separately; reconnects can briefly overlap.
    this.setPatchRate(null);
    this.hostId = owner.publicId; this.title = config.name; this.capacity = config.capacity;
    this.privateRoom = config.isPrivate; this.botsOnly = !!config.botsOnly;
    this.paceMs = config.paceMs ?? 800; this.maxTurns = config.maxTurns ?? 60;
    this.presetId = config.presetId ?? 'technical-fixtures';
    do { this.code = randomBytes(4).toString('hex').toUpperCase(); } while ([...rooms.values()].some(r => r.code === this.code));
    this.admitted.add(owner.publicId);
    if (!this.botsOnly) this.seats.push({ id: owner.publicId, name: owner.nickname, kind: 'human', connected: false, ready: false });
    for (const difficulty of config.bots) this.addBot(difficulty);
    await this.setPrivate(true); // Only the explicit, filtered API publishes room information.
    rooms.set(this.roomId, this);
    this.onMessage('sync', client => { if (this.allowMessage(client)) this.sendView(client); });
    this.onMessage('presented', (client, message) => {
      if (!this.allowMessage(client)) return;
      const id = this.identities.get(client.sessionId);
      if (id && this.game && message?.version === this.game.version) {
        const wasPaused = this.pauseReason();
        const wasAllPresented = this.allPresented();
        this.presented.set(id, message.version);
        if (!wasAllPresented && this.allPresented()) this.lastClockWall = Date.now();
        if (wasPaused && !this.pauseReason() || this.lastInputReady !== this.inputReady()) this.publish();
      }
    });
    this.onMessage('lobby', (client, message) => { if (this.allowMessage(client)) this.lobbyCommand(client, message); });
    this.onMessage('command', (client, message) => { if (this.allowMessage(client)) this.gameCommand(client, message); });
    this.onMessage('*', client => { if (this.allowMessage(client)) this.fail(client, 'Comando sconosciuto.'); });
    this.clock.setInterval(() => this.tick(), 100);
  }
  onAuth(_client: Client, _options: unknown, context: AuthContext) {
    if (!originAllowed(context.headers)) throw new ServerError(403, 'Origine non consentita.');
    const session = sessionFromHeaders(context.headers);
    if (!session) throw new ServerError(401, 'Sessione scaduta. Riapri il menu.');
    this.checkAdmission(session.publicId);
    return { publicId: session.publicId, nickname: session.nickname };
  }
  /** Shared by the HTTP reservation guard and WebSocket admission; never grants access itself. */
  checkAdmission(id: string) {
    if (id === this.hostId || this.seats.some(s => s.id === id)) return;
    if (this.game || this.botsOnly) throw new ServerError(403, 'La sessione non accetta nuovi partecipanti.');
    if (this.privateRoom && !this.admitted.has(id)) throw new ServerError(403, 'Inserisci il codice della stanza privata.');
    if (this.seats.length >= this.capacity) throw new ServerError(403, 'La stanza è piena.');
  }
  admit(id: string, codeProvided: boolean) {
    if (this.privateRoom && !codeProvided && id !== this.hostId && !this.seats.some(s => s.id === id)) throw new Error('Per questa stanza serve il codice.');
    if (codeProvided) this.admitted.add(id);
    this.checkAdmission(id);
  }
  onJoin(client: Client, _options: unknown, auth: SessionProfile) {
    this.checkAdmission(auth.publicId); // Re-check after asynchronous seat reservations.
    const previous = this.peers.get(auth.publicId);
    this.peers.set(auth.publicId, client);
    this.identities.set(client.sessionId, auth.publicId);
    if (previous && previous !== client) {
      // Revocation is immediate: the previous socket may deliver queued messages while closing.
      this.identities.delete(previous.sessionId); this.rate.delete(previous.sessionId);
      previous.leave(4001, 'Sessione aperta in una nuova finestra.');
    }
    let seat = this.seats.find(s => s.id === auth.publicId);
    if (!seat && auth.publicId !== this.hostId) {
      seat = { id: auth.publicId, name: auth.nickname, kind: 'human', connected: true, ready: false };
      this.seats.push(seat);
    }
    if (seat) seat.connected = true;
    this.presented.set(auth.publicId, -1);
    this.lastClockWall = Date.now();
    this.presentationDeadline = Date.now() + 15000;
    this.lastActive = Date.now();
    this.publish();
  }
  onLeave(client: Client) {
    const id = this.identities.get(client.sessionId);
    this.identities.delete(client.sessionId); this.rate.delete(client.sessionId);
    if (!id || this.peers.get(id) !== client) return;
    this.peers.delete(id); this.presented.delete(id);
    const seat = this.seats.find(s => s.id === id);
    if (seat) { seat.connected = false; if (!this.game) seat.ready = false; }
    this.lastActive = Date.now();
    this.publish();
  }
  onDispose() { rooms.delete(this.roomId); }
  private allowMessage(client: Client): boolean {
    const id = this.identities.get(client.sessionId);
    if (!id || this.peers.get(id) !== client) return false;
    const now = Date.now(), item = this.rate.get(client.sessionId);
    if (!item || now - item.start > 1000) { this.rate.set(client.sessionId, { start: now, count: 1 }); return true; }
    item.count++;
    if (item.count <= 40) return true;
    if (item.count === 41) this.fail(client, 'Troppi comandi. Attendi un momento.');
    return false;
  }
  private fail(client: Client, message: string) { client.send('error', { message }); }
  private addBot(difficulty: Difficulty) {
    this.seats.push({ id: `bot-${randomUUID()}`, name: `Bot ${this.seats.filter(s => s.kind === 'bot').length + 1}`, kind: 'bot', difficulty, connected: true, ready: true });
  }
  private lobbyCommand(client: Client, message: unknown) {
    const id = this.identities.get(client.sessionId);
    if (!id || !message || typeof message !== 'object') return this.fail(client, 'Comando non valido.');
    const m = message as Record<string, unknown>;
    if (m.type === 'stop') {
      if (id !== this.hostId) return this.fail(client, 'Solo l’host può chiudere il test.');
      if (this.game && this.game.phase !== 'ended') this.game = stopGame(this.game, this.gameNow, 'host-stop');
      else if (!this.game) { this.broadcast('error', { message: 'L’host ha chiuso la stanza.' }); void this.disconnect(); return; }
      this.publish(); return;
    }
    if (this.game) return this.fail(client, 'La configurazione è fissata per questa sessione.');
    if (m.type === 'ready') {
      const seat = this.seats.find(s => s.id === id && s.kind === 'human');
      if (!seat || typeof m.ready !== 'boolean') return this.fail(client, 'Posto umano non disponibile.');
      seat.ready = m.ready;
    } else {
      if (id !== this.hostId) return this.fail(client, 'Questo comando è riservato all’host.');
      if (m.type === 'addBot') {
        if (this.seats.length >= this.capacity || !isDifficulty(m.difficulty)) return this.fail(client, 'Nessun posto disponibile o difficoltà non valida.');
        this.addBot(m.difficulty);
      } else if (m.type === 'removeBot') {
        const index = this.seats.findIndex(s => s.id === m.id && s.kind === 'bot');
        if (index < 0) return this.fail(client, 'Bot non trovato.');
        this.seats.splice(index, 1);
      } else if (m.type === 'removeSeat') {
        const index = this.seats.findIndex(s => s.id === m.id && s.id !== this.hostId && s.kind === 'human' && !s.connected);
        if (index < 0) return this.fail(client, 'Puoi liberare soltanto il posto di un ospite disconnesso.');
        this.admitted.delete(this.seats[index].id);
        this.seats.splice(index, 1);
      } else if (m.type === 'start') {
        if (this.seats.length !== this.capacity || this.seats.some(s => !s.connected || !s.ready)) return this.fail(client, 'Riempi tutti i posti e attendi che i partecipanti siano pronti.');
        this.gameNow = 0; this.lastClockWall = Date.now();
        // Deterministic integration harness only: never accepted over HTTP or in production.
        const seed = process.env.NODE_ENV === 'test' && process.env.DEMONICUTE_TEST_SEED !== undefined ? Number(process.env.DEMONICUTE_TEST_SEED) : randomInt(0, 0x100000000);
        this.game = createGame(this.seats.map(({ id, name, kind, difficulty }) => ({ id, name, kind, difficulty })), seed, { maxTurns: this.maxTurns, maxActions: this.maxTurns * (this.presetId === 'challenge-fixtures' ? 40 : 4), now: this.gameNow, preset: this.presetId });
        this.beginPresentation(0);
      } else return this.fail(client, 'Comando di stanza sconosciuto.');
    }
    this.publish();
  }
  private allPresented() {
    return !this.game || [...this.peers.keys()].every(id => (this.presented.get(id) ?? -1) >= this.game!.version);
  }
  private pauseReason(): string | undefined {
    if (!this.game || this.game.phase === 'ended') return;
    if (!this.peers.has(this.hostId) || this.seats.some(s => s.kind === 'human' && !s.connected)) return 'Partecipante disconnesso: il test riprende al rientro. L’host può chiuderlo.';
    if (!this.allPresented() && Date.now() > this.presentationDeadline) return 'Sincronizzazione lenta: avanzamento sospeso fino al rientro del client.';
  }
  private beginPresentation(previousEventCount: number) {
    const count = Math.max(1, (this.game?.events.length ?? 0) - previousEventCount);
    this.presentationUntil = Date.now() + this.paceMs * count;
    this.presentationDeadline = this.presentationUntil + 15000;
  }
  private inputReady(): boolean {
    return !!this.game && this.game.phase === 'playing' && !this.pauseReason() && this.allPresented() && Date.now() >= this.presentationUntil;
  }
  private gameCommand(client: Client, message: unknown) {
    if (!this.game) return this.fail(client, 'La sessione non è ancora iniziata.');
    const id = this.identities.get(client.sessionId);
    if (!id || !this.seats.some(s => s.id === id && s.kind === 'human')) return this.fail(client, 'Gli osservatori non possono giocare.');
    this.advanceClock(Date.now());
    const command = message as Command;
    // Engine validates first on a new immutable value. Never commit while presentation is pending.
    const result = applyCommand(this.game, id, command, this.gameNow);
    if (result.ok && !result.duplicate) {
      const pause = this.pauseReason();
      if (pause || Date.now() < this.presentationUntil || !this.allPresented()) {
        client.send('receipt', { id: command?.id, ok: false, error: pause ?? 'Attendi la presentazione agli altri partecipanti.' }); return;
      }
      const previousCount = this.game.events.length;
      this.game = result.state; this.beginPresentation(previousCount); this.publish();
    }
    client.send('receipt', { id: command?.id, ok: result.ok, error: result.error, duplicate: result.duplicate ?? false });
  }
  /** Paused/presenting time never consumes a reaction window. No clock is supplied by clients. */
  private advanceClock(now: number): boolean {
    const previousWall = this.lastClockWall;
    this.lastClockWall = now;
    if (!this.game || this.game.phase !== 'playing' || this.pauseReason() || !this.allPresented() || now < this.presentationUntil) return false;
    this.gameNow += Math.max(0, now - Math.max(previousWall, this.presentationUntil));
    const result = advanceTime(this.game, this.gameNow);
    if (!result.ok) throw new Error(result.error);
    if (result.state === this.game) return false;
    const count = this.game.events.length;
    this.game = result.state; this.beginPresentation(count); this.publish();
    return true;
  }
  private tick() {
    if (this.peers.size === 0 && Date.now() - this.lastActive > 30 * 60 * 1000) { void this.disconnect(); return; }
    if (!this.game || this.game.phase !== 'playing') { this.lastClockWall = Date.now(); return; }
    const timeTransition = this.advanceClock(Date.now());
    if (this.lastInputReady !== this.inputReady()) this.publish();
    if (this.game.challenge?.window && Date.now() - this.lastClockPublish >= 250) {
      this.lastClockPublish = Date.now();
      const clock = { gameNow: this.gameNow, challengeId: this.game.challenge.id, expiresAt: this.game.challenge.window.expiresAt, running: !this.pauseReason() && this.allPresented() && Date.now() >= this.presentationUntil };
      for (const client of this.peers.values()) client.send('reactionClock', clock);
    }
    if (timeTransition) return;
    const pause = this.pauseReason();
    if (pause) {
      if (this.lastPause !== pause) { this.lastPause = pause; this.publish(); }
      return;
    }
    if (this.lastPause) { this.lastPause = undefined; this.publish(); }
    if (Date.now() < this.presentationUntil || !this.allPresented()) return;
    const view = getView(this.game, 'observer');
    const player = this.seats.find(s => s.kind === 'bot' && view.pendingActorIds.includes(s.id));
    if (!player) return;
    const action = chooseAction(getView(this.game, player.id), player.difficulty ?? 'easy');
    const result = applyCommand(this.game, player.id, { id: `bot-${this.game.version}`, expectedVersion: this.game.version, action }, this.gameNow);
    const previousCount = this.game.events.length;
    this.game = result.ok ? result.state : stopGame(this.game, this.gameNow, `error: ${result.error ?? 'mossa bot non valida'}`);
    this.beginPresentation(previousCount); this.publish();
  }
  private lastPause: string | undefined;
  private sendView(client: Client) {
    const id = this.identities.get(client.sessionId); if (!id) return;
    const game = this.game ? getView(this.game, id) : null;
    const pauseReason = this.pauseReason();
    const view: RoomView = { roomId: this.roomId, code: this.code, name: this.title, capacity: this.capacity, isPrivate: this.privateRoom, hostId: this.hostId, viewerId: id, seats: this.seats.map(s => ({ ...s })), phase: game?.phase ?? 'lobby', paused: !!pauseReason, pauseReason, presentationUntil: this.presentationUntil, serverNow: Date.now(), game, revision: this.revision, presetId: this.presetId, gameNow: this.gameNow, inputReady: this.inputReady() };
    client.send('view', view);
  }
  private publish() { this.lastInputReady = this.inputReady(); this.revision++; for (const client of this.peers.values()) this.sendView(client); }
}
