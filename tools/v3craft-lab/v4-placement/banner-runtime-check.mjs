/** Two private DOM banner-layout drills on unchanged, newly filmed runtime. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {measureLabels} from './geometry.mjs';
import {placePrivateBanner} from './banner-candidates.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-art/REVIEW/A11/banner-runtime-r1');
const target=resolve(out,'runtime-check-r1.json');
if(existsSync(target))throw Error('Never overwrite a drill');
mkdirSync(resolve(out,'raw'),{recursive:true});
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const runtime=JSON.parse(readFileSync(resolve(root,'reports/v4-art/REVIEW/A11/banner-runtime-r1/source-hashes.json'),'utf8'));
const stable=()=>Object.entries(runtime).every(([p,h])=>sha(resolve(root,p))===h);
if(!stable())throw Error('Runtime changed before private drill');
const report={started:new Date().toISOString(),pid:process.pid,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 scriptSha256:sha(new URL(import.meta.url)),candidateSha256:sha(resolve(import.meta.dirname,'banner-candidates.mjs')),identityDesignSha256:sha(resolve(import.meta.dirname,'banner-identity-design.mjs')),runtimeHashes:runtime,
 scope:'Installed DOM check at every available encoded focus sample from the unchanged action captures, replayed at720/900. Check full text, caster image/name, actual intersections and held placement. Separately compare the compiled solver with the private algorithm on identical measured inputs; this does not assert identical entry-time choices or continuous/full-film acceptance.',
 cases:[],complete:false,pass:false,productionInstalled:true,temporalAcceptance:false};
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
    const skill=title.querySelector('.b3-focus-skill'),owner=title.querySelector('.b3-focus-owner'),image=title.querySelector('img');
    return{title:rect(title.getBoundingClientRect()),text:m.plan.name,actor:m.plan.actorId,actionId:m.plan.id,
     observed:{skillText:skill?.textContent,ownerText:owner?.textContent,skillFontSize:skill?getComputedStyle(skill).fontSize:null,
      portraitSrc:image?.getAttribute('src'),portraitDecoded:!!image?.complete&&image.naturalWidth>0,caster:title.dataset.caster,
      placement:title.dataset.placement,horizontalOverflow:title.scrollWidth>title.clientWidth},
     actorName:actor.name,portraitSrc:'/units/'+actor.catalogId+'/portrait.webp',inlineStyle:title.style.cssText,markup:title.innerHTML,fontSize:getComputedStyle(title).fontSize,
     caster:projected(caster.body),bodies:scene.anchors.filter(a=>a.visible&&a.body).map(a=>({...projected(a.body),id:a.id})),
     hud:[...document.querySelectorAll('.b3-top,.b3-bottom,.b3-boss,.th-audio,.b3-party')].filter(n=>!n.hidden&&getComputedStyle(n).display!=='none').map(n=>({...rect(n.getBoundingClientRect()),kind:n.className}))};
   });
   const geometry={...dom,width,height,faces:labels.faces,labels:labels.labels};
   const sample={encodedFrame,renderFrame:mapping.renderFrame,action:frame.action,text:dom.text,actor:dom.actor,geometry,installed:metrics(dom.title,geometry),candidates:{}};
   const actual={...dom.title,text:dom.observed.skillText},observed=dom.observed;
   const expected=placePrivateBanner(geometry,'obstacles');
   const compiled=await page.evaluate(async({geometry,root})=>{
    const {layoutFocusBanner}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/banner-layout.ts');
    return layoutFocusBanner({...geometry,labels:geometry.labels.map(l=>l.rect)});
   },{geometry,root});
   const solverDifference=Math.max(...['x','y','width','height'].map(k=>Math.abs(expected[k]-compiled[k])),Number(expected.feasible!==compiled.feasible));
   const previous=entry.samples.filter(s=>s.action.key===frame.action.key).at(-1)?.candidates.portrait?.actual;
   sample.candidates.portrait={actual,observed,solverDifference,selected:{...actual,feasible:observed.placement==='clear'},
    positionDelta:previous?Math.hypot(actual.x-previous.x,actual.y-previous.y):0,metrics:metrics(actual,geometry),
    textUnchanged:observed.skillText===dom.text&&observed.skillFontSize==='16px'&&!observed.horizontalOverflow,
    identityPreserved:observed.ownerText===dom.actorName&&observed.portraitSrc===dom.portraitSrc&&observed.portraitDecoded&&observed.caster===dom.actor};
   const check=sample.candidates.portrait;
   sample.geometrySha256=createHash('sha256').update(JSON.stringify(geometry)).digest('hex');
   if(!check.metrics.clipped&&!check.metrics.hud.length&&!check.metrics.faces.length&&!check.metrics.bodies.length&&!check.metrics.labels.length&&check.textUnchanged&&check.identityPreserved&&!check.positionDelta&&!solverDifference&&check.selected.feasible)delete sample.geometry;
   entry.samples.push(sample);
  }
  entry.summary={samples:entry.samples.length,installedHudHits:entry.samples.filter(s=>s.installed.hud.length).length,candidates:{}};
  for(const mode of ['portrait'])entry.summary.candidates[mode]={
   hudHits:entry.samples.filter(s=>s.candidates[mode].metrics.hud.length).length,
   faceHits:entry.samples.filter(s=>s.candidates[mode].metrics.faces.length).length,
   bodyHits:entry.samples.filter(s=>s.candidates[mode].metrics.bodies.length).length,
   labelHits:entry.samples.filter(s=>s.candidates[mode].metrics.labels.length).length,
   clipped:entry.samples.filter(s=>s.candidates[mode].metrics.clipped).length,
   infeasible:entry.samples.filter(s=>!s.candidates[mode].selected.feasible).length,
   textLoss:entry.samples.filter(s=>!s.candidates[mode].textUnchanged).length,
   identityLoss:entry.samples.filter(s=>!s.candidates[mode].identityPreserved).length,
   maxPositionDelta:Math.max(0,...entry.samples.map(s=>s.candidates[mode].positionDelta)),
   solverMismatch:entry.samples.filter(s=>s.candidates[mode].solverDifference>1e-6).length};
  save();console.log(fixture.id,height,JSON.stringify(entry.summary));await page.close();
 }
 report.runtimeUnchanged=stable();report.complete=true;report.pass=report.runtimeUnchanged&&report.cases.every(c=>!c.errors.length&&Object.values(c.summary.candidates.portrait).every(v=>v===0));report.finished=new Date().toISOString();save();
}catch(error){report.complete=true;report.error=String(error.stack??error);report.finished=new Date().toISOString();save();throw error;}
finally{await browser.close();}
