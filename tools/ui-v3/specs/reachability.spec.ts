import {test,expect} from '@playwright/test';
test('all old destinations retain model data within two clicks',async({page})=>{
 await page.goto('?ui=v3');await expect(page.locator('.uv-shell')).toBeVisible();
 const data=await page.evaluate(()=>{const m=window.__depthReview!;return {cats:m.state.account.cards.length,gear:m.state.gear.length,relics:m.state.relics.length,history:m.state.account.history.length}});
 const paths=[['Cats','My cats','collection'],['Cats','Journal','journal'],['Team','','team'],['Bag','Gear','inventory'],['Bag','Materials','inventory'],['Recruit','','gacha'],['Relic · Fuji','','relics'],['Open menu','Read Field guide','codex'],['Open menu','Open settings','save']] as const;
 for(const [first,second,screen] of paths){await page.getByRole('button',{name:first,exact:true}).click();if(second)await page.getByRole('button',{name:second,exact:true}).click();await expect(page.locator('.uv-sheet-content')).toHaveAttribute('data-screen',screen);await page.keyboard.press('Escape');}
 const after=await page.evaluate(()=>{const m=window.__depthReview!;return {cats:m.state.account.cards.length,gear:m.state.gear.length,relics:m.state.relics.length,history:m.state.account.history.length}});expect(after).toEqual(data);
 await page.getByRole('button',{name:'Night Patrol'}).click();await expect(page.locator('.uv-sheet-content')).toHaveAttribute('data-screen','prepare');await page.getByRole('button',{name:'Route',exact:true}).click();await expect(page.getByRole('region',{name:'Route preview'})).toBeVisible();
});
test('Field guide uses the shared eight V5 names',async({page})=>{await page.goto('?ui=v3');await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.getByRole('button',{name:'Read Field guide',exact:true}).click();for(const name of ['Burn','Bleed','Bitter','Mark','Shred','Daze','Regen','Warm'])await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();});

test('Cats, Bag and Recruit display the same saved counts as legacy',async({page,browser})=>{
 await page.goto('?ui=v3');await page.locator('.uv-shell').waitFor();const initial=await page.evaluate(()=>window.__depthReview!.state);
 await page.getByRole('button',{name:'Cats',exact:true}).click();await expect(page.locator('[data-cat-count]')).toHaveAttribute('data-cat-count',String(initial.account.cards.length));await expect(page.locator('.uv-cat-grid>.cr-cat-card')).toHaveCount(initial.account.cards.length);await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Bag',exact:true}).click();await expect(page.locator('[data-gear-count]')).toHaveAttribute('data-gear-count',String(initial.gear.length));await expect(page.locator('.uv-gear-grid>button')).toHaveCount(initial.gear.length);await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Recruit',exact:true}).click();await page.locator('.uv-pity').waitFor();const pity=await page.locator('.uv-pity small').innerText();
 const legacy=await browser.newPage();await legacy.goto('http://127.0.0.1:5950/tools/ui-v3/index.html?ui=legacy');await legacy.locator('.cr-sidebar').waitFor();await legacy.evaluate(state=>{const m=window.__depthReview!;m.state=state;m.go('gacha')},initial);await expect(legacy.locator('.dp-fairness-pity')).toContainText(pity);await legacy.close();
});
