// Original portraits rendered from local authored geometry. No reference images.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {resolve} from 'node:path';
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:640,height:800}}),records=[];
await page.goto('http://127.0.0.1:5523/?demo&squad=1&cardrpg=1');await page.waitForFunction(()=>window.__cardrpgReview);
const cards=await page.evaluate(async()=>{const c=await import('/@fs/private/tmp/cardrpg-a-preview/packages/game-rules/src/cardrpg/index.ts');return c.CARDS});
await fs.mkdir('assets/cardrpg/portraits',{recursive:true});
for(const [i,card] of cards.entries()){
 const rank=['common','rare','epic','legendary'].indexOf(card.rarity),angle=[.18,-.20,.32,-.32][rank];
 await page.goto('http://127.0.0.1:5520/@fs'+resolve('tools/cardrpg-demo/portrait.html')+`?role=${card.role}&rank=${rank}&angle=${angle}`);await page.waitForFunction(()=>window.__portrait?.ready);
 const output=`assets/cardrpg/portraits/${card.id}.png`,data=await page.screenshot({path:output,omitBackground:true});records.push({id:card.id,role:card.role,rarity:card.rarity,output,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),source:[`apps/web/public/art/turn3d/${card.role}.glb`,'tools/cardrpg-demo/portrait.html'],tool:'Three.js / Playwright Chromium Metal',parameters:{viewport:[640,800],angle,rank,clip:'ready',poseTime:.48},license:'CC0-1.0',externalReferences:[],note:'Original role-variant portrait; three underlying hero miniature families.'});
}
await fs.writeFile('assets/cardrpg/portraits/manifest.json',JSON.stringify({date:new Date().toISOString(),records},null,2)+'\n');await browser.close();console.log(JSON.stringify(records.map(r=>({id:r.id,bytes:r.bytes}))));
