import { expect, test } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';

for (const width of [1280, 1600]) for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`MOTION stable layout and identical final state ${width} ${reducedMotion}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
    await page.emulateMedia({ reducedMotion });
    const errors: string[] = [], writes: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.method()); });
    await page.goto('/motion-fixture/e2e/fixtures/motion-view.html');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const shifts: number[] = [];
      Object.assign(window, { __motionShifts: shifts });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) shifts.push((entry as PerformanceEntry & { value: number }).value);
      }).observe({ type: 'layout-shift' });
    });
    const before = await page.getByTestId('hud').boundingBox();
    await page.getByRole('button', { name: 'Play sample cues' }).click();
    if (reducedMotion === 'reduce') {
      expect(await page.locator('[data-motion-number="240000"]').textContent()).toBe('240,000');
      expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
    } else {
      const durations = await page.evaluate(() => document.getAnimations().map(animation => Number(animation.effect?.getTiming().duration)).filter(Number.isFinite));
      expect(durations.length).toBeGreaterThan(0); expect(Math.max(...durations)).toBeLessThanOrEqual(200);
    }
    await expect(page.locator('[data-motion-number="240000"]')).toHaveText('240,000');
    await expect(page.getByTestId('hud-level')).toContainText('Lv 10');
    await expect(page.getByTestId('sample-mint-cue')).toHaveText('Sample mint confirmed');
    await page.waitForTimeout(250);
    expect(await page.getByTestId('hud').boundingBox()).toEqual(before);
    const shift = await page.evaluate(() => (window as Window & { __motionShifts?: number[] }).__motionShifts?.reduce((sum, value) => sum + value, 0));
    expect(shift, 'All layout shifts, including recent-input shifts, must be zero').toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
    const loot = await page.getByTestId('home-recent-loot-card').boundingBox();
    expect(loot!.y + loot!.height, 'Loot card stays inside the panel').toBeLessThanOrEqual(width === 1280 ? 720 : 900);
    await page.getByRole('button', { name: 'Change sample panel' }).click();
    await page.waitForTimeout(200);
    if (process.env.MOTION_SCREENSHOTS) {
      fs.mkdirSync(process.env.MOTION_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: path.join(process.env.MOTION_SCREENSHOTS, `motion-${width}-${reducedMotion}.png`) });
    }
    expect(errors).toEqual([]); expect(writes).toEqual([]);
  });
}
