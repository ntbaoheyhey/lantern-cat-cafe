import { test, expect, type Browser, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockV2SaveJson, type MockV2FixtureKind } from '../../src/api/mockV2Fixtures';
import type { v2 } from '@taskbar-hero/game-rules';

const OUT = '/workspace/taskbar-captures';
const KEY = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const classes = [
  ['warrior', 'Warrior', 'Sword · Cleave'], ['guardian', 'Guardian', 'Hammer · Bonk'],
  ['rogue', 'Rogue', 'Daggers · Twin Strike'], ['hunter', 'Hunter', 'Spear · Mark Prey'],
  ['archer', 'Archer', 'Bow · Volley'], ['witch', 'Witch', 'Staff · Burn'],
  ['alchemist', 'Alchemist', 'Flasks · Poison'],
] as const;
const raw = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), KEY);
async function recording(browser: Browser, id: string, width = 1600, height = 900) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1,
    recordVideo: { dir: `${OUT}/raw`, size: { width, height } }, colorScheme: 'dark', reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const started = Date.now(); const marks: Record<string, number> = {}; const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
  await page.clock.install({ time: new Date('2026-10-26T08:00:00Z') });
  const mark = (name: string) => { marks[name] = (Date.now() - started) / 1000; };
  const finish = async (extra: object = {}) => {
    const video = page.video()!; const duration = (Date.now() - started) / 1000;
    await context.close();
    const metadata = { id, width, height, raw: await video.path(), duration, marks, errors, ...extra };
    fs.writeFileSync(`${OUT}/${id}.json`, JSON.stringify(metadata, null, 2));
    expect(errors).toEqual([]);
  };
  return { page, context, mark, finish };
}
async function load(page: Page, kind: MockV2FixtureKind, classId: v2.ClassId = 'warrior', change?: (save: any) => void) {
  if (page.url() === 'about:blank') await page.goto('http://127.0.0.1:4181/');
  const nowMs = await page.evaluate(() => Date.now());
  const save = JSON.parse(mockV2SaveJson(kind, { nowMs, classId, chapter: 1 }));
  change?.(save);
  await page.evaluate(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.removeItem('taskbar-hero:v2-last-visit');
  }, { key: KEY, save });
  await page.reload();
  await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
  await expect.poll(async () => (await raw(page)).state.classId).toBe(classId);
  await page.evaluate(() => window.scrollTo(0, 0));
  return save;
}
async function tab(page: Page, name: string) {
  const button = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name, exact: true });
  if (await button.getAttribute('aria-selected') !== 'true') await button.click();
  const panel = page.getByRole('tabpanel', { name, exact: true });
  await expect(panel).toBeVisible(); return panel;
}
async function shot(page: Page, name: string, fullPage = false) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${OUT}/screenshots/${name}.png`, fullPage });
}
for (const [id, name, weapon] of classes) {
  test(`record ${name}`, async ({ browser }) => {
    const { page, mark, finish } = await recording(browser, id);
    await page.goto('http://127.0.0.1:4181/');
    await expect(page.getByTestId('class-picker')).toBeVisible();
    await page.getByRole('radio', { name: new RegExp(`^${name},`) }).click();
    mark('selection');
    if (id === 'warrior') await shot(page, 'features/class-selection');
    await page.waitForTimeout(1000);
    await page.getByTestId('class-picker-choose-button').click();
    await page.getByTestId('class-picker-confirm-button').click();
    await expect(page.getByTestId('class-picker')).toHaveCount(0);
    await expect.poll(async () => (await raw(page)).state.classId).toBe(id);
    await page.waitForTimeout(700);
    const before = await load(page, 'midGame', id);
    await page.clock.fastForward(30_000);
    await expect.poll(async () => (await raw(page)).state.stacks.fish).toBeGreaterThan(before.state.stacks.fish ?? 0);
    mark('combat');
    await page.waitForTimeout(1200);
    await shot(page, `characters/${id}`);
    await page.getByRole('region', { name: 'Game stage' }).screenshot({ path: `${OUT}/screenshots/characters/${id}-stage.png` });
    await page.waitForTimeout(5200);
    mark('end');
    await finish({ classId: id, name, weapon, fixture: 'midGame', acceleratedClaimSeconds: 30 });
  });
}
test('record feature walkthrough', async ({ browser }) => {
  const { page, mark, finish } = await recording(browser, 'features');
  await load(page, 'midGame');
  mark('stage'); await page.waitForTimeout(2200);
  await shot(page, 'features/stage-desktop');
  await load(page, 'midGame', 'warrior', save => {
    const starter = JSON.parse(mockV2SaveJson('fresh', { nowMs: save.lastClaimMs, classId: 'warrior' })).state.items[0];
    for (const item of save.state.items) if (item.slot === 'weapon' || item.slot === 'helmet') item.equipped = false;
    save.state.items.push(starter);
  });
  const inventory = await tab(page, 'Inventory'); mark('equipment');
  await page.waitForTimeout(1400);
  await inventory.getByRole('button', { name: 'Equip best' }).click();
  await expect.poll(async () => (await raw(page)).state.items.filter((i: any) => i.equipped && ['fx:midGame:1', 'fx:midGame:2'].includes(i.id)).length).toBe(2);
  await page.waitForTimeout(1600); await shot(page, 'features/equipment-desktop', true);
  await load(page, 'bossReadyWeak');
  const boss = await tab(page, 'Boss');
  await page.waitForTimeout(800); await boss.getByRole('button', { name: 'Fight', exact: true }).click();
  await expect(page.locator('.boss-arena canvas')).toBeVisible(); mark('arena');
  await page.waitForTimeout(900); await shot(page, 'features/boss-arena');
  await page.waitForTimeout(2200);
  await load(page, 'bossReadyStrong');
  const ready = await tab(page, 'Boss'); mark('map');
  await page.waitForTimeout(1500); await shot(page, 'features/chapter-map', true);
  await ready.getByRole('button', { name: 'Fight', exact: true }).click();
  await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
  const chest = page.getByRole('dialog'); await expect(chest).toBeVisible();
  mark('chest'); await page.waitForTimeout(2500);
  await shot(page, 'features/boss-victory');
  const skip = chest.getByRole('button', { name: 'Skip', exact: true });
  if (await skip.count()) await skip.click();
  await chest.getByRole('button', { name: 'Collect', exact: true }).click();
  await page.waitForTimeout(1000);
  await load(page, 'forgeRich');
  const before = (await raw(page)).state.items.length;
  const forge = await tab(page, 'Forge'); mark('forge'); await page.waitForTimeout(1400);
  await forge.getByTestId('craft-btn').click(); await page.waitForTimeout(1000);
  await forge.getByTestId('craft-confirm-btn').click();
  await expect.poll(async () => (await raw(page)).state.items.length).toBe(before + 1);
  await page.waitForTimeout(1700); await shot(page, 'features/forge-desktop', true);
  mark('help'); await tab(page, 'Help'); await page.waitForTimeout(2200); await shot(page, 'features/help-desktop', true);
  mark('end'); await finish({ fixtures: ['midGame', 'bossReadyWeak', 'bossReadyStrong', 'forgeRich'], stagedSaves: true });
});
test('record mobile', async ({ browser }) => {
  const { page, mark, finish } = await recording(browser, 'mobile', 390, 844);
  await load(page, 'midGame', 'archer');
  await page.clock.fastForward(30_000); mark('stage');
  await page.waitForTimeout(1500); await shot(page, 'mobile/stage-390'); await page.waitForTimeout(2000);
  mark('inventory'); await tab(page, 'Inventory'); await page.waitForTimeout(1800); await shot(page, 'mobile/inventory-390');
  await page.getByRole('button', { name: 'Close panel' }).click();
  await load(page, 'forgeRich', 'archer'); await tab(page, 'Forge'); mark('forge');
  await page.waitForTimeout(1800); await shot(page, 'mobile/forge-390');
  await page.getByRole('button', { name: 'Close panel' }).click();
  await load(page, 'bossReadyStrong', 'archer'); await tab(page, 'Boss'); mark('map');
  await page.waitForTimeout(1800); await shot(page, 'mobile/boss-390');
  mark('end'); await finish({ classId: 'archer', fixtures: ['midGame', 'forgeRich', 'bossReadyStrong'] });
});
