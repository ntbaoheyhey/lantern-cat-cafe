/** Actual enemy rules -> action plan -> Spine paint. Isolated fixtures, never acceptance seeds. */
import{createRequire}from'node:module';import{resolve}from'node:path';import{mkdir,writeFile}from'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-utility-battle';if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid tag');
const live=process.argv.includes('--live');
const output=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(output,{recursive:true});
const scenarios=[
 {id:'spool-ram',name:'charge',turns:2,signature:false,prepare:true},
 {id:'spool-ram',name:'charge-rage',turns:2,signature:false,prepare:true,rage:true},
 {id:'spool-ram',name:'charged-row',turns:2,signature:true,charged:true},
 {id:'spool-ram',name:'daze-cancel',turns:2,signature:false,charged:true,dazed:true},
 {id:'button-guard',name:'row-shield',turns:2,signature:true},
 {id:'teacup-healer',name:'ally-heal',turns:2,signature:true},
 {id:'spool-ram',name:'charge-override',turns:2,signature:false,prepare:true,override:true},
 {id:'spool-ram',name:'charge-rage-override',turns:2,signature:false,prepare:true,rage:true,override:true},
];
const report={method:'Charge, charged row, Daze cancellation, ally utility and override exclusion using actual A6/V5 enemy actions on isolated seed71 presentation fixtures. No progression, balance cohort or frame-timing claim.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview);
 for(const[width,height]of[[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const scenario of scenarios)for(const reduced of[false,true])for(const speed of[1,2,3]){
   if(live&&(scenario.override||scenario.rage||scenario.dazed||speed!==1))continue;
   const setup=await page.evaluate(async({scenario,reduced,speed})=>{
    const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
    const b=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,cats:R.battleCats(R.setGameplayA6(R.setSkillsV5(R.setGameplayV4(R.createDepthAccount(71),true),true),true)),enemies:[scenario.id,'binding-thread']});
    const a=b.actors.find(a=>a.catalogId===scenario.id),intent=b.intents.find(i=>i.actorId===a.id);a.turns=scenario.turns;a.charge=scenario.rage?100:0;a.bonuses.v5Charge=Number(!!scenario.charged);b.actors.find(a=>a.catalogId==='soot').row='front';
    if(scenario.dazed)a.statuses.push({id:'drowsy',stacks:1,remaining:2,source:'mochi',appliedRound:1});
    if(scenario.id==='teacup-healer')b.actors.find(a=>a.catalogId==='binding-thread').hp=1;
    intent.signature=scenario.signature;intent.interrupted=false;intent.power=175;b.queue=[a.id,...b.queue.filter(id=>id!==a.id)];b.v4.committed=true;
    m.galleryBattle=null;m.replay=null;m.tutorialBattle=b;m.plan=null;m.animationAt=0;m.watching=true;m.paused=false;m.screen='map';m.sceneStarted=true;m.sceneReady=true;m.sceneError='';m.state.settings.reducedMotion=reduced;m.state.settings.speed=speed;
    // The rules have resolved already; pin their impact snapshot for the contact review.
    m.act();m.impactApplied=true;m.paused=true;m.notify(false);
    const targets=[...new Set(m.plan.events.filter(e=>e.type==='damage'&&e.actorId===a.id).flatMap(e=>e.targetIds))];
    const support=[...new Set(m.plan.events.filter(e=>['heal','shield'].includes(e.type)&&e.actorId===a.id).flatMap(e=>e.targetIds))];
    return{actorId:a.id,targets,support,presentationId:m.plan.presentationId,name:m.plan.name,charge:a.bonuses.v5Charge,events:m.plan.events.map(e=>({type:e.type,actorId:e.actorId,targets:e.targetIds,amount:e.amount})),before:JSON.stringify(b)};
   },{scenario,reduced,speed});
   await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&s.audit().stage.source==='painted'&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});
   if(live){
    await page.evaluate(()=>{
     const m=window.__depthReview,s=window.__depthScene;window.utilityLive=null;
     const original=s.onCue.bind(s);
     s.onCue=(actorId,cue)=>{original(actorId,cue);if(cue.name==='hit'&&actorId===m.plan.actorId){window.utilityLive={damage:m.plan.events.some(e=>e.type==='damage'),holdMs:Math.max(0,s.hitstopUntil-performance.now()),firstHit:s.firstHit,hitAt:s.hitAt,now:s.renderTime,fixed:s.currentView.fixedTime!==undefined};m.paused=true;s.onCue=original;}};
     m.animationAt=0;m.paused=false;m.notify(false);
    });
    await page.waitForFunction(()=>window.utilityLive);
    const result=await page.evaluate(()=>window.utilityLive);
    if(result.fixed||!result.firstHit||result.damage&&!reduced&&result.holdMs<=0||(!result.damage||reduced)&&result.holdMs!==0||!result.damage&&result.hitAt>=0)throw Error('Live hitstop '+JSON.stringify({scenario,reduced,result}));
    report.cases.push({width,height,scenario:scenario.name,reduced,speed,live:result});continue;
   }
   const contact=await page.evaluate(({setup,speed,scenario})=>{
    const m=window.__depthReview,s=window.__depthScene,fx=s.effects;if(!window.enemyBaseView){window.enemyBaseView=s.view.bind(s);s.view=()=>({...window.enemyBaseView(),fixedTime:window.enemyCueTime});}
    window.enemyCueTime=3;fx.clear();s.eventAudit.length=0;s.prepare(s.view());for(const id of ['enemy:spool-ram','enemy:spool-ram:basic'])fx.overrides.effects.delete(id);
    if(scenario.override)fx.overrides.effects.set(setup.presentationId,{spec:{format:'sequence',cue:'hit'},duration:1,images:[],players:[]});
    let draws=0,peak=0,impacts=0,last=0,shake=0;const hit=m.plan.beats[2].start,step=1000/60*speed;
    for(let at=0;at<=hit+150;at+=step){m.animationAt=at;window.enemyCueTime=3+at/1000;s.render(s.view(),0);last=at;draws=Math.max(draws,s.stats.calls+fx.stats.draws);peak=Math.max(peak,fx.stats.active);impacts=Math.max(impacts,fx.stats.impacts);shake=Math.max(shake,Math.abs(s.camera.position.x));}
    const hostile=setup.targets.length>0,particles=fx.pool.filter(p=>p.active&&p.born<=window.enemyCueTime&&p.recipe?.id===setup.presentationId&&p.impact&&p.layer.anchor!=='caster');
    const recipients=[...new Set(particles.map(p=>p.target))],unexpected=recipients.filter(id=>!setup.targets.includes(id));
    const c=fx.canvas.getContext('2d');let opaque=0,points=0;
    const check=(x,y,w,h)=>{const data=c.getImageData(x,y,w,h).data;for(let i=3;i<data.length;i+=4){points++;if(data[i])opaque++;}};
    for(const a of s.view().actors){const h=s.socket(a.id,'head');if(h)check(Math.round(h.x)-2,Math.round(h.y)-2,4,4);}
    for(const b of s.labelAudit.cards)check(Math.round(b.x+1),Math.round(b.y+1),Math.max(1,Math.floor(b.width-2)),Math.max(1,Math.floor(b.height-2)));
    const own=fx.pool.filter(p=>p.active&&p.born<=window.enemyCueTime&&p.recipe?.id===setup.presentationId&&p.impact).map(p=>({target:p.target,glyph:p.layer.glyph,anchor:p.layer.anchor}));
    return{hostile,recipients,unexpected,draws,peak,impacts,shake,own,clip:s.sampled.get(setup.actorId)?.name,hurt:[...s.actors].filter(([,a])=>a.hurtAt>=3).map(([id])=>id),numbers:s.numbers.drawn.map(n=>({id:n.id,text:n.text})),active:fx.stats.active,opaque,points,overlaps:s.labelAudit.overlaps,zoom:s.camera.zoom,stage:s.audit().stage,last,step};
   },{setup,speed,scenario});
   if(!contact.active||contact.opaque||contact.overlaps||contact.draws>150||contact.hostile&&(!contact.recipients.length||contact.unexpected.length||!contact.impacts)||!contact.hostile&&contact.impacts||reduced&&(contact.zoom!==1||contact.stage.offsets.some(x=>x!==0)))throw Error('Enemy contact '+JSON.stringify({scenario,width,speed,reduced,setup,contact}));
   if(scenario.prepare&&(setup.targets.length||setup.name!=='Charging a row strike'||setup.charge!==1||contact.clip!=='skill'||!contact.own.length||contact.own.some(p=>p.target!==setup.actorId)||contact.numbers.length||contact.hurt.length))throw Error('Preparation semantics '+JSON.stringify({scenario,setup,contact}));
   if(!contact.hostile&&contact.shake||contact.hostile&&!reduced&&contact.shake===0||reduced&&contact.shake)throw Error('Damage-only shake '+JSON.stringify({scenario,contact}));
   if(scenario.name==='charged-row'&&setup.targets.length!==2)throw Error('Missing row recipient');
   if(speed===1&&!scenario.override&&(!reduced||scenario.name==='charge')){const name=scenario.name+' '+(reduced?'calm':'motion'),file=name.replaceAll(' ','-')+'-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(output,file));report.shots.push({name,file,width,height});}
   const tail=await page.evaluate(({contact,setup})=>{const m=window.__depthReview,s=window.__depthScene,fx=s.effects;for(let at=contact.last+contact.step;at<=m.plan.duration+2400;at+=contact.step){m.animationAt=at;window.enemyCueTime=3+at/1000;s.render(s.view(),0);}return{dropped:fx.stats.dropped,late:fx.stats.active,hits:s.eventAudit.filter(e=>e.name==='hit').length,casts:s.eventAudit.filter(e=>e.name==='cast').length,unchanged:setup.before===JSON.stringify(m.battle)};},{contact,setup});
   report.cases.push({width,height,scenario:scenario.name,reduced,speed,setup:{...setup,before:undefined},contact,tail});
   if(tail.dropped||tail.late||tail.hits!==1||scenario.prepare&&tail.casts!==1||!tail.unchanged)throw Error('Enemy cleanup '+JSON.stringify(tail));
  }
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,maxDraws:Math.max(...report.cases.map(c=>c.contact?.draws??0)),peak:Math.max(...report.cases.map(c=>c.contact?.peak??0)),errors:report.errors}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
