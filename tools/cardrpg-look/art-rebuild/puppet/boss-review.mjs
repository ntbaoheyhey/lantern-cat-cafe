// Exercise real canvas boss phases, authored eye glow and reduced motion in A6 shell.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {apply,audit} from '../../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),artifact=resolve(process.env.ART_ARTIFACT);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const result={method:'Actual A6 canvas; explicit fixed-time phase transition and reduced-motion probes. No rule changes.',errors:[],rows:[]};
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
 await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
 await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 for(const id of ['kettle-knight','yarn-giant','rain-spool','pantry-crown']){
  await apply(page,{gallery:'enemy:'+id,progress:-1});
  await page.evaluate(async()=>{const m=window.__depthReview;m.plan=null;m.notify(false);await new Promise(requestAnimationFrame)});
  const tiles=[];
  for(const [width,height] of [[1440,900],[1280,720]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(100);
   const samples=[];
   for(const [label,time,phase,reduced] of [['idle A',100,1,false],['idle B',101.3,1,false],['phase flash',101.4,2,false],['settled',102.1,2,false],['reduced A',103,3,true],['reduced B',104,3,true]]){
    const state=await page.evaluate(({id,time,phase,reduced})=>{
     const s=window.__depthScene,p=[...s.puppets.values()].find(p=>p.asset===id),actor=[...s.puppets].find(([,p])=>p.asset===id)[0];
     const v={...s.view(),frame:null,fixedTime:time,paused:true,reducedMotion:reduced,bossPhases:{[actor]:phase}};
     s.render(v,0);s.render(v,0);s.dirty=false;
     const mat=p.model.getObjectByName('puppet_head').children.find(n=>n.isMesh).material;
     const motes=s.scene.getObjectByName('illustrated-boss-embers');
     return {bounds:s.audit(),faceHp:s.labelAudit.overlaps,scale:p.model.children[0].scale.toArray(),eyeStyle:mat.userData.puppetEyeStyle,glow:mat.userData.puppetGlow.value,flash:mat.userData.puppetFlash.value,motesVisible:motes.visible,motes:Array.from(motes.instanceMatrix.array),rigBoss:p.model.userData.paintedRig.boss,stats:s.stats};
    },{id,time,phase,reduced});
    samples.push({label,...state});
    if(width===1440&&['idle A','idle B','phase flash'].includes(label))tiles.push({input:await sharp(await page.screenshot()).resize(720,450).toBuffer(),left:(tiles.length%3)*720,top:0});
    if(width===1280&&label==='idle A')await sharp(await page.screenshot()).webp({quality:87}).toFile(out+'/'+id+'-1280.webp');
   }
   const [a,b,flash,settled,ra,rb]=samples;
   if(!a.rigBoss||a.eyeStyle!=='glow'||!a.motesVisible||a.glow===b.glow||JSON.stringify(a.scale)===JSON.stringify(b.scale)||JSON.stringify(a.motes)===JSON.stringify(b.motes))throw Error(id+' missing boss idle');
   if(flash.flash<=0||settled.flash!==0||ra.flash!==0||ra.motesVisible||JSON.stringify(ra.scale)!==JSON.stringify(rb.scale))throw Error(id+' phase/reduced-motion contract failed');
   result.rows.push({id,width,height,ui:await page.evaluate(audit),samples});
  }
  await sharp({create:{width:2160,height:450,channels:3,background:'#19353c'}}).composite(tiles).webp({quality:86}).toFile(out+'/'+id+'-boss-motion.webp');
 }
}finally{await browser.close();await writeFile(out+'/boss-review.json',JSON.stringify(result,null,2)+'\n')}
const failures=result.rows.filter(r=>r.ui.overlaps.length||r.samples.some(s=>s.faceHp||s.bounds.outside.length));
console.log(JSON.stringify({bosses:4,viewports:result.rows.length,errors:result.errors,overlapFailures:failures.map(r=>[r.id,r.width])}));
if(result.errors.length||failures.length)process.exitCode=1;
