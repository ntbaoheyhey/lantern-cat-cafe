import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockV2Save } from '../../src/api/mockV2Fixtures';

// The existing classic project discovers ui/**; target its v2 preview server explicitly.
test.use({ baseURL: 'http://localhost:4174', reducedMotion: 'reduce' });
const key = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const sizes = [
  { width: 1600, height: 900 }, { width: 1280, height: 720 },
  { width: 390, height: 844 }, { width: 320, height: 568 },
];

async function openHud(page: Page, gated = false) {
  const nowMs = Date.now();
  const fixture = mockV2Save(gated ? 'bossReadyWeak' : 'midGame', { nowMs, chapter: 2 });
  if (gated) {
    // A completed boss frontier is not idle-gated. Reuse midGame's frontier
    // with the existing weak loadout, without introducing progression rules.
    const frontier = mockV2Save('midGame', { nowMs, chapter: 2 }).state;
    fixture.state.round = frontier.round;
    fixture.state.kills = frontier.kills;
    fixture.state.bestStage = frontier.bestStage;
  }
  const save = JSON.stringify(fixture);
  await page.clock.install({ time: nowMs });
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const size of sizes) {
  test(`HUD readable at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await openHud(page);
    const hud = page.getByRole('region', { name: 'Cat status' });
    const progress = hud.locator('.hud-progress-text');
    expect(await progress.innerText()).toContain('Chapter 2 · Round 5');
    await expect(progress).toBeVisible();
    await expect(hud.locator('.hud-power-value')).toBeVisible();
    expect(await hud.locator('.hud-power-value').innerText()).toMatch(/^Power [\d,]+$/);
    const measures = await hud.evaluate(root => {
      const clipped = [...root.querySelectorAll<HTMLElement>('*')].filter(element =>
        element.scrollWidth > element.clientWidth + 1
      ).map(element => ({ tag: element.tagName, className: element.getAttribute('class'), scroll: element.scrollWidth, client: element.clientWidth }));
      const chips = [...root.querySelectorAll('.hud-level-xp, .hud-progress-chip, .hud-stack-item, .hud-power-chip')]
        .map(element => element.getBoundingClientRect());
      let intersections = 0;
      for (let i = 0; i < chips.length; i++) for (let j = i + 1; j < chips.length; j++) {
        const a = chips[i]!, b = chips[j]!;
        if (Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)) intersections++;
      }
      const rgb = getComputedStyle(root).backgroundColor.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const linear = rgb.map(value => { const s = value / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; });
      return { clipped, intersections, height: root.getBoundingClientRect().height, luminance: linear[0]! * .2126 + linear[1]! * .7152 + linear[2]! * .0722 };
    });
    expect(measures.clipped).toEqual([]);
    expect(measures.intersections).toBe(0);
    expect(measures.luminance).toBeLessThan(.2);
    if (size.width <= 390) expect(measures.height).toBeLessThanOrEqual(88);
    if (size.width === 1600) expect(measures.height).toBeLessThanOrEqual(64);
  });
}

const evidence = [
  ...sizes.map(size => ({ ...size, dark: false, gated: false })),
  ...[sizes[1]!, sizes[2]!].map(size => ({ ...size, dark: true, gated: false })),
  { width: 390, height: 844, dark: false, gated: true },
];
for (const view of evidence) {
  test(`HUD evidence ${view.width}x${view.height}${view.dark ? ' dark' : ''}${view.gated ? ' gated' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: view.width, height: view.height });
    await page.emulateMedia({ colorScheme: view.dark ? 'dark' : 'light' });
    await openHud(page, view.gated);
    const hud = page.getByRole('region', { name: 'Cat status' });
    if (view.gated) await expect(hud.getByRole('status')).toContainText('Needs about');
    else await expect(hud.getByRole('status')).toHaveCount(0);
    if (process.env.SCREENSHOTS === '1') {
      const phase = process.env.HUD_PHASE === 'before' ? 'before' : 'after';
      const name = `${phase}-${view.width}x${view.height}${view.dark ? '-dark' : ''}${view.gated ? '-gated' : ''}.png`;
      await page.screenshot({ path: path.resolve(process.cwd(), '../../reports/u2-hud', name), animations: 'disabled' });
    }
  });
}
