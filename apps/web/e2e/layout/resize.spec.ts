import { expect, test, type Page } from '../support/test';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';
import { desktopStageMetrics, stageHeight, stageZoom } from '../../src/layout/metrics';
import { backdropFor } from '../../src/art/backdrops';
import { computeFloorY } from '../../src/game/stage/stageFx';
import fs from 'node:fs';
import path from 'node:path';
const writeScreenshots = process.env.SCREENSHOTS === '1';
const outDir = process.env.SCREENSHOT_DIR ?? path.resolve(process.cwd(), '../../reports/responsive-window');
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
for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
for (const theme of ['dark', 'light']) test(`continuous resize preserves state and readable HUD (${theme}, ${viewport.width}x${viewport.height})`, async ({ page }) => {
  await page.setViewportSize(viewport);
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
    if (width! >= 600) {
      await expect.poll(() => geometry(page), { message: `HUD at ${width}×${height}` }).toEqual([]);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
    const homeTab = page.getByRole('tab', { name: 'Home', exact: true });
    if ((await homeTab.count()) > 0) {
      await homeTab.click();
    }
    const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
    await expect(canvas).toHaveCount(1);
    const isDesktop = width! > 600;
    const stageW = width! <= 600 ? width! : Math.floor(width! * 0.55);
    const logicalWidth = isDesktop
      ? desktopStageMetrics(width!, height!).logicalWidth
      : Math.max(160, Math.floor(stageW / stageZoom(stageW, stageHeight(width!, height!))));
    await expect.poll(() => canvas.evaluateAll((elements, expectedWidth) => {
      if (elements.length !== 1) return false;
      const c = elements[0] as HTMLCanvasElement;
      if (c.width !== expectedWidth || c.height !== 96) return false;
      const pixels = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data;
      if (!pixels) return false;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! > 0) return true;
      return false;
    }, logicalWidth), { message: `stage content redraws at ${width}×${height} (expected logicalWidth=${logicalWidth})` }).toBe(true);
    await page.getByRole('tab', { name: 'Forge', exact: true }).click();
    await expect(page.getByRole('tabpanel', { name: 'Forge' })).toBeVisible();
    expect(await page.evaluate(key => { const s = JSON.parse(localStorage.getItem(key)!).state; return [s.classId, s.level, s.items.map((i: { id: string }) => i.id)]; }, KEY)).toEqual(identity);
    if (writeScreenshots && [1600,1280,390,320].includes(width!) && height !== 480) {
      await page.screenshot({ path: path.join(outDir, `${theme}-${width}-${height}.png`) });
    }
  }
  expect(errors).toEqual([]);
});
}

// A nonempty transparent canvas does not prove that its sprites rendered:
// drawGround() still paints two shadows and, during combat, two HP bars.
// Use a natural boss-ready state, where combat/HP bars are halted, and inspect
// only rows above the four-pixel-high ground ellipses. There are no attack
// projectiles, hit flashes or damage text in this stationary scene.
for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`both sprite bodies survive resize without counting shadows (${viewport.width}x${viewport.height}, ${reducedMotion})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize(viewport);
    await page.addInitScript(({ key, save }) => {
      localStorage.setItem(key, save);
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: KEY, save: mockV2SaveJson('bossReadyWeak', { nowMs: Date.now(), classId: 'witch', chapter: 1 }) });
    await page.goto('/');
    const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
    const bodyBottom = computeFloorY(96, backdropFor(1).floorY) - 3;
    for (const [width, height] of [[viewport.width, viewport.height], [1024,768], [1023,600], [601,480], [600,600], [390,844], [320,568], [844,390], [viewport.width, viewport.height]]) {
      await page.setViewportSize({ width: width!, height: height! });
      const logicalWidth = width! > 600
        ? desktopStageMetrics(width!, height!).logicalWidth
        : Math.max(160, Math.floor(width! / stageZoom(width!, stageHeight(width!, height!))));
      await expect.poll(() => canvas.evaluateAll((elements, expected) => {
        if (elements.length !== 1) return [];
        const c = elements[0] as HTMLCanvasElement;
        if (c.width !== expected.width || c.height !== 96) return [];
        const pixels = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
        const bodies = [false, false];
        for (let y = 0; y < expected.bottom; y++) for (let x = 0; x < c.width; x++) {
          if (pixels[(y * c.width + x) * 4 + 3]! > 0) bodies[x < c.width / 2 ? 0 : 1] = true;
        }
        return bodies;
      }, { width: logicalWidth, bottom: bodyBottom }), { message: `both sprite bodies above ground at ${width}×${height}` }).toEqual([true, true]);
    }
    expect(errors).toEqual([]);
  });
}
}
