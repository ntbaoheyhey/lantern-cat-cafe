import { test, expect } from '@playwright/test';
import { readFileSync, statSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';

test.use({ baseURL: 'http://localhost:4174' });

const KEY = readFileSync(resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(
  /export const MOCK_V2_STORAGE_KEY = '([^']+)'/,
)![1]!;

const ROOMS = [
  { room: 'livingroom', chapter: 1 },
  { room: 'kitchen', chapter: 2 },
  { room: 'bathroom', chapter: 3 },
  { room: 'basement', chapter: 4 },
  { room: 'rooftops', chapter: 5 },
] as const;

const VIEWPORTS = [
  { width: 1600, height: 900 },
  { width: 390, height: 844 },
] as const;

for (const { room, chapter } of ROOMS) {
  for (const { width, height } of VIEWPORTS) {
    test(`${room} (chapter ${chapter}) at ${width}x${height} renders with vignette and no errors`, async ({
      page,
    }) => {
      mkdirSync('../../reports/u8-backdrops', { recursive: true });

      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });

      await page.addInitScript(
        ({ key, save }) => {
          localStorage.setItem(key, save);
          localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
        },
        {
          key: KEY,
          save: mockV2SaveJson('bossReadyWeak', { nowMs: Date.now(), classId: 'witch', chapter }),
        },
      );

      await page.setViewportSize({ width, height });
      await page.goto('/');

      const stage = page.getByRole('region', { name: 'Game stage' });
      await expect(stage.locator('canvas')).toBeVisible();

      // Ensure SVG backdrop is rendered and corresponds to current chapter room
      const backdropSvg = stage.locator('svg[data-backdrop]');
      await expect(backdropSvg).toBeVisible();
      await expect(backdropSvg).toHaveAttribute('data-backdrop', room);

      const shotPath = `../../reports/u8-backdrops/after-${room}-${width}.png`;
      const buffer = await stage.screenshot({ path: shotPath });

      // Check screenshot file size < 200 KB
      const stat = statSync(shotPath);
      expect(stat.size).toBeLessThan(200 * 1024);

      // Measure luminance of outer 10% strips vs center strip
      const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
      const { avgOuterLuminance, avgCenterLuminance } = await page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const w = canvas.width;
        const h = canvas.height;

        let outerSum = 0;
        let outerCount = 0;
        let centerSum = 0;
        let centerCount = 0;

        const leftBound = Math.floor(w * 0.10);
        const rightBound = Math.ceil(w * 0.90);
        const centerLeft = Math.floor(w * 0.45);
        const centerRight = Math.ceil(w * 0.55);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = imgData[idx]!;
            const g = imgData[idx + 1]!;
            const b = imgData[idx + 2]!;
            // Relative luminance
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            if (x < leftBound || x >= rightBound) {
              outerSum += lum;
              outerCount++;
            } else if (x >= centerLeft && x < centerRight) {
              centerSum += lum;
              centerCount++;
            }
          }
        }

        return {
          avgOuterLuminance: outerCount > 0 ? outerSum / outerCount : 0,
          avgCenterLuminance: centerCount > 0 ? centerSum / centerCount : 0,
        };
      }, dataUrl);

      console.log(
        `[${room} ${width}x${height}] outer: ${avgOuterLuminance.toFixed(2)}, center: ${avgCenterLuminance.toFixed(2)}`,
      );

      // The average luminance of the outer 10% left and right strips is lower than the center strip
      expect(avgOuterLuminance).toBeLessThan(avgCenterLuminance);

      // Stage renders without console errors
      expect(errors).toEqual([]);
    });
  }
}
