import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';

// ui/** is discovered by classic; explicitly use the existing v2 server.
test.use({ baseURL: 'http://localhost:4174', viewport: { width: 1280, height: 720 } });
const key = readFileSync(resolve('src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save: mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'witch' }) });
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`idle feedback changes monster pixels over three seconds (${reducedMotion})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
    await expect(canvas).toBeVisible();
    const frames: number[][] = [];
    for (let frame = 0; frame < 3; frame++) {
      if (frame) await page.waitForTimeout(1500);
      frames.push(await canvas.evaluate(element => {
        const c = element as HTMLCanvasElement;
        return Array.from(c.getContext('2d')!.getImageData(Math.floor(c.width / 2), 0, Math.floor(c.width / 2), c.height).data);
      }));
    }
    expect(frames.slice(1).some(frame => frame.some((pixel, i) => pixel !== frames[0]![i]))).toBe(true);
    expect(errors).toEqual([]);
  });
}

if (process.env.SCREENSHOTS === '1') {
  test('evidence screenshot set', async ({ page }) => {
    const dir = resolve('../../reports/u7-stage-fx');
    mkdirSync(dir, { recursive: true });
    const phase = process.env.U7_BASELINE === '1' ? 'before' : 'after';
    for (const [width, height, dark] of [[1600,900,false],[1280,720,false],[390,844,false],[320,568,false],[1280,720,true],[390,844,true]] as const) {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' });
      await page.goto('/');
      const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
      await expect(canvas).toBeVisible();
      await page.waitForTimeout(800);
      await page.screenshot({ path: resolve(dir, `${phase}-${width}x${height}${dark ? '-dark' : ''}.png`) });
    }
    if (phase === 'after') {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
      // Detect numerical white pixels above the HP track, independent of actor height.
      await expect.poll(() => canvas.evaluate(element => {
        const c = element as HTMLCanvasElement;
        const width = Math.floor(c.width * .2);
        const pixels = c.getContext('2d')!.getImageData(Math.floor(c.width * .6), 0, width, c.height).data;
        let barY = c.height;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] === 36 && pixels[i + 1] === 27 && pixels[i + 2] === 48 && pixels[i + 3] === 255) {
            barY = Math.min(barY, Math.floor(i / 4 / width));
          }
        }
        if (barY === c.height) return false;
        for (let i = 0; i < barY * width * 4; i += 4) {
          if (pixels[i]! > 220 && pixels[i + 1]! > 220 && pixels[i + 2]! > 220 && pixels[i + 3]! > 100) return true;
        }
        return false;
      }), { intervals: [50] }).toBe(true);
      await page.screenshot({ path: resolve(dir, 'after-damage-number.png') });
    }
  });
}
