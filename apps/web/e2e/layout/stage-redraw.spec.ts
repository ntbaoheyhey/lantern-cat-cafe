import { expect, test } from '../support/test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';
import { stageHeight, stageZoom } from '../../src/layout/metrics';

const writeScreenshots = process.env.SCREENSHOTS === '1';
const outDir = process.env.SCREENSHOT_DIR ?? resolve(process.cwd(), '../../reports/fix-stage-redraw');
const KEY = readFileSync(resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

for (const reducedMotion of ['no-preference', 'reduce'] as const) test(`both actors survive scene recreation (${reducedMotion})`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.emulateMedia({ reducedMotion });
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'witch' }) });
  await page.goto('/');
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  const identity = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state.classId, KEY);
  for (const [width, height] of [[1600,900],[1280,720],[1024,768],[1023,600],[768,600],[601,480],[600,600],[390,844],[320,568],[844,390],[1280,480],[1600,900]]) {
    await page.setViewportSize({ width: width!, height: height! });
    const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
    await expect(canvas).toHaveCount(1);
    const zoom = stageZoom(width!, stageHeight(width!, height!));
    const logicalWidth = Math.max(160, Math.floor(width! / zoom));
    // Phaser removes the old canvas on its next frame. Check count and dimensions
    // together so a handoff between two separate assertions cannot hit the old canvas.
    await expect.poll(() => canvas.evaluateAll(elements => elements.map(element => {
      const c = element as HTMLCanvasElement;
      return [c.width, c.height];
    })), { message: `one resized canvas at ${width}×${height}` }).toEqual([[logicalWidth, 96]]);
    // The HTML backdrop is outside this transparent canvas. Check each actor's half,
    // so one surviving sprite cannot conceal a missing cat or monster.
    await expect.poll(() => canvas.evaluate(element => {
      const c = element as HTMLCanvasElement;
      const pixels = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      const halves = [false, false];
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if (pixels[(y * c.width + x) * 4 + 3]! > 0) halves[x < c.width / 2 ? 0 : 1] = true;
      }
      return halves;
    }), { message: `cat and monster redraw at ${width}×${height}` }).toEqual([true, true]);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state.classId, KEY)).toBe(identity);
    if (writeScreenshots && reducedMotion === 'reduce' && [1600, 390, 320].includes(width!)) await canvas.screenshot({ path: join(outDir, `actors-${width}-${height}.png`) });
  }
  expect(errors).toEqual([]);
});
