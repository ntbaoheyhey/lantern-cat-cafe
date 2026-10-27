import { expect, test } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.cwd(), '../../reports/g4-art-pilot');

test.describe('Art Pilot Dev View (/?dev=art-pilot)', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test('loads /?dev=art-pilot and renders pilot overview', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?dev=art-pilot');

    const view = page.getByTestId('art-pilot-view');
    await expect(view).toBeVisible();

    // Verify header title
    await expect(page.getByRole('heading', { name: /Mission G4 — Art Pilot/i })).toBeVisible();

    // Verify cost metrics panel
    await expect(page.getByText('Piece 5: Production Cost & Texture Memory Metrics')).toBeVisible();

    // Capture overview screenshot
    if (process.env.SCREENSHOTS === '1') {
      await page.screenshot({ path: path.join(outDir, '01-pilot-overview.png') });
    }
  });

  test('switches tabs and captures detailed inspection views', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?dev=art-pilot');

    // 1. Old vs New Comparison
    await page.getByTestId('tab-vs').click();
    const vsSection = page.getByTestId('old-vs-new-section');
    await expect(vsSection).toBeVisible();
    if (process.env.SCREENSHOTS === '1') {
      await vsSection.screenshot({ path: path.join(outDir, '02-old-vs-new-comparison.png') });
    }

    // 2. Backdrop View at 3x
    await page.getByTestId('tab-backdrop').click();
    const backdropSection = page.getByTestId('backdrop-view-section');
    await expect(backdropSection).toBeVisible();
    if (process.env.SCREENSHOTS === '1') {
      await backdropSection.screenshot({ path: path.join(outDir, '03-roster-backdrop-3x.png') });
    }

    // 3. Silhouette Readability View (1x and 2x)
    await page.getByTestId('tab-silhouette').click();
    const silSection = page.getByTestId('silhouette-view-section');
    await expect(silSection).toBeVisible();
    if (process.env.SCREENSHOTS === '1') {
      await silSection.screenshot({ path: path.join(outDir, '10-silhouettes-1x-readability.png') });
    }

    // 4. Reduced-Motion View
    await page.getByTestId('tab-reduced').click();
    const redSection = page.getByTestId('reduced-motion-section');
    await expect(redSection).toBeVisible();
    if (process.env.SCREENSHOTS === '1') {
      await redSection.screenshot({ path: path.join(outDir, '11-reduced-motion-view.png') });
    }

    // 5. Frames Matrix (individual character cards)
    await page.getByTestId('tab-frames').click();
    const framesSection = page.getByTestId('all-frames-section');
    await expect(framesSection).toBeVisible();

    if (process.env.SCREENSHOTS === '1') {
      const cards = framesSection.locator('.art-pilot__card');
      const count = await cards.count();
      // Card 0: Warrior Cat
      if (count > 0) {
        await cards.nth(0).screenshot({ path: path.join(outDir, '09-warrior-cat-frames.png') });
      }
      // Card 1: Dust Bunny
      if (count > 1) {
        await cards.nth(1).screenshot({ path: path.join(outDir, '04-dust-bunny-frames.png') });
      }
      // Card 2: Loose Yarn
      if (count > 2) {
        await cards.nth(2).screenshot({ path: path.join(outDir, '05-loose-yarn-frames.png') });
      }
      // Card 3: Sock Puppet
      if (count > 3) {
        await cards.nth(3).screenshot({ path: path.join(outDir, '06-sock-puppet-frames.png') });
      }
      // Card 4: Roomba Scout
      if (count > 4) {
        await cards.nth(4).screenshot({ path: path.join(outDir, '07-roomba-scout-frames.png') });
      }
      // Card 5: Yarn Giant
      if (count > 5) {
        await cards.nth(5).screenshot({ path: path.join(outDir, '08-yarn-giant-frames.png') });
      }
    }
  });

  test('mobile viewport rendering (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?dev=art-pilot');

    const view = page.getByTestId('art-pilot-view');
    await expect(view).toBeVisible();

    if (process.env.SCREENSHOTS === '1') {
      await page.screenshot({ path: path.join(outDir, '12-mobile-pilot-view.png') });
    }
  });
});
