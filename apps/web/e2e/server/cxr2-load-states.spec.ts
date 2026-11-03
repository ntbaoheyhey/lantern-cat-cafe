import { test, expect, control } from '../support/server-fixture';
import type { Session } from '../../src/wallet/session';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

for (const width of [1280, 1600]) for (const screen of ['home', 'bag', 'map', 'forge', 'market', 'hero', 'help']) {
  test(`CXR2 ${screen} loading, failed load and recovery ${width}`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: width * 9 / 16 });
    const session = await control<Session>(request, 'session', { kind: 'stocked' });
    await page.addInitScript(session => {
      sessionStorage.setItem('taskbar-hero.session', JSON.stringify(session));
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, session);
    const unexpected: string[] = [];
    page.on('pageerror', error => unexpected.push(error.message));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      // The single intentional HTTP503 is a network test response, not an app console error.
      if (message.location().url.endsWith('/v2-state') && message.text().includes('503')) return;
      unexpected.push(message.text());
    });
    let release!: () => void;
    const held = new Promise<void>(done => { release = done; });
    let recover = false;
    await page.route('**/functions/v1/v2-state', async route => {
      if (route.request().method() !== 'POST' || recover) return route.continue();
      await held;
      return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'server_busy' }) });
    });
    const capture = async (state: string) => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
      if (process.env.CXR2_SCREENSHOTS) {
        mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, `${screen}-${state}-${width}.png`) });
      }
    };
    try {
      await page.goto('/#' + screen);
      await expect(page.getByRole('status', { name: 'Loading game' })).toBeVisible();
      await capture('loading');
      const failed = page.waitForResponse(response => response.url().endsWith('/v2-state') && response.status() === 503);
      release(); await failed;
      await expect(page.getByRole('alert').filter({ hasText: 'Could not load your cat' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeInViewport({ ratio: 1 });
      await capture('load-error');
      recover = true;
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await expect(page.getByTestId('hud')).toBeVisible();
      await expect(page.getByRole('status', { name: 'Loading game' })).toHaveCount(0);
      await expect(page.getByRole('alert').filter({ hasText: 'Could not load your cat' })).toHaveCount(0);
      expect(unexpected).toEqual([]);
    } finally { release(); }
  });
}
