import { test, expect } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import fs from 'node:fs';
import path from 'node:path';

const key = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
for (const [width, height, colorScheme] of [
  [1600, 900, 'light'], [1280, 720, 'light'], [390, 844, 'light'], [320, 568, 'light'],
  [1280, 720, 'dark'], [390, 844, 'dark'],
] as const) {
  test(`starter salvage protection at ${width}x${height} ${colorScheme}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewportSize({ width, height }); await page.emulateMedia({ colorScheme });
    const save = mockV2Save('fresh', { nowMs: Date.now(), classId: 'warrior' });
    save.state.items[0]!.equipped = false;
    const starter = save.state.items[0]!;
    save.state.items.push({ ...starter, id: 's2-paid', source: 'craft' });
    await page.addInitScript(({ key, save }) => {
      localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key, save: JSON.stringify(save) });
    await page.goto('/');
    await page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: 'Forge', exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: 'Forge', exact: true });
    await panel.getByTestId('tab-salvage').click();
    await expect(panel.getByTestId(`salvage-check-${starter.id}`)).toBeDisabled();
    await expect(panel.getByText("Starter gear can't be salvaged")).toBeVisible();
    await expect(panel.getByTestId('salvage-check-s2-paid')).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: path.resolve(process.cwd(), `../../reports/s2-fix1-integrity/salvage-${width}-${colorScheme}.png`) });
    await panel.getByTestId('salvage-check-s2-paid').check();
    await panel.getByTestId('salvage-btn').click(); await panel.getByTestId('salvage-confirm-btn').click();
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state.items.length, key)).toBe(1);
    expect(errors).toEqual([]);
  });
}
