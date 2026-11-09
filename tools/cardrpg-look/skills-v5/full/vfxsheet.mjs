import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {open,apply} from './harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=resolve(process.env.V5_ARTIFACT),out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const result={sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Fixed camera B, DPR1, deterministic five cue phases. Gallery playback x0.25 with explicit frozen samples; no gameplay claims.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const groups=new Map(),peaks=[];
try{const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));await open(page,artifact);
 const actions=await page.evaluate(()=>window.__depthReview.galleryActions);result.catalog=actions;
 const filter=process.env.V5_IDS?.split(',');
 for(const action of actions.filter(a=>filter?filter.includes(a.id):true)){
  const frames=[],metrics=[];
  // Beat-relative times keep anticipation/travel/impact/recovery distinct when durations differ.
  for(const [phase,beat,fraction]of [['anticipation',0,.55],['release',1,.6],['impact',2,.55],['secondary',3,.35],['afterglow',4,.35]]){
   await apply(page,{gallery:action.id,progress:0});
   await page.evaluate(({beat,fraction})=>{const m=window.__depthReview,b=m.plan.beats[beat];m.animationAt=b.start+b.duration*fraction;m.gallerySpeed=.25;m.notify(false)},{beat,fraction});
   await page.evaluate(async()=>{await new Promise(requestAnimationFrame);const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame)});
   const frame=await sharp(await page.locator('.dp-arena').screenshot()).resize(320,180,{fit:'contain',background:'#142932'}).webp({quality:83}).toBuffer();frames.push(frame);
   const data=await page.evaluate(()=>{const s=window.__depthScene;return{at:window.__depthReview.animationAt,stats:{...s.stats},recipe:s.cardEffects.recipes[window.__depthReview.plan.presentationId??window.__depthReview.plan.skillId]}});metrics.push({phase,...data});
   if(phase==='impact')peaks.push({id:action.id,enemy:action.enemy,frame});
  }
  const strip=await sharp({create:{width:1600,height:180,channels:3,background:'#142932'}}).composite(frames.map((input,i)=>({input,left:i*320,top:0}))).webp({quality:82}).toBuffer();
  const key=action.owner||action.id.split('-')[0];if(!groups.has(key))groups.set(key,[]);groups.get(key).push({id:action.id,strip});
  result.rows.push({id:action.id,owner:key,metrics});console.log(action.id);
 }
}finally{await browser.close()}
for(const [owner,rows]of groups){await sharp({create:{width:1600,height:180*rows.length,channels:3,background:'#142932'}}).composite(rows.map((r,i)=>({input:r.strip,left:0,top:i*180}))).webp({quality:82}).toFile(`${out}/${owner.replaceAll(/[^a-z0-9_-]/gi,'-')}.webp`)}
for(const [name,tiles]of [['peak-sheet',peaks.filter(p=>!p.enemy)],['enemy-peaks',peaks.filter(p=>p.enemy)]]){
 if(!tiles.length)continue;
 await sharp({create:{width:1920,height:Math.ceil(tiles.length/6)*180,channels:3,background:'#142932'}}).composite(tiles.map((r,i)=>({input:r.frame,left:(i%6)*320,top:Math.floor(i/6)*180}))).webp({quality:84}).toFile(`${out}/${name}.webp`);
}
result.peakOrder=peaks.filter(p=>!p.enemy).map(p=>p.id);result.enemyPeakOrder=peaks.filter(p=>p.enemy).map(p=>p.id);
result.catalogAccounting='48 active cat skills include 12 ultimates; 12 authored passive presentations bring the distinct cat sheet to 60. Ultimates are not duplicated or invented.';
await writeFile(out+'/vfxsheet.json',JSON.stringify(result,null,2));
