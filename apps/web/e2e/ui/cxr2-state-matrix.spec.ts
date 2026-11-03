import { test, expect, type Page } from '../support/test';
import { v2 } from '@taskbar-hero/game-rules';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const storageKey = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const screens = ['Home', 'Bag', 'Map', 'Forge', 'Market', 'Hero', 'Help'] as const;
const scenarios = ['normal', 'zero-empty', 'maximum-long', 'full-bag', 'offline'] as const;

async function inspect(page: Page, label: string) {
  expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight })), label).toEqual({ x: false, y: false });
  const hud = page.getByTestId('hud');
  const clipped = await hud.evaluate(root => [...root.querySelectorAll<HTMLElement>('*')]
    .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' && node.scrollWidth > node.clientWidth + 1)
    .map(node => node.getAttribute('data-testid') || node.className));
  expect(clipped, label + ' HUD text').toEqual([]);
  if (await page.getByTestId('home-dashboard').isVisible()) {
    const currencyClip = await page.locator('.home-loot-currencies').evaluateAll(nodes => nodes.some(node => node.scrollWidth > node.clientWidth + 1));
    expect(currencyClip, label + ' recent loot currencies').toBe(false);
  }
  for (const control of await page.locator('button:visible, a[href]:visible, input:visible, select:visible').all()) {
    await expect(control, label).toHaveAccessibleName(/\S/);
  }
  if (process.env.CXR2_SCREENSHOTS) {
    mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
    await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, label + '.png') });
  }
}

for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  for (const scenario of scenarios) {
    test(`CXR2 screen/state review ${size.width} ${scenario}`, async ({ page, context }) => {
      await page.setViewportSize(size); await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      const now = Date.now();
      const save = mockV2Save(scenario === 'maximum-long' ? 'bossReadyStrong' : 'forgeRich', { nowMs: now, classId: 'warrior' });
      if (scenario === 'zero-empty') { save.state.items = []; save.state.stacks = { fish: 0 }; }
      if (scenario === 'full-bag') {
        while (save.state.items.length < v2.V2_CONFIG.bag.limit) save.state.items.push({ ...save.state.items[1]!, id: `cxr2-full-${save.state.items.length}`, equipped: false });
      }
      if (scenario === 'maximum-long') {
        // Maximum representable Fish and registry-capped materials, not new economy limits.
        save.state.stacks = { fish: Number.MAX_SAFE_INTEGER, ...Object.fromEntries(v2.MATERIALS.map(material => [material.id, material.maxStack])) };
        const longest = [...v2.ITEMS].sort((a, b) => b.name.length - a.name.length)[0]!;
        save.state.items.push({ id: 'cxr2-longest', itemId: longest.id, itemKey: longest.id, slot: longest.slot, rarity: longest.rarity,
          ...(longest.weaponType ? { weaponType: longest.weaponType } : {}), level: 1, bonus: [], bonusLines: [], equipped: false, locked: false, source: 'drop' });
      }
      await page.clock.install({ time: new Date(0) });
      await page.clock.pauseAt(new Date(now));
      await page.addInitScript(({ key, value }) => { localStorage.setItem(key, value); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, value: JSON.stringify(save) });
      await page.goto('/#home');
      await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.clock.runFor(500);
      if (scenario === 'maximum-long') await expect(page.getByTestId('hud-gold')).toHaveAttribute('aria-label', 'Fish 9,007,199,254,740,991');
      if (scenario === 'zero-empty') await expect(page.getByTestId('hud-gold')).toHaveAttribute('aria-label', 'Fish 0');
      if (scenario === 'offline') { await context.setOffline(true); await page.evaluate(() => dispatchEvent(new Event('offline'))); }
      for (const screen of screens) {
        await page.getByRole('tab', { name: screen, exact: true }).click();
        await expect(page.getByRole('tab', { name: screen, exact: true })).toHaveAttribute('aria-selected', 'true');
        if (scenario === 'offline') await expect(page.locator('header [data-sync-status="offline"]')).toBeVisible();
        if (scenario === 'full-bag' && screen === 'Bag') {
          await expect(page.getByTestId('bag-count')).toHaveText('Bag 200 / 200');
          await expect(page.getByRole('status').filter({ hasText: 'Bag full' })).toBeVisible();
          await expect(page.locator('.bag-slot.empty')).toHaveCount(0);
        }
        if (scenario === 'zero-empty' && screen === 'Bag') await expect(page.locator('.bag-slot.empty')).toHaveCount(200);
        if (scenario === 'full-bag' && screen === 'Forge') await expect(page.getByTestId('craft-btn')).toBeDisabled();
        await inspect(page, `${screen.toLowerCase()}-${scenario}-${size.width}`);
        if (screen === 'Forge') {
          for (const sub of ['salvage', 'relic']) { await page.getByTestId('tab-' + sub).click(); await inspect(page, `forge-${sub}-${scenario}-${size.width}`); }
        }
      }
      expect(errors).toEqual([]);
    });
  }
}
