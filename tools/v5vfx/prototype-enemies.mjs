/** Small V-C study: current boss arrival and an isolated recipient-sized weave. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve('work/v5/CXV/films/V-C-experiment');await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),method:'Study-only browser transforms; baseline scene render first, original art unchanged. Not runtime delivery.',rows:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
 await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;m.plan=null;for(const e of s.actors.values()){e.entered=e.asset==='yarn-giant'?20:-100;e.entranceDone=false;e.hurtAt=-100;}});
 for(const [i,age]of [0,.24,.48,.96].entries()){
  const audit=await page.evaluate(age=>{
   const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),frame:null,fixedTime:20+age,paused:true,galleryPreview:false},0);
   const [id,e]=[...s.actors].find(([,e])=>e.asset==='yarn-giant');return {age,id,clip:s.sampled.get(id)?.name,at:s.sampled.get(id)?.at,duration:e.actor.duration('appear'),root:e.actor.root.position.toArray(),bounds:s.bounds(e),feet:s.socket(id,'feet'),drawing:e.craftPose?.drawing.key};
  },age);report.rows.push({kind:'arrival-baseline',...audit});await page.screenshot({path:resolve(out,`arrival-${i}.png`)});
 }
 await page.evaluate(async()=>{const m=window.__depthReview,s=window.__depthScene;m.inspect('enemy:binding-thread',0,false);m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());});
 await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
 for(const [i,ms]of [1280,1550].entries())for(const prototype of [false,true]){
  const audit=await page.evaluate(({ms,prototype})=>{
   const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
   const effect=s.craftThread,targets=effect.audit.target,k=s.height/720,old=effect.net.map(n=>({x:n.position.x,y:n.position.y}));
   const cx=(Math.min(...old.map(p=>p.x))+Math.max(...old.map(p=>p.x)))/2,cy=(Math.min(...old.map(p=>p.y))+Math.max(...old.map(p=>p.y)))/2;
   if(prototype){
    const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    const fade=1-smooth((ms-1200)/440);
    for(const n of effect.net){n.position.x=targets.x+(n.position.x-cx)*.48;n.position.y=targets.y+(n.position.y-cy)*.48;n.scale.x*=.48;n.scale.y*=.14;n.material.uniforms.uAlpha.value*=fade*.78;}
   }
   s.renderer.render(s.scene,s.camera);return {ms,prototype,target:targets,net:effect.net.map(n=>({position:n.position.toArray(),scale:n.scale.toArray(),alpha:n.material.uniforms.uAlpha.value}))};
  },{ms,prototype});report.rows.push({kind:'binding',...audit});await page.screenshot({path:resolve(out,`binding-${i}-${prototype?'after':'before'}.png`)});
 }
 for(const [name,files]of [['arrival',[0,1,2,3].map(i=>`arrival-${i}`)],['binding',['binding-0-before','binding-0-after','binding-1-before','binding-1-after']]]){
  const inputs=files.flatMap(f=>['-i',resolve(out,f+'.png')]);execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...inputs,'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','4',resolve(out,name+'.jpg')]);
 }
 report.errors=errors;
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'experiment.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,errors:report.errors,rows:report.rows.length}));
