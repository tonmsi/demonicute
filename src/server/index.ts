import express from 'express';
import { createServer, type IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Server, matchMaker, createRouter } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { ensureSession, sessionFromHeaders, profile, cleanName, originAllowed, publicOrigin } from './auth.js';
import { guardMatchmaking, RequestBudget } from './http-security.js';
import { DemonicuteRoom, rooms, creationTickets, validateOptions } from './room.js';
import { AUTHOR_DEMON_COST_MATCH_SUMMARY } from '../content/author-demon-costs.js';

publicOrigin(); // Fail early on an invalid production URL instead of rejecting every player.
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});
const apiBudget = new RequestBudget(300);
const creatingByOwner = new Map<string, number>();
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '0.2.1', content: 'technical-fixtures', presets: ['technical-fixtures', 'challenge-fixtures'], authorDemons: { registered: AUTHOR_DEMON_COST_MATCH_SUMMARY.authorRows, costsMatched: AUTHOR_DEMON_COST_MATCH_SUMMARY.matched, costsMissing: AUTHOR_DEMON_COST_MATCH_SUMMARY.missing, aliasesPending: AUTHOR_DEMON_COST_MATCH_SUMMARY.unconfirmedAliases, playable: 0 } }));
app.use('/api', (req, res, next) => {
  if (!originAllowed(req.headers) || (!['GET', 'HEAD'].includes(req.method) && req.get('X-Demonicute-Client') !== 'web')) { res.status(403).json({ error: 'Richiesta non consentita.' }); return; }
  const session = sessionFromHeaders(req.headers);
  const key = session ? `session:${session.publicId}` : `ip:${req.socket.remoteAddress ?? 'local'}`;
  if (!apiBudget.take(key)) { res.setHeader('Retry-After', '60'); res.status(429).json({ error: 'Troppi tentativi. Riprova tra un minuto.' }); return; }
  next();
});
app.get('/api/session', (req, res) => res.json(profile(ensureSession(req, res))));
app.patch('/api/session', (req, res) => {
  const session = ensureSession(req, res); session.nickname = cleanName(req.body?.nickname, 'Magista'); res.json(profile(session));
});
app.get('/api/rooms', (_req, res) => res.json([...rooms.values()].filter(r => !r.privateRoom && !r.game && !r.botsOnly && r.seats.length < r.capacity).map(r => ({ roomId: r.roomId, code: r.code, name: r.title, capacity: r.capacity, occupied: r.seats.length }))));
app.post('/api/rooms', async (req, res) => {
  const ticket = randomUUID();
  let pendingOwner: string | undefined;
  try {
    const owner = profile(ensureSession(req, res));
    const pending = creatingByOwner.get(owner.publicId) ?? 0;
    if (rooms.size + [...creatingByOwner.values()].reduce((sum, n) => sum + n, 0) >= 100) throw new Error('Il server ha raggiunto il limite di stanze. Riprova più tardi.');
    if ([...rooms.values()].filter(r => r.hostId === owner.publicId && r.game?.phase !== 'ended').length + pending >= 3) throw new Error('Chiudi una stanza esistente prima di crearne altre.');
    const options = validateOptions(req.body);
    creatingByOwner.set(owner.publicId, pending + 1); pendingOwner = owner.publicId;
    creationTickets.set(ticket, { owner, options });
    const listing = await matchMaker.createRoom('demonicute', { ticket });
    const room = rooms.get(listing.roomId)!;
    res.status(201).json({ roomId: room.roomId, code: room.code });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Impossibile creare la stanza.' }); }
  finally {
    creationTickets.delete(ticket);
    if (pendingOwner) {
      const remaining = (creatingByOwner.get(pendingOwner) ?? 1) - 1;
      if (remaining) creatingByOwner.set(pendingOwner, remaining); else creatingByOwner.delete(pendingOwner);
    }
  }
});
app.post('/api/join', (req, res) => {
  try {
    const session = ensureSession(req, res);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    const room = code ? [...rooms.values()].find(r => r.code === code) : rooms.get(req.body?.roomId);
    if (!room) { res.status(404).json({ error: 'Stanza non trovata. Controlla il codice.' }); return; }
    room.admit(session.publicId, !!code);
    res.json({ roomId: room.roomId });
  } catch (error) { res.status(403).json({ error: error instanceof Error ? error.message : 'Accesso non consentito.' }); }
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'Risorsa non trovata.' }));

const http = createServer(app);
const server = new Server({ transport: new WebSocketTransport({ server: http, maxPayload: 16384, pingInterval: 3000, pingMaxRetries: 2, verifyClient: (info: { req: IncomingMessage }) => originAllowed(info.req.headers) && !!sessionFromHeaders(info.req.headers) }) });
server.router = createRouter({}, { onRequest: guardMatchmaking });
server.define('demonicute', DemonicuteRoom);
const dist = resolve('dist/client');
if (process.env.NODE_ENV === 'production' || (!process.argv.includes('--dev') && existsSync(resolve(dist, 'index.html')))) {
  app.use(express.static(dist));
  app.get('/', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  // Dedicated HMR socket: Colyseus and Vite must not upgrade the same connection.
  const vite = await createViteServer({ server: { middlewareMode: true, host: '127.0.0.1', hmr: { port: Number(process.env.HMR_PORT ?? 24678) } }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: 'Richiesta non valida.' });
});
const port = Number(process.env.PORT ?? 2567), host = process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
await server.listen(port, host);
console.log(`Demonicute alpha · http://${host}:${port} · fixture tecniche`);
