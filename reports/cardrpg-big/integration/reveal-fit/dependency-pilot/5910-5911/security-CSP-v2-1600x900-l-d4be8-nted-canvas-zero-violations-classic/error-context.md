# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> CSP v2 1600x900 light: painted canvas, zero violations
- Location: e2e/security.spec.ts:13:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
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
                    - generic [ref=e449]: "0"
                    - generic [ref=e450]: Fish
                  - generic [ref=e451]:
                    - generic [ref=e456]: "0"
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
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { readFileSync } from 'node:fs';
  3  | import path from 'node:path';
  4  | import { classicURL, v2URL } from './support/servers';
  5  | 
  6  | const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  7  | const headers = Object.fromEntries(config.headers[0].headers.map((h: { key: string; value: string }) => [h.key, h.value]));
  8  | const views = [
  9  |   [1600, 900, 'light'], [1280, 720, 'light'], [390, 844, 'light'], [320, 568, 'light'],
  10 |   [1280, 720, 'dark'], [390, 844, 'dark'],
  11 | ] as const;
  12 | for (const mode of ['classic', 'v2']) for (const [width, height, colorScheme] of views) {
  13 |   test(`CSP ${mode} ${width}x${height} ${colorScheme}: painted canvas, zero violations`, async ({ page }) => {
  14 |     const violations: string[] = [];
  15 |     const errors: string[] = [];
  16 |     page.on('console', m => {
  17 |       if (/violat(?:es|ion).*?(?:policy|directive)|refused to.*?(?:policy|directive)/i.test(m.text())) violations.push(m.text());
  18 |       if (m.type() === 'error') errors.push(m.text());
  19 |     });
  20 |     page.on('pageerror', e => errors.push(e.message));
  21 |     await page.exposeFunction('recordCspViolation', (directive: string) => violations.push(directive));
  22 |     await page.addInitScript(() => {
  23 |       document.addEventListener('securitypolicyviolation', e => {
  24 |         void (window as unknown as { recordCspViolation(d: string): Promise<void> }).recordCspViolation(`${e.effectiveDirective}: ${e.blockedURI}`);
  25 |       });
  26 |       localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  27 |     });
  28 |     // Vite preview does not implement vercel.json. Inject the exact production response headers
  29 |     // on the built HTML response so Chromium really enforces the header policy (frame-ancestors needs a header).
  30 |     await page.route('http://localhost:**/*', async route => {
  31 |       if (route.request().resourceType() !== 'document') return route.continue();
  32 |       const response = await route.fetch();
  33 |       await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
  34 |     });
  35 |     await page.setViewportSize({ width, height });
  36 |     await page.emulateMedia({ colorScheme });
  37 |     const response = await page.goto(`${mode === 'classic' ? classicURL : v2URL}/`);
  38 |     expect(response?.headers()['content-security-policy']).toBe(headers['Content-Security-Policy']);
  39 |     if (mode === 'v2') {
  40 |       await page.getByTestId('class-picker-choose-button').click();
  41 |       await expect(page.getByTestId('class-picker')).toHaveCount(0);
  42 |     }
  43 |     const canvas = page.locator(mode === 'classic' ? '.strip canvas' : '.v2-stage-canvas canvas');
  44 |     await expect(canvas).toBeVisible();
  45 |     await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => {
  46 |       const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  47 |       return data.some((value, i) => i % 4 === 3 && value > 0);
  48 |     })).toBe(true);
  49 |     // Navigate the classic market as well as the initial Phaser screen.
  50 |     if (mode === 'classic') {
  51 |       await page.getByRole('button', { name: 'Menu', exact: true }).click();
  52 |       await page.getByRole('tab', { name: 'Market', exact: true }).click();
  53 |     }
> 54 |     await page.waitForLoadState('networkidle');
     |                ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
  55 |     expect(violations).toEqual([]);
  56 |     expect(errors).toEqual([]);
  57 |     await page.evaluate(() => window.scrollTo(0, 0));
  58 |     if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: path.resolve(process.cwd(), `../../reports/s2-security/csp-${mode}-${width}-${colorScheme}.png`) });
  59 |     console.log(`CSP ${mode} ${width}x${height} ${colorScheme}: canvas painted; violations=${violations.length}; console/page errors=${errors.length}`);
  60 |   });
  61 | }
  62 | 
```