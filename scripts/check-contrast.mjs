#!/usr/bin/env node
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const req = createRequire(path.resolve('apps/web/package.json'));
const { chromium } = req('@playwright/test');

const STORAGE_KEY = 'taskbar-hero:v2-demo:1';
const PORT = 4174;
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

// Load sample save
const savePath = path.resolve('scripts/sample-save.json');
const saveRaw = fs.existsSync(savePath) ? fs.readFileSync(savePath, 'utf8') : null;

// Helper: check if server is running
function checkServer(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = http.request({ method: 'HEAD', host: u.hostname, port: u.port, path: u.pathname, timeout: 1500 }, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

// Selectors to check grouped by panel and category
const AUDIT_TARGETS = [
  // --- ZONE: BAG / INVENTORY ---
  { zone: true, panel: 'Bag', selector: '.bag-count', name: 'Bag item count' },
  { zone: true, panel: 'Bag', selector: '.sort-select', name: 'Sort select dropdown' },
  { zone: true, panel: 'Bag', selector: '.bag-name', name: 'Bag item name label' },
  { zone: true, panel: 'Bag', selector: '.bag-level', name: 'Bag item level chip' },
  { zone: true, panel: 'Bag', selector: '.detail-head h3', name: 'Selected item title' },
  { zone: true, panel: 'Bag', selector: '.detail-meta', name: 'Item rarity/slot meta' },
  { zone: true, panel: 'Bag', selector: '.detail-lines li', name: 'Item stat lines' },
  { zone: true, panel: 'Bag', selector: '.compare h4', name: 'Compare heading' },
  { zone: true, panel: 'Bag', selector: '.compare-col-heading', name: 'Compare column title' },
  { zone: true, panel: 'Bag', selector: '.compare-name', name: 'Compare item name' },
  { zone: true, panel: 'Bag', selector: '.compare-sub', name: 'Compare item subtitle' },
  { zone: true, panel: 'Bag', selector: '.delta-up', name: 'Stat upgrade delta' },
  { zone: true, panel: 'Bag', selector: '.delta-down', name: 'Stat downgrade delta' },
  { zone: true, panel: 'Bag', selector: '.detail-actions .pixel-btn', name: 'Equip action button' },
  { zone: true, panel: 'Bag', selector: '.bag-btn-secondary', name: 'Secondary item action' },
  { zone: true, panel: 'Bag', selector: '.bag-equip-best', name: 'Equip best primary button' },

  // --- ZONE: CHARACTER ---
  { zone: true, panel: 'Character', selector: '.v2-character-name', name: 'Character name' },
  { zone: true, panel: 'Character', selector: '.character-meta', name: 'Class & level meta' },
  { zone: true, panel: 'Character', selector: '.xp-text', name: 'XP progress text' },
  { zone: true, panel: 'Character', selector: '.slot-name', name: 'Gear slot name label' },
  { zone: true, panel: 'Character', selector: '.slot-level', name: 'Gear slot level badge' },
  { zone: true, panel: 'Character', selector: '.stats dt', name: 'Stat attribute label' },
  { zone: true, panel: 'Character', selector: '.stats dd', name: 'Stat attribute value' },
  { zone: true, panel: 'Character', selector: '.stats .power dt', name: 'Power row label' },
  { zone: true, panel: 'Character', selector: '.stats .power dd', name: 'Power row value' },

  // --- ZONE: FORGE ---
  { zone: true, panel: 'Forge', selector: '.forge-panel-title', name: 'Forge panel title' },
  { zone: true, panel: 'Forge', selector: '.forge-panel-desc', name: 'Forge panel description' },
  { zone: true, panel: 'Forge', selector: '.forge-tab-btn', name: 'Forge tab button (inactive)' },
  { zone: true, panel: 'Forge', selector: '.forge-tab-btn[aria-selected="true"]', name: 'Forge active tab' },
  { zone: true, panel: 'Forge', selector: '.forge-section-title', name: 'Forge section title' },
  { zone: true, panel: 'Forge', selector: '.forge-recipe-name', name: 'Forge recipe name' },
  { zone: true, panel: 'Forge', selector: '.forge-mat-count', name: 'Material stack count' },
  { zone: true, panel: 'Forge', selector: '.forge-mat-name', name: 'Material stack name' },
  { zone: true, panel: 'Forge', selector: '.forge-cost-badge', name: 'Material cost badge' },
  { zone: true, panel: 'Forge', selector: '.forge-btn-primary', name: 'Craft primary action button' },

  // --- ZONE: MARKET ---
  { zone: true, panel: 'Market', selector: '.market h3', name: 'Market section heading' },
  { zone: true, panel: 'Market', selector: '.market-hint', name: 'Market hint copy' },
  { zone: true, panel: 'Market', selector: '.market-seller', name: 'Market listing seller' },
  { zone: true, panel: 'Market', selector: '.market-price', name: 'Market listing price' },
  { zone: true, panel: 'Market', selector: '.market-form label', name: 'Market form label' },
  { zone: true, panel: 'Market', selector: '[data-testid="relics-empty"]', name: 'Market relics empty state' },
  { zone: true, panel: 'Market', selector: '[data-testid="listings-empty"]', name: 'Market listings empty state' },

  // --- ZONE: CHAPTER MAP ---
  { zone: true, panel: 'Map', selector: '.v2-map-title', name: 'Map header title' },
  { zone: true, panel: 'Map', selector: '.v2-map-subtitle', name: 'Map header subtitle' },
  { zone: true, panel: 'Map', selector: '.v2-map-chapter-num', name: 'Chapter node number' },
  { zone: true, panel: 'Map', selector: '.v2-map-chapter-name', name: 'Chapter node name' },
  { zone: true, panel: 'Map', selector: '.v2-map-boss-label', name: 'Boss row label' },
  { zone: true, panel: 'Map', selector: '.v2-map-boss-name', name: 'Boss name text' },
  { zone: true, panel: 'Map', selector: '.v2-map-badge--round', name: 'Map round badge' },
  { zone: true, panel: 'Map', selector: '.v2-map-badge--rematch', name: 'Map rematch badge' },
  { zone: true, panel: 'Map', selector: '.v2-map-locked-text', name: 'Map locked node text' },

  // --- ZONE: CLASS PICKER ---
  { zone: true, panel: 'ClassPicker', selector: '.class-picker__title', name: 'Class picker title' },
  { zone: true, panel: 'ClassPicker', selector: '.class-picker__subtitle', name: 'Class picker subtitle' },
  { zone: true, panel: 'ClassPicker', selector: '.class-card__name', name: 'Class card name' },
  { zone: true, panel: 'ClassPicker', selector: '.class-card__role', name: 'Class card role' },
  { zone: true, panel: 'ClassPicker', selector: '.class-card__passive', name: 'Class card passive description' },
  { zone: true, panel: 'ClassPicker', selector: '.class-card__stat-label', name: 'Class stat label' },
  { zone: true, panel: 'ClassPicker', selector: '.class-card__stat-value', name: 'Class stat value' },
  { zone: true, panel: 'ClassPicker', selector: '.class-card__speed-label', name: 'Class speed label' },
  { zone: true, panel: 'ClassPicker', selector: '.class-card__speed-value', name: 'Class speed value' },
  { zone: true, panel: 'ClassPicker', selector: '.class-picker__choose-btn', name: 'Class choose button' },

  // --- ZONE: LOOT DIALOGS ---
  { zone: true, panel: 'Loot', selector: '.loot-summary-heading', name: 'Loot summary heading' },
  { zone: true, panel: 'Loot', selector: '.loot-line', name: 'Loot currency line' },
  { zone: true, panel: 'Loot', selector: '.loot-item-name', name: 'Loot item tile name' },
  { zone: true, panel: 'Loot', selector: '.loot-item-meta', name: 'Loot item tile meta' },

  // --- OUTSIDE ZONE FINDINGS ---
  { zone: false, panel: 'HUD', selector: '.v2-title', name: 'Top bar game title' },
  { zone: false, panel: 'HUD', selector: '.v2-hint-lead', name: 'Next step hint lead' },
  { zone: false, panel: 'HUD', selector: '.v2-hint-btn', name: 'Next step hint button' },
  { zone: false, panel: 'HUD', selector: '.wallet-btn', name: 'Connect wallet button' },
  { zone: false, panel: 'Boss', selector: '.boss-gate-boss-name', name: 'Boss gate boss name' },
  { zone: false, panel: 'Boss', selector: '.boss-gate-chapter-sub', name: 'Boss gate chapter sub' },
  { zone: false, panel: 'Boss', selector: '.boss-fight-btn', name: 'Boss fight button' },
  { zone: false, panel: 'Help', selector: '.help-panel-title', name: 'Help panel title' },
  { zone: false, panel: 'Help', selector: '.help-panel-desc', name: 'Help panel description' },
  { zone: false, panel: 'Help', selector: '.help-v2-term', name: 'Help terminology term' },
  { zone: false, panel: 'Help', selector: '.help-v2-def', name: 'Help terminology definition' },
  { zone: false, panel: 'Help', selector: '.help-v2-btn', name: 'Help start exploring button' },
];

async function measureContrastOnPage(page, targets) {
  return await page.evaluate((targets) => {
    function parseRgba(str) {
      if (!str) return null;
      const m = str.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/);
      if (!m) return null;
      return {
        r: Math.round(Number(m[1])),
        g: Math.round(Number(m[2])),
        b: Math.round(Number(m[3])),
        a: m[4] !== undefined ? Number(m[4]) : 1,
      };
    }

    function composite(base, overlay) {
      const a = overlay.a + base.a * (1 - overlay.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
      const r = Math.round((overlay.r * overlay.a + base.r * base.a * (1 - overlay.a)) / a);
      const g = Math.round((overlay.g * overlay.a + base.g * base.a * (1 - overlay.a)) / a);
      const b = Math.round((overlay.b * overlay.a + base.b * base.a * (1 - overlay.a)) / a);
      return { r, g, b, a };
    }

    function getLuminance(rgb) {
      const a = [rgb.r, rgb.g, rgb.b].map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    function getContrast(rgb1, rgb2) {
      const l1 = getLuminance(rgb1);
      const l2 = getLuminance(rgb2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function getEffectiveBg(el) {
      let curr = el;
      const layers = [];
      while (curr && curr !== document) {
        const style = window.getComputedStyle(curr);
        const rgba = parseRgba(style.backgroundColor);
        if (rgba && rgba.a > 0) {
          layers.unshift(rgba);
          if (rgba.a === 1) break;
        }
        curr = curr.parentElement;
      }
      const isLight = document.documentElement.getAttribute('data-theme') === 'light' ||
        window.matchMedia('(prefers-color-scheme: light)').matches;
      let base = isLight ? { r: 251, g: 245, b: 238, a: 1 } : { r: 26, g: 18, b: 32, a: 1 };
      for (const layer of layers) {
        base = composite(base, layer);
      }
      return base;
    }

    function rgbToHex(rgb) {
      const h = (n) => n.toString(16).padStart(2, '0');
      return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
    }

    const results = [];

    for (const t of targets) {
      const el = document.querySelector(t.selector);
      if (!el) {
        results.push({ ...t, found: false });
        continue;
      }

      // Check if element is visible
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        results.push({ ...t, found: false });
        continue;
      }

      const fgRaw = parseRgba(style.color) || { r: 255, g: 255, b: 255, a: 1 };
      const bg = getEffectiveBg(el);
      const fg = fgRaw.a < 1 ? composite(bg, fgRaw) : fgRaw;

      const fontSize = parseFloat(style.fontSize) || 16;
      const fontWeight = parseInt(style.fontWeight) || 400;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const threshold = isLarge ? 3.0 : 4.5;

      const ratio = getContrast(fg, bg);
      const pass = ratio >= threshold;

      results.push({
        ...t,
        found: true,
        fgHex: rgbToHex(fg),
        bgHex: rgbToHex(bg),
        ratio: Math.round(ratio * 100) / 100,
        threshold,
        pass,
        fontSize: Math.round(fontSize) + 'px',
        fontWeight,
      });
    }

    return results;
  }, targets);
}

async function runAudit() {
  let serverProcess = null;
  const running = await checkServer(BASE_URL);
  if (!running) {
    console.log(`Server not responding on ${BASE_URL}. Launching preview on port ${PORT}...`);
    serverProcess = spawn('pnpm', ['exec', 'vite', 'preview', '--outDir', 'dist-v2', '--port', String(PORT), '--strictPort'], {
      cwd: path.resolve('apps/web'),
      stdio: 'pipe',
      detached: false,
    });
    // Wait for server to come up
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 400));
      if (await checkServer(BASE_URL)) break;
    }
  }

  const browser = await chromium.launch({ headless: true });
  const allResults = { light: [], dark: [] };

  try {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        colorScheme: theme,
      });

      // 1. Audit ClassPicker
      {
        const page = await context.newPage();
        await page.addInitScript(() => {
          localStorage.clear();
          localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
        });
        await page.goto(BASE_URL);
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        await page.waitForSelector('[data-testid="class-picker"]');
        const pickerTargets = AUDIT_TARGETS.filter(t => t.panel === 'ClassPicker');
        const pickerRes = await measureContrastOnPage(page, pickerTargets);
        allResults[theme].push(...pickerRes);
        await page.close();
      }

      // 2. Audit Main In-Game Panels
      {
        const page = await context.newPage();
        await page.addInitScript(({ key, save }) => {
          if (save) localStorage.setItem(key, save);
          localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
        }, { key: STORAGE_KEY, save: saveRaw });

        await page.goto(BASE_URL);
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        await page.locator('.v2-shell').waitFor();

        // Audit Map & HUD & Character (always on stage/desktop)
        const stageTargets = AUDIT_TARGETS.filter(t => ['Map', 'Character', 'HUD'].includes(t.panel));
        const stageRes = await measureContrastOnPage(page, stageTargets);
        allResults[theme].push(...stageRes);

        // Inventory
        await page.getByRole('tab', { name: 'Inventory', exact: true }).click();
        await page.waitForTimeout(200);
        // Select an item in bag so detail panel renders
        const bagTile = page.locator('.bag-tile').first();
        if (await bagTile.isVisible()) await bagTile.click();
        const bagTargets = AUDIT_TARGETS.filter(t => t.panel === 'Bag');
        const bagRes = await measureContrastOnPage(page, bagTargets);
        allResults[theme].push(...bagRes);

        // Forge
        await page.getByRole('tab', { name: 'Forge', exact: true }).click();
        await page.waitForTimeout(200);
        const forgeTargets = AUDIT_TARGETS.filter(t => t.panel === 'Forge');
        const forgeRes = await measureContrastOnPage(page, forgeTargets);
        allResults[theme].push(...forgeRes);

        // Market
        await page.getByRole('tab', { name: 'Market', exact: true }).click();
        await page.waitForTimeout(200);
        const marketTargets = AUDIT_TARGETS.filter(t => t.panel === 'Market');
        const marketRes = await measureContrastOnPage(page, marketTargets);
        allResults[theme].push(...marketRes);

        // Boss & Map
        await page.getByRole('tab', { name: 'Boss', exact: true }).click();
        await page.waitForTimeout(200);
        const bossTargets = AUDIT_TARGETS.filter(t => ['Boss', 'Map'].includes(t.panel));
        const bossRes = await measureContrastOnPage(page, bossTargets);
        allResults[theme].push(...bossRes);

        // Help
        await page.getByRole('tab', { name: 'Help', exact: true }).click();
        await page.waitForTimeout(200);
        const helpTargets = AUDIT_TARGETS.filter(t => t.panel === 'Help');
        const helpRes = await measureContrastOnPage(page, helpTargets);
        allResults[theme].push(...helpRes);

        // Audit Loot Components
        const lootTargets = AUDIT_TARGETS.filter(t => t.panel === 'Loot');
        const lootRes = await page.evaluate((targets) => {
          function parseRgba(str) {
            if (!str) return null;
            const m = str.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/);
            if (!m) return null;
            return {
              r: Math.round(Number(m[1])),
              g: Math.round(Number(m[2])),
              b: Math.round(Number(m[3])),
              a: m[4] !== undefined ? Number(m[4]) : 1,
            };
          }

          function composite(base, overlay) {
            const a = overlay.a + base.a * (1 - overlay.a);
            if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
            const r = Math.round((overlay.r * overlay.a + base.r * base.a * (1 - overlay.a)) / a);
            const g = Math.round((overlay.g * overlay.a + base.g * base.a * (1 - overlay.a)) / a);
            const b = Math.round((overlay.b * overlay.a + base.b * base.a * (1 - overlay.a)) / a);
            return { r, g, b, a };
          }

          function getLuminance(rgb) {
            const a = [rgb.r, rgb.g, rgb.b].map((v) => {
              const s = v / 255;
              return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
          }

          function getContrast(rgb1, rgb2) {
            const l1 = getLuminance(rgb1);
            const l2 = getLuminance(rgb2);
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            return (lighter + 0.05) / (darker + 0.05);
          }

          function getEffectiveBg(el) {
            let curr = el;
            const layers = [];
            while (curr && curr !== document) {
              const style = window.getComputedStyle(curr);
              const rgba = parseRgba(style.backgroundColor);
              if (rgba && rgba.a > 0) {
                layers.unshift(rgba);
                if (rgba.a === 1) break;
              }
              curr = curr.parentElement;
            }
            const isLight = document.documentElement.getAttribute('data-theme') === 'light' ||
              window.matchMedia('(prefers-color-scheme: light)').matches;
            let base = isLight ? { r: 255, g: 255, b: 255, a: 1 } : { r: 42, g: 31, b: 54, a: 1 };
            for (const layer of layers) {
              base = composite(base, layer);
            }
            return base;
          }

          function rgbToHex(rgb) {
            const h = (n) => n.toString(16).padStart(2, '0');
            return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
          }

          const backdrop = document.createElement('div');
          backdrop.className = 'loot-backdrop';
          backdrop.innerHTML = `
            <div class="loot-dialog chest-reveal-dialog">
              <div class="chest-reveal-header">
                <h2 class="chest-reveal-title">Epic Chest Found!</h2>
                <div class="chest-reveal-icon-wrap"><div class="loot-item-art"></div></div>
              </div>
              <div class="loot-summary">
                <h3 class="loot-summary-heading">Rewards</h3>
                <ul class="loot-lines">
                  <li class="loot-line"><span class="loot-line-text">+100 Fish</span></li>
                  <li class="loot-line loot-line-levelup"><span class="loot-line-text">Level 13!</span></li>
                  <li class="loot-line loot-line-xp"><span class="loot-line-text">+250 XP</span></li>
                </ul>
                <ul class="loot-items">
                  <li class="loot-item-tile">
                    <div class="loot-item-info">
                      <span class="loot-item-name">Silver Sword</span>
                      <span class="loot-item-meta">Lv 5</span>
                    </div>
                  </li>
                </ul>
                <p class="loot-salvaged-note">Salvaged into materials.</p>
              </div>
              <div class="chest-reveal-actions">
                <button type="button" class="chest-reveal-btn">Collect</button>
              </div>
            </div>
          `;
          document.body.appendChild(backdrop);

          const results = [];
          for (const t of targets) {
            const el = document.querySelector(t.selector);
            if (!el) {
              results.push({ ...t, found: false });
              continue;
            }
            const style = window.getComputedStyle(el);
            const fgRaw = parseRgba(style.color) || { r: 255, g: 255, b: 255, a: 1 };
            const bg = getEffectiveBg(el);
            const fg = fgRaw.a < 1 ? composite(bg, fgRaw) : fgRaw;
            const fontSize = parseFloat(style.fontSize) || 16;
            const fontWeight = parseInt(style.fontWeight) || 400;
            const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
            const threshold = isLarge ? 3.0 : 4.5;
            const ratio = getContrast(fg, bg);
            const pass = ratio >= threshold;
            results.push({
              ...t,
              found: true,
              fgHex: rgbToHex(fg),
              bgHex: rgbToHex(bg),
              ratio: Math.round(ratio * 100) / 100,
              threshold,
              pass,
              fontSize: Math.round(fontSize) + 'px',
              fontWeight,
            });
          }
          document.body.removeChild(backdrop);
          return results;
        }, lootTargets);
        allResults[theme].push(...lootRes);

        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }

  // Print results
  let totalZoneFailures = 0;
  const outsideZoneFailures = [];

  for (const theme of ['dark', 'light']) {
    console.log(`\n=======================================================`);
    console.log(`  WCAG CONTRAST AUDIT REPORT (${theme.toUpperCase()} THEME)`);
    console.log(`=======================================================`);
    console.log(
      'Status'.padEnd(8) +
      'Zone'.padEnd(8) +
      'Panel'.padEnd(14) +
      'Element Name'.padEnd(32) +
      'Ratio'.padEnd(10) +
      'Req'.padEnd(8) +
      'FG / BG'
    );
    console.log('-'.repeat(96));

    for (const r of allResults[theme]) {
      if (!r.found) continue;
      const status = r.pass ? 'PASS' : 'FAIL';
      const zoneTag = r.zone ? 'TIER 1' : 'OUTSIDE';
      const ratioStr = `${r.ratio}:1`;
      const reqStr = `>=${r.threshold}:1`;
      const colors = `${r.fgHex} on ${r.bgHex}`;

      console.log(
        status.padEnd(8) +
        zoneTag.padEnd(8) +
        r.panel.padEnd(14) +
        r.name.padEnd(32) +
        ratioStr.padEnd(10) +
        reqStr.padEnd(8) +
        colors
      );

      if (!r.pass) {
        if (r.zone) {
          totalZoneFailures++;
        } else {
          outsideZoneFailures.push({ theme, ...r });
        }
      }
    }
  }

  console.log(`\n-------------------------------------------------------`);
  console.log(`SUMMARY: ${totalZoneFailures} failures inside your zone (Tier 1).`);
  console.log(`         ${outsideZoneFailures.length} findings outside your zone.`);
  console.log(`-------------------------------------------------------`);

  if (outsideZoneFailures.length > 0) {
    console.log(`\nFindings outside zone (for report documentation):`);
    for (const f of outsideZoneFailures) {
      console.log(`- [${f.theme.toUpperCase()}] ${f.panel}: ${f.name} (${f.selector}) -> ${f.ratio}:1 (needed ${f.threshold}:1, ${f.fgHex} on ${f.bgHex})`);
    }
  }

  if (totalZoneFailures > 0) {
    console.error(`\nAudit FAILED with ${totalZoneFailures} contrast failures inside your zone.`);
    process.exit(1);
  } else {
    console.log(`\nAudit PASSED! All elements in your zone meet WCAG contrast thresholds.`);
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit encountered error:', err);
  process.exit(1);
});
