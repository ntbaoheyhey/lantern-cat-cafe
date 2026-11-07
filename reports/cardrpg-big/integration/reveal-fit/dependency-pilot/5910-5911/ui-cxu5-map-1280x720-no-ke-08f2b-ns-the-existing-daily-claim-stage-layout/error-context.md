# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/cxu5-map.spec.ts >> 1280x720 >> no key refuses fight and explains the existing daily claim
- Location: e2e/ui/cxu5-map.spec.ts:68:5

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
        - tab "Map" [selected] [ref=e276] [cursor=pointer]
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
            - listitem "Fish 126" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: "126"
            - listitem "Yarn 4" [ref=e324]:
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: "4"
            - listitem "Cat Keys 1 of 5" [ref=e332]:
              - generic [aria-hidden] [ref=e335]: Cat Keys
              - generic [aria-hidden] [ref=e336]: 1/5
          - generic [ref=e338]:
            - generic [ref=e339]: Lv 60
            - progressbar "Experience" [ref=e340]
            - generic [aria-hidden] [ref=e341]: 0 / 48,086 XP
          - group "Chapter 1 Living Room, round 10 of 10, 6 of 6 monsters" [ref=e343]:
            - generic [aria-hidden] [ref=e344]: Chapter 1 · Round 10 · 6/6
          - generic [ref=e345]: Power 10,429
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
          - text: Boss ready · losses keep your key
        - generic [ref=e362]:
          - generic [ref=e363]: Later
          - text: Unlock Kitchen
      - generic [ref=e365]:
        - generic [aria-hidden] [ref=e366]: Next
        - button "Challenge the household boss" [ref=e367] [cursor=pointer]
    - main [ref=e368]:
      - generic [ref=e369]:
        - text: CAT CAFÉ QUEST / EVENING PATROL
        - tabpanel "Map" [ref=e370]:
          - generic [ref=e373]:
            - navigation "Chapter Map" [ref=e375]:
              - generic [ref=e376]:
                - heading "World Map" [level=2] [ref=e377]
                - generic [ref=e378]: Cat Café Quest Chapters
              - list [ref=e384]:
                - listitem [ref=e385]:
                  - 'button "CH. 1 Living Room Boss: Yarn Giant Round 10/10" [active] [pressed] [ref=e386] [cursor=pointer]':
                    - generic [ref=e906]:
                      - generic [ref=e907]: CH. 1
                      - heading "Living Room" [level=3] [ref=e909]
                      - generic [ref=e910]:
                        - generic "Chapter Boss" [ref=e911]
                        - generic [ref=e918]: "Boss:"
                        - generic [ref=e919]: Yarn Giant
                      - generic [ref=e920]: Round 10/10
                - listitem [ref=e922]:
                  - 'button "CH. 2 Kitchen Boss: Cucumber Scare Locked: Complete Chapter 1 first to unlock" [disabled] [ref=e923]':
                    - generic [ref=e1540]:
                      - generic [ref=e1541]: CH. 2
                      - heading "Kitchen" [level=3] [ref=e1543]
                      - generic [ref=e1544]:
                        - generic "Chapter Boss" [ref=e1545]
                        - generic [ref=e1552]: "Boss:"
                        - generic [ref=e1553]: Cucumber Scare
                      - generic [ref=e1554]: "Locked: Complete Chapter 1 first to unlock"
                - listitem [ref=e1564]:
                  - 'button "CH. 3 Bathroom Boss: Bathtub Tyrant Locked: Complete Chapter 2 first to unlock" [disabled] [ref=e1565]':
                    - generic [ref=e1954]:
                      - generic [ref=e1955]: CH. 3
                      - heading "Bathroom" [level=3] [ref=e1957]
                      - generic [ref=e1958]:
                        - generic "Chapter Boss" [ref=e1959]
                        - generic [ref=e1966]: "Boss:"
                        - generic [ref=e1967]: Bathtub Tyrant
                      - generic [ref=e1968]: "Locked: Complete Chapter 2 first to unlock"
                - listitem [ref=e1978]:
                  - 'button "CH. 4 Basement Boss: Vacuum Beast Locked: Complete Chapter 3 first to unlock" [disabled] [ref=e1979]':
                    - generic [ref=e2439]:
                      - generic [ref=e2440]: CH. 4
                      - heading "Basement" [level=3] [ref=e2442]
                      - generic [ref=e2443]:
                        - generic "Chapter Boss" [ref=e2444]
                        - generic [ref=e2451]: "Boss:"
                        - generic [ref=e2452]: Vacuum Beast
                      - generic [ref=e2453]: "Locked: Complete Chapter 3 first to unlock"
                - listitem [ref=e2463]:
                  - 'button "CH. 5 Night Rooftops Boss: Laser Dot Phantom Locked: Complete Chapter 4 first to unlock" [disabled] [ref=e2464]':
                    - generic [ref=e2731]:
                      - generic [ref=e2732]: CH. 5
                      - heading "Night Rooftops" [level=3] [ref=e2734]
                      - generic [ref=e2735]:
                        - generic "Chapter Boss" [ref=e2736]
                        - generic [ref=e2743]: "Boss:"
                        - generic [ref=e2744]: Laser Dot Phantom
                      - generic [ref=e2745]: "Locked: Complete Chapter 4 first to unlock"
            - generic [ref=e2755]:
              - region "Boss Gate" [ref=e2756]:
                - generic [ref=e2757]:
                  - generic [ref=e2758]:
                    - heading "Yarn Giant" [level=2] [ref=e2759]
                    - generic [ref=e2760]: "Chapter 1: Living Room"
                  - generic [ref=e2761]:
                    - img "Yarn Giant" [ref=e2763]
                    - generic [ref=e2770]:
                      - generic [ref=e2771]:
                        - generic [ref=e2772]: "Keys: 1"
                        - generic [ref=e2776]: "Cost: 1"
                      - generic "Your power vs boss" [ref=e2780]:
                        - generic [ref=e2781]:
                          - generic [ref=e2782]:
                            - text: Recommended power
                            - strong [ref=e2783]: "267"
                          - generic [ref=e2784]:
                            - text: Your power
                            - strong [ref=e2785]: 10,429
                        - generic [ref=e2786]: Estimate for this build; boss attacks can change the outcome.
                  - paragraph [ref=e2787]:
                    - strong [ref=e2788]: "Daily attempts: Key-limited"
                    - text: 1 daily key from your first claim · 1 key per win. Losses keep the key and start a catnap.
                  - navigation "Chapter selection" [ref=e2789]:
                    - button "Chapter 1" [ref=e2790] [cursor=pointer]
                - generic [ref=e2791]:
                  - button "Fight" [ref=e2792] [cursor=pointer]
                  - generic: Fight ready
              - region "Boss rewards" [ref=e2794]:
                - heading "Rewards First clear chest" [level=3] [ref=e2795]:
                  - text: Rewards
                  - generic [ref=e2796]: First clear chest
                - list [ref=e2797]:
                  - listitem [ref=e2798]:
                    - generic [ref=e2799]: Fish
                    - generic [ref=e2800]: 300–500 · 100%
                  - listitem [ref=e2801]:
                    - generic [ref=e2802]: Yarn
                    - generic [ref=e2803]: 15–25 · 100%
                  - listitem [ref=e2804]:
                    - generic [ref=e2805]: Fluff Tuft
                    - generic [ref=e2806]: 5–8 · 100%
                  - listitem [ref=e2807]:
                    - generic [ref=e2808]: Shiny Button
                    - generic [ref=e2809]: 1–2 · 40%
                  - listitem [ref=e2810]:
                    - generic [ref=e2811]: Main gear
                    - generic [ref=e2812]: 1 · 100%
                  - listitem [ref=e2813]:
                    - generic [ref=e2814]: Accessory
                    - generic [ref=e2815]: 1 · 50%
                  - listitem [ref=e2816]:
                    - generic [ref=e2817]: Moon Pearl
                    - generic [ref=e2818]: 1 · 100%
              - region "Past runs" [ref=e2819]:
                - heading "Past runs This session · latest 3" [level=3] [ref=e2820]
                - paragraph [ref=e2821]: "Lifetime wins: 0"
                - paragraph [ref=e2822]: No completed fights here this session. Select an available chapter and fight when ready.
```

# Test source

```ts
  1   | import { test, expect, type Page } from '../support/test';
  2   | import { readFileSync, mkdirSync } from 'node:fs';
  3   | import { mockV2Save } from '../../src/api/mockV2Fixtures';
  4   | 
  5   | const key = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
  6   | async function enter(page: Page, keys = 1, chapter = 1) {
  7   |   const save = mockV2Save('bossReadyStrong', { nowMs: Date.now(), chapter });
  8   |   for (let cleared = 1; cleared < chapter; cleared++) save.state.bossClears[cleared] = { wins: 1 };
  9   |   save.state.stacks.catKey = keys;
  10  |   await page.addInitScript(({ key, save }) => {
  11  |     localStorage.setItem(key, JSON.stringify(save));
  12  |     localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  13  |   }, { key, save });
  14  |   await page.goto('/');
  15  |   await page.getByRole('tab', { name: 'Map', exact: true }).click();
  16  |   await expect(page.getByRole('region', { name: 'Boss Gate' })).toBeVisible();
> 17  |   await page.evaluate(() => document.fonts.ready);
      |              ^ Error: page.evaluate: Test timeout of 30000ms exceeded.
  18  | }
  19  | test('preserves the compact boss panel and reachable Fight below the desktop breakpoint', async ({ page }) => {
  20  |   for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1024, height: 600 }]) {
  21  |     await page.setViewportSize(size);
  22  |     await enter(page);
  23  |     await expect(page.getByRole('navigation', { name: 'Chapter Map' })).toHaveClass(/v2-chapter-map--compact/);
  24  |     const fight = page.getByRole('button', { name: 'Fight', exact: true });
  25  |     await expect(fight).toBeInViewport();
  26  |     await expect(fight).toBeEnabled();
  27  |     await expect(page.locator('.boss-map-screen')).toHaveCount(0);
  28  |   }
  29  | });
  30  | for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  31  |   test.describe(`${size.width}x${size.height}`, () => {
  32  |     test.use({ viewport: size });
  33  |     test('chapter path, keyboard gates, no nested scroll, unchanged art and reduced motion', async ({ page }) => {
  34  |       const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  35  |       await page.emulateMedia({ reducedMotion: 'reduce' });
  36  |       await enter(page);
  37  |       const map = page.getByRole('navigation', { name: 'Chapter Map' });
  38  |       await expect(map.locator('[data-chapter]')).toHaveCount(5);
  39  |       await expect(map.locator('.v2-map-thumb svg')).toHaveCount(5);
  40  |       await expect(page.locator('.boss-portrait-svg')).toBeVisible();
  41  |       const locked = map.getByRole('button', { name: /Kitchen/ });
  42  |       await locked.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  43  |       await expect(locked).toHaveAttribute('aria-disabled', 'true');
  44  |       await expect(page.locator('.boss-gate-boss-name')).toHaveText('Yarn Giant');
  45  |       const current = map.getByRole('button', { name: /Living Room/ });
  46  |       await current.focus(); await page.keyboard.press('Enter');
  47  |       await expect(current).toHaveAttribute('aria-pressed', 'true');
  48  |       await expect(page.getByText('Daily attempts: Key-limited')).toBeVisible();
  49  |       await expect(page.getByText('300–500 · 100%')).toBeVisible();
  50  |       const geometry = await page.locator('#panel-map').evaluate(panel => {
  51  |         const bad: string[] = [];
  52  |         for (const node of [panel, ...panel.querySelectorAll('*')]) {
  53  |           const el = node as HTMLElement; const style = getComputedStyle(el); const rect = el.getBoundingClientRect();
  54  |           if (!rect.width || !rect.height || style.position === 'absolute') continue;
  55  |           if (/auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) bad.push(`${el.className}: scroll`);
  56  |           if (rect.bottom > innerHeight + 1 || rect.right > innerWidth + 1) bad.push(`${el.className}: viewport`);
  57  |         }
  58  |         return { bad, document: document.documentElement.scrollHeight > innerHeight,
  59  |           animations: panel.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length };
  60  |       });
  61  |       expect(geometry).toEqual({ bad: [], document: false, animations: 0 });
  62  |       expect(errors).toEqual([]);
  63  |       if (process.env.SCREENSHOTS === '1') {
  64  |         mkdirSync('../../reports/scorecard/cxu5', { recursive: true });
  65  |         await page.screenshot({ path: `../../reports/scorecard/cxu5/map-${size.width}.png` });
  66  |       }
  67  |     });
  68  |     test('no key refuses fight and explains the existing daily claim', async ({ page }) => {
  69  |       await enter(page, 0);
  70  |       await expect(page.getByRole('button', { name: 'Fight', exact: true })).toBeDisabled();
  71  |       await expect(page.getByTestId('boss-key-hint')).toBeVisible();
  72  |       await expect(page.getByTestId('boss-key-hint-sources')).toContainText('Daily: 1 Cat Key');
  73  |       await expect(page.getByRole('region', { name: 'Past runs' })).toContainText('No completed fights here this session.');
  74  |       const bounds = await page.locator('.boss-map-sidebar').evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, viewport: innerHeight }));
  75  |       expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewport);
  76  |       if (process.env.SCREENSHOTS === '1') {
  77  |         mkdirSync('../../reports/scorecard/cxu5', { recursive: true });
  78  |         const chapter = await page.locator('.v2-map-node[aria-pressed="true"]').getAttribute('data-chapter');
  79  |         await page.screenshot({ path: `../../reports/scorecard/cxu5/map-no-key-ch${chapter}-${size.width}.png` });
  80  |       }
  81  |     });
  82  |     test('chapter five shows every reward and shortcut without clipping', async ({ page }) => {
  83  |       await enter(page, 0, 5);
  84  |       await expect(page.locator('.boss-map-rewards li')).toHaveCount(9);
  85  |       await expect(page.getByRole('navigation', { name: 'Chapter selection' }).getByRole('button')).toHaveCount(5);
  86  |       const bounds = await page.locator('.boss-map-sidebar').evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, viewport: innerHeight }));
  87  |       expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewport);
  88  |       if (process.env.SCREENSHOTS === '1') {
  89  |         mkdirSync('../../reports/scorecard/cxu5', { recursive: true });
  90  |         const chapter = await page.locator('.v2-map-node[aria-pressed="true"]').getAttribute('data-chapter');
  91  |         await page.screenshot({ path: `../../reports/scorecard/cxu5/map-no-key-ch${chapter}-${size.width}.png` });
  92  |       }
  93  |     });
  94  |     test('replay releases one result into history, selecting nodes updates fight card', async ({ page }) => {
  95  |       await page.emulateMedia({ reducedMotion: 'reduce' });
  96  |       await enter(page, 2);
  97  |       await page.getByRole('button', { name: 'Fight', exact: true }).click();
  98  |       await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
  99  |       const dialog = page.getByRole('dialog');
  100 |       if (await dialog.count()) {
  101 |         const buttons = dialog.getByRole('button');
  102 |         await buttons.last().click();
  103 |       }
  104 |       await expect(page.getByRole('region', { name: 'Past runs' })).toContainText('Win');
  105 |       await expect(page.getByRole('region', { name: 'Past runs' }).getByRole('listitem')).toHaveCount(1);
  106 |       const map = page.getByRole('navigation', { name: 'Chapter Map' });
  107 |       await map.getByRole('button', { name: /Kitchen/ }).click();
  108 |       await expect(page.locator('.boss-gate-boss-name')).toHaveText('Cucumber Scare');
  109 |       await expect(page.getByRole('region', { name: 'Past runs' })).toContainText('No completed fights here this session.');
  110 |       await map.getByRole('button', { name: /Living Room/ }).click();
  111 |       await expect(page.locator('.boss-gate-boss-name')).toHaveText('Yarn Giant');
  112 |       await expect(page.getByRole('button', { name: 'Rematch', exact: true })).toBeVisible();
  113 |       await expect(page.getByText('120–200 · 100%')).toBeVisible();
  114 |     });
  115 |   });
  116 | }
  117 | 
```