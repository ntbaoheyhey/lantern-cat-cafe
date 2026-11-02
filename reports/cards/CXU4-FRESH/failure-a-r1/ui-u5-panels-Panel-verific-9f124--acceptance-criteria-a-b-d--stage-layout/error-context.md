# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/u5-panels.spec.ts >> Panel verification at desktop (1280x720) >> panel Help satisfies acceptance criteria (a, b, d)
- Location: e2e/ui/u5-panels.spec.ts:45:7

# Error details

```
Error: Expected exactly 1 primary action in Help, found 0

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation "Game menu" [ref=e4]:
    - generic [ref=e5]:
      - button "Taskbar Hero home" [ref=e6] [cursor=pointer]:
        - img "Portrait of Mochi the cat" [ref=e7]
      - tablist "Game panel tabs" [ref=e264]:
        - tab "Home" [ref=e265] [cursor=pointer]
        - tab "Bag" [ref=e270] [cursor=pointer]
        - tab "Map" [ref=e276] [cursor=pointer]
        - tab "Forge" [ref=e282] [cursor=pointer]
        - tab "Market" [ref=e287] [cursor=pointer]
        - tab "Hero" [ref=e293] [cursor=pointer]
        - tab "Help" [selected] [ref=e300] [cursor=pointer]
    - generic "Avalanche Fuji Testnet" [ref=e307]: Fuji
  - generic [ref=e310]:
    - banner [ref=e311]:
      - region "Cat status" [ref=e312]:
        - generic [ref=e313]:
          - list "Currencies and keys" [ref=e314]:
            - listitem "Fish 200" [ref=e315]:
              - generic [aria-hidden] [ref=e321]: Fish
              - generic [aria-hidden] [ref=e322]: "200"
            - listitem "Yarn 35" [ref=e323]:
              - generic [aria-hidden] [ref=e328]: Yarn
              - generic [aria-hidden] [ref=e329]: "35"
            - listitem "Cat Keys 2 of 5" [ref=e330]:
              - generic [aria-hidden] [ref=e333]: Cat Keys
              - generic [aria-hidden] [ref=e334]: 2/5
          - generic [ref=e336]:
            - generic [ref=e337]: Lv 20
            - progressbar "Experience" [ref=e338]
            - generic [aria-hidden] [ref=e339]: 0 / 517 XP
          - group "Chapter 2 Kitchen, round 5 of 10, 5 of 10 monsters" [ref=e341]:
            - generic [aria-hidden] [ref=e342]: Chapter 2 · Round 5 · 5/10
          - generic [ref=e343]: Power 360
      - generic [ref=e346]:
        - status [ref=e348]:
          - generic [aria-hidden] [ref=e349]: ●
          - generic [ref=e350]: Live
        - generic "Wallet" [ref=e352]:
          - link "Get a browser wallet" [ref=e353] [cursor=pointer]:
            - /url: https://core.app
    - generic [ref=e354]:
      - heading "Taskbar Hero" [level=1] [ref=e355]
      - generic [ref=e357]:
        - generic [aria-hidden] [ref=e358]: Next
        - 'button "Next: Explore the chapter and challenge its boss" [ref=e359] [cursor=pointer]'
    - main [ref=e360]:
      - tabpanel "Help" [ref=e362]:
        - generic [ref=e363]:
          - heading "Help" [level=2] [ref=e364]
          - generic [ref=e366]:
            - tablist "Help sections" [ref=e367]:
              - tab "Guide" [active] [selected] [ref=e368] [cursor=pointer]
            - tabpanel "Guide" [ref=e369]:
              - generic [ref=e370]:
                - generic [ref=e371]:
                  - generic [ref=e372]: Cat Café Guide
                  - paragraph [ref=e373]: Learn how Mochi explores, levels up, and finds treasures while you work.
                - generic [ref=e374]:
                  - complementary "Help topics" [ref=e375]:
                    - generic [ref=e376]: Search help
                    - searchbox "Search help" [ref=e377]
                    - status [ref=e378]: 6 topics
                    - button "Getting started" [ref=e379] [cursor=pointer]:
                      - text: Getting started
                      - generic [aria-hidden] [ref=e380]: ›
                    - button "Classes" [ref=e381] [cursor=pointer]:
                      - text: Classes
                      - generic [aria-hidden] [ref=e382]: ›
                    - button "Chapters and rounds" [ref=e383] [cursor=pointer]:
                      - text: Chapters and rounds
                      - generic [aria-hidden] [ref=e384]: ›
                    - button "Cat Keys and bosses" [ref=e385] [cursor=pointer]:
                      - text: Cat Keys and bosses
                      - generic [aria-hidden] [ref=e386]: ›
                    - button "Forge" [ref=e387] [cursor=pointer]:
                      - text: Forge
                      - generic [aria-hidden] [ref=e388]: ›
                    - button "Drop rates" [ref=e389] [cursor=pointer]:
                      - text: Drop rates
                      - generic [aria-hidden] [ref=e390]: ›
                  - generic [ref=e391]:
                    - generic [ref=e392]:
                      - heading "Getting started" [level=3] [ref=e393]
                      - paragraph [ref=e394]: Mochi the cat naps, wanders and fights on the stage while you work. Pick a class to begin; idle claims earn Fish, Yarn, XP and materials.
                    - button "Start Exploring" [ref=e396] [cursor=pointer]
```

# Test source

```ts
  30  |     test.beforeEach(async ({ page }) => {
  31  |       await page.setViewportSize({ width: vp.width, height: vp.height });
  32  |       const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
  33  |       await page.addInitScript(
  34  |         ({ key, save }) => {
  35  |           window.localStorage.setItem(key, save);
  36  |           window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  37  |         },
  38  |         { key: STORAGE_KEY, save },
  39  |       );
  40  |       await page.goto('/');
  41  |       await page.locator('.v2-shell').waitFor();
  42  |     });
  43  | 
  44  |     for (const panelName of PANELS) {
  45  |       test(`panel ${panelName} satisfies acceptance criteria (a, b, d)`, async ({ page }) => {
  46  |         await openPanel(page, panelName, vp.width);
  47  | 
  48  |         // (a) No panel content background has relative luminance > 0.5 (no cream boxes), dialogs excluded
  49  |         const luminanceResults = await page.evaluate((targetPanel) => {
  50  |           const panelMap: Record<string, string> = {
  51  |             Forge: '.forge-panel',
  52  |             Boss: '.boss-gate-panel',
  53  |             Help: '.help-v2-container',
  54  |             Market: '.market',
  55  |           };
  56  |           const root = document.querySelector(panelMap[targetPanel]!);
  57  |           if (!root) return [];
  58  | 
  59  |           function parseLuminance(rgbStr: string): number | null {
  60  |             const m = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  61  |             if (!m) return null;
  62  |             const r = Number(m[1]),
  63  |               g = Number(m[2]),
  64  |               b = Number(m[3]);
  65  |             const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  66  |             if (a === 0) return null; // transparent
  67  |             const sRGB = [r, g, b].map((v) => {
  68  |               const s = v / 255;
  69  |               return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  70  |             });
  71  |             return 0.2126 * sRGB[0]! + 0.7152 * sRGB[1]! + 0.0722 * sRGB[2]!;
  72  |           }
  73  | 
  74  |           // Check panel background and all content boxes/sections (excluding buttons, accent bars, chips, dialogs)
  75  |           const elements = [root, ...Array.from(root.querySelectorAll('*'))];
  76  |           const overThreshold: { tag: string; cls: string; bg: string; lum: number }[] = [];
  77  | 
  78  |           for (const el of elements) {
  79  |             // Dialogs excluded
  80  |             if (el.closest('.loot-dialog, [role="dialog"], .dialog')) continue;
  81  |             // Buttons, accent indicators, chips and interactive controls use accent/status colors
  82  |             if (el.closest('button, [role="button"], [role="tab"], .boss-bar-fill, .chip, svg')) continue;
  83  | 
  84  |             const style = window.getComputedStyle(el);
  85  |             const lum = parseLuminance(style.backgroundColor);
  86  |             if (lum !== null && lum > 0.5) {
  87  |               overThreshold.push({
  88  |                 tag: el.tagName,
  89  |                 cls: el.className,
  90  |                 bg: style.backgroundColor,
  91  |                 lum,
  92  |               });
  93  |             }
  94  |           }
  95  |           return overThreshold;
  96  |         }, panelName);
  97  |         expect(luminanceResults, `Cream/white elements found in ${panelName}: ${JSON.stringify(luminanceResults)}`).toHaveLength(0);
  98  | 
  99  |         // (b) Exactly one visible element with the primary button class/accent background per panel view
  100 |         // In interactive views with primary actions (Forge, Boss, Help), exactly 1 primary action button.
  101 |         // In Market (when disconnected from Web3), 0 primary action buttons.
  102 |         const primaryCount = await page.evaluate((targetPanel) => {
  103 |           const panelMap: Record<string, string> = {
  104 |             Forge: '.forge-panel',
  105 |             Boss: '.boss-gate-panel',
  106 |             Help: '.help-v2-container',
  107 |             Market: '.market',
  108 |           };
  109 |           const root = document.querySelector(panelMap[targetPanel]!);
  110 |           if (!root) return 0;
  111 | 
  112 |           const buttons = Array.from(root.querySelectorAll('button:not([role="tab"]), a[role="button"]:not([role="tab"])'));
  113 |           const visiblePrimary = buttons.filter((btn) => {
  114 |             const el = btn as HTMLElement;
  115 |             // Check visibility
  116 |             const style = window.getComputedStyle(el);
  117 |             if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  118 |             const isPixelBtn = el.classList.contains('pixel-btn') || el.classList.contains('forge-btn-primary') || el.classList.contains('boss-fight-btn');
  119 |             const m = style.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  120 |             const isAccentBg = m && Number(m[1]) > 200 && Number(m[2]) > 140 && Number(m[3]) < 150;
  121 |             return isPixelBtn || isAccentBg;
  122 |           });
  123 |           return visiblePrimary.length;
  124 |         }, panelName);
  125 | 
  126 |         if (panelName === 'Market') {
  127 |           // Market without connected wallet has no active Buy button
  128 |           expect(primaryCount).toBeLessThanOrEqual(1);
  129 |         } else {
> 130 |           expect(primaryCount, `Expected exactly 1 primary action in ${panelName}, found ${primaryCount}`).toBe(1);
      |                                                                                                            ^ Error: Expected exactly 1 primary action in Help, found 0
  131 |         }
  132 | 
  133 |         // (d) No text clipping, no horizontal overflow
  134 |         const overflow = await page.evaluate(() => {
  135 |           const doc = document.documentElement;
  136 |           const body = document.body;
  137 |           const panel = document.querySelector('.v2-tabpanel') || document.querySelector('[role="tabpanel"]');
  138 |           return {
  139 |             docOverflow: doc.scrollWidth > doc.clientWidth + 1,
  140 |             bodyOverflow: body.scrollWidth > body.clientWidth + 1,
  141 |             panelOverflow: panel ? panel.scrollWidth > panel.clientWidth + 1 : false,
  142 |           };
  143 |         });
  144 |         expect(overflow.docOverflow, 'Document has horizontal overflow').toBe(false);
  145 |         expect(overflow.bodyOverflow, 'Body has horizontal overflow').toBe(false);
  146 |         expect(overflow.panelOverflow, 'Panel has horizontal overflow').toBe(false);
  147 |       });
  148 |     }
  149 | 
  150 |     // (c) The Forge segmented control's three segments share the same top and height
  151 |     test('Forge segmented control segments share the same top and height', async ({ page }) => {
  152 |       await openPanel(page, 'Forge', vp.width);
  153 | 
  154 |       const tabCraft = page.getByTestId('tab-craft');
  155 |       const tabSalvage = page.getByTestId('tab-salvage');
  156 |       const tabRelic = page.getByTestId('tab-relic');
  157 | 
  158 |       await expect(tabCraft).toBeVisible();
  159 |       await expect(tabSalvage).toBeVisible();
  160 |       await expect(tabRelic).toBeVisible();
  161 | 
  162 |       const boxCraft = await tabCraft.boundingBox();
  163 |       const boxSalvage = await tabSalvage.boundingBox();
  164 |       const boxRelic = await tabRelic.boundingBox();
  165 | 
  166 |       expect(boxCraft).not.toBeNull();
  167 |       expect(boxSalvage).not.toBeNull();
  168 |       expect(boxRelic).not.toBeNull();
  169 | 
  170 |       // Share same top (within 1.5px subpixel tolerance)
  171 |       expect(Math.abs(boxCraft!.y - boxSalvage!.y)).toBeLessThanOrEqual(1.5);
  172 |       expect(Math.abs(boxSalvage!.y - boxRelic!.y)).toBeLessThanOrEqual(1.5);
  173 | 
  174 |       // Share same height (within 1.5px subpixel tolerance)
  175 |       expect(Math.abs(boxCraft!.height - boxSalvage!.height)).toBeLessThanOrEqual(1.5);
  176 |       expect(Math.abs(boxSalvage!.height - boxRelic!.height)).toBeLessThanOrEqual(1.5);
  177 |     });
  178 |   });
  179 | }
  180 | 
```