import {test,expect} from '@playwright/test';
test('Home fixed controls and claim dots reflect actionable model state',async({page})=>{
 await page.goto('?ui=v3');await page.locator('.uv-shell').waitFor();
 await page.evaluate(()=>{const m=window.__depthReview!;m.state.freeInvite=true;m.state.account.currencies.stamps=1;for(const q of Object.values(m.state.account.quests)){q.progress=999;q.claimed=false}m.notify(false)});
 await expect(page.locator('[data-home-destination="Recruit"] .uv-dot')).toHaveCount(0);await expect(page.locator('[data-home-destination="Team"] .uv-dot')).toHaveCount(0);
 expect(await page.locator('.uv-hud button,.uv-events button,.uv-dock button').count()).toBeLessThanOrEqual(10);
 await page.evaluate(()=>{const m=window.__depthReview!;m.start(1,'campaign',1);m.go('hub')});
 await expect(page.locator('.uv-events button')).toHaveCount(0);await expect(page.locator('.uv-dock .uv-dot')).toHaveCount(0);
});
test('keyboard cycles a sheet and returns focus; reduced motion removes home animation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('?ui=v3');const cats=page.getByRole('button',{name:'Cats',exact:true});await cats.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'Cats'})).toBeVisible();await page.keyboard.press('Shift+Tab');await expect(page.locator('.uv-sheet :focus')).toHaveCount(1);await page.keyboard.press('Escape');await expect(cats).toBeFocused();
 expect(await page.locator('.uv-home-crew figure').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 await expect(page.locator('.uv-lantern')).toHaveCount(2);
 const motion=()=>page.locator('.uv-ambient *').evaluateAll(nodes=>nodes.map(e=>getComputedStyle(e).animationName));
 expect((await motion()).every(name=>name==='none')).toBe(true);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{const m=window.__depthReview!;m.state.settings.reducedMotion=true;m.notify()});
 expect((await motion()).every(name=>name==='none')).toBe(true);
});
test('first real practice fight wins within 25 seconds using two clicks',async({page})=>{
 await page.goto('?ui=v3');await page.getByRole('button',{name:'Night Patrol'}).click();const started=Date.now();await page.getByRole('button',{name:'Fight',exact:true}).click();await expect(page.getByRole('heading',{name:'Victory',exact:true})).toBeVisible({timeout:25000});expect(Date.now()-started).toBeLessThanOrEqual(25000);await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByRole('button',{name:'Night Patrol'})).toBeVisible();
});
for(const look of ['on','off'])for(const [width,height]of [[1024,600],[1280,720],[1440,900],[1920,1080]])test(`no overflow or clipped controls ${look} ${width}`,async({page})=>{
 await page.setViewportSize({width:width!,height:height!});await page.goto(`?ui=v3&look=${look}`);await page.locator('.uv-shell').waitFor();
 const check=async()=>{expect(await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,clipped:Array.from(document.querySelectorAll<HTMLElement>('.uv-shell button,.uv-shell h1,.uv-shell h2,.uv-shell h3,.uv-shell figcaption')).filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='hidden').map(e=>e.textContent)}))).toEqual({overflow:false,clipped:[]})};await check();
 for(const name of ['Cats','Team','Bag','Recruit','Events','Relic · Fuji']){await page.getByRole('button',{name,exact:true}).click();await page.locator('.uv-sheet').waitFor();await page.waitForTimeout(100);await check();await page.keyboard.press('Escape')}
 await page.getByRole('button',{name:'Night Patrol'}).click();await page.getByRole('button',{name:'Fight',exact:true}).waitFor();await check();
});

test('collecting Night tips shows committed currency feedback',async({page})=>{
 await page.goto('?ui=v3');await page.locator('.uv-shell').waitFor();await page.evaluate(()=>{const m=window.__depthReview!;m.state.idle.lastAt=m.cafeNow-3600000;m.notify(false)});const before=await page.evaluate(()=>window.__depthReview!.state.account.currencies);await page.getByRole('button',{name:/Collect Night tips/}).click();await expect(page.locator('.uv-reward-fly>span').first()).toBeVisible();const after=await page.evaluate(()=>window.__depthReview!.state.account.currencies);expect(Object.keys(after).some(k=>after[k as keyof typeof after]>before[k as keyof typeof before])).toBe(true);
});
