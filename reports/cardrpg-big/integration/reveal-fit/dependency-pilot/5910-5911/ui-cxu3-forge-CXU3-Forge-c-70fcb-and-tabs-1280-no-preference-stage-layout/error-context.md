# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/cxu3-forge.spec.ts >> CXU3 Forge costs, confirmation, one-shot reveal and tabs 1280 no-preference
- Location: e2e/ui/cxu3-forge.spec.ts:29:5

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
        - tab "Home" [ref=e265] [cursor=pointer]
        - tab "Bag" [ref=e270] [cursor=pointer]
        - tab "Map" [ref=e276] [cursor=pointer]
        - tab "Forge" [selected] [ref=e282] [cursor=pointer]
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
      - generic [ref=e369]:
        - text: CAT CAFÉ QUEST / EVENING PATROL
        - tabpanel "Forge" [ref=e370]:
          - generic [ref=e371]:
            - heading "Forge" [level=2] [ref=e372]
            - generic [ref=e374]:
              - paragraph [ref=e376]: Craft custom gear, salvage materials, or forge daily Relics.
              - tablist "Forge sections" [ref=e377]:
                - tab "Craft" [active] [selected] [ref=e378] [cursor=pointer]
                - tab "Salvage" [ref=e379] [cursor=pointer]
                - tab "Relic" [ref=e380] [cursor=pointer]
              - tabpanel "Craft" [ref=e381]:
                - generic [ref=e383]:
                  - generic [ref=e385]:
                    - paragraph [ref=e386]: 1 · Pick gear
                    - generic [ref=e387]:
                      - generic [ref=e388]: Choose Slot
                      - group "Choose Slot" [ref=e389]:
                        - button "Weapon (Sword) Weapon (Sword)" [pressed] [ref=e390] [cursor=pointer]:
                          - img "Weapon (Sword)" [ref=e391]
                          - generic [ref=e392]: Weapon (Sword)
                        - button "Helmet Helmet" [ref=e393] [cursor=pointer]:
                          - img "Helmet" [ref=e394]
                          - generic [ref=e395]: Helmet
                        - button "Armor Armor" [ref=e396] [cursor=pointer]:
                          - img "Armor" [ref=e397]
                          - generic [ref=e398]: Armor
                        - button "Gloves Gloves" [ref=e399] [cursor=pointer]:
                          - img "Gloves" [ref=e400]
                          - generic [ref=e401]: Gloves
                        - button "Boots Boots" [ref=e402] [cursor=pointer]:
                          - img "Boots" [ref=e403]
                          - generic [ref=e404]: Boots
                    - generic [ref=e405]:
                      - generic [ref=e406]: Choose Rarity
                      - group "Choose Rarity" [ref=e407]:
                        - button [pressed] [ref=e408] [cursor=pointer]:
                          - img "Common" [ref=e409]
                          - generic [ref=e414]:
                            - generic [aria-hidden] [ref=e415]: ●
                            - text: Common
                        - button [ref=e416] [cursor=pointer]:
                          - img "Uncommon" [ref=e417]
                          - generic [ref=e422]:
                            - generic [aria-hidden] [ref=e423]: ▲
                            - text: Uncommon
                        - button [ref=e424] [cursor=pointer]:
                          - img "Rare" [ref=e425]
                          - generic [ref=e430]:
                            - generic [aria-hidden] [ref=e431]: ◆
                            - text: Rare
                        - button [ref=e432] [cursor=pointer]:
                          - img "Epic" [ref=e433]
                          - generic [ref=e439]:
                            - generic [aria-hidden] [ref=e440]: ✦
                            - text: Epic
                        - button [ref=e441] [cursor=pointer]:
                          - img "Legendary" [ref=e442]
                          - generic [ref=e449]:
                            - generic [aria-hidden] [ref=e450]: ✷
                            - text: Legendary
                  - generic [ref=e451]:
                    - img "Weapon (Sword)" [ref=e455]
                    - generic [ref=e456]:
                      - heading "Common Weapon (Sword)" [level=3] [ref=e457]
                      - generic [ref=e458]: Recipe fixes the rarity; no bonus roll.
                      - paragraph [ref=e459]: "Guaranteed Common • Bonus lines: 0 • Max Lv. 10"
                    - button "Craft Common Weapon (Sword)" [ref=e461] [cursor=pointer]
                  - generic [ref=e462]:
                    - generic [ref=e463]:
                      - heading "Recipe Cost & Balance" [level=4] [ref=e464]
                      - list "Required materials" [ref=e465]:
                        - listitem [ref=e466]:
                          - generic [ref=e467]:
                            - img "Yarn" [ref=e468]
                            - generic [ref=e472]: Yarn
                          - generic [ref=e473]: 70 / 10
                        - listitem [ref=e474]:
                          - generic [ref=e475]:
                            - img "Fluff Tuft" [ref=e476]
                            - generic [ref=e482]: Fluff Tuft
                          - generic [ref=e483]: 24 / 4
                        - listitem [ref=e484]:
                          - generic [ref=e485]:
                            - img "Fish" [ref=e486]
                            - generic [ref=e491]: Fish
                          - generic [ref=e492]: 400 / 50
                    - generic [ref=e493]:
                      - heading "Chances" [level=4] [ref=e494]
                      - table "Crafting chances" [ref=e495]:
                        - rowgroup [ref=e496]:
                          - row [ref=e497]:
                            - columnheader "Outcome" [ref=e498]
                            - columnheader "%" [ref=e499]
                        - rowgroup [ref=e500]:
                          - row [ref=e501]:
                            - cell "Common gear" [ref=e502]
                            - cell "100" [ref=e503]
                      - paragraph [ref=e504]: Bonus lines, when present, scale with item level.
```

# Test source

```ts
  1   | import { expect, test, type Page } from '../support/test';
  2   | import { mockV2Save } from '../../src/api/mockV2Fixtures';
  3   | import fs from 'node:fs';
  4   | import path from 'node:path';
  5   | const storageKey = fs.readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
  6   | 
  7   | async function geometry(page: Page) {
  8   |   expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false });
  9   |   const clipped = await page.locator('.forge-panel button:visible, .forge-panel input:visible').evaluateAll(elements => elements.filter(element => {
  10  |     const rect = element.getBoundingClientRect();
  11  |     if (rect.x < 0 || rect.y < 0 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) return true;
  12  |     for (let parent = element.parentElement; parent; parent = parent.parentElement) {
  13  |       const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
  14  |       if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.y < bounds.y - 1 || rect.bottom > bounds.bottom + 1)) return true;
  15  |       if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.x < bounds.x - 1 || rect.right > bounds.right + 1)) return true;
  16  |     }
  17  |     return false;
  18  |   }).map(element => element.textContent || element.getAttribute('aria-label')));
  19  |   expect(clipped).toEqual([]);
  20  | }
  21  | async function screenshot(page: Page, name: string) {
  22  |   if (!process.env.CXU3_SCREENSHOTS) return;
  23  |   await page.locator('.forge-panel').evaluate(root => Promise.all(root.getAnimations({ subtree: true }).filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
  24  |   const dir = path.resolve(process.env.CXU3_SCREENSHOTS); fs.mkdirSync(dir, { recursive: true });
  25  |   await page.screenshot({ path: path.join(dir, name + '.png') });
  26  | }
  27  | for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  28  |   for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  29  |     test(`CXU3 Forge costs, confirmation, one-shot reveal and tabs ${size.width} ${reducedMotion}`, async ({ page }) => {
  30  |       const errors: string[] = [];
  31  |       page.on('pageerror', error => errors.push(error.message));
  32  |       page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  33  |       await page.setViewportSize(size); await page.emulateMedia({ reducedMotion });
  34  |       const save = mockV2Save('forgeRich', { nowMs: Date.now(), classId: 'warrior' });
  35  |       await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
  36  |       await page.goto('/'); await page.getByRole('tab', { name: 'Forge', exact: true }).click();
> 37  |       await expect(page.getByTestId('craft-panel')).toBeVisible(); await page.evaluate(() => document.fonts.ready);
      |                                                                               ^ Error: page.evaluate: Test timeout of 30000ms exceeded.
  38  |       await expect(page.getByTestId('cost-yarn')).toContainText(`${save.state.stacks.yarn} / 10`);
  39  |       await expect(page.getByTestId('cost-fluffTuft')).toContainText(`${save.state.stacks.fluffTuft} / 4`);
  40  |       await expect(page.getByTestId('cost-fish')).toContainText(`${save.state.stacks.fish} / 50`);
  41  |       await expect(page.getByRole('table', { name: 'Crafting chances' })).toContainText('Common gear100'); await geometry(page);
  42  |       for (const quality of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
  43  |         const option = page.getByTestId('rarity-' + quality); await option.click();
  44  |         const measured = await option.evaluate(button => {
  45  |           const text = getComputedStyle(button.querySelector('.forge-option-name')!).color;
  46  |           const background = getComputedStyle(button).backgroundColor;
  47  |           const luminance = (rgb: string) => rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255)
  48  |             .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  49  |             .reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i]!, 0);
  50  |           const a = luminance(text), b = luminance(background);
  51  |           return { text, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  52  |         });
  53  |         expect(measured.ratio, `${quality}: ${JSON.stringify(measured)}`).toBeGreaterThanOrEqual(4.5);
  54  |         // Read the original SVG fill as well: improving text must not recolour existing art.
  55  |         if (quality === 'rare' || quality === 'epic') {
  56  |           const fill = await option.locator('svg[data-frame] path').evaluateAll((paths, rarity) => {
  57  |             const colored = paths.find(path => path.getAttribute('style')?.includes(`--rarity-${rarity},`));
  58  |             return colored ? getComputedStyle(colored).fill : null;
  59  |           }, quality);
  60  |           expect(fill).toBe(quality === 'rare' ? 'rgb(74, 168, 255)' : 'rgb(187, 116, 255)');
  61  |         }
  62  |       }
  63  |       await page.getByTestId('rarity-legendary').click(); await expect(page.getByTestId('craft-btn')).toBeDisabled();
  64  |       await expect(page.getByRole('table', { name: 'Crafting chances' })).toContainText('Legendary gear100');
  65  |       await page.getByTestId('rarity-common').click(); await page.getByTestId('slot-helmet').click();
  66  |       const animations = await page.evaluateHandle(() => {
  67  |         const count = { starts: 0, ends: 0 };
  68  |         document.addEventListener('animationstart', event => { if (event.animationName === 'motion-forge-reveal') count.starts++; });
  69  |         document.addEventListener('animationend', event => { if (event.animationName === 'motion-forge-reveal') count.ends++; });
  70  |         return count;
  71  |       });
  72  |       await page.getByTestId('craft-btn').focus(); await page.keyboard.press('Enter');
  73  |       await expect(page.getByTestId('craft-confirm-box')).toContainText('Common Helmet'); await geometry(page);
  74  |       expect(await page.getByTestId('craft-cancel-btn').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(await page.getByTestId('craft-confirm-btn').evaluate(node => getComputedStyle(node).backgroundColor));
  75  |       const contrast = await page.getByTestId('craft-cancel-btn').evaluate(node => {
  76  |         const style = getComputedStyle(node);
  77  |         const luminance = (rgb: string) => rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
  78  |         const light = luminance(style.color), dark = luminance(style.backgroundColor);
  79  |         return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
  80  |       });
  81  |       expect(contrast).toBeGreaterThanOrEqual(4.5);
  82  |       await screenshot(page, `craft-confirm-${size.width}-${reducedMotion}`);
  83  |       await page.getByTestId('craft-cancel-btn').click(); await expect(page.getByTestId('craft-confirm-box')).toHaveCount(0);
  84  |       await page.getByTestId('craft-btn').click(); await page.getByTestId('craft-confirm-btn').click();
  85  |       await expect(page.getByTestId('craft-result')).toContainText('Crafted: Common');
  86  |       const reveal = await page.getByTestId('forge-in-place-reveal').elementHandle();
  87  |       if (reducedMotion === 'reduce') await expect(page.getByTestId('forge-in-place-reveal')).toHaveCSS('animation-name', 'none');
  88  |       else await expect.poll(() => animations.evaluate(count => count.ends)).toBe(1);
  89  |       await geometry(page); await screenshot(page, `craft-result-${size.width}-${reducedMotion}`);
  90  |       await page.evaluate(() => window.__g1Loop.claimNow());
  91  |       expect(await reveal!.evaluate(node => node === document.querySelector('[data-testid="forge-in-place-reveal"]'))).toBe(true);
  92  |       expect(await animations.evaluate(count => count.starts)).toBe(reducedMotion === 'reduce' ? 0 : 1);
  93  |       await page.getByTestId('slot-boots').click(); await page.getByTestId('craft-btn').click(); await page.getByTestId('craft-confirm-btn').click();
  94  |       await expect(page.getByTestId('craft-result')).toContainText('Crafted: Common');
  95  |       if (reducedMotion === 'no-preference') await expect.poll(() => animations.evaluate(count => count.ends)).toBe(2);
  96  |       expect(await reveal!.evaluate(node => node.isConnected)).toBe(false);
  97  |       await page.getByTestId('tab-salvage').click(); await expect(page.getByTestId('salvage-panel')).toBeVisible();
  98  |       await expect(page.getByTestId('salvage-check-fx:forgeRich:0')).toBeDisabled();
  99  |       await expect(page.getByTestId('salvage-check-fx:forgeRich:4')).toBeDisabled();
  100 |       await page.getByTestId('salvage-check-fx:forgeRich:1').check();
  101 |       await expect(page.getByTestId('salvage-btn')).toBeEnabled(); await screenshot(page, `salvage-${size.width}-${reducedMotion}`);
  102 |       await page.getByTestId('tab-relic').click(); await expect(page.getByTestId('relic-panel')).toBeVisible();
  103 |       await expect(page.getByTestId('relic-forge-btn')).toBeDisabled(); await geometry(page);
  104 |       await screenshot(page, `relic-${size.width}-${reducedMotion}`);
  105 |       expect(errors).toEqual([]); await animations.dispose(); await reveal!.dispose();
  106 |     });
  107 |   }
  108 | }
  109 | 
  110 | 
  111 | test('CXU3 preserves the compact Forge action without scrolling', async ({ page }) => {
  112 |   await page.setViewportSize({ width: 320, height: 568 });
  113 |   const save = mockV2Save('forgeRich', { nowMs: Date.now() });
  114 |   await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
  115 |   await page.goto('/'); await page.getByRole('tab', { name: 'Forge', exact: true }).click();
  116 |   await expect(page.getByTestId('craft-btn')).toBeInViewport({ ratio: 1 });
  117 |   await page.getByTestId('craft-btn').click();
  118 |   await expect(page.getByTestId('craft-confirm-btn')).toBeInViewport({ ratio: 1 });
  119 |   await expect(page.getByTestId('craft-cancel-btn')).toBeInViewport({ ratio: 1 });
  120 | });
  121 | 
```