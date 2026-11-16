/** Private DOM placement replay at saved action clocks; no recorder or runtime edits. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {placeLabels} from './layout-candidates.mjs';
import {measureLabels} from './geometry.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gunzipSync,gzipSync} from 'node:zlib';

const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-art/REVIEW/A11/placement-r1');
const attempt=process.argv.find(x=>x.startsWith('--attempt='))?.split('=')[1]??'r2';
if(!/^r[1-4]$/.test(attempt))throw Error('Maximum four attempts before method change');
const reportPath=resolve(out,'temporal-'+attempt+'.json');if(existsSync(reportPath))throw Error('Never overwrite an attempt');
const raw=resolve(out,'raw/temporal-'+attempt);mkdirSync(raw,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const sourceHashes=read(resolve(root,'reports/v4-art/REVIEW/A11/delivery-r1/source-hashes.json'));
const stable=()=>Object.entries(sourceHashes).every(([p,h])=>hash(resolve(root,p))===h);
const contrast=resolve(root,'reports/v4-art/REVIEW/A10/contrast');
const defects=read(resolve(contrast,'film-review.json')).coverageFollowups.filter(x=>x.defectOpen);
const captureSources=read(resolve(contrast,'capture-sources.json'));
if(defects.length!==42||!stable())throw Error('Unexpected defect inventory or runtime changed');
const report={started:new Date().toISOString(),pid:process.pid,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 scriptSha256:hash(new URL(import.meta.url)),candidateSha256:hash(resolve(import.meta.dirname,'layout-candidates.mjs')),
 sourceHashes,scope:'Private semantic replay of retained encoded frames and their two adjacent frames on either side at720/900. Original frames stay closed. Pose/DOM equivalence is not assumed; baseline reproduction is measured.',
 defectInventory:42,cases:[],complete:false,productionInstalled:false,temporalAcceptance:false};
const save=()=>writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');save();
const metrics=g=>({clipped:g.clipped,hud:g.hud,faceHits:g.faceHits,pairs:g.pairs});
const nearest=(label,faces)=>faces.map(f=>({id:f.id,d:Math.hypot(Math.max(f.x-label.rect.x-label.rect.width,label.rect.x-f.x-f.width,0),Math.max(f.y-label.rect.y-label.rect.height,label.rect.y-f.y-f.height,0))})).sort((a,b)=>a.d-b.d)[0]?.id;
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try {
 for(const [width,height] of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  if(!stable())throw Error('Runtime changed');
  const path=resolve(root,captureSources[fixture.id],fixture.id,'capture.json.gz');
  const capture=JSON.parse(gunzipSync(readFileSync(path)).toString());
  const wanted=defects.filter(d=>d.fixture===fixture.id);
  const encoded=[...new Set(wanted.flatMap(d=>[-2,-1,0,1,2].map(n=>d.encodedFrame+n)))].sort((a,b)=>a-b);
  const {page,errors}=await openFixture(browser,fixture,{width,height});
  await page.addScriptTag({content:'window.__artPrivatePlace='+placeLabels.toString()});
  const entry={fixture:fixture.id,width,height,capturePath:path.slice(root.length+1),captureSha256:hash(path),
   captureSourceCommit:capture.sourceCommit,errors,samples:[],snapshots:[]};
  report.cases.push(entry);save();
  let previousRender=-1,previous=null;
  const rawSamples=[];
  for(const encodedFrame of encoded){
   const mapping=capture.resampled[encodedFrame],frame=capture.frames[mapping.renderFrame];
   const replay=capture.frames.slice(previousRender+1,mapping.renderFrame+1).map(f=>({frameAt:f.frameAt,action:f.action}));
   await page.evaluate(frames=>{
    const m=window.__depthReview,s=window.__depthScene;
    const syncPlan=()=>{if(m.plan&&window.__artReplayPlan!==m.plan){window.__artReplayPlan=m.plan;window.__artReplayKey=(window.__artReplayKey??-1)+1;}};
    const tick=delta=>{window.__artReplayClock=(window.__artReplayClock??1000)+delta;m.paused=false;m.tick(delta,window.__artReplayClock);m.paused=true;};
    for(const frame of frames){
     const target=frame.action;
     if(target){
      let guard=0;
      syncPlan();
      while(window.__artReplayKey!==target.key||!m.plan){
       if(++guard>100)throw Error('Cannot reach key '+target.key+' action '+target.id+'; current '+window.__artReplayKey+'/'+m.plan?.id);
       if(m.plan)tick(m.plan.duration-m.animationAt+0.001);else {m.paused=false;m.step();m.paused=true;}
       syncPlan();
      }
      if(m.plan.id!==target.id)throw Error('Action ID differs at key '+target.key);
      const delta=target.elapsed-m.animationAt;
      if(delta<-.01)throw Error('Action clock moved backwards '+delta);
      if(delta>0)tick(delta);
     }else if(m.plan){tick(m.plan.duration-m.animationAt+0.001);syncPlan();}
     cancelAnimationFrame(s.raf);
     s.render({...s.view(),fixedTime:10+frame.frameAt,paused:true},Math.max(0,frame.frameAt-(window.__artPreviousFrame??frame.frameAt)));
     window.__artPreviousFrame=frame.frameAt;
    }
    m.notify(false);cancelAnimationFrame(s.raf);
   },replay);
   previousRender=mapping.renderFrame;
   await page.clock.runFor(34);
   const baseline=await page.evaluate(measureLabels);
   if(frame.action&&(baseline.action!==frame.action.id||Math.abs(baseline.elapsed-frame.action.elapsed)>.02))throw Error('Replay clock mismatch');
   const exact=wanted.filter(d=>d.encodedFrame===encodedFrame);
   const snapshot=height===720&&exact.some(d=>d.resolution!=='actual-viewport-clipping')||height===900&&exact.some(d=>d.actor==='soot')&&entry.snapshots.length===0;
   if(snapshot&&entry.snapshots.length<3){
    const p=resolve(raw,fixture.id+'-'+height+'-f'+encodedFrame+'-baseline.png');await page.screenshot({path:p});entry.snapshots.push({encodedFrame,variant:'baseline',path:p.slice(root.length+1),sha256:hash(p)});
   }
   const placement=await page.evaluate(baseline=>{
    const nodes=new Map([...document.querySelectorAll('.b3-world')].map(n=>[n.dataset.actor,n]));
    const result=window.__artPrivatePlace(baseline.labels,innerWidth,innerHeight,baseline.obstacles,baseline.faces,'hud');
    for(const p of result){const before=baseline.labels.find(l=>l.id===p.id),node=nodes.get(p.id);node.style.left=(parseFloat(before.styleLeft)+p.rect.x-before.rect.x)+'px';node.style.top=(parseFloat(before.styleTop)+p.rect.y-before.rect.y)+'px';}
    return result;
   },baseline);
   const candidate=await page.evaluate(measureLabels);
   const shifts=candidate.labels.map(l=>{const b=baseline.labels.find(x=>x.id===l.id);return{id:l.id,text:l.text,x:l.rect.x-b.rect.x,y:l.rect.y-b.rect.y,
    baselineNearest:nearest(b,baseline.faces),candidateNearest:nearest(l,candidate.faces)};});
   const jumps=previous&&encodedFrame===previous.encodedFrame+1?shifts.flatMap(s=>{const p=previous.shifts.find(x=>x.id===s.id&&x.text===s.text);return p?[{id:s.id,distance:Math.hypot(s.x-p.x,s.y-p.y)}]:[];}):[];
   const sample={encodedFrame,renderFrame:mapping.renderFrame,action:frame.action,retainedDefects:exact.map(d=>({actor:d.actor,resolution:d.resolution})),
    baseline:metrics(baseline),candidate:metrics(candidate),allFeasible:placement.every(p=>p.feasible),
    textAndIdsPreserved:baseline.labels.length===candidate.labels.length&&candidate.labels.every(l=>baseline.labels.some(b=>b.id===l.id&&b.text===l.text)),
    shifts,jumps};
   entry.samples.push(sample);rawSamples.push({encodedFrame,baseline,candidate,placement});previous={encodedFrame,shifts};
   if(snapshot&&entry.snapshots.at(-1)?.encodedFrame===encodedFrame&&entry.snapshots.at(-1)?.variant==='baseline'){
    const p=resolve(raw,fixture.id+'-'+height+'-f'+encodedFrame+'-hud.png');await page.screenshot({path:p});entry.snapshots.push({encodedFrame,variant:'hud',path:p.slice(root.length+1),sha256:hash(p)});
   }
  }
  const rawPath=resolve(raw,fixture.id+'-'+height+'.json.gz');writeFileSync(rawPath,gzipSync(JSON.stringify(rawSamples)));
  entry.rawSamples={path:rawPath.slice(root.length+1),sha256:hash(rawPath)};
  entry.summary={samples:entry.samples.length,retainedDefects:entry.samples.reduce((n,s)=>n+s.retainedDefects.length,0),
   baselineClipped:entry.samples.reduce((n,s)=>n+s.baseline.clipped.length,0),baselineHud:entry.samples.reduce((n,s)=>n+s.baseline.hud.length,0),
   candidateClipped:entry.samples.reduce((n,s)=>n+s.candidate.clipped.length,0),candidateHud:entry.samples.reduce((n,s)=>n+s.candidate.hud.length,0),
   candidateFaceHits:entry.samples.reduce((n,s)=>n+s.candidate.faceHits.length,0),candidatePairs:entry.samples.reduce((n,s)=>n+s.candidate.pairs.length,0),
   infeasible:entry.samples.filter(s=>!s.allFeasible).length,textLoss:entry.samples.filter(s=>!s.textAndIdsPreserved).length,
   maxStableTextOffsetJump:Math.max(0,...entry.samples.flatMap(s=>s.jumps.map(j=>j.distance)))};
  save();console.log(fixture.id,height,JSON.stringify(entry.summary));await page.close();
 }
 report.complete=true;report.runtimeUnchanged=stable();report.finished=new Date().toISOString();save();
}catch(error){report.error=String(error.stack??error);report.finished=new Date().toISOString();report.runtimeUnchanged=stable();save();throw error;}
finally{await browser.close();}
