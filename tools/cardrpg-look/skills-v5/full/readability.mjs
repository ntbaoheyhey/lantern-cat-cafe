import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {open,apply,audit} from './harness.mjs';
import {coverage} from '../../b2/coverage.mjs';
import {silhouetteContrast} from '../../b2/readability.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=resolve(process.env.V5_ARTIFACT),out=process.env.V5_OUT;
await mkdir(out,{recursive:true});
const cases=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json'));
const result={method:'Same B2 projected-vertex bounds and isolated geometry/floor-ablation luminance measurement. P1/P5/P15 fixed before and after; DPR1.',rows:[],errors:[]};
if(process.env.V5_RESUME)result.rows=JSON.parse(await readFile(process.env.V5_RESUME)).rows;
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{for(const [width,height]of [[1024,600],[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('pageerror',e=>result.errors.push(String(e)));await open(page,artifact);
 for(const id of ['P1','P5','P15']){
  if(result.rows.some(r=>r.id===id&&r.width===width))continue;
  await apply(page,cases.find(r=>r.id===id));
  const bounds=await page.evaluate(coverage),contrast=await silhouetteContrast(page);
  result.rows.push({id,width,...bounds,contrast,ui:await page.evaluate(audit),outside:bounds.units.filter(u=>u.box[0]<0||u.box[1]<0||u.box[2]>1||u.box[3]>1).map(u=>({id:u.id,box:u.box}))});
  await sharp(await page.screenshot()).webp({quality:80}).toFile(`${out}/${width}-${id}.webp`);
 }
 // Existing receipt and gallery arrangement; read-only presentation probe.
 await apply(page,{gallery:'sorrel-1',progress:-1});
 const receipt=JSON.parse(await readFile('tools/cardrpg-look/fixtures/a4-earned.json')).events[0];
 await page.evaluate(async receipt=>{const s=window.__depthScene;await s.playEntrance(receipt.itemId,receipt);s.entrance.startedAt=2.6;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false},receipt);
 result.rows.push({id:'earned-sorrel',width,...await page.evaluate(coverage)});
 await sharp(await page.screenshot()).webp({quality:80}).toFile(`${out}/${width}-earned-sorrel.webp`);
 await page.close();
}}finally{await browser.close();await writeFile(out+'/readability.json',JSON.stringify(result,null,2))}
console.log(JSON.stringify({rows:result.rows.length,errors:result.errors,contrast:result.rows.filter(r=>r.contrast).map(r=>[r.id,r.width,r.contrast.map(c=>[c.asset,c.contrast])])}));
