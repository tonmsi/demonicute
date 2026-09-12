import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import type { Request, Response } from 'express';
import type { SessionProfile } from '../shared/protocol.js';

interface Session extends SessionProfile { expiresAt: number }
const sessions = new Map<string, Session>();
const COOKIE = 'demonicute_session';
const TTL = 12 * 60 * 60 * 1000;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
type HeaderSource = IncomingHttpHeaders | Headers;
function header(headers: HeaderSource, key: string): string | undefined {
  const value = headers instanceof Headers ? headers.get(key) : headers[key];
  return typeof value === 'string' ? value : undefined;
}
export function sessionFromHeaders(headers: HeaderSource): Session | undefined {
  const raw = header(headers, 'cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return;
  const key = digest(raw), session = sessions.get(key);
  if (session && session.expiresAt > Date.now()) return session;
  sessions.delete(key);
}
export function ensureSession(req: Request, res: Response): Session {
  let session = sessionFromHeaders(req.headers);
  if (!session) {
    for (const [key, value] of sessions) if (value.expiresAt <= Date.now()) sessions.delete(key);
    if (sessions.size >= 5000) throw new Error('Server occupato. Riprova più tardi.');
    const token = randomBytes(32).toString('hex');
    session = { publicId: randomUUID(), nickname: 'Magista', expiresAt: Date.now() + TTL };
    sessions.set(digest(token), session);
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: TTL, path: '/' });
  }
  return session;
}
export function profile(session: Session): SessionProfile { return { publicId: session.publicId, nickname: session.nickname }; }
export function cleanName(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 32) || fallback : fallback;
}
export function publicOrigin(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const configured = env.PUBLIC_ORIGIN || env.RENDER_EXTERNAL_URL;
  if (!configured) {
    if (env.NODE_ENV === 'production') throw new Error('Imposta PUBLIC_ORIGIN con l’URL HTTPS del sito (su Render è disponibile RENDER_EXTERNAL_URL).');
    return;
  }
  try {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol) || (env.NODE_ENV === 'production' && url.protocol !== 'https:') || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new Error('PUBLIC_ORIGIN deve essere l’origine del sito, senza percorsi; in produzione serve HTTPS.'); }
}
export function originAllowed(headers: HeaderSource): boolean {
  const origin = header(headers, 'origin');
  if (!origin) return true; // CLI clients still require the unguessable session cookie.
  const configured = publicOrigin();
  if (configured) return origin === configured;
  try { const url = new URL(origin); return ['http:', 'https:'].includes(url.protocol) && url.host === header(headers, 'host'); }
  catch { return false; }
}
