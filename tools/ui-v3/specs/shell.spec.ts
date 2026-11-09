import {test,expect} from '@playwright/test';
test('v3 shell has five dock buttons, six primary destinations and no rail',async({page})=>{
 await page.goto('?ui=v3');await expect(page.locator('.uv-dock nav button')).toHaveCount(5);
 await expect(page.locator('[data-home-destination]')).toHaveCount(6);await expect(page.locator('.cr-sidebar')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Night Patrol'})).toBeVisible();
 await page.getByRole('button',{name:'Cats',exact:true}).click();await expect(page.getByRole('dialog',{name:'Cats'})).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'Cats',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Relic · Fuji',exact:true}).click();await expect(page.getByRole('dialog',{name:'Bag'})).toBeVisible();await expect(page.locator('.uv-tabs button[aria-current]')).toHaveText('Relics');
});
test('legacy opt-out still renders the original rail',async({page})=>{await page.goto('?ui=legacy');await expect(page.getByRole('navigation',{name:'Cafe screens'})).toBeVisible();await expect(page.locator('.uv-shell')).toHaveCount(0)});
