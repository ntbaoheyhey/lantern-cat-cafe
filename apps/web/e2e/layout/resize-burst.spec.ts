import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';
import { stageHeight, stageZoom } from '../../src/layout/metrics';

const KEY = readFileSync(resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

test('viewport drag limits Phaser recreation and keeps both actors', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    let inserted = 0;
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        // Phaser pools canvas nodes: count insertions, including reused nodes.
        if (node instanceof HTMLCanvasElement) inserted++;
        inserted += node.querySelectorAll('canvas').length;
      }
      document.documentElement.dataset.insertedCanvases = String(inserted);
    });
    observer.observe(document, { childList: true, subtree: true });
  }, { key: KEY, save: mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'witch' }) });
  await page.goto('/');
  const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
  await expect(canvas).toBeVisible();
  for (let step = 1; step <= 100; step++) {
    await page.setViewportSize({ width: 1600 - step * 12, height: 900 });
  }
  const width = 400;
  const logicalWidth = Math.max(160, Math.floor(width / stageZoom(width, stageHeight(width, 900))));
  await expect.poll(() => canvas.evaluateAll(elements => elements.map(element => {
    const c = element as HTMLCanvasElement;
    return [c.width, c.height];
  })), { message: 'one settled canvas after the drag' }).toEqual([[logicalWidth, 96]]);
  await expect.poll(() => canvas.evaluate(element => {
    const c = element as HTMLCanvasElement;
    const pixels = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    const halves = [false, false];
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (pixels[(y * c.width + x) * 4 + 3]! > 0) halves[x < c.width / 2 ? 0 : 1] = true;
    }
    return halves;
  }), { message: 'cat and monster after the drag' }).toEqual([true, true]);
  const inserted = await page.evaluate(() => Number(document.documentElement.dataset.insertedCanvases));
  console.log(`Phaser canvas instances inserted during 100-step drag: ${inserted}`);
  expect(inserted).toBeLessThanOrEqual(10);
});
