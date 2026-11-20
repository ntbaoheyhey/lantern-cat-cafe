/** Renderer fixtures: synthetic critical/stack values are explicitly labelled. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,access} from 'node:fs/promises';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/number-captures',label);
try{await access(out);throw Error('Use fresh evidence label');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),captureHarnessSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),viewport:{width:1280,height:720},method:'12 exact timestamps per action; critical and triple-stack modify only isolated renderer fixture events, not game rules.',rows:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();report.errors=errors;report.blockedRequests=blockedRequests;
 for(const [name,id,reduced] of [['normal','panko-1',false],['critical','soot-1',false],['heal','clover-1',false],['stack','panko-1',false],['critical-reduced','soot-1',true]]){
  const dir=resolve(out,name);await mkdir(dir,{recursive:true});
  const plan=await page.evaluate(({name,id,reduced})=>{
   const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.inspect(id,0,false);
   const events=m.plan.events,damage=events.find(e=>e.type==='damage');
   if(name.startsWith('critical'))damage.critical=true;
   if(name==='stack')m.plan.events=[...events.filter(e=>e.type!=='damage'),...[21,34,55].map((amount,i)=>({...damage,amount,critical:i===2,seq:damage.seq+i+100}))];
   cancelAnimationFrame(window.__depthScene.raf);m.notify(false);
   return{impact:m.plan.beats[2].start,events:structuredClone(m.plan.events)};
  },{name,id,reduced});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  const samples=[];
  for(const [i,age]of [-1,0,30,60,100,160,220,380,500,600,639,660].entries()){
   const ms=plan.impact+age;
   const sample=await page.evaluate(({ms,name,age})=>{
    const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
    let label=document.querySelector('[data-cxi-timestamp]');if(!label){label=document.createElement('div');label.dataset.cxiTimestamp='true';Object.assign(label.style,{position:'fixed',bottom:'8px',left:'8px',padding:'5px',background:'#21182dee',color:'#fff4d8',font:'16px monospace',zIndex:'999999'});document.body.append(label);}
    label.textContent=`${name} renderer fixture · contact ${age>=0?'+':''}${age}ms`;
    return{age,numbers:structuredClone(s.numbers.drawn),faces:s.anchors.filter(a=>a.visible&&a.face).map(a=>a.face)};
   },{ms,name,age});samples.push(sample);await page.screenshot({path:resolve(dir,`frame-${i}.png`)});
  }
  const sheet=resolve(out,name+'.jpg');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','6','-i',resolve(dir,'frame-%d.png'),'-vf','scale=256:-1,tile=4x3','-frames:v','1','-q:v','4',sheet]);
  const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  const issues=[];for(const s of samples){for(const [i,a]of s.numbers.entries()){if(s.faces.some(f=>overlaps(a,f)))issues.push({age:s.age,type:'face',key:a.key});for(const b of s.numbers.slice(i+1))if(overlaps(a,b))issues.push({age:s.age,type:'stack',keys:[a.key,b.key]});}}
  report.rows.push({name,id,reduced,synthetic:name.startsWith('critical')||name==='stack',plan,samples,sheet,issues});console.log(name+' '+JSON.stringify({issues:issues.length,maxLabels:Math.max(...samples.map(s=>s.numbers.length))}));
 }
 report.identityAfter=runtimeEvidence();
 report.pass=report.indexSha256===report.identityAfter.indexSha256&&blockedRequests.length===0&&errors.length===0&&report.rows.every(r=>r.issues.length===0&&r.samples.some(s=>s.age===0&&s.numbers.length>0));
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.map(r=>({name:r.name,samples:r.samples.length,issues:r.issues.length})),errors:report.errors,blockedRequests:report.blockedRequests}));
if(!report.pass)process.exitCode=1;
