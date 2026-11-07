# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/firstplay.spec.ts >> First play reaches Home and naturally earns without a wallet 1280
- Location: e2e/ui/firstplay.spec.ts:43:3

# Error details

```
Error: UI interaction path should reach Home well before the reward interval

expect(received).toBeLessThan(expected)

Expected: < 5000
Received:   6915
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
            - listitem "Fish 0" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: "0"
            - listitem "Yarn 0" [ref=e324]:
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: "0"
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
      - complementary "Getting started" [ref=e369]:
        - generic [ref=e370]: 1/3
        - generic [ref=e371]:
          - strong [ref=e372]: Mochi explores for you
          - paragraph [ref=e373]: Watch the fight. Fish, XP and finds arrive when progress is saved. You can browse while Mochi plays.
        - button "Watch Mochi" [ref=e374] [cursor=pointer]
        - button "Next tip" [ref=e375] [cursor=pointer]
        - button "Dismiss forever" [ref=e376]
      - tabpanel "Home" [ref=e378]:
        - generic [ref=e379]:
          - generic [ref=e380]:
            - region "Game stage" [ref=e381]:
              - text: CAT CAFÉ QUEST / EVENING PATROL
              - generic [ref=e382]:
                - img "Cat exploring the chapter" [ref=e383]
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
            - region "Event log" [ref=e384]:
              - generic [ref=e385]: Battle Log
              - generic [ref=e388]:
                - generic [ref=e389]:
                  - generic [ref=e390]: ›
                  - generic [ref=e391]: Mochi entered Chapter 1 (Round 1).
                - generic [ref=e392]:
                  - generic [ref=e393]: ›
                  - generic [ref=e394]: "Auto-battle active: exploring and defeating monsters."
          - region "Home details" [ref=e395]:
            - generic [ref=e396]:
              - generic [ref=e397]:
                - img "Mochi, a tabby cat with a blue scarf" [ref=e399]
                - generic [ref=e401]:
                  - heading "Mochi" [level=2] [ref=e402]
                  - generic [ref=e403]:
                    - generic [ref=e404]: Warrior
                    - generic [ref=e405]: Lv. 1
                  - generic [ref=e406]:
                    - text: "Power:"
                    - strong [ref=e407]: "44"
              - generic [ref=e408]:
                - heading "Core Stats" [level=3] [ref=e409]
                - generic [ref=e410]:
                  - generic [ref=e411]:
                    - term [ref=e412]: HP
                    - definition [ref=e413]: "100"
                  - generic [ref=e414]:
                    - term [ref=e415]: ATK
                    - definition [ref=e416]: "18"
                  - generic [ref=e417]:
                    - term [ref=e418]: Crit chance
                    - definition [ref=e419]: 5%
                  - generic [ref=e420]:
                    - term [ref=e421]: DEF
                    - definition [ref=e422]: "5"
                  - generic [ref=e423]:
                    - term [ref=e424]: Speed
                    - definition [ref=e425]: 1.00/s
            - generic [ref=e426]:
              - generic [ref=e427]:
                - heading "Next Goal" [level=2] [ref=e428]
                - generic [ref=e429]: Ch. 1 · Round 1
              - generic [ref=e430]:
                - generic [ref=e431]:
                  - generic [ref=e432]:
                    - generic [ref=e433]: Monster Hunt
                    - generic [ref=e434]: 0 / 6
                  - progressbar "Progress through this round" [ref=e435]
                - paragraph [ref=e436]: Defeat 6 more monsters to reach the next stage.
                - generic [ref=e437]:
                  - generic [ref=e438]:
                    - generic [ref=e439]: Now
                    - text: Clear round 1 · 6 foes left
                  - generic [ref=e440]:
                    - generic [ref=e441]: Soon
                    - text: 60 foes to the chapter boss
                  - generic [ref=e442]:
                    - generic [ref=e443]: Later
                    - text: Unlock Kitchen
                - button "Go to map" [ref=e444] [cursor=pointer]
            - generic [ref=e445]:
              - heading "Recent loot" [level=2] [ref=e447]
              - region "Recent loot details" [ref=e448]:
                - generic [ref=e449]:
                  - generic [ref=e450]:
                    - generic [ref=e456]: "0"
                    - generic [ref=e457]: Fish
                  - generic [ref=e458]:
                    - generic [ref=e463]: "0"
                    - generic [ref=e464]: Yarn
                  - generic [ref=e465]:
                    - generic [ref=e468]: "0"
                    - generic [ref=e469]: Keys
                - generic [ref=e470]:
                  - heading "Latest Drops" [level=3] [ref=e471]
                  - list [ref=e472]:
                    - listitem [ref=e473]:
                      - generic [ref=e476]:
                        - generic [ref=e477]: Twig Sword
                        - generic [ref=e478]: Common Lv.1
```

# Test source

```ts
  1   | import { expect, test, type Page } from '../support/test';
  2   | import { expectVisibleRoot, watchVisibleRoot } from '../support/visible-root';
  3   | import { mockV2Save } from '../../src/api/mockV2Fixtures';
  4   | import fs from 'node:fs';
  5   | import path from 'node:path';
  6   | const storageKey = fs.readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
  7   | 
  8   | async function capture(page: Page, name: string) {
  9   |   await page.evaluate(() => document.fonts.ready);
  10  |   await expectVisibleRoot(page);
  11  |   expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
  12  |   if (process.env.FIRSTPLAY_SCREENSHOTS) {
  13  |     fs.mkdirSync(process.env.FIRSTPLAY_SCREENSHOTS, { recursive: true });
  14  |     await page.screenshot({ path: path.join(process.env.FIRSTPLAY_SCREENSHOTS, name + '.png') });
  15  |   }
  16  | }
  17  | 
  18  | async function expectRewardContrast(page: Page) {
  19  |   const colors = await page.locator('.home-card--loot .loot-summary-heading, .home-card--loot .loot-line, .home-card--loot .loot-item-name, .home-card--loot .loot-item-meta').evaluateAll(nodes => nodes.filter(node => {
  20  |     const rect = node.getBoundingClientRect();
  21  |     return rect.width && rect.height;
  22  |   }).map(node => {
  23  |     let surface: Element | null = node;
  24  |     while (surface && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement;
  25  |     return { label: node.textContent, foreground: getComputedStyle(node).color, background: surface ? getComputedStyle(surface).backgroundColor : '' };
  26  |   }));
  27  |   expect(colors.length).toBeGreaterThan(1);
  28  |   const luminance = (rgb: string) => {
  29  |     const channels = rgb.match(/[\d.]+/g)!.map(Number);
  30  |     expect(channels.length === 3 || channels[3] === 1, `Opaque color required: ${rgb}`).toBe(true);
  31  |     const values = channels.slice(0, 3).map(value => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; });
  32  |     return .2126 * values[0]! + .7152 * values[1]! + .0722 * values[2]!;
  33  |   };
  34  |   return colors.map(row => {
  35  |     const a = luminance(row.foreground), b = luminance(row.background);
  36  |     const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  37  |     expect(ratio, JSON.stringify(row)).toBeGreaterThanOrEqual(4.5);
  38  |     return { ...row, ratio };
  39  |   });
  40  | }
  41  | 
  42  | for (const width of [1280, 1600]) {
  43  |   test(`First play reaches Home and naturally earns without a wallet ${width}`, async ({ page }, testInfo) => {
  44  |     // The real first claim is scheduled after ten seconds; no clock or claim shortcut.
  45  |     test.setTimeout(50_000);
  46  |     await page.setViewportSize({ width, height: width * 9 / 16 });
  47  |     await watchVisibleRoot(page);
  48  |     const errors: string[] = [], writes: string[] = [];
  49  |     page.on('pageerror', error => errors.push(error.message));
  50  |     page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  51  |     page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.method()); });
  52  |     const start = Date.now(); const timing: Record<string, number> = {};
  53  |     await page.goto('/#landing');
  54  |     const help = page.getByRole('dialog', { name: 'How to play', exact: true });
  55  |     await expect(help).toHaveCount(0); timing.firstVisitMs = Date.now() - start;
  56  |     await expectVisibleRoot(page);
  57  |     await page.getByTestId('landing-start').focus();
  58  |     await expect(page.getByTestId('landing-start')).toBeFocused();
  59  |     await expect(page.getByTestId('landing-start')).toHaveAccessibleDescription(/No token.*No fees to play/);
  60  |     await expectVisibleRoot(page); timing.landingMs = Date.now() - start;
  61  |     await page.getByTestId('landing-start').click();
  62  |     await expect(page.getByTestId('class-picker')).toBeVisible(); timing.classMs = Date.now() - start;
  63  |     await expectVisibleRoot(page);
  64  |     await page.getByTestId('class-picker-choose-button').click();
  65  |     await expect(page.getByTestId('home-dashboard')).toBeVisible(); timing.homeMs = Date.now() - start;
> 66  |     expect(timing.homeMs, 'UI interaction path should reach Home well before the reward interval').toBeLessThan(5_000);
      |                                                                                                    ^ Error: UI interaction path should reach Home well before the reward interval
  67  |     await expect(page.getByTestId('guest-coach')).toBeVisible();
  68  |     const initial = await page.evaluate(() => window.__g1Loop.getSnapshot().state!.currencies.fish);
  69  |     await expect.poll(() => page.evaluate(() => window.__g1Loop.getSnapshot().state!.currencies.fish), { timeout: 36_000, intervals: [100, 250, 500] }).toBeGreaterThan(initial);
  70  |     await expect(page.getByRole('heading', { name: 'Recent finds', exact: true })).toBeVisible();
  71  |     const contrast = await expectRewardContrast(page);
  72  |     timing.firstEarnMs = Date.now() - start;
  73  |     const result = { width, height: width * 9 / 16, method: 'Fresh local guest; nonblocking coach; real wall clock and natural ten-second first claim; no seeded save, manual claim or clock acceleration', timing, contrast, blankFrames: await page.evaluate(() => (window as Window & { __visibleRootGuard?: { blankFrames: unknown[] } }).__visibleRootGuard?.blankFrames ?? null), errors, writes };
  74  |     await testInfo.attach('first-play-timing', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
  75  |     if (process.env.FIRSTPLAY_SCREENSHOTS) {
  76  |       fs.mkdirSync(process.env.FIRSTPLAY_SCREENSHOTS, { recursive: true });
  77  |       fs.writeFileSync(path.join(process.env.FIRSTPLAY_SCREENSHOTS, `timing-${width}-${process.env.E2E_VIEWPORT ?? 'default'}-repeat${testInfo.repeatEachIndex}.json`), JSON.stringify(result, null, 2) + '\n');
  78  |     }
  79  |     await capture(page, `first-earn-${width}`);
  80  |     expect(errors).toEqual([]); expect(writes).toEqual([]);
  81  |   });
  82  | 
  83  |   test(`Returning guest stays labelled through disconnected wallet and offline recovery ${width}`, async ({ page, context }) => {
  84  |     await page.setViewportSize({ width, height: width * 9 / 16 });
  85  |     const save = mockV2Save('midGame', { nowMs: Date.now(), classId: 'warrior' });
  86  |     await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
  87  |     await watchVisibleRoot(page);
  88  |     const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  89  |     await page.goto('/#hero'); await expect(page.getByRole('region', { name: 'Character' })).toBeVisible();
  90  |     await page.evaluate(() => { location.hash = 'landing'; }); await expect(page.getByTestId('landing-start')).toBeVisible();
  91  |     await page.getByTestId('landing-start').click(); await expect(page.getByTestId('home-dashboard')).toBeVisible();
  92  |     await expect(page.getByTestId('class-picker')).toHaveCount(0); await capture(page, `returning-${width}`);
  93  |     await page.getByTestId('nav-market').click();
  94  |     await expect(page.getByRole('heading', { name: 'Your Relic shelf' })).toBeVisible();
  95  |     await expect(page.getByText('Connect your wallet to see your Relics and the market.', { exact: true })).toBeVisible();
  96  |     await capture(page, `wallet-disconnected-${width}`);
  97  |     await page.getByTestId('nav-home').click();
  98  |     await context.setOffline(true); await page.evaluate(() => dispatchEvent(new Event('offline')));
  99  |     await expect(page.locator('header [data-sync-status="offline"]')).toBeVisible();
  100 |     await capture(page, `offline-${width}`);
  101 |     await context.setOffline(false); await page.evaluate(() => dispatchEvent(new Event('online')));
  102 |     await expect(page.getByTestId('home-dashboard')).toBeVisible(); await expectVisibleRoot(page);
  103 |     expect(errors).toEqual([]);
  104 |   });
  105 | }
  106 | 
```