// Deterministic matched stills. This fixture evidence is separate from the honest 10-minute run.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, chromium, screens, fixtureData, openView } from './visual-support.mjs';
const phase=process.argv[2]??'after',base=process.argv[3]??'http://127.0.0.1:5391';
if(!['before','after'].includes(phase))throw Error('Unknown phase');
const out=resolve(root,'docs/gameplay/img');mkdirSync(out,{recursive:true});
const data=await fixtureData(),browser=await chromium.launch(),receipts=[];
try {
for(const [width,height] of (process.env.GAMEPLAY_SIZES??'1280x720,1440x900,1920x1080').split(',').map(v=>v.split('x').map(Number))) {
 for(const screen of process.env.GAMEPLAY_SCREENS?.split(',')??screens){
  const{page,evidence}=await openView(browser,data,{base,screen,width,height});
  await page.screenshot({path:resolve(out,`${phase}-${screen}-${width}.png`),animations:'disabled'});
  evidence.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  evidence.imagesDecoded=await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0));
  receipts.push(evidence);await page.close();console.log(phase,screen,width);
 }
}
}finally{await browser.close();}
writeFileSync(resolve(root,`reports/gameplay/${phase}-captures.json`),JSON.stringify(receipts,null,2)+'\n');
if(receipts.some(r=>r.errors.length||r.writes.length||r.overflow||!r.imagesDecoded))process.exitCode=1;
