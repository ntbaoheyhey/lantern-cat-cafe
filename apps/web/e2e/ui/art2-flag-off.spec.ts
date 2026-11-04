import { expect, test } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';
import { pinVisualFonts } from '../support/visual-fonts';

for (const width of [1280, 1600]) test(`ART2 flag-off landing and class match reviewed pixel baselines ${width}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: Date.UTC(2026, 10, 3, 12) });
  await page.clock.pauseAt(Date.UTC(2026, 10, 3, 12));
  await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
  await pinVisualFonts(page);
  await page.goto('/#landing');
  for (const screen of ['landing', 'class']) {
    if (screen === 'class') await page.getByTestId('landing-start').click();
    await expect(page.getByTestId(screen === 'landing' ? 'landing-hero' : 'class-picker')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // The test clock is paused: explicitly service two paint frames after font layout.
    // Forty milliseconds cannot reach the existing30-second game claim interval.
    await page.clock.runFor(40);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-art2]')).toHaveCount(0);
    const actual = await page.screenshot({ animations: 'disabled' });
    // The intentional CLS repair has its own reviewed Landing baseline. Keep the
    // original main captures. Native rasterization differs across OSes, so each
    // supported platform has reviewed baselines; keep zero pixel/byte tolerance.
    const baselineScreen = screen === 'landing' ? 'landing-stable' : screen;
    const baseline = fs.readFileSync(path.resolve(`e2e/ui/art2-baseline/${process.platform}/${baselineScreen}-${width}.png`));
    if (!actual.equals(baseline)) {
      await testInfo.attach('flag-off-actual', { body: actual, contentType: 'image/png' });
      await testInfo.attach('flag-off-baseline', { body: baseline, contentType: 'image/png' });
      if (process.env.ART2_SCREENSHOTS) {
        fs.mkdirSync(process.env.ART2_SCREENSHOTS, { recursive: true });
        const name = path.join(process.env.ART2_SCREENSHOTS, `unexpected-${screen}-${width}-${testInfo.repeatEachIndex}-${testInfo.workerIndex}`);
        fs.writeFileSync(name + '.png', actual, { flag: 'wx' });
        fs.writeFileSync(name + '.json', JSON.stringify(await page.evaluate(() => ({ fontStatus: document.fonts.status, fonts: [...document.fonts].map(face => ({ family: face.family, status: face.status })), title: document.querySelector('.landing__title')?.getBoundingClientRect().toJSON() })), null, 2));
      }
    }
    expect(actual.equals(baseline), `${screen} ${width}: default-off pixels changed from reviewed baseline`).toBe(true);
  }
});
