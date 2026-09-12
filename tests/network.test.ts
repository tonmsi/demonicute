import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { Client, type Room } from '@colyseus/sdk';
import type { RoomView, SessionProfile } from '../src/shared/protocol.js';
import type { Command, GameAction } from '../src/shared/game.js';
import { applyCommand, createGame, getView } from '../src/engine/index.js';

const port = 28000 + process.pid % 1000, base = `http://127.0.0.1:${port}`;
let child: ChildProcess;
let serverLog = '';
const openRooms: Room[] = [];
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check: () => boolean | Promise<boolean>, timeout = 8000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await check()) return; await delay(25); }
  throw new Error(`Condizione rete non raggiunta. Server: ${serverLog.slice(-1200)}`);
}
before(async () => {
  child = spawn(process.execPath, ['dist/runtime/src/server/index.js'], { env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NODE_ENV: 'test', DEMONICUTE_TEST_SEED: '42', PUBLIC_ORIGIN: base }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  child.stdout!.on('data', data => { serverLog = (serverLog + data).slice(-5000); });
  child.stderr!.on('data', data => { serverLog = (serverLog + data).slice(-5000); });
  await until(async () => { try { return (await fetch(`${base}/api/health`)).ok; } catch { return false; } });
});
after(async () => { for (const room of openRooms) if (room.connection.isOpen) await room.leave(); child?.kill(); });

async function user(nickname: string) {
  const response = await fetch(`${base}/api/session`);
  const cookieHeader = response.headers.get('set-cookie')!;
  assert.match(cookieHeader, /HttpOnly/); assert.match(cookieHeader, /SameSite=Strict/);
  const cookie = cookieHeader.split(';')[0];
  const profile = await response.json() as SessionProfile;
  const api = async (path: string, body?: unknown, method = 'POST') => fetch(`${base}${path}`, { method, headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json', 'X-Demonicute-Client': 'web' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  assert.equal((await api('/api/session', { nickname }, 'PATCH')).status, 200);
  return { ...profile, cookie, api, client: new Client(base, { headers: { Cookie: cookie, Origin: base } }) };
}
async function connect(person: Awaited<ReturnType<typeof user>>, roomId: string) {
  const room = await person.client.joinById(roomId);
  room.reconnection.enabled = false;
  openRooms.push(room);
  const state = { view: null as RoomView | null, receipts: [] as { id: string; ok: boolean; error?: string; duplicate?: boolean }[], errors: [] as string[], clock: null as { gameNow: number; challengeId: string; expiresAt: number; running: boolean } | null, autoAck: true };
  room.onMessage('view', (view: RoomView) => { state.view = view; if (view.game && state.autoAck) room.send('presented', { version: view.game.version }); });
  room.onMessage('receipt', (receipt: typeof state.receipts[number]) => state.receipts.push(receipt));
  room.onMessage('error', (error: { message: string }) => state.errors.push(error.message));
  room.onMessage('reactionClock', (clock: typeof state.clock) => { state.clock = clock; });
  room.send('sync'); await until(() => !!state.view);
  return { room, state };
}
async function readyToMove(connection: Awaited<ReturnType<typeof connect>>) {
  await until(() => !!connection.state.view?.game && Date.now() > connection.state.view.presentationUntil + 50 && !connection.state.view.paused && connection.state.view.inputReady);
}
let moveCounter = 0;
async function move(connection: Awaited<ReturnType<typeof connect>>, action: GameAction, duplicate = false) {
  await readyToMove(connection);
  const command: Command = { id: `net-move-${++moveCounter}`, expectedVersion: connection.state.view!.game!.version, action };
  connection.room.send('command', command);
  if (duplicate) connection.room.send('command', command);
  await until(() => connection.state.receipts.filter(receipt => receipt.id === command.id).length === (duplicate ? 2 : 1));
  const receipts = connection.state.receipts.filter(receipt => receipt.id === command.id);
  assert.ok(receipts.every(receipt => receipt.ok), receipts.map(receipt => receipt.error).join('; '));
  if (duplicate) assert.equal(receipts.filter(receipt => receipt.duplicate).length, 1);
  await until(() => connection.state.view!.game!.version > command.expectedVersion);
  return { actorId: connection.state.view!.viewerId, command, now: connection.state.view!.gameNow };
}

test('due client: cookie, privacy, autorità, idempotenza, sfide e rientro', async () => {
  const host = await user('Autore'), guest = await user('Ospite'), outsider = await user('Estraneo');
  assert.notEqual(host.publicId, guest.publicId);
  const createdResponse = await host.api('/api/rooms', { name: 'Test privato', capacity: 2, isPrivate: true, bots: [], paceMs: 100, maxTurns: 10 });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json() as { roomId: string; code: string };
  const publicListing = await (await fetch(`${base}/api/rooms`)).json();
  assert.equal(publicListing.some((r: { roomId: string }) => r.roomId === created.roomId), false);
  await assert.rejects(outsider.client.joinById(created.roomId, { publicId: host.publicId }));
  assert.equal((await outsider.api('/api/join', { roomId: created.roomId })).status, 403);
  assert.equal((await guest.api('/api/join', { code: created.code })).status, 200);
  const a = await connect(host, created.roomId), b = await connect(guest, created.roomId);
  b.room.send('lobby', { type: 'start' }); await until(() => b.state.errors.length > 0);
  assert.match(b.state.errors.at(-1)!, /host/);
  a.room.send('lobby', { type: 'ready', ready: true }); b.room.send('lobby', { type: 'ready', ready: true });
  await until(() => a.state.view!.seats.every(s => s.ready));
  a.room.send('lobby', { type: 'start' }); await readyToMove(a); await readyToMove(b);
  const first = a.state.view!.game!;
  assert.equal(first.players.find(p => p.id === host.publicId)!.hand!.length, 5);
  assert.equal(Object.hasOwn(first.players.find(p => p.id === guest.publicId)!, 'hand'), false);
  assert.equal(Object.hasOwn(b.state.view!.game!.players.find(p => p.id === host.publicId)!, 'hand'), false);
  for (const key of ['seed', 'rngState', 'supply', 'invocations', 'receipts']) assert.equal(Object.hasOwn(first, key), false);
  const snapshot = JSON.stringify(first);
  for (const type of ['challengeBoss', 'challengeMagist'] as const) {
    a.room.send('command', { id: type, expectedVersion: first.version, action: { type } });
    await until(() => a.state.receipts.some(r => r.id === type));
    assert.equal(a.state.receipts.find(r => r.id === type)!.ok, false);
  }
  assert.equal(JSON.stringify(a.state.view!.game), snapshot);
  const move: Command = { id: 'draw-once', expectedVersion: first.version, action: { type: 'draw' } };
  a.room.send('command', move); a.room.send('command', move);
  await until(() => a.state.receipts.filter(r => r.id === move.id).length === 2);
  assert.equal(a.state.receipts.filter(r => r.id === move.id && r.ok).length, 2);
  assert.equal(a.state.receipts.filter(r => r.id === move.id && r.duplicate).length, 1);
  assert.equal(a.state.view!.game!.version, first.version + 1);
  assert.equal(a.state.view!.game!.players.find(p => p.id === host.publicId)!.hand!.length, 6);
  await until(() => b.state.view!.game!.version === first.version + 1);
  b.room.send('command', { id: 'impersonate', expectedVersion: first.version + 1, action: { type: 'draw' }, actorId: host.publicId });
  await until(() => b.state.receipts.some(r => r.id === 'impersonate'));
  assert.equal(b.state.receipts.find(r => r.id === 'impersonate')!.ok, false);
  a.room.send('command', { id: 'stale', expectedVersion: first.version, action: { type: 'draw' } });
  await until(() => a.state.receipts.some(r => r.id === 'stale'));
  assert.equal(a.state.receipts.find(r => r.id === 'stale')!.ok, false);
  const version = a.state.view!.game!.version;
  await b.room.leave(); await until(() => a.state.view!.paused);
  await delay(350); assert.equal(a.state.view!.game!.version, version);
  const reconnected = await connect(guest, created.roomId);
  await until(() => !a.state.view!.paused);
  assert.equal(reconnected.state.view!.viewerId, guest.publicId);
  assert.equal(reconnected.state.view!.game!.version, version);
  a.room.send('lobby', { type: 'stop' }); await until(() => a.state.view!.phase === 'ended');
  assert.equal(a.state.view!.game!.winner, null); assert.equal(a.state.view!.game!.stopReason, 'host-stop');
});

test('stanze pubbliche e sessioni solo bot per 2–5 posti', async () => {
  for (let capacity = 2; capacity <= 5; capacity++) {
    const owner = await user(`Bot observer ${capacity}`);
    const response = await owner.api('/api/rooms', { name: `Bot ${capacity}`, capacity, isPrivate: false, botsOnly: true, bots: Array.from({ length: capacity }, (_, i) => ['easy', 'medium', 'hard'][i % 3]), paceMs: 100, maxTurns: 2 });
    assert.equal(response.status, 201);
    const created = await response.json() as { roomId: string };
    const c = await connect(owner, created.roomId);
    assert.equal(c.state.view!.seats.length, capacity);
    c.room.send('lobby', { type: 'start' });
    await until(() => c.state.view?.phase === 'ended', 10000);
    assert.equal(c.state.view!.game!.winner, null);
    assert.equal(c.state.view!.game!.players.some(p => Object.hasOwn(p, 'hand')), false);
    assert.ok(c.state.view!.game!.version > 0);
    await c.room.leave();
  }
  const owner = await user('Visibile');
  const response = await owner.api('/api/rooms', { name: 'Cerchia aperta', capacity: 3, isPrivate: false, bots: [], paceMs: 100, maxTurns: 2 });
  const created = await response.json() as { roomId: string };
  const listing = await (await fetch(`${base}/api/rooms`)).json();
  assert.ok(listing.some((r: { roomId: string }) => r.roomId === created.roomId));
  const stranger = await user('Ingresso');
  assert.equal((await stranger.api('/api/join', { roomId: created.roomId })).status, 200);
  const c = await connect(stranger, created.roomId);
  assert.equal(c.state.view!.seats.length, 2);
});

test('validazione HTTP, origine e creazione diretta Colyseus', async () => {
  const owner = await user('Validation');
  for (const capacity of [0, 1, 6, 2.5, '3']) assert.equal((await owner.api('/api/rooms', { capacity, bots: [] })).status, 400);
  assert.equal((await owner.api('/api/rooms', { capacity: 2, bots: [], presetId: 'invented' })).status, 400);
  const denied = await fetch(`${base}/api/rooms`, { method: 'POST', headers: { Cookie: owner.cookie, Origin: 'https://estraneo.invalid', 'X-Demonicute-Client': 'web', 'Content-Type': 'application/json' }, body: JSON.stringify({ capacity: 2, bots: [] }) });
  assert.equal(denied.status, 403);
  await assert.rejects(owner.client.create('demonicute', { capacity: 2, hostId: owner.publicId }));
});

test('i bot attendono la presentazione e si fermano se l’host si disconnette', async () => {
  const owner = await user('Ritmo');
  const response = await owner.api('/api/rooms', { name: 'Ritmo verificato', capacity: 2, isPrivate: true, botsOnly: true, bots: ['easy', 'hard'], paceMs: 100, maxTurns: 10 });
  const created = await response.json() as { roomId: string };
  const room = await owner.client.joinById(created.roomId);
  room.reconnection.enabled = false; openRooms.push(room);
  let view: RoomView | undefined;
  room.onMessage('view', (next: RoomView) => { view = next; });
  room.onMessage('error', () => {});
  room.send('sync'); await until(() => !!view);
  room.send('lobby', { type: 'start' }); await until(() => !!view?.game);
  const initialVersion = view!.game!.version;
  await delay(500);
  assert.equal(view!.game!.version, initialVersion, 'Nessun bot avanza senza conferma di presentazione.');
  room.send('presented', { version: initialVersion });
  await until(() => view!.game!.version > initialVersion);
  const current = view!.game!.version;
  await room.leave(); await delay(500);
  const rejoined = await owner.client.joinById(created.roomId);
  rejoined.reconnection.enabled = false; openRooms.push(rejoined);
  let back: RoomView | undefined;
  rejoined.onMessage('view', (next: RoomView) => { back = next; });
  rejoined.onMessage('error', () => {}); rejoined.send('sync');
  await until(() => !!back);
  assert.equal(back!.game!.version, current, 'La disconnessione dell’osservatore host sospende anche i soli bot.');
  rejoined.send('lobby', { type: 'stop' }); await until(() => back!.phase === 'ended');
});

test('la lobby libera un posto assente solo su scelta host; messaggi sconosciuti sono limitati', async () => {
  const owner = await user('Organizzatore'), guest = await user('Assente');
  const response = await owner.api('/api/rooms', { name: 'Posti', capacity: 2, isPrivate: false, bots: [], paceMs: 100 });
  const created = await response.json() as { roomId: string };
  const a = await connect(owner, created.roomId), b = await connect(guest, created.roomId);
  a.room.send('lobby', { type: 'removeSeat', id: guest.publicId });
  await until(() => a.state.errors.length > 0);
  assert.equal(a.state.view!.seats.length, 2, 'Non può espellere un umano connesso con removeSeat.');
  await b.room.leave(); await until(() => a.state.view!.seats.some(s => s.id === guest.publicId && !s.connected));
  a.room.send('lobby', { type: 'removeSeat', id: guest.publicId });
  await until(() => a.state.view!.seats.length === 1);
  a.room.send('lobby', { type: 'addBot', difficulty: 'medium' });
  await until(() => a.state.view!.seats.length === 2);
  await delay(1100); a.state.errors.length = 0;
  for (let i = 0; i < 100; i++) a.room.send('unknown');
  await delay(200);
  assert.ok(a.state.errors.length <= 41); assert.ok(a.state.errors.some(e => e.includes('Troppi comandi')));
});

test('lo stesso host può creare nuovi test dopo tre sessioni concluse', async () => {
  const owner = await user('Iterazioni');
  for (let i = 0; i < 4; i++) {
    const response = await owner.api('/api/rooms', { name: `Iterazione ${i}`, capacity: 2, isPrivate: true, botsOnly: true, bots: ['easy', 'easy'], paceMs: 100 });
    assert.equal(response.status, 201, `Creazione ${i + 1} consentita: test precedenti finiti.`);
    const created = await response.json() as { roomId: string };
    const c = await connect(owner, created.roomId);
    c.room.send('lobby', { type: 'start' }); await until(() => !!c.state.view!.game);
    c.room.send('lobby', { type: 'stop' }); await until(() => c.state.view!.phase === 'ended');
    await c.room.leave();
  }
});

test('duello in rete: scelta coperta, rientro, duplicati e identità con il motore headless', async () => {
  const host = await user('Sfidante'), guest = await user('Difensore'), observer = await user('Spettatore');
  const response = await host.api('/api/rooms', { name: 'Sfide riservate', capacity: 3, bots: [], isPrivate: false, presetId: 'challenge-fixtures', paceMs: 100, maxTurns: 12 });
  assert.equal(response.status, 201);
  const created = await response.json() as { roomId: string };
  const a = await connect(host, created.roomId);
  let b = await connect(guest, created.roomId);
  const c = await connect(observer, created.roomId);
  for (const connection of [a, b, c]) connection.room.send('lobby', { type: 'ready', ready: true });
  await until(() => a.state.view!.seats.every(seat => seat.ready));
  a.room.send('lobby', { type: 'start' }); await readyToMove(a);
  const initial = a.state.view!;
  assert.equal(initial.presetId, 'challenge-fixtures');
  assert.deepEqual(initial.game!.capabilities, { bossChallenges: true, magistDuels: true });
  let replay = createGame(initial.seats.map(({ id, name, kind, difficulty }) => ({ id, name, kind, difficulty })), 42, { preset: 'challenge-fixtures', maxTurns: 12, maxActions: 480, now: 0 });
  const steps: Awaited<ReturnType<typeof move>>[] = [];
  steps.push(await move(a, { type: 'challengeMagist', targetId: guest.publicId, stake: 2 }));
  await until(() => b.state.view?.game?.challenge?.phase === 'preparation');
  const choice = b.state.view!.game!.legalActions.find(action => action.type === 'challengeCommit' && action.cardId !== null && action.elementChoice === 'Terra')!;
  assert.ok(choice, 'Il mazzo seed42 contiene la scelta Terra/Fuoco del difensore.');
  steps.push(await move(b, choice, true));
  const chosen = b.state.view!.game!.challenge!.ownCommit!;
  await until(() => a.state.view!.game!.version === b.state.view!.game!.version && c.state.view!.game!.version === b.state.view!.game!.version);
  assert.equal(JSON.stringify(a.state.view!.game).includes(chosen.cardId!), false);
  assert.equal(JSON.stringify(c.state.view!.game).includes(chosen.cardId!), false);
  assert.equal(Object.hasOwn(a.state.view!.game!.challenge!, 'ownCommit'), false);
  assert.deepEqual(c.state.view!.game!.challenge!.committedIds, [guest.publicId]);
  const version = c.state.view!.game!.version;
  c.room.send('command', { id: 'spectator-modifier', expectedVersion: version, action: { type: 'challengeCommit', cardId: null } });
  await until(() => c.state.receipts.some(receipt => receipt.id === 'spectator-modifier'));
  assert.equal(c.state.receipts.at(-1)!.ok, false); assert.equal(c.state.view!.game!.version, version);
  await b.room.leave(); await until(() => a.state.view!.paused);
  await delay(300);
  b = await connect(guest, created.roomId); await until(() => !a.state.view!.paused);
  assert.deepEqual(b.state.view!.game!.challenge!.ownCommit, chosen);
  assert.equal(b.state.view!.game!.version, version);
  steps.push(await move(a, { type: 'challengeCommit', cardId: null }));
  steps.push(await move(b, { type: 'challengeReady' }));
  b.room.send('command', { id: 'late-second-modifier', expectedVersion: version, action: choice });
  await until(() => b.state.receipts.some(receipt => receipt.id === 'late-second-modifier'));
  assert.equal(b.state.receipts.at(-1)!.ok, false);
  steps.push(await move(a, { type: 'challengeReady' }, true));
  await until(() => b.state.view!.game!.version === a.state.view!.game!.version);
  if (a.state.view!.game!.challenge?.phase === 'stake') {
    const loser = a.state.view!.game!.challenge!.result!.loserId === host.publicId ? a : b;
    while (loser.state.view!.game!.challenge?.phase === 'stake') {
      const action = loser.state.view!.game!.legalActions.find(candidate => candidate.type === 'challengeLoseDemon')!;
      steps.push(await move(loser, action, true));
    }
  }
  await until(() => !!c.state.view?.game?.challengeHistory.length);
  for (const step of steps) {
    const result = applyCommand(replay, step.actorId, step.command, step.now);
    assert.equal(result.ok, true, result.error); replay = result.state;
  }
  assert.deepEqual(c.state.view!.game, getView(replay, observer.publicId), 'Stato, conteggi e cronologia online/headless identici.');
  assert.equal(c.state.view!.game!.challengeHistory[0].counts.length, 3, 'Effetti globali inclusi gli spettatori.');
  assert.equal(c.state.view!.game!.winner, null);
  a.room.send('lobby', { type: 'stop' }); await until(() => a.state.view!.phase === 'ended');
});

test('finestra server: presentazione e disconnessione non consumano il timer; ack ripetuti non lo allungano', async () => {
  const host = await user('Clock host'), guest = await user('Clock guest');
  const response = await host.api('/api/rooms', { name: 'Timer sfida', capacity: 2, bots: [], isPrivate: false, presetId: 'challenge-fixtures', paceMs: 100, maxTurns: 12 });
  const created = await response.json() as { roomId: string };
  const a = await connect(host, created.roomId);
  let b = await connect(guest, created.roomId);
  a.room.send('lobby', { type: 'ready', ready: true }); b.room.send('lobby', { type: 'ready', ready: true });
  await until(() => a.state.view!.seats.every(seat => seat.ready));
  a.room.send('lobby', { type: 'start' }); await readyToMove(a);
  b.state.autoAck = false;
  await move(a, { type: 'challengeBoss' });
  await until(() => !!a.state.clock && !a.state.clock.running);
  const presentingAt = a.state.clock!.gameNow;
  await delay(700);
  assert.equal(a.state.clock!.gameNow, presentingAt, 'Il timer aspetta la presentazione del client lento.');
  b.state.autoAck = true;
  b.room.send('presented', { version: b.state.view!.game!.version });
  await until(() => !!a.state.clock?.running);
  assert.equal(a.state.view!.game!.challenge!.window!.actorId, host.publicId);
  await b.room.leave(); await until(() => a.state.view!.paused);
  await until(() => a.state.clock?.running === false);
  const stoppedAt = a.state.clock!.gameNow;
  await delay(600);
  assert.equal(a.state.clock!.gameNow, stoppedAt, 'Il timer si ferma durante la disconnessione.');
  b = await connect(guest, created.roomId); await until(() => !a.state.view!.paused);
  const optionalVersion = a.state.view!.game!.version;
  const repeats = setInterval(() => a.room.send('presented', { version: optionalVersion }), 70);
  try { await until(() => a.state.view!.game!.challenge?.phase === 'preparation', 6500); }
  finally { clearInterval(repeats); }
  assert.ok(a.state.view!.game!.events.some(event => event.type === 'challengeWindowExpired'));
  const preparedVersion = a.state.view!.game!.version;
  await delay(500);
  assert.equal(a.state.view!.game!.version, preparedVersion, 'Una scelta obbligatoria non scade col timer delle reazioni.');
  a.room.send('lobby', { type: 'stop' }); await until(() => a.state.view!.phase === 'ended');
});
