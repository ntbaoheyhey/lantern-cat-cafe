import {test,expect} from '@playwright/test';
test('Relic chip persists across sheets and preserves read-only Fuji copy',async({page})=>{
 await page.goto('?ui=v3');for(const name of ['Cats','Team','Bag','Recruit','Events']){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('button',{name:'Relic · Fuji',exact:true})).toBeVisible();await page.keyboard.press('Escape');}
 await page.getByRole('button',{name:'Relic · Fuji',exact:true}).click();await expect(page.locator('.uv-tabs button[aria-current]')).toHaveText('Relics');await expect(page.getByRole('button',{name:'Load fixture holdings',exact:true})).toBeVisible();await expect(page.getByText(/read-only result receipt/)).toBeVisible();
});
