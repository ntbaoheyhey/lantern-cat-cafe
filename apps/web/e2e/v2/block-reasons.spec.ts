import { expect, test, type Page } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockV2SaveJson, type MockV2FixtureKind } from '../../src/api/mockV2Fixtures';

const writeScreenshots = process.env.SCREENSHOTS === '1';
const outDir = path.resolve(process.cwd(), '../../reports/m2-mechanics');
const KEY = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

type Save = ReturnType<typeof JSON.parse>;

async function loadSave(page: Page, kind: MockV2FixtureKind = 'fresh', change?: (save: Save) => void) {
  await page.goto('/');
  // AGR1 redesign: HUD hidden on onboarding class picker before class choice.
  await expect(page.getByRole('region', { name: 'Cat status' }).or(page.getByTestId('class-picker'))).toBeVisible();
  const nowMs = await page.evaluate(() => Date.now());
  const save = JSON.parse(mockV2SaveJson(kind, { nowMs, classId: 'warrior', chapter: 1 }));
  if (change) change(save);
  await page.evaluate(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.removeItem('taskbar-hero:v2-last-visit');
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save });
  await page.reload();
  await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
  return save;
}

async function tab(page: Page, name: string) {
  const aliases: Record<string, string> = {
    Boss: 'Map',
    Character: 'Hero',
    Inventory: 'Bag',
  };
  const target = aliases[name] ?? name;
  let button = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: target, exact: true });
  if ((await button.count()) === 0) {
    button = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name, exact: true });
  }
  if ((await button.getAttribute('aria-selected')) !== 'true') await button.click();
  let panel = page.getByRole('tabpanel', { name: target, exact: true });
  if ((await panel.count()) === 0) {
    panel = page.getByRole('tabpanel', { name, exact: true });
  }
  await expect(panel).toBeVisible();
  return panel;
}

for (const [width, height] of [[1280, 720], [390, 844]] as const) {
  test(`v2 disabled action buttons explain why at ${width}x${height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width, height });

    // Load fresh save where player has zero craft mats, zero keys, cooldown active, and a locked off-class item in bag.
    await loadSave(page, 'fresh', (save) => {
      save.state.stacks = {};
      save.state.bossCooldownUntil = Math.floor(Date.now() / 1000) + 42;
      // Add a hammer (wrong weapon for Warrior) to test equip block reason
      save.state.items.push({
        id: 'fx:test:hammer',
        itemId: 'wpn.hammer.mallet',
        itemKey: 'wpn.hammer.mallet',
        slot: 'weapon',
        weaponType: 'hammer',
        rarity: 'common',
        level: 1,
        bonus: [],
        bonusLines: [],
        locked: false,
        equipped: false,
        source: 'drop',
      });
    });

    // 1. Forge Tab: Craft button disabled -> shows block-reason-craft
    const forgePanel = await tab(page, 'Forge');
    await forgePanel.getByTestId('tab-craft').click();
    const craftBtn = forgePanel.getByTestId('craft-btn');
    await expect(craftBtn).toBeDisabled();
    const craftReason = forgePanel.getByTestId('block-reason-craft');
    await expect(craftReason).toBeVisible();
    await expect(craftReason).toContainText(/Needs \d+ more/i);

    // 2. Forge Tab: Salvage button disabled -> shows block-reason-salvage
    await forgePanel.getByTestId('tab-salvage').click();
    const salvageBtn = forgePanel.getByTestId('salvage-btn');
    await expect(salvageBtn).toBeDisabled();
    const salvageReason = forgePanel.getByTestId('block-reason-salvage');
    await expect(salvageReason).toBeVisible();
    await expect(salvageReason).toHaveText('Select at least one item to salvage.');

    // 3. Forge Tab: Relic forge button disabled -> shows block-reason-relic
    await forgePanel.getByTestId('tab-relic').click();
    const relicBtn = forgePanel.getByTestId('relic-forge-btn');
    await expect(relicBtn).toBeDisabled();
    const relicReason = forgePanel.getByTestId('block-reason-relic');
    await expect(relicReason).toBeVisible();
    await expect(relicReason).toContainText(/Not enough Yarn/i);

    // 4. Boss Tab: Boss fight button disabled -> shows block-reason-boss
    const bossPanel = await tab(page, 'Boss');
    const fightBtn = bossPanel.getByRole('button', { name: 'Fight' });
    await expect(fightBtn).toBeDisabled();
    const bossReason = bossPanel.getByTestId('block-reason-boss');
    await expect(bossReason).toBeVisible();
    await expect(bossReason).toContainText(/Catnap: \d+:\d+/i);

    // 5. Bag Tab: Equip button disabled for off-class hammer -> shows block-reason-equip
    const bagPanel = await tab(page, 'Bag');
    await expect(bagPanel.getByTestId('block-reason-equip-best')).toHaveText('No higher total-stat score');
    // Select the off-class hammer
    await bagPanel.getByRole('button', { name: /Yarn Mallet/i }).click();
    const equipBtn = bagPanel.getByRole('button', { name: 'Equip', exact: true });
    await expect(equipBtn).toBeDisabled();
    const equipReason = bagPanel.getByTestId('block-reason-equip');
    await expect(equipReason).toBeVisible();
    await expect(equipReason).toHaveText('Needs a sword weapon');

    if (writeScreenshots) {
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      await page.screenshot({ path: path.join(outDir, `block-reasons-${width}x${height}.png`) });
    }

    expect(errors).toEqual([]);
  });
}
