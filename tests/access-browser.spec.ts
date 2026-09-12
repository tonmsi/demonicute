import { test, expect, type Page } from '@playwright/test';

async function home(page: Page) {
  await page.goto('/');
  await expect(page.locator('.profile-name')).not.toHaveText('Ospite');
  await expect(page.locator('[data-page="create"]')).toBeVisible();
}

async function enter(page: Page, code: string) {
  await page.locator('[data-page="browse"]').click();
  await page.getByLabel('Hai un codice invito?').fill(code);
  await page.getByRole('button', { name: 'Entra con codice', exact: true }).click();
  await expect(page.locator('.room-code, .table-header .muted')).toContainText(code);
}

async function create(page: Page, bots: number) {
  // Real authenticated setup with a short, supported presentation duration.
  const result = await page.evaluate(async count => {
    const response = await fetch('/api/rooms', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Demonicute-Client': 'web' },
      body: JSON.stringify({ name: 'Accesso online QA', capacity: 2, bots: Array.from({ length: count }, () => 'easy'), isPrivate: true, paceMs: 100, maxTurns: 6, presetId: 'technical-fixtures' }),
    });
    return { ok: response.ok, data: await response.json() as { roomId: string; code: string } };
  }, bots);
  expect(result.ok).toBe(true);
  await enter(page, result.data.code);
  return result.data;
}

test('stesso browser: riprendere il posto senza refresh conferma di nuovo lo stato e sblocca il gioco', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await home(page);
  const created = await create(page, 1);
  await page.locator('[data-action="ready"]').click();
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('[data-action="draw"]')).toBeEnabled();
  const version = await page.locator('.game-actions > span').innerText();
  const identity = await page.locator('.self-station .player-station').getAttribute('data-player-id');

  const replacement = await context.newPage();
  replacement.on('pageerror', error => errors.push(error.message));
  await home(replacement);
  await enter(replacement, created.code);
  await expect(page.locator('.disconnected')).toBeVisible();
  await expect(replacement.locator('[data-action="draw"]')).toBeEnabled();
  await expect(replacement.locator('.self-station .player-station')).toHaveAttribute('data-player-id', identity!);

  await page.getByRole('button', { name: 'Rientra', exact: true }).click();
  await expect(replacement.locator('.disconnected')).toBeVisible();
  await expect(page.locator('.game-actions > span')).toHaveText(version);
  await expect(page.locator('[data-action="draw"]')).toBeEnabled();
  await expect(page.locator('.player-station')).toHaveCount(2);

  // Leaving an already closed socket must still return to the menu immediately.
  await replacement.getByRole('button', { name: 'Torna al menu', exact: true }).click();
  await expect(replacement.locator('[data-page="create"]')).toBeVisible();
  expect(await replacement.evaluate(() => sessionStorage.getItem('demonicute.room'))).toBeNull();
  const cards = await page.locator('.self-station .hand .card').count();
  await page.locator('[data-action="draw"]').click();
  await expect(page.locator('.self-station .hand .card')).toHaveCount(cards + 1);
  await page.locator('[data-action="stop"]').click();
  await expect(page.locator('.turn-chip')).toContainText('Test concluso');
  expect(errors).toEqual([]);
});

test('chiudere la lobby riporta entrambi i browser al menu senza tentativi di rientro', async ({ page, browser }) => {
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  try {
    await home(page);
    const created = await create(page, 0);
    await home(guest);
    await enter(guest, created.code);
    await expect(guest.getByRole('button', { name: 'Chiudi stanza', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Chiudi stanza', exact: true }).click();
    for (const participant of [page, guest]) {
      await expect(participant.locator('[data-page="create"]')).toBeVisible();
      await expect(participant.locator('.disconnected')).toHaveCount(0);
      expect(await participant.evaluate(() => sessionStorage.getItem('demonicute.room'))).toBeNull();
    }
  } finally { await guestContext.close(); }
});

test('sessione anonima nuova: conserva il nickname, dimentica il vecchio posto e consente una nuova stanza', async ({ page, context }) => {
  await home(page);
  await page.locator('[data-page="profile"]').click();
  await page.getByLabel('Nickname').fill('Amica online');
  await page.getByRole('button', { name: 'Salva nickname', exact: true }).click();
  await expect(page.locator('.profile-name')).toHaveText('Amica online');
  const created = await create(page, 1);
  const previousId = await page.evaluate(() => localStorage.getItem('demonicute.publicId'));
  const sessionCookie = (await context.cookies()).find(cookie => cookie.name === 'demonicute_session');
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain('demonicute_session');

  // Deleting the cookie models an expired or lost anonymous browser session.
  await context.clearCookies();
  await page.reload();
  await expect(page.locator('[data-page="create"]')).toBeVisible();
  await expect(page.locator('.profile-name')).toHaveText('Amica online');
  expect(await page.evaluate(() => localStorage.getItem('demonicute.publicId'))).not.toBe(previousId);
  expect(await page.evaluate(() => sessionStorage.getItem('demonicute.room'))).toBeNull();
  await expect(page.locator('.disconnected')).toHaveCount(0);

  // Losing the cookie while the menu remains open must also refresh the profile before creation.
  await context.clearCookies();
  await page.locator('[data-page="create"]').click();
  await page.getByLabel('Posti al tavolo').selectOption('2');
  await page.getByLabel('Bot iniziali').selectOption('1');
  await page.getByRole('button', { name: 'Crea stanza', exact: true }).click();
  await expect(page.locator('.room-code')).toBeVisible();
  await expect(page.locator('.room-code')).not.toHaveText(created.code);
  await expect(page.locator('.seat-name').filter({ hasText: '(tu)' })).toContainText('Amica online');
  await page.getByRole('button', { name: 'Chiudi stanza', exact: true }).click();
  await expect(page.locator('[data-page="create"]')).toBeVisible();
});
