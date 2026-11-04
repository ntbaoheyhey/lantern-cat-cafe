import { test, expect } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { readFileSync } from 'node:fs';

const storageKey = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
for (const width of [1280, 1600]) {
  test(`Empty bag slots remain accessible by keyboard ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width * 9 / 16 });
    const save = mockV2Save('forgeRich', { nowMs: Date.now(), classId: 'warrior' });
    save.state.items = [];
    await page.addInitScript(({ key, value }) => {
      localStorage.setItem(key, value);
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: storageKey, value: JSON.stringify(save) });
    await page.goto('/#home');
    await expect(page.getByRole('img', { name: 'Cat exploring the chapter' })).toBeVisible();
    await page.getByRole('tab', { name: 'Bag', exact: true }).click();
    const slots = page.getByRole('region', { name: 'Scrollable bag slots' });
    await page.getByRole('combobox', { name: 'Sort bag' }).focus();
    await page.keyboard.press('Tab');
    await expect(slots).toBeFocused();
    expect(await slots.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
    await page.keyboard.press('End');
    await expect.poll(() => slots.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Home');
    await expect.poll(() => slots.evaluate(node => node.scrollTop)).toBe(0);
  });
}
