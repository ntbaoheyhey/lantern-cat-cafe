import {expect,test} from '@playwright/test';
import {runBudget} from '../../../tools/cardrpg-c2/word-budget.mjs';

test('C2 player screens and route decisions stay within 25 visible words',async({page})=>{
 test.setTimeout(180_000);
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const rows=await runBudget(page);
 for(const row of rows)expect.soft(row.count,`${row.screen}: ${row.words.join(' ')}`).toBeLessThanOrEqual(25);
 expect(errors).toEqual([]);
});

test('C2 explanations keep keyboard access and return focus',async({page})=>{
 await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await page.waitForFunction(()=>!!window.__depthReview);
 await page.evaluate(()=>{const m=window.__depthReview!;m.state.tutorial=4;m.state.v4!.journey!.pending=[];m.go('team');});
 const trigger=page.getByRole('button',{name:'How to play',exact:true});
 await trigger.focus();await page.keyboard.press('Enter');
 const help=page.getByRole('dialog',{name:'How to play',exact:true});
 await expect(help).toBeVisible();
 for(let i=0;i<5;i++)await page.keyboard.press('Tab');
 expect(await help.evaluate(el=>el.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');
 await expect(help).toHaveCount(0);await expect(trigger).toBeFocused();
 await expect(page.getByRole('dialog',{name:'Team',exact:true})).toBeVisible();
});
