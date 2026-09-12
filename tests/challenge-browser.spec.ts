import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });

async function openHome(page: Page, nickname: string) {
  await page.goto('/');
  await expect(page.locator('[data-page="create"]')).toBeVisible();
  await expect(page.locator('.profile-name')).not.toHaveText('Ospite');
  const response = await page.evaluate(async value => {
    const request = await fetch('/api/session', { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Demonicute-Client': 'web' }, body: JSON.stringify({ nickname: value }) });
    return { ok: request.ok, status: request.status };
  }, nickname);
  expect(response.ok, `Set QA profile (${response.status})`).toBe(true);
  await page.reload();
  await expect(page.locator('.profile-name')).toHaveText(nickname);
}

async function enterCode(page: Page, code: string) {
  await page.locator('[data-page="browse"]').click();
  await page.getByLabel('Hai un codice invito?').fill(code);
  await page.getByRole('button', { name: 'Entra con codice', exact: true }).click();
  await expect(page.locator('.room-code')).toHaveText(code);
}

async function createFastRoom(page: Page, capacity: number, bots: number, name: string) {
  // Only room setup uses the public API. Every gameplay action below uses the real UI.
  // 100 ms is an accepted server presentation policy; the client still narrates/acks events.
  const created = await page.evaluate(async options => {
    const response = await fetch('/api/rooms', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Demonicute-Client': 'web' }, body: JSON.stringify(options) });
    return { ok: response.ok, status: response.status, body: await response.json() };
  }, { name, capacity, bots: Array.from({ length: bots }, () => 'easy'), isPrivate: true, paceMs: 100, maxTurns: 30, presetId: 'challenge-fixtures' });
  expect(created.ok, JSON.stringify(created.body)).toBe(true);
  await enterCode(page, created.body.code);
  return created.body as { roomId: string; code: string };
}

async function start(page: Page, guest?: Page) {
  await page.locator('[data-action="ready"]').click();
  if (guest) await guest.locator('[data-action="ready"]').click();
  await expect(page.locator('[data-action="start"]')).toBeEnabled();
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('.boss-arena')).toBeVisible();
  await expect(page.locator('.challenge-panel [data-challenge-action="challengeBoss"]')).toBeEnabled();
}

async function command(page: Page, type: string, text?: string) {
  let button = page.locator(`.challenge-panel [data-challenge-action="${type}"]`);
  if (text) button = button.filter({ hasText: text });
  try { await expect(button.first()).toBeEnabled({ timeout: 25_000 }); }
  catch (error) {
    await page.screenshot({ path: `artifacts/browser/challenge-failed-${type}.png`, fullPage: true });
    console.log('Challenge command unavailable:', type, await page.locator('.challenge-panel').innerText());
    throw error;
  }
  await button.first().click();
}

async function assertBossLayout(page: Page, capacity: number, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await expect(page.locator('.boss-side-node')).toHaveCount(5);
  await expect(page.locator('.boss-orbit svg polygon')).toHaveCount(1);
  const vertexCount = await page.locator('.boss-pentagon').getAttribute('points');
  expect(vertexCount?.trim().split(/\s+/)).toHaveLength(5);
  await expect(page.locator('.player-station')).toHaveCount(capacity);
  await expect(page.locator('.limbo .card')).toHaveCount(5);
  const boxes = await Promise.all([page.locator('.boss-arena').boundingBox(), page.locator('.limbo').boundingBox(), page.locator('.self-station').boundingBox()]);
  const [boss, limbo, own] = boxes;
  expect(boss).not.toBeNull(); expect(limbo).not.toBeNull(); expect(own).not.toBeNull();
  expect(boss!.x + boss!.width).toBeLessThanOrEqual(limbo!.x);
  expect(own!.y).toBeGreaterThanOrEqual(limbo!.y + limbo!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const cards = await page.locator('.limbo .card').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { left: box.left, right: box.right, top: box.top, bottom: box.bottom }; }));
  for (let index = 1; index < cards.length; index++) expect(cards[index - 1].right).toBeLessThanOrEqual(cards[index].left + 0.5);
  await page.screenshot({ path: `artifacts/browser/challenge-table-${capacity}-${width}.png`, fullPage: true });
}

test('Boss e duello: rotazione reale, scelte coperte, rientro e posta mista scelta dal perdente', async ({ page, browser }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const guestContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const guest = await guestContext.newPage();
  guest.on('pageerror', error => errors.push(error.message));
  try {
    await openHome(page, 'Host Sfide QA');
    await page.locator('[data-page="create"]').click();
    await expect(page.locator('select[name="presetId"]')).toHaveValue('challenge-fixtures');
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    const created = await createFastRoom(page, 2, 0, 'Sfide due browser QA');
    await openHome(guest, 'Ospite Sfide QA');
    await enterCode(guest, created.code);
    await start(page, guest);
    await assertBossLayout(page, 2, 1440);
    await assertBossLayout(page, 2, 1100);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('.boss-arena')).toHaveAttribute('data-boss-orientation', '0');
    await expect(page.locator('.self-station .hand .card')).toHaveCount(5);
    await expect(guest.locator('.self-station .hand .card')).toHaveCount(5);
    await page.screenshot({ path: 'artifacts/browser/challenge-boss-before.png', fullPage: true });

    await command(page, 'challengeBoss');
    await expect(page.locator('.challenge-panel')).toHaveAttribute('data-challenge-phase', 'intervention');
    await expect(page.locator('.reaction-clock')).toContainText('Host Sfide QA');
    await expect(page.locator('[data-challenge-countdown]')).toContainText('s');
    await expect(guest.locator('.challenge-panel [data-challenge-action="challengeCommit"]')).toHaveCount(0);
    await command(page, 'challengeShift', 'Ruota il Boss');
    await expect(page.locator('.boss-arena')).toHaveAttribute('data-boss-orientation', '1');
    await expect(guest.locator('.boss-arena')).toHaveAttribute('data-boss-orientation', '1');
    await expect(page.locator('.boss-active-side')).toContainText('Lato II');
    await expect(page.locator('.boss-active-side')).toContainText('6 ★ Fuoco');
    await expect(page.locator('.boss-rotor')).toHaveAttribute('style', /--boss-to:72deg/);
    await expect.poll(async () => page.locator('.boss-side-node').evaluateAll(nodes => {
      const selected = nodes.find(node => node.classList.contains('selected'))!.getBoundingClientRect();
      return nodes.filter(node => !node.classList.contains('selected')).every(node => selected.y < node.getBoundingClientRect().y);
    })).toBe(true); // The selected side actually rotates to the fixed top pointer.
    await expect(page.locator('.self-station .hand .card')).toHaveCount(4); // Rotation discards but does not draw.
    await expect(page.locator('.challenge-panel')).toHaveAttribute('data-challenge-phase', 'preparation');
    await expect(page.locator('.reaction-clock')).toHaveCount(0);
    await page.screenshot({ path: 'artifacts/browser/challenge-boss-rotated.png', fullPage: true });

    await command(page, 'challengeCommit', 'Impegna +1 Terra · fixture');
    await expect(page.locator('.own-commit')).toContainText('+1 Terra');
    await expect(guest.locator('.challenge-panel .own-commit')).toHaveCount(0);
    await expect(guest.locator('.challenge-panel .revealed-modifiers')).toHaveCount(0);
    await command(page, 'challengeReady');
    await expect(page.locator('.last-challenge')).toContainText('Il Boss vince la sfida');
    await expect(page.locator('.last-challenge')).not.toContainText('— vince');
    await expect(page.locator('.last-challenge')).toContainText('Gemme ottenute: 0');
    await expect(page.locator('.last-challenge')).toContainText('Host Sfide QA: 5 → 4 ★');
    await expect(page.locator('.last-challenge')).toContainText('spettatore, escluso dal confronto');
    await page.locator('.last-challenge .count-detail').first().locator('summary').click();
    await expect(page.locator('.last-challenge .star-breakdown').first()).toBeVisible();
    await expect(page.locator('.last-challenge')).toContainText('Modifiche ignorate');
    await expect(page.locator('.action-panel > .hint').first()).toHaveText('1 / 2 azioni disponibili');
    await page.screenshot({ path: 'artifacts/browser/challenge-boss-result.png', fullPage: true });

    // Declare the stake before any secret decision. The guest acts outside the host's turn.
    await page.locator('[data-challenge-section="declare-duel"] > summary').click();
    await command(page, 'challengeMagist', 'posta 2 tesori');
    await expect(page.locator('.challenge-panel')).toHaveAttribute('data-challenge-phase', 'preparation');
    await expect(guest.locator('.challenge-panel')).toHaveAttribute('data-challenge-phase', 'preparation');
    await expect(page.locator('.action-panel > .hint').first()).toHaveText('0 / 2 azioni disponibili');

    await page.locator('[data-challenge-section="replace-piles"] > summary').click();
    const handBeforeReplacements = await page.locator('.self-station .hand .card').count();
    await command(page, 'challengeReplace', 'Slot 1');
    await command(page, 'challengeReplace', 'Slot 2');
    await expect(page.locator('.self-station .hand .card')).toHaveCount(handBeforeReplacements);
    await expect(page.locator('.action-panel > .hint').first()).toHaveText('0 / 2 azioni disponibili');
    await expect(page.locator('.challenge-panel')).toContainText('Sostituzioni effettuate: Host Sfide QA, Slot 1; Host Sfide QA, Slot 2');
    await guest.locator('[data-challenge-section="replace-piles"] > summary').click();
    await command(guest, 'challengeReplace', 'Slot 1');
    await command(guest, 'challengeCommit', 'scegli Fuoco');
    await expect(guest.locator('.own-commit')).toContainText('Fuoco');
    await expect(page.locator('.challenge-panel .own-commit')).toHaveCount(0);
    await expect(page.locator('.challenge-panel .revealed-modifiers')).toHaveCount(0);
    await expect(page.locator('.commit-status')).toContainText('Ospite Sfide QA');

    await guest.reload();
    await expect(guest.locator('.challenge-panel')).toHaveAttribute('data-challenge-phase', 'preparation');
    await expect(guest.locator('.own-commit')).toContainText('Fuoco');
    await expect(guest.locator('.challenge-panel [data-challenge-action="challengeCommit"]')).toHaveCount(0);
    await expect(page.locator('.challenge-panel .own-commit')).toHaveCount(0);
    await guest.screenshot({ path: 'artifacts/browser/challenge-secret-reconnected.png', fullPage: true });
    await command(page, 'challengeCommit', 'Impegna +1 Terra · fixture');
    await command(page, 'challengeReady');
    await expect(page.locator('.own-commit')).toContainText('Le tue scelte sono bloccate');
    await expect(page.locator('.challenge-panel [data-challenge-action="challengeReplace"]')).toHaveCount(0);
    await command(guest, 'challengeReady');

    await expect(guest.locator('.challenge-panel')).toHaveAttribute('data-challenge-phase', 'stake');
    await expect(page.locator('.challenge-panel')).toContainText('Host Sfide QA vince la sfida');
    await expect(guest.locator('.challenge-panel [data-challenge-action="challengeLoseDemon"]')).toHaveCount(2);
    await expect(page.locator('.challenge-panel [data-challenge-action="challengeLoseDemon"]')).toHaveCount(0);
    await expect(guest.locator('.self-station .gem-count')).toHaveText('◇ 0');
    await expect(page.locator('.self-station .gem-count')).toHaveText('◇ 2');
    await command(guest, 'challengeLoseDemon', 'Demone Fuoco');
    await expect(guest.locator('.self-station .pile[data-pile-slot="0"] .pile-count').last()).toHaveText('1 / 3 carte');
    await expect(page.locator('.self-station .pile[data-pile-slot="0"] .pile-count').last()).toHaveText('2 / 3 carte');
    await expect(page.locator('.self-station .pile[data-pile-slot="1"] .pile-count').last()).toHaveText('2 / 3 carte');
    await expect(page.locator('.last-challenge')).toContainText('Gemme trasferite: 1');
    await expect(page.locator('.last-challenge')).toContainText('Demoni rimandati nel mazzo: 1');
    await expect(page.locator('.turn-chip')).not.toContainText('Test concluso');
    const narrativeBox = await page.locator('.narrative').boundingBox();
    const challengeBox = await page.locator('.challenge-panel').boundingBox();
    expect(narrativeBox!.y + narrativeBox!.height).toBeLessThanOrEqual(challengeBox!.y); // Narration never covers the result or controls after scrolling.
    await page.screenshot({ path: 'artifacts/browser/challenge-duel-stake-complete.png', fullPage: true });
    await page.locator('[data-action="stop"]').click();
    await expect(page.locator('.turn-chip')).toContainText('Test concluso');
    await expect(guest.locator('.turn-chip')).toContainText('Test concluso');
    expect(errors).toEqual([]);
  } finally { await guestContext.close(); }
});

for (const capacity of [3, 4, 5]) test(`Boss e Limbo a ${capacity} posti: layout reale 1440 e 1100 pixel`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openHome(page, `Layout Sfide ${capacity}`);
  await createFastRoom(page, capacity, capacity - 1, `Layout Boss ${capacity} QA`);
  await start(page);
  await assertBossLayout(page, capacity, 1440);
  await assertBossLayout(page, capacity, 1100);
  const hand = page.locator('.hand');
  expect(await hand.locator('.card').count()).toBe(5);
  await expect(page.locator('.opponents .hand-hidden')).toHaveCount(capacity - 1);
  await page.locator('[data-action="stop"]').click();
  await expect(page.locator('.turn-chip')).toContainText('Test concluso');
  expect(errors).toEqual([]);
});
