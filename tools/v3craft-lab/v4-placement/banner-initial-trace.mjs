/** Diagnose the first installed banner measurement without changing runtime sources. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {measureLabels} from './geometry.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-art/REVIEW/A11/banner-runtime-r1');
const target=resolve(out,'initial-geometry-trace-r1.json');if(existsSync(target))throw Error('Never overwrite a trace');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const runtime=JSON.parse(readFileSync(resolve(out,'source-hashes.json'),'utf8'));
const stable=()=>Object.entries(runtime).every(([p,h])=>sha(resolve(root,p))===h);
if(!stable())throw Error('Runtime changed');
const report={started:new Date().toISOString(),pid:process.pid,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 scriptSha256:sha(new URL(import.meta.url)),runtimeHashes:runtime,scope:'Read-only DOM getter instrumentation for the first Soot focus layout; no screenshots or runtime edits.',complete:false,pass:false,samples:[]};
const save=()=>writeFileSync(target,JSON.stringify(report,null,2)+'\n');save();
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const fixture=config.fixtures.find(f=>f.id==='wave3');
 const capturePath=resolve(root,'reports/v3-feel/REVIEW/V4-A11-PLACEMENT-R1/wave3/capture.json.gz');
 const capture=JSON.parse(gunzipSync(readFileSync(capturePath)).toString());
 report.captureSha256=sha(capturePath);
 const {page,errors}=await openFixture(browser,fixture,{width:1280,height:720});
 await page.evaluate(async root=>{
  const {layoutWorldLabels}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts');
  const {layoutFocusBanner}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/banner-layout.ts');
  const native=Element.prototype.getBoundingClientRect,seen=new Set();window.__bannerInitialTraces=[];
  const visible=n=>!n.hidden&&getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden';
  const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
  Element.prototype.getBoundingClientRect=function(){
   const bounds=native.call(this),m=window.__depthReview;
   if(this.classList?.contains('b3-focus-name')&&m?.plan?.actorId==='soot'&&!seen.has(m.plan)&&new Error().stack.includes('identified-focus')){
    seen.add(m.plan);
    const canvas=native.call(document.querySelector('.dp-canvas')),anchors=window.__depthScene.anchors.filter(a=>a.visible);
    const project=r=>({...r,x:r.x+canvas.x,y:r.y+canvas.y});
    const hudNodes=[...document.querySelectorAll('.b3-top,.b3-bottom,.b3-boss,.th-audio,.b3-party')].filter(visible);
    const hud=hudNodes.map(n=>rect(native.call(n))).filter(r=>r.width&&r.height);
    const faces=anchors.flatMap(a=>a.face?[{...project(a.face),id:a.id}]:[]);
    const labels=[],actualLabels=[];
    for(const node of document.querySelectorAll('.b3-world')){
     const anchor=anchors.find(a=>a.id===node.dataset.actor);if(!anchor||!visible(node))continue;
     const boxes=[node,...node.querySelectorAll('*')].filter(visible).map(n=>native.call(n)).filter(r=>r.width&&r.height);
     if(!boxes.length)continue;
     const left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top)),width=Math.max(...boxes.map(r=>r.right))-left,height=Math.max(...boxes.map(r=>r.bottom))-top;
     labels.push({id:anchor.id,side:node.dataset.side==='enemy'?'enemy':'party',rect:{x:canvas.x+anchor.labelX+left-(parseFloat(node.style.left)||0),y:canvas.y+anchor.labelY+top-(parseFloat(node.style.top)||0),width,height}});
     actualLabels.push({id:anchor.id,text:node.textContent,styleLeft:node.style.left,styleTop:node.style.top,rect:{x:left,y:top,width,height}});
    }
    const worldHud=hudNodes.filter(n=>!n.classList.contains('b3-party')).map(n=>rect(native.call(n))).filter(r=>r.width&&r.height);
    const forecast=layoutWorldLabels(labels,innerWidth,innerHeight,worldHud,faces);
    const caster=anchors.find(a=>a.id===m.plan.actorId).body;
    const geometry={title:rect(bounds),caster:project(caster),width:innerWidth,height:innerHeight,hud,faces,bodies:anchors.flatMap(a=>a.body?[project(a.body)]:[]),labels:forecast.map(p=>p.rect)};
    window.__bannerInitialTraces.push(JSON.parse(JSON.stringify({actionId:m.plan.id,elapsed:m.animationAt,skill:m.plan.name,anchors,actualLabels,forecastInputs:labels,forecastLabels:forecast,geometry,expectedPlacement:layoutFocusBanner(geometry)})));
   }
   return bounds;
  };
 },root);
 let previousRender=-1;
 for(const encodedFrame of [666,683]){
   const mapping=capture.resampled[encodedFrame],frame=capture.frames[mapping.renderFrame];
   const frames=capture.frames.slice(previousRender+1,mapping.renderFrame+1).map(f=>({frameAt:f.frameAt,action:f.action}));
   await page.evaluate(frames=>{
    const m=window.__depthReview,s=window.__depthScene;
    const sync=()=>{if(m.plan&&window.__artBannerPlan!==m.plan){window.__artBannerPlan=m.plan;window.__artBannerKey=(window.__artBannerKey??-1)+1;}};
    const tick=delta=>{window.__artBannerClock=(window.__artBannerClock??1000)+delta;m.paused=false;m.tick(delta,window.__artBannerClock);m.paused=true;};
    for(const f of frames){
     if(f.action){
      let guard=0;sync();
      while(window.__artBannerKey!==f.action.key||!m.plan){
       if(++guard>100)throw Error('Cannot reach action ordinal '+f.action.key);
       if(m.plan)tick(m.plan.duration-m.animationAt+.001);else{m.paused=false;m.step();m.paused=true;}sync();
      }
      if(m.plan.id!==f.action.id)throw Error('Action ID differs');
      const delta=f.action.elapsed-m.animationAt;if(delta<-.01)throw Error('Action clock moved backwards');if(delta>0)tick(delta);
     }else if(m.plan){tick(m.plan.duration-m.animationAt+.001);sync();}
     cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:10+f.frameAt,paused:true},Math.max(0,f.frameAt-(window.__artBannerPreviousFrame??f.frameAt)));window.__artBannerPreviousFrame=f.frameAt;
    }
    m.notify(false);cancelAnimationFrame(s.raf);
   },frames);
   previousRender=mapping.renderFrame;await page.clock.runFor(34);
   const labels=await page.evaluate(measureLabels);
   const title=await page.evaluate(()=>{const n=document.querySelector('.b3-focus-name'),r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,text:n.textContent,caster:n.dataset.caster};});
   report.samples.push({encodedFrame,action:frame.action,title,labels});save();
 }
 report.traces=await page.evaluate(()=>window.__bannerInitialTraces);report.errors=errors;
 report.runtimeUnchanged=stable();report.pass=report.runtimeUnchanged&&!errors.length&&report.traces.length===1;await page.close();
}catch(error){report.error=String(error.stack??error);throw error;}
finally{report.complete=true;report.finished=new Date().toISOString();save();await browser.close();}
console.log(JSON.stringify({pass:report.pass,traces:report.traces?.length,samples:report.samples.length}));
