/** Failure injection through the actual production Image.decode boundary. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));const out=resolve('work/v5/CXI/native-half-review',label);assert(!existsSync(out));await mkdir(out,{recursive:true});
const ids=['kettle-knight','crumb-sentinel','pollen-scout','spool-ram'];
const lossless=JSON.parse(await readFile('apps/web/src/game/cardrpg/spine/lossless-atlases.json','utf8'));
const expectedFallback=Object.fromEntries(ids.map(id=>{const path='/units/'+id+'/rig-depth.png';return[id,lossless.find(row=>row.request===path)?.url??path];}));
const report={utc:new Date().toISOString(),url:judgeUrl,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),method:'Inject Image.decode rejection only for four new halfAVIF URLs before current production fixture loads. Verify canonical original/lossless fallback selection, native cutout ownership, positive isolated GPU alpha and zero unexpected errors in normal/reduced modes. Diagnostic failure injection, not an ordinary network or performance claim.',expectedFallback,runs:[],complete:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await save();
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{setupPage:page=>page.addInitScript(ids=>{
   window.__nativeHalfRejected=[];const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(...args){if(ids.some(id=>new URL(this.src).pathname==='/units/'+id+'/rig-depth.half.avif')){window.__nativeHalfRejected.push(new URL(this.src).pathname);return Promise.reject(new DOMException('Injected halfAVIF decode failure','EncodingError'));}return decode.apply(this,args);};
  },ids)});
  const evidence=await page.evaluate(({ids,reduced})=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.state.settings.reducedMotion=reduced;m.plan=null;m.paused=true;s.render({...s.view(),frame:null,fixedTime:30,paused:true},0);
   const visible=s.scene.children.map(n=>[n,n.visible]),background=s.scene.background,sampleColor=[...s.actors.values()].find(e=>e.craftPose?.drawing).craftPose.drawing.material.color.clone(),color=s.renderer.getClearColor(sampleColor),alpha=s.renderer.getClearAlpha(),gl=s.renderer.getContext(),data=new Uint8Array(s.width*s.height*4),rows=[];
   try{for(const [actorId,e]of s.actors){if(!ids.includes(e.asset))continue;const images=[];e.actor.root.traverse(n=>{for(const material of Array.isArray(n.material)?n.material:[n.material]){const image=material?.map?.image;if(image?.currentSrc&&!images.some(x=>x.url===image.currentSrc))images.push({url:image.currentSrc,width:image.naturalWidth,height:image.naturalHeight});}});
    for(const[n,v]of visible)n.visible=v&&n===e.actor.root;s.scene.background=null;s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,s.width,s.height,gl.RGBA,gl.UNSIGNED_BYTE,data);let paintedPixels=0;for(let i=3;i<data.length;i+=4)paintedPixels+=Number(data[i]>0);rows.push({actorId,asset:e.asset,source:e.actor.source,images,paintedPixels});}}
   finally{for(const[n,v]of visible)n.visible=v;s.scene.background=background;s.renderer.setClearColor(color,alpha);s.renderer.render(s.scene,s.camera);}return{rejected:window.__nativeHalfRejected,rows};
  },{ids,reduced});
  for(const id of ids){assert(evidence.rejected.includes('/units/'+id+'/rig-depth.half.avif'));const r=evidence.rows.find(r=>r.asset===id);assert(r&&r.source!=='puppet'&&r.paintedPixels>1000);assert(r.images.some(x=>new URL(x.url).pathname===new URL(expectedFallback[id],judgeUrl).pathname));assert(r.images.every(x=>!x.url.includes('/rig-depth.half.avif')));}
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push({motion:reduced?'reduced':'normal',...evidence,errors,blockedRequests});await save();await page.close();
 }
 report.complete=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await browser.close();report.finishedUtc=new Date().toISOString();await save();console.log(JSON.stringify({out,complete:report.complete,failure:report.failure}));}
