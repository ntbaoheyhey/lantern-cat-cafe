import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';import {open,apply,audit} from './harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp'),out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const cases=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json')),rows=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});await open(page,process.env.V5_ARTIFACT);
 for(const id of ['P6','P9','P10','P11']){const row=cases.find(c=>c.id===id),tiles=[];
  for(let i=0;i<12;i++){await apply(page,row);const at=await page.evaluate(async i=>{const m=window.__depthReview;m.animationAt=m.plan.beats[2].start+i*500/12;m.gallerySpeed=.25;m.notify(false);await new Promise(requestAnimationFrame);const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;return m.animationAt},i);tiles.push({input:await sharp(await page.locator('.dp-arena').screenshot()).resize(400,220,{fit:'contain'}).webp({quality:82}).toBuffer(),left:i%4*400,top:Math.floor(i/4)*220});rows.push({id,at,ui:await page.evaluate(audit)})}
  await sharp({create:{width:1600,height:660,channels:3,background:'#142932'}}).composite(tiles).webp({quality:84}).toFile(out+'/'+id+'.webp');
 }
}finally{await browser.close();await writeFile(out+'/reactions.json',JSON.stringify({method:'12 evenly spaced frozen frames across500ms cue; gallery x0.25; rendered only, rule fixtures untouched',rows},null,2))}
