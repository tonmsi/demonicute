import type { CardInstance, ChallengeModifier, ChallengeRecord, ChallengeView, GameAction, GameView, StarBreakdown } from '../shared/game.js';
import type { RoomView } from '../shared/protocol.js';
import { CARD_DEFINITIONS } from '../content/catalog.js';

const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
const signed = (amount: number): string => amount > 0 ? `+${amount}` : String(amount);
const nameOf = (game: GameView, id?: string): string => game.players.find(player => player.id === id)?.name ?? id ?? '—';
const cardName = (card?: CardInstance | null): string => card ? CARD_DEFINITIONS[card.definitionId]?.name ?? 'Carta' : 'Nessun modificatore';
function findCard(game: GameView, id: string): CardInstance | undefined {
  return [...game.limbo, ...game.discard, ...game.players.flatMap(player => [...(player.hand ?? []), ...player.piles.flat()])].find(card => card.instanceId === id);
}

export function modifierLabel(modifier?: ChallengeModifier, chosenElement?: string): string {
  if (!modifier) return 'Nessun pentagono';
  if (modifier.kind === 'numeric') return `${signed(modifier.amount)} a ogni Demone ${modifier.element}`;
  if (modifier.kind === 'zero') return `X · ${modifier.element} conta 0`;
  if (modifier.kind === 'protect') return `Giallo · ${modifier.element} protetto da X, bonus e malus`;
  if (modifier.kind === 'choice') return `${signed(modifier.amount)} ${chosenElement ?? modifier.elements.join(' oppure ')}`;
  return '−1 per Gemma · formula non definita, bloccato';
}

export function challengePentagonBadge(card: CardInstance): string {
  const definition = CARD_DEFINITIONS[card.definitionId];
  const modifier = definition?.modifier;
  if (!modifier) return definition?.starshifter ? '<span class="fixture-shifter" title="Spostastelle: scegli una modalità nella finestra del server" aria-label="Spostastelle, intervento distinto dal pentagono">↻</span>' : '';
  const short = modifier.kind === 'numeric' ? `${signed(modifier.amount)}<br>${esc(modifier.element)}` : modifier.kind === 'zero' ? `X<br>${esc(modifier.element)}` : modifier.kind === 'protect' ? esc(modifier.element) : modifier.kind === 'choice' ? `${signed(modifier.amount)}<br>${modifier.elements.map(element => esc(element)).join('/')}` : '−1 ◇<br>?';
  return `<span class="fixture-pentagon ${modifier.kind === 'protect' ? 'protected' : ''} ${modifier.kind === 'per-gem-undefined' ? 'blocked' : ''}" title="${esc(modifierLabel(modifier))}" aria-label="Pentagono: ${esc(modifierLabel(modifier))}">${short}</span>`;
}

export function challengeActionLabel(action: GameAction, game: GameView): string {
  switch (action.type) {
    case 'challengeBoss': return 'Sfida il Boss · 1 azione';
    case 'challengeMagist': return `Sfida ${nameOf(game, action.targetId)} · posta ${action.stake ?? 1} ${(action.stake ?? 1) === 1 ? 'tesoro' : 'tesori'}`;
    case 'challengePass': return 'Passa · non usare Spostastelle';
    case 'challengeShift': {
      const card = findCard(game, action.cardId);
      const steps = card ? CARD_DEFINITIONS[card.definitionId]?.starshifter?.clockwiseSteps : 1;
      const mode = action.mode === 'rotate' ? `Ruota il Boss di ${steps ?? 1} ${(steps ?? 1) === 1 ? 'lato' : 'lati'} in senso orario` : action.mode === 'refuse' ? 'Rifiuta la sfida e pesca 1 carta' : `Devia verso ${nameOf(game, action.targetId)} e pesca 1 carta`;
      return `${mode} · Spostastelle`;
    }
    case 'challengeCommit': {
      if (action.cardId === null) return 'Non usare un modificatore · conferma scelta';
      return `Impegna ${cardName(findCard(game, action.cardId))}${action.elementChoice ? ` · scegli ${action.elementChoice}` : ''}`;
    }
    case 'challengeReplace': return `Slot ${action.slot + 1} · porta in cima ${cardName(findCard(game, action.cardId))}`;
    case 'challengeReady': return 'Sono pronto · blocca scelte e sostituzioni';
    case 'challengeLoseDemon': return `Rimanda nel mazzo ${cardName(findCard(game, action.cardId))}`;
    default: return action.type;
  }
}

function actionButton(game: GameView, index: number, blocked: string, primary = false): string {
  const action = game.legalActions[index];
  return `<button class="${primary ? 'primary ' : ''}challenge-command" data-command-index="${index}" data-challenge-action="${action.type}" ${action.type === 'challengeMagist' ? `data-challenge-target="${esc(action.targetId)}" data-challenge-stake="${action.stake}"` : ''} ${blocked ? `disabled title="${esc(blocked)}"` : ''}>${esc(challengeActionLabel(action, game))}</button>`;
}
function actionGroup(game: GameView, types: GameAction['type'][], blocked: string, primary = false): string {
  return game.legalActions.map((action, index) => types.includes(action.type) ? actionButton(game, index, blocked, primary) : '').join('');
}

let priorBossKey = '';
let priorBossAngle = 0;
/** Geometry is a clearly labelled fixture, never an invented Ymir illustration. */
export function bossArena(game: GameView, roomId = ''): string {
  const boss = game.boss;
  if (!boss) return '';
  const side = boss.sides[boss.orientation];
  const n = boss.sides.length;
  const rotations = [...game.challengeHistory.flatMap(item => item.rotations), ...(game.challenge?.rotations ?? [])];
  const angle = rotations.reduce((sum, rotation) => sum + ((rotation.to - rotation.from + n) % n), 0) * 360 / n;
  const key = `${roomId}-${boss.id}-${game.events[0]?.id}-${game.events[0]?.timestamp}`;
  const from = priorBossKey === key ? priorBossAngle : angle;
  priorBossKey = key;
  priorBossAngle = angle;
  const vertices = Array.from({ length: n }, (_, index) => {
    const radians = (-index * 360 / n - 90) * Math.PI / 180;
    return `${90 + Math.cos(radians) * 57},${90 + Math.sin(radians) * 57}`;
  }).join(' ');
  return `<section class="boss-arena" aria-label="Spazio del Boss" data-boss-orientation="${boss.orientation}">
    <div class="zone-label">Il Boss <span class="test-tag">TEST</span></div>
    <div class="boss-orbit"><svg viewBox="0 0 180 180" role="img" aria-label="Boss fixture nel cerchio con pentagono. Lato attivo ${esc(side.label)}: ${side.stars} stelle, ${esc(side.element)}">
      <circle class="boss-outer-ring" cx="90" cy="90" r="82"/><circle class="boss-inner-ring" cx="90" cy="90" r="73"/>
      <g class="boss-rotor ${from !== angle ? 'turning' : ''}" style="--boss-from:${from}deg;--boss-to:${angle}deg">
        <polygon class="boss-pentagon" points="${vertices}"/>
        ${boss.sides.map((item, index) => { const radians = (-index * 360 / n - 90) * Math.PI / 180; const x = 90 + Math.cos(radians) * 70; const y = 90 + Math.sin(radians) * 70; return `<g class="boss-side-node ${index === boss.orientation ? 'selected' : ''}" data-boss-side="${index}"><circle cx="${x}" cy="${y}" r="11"/><g class="boss-label-counter ${from !== angle ? 'turning' : ''}" style="--boss-from:${-from}deg;--boss-to:${-angle}deg;transform-origin:${x}px ${y}px"><text x="${x}" y="${y + 4}" text-anchor="middle">${esc(item.label)}</text></g></g>`; }).join('')}
      </g>
      <path class="boss-fixed-pointer" d="M90 37 L85 49 L95 49 Z"/>
      <text class="boss-center-value" x="90" y="88" text-anchor="middle">${side.stars} ★</text><text class="boss-center-element" x="90" y="108" text-anchor="middle">${esc(side.element)}</text>
    </svg></div>
    <div class="boss-active-side">Lato ${esc(side.label)} · <strong>${side.stars} ★ ${esc(side.element)}</strong></div>
    <div class="boss-secondary">Secondari: ${esc(side.secondaryElements.join(', ') || 'nessuno')}<br>Valori TEST · lato attivo rivolto in alto</div>
    <ol class="boss-sides" aria-label="Valori dei lati del Boss">${boss.sides.map((item, index) => `<li class="${index === boss.orientation ? 'selected' : ''}" ${index === boss.orientation ? 'aria-current="true"' : ''}><b>${esc(item.label)}</b><span>${item.stars} ★</span><small>${esc(item.element)}</small></li>`).join('')}</ol>
    <p class="boss-source">Geometria e valori fixture. Nessun asset o passivo Ymir.</p>
  </section>`;
}

function starLine(item: StarBreakdown, label?: string): string {
  const ignored = item.ignoredChanges.length ? item.ignoredChanges.map(signed).join(', ') : item.ignoredNumeric ? signed(item.ignoredNumeric) : 'nessuno';
  return `<div class="star-breakdown"><strong>${esc(label ?? CARD_DEFINITIONS[item.definitionId]?.name ?? item.definitionId)} <span>${item.final} ★</span></strong><span>${esc(item.element)} · stampate ${item.printed}, passivo ${signed(item.passive)} → riferimento ${item.reference}</span><span>Modifiche: ${esc(item.numericChanges.length ? item.numericChanges.map(signed).join(', ') : 'nessuna')} · ${item.protected ? 'protezione gialla attiva' : item.zeroed ? 'X: azzeramento' : 'minimo 0 per Demone'}</span><span>Modifiche ignorate: ${esc(ignored)}${item.ignoredZero ? ' · X ignorata' : ''}</span></div>`;
}

function resolution(game: GameView, challenge: ChallengeView | ChallengeRecord): string {
  const result = challenge.result;
  if (!result) return '';
  const title = result.outcome === 'refused' ? 'Sfida rifiutata' : result.outcome === 'interrupted' ? 'Sfida interrotta' : result.outcome === 'tie' ? 'Parità nel confronto' : challenge.kind === 'boss' && result.outcome === 'defender-wins' ? 'Il Boss vince la sfida' : `${nameOf(game, result.winnerId)} vince la sfida`;
  return `<section class="challenge-resolution" data-challenge-result="${result.outcome}"><h4>${esc(title)}</h4><p class="hint">${challenge.phase === 'stake' && challenge.remainingDemonLosses > 0 ? 'La risoluzione della posta è ancora in corso.' : 'Esito della sfida, non vittoria della partita.'}</p>
    ${challenge.revealed.length ? `<div class="revealed-modifiers"><strong>Modificatori rivelati</strong>${challenge.revealed.map(item => `<p>${esc(item.source === 'boss' ? 'Boss' : nameOf(game, item.actorId))}: ${esc(cardName(item.card))}${item.elementChoice ? ` · alternativa ${esc(item.elementChoice)}` : ''}<br><span>${esc(modifierLabel(item.modifier, item.elementChoice))}</span></p>`).join('')}</div>` : ''}
    ${challenge.counts.map(count => `<details class="count-detail" data-challenge-section="count-${esc(challenge.id)}-${esc(count.playerId)}"><summary>${esc(nameOf(game, count.playerId))}: ${count.before} → <b>${count.after} ★</b>${challenge.participantIds.includes(count.playerId) ? '' : ' · spettatore, escluso dal confronto'}</summary>${count.demons.map(item => starLine(item)).join('') || '<p class="hint">Nessun Demone in cima.</p>'}</details>`).join('')}
    ${challenge.bossCount ? `<details class="count-detail" data-challenge-section="boss-count-${esc(challenge.id)}"><summary>Boss: ${challenge.bossCount.reference} → <b>${challenge.bossCount.final} ★</b> · ${esc(challenge.bossCount.element)}</summary>${starLine(challenge.bossCount, 'Lato attivo del Boss')}</details>` : ''}
    ${challenge.rotations.length ? `<p class="hint">Rotazioni: ${challenge.rotations.map(rotation => `${esc(rotation.source === 'boss-response' ? 'Boss' : nameOf(game, rotation.actorId))} ${rotation.from + 1}→${rotation.to + 1}${rotation.source === 'boss-response' ? ' (risposta Boss)' : ''}`).join('; ')}.</p>` : ''}
    <div class="challenge-treasures"><span>Gemme ottenute: ${result.gemsAwarded}</span><span>Gemme trasferite: ${result.gemTransfers.length}</span><span>Demoni rimandati nel mazzo: ${result.removedDemonIds.length}</span><span>Carte mano trasferite: ${result.handTransfers.reduce((total, item) => total + item.count, 0)}</span></div>
  </section>`;
}

/** This module reads only the filtered RoomView; it never infers an opponent's commitment. */
export function challengePanel(room: RoomView, blocked: string): string {
  const game = room.game;
  if (!game) return '';
  if (!game.capabilities.bossChallenges && !game.capabilities.magistDuels) return '<section class="challenge-panel base-challenges"><h3>Sfide nel laboratorio</h3><p class="hint">Questo tavolo usa il preset Base, senza sfide. Crea un tavolo “Sfide TEST” per provare Boss, duelli e scelte coperte.</p></section>';
  const active = game.challenge;
  const latest = game.challengeHistory.at(-1);
  let body = '';
  if (!active) {
    body = `<h3>Sfide TEST</h3><p class="hint">Una sfida costa 1 azione. Il duello richiede una posta dichiarata di 1 o 2 tesori.</p><div class="challenge-actions">${actionGroup(game, ['challengeBoss'], blocked, true)}</div><details data-challenge-section="declare-duel"><summary>Duello tra Magisti · scegli avversario e posta</summary><div class="challenge-actions">${actionGroup(game, ['challengeMagist'], blocked) || '<p class="hint">Nessun duello disponibile: servono turno, azione e tesori sufficienti per entrambi.</p>'}</div></details>${!game.legalActions.some(action => action.type === 'challengeBoss') && game.phase === 'playing' ? '<p class="hint">La dichiarazione al Boss sarà disponibile nel tuo turno con un’azione residua.</p>' : ''}`;
  } else {
    const phaseNames = { intervention: 'Spostastelle', preparation: 'Scelte coperte e sostituzioni', stake: 'Risoluzione della posta' };
    body = `<div class="eyebrow">${active.kind === 'boss' ? 'Sfida al Boss' : `Duello · posta ${active.stake}`}</div><h3>${phaseNames[active.phase]}</h3><p class="challenge-participants">${esc(nameOf(game, active.attackerId))} → ${esc(active.kind === 'boss' ? 'Boss' : nameOf(game, active.defenderId))}</p>`;
    if (active.phase === 'intervention') {
      body += `<p class="hint">Le modalità sono alternative. Ruotare non fa pescare; rifiutare o deviare include la pescata.</p>${active.window ? `<div class="reaction-clock" data-challenge-id="${esc(active.id)}"><span>Finestra di ${esc(nameOf(game, active.window.actorId))}</span><strong data-challenge-countdown>${(Math.max(0, active.window.expiresAt - room.gameNow) / 1000).toFixed(1)} s</strong><small data-challenge-clock-state>${room.paused ? 'In pausa' : 'Tempo attivo del server'}</small></div>` : ''}<div class="challenge-actions">${actionGroup(game, ['challengeShift', 'challengePass'], blocked) || '<p class="hint">Attendi la finestra del partecipante indicato. I comandi appaiono soltanto a chi può intervenire.</p>'}</div>`;
    }
    if (active.phase === 'preparation') {
      body += `<p class="hint">Una sola carta modificatore. Carta e alternativa restano coperte fino alla rivelazione comune. La preparazione non ha un timer.</p><ul class="commit-status">${active.participantIds.map(id => `<li><span>${esc(nameOf(game, id))}</span><strong>${active.readyIds.includes(id) ? 'Pronto · scelta coperta' : active.committedIds.includes(id) ? 'Scelta impegnata · coperta' : 'Sta preparando'}</strong></li>`).join('')}</ul>`;
      if (active.ownCommit) body += `<p class="own-commit">La tua scelta privata: <strong>${esc(active.ownCommit.cardId === null ? 'Nessun modificatore' : cardName(findCard(game, active.ownCommit.cardId)))}</strong>${active.ownCommit.elementChoice ? ` · ${esc(active.ownCommit.elementChoice)}` : ''}. ${active.readyIds.includes(room.viewerId) ? 'Le tue scelte sono bloccate: attendi gli altri partecipanti.' : 'Puoi ancora sostituire le cime prima di dichiararti pronto.'}</p>`;
      const commitActions = actionGroup(game, ['challengeCommit'], blocked);
      if (commitActions) body += `<div class="challenge-selection"><h4>1 · Impegna la tua scelta</h4><div class="challenge-actions">${commitActions}</div></div>`;
      const replacements = actionGroup(game, ['challengeReplace'], blocked);
      if (replacements) body += `<details data-challenge-section="replace-piles"><summary>Sostituisci le cime nelle tue Pile · facoltativo</summary><p class="hint">Puoi intervenire in più Pile, senza azioni e senza Entrata. Le carte restano nella stessa Pila.</p><div class="challenge-actions">${replacements}</div></details>`;
      const ready = actionGroup(game, ['challengeReady'], blocked, true);
      if (ready) body += `<div class="challenge-selection"><h4>2 · Conferma la preparazione</h4>${ready}</div>`;
      if (!active.participantIds.includes(room.viewerId)) body += '<p class="hint">Sei spettatore: non puoi impegnare un modificatore in questo confronto.</p>';
      if (active.substitutions.length) body += `<p class="hint">Sostituzioni effettuate: ${active.substitutions.map(item => `${esc(nameOf(game, item.playerId))}, Slot ${item.slot + 1}`).join('; ')}.</p>`;
    }
    if (active.phase === 'stake') body += `${resolution(game, active)}<p class="hint">Il perdente sceglie ogni cima da rimandare nel mazzo. Il vincitore non riceve il Demone e le carte sottostanti restano nella Pila.</p><div class="challenge-actions">${actionGroup(game, ['challengeLoseDemon'], blocked, true) || '<p class="hint">In attesa della scelta del perdente.</p>'}</div>`;
  }
  const history = latest ? `<details class="last-challenge" open data-challenge-section="last-${esc(latest.id)}"><summary>Ultima sfida · ${latest.kind === 'boss' ? 'Boss' : 'duello'}</summary>${resolution(game, latest)}</details>` : '';
  return `<section class="challenge-panel" data-challenge-phase="${active?.phase ?? 'idle'}">${body}${blocked ? `<p class="disabled-reason">${esc(blocked)}</p>` : ''}</section>${history}<details class="challenge-policy" data-challenge-section="challenge-policy"><summary>Convenzioni tecniche e punti sospesi</summary><ul>${game.challengePolicy.map(policy => `<li>${esc(policy)}</li>`).join('')}</ul><p>Funzioni sospese:</p><ul>${game.blockedCapabilities.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul></details>`;
}

export function updateChallengeClock(message: { gameNow: number; challengeId: string; expiresAt: number; running: boolean }): void {
  const clock = document.querySelector<HTMLElement>('.reaction-clock');
  if (!clock || clock.dataset.challengeId !== message.challengeId) return;
  const countdown = clock.querySelector<HTMLElement>('[data-challenge-countdown]');
  const state = clock.querySelector<HTMLElement>('[data-challenge-clock-state]');
  if (countdown) countdown.textContent = `${(Math.max(0, message.expiresAt - message.gameNow) / 1000).toFixed(1)} s`;
  if (state) state.textContent = message.running ? 'Tempo attivo del server' : 'Timer sospeso durante pausa o presentazione';
}
