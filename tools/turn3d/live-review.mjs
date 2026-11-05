// Fresh browser self-review through visible controls, with a continuous native video.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {pinExistingFonts} from '../visual-support.mjs';
import fs from 'node:fs/promises';
const out='reports/turn3d',browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out+'/video',size:{width:1280,height:720}}});
const page=await context.newPage();const errors=[],actions=[];page.on('pageerror',e=>errors.push(String(e)));
await pinExistingFonts(page);await page.goto('http://127.0.0.1:5511/?demo&squad=1&squad3d=1');
await page.getByText('Mochi — your turn',{exact:true}).waitFor();await page.screenshot({path:out+'/shots/regrade-opening.png'});
await page.getByRole('button',{name:'Effects',exact:true}).click();
for(const id of ['shieldBash','rally','hearthwall','witchBasic','threadSnare','emberOrb','lanternstorm','milkFlask','mossFlask','nineLives','yarnAttack','bindThread','crossSweep']){
 await page.getByLabel('Effect action').selectOption(id);
 const beats=new Set();const start=Date.now();
 while(Date.now()-start<2800){const caption=await page.evaluate(()=>document.querySelector('.t3-cinematic small')?.textContent);if(caption)beats.add(caption);await page.waitForTimeout(80);}
 actions.push({id,observedUltimateBeats:[...beats]});
 if(['hearthwall','lanternstorm','nineLives','yarnAttack'].includes(id))await page.screenshot({path:out+`/shots/regrade-live-${id}.png`});
}
await page.getByRole('button',{name:'Miniatures',exact:true}).click();await page.getByLabel('Model',{exact:true}).selectOption('yarn');await page.getByLabel('Animation clip').selectOption('telegraph');await page.waitForTimeout(1800);
const video=page.video();await context.close();const path=await video.path();await fs.rename(path,out+'/video/live-self-review.webm');await browser.close();
await fs.writeFile(out+'/live-review.json',JSON.stringify({date:new Date().toISOString(),method:'New browser; visible Effects and Miniatures UI, x1 playback. Primary-session self-review, no external graders. Short impact beats may be missed by caption polling; deterministic five-beat captures are separate.',actions,errors,video:'reports/turn3d/video/live-self-review.webm'},null,2));
console.log(JSON.stringify({actions:actions.length,errors}));
