# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: qa/s3-walkthrough.spec.ts >> Cat RPG v2 QA Regression Suite (Mission S3) >> idle loop accrues fish and XP across claims without double-pay
- Location: e2e/qa/s3-walkthrough.spec.ts:45:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - navigation "Game menu" [ref=f1e4]:
    - generic [ref=f1e5]:
      - button "Taskbar Hero home" [ref=f1e6] [cursor=pointer]:
        - img "Portrait of Mochi the cat" [ref=f1e7]
      - tablist "Game panel tabs" [ref=f1e264]:
        - tab "Home" [selected] [ref=f1e265] [cursor=pointer]
        - tab "Bag" [ref=f1e270] [cursor=pointer]
        - tab "Map" [ref=f1e276] [cursor=pointer]
        - tab "Forge" [ref=f1e282] [cursor=pointer]
        - tab "Market" [ref=f1e287] [cursor=pointer]
        - tab "Hero" [ref=f1e293] [cursor=pointer]
        - tab "Help" [ref=f1e300] [cursor=pointer]
    - generic "Avalanche Fuji Testnet" [ref=f1e307]: Fuji
  - generic [ref=f1e310]:
    - banner [ref=f1e311]:
      - region "Cat status" [ref=f1e312]:
        - generic [ref=f1e313]:
          - list "Currencies and keys" [ref=f1e314]:
            - listitem "Fish 0" [ref=f1e315]:
              - generic [aria-hidden] [ref=f1e321]: Fish
              - generic [ref=f1e323]: "0"
            - listitem "Yarn 0" [ref=f1e324]:
              - generic [aria-hidden] [ref=f1e329]: Yarn
              - generic [ref=f1e331]: "0"
            - listitem "Cat Keys 0 of 5" [ref=f1e332]:
              - generic [aria-hidden] [ref=f1e335]: Cat Keys
              - generic [aria-hidden] [ref=f1e336]: 0/5
          - generic [ref=f1e338]:
            - generic [ref=f1e339]: Lv 1
            - progressbar "Experience" [ref=f1e340]
            - generic [aria-hidden] [ref=f1e341]: 0 / 60 XP
          - group "Chapter 1 Living Room, round 1 of 10, 0 of 6 monsters" [ref=f1e343]:
            - generic [aria-hidden] [ref=f1e344]: Chapter 1 · Round 1 · 0/6
          - generic [ref=f1e345]: Power 44
      - generic [ref=f1e348]:
        - status [ref=f1e350]:
          - generic [aria-hidden] [ref=f1e351]: ●
          - generic [ref=f1e352]: Live
        - group "Wallet" [ref=f1e354]:
          - link "Get a browser wallet" [ref=f1e355] [cursor=pointer]:
            - /url: https://core.app
    - generic [ref=f1e356]:
      - heading "Taskbar Hero" [level=1] [ref=f1e357]
      - generic [ref=f1e358]: Candidate build, not live.
      - generic "Goal ladder" [ref=f1e359]:
        - generic [ref=f1e360]:
          - generic [ref=f1e361]: Soon
          - text: 60 foes to the chapter boss
        - generic [ref=f1e362]:
          - generic [ref=f1e363]: Later
          - text: Unlock Kitchen
      - generic [ref=f1e365]:
        - generic [aria-hidden] [ref=f1e366]: Next
        - button "Clear round 1 · 6 foes left" [ref=f1e367] [cursor=pointer]
    - main [ref=f1e368]:
      - tabpanel "Home" [ref=f1e370]:
        - generic [ref=f1e371]:
          - generic [ref=f1e372]:
            - region "Game stage" [ref=f1e373]:
              - text: CAT CAFÉ QUEST / EVENING PATROL
              - generic [ref=f1e374]:
                - img "Cat exploring the chapter" [ref=f1e375]
                - generic "Stage progress":
                  - generic: Chapter 1 · Round 1 / 10
                  - generic "0 / 6 kills; last kill is elite":
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ●
                    - generic [aria-hidden]: ◆
                    - generic: 0 / 6
                - generic: Fight preview · rewards on claim
            - region "Event log" [ref=f1e377]:
              - generic [ref=f1e378]: Battle Log
              - generic [ref=f1e381]:
                - generic [ref=f1e382]:
                  - generic [ref=f1e383]: ›
                  - generic [ref=f1e384]: Mochi entered Chapter 1 (Round 1).
                - generic [ref=f1e385]:
                  - generic [ref=f1e386]: ›
                  - generic [ref=f1e387]: "Auto-battle active: exploring and defeating monsters."
          - region "Home details" [ref=f1e388]:
            - generic [ref=f1e389]:
              - generic [ref=f1e390]:
                - img "Mochi, a tabby cat with a blue scarf" [ref=f1e392]
                - generic [ref=f1e394]:
                  - heading "Mochi" [level=2] [ref=f1e395]
                  - generic [ref=f1e396]:
                    - generic [ref=f1e397]: Warrior
                    - generic [ref=f1e398]: Lv. 1
                  - generic [ref=f1e399]:
                    - text: "Power:"
                    - strong [ref=f1e400]: "44"
              - generic [ref=f1e401]:
                - heading "Core Stats" [level=3] [ref=f1e402]
                - generic [ref=f1e403]:
                  - generic [ref=f1e404]:
                    - term [ref=f1e405]: HP
                    - definition [ref=f1e406]: "100"
                  - generic [ref=f1e407]:
                    - term [ref=f1e408]: ATK
                    - definition [ref=f1e409]: "18"
                  - generic [ref=f1e410]:
                    - term [ref=f1e411]: Crit chance
                    - definition [ref=f1e412]: 5%
                  - generic [ref=f1e413]:
                    - term [ref=f1e414]: DEF
                    - definition [ref=f1e415]: "5"
                  - generic [ref=f1e416]:
                    - term [ref=f1e417]: Speed
                    - definition [ref=f1e418]: 1.00/s
            - generic [ref=f1e419]:
              - generic [ref=f1e420]:
                - heading "Next Goal" [level=2] [ref=f1e421]
                - generic [ref=f1e422]: Ch. 1 · Round 1
              - generic [ref=f1e423]:
                - generic [ref=f1e424]:
                  - generic [ref=f1e425]:
                    - generic [ref=f1e426]: Monster Hunt
                    - generic [ref=f1e427]: 0 / 6
                  - progressbar "Progress through this round" [ref=f1e428]
                - paragraph [ref=f1e429]: Defeat 6 more monsters to reach the next stage.
                - generic [ref=f1e430]:
                  - generic [ref=f1e431]:
                    - generic [ref=f1e432]: Now
                    - text: Clear round 1 · 6 foes left
                  - generic [ref=f1e433]:
                    - generic [ref=f1e434]: Soon
                    - text: 60 foes to the chapter boss
                  - generic [ref=f1e435]:
                    - generic [ref=f1e436]: Later
                    - text: Unlock Kitchen
                - button "Go to map" [ref=f1e437] [cursor=pointer]
            - generic [ref=f1e438]:
              - heading "Recent loot" [level=2] [ref=f1e440]
              - region "Recent loot details" [ref=f1e441]:
                - generic [ref=f1e442]:
                  - generic [ref=f1e443]:
                    - generic [ref=f1e449]: "0"
                    - generic [ref=f1e450]: Fish
                  - generic [ref=f1e451]:
                    - generic [ref=f1e456]: "0"
                    - generic [ref=f1e457]: Yarn
                  - generic [ref=f1e458]:
                    - generic [ref=f1e461]: "0"
                    - generic [ref=f1e462]: Keys
                - generic [ref=f1e463]:
                  - heading "Latest Drops" [level=3] [ref=f1e464]
                  - list [ref=f1e465]:
                    - listitem [ref=f1e466]:
                      - generic [ref=f1e469]:
                        - generic [ref=f1e470]: Twig Sword
                        - generic [ref=f1e471]: Common Lv.1
```

# Test source

```ts
  1   | import { expect, test, type Page } from '../support/test';
  2   | import { mockV2SaveJson, type MockV2FixtureKind } from '../../src/api/mockV2Fixtures';
  3   | 
  4   | const KEY = 'taskbar-hero:v2-demo:1';
  5   | type Save = ReturnType<typeof JSON.parse>;
  6   | const raw = (page: Page): Promise<Save> => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
  7   | 
  8   | async function load(page: Page, kind?: MockV2FixtureKind, change?: (save: Save) => void) {
  9   |   await page.goto('/');
  10  |   const nowMs = await page.evaluate(() => Date.now());
  11  |   const save = kind ? JSON.parse(mockV2SaveJson(kind, { nowMs, classId: 'warrior', chapter: 1 })) : null;
  12  |   if (save && change) change(save);
  13  |   await page.evaluate(
  14  |     ({ key, save }) => {
  15  |       if (save) localStorage.setItem(key, JSON.stringify(save));
  16  |       else localStorage.removeItem(key);
  17  |       localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  18  |       localStorage.removeItem('taskbar-hero:v2-last-visit');
  19  |     },
  20  |     { key: KEY, save },
  21  |   );
  22  |   await page.reload();
  23  |   return save;
  24  | }
  25  | 
  26  | test.describe('Cat RPG v2 QA Regression Suite (Mission S3)', () => {
  27  |   test('fresh start class choice and initial stage mounting', async ({ page }) => {
  28  |     await load(page);
  29  |     await expect(page.getByTestId('class-picker')).toBeVisible();
  30  | 
  31  |     // Verify starter classes are readable
  32  |     const classes = ['warrior', 'guardian', 'rogue'];
  33  |     for (const c of classes) {
  34  |       await expect(page.getByTestId(`class-card-${c}`)).toBeVisible();
  35  |     }
  36  | 
  37  |     // Pick warrior
  38  |     await page.getByTestId('class-picker-choose-button').click();
  39  | 
  40  |     // Stage canvas is mounted
  41  |     await expect(page.locator('.v2-stage canvas')).toBeVisible();
  42  |     await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
  43  |   });
  44  | 
  45  |   test('idle loop accrues fish and XP across claims without double-pay', async ({ page }) => {
  46  |     await page.clock.install();
  47  |     await load(page, 'fresh');
  48  |     const before = (await raw(page)).state;
  49  | 
  50  |     // Fast forward clock past claim interval (30s)
  51  |     await page.clock.fastForward(60_000);
> 52  |     await expect.poll(async () => (await raw(page)).state.xp).toBeGreaterThan(before.xp);
      |                                                               ^ Error: expect(received).toBeGreaterThan(expected)
  53  |     const after = (await raw(page)).state;
  54  |     expect(after.stacks.fish).toBeGreaterThan(before.stacks.fish ?? 0);
  55  | 
  56  |     // Immediate second claim attempt does not double pay
  57  |     const claimTwice = await page.evaluate(async (key) => {
  58  |       const loop = (window as unknown as { __GAME_LOOP_V2__?: { claimNow: () => Promise<void> } }).__GAME_LOOP_V2__;
  59  |       if (loop) {
  60  |         await loop.claimNow();
  61  |         await loop.claimNow();
  62  |       }
  63  |       return JSON.parse(localStorage.getItem(key)!);
  64  |     }, KEY);
  65  |     expect(claimTwice.state.xp).toBe(after.xp);
  66  |   });
  67  | 
  68  |   test('bag equip, lock toggle, and bulk equip best upgrades', async ({ page }) => {
  69  |     let weapon = '';
  70  |     await load(page, 'midGame', (save) => {
  71  |       for (const item of save.state.items) {
  72  |         if (item.slot === 'weapon') {
  73  |           weapon = item.id;
  74  |           item.equipped = false;
  75  |         }
  76  |       }
  77  |     });
  78  | 
  79  |     const invTab = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: 'Bag' });
  80  |     await invTab.click();
  81  |     const panel = page.getByRole('tabpanel', { name: 'Bag' });
  82  |     await expect(panel).toBeVisible();
  83  | 
  84  |     // Equip best
  85  |     const equipBest = panel.getByRole('button', { name: 'Equip best' });
  86  |     if (await equipBest.isEnabled()) {
  87  |       await equipBest.click();
  88  |       await expect.poll(async () => {
  89  |         const current = (await raw(page)).state.items.find((i: { id: string }) => i.id === weapon);
  90  |         return current?.equipped;
  91  |       }).toBe(true);
  92  |     }
  93  |   });
  94  | 
  95  |   test('forge crafting, salvage and daily relic status', async ({ page }) => {
  96  |     await load(page, 'forgeRich');
  97  |     const forgeTab = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: 'Forge' });
  98  |     await forgeTab.click();
  99  |     const panel = page.getByRole('tabpanel', { name: 'Forge' });
  100 |     await expect(panel).toBeVisible();
  101 | 
  102 |     // Craft common weapon
  103 |     const craftBtn = panel.getByTestId('craft-btn');
  104 |     await craftBtn.click();
  105 |     await panel.getByTestId('craft-confirm-btn').click();
  106 |     await expect(page.locator('.v2-action-notice, .forge-note')).toBeVisible();
  107 | 
  108 |     // Relic sub-tab
  109 |     const relicSubTab = panel.locator('#forge-tab-relic, button:has-text("RELIC")').first();
  110 |     await relicSubTab.click();
  111 |     await expect(panel.getByTestId('relic-forge-btn')).toBeVisible();
  112 |   });
  113 | 
  114 |   test('boss fight victory, key consumption and chest collection', async ({ page }) => {
  115 |     await load(page, 'bossReadyStrong');
  116 |     expect((await raw(page)).state.stacks.catKey).toBe(1);
  117 | 
  118 |     const bossTab = page
  119 |       .getByRole('tablist', { name: 'Game panel tabs' })
  120 |       .getByRole('tab', { name: 'Map' })
  121 |       .or(page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: 'Boss' }));
  122 |     await bossTab.click();
  123 |     const panel = page.getByRole('tabpanel', { name: 'Map' }).or(page.getByRole('tabpanel', { name: 'Boss' }));
  124 |     await panel.getByRole('button', { name: 'Fight', exact: true }).click();
  125 | 
  126 |     // Arena canvas shows
  127 |     await expect(page.locator('.boss-arena canvas')).toBeVisible();
  128 |     await page.getByRole('button', { name: 'Skip fight' }).click();
  129 | 
  130 |     // Victory and chest dialog
  131 |     await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
  132 |     const chest = page.getByRole('dialog');
  133 |     await expect(chest).toBeVisible();
  134 | 
  135 |     // Key was spent
  136 |     expect((await raw(page)).state.stacks.catKey ?? 0).toBe(0);
  137 |     expect((await raw(page)).state.chapter).toBe(2);
  138 | 
  139 |     const skip = chest.getByRole('button', { name: 'Skip', exact: true });
  140 |     if (await skip.count()) await skip.click();
  141 |     await chest.getByRole('button', { name: 'Collect', exact: true }).click();
  142 |     await expect(page.getByRole('group', { name: /^Chapter 2 / })).toBeVisible();
  143 |   });
  144 | 
  145 |   test('responsive mobile bottom navigation at 390x844', async ({ page }) => {
  146 |     await page.setViewportSize({ width: 390, height: 844 });
  147 |     await load(page, 'fresh');
  148 | 
  149 |     const nav = page.getByRole('navigation', { name: 'Game menu' });
  150 |     await expect(nav).toBeVisible();
  151 | 
  152 |     const bagButton = nav.getByRole('tab', { name: 'Bag' });
```