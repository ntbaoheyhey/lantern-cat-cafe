/**
 * Automated QA Integrated Harness Runner
 * Runs functional browser QA against the integrated v2 stack in demo mode.
 * Exercises Items 1 to 9 of CARD AG1r:
 *   1. Boss lifecycle (bossReadyStrong, bossReadyWeak, zero-key reached-boss)
 *   2. Forge lifecycle (forgeRich craft, salvage, lock guard, Relic area)
 *   3. Relic with no wallet connected
 *   4. Zoom matrix (1280x720@1, 640x360@2, 320x180@4)
 *   5. Resize burst (1600->420 4px steps x3 cycles, actor canvas check, video)
 *   6. Phone sheet (320x568 and 390x844, 5 tabs, Escape dismiss, focus return, scroll)
 *   7. WebKit execution (Items 4, 5, 6 on WebKit)
 *   8. Reduced motion on/off (Items 1 and 5)
 *   9. Console monitoring (all errors and warnings recorded)
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(path.resolve('apps/web/node_modules/@playwright/test'));

const BASE_URL = process.env.BASE_URL || 'http://localhost:4174';
const PORT = 4174;
const STORAGE_KEY = 'taskbar-hero:v2-demo:1';
const FIXTURES_PATH = path.resolve('reports/qa-integrated/harness/fixtures.json');

const SCREENSHOTS_DIR = path.resolve('reports/qa-integrated/screenshots');
const WEBKIT_SCREENSHOTS_DIR = path.resolve('reports/qa-integrated/screenshots/webkit');
const VIDEOS_DIR = path.resolve('reports/qa-integrated/videos');
const LOGS_DIR = path.resolve('reports/qa-integrated/logs');

// Ensure output dirs exist
for (const dir of [SCREENSHOTS_DIR, WEBKIT_SCREENSHOTS_DIR, VIDEOS_DIR, LOGS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));

// Console log storage
const consoleLogs = [];

function attachLogger(page, contextLabel) {
  page.on('console', msg => {
    consoleLogs.push({
      context: contextLabel,
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString(),
    });
  });
  page.on('pageerror', err => {
    consoleLogs.push({
      context: contextLabel,
      type: 'pageerror',
      text: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Server management: checks if port is alive, starts preview server if not.
 */
let spawnedServer = null;

async function isServerRunning(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer() {
  const running = await isServerRunning(`${BASE_URL}/`);
  if (running) {
    console.log(`[Harness] Preview server already running at ${BASE_URL}`);
    return;
  }

  console.log(`[Harness] Launching preview server on port ${PORT}...`);
  spawnedServer = spawn(
    'npx',
    ['-y', 'pnpm@10.28.0', '--filter', '@taskbar-hero/web', 'exec', 'vite', 'preview', '--outDir', 'dist-v2', '--port', String(PORT), '--strictPort'],
    { stdio: 'inherit' }
  );

  const start = Date.now();
  while (Date.now() - start < 20000) {
    await new Promise(r => setTimeout(r, 400));
    if (await isServerRunning(`${BASE_URL}/`)) {
      console.log(`[Harness] Preview server started successfully at ${BASE_URL}`);
      return;
    }
  }
  throw new Error('Timeout waiting for preview server to start');
}

function stopServer() {
  if (spawnedServer) {
    console.log('[Harness] Stopping spawned preview server...');
    try {
      spawnedServer.kill();
    } catch {}
    spawnedServer = null;
  }
}

process.on('SIGINT', () => {
  stopServer();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopServer();
  process.exit(143);
});

/**
 * Page initialization helper: stores demo save and navigates.
 */
async function loadDemoPage(context, save, options = {}) {
  const { label = 'test', viewport = { width: 1280, height: 720 }, clockTime = null } = options;
  const page = await context.newPage();
  attachLogger(page, label);

  if (viewport) {
    await page.setViewportSize(viewport);
  }

  if (clockTime) {
    await page.clock.install({ time: clockTime });
  }

  await page.addInitScript(
    ({ key, state }) => {
      if (state) {
        localStorage.setItem(key, JSON.stringify(state));
      } else {
        localStorage.removeItem(key);
      }
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    },
    { key: STORAGE_KEY, state: save }
  );

  await page.goto(`${BASE_URL}/`);
  await page.waitForSelector('.v2-shell', { timeout: 10000 });
  return page;
}

// -------------------------------------------------------------
// Test Item 1: Boss Lifecycle
// -------------------------------------------------------------
async function runItem1Boss(browser) {
  console.log('\n--- Item 1: Boss Lifecycle ---');
  const results = {};

  // 1a: bossReadyStrong -> Win, Victory, Chest dialog, Key drops by 1
  {
    console.log('[1a] Testing bossReadyStrong (Victory flow)...');
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await loadDemoPage(context, fixtures.strong, { label: '1a-boss-strong' });

    // Check HUD key before fight
    const hudBefore = await page.locator('.hud-bar').textContent();
    console.log('    HUD before fight:', hudBefore);

    await page.click('#tab-Boss');
    await page.waitForSelector('.boss-gate-panel');

    const fightBtn = page.locator('.boss-fight-btn');
    await fightBtn.click();

    // Check arena canvas
    const arenaCanvas = page.locator('.boss-arena canvas');
    await arenaCanvas.waitFor({ state: 'visible', timeout: 5000 });
    console.log('    Arena canvas active');

    // Wait for Victory message
    const victory = page.locator('text=Victory!');
    await victory.waitFor({ state: 'visible', timeout: 20000 });
    console.log('    Victory banner visible');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-boss-victory.png') });

    // Wait for Chest reveal dialog
    const chestDialog = page.locator('[role="dialog"], .chest-reveal');
    await chestDialog.waitFor({ state: 'visible', timeout: 5000 });
    console.log('    Chest dialog visible');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-boss-chest.png') });

    const hudAfter = await page.locator('.hud-bar').textContent();
    console.log('    HUD after win:', hudAfter);

    // Verify key drop: was 1/5 before, now 0/5
    const keysBefore = hudBefore.match(/Cat Keys\s*(\d+)\/5/)?.[1];
    const keysAfter = hudAfter.match(/Cat Keys\s*(\d+)\/5/)?.[1];
    const keyDropped = Number(keysBefore) === 1 && Number(keysAfter) === 0;

    results['1a_strong'] = {
      pass: keyDropped && !!victory && !!chestDialog,
      hudBefore,
      hudAfter,
      keyDropped,
    };
    await context.close();
  }

  // 1b: bossReadyWeak -> Defeat, Key kept, Catnap cooldown countdown, disabled then enabled
  {
    console.log('[1b] Testing bossReadyWeak (Defeat & Cooldown flow)...');
    const clockTime = Date.UTC(2026, 9, 26, 12, 0, 0);
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await loadDemoPage(context, fixtures.weak, { label: '1b-boss-weak', clockTime });

    const hudBefore = await page.locator('.hud-bar').textContent();
    await page.click('#tab-Boss');
    await page.waitForSelector('.boss-gate-panel');

    const fightBtn = page.locator('.boss-fight-btn');
    await fightBtn.click();

    const arenaCanvas = page.locator('.boss-arena canvas');
    await arenaCanvas.waitFor({ state: 'visible', timeout: 5000 });

    // Skip fight for defeat result
    const skipBtn = page.locator('button:has-text("Skip fight")');
    if (await skipBtn.count()) {
      await skipBtn.click();
    }

    const defeatMsg = page.locator('text=Defeat. Your key was kept.');
    await defeatMsg.waitFor({ state: 'visible', timeout: 15000 });
    console.log('    Defeat message displayed');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-boss-defeat.png') });

    const hudAfter = await page.locator('.hud-bar').textContent();
    const keyKept = hudAfter.includes('Cat Keys 1/5') || hudAfter.includes('Cat Keys1/5');

    // Click Back to exploring
    await page.click('button:has-text("Back to exploring")');
    await page.waitForSelector('.boss-gate-panel');

    const cooldownStatus = await page.locator('.boss-gate-status-text').textContent();
    const isDisabledDuringCooldown = await fightBtn.isDisabled();
    console.log('    Cooldown text:', cooldownStatus);
    console.log('    Fight disabled during cooldown?', isDisabledDuringCooldown);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-boss-catnap-cooldown.png') });

    // Fast-forward past cooldown (65 seconds)
    await page.clock.fastForward(65000);
    await page.waitForTimeout(300);

    const isEnabledAfterCooldown = !(await fightBtn.isDisabled());
    const statusAfterCooldown = await page.locator('.boss-gate-status-text').textContent().catch(() => null);
    console.log('    Fight enabled after cooldown expired?', isEnabledAfterCooldown);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-boss-cooldown-expired.png') });

    results['1b_weak'] = {
      pass: keyKept && isDisabledDuringCooldown && isEnabledAfterCooldown && cooldownStatus.includes('Catnap:'),
      keyKept,
      cooldownStatus,
      isDisabledDuringCooldown,
      isEnabledAfterCooldown,
    };
    await context.close();
  }

  // 1c: Zero-key reached-boss -> no_key message, Fight disabled with aria-describedby
  {
    console.log('[1c] Testing zero-key reached-boss save...');
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await loadDemoPage(context, fixtures.zeroKey, { label: '1c-boss-zero-key' });

    await page.click('#tab-Boss');
    await page.waitForSelector('.boss-gate-panel');

    const statusKind = await page.locator('.boss-gate-panel').getAttribute('data-status');
    const statusTextEl = page.locator('.boss-gate-status-text');
    const statusText = await statusTextEl.textContent();
    const statusTextId = await statusTextEl.getAttribute('id');

    const fightBtn = page.locator('.boss-fight-btn');
    const isDisabled = await fightBtn.isDisabled();
    const ariaDescribedBy = await fightBtn.getAttribute('aria-describedby');

    console.log('    data-status:', statusKind);
    console.log('    Status text:', statusText);
    console.log('    Button disabled?', isDisabled);
    console.log('    aria-describedby:', ariaDescribedBy, 'matches status id?', ariaDescribedBy === statusTextId);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-boss-zero-key.png') });

    const expectedText = statusText.includes('You need a Cat Key');
    results['1c_zero_key'] = {
      pass: statusKind === 'no_key' && isDisabled && ariaDescribedBy === statusTextId && expectedText,
      statusKind,
      statusText,
      isDisabled,
      ariaDescribedBy,
      ariaMatches: ariaDescribedBy === statusTextId,
    };
    await context.close();
  }

  return results;
}

// -------------------------------------------------------------
// Test Item 2: Forge Lifecycle
// -------------------------------------------------------------
async function runItem2Forge(browser) {
  console.log('\n--- Item 2: Forge Lifecycle (forgeRich) ---');
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await loadDemoPage(context, fixtures.forgeRich, { label: 'item2-forge' });

  // Initial state check
  const initialItemsCount = fixtures.forgeRich.state.items.length;
  console.log('    Initial inventory items count:', initialItemsCount);

  // Navigate to Forge tab
  await page.click('#tab-Forge');
  await page.waitForSelector('.forge-panel');

  // Step A: Craft one item
  console.log('    [2a] Crafting an item...');
  const craftBtn = page.locator('[data-testid="craft-btn"]');
  await craftBtn.click();

  const confirmCraftBtn = page.locator('[data-testid="craft-confirm-btn"]');
  await confirmCraftBtn.click();

  // Wait for item count to increase by 1
  let countAfterCraft = 0;
  await page.waitForFunction(
    key => {
      const save = JSON.parse(localStorage.getItem(key) || '{}');
      return (save?.state?.items?.length || 0) > 5;
    },
    STORAGE_KEY,
    { timeout: 5000 }
  );
  countAfterCraft = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.items.length, STORAGE_KEY);
  console.log('    Bag count after craft:', countAfterCraft, `(expected ${initialItemsCount + 1})`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-forge-craft.png') });

  // Step B: Salvage tab & lock inspection
  console.log('    [2b] Inspecting salvage tab and item lock guard...');
  const salvageTabBtn = page.locator('[data-testid="tab-salvage"], button[role="tab"]:has-text("Salvage")');
  await salvageTabBtn.click();
  await page.waitForSelector('.forge-salvage-tab');

  // Find locked item
  const saveState = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state, STORAGE_KEY);
  const lockedItem = saveState.items.find(i => i.locked);
  const eligibleItem = saveState.items.find(i => !i.locked && !i.equipped);

  let lockedDisabled = false;
  if (lockedItem) {
    const lockedCheck = page.locator(`[data-testid="salvage-check-${lockedItem.id}"]`);
    lockedDisabled = await lockedCheck.isDisabled();
    console.log(`    Locked item (${lockedItem.id}) checkbox disabled?`, lockedDisabled);
  }

  // Select eligible unlocked item and salvage
  let countAfterSalvage = countAfterCraft;
  if (eligibleItem) {
    console.log(`    Selecting unlocked item (${eligibleItem.id}) for salvage...`);
    const checkEl = page.locator(`[data-testid="salvage-check-${eligibleItem.id}"]`);
    await checkEl.check();

    const salvageBtn = page.locator('[data-testid="salvage-btn"]');
    await salvageBtn.click();

    const salvageConfirmBtn = page.locator('[data-testid="salvage-confirm-btn"]');
    await salvageConfirmBtn.click();

    await page.waitForFunction(
      ({ key, expected }) => {
        const save = JSON.parse(localStorage.getItem(key) || '{}');
        return (save?.state?.items?.length || 0) === expected;
      },
      { key: STORAGE_KEY, expected: countAfterCraft - 1 },
      { timeout: 5000 }
    );
    countAfterSalvage = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.items.length, STORAGE_KEY);
    console.log('    Bag count after salvage:', countAfterSalvage, `(expected ${countAfterCraft - 1})`);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-forge-salvage-locked.png') });

  // Step C: Open Relic Forge area
  console.log('    [2c] Opening Relic Forge area...');
  const relicTabBtn = page.locator('[data-testid="tab-relic"], button[role="tab"]:has-text("Relic")');
  await relicTabBtn.click();
  await page.waitForSelector('[data-testid="relic-panel"], .forge-relic-card');

  const relicAreaVisible = await page.locator('.forge-relic-card').isVisible();
  const oddsListVisible = await page.locator('.forge-odds-list').isVisible();
  console.log('    Relic Forge card visible?', relicAreaVisible);
  console.log('    Relic odds list visible?', oddsListVisible);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-forge-relic-area.png') });

  await context.close();

  return {
    pass: countAfterCraft === initialItemsCount + 1 && lockedDisabled && countAfterSalvage === initialItemsCount && relicAreaVisible,
    initialCount: initialItemsCount,
    countAfterCraft,
    lockedDisabled,
    countAfterSalvage,
    relicAreaVisible,
  };
}

// -------------------------------------------------------------
// Test Item 3: Relic with No Wallet
// -------------------------------------------------------------
async function runItem3RelicNoWallet(browser) {
  console.log('\n--- Item 3: Relic with No Wallet Connected ---');
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await loadDemoPage(context, fixtures.relicReady, { label: 'item3-relic-no-wallet' });

  await page.click('#tab-Forge');
  await page.waitForSelector('.forge-panel');

  const relicTabBtn = page.locator('[data-testid="tab-relic"], button[role="tab"]:has-text("Relic")');
  await relicTabBtn.click();
  await page.waitForSelector('[data-testid="relic-panel"], .forge-relic-card');

  const relicForgeBtn = page.locator('[data-testid="relic-forge-btn"]');
  const btnText = await relicForgeBtn.textContent();
  console.log('    Relic forge button text:', btnText);

  // Click Forge Relic to trigger confirm box
  await relicForgeBtn.click();
  const confirmBox = page.locator('[data-testid="relic-confirm-box"]');
  await confirmBox.waitFor({ state: 'visible', timeout: 3000 });
  console.log('    Relic confirm dialog rendered');

  // Click Confirm Forge
  const confirmBtn = page.locator('[data-testid="relic-confirm-btn"]');
  await confirmBtn.click();

  // Notice should appear stating wallet is required
  const noticeEl = page.locator('.v2-action-notice, [role="status"]');
  await noticeEl.waitFor({ state: 'visible', timeout: 5000 });
  const noticeText = await noticeEl.textContent();
  console.log('    Notice text after forge attempt:', noticeText);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-relic-wallet-prompt.png') });

  // Verify NO voucher is created
  const saveState = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  const pendingVoucher = saveState.state?.forge?.pending || null;
  const voucherNonce = saveState.voucherNonce || 0;
  console.log('    Pending voucher in storage:', pendingVoucher);
  console.log('    Voucher nonce:', voucherNonce);

  const walletPromptPassed = noticeText.includes('Connect your wallet') && pendingVoucher === null;
  await context.close();

  return {
    pass: walletPromptPassed,
    noticeText,
    pendingVoucher,
    voucherCreated: pendingVoucher !== null,
  };
}

// -------------------------------------------------------------
// Test Item 4: Real Desktop Browser Layout Zoom
// -------------------------------------------------------------
async function runItem4Zoom(browser, isWebKit = false) {
  console.log(`\n--- Item 4: Zoom Matrix (${isWebKit ? 'WebKit' : 'Chromium'}) ---`);
  const outDir = isWebKit ? WEBKIT_SCREENSHOTS_DIR : SCREENSHOTS_DIR;
  const prefix = isWebKit ? '04-webkit-zoom' : '04-zoom';

  const zoomLevels = [
    { width: 1280, height: 720, dpr: 1, label: '1280x720@1' },
    { width: 640, height: 360, dpr: 2, label: '640x360@2' },
    { width: 320, height: 180, dpr: 4, label: '320x180@4' },
  ];

  const results = [];

  for (const { width, height, dpr, label } of zoomLevels) {
    console.log(`    Testing zoom ${label}...`);
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
    });
    const page = await loadDemoPage(context, fixtures.strong, {
      label: `zoom-${label}`,
      viewport: { width, height },
    });

    // Extract metrics
    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.v2-shell');
      const docEl = document.documentElement;
      const body = document.body;

      // Layout attribute
      const dataLayout = shell?.getAttribute('data-layout') || null;

      // Overflow check
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const innerWidth = window.innerWidth;
      const hasHorizontalOverflow = scrollWidth > innerWidth;

      // HUD overlap check
      const hud = document.querySelector('.hud-bar');
      const leaves = hud
        ? [...hud.querySelectorAll('.hud-level-badge, .hud-xp-track, .hud-xp-text, .hud-progress-chip, .hud-stack-item, .hud-power-chip')]
        : [];
      const hudOverlaps = [];
      for (let i = 0; i < leaves.length; i++) {
        for (let j = i + 1; j < leaves.length; j++) {
          const a = leaves[i].getBoundingClientRect();
          const b = leaves[j].getBoundingClientRect();
          const overlap = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
          if (overlap) {
            hudOverlaps.push(`${leaves[i].className} overlaps ${leaves[j].className}`);
          }
        }
      }

      // Actions reachable
      const tabs = document.querySelector('[role="tablist"], .v2-tabs, .v2-nav-tabs');
      const bossBtn = document.querySelector('#tab-Boss');
      const forgeBtn = document.querySelector('#tab-Forge');

      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        dataLayout,
        scrollWidth,
        hasHorizontalOverflow,
        hudOverlapsCount: hudOverlaps.length,
        hudOverlaps,
        tabsReachable: !!tabs,
        bossReachable: !!bossBtn,
        forgeReachable: !!forgeBtn,
      };
    });

    console.log(`      Metrics: innerWidth=${metrics.innerWidth}, dpr=${metrics.devicePixelRatio}, layout=${metrics.dataLayout}, overflow=${metrics.hasHorizontalOverflow}, hudOverlaps=${metrics.hudOverlapsCount}`);
    await page.screenshot({ path: path.join(outDir, `${prefix}-${label.replace('@', '-dpr')}.png`) });

    results.push({ label, ...metrics });
    await context.close();
  }

  return results;
}

// -------------------------------------------------------------
// Test Item 5: Resize Drag Burst (1600 -> 420 px x 3 cycles)
// -------------------------------------------------------------
async function runItem5ResizeBurst(browser, isWebKit = false, options = {}) {
  const { reducedMotion = null } = options;
  const browserLabel = isWebKit ? 'WebKit' : 'Chromium';
  const motionLabel = reducedMotion ? ` [motion:${reducedMotion}]` : '';
  console.log(`\n--- Item 5: Resize Drag Burst (${browserLabel}${motionLabel}) ---`);

  const outDir = isWebKit ? WEBKIT_SCREENSHOTS_DIR : SCREENSHOTS_DIR;
  const prefix = isWebKit ? '05-webkit-resize-burst' : '05-resize-burst';

  const contextOptions = {
    viewport: { width: 1600, height: 720 },
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1600, height: 720 } },
  };
  if (reducedMotion) {
    contextOptions.reducedMotion = reducedMotion;
  }

  const context = await browser.newContext(contextOptions);
  const page = await loadDemoPage(context, fixtures.strong, {
    label: `resize-burst-${browserLabel}`,
    viewport: { width: 1600, height: 720 },
  });

  const burstErrors = [];
  page.on('pageerror', err => burstErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') burstErrors.push(msg.text());
  });

  // Track inserted canvases via MutationObserver
  await page.evaluate(() => {
    let inserted = 0;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node instanceof HTMLCanvasElement) inserted++;
          inserted += node.querySelectorAll('canvas').length;
        }
      }
      document.documentElement.dataset.insertedCanvases = String(inserted);
    });
    observer.observe(document, { childList: true, subtree: true });
  });

  // Wait for initial stage canvas
  await page.waitForSelector('.v2-stage canvas');
  console.log('    Initial 1600px stage canvas active');

  // Perform 3 cycles of burst: 1600 down to 420 in 4px steps, no delay
  console.log('    Executing 3 burst cycles (1600 -> 420 px in 4px steps)...');
  for (let cycle = 1; cycle <= 3; cycle++) {
    for (let w = 1600; w >= 420; w -= 4) {
      await page.setViewportSize({ width: w, height: 720 });
    }
  }

  // Settle at 420x720
  await page.setViewportSize({ width: 420, height: 720 });
  await page.waitForTimeout(1000);

  // Check settled state: canvas count & actors drawn
  const settled = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    const stageCanvas = document.querySelector('.v2-stage canvas');

    let actorsDrawn = { cat: false, monster: false };
    if (stageCanvas instanceof HTMLCanvasElement) {
      const ctx = stageCanvas.getContext('2d');
      if (ctx) {
        const imgData = ctx.getImageData(0, 0, stageCanvas.width, stageCanvas.height).data;
        const midX = Math.floor(stageCanvas.width / 2);
        for (let y = 0; y < stageCanvas.height; y++) {
          for (let x = 0; x < stageCanvas.width; x++) {
            const alpha = imgData[(y * stageCanvas.width + x) * 4 + 3];
            if (alpha > 0) {
              if (x < midX) actorsDrawn.cat = true;
              else actorsDrawn.monster = true;
            }
          }
        }
      }
    }

    const inserted = Number(document.documentElement.dataset.insertedCanvases || 0);

    return {
      canvasCount: canvases.length,
      hasStageCanvas: !!stageCanvas,
      stageWidth: stageCanvas?.width,
      stageHeight: stageCanvas?.height,
      actorsDrawn,
      insertedCanvases: inserted,
    };
  });

  console.log('    Settled metrics:', settled);
  console.log('    Burst console errors:', burstErrors.length);
  await page.screenshot({ path: path.join(outDir, `${prefix}-settle.png`) });

  const video = page.video();
  await context.close();
  const videoPath = video ? await video.path() : null;
  console.log('    Recorded video saved to:', videoPath);

  return {
    ...settled,
    errorsCount: burstErrors.length,
    burstErrors,
    videoPath,
  };
}

// -------------------------------------------------------------
// Test Item 6: Phone Sheet Navigation (320x568 & 390x844)
// -------------------------------------------------------------
async function runItem6PhoneSheet(browser, isWebKit = false) {
  const browserLabel = isWebKit ? 'WebKit' : 'Chromium';
  console.log(`\n--- Item 6: Phone Sheet Navigation (${browserLabel}) ---`);
  const outDir = isWebKit ? WEBKIT_SCREENSHOTS_DIR : SCREENSHOTS_DIR;
  const prefix = isWebKit ? '06-webkit-sheet' : '06-sheet';

  const viewports = [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ];
  const tabs = ['Inventory', 'Boss', 'Forge', 'Market', 'Help'];
  const results = [];

  for (const vp of viewports) {
    console.log(`    Testing phone viewport ${vp.width}x${vp.height}...`);
    const context = await browser.newContext({ viewport: vp });
    const page = await loadDemoPage(context, fixtures.strong, {
      label: `sheet-${vp.width}x${vp.height}`,
      viewport: vp,
    });

    for (const tab of tabs) {
      const tabBtn = page.locator(`#tab-${tab}`);
      if (!(await tabBtn.count())) continue;

      // Open tab
      await tabBtn.click();
      const sheet = page.locator('.v2-sheet');
      await sheet.waitFor({ state: 'visible', timeout: 5000 });

      // Verify scrollability and scroll to last button
      const scrollInfo = await page.evaluate(() => {
        const panel = document.querySelector('.v2-sheet, .v2-sheet .tab-content, .v2-sheet [role="tabpanel"]');
        if (!panel) return { scrollable: false, reachedBottom: false };

        const initialScrollHeight = panel.scrollHeight;
        const clientHeight = panel.clientHeight;
        panel.scrollTop = panel.scrollHeight;

        const buttons = panel.querySelectorAll('button, input, [role="button"]');
        const lastBtn = buttons.length ? buttons[buttons.length - 1] : null;
        let lastBtnVisible = false;
        if (lastBtn) {
          const rect = lastBtn.getBoundingClientRect();
          lastBtnVisible = rect.top < window.innerHeight && rect.bottom > 0;
        }

        return {
          scrollHeight: initialScrollHeight,
          clientHeight,
          isScrollable: initialScrollHeight > clientHeight,
          scrollTopAfter: panel.scrollTop,
          lastBtnPresent: !!lastBtn,
          lastBtnVisible,
        };
      });

      await page.screenshot({ path: path.join(outDir, `${prefix}-${vp.width}x${vp.height}-${tab}.png`) });

      // Press Escape to dismiss
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const sheetHidden = await page.evaluate(() => {
        const el = document.querySelector('.v2-sheet');
        return !el || el.hidden || window.getComputedStyle(el).display === 'none' || !el.classList.contains('open');
      });

      const focusedId = await page.evaluate(() => document.activeElement?.id || null);
      const focusRestored = focusedId === `tab-${tab}`;

      console.log(`      Tab ${tab}: sheetClosed=${sheetHidden}, focusRestored=${focusRestored} (${focusedId})`);

      results.push({
        viewport: `${vp.width}x${vp.height}`,
        tab,
        sheetOpened: true,
        scrollInfo,
        sheetHidden,
        focusRestored,
        focusedId,
      });
    }

    await context.close();
  }

  return results;
}

// -------------------------------------------------------------
// Test Item 8: Reduced Motion On/Off Matrix
// -------------------------------------------------------------
async function runItem8ReducedMotion(browser) {
  console.log('\n--- Item 8: Reduced Motion On/Off Matrix ---');
  const results = {};

  for (const motionSetting of ['no-preference', 'reduce']) {
    console.log(`    Testing with reducedMotion: '${motionSetting}'...`);

    // Test Item 1 Boss Victory with motion setting
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      reducedMotion: motionSetting,
    });
    const page = await loadDemoPage(context, fixtures.strong, { label: `motion-${motionSetting}-boss` });

    await page.click('#tab-Boss');
    await page.waitForSelector('.boss-gate-panel');
    await page.click('.boss-fight-btn');

    await page.waitForSelector('.boss-arena canvas');
    await page.waitForSelector('text=Victory!', { timeout: 20000 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `08-reduced-motion-${motionSetting === 'reduce' ? 'on' : 'off'}-boss.png`),
    });

    results[`boss_${motionSetting}`] = { pass: true };
    await context.close();

    // Test Item 5 Burst with motion setting
    const burstResult = await runItem5ResizeBurst(browser, false, { reducedMotion: motionSetting });
    results[`burst_${motionSetting}`] = burstResult;
  }

  return results;
}

// -------------------------------------------------------------
// Main Harness Orchestrator
// -------------------------------------------------------------
export async function runFullQA() {
  console.log('====================================================');
  console.log('=== Taskbar Hero v2 Integrated Browser QA Runner ===');
  console.log('====================================================');

  await ensureServer();

  console.log('\n[Harness] Launching Chromium browser...');
  const crBrowser = await chromium.launch({ headless: true });

  console.log('[Harness] Launching WebKit browser...');
  const wkBrowser = await webkit.launch({ headless: true });

  const finalReport = {
    timestamp: new Date().toISOString(),
    sourceCommit: 'c87012d32c04cabe81b5d2cd1461e97cb9bbe569',
    environment: {
      node: process.version,
      pnpm: '10.28.0',
      baseUrl: BASE_URL,
    },
    items: {},
  };

  try {
    // Item 1: Boss
    finalReport.items.item1_boss = await runItem1Boss(crBrowser);

    // Item 2: Forge
    finalReport.items.item2_forge = await runItem2Forge(crBrowser);

    // Item 3: Relic no wallet
    finalReport.items.item3_relic_no_wallet = await runItem3RelicNoWallet(crBrowser);

    // Item 4: Zoom (Chromium)
    finalReport.items.item4_zoom_chromium = await runItem4Zoom(crBrowser, false);

    // Item 5: Resize Burst (Chromium)
    finalReport.items.item5_resize_burst_chromium = await runItem5ResizeBurst(crBrowser, false);

    // Item 6: Phone Sheet (Chromium)
    finalReport.items.item6_phone_sheet_chromium = await runItem6PhoneSheet(crBrowser, false);

    // Item 7: WebKit matrix (Items 4, 5, 6)
    console.log('\n--- Item 7: WebKit Matrix Execution ---');
    finalReport.items.item7_webkit = {
      zoom: await runItem4Zoom(wkBrowser, true),
      burst: await runItem5ResizeBurst(wkBrowser, true),
      sheet: await runItem6PhoneSheet(wkBrowser, true),
    };

    // Item 8: Reduced motion matrix
    finalReport.items.item8_reduced_motion = await runItem8ReducedMotion(crBrowser);

    // Item 9: Console errors and warnings
    console.log('\n--- Item 9: Console Monitoring Summary ---');
    finalReport.items.item9_console = {
      totalLogs: consoleLogs.length,
      warningsCount: consoleLogs.filter(l => l.type === 'warning').length,
      errorsCount: consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror').length,
      allEntries: consoleLogs,
    };
    console.log(`    Total entries: ${consoleLogs.length}`);
    console.log(`    Warnings: ${finalReport.items.item9_console.warningsCount}`);
    console.log(`    Errors: ${finalReport.items.item9_console.errorsCount}`);

    // Write raw execution results and logs
    fs.writeFileSync(path.join(LOGS_DIR, 'qa-run.json'), JSON.stringify(finalReport, null, 2));
    fs.writeFileSync(path.join(LOGS_DIR, 'console-log.txt'), consoleLogs.map(l => `[${l.timestamp}] [${l.context}] [${l.type}] ${l.text} (${l.location?.url || ''}:${l.location?.lineNumber || ''})`).join('\n'));

    console.log('\n====================================================');
    console.log('=== All Browser QA Tests Completed Successfully! ===');
    console.log('====================================================');
  } catch (err) {
    console.error('[Harness] Error executing tests:', err);
    throw err;
  } finally {
    await crBrowser.close();
    await wkBrowser.close();
    stopServer();
  }

  return finalReport;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('reports/qa-integrated/harness/run-qa-integrated.mjs')) {
  runFullQA().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
