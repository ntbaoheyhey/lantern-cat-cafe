# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recruit-reveal.spec.ts >> ten recruits keep legacy results, odds and pity; summary sorts rarity
- Location: ../../tools/ui-v3/specs/recruit-reveal.spec.ts:17:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

- Expected  - 4
+ Received  + 4

  Published rarity odds
  Rarity	Base	Next pull
- Common	60%	60.00%
+ common	60%	60.00%
- Rare	30%	30.00%
+ rare	30%	30.00%
- Epic	9%	9.00%
+ epic	9%	9.00%
- Legendary	1%	1.00%
+ legendary	1%	1.00%
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic "Living cafe" [ref=e3]:
    - img "Lantern-lit cafe, ready for the evening shift" [ref=e4]
    - generic "Your current crew" [ref=e5]:
      - figure "Mochi" [ref=e6]:
        - img "Mochi" [ref=e7]
      - figure "Soot" [ref=e9]:
        - img "Soot" [ref=e10]
      - figure "Clover" [ref=e12]:
        - img "Clover" [ref=e13]
    - generic:
      - text: THE EVENING SHIFT
      - heading "A little light. A brave little crew." [level=1]: A little light.A brave little crew.
    - button "Recruit counter" [ref=e15] [cursor=pointer]: Recruit counter ↗
    - button "Notice board" [ref=e16] [cursor=pointer]: Notice board ↗
    - button "Collect Night tips 0.0/8 h" [disabled] [ref=e17]:
      - generic [ref=e20]: Night tips 0.0/8 h
      - generic [ref=e21]: Ready in 15 min
  - banner [ref=e22]:
    - generic [ref=e23]:
      - generic [ref=e24]: Lv. 1
      - generic [ref=e26]:
        - text: The Lantern
        - generic [ref=e27]: Team power 727
    - generic [ref=e28]:
      - 'generic "fish: 600" [ref=e29]':
        - generic [aria-hidden] [ref=e30]: ◈
        - text: "600"
        - generic [ref=e31]: fish
      - 'generic "stamps: 3500" [ref=e32]':
        - generic [aria-hidden] [ref=e33]: ✉
        - text: 3,500
        - generic [ref=e34]: stamps
      - 'generic "threads: 40" [ref=e35]':
        - generic [aria-hidden] [ref=e36]: ⌁
        - text: "40"
        - generic [ref=e37]: threads
    - button "Relic · Fuji" [ref=e38] [cursor=pointer]
    - button "Open menu" [ref=e41] [cursor=pointer]
  - button "Close sheet" [ref=e44] [cursor=pointer]
  - dialog "Recruit" [ref=e45]:
    - banner [ref=e46]:
      - heading "Recruit" [level=1] [ref=e47]
      - button "Close" [ref=e48] [cursor=pointer]
    - main [ref=e51]:
      - generic [ref=e52]:
        - navigation "Invitation banners" [ref=e53]:
          - button "Cafe Guestbook" [pressed] [ref=e54] [cursor=pointer]
          - button "Marigold at Closing Time" [ref=e55] [cursor=pointer]
          - button "Mending Basket" [ref=e56] [cursor=pointer]
        - generic [ref=e57]:
          - complementary [ref=e58]:
            - text: THE LANTERN · INVITATIONS
            - heading "A knock tonight" [level=2] [ref=e59]
            - paragraph [ref=e60]: A new face. A new favorite.
            - strong [ref=e61]: 3,500 stamps
            - paragraph [ref=e62]:
              - text: Legendary within 14
              - generic [ref=e63]: 10/24 pulls
            - generic [ref=e64]:
              - button "Welcome a friend" [ref=e65] [cursor=pointer]
              - button "Recruit ×1 · 150" [ref=e66] [cursor=pointer]
              - button "Recruit ×10 · 1500" [ref=e67] [cursor=pointer]
            - generic [ref=e68]: 20 invitations left today · Earned stamps only
            - group [ref=e69]:
              - generic "Odds" [active] [ref=e70] [cursor=pointer]
              - paragraph [ref=e71]: Earned stamps only. Unowned cats preferred within the rolled rarity.
              - paragraph [ref=e72]: Each draw is saved before its reveal. Skipping keeps the same reward. New discoveries are preferred within the rolled rarity and featured group.
              - paragraph [ref=e73]: Soft pity starts at 13, adding 7 percentage points per draw. Legendary by 24; each Legendary resets this banner’s counter. Up to 30 daily invitations.
              - table [ref=e74]:
                - caption [ref=e75]: Published rarity odds
                - rowgroup [ref=e76]:
                  - row [ref=e77]:
                    - columnheader "Rarity" [ref=e78]
                    - columnheader "Base" [ref=e79]
                    - columnheader "Next pull" [ref=e80]
                - rowgroup [ref=e81]:
                  - row [ref=e82]:
                    - rowheader "common" [ref=e83]
                    - cell "60%" [ref=e84]
                    - cell "60.00%" [ref=e85]
                  - row [ref=e86]:
                    - rowheader "rare" [ref=e87]
                    - cell "30%" [ref=e88]
                    - cell "30.00%" [ref=e89]
                  - row [ref=e90]:
                    - rowheader "epic" [ref=e91]
                    - cell "9%" [ref=e92]
                    - cell "9.00%" [ref=e93]
                  - row [ref=e94]:
                    - rowheader "legendary" [ref=e95]
                    - cell "1%" [ref=e96]
                    - cell "1.00%" [ref=e97]
              - group [ref=e98]:
                - generic "Exact next-pull probabilities" [ref=e99] [cursor=pointer]
          - region "Invitation reveal" [ref=e100]:
            - heading "Welcome home" [level=2] [ref=e101]
            - generic "Invitation results" [ref=e102]:
              - article [ref=e103]:
                - text: epic
                - heading "Biscuit" [level=2] [ref=e105]
                - paragraph [ref=e106]: New!
              - article [ref=e107]:
                - text: rare
                - heading "Mallow" [level=2] [ref=e109]
                - paragraph [ref=e110]: New!
              - article [ref=e111]:
                - text: rare
                - heading "Panko" [level=2] [ref=e113]
                - paragraph [ref=e114]: New!
              - article [ref=e115]:
                - text: rare
                - heading "Sorrel" [level=2] [ref=e117]
                - paragraph [ref=e118]: New!
              - article [ref=e119]:
                - text: common
                - heading "Clover" [level=2] [ref=e121]
                - paragraph [ref=e122]: 2 matching shards
              - article [ref=e123]:
                - text: common
                - heading "Clover" [level=2] [ref=e125]
                - paragraph [ref=e126]: 2 matching shards
              - article [ref=e127]:
                - text: common
                - heading "Mochi" [level=2] [ref=e129]
                - paragraph [ref=e130]: 2 matching shards
              - article [ref=e131]:
                - text: common
                - heading "Clover" [level=2] [ref=e133]
                - paragraph [ref=e134]: 2 matching shards
              - article [ref=e135]:
                - text: common
                - heading "Clover" [level=2] [ref=e137]
                - paragraph [ref=e138]: 2 matching shards
              - article [ref=e139]:
                - text: common
                - heading "Mochi" [level=2] [ref=e141]
                - paragraph [ref=e142]: 2 matching shards
            - button "Meet your cats" [ref=e143] [cursor=pointer]
        - group [ref=e144]:
          - generic "Recent invitations (10)" [ref=e145] [cursor=pointer]
        - group [ref=e146]:
          - generic "Choose with marks" [ref=e147] [cursor=pointer]
          - option "Companion" [selected]
          - option "Equipment"
          - option "Choose a reward" [selected]
          - option "Mochi · common"
          - option "Soot · common"
          - option "Clover · common"
          - option "Panko · rare"
          - option "Mallow · rare"
          - option "Sorrel · rare"
          - option "Biscuit · epic"
          - option "Inkcap · epic"
          - option "Cinnamon · epic"
          - option "Brioche · legendary"
          - option "Velvet · legendary"
          - option "Marigold · legendary"
  - status
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | 
  3  | test('recruit has four beats under four seconds, saved parity, second-pull skip and odds',async({page})=>{
  4  |  await page.goto('?ui=v3');await page.getByRole('button',{name:'Recruit',exact:true}).click();await page.locator('.uv-recruit-stage').waitFor();
  5  |  const expected=await page.evaluate(async()=>{const R=await import('/packages/game-rules/src/cardrpg/depth/index.ts');const {firstInvitation}=await import('/packages/game-rules/src/cardrpg/depth/onboarding.ts');const m=window.__depthReview!,copy=structuredClone(m.state);const result=firstInvitation(copy,4);return result;});
  6  |  // Capture the real mutation sequence rather than sampling and missing short beats.
  7  |  await page.evaluate(()=>{window.__beats=[];const el=document.querySelector('.uv-recruit-stage')!;new MutationObserver(()=>{const beat=el.getAttribute('data-beat');if(window.__beats.at(-1)?.beat!==beat)window.__beats.push({beat,at:performance.now()})}).observe(el,{attributes:true,attributeFilter:['data-beat']});});
  8  |  const started=Date.now();await page.getByRole('button',{name:'Welcome a friend',exact:true}).click();await expect(page.getByRole('button',{name:'Skip reveal',exact:true})).toHaveCount(0);
  9  |  await expect(page.locator('.uv-recruit-stage')).toHaveAttribute('data-beat','summary');expect(Date.now()-started).toBeLessThan(4000);
  10 |  const beats=await page.evaluate(()=>window.__beats.map(b=>b.beat));expect(beats).toEqual(['letter','seal','burst','reveal','summary']);
  11 |  const history=await page.evaluate(()=>window.__depthReview!.state.account.history);expect(history).toEqual(expected.state.account.history);
  12 |  await page.evaluate(()=>{window.__depthReview!.state.account.currencies.stamps=5000;window.__depthReview!.notify(false)});
  13 |  await page.getByRole('button',{name:/Recruit ×1 ·/}).click();await page.getByRole('button',{name:'Skip reveal',exact:true}).click();await expect(page.locator('.uv-recruit-stage')).toHaveAttribute('data-beat','summary');
  14 |  await page.getByText('Odds',{exact:true}).click();await expect(page.getByRole('table',{name:'Published rarity odds'})).toBeVisible();
  15 | });
  16 | 
  17 | test('ten recruits keep legacy results, odds and pity; summary sorts rarity',async({page,browser})=>{
  18 |  await page.goto('?ui=v3');await page.getByRole('button',{name:'Recruit',exact:true}).click();await page.locator('.uv-recruit-stage').waitFor();await page.evaluate(()=>{const m=window.__depthReview!;m.state.account.currencies.stamps=5000;m.notify(false)});
  19 |  const initial=await page.evaluate(()=>window.__depthReview!.state);
  20 |  await page.getByRole('button',{name:/Recruit ×10 ·/}).click();await page.getByRole('button',{name:'Skip all',exact:true}).click();
  21 |  await expect(page.locator('.uv-recruit-summary article')).toHaveCount(10);
  22 |  const v3=await page.evaluate(()=>({account:window.__depthReview!.state.account,gear:window.__depthReview!.state.gear}));
  23 |  const rarities=await page.locator('.uv-recruit-summary article>small').allTextContents();const rank={common:0,rare:1,epic:2,legendary:3};expect(rarities).toEqual([...rarities].sort((a,b)=>rank[b as keyof typeof rank]-rank[a as keyof typeof rank]));
  24 |  const legacy=await browser.newPage();await legacy.goto('http://127.0.0.1:5950/tools/ui-v3/index.html?ui=legacy');await legacy.locator('.cr-sidebar').waitFor();await legacy.evaluate(state=>{const m=window.__depthReview!;m.state=state;m.go('gacha');},initial);
  25 |  await legacy.getByRole('button',{name:/Invite ten ·/}).click();await legacy.getByRole('button',{name:'Skip reveal',exact:true}).click();
  26 |  expect(await legacy.evaluate(()=>({account:window.__depthReview!.state.account,gear:window.__depthReview!.state.gear}))).toEqual(v3);
> 27 |  await page.getByText('Odds',{exact:true}).click();await legacy.getByText('Odds and rules',{exact:true}).click();expect(await page.getByRole('table',{name:'Published rarity odds'}).innerText()).toBe(await legacy.getByRole('table',{name:'Published rarity odds'}).innerText());await legacy.close();
     |                                                                                                                                                                                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  28 | });
  29 | 
  30 | test('reduced-motion recruit goes straight to saved results',async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('?ui=v3');await page.getByRole('button',{name:'Recruit',exact:true}).click();await page.locator('.uv-recruit-stage').waitFor();await page.getByRole('button',{name:'Welcome a friend',exact:true}).click();await expect(page.locator('.uv-recruit-stage')).toHaveAttribute('data-beat','summary');await expect(page.locator('.uv-recruit-summary article')).toHaveCount(1);});
  31 | 
  32 | declare global{interface Window{__beats:{beat:string|null;at:number}[]}}
  33 | 
```