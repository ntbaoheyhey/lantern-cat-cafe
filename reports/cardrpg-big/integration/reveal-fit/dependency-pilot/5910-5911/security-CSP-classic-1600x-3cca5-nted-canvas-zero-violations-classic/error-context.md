# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> CSP classic 1600x900 light: painted canvas, zero violations
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
- generic [ref=e2]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - heading "Taskbar Hero" [level=1] [ref=e5]
      - paragraph [ref=e6]: Your cat fights on its own. Collect fish, upgrade gear, beat the bosses.
    - region "Café board" [ref=e7]:
      - region "Mochi the cat" [ref=e8]:
        - img "Portrait of Mochi the cat" [ref=e10]
        - generic [ref=e267]:
          - heading "Mochi the cat" [level=2] [ref=e268]
          - generic [ref=e272]:
            - generic [ref=e273]:
              - generic [ref=e274]: "Cat power:"
              - strong [ref=e275]: "30"
            - generic [ref=e276]:
              - generic [ref=e277]: "Boss level:"
              - strong [ref=e278]: "1"
      - region "Today's quest" [ref=e279]:
        - heading "Today's Quest" [level=2] [ref=e281]
        - generic [ref=e286]:
          - complementary "Next step recommendation" [ref=e287]:
            - generic [ref=e288]:
              - generic [ref=e289]: "Next step:"
              - button "Upgrade your gear in Inventory →" [ref=e290] [cursor=pointer]
          - generic [ref=e291]:
            - generic [ref=e292]:
              - generic [ref=e293]: "Boss fights today:"
              - strong [ref=e294]: 0 / 5
            - progressbar "Boss fights used today" [ref=e295]
      - region "Relic shelf" [ref=e296]:
        - heading "Relic Shelf" [level=2] [ref=e298]
        - generic [ref=e307]:
          - generic [ref=e308]: Empty Slot
          - generic [ref=e309]:
            - text: "Next target:"
            - strong [ref=e310]: Paw Charm
  - region "Game panel" [ref=e311]:
    - tablist "Game panel tabs" [ref=e312]:
      - tab "Hero" [ref=e313] [cursor=pointer]
      - tab "Inventory" [ref=e314] [cursor=pointer]
      - tab "Boss" [ref=e315] [cursor=pointer]
      - tab "Forge" [ref=e316] [cursor=pointer]
      - tab "Market" [active] [selected] [ref=e317] [cursor=pointer]
      - button "How to play" [ref=e318] [cursor=pointer]:
        - generic [aria-hidden] [ref=e319]: "?"
    - tabpanel "Market" [ref=e321]:
      - generic [ref=e322]:
        - heading "Market" [level=2] [ref=e323]
        - status [ref=e324]: Demo mode, sign in to save progress.
        - generic [ref=e326]:
          - generic [ref=e327]:
            - heading "Relic market" [level=2] [ref=e328]
            - paragraph [ref=e329]: Fuji testnet, test AVAX. On-chain Relics only.
            - generic [ref=e330]:
              - heading "Your Relic shelf" [level=3] [ref=e335]
              - paragraph [ref=e337]: Connect your wallet to see your Relics and the market.
          - complementary [ref=e338]:
            - heading "Avalanche Fuji" [level=3] [ref=e339]
            - paragraph [ref=e340]: Chain 43113
            - paragraph [ref=e341]: Relics are ERC-1155 collectibles. Equipment stays in your Bag.
            - generic [ref=e342]:
              - generic [ref=e343]:
                - term [ref=e344]: RelicNFT
                - definition [ref=e345]: 0xB1a1…6f2D
              - generic [ref=e346]:
                - term [ref=e347]: RelicMarket
                - definition [ref=e348]: 0x10fc…ff93
            - generic [ref=e349]:
              - link "RelicNFT on Routescan" [ref=e350] [cursor=pointer]:
                - /url: https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D
              - link "RelicMarket on Routescan" [ref=e351] [cursor=pointer]:
                - /url: https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93
  - region "Taskbar strip" [ref=e352]:
    - generic "Resources":
      - generic "Fish": "83"
      - generic "Yarn": "3"
      - generic "Cat Key": "0"
    - group "Wallet" [ref=e355]:
      - link "Get a browser wallet" [ref=e356] [cursor=pointer]:
        - /url: https://core.app
    - button "Close" [expanded] [ref=e357] [cursor=pointer]
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