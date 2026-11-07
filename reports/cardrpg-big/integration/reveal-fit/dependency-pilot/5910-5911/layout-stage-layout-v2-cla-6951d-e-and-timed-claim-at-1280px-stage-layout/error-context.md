# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layout/stage-layout.spec.ts >> v2 class choice and timed claim at 1280px
- Location: e2e/layout/stage-layout.spec.ts:240:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "Failed to load resource: net::ERR_SOCKET_NOT_CONNECTED",
+ ]
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
            - listitem "Fish 415" [ref=e315]:
              - generic [aria-hidden]: "+415"
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: "37"
            - listitem "Yarn 23" [ref=e324]:
              - generic [aria-hidden]: "+23"
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: "2"
            - listitem "Cat Keys 1 of 5" [ref=e332]:
              - generic [aria-hidden] [ref=e335]: Cat Keys
              - generic [aria-hidden] [ref=e336]: 1/5
          - generic [ref=e338]:
            - generic [ref=e339]: Lv 13
            - progressbar "Experience" [ref=e340]
            - generic [aria-hidden] [ref=e342]: 8 / 234 XP
          - group "Chapter 1 Living Room, round 10 of 10, 6 of 6 monsters" [ref=e344]:
            - generic [aria-hidden] [ref=e345]: Chapter 1 · Round 10 · 6/6
          - generic [ref=e346]: Power 80
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
          - text: Boss ready · losses keep your key
        - generic [ref=e363]:
          - generic [ref=e364]: Later
          - text: Unlock Kitchen
      - generic [ref=e366]:
        - generic [aria-hidden] [ref=e367]: Next
        - button "Compare 4 gear upgrades" [ref=e368] [cursor=pointer]
    - main [ref=e369]:
      - tabpanel "Home" [ref=e371]:
        - generic [ref=e372]:
          - generic [ref=e373]:
            - region "Game stage" [ref=e374]:
              - text: CAT CAFÉ QUEST / EVENING PATROL
              - generic [ref=e375]:
                - img "Cat exploring the chapter" [ref=e376]
                - generic "Stage progress":
                  - generic: Chapter 1 · Round 10 / 10
                  - generic "6 / 6 kills; last kill is elite":
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ◆
                    - generic: 6 / 6
                - status [ref=e378]:
                  - button "Fight the boss" [ref=e379] [cursor=pointer]
                - generic: Boss ready
            - region "Event log" [ref=e380]:
              - generic [ref=e381]: Battle Log
              - generic [ref=e384]:
                - generic [ref=e385]:
                  - generic [ref=e386]: ›
                  - generic [ref=e387]: Mochi gathered 415 Fish and 23 Yarn (+5 gear)
                - generic [ref=e388]:
                  - generic [ref=e389]: ›
                  - generic [ref=e390]: 🌟 Mochi leveled up to Lv. 13!
                - generic [ref=e391]:
                  - generic [ref=e392]: ›
                  - generic [ref=e393]: ⚔️ Advanced to Chapter 1, Round 10
          - region "Home details" [ref=e394]:
            - generic [ref=e395]:
              - generic [ref=e396]:
                - img "Mochi, a tabby cat with a blue scarf" [ref=e398]
                - generic [ref=e400]:
                  - heading "Mochi" [level=2] [ref=e401]
                  - generic [ref=e402]:
                    - generic [ref=e403]: Warrior
                    - generic [ref=e404]: Lv. 13
                  - generic [ref=e405]:
                    - text: "Power:"
                    - strong [ref=e406]: "80"
              - generic [ref=e407]:
                - heading "Core Stats" [level=3] [ref=e408]
                - generic [ref=e409]:
                  - generic [ref=e410]:
                    - term [ref=e411]: HP
                    - definition [ref=e412]: "201"
                  - generic [ref=e413]:
                    - term [ref=e414]: ATK
                    - definition [ref=e415]: "28"
                  - generic [ref=e416]:
                    - term [ref=e417]: Crit chance
                    - definition [ref=e418]: 5%
                  - generic [ref=e419]:
                    - term [ref=e420]: DEF
                    - definition [ref=e421]: "10"
                  - generic [ref=e422]:
                    - term [ref=e423]: Speed
                    - definition [ref=e424]: 1.00/s
            - generic [ref=e425]:
              - generic [ref=e426]:
                - heading "Next Goal" [level=2] [ref=e427]
                - generic [ref=e428]: Ch. 1 · Round 10
              - generic [ref=e429]:
                - generic [ref=e430]:
                  - generic [ref=e431]:
                    - generic [ref=e432]: Boss Encounter Ready!
                    - generic [ref=e433]: 6 / 6
                  - progressbar "Progress through this round" [ref=e434]
                - paragraph [ref=e436]: The chapter boss awaits your challenge.
                - generic [ref=e437]:
                  - generic [ref=e438]:
                    - generic [ref=e439]: Now
                    - text: Compare 4 gear upgrades
                  - generic [ref=e440]:
                    - generic [ref=e441]: Soon
                    - text: Boss ready · losses keep your key
                  - generic [ref=e442]:
                    - generic [ref=e443]: Later
                    - text: Unlock Kitchen
                - button "Compare gear" [ref=e444] [cursor=pointer]
            - generic [ref=e445]:
              - heading "Recent loot" [level=2] [ref=e447]
              - region "Recent loot details" [ref=e448]:
                - region [ref=e449]:
                  - heading "Recent finds" [level=3] [ref=e450]
                  - list "Loot lines" [ref=e451]:
                    - listitem [ref=e452]:
                      - generic [aria-hidden] [ref=e453]: ★
                      - generic [ref=e454]: Level up! +12
                    - listitem [ref=e455]:
                      - generic [aria-hidden] [ref=e456]: XP
                      - generic [ref=e457]: +1,462 XP
                    - listitem [ref=e458]:
                      - generic [ref=e465]: +415 Fish
                    - listitem [ref=e466]:
                      - generic [ref=e472]: +23 Yarn
                    - listitem [ref=e473]:
                      - generic [ref=e477]: +1 Cat Key
                    - listitem [ref=e478]:
                      - generic [ref=e486]: +20 Fluff Tuft
                  - list "Items" [ref=e487]:
                    - listitem [ref=e488]:
                      - generic [ref=e497]:
                        - generic [ref=e498]: Patched Cozy Sweater
                        - generic [ref=e499]:
                          - text: Common ·
                          - generic [ref=e500]: Lv 1
                    - listitem [ref=e501]:
                      - generic [ref=e510]:
                        - generic [ref=e511]: Twig Sword
                        - generic [ref=e512]:
                          - text: Common ·
                          - generic [ref=e513]: Lv 4
                    - listitem [ref=e514]:
                      - generic [ref=e523]:
                        - generic [ref=e524]: Plain Bell Collar
                        - generic [ref=e525]:
                          - text: Common ·
                          - generic [ref=e526]: Lv 4
                    - listitem [ref=e527]:
                      - generic [ref=e536]:
                        - generic [ref=e537]: Patched Knit Beanie
                        - generic [ref=e538]:
                          - text: Common ·
                          - generic [ref=e539]: Lv 10
                    - listitem [ref=e540]:
                      - generic [ref=e549]:
                        - generic [ref=e550]: Bubbly Tonic
                        - generic [ref=e551]:
                          - text: Uncommon ·
                          - generic [ref=e552]: Lv 10
```

# Test source

```ts
  158 |     await page.goto('/');
  159 |     const first = page.getByRole('tab', { name: 'Home', exact: true }).or(page.getByRole('tab', { name: 'Character', exact: true }));
  160 |     await first.focus();
  161 |     await page.keyboard.press('ArrowRight');
  162 |     await expect(page.getByRole('tab', { name: 'Bag', exact: true })).toBeFocused();
  163 |     await page.keyboard.press('End');
  164 |     await expect(page.getByRole('tab', { name: 'Help', exact: true })).toBeFocused();
  165 |     await page.keyboard.press('ArrowRight');
  166 |     await expect(first).toBeFocused();
  167 |   });
  168 | 
  169 |   test('buttons and links have accessible names on every tab', async ({ page }) => {
  170 |     await page.goto('/');
  171 |     await expectNamedControls(page);
  172 |     for (const name of TAB_NAMES) {
  173 |       await page.getByRole('tab', { name, exact: true }).click();
  174 |       await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible();
  175 |       await expectNamedControls(page);
  176 |     }
  177 |   });
  178 | 
  179 |   test('the next-step chip opens the tab it points to', async ({ page }) => {
  180 |     await page.goto('/');
  181 |     const chip = page.getByTestId('next-hint').getByRole('button');
  182 |     await expect(chip).toBeVisible();
  183 |     await chip.click();
  184 |     await expect(page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { selected: true })).toHaveCount(1);
  185 |   });
  186 | });
  187 | 
  188 | test.describe('phone layout and navigation', () => {
  189 |   test.use({ viewport: { width: 390, height: 844 } });
  190 | 
  191 |   test('switches panels via bottom nav and manages focus', async ({ page }) => {
  192 |     await page.goto('/');
  193 |     const nav = page.getByRole('navigation', { name: 'Game menu' });
  194 |     await expect(nav).toBeVisible();
  195 |     await expect(nav.getByRole('tab')).toHaveCount(TAB_NAMES.length);
  196 | 
  197 |     for (const name of TAB_NAMES) {
  198 |       await nav.getByRole('tab', { name, exact: true }).click();
  199 |       const panel = page.getByRole('tabpanel', { name, exact: true });
  200 |       await expect(panel).toBeVisible();
  201 |       await noHorizontalScroll(page);
  202 |     }
  203 | 
  204 |     // Escape returns focus to the active tab in nav.
  205 |     const bossTab = nav.getByRole('tab', { name: 'Map', exact: true }).or(nav.getByRole('tab', { name: 'Boss', exact: true }));
  206 |     await bossTab.click();
  207 |     // Opening a panel moves focus on the next animation frame. Observe that transition before
  208 |     // exercising Escape, rather than racing the pending panel-focus callback.
  209 |     await expect.poll(() => page.getByRole('tabpanel', { name: 'Map', exact: true })
  210 |       .evaluate(panel => panel.contains(document.activeElement))).toBe(true);
  211 |     await page.keyboard.press('Escape');
  212 |     await expect(bossTab).toBeFocused();
  213 |   });
  214 | 
  215 |   test('every nav tab is reachable by keyboard', async ({ page }) => {
  216 |     await page.goto('/');
  217 |     for (const name of TAB_NAMES) {
  218 |       const tab = page.getByRole('tab', { name, exact: true });
  219 |       await tabTo(page, tab);
  220 |       await page.keyboard.press('Enter');
  221 |       await expect(tab).toHaveAttribute('aria-selected', 'true');
  222 |     }
  223 |   });
  224 | 
  225 |   test('the panel does not hide the stage', async ({ page }) => {
  226 |     await page.goto('/');
  227 |     const stageRegion = page.getByRole('region', { name: 'Game stage' });
  228 |     const stage = await box(stageRegion);
  229 |     expect(stage.y).toBeGreaterThanOrEqual(0);
  230 |     await page.getByRole('tab', { name: 'Bag', exact: true }).click();
  231 |     const panel = await box(page.getByRole('tabpanel', { name: 'Bag', exact: true }));
  232 |     expect(panel.y).toBeGreaterThanOrEqual(0);
  233 |   });
  234 | });
  235 | 
  236 | 
  237 | 
  238 | 
  239 | for (const width of [390, 1280]) {
  240 |   test(`v2 class choice and timed claim at ${width}px`, async ({ page }) => {
  241 |     const errors: string[] = [];
  242 |     page.on('pageerror', e => errors.push(e.message));
  243 |     page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  244 |     await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
  245 |     const nowMs = Date.now();
  246 |     await page.clock.install({ time: nowMs });
  247 |     await page.goto('/');
  248 |     await expect(page.getByTestId('class-picker')).toBeVisible();
  249 |     await page.getByTestId('class-picker-choose-button').click();
  250 |     await expect(page.getByTestId('class-picker')).toHaveCount(0);
  251 |     await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
  252 |     const progress = page.getByRole('group', { name: /^Chapter / });
  253 |     const before = await progress.textContent();
  254 |     await page.clock.fastForward(10 * 60 * 1000);
  255 |     await expect(progress).not.toHaveText(before!);
  256 |     await expect(page.getByLabel('Currencies and keys')).toContainText('Fish');
  257 |     await noHorizontalScroll(page);
> 258 |     expect(errors).toEqual([]);
      |                    ^ Error: expect(received).toEqual(expected) // deep equality
  259 |     await page.evaluate(() => window.scrollTo(0, 0));
  260 |     if (writeScreenshots) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR ?? path.resolve(process.cwd(), '../../reports/v16-stage'), `stage-${width}.png`) });
  261 |   });
  262 | }
  263 | 
```