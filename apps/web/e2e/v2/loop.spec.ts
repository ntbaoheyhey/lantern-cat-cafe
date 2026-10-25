import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockV2SaveJson, type MockV2FixtureKind } from '../../src/api/mockV2Fixtures';

const KEY = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
type Save = ReturnType<typeof JSON.parse>;
const raw = (page: Page): Promise<Save> => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), KEY);
const initialNow = Date.UTC(2026, 9, 25, 12);
async function load(page: Page, kind?: MockV2FixtureKind, change?: (save: Save) => void) {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
  const nowMs = await page.evaluate(() => Date.now());
  const save = kind ? JSON.parse(mockV2SaveJson(kind, { nowMs, classId: 'warrior', chapter: 1 })) : null;
  if (save && change) change(save);
  await page.evaluate(({ key, save }) => {
    if (save) localStorage.setItem(key, JSON.stringify(save)); else localStorage.removeItem(key);
    localStorage.removeItem('taskbar-hero:v2-last-visit');
  }, { key: KEY, save });
  await page.reload();
  await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
  return save;
}
async function tab(page: Page, name: string) {
  const button = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name, exact: true });
  if (await button.getAttribute('aria-selected') !== 'true') await button.click();
  const panel = page.getByRole('tabpanel', { name, exact: true });
  await expect(panel).toBeVisible(); return panel;
}
async function check(page: Page, name: string, width: number, reduced: boolean) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.resolve(process.cwd(), `../../reports/v26-e2e/${name}-${width}${reduced ? '-reduced' : ''}.png`) });
}
const scenarios = {
  async fresh(page: Page) {
    await load(page);
    await expect(page.getByTestId('class-picker')).toBeVisible();
    await page.getByTestId('class-picker-choose-button').click();
    await page.getByTestId('class-picker-confirm-button').click();
    await expect(page.getByTestId('class-picker')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Character' }).getByRole('button', { name: 'Weapon: Twig Sword, Common' })).toBeVisible();
  },
  async idle(page: Page) {
    await load(page, 'fresh'); // Builder's fresh is a chosen Warrior with the starter equipped.
    const before = (await raw(page)).state;
    await page.clock.fastForward(10 * 60_000);
    await expect.poll(async () => (await raw(page)).state.level).toBeGreaterThan(1);
    const after = (await raw(page)).state;
    expect(after.stacks.fish).toBeGreaterThan(before.stacks.fish ?? 0);
    expect(after.xp).toBeGreaterThan(before.xp);
    expect(after.kills).toBeGreaterThan(before.kills);
    await expect(page.getByRole('group', { name: /^Chapter / })).toContainText(`Round ${after.round}`);
  },
  async equip(page: Page) {
    let weapon = '', helmet = '';
    await load(page, 'midGame', save => {
      // Compose two real builder saves into a guaranteed two-upgrade precondition.
      const starter = JSON.parse(mockV2SaveJson('fresh', { nowMs: save.lastClaimMs, classId: 'warrior' })).state.items[0];
      for (const item of save.state.items) {
        if (item.slot === 'weapon') { weapon = item.id; item.equipped = false; }
        if (item.slot === 'helmet') { helmet = item.id; item.equipped = false; }
      }
      save.state.items.push(starter);
    });
    const panel = await tab(page, 'Inventory');
    await expect(panel.getByRole('button', { name: 'Equip best' })).toBeEnabled();
    await panel.getByRole('button', { name: 'Equip best' }).click();
    await expect.poll(async () => (await raw(page)).state.items.filter((i: { equipped: boolean }) => i.equipped).map((i: { id: string }) => i.id).filter((id: string) => id === weapon || id === helmet).sort(), { message: 'Equip best must apply both guaranteed upgrades in one action' }).toEqual([weapon, helmet].sort());
  },
  async win(page: Page) {
    await load(page, 'bossReadyStrong');
    expect((await raw(page)).state.stacks.catKey).toBe(1);
    const panel = await tab(page, 'Boss'); await panel.getByRole('button', { name: 'Fight', exact: true }).click();
    await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
    const chest = page.getByRole('dialog'); await expect(chest).toBeVisible();
    expect((await raw(page)).state.stacks.catKey ?? 0).toBe(0);
    expect((await raw(page)).state.chapter).toBe(2);
    const skip = chest.getByRole('button', { name: 'Skip', exact: true });
    if (await skip.count()) await skip.click();
    await chest.getByRole('button', { name: 'Collect', exact: true }).click();
    await expect(page.getByRole('group', { name: /^Chapter 2 / })).toBeVisible();
  },
  async loss(page: Page) {
    await load(page, 'bossReadyWeak', save => { save.state.lastDailyKeyDay = new Date(save.lastClaimMs).toISOString().slice(0, 10); });
    const panel = await tab(page, 'Boss'); await panel.getByRole('button', { name: 'Fight', exact: true }).click();
    await expect(page.locator('.boss-arena canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Skip fight' }).click();
    await expect(page.getByText('Defeat. Your key was kept.', { exact: true })).toBeVisible();
    expect((await raw(page)).state.stacks.catKey).toBe(1);
    await page.getByRole('button', { name: 'Back to exploring' }).click();
    const boss = await tab(page, 'Boss');
    await expect(boss.getByRole('button', { name: 'Fight', exact: true })).toBeDisabled();
    await expect(boss.locator('.boss-gate-status')).toContainText(/\d+:\d+/);
    await page.clock.fastForward(61_000);
    await expect(boss.getByRole('button', { name: 'Fight', exact: true })).toBeEnabled();
    expect((await raw(page)).state.stacks.catKey).toBe(1);
  },
  async forge(page: Page) {
    await load(page, 'forgeRich');
    const before = (await raw(page)).state;
    const panel = await tab(page, 'Forge');
    await panel.getByTestId('craft-btn').click(); await panel.getByTestId('craft-confirm-btn').click();
    await expect.poll(async () => (await raw(page)).state.items.length).toBe(before.items.length + 1);
    await panel.getByTestId('tab-salvage').click();
    const current = (await raw(page)).state;
    const locked = current.items.find((i: { locked: boolean }) => i.locked);
    await expect(panel.getByTestId(`salvage-check-${locked.id}`)).toBeDisabled();
    const eligible = current.items.find((i: { equipped: boolean; locked: boolean }) => !i.equipped && !i.locked);
    await panel.getByTestId(`salvage-check-${eligible.id}`).check();
    await panel.getByTestId('salvage-btn').click(); await panel.getByTestId('salvage-confirm-btn').click();
    await expect.poll(async () => (await raw(page)).state.items.length).toBe(current.items.length - 1);
    const after = (await raw(page)).state;
    expect(after.stacks.yarn).toBeGreaterThan(current.stacks.yarn);
    expect(after.stacks.fluffTuft).toBeGreaterThan(current.stacks.fluffTuft);
  },
  async reload(page: Page) {
    await load(page, 'midGame');
    const before = (await raw(page)).state;
    await page.reload(); await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
    const after = (await raw(page)).state;
    expect([after.level, after.stacks.catKey, after.items.length]).toEqual([before.level, before.stacks.catKey, before.items.length]);
    await expect(page.getByRole('region', { name: 'Character' })).toContainText(`Lv ${before.level}`);
  },
};
for (const width of [1280, 390]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 720 } });
    for (const [name, scenario] of Object.entries(scenarios)) test(name, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
      await page.clock.install({ time: initialNow });
      await scenario(page); await check(page, name, width, false); expect(errors).toEqual([]);
    });
  });
}
test('full loop at 390px with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
  await page.clock.install({ time: initialNow });
  for (const [name, scenario] of Object.entries(scenarios)) await test.step(name, async () => { await scenario(page); await check(page, name, 390, true); });
  expect(errors).toEqual([]);
});
