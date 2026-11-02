import { expect, test } from '../support/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';
import { stageHeight, stageZoom } from '../../src/layout/metrics';

const KEY = readFileSync(resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
test(`viewport drag limits Phaser recreation and keeps canvas content (${viewport.width}x${viewport.height})`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`);
  });
  await page.setViewportSize(viewport);
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
    await page.setViewportSize({ width: Math.round(viewport.width - step * (viewport.width - 400) / 100), height: viewport.height });
  }
  const width = 400;
  const logicalWidth = Math.max(160, Math.floor(width / stageZoom(width, stageHeight(width, viewport.height))));
  await expect.poll(() => canvas.evaluateAll(elements => elements.map(element => {
    const c = element as HTMLCanvasElement;
    return [c.width, c.height];
  })), { message: 'one settled canvas after the drag' }).toEqual([[logicalWidth, 96]]);
  // Read cardinality, size and painted content in the same browser turn: the
  // desktop/phone boundary replaces the scene and can detach a selected node.
  // Shadows and HP bars also paint pixels; resize.spec.ts separately verifies
  // both sprite bodies while combat is halted and the ground is excluded.
  await expect.poll(() => canvas.evaluateAll((elements, expectedWidth) => {
    if (elements.length !== 1) return [];
    const c = elements[0] as HTMLCanvasElement;
    if (c.width !== expectedWidth || c.height !== 96) return [];
    const pixels = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    const halves = [false, false];
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (pixels[(y * c.width + x) * 4 + 3]! > 0) halves[x < c.width / 2 ? 0 : 1] = true;
    }
    return halves;
  }, logicalWidth), { message: 'painted content in both halves of one correctly sized canvas after the drag' }).toEqual([true, true]);
  const inserted = await page.evaluate(() => Number(document.documentElement.dataset.insertedCanvases));
  console.log(`Phaser canvas instances inserted during 100-step drag: ${inserted}`);
  expect(inserted).toBeLessThanOrEqual(10);
  expect(errors).toEqual([]);
});
}
