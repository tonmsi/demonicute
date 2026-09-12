import { test, expect } from '@playwright/test';
import { AUTHOR_DEMONS } from '../src/content/author-demons.js';

test('Catalogo autore: 60 testi, filtri, costi certi e nomi da confermare', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.profile-name')).not.toHaveText('Ospite');
  await page.getByRole('button', { name: 'Demoni', exact: true }).click();
  const cards = page.locator('.author-demon');
  const query = page.getByRole('searchbox', { name: 'Cerca Demoni' });
  await expect(cards).toHaveCount(60);
  await expect(page.locator('[data-cost-state="matched"]')).toHaveCount(39);
  await expect(page.locator('[data-cost-state="missing"]')).toHaveCount(19);
  await expect(page.locator('[data-cost-state="unconfirmed-alias"]')).toHaveCount(2);
  await expect(page.locator('[data-demons-active]')).toHaveText('0 abilità attive verificate');
  await expect(page.locator('.demon-runtime strong').filter({ hasText: 'Non ancora giocabile' })).toHaveCount(60);
  await expect(cards.locator('img')).toHaveCount(0);
  const displayed = await cards.evaluateAll(nodes => nodes.map(node => ({
    id: (node as HTMLElement).dataset.authorDemon,
    name: node.querySelector('h3')!.textContent,
    effect: node.querySelector('.demon-effect p')!.textContent,
    notes: node.querySelector('.demon-note p')?.textContent ?? '',
  })));
  expect(displayed).toEqual(AUTHOR_DEMONS.map(demon => ({ id: demon.id, name: demon.name, effect: demon.effectRaw, notes: demon.notesRaw })));
  await page.screenshot({ path: 'artifacts/browser/author-demons-desktop.png' });

  await page.getByRole('combobox', { name: 'Elemento', exact: true }).selectOption('Acqua');
  await expect(cards).toHaveCount(12);
  await expect(page.locator('.demon-result-count')).toHaveText('12 demoni mostrati su 60');
  await page.getByRole('button', { name: 'Azzera filtri', exact: true }).click();
  await page.getByRole('combobox', { name: 'Attivazione', exact: true }).selectOption('unresolved');
  await expect(cards).toHaveCount(12);
  await query.fill('Tifone');
  await expect(cards).toHaveCount(1);
  await expect(cards.locator('.demon-timing strong')).toHaveText('A o E?');
  await expect(cards.locator('.demon-issues')).toContainText('non è stata scelta una delle alternative');
  await page.getByRole('button', { name: 'Azzera filtri', exact: true }).click();
  await query.pressSequentially('leprec');
  await expect(query).toBeFocused();
  await expect(cards).toHaveCount(2);
  await expect(cards.locator('h3')).toHaveText(['LEPRECAUNO', 'LEPRECHAUN']);
  await expect(cards.locator('.demon-element')).toHaveText(['Acqua', 'Etere']);

  await query.fill('Selkie');
  await expect(cards).toHaveCount(1);
  await expect(cards.locator('[data-demon-cost]')).toHaveText('2');
  await expect(cards.locator('.demon-cost dd')).toHaveText(['2', 'Acqua', '1']);
  await expect(cards.locator('.cost-source-type')).toContainText('ENERGIA_ACQUA');
  await query.fill('Kukegen');
  await expect(cards).toHaveCount(1);
  await expect(cards.locator('.demon-cost')).toHaveAttribute('data-cost-state', 'unconfirmed-alias');
  await expect(cards.locator('.demon-cost')).toContainText('KUKEGEN ↔ Keukegen');
  await expect(cards.locator('.demon-cost')).toContainText('nessun costo assegnato automaticamente');
  await expect(cards.locator('[data-demon-cost]')).toHaveCount(0);

  await query.fill('Stolas');
  const stolas = AUTHOR_DEMONS.find(demon => demon.name === 'STOLAS')!;
  expect(await cards.locator('.demon-note p').textContent()).toBe(stolas.notesRaw);
  expect(await cards.locator('.demon-effect p').textContent()).toBe(stolas.effectRaw);
  await page.setViewportSize({ width: 390, height: 1100 });
  await expect(page.getByRole('button', { name: 'Demoni', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/browser/author-demons-mobile.png', fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await query.fill('nessun-demone-con-questo-nome');
  await expect(cards).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Nessun demone corrisponde' })).toBeVisible();
  await page.getByRole('button', { name: 'Azzera filtri', exact: true }).first().click();
  await expect(cards).toHaveCount(60);
  await page.getByRole('button', { name: 'Carte originali', exact: true }).click();
  await expect(page.locator('.original-card')).toHaveCount(60);
  await expect(page.locator('.author-demon')).toHaveCount(0);
  expect(errors).toEqual([]);
});
