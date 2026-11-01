import { expect, test } from '../support/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockV2Save } from '../../src/api/mockV2Fixtures';

const key = readFileSync(resolve('src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  for (const gated of [false, true]) {
  test(`shared HUD keeps XP and every status chip visible at ${viewport.width}x${viewport.height}${gated ? ' when gated' : ''}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const nowMs = Date.now();
    const frontier = mockV2Save('midGame', { nowMs, chapter: 2 });
    const save = gated ? mockV2Save('bossReadyWeak', { nowMs, chapter: 2 }) : frontier;
    if (gated) {
      save.state.round = frontier.state.round;
      save.state.kills = frontier.state.kills;
      save.state.bestStage = frontier.state.bestStage;
    }
    await page.clock.install({ time: nowMs });
    await page.addInitScript(({ key, save }) => {
      localStorage.setItem(key, save);
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key, save: JSON.stringify(save) });
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
    if (gated) await expect(hud.getByRole('status')).toContainText('Needs about');
    const clipped = await hud.evaluate(root => {
      const problems: string[] = [];
      for (const node of [root, ...root.querySelectorAll('.hud-level-xp,.hud-progress-chip,.hud-stack-item,.hud-power-chip,.hud-power-hint')]) {
        const rect = node.getBoundingClientRect();
        for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
          const parent = ancestor.getBoundingClientRect(), style = getComputedStyle(ancestor);
          if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && (rect.left < parent.left - 1 || rect.right > parent.right + 1)) problems.push(`${node.className}: horizontal ancestor clipping`);
          if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY) && (rect.top < parent.top - 1 || rect.bottom > parent.bottom + 1)) problems.push(`${node.className}: vertical ancestor clipping`);
        }
      }
      return problems;
    });
    expect(clipped).toEqual([]);
    expect(await hud.locator('.hud-xp-fill').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
    await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
    if (process.env.SCREENSHOTS === '1') {
      await page.screenshot({ path: resolve(`../../reports/scorecard/base0/screens/hud-${viewport.width}${gated ? '-gated' : ''}.png`), animations: 'disabled' });
    }
  });
  }
}
