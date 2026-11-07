# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: server/cxr2-class-states.spec.ts >> CXR2 first class stays visible during save and can recover 1600
- Location: e2e/server/cxr2-class-states.spec.ts:6:35

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.evaluate: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "Taskbar Hero" [level=1]
  - main [ref=e5]:
    - tabpanel "Class" [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - paragraph [ref=e10]: Step 1 of 1 · New game
          - heading "Choose Your Class" [level=2] [ref=e11]
          - paragraph [ref=e12]: Pick your cat's class! You can switch anytime outside boss fights.
        - radiogroup "Cat classes" [ref=e13]:
          - 'radio "Warrior, Melee class. Attack speed 1.00s. Passive: Cleave: every 3rd swing also hits the next monster for 50%" [checked] [ref=e14] [cursor=pointer]':
            - generic [ref=e15]:
              - generic [ref=e16]:
                - 'generic "Warrior weapon: sword" [ref=e17]'
                - generic [ref=e27]:
                  - generic [ref=e28]: Warrior
                  - generic [ref=e29]: Melee
              - generic "Warrior fur color" [ref=e30]
            - paragraph [ref=e36]: "Cleave: every 3rd swing also hits the next monster for 50%"
            - generic "Warrior stat leanings" [ref=e37]:
              - generic [ref=e38]:
                - generic [ref=e39]: HP
                - generic [ref=e42]: 1x
              - generic [ref=e43]:
                - generic [ref=e44]: ATK
                - generic [ref=e47]: 1x
              - generic [ref=e48]:
                - generic [ref=e49]: DEF
                - generic [ref=e52]: 1x
            - generic [ref=e53]:
              - generic [ref=e54]: "Attack Speed:"
              - generic [ref=e55]: 1.00s
          - 'radio "Guardian, Melee class. Attack speed 1.40s. Passive: Bonk: each hit delays target attack by 500 ms" [ref=e56] [cursor=pointer]':
            - generic [ref=e57]:
              - generic [ref=e58]:
                - 'generic "Guardian weapon: hammer" [ref=e59]'
                - generic [ref=e68]:
                  - generic [ref=e69]: Guardian
                  - generic [ref=e70]: Melee
              - generic "Guardian fur color" [ref=e71]
            - paragraph [ref=e77]: "Bonk: each hit delays target attack by 500 ms"
            - generic "Guardian stat leanings" [ref=e78]:
              - generic [ref=e79]:
                - generic [ref=e80]: HP
                - generic [ref=e83]: 1.3x
              - generic [ref=e84]:
                - generic [ref=e85]: ATK
                - generic [ref=e88]: 1.35x
              - generic [ref=e89]:
                - generic [ref=e90]: DEF
                - generic [ref=e93]: 1.3x
            - generic [ref=e94]:
              - generic [ref=e95]: "Attack Speed:"
              - generic [ref=e96]: 1.40s
          - 'radio "Rogue, Melee class. Attack speed 0.80s. Passive: Twin Strike: strikes 2 times per attack" [ref=e97] [cursor=pointer]':
            - generic [ref=e98]:
              - generic [ref=e99]:
                - 'generic "Rogue weapon: daggers" [ref=e100]'
                - generic [ref=e108]:
                  - generic [ref=e109]: Rogue
                  - generic [ref=e110]: Melee
              - generic "Rogue fur color" [ref=e111]
            - paragraph [ref=e117]: "Twin Strike: strikes 2 times per attack"
            - generic "Rogue stat leanings" [ref=e118]:
              - generic [ref=e119]:
                - generic [ref=e120]: HP
                - generic [ref=e123]: 0.85x
              - generic [ref=e124]:
                - generic [ref=e125]: ATK
                - generic [ref=e128]: 0.3x
              - generic [ref=e129]:
                - generic [ref=e130]: DEF
                - generic [ref=e133]: 0.85x
            - generic [ref=e134]:
              - generic [ref=e135]: "Attack Speed:"
              - generic [ref=e136]: 0.80s
        - button "Start Adventure as Warrior" [ref=e138] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect, load, inspect } from '../support/server-fixture';
  2  | import { mkdirSync } from 'node:fs';
  3  | import { resolve } from 'node:path';
  4  | import { expectVisibleRoot, watchVisibleRoot } from '../support/visible-root';
  5  | 
  6  | for (const width of [1280, 1600]) test(`CXR2 first class stays visible during save and can recover ${width}`, async ({ page, request }) => {
  7  |   await watchVisibleRoot(page);
  8  |   await page.setViewportSize({ width, height: width * 9 / 16 });
  9  |   await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.continue());
  10 |   const session = await load(page, request, 'fresh');
> 11 |   await page.evaluate(() => document.fonts.ready);
     |              ^ Error: page.evaluate: Test timeout of 30000ms exceeded.
  12 |   let release!: () => void;
  13 |   const held = new Promise<void>(done => { release = done; });
  14 |   let refuse = true;
  15 |   await page.route('**/functions/v1/v2-choose-class', async route => {
  16 |     if (route.request().method() !== 'POST' || !refuse) return route.continue();
  17 |     await held;
  18 |     return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'server_busy' }) });
  19 |   });
  20 |   const capture = async (state: string) => {
  21 |     await page.clock.runFor(50);
  22 |     await expectVisibleRoot(page);
  23 |     expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
  24 |     if (process.env.CXR2_SCREENSHOTS) {
  25 |       mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
  26 |       await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, `class-${state}-${width}.png`) });
  27 |     }
  28 |   };
  29 |   try {
  30 |     const started = page.waitForRequest(request => request.url().endsWith('/v2-choose-class') && request.method() === 'POST');
  31 |     await page.getByTestId('class-picker-choose-button').click(); await started;
  32 |     await expect(page.getByTestId('class-picker')).toBeVisible();
  33 |     await expect(page.getByTestId('class-picker-choose-button')).toBeDisabled();
  34 |     await expect(page.getByTestId('class-picker-locked-notice')).toHaveCount(0);
  35 |     await expect(page.getByTestId('class-picker-choose-button')).toHaveAttribute('aria-busy', 'true');
  36 |     await capture('saving');
  37 |     release();
  38 |     await expect(page.getByRole('alert').filter({ hasText: 'Class selection did not go through' })).toBeVisible();
  39 |     await expect(page.getByTestId('class-picker-choose-button')).toBeEnabled();
  40 |     expect((await inspect(request, session)).raw.classId).toBeNull();
  41 |     await capture('save-error');
  42 |     refuse = false;
  43 |     await page.getByTestId('class-picker-choose-button').click();
  44 |     await expect(page.getByTestId('home-dashboard')).toBeVisible();
  45 |     expect((await inspect(request, session)).raw.classId).toBe('warrior');
  46 |   } finally { release(); }
  47 | });
  48 | 
```