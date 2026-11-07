# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layout/arena.spec.ts >> boss arena 1280px no-preference
- Location: e2e/layout/arena.spec.ts:3:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5911/?dev=arena&fixture=ch1-loss", waiting until "load"

```

# Test source

```ts
  1  | import { test as base, expect } from '@playwright/test';
  2  | import { serverURL } from './server-ports';
  3  | import { classicURL, v2URL } from './servers';
  4  | 
  5  | export { expect } from '@playwright/test';
  6  | export type { Locator, Page } from '@playwright/test';
  7  | 
  8  | /** Import this test in specs so a misplaced file or baseURL override fails loudly. */
  9  | export const test = base.extend<{ buildGuard: void }>({
  10 |   buildGuard: [async ({ page, baseURL }, use, testInfo) => {
  11 |     const directory = testInfo.file.match(/[/\\]e2e[/\\](ui|layout|v2|qa|server)[/\\]/)?.[1];
  12 |     const v2 = directory !== undefined;
  13 |     const isErrorsNotice = testInfo.file.includes('errors-notice.spec.ts');
  14 |     const expectedProject = (directory === 'server' || isErrorsNotice) ? 'v2-server' : v2 ? (directory === 'v2' ? 'v2-loop' : 'stage-layout') : 'classic';
  15 |     expect(testInfo.project.name, 'Spec is assigned to the wrong build project').toBe(expectedProject);
  16 |     expect(baseURL, 'Use the project baseURL; do not override it in a spec').toBe((directory === 'server' || isErrorsNotice) ? serverURL : v2 ? v2URL : classicURL);
  17 |     const goto = page.goto.bind(page);
  18 |     let checked = false;
  19 |     page.goto = async (...args) => {
> 20 |       const response = await goto(...args);
     |                              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  21 |       // The arena and art-pilot developer previews intentionally render outside StageLayout.
  22 |       // Its project and origin are still checked above. Check the first normal page.
  23 |       const devParam = new URL(page.url()).searchParams.get('dev');
  24 |       if (!checked && devParam !== 'arena' && devParam !== 'art-pilot') {
  25 |         // Shared portals hide the painted background from assistive technology.
  26 |         // Keep the rendered-heading check; inaccessible background requires an active modal.
  27 |         const heading = page.getByRole('heading', { level: 1, name: 'Taskbar Hero', includeHidden: true });
  28 |         await expect(heading).toBeVisible();
  29 |         if (await heading.evaluate(el => Boolean(el.closest('[inert], [aria-hidden="true"]')))) {
  30 |           await expect(page.getByRole('dialog')).toBeVisible();
  31 |           await expect(page.locator('#root')).toHaveAttribute('inert', '');
  32 |           await expect(page.locator('#root')).toHaveAttribute('aria-hidden', 'true');
  33 |         } else {
  34 |           await expect(page.getByRole('heading', { level: 1, name: 'Taskbar Hero' })).toBeVisible();
  35 |         }
  36 |         await expect(page.locator('[data-game-v2="stage-v2-enabled"]'),
  37 |           `Expected the ${v2 ? 'v2' : 'classic'} build at ${baseURL}`).toHaveCount(v2 ? 1 : 0);
  38 |         checked = true;
  39 |       }
  40 |       return response;
  41 |     };
  42 |     await use();
  43 |   }, { auto: true }],
  44 | });
  45 | 
```