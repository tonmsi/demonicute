import { originAllowed, sessionFromHeaders } from './auth.js';
import { rooms } from './room.js';

/** Technical abuse limits, not game rules. Never trust client-supplied IP headers. */
export class RequestBudget {
  private entries = new Map<string, { start: number; count: number }>();
  constructor(private limit: number, private windowMs = 60000) {}
  take(key: string, now = Date.now()): boolean {
    const old = this.entries.get(key);
    if (!old || now - old.start >= this.windowMs) {
      for (const [id, entry] of this.entries) if (now - entry.start >= this.windowMs) this.entries.delete(id);
      if (this.entries.size >= 10000) return false;
      this.entries.set(key, { start: now, count: 1 });
      return true;
    }
    return ++old.count <= this.limit;
  }
}

const matchmakingBudget = new RequestBudget(30);
const rejection = (status: number, error: string) => Response.json({ code: status, error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Colyseus routes bypass Express; protect reservations before they consume slots. */
export async function guardMatchmaking(request: Request): Promise<Request | Response | undefined> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/matchmake/')) return;
  if (!originAllowed(request.headers)) return rejection(403, 'Origine non consentita.');
  const session = sessionFromHeaders(request.headers);
  if (!session) return rejection(401, 'Sessione scaduta. Riapri il menu.');
  if (!matchmakingBudget.take(session.publicId)) return rejection(429, 'Troppi tentativi di ingresso. Riprova tra un minuto.');
  const match = /^\/matchmake\/joinById\/([^/]+)$/.exec(path);
  if (!match || request.method !== 'POST') return rejection(403, 'Crea e cerca le stanze dal menu.');
  const room = rooms.get(match[1]);
  if (!room) return rejection(404, 'Stanza non trovata. Controlla il codice.');
  try { room.checkAdmission(session.publicId); }
  catch (error) { return rejection(403, error instanceof Error ? error.message : 'Accesso non consentito.'); }

  // Count streamed bytes too: Content-Length alone does not bound chunked requests.
  if (Number(request.headers.get('content-length')) > 8192) return rejection(413, 'Richiesta troppo grande.');
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8192) { void reader.cancel(); return rejection(413, 'Richiesta troppo grande.'); }
        chunks.push(value);
      }
    } catch { return rejection(400, 'Richiesta non valida.'); }
    finally { reader.releaseLock(); }
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new Request(request.url, { method: request.method, headers: request.headers, body });
}
