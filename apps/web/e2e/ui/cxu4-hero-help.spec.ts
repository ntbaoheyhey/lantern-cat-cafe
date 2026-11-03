import { expect, test, type Page } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';
import { crc32, deflateSync, inflateSync } from 'node:zlib';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { sampleStateV2 } from '../../src/layout/sampleState';
const storageKey = fs.readFileSync(path.resolve('src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const sizes = [{ width: 1280, height: 720 }, { width: 1600, height: 900 }];

test.beforeEach(async ({ page }) => {
  const sample = sampleStateV2(), save = mockV2Save('midGame', { nowMs: Date.now(), classId: 'warrior' });
  Object.assign(save.state, { classId: sample.cat.classId, level: sample.cat.level, xp: sample.cat.xp, ...sample.progress,
    stacks: { ...sample.materials, fish: sample.currencies.fish, yarn: sample.currencies.yarn, catKey: sample.currencies.keys },
    items: sample.inventory.map(item => ({ ...item, itemId: item.itemKey, bonusLines: item.bonus, source: 'drop' as const })) });
  await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
});
async function layout(page: Page) {
  expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false });
  const clipped = await page.locator('.hero-sheet:visible button, .help-columns:visible button, .help-columns:visible input').evaluateAll(elements => elements.filter(element => {
    const rect = element.getBoundingClientRect();
    if (rect.x < 0 || rect.y < 0 || rect.right > innerWidth || rect.bottom > innerHeight) return true;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
      if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.y < bounds.y - 1 || rect.bottom > bounds.bottom + 1)) return true;
      if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.x < bounds.x - 1 || rect.right > bounds.right + 1)) return true;
    }
    return false;
  }).map(element => element.textContent));
  expect(clipped).toEqual([]);
}
async function screenshot(page: Page, name: string) {
  // Recompress IDAT losslessly: preserve the exact pixels and the 200 KiB evidence gate.
  const raw = await page.screenshot(), chunks: Buffer[] = [], data: Buffer[] = [];
  for (let offset = 8; offset < raw.length;) {
    const length = raw.readUInt32BE(offset), chunk = raw.subarray(offset, offset + length + 12);
    if (chunk.toString('ascii', 4, 8) === 'IDAT') data.push(chunk.subarray(8, -4)); else chunks.push(chunk);
    offset += length + 12;
  }
  const compressed = deflateSync(inflateSync(Buffer.concat(data)), { level: 9 });
  const idat = Buffer.alloc(compressed.length + 12); idat.writeUInt32BE(compressed.length);
  idat.write('IDAT', 4); compressed.copy(idat, 8); idat.writeUInt32BE(crc32(idat.subarray(4, -4)), idat.length - 4);
  const end = chunks.pop()!;
  const bytes = Buffer.concat([raw.subarray(0, 8), ...chunks, idat, end]); expect(bytes.byteLength).toBeLessThan(200 * 1024);
  if (process.env.SCREENSHOTS === '1') { const dir = path.resolve('../../reports/scorecard/cxu4'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${name}.png`), bytes); }
}
for (const size of sizes) {
  test(`CXU4 Hero equipment, power and class confirmation ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size); await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/#hero');
    await expect(page.getByRole('tab', { name: 'Hero', exact: true })).toHaveAttribute('aria-selected', 'true');
    const hero = page.getByRole('region', { name: 'Character' }); await expect(hero).toBeVisible();
    await expect(hero.getByRole('group', { name: 'Gear slots' }).getByRole('button')).toHaveCount(9);
    const sum = await hero.locator('[data-testid^="power-"]').allTextContents();
    await expect(page.getByTestId('character-power')).toHaveText(String(sum.reduce((a, b) => a + Number(b), 0)));
    await layout(page); await screenshot(page, `hero-${size.width}`);
    await page.getByRole('tab', { name: 'Bag', exact: true }).click();
    await page.getByRole('button', { name: /^Silverclaw Saber, / }).click();
    await page.getByRole('region', { name: 'Item detail' }).getByRole('button', { name: 'Equip', exact: true }).click();
    await page.getByRole('tab', { name: 'Hero', exact: true }).click();
    await expect(hero.getByRole('button', { name: 'Weapon: Silverclaw Saber, Rare' })).toBeVisible();
    const change = page.getByRole('button', { name: 'Change class', exact: true }); await change.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    const dialog = page.getByRole('dialog', { name: 'Change class' }); await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await page.keyboard.press('Shift+Tab'); await expect(page.getByLabel('Cat class')).toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(page.getByLabel('Close Change class')).toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    await screenshot(page, `modal-${size.width}`);
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(change).toBeFocused();
    await page.keyboard.press('Enter'); await page.getByLabel('Cat class').selectOption('archer');
    const release = await page.evaluateHandle(() => {
      const usable: boolean[] = [];
      const observer = new MutationObserver(() => {
        if (!document.querySelector('[role="dialog"]')) {
          const root = document.getElementById('root')!;
          usable.push(!root.hasAttribute('inert') && root.getAttribute('aria-hidden') !== 'true');
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return { usable, observer };
    });
    await page.getByRole('button', { name: 'Confirm class', exact: true }).click(); await expect(dialog).toHaveCount(0);
    const released = await release.evaluate(({ usable, observer }) => { observer.disconnect(); return usable; });
    await release.dispose();
    expect(released.length).toBeGreaterThan(0);
    expect(released).not.toContain(false);
    await expect(hero.locator('.character-meta')).toContainText('Archer');
    await expect(page.getByRole('status').filter({ hasText: 'Class changed to Archer.' })).toBeVisible();
    await expect(change).toBeFocused();
    expect(errors).toEqual([]);
  });
  test(`CXU4 Help keyboard search, selection and offline banner ${size.width}`, async ({ page, context }) => {
    await page.setViewportSize(size); await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#help');
    await expect(page.getByRole('tab', { name: 'Help', exact: true })).toHaveAttribute('aria-selected', 'true');
    const help = page.getByRole('tabpanel', { name: 'Help', exact: true });
    await expect(help.getByRole('heading', { level: 3 })).toHaveText('Getting started');
    const search = page.getByRole('searchbox', { name: 'Search help' }); await search.focus(); await page.keyboard.type('catnap');
    await expect(help.getByRole('heading', { level: 3 })).toHaveText('Cat Keys and bosses');
    await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Cat Keys and bosses' })).toBeFocused(); await page.keyboard.press('Enter');
    await search.fill('30 Yarn'); await expect(help.getByRole('heading', { level: 3 })).toHaveText('Forge');
    await search.fill('Warrior: sword'); await expect(help.getByRole('heading', { level: 3 })).toHaveText('Classes');
    await search.fill(''); await page.getByRole('button', { name: 'Forge', exact: true }).focus(); await page.keyboard.press('Enter');
    await expect(help.getByRole('heading', { level: 3 })).toHaveText('Forge'); await layout(page); await screenshot(page, `help-${size.width}`);
    await search.fill('unfindable-qxyz'); await expect(page.getByRole('heading', { name: 'No matching topics' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(help.getByRole('heading', { level: 3 })).toHaveText('Forge');
    await help.getByRole('button', { name: 'Start Exploring', exact: true }).click();
    await expect(page.getByTestId('home-dashboard')).toBeVisible();
    await page.getByRole('tab', { name: 'Hero', exact: true }).click(); await context.setOffline(true); await page.evaluate(() => dispatchEvent(new Event('offline')));
    const notice = page.getByRole('region', { name: 'Character' }).getByTestId('action-notice');
    await expect(notice).toBeVisible(); await expect(notice).toHaveAttribute('data-tone', 'offline');
    await expect(notice).toHaveText('You are offline. Your cat keeps working; we will sync when you are back.');
    await context.setOffline(false); await page.evaluate(() => dispatchEvent(new Event('online'))); await expect(notice).toHaveCount(0);
  });
}
