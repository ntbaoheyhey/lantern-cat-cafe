/** Measures world-space feet/root from the current production scene, without images. */
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve(process.env.CXI_M_WORLD_OUT??'work/v5/CXI/batch-m/panko-production-r1/world.json');
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),method:'Actual scene render at301 samples over10s. World and projected foot vertices; both motion modes.',runs:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
 report.runs=await page.evaluate(()=>{
  const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;const runs=[];
  for(const reduced of [false,true]){
   const samples=[];m.state.settings.reducedMotion=reduced;
   for(let n=0;n<=300;n++){
    const time=20+n/30;s.render({...s.view(),frame:null,fixedTime:time,paused:true,galleryPreview:true,reducedMotion:reduced},0);
    const [id,e]=[...s.actors].find(([,e])=>e.asset==='panko'),d=e.craftPose.drawing;
    const feet=d.frame.feet.map(p=>{const q=d.point(p),v=d.localToWorld(s.scratch.clone().set(q.x,q.y,0));return {world:{x:v.x,y:v.y,z:v.z},screen:s.screen(v)};});
    samples.push({time,id,feet,root:{position:e.actor.root.position.toArray(),scale:e.actor.root.scale.toArray(),rotation:e.actor.root.rotation.toArray().slice(0,3)},clock:d.secondary.clock});
   }
   runs.push({reduced,samples});
  }
  return runs;
 });
 report.errors=errors;report.blockedRequests=blockedRequests;
 report.metrics=report.runs.map(run=>{
  const first=run.samples[0],last=run.samples.at(-1),delta=(s,a)=>Math.max(...s.feet.flatMap((f,i)=>['x','y'].map(k=>Math.abs(f[a][k]-first.feet[i][a][k]))));
  const rootDelta=s=>Math.max(...['position','scale','rotation'].flatMap(k=>s.root[k].map((v,i)=>Math.abs(v-first.root[k][i]))));
  return {reduced:run.reduced,feetWorldDrift:Math.max(...run.samples.map(s=>delta(s,'world'))),feetScreenDrift:Math.max(...run.samples.map(s=>delta(s,'screen'))),feetWorldSeam:delta(last,'world'),feetScreenSeam:delta(last,'screen'),rootDrift:Math.max(...run.samples.map(rootDelta)),rootSeam:rootDelta(last)};
 });
 report.pass=errors.length===0&&blockedRequests.length===0&&report.metrics.every(r=>r.feetWorldDrift<.0001&&r.feetWorldSeam<.0001&&r.rootSeam<.0001);
}catch(e){report.pass=false;report.error=String(e.stack??e);}
finally{await browser.close();report.completedUTC=new Date().toISOString();await mkdir(resolve(out,'..'),{recursive:true});await writeFile(out,JSON.stringify(report)+'\n');console.log(JSON.stringify({out,pass:report.pass,error:report.error,metrics:report.metrics}));if(!report.pass)process.exitCode=1;}
