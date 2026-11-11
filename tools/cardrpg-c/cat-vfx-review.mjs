/** Real cat rules -> DepthModel -> Spine sockets, with separate damage/support recipients. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const live=process.argv.includes('--live'),outcomes=process.argv.includes('--outcomes'),tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??(live?'c11-cat-live':outcomes?'c11-outcome-battle':'c11-cat-battle');
if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid output tag');
const out=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const slots=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/spine/slots.json'),'utf8'));
const ultimates=process.argv.includes('--ultimates');
const only=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');
if(only?.some(id=>!slots.units.some(u=>u.side==='party'&&u.skills.some(s=>s.id===id))))throw Error('Unknown cat skill');
const selected=only??(ultimates?['mochi-4','panko-4']:['mochi-1','clover-1','cinnamon-1','marigold-3','cinnamon-4','soot-4']);
const scenarios=outcomes?[{id:'marigold-3',variant:'resist'},{id:'inkcap-2',variant:'immune'},{id:'inkcap-4',variant:'both'},
 {id:'inkcap-4',variant:'boss'},{id:'cinnamon-1',variant:'resist'}]:[...slots.units.filter(u=>u.side==='party').flatMap(u=>u.skills.map(s=>({id:s.id,variant:'default'}))),
 {id:'clover-1',variant:'self'},{id:'marigold-3',variant:'resist'},{id:'cinnamon-4',variant:'team'},{id:'clover-1',variant:'reflect'}];
const report={method:outcomes?'Real resisted/immune A6/V5 outcomes from isolated seed71 fixtures; 3 enemies or a boss, both sizes/motion modes/x1-x3. Check canvas/DOM words, row reservations, HP/face separation and no false damage. No balance or performance sample.':'Legal A6/V5 cat choices on isolated seed71 fixtures (not progression or balance samples), 3 enemies, both sizes/motion modes/x1-x3. Includes weakest-self, resist, revive/team-heal and reflection.',cases:[],shots:[],errors:[],complete:false};
if(process.argv.includes('--resume')){const previous=JSON.parse(await readFile(resolve(out,'review.json'),'utf8'));report.cases=previous.cases;report.shots=previous.shots;}
const key=c=>[c.width,c.scenario.id,c.scenario.variant,c.reduced,c.speed].join(':');
const completed=new Set(report.cases.map(key));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview);
 for(const [width,height]of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const scenario of scenarios)for(const reduced of [false,true])for(const speed of [1,2,3]){
   if(only&&!only.includes(scenario.id))continue;
   if(ultimates&&(!scenario.id.endsWith('-4')||scenario.variant!=='default'))continue;
   if(completed.has(key({width,scenario,reduced,speed})))continue;
   if(process.argv.includes('--focus')&&!selected.includes(scenario.id))continue;
   if(live&&(!selected.includes(scenario.id)||speed!==1||scenario.variant!=='default'))continue;
   const setup=await page.evaluate(async({scenario,reduced,speed})=>{
    const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts'),G=await import('/src/game/cardrpg/depth/feel-lab.ts');
    const b=R.createBattle({...G.galleryFixture(scenario.id).battle.initial,enemies:scenario.variant==='boss'?['yarn-giant']:['button-guard','binding-thread','needle-moth']});
    const a=b.actors.find(a=>a.catalogId===scenario.id.split('-')[0]),patient=b.actors.find(x=>x.side===a.side&&x.id!==a.id),enemy=b.actors.find(x=>x.side==='enemy');
    a.skills=R.CAT_BY_ID[a.catalogId].skills.map(s=>s.id);a.charge=100;a.turns=3;a.shield=45;
    for(const x of b.actors.filter(x=>x.side===a.side))x.hp=Math.floor(x.maxHp*(x.id===a.id?.8:.4));
    patient.hp=scenario.id==='cinnamon-4'&&scenario.variant!=='team'?0:Math.floor(patient.maxHp*.15);
    if(scenario.variant==='self')a.hp=Math.floor(a.maxHp*.05);
    for(const x of b.actors.filter(x=>x.side==='enemy')){
     if(['resist','both','boss'].includes(scenario.variant))x.effectResist=100000;
     if(['immune','both','boss'].includes(scenario.variant))x.bonuses.controlImmuneUntil=b.round;
    }
    if(scenario.variant==='reflect')enemy.statuses.push({id:'riposte',stacks:1,remaining:2,source:enemy.id,appliedRound:1});
    b.queue=[a.id,...b.queue.filter(id=>id!==a.id)];b.v4.committed=true;
    const choice=R.legalChoices(b).find(c=>c.skillId===scenario.id);if(!choice)throw Error('No legal choice '+scenario.id);
    const m=window.__depthReview;m.galleryBattle=null;m.replay=null;m.tutorialBattle=b;m.plan=null;m.animationAt=0;m.watching=true;m.paused=false;m.screen='map';m.sceneStarted=true;m.sceneReady=true;m.sceneError='';m.state.settings.reducedMotion=reduced;m.state.settings.speed=speed;
    m.act(choice);if(!m.plan)throw Error('No plan '+scenario.id);m.impactApplied=true;m.paused=true;m.notify(false);
    const events=m.plan.events.filter(e=>e.actorId===a.id),side=id=>b.actors.find(x=>x.id===id)?.side;
    const recipients=(types,friendly)=>[...new Set(events.filter(e=>types.includes(e.type)).flatMap(e=>e.targetIds).filter(id=>(side(id)===a.side)===friendly))];
    const failed=b.log.slice(0,b.log.findIndex(e=>e.kind==='action')+1).filter(e=>e.kind==='resist'||e.kind==='immune');
    const expected=[...new Set(failed.map(e=>e.targetId+':'+(e.kind==='immune'?'Immune':'Resisted')))];
    return{expected,actor:a.id,patient:patient.id,enemy:enemy.id,damage:recipients(['damage'],false),hostile:recipients(['damage','status_apply','status_expire','fizzle'],false),friendly:recipients(['heal','shield','status_apply','status_expire'],true),heal:recipients(['heal'],true),shield:recipients(['shield'],true),anyDamage:m.plan.events.some(e=>e.type==='damage'),events:m.plan.events.map(e=>({type:e.type,actor:e.actorId,targets:e.targetIds,amount:e.amount})),before:JSON.stringify(b)};
   },{scenario,reduced,speed});
   await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&s.audit().stage.source==='painted'&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});
   if(live){
    await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;window.catLive=null;const original=s.onCue.bind(s);s.onCue=(actor,cue)=>{original(actor,cue);if(cue.name==='hit'&&actor===m.plan.actorId){window.catLive={hold:Math.max(0,s.hitstopUntil-performance.now()),fixed:s.currentView.fixedTime!==undefined};m.paused=true;s.onCue=original;}};m.animationAt=0;m.paused=false;m.notify(false);});
    await page.waitForFunction(()=>window.catLive);const result=await page.evaluate(()=>window.catLive);
    if(result.fixed||(!setup.anyDamage||reduced)&&result.hold!==0||setup.anyDamage&&!reduced&&(result.hold<40||result.hold>80))throw Error('Live contact '+JSON.stringify({scenario,reduced,result}));
    report.cases.push({width,height,scenario,reduced,speed,damage:setup.anyDamage,live:result});continue;
   }
   const contact=await page.evaluate(async({setup,scenario,speed})=>{
    const m=window.__depthReview,s=window.__depthScene,fx=s.effects,P=await import('/src/game/cardrpg/spine/vfx-registry.ts');
    if(!window.catBaseView){window.catBaseView=s.view.bind(s);s.view=()=>({...window.catBaseView(),fixedTime:window.catTime});}
    window.catTime=3;fx.clear();s.eventAudit.length=0;s.prepare(s.view());
    const recipe=P.paintedRecipe(scenario.id,m.plan),expected=recipe.layers.some(l=>l.phase==='contact'&&l.anchor!=='caster'&&!l.recipients)?(recipe.friendly?setup.friendly:setup.hostile):[];
    let draws=0,peak=0,impacts=0,shake=0,last=0;const hit=m.plan.beats[2].start,step=1000/60*speed;
    for(let at=0;at<=hit+220;at+=step){m.animationAt=at;window.catTime=3+at/1000;s.render(s.view(),0);last=at;draws=Math.max(draws,s.stats.calls+fx.stats.draws);peak=Math.max(peak,fx.stats.active);impacts=Math.max(impacts,fx.stats.impacts);
     // Ultimate framing can pan without damage. Only the residual is shake.
     const pan=s.cinematic.focus>0&&!s.view().reducedMotion?s.framing.x:0;
     shake=Math.max(shake,Math.abs(s.camera.position.x-pan));
    }
    const particles=fx.pool.filter(p=>p.active&&p.born<=window.catTime&&p.recipe?.id===scenario.id&&p.impact);
    const primary=[...new Set(particles.filter(p=>p.layer.anchor!=='caster'&&!p.layer.recipients).map(p=>p.target))];
    const healing=[...new Set(particles.filter(p=>p.layer.recipients==='heal').map(p=>p.target))],shields=[...new Set(particles.filter(p=>p.layer.recipients==='shield').map(p=>p.target))];
    const c=fx.canvas.getContext('2d');let opaque=0;
    const check=(x,y,w,h)=>{const data=c.getImageData(x,y,w,h).data;for(let i=3;i<data.length;i+=4)if(data[i])opaque++;};
    for(const a of s.view().actors){const h=s.socket(a.id,'head');if(h&&a.hp>0)check(Math.round(h.x)-2,Math.round(h.y)-2,4,4);}
    for(const b of s.labelAudit.cards)check(Math.round(b.x+1),Math.round(b.y+1),Math.max(1,Math.floor(b.width-2)),Math.max(1,Math.floor(b.height-2)));
    const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
    const numberRows=s.numbers.drawn,lanes=s.anchors.filter(a=>a.textLane).map(a=>({id:a.id,...a.textLane}));
    const hp=s.anchors.filter(a=>a.visible).map(a=>({x:a.labelX-69,y:a.labelY,width:138,height:52}));
    const collisions=numberRows.flatMap(n=>[...s.labelAudit.heads,...hp].filter(b=>intersects(n,b)));
    const escaped=numberRows.filter(n=>{const lane=lanes.find(a=>a.id===n.id);return !lane||n.x<lane.x-2||n.y<lane.y-2||n.x+n.width>lane.x+lane.width+2||n.y+n.height>lane.y+lane.height+2;});
    m.notify(false);
    return{expected,primary,healing,shields,draws,peak,impacts,shake,opaque,overlaps:s.labelAudit.overlaps,active:fx.stats.active,zoom:s.camera.zoom,offsets:s.audit().stage.offsets,last,step,collisions:collisions.length,escaped:escaped.length,rows:s.view().cardNumberRows,lanes,numbers:numberRows.map(n=>({id:n.id,text:n.text})),hurt:[...s.actors].filter(([,a])=>a.hurtAt>=3).map(([id])=>id)};
   },{setup,scenario,speed});
   const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
   if(!same(contact.primary,contact.expected)||contact.opaque||contact.overlaps||contact.draws>150||!contact.active||(!setup.damage.length&&contact.impacts)||(setup.damage.length&&!contact.impacts))throw Error('Cat contact '+JSON.stringify({scenario,width,reduced,speed,setup:{...setup,before:undefined},contact}));
   if(setup.hostile.length&&(!same(contact.healing,setup.heal)||!same(contact.shields,setup.shield)))throw Error('Cat support '+JSON.stringify({scenario,setup:{...setup,before:undefined},contact}));
   if((!setup.anyDamage||reduced)&&contact.shake||reduced&&(contact.zoom!==1||contact.offsets.some(v=>v!==0)))throw Error('Motion '+JSON.stringify({scenario,contact}));
   if(scenario.id==='marigold-3'&&(contact.hurt.length||contact.numbers.some(n=>n.text.startsWith('−'))))throw Error('Debuff presented as damage');
   if(outcomes){
    const words=contact.numbers.filter(n=>['Resisted','Immune','No effect'].includes(n.text)).map(n=>n.id+':'+n.text);
    // Resistance is capped: Cinnamon's Burn can still land. Compare the exact
    // raw outcome, retaining that successful-status control in the sweep.
    if(scenario.id!=='cinnamon-1'&&!setup.expected.length||!same(words,setup.expected)||contact.collisions||contact.escaped||contact.numbers.some(n=>n.text==='−0'))throw Error('Outcome words '+JSON.stringify({scenario,setup:{...setup,before:undefined},contact}));
    await page.waitForFunction(count=>document.querySelectorAll('.dp-float-number .dp-number-fizzle').length===count,setup.expected.length);
    const dom=await page.locator('.dp-float-number .dp-number-fizzle').allTextContents();
    if(!same(dom,setup.expected.map(value=>value.split(':').at(-1))))throw Error('Accessible result words '+JSON.stringify({dom,expected:setup.expected}));
   }
   if(speed===1&&(selected.includes(scenario.id)||scenario.variant!=='default')&&(!reduced||scenario.id==='clover-1'&&scenario.variant==='default')){
    const file=`${scenario.id}-${scenario.variant}-${reduced?'calm':'motion'}-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});
   }
   const tail=await page.evaluate(({contact,setup})=>{const m=window.__depthReview,s=window.__depthScene;for(let at=contact.last+contact.step;at<=m.plan.duration+2400;at+=contact.step){m.animationAt=at;window.catTime=3+at/1000;s.render(s.view(),0);}return{dropped:s.effects.stats.dropped,late:s.effects.stats.active,hits:s.eventAudit.filter(e=>e.name==='hit').length,unchanged:setup.before===JSON.stringify(m.battle)};},{contact,setup});
   if(tail.dropped||tail.late||tail.hits!==1||!tail.unchanged)throw Error('Cat cleanup '+JSON.stringify({scenario,tail}));
   report.cases.push({width,height,scenario,reduced,speed,setup:{...setup,before:undefined},contact,tail});
  }
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,draws:Math.max(...report.cases.map(c=>c.contact?.draws??0)),peak:Math.max(...report.cases.map(c=>c.contact?.peak??0)),errors:report.errors}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
