import { expect, test } from '../support/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';

const key = readFileSync(resolve('src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  test(`shared HUD keeps XP and every status chip visible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const nowMs = Date.now();
    await page.clock.install({ time: nowMs });
    await page.addInitScript(({ key, save }) => {
      localStorage.setItem(key, save);
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key, save: mockV2SaveJson('midGame', { nowMs, chapter: 2 }) });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const hud = page.getByRole('region', { name: 'Cat status' });
    const experience = hud.getByRole('progressbar', { name: 'Experience' });
    await expect(experience).toBeVisible();
    expect(await experience.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(8);
    const geometry = await hud.evaluate(root => {
      const outer = root.getBoundingClientRect();
      const nodes = [...root.querySelectorAll('.hud-level-xp,.hud-progress-chip,.hud-stack-item,.hud-power-chip')];
      return nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return {
          inside: rect.left >= outer.left && rect.right <= outer.right && rect.top >= outer.top && rect.bottom <= outer.bottom,
          unclipped: node.scrollWidth <= node.clientWidth + 1,
        };
      });
    });
    expect(geometry).toEqual(Array.from({ length: 6 }, () => ({ inside: true, unclipped: true })));
    expect(await hud.locator('.hud-xp-fill').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
    await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
    if (process.env.SCREENSHOTS === '1') {
      await page.screenshot({ path: resolve(`../../reports/scorecard/base0/screens/hud-${viewport.width}.png`), animations: 'disabled' });
    }
  });
}
