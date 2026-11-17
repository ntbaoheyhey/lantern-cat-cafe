/** Fresh renderer evidence: isolated damage/death fixtures plus real Yarn actions. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(process.env.CXV_REACTION_OUT??'work/v5/CXV/films/V3');
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 method:'Current renderer, exact timestamps. Reactions use isolated 32-damage event then KO; Yarn actions use pilotFixture rules events. No live save writes.',sheets:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const consoleErrors=[];
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:process.env.CXV_URL??'http://127.0.0.1:6310',fixedClock:false,
  setupPage:page=>page.on('console',m=>{if(m.type()==='error'&&!m.location().url.startsWith('https://fonts.'))consoleErrors.push(m.text());})});
 report.url=page.url();report.blockedRequests=blockedRequests;
 async function fixture(asset,reaction=false,ultimate=false){
  await page.evaluate(async({root,asset,reaction,ultimate})=>{
   const {pilotFixture}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/vfx-layered/fixture.ts');
   const {configureSequence}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/sequence.ts');
   const {createCardActionPlan}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/depth/card-action-plan.ts');
   const fixture=pilotFixture('enemy:'+asset+(ultimate?'':':basic')),m=window.__depthReview;
   const enemy=fixture.battle.actors.find(a=>a.catalogId===asset),hero=fixture.battle.actors.find(a=>a.catalogId==='mochi');
   if(reaction){
    const start={version:3,seq:0,turn:1,round:1,actionId:1,beat:0,type:'action_start',actorId:hero.id,skillId:'mochi-1',targetIds:[enemy.id],amount:0};
    fixture.plan=createCardActionPlan([start,{...start,seq:1,beat:2,type:'damage',amount:32}],'mochi-1');
   }
   m.galleryBattle=fixture.battle;m.plan=configureSequence(fixture.plan);m.galleryId='enemy:'+asset;
   m.animationAt=0;m.paused=true;m.sceneStarted=true;m.labOpen=false;m.state.settings.reducedMotion=false;m.notify(false);
   const s=window.__depthScene;cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },{root,asset,reaction,ultimate});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  return page.evaluate(asset=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
   s.render({...s.view(),fixedTime:20,paused:true},0);
   const [id,entry]=[...s.actors].find(([,e])=>e.asset===asset),a=s.anchors.find(a=>a.id===id),b=a.body;
   const x=Math.max(0,Math.floor(b.x-110)),y=Math.max(0,Math.floor(b.y-50));
   return{id,impact:m.plan.beats[2].start,duration:m.plan.duration,craft:!!entry.craftPose,
    clip:{x,y,width:Math.min(1280-x,Math.ceil(b.width+220)),height:Math.min(720-y,Math.ceil(b.height+150))}};
  },asset);
 }
 async function sheet(id,samples,clip){
  const dir=resolve(out,id);await mkdir(dir,{recursive:true});const audits=[];
  for(let index=0;index<samples.length;index++){
   const sample=samples[index];
   const audit=await page.evaluate(({sample,id,clip})=>{
    const s=window.__depthScene,m=window.__depthReview,entry=sample.actorId?s.actors.get(sample.actorId):null;
    const view=s.view(),death=sample.phase==='death';m.animationAt=sample.ms;
    const next={...s.view(),fixedTime:20+sample.ms/1000,paused:true};
    if(death){next.frame=null;next.actors=view.actors.map(a=>a.id===sample.actorId?{...a,hp:0}:a);entry.koAt=20;next.fixedTime=20+sample.ms/1000;}
    else if(entry){entry.koAt=-1;entry.hurtAt=20+(m.plan.beats[2].start/1000);}
    s.render(next,0);
    let label=document.querySelector('[data-cxv-reaction]');
    if(!label){label=document.createElement('div');label.dataset.cxvReaction='true';document.body.append(label);}
    Object.assign(label.style,{position:'fixed',left:(clip?.x??0)+5+'px',top:(clip?.y??0)+5+'px',color:'#fff4d8',background:'#21182dee',padding:'4px',font:'14px monospace',zIndex:'999999'});
    label.textContent=id+' '+sample.phase+' '+sample.ms+'ms';
    const caster=s.actors.get(m.plan.actorId),targetId=m.plan.events.find(e=>e.type==='damage'&&e.amount>0)?.targetIds[0]??m.plan.targetIds[0];
    const target=s.actors.get(targetId),deathFx=entry?.craftDeath;
    const material=deathFx?.fragments.children[0]?.material;
    return {camera:s.audit().camera,root:entry?.actor.root.position.toArray(),visible:entry?.actor.root.visible,
     deathSource:!!material?.uniforms.uPaint.value,fragments:deathFx?.fragments.visible,amount:deathFx?.amount.value,
     hasCraftLight:!!entry?.craftLight,sourceTarget:deathFx?.sourceTarget?[deathFx.sourceTarget.width,deathFx.sourceTarget.height]:null,
     caster:caster?{bounds:s.bounds(caster),mainHand:s.socket(m.plan.actorId,'mainHand'),pose:{name:s.sampled.get(m.plan.actorId)?.name,at:s.sampled.get(m.plan.actorId)?.at},root:caster.actor.root.position.toArray()}:null,
     target:target?{id:targetId,bounds:s.bounds(target)}:null,yarn:s.craftYarn?structuredClone(s.craftYarn.audit):null};
   },{sample,id,clip});
   await page.screenshot({path:resolve(dir,`frame-${String(index).padStart(2,'0')}.png`),...(clip?{clip}:{})});
   audits.push({...sample,...audit});
  }
  const path=resolve(out,id+'.jpg');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','6','-i',resolve(dir,'frame-%02d.png'),'-vf','scale=480:-1,tile=4x3','-frames:v','1','-q:v','4',path]);
  report.sheets.push({id,path,samples:audits});await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));
  process.stdout.write(id+': '+path+'\n');return audits;
 }
 for(const asset of (process.env.CXV_REACTION_ASSETS??'button-guard,needle-moth,kettle-knight,yarn-giant').split(',').filter(Boolean)){
  const f=await fixture(asset,true);
  const samples=[-1,0,33,60,120,300].map(t=>({phase:'hit',ms:f.impact+t,actorId:f.id}));
  samples.push(...[0,100,200,350,500,600].map(ms=>({phase:'death',ms,actorId:f.id})));
  const audits=await sheet(asset+'-reaction',samples,f.clip);
  if(!f.craft&&!audits.some(a=>a.phase==='death'&&a.deathSource&&a.fragments&&!a.hasCraftLight))throw Error('Native source missing: '+asset);
 }
 for(const ultimate of [false,true]){
  const f=await fixture('yarn-giant',false,ultimate);
  const times=ultimate?[0,600,850,1000,1099,1100,1133,1160,1280,1450,1650,2199]:[0,150,249,349,350,383,410,470,550,650,750,799];
  await sheet('yarn-'+(ultimate?'ultimate':'basic'),times.map(ms=>({phase:'action',ms})));
 }
 report.errors=errors;report.consoleErrors=consoleErrors;if(errors.length||consoleErrors.length)throw Error([...errors,...consoleErrors].join('\n'));
 report.pass=true;
}catch(error){report.pass=false;report.error=String(error);process.exitCode=1;}
finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));}
