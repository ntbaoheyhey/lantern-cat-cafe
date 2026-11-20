/** Isolated damage-recipient fixtures audit every owned actor's ground contact. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/R4-ground');await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),method:'Synthetic single-recipient damage fixtures for contact coverage only; actual healing plan and reduced-motion exclusion.12 deterministic frames per sheet.',rows:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();report.errors=errors;
 const assets=['mochi','soot','clover','panko','binding-thread','needle-moth','teacup-healer','button-guard','sock-skipper','kettle-knight','crumb-sentinel','spool-ram','pollen-scout','yarn-giant'];
 for(const [asset,mode]of [...assets.map(a=>[a,'damage']),['clover','heal'],['panko','reduced']]){
  const name=asset+'-'+mode,dir=resolve(out,name);await mkdir(dir,{recursive:true});
  await page.evaluate(({asset,mode})=>{
   const m=window.__depthReview;m.state.settings.reducedMotion=mode==='reduced';m.inspect(['mochi','soot','clover','panko'].includes(asset)?asset+'-1':'enemy:'+asset,0,false);
   const target=m.battle.actors.find(a=>a.catalogId===asset),start=m.plan.events.find(e=>e.type==='action_start');
   if(mode!=='heal'){m.plan={...m.plan,targetIds:[target.id],events:[start,{...start,seq:999,beat:2,type:'damage',amount:20,targetIds:[target.id]}]};}
   m.animationAt=0;m.notify(false);cancelAnimationFrame(window.__depthScene.raf);
  },{asset,mode});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  const setup=await page.evaluate(asset=>{
   const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:20,paused:true},0);
   const id=m.battle.actors.find(a=>a.catalogId===asset).id,e=s.actors.get(id),b=s.bounds(e),point=s.groundContacts.get(id);
   const cx=point.x,cy=point.y,x=Math.max(0,Math.min(1280-440,Math.floor(cx-220))),y=Math.max(0,Math.min(720-300,Math.floor(cy-230)));
   return{id,impact:m.plan.beats[2].start,craft:!!e.craftLight,clip:{x,y,width:440,height:300},body:b};
  },asset);
  const samples=[];
  for(const [i,age]of [-1,0,20,40,70,110,160,220,280,340,360,500].entries()){
   const sample=await page.evaluate(({setup,age,name})=>{
    const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.animationAt=setup.impact+age;s.render({...s.view(),fixedTime:20+m.animationAt/1000,paused:true},0);
    let label=document.querySelector('[data-cxv-ground]');if(!label){label=document.createElement('div');label.dataset.cxvGround='true';document.body.append(label);}
    Object.assign(label.style,{position:'fixed',left:setup.clip.x+4+'px',top:setup.clip.y+4+'px',color:'#fff4d8',background:'#21182dee',font:'12px monospace',padding:'3px',zIndex:'99999'});label.textContent=`${name} · ${age}ms`;
    const e=s.actors.get(setup.id),feet=e.craftLight?.audit.feet;
    return{age,dust:structuredClone(s.bodyFx.audit.dust),shadow:{native:e.shadow.visible,craft:e.craftLight?.ground.visible??false,feet},point:{...s.groundContacts.get(setup.id)}};
   },{setup,age,name});samples.push(sample);await page.screenshot({path:resolve(dir,`frame-${i}.png`),clip:setup.clip});
  }
  const sheet=resolve(out,name+'.jpg');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','6','-i',resolve(dir,'frame-%d.png'),'-vf','scale=440:-1,tile=4x3','-frames:v','1','-q:v','4',sheet]);
  const shadowCount=samples.every(s=>Number(s.shadow.native)+Number(s.shadow.craft)===1),expected=mode==='damage';
  const dustPass=samples.every(s=>s.dust.length===(expected&&s.age>=0&&s.age<360?1:0));
  report.rows.push({asset,mode,setup,sheet,samples,shadowCount,dustPass});console.log(name+' '+JSON.stringify({shadowCount,dustPass}));
 }
 report.pass=report.errors.length===0&&report.rows.every(r=>r.shadowCount&&r.dustPass);
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));}
if(!report.pass)process.exitCode=1;console.log(JSON.stringify({pass:report.pass,rows:report.rows.length,errors:report.errors}));
