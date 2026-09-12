import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Client } from '@colyseus/core';
import { creationTickets, DemonicuteRoom, validateOptions } from '../src/server/room.js';
import type { RoomView, SessionProfile } from '../src/shared/protocol.js';

type Handler = (client: Client, message?: unknown) => void;

/** Deterministic transport fixture: closing a socket does not immediately deliver onLeave. */
class RoomHarness extends DemonicuteRoom {
  readonly handlers = new Map<string | number, Handler>();
  override async setPrivate() {}
  override onMessage = ((type: string | number, handler: Handler) => {
    this.handlers.set(type, handler);
    return () => { this.handlers.delete(type); };
  }) as DemonicuteRoom['onMessage'];
  receive(client: Client, type: string, message?: unknown) { this.handlers.get(type)!(client, message); }
}

function socket() {
  const messages: { type: string; value: unknown }[] = [];
  const closes: number[] = [];
  const client = {
    sessionId: randomUUID(),
    send: (type: string, value: unknown) => { messages.push({ type, value }); },
    leave: (code: number) => { closes.push(code); },
  } as unknown as Client;
  return { client, messages, closes, view: () => messages.filter(message => message.type === 'view').at(-1)!.value as RoomView };
}

async function roomFixture(t: TestContext, isPrivate = false) {
  const host: SessionProfile = { publicId: randomUUID(), nickname: 'Host' };
  const room = new RoomHarness();
  room.roomId = randomUUID();
  const ticket = randomUUID();
  creationTickets.set(ticket, { owner: host, options: validateOptions({ capacity: 2, bots: [], isPrivate, paceMs: 100 }) });
  await room.onCreate({ ticket });
  t.after(() => { room.clock.clear(); room.onDispose(); });
  return { room, host };
}

test('la nuova finestra revoca subito mosse, controlli host, sync e ACK del vecchio socket', async t => {
  const { room, host } = await roomFixture(t);
  const guest: SessionProfile = { publicId: randomUUID(), nickname: 'Ospite' };
  const oldHost = socket(), opponent = socket();
  room.onJoin(oldHost.client, {}, host); room.onJoin(opponent.client, {}, guest);
  for (const peer of [oldHost, opponent]) room.receive(peer.client, 'lobby', { type: 'ready', ready: true });
  room.receive(oldHost.client, 'lobby', { type: 'start' });
  assert.ok(room.game);
  const initialVersion = room.game.version;
  room.presentationUntil = 0;
  for (const peer of [oldHost, opponent]) room.receive(peer.client, 'presented', { version: initialVersion });
  assert.equal(oldHost.view().inputReady, true);

  const currentHost = socket();
  room.onJoin(currentHost.client, {}, host);
  assert.deepEqual(oldHost.closes, [4001]);
  assert.equal(currentHost.view().inputReady, false);
  const oldMessageCount = oldHost.messages.length;
  room.receive(oldHost.client, 'presented', { version: initialVersion });
  room.receive(currentHost.client, 'sync');
  assert.equal(currentHost.view().inputReady, false, 'La vecchia finestra non conferma la presentazione per quella nuova.');

  room.receive(currentHost.client, 'presented', { version: initialVersion });
  assert.equal(currentHost.view().inputReady, true);
  room.receive(oldHost.client, 'command', { id: 'stale-tab-draw', expectedVersion: initialVersion, action: { type: 'draw' } });
  room.receive(oldHost.client, 'lobby', { type: 'stop' });
  room.receive(oldHost.client, 'sync');
  assert.equal(room.game.version, initialVersion);
  assert.equal(room.game.phase, 'playing');
  assert.equal(oldHost.messages.length, oldMessageCount, 'Il socket revocato non riceve nuovi dati.');

  room.onLeave(oldHost.client);
  room.receive(currentHost.client, 'sync');
  assert.equal(currentHost.view().paused, false);
  assert.equal(currentHost.view().seats.find(seat => seat.id === host.publicId)!.connected, true);
  room.receive(currentHost.client, 'command', { id: 'current-tab-draw', expectedVersion: initialVersion, action: { type: 'draw' } });
  assert.equal(room.game.version, initialVersion + 1);
  assert.equal(currentHost.view().game!.players.find(player => player.id === host.publicId)!.hand!.length, 6);
  assert.equal(Object.hasOwn(opponent.view().game!.players.find(player => player.id === host.publicId)!, 'hand'), false);
});

test('gli ingressi concorrenti ricontrollano capacità e codice senza occupare il posto riservato all’host', async t => {
  const { room, host } = await roomFixture(t, true);
  const first: SessionProfile = { publicId: randomUUID(), nickname: 'Primo' };
  const second: SessionProfile = { publicId: randomUUID(), nickname: 'Secondo' };
  assert.throws(() => room.onJoin(socket().client, {}, first), /codice/);
  assert.throws(() => room.admit(first.publicId, false), /codice/);
  room.admit(first.publicId, true); room.admit(second.publicId, true);
  const firstSocket = socket(), ownerSocket = socket();
  room.onJoin(firstSocket.client, {}, first);
  assert.throws(() => room.onJoin(socket().client, {}, second), /piena/);
  room.onJoin(ownerSocket.client, {}, host);
  assert.equal(room.seats.length, 2);
  assert.deepEqual(room.seats.map(seat => seat.id), [host.publicId, first.publicId]);

  room.onLeave(firstSocket.client);
  room.receive(ownerSocket.client, 'lobby', { type: 'removeSeat', id: first.publicId });
  assert.throws(() => room.onJoin(socket().client, {}, first), /codice/, 'Liberare il posto revoca l’ammissione privata precedente.');
  room.onJoin(socket().client, {}, second);
  assert.equal(room.seats.length, 2);
});
