/** Full, unchanged Clover action timelines with one temporary original-texture substitution. */
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium, config, openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';

const root=resolve(import.meta.dirname,'../..');
const native=process.env.CXV_NATIVE_SELECTION==='1';
const out=resolve(process.env.CXV_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/V7-D-clover-leaf/full-actions'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/')&&!existsSync(out));
const manifest=JSON.parse(await readFile(resolve(root,'work/v5/CXV/films/V7-D-clover-leaf/asset.json'),'utf8'));
const asset=resolve(root,native?'apps/web/public/vfx/v5/from-cx/clover-leaf-v7-r1.webp':manifest.asset);
const bytes=await readFile(asset),sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,manifest.sha256);
await mkdir(out,{recursive:true});
await writeFile(resolve(out,'review-clover-leaf-actions.mjs'),await readFile(new URL(import.meta.url)));
const harnessSha256=createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
const report={started:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),asset,sha256,native,viewport:{width:1280,height:720},method:'Existing complete Clover basic/ultimate timelines and all loaded textures retained. Only motes texture substituted in prototype mode; native mode preserves current timeline selection and registers its checked-in asset directly. No size,timing,alpha,count,targets or choreography changes. Source-over; normal/reduced; draw instrumentation leaves behavior unchanged. Baseline disables only the leaf texture. Loader-manifest integration remains separate.',cases:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
 report.fontEvidence=await page.evaluate(()=>({numberFont:getComputedStyle(window.__depthScene.numbers.host).getPropertyValue('--font-num').trim(),balooLoaded:document.fonts.check('800 96px "Baloo 2"')}));
 assert(report.fontEvidence.balooLoaded,'Required local number font is not loaded');
 if(!native)await page.route('**/__cxv_clover_leaf.webp',route=>route.fulfill({body:bytes,contentType:'image/webp'}));
 await page.evaluate(async native=>{
  const registry=await import('/src/game/cardrpg/spine/vfx-registry.ts');
  const image=new Image();image.src=native?'/vfx/v5/from-cx/clover-leaf-v7-r1.webp':'/__cxv_clover_leaf.webp';await image.decode();
  const key=native?'clover-particle-1':'cxv-clover-leaf';
  if(!registry.registerV5Texture(key,{image,width:image.naturalWidth,height:image.naturalHeight,cols:1,rows:1,frameMs:50,blend:'normal'}))throw Error('Invalid leaf texture');
  const capture=window.__cxvCloverLeaf={image,key,native,hits:[],registry,originals:new Map()};
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
   if(source===image){const m=this.getTransform();capture.hits.push({args,alpha:this.globalAlpha,operation:this.globalCompositeOperation,transform:[m.a,m.b,m.c,m.d,m.e,m.f],cssBlend:getComputedStyle(this.canvas).mixBlendMode});}
   return draw.call(this,source,...args);
  };
 },native);
 for(const reduced of [false,true])for(const id of ['clover-1','clover-4']){
  const name=id+(reduced?'-reduced':'-normal'),dir=resolve(out,name);await mkdir(dir);
  const setup=await page.evaluate(async({id,reduced})=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts');
   const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture(id),m=window.__depthReview,s=window.__depthScene,c=window.__cxvCloverLeaf;
   const original=c.originals.get(id)??c.registry.V5_SKILL_TIMELINES.get(id);if(!original)throw Error('Missing timeline');c.originals.set(id,original);
   if(c.native&&original.layers.find(l=>l.id==='motes')?.texture!==c.key)throw Error('Native selection missing');
   c.original=c.native?{...original,layers:original.layers.map(l=>l.id==='motes'?{...l,texture:''}:l)}:original;
   c.candidate=c.native?original:{...original,layers:original.layers.map(l=>l.id==='motes'?{...l,texture:c.key}:l)};
   m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId=id;m.animationAt=0;m.paused=true;m.sceneStarted=true;m.labOpen=false;m.state.settings.reducedMotion=reduced;m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
   return {impact:m.plan.beats[2].start,duration:m.plan.duration,mote:original.layers.find(l=>l.id==='motes'),targets:m.plan.targetIds,events:m.plan.events.map(e=>e.type)};
  },{id,reduced});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  const times=[setup.impact-1,setup.impact,setup.impact+60,setup.impact+120,setup.impact+240,setup.impact+380,setup.mote.startMs+setup.mote.durationMs,setup.duration-1];
  const samples=[];
  for(let index=0;index<times.length;index++){
   const ms=times[index],row={ms};
   for(const variant of ['baseline','candidate']){
    const audit=await page.evaluate(({id,ms,variant})=>{
     const c=window.__cxvCloverLeaf,m=window.__depthReview,s=window.__depthScene;c.registry.V5_SKILL_TIMELINES.set(id,c[variant==='baseline'?'original':'candidate']);
     m.animationAt=ms;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);c.hits=[];s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
     return {draws:structuredClone(c.hits),timeline:structuredClone(s.effects.timeline.audit),heroes:[...s.actors].filter(([,e])=>['mochi','soot','clover','panko'].includes(e.asset)).map(([actorId,e])=>({id:actorId,owner:e.asset,root:e.actor.root.position.toArray(),feet:s.socket(actorId,'feet')}))};
    },{id,ms,variant});
    const path=resolve(dir,`${variant}-${String(index).padStart(2,'0')}.png`);await page.screenshot({path});row[variant]={...audit,path};
   }
   samples.push(row);
  }
  const sheet=resolve(out,name+'.jpg'),reviewFrames=native?[3,4].flatMap(i=>['baseline','candidate'].map(variant=>({i,variant}))):[1,3,4,7].map(i=>({i,variant:'candidate'}));
  const inputs=reviewFrames.flatMap(({i,variant})=>['-i',samples[i][variant].path]);
  execFileSync('ffmpeg',['-v','error',...inputs,'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','4',sheet]);
  report.cases.push({id,reduced,...setup,sheet,reviewFrames,samples});await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  assert(samples.some(r=>r.candidate.draws.length>0),'No leaf drawn '+name);console.log(name+' captured');
 }
 report.harnessSha256=harnessSha256;report.errors=errors;report.blockedRequests=blockedRequests;
 report.expectedFixtureBlocks=blockedRequests.filter(r=>r.url==='https://fonts.googleapis.com/css2'&&r.type==='stylesheet');
 report.unexpectedRequests=blockedRequests.filter(r=>!report.expectedFixtureBlocks.includes(r));
 assert.equal(errors.length,0);assert.equal(report.unexpectedRequests.length,0);report.pass=true;
}catch(e){report.error=String(e);report.pass=false;process.exitCode=1;}
finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
