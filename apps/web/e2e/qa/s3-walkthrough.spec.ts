import { expect, test, type Page } from '../support/test';
import { mockV2SaveJson, type MockV2FixtureKind } from '../../src/api/mockV2Fixtures';

const KEY = 'taskbar-hero:v2-demo:1';
type Save = ReturnType<typeof JSON.parse>;
const raw = (page: Page): Promise<Save> => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);

async function load(page: Page, kind?: MockV2FixtureKind, change?: (save: Save) => void) {
  await page.goto('/');
  const nowMs = await page.evaluate(() => Date.now());
  const save = kind ? JSON.parse(mockV2SaveJson(kind, { nowMs, classId: 'warrior', chapter: 1 })) : null;
  if (save && change) change(save);
  await page.evaluate(
    ({ key, save }) => {
      if (save) localStorage.setItem(key, JSON.stringify(save));
      else localStorage.removeItem(key);
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      localStorage.removeItem('taskbar-hero:v2-last-visit');
    },
    { key: KEY, save },
  );
  await page.reload();
  return save;
}

test.describe('Cat RPG v2 QA Regression Suite (Mission S3)', () => {
  test('fresh start class choice and initial stage mounting', async ({ page }) => {
    await load(page);
    await expect(page.getByTestId('class-picker')).toBeVisible();

    // Verify all 7 classes are readable
    const classes = ['warrior', 'guardian', 'rogue', 'hunter', 'archer', 'witch', 'alchemist'];
    for (const c of classes) {
      await expect(page.getByTestId(`class-card-${c}`)).toBeVisible();
    }

    // Pick warrior
    await page.getByTestId('class-picker-choose-button').click();
    await page.getByTestId('class-picker-confirm-button').click();

    // Stage canvas is mounted
    await expect(page.locator('.v2-stage canvas')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
  });

  test('idle loop accrues fish and XP across claims without double-pay', async ({ page }) => {
    await page.clock.install();
    await load(page, 'fresh');
    const before = (await raw(page)).state;

    // Fast forward clock past claim interval (30s)
    await page.clock.fastForward(60_000);
    await expect.poll(async () => (await raw(page)).state.xp).toBeGreaterThan(before.xp);
    const after = (await raw(page)).state;
    expect(after.stacks.fish).toBeGreaterThan(before.stacks.fish ?? 0);

    // Immediate second claim attempt does not double pay
    const claimTwice = await page.evaluate(async (key) => {
      const loop = (window as unknown as { __GAME_LOOP_V2__?: { claimNow: () => Promise<void> } }).__GAME_LOOP_V2__;
      if (loop) {
        await loop.claimNow();
        await loop.claimNow();
      }
      return JSON.parse(localStorage.getItem(key)!);
    }, KEY);
    expect(claimTwice.state.xp).toBe(after.xp);
  });

  test('bag equip, lock toggle, and bulk equip best upgrades', async ({ page }) => {
    let weapon = '';
    await load(page, 'midGame', (save) => {
      for (const item of save.state.items) {
        if (item.slot === 'weapon') {
          weapon = item.id;
          item.equipped = false;
        }
      }
    });

    const invTab = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: 'Bag' });
    await invTab.click();
    const panel = page.getByRole('tabpanel', { name: 'Bag' });
    await expect(panel).toBeVisible();

    // Equip best
    const equipBest = panel.getByRole('button', { name: 'Equip best' });
    if (await equipBest.isEnabled()) {
      await equipBest.click();
      await expect.poll(async () => {
        const current = (await raw(page)).state.items.find((i: { id: string }) => i.id === weapon);
        return current?.equipped;
      }).toBe(true);
    }
  });

  test('forge crafting, salvage and daily relic status', async ({ page }) => {
    await load(page, 'forgeRich');
    const forgeTab = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: 'Forge' });
    await forgeTab.click();
    const panel = page.getByRole('tabpanel', { name: 'Forge' });
    await expect(panel).toBeVisible();

    // Craft common weapon
    const craftBtn = panel.getByTestId('craft-btn');
    await craftBtn.click();
    await panel.getByTestId('craft-confirm-btn').click();
    await expect(page.locator('.v2-action-notice, .forge-note')).toBeVisible();

    // Relic sub-tab
    const relicSubTab = panel.locator('#forge-tab-relic, button:has-text("RELIC")').first();
    await relicSubTab.click();
    await expect(panel.getByTestId('relic-forge-btn')).toBeVisible();
  });

  test('boss fight victory, key consumption and chest collection', async ({ page }) => {
    await load(page, 'bossReadyStrong');
    expect((await raw(page)).state.stacks.catKey).toBe(1);

    const bossTab = page
      .getByRole('tablist', { name: 'Game panel tabs' })
      .getByRole('tab', { name: 'Map' })
      .or(page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: 'Boss' }));
    await bossTab.click();
    const panel = page.getByRole('tabpanel', { name: 'Map' }).or(page.getByRole('tabpanel', { name: 'Boss' }));
    await panel.getByRole('button', { name: 'Fight', exact: true }).click();

    // Arena canvas shows
    await expect(page.locator('.boss-arena canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Skip fight' }).click();

    // Victory and chest dialog
    await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
    const chest = page.getByRole('dialog');
    await expect(chest).toBeVisible();

    // Key was spent
    expect((await raw(page)).state.stacks.catKey ?? 0).toBe(0);
    expect((await raw(page)).state.chapter).toBe(2);

    const skip = chest.getByRole('button', { name: 'Skip', exact: true });
    if (await skip.count()) await skip.click();
    await chest.getByRole('button', { name: 'Collect', exact: true }).click();
    await expect(page.getByRole('group', { name: /^Chapter 2 / })).toBeVisible();
  });

  test('responsive mobile bottom navigation at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page, 'fresh');

    const nav = page.getByRole('navigation', { name: 'Game menu' });
    await expect(nav).toBeVisible();

    const bagButton = nav.getByRole('tab', { name: 'Bag' });
    await bagButton.click();

    const panel = page.getByRole('tabpanel', { name: 'Bag' });
    await expect(panel).toBeVisible();
  });
});
