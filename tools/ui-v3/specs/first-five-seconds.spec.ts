import {test,expect} from '@playwright/test';
for(const [width,height] of [[1024,600],[1280,720],[1440,900]])test(`primary action is largest and visible ${width}`,async({page})=>{
 await page.setViewportSize({width:width!,height:height!});await page.goto('?ui=v3');const patrol=page.getByRole('button',{name:'Night Patrol'});await expect(patrol).toBeVisible();
 const sizes=await page.locator('button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return{primary:n.classList.contains('uv-patrol'),area:r.width*r.height,bottom:r.bottom}}));const primary=sizes.find(n=>n.primary)!;expect(primary.bottom).toBeLessThanOrEqual(height!);expect(primary.area).toBe(Math.max(...sizes.map(n=>n.area)));
 await patrol.click();await expect(page.getByRole('button',{name:'Fight',exact:true})).toBeVisible();
});
test('fallback uses current crew, no home canvas, and model-backed tips',async({page})=>{
 await page.goto('?ui=v3');await expect(page.locator('.uv-home-crew figure')).toHaveCount(3);await expect(page.locator('.uv-scene canvas')).toHaveCount(0);
 const names=await page.locator('.uv-home-crew figcaption').allTextContents();expect(names).toEqual(['Mochi','Soot','Clover']);
 await page.getByRole('button',{name:'Recruit counter'}).click();await expect(page.getByRole('dialog',{name:'Recruit'})).toBeVisible();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Notice board'}).click();await expect(page.getByRole('dialog',{name:'Events'})).toBeVisible();
});
