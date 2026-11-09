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

test('discovery celebration never covers Fight or sheet close',async({page})=>{
 await page.clock.install();
 for(const [width,height] of [[1024,600],[1280,720],[1440,900]]){
  await page.setViewportSize({width:width!,height:height!});await page.goto('?ui=v3');await page.locator('.uv-shell').waitFor();
  await page.evaluate(()=>{const m=window.__depthReview!;m.state.tutorial=4;m.start(1,'campaign',1);m.tutorial()});
  await expect(page.getByRole('status',{name:'New discovery'})).toBeVisible();await page.getByRole('button',{name:'Fight',exact:true}).waitFor();
  const toast=(await page.locator('.dp-v4-celebration').boundingBox())!;
  for(const selector of ['.uv-fight','.uv-close']){const target=(await page.locator(selector).boundingBox())!;expect(Math.max(0,Math.min(toast.x+toast.width,target.x+target.width)-Math.max(toast.x,target.x))*Math.max(0,Math.min(toast.y+toast.height,target.y+target.height)-Math.max(toast.y,target.y))).toBe(0)}
 }
});
