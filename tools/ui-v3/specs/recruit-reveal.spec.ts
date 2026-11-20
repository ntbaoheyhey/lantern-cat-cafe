import {test,expect} from '@playwright/test';

test('recruit has four beats under four seconds, saved parity, second-pull skip and odds',async({page})=>{
 await page.goto('?ui=v3');await page.getByRole('button',{name:'Recruit',exact:true}).click();await page.locator('.uv-recruit-stage').waitFor();
 const expected=await page.evaluate(async()=>{const R=await import('/packages/game-rules/src/cardrpg/depth/index.ts');const {firstInvitation}=await import('/packages/game-rules/src/cardrpg/depth/onboarding.ts');const m=window.__depthReview!,copy=structuredClone(m.state);const result=firstInvitation(copy,4);return result;});
 // Capture the real mutation sequence rather than sampling and missing short beats.
 await page.evaluate(()=>{window.__beats=[];const el=document.querySelector('.uv-recruit-stage')!;new MutationObserver(()=>{const beat=el.getAttribute('data-beat');if(window.__beats.at(-1)?.beat!==beat)window.__beats.push({beat,at:performance.now()})}).observe(el,{attributes:true,attributeFilter:['data-beat']});});
 const started=Date.now();await page.getByRole('button',{name:'Welcome a friend',exact:true}).click();await expect(page.getByRole('button',{name:'Skip reveal',exact:true})).toHaveCount(0);
 await expect(page.locator('.uv-recruit-stage')).toHaveAttribute('data-beat','summary');expect(Date.now()-started).toBeLessThan(4000);
 const beats=await page.evaluate(()=>window.__beats.map(b=>b.beat));expect(beats).toEqual(['letter','seal','burst','reveal','summary']);
 const history=await page.evaluate(()=>window.__depthReview!.state.account.history);expect(history).toEqual(expected.state.account.history);
 await page.evaluate(()=>{window.__depthReview!.state.account.currencies.stamps=5000;window.__depthReview!.notify(false)});
 await page.getByRole('button',{name:/Recruit ×1 ·/}).click();await page.getByRole('button',{name:'Skip reveal',exact:true}).click();await expect(page.locator('.uv-recruit-stage')).toHaveAttribute('data-beat','summary');
 await page.getByText('Odds',{exact:true}).click();await expect(page.getByRole('table',{name:'Published rarity odds'})).toBeVisible();
});

test('ten recruits keep legacy results, odds and pity; summary sorts rarity',async({page,browser})=>{
 await page.goto('?ui=v3');await page.getByRole('button',{name:'Recruit',exact:true}).click();await page.locator('.uv-recruit-stage').waitFor();await page.evaluate(()=>{const m=window.__depthReview!;m.state.account.currencies.stamps=5000;m.notify(false)});
 const initial=await page.evaluate(()=>window.__depthReview!.state);
 await page.getByRole('button',{name:/Recruit ×10 ·/}).click();await page.getByRole('button',{name:'Skip all',exact:true}).click();
 await expect(page.locator('.uv-recruit-summary article')).toHaveCount(10);
 const v3=await page.evaluate(()=>({account:window.__depthReview!.state.account,gear:window.__depthReview!.state.gear}));
 const rarities=await page.locator('.uv-recruit-summary article>small').allTextContents();const rank={common:0,rare:1,epic:2,legendary:3};expect(rarities).toEqual([...rarities].sort((a,b)=>rank[b as keyof typeof rank]-rank[a as keyof typeof rank]));
 const legacy=await browser.newPage();await legacy.goto('http://127.0.0.1:5950/tools/ui-v3/index.html?ui=legacy');await legacy.locator('.cr-sidebar').waitFor();await legacy.evaluate(state=>{const m=window.__depthReview!;m.state=state;m.go('gacha');},initial);
 await legacy.getByRole('button',{name:/Invite ten ·/}).click();await legacy.getByRole('button',{name:'Skip reveal',exact:true}).click();
 expect(await legacy.evaluate(()=>({account:window.__depthReview!.state.account,gear:window.__depthReview!.state.gear}))).toEqual(v3);
 await page.getByText('Odds',{exact:true}).click();await legacy.getByText('Odds and rules',{exact:true}).click();expect(await page.getByRole('table',{name:'Published rarity odds'}).innerText()).toBe(await legacy.getByRole('table',{name:'Published rarity odds'}).innerText());await legacy.close();
});

test('reduced-motion recruit goes straight to saved results',async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('?ui=v3');await page.getByRole('button',{name:'Recruit',exact:true}).click();await page.locator('.uv-recruit-stage').waitFor();await page.getByRole('button',{name:'Welcome a friend',exact:true}).click();await expect(page.locator('.uv-recruit-stage')).toHaveAttribute('data-beat','summary');await expect(page.locator('.uv-recruit-summary article')).toHaveCount(1);});

declare global{interface Window{__beats:{beat:string|null;at:number}[]}}
