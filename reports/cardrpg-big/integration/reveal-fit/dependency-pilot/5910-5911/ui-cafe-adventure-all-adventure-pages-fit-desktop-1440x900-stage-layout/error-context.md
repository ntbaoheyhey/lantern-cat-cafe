# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/cafe-adventure.spec.ts >> all adventure pages fit desktop 1440x900
- Location: e2e/ui/cafe-adventure.spec.ts:131:77

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.evaluateAll: Test timeout of 30000ms exceeded.
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
      - region "Main game cat status" [ref=e312]:
        - generic [ref=e313]:
          - list "Currencies and keys" [ref=e314]:
            - listitem "Fish 200" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [ref=e323]: "200"
            - listitem "Yarn 35" [ref=e324]:
              - generic [aria-hidden] [ref=e329]: Yarn
              - generic [ref=e331]: "35"
            - listitem "Cat Keys 2 of 5" [ref=e332]:
              - generic [aria-hidden] [ref=e335]: Cat Keys
              - generic [aria-hidden] [ref=e336]: 2/5
          - generic [ref=e338]:
            - generic [ref=e339]: Lv 20
            - progressbar "Experience" [ref=e340]
            - generic [aria-hidden] [ref=e341]: 0 / 517 XP
          - group "Chapter 2 Kitchen, round 5 of 10, 5 of 10 monsters" [ref=e343]:
            - generic [aria-hidden] [ref=e344]: Chapter 2 · Round 5 · 5/10
          - generic [ref=e345]: Power 360
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
          - text: "Sample: assemble a set"
        - generic [ref=e362]:
          - generic [ref=e363]: Later
          - text: "Sample: finish the journal"
      - generic [ref=e365]:
        - generic [aria-hidden] [ref=e366]: Next
        - button "Return to the main game" [ref=e367] [cursor=pointer]
    - main [ref=e368]:
      - tabpanel "Home" [ref=e370]:
        - generic [ref=e371]:
          - generic [ref=e372]:
            - generic [ref=e373]:
              - generic [ref=e374]: CAT CAFE QUEST Sample adventure
              - heading "The evening patrol" [level=2] [ref=e375]
              - paragraph [ref=e376]: A local adventure kit, a few brave choices, and a home to come back to.
            - generic [ref=e377]:
              - generic [ref=e378]:
                - text: ✦ 29
                - generic [ref=e379]: local patches
              - generic [ref=e380]:
                - text: "0"
                - generic [ref=e381]: cafe mastery
              - generic [ref=e382]:
                - text: 26%
                - generic [ref=e383]: journal complete
              - button "Main game ↗" [ref=e384] [cursor=pointer]
          - navigation "Adventure pages" [ref=e385]:
            - button "Patrol" [active] [ref=e386] [cursor=pointer]
            - button "Wardrobe" [ref=e387] [cursor=pointer]
            - button "Workshop" [ref=e388] [cursor=pointer]
            - button "Journal" [ref=e389] [cursor=pointer]
            - button "Cafe" [ref=e390] [cursor=pointer]
            - generic [ref=e391]: "Now: Compare a find · Next: clear room 1 · Later: 17/65 journal"
          - region "Patrol page" [ref=e392]:
            - generic [ref=e393]:
              - generic [ref=e394]:
                - region "Mochi patrols the cafe" [ref=e395]:
                  - generic [ref=e396]:
                    - generic [ref=e397]: ROOM 1 / 5
                    - heading "Living Room" [level=3] [ref=e398]
                    - paragraph [ref=e399]: Mochi is following a new trail…
                  - generic [ref=e400]:
                    - generic [ref=e401]: Mochi
                    - generic [ref=e404]: Next find soon
                - region "Encounter choice" [ref=e407]:
                  - heading "Another corner to explore" [level=3] [ref=e408]
                  - paragraph [ref=e409]: Next encounter in 4s. Compare your latest find or plan a matching set.
                  - button "Compare the kit →" [ref=e410] [cursor=pointer]
                - status [ref=e411]: "Split Yarn: +2 patches."
              - complementary "Patrol goals" [ref=e412]:
                - generic [ref=e413]:
                  - generic [ref=e414]: THE NEXT LITTLE THING
                  - heading "A household legend awaits" [level=3] [ref=e415]
                  - paragraph [ref=e416]: Your kit changes how you play. A complete set is a choice, not a requirement.
                  - generic [ref=e417]:
                    - text: Challenge tier
                    - combobox "Challenge tier" [ref=e418]:
                      - option "Cozy" [selected]
                      - option "Spirited"
                      - option "Daring"
                  - generic [ref=e419]: Boss HP ×1 · damage ×1 · first-clear Bright chance +0 points
                  - button "Challenge boss ↗" [ref=e420] [cursor=pointer]:
                    - text: Challenge boss
                    - generic [ref=e421]: ↗
                  - generic [ref=e422]: "Practice: no Cat Key spent, no Relics awarded."
                - generic [ref=e423]:
                  - generic [ref=e424]: YOUR ADVENTURE KIT
                  - generic [ref=e425]:
                    - generic [ref=e426]:
                      - text: "25"
                      - generic [ref=e427]: damage/s
                    - generic [ref=e428]:
                      - text: "307"
                      - generic [ref=e429]: HP
                    - generic [ref=e430]:
                      - text: 0/3
                      - generic [ref=e431]: Insight
                  - generic [ref=e432]:
                    - generic [ref=e433]:
                      - strong [ref=e434]:
                        - generic [ref=e435]: Ember
                        - generic [ref=e436]: 2/4
                      - generic [ref=e437]: ✓ 2 · +18% damage
                      - generic [ref=e438]: ○ 3 · Pounce 2s sooner
                      - generic [ref=e439]: ○ 4 · +50% exposure damage
                    - generic [ref=e440]:
                      - strong [ref=e441]:
                        - generic [ref=e442]: Moss
                        - generic [ref=e443]: 2/4
                      - generic [ref=e444]: ✓ 2 · +20% HP
                      - generic [ref=e445]: ○ 3 · Heal 2 HP/s
                      - generic [ref=e446]: ○ 4 · +12% auto-brace
                    - generic [ref=e447]:
                      - strong [ref=e448]:
                        - generic [ref=e449]: Star
                        - generic [ref=e450]: 0/4
                      - generic [ref=e451]: ○ 2 · +1 patch/find
                      - generic [ref=e452]: ○ 3 · +10% luck
                      - generic [ref=e453]: ○ 4 · Finds are at least Fine
          - generic [ref=e454]: Candidate build, not live. Sample kit and patches stay here; no Relic or market rewards.
```

# Test source

```ts
  36  |   await page.getByRole('button', { name: /^Gather/ }).click(); expect((await saved(page)).patches).toBeGreaterThan(before);
  37  | });
  38  | test('boss keyboard counters work, pounce has cooldown, and the result opens the next room', async ({ page }) => {
  39  |   await open(page, advanceCafe(createCafe(29), 140)); await page.getByRole('button', { name: /^Challenge boss/ }).click();
  40  |   await expect(page.getByRole('region', { name: 'Boss counterplay' })).toContainText('Dodge before the hit');
  41  |   await page.keyboard.press('1'); await page.clock.runFor(3000); await expect(page.getByRole('region', { name: 'Boss counterplay' })).toContainText('Recovery');
  42  |   await page.keyboard.press('p'); await expect(page.getByRole('button', { name: /^Pounce/ })).toBeDisabled();
  43  |   for (let t = 0; t < 60; t++) {
  44  |     const panel = page.getByRole('region', { name: 'Boss counterplay' });
  45  |     if (!await panel.isVisible()) break;
  46  |     const tell = (await panel.innerText()).match(/(Dodge|Break|Interrupt) before the hit/);
  47  |     if (tell) {
  48  |       const counter = panel.getByRole('button', { name: new RegExp(`^${tell[1]}`) });
  49  |       if (await counter.isEnabled()) await counter.click();
  50  |     }
  51  |     await page.clock.runFor(1000);
  52  |   }
  53  |   await expect(page.getByTestId('cafe-boss-result')).toContainText(/Perfect|Clear|Close call/);
  54  |   await page.getByRole('button', { name: 'Explore Kitchen →' }).click(); expect((await saved(page)).chapter).toBe(2);
  55  | });
  56  | test('unattended route choices keep the arena and controls in place', async ({ page }) => {
  57  |   await open(page);
  58  |   const route = page.getByRole('region', { name: 'Encounter choice' });
  59  |   const arena = page.getByRole('region', { name: 'Mochi patrols the cafe' });
  60  |   const before = { route: await route.boundingBox(), arena: await arena.boundingBox() };
  61  |   await page.clock.runFor(CONFIG.cafe.firstFindSeconds * 1000);
  62  |   await expect(route).toContainText('Another corner to explore');
  63  |   expect(await route.boundingBox()).toEqual(before.route);
  64  |   expect(await arena.boundingBox()).toEqual(before.arena);
  65  |   await page.clock.runFor((CONFIG.cafe.encounterSeconds - CONFIG.cafe.firstFindSeconds) * 1000);
  66  |   await expect(route.getByRole('button', { name: /^Gather/ })).toBeVisible();
  67  |   expect(await route.boundingBox()).toEqual(before.route);
  68  |   expect(await arena.boundingBox()).toEqual(before.arena);
  69  | });
  70  | test('recovery only promises bonus damage after a matching counter', async ({ page }) => {
  71  |   const missed = advanceCafe(actCafe(advanceCafe(createCafe(), 140), { type: 'fight' }), CONFIG.cafe.boss.windupSeconds);
  72  |   await open(page, missed);
  73  |   await expect(page.getByRole('region', { name: 'Boss counterplay' })).toContainText('No bonus opening this time');
  74  |   await expect(page.locator('.cafe-cue')).not.toContainText('Pounce now for extra damage');
  75  | });
  76  | test('chosen craft, honest odds, safe stitch, protected loadouts and set collection work end to end', async ({ page }) => {
  77  |   const s = createCafe(); s.patches = 100;
  78  |   await open(page, s); await nav(page, 'Workshop'); await page.getByLabel('Set', { exact: true }).selectOption('star');
  79  |   await page.getByLabel('Slot', { exact: true }).selectOption('charm'); await page.getByRole('button', { name: /^Craft Star charm/ }).click();
  80  |   expect((await saved(page)).inventory.at(-1)).toMatchObject({ set: 'star', slot: 'charm' });
  81  |   await expect(page.getByTestId('cafe-adventure')).toContainText('Bright 8% · Fine 20% · Plain 72%');
  82  |   await page.getByRole('button', { name: /^Steady stitch/ }).click(); expect((await saved(page)).inventory[0]!.level).toBe(1);
  83  |   await nav(page, 'Wardrobe'); await page.getByRole('button', { name: 'Save kit A', exact: true }).click();
  84  |   const item = page.getByRole('list', { name: 'Adventure kit items' }).getByRole('button', { name: /Star charm/ });
  85  |   await item.click(); await page.getByRole('button', { name: 'Equip this piece', exact: true }).click();
  86  |   await page.getByRole('button', { name: 'Save kit B', exact: true }).click(); await page.getByRole('button', { name: 'Wear A', exact: true }).click();
  87  |   await expect(page.getByRole('button', { name: /^Recycle/ })).toBeDisabled();
  88  |   await page.getByRole('button', { name: 'Wear B', exact: true }).click(); expect((await saved(page)).equipped.charm).toBe((await saved(page)).loadouts.B!.charm);
  89  |   await nav(page, 'Journal'); await expect(page.getByText('The patchwork collection')).toBeVisible();
  90  |   await expect(page.getByTestId('cafe-adventure')).toContainText('✓ charm');
  91  | });
  92  | test('away summary is capped and a tour explains, preserves and can undo its reset', async ({ page }) => {
  93  |   const s = createCafe(); s.chapter = 3; s.clears = [1, 2, 3]; s.xp = 80;
  94  |   await open(page, s, 86_400_000); await expect(page.getByRole('region', { name: 'While you were away' })).toContainText('+30 local patches');
  95  |   await page.getByRole('button', { name: 'Welcome home', exact: true }).click(); await nav(page, 'Cafe');
  96  |   await expect(page.getByTestId('cafe-adventure')).toContainText('capped at +15%');
  97  |   await page.getByRole('button', { name: /Preview a new tour/ }).click();
  98  |   await page.getByRole('button', { name: 'Start new tour' }).click(); expect((await saved(page)).tours).toBe(1);
  99  |   await page.getByRole('button', { name: /Undo/ }).click(); expect((await saved(page)).chapter).toBe(3); expect((await saved(page)).tours).toBe(0);
  100 | });
  101 | test('Spark preview respects the remaining stitch cap and affixes explain their effect', async ({ page }) => {
  102 |   const s = createCafe(); s.patches = 100; s.inventory[0]!.level = CONFIG.cafe.gear.maxLevel - 1;
  103 |   await open(page, s); await nav(page, 'Workshop');
  104 |   await expect(page.getByRole('button', { name: /^Spark stitch/ })).toContainText('chance of +1');
  105 |   await nav(page, 'Wardrobe');
  106 |   await expect(page.getByTestId('cafe-adventure')).toContainText(`Cushioned: +${CONFIG.cafe.gear.cushionedHp} base HP, scaled by quality.`);
  107 | });
  108 | test('the next room is visible immediately after a win at the minimum desktop size', async ({ page }) => {
  109 |   await page.setViewportSize({ width: 1280, height: 720 });
  110 |   const s = advanceCafe(actCafe(advanceCafe(createCafe(), 140), { type: 'fight' }), 90);
  111 |   expect(s.lastBoss?.won).toBe(true); await open(page, s);
  112 |   await expect(page.getByRole('button', { name: 'Explore Kitchen →', exact: true })).toBeInViewport({ ratio: 1 });
  113 | });
  114 | test('difficulty locks during a fight and assist remains explicit and optional', async ({ page }) => {
  115 |   const s = advanceCafe(createCafe(), 140); s.losses = CONFIG.cafe.assist.afterLosses;
  116 |   await open(page, s); await page.getByLabel('Challenge tier').selectOption('2'); await page.getByRole('button', { name: /^Challenge boss/ }).click();
  117 |   await expect(page.getByTestId('cafe-adventure')).toContainText('Assist is on'); await nav(page, 'Cafe');
  118 |   await expect(page.getByRole('checkbox', { name: /Gentle assist/ })).toBeDisabled();
  119 |   await page.getByRole('button', { name: /Boss in progress/ }).click(); await expect(page.getByRole('region', { name: 'Boss counterplay' })).toBeVisible();
  120 | });
  121 | test('Sample choices persist through reload without writing to the main economy', async ({ page }) => {
  122 |   const s = createCafe(); s.patches = 100; await open(page, s);
  123 |   const before = await page.evaluate(key => localStorage.getItem(key), key);
  124 |   await nav(page, 'Workshop'); await page.getByRole('button', { name: /^Craft Moss paw/ }).click();
  125 |   await nav(page, 'Cafe'); await page.getByRole('button', { name: /^Brave paws/ }).click();
  126 |   const local = await saved(page);
  127 |   expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(before);
  128 |   await page.clock.resume(); await page.reload(); await expect(page.getByTestId('cafe-adventure')).toBeVisible();
  129 |   const restored = await saved(page); expect(restored.inventory).toEqual(local.inventory); expect(restored.mastery).toBe('bold');
  130 | });
  131 | for (const [width, height] of [[1280,720],[1440,900],[1920,1080]] as const) test(`all adventure pages fit desktop ${width}x${height}`, async ({ page }) => {
  132 |   await page.setViewportSize({width,height}); await page.emulateMedia({reducedMotion:'reduce'}); await open(page, advanceCafe(createCafe(), 140));
  133 |   for (const name of ['Patrol','Wardrobe','Workshop','Journal','Cafe']) {
  134 |     await nav(page,name); await expect(page.getByRole('region',{name:`${name} page`,exact:true})).toBeVisible();
  135 |     expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)).toBe(false);
> 136 |     await page.locator('.cafe-shell img').evaluateAll(nodes => Promise.all(nodes.map(n => (n as HTMLImageElement).decode())));
      |                                           ^ Error: locator.evaluateAll: Test timeout of 30000ms exceeded.
  137 |     const bad = await page.locator('.cafe-shell img').evaluateAll(nodes => nodes.filter(n => !(n as HTMLImageElement).complete || !(n as HTMLImageElement).naturalWidth).map(n => n.getAttribute('src')));
  138 |     expect(bad).toEqual([]); await page.getByRole('region',{name:`${name} page`,exact:true}).focus(); await expect(page.getByRole('region',{name:`${name} page`,exact:true})).toBeFocused();
  139 |   }
  140 | });
  141 | 
```