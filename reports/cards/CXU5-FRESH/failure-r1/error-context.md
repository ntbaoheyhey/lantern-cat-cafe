# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/g2-shell.spec.ts >> G2 Shell: 320x568 Layout Guarantee >> stage >= 160px tall and primary action visible without scrolling
- Location: e2e/ui/g2-shell.spec.ts:240:3

# Error details

```
Error: expect(locator).toBeInViewport() failed

Locator:  getByRole('button', { name: /^(Fight|Rematch)$/i })
Expected: in viewport
Received: viewport ratio 0
Timeout:  5000ms

Call log:
  - Expect "toBeInViewport" getByRole('button', { name: /^(Fight|Rematch)$/i }) with timeout 5000ms
  - waiting for getByRole('button', { name: /^(Fight|Rematch)$/i })
    13 × locator resolved to <button type="button" aria-busy="false" class="boss-fight-btn pixel-btn">Fight</button>
       - unexpected value "viewport ratio 0"

```

```yaml
- button "Fight"
```

# Test source

```ts
  158 |     await expect(craftBtn).toBeEnabled();
  159 |     const visibleAtInteractions = interactions;
  160 | 
  161 |     // Interaction 2: Click Craft button
  162 |     await craftBtn.click();
  163 |     interactions++;
  164 | 
  165 |     expect(visibleAtInteractions).toBeLessThanOrEqual(2);
  166 |     expect(interactions).toBeLessThanOrEqual(2);
  167 |   });
  168 | });
  169 | 
  170 | test.describe('G2 Shell: Touch Targets on Phone Sizes', () => {
  171 |   test.beforeEach(async ({ page }) => {
  172 |     await seedSave(page);
  173 |   });
  174 | 
  175 |   const PHONE_SIZES = [
  176 |     { name: '390x844', width: 390, height: 844 },
  177 |     { name: '320x568', width: 320, height: 568 },
  178 |   ];
  179 | 
  180 |   for (const vp of PHONE_SIZES) {
  181 |     test(`every tab, button and nav item >= 44x44 px at ${vp.name}`, async ({ page }) => {
  182 |       await page.setViewportSize({ width: vp.width, height: vp.height });
  183 |       await page.goto('/');
  184 | 
  185 |       // Check bottom nav items
  186 |       const navTabs = page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab');
  187 |       const count = await navTabs.count();
  188 |       expect(count).toBe(7);
  189 | 
  190 |       for (let i = 0; i < count; i++) {
  191 |         const b = await navTabs.nth(i).boundingBox();
  192 |         expect(b, `Nav tab ${i} bounding box was null`).not.toBeNull();
  193 |         expect(b!.width).toBeGreaterThanOrEqual(44 - 0.5);
  194 |         expect(b!.height).toBeGreaterThanOrEqual(44 - 0.5);
  195 |       }
  196 | 
  197 |       // Check topbar buttons (e.g. wallet link/button, hint chip)
  198 |       const topbarButtons = page.locator('.v2-topbar button:visible, .v2-topbar a:visible');
  199 |       const topbarCount = await topbarButtons.count();
  200 |       for (let i = 0; i < topbarCount; i++) {
  201 |         const b = await topbarButtons.nth(i).boundingBox();
  202 |         if (b) {
  203 |           expect(b.width).toBeGreaterThanOrEqual(44 - 0.5);
  204 |           expect(b.height).toBeGreaterThanOrEqual(44 - 0.5);
  205 |         }
  206 |       }
  207 | 
  208 |       // Open Bag and verify action button and tiles
  209 |       await page.getByRole('tab', { name: 'Bag' }).click();
  210 |       const bagAction = page.getByRole('button', { name: 'Equip best', exact: true });
  211 |       await expect(bagAction).toBeVisible();
  212 |       const bagActionBox = await bagAction.boundingBox();
  213 |       expect(bagActionBox!.width).toBeGreaterThanOrEqual(44 - 0.5);
  214 |       expect(bagActionBox!.height).toBeGreaterThanOrEqual(44 - 0.5);
  215 | 
  216 |       // Open Boss and verify action button
  217 |       await page.getByRole('tab', { name: 'Map' }).or(page.getByRole('tab', { name: 'Boss' })).click();
  218 |       const bossAction = page.getByRole('button', { name: /^(Fight|Rematch)$/i });
  219 |       await expect(bossAction).toBeVisible();
  220 |       const bossActionBox = await bossAction.boundingBox();
  221 |       expect(bossActionBox!.width).toBeGreaterThanOrEqual(44 - 0.5);
  222 |       expect(bossActionBox!.height).toBeGreaterThanOrEqual(44 - 0.5);
  223 | 
  224 |       // Open Forge and verify action button
  225 |       await page.getByRole('tab', { name: 'Forge' }).click();
  226 |       const forgeAction = page.getByTestId('craft-btn');
  227 |       await expect(forgeAction).toBeVisible();
  228 |       const forgeActionBox = await forgeAction.boundingBox();
  229 |       expect(forgeActionBox!.width).toBeGreaterThanOrEqual(44 - 0.5);
  230 |       expect(forgeActionBox!.height).toBeGreaterThanOrEqual(44 - 0.5);
  231 |     });
  232 |   }
  233 | });
  234 | 
  235 | test.describe('G2 Shell: 320x568 Layout Guarantee', () => {
  236 |   test.beforeEach(async ({ page }) => {
  237 |     await seedSave(page);
  238 |   });
  239 | 
  240 |   test('stage >= 160px tall and primary action visible without scrolling', async ({ page }) => {
  241 |     await page.setViewportSize({ width: 320, height: 568 });
  242 |     await page.goto('/');
  243 | 
  244 |     const stage = page.getByRole('region', { name: 'Game stage' });
  245 |     await expect(stage).toBeVisible();
  246 |     const stageBox = await stage.boundingBox();
  247 |     expect(stageBox).not.toBeNull();
  248 |     expect(stageBox!.height).toBeGreaterThanOrEqual(160);
  249 | 
  250 |     // Bag: Equip best is visible in viewport without scrolling
  251 |     await page.getByRole('tab', { name: 'Bag' }).click();
  252 |     const equipBest = page.getByRole('button', { name: 'Equip best', exact: true });
  253 |     await expect(equipBest).toBeInViewport();
  254 | 
  255 |     // Boss: Fight is visible in viewport without scrolling
  256 |     await page.getByRole('tab', { name: 'Map' }).or(page.getByRole('tab', { name: 'Boss' })).click();
  257 |     const fightBtn = page.getByRole('button', { name: /^(Fight|Rematch)$/i });
> 258 |     await expect(fightBtn).toBeInViewport();
      |                            ^ Error: expect(locator).toBeInViewport() failed
  259 | 
  260 |     // Forge: Craft is visible in viewport without scrolling
  261 |     await page.getByRole('tab', { name: 'Forge' }).click();
  262 |     const craftBtn = page.getByTestId('craft-btn');
  263 |     await expect(craftBtn).toBeInViewport();
  264 |   });
  265 | });
  266 | 
  267 | test.describe('G2 Shell: Focus Management & Keyboard Navigation', () => {
  268 |   test.beforeEach(async ({ page }) => {
  269 |     await seedSave(page);
  270 |   });
  271 | 
  272 |   test('focus moves into opened panel and returns to tab on Escape', async ({ page }) => {
  273 |     await page.setViewportSize({ width: 1280, height: 720 });
  274 |     await page.goto('/');
  275 | 
  276 |     const bagTab = page.getByRole('tab', { name: 'Bag' });
  277 |     await bagTab.click();
  278 | 
  279 |     // Verify focus moved into the newly opened panel
  280 |     await expect.poll(async () => {
  281 |       return page.evaluate(() => {
  282 |         const active = document.activeElement;
  283 |         const panel = document.getElementById('panel-Bag');
  284 |         return panel ? panel.contains(active) : false;
  285 |       });
  286 |     }).toBe(true);
  287 | 
  288 |     // Press Escape -> focus returns to tab
  289 |     await page.keyboard.press('Escape');
  290 |     await expect(bagTab).toBeFocused();
  291 |   });
  292 | 
  293 |   test('keyboard-only path to Fight works', async ({ page }) => {
  294 |     await page.setViewportSize({ width: 1280, height: 720 });
  295 |     await page.goto('/');
  296 | 
  297 |     // Focus the first tab
  298 |     const firstTab = page.getByRole('tab', { name: 'Home' }).or(page.getByRole('tab', { name: 'Character' }));
  299 |     await firstTab.focus();
  300 | 
  301 |     // Navigate with ArrowDown / ArrowRight to Map / Boss tab
  302 |     await page.keyboard.press('ArrowDown'); // Bag
  303 |     await page.keyboard.press('ArrowDown'); // Map
  304 |     await expect(page.getByRole('tab', { name: 'Map' }).or(page.getByRole('tab', { name: 'Boss' }))).toBeFocused();
  305 |     await page.keyboard.press('Enter');
  306 | 
  307 |     // Tab into the panel to reach Fight button
  308 |     const fightBtn = page.getByRole('button', { name: /^(Fight|Rematch)$/i });
  309 |     for (let step = 0; step < 20; step++) {
  310 |       if (await fightBtn.evaluate((el) => el === document.activeElement)) break;
  311 |       await page.keyboard.press('Tab');
  312 |     }
  313 |     await expect(fightBtn).toBeFocused();
  314 | 
  315 |     // Press Enter to activate Fight
  316 |     await page.keyboard.press('Enter');
  317 |     // Action triggers: fight starts or stage/arena renders
  318 |     await expect(page.getByRole('region', { name: 'Game stage' }).or(page.getByRole('region', { name: 'Boss arena' }))).toBeVisible();
  319 |   });
  320 | });
  321 | 
  322 | test.describe('G2 Shell: Reduced Motion', () => {
  323 |   test.use({ reducedMotion: 'reduce' });
  324 | 
  325 |   test('reduced motion disables animations', async ({ page }) => {
  326 |     await seedSave(page);
  327 |     await page.setViewportSize({ width: 1280, height: 720 });
  328 |     await page.goto('/');
  329 | 
  330 |     // Check that prefers-reduced-motion media query matches in the page
  331 |     const matches = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  332 |     expect(matches).toBe(true);
  333 | 
  334 |     // Verify .btn-spinner or canvas has no infinite animation running
  335 |     const spinnerAnimation = await page.evaluate(() => {
  336 |       const el = document.createElement('span');
  337 |       el.className = 'btn-spinner';
  338 |       document.body.appendChild(el);
  339 |       const style = window.getComputedStyle(el);
  340 |       const anim = style.animationName;
  341 |       document.body.removeChild(el);
  342 |       return anim;
  343 |     });
  344 |     expect(spinnerAnimation).toBe('none');
  345 |   });
  346 | });
  347 | 
```