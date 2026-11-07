# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/baseline-hud.spec.ts >> shared HUD keeps XP and every status chip visible at 1600x900
- Location: e2e/ui/baseline-hud.spec.ts:135:5

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
            - listitem "Fish 304" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: "304"
            - listitem "Yarn 40" [ref=e324]:
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: "40"
            - listitem "Cat Keys 3 of 5" [ref=e332]:
              - generic [aria-hidden] [ref=e335]: Cat Keys
              - generic [aria-hidden] [ref=e336]: 3/5
          - generic [ref=e338]:
            - generic [ref=e339]: Lv 21
            - progressbar "Experience" [ref=e340]
            - generic [aria-hidden] [ref=e342]: 104 / 579 XP
          - group "Chapter 2 Kitchen, round 6 of 10, 6 of 10 monsters" [ref=e344]:
            - generic [aria-hidden] [ref=e345]: Chapter 2 · Round 6 · 6/10
          - generic [ref=e346]: Power 372
      - generic [ref=e349]:
        - status [ref=e351]:
          - generic [aria-hidden] [ref=e352]: ●
          - generic [ref=e353]: Live
        - group "Wallet" [ref=e355]:
          - link "Get a browser wallet" [ref=e356] [cursor=pointer]:
            - /url: https://core.app
    - generic [ref=e357]:
      - heading "Taskbar Hero" [level=1] [ref=e358]
      - generic [ref=e359]: Candidate build, not live.
      - generic "Goal ladder" [ref=e360]:
        - generic [ref=e361]:
          - generic [ref=e362]: Soon
          - text: 44 foes to the chapter boss
        - generic [ref=e363]:
          - generic [ref=e364]: Later
          - text: Unlock Bathroom
      - generic [ref=e366]:
        - generic [aria-hidden] [ref=e367]: Next
        - button "Clear round 6 · 4 foes left" [ref=e368] [cursor=pointer]
    - main [ref=e369]:
      - tabpanel "Home" [ref=e371]:
        - generic [ref=e372]:
          - generic [ref=e373]:
            - region "Game stage" [ref=e374]:
              - text: CAT CAFÉ QUEST / EVENING PATROL
              - generic [ref=e375]:
                - img "Cat exploring the chapter" [ref=e376]
                - generic "Stage progress":
                  - generic: Chapter 2 · Round 6 / 10
                  - generic "6 / 10 kills; last kill is elite":
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
                    - generic: 6 / 10
                - status: Round start
                - generic: Fight preview · rewards on claim
            - region "Event log" [ref=e378]:
              - generic [ref=e379]: Battle Log
              - generic [ref=e382]:
                - generic [ref=e383]:
                  - generic [ref=e384]: ›
                  - generic [ref=e385]: Mochi gathered 104 Fish and 5 Yarn (+1 gear)
                - generic [ref=e386]:
                  - generic [ref=e387]: ›
                  - generic [ref=e388]: 🌟 Mochi leveled up to Lv. 21!
                - generic [ref=e389]:
                  - generic [ref=e390]: ›
                  - generic [ref=e391]: ⚔️ Advanced to Chapter 2, Round 6
          - region "Home details" [ref=e392]:
            - generic [ref=e393]:
              - generic [ref=e394]:
                - img "Mochi, a tabby cat with a blue scarf" [ref=e396]
                - generic [ref=e398]:
                  - heading "Mochi" [level=2] [ref=e399]
                  - generic [ref=e400]:
                    - generic [ref=e401]: Warrior
                    - generic [ref=e402]: Lv. 21
                  - generic [ref=e403]:
                    - text: "Power:"
                    - strong [ref=e404]: "372"
              - generic [ref=e405]:
                - heading "Core Stats" [level=3] [ref=e406]
                - generic [ref=e407]:
                  - generic [ref=e408]:
                    - term [ref=e409]: HP
                    - definition [ref=e410]: "598"
                  - generic [ref=e411]:
                    - term [ref=e412]: ATK
                    - definition [ref=e413]: "76"
                  - generic [ref=e414]:
                    - term [ref=e415]: Crit chance
                    - definition [ref=e416]: 25%
                  - generic [ref=e417]:
                    - term [ref=e418]: DEF
                    - definition [ref=e419]: "40"
                  - generic [ref=e420]:
                    - term [ref=e421]: Speed
                    - definition [ref=e422]: 1.62/s
            - generic [ref=e423]:
              - generic [ref=e424]:
                - heading "Next Goal" [level=2] [ref=e425]
                - generic [ref=e426]: Ch. 2 · Round 6
              - generic [ref=e427]:
                - generic [ref=e428]:
                  - generic [ref=e429]:
                    - generic [ref=e430]: Monster Hunt
                    - generic [ref=e431]: 6 / 10
                  - progressbar "Progress through this round" [ref=e432]
                - paragraph [ref=e434]: Defeat 4 more monsters to reach the next stage.
                - generic [ref=e435]:
                  - generic [ref=e436]:
                    - generic [ref=e437]: Now
                    - text: Clear round 6 · 4 foes left
                  - generic [ref=e438]:
                    - generic [ref=e439]: Soon
                    - text: 44 foes to the chapter boss
                  - generic [ref=e440]:
                    - generic [ref=e441]: Later
                    - text: Unlock Bathroom
                - button "Go to map" [ref=e442] [cursor=pointer]
            - generic [ref=e443]:
              - heading "Recent loot" [level=2] [ref=e445]
              - region "Recent loot details" [ref=e446]:
                - region [ref=e447]:
                  - heading "Recent finds" [level=3] [ref=e448]
                  - list "Loot lines" [ref=e449]:
                    - listitem [ref=e450]:
                      - generic [aria-hidden] [ref=e451]: ★
                      - generic [ref=e452]: Level up! +1
                    - listitem [ref=e453]:
                      - generic [aria-hidden] [ref=e454]: XP
                      - generic [ref=e455]: +492 XP
                    - listitem [ref=e456]:
                      - generic [ref=e463]: +104 Fish
                    - listitem [ref=e464]:
                      - generic [ref=e470]: +5 Yarn
                    - listitem [ref=e471]:
                      - generic [ref=e475]: +1 Cat Key
                    - listitem [ref=e476]:
                      - generic [ref=e484]: +1 Fluff Tuft
                  - list "Items" [ref=e485]:
                    - listitem [ref=e486]:
                      - generic [ref=e495]:
                        - generic [ref=e496]: Patched Mitten Paws
                        - generic [ref=e497]:
                          - text: Common ·
                          - generic [ref=e498]: Lv 10
```

# Test source

```ts
  57  |     return problems;
  58  |   });
  59  |   expect(clipped).toEqual([]);
  60  |   const action = page.getByTestId('next-hint').getByRole('button');
  61  |   await expect(action).toBeVisible();
  62  |   const text = await action.innerText();
  63  |   await expect(action).toHaveAccessibleName(text);
  64  |   const textGeometry = await action.evaluate(element => {
  65  |     const range = document.createRange();
  66  |     range.selectNodeContents(element);
  67  |     const button = element.getBoundingClientRect();
  68  |     const rects = [...range.getClientRects()];
  69  |     return {
  70  |       text: element.textContent,
  71  |       fontSize: parseFloat(getComputedStyle(element).fontSize),
  72  |       width: button.width,
  73  |       textWidth: Math.max(...rects.map(rect => rect.width)),
  74  |       unclipped: element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1,
  75  |       allTextInside: rects.length > 0 && rects.every(rect => rect.width > 0 && rect.left >= button.left - 1 && rect.right <= button.right + 1 && rect.top >= button.top - 1 && rect.bottom <= button.bottom + 1),
  76  |     };
  77  |   });
  78  |   expect(textGeometry.text).toBe(text);
  79  |   expect(textGeometry.fontSize).toBeGreaterThanOrEqual(12);
  80  |   expect(textGeometry.width).toBeGreaterThan(100);
  81  |   expect(textGeometry.unclipped).toBe(true);
  82  |   expect(textGeometry.allTextInside).toBe(true);
  83  |   await expect(page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab')).toHaveCount(7);
  84  |   return { xp, textGeometry };
  85  | }
  86  | 
  87  | async function activateGuidanceWithKeyboard(page: Page, expected: 'map' | 'bag' | 'home') {
  88  |   const action = page.getByTestId('next-hint').getByRole('button');
  89  |   // Reach the action through sequential keyboard navigation, including its focus ring.
  90  |   for (let i = 0; i < 20 && !await action.evaluate(element => element === document.activeElement); i++) await page.keyboard.press('Tab');
  91  |   await expect(action).toBeFocused();
  92  |   expect(await action.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  93  |   await page.keyboard.press('Enter');
  94  |   await expect(page.locator('.app-shell')).toHaveAttribute('data-active-screen', expected);
  95  |   await expect(page.getByTestId(`nav-${expected}`)).toHaveAttribute('aria-selected', 'true');
  96  |   await expect(page.getByRole('tabpanel', { name: expected === 'map' ? 'Map' : expected === 'home' ? 'Home' : 'Bag', exact: true })).toBeVisible();
  97  | }
  98  | 
  99  | for (const viewport of sizes) {
  100 |   for (const [fish, yarn] of [[8788, 256], [1_234_567, 12_345]]) {
  101 |     test(`late chapter HUD keeps full balances and sync separate at ${viewport.width}x${viewport.height} (${fish})`, async ({ page }) => {
  102 |       const errors: string[] = [];
  103 |       page.on('pageerror', error => errors.push(error.message));
  104 |       page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  105 |       await page.setViewportSize(viewport);
  106 |       await page.emulateMedia({ reducedMotion: 'reduce' });
  107 |       const save = mockV2Save('bossReadyStrong', { nowMs: Date.now(), chapter: 5 });
  108 |       save.state.stacks.fish = fish!;
  109 |       save.state.stacks.yarn = yarn!;
  110 |       save.state.stacks.catKey = 4;
  111 |       // Match the observed post-loss state, including its ordinary Explore guidance.
  112 |       save.state.bossCooldownUntil = Math.floor(Date.now() / 1000) + v2.V2_CONFIG.boss.lossCooldownSeconds;
  113 |       await page.addInitScript(({ key, save }) => {
  114 |         localStorage.setItem(key, JSON.stringify(save));
  115 |         localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  116 |       }, { key, save });
  117 |       await page.goto('/');
  118 |       await page.evaluate(() => document.fonts.ready);
  119 |       await expectReadableChrome(page);
  120 |       const separation = await page.locator('.shell-hud').evaluate(hud => ({
  121 |         powerRight: hud.querySelector('.hud-power-chip')!.getBoundingClientRect().right,
  122 |         syncLeft: hud.querySelector('.v2-sync-status-slot')!.getBoundingClientRect().left,
  123 |       }));
  124 |       expect(separation.powerRight).toBeLessThanOrEqual(separation.syncLeft);
  125 |       await page.getByRole('tab', { name: 'Map', exact: true }).click();
  126 |       await expectReadableChrome(page);
  127 |       expect(errors).toEqual([]);
  128 |       if (process.env.CXR2_SCREENSHOTS) {
  129 |         mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
  130 |         await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, `late-hud-${viewport.width}-${fish}.png`), animations: 'disabled' });
  131 |       }
  132 |     });
  133 |   }
  134 |   for (const gated of [false, true]) {
  135 |     test(`shared HUD keeps XP and every status chip visible at ${viewport.width}x${viewport.height}${gated ? ' when gated' : ''}`, async ({ page }) => {
  136 |       const errors: string[] = [];
  137 |       page.on('pageerror', error => errors.push(error.message));
  138 |       page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  139 |       await page.setViewportSize(viewport);
  140 |       await page.emulateMedia({ reducedMotion: 'reduce' });
  141 |       const nowMs = Date.now();
  142 |       const frontier = mockV2Save('midGame', { nowMs, chapter: 2 });
  143 |       const save = gated ? mockV2Save('bossReadyWeak', { nowMs, chapter: 2 }) : frontier;
  144 |       if (gated) {
  145 |         save.state.round = frontier.state.round;
  146 |         save.state.kills = frontier.state.kills;
  147 |         save.state.bestStage = frontier.state.bestStage;
  148 |       }
  149 |       const maxXp = v2.xpToNextV2(save.state.level);
  150 |       save.state.xp = Math.floor(maxXp / 4);
  151 |       await page.clock.install({ time: nowMs });
  152 |       await page.addInitScript(({ key, save }) => {
  153 |         if (!localStorage.getItem(key)) localStorage.setItem(key, save);
  154 |         localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  155 |       }, { key, save: JSON.stringify(save) });
  156 |       await page.goto('/');
> 157 |       await page.evaluate(() => document.fonts.ready);
      |                  ^ Error: page.evaluate: Test timeout of 30000ms exceeded.
  158 |       const hud = page.getByRole('region', { name: 'Cat status' });
  159 |       const experience = hud.getByRole('progressbar', { name: 'Experience' });
  160 |       await expect(experience).toHaveAttribute('aria-valuenow', String(save.state.xp));
  161 |       const before = await expectReadableChrome(page);
  162 |       expect(before.xp.fill).toBeGreaterThan(0);
  163 |       if (gated) await expect(hud.getByRole('status')).toContainText('Needs about');
  164 |       expect(await hud.locator('.hud-xp-fill').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  165 |       expect(await hud.locator('.hud-xp-fill').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(107, 224, 138)');
  166 |       await expect(page.getByTestId('next-hint').getByRole('button')).toHaveText(gated
  167 |         ? 'Compare gear to pass this power wall' : 'Clear round 5 · 5 foes left');
  168 |       await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toHaveCount(1);
  169 |       await activateGuidanceWithKeyboard(page, gated ? 'bag' : 'home');
  170 |       await expectReadableChrome(page);
  171 |       // Change actual saved XP, then rehydrate the app; do not mutate bar styles or semantics.
  172 |       save.state.xp = Math.floor(maxXp * 3 / 4);
  173 |       await page.evaluate(({ key, save }) => localStorage.setItem(key, save), { key, save: JSON.stringify(save) });
  174 |       await page.reload();
  175 |       await expect(experience).toHaveAttribute('aria-valuenow', String(save.state.xp));
  176 |       await page.evaluate(() => document.fonts.ready);
  177 |       const after = await expectReadableChrome(page);
  178 |       expect(after.xp.fill).toBeGreaterThan(before.xp.fill + 70);
  179 |       expect(after.xp.width).toBe(before.xp.width);
  180 |       console.log(JSON.stringify({ viewport, gated, before, after }));
  181 |       expect(errors).toEqual([]);
  182 |       if (process.env.SCREENSHOTS === '1' && gated) {
  183 |         const directory = resolve('../../reports/scorecard/base0/hud-repair/screens');
  184 |         mkdirSync(directory, { recursive: true });
  185 |         const png = await page.screenshot({ path: resolve(directory, `repaired-${viewport.width}.png`), animations: 'disabled' });
  186 |         expect(png.length).toBeLessThan(200 * 1024);
  187 |       }
  188 |     });
  189 |   }
  190 | 
  191 |   for (const state of ['normal', 'offline', '429', '503'] as const) {
  192 |     test(`guidance remains readable with fallback fonts and ${state} at ${viewport.width}x${viewport.height}`, async ({ browser, request }) => {
  193 |       // The same spec covers the demo preview above and the production HTTP client below.
  194 |       // Use an explicit separate loopback context; the standard fixture blocks remote requests.
  195 |       const context = await browser.newContext({ baseURL: serverURL, viewport, reducedMotion: 'reduce' });
  196 |       try {
  197 |         const page = await context.newPage();
  198 |         const pageErrors: string[] = [];
  199 |         const consoleErrors: { message: string; url: string }[] = [];
  200 |         page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ message: message.text(), url: message.location().url }); });
  201 |         page.on('pageerror', error => pageErrors.push(error.message));
  202 |         if (state === '429' || state === '503') {
  203 |           await page.route('**/functions/v1/v2-claim', route => route.fulfill({
  204 |             status: Number(state),
  205 |             headers: { 'Retry-After': '3', 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-expose-headers': 'Retry-After' },
  206 |             body: JSON.stringify(state === '429' ? { error: 'rate_limited', retryAfter: 3 } : { error: 'server_busy' }),
  207 |           }));
  208 |         }
  209 |         const session = await load(page, request, 'stocked');
  210 |         await expect(page.locator('[data-game-v2="stage-v2-enabled"]')).toHaveCount(1);
  211 |         // Prove the actual fallback font path, even if fonts were previously cached by Chromium.
  212 |         await page.addStyleTag({ content: ':root { --font-body: sans-serif; --font-display: monospace; --font-num: monospace; }' });
  213 |         const panel = await tab(page, 'Forge');
  214 |         if (state === 'offline') {
  215 |           await context.setOffline(true);
  216 |           await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  217 |           await expect(panel.getByTestId('action-notice')).toHaveText('You are offline. Your cat keeps working; we will sync when you are back.');
  218 |         } else if (state === '429' || state === '503') {
  219 |           await advance(request, session, 600);
  220 |           const response = page.waitForResponse(r => r.url().endsWith('/v2-claim') && r.request().method() === 'POST');
  221 |           await page.clock.fastForward(30_000);
  222 |           expect((await response).status()).toBe(Number(state));
  223 |           await expect(panel.getByTestId('action-notice')).toHaveText(state === '429'
  224 |             ? 'Easy, hero! Try again in 3 s.' : 'The cafe kitchen is busy. Nothing was spent. Try again in a minute.');
  225 |         }
  226 |         await expect(page.locator('header [data-sync-status]')).toHaveAttribute('data-sync-status', state === 'normal' ? 'live' : state === 'offline' ? 'offline' : 'error');
  227 |         const measured = await expectReadableChrome(page);
  228 |         expect(await page.getByTestId('next-hint').getByRole('button').evaluate(element => getComputedStyle(element).fontFamily)).toBe('sans-serif');
  229 |         await expect(page.getByTestId('next-hint').getByRole('button')).toHaveText('Clear round 1 · 6 foes left');
  230 |         await activateGuidanceWithKeyboard(page, 'home');
  231 |         await expectReadableChrome(page);
  232 |         expect(pageErrors).toEqual([]);
  233 |         const unexpected = consoleErrors.filter(error => {
  234 |           const expectedFontBlock = error.url.startsWith('https://fonts.googleapis.com/') && ['Failed to load resource: net::ERR_BLOCKED_BY_CLIENT', 'Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector'].includes(error.message);
  235 |           const expectedResponse = error.url.endsWith('/v2-claim') && (state === '429' || state === '503') && error.message === `Failed to load resource: the server responded with a status of ${state} (${state === '429' ? 'Too Many Requests' : 'Service Unavailable'})`;
  236 |           return !expectedFontBlock && !expectedResponse;
  237 |         });
  238 |         expect(unexpected).toEqual([]);
  239 |         console.log(JSON.stringify({ viewport, state, fallback: true, ...measured, consoleErrors }));
  240 |       } finally {
  241 |         await context.close();
  242 |       }
  243 |     });
  244 |   }
  245 | }
  246 | 
```