# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> CSP classic 1600x900 light: painted canvas, zero violations
- Location: e2e/security.spec.ts:13:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.strip canvas')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.strip canvas') with timeout 5000ms
  - waiting for locator('.strip canvas')

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
  41 |       await page.getByTestId('class-picker-confirm-button').click();
  42 |       await expect(page.getByTestId('class-picker')).toHaveCount(0);
  43 |     }
  44 |     const canvas = page.locator(mode === 'classic' ? '.strip canvas' : '.v2-stage-canvas canvas');
> 45 |     await expect(canvas).toBeVisible();
     |                          ^ Error: expect(locator).toBeVisible() failed
  46 |     await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => {
  47 |       const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  48 |       return data.some((value, i) => i % 4 === 3 && value > 0);
  49 |     })).toBe(true);
  50 |     // Navigate the classic market as well as the initial Phaser screen.
  51 |     if (mode === 'classic') {
  52 |       await page.getByRole('button', { name: 'Menu', exact: true }).click();
  53 |       await page.getByRole('tab', { name: 'Market', exact: true }).click();
  54 |     }
  55 |     await page.waitForLoadState('networkidle');
  56 |     expect(violations).toEqual([]);
  57 |     expect(errors).toEqual([]);
  58 |     await page.evaluate(() => window.scrollTo(0, 0));
  59 |     if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: path.resolve(process.cwd(), `../../reports/s2-security/csp-${mode}-${width}-${colorScheme}.png`) });
  60 |     console.log(`CSP ${mode} ${width}x${height} ${colorScheme}: canvas painted; violations=${violations.length}; console/page errors=${errors.length}`);
  61 |   });
  62 | }
  63 | 
```