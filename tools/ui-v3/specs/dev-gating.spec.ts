import {test,expect} from '@playwright/test';
for(const ui of ['v3','legacy'])test(`review tools require dev=1 in ${ui}`,async({page})=>{
 await page.goto(`?ui=${ui}`);if(ui==='v3')await page.getByRole('button',{name:'Open menu',exact:true}).click();
 for(const name of ['Feel lab','Review studio','Mechanics lab','Frame meter','Look A/B','Before / after','Look atelier'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
 if(ui==='v3')await page.getByRole('button',{name:'Open settings',exact:true}).click();else await page.getByRole('button',{name:'Save & settings',exact:false}).click();
 await expect(page.getByRole('heading',{name:'Demo shortcuts',exact:true})).toHaveCount(0);
 await page.goto(`?ui=${ui}&dev=1`);if(ui==='v3')await page.getByRole('button',{name:'Open menu',exact:true}).click();await expect(page.getByRole('button',{name:/Before \/ after/})).toBeVisible();
});
