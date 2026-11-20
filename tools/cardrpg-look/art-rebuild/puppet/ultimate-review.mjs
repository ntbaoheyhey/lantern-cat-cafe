// Controlled original-atlas ultimate comparison; timing gates run separately.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {audit} from '../../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),before=resolve(process.env.ART_BEFORE),after=resolve(process.env.ART_ARTIFACT),id=process.env.ART_CAST??'soot-4';
await mkdir(out,{recursive:true});
const result={method:'Same A6 shell, fixed stage time and exact action-beat sampling. No rules or plan changes. Playback/performance use separate natural-clock capture.',id,errors:[],rows:[]};
const beats=[['early-hit','impact',.2],['landing','impact',.65],['settle','reaction',.35],['late-glow','reaction',.75]];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1440,900],[1280,720]]){
  const tiles=[];
  for(const [version,artifact] of [['before',before],['after',after]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
   await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
   await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
   await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
   await page.evaluate(id=>{const m=window.__depthReview;m.inspect(id,0);m.galleryBattle.initial.gameplayA6=true;m.notify(false)},id);
   await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady,null,{timeout:120000});
   for(const [i,[label,kind,fraction]] of beats.entries()){
    const state=await page.evaluate(async({kind,fraction})=>{
     const m=window.__depthReview,s=window.__depthScene,b=m.plan.beats.find(b=>b.kind===kind);m.animationAt=b.start+b.duration*fraction;m.notify(false);await new Promise(requestAnimationFrame);
     const view={...s.view(),fixedTime:3.2,paused:true};s.render(view,0);s.render(view,0);s.dirty=false;
     const actor=s.puppets.get(m.plan.actorId),socket=actor.model.getObjectByName(`${actor.role}_socket_mainHand`),v=s.effectProp.clone();socket.getWorldPosition(v);
     return{faceHp:s.labelAudit.overlaps,bounds:s.audit(),a6Hud:document.querySelectorAll('.a6-hud-portrait').length,socketError:s.cardEffects.propOrigin.distanceTo(v),effectStats:{...s.cardEffects.stats},numbers:s.puppetNumbers.drawn,beat:b.kind,at:m.animationAt};
    },{kind,fraction});
    const screenshot=await page.screenshot();await writeFile(`${out}/${version}-${width}-${label}.png`,screenshot);
    result.rows.push({version,width,height,label,...state,ui:await page.evaluate(audit)});
    // Preserve original screenshots; a readable two-column sheet shows the target region.
    const crop={left:Math.round(width*.48),top:Math.round(height*.12),width:Math.round(width*.48),height:Math.round(height*.7)};
    const tile=await sharp(screenshot).extract(crop).resize(540,490,{fit:'contain',background:'#173039'}).toBuffer();
    const left=version==='before'?0:540,top=i*516;
    tiles.push({input:Buffer.from(`<svg width="540" height="26"><text x="12" y="19" fill="#fff0d2" font-size="16">${version} ${width} · ${id} · ${label}</text></svg>`),left,top});
    tiles.push({input:tile,left,top:top+26});
   }
   await page.close();
  }
  await sharp({create:{width:1080,height:2064,channels:3,background:'#173039'}}).composite(tiles).webp({quality:86}).toFile(`${out}/${id}-${width}-comparison.webp`);
 }
}finally{await browser.close();await writeFile(out+'/ultimate-review.json',JSON.stringify(result,null,2)+'\n');}
const failures=result.rows.filter(r=>r.faceHp||r.bounds.outside.length||r.a6Hud!==3||r.socketError>.001||r.effectStats.truncated||r.ui.overlaps.length);
console.log(JSON.stringify({views:result.rows.length,errors:result.errors,failures:failures.map(r=>({version:r.version,width:r.width,label:r.label})),maxInstances:Math.max(...result.rows.map(r=>r.effectStats.instances))}));if(result.errors.length||failures.length)process.exitCode=1;
