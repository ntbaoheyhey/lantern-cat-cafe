import { chromium } from '/Users/bao/taskbar-hero/apps/web/node_modules/@playwright/test/index.mjs';

const KEY = 'taskbar-hero:v2-demo:1';
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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: BASE_SAVE });

  await page.goto('http://localhost:4174');
  const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
  await canvas.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Canvas is visible! Canvas count:', await canvas.count());
  
  // Inspect actors
  const actorRes = await canvas.evaluate(c => {
    const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let catPixels = 0, monsterPixels = 0;
    const midX = c.width / 2;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (pixels[(y * c.width + x) * 4 + 3] > 0) {
        if (x < midX) catPixels++; else monsterPixels++;
      }
    }
    return { width: c.width, height: c.height, catPixels, monsterPixels };
  });
  console.log('Witch Actor result:', actorRes);
  
  await browser.close();
}

main().catch(console.error);
