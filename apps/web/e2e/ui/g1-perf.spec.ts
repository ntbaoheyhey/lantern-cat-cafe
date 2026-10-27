import { test, expect, type Page, type Locator } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import type { GameLoopV2 } from '../../src/game/v2/loopV2';
import fs from 'node:fs';
import path from 'node:path';

declare global { interface Window { __g1Loop: GameLoopV2; __g1Timing: { start: number; pending: number | null; paint: number | null; events: { name: string; duration: number; inputDelay: number }[] } } }
const MOCK_V2_STORAGE_KEY = fs.readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const report = path.resolve('../../reports/g1-speed/metrics.json');

async function feedback(page: Page, button: Locator) {
  await page.evaluate(() => {
    const timing = window.__g1Timing = { start: 0, pending: null, paint: null, events: [] } as Window['__g1Timing'];
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEventTiming;
        if (e.name === 'click' && timing.start > 0 && e.startTime >= timing.start - 1) timing.events.push({ name: e.name, duration: e.duration, inputDelay: e.processingStart - e.startTime });
      }
    });
    observer.observe({ type: 'event', durationThreshold: 16, buffered: false } as PerformanceObserverInit & { durationThreshold: number });
    document.addEventListener('click', e => { timing.start = e.timeStamp; }, { once: true, capture: true });
    const off = window.__g1Loop.subscribe(() => {
      const snap = window.__g1Loop.getSnapshot();
      if (snap.busy && timing.pending === null) {
        timing.pending = performance.now();
        requestAnimationFrame(() => { timing.paint = performance.now(); });
      }
    });
    setTimeout(() => { off(); observer.disconnect(); }, 1000);
  });
  await button.click();
  await expect.poll(() => page.evaluate(() => window.__g1Timing.paint)).not.toBeNull();
  // Event Timing entries below Chromium's minimum 16ms reporting threshold are absent.
  await page.waitForTimeout(160);
  return page.evaluate(() => {
    const t = window.__g1Timing;
    return { clickToPendingMs: t.pending! - t.start, nextFrameMs: t.paint! - t.start, eventTiming: t.events };
  });
}

test('G1 demo action feedback, resize lifecycle and three plain claims', async ({ page, context }) => {
  const save = mockV2Save('bossReadyStrong', { nowMs: Date.now() });
  const rich = mockV2Save('forgeRich', { nowMs: Date.now() });
  save.state.stacks = { ...rich.state.stacks, catKey: 3 };
  save.state.items.filter(i => ['weapon', 'helmet'].includes(i.slot)).forEach(i => { i.equipped = false; });
  await page.addInitScript(({ save, key }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { save: JSON.stringify(save), key: MOCK_V2_STORAGE_KEY });
  await page.goto('/');
  await expect(page.locator('.v2-stage-canvas canvas')).toHaveCount(1);
  await expect.poll(() => page.locator('.v2-stage-canvas canvas').getAttribute('data-stage-rebuilds')).not.toBeNull();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { metrics } = await cdp.send('Performance.getMetrics');
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document' });
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId! });
    const value = (name: string) => metrics.find(m => m.name === name)!.value;
    return { visibilityListeners: listeners.filter(l => l.type === 'visibilitychange').length,
      JSEventListeners: value('JSEventListeners'), Nodes: value('Nodes'), JSHeapUsedSize: value('JSHeapUsedSize') };
  };
  const before = await metrics();
  for (let i = 0; i < 12; i++) {
    await page.setViewportSize({ width: i % 2 ? 1360 : 1000, height: 720 });
    await page.waitForTimeout(250);
    if (i % 4 === 3) {
      // Deterministic visibility lifecycle: headless Chromium tabs remain visible on bringToFront.
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.setViewportSize({ width: 1100, height: 720 });
      await page.waitForTimeout(250);
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        Object.defineProperty(document, 'hidden', { configurable: true, value: false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
  }
  await page.waitForTimeout(250);
  const after = await metrics();
  const rebuilds = await page.evaluate(async () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.v2-stage-canvas canvas')!;
    const before = Number(canvas.dataset.stageRebuilds);
    for (let i = 0; i < 3; i++) await window.__g1Loop.claimNow();
    return Number(canvas.dataset.stageRebuilds) - before;
  });
  const equip = await feedback(page, page.getByRole('button', { name: 'Equip best', exact: true }));
  await page.getByRole('tab', { name: 'Forge', exact: true }).click();
  await page.getByRole('button', { name: /^Craft Common Weapon/ }).click();
  const craft = await feedback(page, page.getByRole('button', { name: 'Confirm Craft', exact: true }));
  await page.getByRole('tab', { name: 'Boss', exact: true }).click();
  const fight = await feedback(page, page.getByRole('button', { name: 'Fight', exact: true }));
  const entry = { before, after, plainClaimRebuilds: rebuilds, feedback: { equip, craft, fight }, visibility: 'synthetic hidden/visible events, including resize while paused' };
  fs.mkdirSync(path.dirname(report), { recursive: true });
  const existing = fs.existsSync(report) ? JSON.parse(fs.readFileSync(report, 'utf8')) : {};
  const phase = process.env.G1_BASELINE === '1' ? 'baseline' : 'after';
  fs.writeFileSync(report, JSON.stringify({ ...existing, [phase]: entry }, null, 2) + '\n');
  console.log('G1 metrics', JSON.stringify({ phase, ...entry }));
  await expect(page.locator('.v2-stage-canvas canvas')).toHaveCount(1);
  if (phase === 'after') {
    expect(Math.abs(after.visibilityListeners - before.visibilityListeners)).toBeLessThanOrEqual(1);
    expect(after.Nodes).toBeLessThanOrEqual(before.Nodes! * 1.1);
    expect(rebuilds).toBe(0);
    for (const action of [equip, craft, fight]) expect(action.clickToPendingMs).toBeLessThan(100);
  }
});
