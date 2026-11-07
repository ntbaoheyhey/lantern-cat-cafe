# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/cxu4-hero-help.spec.ts >> CXU4 Help keyboard search, selection and offline banner 1280
- Location: e2e/ui/cxu4-hero-help.spec.ts:92:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.screenshot: Test timeout of 30000ms exceeded.
Call log:
  - taking page screenshot
  - waiting for fonts to load...
  - fonts loaded

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation "Game menu" [ref=e4]:
    - generic [ref=e5]:
      - button "Taskbar Hero home" [ref=e6] [cursor=pointer]:
        - img "Portrait of Mochi the cat" [ref=e7]
      - tablist "Game panel tabs" [ref=e264]:
        - tab "Home" [ref=e265] [cursor=pointer]
        - tab "Bag" [ref=e270] [cursor=pointer]
        - tab "Map" [ref=e276] [cursor=pointer]
        - tab "Forge" [ref=e282] [cursor=pointer]
        - tab "Market" [ref=e287] [cursor=pointer]
        - tab "Hero" [ref=e293] [cursor=pointer]
        - tab "Help" [selected] [ref=e300] [cursor=pointer]
    - generic "Avalanche Fuji Testnet" [ref=e307]: Fuji
  - generic [ref=e310]:
    - banner [ref=e311]:
      - region "Cat status" [ref=e312]:
        - generic [ref=e313]:
          - list "Currencies and keys" [ref=e314]:
            - listitem "Fish 150" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: "150"
            - listitem "Yarn 36" [ref=e324]:
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: "36"
            - listitem "Cat Keys 2 of 5" [ref=e332]:
              - generic [aria-hidden] [ref=e335]: Cat Keys
              - generic [aria-hidden] [ref=e336]: 2/5
          - generic [ref=e338]:
            - generic [ref=e339]: Lv 12
            - progressbar "Experience" [ref=e340]
            - generic [aria-hidden] [ref=e342]: 189 / 209 XP
          - group "Chapter 2 Kitchen, round 3 of 10, 9 of 10 monsters" [ref=e344]:
            - generic [aria-hidden] [ref=e345]: Chapter 2 · Round 3 · 9/10
          - generic [ref=e346]: Power 118
      - generic [ref=e349]:
        - status [ref=e351]:
          - generic [aria-hidden] [ref=e352]: ●
          - generic [ref=e353]: Live
        - group "Wallet" [ref=e355]:
          - link "Get a browser wallet" [ref=e356] [cursor=pointer]:
            - /url: https://core.app
    - generic [ref=e357]:
      - heading "Taskbar Hero" [level=1] [ref=e358]
      - generic [ref=e359]: Candidate build, not live.
      - generic "Goal ladder" [ref=e360]:
        - generic [ref=e361]:
          - generic [ref=e362]: Soon
          - text: 71 foes to the chapter boss
        - generic [ref=e363]:
          - generic [ref=e364]: Later
          - text: Unlock Bathroom
      - generic [ref=e366]:
        - generic [aria-hidden] [ref=e367]: Next
        - button "Compare 6 gear upgrades" [ref=e368] [cursor=pointer]
    - main [ref=e369]:
      - generic [ref=e370]:
        - text: CAT CAFÉ QUEST / EVENING PATROL ✦ ✦
        - tabpanel "Help" [ref=e371]:
          - generic [ref=e372]:
            - heading "Help" [level=2] [ref=e373]
            - generic [ref=e375]:
              - tablist "Help sections" [ref=e376]:
                - tab "Guide" [selected] [ref=e377] [cursor=pointer]
                - tab "On-chain proof" [ref=e378] [cursor=pointer]
                - tab "Catalog preview" [ref=e379] [cursor=pointer]
              - tabpanel "Guide" [ref=e380]:
                - generic [ref=e381]:
                  - generic [ref=e382]:
                    - generic [ref=e383]: Cat Café Guide
                    - paragraph [ref=e384]: Learn how Mochi explores, levels up, and finds treasures while you work.
                  - generic [ref=e385]:
                    - complementary "Help topics" [ref=e386]:
                      - generic [ref=e387]: Search help
                      - searchbox "Search help" [ref=e388]
                      - status [ref=e389]: 6 topics
                      - button "Getting started" [ref=e390] [cursor=pointer]:
                        - text: Getting started
                        - generic [aria-hidden] [ref=e391]: ›
                      - button "Classes" [ref=e392] [cursor=pointer]:
                        - text: Classes
                        - generic [aria-hidden] [ref=e393]: ›
                      - button "Chapters and rounds" [ref=e394] [cursor=pointer]:
                        - text: Chapters and rounds
                        - generic [aria-hidden] [ref=e395]: ›
                      - button "Cat Keys and bosses" [ref=e396] [cursor=pointer]:
                        - text: Cat Keys and bosses
                        - generic [aria-hidden] [ref=e397]: ›
                      - button "Forge" [active] [ref=e398] [cursor=pointer]:
                        - text: Forge
                        - generic [aria-hidden] [ref=e399]: ›
                      - button "Drop rates" [ref=e400] [cursor=pointer]:
                        - text: Drop rates
                        - generic [aria-hidden] [ref=e401]: ›
                    - generic [ref=e402]:
                      - generic [ref=e403]:
                        - heading "Forge" [level=3] [ref=e404]
                        - paragraph [ref=e405]: "Craft gear with Fish, Yarn and materials (guaranteed rarity per recipe: Common, Uncommon, Rare, Epic, Legendary). Salvage returns part of the cost (always less than it cost). Lock items to protect them in your bag (holds up to 200 items)."
                        - paragraph [ref=e406]: "The Relic: 30 Yarn + 1 Moon Pearl, 1 per day, shared with v1."
                      - button "Start Exploring" [ref=e408] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test, type Page } from '../support/test';
  2   | import fs from 'node:fs';
  3   | import path from 'node:path';
  4   | import { crc32, deflateSync, inflateSync } from 'node:zlib';
  5   | import { mockV2Save } from '../../src/api/mockV2Fixtures';
  6   | import { sampleStateV2 } from '../../src/layout/sampleState';
  7   | const storageKey = fs.readFileSync(path.resolve('src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
  8   | const sizes = [{ width: 1280, height: 720 }, { width: 1600, height: 900 }];
  9   | 
  10  | test.beforeEach(async ({ page }) => {
  11  |   const sample = sampleStateV2(), save = mockV2Save('midGame', { nowMs: Date.now(), classId: 'warrior' });
  12  |   Object.assign(save.state, { classId: sample.cat.classId, level: sample.cat.level, xp: sample.cat.xp, ...sample.progress,
  13  |     stacks: { ...sample.materials, fish: sample.currencies.fish, yarn: sample.currencies.yarn, catKey: sample.currencies.keys },
  14  |     items: sample.inventory.map(item => ({ ...item, itemId: item.itemKey, bonusLines: item.bonus, source: 'drop' as const })) });
  15  |   await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
  16  | });
  17  | async function layout(page: Page) {
  18  |   expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false });
  19  |   const clipped = await page.locator('.hero-sheet:visible button, .help-columns:visible button, .help-columns:visible input').evaluateAll(elements => elements.filter(element => {
  20  |     const rect = element.getBoundingClientRect();
  21  |     if (rect.x < 0 || rect.y < 0 || rect.right > innerWidth || rect.bottom > innerHeight) return true;
  22  |     for (let parent = element.parentElement; parent; parent = parent.parentElement) {
  23  |       const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
  24  |       if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.y < bounds.y - 1 || rect.bottom > bounds.bottom + 1)) return true;
  25  |       if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.x < bounds.x - 1 || rect.right > bounds.right + 1)) return true;
  26  |     }
  27  |     return false;
  28  |   }).map(element => element.textContent));
  29  |   expect(clipped).toEqual([]);
  30  | }
  31  | async function screenshot(page: Page, name: string) {
  32  |   // Recompress IDAT losslessly: preserve the exact pixels and the 200 KiB evidence gate.
> 33  |   const raw = await page.screenshot(), chunks: Buffer[] = [], data: Buffer[] = [];
      |                          ^ Error: page.screenshot: Test timeout of 30000ms exceeded.
  34  |   for (let offset = 8; offset < raw.length;) {
  35  |     const length = raw.readUInt32BE(offset), chunk = raw.subarray(offset, offset + length + 12);
  36  |     if (chunk.toString('ascii', 4, 8) === 'IDAT') data.push(chunk.subarray(8, -4)); else chunks.push(chunk);
  37  |     offset += length + 12;
  38  |   }
  39  |   const compressed = deflateSync(inflateSync(Buffer.concat(data)), { level: 9 });
  40  |   const idat = Buffer.alloc(compressed.length + 12); idat.writeUInt32BE(compressed.length);
  41  |   idat.write('IDAT', 4); compressed.copy(idat, 8); idat.writeUInt32BE(crc32(idat.subarray(4, -4)), idat.length - 4);
  42  |   const end = chunks.pop()!;
  43  |   const bytes = Buffer.concat([raw.subarray(0, 8), ...chunks, idat, end]); expect(bytes.byteLength).toBeLessThan(200 * 1024);
  44  |   if (process.env.SCREENSHOTS === '1') { const dir = path.resolve('../../reports/scorecard/cxu4'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${name}.png`), bytes); }
  45  | }
  46  | for (const size of sizes) {
  47  |   test(`CXU4 Hero equipment, power and class confirmation ${size.width}`, async ({ page }) => {
  48  |     await page.setViewportSize(size); await page.emulateMedia({ reducedMotion: 'reduce' });
  49  |     const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  50  |     await page.goto('/#hero');
  51  |     await expect(page.getByRole('tab', { name: 'Hero', exact: true })).toHaveAttribute('aria-selected', 'true');
  52  |     const hero = page.getByRole('region', { name: 'Character' }); await expect(hero).toBeVisible();
  53  |     await expect(hero.getByRole('group', { name: 'Gear slots' }).getByRole('button')).toHaveCount(9);
  54  |     const sum = await hero.locator('[data-testid^="power-"]').allTextContents();
  55  |     await expect(page.getByTestId('character-power')).toHaveText(String(sum.reduce((a, b) => a + Number(b), 0)));
  56  |     await layout(page); await screenshot(page, `hero-${size.width}`);
  57  |     await page.getByRole('tab', { name: 'Bag', exact: true }).click();
  58  |     await page.getByRole('button', { name: /^Silverclaw Saber, / }).click();
  59  |     await page.getByRole('region', { name: 'Item detail' }).getByRole('button', { name: 'Equip', exact: true }).click();
  60  |     await page.getByRole('tab', { name: 'Hero', exact: true }).click();
  61  |     await expect(hero.getByRole('button', { name: 'Weapon: Silverclaw Saber, Rare' })).toBeVisible();
  62  |     const change = page.getByRole('button', { name: 'Change class', exact: true }); await change.focus(); await page.keyboard.press('Enter');
  63  |     await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  64  |     const dialog = page.getByRole('dialog', { name: 'Change class' }); await expect(dialog).toHaveAttribute('aria-modal', 'true');
  65  |     await page.keyboard.press('Shift+Tab'); await expect(page.getByLabel('Cat class')).toBeFocused();
  66  |     await page.keyboard.press('Shift+Tab'); await expect(page.getByLabel('Close Change class')).toBeFocused();
  67  |     await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  68  |     await screenshot(page, `modal-${size.width}`);
  69  |     await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(change).toBeFocused();
  70  |     await page.keyboard.press('Enter'); await page.getByLabel('Cat class').selectOption('archer');
  71  |     const release = await page.evaluateHandle(() => {
  72  |       const usable: boolean[] = [];
  73  |       const observer = new MutationObserver(() => {
  74  |         if (!document.querySelector('[role="dialog"]')) {
  75  |           const root = document.getElementById('root')!;
  76  |           usable.push(!root.hasAttribute('inert') && root.getAttribute('aria-hidden') !== 'true');
  77  |         }
  78  |       });
  79  |       observer.observe(document.body, { childList: true, subtree: true });
  80  |       return { usable, observer };
  81  |     });
  82  |     await page.getByRole('button', { name: 'Confirm class', exact: true }).click(); await expect(dialog).toHaveCount(0);
  83  |     const released = await release.evaluate(({ usable, observer }) => { observer.disconnect(); return usable; });
  84  |     await release.dispose();
  85  |     expect(released.length).toBeGreaterThan(0);
  86  |     expect(released).not.toContain(false);
  87  |     await expect(hero.locator('.character-meta')).toContainText('Archer');
  88  |     await expect(page.getByRole('status').filter({ hasText: 'Class changed to Archer.' })).toBeVisible();
  89  |     await expect(change).toBeFocused();
  90  |     expect(errors).toEqual([]);
  91  |   });
  92  |   test(`CXU4 Help keyboard search, selection and offline banner ${size.width}`, async ({ page, context }) => {
  93  |     await page.setViewportSize(size); await page.emulateMedia({ reducedMotion: 'reduce' });
  94  |     await page.goto('/#help');
  95  |     await expect(page.getByRole('tab', { name: 'Help', exact: true })).toHaveAttribute('aria-selected', 'true');
  96  |     const help = page.getByRole('tabpanel', { name: 'Help', exact: true });
  97  |     await expect(help.getByRole('heading', { level: 3 })).toHaveText('Getting started');
  98  |     const search = page.getByRole('searchbox', { name: 'Search help' }); await search.focus(); await page.keyboard.type('catnap');
  99  |     await expect(help.getByRole('heading', { level: 3 })).toHaveText('Cat Keys and bosses');
  100 |     await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Cat Keys and bosses' })).toBeFocused(); await page.keyboard.press('Enter');
  101 |     await search.fill('30 Yarn'); await expect(help.getByRole('heading', { level: 3 })).toHaveText('Forge');
  102 |     await search.fill('Warrior: sword'); await expect(help.getByRole('heading', { level: 3 })).toHaveText('Classes');
  103 |     await search.fill(''); await page.getByRole('button', { name: 'Forge', exact: true }).focus(); await page.keyboard.press('Enter');
  104 |     await expect(help.getByRole('heading', { level: 3 })).toHaveText('Forge'); await layout(page); await screenshot(page, `help-${size.width}`);
  105 |     await search.fill('unfindable-qxyz'); await expect(page.getByRole('heading', { name: 'No matching topics' })).toBeVisible();
  106 |     await page.getByRole('button', { name: 'Clear search' }).click();
  107 |     await expect(help.getByRole('heading', { level: 3 })).toHaveText('Forge');
  108 |     await help.getByRole('button', { name: 'Start Exploring', exact: true }).click();
  109 |     await expect(page.getByTestId('home-dashboard')).toBeVisible();
  110 |     await page.getByRole('tab', { name: 'Hero', exact: true }).click(); await context.setOffline(true); await page.evaluate(() => dispatchEvent(new Event('offline')));
  111 |     const notice = page.getByRole('region', { name: 'Character' }).getByTestId('action-notice');
  112 |     await expect(notice).toBeVisible(); await expect(notice).toHaveAttribute('data-tone', 'offline');
  113 |     await expect(notice).toHaveText('You are offline. Your cat keeps working; we will sync when you are back.');
  114 |     await context.setOffline(false); await page.evaluate(() => dispatchEvent(new Event('online'))); await expect(notice).toHaveCount(0);
  115 |   });
  116 | }
  117 | 
```