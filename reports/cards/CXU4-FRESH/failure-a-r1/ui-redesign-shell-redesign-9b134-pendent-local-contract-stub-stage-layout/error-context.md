# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/redesign-shell.spec.ts >> redesign shell 1280x720 >> the same route smoke passes an independent local contract stub
- Location: e2e/ui/redesign-shell.spec.ts:41:5

# Error details

```
Error: help: .help-topic-list

expect(locator).toBeVisible() failed

Locator: getByTestId('screen').locator('.help-topic-list').visible().first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - help: .help-topic-list getByTestId('screen').locator('.help-topic-list').visible().first() with timeout 5000ms
  - waiting for getByTestId('screen').locator('.help-topic-list').visible().first()

```

```yaml
- navigation "Game navigation":
  - link "Home":
    - /url: "#home"
  - link "Bag":
    - /url: "#bag"
  - link "Map":
    - /url: "#map"
  - link "Forge":
    - /url: "#forge"
  - link "Market":
    - /url: "#market"
  - link "Hero":
    - /url: "#hero"
  - link "Help":
    - /url: "#help"
- banner:
  - text: Gold 100 Shards 50 Keys 1 Level 5 Power 100
  - button "Wallet"
- main:
  - heading "Taskbar Hero" [level=1]
  - heading "Help" [level=2]
  - list:
    - listitem: Chapter chests
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  | import manifest from './screen-manifest.json' with { type: 'json' };
  3  | import { layoutFindings } from './layout-findings.mjs';
  4  | 
  5  | /** Shared by the live app and independent fixture: the stub cannot bypass assertions. */
  6  | export async function smokeShell(page: Page, errors: string[]) {
  7  |   const rail = page.getByTestId(manifest.shell.railTestId);
  8  |   await expect(rail).toBeVisible();
  9  |   await expect(rail.locator('[data-testid^="nav-"]')).toHaveCount(manifest.shell.navTestIds.length);
  10 |   for (const id of manifest.shell.navTestIds) await expect(rail.getByTestId(id)).toBeVisible();
  11 |   for (const screen of manifest.screens) {
  12 |     await rail.getByTestId(screen.navTestId).click();
  13 |     await expect(rail.getByTestId(screen.navTestId)).toHaveAttribute('aria-current', 'page');
  14 |     await expect(rail.locator('[aria-current="page"]')).toHaveCount(1);
  15 |     const subnav = 'subnavTestId' in screen ? screen.subnavTestId : undefined;
  16 |     if (subnav) {
  17 |       await page.getByTestId(subnav).click();
  18 |       await expect(page.getByTestId(subnav)).toHaveAttribute('aria-selected', 'true');
  19 |     }
  20 |     const hud = page.getByTestId(manifest.shell.hudTestId);
  21 |     await expect(hud).toBeVisible();
  22 |     for (const id of manifest.shell.hudTestIds) await expect(hud.getByTestId(id)).toBeVisible();
  23 |     const root = page.getByTestId(screen.screenTestId);
  24 |     await expect(root).toBeVisible();
> 25 |     for (const selector of screen.required) await expect(root.locator(selector).filter({ visible: true }).first(), `${screen.id}: ${selector}`).toBeVisible();
     |                                                                                                                                                 ^ Error: help: .help-topic-list
  26 |     // Let the browser lay out the new screen before taking a geometry measurement.
  27 |     await page.evaluate(() => new Promise<void>(ok => requestAnimationFrame(() => requestAnimationFrame(() => ok()))));
  28 |     const findings = await page.evaluate(layoutFindings);
  29 |     expect(findings.documentScroll, `${screen.id}: document scrolls ${JSON.stringify(findings.dimensions)}`).toBe(false);
  30 |     expect(findings.horizontalOverflow, `${screen.id}: horizontal overflow`).toEqual([]);
  31 |     expect(findings.elementOverlap, `${screen.id}: element overlap`).toEqual([]);
  32 |     expect(errors, `${screen.id}: console/page errors`).toEqual([]);
  33 |   }
  34 |   expect(errors, 'Console/page errors after the final screen').toEqual([]);
  35 | }
  36 | 
```