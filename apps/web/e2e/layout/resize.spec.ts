import { expect, test, type Page } from '@playwright/test';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';
import fs from 'node:fs';
import path from 'node:path';
const KEY = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
async function geometry(page: Page) {
  return page.locator('.hud-bar').evaluate(hud => {
    const outer = hud.getBoundingClientRect();
    const leaves = [...hud.querySelectorAll('.hud-level-badge,.hud-xp-track,.hud-xp-text,.hud-progress-chip,.hud-stack-item,.hud-power-chip')].map(e => ({ name: e.className, r: e.getBoundingClientRect() }));
    const issues: string[] = [];
    for (const { name, r } of leaves) if (r.left < outer.left - 1 || r.right > outer.right + 1 || r.top < outer.top - 1 || r.bottom > outer.bottom + 1) issues.push(`${name} outside HUD`);
    for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
      const a = leaves[i]!, b = leaves[j]!;
      if (Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left) > 1 && Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top) > 1) issues.push(`${a.name} overlaps ${b.name}`);
    }
    return issues;
  });
}
for (const theme of ['dark', 'light']) test(`continuous resize preserves state and readable HUD (${theme})`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(({ key, save, theme }) => {
    localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('data-theme', theme));
  }, { key: KEY, save: mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'witch' }), theme });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
  await page.getByRole('tab', { name: 'Forge', exact: true }).click();
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  const identity = await page.evaluate(key => { const s = JSON.parse(localStorage.getItem(key)!).state; return [s.classId, s.level, s.items.map((i: { id: string }) => i.id)]; }, KEY);
  for (const [width, height] of [[1600,900],[1280,720],[1024,768],[1023,600],[768,600],[601,480],[600,600],[390,844],[320,568],[844,390],[1280,480],[1600,900]]) {
    await page.setViewportSize({ width: width!, height: height! });
    await expect(page.locator('.v2-shell')).toHaveAttribute('data-layout', width! <= 600 ? 'phone' : width! < 1024 ? 'tablet' : 'desktop');
    await expect.poll(() => geometry(page), { message: `HUD at ${width}×${height}` }).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
    const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
    await expect(canvas).toHaveCount(1);
    await expect.poll(() => canvas.evaluate(element => {
      const c = element as HTMLCanvasElement;
      const pixels = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data;
      if (!pixels) return false;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! > 0) return true;
      return false;
    }), { message: 'stage actors redraw after resizing' }).toBe(true);
    if (width! <= 600) {
      await page.getByRole('tab', { name: 'Forge', exact: true }).click();
      await expect(page.getByRole('tabpanel', { name: 'Forge' })).toBeVisible();
      await page.getByRole('button', { name: 'Close panel' }).click();
    } else await expect(page.getByRole('tabpanel', { name: 'Forge' })).toBeVisible();
    expect(await page.evaluate(key => { const s = JSON.parse(localStorage.getItem(key)!).state; return [s.classId, s.level, s.items.map((i: { id: string }) => i.id)]; }, KEY)).toEqual(identity);
    if ([1600,1280,390,320].includes(width!) && height !== 480) {
      await page.screenshot({ path: `../../reports/responsive-window/${theme}-${width}-${height}.png` });
    }
  }
  expect(errors).toEqual([]);
});
