import { mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { test, expect, load, tab } from '../support/server-fixture';

const viewports = [
  { width: 1600, height: 900, colorScheme: 'light' },
  { width: 1280, height: 720, colorScheme: 'light' },
  { width: 390, height: 844, colorScheme: 'light' },
  { width: 320, height: 568, colorScheme: 'light' },
  { width: 1280, height: 720, colorScheme: 'dark' },
  { width: 390, height: 844, colorScheme: 'dark' },
] as const;

for (const viewport of viewports) test(`N1 unsigned pending Relic at ${viewport.width}x${viewport.height} ${viewport.colorScheme}`, async ({ page, request }) => {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: viewport.colorScheme, reducedMotion: 'reduce' });
  // Exercise the real connected view with a state payload representing an unavailable signer.
  // Only this local response is replaced; the session and surrounding state use local PGlite.
  await page.route('**/functions/v1/v2-state', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch();
    const state = await response.json();
    const claimId = '00000000-0000-4000-8000-000000000042';
    state.forge = { blockedBy: 'daily_limit', forgedToday: true, recoverable: true,
      pending: { claimId, player: '0x0000000000000000000000000000000000000001', relicId: '1', rarity: 0,
        rarityName: 'common', nonce: '42', expiry: 2_000_000_000, signature: null, recoverable: true },
      today: { claimId, relicId: '1', rarityName: 'common', minted: false, txHash: null, recoverable: true } };
    await route.fulfill({ response, json: state });
  });
  await load(page, request);
  const panel = await tab(page, 'Forge');
  await panel.getByTestId('tab-relic').click();
  const waiting = panel.getByText('Your Relic is waiting. Try again in a moment.', { exact: true });
  await waiting.scrollIntoViewIfNeeded();
  await expect(waiting).toBeVisible();
  await expect(panel.getByText(/daily limit reached|already forged/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mint to wallet' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.SCREENSHOTS === '1') {
    const directory = path.resolve(process.cwd(), '../../reports/n1-relic-recovery');
    mkdirSync(directory, { recursive: true });
    const output = path.join(directory, `pending-${viewport.width}x${viewport.height}-${viewport.colorScheme}.png`);
    await page.screenshot({ path: output, animations: 'disabled' });
    expect(statSync(output).size).toBeLessThan(200_000);
  }
});
