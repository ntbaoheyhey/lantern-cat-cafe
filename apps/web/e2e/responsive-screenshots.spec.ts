import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Screenshots overwrite committed images, so they are only written on request: SCREENSHOTS=1.
const writeScreenshots = process.env.SCREENSHOTS === '1';
const outDir = path.resolve(process.cwd(), '../../screenshots');
if (writeScreenshots && !fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

test.describe('Responsive visual verification & screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    });
  });

  const viewports = [
    { name: '1280px', width: 1280, height: 800, filePrefix: 'ui-page-cat-1280' },
    { name: '390px', width: 390, height: 844, filePrefix: 'ui-page-cat-390' },
    { name: '320px', width: 320, height: 568, filePrefix: 'ui-page-cat-320' },
  ];

  for (const vp of viewports) {
    test(`renders at ${vp.name} with no horizontal scroll and valid layout`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Verify page content elements
      await expect(page.getByRole('heading', { level: 1, name: 'Taskbar Hero' })).toBeVisible();
      await expect(
        page.getByText('Your cat fights on its own. Collect fish, upgrade gear, beat the bosses.'),
      ).toBeVisible();
      await expect(page.getByRole('region', { name: 'Mochi the cat' })).toBeVisible();
      await expect(page.getByRole('img', { name: 'Portrait of Mochi the cat' })).toBeVisible();
      await expect(page.getByTestId('cat-card-power')).toBeVisible();
      await expect(page.getByTestId('cat-card-boss-level')).toBeVisible();
      await expect(page.getByTestId('next-hint')).toBeVisible();

      // Check no horizontal scroll
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        return {
          docScrollWidth: doc.scrollWidth,
          docClientWidth: doc.clientWidth,
          bodyScrollWidth: body.scrollWidth,
          bodyClientWidth: body.clientWidth,
        };
      });

      expect(overflow.docScrollWidth).toBeLessThanOrEqual(overflow.docClientWidth);
      expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.bodyClientWidth);

      // Screenshot page initial view
      if (writeScreenshots) await page.screenshot({ path: path.join(outDir, `${vp.filePrefix}-page.png`) });

      // Open panel
      await page.getByRole('button', { name: 'Menu' }).click();
      const panel = page.getByRole('region', { name: 'Game panel' });
      await expect(panel).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Hero' })).toHaveAttribute('aria-selected', 'true');

      // Verify Hero tab stats inside panel
      await expect(panel.getByText('Fish', { exact: true })).toBeVisible();
      await expect(panel.getByText('Yarn', { exact: true })).toBeVisible();
      await expect(panel.getByText('Fish/sec')).toBeVisible();
      await expect(panel.getByText('Cat power', { exact: true })).toBeVisible();
      await expect(panel.getByTestId('hero-power')).toBeVisible();

      // Screenshot with panel open
      if (writeScreenshots) await page.screenshot({ path: path.join(outDir, `${vp.filePrefix}-panel.png`) });
    });
  }
});
