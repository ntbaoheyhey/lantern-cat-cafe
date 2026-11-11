import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output='/tmp/cardrpg-c-preparation-error';await mkdir(output,{recursive:true});const results=[];
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const before=await page.evaluate(()=>{const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.start(1,'campaign',1);m.enter('0-0');m.state.run.hp.mochi=0;m.state.v4.journey.pending=[];m.go('prepare');return JSON.stringify(m.state);});
 await page.getByRole('button',{name:'Suggested teams · 3 plans',exact:true}).click();const d=page.locator('dialog.a6-formation-tool');await d.getByRole('button',{name:'Use suggested team 1: Steady friends',exact:true}).click();
 await expect(d).toBeVisible();await expect(d.getByRole('alert')).toHaveText('Keep at least one living companion in front.');expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);
 await expect(d.getByRole('button',{name:'Back to formation'})).toBeInViewport({ratio:1});
 await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
 const file=`${width}-error.webp`,png='/tmp/cardrpg-c-preparation-error.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);results.push({width,height,file,unchanged:true,alert:true,modalRetained:true});await page.close();
}}finally{await writeFile(output+'/review.json',JSON.stringify(results,null,2));await browser.close();}
console.log(JSON.stringify(results));
