import { test, expect, type Page } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const key = readFileSync(resolve('src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const evidence = resolve('../../reports/g3-combat');
type Scenario = 'melee' | 'ranged' | 'elite' | 'gated' | 'round-cleared';
async function install(page: Page, scenario: Scenario, clock = true) {
  if (clock) await page.clock.install({ time: Date.now() });
  const save = mockV2Save('bossReadyStrong', { nowMs: Date.now(), classId: scenario === 'ranged' ? 'archer' : 'warrior' });
  save.state.round = 1; save.state.kills = scenario === 'elite' || scenario === 'round-cleared' ? 5 : 0;
  if (scenario === 'gated') { save.state.level = 1; save.state.items = []; save.state.round = 10; save.state.chapter = 5; }
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save: JSON.stringify(save) });
}
async function authoritativeLabel(page: Page) {
  const p = await page.evaluate(() => window.__g1Loop.getSnapshot().state!.progress);
  await expect(page.getByLabel('Stage progress')).toContainText(`Chapter ${p.chapter} · Round ${p.round} / 10`);
  await expect(page.getByLabel(`${p.kills} / ${p.killsPerRound} kills; last kill is elite`, { exact: true })).toBeVisible();
}
async function shot(page: Page, name: string) {
  if (process.env.SCREENSHOTS !== '1') return;
  mkdirSync(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, `${name}.png`) });
}
for (const [width, height] of [[1280, 720], [390, 844]]) for (const scenario of ['melee', 'ranged', 'elite', 'gated', 'round-cleared'] as const) {
  test(`G3 ${scenario} ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width: width!, height: height! });
    await install(page, scenario);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const canvas = page.locator('.v2-stage-canvas canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-stage-monster', /mon\./);
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 50);
    await authoritativeLabel(page);
    if (scenario === 'gated') {
      await expect(page.getByText('Too strong — equip better gear', { exact: true })).toBeVisible();
      await page.clock.runFor(1600);
      expect(await canvas.getAttribute('data-stage-impact')).toBeNull();
    } else if (scenario === 'round-cleared') {
      await page.clock.runFor(1600);
      await page.clock.setSystemTime(Date.now() + 15_000);
      await page.evaluate(() => window.__g1Loop.claimNow());
      await expect(page.locator('.stage-moment')).toHaveText('Round cleared');
      await authoritativeLabel(page);
    } else if (scenario === 'ranged') {
      for (let frame = 0; frame < 140 && !(await canvas.getAttribute('data-stage-impact')); frame++) await page.clock.runFor(16);
      expect(await canvas.getAttribute('data-stage-release')).not.toBeNull();
      expect(await canvas.getAttribute('data-stage-impact')).not.toBeNull();
      expect(Number(await canvas.getAttribute('data-stage-impact')) - Number(await canvas.getAttribute('data-stage-release'))).toBe(200);
    } else {
      if (scenario === 'elite') await expect(canvas).toHaveAttribute('data-stage-monster', /roomba.scout/);
      for (let frame = 0; frame < 140 && !(await canvas.getAttribute('data-stage-contact-gap')); frame++) await page.clock.runFor(16);
      expect(await canvas.getAttribute('data-stage-contact-gap')).not.toBeNull();
      expect(Number(await canvas.getAttribute('data-stage-contact-gap'))).toBeLessThanOrEqual(4);
      expect(Number(await canvas.getAttribute('data-stage-contact-gap'))).toBeGreaterThanOrEqual(0);
    }
    await shot(page, `${scenario}-${width}x${height}`);
    expect(errors).toEqual([]);
  });
}

test('G3 stage frame p95 stays within 20ms in the demo build', async ({ page }) => {
  await install(page, 'melee', false); await page.goto('/');
  await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();
  await page.waitForTimeout(1000);
  const metrics = await page.evaluate(() => new Promise<{ p95: number; frames: number }>(resolve => {
    const values: number[] = []; let previous = 0;
    const frame = (now: number) => {
      if (previous) values.push(now - previous); previous = now;
      if (values.length < 180) requestAnimationFrame(frame);
      else { values.sort((a, b) => a - b); resolve({ p95: values[Math.floor(values.length * .95)]!, frames: values.length }); }
    };
    requestAnimationFrame(frame);
  }));
  mkdirSync(evidence, { recursive: true });
  writeFileSync(resolve(evidence, 'frame-metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
  console.log('G3 stage frame metrics', metrics);
  expect(metrics.p95).toBeLessThanOrEqual(20);
});

test('G3 reduced motion and remaining evidence viewports', async ({ page }) => {
  await install(page, 'ranged');
  for (const [width, height, colorScheme] of [[1600, 900, 'light'], [320, 568, 'light'], [1280, 720, 'dark'], [390, 844, 'dark']] as const) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme });
    await page.goto('/');
    await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();
    await page.waitForTimeout(900);
    await authoritativeLabel(page);
    await shot(page, `reduced-${width}x${height}-${colorScheme}`);
  }
});
