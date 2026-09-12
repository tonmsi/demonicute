import { AUTHOR_DEMONS, type AuthorDemon } from '../content/author-demons.js';
import { AUTHOR_DEMON_COST_GAPS, AUTHOR_DEMON_COST_MATCH_SUMMARY, findAuthorDemonCost } from '../content/author-demon-costs.js';

const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
type DemonFilters = { query: string; element: string; timing: string };
/** Runtime verification is separate from author-supplied text and must be supplied explicitly. */
export type DemonRuntimeStatus = { status: 'active' | 'blocked' | 'in-progress'; reason: string };
let runtimeStatuses: Readonly<Record<string, DemonRuntimeStatus>> = {};
let filters: DemonFilters = { query: '', element: '', timing: '' };

export function setAuthorDemonRuntimeStatuses(statuses: Readonly<Record<string, DemonRuntimeStatus>>): void {
  runtimeStatuses = statuses;
}

function timingLabel(value: string): string {
  return ({ E: 'E · Entrata', A: 'A · Attivazione', P: 'P · Passivo', 'E/P': 'E/P · Entrata e passivo', unresolved: 'Da chiarire o non indicato' } as Record<string, string>)[value] ?? value;
}
function runtimeStatus(demon: AuthorDemon): string {
  const status = runtimeStatuses[demon.id];
  const label = status?.status === 'active' ? 'Abilità attiva' : 'Non ancora giocabile';
  const costReason = findAuthorDemonCost(demon.id) ? 'Costo registrato; effetto non abilitato nel motore.' : 'Costo di evocazione da definire; effetto non abilitato nel motore.';
  return `<div class="demon-runtime ${status?.status ?? 'blocked'}"><strong>${label}</strong><span>${esc(status?.reason ?? costReason)}</span></div>`;
}
function costMarkup(demon: AuthorDemon): string {
  const cost = findAuthorDemonCost(demon.id);
  if (!cost) {
    const gap = AUTHOR_DEMON_COST_GAPS.find(item => item.authorDemonId === demon.id);
    return `<section class="demon-cost cost-unresolved" data-cost-state="${gap?.status ?? 'missing'}"><h4>${gap?.status === 'unconfirmed-alias' ? 'Costo · nome da confermare' : 'Costo non disponibile'}</h4>${gap?.candidateSourceNames.length ? `<p class="demon-cost-alias">${esc(demon.name)} ↔ ${gap.candidateSourceNames.map(esc).join(', ')}</p>` : ''}<p>${esc(gap?.reason ?? 'Costo non fornito.')}</p></section>`;
  }
  const labels: Record<string, string> = { ENERGIA_ACQUA: 'Acqua', ENERGIA_ARIA: 'Aria', ENERGIA_TERRA: 'Terra', ENERGIA_ETERE: 'Etere', ENERGIA_FUOCO: 'Fuoco' };
  return `<section class="demon-cost" data-cost-state="matched"><h4>Costo dalla fonte autorizzata</h4><dl><div><dt>Costo</dt><dd data-demon-cost>${cost.costo ?? 'Non indicato'}</dd></div><div><dt>Tipo richiesto</dt><dd>${esc(cost.costoTipo ? labels[cost.costoTipo] ?? cost.costoTipo : 'Non indicato')}</dd></div><div><dt>Minimo richiesto</dt><dd>${cost.costoTipoMinimo ?? 'Non indicato'}</dd></div></dl>${cost.costoTipo ? `<p class="cost-source-type">Tipo originale: ${esc(cost.costoTipo)}</p>` : ''}<p>Fonte costi · ${esc(cost.sourceName)} · voce ${cost.source.row}. Il minimo è riportato senza interpretarne l’unità.</p></section>`;
}
function demonCard(demon: AuthorDemon): string {
  return `<article class="author-demon" data-author-demon="${esc(demon.id)}" data-demon-element="${esc(demon.element)}" aria-labelledby="${esc(demon.id)}-name">
    <div class="demon-card-heading"><span class="demon-element">${esc(demon.element)}</span><span class="demon-stars" aria-label="${demon.stars} stelle">${demon.stars} ★</span></div>
    <h3 id="${esc(demon.id)}-name">${esc(demon.name)}</h3>
    <div class="demon-source-line"><span>Catalogo autore · registrato</span><span>Riga ${demon.source.row}</span></div>
    <div class="demon-timing ${demon.timing === 'unresolved' ? 'unresolved' : ''}"><span>Attivazione nella fonte</span><strong>${esc(demon.timingRaw || 'Non indicata')}</strong></div>
    ${costMarkup(demon)}
    <div class="demon-effect"><h4>Testo abilità dell’autore</h4><p>${esc(demon.effectRaw)}</p></div>
    ${demon.notesRaw ? `<div class="demon-note"><h4>Nota originale</h4><p>${esc(demon.notesRaw)}</p></div>` : ''}
    ${demon.issues.length ? `<div class="demon-issues"><h4>Da chiarire</h4><ul>${demon.issues.map(issue => `<li>${esc(issue.message)}</li>`).join('')}</ul></div>` : ''}
    ${runtimeStatus(demon)}
    <p class="demon-missing">Pentagono e illustrazione non forniti in questa lista.</p>
  </article>`;
}
function matchingDemons(): readonly AuthorDemon[] {
  const terms = filters.query.toLocaleLowerCase('it').trim().split(/\s+/).filter(Boolean);
  return AUTHOR_DEMONS.filter(demon => {
    const haystack = [demon.name, demon.element, demon.effectRaw, demon.notesRaw, demon.timingRaw].join(' ').toLocaleLowerCase('it');
    return (!filters.element || demon.element === filters.element) && (!filters.timing || demon.timing === filters.timing) && terms.every(term => haystack.includes(term));
  });
}
function resultsMarkup(): string {
  const selected = matchingDemons();
  return `<p class="demon-result-count" role="status" aria-live="polite">${selected.length} ${selected.length === 1 ? 'demone mostrato' : 'demoni mostrati'} su ${AUTHOR_DEMONS.length}</p><div class="author-demon-grid">${selected.map(demonCard).join('') || '<div class="panel demon-no-results"><h3>Nessun demone corrisponde</h3><p class="hint">Prova un altro nome o testo, oppure azzera i filtri.</p><button data-action="reset-demon-filters">Azzera filtri</button></div>'}</div>`;
}
export function authorDemonsPage(): string {
  const elements = [...new Set(AUTHOR_DEMONS.map(demon => demon.element))].sort((a, b) => a.localeCompare(b, 'it'));
  const active = AUTHOR_DEMONS.filter(demon => runtimeStatuses[demon.id]?.status === 'active').length;
  return `<main class="page author-demons-page"><div class="page-head"><div><div class="eyebrow">Demonicute / catalogo dell’autore</div><h2>Demoni</h2><p class="muted">La lista consegnata dall’autore il 10 settembre 2026, con testi e note conservati.</p></div><button class="quiet" data-action="home">← Indietro</button></div>
    <section class="panel demon-catalog-intro"><p><strong>${AUTHOR_DEMONS.length} demoni registrati</strong> · ${elements.length} elementi · <span data-demons-active>${active} abilità attive verificate</span></p><p class="demon-cost-summary"><strong>${AUTHOR_DEMON_COST_MATCH_SUMMARY.matched} costi associati</strong> · ${AUTHOR_DEMON_COST_MATCH_SUMMARY.missing} assenti · ${AUTHOR_DEMON_COST_MATCH_SUMMARY.unconfirmedAliases} nomi da confermare</p><p class="hint">Per questi Demoni prevale la lista dell’autore: nomi, elementi, stelle, attivazioni, note e testi sono conservati. La fonte dei costi aggiunge soltanto costo e requisiti, senza sostituire la lista. La registrazione nel catalogo e l’attivazione nel motore sono separate; le carte del tavolo restano TEST.</p><p class="hint">E: Entrata · A: Attivazione · P: Passivo. Le indicazioni dubbie rimangono visibili. La fonte dei costi non specifica se il requisito minimo conti carte o unità di energia.</p></section>
    <div class="demon-filters" role="search" aria-label="Cerca nel catalogo Demoni"><label class="field demon-search">Cerca Demoni<input type="search" data-demon-filter="query" value="${esc(filters.query)}" placeholder="Nome, abilità o nota…" autocomplete="off" /></label><label class="field">Elemento<select data-demon-filter="element"><option value="">Tutti gli elementi</option>${elements.map(element => `<option value="${esc(element)}" ${filters.element === element ? 'selected' : ''}>${esc(element)}</option>`).join('')}</select></label><label class="field">Attivazione<select data-demon-filter="timing"><option value="">Tutte le attivazioni</option>${['E', 'A', 'P', 'E/P', 'unresolved'].map(timing => `<option value="${timing}" ${filters.timing === timing ? 'selected' : ''}>${timingLabel(timing)}</option>`).join('')}</select></label><button class="quiet small" data-action="reset-demon-filters">Azzera filtri</button></div>
    <div data-author-demon-results>${resultsMarkup()}</div>
  </main>`;
}
export function handleAuthorDemonFilter(event: Event): void {
  const input = event.target as HTMLInputElement | HTMLSelectElement;
  const field = input.dataset?.demonFilter;
  if (field !== 'query' && field !== 'element' && field !== 'timing') return;
  filters[field] = input.value;
  const results = document.querySelector('[data-author-demon-results]');
  if (results) results.innerHTML = resultsMarkup();
}
export function resetAuthorDemonFilters(): void {
  filters = { query: '', element: '', timing: '' };
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-demon-filter]').forEach(input => { input.value = ''; });
  const results = document.querySelector('[data-author-demon-results]');
  if (results) results.innerHTML = resultsMarkup();
}
