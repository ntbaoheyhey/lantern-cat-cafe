import { test, expect, control, install } from '../support/server-fixture';
import { pinVisualFonts } from '../support/visual-fonts';
import type { Session } from '../../src/wallet/session';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const key = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
for (const savedGuest of [false, true]) {
  test(`Expired server session explains guest recovery, saved guest ${savedGuest}`, async ({ page, context, request }) => {
    const session = await control<Session>(request, 'session', { kind: 'stocked' });
    await install(context, session);
    await pinVisualFonts(page);
    if (savedGuest) await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), {
      key, save: JSON.stringify(mockV2Save('midGame', { nowMs: Date.now(), classId: 'warrior' })),
    });
    await page.route('**/functions/v1/v2-state', route => route.fulfill({ status: 401,
      contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ error: 'unauthenticated' }),
    }));
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      // Chromium reports the deliberately mocked 401 as a failed resource.
      if (message.type() === 'error' && !(message.location().url.endsWith('/v2-state') && message.text().includes('401'))) errors.push(message.text());
    });
    await page.goto('/#home');
    const notice = page.getByTestId('session-expired-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toHaveAttribute('role', 'status');
    await expect(notice).toContainText('Your session expired');
    await expect(notice).toContainText('Sign in again');
    expect(await page.evaluate(() => sessionStorage.getItem('taskbar-hero.session'))).toBeNull();
    if (savedGuest) await expect(page.getByTestId('home-dashboard')).toBeVisible();
    else {
      await expect(page.getByTestId('class-picker')).toBeVisible();
      await page.getByTestId('class-picker-choose-button').click();
      await page.getByTestId('class-picker-confirm-button').click();
      await expect(page.getByTestId('home-dashboard')).toBeVisible();
      await expect(notice).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
    await expect(notice).toBeInViewport({ ratio: 1 });
    if (process.env.CXR2_SCREENSHOTS) {
      mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, `expired-${savedGuest}-${page.viewportSize()!.width}.png`) });
    }
    expect(errors).toEqual([]);
  });
}
