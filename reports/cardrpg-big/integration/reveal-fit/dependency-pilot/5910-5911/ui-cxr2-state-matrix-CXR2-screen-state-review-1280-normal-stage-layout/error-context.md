# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/cxr2-state-matrix.spec.ts >> CXR2 screen/state review 1280 normal
- Location: e2e/ui/cxr2-state-matrix.spec.ts:39:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.evaluate: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation "Game menu" [ref=e4]:
    - generic [ref=e5]:
      - button "Taskbar Hero home" [ref=e6] [cursor=pointer]:
        - img "Portrait of Mochi the cat" [ref=e7]
      - tablist "Game panel tabs" [ref=e264]:
        - tab "Home" [selected] [ref=e265] [cursor=pointer]
        - tab "Bag" [ref=e270] [cursor=pointer]
        - tab "Map" [ref=e276] [cursor=pointer]
        - tab "Forge" [ref=e282] [cursor=pointer]
        - tab "Market" [ref=e287] [cursor=pointer]
        - tab "Hero" [ref=e293] [cursor=pointer]
        - tab "Help" [ref=e300] [cursor=pointer]
    - generic "Avalanche Fuji Testnet" [ref=e307]: Fuji
  - generic [ref=e310]:
    - banner [ref=e311]:
      - region "Cat status" [ref=e312]:
        - generic [ref=e313]:
          - list "Currencies and keys" [ref=e314]:
            - listitem "Fish 400" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: "400"
            - listitem "Yarn 70" [ref=e324]:
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: "70"
            - listitem "Cat Keys 0 of 5" [ref=e332]:
              - generic [aria-hidden] [ref=e335]: Cat Keys
              - generic [aria-hidden] [ref=e336]: 0/5
          - generic [ref=e338]:
            - generic [ref=e339]: Lv 1
            - progressbar "Experience" [ref=e340]
            - generic [aria-hidden] [ref=e341]: 0 / 60 XP
          - group "Chapter 1 Living Room, round 1 of 10, 0 of 6 monsters" [ref=e343]:
            - generic [aria-hidden] [ref=e344]: Chapter 1 · Round 1 · 0/6
          - generic [ref=e345]: Power 44
      - generic [ref=e348]:
        - status [ref=e350]:
          - generic [aria-hidden] [ref=e351]: ●
          - generic [ref=e352]: Live
        - group "Wallet" [ref=e354]:
          - link "Get a browser wallet" [ref=e355] [cursor=pointer]:
            - /url: https://core.app
    - generic [ref=e356]:
      - heading "Taskbar Hero" [level=1] [ref=e357]
      - generic [ref=e358]: Candidate build, not live.
      - generic "Goal ladder" [ref=e359]:
        - generic [ref=e360]:
          - generic [ref=e361]: Soon
          - text: 60 foes to the chapter boss
        - generic [ref=e362]:
          - generic [ref=e363]: Later
          - text: Unlock Kitchen
      - generic [ref=e365]:
        - generic [aria-hidden] [ref=e366]: Next
        - button "Clear round 1 · 6 foes left" [ref=e367] [cursor=pointer]
    - main [ref=e368]:
      - tabpanel "Home" [ref=e370]:
        - generic [ref=e371]:
          - generic [ref=e372]:
            - region "Game stage" [ref=e373]:
              - text: CAT CAFÉ QUEST / EVENING PATROL
              - generic [ref=e374]:
                - img "Cat exploring the chapter" [ref=e375]
                - generic "Stage progress":
                  - generic: Chapter 1 · Round 1 / 10
                  - generic "0 / 6 kills; last kill is elite":
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ◆
                    - generic: 0 / 6
                - status: Round start
                - generic: Fight preview · rewards on claim
            - region "Event log" [ref=e377]:
              - generic [ref=e378]: Battle Log
              - generic [ref=e381]:
                - generic [ref=e382]:
                  - generic [ref=e383]: ›
                  - generic [ref=e384]: Mochi entered Chapter 1 (Round 1).
                - generic [ref=e385]:
                  - generic [ref=e386]: ›
                  - generic [ref=e387]: "Auto-battle active: exploring and defeating monsters."
          - region "Home details" [ref=e388]:
            - generic [ref=e389]:
              - generic [ref=e390]:
                - img "Mochi, a tabby cat with a blue scarf" [ref=e392]
                - generic [ref=e394]:
                  - heading "Mochi" [level=2] [ref=e395]
                  - generic [ref=e396]:
                    - generic [ref=e397]: Warrior
                    - generic [ref=e398]: Lv. 1
                  - generic [ref=e399]:
                    - text: "Power:"
                    - strong [ref=e400]: "44"
              - generic [ref=e401]:
                - heading "Core Stats" [level=3] [ref=e402]
                - generic [ref=e403]:
                  - generic [ref=e404]:
                    - term [ref=e405]: HP
                    - definition [ref=e406]: "100"
                  - generic [ref=e407]:
                    - term [ref=e408]: ATK
                    - definition [ref=e409]: "18"
                  - generic [ref=e410]:
                    - term [ref=e411]: Crit chance
                    - definition [ref=e412]: 5%
                  - generic [ref=e413]:
                    - term [ref=e414]: DEF
                    - definition [ref=e415]: "5"
                  - generic [ref=e416]:
                    - term [ref=e417]: Speed
                    - definition [ref=e418]: 1.00/s
            - generic [ref=e419]:
              - generic [ref=e420]:
                - heading "Next Goal" [level=2] [ref=e421]
                - generic [ref=e422]: Ch. 1 · Round 1
              - generic [ref=e423]:
                - generic [ref=e424]:
                  - generic [ref=e425]:
                    - generic [ref=e426]: Monster Hunt
                    - generic [ref=e427]: 0 / 6
                  - progressbar "Progress through this round" [ref=e428]
                - paragraph [ref=e429]: Defeat 6 more monsters to reach the next stage.
                - generic [ref=e430]:
                  - generic [ref=e431]:
                    - generic [ref=e432]: Now
                    - text: Clear round 1 · 6 foes left
                  - generic [ref=e433]:
                    - generic [ref=e434]: Soon
                    - text: 60 foes to the chapter boss
                  - generic [ref=e435]:
                    - generic [ref=e436]: Later
                    - text: Unlock Kitchen
                - button "Go to map" [ref=e437] [cursor=pointer]
            - generic [ref=e438]:
              - heading "Recent loot" [level=2] [ref=e440]
              - region "Recent loot details" [ref=e441]:
                - generic [ref=e442]:
                  - generic [ref=e443]:
                    - generic [ref=e449]: "400"
                    - generic [ref=e450]: Fish
                  - generic [ref=e451]:
                    - generic [ref=e456]: "70"
                    - generic [ref=e457]: Yarn
                  - generic [ref=e458]:
                    - generic [ref=e461]: "0"
                    - generic [ref=e462]: Keys
                - generic [ref=e463]:
                  - heading "Latest Drops" [level=3] [ref=e464]
                  - list [ref=e465]:
                    - listitem [ref=e466]:
                      - generic [ref=e469]:
                        - generic [ref=e470]: Twig Sword
                        - generic [ref=e471]: Common Lv.1
                    - listitem [ref=e472]:
                      - generic [ref=e475]:
                        - generic [ref=e476]: Twig Sword
                        - generic [ref=e477]: Common Lv.1
                    - listitem [ref=e478]:
                      - generic [ref=e481]:
                        - generic [ref=e482]: Twig Sword
                        - generic [ref=e483]: Common Lv.1
                    - listitem [ref=e484]:
                      - generic [ref=e487]:
                        - generic [ref=e488]: Twig Sword
                        - generic [ref=e489]: Common Lv.1
                    - listitem [ref=e490]:
                      - generic [ref=e493]:
                        - generic [ref=e494]: Twig Sword
                        - generic [ref=e495]: Common Lv.1
```

# Test source

```ts
  1  | import { test, expect, type Page } from '../support/test';
  2  | import { v2 } from '@taskbar-hero/game-rules';
  3  | import { mockV2Save } from '../../src/api/mockV2Fixtures';
  4  | import { readFileSync, mkdirSync } from 'node:fs';
  5  | import { resolve } from 'node:path';
  6  | 
  7  | const storageKey = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
  8  | const screens = ['Home', 'Bag', 'Map', 'Forge', 'Market', 'Hero', 'Help'] as const;
  9  | const scenarios = ['normal', 'zero-empty', 'maximum-long', 'full-bag', 'offline'] as const;
  10 | 
  11 | async function inspect(page: Page, label: string) {
  12 |   expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight })), label).toEqual({ x: false, y: false });
  13 |   const hud = page.getByTestId('hud');
  14 |   const clipped = await hud.evaluate(root => [...root.querySelectorAll<HTMLElement>('*')]
  15 |     .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' && node.scrollWidth > node.clientWidth + 1)
  16 |     .map(node => node.getAttribute('data-testid') || node.className));
  17 |   expect(clipped, label + ' HUD text').toEqual([]);
  18 |   const vertical = await hud.locator('.hud-chip-val').evaluateAll(nodes => nodes.filter(node => {
  19 |     const box = node.getBoundingClientRect(), chip = node.closest('.hud-chip')?.getBoundingClientRect();
  20 |     return box.height > 0 && chip && (box.top < chip.top - 1 || box.bottom > chip.bottom + 1);
  21 |   }).map(node => node.textContent));
  22 |   expect(vertical, label + ' HUD numbers must stay inside their chip').toEqual([]);
  23 | 
  24 |   if (await page.getByTestId('home-dashboard').isVisible()) {
  25 |     const currencyClip = await page.locator('.home-loot-currencies').evaluateAll(nodes => nodes.some(node => node.scrollWidth > node.clientWidth + 1));
  26 |     expect(currencyClip, label + ' recent loot currencies').toBe(false);
  27 |   }
  28 |   for (const control of await page.locator('button:visible, a[href]:visible, input:visible, select:visible').all()) {
  29 |     await expect(control, label).toHaveAccessibleName(/\S/);
  30 |   }
  31 |   if (process.env.CXR2_SCREENSHOTS) {
  32 |     mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
  33 |     await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, label + '.png') });
  34 |   }
  35 | }
  36 | 
  37 | for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  38 |   for (const scenario of scenarios) {
  39 |     test(`CXR2 screen/state review ${size.width} ${scenario}`, async ({ page, context }) => {
  40 |       await page.setViewportSize(size); await page.emulateMedia({ reducedMotion: 'reduce' });
  41 |       const errors: string[] = [];
  42 |       page.on('pageerror', error => errors.push(error.message));
  43 |       page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  44 |       const now = Date.now();
  45 |       const save = mockV2Save(scenario === 'maximum-long' ? 'bossReadyStrong' : 'forgeRich', { nowMs: now, classId: 'warrior' });
  46 |       if (scenario === 'zero-empty') { save.state.items = []; save.state.stacks = { fish: 0 }; }
  47 |       if (scenario === 'full-bag') {
  48 |         while (save.state.items.length < v2.V2_CONFIG.bag.limit) save.state.items.push({ ...save.state.items[1]!, id: `cxr2-full-${save.state.items.length}`, equipped: false });
  49 |       }
  50 |       if (scenario === 'maximum-long') {
  51 |         // Maximum representable Fish and registry-capped materials, not new economy limits.
  52 |         save.state.stacks = { fish: Number.MAX_SAFE_INTEGER, ...Object.fromEntries(v2.MATERIALS.map(material => [material.id, material.maxStack])) };
  53 |         const longest = [...v2.ITEMS].sort((a, b) => b.name.length - a.name.length)[0]!;
  54 |         save.state.items.push({ id: 'cxr2-longest', itemId: longest.id, itemKey: longest.id, slot: longest.slot, rarity: longest.rarity,
  55 |           ...(longest.weaponType ? { weaponType: longest.weaponType } : {}), level: 1, bonus: [], bonusLines: [], equipped: false, locked: false, source: 'drop' });
  56 |       }
  57 |       await page.clock.install({ time: new Date(0) });
  58 |       await page.clock.pauseAt(new Date(now));
  59 |       await page.addInitScript(({ key, value }) => { localStorage.setItem(key, value); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, value: JSON.stringify(save) });
  60 |       await page.goto('/#home');
  61 |       await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();
> 62 |       await page.evaluate(() => document.fonts.ready);
     |                  ^ Error: page.evaluate: Test timeout of 30000ms exceeded.
  63 |       await page.clock.runFor(500);
  64 |       if (scenario === 'maximum-long') await expect(page.getByTestId('hud-gold')).toHaveAttribute('aria-label', 'Fish 9,007,199,254,740,991');
  65 |       if (scenario === 'zero-empty') await expect(page.getByTestId('hud-gold')).toHaveAttribute('aria-label', 'Fish 0');
  66 |       if (scenario === 'offline') { await context.setOffline(true); await page.evaluate(() => dispatchEvent(new Event('offline'))); }
  67 |       for (const screen of screens) {
  68 |         await page.getByRole('tab', { name: screen, exact: true }).click();
  69 |         await expect(page.getByRole('tab', { name: screen, exact: true })).toHaveAttribute('aria-selected', 'true');
  70 |         if (scenario === 'offline') await expect(page.locator('header [data-sync-status="offline"]')).toBeVisible();
  71 |         if (scenario === 'full-bag' && screen === 'Bag') {
  72 |           await expect(page.getByTestId('bag-count')).toHaveText('Bag 200 / 200');
  73 |           await expect(page.getByRole('status').filter({ hasText: 'Bag full' })).toBeVisible();
  74 |           await expect(page.locator('.bag-slot.empty')).toHaveCount(0);
  75 |         }
  76 |         if (scenario === 'zero-empty' && screen === 'Bag') await expect(page.locator('.bag-slot.empty')).toHaveCount(200);
  77 |         if (scenario === 'full-bag' && screen === 'Forge') await expect(page.getByTestId('craft-btn')).toBeDisabled();
  78 |         await inspect(page, `${screen.toLowerCase()}-${scenario}-${size.width}`);
  79 |         if (screen === 'Forge') {
  80 |           for (const sub of ['salvage', 'relic']) { await page.getByTestId('tab-' + sub).click(); await inspect(page, `forge-${sub}-${scenario}-${size.width}`); }
  81 |         }
  82 |       }
  83 |       expect(errors).toEqual([]);
  84 |     });
  85 |   }
  86 | }
  87 | 
```