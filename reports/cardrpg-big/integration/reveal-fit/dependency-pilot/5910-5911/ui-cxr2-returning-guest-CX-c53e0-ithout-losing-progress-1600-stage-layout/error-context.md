# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/cxr2-returning-guest.spec.ts >> CXR2 returning guest can play again from Landing without losing progress 1600
- Location: e2e/ui/cxr2-returning-guest.spec.ts:7:35

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
            - listitem "Fish 200" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: "200"
            - listitem "Yarn 35" [ref=e324]:
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: "35"
            - listitem "Cat Keys 2 of 5" [ref=e332]:
              - generic [aria-hidden] [ref=e335]: Cat Keys
              - generic [aria-hidden] [ref=e336]: 2/5
          - generic [ref=e338]:
            - generic [ref=e339]: Lv 20
            - progressbar "Experience" [ref=e340]
            - generic [aria-hidden] [ref=e341]: 0 / 517 XP
          - group "Chapter 2 Kitchen, round 5 of 10, 5 of 10 monsters" [ref=e343]:
            - generic [aria-hidden] [ref=e344]: Chapter 2 · Round 5 · 5/10
          - generic [ref=e345]: Power 360
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
          - text: 55 foes to the chapter boss
        - generic [ref=e362]:
          - generic [ref=e363]: Later
          - text: Unlock Bathroom
      - generic [ref=e365]:
        - generic [aria-hidden] [ref=e366]: Next
        - button "Clear round 5 · 5 foes left" [ref=e367] [cursor=pointer]
    - main [ref=e368]:
      - tabpanel "Home" [ref=e370]:
        - generic [ref=e371]:
          - generic [ref=e372]:
            - region "Game stage" [ref=e373]:
              - text: CAT CAFÉ QUEST / EVENING PATROL
              - generic [ref=e374]:
                - img "Cat exploring the chapter" [ref=e375]
                - generic "Stage progress":
                  - generic: Chapter 2 · Round 5 / 10
                  - generic "5 / 10 kills; last kill is elite":
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ◆
                    - generic: 5 / 10
                - status: Round start
                - generic: Fight preview · rewards on claim
            - region "Event log" [ref=e377]:
              - generic [ref=e378]: Battle Log
              - generic [ref=e381]:
                - generic [ref=e382]:
                  - generic [ref=e383]: ›
                  - generic [ref=e384]: Mochi entered Chapter 2 (Round 5).
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
                    - generic [ref=e398]: Lv. 20
                  - generic [ref=e399]:
                    - text: "Power:"
                    - strong [ref=e400]: "360"
              - generic [ref=e401]:
                - heading "Core Stats" [level=3] [ref=e402]
                - generic [ref=e403]:
                  - generic [ref=e404]:
                    - term [ref=e405]: HP
                    - definition [ref=e406]: "580"
                  - generic [ref=e407]:
                    - term [ref=e408]: ATK
                    - definition [ref=e409]: "74"
                  - generic [ref=e410]:
                    - term [ref=e411]: Crit chance
                    - definition [ref=e412]: 25%
                  - generic [ref=e413]:
                    - term [ref=e414]: DEF
                    - definition [ref=e415]: "39"
                  - generic [ref=e416]:
                    - term [ref=e417]: Speed
                    - definition [ref=e418]: 1.62/s
            - generic [ref=e419]:
              - generic [ref=e420]:
                - heading "Next Goal" [level=2] [ref=e421]
                - generic [ref=e422]: Ch. 2 · Round 5
              - generic [ref=e423]:
                - generic [ref=e424]:
                  - generic [ref=e425]:
                    - generic [ref=e426]: Monster Hunt
                    - generic [ref=e427]: 5 / 10
                  - progressbar "Progress through this round" [ref=e428]
                - paragraph [ref=e430]: Defeat 5 more monsters to reach the next stage.
                - generic [ref=e431]:
                  - generic [ref=e432]:
                    - generic [ref=e433]: Now
                    - text: Clear round 5 · 5 foes left
                  - generic [ref=e434]:
                    - generic [ref=e435]: Soon
                    - text: 55 foes to the chapter boss
                  - generic [ref=e436]:
                    - generic [ref=e437]: Later
                    - text: Unlock Bathroom
                - button "Go to map" [ref=e438] [cursor=pointer]
            - generic [ref=e439]:
              - heading "Recent loot" [level=2] [ref=e441]
              - region "Recent loot details" [ref=e442]:
                - generic [ref=e443]:
                  - generic [ref=e444]:
                    - generic [ref=e450]: "200"
                    - generic [ref=e451]: Fish
                  - generic [ref=e452]:
                    - generic [ref=e457]: "35"
                    - generic [ref=e458]: Yarn
                  - generic [ref=e459]:
                    - generic [ref=e462]: "2"
                    - generic [ref=e463]: Keys
                - generic [ref=e464]:
                  - heading "Latest Drops" [level=3] [ref=e465]
                  - list [ref=e466]:
                    - listitem [ref=e467]:
                      - generic [ref=e470]:
                        - generic [ref=e471]: Fine Star Charm
                        - generic [ref=e472]: Rare Lv.20
                    - listitem [ref=e473]:
                      - generic [ref=e476]:
                        - generic [ref=e477]: Fine Paw Print Ring
                        - generic [ref=e478]: Rare Lv.20
                    - listitem [ref=e479]:
                      - generic [ref=e482]:
                        - generic [ref=e483]: Fine Feather Earring
                        - generic [ref=e484]: Rare Lv.20
                    - listitem [ref=e485]:
                      - generic [ref=e488]:
                        - generic [ref=e489]: Fine Bell Collar
                        - generic [ref=e490]: Rare Lv.20
                    - listitem [ref=e491]:
                      - generic [ref=e494]:
                        - generic [ref=e495]: Woolly Fuzzy Booties
                        - generic [ref=e496]: Rare Lv.20
                    - listitem [ref=e497]:
                      - generic [ref=e500]:
                        - generic [ref=e501]: Woolly Mitten Paws
                        - generic [ref=e502]: Rare Lv.20
```

# Test source

```ts
  1  | import { test, expect } from '../support/test';
  2  | import { mockV2Save } from '../../src/api/mockV2Fixtures';
  3  | import { readFileSync, mkdirSync } from 'node:fs';
  4  | import { resolve } from 'node:path';
  5  | const storageKey = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
  6  | 
  7  | for (const width of [1280, 1600]) test(`CXR2 returning guest can play again from Landing without losing progress ${width}`, async ({ page }) => {
  8  |   await page.setViewportSize({ width, height: width * 9 / 16 });
  9  |   const now = Date.now(), save = mockV2Save('midGame', { nowMs: now, classId: 'warrior' });
  10 |   await page.clock.install({ time: new Date(0) }); await page.clock.pauseAt(new Date(now));
  11 |   await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
  12 |   const errors: string[] = [];
  13 |   page.on('pageerror', error => errors.push(error.message));
  14 |   page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  15 |   await page.goto('/#hero');
  16 |   await expect(page.getByRole('region', { name: 'Character' })).toBeVisible();
  17 |   const before = await page.evaluate(() => window.__g1Loop.getSnapshot().state);
  18 |   await page.evaluate(() => { location.hash = 'landing'; });
  19 |   await expect(page.getByTestId('landing-hero')).toBeVisible();
  20 |   await page.getByTestId('landing-start').click();
  21 |   await expect(page.getByTestId('home-dashboard')).toBeVisible();
  22 |   await expect(page.getByTestId('nav-home')).toHaveAttribute('aria-selected', 'true');
  23 |   await expect(page.getByTestId('class-picker')).toHaveCount(0);
  24 |   expect(await page.evaluate(() => window.__g1Loop.getSnapshot().state)).toEqual(before);
  25 |   expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
> 26 |   await page.clock.runFor(500); await page.evaluate(() => document.fonts.ready);
     |                                            ^ Error: page.evaluate: Test timeout of 30000ms exceeded.
  27 |   if (process.env.CXR2_SCREENSHOTS) {
  28 |     mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
  29 |     await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, `returning-guest-home-${width}.png`) });
  30 |   }
  31 |   expect(errors).toEqual([]);
  32 | });
  33 | 
```