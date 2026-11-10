import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {apply,audit} from '../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=resolve(process.env.ART_ARTIFACT),out=resolve(process.env.ART_OUT);
await mkdir(out,{recursive:true});
const cases=JSON.parse(gunzipSync(await readFile('reports/cardrpg-look/skills-v5/full/m4/live-pilot/live-cases/cases.json.gz')));
const result={artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),shots:[],errors:[],method:'Identical fixed P15/P16 live replay plus four labelled gallery stills. Pipeline only changes; fixed time3.2, cameraB, DPR1.'};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const variant of (process.env.ART_VARIANTS||'v2,sculpt,painted').split(','))for(const [width,height] of (process.env.ART_WIDTH==='1440'?[[1440,900]]:[[1440,900],[1024,600]])){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('console',m=>{if(m.type()==='error')result.errors.push({variant,width,error:m.text()})});
  page.on('pageerror',e=>result.errors.push({variant,width,error:String(e)}));
  await page.goto('file://'+artifact+'?dev=1&lookArt='+(variant==='v2'?'v2':'v3')+'&artPipeline='+variant);
  await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const id of (process.env.ART_SHOTS||'mochi,soot,button-guard,yarn-giant,P15,P16').split(',')){
   const row=cases.find(r=>r.id===id)??{gallery:['mochi','soot'].includes(id)?id+'-1':'enemy:'+id,progress:-1};
   await apply(page,row);
   if(row.gallery)await page.evaluate(()=>{const m=window.__depthReview;m.plan=null;m.notify(false)});
   await page.evaluate(async()=>{await new Promise(requestAnimationFrame);const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame)});
   const file=`${variant}-${width}-${id}.webp`;await sharp(await page.screenshot()).webp({quality:86}).toFile(out+'/'+file);
   result.shots.push({variant,width,id,file,...await page.evaluate(audit),actors:await page.evaluate(()=>[...window.__depthScene.puppets].map(([id,p])=>({id,asset:p.asset,painted:!!p.model.userData.lookPainted,height:p.height,position:p.root.position.toArray(),scale:p.root.scale.toArray()})))});
  }
  await page.close();
 }
}finally{await browser.close();await writeFile(out+'/bakeoff.json',JSON.stringify(result,null,2)+'\n')}
console.log(JSON.stringify({shots:result.shots.length,errors:result.errors,overlaps:result.shots.flatMap(s=>s.overlaps).length}));
