# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: polish.spec.ts >> Home fixed controls and claim dots reflect actionable model state
- Location: ../../tools/ui-v3/specs/polish.spec.ts:2:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('[data-home-destination="Recruit"] .uv-dot')
Expected: 0
Received: 1
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" locator('[data-home-destination="Recruit"] .uv-dot') with timeout 15000ms
  - waiting for locator('[data-home-destination="Recruit"] .uv-dot')
    34 × locator resolved to 1 element
       - unexpected value "1"

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
      - 'generic "stamps: 1" [ref=e32]':
        - generic [aria-hidden] [ref=e33]: ✉
        - text: "1"
        - generic [ref=e34]: stamps
      - 'generic "threads: 40" [ref=e35]':
        - generic [aria-hidden] [ref=e36]: ⌁
        - text: "40"
        - generic [ref=e37]: threads
    - button "Relic · Fuji" [ref=e38] [cursor=pointer]
    - button "Open menu" [ref=e41] [cursor=pointer]
  - complementary "Ready to collect" [ref=e44]:
    - button "Free recruit" [ref=e45] [cursor=pointer]
  - contentinfo [ref=e50]:
    - navigation "Cafe dock" [ref=e51]:
      - button [ref=e52] [cursor=pointer]
      - button [ref=e57] [cursor=pointer]
      - button [ref=e61] [cursor=pointer]
      - button [ref=e65] [cursor=pointer]
      - button [ref=e70] [cursor=pointer]
    - generic [ref=e74]:
      - button "Open route map" [ref=e75] [cursor=pointer]: ⌁
      - button "Night Patrol Your first adventure" [ref=e76] [cursor=pointer]:
        - generic [ref=e79]:
          - text: Night Patrol
          - generic [ref=e80]: Your first adventure
        - generic [aria-hidden] [ref=e81]: →
  - status
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | test('Home fixed controls and claim dots reflect actionable model state',async({page})=>{
  3  |  await page.goto('?ui=v3');await page.locator('.uv-shell').waitFor();
  4  |  await page.evaluate(()=>{const m=window.__depthReview!;m.state.freeInvite=true;m.state.account.currencies.stamps=1;for(const q of Object.values(m.state.account.quests)){q.progress=999;q.claimed=false}m.notify(false)});
> 5  |  await expect(page.locator('[data-home-destination="Recruit"] .uv-dot')).toHaveCount(0);await expect(page.locator('[data-home-destination="Team"] .uv-dot')).toHaveCount(0);
     |                                                                          ^ Error: expect(locator).toHaveCount(expected) failed
  6  |  expect(await page.locator('.uv-hud button,.uv-events button,.uv-dock button').count()).toBeLessThanOrEqual(10);
  7  |  await page.evaluate(()=>{const m=window.__depthReview!;m.start(1,'campaign',1);m.go('hub')});
  8  |  await expect(page.locator('.uv-events button')).toHaveCount(0);await expect(page.locator('.uv-dock .uv-dot')).toHaveCount(0);
  9  | });
  10 | test('keyboard cycles a sheet and returns focus; reduced motion removes home animation',async({page})=>{
  11 |  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('?ui=v3');const cats=page.getByRole('button',{name:'Cats',exact:true});await cats.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'Cats'})).toBeVisible();await page.keyboard.press('Shift+Tab');await expect(page.locator('.uv-sheet :focus')).toHaveCount(1);await page.keyboard.press('Escape');await expect(cats).toBeFocused();
  12 |  expect(await page.locator('.uv-home-crew figure').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
  13 | });
  14 | test('first real practice fight wins within 25 seconds using two clicks',async({page})=>{
  15 |  await page.goto('?ui=v3');await page.getByRole('button',{name:'Night Patrol'}).click();const started=Date.now();await page.getByRole('button',{name:'Fight',exact:true}).click();await expect(page.getByRole('heading',{name:'Victory',exact:true})).toBeVisible({timeout:25000});expect(Date.now()-started).toBeLessThanOrEqual(25000);await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByRole('button',{name:'Night Patrol'})).toBeVisible();
  16 | });
  17 | for(const look of ['on','off'])for(const [width,height]of [[1024,600],[1280,720],[1440,900],[1920,1080]])test(`no overflow or clipped controls ${look} ${width}`,async({page})=>{
  18 |  await page.setViewportSize({width:width!,height:height!});await page.goto(`?ui=v3&look=${look}`);await page.locator('.uv-shell').waitFor();
  19 |  const check=async()=>{expect(await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,clipped:Array.from(document.querySelectorAll<HTMLElement>('.uv-shell button,.uv-shell h1,.uv-shell h2,.uv-shell h3,.uv-shell figcaption')).filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='hidden').map(e=>e.textContent)}))).toEqual({overflow:false,clipped:[]})};await check();
  20 |  for(const name of ['Cats','Team','Bag','Recruit','Events','Relic · Fuji']){await page.getByRole('button',{name,exact:true}).click();await page.locator('.uv-sheet').waitFor();await page.waitForTimeout(100);await check();await page.keyboard.press('Escape')}
  21 |  await page.getByRole('button',{name:'Night Patrol'}).click();await page.getByRole('button',{name:'Fight',exact:true}).waitFor();await check();
  22 | });
  23 | 
  24 | test('collecting Night tips shows committed currency feedback',async({page})=>{
  25 |  await page.goto('?ui=v3');await page.locator('.uv-shell').waitFor();await page.evaluate(()=>{const m=window.__depthReview!;m.state.idle.lastAt=m.cafeNow-3600000;m.notify(false)});const before=await page.evaluate(()=>window.__depthReview!.state.account.currencies);await page.getByRole('button',{name:/Collect Night tips/}).click();await expect(page.locator('.uv-reward-fly>span').first()).toBeVisible();const after=await page.evaluate(()=>window.__depthReview!.state.account.currencies);expect(Object.keys(after).some(k=>after[k as keyof typeof after]>before[k as keyof typeof before])).toBe(true);
  26 | });
  27 | 
```