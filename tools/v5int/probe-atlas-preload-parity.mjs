/** Native canvas comparison of selected versus retained enemy atlas readiness. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';

const root=resolve(import.meta.dirname,'../..'),req=createRequire(resolve(root,'apps/web/package.json')),sharp=req('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex'),buildPath=process.env.CXI_MEDIA_BUILD;
assert(buildPath);const build=JSON.parse(await readFile(buildPath));
const out=resolve(process.env.CXI_CAPTURE_OUT??'');assert(out.startsWith(resolve(root,'work/v5/CXI')+'/')&&!existsSync(out));await mkdir(out,{recursive:true});
assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
const skipped=['needle-moth','teacup-healer','kettle-knight','yarn-giant','binding-thread'];
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:{width:1280,height:720},buildPath,buildSha256:sha(await readFile(buildPath)),sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,harnessSha256:sha(await readFile(import.meta.filename)),
 method:'The served renderer runs normally. A second native PaintedVfx instance retains all owner atlases. Cue/accent/clear calls are forwarded unchanged; the same render arguments feed both. Compare every RGBA byte in the main effect canvas and active blend passes. Battle queues/rage are arranged solely to exercise actual rules actions; these are deterministic fixtures, not an ordinary journey.',
 limits:['Comparison deliberately loads retained atlases after initial readiness; use the separate cold gate for bytes.','Craft bodies/stage are unchanged and not independently compared here.','No realtime performance, unsupported browser, or production override-art acceptance.'],runs:[],captures:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try {
 for(const fixture of config.fixtures)for(const reduced of [false,true]) {
  const requests=[],{page,errors,blockedRequests}=await openFixture(browser,fixture,{setupPage:async page=>{page.on('request',r=>requests.push(new URL(r.url()).pathname));}});
  const run={fixture:fixture.id,reduced,errors,blockedRequests,initialRequests:[...new Set(requests)],rows:[],complete:false};report.runs.push(run);await save();
  run.initial=await page.evaluate(async ({reduced,skipped})=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.paused=true;m.state.settings.reducedMotion=reduced;m.plan=null;m.notify(false);
   const owners=[...new Set([...s.actors.values()].map(e=>e.asset))].sort();
   const original=s.effects,initial=[...original.layered.images.keys()].sort();
   const retained=new original.constructor(document.createElement('div'),(id,socket)=>s.socket(id,socket),id=>s.pixelsPerUnit(id));
   await retained.prepare(owners,true);
   const probe={original,retained,initial,owners,last:null,originalMethods:{},baseBattle:structuredClone(m.battle),skipped};window.__atlasParity=probe;
   for(const name of ['cue','accent','clear']){probe.originalMethods[name]=original[name];original[name]=function(...args){const result=probe.originalMethods[name].apply(this,args);retained[name](...args);return result;};}
   probe.originalMethods.render=original.render;
   original.render=function(...args){
    const result=probe.originalMethods.render.apply(this,args);retained.useLayered=this.useLayered;retained.render(...args);
    const all=[['main',this.canvas,retained.canvas]];
    const blends=new Set([...this.blendLayers.passes,...retained.blendLayers.passes].map(p=>p.blend));
    for(const blend of blends){const a=this.blendLayers.passes.find(p=>p.blend===blend),b=retained.blendLayers.passes.find(p=>p.blend===blend);if(Boolean(a?.active)!==Boolean(b?.active))throw Error('Blend activity differs');if(a?.active&&b?.active)all.push([blend,a.canvas,b.canvas]);}
    probe.last=all.map(([name,a,b])=>{if(a.width!==b.width||a.height!==b.height)throw Error('Canvas size differs');const x=a.getContext('2d').getImageData(0,0,a.width,a.height).data,y=b.getContext('2d').getImageData(0,0,b.width,b.height).data;let changed=0,maxDelta=0;for(let i=0;i<x.length;i++)if(x[i]!==y[i]){changed++;maxDelta=Math.max(maxDelta,Math.abs(x[i]-y[i]));}return{name,width:a.width,height:a.height,changed,maxDelta,x,y};});
    return result;
   };
   original.clear();s.phaseNoticeAt=-100;for(const e of s.actors.values())e.entranceDone=true;
   for(const a of document.getAnimations()){a.currentTime=300;a.pause();}
   return{owners,initialIds:initial,retainedIds:[...retained.layered.images.keys()].sort(),a6:m.battle.initial.gameplayA6,c2:m.battle.initial.formationC2};
  },{reduced,skipped});
  assert(run.initial.a6&&run.initial.c2);
  for(const owner of fixture.enemies.filter(o=>skipped.includes(o))){assert(!run.initial.initialIds.some(id=>id===`enemy:${owner}`||id===`enemy:${owner}:basic`),owner+' was preloaded');assert(run.initial.retainedIds.includes('enemy:'+owner));}
  const owners=[...new Set(fixture.enemies)];
  // Party actions also exercise unchanged Soot and shared passive/field pages.
  owners.push(...await page.evaluate(()=>window.__atlasParity.baseBattle.actors.filter(a=>a.side==='party').map(a=>a.catalogId)));
  for(const owner of owners)for(const ultimate of [false,true]) {
   const action=await page.evaluate(({owner,ultimate})=>{
    const m=window.__depthReview,s=window.__depthScene,p=window.__atlasParity,battle=structuredClone(p.baseBattle);
    const caster=battle.actors.find(a=>a.catalogId===owner);caster.turns=3;caster.charge=ultimate?100:0;
    const intent=battle.intents.find(i=>i.actorId===caster.id);if(intent)intent.signature=ultimate;
    battle.queue=[caster.id,...battle.queue.filter(id=>id!==caster.id)];battle.v4.committed=true;
    Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:false,sceneStarted:true,sceneReady:true,screen:'map'});m.act();m.paused=true;m.animationAt=0;m.notify(false);cancelAnimationFrame(s.raf);
    if(!m.plan)throw Error('No actual plan for '+owner);
    return{owner,requestedUltimate:ultimate,ultimate:m.plan.ultimate,actorId:m.plan.actorId,skillId:m.plan.skillId,presentationId:m.plan.presentationId,contact:m.plan.beats[2].start,duration:m.plan.duration};
   },{owner,ultimate});
   await page.waitForFunction(()=>window.__depthScene.ready);
   const times=[...new Set([0,250,600,action.contact,action.contact+70,action.duration-1].filter(t=>t>=0))].sort((a,b)=>a-b);
   for(const elapsed of [...times,null]) {
    const row=await page.evaluate(async ({elapsed,action,reduced})=>{
     const s=window.__depthScene,m=window.__depthReview,p=window.__atlasParity;
     m.animationAt=elapsed??action.duration;const frame=elapsed===null?null:m.frame,view={...s.view(),frame,fixedTime:30+(elapsed??action.duration)/1000,paused:true,reducedMotion:reduced};
     const before=JSON.stringify(m.battle);p.last=null;s.render(view,0);if(!p.last)throw Error('No native effect sample');
     const hash=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a)),x=>x.toString(16).padStart(2,'0')).join('');
     const surfaces=[];for(const {x,y,...metrics} of p.last)surfaces.push({...metrics,selectedSha256:await hash(x),retainedSha256:await hash(y)});
     if(JSON.stringify(m.battle)!==before)throw Error('Renderer mutated game state');
     return{...action,elapsed,utc:new Date().toISOString(),timelineOnly:s.craftHandles(frame?.plan??null),surfaces,gameStateUnchanged:true};
    },{elapsed,action,reduced});
    run.rows.push(row);await save();
    assert(row.surfaces.every(s=>s.changed===0&&s.selectedSha256===s.retainedSha256),'Native effect pixel mismatch '+fixture.id+'/'+owner+'/'+elapsed);
    if(!reduced&&ultimate&&elapsed===600&&((fixture.id==='wave1'&&owner==='needle-moth')||(fixture.id==='boss'&&owner==='yarn-giant'))){
     const path=resolve(out,`${fixture.id}-${owner}-600.png`);await page.screenshot({path});const bytes=await readFile(path),meta=await sharp(bytes).metadata();assert.equal(meta.width,1280);assert.equal(meta.height,720);
     const preview=resolve(out,`${fixture.id}-${owner}-600-review1024.png`);await sharp(bytes).resize(1024,576).png().toFile(preview);
     report.captures.push({path,sha256:sha(bytes),preview,previewSha256:sha(await readFile(preview)),utc:new Date().toISOString(),sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,url:judgeUrl});
    }
   }
  }
  run.fallback=await page.evaluate(async()=>{
   const s=window.__depthScene,p=window.__atlasParity;for(const [name,method] of Object.entries(p.originalMethods))p.original[name]=method;p.retained.dispose();
   // An unrelated, inert ready override must conservatively restore all pages.
   p.original.overrides.effects.set('audit:inert-ready',{spec:{format:'sequence'},duration:1,images:[],players:[],cueWarnings:new Set()});
   s.prepare({...s.view(),frame:null});
   while(!s.ready)await new Promise(requestAnimationFrame);
   const ids=[...s.effects.layered.images.keys()].sort();p.original.overrides.effects.delete('audit:inert-ready');return{ids,ready:s.ready};
  });
  for(const id of run.initial.retainedIds)assert(run.fallback.ids.includes(id));
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);run.complete=true;await save();await page.close();
 }
 report.pass=true;
} catch(error){report.failure=String(error.stack??error);process.exitCode=1;}
finally{await browser.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,runs:report.runs.length,rows:report.runs.reduce((n,r)=>n+r.rows.length,0),captures:report.captures.length,failure:report.failure}));}
