import { test, expect, type Page } from '@playwright/test';

async function home(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-page="create"]')).toBeVisible();
  await expect(page.locator('.profile-name')).not.toHaveText('Ospite');
}
async function create(page: Page, capacity: number, bots: number, name: string) {
  await page.locator('[data-page="create"]').click();
  await page.getByLabel('Laboratorio di regole').selectOption('technical-fixtures');
  await page.getByLabel('Nome della stanza').fill(name);
  await page.getByLabel('Posti al tavolo').selectOption(String(capacity));
  await page.getByLabel('Bot iniziali').selectOption(String(bots));
  await page.getByLabel('Tempo di presentazione').selectOption('1500');
  await page.getByLabel('Limite tecnico di turni').fill('6');
  await page.getByRole('button', { name: 'Crea stanza', exact: true }).click();
  await expect(page.locator('.room-code')).toBeVisible();
}
test('menu, profilo persistente e zoom di carte originali', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await home(page);
  await page.screenshot({ path: 'artifacts/browser/home.png', fullPage: true });
  await page.locator('[data-page="profile"]').click();
  await page.getByLabel('Nickname').fill('Tomma QA');
  await page.getByRole('button', { name: 'Salva nickname' }).click();
  await expect(page.locator('.profile-name')).toHaveText('Tomma QA');
  await page.reload(); await expect(page.locator('.profile-name')).toHaveText('Tomma QA');
  await page.getByRole('button', { name: 'Carte originali', exact: true }).click();
  await expect(page.locator('.original-card')).toHaveCount(60);
  await expect.poll(() => page.locator('.original-card img').evaluateAll((nodes: HTMLImageElement[]) => nodes.slice(0, 4).every(node => node.complete && node.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: 'artifacts/browser/gallery.png' });
  await page.locator('.original-card').filter({ hasText: 'Succo di demone' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const image = page.locator('.original-zoom');
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: 'artifacts/browser/original-zoom.png' });
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('due browser e un bot: mosse vere, zoom separato, sincronizzazione e refresh', async ({ page, browser }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const otherContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const guest = await otherContext.newPage();
  guest.on('pageerror', e => errors.push(e.message));
  try {
    await home(page); await create(page, 3, 1, 'Tre al tavolo');
    const code = (await page.locator('.room-code').textContent())!.trim();
    await home(guest); await guest.locator('[data-page="browse"]').click();
    await guest.getByLabel('Hai un codice invito?').fill(code);
    await guest.getByRole('button', { name: 'Entra con codice' }).click();
    await expect(guest.locator('.room-code')).toHaveText(code);
    await page.getByRole('button', { name: 'Sono pronto', exact: true }).click();
    await guest.getByRole('button', { name: 'Sono pronto', exact: true }).click();
    await page.getByRole('button', { name: 'Avvia partita', exact: true }).click();
    await expect(page.locator('.limbo .card')).toHaveCount(5);
    await expect(guest.locator('.limbo .card')).toHaveCount(5);
    await expect(page.locator('.self-station .hand .card')).toHaveCount(5);
    await expect(guest.locator('.self-station .hand .card')).toHaveCount(5);
    await expect(page.locator('[data-action="draw"]')).toBeEnabled();
    await expect(page.locator('.opponents .hand-hidden')).toHaveCount(2);
    const hostId = await page.locator('.self-station .player-station').getAttribute('data-player-id');
    const hostOthers = await page.locator('.opponents .player-station').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-player-id')));
    const seatOrder = [hostId, ...hostOthers];
    const guestId = await guest.locator('.self-station .player-station').getAttribute('data-player-id');
    const guestIndex = seatOrder.indexOf(guestId);
    expect(guestIndex).toBeGreaterThan(0);
    expect(await guest.locator('.opponents .player-station').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-player-id'))))
      .toEqual([...seatOrder.slice(guestIndex + 1), ...seatOrder.slice(0, guestIndex)]);
    const versionText = await page.locator('.game-actions > span').textContent();
    await page.locator('.limbo .card').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.game-actions > span')).toHaveText(versionText!);
    await page.screenshot({ path: 'artifacts/browser/fixture-zoom.png' });
    await page.locator('[data-command-index]').first().click();
    await expect(page.locator('.self-station .pile.has-card')).toHaveCount(1);
    await expect(guest.locator('.opponents .pile.has-card')).toHaveCount(1);
    await expect(page.locator('[data-action="draw"]')).toBeEnabled();
    await page.screenshot({ path: 'artifacts/browser/table-3.png', fullPage: true });
    const cardCount = await page.locator('.self-station .hand .card').count();
    await page.locator('[data-action="draw"]').click();
    await expect(page.locator('.self-station .hand .card')).toHaveCount(cardCount + 1);
    await expect(page.locator('[data-action="end-turn"]')).toBeEnabled();
    const currentVersion = await page.locator('.game-actions > span').textContent();
    await page.reload();
    await expect(page.locator('.game-actions > span')).toHaveText(currentVersion!);
    await expect(page.locator('.self-station .hand .card')).toHaveCount(cardCount + 1);
    await expect(page.locator('[data-action="end-turn"]')).toBeEnabled();
    await page.locator('[data-action="end-turn"]').click();
    // Bot is between the host and guest in the logical seat order.
    await expect(guest.locator('[data-action="draw"]')).toBeEnabled({ timeout: 22000 });
    await guest.screenshot({ path: 'artifacts/browser/guest-perspective.png', fullPage: true });
    await expect(page.locator('.base-challenges')).toContainText('senza sfide');
    await expect(page.locator('[data-challenge-action="challengeBoss"]')).toHaveCount(0);
    await page.locator('[data-action="stop"]').click();
    await expect(page.locator('.turn-chip')).toContainText('Test concluso');
    await expect(guest.locator('.turn-chip')).toContainText('Test concluso');
    expect(errors).toEqual([]);
  } finally { await otherContext.close(); }
});

for (const capacity of [2, 4, 5]) test(`tavolo con ${capacity} posti, Limbo espanso e ridimensionamento`, async ({ page }) => {
  await home(page); await create(page, capacity, capacity - 1, `Layout ${capacity}`);
  await page.locator('[data-action="ready"]').click(); await page.locator('[data-action="start"]').click();
  await expect(page.locator('.player-station')).toHaveCount(capacity);
  await expect(page.locator('[data-action="draw"]')).toBeEnabled();
  await page.screenshot({ path: `artifacts/browser/table-${capacity}.png`, fullPage: true });
  const self = await page.locator('.self-station').boundingBox(), limbo = await page.locator('.limbo').boundingBox();
  expect(self!.y).toBeGreaterThan(limbo!.y);
  await page.getByLabel('Espandi il Limbo').click();
  await expect(page.getByRole('dialog', { name: 'Limbo espanso' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1100, height: 850 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/browser/table-${capacity}-1100.png`, fullPage: true });
  if (capacity === 5) {
    // Visual stress fixture only: duplicate DOM cards without changing authoritative game state.
    await page.locator('.hand').evaluate(node => {
      while (node.children.length < 20) node.append(node.children[0].cloneNode(true));
      node.scrollLeft = 0;
    });
    const hand = page.locator('.hand');
    expect(await hand.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
    const first = await hand.locator('.card').first().boundingBox();
    const bounds = await hand.boundingBox();
    expect(first!.x).toBeGreaterThanOrEqual(bounds!.x);
    await hand.evaluate(node => { node.scrollLeft = node.scrollWidth; });
    const last = await hand.locator('.card').last().boundingBox();
    expect(last!.x + last!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
    await page.screenshot({ path: 'artifacts/browser/hand-20-visual-fixture.png', fullPage: true });
  }
  await page.locator('[data-action="stop"]').click();
  await expect(page.locator('.turn-chip')).toContainText('Test concluso');
});
