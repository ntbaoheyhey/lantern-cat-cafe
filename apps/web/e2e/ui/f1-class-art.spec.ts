import { test, expect, type Page } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { composeFrame, FRAME } from '../../src/game/rig/compose';
import { CLASS_LOOKS } from '../../src/game/rig/palettes';
import { animsFor } from '../../src/game/rig/poses';
import { CLASS_IDS, type ClassId } from '../../src/game/rig/types';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve('../../reports/f1-class-art');
const key = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
async function seed(page: Page, classId: ClassId) {
  const save = mockV2Save('bossReadyStrong', { classId, nowMs: Date.now() });
  save.state.items = []; // Show the class's fur and starter silhouette, without armor obscuring them.
  save.state.round = 1; save.state.kills = 0;
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save: JSON.stringify(save) });
}
async function shot(page: Page, name: string, selector?: string) {
  if (process.env.SCREENSHOTS !== '1') return;
  mkdirSync(output, { recursive: true });
  const path = resolve(output, `${name}.png`);
  if (selector) await page.locator(selector).screenshot({ path });
  else await page.screenshot({ path });
  expect(statSync(path).size).toBeLessThan(200 * 1024);
}

for (const scale of [1, 3]) test(`F1 all seven classes idle, attack and hit at ${scale}x`, async ({ page }) => {
  await seed(page, 'warrior');
  await page.goto('/');
  const rows = CLASS_IDS.map(id => ({
    id,
    groups: (['idle', 'attack', 'hurt'] as const).map(name => ({
      name: name === 'hurt' ? 'hit / recoil' : name,
      frames: animsFor(CLASS_LOOKS[id].weaponType)[name].frames.map((_, i) => Array.from(composeFrame(CLASS_LOOKS[id], {}, name, i).pixels)),
    })),
  }));
  await page.evaluate(({ rows, scale, w, h }) => {
    const left = 112, gap = 12, top = 52, rowH = h * scale + 24;
    const counts = [4, 8, 2];
    const width = left + counts.reduce((sum, count) => sum + count * w * scale + gap, 0);
    document.body.replaceChildren();
    const canvas = document.createElement('canvas'); canvas.id = 'class-sheet';
    canvas.width = width; canvas.height = top + rows.length * rowH;
    document.body.style.cssText = 'margin:0;background:#21182b';
    document.body.append(canvas);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#21182b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff3e0'; ctx.font = '14px monospace';
    ctx.fillText(`F1 · seven class looks · ${scale}x · all frames (hit = recoil)`, 12, 20);
    let labelX = left;
    ['idle · 4', 'attack · 6 / daggers 8', 'hit · 2'].forEach((label, i) => {
      ctx.fillText(label, labelX, 42); labelX += counts[i]! * w * scale + gap;
    });
    rows.forEach((row, rowIndex) => {
      const y = top + rowIndex * rowH;
      ctx.fillStyle = '#fff3e0'; ctx.fillText(row.id, 10, y + h * scale / 2);
      let x = left;
      row.groups.forEach((group, groupIndex) => {
        group.frames.forEach((pixels, frameIndex) => {
          pixels.forEach((p, i) => {
            if (p < 0) return;
            ctx.fillStyle = `#${p.toString(16).padStart(6, '0')}`;
            ctx.fillRect(x + frameIndex * w * scale + (i % w) * scale, y + Math.floor(i / w) * scale, scale, scale);
          });
        });
        x += counts[groupIndex]! * w * scale + gap;
      });
    });
  }, { rows, scale, w: FRAME.w, h: FRAME.h });
  await expect(page.locator('#class-sheet')).toBeVisible();
  // Canvas dimensions can be wider than the viewport: locator screenshot captures it all.
  await page.setViewportSize({ width: scale === 1 ? 960 : 2520, height: scale === 1 ? 580 : 1280 });
  await shot(page, `all-classes-${scale}x`, '#class-sheet');
});

for (const classId of ['guardian', 'rogue', 'witch'] as const) for (const [width, height] of [[1280, 720], [390, 844]] as const) {
  test(`F1 stage ${classId} ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await seed(page, classId);
    await page.goto('/');
    await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Game stage' })).toBeInViewport();
    await shot(page, `${classId}-${width}x${height}-light`);
  });
}

for (const [width, height, colorScheme] of [[1600, 900, 'light'], [320, 568, 'light'], [1280, 720, 'dark'], [390, 844, 'dark']] as const) {
  test(`F1 recent finds never covers stage ${width}x${height} ${colorScheme}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme });
    await page.clock.install({ time: Date.now() });
    await seed(page, 'witch');
    await page.goto('/');
    await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();
    await page.clock.setSystemTime(Date.now() + 20_000);
    await page.evaluate(() => window.__g1Loop.claimNow());
    await expect(page.getByRole('heading', { name: 'Recent finds', exact: true })).toBeVisible();
    // The 192px art is intentionally clipped to the shorter 320px phone stage.
    // Compare the visible stage region rather than its offscreen canvas overscan.
    const stage = await page.getByRole('region', { name: 'Game stage' }).boundingBox();
    const loot = await page.locator('.v2-recent-loot').boundingBox();
    expect(stage).not.toBeNull(); expect(loot).not.toBeNull();
    const overlaps = Math.min(stage!.x + stage!.width, loot!.x + loot!.width) > Math.max(stage!.x, loot!.x)
      && Math.min(stage!.y + stage!.height, loot!.y + loot!.height) > Math.max(stage!.y, loot!.y);
    expect(overlaps).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
    await shot(page, `finds-${width}x${height}-${colorScheme}`);
  });
}

test('F1 repeated full arena unmounts release real Phaser visibility handlers', async ({ page, context }) => {
  await page.goto('/?dev=arena');
  await expect(page.locator('.boss-arena-canvas canvas')).toBeVisible();
  const cdp = await context.newCDPSession(page);
  const count = async () => {
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document' });
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId! });
    return listeners.filter(l => l.type === 'visibilitychange').length;
  };
  const before = await count();
  expect(before).toBeGreaterThan(0);
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await expect(page.locator('.boss-arena-canvas canvas')).toHaveCount(1);
    await expect.poll(count).toBe(before);
  }
});
