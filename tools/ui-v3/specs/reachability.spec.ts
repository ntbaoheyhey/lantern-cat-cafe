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
