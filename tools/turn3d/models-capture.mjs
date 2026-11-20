import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
const manifest=JSON.parse(await fs.readFile('docs/turn3d/ASSET-MANIFEST.json','utf8'));
await fs.mkdir('reports/turn3d/shots/models',{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:640,height:520},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));const reports=[];
for(const a of manifest.assets){
 await page.goto(`http://127.0.0.1:5511/turn3d-model-probe.html?role=${a.id}`);await page.waitForFunction(()=>window.probe?.stats.loaded===1);await page.waitForTimeout(150);
 for(const [name,angle] of [['front',0],['three-quarter',.65],['side',Math.PI/2],['back',Math.PI]]){
  await page.evaluate(angle=>{window.probeView.model.angle=angle;window.probe.render(window.probeView)},angle);
  await page.screenshot({path:`reports/turn3d/shots/models/${a.id}-${name}.png`});
 }
 reports.push({role:a.id,stats:await page.evaluate(()=>window.probe.stats)});
}
await fs.writeFile('reports/turn3d/model-runtime.json',JSON.stringify({errors,models:reports},null,2));await browser.close();console.log(JSON.stringify({captures:reports.length*4,errors}));
