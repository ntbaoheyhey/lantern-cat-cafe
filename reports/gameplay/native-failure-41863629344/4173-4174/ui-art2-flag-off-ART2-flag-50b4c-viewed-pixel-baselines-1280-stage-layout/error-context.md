# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/art2-flag-off.spec.ts >> ART2 flag-off landing and class match reviewed pixel baselines 1280
- Location: e2e/ui/art2-flag-off.spec.ts:6:35

# Error details

```
Error: landing 1280: default-off pixels changed from reviewed baseline

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "Taskbar Hero" [level=1]
  - main [ref=e5]:
    - tabpanel "Landing" [ref=e7]:
      - region [ref=e8]:
        - generic [ref=e10]:
          - generic [ref=e11]: Candidate build, not live.
          - heading "Taskbar Hero" [level=2] [ref=e14]: TaskbarHero
          - paragraph [ref=e15]: A cozy idle RPG that lives in a strip of your browser. Your cat fights while you work. Rare gear can become a Relic you truly own.
          - generic [ref=e16]:
            - button "Play as guest" [ref=e17] [cursor=pointer]
            - group "Wallet" [ref=e19]:
              - link "Get a browser wallet" [ref=e20] [cursor=pointer]:
                - /url: https://core.app
          - paragraph [ref=e21]: No token. No fees to play. Wallet only needed to mint or trade Relics.
        - region "Game guarantees and proof" [ref=e22]:
          - generic [ref=e23]:
            - generic [ref=e24]: ERC-1155
            - generic [ref=e25]: Relic NFT
          - generic [aria-hidden] [ref=e26]: ·
          - link "View contract on Routescan ↗" [ref=e28] [cursor=pointer]:
            - /url: https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D/contract
          - generic [aria-hidden] [ref=e29]: ·
          - generic [ref=e30]:
            - generic [aria-hidden] [ref=e31]: ✓
            - generic [ref=e32]: Guest play is local
          - generic [aria-hidden] [ref=e33]: ·
          - link "Market contract ↗" [ref=e35] [cursor=pointer]:
            - /url: https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93/contract
          - generic [aria-hidden] [ref=e36]: ·
          - button "Help & Guide" [ref=e38] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from '../support/test';
  2  | import fs from 'node:fs';
  3  | import path from 'node:path';
  4  | import { pinVisualFonts } from '../support/visual-fonts';
  5  | 
  6  | for (const width of [1280, 1600]) test(`ART2 flag-off landing and class match reviewed pixel baselines ${width}`, async ({ page }, testInfo) => {
  7  |   await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
  8  |   await page.emulateMedia({ reducedMotion: 'reduce' });
  9  |   await page.clock.install({ time: Date.UTC(2026, 10, 3, 12) });
  10 |   await page.clock.pauseAt(Date.UTC(2026, 10, 3, 12));
  11 |   await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
  12 |   await pinVisualFonts(page);
  13 |   await page.goto('/#landing');
  14 |   for (const screen of ['landing', 'class']) {
  15 |     if (screen === 'class') await page.getByTestId('landing-start').click();
  16 |     await expect(page.getByTestId(screen === 'landing' ? 'landing-hero' : 'class-picker')).toBeVisible();
  17 |     await page.evaluate(() => document.fonts.ready);
  18 |     // The test clock is paused: explicitly service two paint frames after font layout.
  19 |     // Forty milliseconds cannot reach the existing30-second game claim interval.
  20 |     await page.clock.runFor(40);
  21 |     await page.evaluate(() => document.fonts.ready);
  22 |     await expect(page.locator('[data-art2]')).toHaveCount(0);
  23 |     const actual = await page.screenshot({ animations: 'disabled' });
  24 |     // The intentional CLS repair has its own reviewed Landing baseline. Keep the
  25 |     // original main captures. Native rasterization differs across OSes, so each
  26 |     // supported platform has reviewed baselines; keep zero pixel/byte tolerance.
  27 |     const baselineScreen = screen === 'landing' ? 'landing-stable' : screen;
  28 |     const baseline = fs.readFileSync(path.resolve(`e2e/ui/art2-baseline/${process.platform}/${baselineScreen}-${width}.png`));
  29 |     if (!actual.equals(baseline)) {
  30 |       await testInfo.attach('flag-off-actual', { body: actual, contentType: 'image/png' });
  31 |       await testInfo.attach('flag-off-baseline', { body: baseline, contentType: 'image/png' });
  32 |       if (process.env.ART2_SCREENSHOTS) {
  33 |         fs.mkdirSync(process.env.ART2_SCREENSHOTS, { recursive: true });
  34 |         const name = path.join(process.env.ART2_SCREENSHOTS, `unexpected-${screen}-${width}-${testInfo.repeatEachIndex}-${testInfo.workerIndex}`);
  35 |         fs.writeFileSync(name + '.png', actual, { flag: 'wx' });
  36 |         fs.writeFileSync(name + '.json', JSON.stringify(await page.evaluate(() => ({ fontStatus: document.fonts.status, fonts: [...document.fonts].map(face => ({ family: face.family, status: face.status })), title: document.querySelector('.landing__title')?.getBoundingClientRect().toJSON() })), null, 2));
  37 |       }
  38 |     }
> 39 |     expect(actual.equals(baseline), `${screen} ${width}: default-off pixels changed from reviewed baseline`).toBe(true);
     |                                                                                                              ^ Error: landing 1280: default-off pixels changed from reviewed baseline
  40 |   }
  41 | });
  42 | 
```