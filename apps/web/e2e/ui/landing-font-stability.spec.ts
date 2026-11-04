import { test, expect } from '../support/test';

for (const width of [1280, 1600]) for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Landing stays still when web fonts arrive ${width} ${reducedMotion}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width * 9 / 16 });
    await page.emulateMedia({ reducedMotion });
    // Keep the real font payloads, but ensure the fallback is painted first.
    await page.route('https://fonts.gstatic.com/**', async route => {
      const response = await route.fetch();
      await new Promise(resolve => setTimeout(resolve, 1200));
      await route.fulfill({ response });
    });
    await page.addInitScript(() => {
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      const shifts: { value: number; sources: string[] }[] = [];
      Object.assign(window, { landingShifts: shifts });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number; sources: { node?: Node }[] };
          if (!shift.hadRecentInput) shifts.push({ value: shift.value, sources: shift.sources.map(s =>
            (s.node instanceof Element ? s.node : s.node?.parentElement)?.outerHTML ?? '') });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/#landing', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('landing-start')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await page.evaluate(() => (window as unknown as { landingShifts: unknown[] }).landingShifts)).toEqual([]);
    for (const selector of ['.landing__guest-btn', '.landing__wallet-btn-wrap', '.landing__proof-item']) {
      for (const item of await page.locator(selector).all()) {
        expect(await item.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
      }
    }
  });
}
