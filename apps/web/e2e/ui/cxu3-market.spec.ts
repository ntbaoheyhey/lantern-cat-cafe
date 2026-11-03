import { test, expect, type Page } from '../support/test';
import type {} from '../fixtures/market-view';
import fs from 'node:fs';
import path from 'node:path';

async function geometry(page: Page) {
  const issues = await page.locator('.market').evaluate(root => {
    const bad: string[] = [];
    for (const node of root.querySelectorAll<HTMLElement>('button,input,select,a')) {
      const rect = node.getBoundingClientRect(); if (!rect.width || !rect.height) continue;
      if (rect.left < 0 || rect.top < 0 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) bad.push(node.textContent ?? node.tagName);
    }
    if (document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight) bad.push('document scroll');
    return bad;
  });
  expect(issues).toEqual([]);
}
async function screenshot(page: Page, name: string) {
  if (!process.env.CXU3_SCREENSHOTS) return;
  const dir = path.resolve(process.env.CXU3_SCREENSHOTS); fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name + '.png') });
}
for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  test(`CXU3 real MarketView with mocked wallet callbacks ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors: string[] = []; const writes: string[] = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.method() + ' ' + new URL(request.url()).pathname); });
    await page.goto('/market-fixture/e2e/fixtures/market-view.html');
    await expect(page.getByTestId('market-fixture-disclaimer')).toBeVisible(); await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => ['14px "DM Sans"', '700 14px "Pixelify Sans"', '500 14px "JetBrains Mono"'].every(font => document.fonts.check(font)))).toBe(true);
    const table = page.getByRole('table', { name: 'Relic market listings' });
    await expect(table.getByRole('row')).toHaveCount(4); await geometry(page); await screenshot(page, `market-inspect-${size.width}`);
    const sort = page.getByRole('button', { name: 'Sort by quantity' }); await sort.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
    await expect(table.getByRole('row').nth(1)).toHaveAttribute('data-testid', 'listing-9');
    await page.getByRole('group', { name: 'Filter listings' }).getByRole('button', { name: 'Rare', exact: true }).click(); await expect(table.getByRole('row')).toHaveCount(2);
    const row = page.getByTestId('listing-7'); await row.getByRole('button').focus(); await page.keyboard.press('Enter');
    const detail = page.getByRole('region', { name: 'Listing details' }); await expect(detail).toContainText('Quantity1');
    await expect(row.getByRole('button', { name: 'Buy', exact: true })).toHaveCount(0);
    await detail.getByRole('button', { name: 'Buy', exact: true }).click();
    expect(await page.evaluate(() => window.__cxu3Market.calls)).toEqual([{ kind: 'buy', id: '7', amount: '1', price: '50000000000000000' }]);
    await page.getByRole('button', { name: 'Sell a Relic', exact: true }).click();
    await page.getByLabel('Relic', { exact: true }).selectOption('1'); await page.getByLabel('Amount', { exact: true }).fill('2'); await page.getByLabel('Price (AVAX)', { exact: true }).fill('0.25');
    await geometry(page); await screenshot(page, `market-sell-${size.width}`); await page.getByRole('button', { name: 'List', exact: true }).click();
    expect(await page.evaluate(() => window.__cxu3Market.calls.at(-1))).toEqual({ kind: 'list', id: '1', amount: '2', price: '0.25' });
    await page.getByRole('group', { name: 'Filter listings' }).getByRole('button', { name: 'Your listings', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect listing' }).click();
    await detail.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await page.evaluate(() => window.__cxu3Market.calls.at(-1))).toEqual({ kind: 'cancel', id: '9', amount: '2', price: '250000000000000000' });
    await page.evaluate(() => window.__cxu3Market.scenario('error')); await expect(page.getByRole('alert')).toContainText("couldn't read");
    await expect(page.getByRole('button', { name: 'Buy', exact: true })).toHaveCount(0); await geometry(page);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByRole('group', { name: 'Filter listings' }).getByRole('button', { name: 'All Relics', exact: true }).click(); await page.evaluate(() => window.__cxu3Market.scenario('empty'));
    await expect(page.getByTestId('listings-empty')).toContainText('No Relics for sale'); await geometry(page);
    // The original empty-shelf icon lives in CSS, so file-level asset checks alone miss it.
    const originalMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 2h8v2H4V2zm-2 3h12v9H2V5zm2 2v5h8V7H4z'/%3E%3C/svg%3E")`;
    for (const id of ['listings-empty', 'relics-empty']) {
      const mask = await page.getByTestId(id).evaluate(node => getComputedStyle(node, '::before').maskImage);
      expect(mask).toBe(originalMask);
    }
    await screenshot(page, `market-empty-${size.width}`);
    await page.evaluate(() => window.__cxu3Market.scenario('loading'));
    await expect(page.getByRole('status').filter({ hasText: 'Loading listings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buy', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Sell a Relic', exact: true }).click();
    await expect(page.getByRole('button', { name: 'List', exact: true })).toBeDisabled();
    expect(writes).toEqual([]); expect(errors).toEqual([]);
  });
}
