import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer as createNetServer } from 'node:net';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '../..');
const outDir = resolve(repoRoot, 'reports/redesign/AGR2-fix');
mkdirSync(outDir, { recursive: true });

async function requireFreePort(port) {
  const socket = createNetServer();
  await new Promise((ok, fail) => {
    socket.once('error', fail);
    socket.listen(port, ok);
  });
  await new Promise((ok) => socket.close(ok));
}

// 29-item bag fixture (weapons, armor sets, accessories, materials, and relic)
export function createRichBagState() {
  const inventory = [
    // 7 equipped items
    { id: 'it-eq-1', itemKey: 'wpn.sword.twig', slot: 'weapon', weaponType: 'sword', rarity: 'common', level: 4, bonus: [], locked: false, equipped: true },
    { id: 'it-eq-2', itemKey: 'arm.cozy.helmet.uncommon', slot: 'helmet', rarity: 'uncommon', level: 6, bonus: [{ stat: 'dodge', value: 0.01 }], locked: false, equipped: true },
    { id: 'it-eq-3', itemKey: 'arm.cozy.armor.common', slot: 'armor', rarity: 'common', level: 3, bonus: [], locked: false, equipped: true },
    { id: 'it-eq-4', itemKey: 'arm.ranger.gloves.rare', slot: 'gloves', rarity: 'rare', level: 8, bonus: [{ stat: 'critChance', value: 0.03 }], locked: false, equipped: true },
    { id: 'it-eq-5', itemKey: 'arm.cozy.boots.common', slot: 'boots', rarity: 'common', level: 2, bonus: [], locked: false, equipped: true },
    { id: 'it-eq-6', itemKey: 'acc.collar.studded.uncommon', slot: 'collar', rarity: 'uncommon', level: 5, bonus: [{ stat: 'xpBonus', value: 0.03 }], locked: false, equipped: true },
    { id: 'it-eq-7', itemKey: 'acc.earring.fishhook.uncommon', slot: 'earring', rarity: 'uncommon', level: 5, bonus: [{ stat: 'materialFind', value: 0.03 }], locked: false, equipped: true },

    // 10 Weapons (mixed rarities)
    { id: 'it-bg-1', itemKey: 'wpn.sword.silver', slot: 'weapon', weaponType: 'sword', rarity: 'rare', level: 7, bonus: [{ stat: 'critDamage', value: 0.1 }], locked: false, equipped: false },
    { id: 'it-bg-2', itemKey: 'wpn.sword.sunfang', slot: 'weapon', weaponType: 'sword', rarity: 'epic', level: 10, bonus: [{ stat: 'attackSpeed', value: 0.04 }], locked: true, equipped: false },
    { id: 'it-bg-3', itemKey: 'wpn.sword.ninelives', slot: 'weapon', weaponType: 'sword', rarity: 'legendary', level: 14, bonus: [{ stat: 'critChance', value: 0.06 }], locked: false, equipped: false },
    { id: 'it-bg-4', itemKey: 'wpn.hammer.cork', slot: 'weapon', weaponType: 'hammer', rarity: 'uncommon', level: 5, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-5', itemKey: 'wpn.hammer.thunder', slot: 'weapon', weaponType: 'hammer', rarity: 'epic', level: 11, bonus: [{ stat: 'bossDamage', value: 0.08 }], locked: false, equipped: false },
    { id: 'it-bg-6', itemKey: 'wpn.daggers.thorns', slot: 'weapon', weaponType: 'daggers', rarity: 'uncommon', level: 8, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-7', itemKey: 'wpn.daggers.fangs', slot: 'weapon', weaponType: 'daggers', rarity: 'rare', level: 9, bonus: [{ stat: 'critChance', value: 0.04 }], locked: false, equipped: false },
    { id: 'it-bg-8', itemKey: 'wpn.spear.pike', slot: 'weapon', weaponType: 'spear', rarity: 'uncommon', level: 4, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-9', itemKey: 'wpn.bow.feather', slot: 'weapon', weaponType: 'bow', rarity: 'rare', level: 8, bonus: [{ stat: 'attackSpeed', value: 0.05 }], locked: false, equipped: false },
    { id: 'it-bg-10', itemKey: 'wpn.staff.crystal', slot: 'weapon', weaponType: 'staff', rarity: 'rare', level: 7, bonus: [], locked: false, equipped: false },

    // 15 Armor pieces and accessories (mixed rarities)
    { id: 'it-bg-11', itemKey: 'arm.moon.helmet.epic', slot: 'helmet', rarity: 'epic', level: 10, bonus: [{ stat: 'dodge', value: 0.02 }], locked: false, equipped: false },
    { id: 'it-bg-12', itemKey: 'arm.cozy.helmet.uncommon', slot: 'helmet', rarity: 'uncommon', level: 4, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-13', itemKey: 'arm.ranger.helmet.rare', slot: 'helmet', rarity: 'rare', level: 11, bonus: [{ stat: 'dodge', value: 0.015 }], locked: false, equipped: false },
    { id: 'it-bg-14', itemKey: 'arm.cozy.armor.uncommon', slot: 'armor', rarity: 'uncommon', level: 6, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-15', itemKey: 'arm.ranger.armor.rare', slot: 'armor', rarity: 'rare', level: 9, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-16', itemKey: 'arm.cozy.gloves.common', slot: 'gloves', rarity: 'common', level: 3, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-17', itemKey: 'arm.cozy.gloves.epic', slot: 'gloves', rarity: 'epic', level: 12, bonus: [{ stat: 'bossDamage', value: 0.07 }], locked: true, equipped: false },
    { id: 'it-bg-18', itemKey: 'arm.ranger.gloves.rare', slot: 'gloves', rarity: 'rare', level: 8, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-19', itemKey: 'arm.cozy.boots.common', slot: 'boots', rarity: 'common', level: 2, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-20', itemKey: 'arm.moon.boots.legendary', slot: 'boots', rarity: 'legendary', level: 14, bonus: [{ stat: 'attackSpeed', value: 0.07 }, { stat: 'fishBonus', value: 0.12 }], locked: false, equipped: false },
    { id: 'it-bg-21', itemKey: 'acc.collar.bell.common', slot: 'collar', rarity: 'common', level: 4, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-22', itemKey: 'acc.earring.feather.common', slot: 'earring', rarity: 'common', level: 2, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-23', itemKey: 'acc.ring.paw.epic', slot: 'ring', rarity: 'epic', level: 9, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-24', itemKey: 'acc.ring.lucky.uncommon', slot: 'ring', rarity: 'uncommon', level: 4, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-25', itemKey: 'acc.charm.catnip.legendary', slot: 'charm', rarity: 'legendary', level: 20, bonus: [{ stat: 'hpRegen', value: 0.006 }], locked: true, equipped: false },

    // 4 Materials (matches 'materials' filter)
    { id: 'it-bg-26', itemKey: 'mat.fluffTuft', slot: 'material', rarity: 'common', level: 1, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-27', itemKey: 'mat.shinyButton', slot: 'material', rarity: 'uncommon', level: 2, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-28', itemKey: 'mat.catnipCrystal', slot: 'material', rarity: 'rare', level: 3, bonus: [], locked: false, equipped: false },
    { id: 'it-bg-29', itemKey: 'mat.starlightScale', slot: 'material', rarity: 'epic', level: 4, bonus: [], locked: false, equipped: false },

    // 1 Relic (matches 'relics' filter)
    { id: 'it-bg-30', itemKey: 'relic.moonPearl', slot: 'relic', rarity: 'legendary', level: 15, bonus: [], locked: true, equipped: false, relicId: '1042' },
  ];

  return {
    cat: { classId: 'warrior', level: 14, xp: 480, xpToNext: 1000 },
    progress: { chapter: 2, round: 3, kills: 4, killsPerRound: 10, gated: false, neededPower: 0 },
    currencies: { fish: 12480, yarn: 86, keys: 3 },
    materials: { fluffTuft: 12, shinyButton: 6, catnipCrystal: 2 },
    inventory,
    bagLimit: 200,
    equipped: {
      weapon: 'it-eq-1',
      helmet: 'it-eq-2',
      armor: 'it-eq-3',
      gloves: 'it-eq-4',
      boots: 'it-eq-5',
      collar: 'it-eq-6',
      earring: 'it-eq-7',
      ring: null,
      charm: null,
    },
    unlockedSlots: ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'collar', 'earring', 'ring', 'charm'],
    bosses: { chapters: [{ chapter: 1, cleared: true, wins: 1 }], cooldownUntil: null },
    forge: { blockedBy: null, forgedToday: false, pending: null, today: null },
    serverTime: Math.floor(Date.now() / 1000),
  };
}

export function createEmptyBagState() {
  const base = createRichBagState();
  return {
    ...base,
    inventory: base.inventory.filter((i) => i.equipped),
  };
}

const port = 5198;
let server, browser;

try {
  await requireFreePort(port);
  process.env.VITE_GAME_V2 = '1';
  process.env.VITE_SUPABASE_URL = '';
  process.env.VITE_SUPABASE_ANON_KEY = '';

  server = await createServer({
    root: webRoot,
    envDir: false,
    server: { port, strictPort: true },
  });
  await server.listen();

  const executablePath =
    process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });

  const viewports = [
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
  ];

  // 1. Capture Mockup Screens from reports/ui-redesign/index.html
  const mockupUrl = pathToFileURL(resolve(repoRoot, 'reports/ui-redesign/index.html')).href + '#bag';
  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();
    await page.goto(mockupUrl);
    await page.waitForTimeout(400);

    // Switch mockup width button
    const btn = page.locator(`#size button[data-w="${vp.width}"]`);
    if (await btn.count()) await btn.click();
    await page.waitForTimeout(400);

    const mockupPath = resolve(outDir, `mockup-bag-${vp.width}x${vp.height}.png`);
    await page.screenshot({ path: mockupPath });
    console.log(`Saved mockup: ${mockupPath}`);
    await context.close();
  }

  // 2. Capture Real App Bag Screens
  const storageKey = 'taskbar-hero:v2-demo:1';

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    });

    await page.goto(`http://localhost:${port}`);

    // Seed initial save with class warrior so rail mounts
    const save = await page.evaluate(async () => {
      const fixtures = await import('/src/api/mockV2Fixtures.ts');
      return fixtures.mockV2SaveJson('bossReadyStrong', { nowMs: Date.now(), classId: 'warrior' });
    });
    await page.evaluate(([k, s]) => localStorage.setItem(k, s), [storageKey, save]);
    await page.reload();

    await page.locator('[data-testid="rail"]').first().waitFor();

    // Click Bag in rail
    const navBag = page.locator('[data-testid="nav-bag"]');
    await navBag.click();
    await page.locator('[data-testid="bag-screen"]').first().waitFor();

    // Inject rich 30-item fixture
    const richState = createRichBagState();
    await page.evaluate((st) => {
      const loop = window.__g1Loop;
      if (loop) {
        loop.publish({ state: st });
      }
    }, richState);
    await page.waitForTimeout(500);

    // (a) Full Grid screenshot (All filter active, 30 items)
    const gridPath = resolve(outDir, `bag-grid-${vp.width}x${vp.height}.png`);
    await page.screenshot({ path: gridPath });
    console.log(`Saved full grid: ${gridPath}`);

    // (b) Item Selected screenshot (Click Silverclaw Saber, id: it-bg-1)
    const saberSlot = page.locator('.bag-card[aria-label*="Silverclaw Saber"]').first();
    await saberSlot.click();
    await page.waitForTimeout(400);
    const selectedPath = resolve(outDir, `bag-selected-${vp.width}x${vp.height}.png`);
    await page.screenshot({ path: selectedPath });
    console.log(`Saved item selected: ${selectedPath}`);

    // (c) Weapons Filter screenshot (Click "Weapons" filter chip)
    const weaponsChip = page.locator('.bag-filter-chip[data-filter="weapons"]');
    await weaponsChip.click();
    await page.waitForTimeout(400);
    const weaponsPath = resolve(outDir, `bag-filtered-weapons-${vp.width}x${vp.height}.png`);
    await page.screenshot({ path: weaponsPath });
    console.log(`Saved weapons filter: ${weaponsPath}`);

    // (d) Empty Bag screenshot
    const emptyState = createEmptyBagState();
    await page.evaluate((st) => {
      const loop = window.__g1Loop;
      if (loop) {
        loop.publish({ state: st });
      }
    }, emptyState);
    // Switch to All filter so all empty slots are visible
    const allChip = page.locator('.bag-filter-chip[data-filter="all"]');
    await allChip.click();
    await page.waitForTimeout(500);
    const emptyPath = resolve(outDir, `bag-empty-${vp.width}x${vp.height}.png`);
    await page.screenshot({ path: emptyPath });
    console.log(`Saved empty bag: ${emptyPath}`);

    await context.close();
  }

  console.log('All screenshots successfully captured in:', outDir);
} finally {
  await browser?.close();
  if (server?.close) await server.close();
  else if (server?.httpServer) await new Promise((ok) => server.httpServer.close(ok));
}
