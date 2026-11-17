/** Two private DOM banner-layout drills on unchanged, newly filmed runtime. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {measureLabels} from './geometry.mjs';
import {placePrivateBanner} from './banner-candidates.mjs';
import {decoratePrivateBanner} from './banner-identity-design.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-art/REVIEW/A11/banner-r2');
const target=resolve(out,'temporal-r1.json');
if(existsSync(target))throw Error('Never overwrite a drill');
mkdirSync(resolve(out,'raw'),{recursive:true});
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const runtime=JSON.parse(readFileSync(resolve(root,'reports/v4-art/REVIEW/A11/placement-runtime-r1/source-hashes.json'),'utf8'));
const stable=()=>Object.entries(runtime).every(([p,h])=>sha(resolve(root,p))===h);
if(!stable())throw Error('Runtime changed before private drill');
const report={started:new Date().toISOString(),pid:process.pid,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 scriptSha256:sha(new URL(import.meta.url)),candidateSha256:sha(resolve(import.meta.dirname,'banner-candidates.mjs')),identityDesignSha256:sha(resolve(import.meta.dirname,'banner-identity-design.mjs')),runtimeHashes:runtime,
 scope:'Dense private temporal check of the selected portrait/owner/skill candidate on every encoded focus sample available in the three source captures at720/900. Position held per action. No snapshots, runtime installation or continuous/full-film acceptance.',
 cases:[],complete:false,pass:false,productionInstalled:false};
const save=()=>writeFileSync(target,JSON.stringify(report,null,2)+'\n');save();
const area=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
const metrics=(box,g)=>({clipped:box.x<0||box.y<0||box.x+box.width>g.width||box.y+box.height>g.height,
 hud:g.hud.filter(r=>area(box,r)>0).map(r=>r.kind),faces:g.faces.filter(r=>area(box,r)>0).map(r=>r.id),
 bodies:g.bodies.filter(r=>area(box,r)>0).map(r=>r.id),labels:g.labels.filter(r=>area(box,r.rect)>0).map(r=>r.id)});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  if(!stable())throw Error('Runtime changed during private drill');
  const path=resolve(root,'reports/v3-feel/REVIEW/V4-A11-PLACEMENT-R1',fixture.id,'capture.json.gz');
  const capture=JSON.parse(gunzipSync(readFileSync(path)).toString()),groups=new Map();
  for(const r of capture.resampled){const f=capture.frames[r.renderFrame];if(f.sequence?.focus&&f.action){if(!groups.has(f.action.key))groups.set(f.action.key,[]);groups.get(f.action.key).push(r.frame);}}
  const encoded=[...groups.values()].flat().sort((a,b)=>a-b);
  const {page,errors}=await openFixture(browser,fixture,{width,height});
  const entry={fixture:fixture.id,width,height,capturePath:path.slice(root.length+1),captureSha256:sha(path),errors,samples:[],snapshots:[]};
  report.cases.push(entry);save();
  let previousRender=-1;const positions=new Map();
  for(const encodedFrame of encoded){
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
   const dom=await page.evaluate(()=>{
    const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
    const title=document.querySelector('.b3-focus-name'),scene=window.__depthScene,m=window.__depthReview;
    if(!title||title.hidden)throw Error('Expected visible focus title');
    const canvas=document.querySelector('.dp-canvas').getBoundingClientRect();
    const projected=r=>({...rect(r),x:r.x+canvas.x,y:r.y+canvas.y});
    const caster=scene.anchors.find(a=>a.id===m.plan.actorId),actor=m.battle.actors.find(a=>a.id===m.plan.actorId);
    return{title:rect(title.getBoundingClientRect()),text:title.textContent,actor:m.plan.actorId,actionId:m.plan.id,
     actorName:actor.name,portraitSrc:'/units/'+actor.catalogId+'/portrait.webp',inlineStyle:title.style.cssText,markup:title.innerHTML,fontSize:getComputedStyle(title).fontSize,
     caster:projected(caster.body),bodies:scene.anchors.filter(a=>a.visible&&a.body).map(a=>({...projected(a.body),id:a.id})),
     hud:[...document.querySelectorAll('.b3-top,.b3-bottom,.b3-boss,.th-audio,.b3-party')].filter(n=>!n.hidden&&getComputedStyle(n).display!=='none').map(n=>({...rect(n.getBoundingClientRect()),kind:n.className}))};
   });
   const geometry={...dom,width,height,faces:labels.faces,labels:labels.labels};
   const sample={encodedFrame,renderFrame:mapping.renderFrame,action:frame.action,text:dom.text,actor:dom.actor,geometry,baseline:metrics(dom.title,geometry),candidates:{}};
   const snapshot=false;
   if(snapshot){const p=resolve(out,`raw/${fixture.id}-${height}-f${encodedFrame}-baseline.png`);await page.screenshot({path:p});entry.snapshots.push({encodedFrame,variant:'baseline',path:p.slice(root.length+1),sha256:sha(p)});}
   for(const mode of ['portrait']){
    const measured=await page.evaluate(decoratePrivateBanner,{mode,baseline:dom});
    const key=mode+':'+frame.action.key,box=placePrivateBanner({...geometry,title:measured},'obstacles',positions.get(key));if(!positions.has(key))positions.set(key,box);
    await page.evaluate(box=>{const title=document.querySelector('.b3-focus-name'),parent=title.parentElement.getBoundingClientRect();title.style.left=(box.x-parent.x)+'px';title.style.top=(box.y-parent.y)+'px';},box);
    const actual=await page.evaluate(()=>{const n=document.querySelector('.b3-focus-name'),r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,text:n.textContent};});
    const previous=entry.samples.filter(s=>s.action.key===frame.action.key).at(-1)?.candidates[mode]?.actual;
    sample.candidates[mode]={positionDelta:previous?Math.hypot(actual.x-previous.x,actual.y-previous.y):0,selected:box,actual,measured,metrics:metrics(actual,geometry),
     textUnchanged:measured.skillText===dom.text&&measured.ownerText===dom.actorName&&measured.skillFontSize===dom.fontSize&&!measured.horizontalOverflow,
     identityPreserved:measured.ownerText===dom.actorName&&(mode==='named'||measured.portraitDecoded)};
    if(snapshot){const p=resolve(out,`raw/${fixture.id}-${height}-f${encodedFrame}-${mode}.png`);await page.screenshot({path:p});entry.snapshots.push({encodedFrame,variant:mode,path:p.slice(root.length+1),sha256:sha(p)});}
   }
   await page.evaluate(b=>{const n=document.querySelector('.b3-focus-name');n.style.cssText=b.inlineStyle;n.innerHTML=b.markup;},dom);
   entry.samples.push(sample);
  }
  entry.summary={samples:entry.samples.length,baselineHudHits:entry.samples.filter(s=>s.baseline.hud.length).length,candidates:{}};
  for(const mode of ['portrait'])entry.summary.candidates[mode]={
   hudHits:entry.samples.filter(s=>s.candidates[mode].metrics.hud.length).length,
   faceHits:entry.samples.filter(s=>s.candidates[mode].metrics.faces.length).length,
   bodyHits:entry.samples.filter(s=>s.candidates[mode].metrics.bodies.length).length,
   labelHits:entry.samples.filter(s=>s.candidates[mode].metrics.labels.length).length,
   clipped:entry.samples.filter(s=>s.candidates[mode].metrics.clipped).length,
   infeasible:entry.samples.filter(s=>!s.candidates[mode].selected.feasible).length,
   textLoss:entry.samples.filter(s=>!s.candidates[mode].textUnchanged).length,
   identityLoss:entry.samples.filter(s=>!s.candidates[mode].identityPreserved).length,
   maxPositionDelta:Math.max(0,...entry.samples.map(s=>s.candidates[mode].positionDelta))};
  save();console.log(fixture.id,height,JSON.stringify(entry.summary));await page.close();
 }
 report.runtimeUnchanged=stable();report.complete=true;report.pass=report.runtimeUnchanged&&report.cases.every(c=>!c.errors.length);report.finished=new Date().toISOString();save();
}catch(error){report.complete=true;report.error=String(error.stack??error);report.finished=new Date().toISOString();save();throw error;}
finally{await browser.close();}
