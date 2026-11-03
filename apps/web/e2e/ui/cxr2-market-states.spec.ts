import { test, expect } from '../support/test';
import type {} from '../fixtures/market-view';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

for (const width of [1280, 1600]) {
  test(`CXR2 Market loading, failure and full-width bigint details ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width * 9 / 16 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/market-fixture/e2e/fixtures/market-view.html');
    const capture = async (state: string) => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
      if (process.env.CXR2_SCREENSHOTS) {
        mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, `market-fixture-${state}-${width}.png`) });
      }
    };
    await page.evaluate(() => window.__cxu3Market.scenario('loading'));
    await expect(page.getByText('Loading listings…', { exact: true })).toBeVisible();
    await expect(page.getByText('Loading your listings…', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buy', exact: true })).toHaveCount(0);
    await capture('loading');
    await page.evaluate(() => window.__cxu3Market.scenario('error'));
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeInViewport({ ratio: 1 });
    await capture('error');
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.evaluate(() => window.__cxu3Market.scenario('extreme'));
    await page.getByTestId('listing-31').getByRole('button').click();
    const max = ((1n << 256n) - 1n).toString();
    await expect(page.getByTestId('token-id')).toHaveText('#' + max);
    await expect(page.getByRole('region', { name: 'Listing details' })).toContainText('Quantity' + max);
    await expect(page.getByRole('button', { name: 'Buy', exact: true })).toBeInViewport({ ratio: 1 });
    expect(await page.locator('.market-table-wrap').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await capture('maximum-long');
    expect(await page.evaluate(() => window.__cxu3Market.calls)).toEqual([]);
    expect(errors).toEqual([]);
  });
}
