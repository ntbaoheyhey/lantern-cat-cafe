import {expect,test,type Page} from '@playwright/test';

async function fresh(page:Page){
 await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await page.waitForFunction(()=>!!window.__depthReview);
 await page.evaluate(()=>{
  const m=window.__depthReview!;m.state.tutorial=4;m.state.freeInvite=true;
  m.state.v4!.journey!.pending=[];m.state.run=null;m.go('hub');
 });
}
async function disclose(page:Page,name:string){
 const trigger=page.getByRole('button',{name,exact:true});
 await trigger.click();const dialog=page.getByRole('dialog',{name,exact:true});
 await expect(dialog).toBeVisible();await expect(dialog.getByRole('heading',{name:'Odds',exact:true})).toBeVisible();
 await page.keyboard.press('Shift+Tab');
 expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Tab');
 expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);
 return {dialog,close:async()=>{await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();}};
}

test('C2 encounter Odds reflect the exhausted allowance and preserve the parent sheet',async({page})=>{
 await fresh(page);await page.evaluate(()=>window.__depthReview!.go('inventory'));
 let odds=await disclose(page,'Encounter drops odds');
 await expect(odds.dialog.getByLabel('6 of 6 drops remain today')).toHaveCount(3);
 await expect(odds.dialog.getByRole('row').last()).toContainText('0.15%0.15%');
 await odds.close();
 await page.evaluate(()=>{const m=window.__depthReview!;m.state.account.inventory.stacks[`depth-drops-${m.state.account.day}`]=6;m.notify(false);});
 odds=await disclose(page,'Encounter drops odds');
 await expect(odds.dialog.getByLabel('0 of 6 drops remain today')).toHaveCount(3);
 await expect(odds.dialog.getByRole('row').last()).toContainText('0.15%0%');
 await odds.close();await expect(page.getByRole('region',{name:'Gear workbench'})).toBeVisible();
});

test('C2 nested tailoring and salvage Odds keep the workshop open on Escape',async({page})=>{
 await fresh(page);await page.evaluate(()=>window.__depthReview!.go('inventory'));
 await page.getByRole('button',{name:'Gear workshop',exact:true}).click();
 const workshop=page.getByRole('dialog',{name:'Gear workshop',exact:true});
 await workshop.getByLabel('Template',{exact:true}).selectOption('hearthloom-weapon-legendary');
 let odds=await disclose(page,'Tailoring odds');
 await expect(odds.dialog.getByLabel('seals').locator('..')).toHaveText('❖10');
 await expect(odds.dialog.getByLabel('materials').locator('..')).toHaveText('◇200');
 await odds.close();await expect(workshop).toBeVisible();
 odds=await disclose(page,'Salvage odds');
 await expect(odds.dialog.getByLabel('Deterministic reward')).toHaveText('100%');
 await odds.close();await expect(workshop).toBeVisible();
 await workshop.getByRole('button',{name:'Consumables',exact:true}).click();
 odds=await disclose(page,'Forge odds');
 await expect(odds.dialog.getByLabel('Deterministic reward')).toHaveText('100%');
 await odds.close();await expect(workshop).toBeVisible();
});

test('C2 daily and tower reward sources expose deterministic Odds',async({page})=>{
 await fresh(page);
 await page.evaluate(()=>{const m=window.__depthReview!;m.command({type:'level',cardId:m.state.account.cards[0]!.id});});
 await page.getByRole('button',{name:'Events',exact:true}).click();
 let odds=await disclose(page,'Login gift odds');
 await expect(odds.dialog.getByLabel('Deterministic reward')).toHaveText('100%');await odds.close();
 await page.keyboard.press('Escape');
 await page.evaluate(()=>window.__depthReview!.go('tower'));
 await page.getByRole('button',{name:/Gifts/}).click();
 odds=await disclose(page,'Floor 5 gift odds');
 await expect(odds.dialog.getByLabel('Deterministic reward')).toHaveText('100%');await odds.close();
});

test('C2 equipment invitations show their live hard guarantee and selector price',async({page})=>{
 await fresh(page);await page.evaluate(()=>window.__depthReview!.go('gacha'));
 await page.getByRole('navigation',{name:'Invitation banners'}).getByRole('button').nth(2).click();
 let odds=await disclose(page,'Invitation odds');
 await expect(odds.dialog.getByLabel('Price in stamps').locator('..')).toHaveText('✉300');
 await odds.close();
 await page.evaluate(()=>{
  const m=window.__depthReview!;m.state.account.pity.gear={sinceLegendary:23,totalPulls:23,featuredGuaranteed:false};m.notify(false);
 });
 odds=await disclose(page,'Invitation odds');
 await expect(odds.dialog.getByRole('row').last()).toContainText('1%100%');
 await expect(odds.dialog.getByLabel('Legendary hard pity').locator('..')).toContainText('1 / 24');
 await odds.close();
 await page.getByText('✦ Choose',{exact:true}).click();
 await page.getByLabel('Reward type',{exact:true}).selectOption('gear');
 await page.getByLabel('Chosen reward',{exact:true}).selectOption('hearthloom-weapon-legendary');
 odds=await disclose(page,'Selector odds');
 await expect(odds.dialog.getByLabel('Selector marks cost').locator('..')).toHaveText('✦72');
 await odds.close();
});
