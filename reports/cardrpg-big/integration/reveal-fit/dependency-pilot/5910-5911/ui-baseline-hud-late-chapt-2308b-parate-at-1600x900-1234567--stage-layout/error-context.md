# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/baseline-hud.spec.ts >> late chapter HUD keeps full balances and sync separate at 1600x900 (1234567)
- Location: e2e/ui/baseline-hud.spec.ts:101:5

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
            - listitem "Fish 1,236,031" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: 1,236,031
            - listitem "Yarn 12,387" [ref=e324]:
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: 12,387
            - listitem "Cat Keys 5 of 5" [ref=e332]:
              - generic [aria-hidden] [ref=e335]: Cat Keys
              - generic [aria-hidden] [ref=e336]: 5/5
          - generic [ref=e338]:
            - generic [ref=e339]: Lv 60
            - progressbar "Experience" [ref=e340]
            - generic [aria-hidden] [ref=e341]: 0 / 48,086 XP
          - group "Chapter 5 Night Rooftops, round 10 of 10, 10 of 10 monsters" [ref=e343]:
            - generic [aria-hidden] [ref=e344]: Chapter 5 · Round 10 · 10/10
          - generic [ref=e345]: Power 10,479
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
          - text: Retry after 38s · your key was kept
        - generic [ref=e362]:
          - generic [ref=e363]: Later
          - text: Collect Moon Pearl for a Cat Relic
      - generic [ref=e365]:
        - generic [aria-hidden] [ref=e366]: Next
        - button "Boss rests · retry in 38s" [ref=e367] [cursor=pointer]
    - main [ref=e368]:
      - tabpanel "Home" [ref=e370]:
        - generic [ref=e371]:
          - generic [ref=e372]:
            - region "Game stage" [ref=e373]:
              - text: CAT CAFÉ QUEST / EVENING PATROL
              - generic [ref=e374]:
                - img "Cat exploring the chapter" [ref=e375]
                - generic "Stage progress":
                  - generic: Chapter 5 · Round 10 / 10
                  - generic "10 / 10 kills; last kill is elite":
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
                    - generic: 10 / 10
                - status [ref=e377]:
                  - button "Fight the boss" [ref=e378] [cursor=pointer]
                - generic: Boss ready
            - region "Event log" [ref=e379]:
              - generic [ref=e380]: Battle Log
              - generic [ref=e384]:
                - generic [ref=e385]: ›
                - generic [ref=e386]: Mochi gathered 1464 Fish and 42 Yarn (+1 gear)
          - region "Home details" [ref=e387]:
            - generic [ref=e388]:
              - generic [ref=e389]:
                - img "Mochi, a tabby cat with a blue scarf" [ref=e391]
                - generic [ref=e393]:
                  - heading "Mochi" [level=2] [ref=e394]
                  - generic [ref=e395]:
                    - generic [ref=e396]: Warrior
                    - generic [ref=e397]: Lv. 60
                  - generic [ref=e398]:
                    - text: "Power:"
                    - strong [ref=e399]: 10,479
              - generic [ref=e400]:
                - heading "Core Stats" [level=3] [ref=e401]
                - generic [ref=e402]:
                  - generic [ref=e403]:
                    - term [ref=e404]: HP
                    - definition [ref=e405]: "4104"
                  - generic [ref=e406]:
                    - term [ref=e407]: ATK
                    - definition [ref=e408]: "467"
                  - generic [ref=e409]:
                    - term [ref=e410]: Crit chance
                    - definition [ref=e411]: 75%
                  - generic [ref=e412]:
                    - term [ref=e413]: DEF
                    - definition [ref=e414]: "241"
                  - generic [ref=e415]:
                    - term [ref=e416]: Speed
                    - definition [ref=e417]: 2.00/s
            - generic [ref=e418]:
              - generic [ref=e419]:
                - heading "Next Goal" [level=2] [ref=e420]
                - generic [ref=e421]: Ch. 5 · Round 10
              - generic [ref=e422]:
                - generic [ref=e423]:
                  - generic [ref=e424]:
                    - generic [ref=e425]: Chapter cleared
                    - generic [ref=e426]: 10 / 10
                  - progressbar "Progress through this round" [ref=e427]
                - paragraph [ref=e429]: Retry after 38s · your key was kept
                - generic [ref=e430]:
                  - generic [ref=e431]:
                    - generic [ref=e432]: Now
                    - text: Boss rests · retry in 38s
                  - generic [ref=e433]:
                    - generic [ref=e434]: Soon
                    - text: Retry after 38s · your key was kept
                  - generic [ref=e435]:
                    - generic [ref=e436]: Later
                    - text: Collect Moon Pearl for a Cat Relic
                - button "Go to map" [ref=e437] [cursor=pointer]
            - generic [ref=e438]:
              - heading "Recent loot" [level=2] [ref=e440]
              - region "Recent loot details" [ref=e441]:
                - region [ref=e442]:
                  - heading "Recent finds" [level=3] [ref=e443]
                  - list "Loot lines" [ref=e444]:
                    - listitem [ref=e445]:
                      - generic [ref=e452]: +1,464 Fish
                    - listitem [ref=e453]:
                      - generic [ref=e459]: +42 Yarn
                    - listitem [ref=e460]:
                      - generic [ref=e464]: +1 Cat Key
                  - list "Items" [ref=e465]:
                    - listitem [ref=e466]:
                      - generic [ref=e475]:
                        - generic [ref=e476]: Scuffed Ranger Gloves
                        - generic [ref=e477]:
                          - text: Common ·
                          - generic [ref=e478]: Lv 10
```

# Test source

```ts
  18  |     const track = element.getBoundingClientRect();
  19  |     const fill = element.firstElementChild!.getBoundingClientRect();
  20  |     return { width: track.width, height: track.height, fill: fill.width, inner: element.clientWidth,
  21  |       now: Number(element.getAttribute('aria-valuenow')), max: Number(element.getAttribute('aria-valuemax')) };
  22  |   });
  23  |   expect(xp.width).toBeGreaterThanOrEqual(150);
  24  |   expect(xp.width).toBeLessThanOrEqual(170);
  25  |   expect(xp.height).toBe(10);
  26  |   expect(xp.fill).toBeCloseTo(xp.inner * xp.now / xp.max, 1);
  27  |   const geometry = await hud.evaluate(root => {
  28  |     const outer = root.getBoundingClientRect();
  29  |     return [...root.querySelectorAll('.hud-level-xp,.hud-progress-chip,.hud-stack-item,.hud-power-chip')].map(node => {
  30  |       const rect = node.getBoundingClientRect();
  31  |       return {
  32  |         inside: rect.left >= outer.left && rect.right <= outer.right && rect.top >= outer.top && rect.bottom <= outer.bottom,
  33  |         unclipped: node.scrollWidth <= node.clientWidth + 1,
  34  |       };
  35  |     });
  36  |   });
  37  |   const bounds = await hud.evaluate(root => ({ outer: root.getBoundingClientRect().toJSON(), chips: [...root.querySelectorAll('.hud-level-xp,.hud-progress-chip,.hud-stack-item,.hud-power-chip')].map(node => ({ name: node.className, text: node.textContent, rect: node.getBoundingClientRect().toJSON() })) }));
  38  |   expect(geometry, JSON.stringify(bounds)).toEqual(Array.from({ length: 6 }, () => ({ inside: true, unclipped: true })));
  39  |   const clipped = await page.locator('.shell-body').evaluate(root => {
  40  |     const problems: string[] = [];
  41  |     const header = root.querySelector('header')!.getBoundingClientRect();
  42  |     const context = root.querySelector('.shell-context')!.getBoundingClientRect();
  43  |     const screen = root.querySelector('main')!.getBoundingClientRect();
  44  |     if (header.bottom > context.top || context.bottom > screen.top) problems.push('header/context/screen overlap');
  45  |     const selector = '.shell-hud,.hud-bar,.hud-level-xp,.hud-xp-track,.hud-progress-chip,.hud-stack-item,.hud-power-chip,.hud-power-hint,.hud-right,.v2-sync-status-slot,.hud-wallet-slot,.shell-context,.v2-title,.v2-hint,.v2-hint-btn';
  46  |     for (const node of root.querySelectorAll<HTMLElement>(selector)) {
  47  |       const rect = node.getBoundingClientRect();
  48  |       if (rect.width <= 0 || rect.height <= 0) problems.push(`${node.className}: empty box`);
  49  |       if (rect.left < 0 || rect.right > innerWidth || rect.top < 0 || rect.bottom > innerHeight) problems.push(`${node.className}: outside viewport`);
  50  |       for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
  51  |         const parent = ancestor.getBoundingClientRect(), style = getComputedStyle(ancestor);
  52  |         if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && (rect.left < parent.left - 1 || rect.right > parent.right + 1)) problems.push(`${node.className}: horizontal ancestor clipping`);
  53  |         if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY) && (rect.top < parent.top - 1 || rect.bottom > parent.bottom + 1)) problems.push(`${node.className}: vertical ancestor clipping`);
  54  |       }
  55  |     }
  56  |     if (document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight) problems.push('document scroll');
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
> 118 |       await page.evaluate(() => document.fonts.ready);
      |                  ^ Error: page.evaluate: Test timeout of 30000ms exceeded.
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
  157 |       await page.evaluate(() => document.fonts.ready);
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
```