import {test,expect} from '@playwright/test';

test('Prepare keeps Fight above the fold and preserves formation edits',async({page})=>{
 await page.setViewportSize({width:1024,height:600});await page.goto('?ui=v3');
 await page.getByRole('button',{name:'Night Patrol'}).click();
 await expect(page.locator('.uv-prepare-main select:visible')).toHaveCount(0);
 await page.getByRole('button',{name:'Place Soot front',exact:true}).click();
 expect(await page.evaluate(()=>window.__depthReview!.battle!.initial.cats.find(c=>c.id==='soot')!.row)).toBe('front');
 await page.getByRole('button',{name:'Place Soot rear',exact:true}).click();
 const fight=page.getByRole('button',{name:'Fight',exact:true}),box=await fight.boundingBox();
 expect(box!.y+box!.height).toBeLessThanOrEqual(600);await fight.click();
 await expect(page.locator('.dp-battle')).toBeVisible();await expect(page.locator('.uv-hud')).toHaveCount(0);
 await page.getByRole('button',{name:'Skip to result',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Victory',exact:true})).toBeVisible();
 await expect(page.locator('.uv-result-mvp img')).toBeVisible();
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.getByRole('button',{name:'Night Patrol'})).toBeVisible();
 expect(await page.evaluate(()=>window.__depthReview!.state.tutorial)).toBe(3);
});

test('Route preserves chapter, band, daily and Tower controls',async({page})=>{
 await page.goto('?ui=v3');await page.getByRole('button',{name:'Open route map',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Challenge band'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Start daily challenge'})).toBeEnabled();
 await expect(page.getByRole('button',{name:/Climb Tower/})).toBeDisabled();
 await page.getByRole('button',{name:'Start daily challenge'}).click();
 expect(await page.evaluate(()=>window.__depthReview!.state.run!.mode)).toBe('daily');
 await expect(page.getByRole('region',{name:'Route preview'})).toBeVisible();
});
