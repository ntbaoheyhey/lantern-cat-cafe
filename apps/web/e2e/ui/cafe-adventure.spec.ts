import { test, expect, type Page } from '../support/test';
import { createCafe, advanceCafe, actCafe, type CafeState } from '../../../../packages/game-rules/client/cafe';
import { CONFIG } from '@taskbar-hero/game-rules';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { readFileSync } from 'node:fs';
const key = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const localKey = 'taskbar-hero:cafe-sample:1', now = Date.UTC(2026, 10, 5, 0, 0);
async function open(page: Page, state: CafeState = createCafe(11), away = 0, opted = true) {
  await page.clock.install({ time: now });
  const main = mockV2Save('midGame', { nowMs: now, classId: 'warrior' });
  await page.addInitScript(({ key, main, state, lastSeen, localKey }) => {
    if (sessionStorage.getItem('cafe-test-initialized')) return;
    localStorage.setItem(key, JSON.stringify(main)); localStorage.setItem(localKey, JSON.stringify({ state, lastSeen }));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    sessionStorage.setItem('cafe-test-initialized', '1');
  }, { key, main, state, lastSeen: now - away, localKey });
  await page.goto(`/?demo&coach=off${opted ? '&adventure=1&adventureDebug=1' : ''}#home`);
  if (opted) await expect(page.getByTestId('cafe-adventure')).toBeVisible();
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 100);
}
const nav = (page: Page, name: string) => page.getByRole('navigation', { name: 'Adventure pages' }).getByRole('button', { name, exact: true }).click();
const saved = (page: Page) => page.evaluate(localKey => JSON.parse(localStorage.getItem(localKey)!).state as CafeState, localKey);
test('Sample is off by default and developer jumps are absent in production', async ({ page }) => {
  await open(page, createCafe(), 0, false); await expect(page.getByTestId('cafe-adventure')).toHaveCount(0);
  await page.clock.resume();
  await page.goto('/?demo&coach=off&adventure=1&adventureDebug=1#home');
  await expect(page.getByTestId('cafe-adventure')).toBeVisible(); await expect(page.getByText('Developer jumps', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => '__cafeDebug' in window)).toBe(false);
});
test('idle gets the first real local find by eight seconds and route buttons change actual rewards', async ({ page }) => {
  await open(page); await page.clock.runFor(8000); const s = await saved(page);
  // Persistence may trail the tick by the configured five-second interval.
  await expect(page.getByTestId('cafe-adventure')).toContainText('patches');
  await page.clock.runFor(2000); expect((await saved(page)).inventory.length).toBeGreaterThan(s.inventory.length);
  await page.clock.runFor(6000); const before = (await saved(page)).patches;
  await page.getByRole('button', { name: /^Gather/ }).click(); expect((await saved(page)).patches).toBeGreaterThan(before);
});
test('boss keyboard counters work, pounce has cooldown, and the result opens the next room', async ({ page }) => {
  await open(page, advanceCafe(createCafe(29), 140)); await page.getByRole('button', { name: /^Challenge boss/ }).click();
  await expect(page.getByRole('region', { name: 'Boss counterplay' })).toContainText('Dodge before the hit');
  await page.keyboard.press('1'); await page.clock.runFor(3000); await expect(page.getByRole('region', { name: 'Boss counterplay' })).toContainText('Recovery');
  await page.keyboard.press('p'); await expect(page.getByRole('button', { name: /^Pounce/ })).toBeDisabled();
  for (let t = 0; t < 60; t++) {
    const panel = page.getByRole('region', { name: 'Boss counterplay' });
    if (!await panel.isVisible()) break;
    const tell = (await panel.innerText()).match(/(Dodge|Break|Interrupt) before the hit/);
    if (tell) {
      const counter = panel.getByRole('button', { name: new RegExp(`^${tell[1]}`) });
      if (await counter.isEnabled()) await counter.click();
    }
    await page.clock.runFor(1000);
  }
  await expect(page.getByTestId('cafe-boss-result')).toContainText(/Perfect|Clear|Close call/);
  await page.getByRole('button', { name: 'Explore Kitchen →' }).click(); expect((await saved(page)).chapter).toBe(2);
});
test('unattended route choices keep the arena and controls in place', async ({ page }) => {
  await open(page);
  const route = page.getByRole('region', { name: 'Encounter choice' });
  const arena = page.getByRole('region', { name: 'Mochi patrols the cafe' });
  const before = { route: await route.boundingBox(), arena: await arena.boundingBox() };
  await page.clock.runFor(CONFIG.cafe.firstFindSeconds * 1000);
  await expect(route).toContainText('Another corner to explore');
  expect(await route.boundingBox()).toEqual(before.route);
  expect(await arena.boundingBox()).toEqual(before.arena);
  await page.clock.runFor((CONFIG.cafe.encounterSeconds - CONFIG.cafe.firstFindSeconds) * 1000);
  await expect(route.getByRole('button', { name: /^Gather/ })).toBeVisible();
  expect(await route.boundingBox()).toEqual(before.route);
  expect(await arena.boundingBox()).toEqual(before.arena);
});
test('recovery only promises bonus damage after a matching counter', async ({ page }) => {
  const missed = advanceCafe(actCafe(advanceCafe(createCafe(), 140), { type: 'fight' }), CONFIG.cafe.boss.windupSeconds);
  await open(page, missed);
  await expect(page.getByRole('region', { name: 'Boss counterplay' })).toContainText('No bonus opening this time');
  await expect(page.locator('.cafe-cue')).not.toContainText('Pounce now for extra damage');
});
test('chosen craft, honest odds, safe stitch, protected loadouts and set collection work end to end', async ({ page }) => {
  const s = createCafe(); s.patches = 100;
  await open(page, s); await nav(page, 'Workshop'); await page.getByLabel('Set', { exact: true }).selectOption('star');
  await page.getByLabel('Slot', { exact: true }).selectOption('charm'); await page.getByRole('button', { name: /^Craft Star charm/ }).click();
  expect((await saved(page)).inventory.at(-1)).toMatchObject({ set: 'star', slot: 'charm' });
  await expect(page.getByTestId('cafe-adventure')).toContainText('Bright 8% · Fine 20% · Plain 72%');
  await page.getByRole('button', { name: /^Steady stitch/ }).click(); expect((await saved(page)).inventory[0]!.level).toBe(1);
  await nav(page, 'Wardrobe'); await page.getByRole('button', { name: 'Save kit A', exact: true }).click();
  const item = page.getByRole('list', { name: 'Adventure kit items' }).getByRole('button', { name: /Star charm/ });
  await item.click(); await page.getByRole('button', { name: 'Equip this piece', exact: true }).click();
  await page.getByRole('button', { name: 'Save kit B', exact: true }).click(); await page.getByRole('button', { name: 'Wear A', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Recycle/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Wear B', exact: true }).click(); expect((await saved(page)).equipped.charm).toBe((await saved(page)).loadouts.B!.charm);
  await nav(page, 'Journal'); await expect(page.getByText('The patchwork collection')).toBeVisible();
  await expect(page.getByTestId('cafe-adventure')).toContainText('✓ charm');
});
test('away summary is capped and a tour explains, preserves and can undo its reset', async ({ page }) => {
  const s = createCafe(); s.chapter = 3; s.clears = [1, 2, 3]; s.xp = 80;
  await open(page, s, 86_400_000); await expect(page.getByRole('region', { name: 'While you were away' })).toContainText('+30 local patches');
  await page.getByRole('button', { name: 'Welcome home', exact: true }).click(); await nav(page, 'Cafe');
  await expect(page.getByTestId('cafe-adventure')).toContainText('capped at +15%');
  await page.getByRole('button', { name: /Preview a new tour/ }).click();
  await page.getByRole('button', { name: 'Start new tour' }).click(); expect((await saved(page)).tours).toBe(1);
  await page.getByRole('button', { name: /Undo/ }).click(); expect((await saved(page)).chapter).toBe(3); expect((await saved(page)).tours).toBe(0);
});
test('Spark preview respects the remaining stitch cap and affixes explain their effect', async ({ page }) => {
  const s = createCafe(); s.patches = 100; s.inventory[0]!.level = CONFIG.cafe.gear.maxLevel - 1;
  await open(page, s); await nav(page, 'Workshop');
  await expect(page.getByRole('button', { name: /^Spark stitch/ })).toContainText('chance of +1');
  await nav(page, 'Wardrobe');
  await expect(page.getByTestId('cafe-adventure')).toContainText(`Cushioned: +${CONFIG.cafe.gear.cushionedHp} base HP, scaled by quality.`);
});
test('the next room is visible immediately after a win at the minimum desktop size', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const s = advanceCafe(actCafe(advanceCafe(createCafe(), 140), { type: 'fight' }), 90);
  expect(s.lastBoss?.won).toBe(true); await open(page, s);
  await expect(page.getByRole('button', { name: 'Explore Kitchen →', exact: true })).toBeInViewport({ ratio: 1 });
});
test('difficulty locks during a fight and assist remains explicit and optional', async ({ page }) => {
  const s = advanceCafe(createCafe(), 140); s.losses = CONFIG.cafe.assist.afterLosses;
  await open(page, s); await page.getByLabel('Challenge tier').selectOption('2'); await page.getByRole('button', { name: /^Challenge boss/ }).click();
  await expect(page.getByTestId('cafe-adventure')).toContainText('Assist is on'); await nav(page, 'Cafe');
  await expect(page.getByRole('checkbox', { name: /Gentle assist/ })).toBeDisabled();
  await page.getByRole('button', { name: /Boss in progress/ }).click(); await expect(page.getByRole('region', { name: 'Boss counterplay' })).toBeVisible();
});
test('Sample choices persist through reload without writing to the main economy', async ({ page }) => {
  const s = createCafe(); s.patches = 100; await open(page, s);
  const before = await page.evaluate(key => localStorage.getItem(key), key);
  await nav(page, 'Workshop'); await page.getByRole('button', { name: /^Craft Moss paw/ }).click();
  await nav(page, 'Cafe'); await page.getByRole('button', { name: /^Brave paws/ }).click();
  const local = await saved(page);
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(before);
  await page.clock.resume(); await page.reload(); await expect(page.getByTestId('cafe-adventure')).toBeVisible();
  const restored = await saved(page); expect(restored.inventory).toEqual(local.inventory); expect(restored.mastery).toBe('bold');
});
for (const [width, height] of [[1280,720],[1440,900],[1920,1080]] as const) test(`all adventure pages fit desktop ${width}x${height}`, async ({ page }) => {
  await page.setViewportSize({width,height}); await page.emulateMedia({reducedMotion:'reduce'}); await open(page, advanceCafe(createCafe(), 140));
  for (const name of ['Patrol','Wardrobe','Workshop','Journal','Cafe']) {
    await nav(page,name); await expect(page.getByRole('region',{name:`${name} page`,exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)).toBe(false);
    await page.locator('.cafe-shell img').evaluateAll(nodes => Promise.all(nodes.map(n => (n as HTMLImageElement).decode())));
    const bad = await page.locator('.cafe-shell img').evaluateAll(nodes => nodes.filter(n => !(n as HTMLImageElement).complete || !(n as HTMLImageElement).naturalWidth).map(n => n.getAttribute('src')));
    expect(bad).toEqual([]); await page.getByRole('region',{name:`${name} page`,exact:true}).focus(); await expect(page.getByRole('region',{name:`${name} page`,exact:true})).toBeFocused();
  }
});
