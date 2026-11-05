import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,channel:'chromium',args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await fs.mkdir('reports/turn3d-polish/shots/review',{recursive:true});
await page.goto('http://127.0.0.1:5512/?demo&squad=1&squad3d=1&squadDebug=1');
await page.getByRole('button',{name:'Begin patrol'}).waitFor();await page.waitForTimeout(1500);
await page.screenshot({path:'reports/turn3d-polish/shots/review/loadout.png'});
await page.getByRole('button',{name:'Begin patrol'}).click();await page.waitForTimeout(1800);
await page.screenshot({path:'reports/turn3d-polish/shots/review/battle.png'});
const result=await page.evaluate(()=>({stats:window.__turn3dReview.scene?.stats,stage:window.__turn3dReview.controller.battle.run.stage}));
await page.getByRole('button',{name:'Effects',exact:true}).click();
for(const id of ['guardianBasic','hearthwall','lanternstorm','nineLives','yarnAttack']){
 await page.evaluate(id=>window.__turn3dReview.controller.inspect(id,2),id);await page.waitForTimeout(400);
 await page.screenshot({path:`reports/turn3d-polish/shots/review/${id}.png`});
}
await page.getByRole('button',{name:'Miniatures',exact:true}).click();
for(const role of ['guardian','witch','alchemist','yarn']){
 await page.getByLabel('Model',{exact:true}).selectOption(role);await page.waitForTimeout(500);
 await page.screenshot({path:`reports/turn3d-polish/shots/review/model-${role}.png`});
}
console.log(JSON.stringify({errors,...result}));await browser.close();
