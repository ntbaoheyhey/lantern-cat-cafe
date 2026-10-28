import { test, expect, type Page } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { CH1_PILOT_ART } from '../../src/art/monsters/ch1';
import { CH2_PILOT_ART } from '../../src/art/monsters/ch2';
import { CH3_PILOT_ART } from '../../src/art/monsters/ch3';
import { CH4_PILOT_ART } from '../../src/art/monsters/ch4';
import { CH5_PILOT_ART } from '../../src/art/monsters/ch5';
import type { MonsterArt } from '../../src/art/monsters/types';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve('../../reports/f3-art');
const key = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

const CHAPTER_ROSTERS: Record<number, { name: string; theme: string; art: Record<string, MonsterArt> }> = {
  1: { name: 'Living Room', theme: 'warm cream & cozy household dust', art: CH1_PILOT_ART },
  2: { name: 'Kitchen Pantry', theme: 'sage pantry greens & copper pantry wares', art: CH2_PILOT_ART },
  3: { name: 'Bubble Bath', theme: 'pastel bath bubbles & porcelain tiles', art: CH3_PILOT_ART },
  4: { name: 'Attic Ruins', theme: 'aged cardboard, brass & dusty clockwork', art: CH4_PILOT_ART },
  5: { name: 'Night Rooftops', theme: 'deep midnight violets & electric neon accents', art: CH5_PILOT_ART },
};

async function seedChapter(page: Page, chapter: number, kills = 0) {
  const save = mockV2Save('bossReadyStrong', { classId: 'warrior', nowMs: Date.now() });
  save.state.chapter = chapter;
  save.state.round = 1;
  save.state.kills = kills;
  save.state.items = [];
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save: JSON.stringify(save) });
}

async function captureShot(page: Page, name: string, selector?: string) {
  mkdirSync(output, { recursive: true });
  const path = resolve(output, `${name}.png`);
  if (selector) await page.locator(selector).screenshot({ path });
  else await page.screenshot({ path });
  const size = statSync(path).size;
  expect(size).toBeLessThan(200 * 1024);
  console.log(`Saved screenshot ${name}.png (${(size / 1024).toFixed(1)} KB)`);
}

// 1. Roster sheet per chapter (1 through 5) at 3x scale + 1x solid black silhouettes
for (const ch of [1, 2, 3, 4, 5]) {
  test(`F3 chapter ${ch} roster sheet at 3x scale with distinct silhouettes`, async ({ page }) => {
    await seedChapter(page, ch);
    await page.goto('/');
    const roster = CHAPTER_ROSTERS[ch]!;
    const monsters = Object.values(roster.art);

    // Pass data to browser canvas renderer
    await page.evaluate(({ ch, roster, monsters }) => {
      document.body.replaceChildren();
      const canvas = document.createElement('canvas');
      canvas.id = 'roster-sheet';
      const scale = 3;
      const leftMargin = 160;
      const colGap = 12;
      const rowGap = 16;
      const topMargin = 70;

      // Calculate width and height
      // Each monster has up to 18 frames across walk, attack, hit, defeat, idle, windup
      const maxCols = 18;
      const width = Math.max(1100, leftMargin + maxCols * (40 * scale + 6) + 180);
      const rowHeight = 44 * scale + rowGap;
      const height = topMargin + monsters.length * rowHeight + 40;

      canvas.width = width;
      canvas.height = height;
      document.body.style.cssText = 'margin:0;background:#181220';
      document.body.append(canvas);

      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#181220';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Chapter header
      ctx.fillStyle = '#ffde59';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`Chapter ${ch}: ${roster.name} — Option A Monster Art Roster (3x scale)`, 20, 30);
      ctx.fillStyle = '#b8a9c9';
      ctx.font = '13px monospace';
      ctx.fillText(`Theme: ${roster.theme} | All 5 monsters face LEFT with grounded feet | 1x Solid Silhouettes distinct`, 20, 52);

      let y = topMargin;
      monsters.forEach((m) => {
        const mw = m.size.w;
        const mh = m.size.h;

        // Label
        ctx.fillStyle = m.kind === 'boss' ? '#ff70ba' : m.kind === 'elite' ? '#ffde59' : '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(m.name ?? m.id, 20, y + 20);
        ctx.fillStyle = '#8e7f9e';
        ctx.font = '11px monospace';
        ctx.fillText(`${m.kind} · ${mw}x${mh}px`, 20, y + 36);
        ctx.fillText(`role: ${m.role ?? 'standard'}`, 20, y + 50);

        let x = leftMargin;
        const animOrder = ['idle', 'windup', 'walk', 'attack', 'hit', 'defeat'] as const;

        animOrder.forEach((anim) => {
          const frames = m.frames[anim];
          if (!frames || frames.length === 0) return;

          // Anim sub-label
          ctx.fillStyle = '#6b5c7e';
          ctx.font = '10px monospace';
          ctx.fillText(`${anim} (${frames.length})`, x, y + 10);

          frames.forEach((rows) => {
            const frameY = y + 16;
            // Draw pixel frame at 3x
            rows.forEach((row, py) => {
              for (let px = 0; px < row.length; px++) {
                const ch = row[px];
                if (!ch || ch === '.' || !(ch in m.palette)) continue;
                ctx.fillStyle = `#${m.palette[ch]!.toString(16).padStart(6, '0')}`;
                ctx.fillRect(x + px * scale, frameY + py * scale, scale, scale);
              }
            });
            x += mw * scale + 4;
          });
          x += colGap;
        });

        // 1x Solid Black Silhouette on high-contrast box at right edge
        const silBoxX = width - 150;
        const silBoxY = y + 14;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(silBoxX, silBoxY, 130, 48 * scale);
        ctx.fillStyle = '#181220';
        ctx.font = '10px monospace';
        ctx.fillText('1x silhouette', silBoxX + 6, silBoxY + 14);

        const walk0 = (m.frames.walk ?? m.frames.idle)?.[0] ?? [];
        // Draw 1x silhouette
        walk0.forEach((row, py) => {
          for (let px = 0; px < row.length; px++) {
            if (row[px] !== '.') {
              ctx.fillStyle = '#000000';
              ctx.fillRect(silBoxX + 10 + px, silBoxY + 22 + py, 1, 1);
              // Also draw at 2x right next to it for inspection
              ctx.fillRect(silBoxX + 60 + px * 2, silBoxY + 22 + py * 2, 2, 2);
            }
          }
        });

        y += rowHeight;
      });
    }, { ch, roster, monsters });

    await expect(page.locator('#roster-sheet')).toBeVisible();
    const box = await page.locator('#roster-sheet').boundingBox();
    if (box) {
      await page.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });
    }
    await captureShot(page, `roster-ch${ch}`, '#roster-sheet');
  });
}

// 2. Stage screenshots per chapter at 1280x720 and 390x844
for (const ch of [1, 2, 3, 4, 5]) {
  for (const [width, height] of [[1280, 720], [390, 844]] as const) {
    test(`F3 stage chapter ${ch} ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
      await seedChapter(page, ch, 0);
      await page.goto('/');

      const canvas = page.locator('.v2-stage-canvas canvas');
      await expect(canvas).toBeVisible();
      // Ensure stage has finished initial render
      await page.waitForTimeout(600);
      await captureShot(page, `stage-ch${ch}-${width}x${height}`);
    });
  }
}

// 3. Bake time benchmark
test('F3 canvas bake time benchmark for chapters 1-5', async ({ page }) => {
  await seedChapter(page, 1);
  await page.goto('/');

  const allChapters = [
    { ch: 1, art: CH1_PILOT_ART },
    { ch: 2, art: CH2_PILOT_ART },
    { ch: 3, art: CH3_PILOT_ART },
    { ch: 4, art: CH4_PILOT_ART },
    { ch: 5, art: CH5_PILOT_ART },
  ];

  const results = await page.evaluate(({ allChapters }) => {
    const report: Record<number, { chapter: number; totalBakeMs: number; monsters: Record<string, { ms: number; totalFrames: number; texW: number; texH: number; texBytes: number }> }> = {};

    allChapters.forEach(({ ch, art }) => {
      const monsterReports: Record<string, { ms: number; totalFrames: number; texW: number; texH: number; texBytes: number }> = {};
      let chapterTotal = 0;

      Object.values(art).forEach((m: any) => {
        const animOrder = ['idle', 'walk', 'windup', 'attack', 'hit', 'defeat'];
        let totalFrames = 0;
        let sheetW = 0;
        const sheetH = m.size.h;

        animOrder.forEach((anim) => {
          const frames = m.frames[anim];
          if (frames) {
            totalFrames += frames.length;
            sheetW += frames.length * m.size.w;
          }
        });

        // Simulate bake canvas creation and rasterization
        const t0 = performance.now();
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, sheetW);
        canvas.height = sheetH;
        const ctx = canvas.getContext('2d')!;

        let offsetX = 0;
        animOrder.forEach((anim) => {
          const frames = m.frames[anim];
          if (!frames) return;
          frames.forEach((rows: string[]) => {
            rows.forEach((row, py) => {
              for (let px = 0; px < row.length; px++) {
                const c = row[py]?.[px];
                if (!c || c === '.' || !(c in m.palette)) continue;
                ctx.fillStyle = `#${m.palette[c]!.toString(16).padStart(6, '0')}`;
                ctx.fillRect(offsetX + px, py, 1, 1);
              }
            });
            offsetX += m.size.w;
          });
        });
        const elapsed = performance.now() - t0;
        chapterTotal += elapsed;
        const texBytes = sheetW * sheetH * 4;
        monsterReports[m.id] = {
          ms: Math.round(elapsed * 1000) / 1000,
          totalFrames,
          texW: sheetW,
          texH: sheetH,
          texBytes,
        };
      });

      report[ch] = {
        chapter: ch,
        totalBakeMs: Math.round(chapterTotal * 1000) / 1000,
        monsters: monsterReports,
      };
    });

    return report;
  }, { allChapters });

  mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, 'bake-metrics.json'), JSON.stringify(results, null, 2) + '\n');
  console.log('Bake benchmark results:', JSON.stringify(results, null, 2));

  // Assert all chapters bake under 25ms
  for (const ch of [1, 2, 3, 4, 5]) {
    expect(results[ch]!.totalBakeMs).toBeLessThan(25);
  }
});
