import { expect, test } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';

for (const width of [1280, 1600]) test(`ART2 flag-off landing and class stay pixel-identical to main 340f88b ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: Date.UTC(2026, 10, 3, 12) });
  await page.clock.pauseAt(Date.UTC(2026, 10, 3, 12));
  await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
  await page.goto('/#landing');
  for (const screen of ['landing', 'class']) {
    if (screen === 'class') await page.getByTestId('landing-start').click();
    await expect(page.getByTestId(screen === 'landing' ? 'landing-hero' : 'class-picker')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-art2]')).toHaveCount(0);
    const actual = await page.screenshot({ animations: 'disabled' });
    const baseline = fs.readFileSync(path.resolve(`e2e/ui/art2-baseline/${screen}-${width}.png`));
    expect(actual.equals(baseline), `${screen} ${width}: default-off pixels changed from accepted main`).toBe(true);
  }
});
