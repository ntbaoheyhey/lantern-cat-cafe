/** Headless proof of the integrated demo's custom origin and local guest flow. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium,expect}=require('@playwright/test');
const out=resolve(process.env.C2_DEMO_SHOTS??resolve(root,'work/cardrpg-c2/demo'));await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5940/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');
 await page.waitForFunction(()=>!!window.__depthReview,null,{timeout:60000});
 await expect(page.getByRole('button',{name:'▶ Play as guest',exact:true})).toBeVisible();
 await page.screenshot({path:resolve(out,'guest-start.png')});
 await page.getByRole('button',{name:'▶ Play as guest',exact:true}).click();
 await expect(page.getByTestId('chain-gas')).toHaveText('▲ 0.0500',{timeout:45000});
 const formation=await page.evaluate(()=>({c2:window.__depthReview.state.formationC2,team:window.__depthReview.state.team.length}));
 if(!formation.c2||formation.team!==4)throw Error('Demo did not enable the C2 four-member formation');
 await page.screenshot({path:resolve(out,'guest-home.png')});
 await page.getByRole('button',{name:'◈ Market',exact:true}).click();
 const room=page.getByRole('dialog',{name:'Fuji market',exact:true});
 await room.getByRole('button',{name:'🎟 Judge pass',exact:true}).click();
 await expect(room.locator('[data-testid^="voucher-"]')).toHaveCount(2,{timeout:45000});
 await room.getByRole('button',{name:'⚔ Fight boss',exact:true}).click();
 await expect(room.getByRole('button',{name:'✓ Victory',exact:true})).toBeVisible({timeout:45000});
 await room.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));});
 await page.screenshot({path:resolve(out,'judge.png')});
 await page.setViewportSize({width:390,height:844});
 await expect(room.getByRole('button',{name:'Close market',exact:true})).toBeInViewport();
 await page.screenshot({path:resolve(out,'judge-mobile.png')});
 if(errors.length)throw Error(errors.join('\n'));
 const report={head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),date:new Date().toISOString(),headless:true,origin:'http://127.0.0.1:5940',rpc:'http://127.0.0.1:5971',api:'http://127.0.0.1:5972',formation,guestGas:'0.0500',judgeVictory:true,pageErrors:errors.length};
 await writeFile(resolve(out,'demo-smoke.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({headless:true,guest:true,formation,judgeVictory:true,pageErrors:0,screens:4}));
}finally{await browser.close();}
