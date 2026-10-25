import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { sampleStateV2 } from '../../src/layout/sampleState';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
const STORAGE_KEY = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;


// Runs in the stage-layout project against the VITE_GAME_V2=1 build (see playwright.config.ts).
const VIEWPORTS = [
  { name: '320', width: 320, height: 568 },
  { name: '390', width: 390, height: 844 },
  { name: '1280', width: 1280, height: 800 },
];

test.beforeEach(async ({ page }) => {
  // Preserve the original account and every existing assertion while the UI now loads real saves.
  const sample = sampleStateV2(), save = mockV2Save('midGame', { nowMs: Date.now(), classId: 'warrior' });
  Object.assign(save.state, { classId: sample.cat.classId, level: sample.cat.level, xp: sample.cat.xp,
    ...sample.progress, stacks: { ...sample.materials, fish: sample.currencies.fish, yarn: sample.currencies.yarn, catKey: sample.currencies.keys },
    items: sample.inventory.map(i => ({ ...i, itemId: i.itemKey, bonusLines: i.bonus, source: 'drop' as const })),
  });
  await page.addInitScript(({ key, save }) => {
    window.localStorage.setItem(key, save);
    window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: STORAGE_KEY, save: JSON.stringify(save) });
});

async function noHorizontalScroll(page: Page): Promise<void> {
  const o = await page.evaluate(() => ({
    doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    body: [document.body.scrollWidth, document.body.clientWidth],
  }));
  expect(o.doc[0]).toBeLessThanOrEqual(o.doc[1]!);
  expect(o.body[0]).toBeLessThanOrEqual(o.body[1]!);
}

/** Phones keep the tabs in a bottom sheet; wider screens show the Inventory tab already. */
async function openInventory(page: Page, width: number): Promise<void> {
  if (width <= 600) {
    await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Inventory', exact: true }).click();
  }
  await expect(page.getByRole('tabpanel', { name: 'Inventory', exact: true })).toBeVisible();
}

for (const vp of VIEWPORTS) {
  test(`character panel and bag are visible without horizontal scroll at ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');

    const character = page.getByRole('region', { name: 'Character' });
    await expect(character).toBeVisible();
    await expect(character.getByRole('button')).toHaveCount(9);
    await expect(page.getByTestId('character-power')).toBeVisible();
    await expect(character.getByRole('progressbar', { name: 'Experience' })).toBeVisible();
    await noHorizontalScroll(page);

    await openInventory(page, vp.width);
    const bag = page.getByRole('tabpanel', { name: 'Inventory', exact: true });
    await expect(bag.getByTestId('bag-count')).toHaveText('Bag 15 / 200');
    await expect(bag.getByRole('list', { name: 'Bag items' })).toBeVisible();
    await noHorizontalScroll(page);
  });

  test(`equipping from the bag updates the slot name and locked slots show their level at ${vp.name}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    const character = page.getByRole('region', { name: 'Character' });

    const charm = character.getByRole('button', { name: 'Charm: locked until level 20' });
    await expect(charm).toBeDisabled();
    await expect(charm).toContainText('Lv 20');

    await openInventory(page, vp.width);
    const bag = page.getByRole('tabpanel', { name: 'Inventory', exact: true });
    await bag.getByRole('button', { name: /^Silverclaw Saber, / }).click();
    const detail = bag.getByRole('region', { name: 'Item detail' });
    await detail.getByRole('button', { name: 'Equip', exact: true }).click();

    await expect(character.getByRole('button', { name: 'Weapon: Silverclaw Saber, Rare' })).toBeVisible();
    await expect(character.getByRole('button', { name: 'Weapon: Twig Sword, Common' })).toHaveCount(0);
    await noHorizontalScroll(page);
  });
}
