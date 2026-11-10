# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: polish.spec.ts >> first real practice fight wins within 25 seconds using two clicks
- Location: ../../tools/ui-v3/specs/polish.spec.ts:14:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Victory', exact: true })
Expected: visible
Timeout: 25000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Victory', exact: true }) with timeout 25000ms
  - waiting for getByRole('heading', { name: 'Victory', exact: true })

```

```yaml
- img "Original 3D cafe battlefield"
- text: Practice Cushion 165/165
- progressbar "Practice Cushion health"
- banner:
  - text: Practice table Wave 1/1 · Round 1
  - button "Change playback speed": ×1
  - button "Pause auto"
  - button "Skip to result"
  - button "Read battle guide": "?"
  - button "More battle options": ⋯
- article:
  - text: Mochi 592/592 HP
  - progressbar "Mochi health"
  - 'progressbar "Mochi ultimate: 2 turns"'
  - text: Ultimate · 2 turns
- article:
  - text: Soot 460/460 HP
  - progressbar "Soot health"
  - 'progressbar "Soot ultimate: 2 turns"'
  - text: Ultimate · 2 turns
- article:
  - text: Clover 384/384 HP
  - progressbar "Clover health"
  - 'progressbar "Clover ultimate: 2 turns"'
  - text: Ultimate · 2 turns
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | test('Home fixed controls and claim dots reflect actionable model state',async({page})=>{
  3  |  await page.goto('?ui=v3');await page.locator('.uv-shell').waitFor();
  4  |  await page.evaluate(()=>{const m=window.__depthReview!;m.state.freeInvite=true;m.state.account.currencies.stamps=1;for(const q of Object.values(m.state.account.quests)){q.progress=999;q.claimed=false}m.notify(false)});
  5  |  await expect(page.locator('[data-home-destination="Recruit"] .uv-dot')).toHaveCount(0);await expect(page.locator('[data-home-destination="Team"] .uv-dot')).toHaveCount(0);
  6  |  expect(await page.locator('.uv-hud button,.uv-events button,.uv-dock button').count()).toBeLessThanOrEqual(10);
  7  |  await page.evaluate(()=>{const m=window.__depthReview!;m.start(1,'campaign',1);m.go('hub')});
  8  |  await expect(page.locator('.uv-events button')).toHaveCount(0);await expect(page.locator('.uv-dock .uv-dot')).toHaveCount(0);
  9  | });
  10 | test('keyboard cycles a sheet and returns focus; reduced motion removes home animation',async({page})=>{
  11 |  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('?ui=v3');const cats=page.getByRole('button',{name:'Cats',exact:true});await cats.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'Cats'})).toBeVisible();await page.keyboard.press('Shift+Tab');await expect(page.locator('.uv-sheet :focus')).toHaveCount(1);await page.keyboard.press('Escape');await expect(cats).toBeFocused();
  12 |  expect(await page.locator('.uv-home-crew figure').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
  13 | });
  14 | test('first real practice fight wins within 25 seconds using two clicks',async({page})=>{
> 15 |  await page.goto('?ui=v3');await page.getByRole('button',{name:'Night Patrol'}).click();const started=Date.now();await page.getByRole('button',{name:'Fight',exact:true}).click();await expect(page.getByRole('heading',{name:'Victory',exact:true})).toBeVisible({timeout:25000});expect(Date.now()-started).toBeLessThanOrEqual(25000);await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByRole('button',{name:'Night Patrol'})).toBeVisible();
     |                                                                                                                                                                                                                                                       ^ Error: expect(locator).toBeVisible() failed
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