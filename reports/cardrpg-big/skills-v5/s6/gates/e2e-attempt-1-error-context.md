# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/squad.spec.ts >> a local fight never writes storage or contacts a game API
- Location: e2e/ui/squad.spec.ts:21:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.sq-hud')
Expected pattern: /3\.[0-9]s/
Received string:  "Guest squad 3 catsFish found 0 cosmeticRun time 0.1s"
Timeout: 10000ms

Call log:
  - Expect "toContainText" locator('.sq-hud') with timeout 10000ms
  - waiting for locator('.sq-hud')
    2 × locator resolved to <div class="sq-hud">…</div>
      - unexpected value "Guest squad 3 catsFish found 0 cosmeticRun time 0.0s"
    22 × locator resolved to <div class="sq-hud">…</div>
       - unexpected value "Guest squad 3 catsFish found 0 cosmeticRun time 0.1s"

```

```yaml
- text: Guest squad 3 cats Fish found 0 cosmetic Run time 0.1s
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const url = '/?demo&squad=1';
  4  | test('squad requires demo context and its render chunks stay unloaded when off', async ({ page }) => {
  5  |   const loaded: string[] = []; page.on('request', r => loaded.push(r.url()));
  6  |   const scripts: Promise<string>[] = [];
  7  |   page.on('response', r => { if (r.status() === 200 && /\/assets\/.*\.js(?:\?|$)/.test(r.url())) scripts.push(r.text()); });
  8  |   await page.goto('/?demo');
  9  |   await expect(page.getByRole('heading', { name: 'Taskbar Hero', level: 1, includeHidden: true })).toBeVisible();
  10 |   await expect(page.getByTestId('squad-prototype')).toHaveCount(0);
  11 |   expect(loaded.some(u => /SquadApp|SquadScene|art\/squad/.test(u))).toBe(false);
  12 |   // Entry chunks can be renamed by the bundler; inspect actually requested code,
  13 |   // not only filenames. The squad UI marker must be absent from the off graph.
  14 |   expect((await Promise.all(scripts)).some(s => s.includes('squad-prototype'))).toBe(false);
  15 |   await page.goto('/?squad=1');
  16 |   await expect(page.getByRole('heading', { name: 'Taskbar Hero', level: 1, includeHidden: true })).toBeVisible();
  17 |   await expect(page.getByTestId('squad-prototype')).toHaveCount(0);
  18 |   expect((await Promise.all(scripts)).some(s => s.includes('squad-prototype'))).toBe(false);
  19 | });
  20 | 
  21 | test('a local fight never writes storage or contacts a game API', async ({ page }) => {
  22 |   await page.addInitScript(() => {
  23 |     Object.assign(window, { squadStorageWrites: [] as string[] });
  24 |     const original = Storage.prototype.setItem;
  25 |     Storage.prototype.setItem = function (key, value) { (window as unknown as { squadStorageWrites: string[] }).squadStorageWrites.push(key); return original.call(this, key, value); };
  26 |   });
  27 |   const requests: string[] = []; page.on('request', r => { if (r.method() !== 'GET' || /\/functions\/|\/api\/|supabase|wallet/i.test(r.url())) requests.push(r.url()); });
  28 |   await page.goto(url); await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
> 29 |   await expect(page.locator('.sq-hud')).toContainText(/3\.[0-9]s/, { timeout: 10000 });
     |                                         ^ Error: expect(locator).toContainText(expected) failed
  30 |   await page.getByRole('button', { name: 'Pause', exact: true }).click();
  31 |   expect(await page.evaluate(() => (window as unknown as { squadStorageWrites: string[] }).squadStorageWrites)).toEqual([]);
  32 |   expect(requests).toEqual([]);
  33 |   await expect(page.locator('.sq-prototype')).toHaveText('Prototype - Squad Combat. Candidate build, not live.');
  34 | });
  35 | 
  36 | for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  37 |   test(`eight foes, arena and all ultimate buttons fit ${size.width}×${size.height}`, async ({ page }) => {
  38 |     await page.setViewportSize(size); await page.goto(url);
  39 |     await page.getByRole('button', { name: 'Training', exact: true }).click();
  40 |     await expect(page.locator('.sq-targets button')).toHaveCount(8);
  41 |     await expect(page.locator('canvas')).toHaveCount(1);
  42 |     for (const button of await page.locator('.sq-ultimate').all()) {
  43 |       const box = await button.boundingBox(); expect(box).not.toBeNull();
  44 |       expect(box!.y + box!.height).toBeLessThanOrEqual(size.height); expect(box!.x).toBeGreaterThanOrEqual(0);
  45 |     }
  46 |     const canvas = await page.locator('canvas').boundingBox();
  47 |     expect(canvas!.y + canvas!.height).toBeLessThan(size.height);
  48 |     expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
  49 |   });
  50 | }
  51 | 
  52 | test('target buttons and inspect dialog are keyboard reachable; logs start closed', async ({ page }) => {
  53 |   await page.goto(url);
  54 |   const target = page.locator('.sq-targets button').last(); await target.focus(); await page.keyboard.press('Enter');
  55 |   await expect(target).toHaveAttribute('aria-pressed', 'true');
  56 |   await expect(page.locator('.sq-footer details')).not.toHaveAttribute('open', '');
  57 |   await page.getByRole('button', { name: 'Mochi' }).click();
  58 |   await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape');
  59 |   await expect(page.getByRole('dialog')).not.toBeVisible();
  60 |   await expect(page.getByRole('button', { name: 'Mochi' })).toBeFocused();
  61 | });
  62 | 
  63 | test('reduced motion starts calm while retaining zones and controls', async ({ page }) => {
  64 |   await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(url);
  65 |   await expect(page.getByRole('checkbox', { name: /Calm effects/ })).toBeChecked();
  66 |   await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  67 |   await expect(page.locator('.sq-danger')).toContainText(/Spool Charge|Mochi holds/, { timeout: 10000 });
  68 |   await expect(page.locator('canvas')).toBeVisible();
  69 | });
  70 | 
  71 | test('production excludes the opt-in development controls and review hook', async ({ page }) => {
  72 |   await page.goto(url + '&squadDebug=1');
  73 |   await expect(page.locator('.sq-debug')).toHaveCount(0);
  74 |   expect(await page.evaluate(() => '__squadReview' in window)).toBe(false);
  75 | });
  76 | 
```