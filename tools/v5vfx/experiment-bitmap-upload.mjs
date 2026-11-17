/** Full-size bitmap source control; includes conversion time and all frozen frames. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-bitmap-upload');assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const repeats=Number(process.env.CXV_BITMAP_REPEATS??3);assert(Number.isInteger(repeats)&&repeats>0&&repeats<=10);
const frames=[['idle',0],['anticipation',50],['transition',330],['contact',350],['warm',350],['release',650],['idle-return',799],['contact-return',350]];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:sha(await readFile(new URL(import.meta.url))),viewport:{width:1280,height:720},repeats,rows:[],parity:[],errors:[],method:'Fresh boss then Mochi contact fixture, alternating original image/full-size ImageBitmap,1x/4x. Four measured cold pose textures; bitmap preparation after actor readiness is included separately and in total elapsed work. Original image is restored outside renderer draw callbacks so CPU opaque-bound measurement keeps original orientation. This tool-only upload substitution is not an application design or judge acceptance. No profiling/screenshots/readPixels in timings. Separate fixed-random full-renderer RGBA parity captures. Render elapsed includes synchronous driver submission, not GPU completion; bitmap preparation wall time can include parallel work.'};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
async function run(mode,rate,repetition,parity=false){
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false,setupPage:parity?async p=>p.addInitScript(()=>{Math.random=()=>.5;}):undefined});
 const cdp=await page.context().newCDPSession(page);
 try{
  report.url=page.url();report.indexSha256??=sha(await (await page.request.get(new URL(page.url()).origin+'/')).body());
  await page.evaluate(async()=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture('mochi-1'),m=window.__depthReview,s=window.__depthScene;
   Object.assign(m,{galleryBattle:f.battle,plan:configureSequence(f.plan),animationAt:0,paused:true});m.notify(false);s.ensureActors(s.view());cancelAnimationFrame(s.raf);
  });
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  const result=await page.evaluate(async({mode,frames,parity})=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
   const targets=new Map(),restores=[],rows=[],preparation=[];let swapped=0;
   for(const [actorId,e]of s.actors){const d=e.craftPose?.drawing;if(!d)continue;const keys=e.asset==='mochi'?['K1','K2']:['binding-thread','yarn-giant'].includes(e.asset)?['K4']:[];
    for(const key of keys){const t=d.set.textures[key];if(!targets.has(t))targets.set(t,{texture:t,image:t.image,unit:e.asset,key,actorIds:[]});targets.get(t).actorIds.push(actorId);}
   }
   if(targets.size!==4)throw Error('Expected four cold textures');
   const start=performance.now(),prepareStart=start;
   try{
    if(mode==='bitmap'){
     for(const t of targets.values()){const at=performance.now();t.bitmap=await createImageBitmap(t.image,{imageOrientation:t.texture.flipY?'flipY':'from-image',premultiplyAlpha:t.texture.premultiplyAlpha?'premultiply':'none',colorSpaceConversion:'none'});preparation.push({unit:t.unit,key:t.key,elapsedMs:performance.now()-at});}
     for(const e of s.actors.values()){const d=e.craftPose?.drawing;if(!d)continue;const before=d.onBeforeRender,after=d.onAfterRender;
      d.onBeforeRender=function(...args){before.apply(this,args);const target=targets.get(this.material.map);if(target?.bitmap){target.texture.image=target.bitmap;swapped++;}};
      d.onAfterRender=function(...args){const target=targets.get(this.material.map);if(target?.bitmap)target.texture.image=target.image;after.apply(this,args);};
      restores.push(()=>{d.onBeforeRender=before;d.onAfterRender=after;});
     }
    }
    const preparationMs=performance.now()-prepareStart,initialTextures=s.renderer.info.memory.textures;
    for(const [tag,ms]of frames){m.animationAt=ms;const at=performance.now();s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);const renderMs=performance.now()-at;
     const row={tag,ms,renderMs,textures:s.renderer.info.memory.textures,calls:s.stats.calls};
     if(parity){const gl=s.renderer.getContext(),rgba=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,rgba);row.rgbaSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',rgba)),n=>n.toString(16).padStart(2,'0')).join('');}
     rows.push(row);
    }
    const sourcesRestored=[...targets.values()].every(t=>t.texture.image===t.image);
    return{preparationMs,preparation,initialTextures,finalTextures:s.renderer.info.memory.textures,elapsedMs:performance.now()-start,combinedWorkMs:preparationMs+rows.reduce((n,r)=>n+r.renderMs,0),swapped,sourcesRestored,targets:[...targets.values()].map(t=>({unit:t.unit,key:t.key,actorIds:t.actorIds,url:t.image.currentSrc||t.image.src,width:t.image.width,height:t.image.height})),rows};
   }finally{for(const restore of restores)restore();for(const t of targets.values()){t.texture.image=t.image;t.bitmap?.close();}}
  },{mode,frames,parity});
  const row={mode,rate,repetition,parity,utc:new Date().toISOString(),...result,errors,blockedRequests};(parity?report.parity:report.rows).push(row);report.errors.push(...errors,...blockedRequests.map(r=>'blocked '+r.url));
  await writeFile(resolve(out,'report.partial.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({mode,rate,repetition,parity,preparationMs:row.preparationMs,contactMs:row.rows.find(r=>r.tag==='contact').renderMs,combinedWorkMs:row.combinedWorkMs,swapped:row.swapped,errors:row.errors}));
 }finally{await page.close();}
}
try{
 for(const rate of [1,4])for(let rep=0;rep<repeats;rep++)for(const mode of rep%2?['bitmap','image']:['image','bitmap'])await run(mode,rate,rep);
 for(const mode of ['image','bitmap'])await run(mode,1,0,true);
 const median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
 report.summary=[1,4].flatMap(rate=>['image','bitmap'].map(mode=>{const runs=report.rows.filter(r=>r.rate===rate&&r.mode===mode);return{rate,mode,preparationMedianMs:median(runs.map(r=>r.preparationMs)),combinedWorkMedianMs:median(runs.map(r=>r.combinedWorkMs)),frames:frames.map(([tag])=>({tag,renderMedianMs:median(runs.map(r=>r.rows.find(x=>x.tag===tag).renderMs))}))};}));
 report.parityChecks=report.parity[0].rows.map((r,i)=>({tag:r.tag,equal:r.rgbaSha256===report.parity[1].rows[i].rgbaSha256,imageSha256:r.rgbaSha256,bitmapSha256:report.parity[1].rows[i].rgbaSha256}));
 report.pass=!report.errors.length&&report.parityChecks.every(r=>r.equal)&&[...report.rows,...report.parity].every(r=>r.sourcesRestored&&(r.mode==='image'||r.swapped>0));
 report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,summary:report.summary,parity:report.parityChecks.map(({tag,equal})=>({tag,equal}))}));
}catch(error){report.errors.push(String(error.stack??error));report.pass=false;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));throw error;}
finally{await browser.close();}
