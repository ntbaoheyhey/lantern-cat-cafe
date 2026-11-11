// Actual cafe screenshots and material/light ownership for before/after review.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {apply,audit} from '../../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),artifact=resolve(process.env.ART_ARTIFACT);await mkdir(out,{recursive:true});
const baseline=process.env.ART_BASELINE?JSON.parse(await readFile(process.env.ART_BASELINE,'utf8')).rows[0].lights:null;
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const result={errors:[],rows:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));
 await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 for(const id of ['enemy:button-guard','enemy:rain-spool','enemy:pantry-crown'])for(const [width,height] of [[1440,900],[1280,720]]){
  await page.setViewportSize({width,height});await apply(page,{gallery:id,progress:-1});
  await page.evaluate(async()=>{const m=window.__depthReview,s=window.__depthScene;m.galleryBattle.initial.gameplayA6=true;m.plan=null;m.notify(false);await new Promise(requestAnimationFrame);s.render({...s.view(),fixedTime:10,paused:true},0);s.render({...s.view(),fixedTime:10,paused:true},0);s.dirty=false;});
  await page.waitForSelector('.uv-battle-hud[data-a6="true"] .a6-hud-portrait');
  const state=await page.evaluate(()=>{const s=window.__depthScene,details=s.stage.getObjectByName('illustrated-cafe-details');return{a6Hud:document.querySelectorAll('.uv-battle-hud[data-a6="true"] .a6-hud-portrait').length,bounds:s.audit(),faceHp:s.labelAudit.overlaps,stats:s.stats,details:details?.children.map(n=>n.name)??[],lights:['cafe-key','atelier-fill','cafe-rim'].map(n=>{const l=s.scene.getObjectByName(n);return{name:n,color:l.color.getHexString(),intensity:l.intensity,position:l.position.toArray()}}),night:!!s.stage.getObjectByName('night-glass')};});
  result.rows.push({id,width,height,...state,ui:await page.evaluate(audit)});await sharp(await page.screenshot()).webp({quality:87}).toFile(out+'/'+id.replace(':','-')+'-'+width+'.webp');
  if(baseline){
   // Isolate stage/light changes in this same current A6 shell. The historical
   // baseline remains untouched; old HUD differences cannot masquerade as art.
   for(const [label,lights,visible] of [['baseline',baseline,false],['restore',state.lights,true]]){
    await page.evaluate(({lights,visible})=>{const s=window.__depthScene;s.stage.getObjectByName('illustrated-cafe-details').visible=visible;for(const spec of lights){const l=s.scene.getObjectByName(spec.name);l.color.set('#'+spec.color);l.intensity=spec.intensity;l.position.fromArray(spec.position);}s.render({...s.view(),fixedTime:10,paused:true},0);s.dirty=false;},{lights,visible});
    if(label==='baseline')await sharp(await page.screenshot()).webp({quality:87}).toFile(out+'/'+id.replace(':','-')+'-'+width+'-baseline.webp');
   }
  }
 }
}finally{await browser.close();await writeFile(out+'/stage-review.json',JSON.stringify(result,null,2)+'\n')}
console.log(JSON.stringify({screens:result.rows.length,errors:result.errors,overlapFailures:result.rows.filter(r=>r.faceHp||r.bounds.outside.length||r.ui.overlaps.length).map(r=>r.id+'-'+r.width)}));
if(result.errors.length||result.rows.some(r=>r.faceHp||r.bounds.outside.length||r.ui.overlaps.length))process.exitCode=1;
