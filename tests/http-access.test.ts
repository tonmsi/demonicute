import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { Client, type Room } from '@colyseus/sdk';
import { publicOrigin } from '../src/server/auth.js';
import { RequestBudget } from '../src/server/http-security.js';
import type { RoomView } from '../src/shared/protocol.js';

const port = 31000 + process.pid % 1000;
const base = `http://127.0.0.1:${port}`, origin = 'https://demonicute.example';
let child: ChildProcess, logs = '';
const connections: Room[] = [];
async function until(check: () => boolean | Promise<boolean>) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(`Timeout server produzione: ${logs.slice(-1000)}`);
}
before(async () => {
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'production', PORT: String(port), RENDER_EXTERNAL_URL: `${origin}/` };
  delete env.PUBLIC_ORIGIN; delete env.HOST;
  child = spawn(process.execPath, ['dist/runtime/src/server/index.js'], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream!.on('data', data => { logs = (logs + data).slice(-4000); });
  await until(async () => { try { return (await fetch(`${base}/api/health`)).ok; } catch { return false; } });
});
after(async () => { for (const room of connections) if (room.connection.isOpen) await room.leave(); child?.kill(); });

async function visitor() {
  const response = await fetch(`${base}/api/session`, { headers: { Origin: origin } });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie')!;
  assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /Secure/); assert.match(setCookie, /SameSite=Strict/);
  const cookie = setCookie.split(';')[0];
  const profile = await response.json();
  assert.deepEqual(Object.keys(profile).sort(), ['nickname', 'publicId']);
  const headers = { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json', 'X-Demonicute-Client': 'web' };
  const api = (path: string, body: unknown) => fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { cookie, headers, api, client: new Client(base, { headers: { Cookie: cookie, Origin: origin } }) };
}

test('configurazione Render: origine HTTPS normalizzata e dominio personalizzato esplicito', () => {
  assert.equal(publicOrigin({ NODE_ENV: 'production', RENDER_EXTERNAL_URL: `${origin}/` }), origin);
  assert.equal(publicOrigin({ NODE_ENV: 'production', RENDER_EXTERNAL_URL: origin, PUBLIC_ORIGIN: 'https://play.example/' }), 'https://play.example');
  for (const url of ['http://play.example', 'https://play.example/path', 'https://play.example/?x=1', 'https://user:pass@play.example', 'invalid']) {
    assert.throws(() => publicOrigin({ NODE_ENV: 'production', PUBLIC_ORIGIN: url }));
  }
  assert.throws(() => publicOrigin({ NODE_ENV: 'production' }));
  assert.equal(publicOrigin({ NODE_ENV: 'test' }), undefined);
  assert.match(logs, /0\.0\.0\.0/);
});

test('budget separati per identità e ripristinati a scadenza', () => {
  const budget = new RequestBudget(2, 100);
  assert.equal(budget.take('a', 0), true); assert.equal(budget.take('a', 1), true);
  assert.equal(budget.take('a', 2), false); assert.equal(budget.take('b', 2), true);
  assert.equal(budget.take('a', 100), true);
});

test('matchmaking protegge gli slot prima del WebSocket; produzione consente ospiti con codice', async () => {
  const host = await visitor(), guest = await visitor(), outsider = await visitor();
  const created = await host.api('/api/rooms', { capacity: 2, isPrivate: true, bots: [], paceMs: 100 });
  assert.equal(created.status, 201);
  const { roomId, code } = await created.json();
  const path = `/matchmake/joinById/${roomId}`;
  for (let i = 0; i < 14; i++) {
    const denied = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(denied.status, 401, 'Un visitatore senza sessione non prenota posti.');
  }
  assert.equal((await outsider.api(path, { publicId: 'forged-host' })).status, 403);
  assert.equal((await fetch(`${base}${path}`, { method: 'POST', headers: { ...host.headers, Origin: 'https://outsider.example' }, body: '{}' })).status, 403);
  assert.equal((await host.api('/matchmake/create/demonicute', {})).status, 403);
  assert.equal((await host.api(path, { padding: 'x'.repeat(9000) })).status, 413);
  assert.equal((await fetch(`${base}${path}`, { method: 'POST', headers: host.headers, body: '{' })).status, 400);
  assert.equal((await guest.api('/api/join', { code })).status, 200);
  for (const person of [host, guest]) {
    const room = await person.client.joinById(roomId); room.reconnection.enabled = false; connections.push(room);
    let view: RoomView | undefined;
    room.onMessage('view', next => { view = next; }); room.onMessage('error', () => {}); room.send('sync');
    await until(() => !!view);
    assert.equal(view!.roomId, roomId);
  }
  const returned = await fetch(`${base}/api/session`, { headers: host.headers });
  assert.equal(returned.headers.get('set-cookie'), null, 'Il rientro conserva la sessione.');
});

test('un browser troppo attivo non blocca amici dietro lo stesso proxy né health check', async () => {
  const noisy = await visitor(), friend = await visitor();
  let status = 0;
  for (let i = 0; i < 301; i++) status = (await fetch(`${base}/api/rooms`, { headers: noisy.headers })).status;
  assert.equal(status, 429);
  assert.equal((await fetch(`${base}/api/rooms`, { headers: friend.headers })).status, 200);
  assert.equal((await fetch(`${base}/api/health`, { headers: noisy.headers })).status, 200);
});
