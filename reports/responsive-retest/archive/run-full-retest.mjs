import { chromium } from '/Users/bao/taskbar-hero/apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/Users/bao/taskbar-hero/reports/responsive-retest';
const KEY = 'taskbar-hero:v2-demo:1';
fs.mkdirSync(OUT_DIR, { recursive: true });

// Layout calculation helpers
const PHONE_MAX = 600;
const DESKTOP_MIN = 1024;
const SCENE_HEIGHT = 96;
const MIN_ZOOM = 2;
const MIN_STAGE_HEIGHT = 320;
const STAGE_SHARE = 0.6;
const MIN_LOGICAL_WIDTH = 160;

function layoutKind(width) {
  if (width <= PHONE_MAX) return 'phone';
  return width >= DESKTOP_MIN ? 'desktop' : 'tablet';
}

function stageHeight(width, height) {
  if (width <= PHONE_MAX) return Math.round((width * 9) / 16);
  return Math.min(Math.max(MIN_STAGE_HEIGHT, Math.round(height * STAGE_SHARE)), Math.round(width * 0.6));
}

function stageZoom(width, stageH) {
  const zoom = Math.round(stageH / SCENE_HEIGHT);
  return Math.max(MIN_ZOOM, Math.min(zoom, Math.floor(width / MIN_LOGICAL_WIDTH)));
}

function getExpectedLogicalWidth(width, height) {
  const zoom = stageZoom(width, stageHeight(width, height));
  return Math.max(MIN_LOGICAL_WIDTH, Math.floor(width / zoom));
}

async function geometry(page) {
  return page.locator('.hud-bar').evaluate(hud => {
    const outer = hud.getBoundingClientRect();
    const leaves = [...hud.querySelectorAll('.hud-level-badge,.hud-xp-track,.hud-xp-text,.hud-progress-chip,.hud-stack-item,.hud-power-chip')].map(e => ({ name: e.className, r: e.getBoundingClientRect() }));
    const issues = [];
    for (const { name, r } of leaves) {
      if (r.left < outer.left - 1 || r.right > outer.right + 1 || r.top < outer.top - 1 || r.bottom > outer.bottom + 1) {
        issues.push(`${name} outside HUD`);
      }
    }
    for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        const a = leaves[i];
        const b = leaves[j];
        if (Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left) > 1 &&
            Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top) > 1) {
          issues.push(`${a.name} overlaps ${b.name}`);
        }
      }
    }
    return issues;
  });
}

async function inspectActors(page) {
  const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
  const count = await canvas.count();
  if (count !== 1) return { count, ok: false, message: `Canvas count ${count} !== 1` };

  return canvas.evaluate(element => {
    const c = element;
    const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let catPixels = 0;
    let monsterPixels = 0;
    const midX = c.width / 2;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const alpha = pixels[(y * c.width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < midX) catPixels++;
          else monsterPixels++;
        }
      }
    }
    return {
      count: 1,
      width: c.width,
      height: c.height,
      catPixels,
      monsterPixels,
      catPresent: catPixels > 0,
      monsterPresent: monsterPixels > 0,
      bothPresent: catPixels > 0 && monsterPixels > 0,
    };
  });
}

async function pollActors(page, expectedWidth, timeoutMs = 8000) {
  const start = Date.now();
  let lastResult = null;
  while (Date.now() - start < timeoutMs) {
    lastResult = await inspectActors(page).catch(e => ({ error: e.message }));
    if (lastResult && lastResult.width === expectedWidth && lastResult.height === 96 && lastResult.bothPresent) {
      return { ok: true, durationMs: Date.now() - start, ...lastResult };
    }
    await new Promise(r => setTimeout(r, 100));
  }
  return { ok: false, durationMs: Date.now() - start, ...lastResult };
}

const VIEWPORTS = [
  [1600, 900],
  [1280, 720],
  [1024, 768],
  [1023, 600],
  [768, 600],
  [601, 480],
  [600, 600],
  [390, 844],
  [320, 568],
  [844, 390],
  [1280, 480],
  [1600, 900]
];

const BASE_SAVE = {
  v: 1,
  state: {
    classId: 'witch',
    level: 15,
    xp: 250,
    chapter: 2,
    round: 3,
    kills: 4,
    bestStage: 15,
    stacks: { fish: 5420, yarn: 120, moonPearl: 5, catKey: 2 },
    items: [
      {
        id: 'starter:0',
        itemId: 'wpn.staff.branch',
        itemKey: 'wpn.staff.branch',
        slot: 'weapon',
        weaponType: 'staff',
        rarity: 'common',
        level: 10,
        bonus: [],
        bonusLines: [],
        locked: false,
        equipped: true,
        source: 'starter'
      }
    ],
    bossClears: { '1': { wins: 1, firstClearClaimed: true } },
    bossCooldownUntil: null,
    fights: 1,
    lastDailyKeyDay: '2026-10-25',
    lastRelicDay: null,
    progressRev: 1
  },
  lastClaimMs: Date.now(),
  counter: 0,
  voucherNonce: 0,
  founder: false
};

const results = {
  sourceSHA: '282843de2790f0b2e1f3dfecaeae8c44a5cdd3b6',
  matrixDark: [],
  matrixLightReduced: [],
  scenarios: {},
  edgeCases: {},
  panels: {}
};

async function run() {
  console.log('--- STARTING COMPREHENSIVE INDEPENDENT RETEST ---');
  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // PART A: Continuous Session Matrix - Dark Theme, Normal Motion
  // -------------------------------------------------------------
  console.log('\n[Part A] Continuous Session Matrix (Dark Theme, Normal Motion)...');
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const errorsA = [];
  pageA.on('pageerror', e => errorsA.push(e.message));
  pageA.on('console', m => { if (m.type() === 'error') errorsA.push(m.text()); });

  await pageA.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('data-theme', 'dark'));
  }, { key: KEY, save: BASE_SAVE });

  await pageA.goto('http://localhost:4174');
  await pageA.waitForSelector('.hud-bar');
  const canvasA = pageA.getByRole('region', { name: 'Game stage' }).locator('canvas');
  await canvasA.waitFor({ state: 'visible' });

  // Switch to Forge tab
  const forgeTab = pageA.getByRole('tab', { name: 'Forge', exact: true });
  await forgeTab.click();

  const timeOriginA = await pageA.evaluate(() => performance.timeOrigin);
  const identityA = await pageA.evaluate(k => {
    const s = JSON.parse(localStorage.getItem(k)).state;
    return [s.classId, s.level, s.items.map(i => i.id)];
  }, KEY);

  for (let idx = 0; idx < VIEWPORTS.length; idx++) {
    const [w, h] = VIEWPORTS[idx];
    const isReturn = idx === VIEWPORTS.length - 1;
    await pageA.setViewportSize({ width: w, height: h });
    const expectedLayout = layoutKind(w);
    const expectedLogW = getExpectedLogicalWidth(w, h);

    // Wait for layout attribute
    const shell = pageA.locator('.v2-shell');
    await shell.evaluate((el, expected) => {
      return new Promise(resolve => {
        if (el.getAttribute('data-layout') === expected) return resolve();
        const obs = new MutationObserver(() => {
          if (el.getAttribute('data-layout') === expected) {
            obs.disconnect();
            resolve();
          }
        });
        obs.observe(el, { attributes: true, attributeFilter: ['data-layout'] });
      });
    }, expectedLayout);

    // Geometry check
    const geomIssues = await geometry(pageA);
    const noOverflow = await pageA.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    const timeOriginSame = (await pageA.evaluate(() => performance.timeOrigin)) === timeOriginA;

    // Actor check
    const actorRes = await pollActors(pageA, expectedLogW);

    // Identity check
    const currentIdentity = await pageA.evaluate(k => {
      const s = JSON.parse(localStorage.getItem(k)).state;
      return [s.classId, s.level, s.items.map(i => i.id)];
    }, KEY);
    const identityMatches = JSON.stringify(currentIdentity) === JSON.stringify(identityA);

    // Phone vs Desktop tab navigation check
    if (w <= 600) {
      await pageA.getByRole('tab', { name: 'Forge', exact: true }).click();
      await pageA.getByRole('button', { name: 'Close panel' }).click();
    }

    const filename = `matrix-${w}x${h}-dark${isReturn ? '-return' : ''}.png`;
    await pageA.screenshot({ path: path.join(OUT_DIR, filename) });

    if ([1600, 1280, 390, 320].includes(w) && h !== 480) {
      const cropName = `actors-${w}x${h}-dark.png`;
      await canvasA.screenshot({ path: path.join(OUT_DIR, cropName) });
    }

    const stepPass = geomIssues.length === 0 && noOverflow && timeOriginSame && actorRes.ok && identityMatches;
    console.log(`  ${w}×${h} (${expectedLayout}): ${stepPass ? 'PASS' : 'FAIL'} | Canvas: ${actorRes.width}x${actorRes.height} | Cat: ${actorRes.catPixels}px, Monster: ${actorRes.monsterPixels}px | Overflows: ${!noOverflow} | Geom: ${geomIssues.length} issues`);

    results.matrixDark.push({
      viewport: `${w}×${h}`,
      layout: expectedLayout,
      expectedLogW,
      actualLogW: actorRes.width,
      catPixels: actorRes.catPixels,
      monsterPixels: actorRes.monsterPixels,
      actorOk: actorRes.ok,
      geomIssues,
      noOverflow,
      timeOriginSame,
      identityMatches,
      stepPass,
      screenshot: filename
    });
  }

  results.errorsA = errorsA;
  await contextA.close();

  // -------------------------------------------------------------------
  // PART B: Continuous Session Matrix - Light Theme, Reduced Motion
  // -------------------------------------------------------------------
  console.log('\n[Part B] Continuous Session Matrix (Light Theme, Reduced Motion)...');
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const errorsB = [];
  pageB.on('pageerror', e => errorsB.push(e.message));
  pageB.on('console', m => { if (m.type() === 'error') errorsB.push(m.text()); });
  await pageB.emulateMedia({ reducedMotion: 'reduce' });

  await pageB.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('data-theme', 'light'));
  }, { key: KEY, save: BASE_SAVE });

  await pageB.goto('http://localhost:4174');
  await pageB.waitForSelector('.hud-bar');
  const canvasB = pageB.getByRole('region', { name: 'Game stage' }).locator('canvas');
  await canvasB.waitFor({ state: 'visible' });

  const timeOriginB = await pageB.evaluate(() => performance.timeOrigin);

  for (let idx = 0; idx < VIEWPORTS.length; idx++) {
    const [w, h] = VIEWPORTS[idx];
    await pageB.setViewportSize({ width: w, height: h });
    const expectedLayout = layoutKind(w);
    const expectedLogW = getExpectedLogicalWidth(w, h);

    const geomIssues = await geometry(pageB);
    const noOverflow = await pageB.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    const timeOriginSame = (await pageB.evaluate(() => performance.timeOrigin)) === timeOriginB;
    const actorRes = await pollActors(pageB, expectedLogW);

    const filename = `matrix-${w}x${h}-light-reduced.png`;
    if ([1600, 1280, 390, 320].includes(w)) {
      await pageB.screenshot({ path: path.join(OUT_DIR, filename) });
      if (w === 1280 && h === 720) {
        await canvasB.screenshot({ path: path.join(OUT_DIR, 'actors-reduced-motion-light.png') });
      }
    }

    const stepPass = geomIssues.length === 0 && noOverflow && timeOriginSame && actorRes.ok;
    console.log(`  ${w}×${h} (light+reduced): ${stepPass ? 'PASS' : 'FAIL'} | Canvas: ${actorRes.width}x${actorRes.height} | Cat: ${actorRes.catPixels}px, Monster: ${actorRes.monsterPixels}px`);

    results.matrixLightReduced.push({
      viewport: `${w}×${h}`,
      layout: expectedLayout,
      expectedLogW,
      actualLogW: actorRes.width,
      catPixels: actorRes.catPixels,
      monsterPixels: actorRes.monsterPixels,
      actorOk: actorRes.ok,
      geomIssues,
      stepPass
    });
  }

  results.errorsB = errorsB;
  await contextB.close();

  // -------------------------------------------------------------
  // PART C: Priority Scenario 1 - First Load & Class Selection
  // -------------------------------------------------------------
  console.log('\n[Part C-1] Priority Scenario 1: First Load & Class Selection...');
  const contextC1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pageC1 = await contextC1.newPage();
  const errorsC1 = [];
  pageC1.on('pageerror', e => errorsC1.push(e.message));
  pageC1.on('console', m => { if (m.type() === 'error') errorsC1.push(m.text()); });

  // Clear storage completely
  await pageC1.goto('http://localhost:4174');
  await pageC1.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  });
  await pageC1.reload();

  // Expect ClassPicker modal
  const chooseBtn = pageC1.getByTestId('class-picker-choose-button');
  await chooseBtn.waitFor({ state: 'visible' });
  await pageC1.screenshot({ path: path.join(OUT_DIR, 'scenario-1-classpicker.png') });

  // Choose Warrior
  await chooseBtn.click();
  const confirmBtn = pageC1.getByTestId('class-picker-confirm-button');
  await confirmBtn.click();

  // Modal dismisses; stage scene mounts, initial show called before boot, CREATE emits
  const expectedLogW = getExpectedLogicalWidth(1280, 720);
  const actorResC1 = await pollActors(pageC1, expectedLogW);
  const canvasCountC1 = await pageC1.getByRole('region', { name: 'Game stage' }).locator('canvas').count();

  await pageC1.screenshot({ path: path.join(OUT_DIR, 'scenario-1-selected-rendered.png') });
  await pageC1.getByRole('region', { name: 'Game stage' }).locator('canvas').screenshot({ path: path.join(OUT_DIR, 'canvas-scenario-1-warrior.png') });

  console.log(`  Class Selection Result: Actor OK: ${actorResC1.ok} (Cat: ${actorResC1.catPixels}px, Monster: ${actorResC1.monsterPixels}px), Canvas count: ${canvasCountC1}`);
  results.scenarios.firstLoadClassSelection = {
    actorOk: actorResC1.ok,
    catPixels: actorResC1.catPixels,
    monsterPixels: actorResC1.monsterPixels,
    canvasCount: canvasCountC1,
    errors: errorsC1
  };
  await contextC1.close();

  // -------------------------------------------------------------
  // PART C-2: Priority Scenario 2 - Rapid Shrink / Stretch
  // -------------------------------------------------------------
  console.log('\n[Part C-2] Priority Scenario 2: Rapid Shrink / Stretch...');
  const contextC2 = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const pageC2 = await contextC2.newPage();
  const errorsC2 = [];
  pageC2.on('pageerror', e => errorsC2.push(e.message));
  pageC2.on('console', m => { if (m.type() === 'error') errorsC2.push(m.text()); });

  await pageC2.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: BASE_SAVE });

  await pageC2.goto('http://localhost:4174');
  await pageC2.waitForSelector('.hud-bar');

  // Perform 8 rapid resizes without waiting for Phaser between them
  const rapidSequence = [
    [320, 568],
    [1600, 900],
    [390, 844],
    [1280, 720],
    [600, 600],
    [1024, 768],
    [320, 568],
    [1280, 720]
  ];
  for (const [w, h] of rapidSequence) {
    await pageC2.setViewportSize({ width: w, height: h });
    await new Promise(r => setTimeout(r, 40)); // Rapid thrash
  }

  // Now settle at 1280x720 and verify
  const expectedLogWC2 = getExpectedLogicalWidth(1280, 720);
  const actorResC2 = await pollActors(pageC2, expectedLogWC2);
  const canvasCountC2 = await pageC2.getByRole('region', { name: 'Game stage' }).locator('canvas').count();
  await pageC2.screenshot({ path: path.join(OUT_DIR, 'scenario-2-rapid-resize-final.png') });

  console.log(`  Rapid Resize Result: Actor OK: ${actorResC2.ok} (Cat: ${actorResC2.catPixels}px, Monster: ${actorResC2.monsterPixels}px), Canvas count: ${canvasCountC2}, Errors: ${errorsC2.length}`);
  results.scenarios.rapidResize = {
    actorOk: actorResC2.ok,
    catPixels: actorResC2.catPixels,
    monsterPixels: actorResC2.monsterPixels,
    canvasCount: canvasCountC2,
    errors: errorsC2
  };
  await contextC2.close();

  // -------------------------------------------------------------
  // PART C-3: Priority Scenario 3 - Mini Mode -> Stage Layout
  // -------------------------------------------------------------
  console.log('\n[Part C-3] Priority Scenario 3: Mini Mode -> Stage Layout...');
  const contextC3 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pageC3 = await contextC3.newPage();
  const errorsC3 = [];
  pageC3.on('pageerror', e => errorsC3.push(e.message));
  pageC3.on('console', m => { if (m.type() === 'error') errorsC3.push(m.text()); });

  await pageC3.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: BASE_SAVE });

  await pageC3.goto('http://localhost:4174');
  await pageC3.waitForSelector('.hud-bar');

  // Click "Mini mode"
  const miniBtn = pageC3.getByRole('button', { name: 'Mini mode' });
  await miniBtn.click();
  await pageC3.waitForTimeout(500);
  await pageC3.screenshot({ path: path.join(OUT_DIR, 'scenario-3-mini-mode.png') });

  // Click "Stage" to return to stage-first layout
  const stageBtn = pageC3.getByRole('button', { name: 'Stage' });
  await stageBtn.click();
  await pageC3.waitForSelector('.hud-bar');

  // Verify exactly 1 canvas and actors redrawn
  const expectedLogWC3 = getExpectedLogicalWidth(1280, 720);
  const actorResC3 = await pollActors(pageC3, expectedLogWC3);
  const canvasCountC3 = await pageC3.getByRole('region', { name: 'Game stage' }).locator('canvas').count();
  await pageC3.screenshot({ path: path.join(OUT_DIR, 'scenario-3-return-stage.png') });

  console.log(`  Mini -> Stage Result: Actor OK: ${actorResC3.ok} (Cat: ${actorResC3.catPixels}px, Monster: ${actorResC3.monsterPixels}px), Canvas count: ${canvasCountC3}`);
  results.scenarios.miniToStage = {
    actorOk: actorResC3.ok,
    catPixels: actorResC3.catPixels,
    monsterPixels: actorResC3.monsterPixels,
    canvasCount: canvasCountC3,
    errors: errorsC3
  };
  await contextC3.close();

  // -------------------------------------------------------------
  // PART C-4: Priority Scenario 4 - Page Reload & State Restoration
  // -------------------------------------------------------------
  console.log('\n[Part C-4] Priority Scenario 4: Page Reload & State Restoration...');
  const contextC4 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pageC4 = await contextC4.newPage();
  const errorsC4 = [];
  pageC4.on('pageerror', e => errorsC4.push(e.message));
  pageC4.on('console', m => { if (m.type() === 'error') errorsC4.push(m.text()); });

  await pageC4.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: BASE_SAVE });

  await pageC4.goto('http://localhost:4174');
  await pageC4.waitForSelector('.hud-bar');

  // Reload page
  await pageC4.reload();
  await pageC4.waitForSelector('.hud-bar');

  const expectedLogWC4 = getExpectedLogicalWidth(1280, 720);
  const actorResC4 = await pollActors(pageC4, expectedLogWC4);
  const canvasCountC4 = await pageC4.getByRole('region', { name: 'Game stage' }).locator('canvas').count();
  await pageC4.screenshot({ path: path.join(OUT_DIR, 'scenario-4-page-reload.png') });

  console.log(`  Reload Result: Actor OK: ${actorResC4.ok} (Cat: ${actorResC4.catPixels}px, Monster: ${actorResC4.monsterPixels}px), Canvas count: ${canvasCountC4}`);
  results.scenarios.pageReload = {
    actorOk: actorResC4.ok,
    catPixels: actorResC4.catPixels,
    monsterPixels: actorResC4.monsterPixels,
    canvasCount: canvasCountC4,
    errors: errorsC4
  };
  await contextC4.close();

  // -------------------------------------------------------------
  // PART D: Long Currency / XP Values
  // -------------------------------------------------------------
  console.log('\n[Part D] Long Currency & XP Values...');
  const LONG_SAVE = JSON.parse(JSON.stringify(BASE_SAVE));
  LONG_SAVE.state.level = 50;
  LONG_SAVE.state.xp = 999999;
  LONG_SAVE.state.stacks = { fish: 999999999, yarn: 88888888, catKey: 5, moonPearl: 999999 };

  const contextD = await browser.newContext();
  const pageD = await contextD.newPage();
  await pageD.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: LONG_SAVE });

  await pageD.goto('http://localhost:4174');
  await pageD.waitForSelector('.hud-bar');

  // Test at 1280x720
  await pageD.setViewportSize({ width: 1280, height: 720 });
  const geomLong1280 = await geometry(pageD);
  const noOverflowLong1280 = await pageD.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await pageD.screenshot({ path: path.join(OUT_DIR, 'edge-long-values-1280x720.png') });

  // Test at 320x568 (narrow phone)
  await pageD.setViewportSize({ width: 320, height: 568 });
  const geomLong320 = await geometry(pageD);
  const noOverflowLong320 = await pageD.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await pageD.screenshot({ path: path.join(OUT_DIR, 'edge-long-values-320x568.png') });

  console.log(`  Long Values 1280x720: Geom issues: ${geomLong1280.length}, No overflow: ${noOverflowLong1280}`);
  console.log(`  Long Values 320x568: Geom issues: ${geomLong320.length}, No overflow: ${noOverflowLong320}`);
  results.edgeCases.longValues = {
    geomLong1280,
    noOverflowLong1280,
    geomLong320,
    noOverflowLong320
  };
  await contextD.close();

  // -------------------------------------------------------------
  // PART E: Actual Browser Zoom at 100% and 200%
  // -------------------------------------------------------------
  console.log('\n[Part E] Actual Browser Zoom (100% and 200% via CDP Emulation.setPageScaleFactor)...');
  const contextE = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pageE = await contextE.newPage();
  await pageE.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: BASE_SAVE });

  await pageE.goto('http://localhost:4174');
  await pageE.waitForSelector('.hud-bar');

  // 100% zoom
  const geomZoom100 = await geometry(pageE);
  const actorZoom100 = await pollActors(pageE, getExpectedLogicalWidth(1280, 720));
  await pageE.screenshot({ path: path.join(OUT_DIR, 'zoom-100-percent.png') });

  // 200% actual zoom via Chrome DevTools Protocol
  const cdp = await pageE.context().newCDPSession(pageE);
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2.0 });
  await pageE.waitForTimeout(500);

  const geomZoom200 = await geometry(pageE);
  const actorZoom200 = await pollActors(pageE, getExpectedLogicalWidth(1280, 720));
  await pageE.screenshot({ path: path.join(OUT_DIR, 'zoom-200-percent.png') });

  console.log(`  Zoom 100%: Geom issues: ${geomZoom100.length}, Actors OK: ${actorZoom100.ok}`);
  console.log(`  Zoom 200%: Geom issues: ${geomZoom200.length}, Actors OK: ${actorZoom200.ok}`);
  results.edgeCases.browserZoom = {
    method: 'CDP Emulation.setPageScaleFactor({ pageScaleFactor: 2.0 })',
    geomZoom100,
    actorZoom100,
    geomZoom200,
    actorZoom200
  };
  await contextE.close();

  // -------------------------------------------------------------
  // PART F: Feature Panels, Boss Fight, Phone Sheet
  // -------------------------------------------------------------
  console.log('\n[Part F] Feature Panels, Boss Fight, Phone Sheet...');
  const contextF = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pageF = await contextF.newPage();
  await pageF.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: BASE_SAVE });

  await pageF.goto('http://localhost:4174');
  await pageF.waitForSelector('.hud-bar');

  // Character panel
  await pageF.screenshot({ path: path.join(OUT_DIR, 'panel-character-bag.png') });

  // Forge Panel tabs
  const forgeTabF = pageF.getByRole('tab', { name: 'Forge', exact: true });
  await forgeTabF.click();
  await pageF.waitForSelector('role=tabpanel[name="Forge"]');
  await pageF.screenshot({ path: path.join(OUT_DIR, 'panel-forge-tabs.png') });

  // Boss Tab
  const bossTab = pageF.getByRole('tab', { name: 'Boss', exact: true });
  if (await bossTab.isVisible()) {
    await bossTab.click();
    await pageF.waitForSelector('role=tabpanel[name="Boss"]');
    await pageF.screenshot({ path: path.join(OUT_DIR, 'panel-boss-ready.png') });

    // Look for challenge/fight button
    const fightBtn = pageF.getByRole('button', { name: /Challenge|Fight boss|Enter arena|Battle/i });
    if (await fightBtn.isVisible()) {
      await fightBtn.click();
      await pageF.waitForTimeout(600);
      await pageF.screenshot({ path: path.join(OUT_DIR, 'panel-boss-fight-arena.png') });

      const skipBtn = pageF.getByRole('button', { name: /Skip fight/i });
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
        await pageF.waitForTimeout(600);
        await pageF.screenshot({ path: path.join(OUT_DIR, 'panel-boss-chest.png') });
      }
    }
  }

  // Phone sheet scroll & reachability at 390x844
  await pageF.setViewportSize({ width: 390, height: 844 });
  await pageF.getByRole('tab', { name: 'Forge', exact: true }).click();
  const sheet = pageF.getByRole('tabpanel', { name: 'Forge' });
  await sheet.waitFor({ state: 'visible' });
  await pageF.screenshot({ path: path.join(OUT_DIR, 'phone-sheet-top-390.png') });

  // Scroll sheet down
  await sheet.evaluate(el => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' }));
  await pageF.waitForTimeout(200);
  await pageF.screenshot({ path: path.join(OUT_DIR, 'phone-sheet-scrolled-390.png') });

  // Close sheet
  const closeBtn = pageF.getByRole('button', { name: 'Close panel' });
  await closeBtn.click();
  await pageF.waitForTimeout(200);
  console.log('  Panels and Phone Sheet verified.');
  await contextF.close();

  await browser.close();

  // Save summary JSON
  fs.writeFileSync(path.join(OUT_DIR, 'retest-summary.json'), JSON.stringify(results, null, 2));
  console.log('\n--- COMPREHENSIVE INDEPENDENT RETEST COMPLETE ---');
}

run().catch(err => {
  console.error('Retest error:', err);
  process.exit(1);
});
