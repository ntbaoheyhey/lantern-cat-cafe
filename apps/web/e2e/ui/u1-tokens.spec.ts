import { expect, test, type Page } from '../support/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sampleStateV2 } from '../../src/layout/sampleState';
import { mockV2Save } from '../../src/api/mockV2Fixtures';

const key = readFileSync(path.resolve('src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

async function openDemo(page: Page) {
  const nowMs = 1793000000000;
  const sample = sampleStateV2();
  const save = mockV2Save('midGame', { nowMs, classId: sample.cat.classId! });
  Object.assign(save.state, {
    classId: sample.cat.classId, level: sample.cat.level, xp: sample.cat.xp,
    ...sample.progress,
    stacks: { ...sample.materials, fish: sample.currencies.fish, yarn: sample.currencies.yarn, catKey: sample.currencies.keys },
    items: sample.inventory.map(item => ({ ...item, itemId: item.itemKey, bonusLines: item.bonus, source: 'drop' as const })),
  });
  await page.clock.install({ time: nowMs });
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save: JSON.stringify(save) });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const tokens = {
  '--sp-1': '4px', '--sp-2': '8px', '--sp-3': '12px', '--sp-4': '16px', '--sp-5': '24px', '--sp-6': '32px',
  '--fs-xs': '.75rem', '--fs-sm': '.875rem', '--fs-md': '1rem', '--fs-lg': '1.25rem', '--fs-xl': '1.5rem',
  '--surface-3': '#4a3a5e', '--tap': '44px',
};

for (const width of [1280, 390]) test.describe(`${width}px tokens`, () => {
  test.use({ viewport: { width, height: width === 390 ? 844 : 720 }, isMobile: width === 390, hasTouch: width === 390 });
  test('computed tokens, real button target and no overflow', async ({ page }) => {
    await openDemo(page);
    expect(await page.evaluate(names => Object.fromEntries(names.map(name => [name,
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    ])), Object.keys(tokens))).toEqual(tokens);
    // Inventory exposes a real shared button on both desktop and phone.
    await page.getByRole('tab', { name: 'Bag', exact: true }).click();
    const button = page.locator('.pixel-btn:visible').first();
    await expect(button).toBeVisible();
    expect(await button.evaluate(element => parseFloat(getComputedStyle(element).minHeight))).toBeGreaterThanOrEqual(width === 390 ? 44 : 36);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

for (const [width, height, colorScheme] of [
  [1600, 900, 'light'], [1280, 720, 'light'], [390, 844, 'light'], [320, 568, 'light'],
  [1280, 720, 'dark'], [390, 844, 'dark'],
] as const) test.describe(`evidence ${width}x${height} ${colorScheme}`, () => {
  test.use({ viewport: { width, height }, colorScheme, reducedMotion: 'reduce', isMobile: width <= 390, hasTouch: width <= 390 });
  test('stage screenshot', async ({ page }) => {
    await openDemo(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.SCREENSHOTS === '1') {
      const phase = process.env.SCREENSHOT_PHASE === 'before' ? 'before' : 'after';
      const suffix = colorScheme === 'dark' ? '-dark' : '';
      await page.screenshot({ path: path.resolve(`../../reports/u1-tokens/${phase}-${width}x${height}${suffix}.png`) });
    }
  });
});
