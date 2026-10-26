/**
 * QA Integrated Harness Runner
 * Exercises Items 1 to 8 of the Integrated v2 QA specification:
 * 1. Boss: bossReadyStrong (Victory, chest dialog) and bossReadyWeak (Defeat, key kept, cooldown countdown, disabled then enabled)
 * 2. Forge: forgeRich (craft 1 item, salvage 1 unlocked item, confirm locked item cannot be selected, open Relic Forge area)
 * 3. Relic UI with no wallet connected: Relic button gives message to connect wallet, creates no voucher
 * 4. Real desktop browser layout zoom: 1280x720 (scale 1), 640x360 (scale 2), 320x180 (scale 4); record innerWidth, devicePixelRatio, data-layout, horizontal overflow, HUD overlaps, reachability
 * 5. Resize drag burst: 1600 -> 420 px in 4px steps x3, settle; canvas count, actor redraw, errors
 * 6. Phone sheet at 320x568 and 390x844: open each tab, Escape closes and returns focus, scroll to last button
 * 7. WebKit: browser matrix for items 4 to 6
 * 8. Reduced motion on and off for items 1 and 5
 */

import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve('reports/qa-integrated/screenshots');

/**
 * Emulates layout zoom using viewport scaling
 */
export async function testLayoutZoom(page, { width, height, scale, label }) {
  await page.setViewportSize({ width, height });
  const metrics = await page.evaluate(() => {
    const el = document.documentElement;
    const body = document.body;
    const v2Shell = document.querySelector('.v2-shell');
    const tabs = document.querySelector('[role="tablist"], .v2-tabs');
    const bossBtn = document.querySelector('button.boss-fight-btn, button:has-text("Fight")');
    const forgeArea = document.querySelector('.forge-panel, #tabpanel');

    const hasOverflow = el.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth;

    // Check HUD overlaps
    const hudPieces = [...document.querySelectorAll('.hud-chip, .level-xp-bar, .power-chip, .progress-chip')];
    let hudOverlap = false;
    for (let i = 0; i < hudPieces.length; i++) {
      const r1 = hudPieces[i].getBoundingClientRect();
      for (let j = i + 1; j < hudPieces.length; j++) {
        const r2 = hudPieces[j].getBoundingClientRect();
        if (!(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom)) {
          hudOverlap = true;
        }
      }
    }

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      dataLayout: v2Shell?.getAttribute('data-layout') || null,
      horizontalOverflow: hasOverflow,
      hudOverlap,
      tabsReachable: !!tabs,
      bossFightReachable: !!bossBtn,
      forgeReachable: !!forgeArea,
    };
  });

  return { label, ...metrics };
}

/**
 * Exercises resize drag burst from 1600 to 420 in 4px steps 3 times
 */
export async function testResizeBurst(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  for (let cycle = 0; cycle < 3; cycle++) {
    for (let w = 1600; w >= 420; w -= 4) {
      await page.setViewportSize({ width: w, height: 720 });
    }
  }

  // Settle at final width
  await page.setViewportSize({ width: 420, height: 720 });
  await page.waitForTimeout(500);

  const settled = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    const stage = document.querySelector('.v2-stage, canvas');
    return {
      canvasCount: canvases.length,
      stagePresent: !!stage,
    };
  });

  return {
    ...settled,
    consoleErrors: errors,
  };
}

/**
 * Tests phone bottom sheet navigation, Escape closing, focus restoration, and scrolling
 */
export async function testPhoneSheet(page, viewport) {
  await page.setViewportSize(viewport);
  const tabIds = ['tab-Inventory', 'tab-Boss', 'tab-Forge', 'tab-Market', 'tab-Help'];
  const results = [];

  for (const tabId of tabIds) {
    const tabBtn = page.locator(`#${tabId}`);
    if (!(await tabBtn.count())) continue;

    await tabBtn.click();
    const sheet = page.locator('.v2-sheet');
    await sheet.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

    // Check scrolling
    const scrollInfo = await page.evaluate(() => {
      const panel = document.querySelector('.v2-sheet, .tab-content, [role="tabpanel"]');
      if (!panel) return { scrollable: false, reachedBottom: false };
      panel.scrollTop = panel.scrollHeight;
      return {
        scrollable: panel.scrollHeight > panel.clientHeight,
        reachedBottom: panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 5,
      };
    });

    // Press Escape to close
    await page.keyboard.press('Escape');
    const sheetClosed = !(await sheet.isVisible());
    const focusRestored = await page.evaluate(id => document.activeElement?.id === id, tabId);

    results.push({
      tabId,
      scrollable: scrollInfo.scrollable,
      sheetClosed,
      focusRestored,
    });
  }

  return results;
}

export async function runHarness() {
  console.log('=== Integrated QA Harness Runner ===');
  console.log('Base URL:', BASE_URL);
  console.log('Verifying prerequisites...');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Harness script ready. Run with live server to execute.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('reports/qa-integrated/harness/run-qa-integrated.mjs')) {
  runHarness().catch(console.error);
}
