/** Native-cat ultimate field attribution; frozen diagnostic, not production acceptance. */
import assert from 'node:assert/strict';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const prototype=process.env.CXV_FIELD_PROTOTYPE==='1';
const bodyPrototype=process.env.CXV_BODY_PROTOTYPE==='1';
const out=resolve(process.env.CXV_CAPTURE_OUT||'work/v5/CXV/films/M-native-ultimate-occlusion-R1');
assert(!existsSync(out),'Never overwrite prior evidence');
await mkdir(out,{recursive:true});
const allowed=['mallow','sorrel','biscuit','cinnamon','brioche'];
const owners=process.env.CXV_NATIVE_OWNERS?.split(',')||allowed;
const reviewOwners=process.env.CXV_REVIEW_OWNERS?.split(',')||['mallow','cinnamon'];
assert(owners.every(x=>allowed.includes(x))&&reviewOwners.every(x=>owners.includes(x)));
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),
 runnerSha256:hash(await readFile(new URL(import.meta.url))),scope:'6310 fixed-clock attribution, 1280x720; no production acceptance. Rectangular body coverage is a diagnostic bound, not an exact silhouette mask.',
 runtimeExperiment:'Temporarily suppress only this browser instance FieldVfx.render for attribution; restore immediately. No application files changed.',prototype,bodyPrototype,sourceSubstitutions:[],rows:[],captures:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false,setupPage:prototype?async page=>{
  await page.route('**/src/game/cardrpg/battle-v3/field-vfx.ts*',async route=>{
   const response=await route.fetch(),before=await response.text();
   const tail='const tail = tier === "basic" ? 620 : Math.max(620, Math.min(tier === "ultimate" ? 1450 : 1e3, plan.duration - contact));';
   const radius=': 1.65);';
   assert.equal(before.split(tail).length,2);assert.equal(before.split(radius).length,2);
   const after=before.replace(tail,'const livingUltimate = tier === "ultimate" && ["mallow","sorrel","biscuit","inkcap","cinnamon","brioche","velvet","marigold"].includes(owner);\n'+tail.replace('const tail =','const tail = livingUltimate ? 660 :')).replace(radius,': 1.65) * (livingUltimate ? .62 : 1);');
   const stem='field-response-'+report.sourceSubstitutions.length;
   await writeFile(resolve(out,stem+'-before.mjs'),before);await writeFile(resolve(out,stem+'-after.mjs'),after);
   report.sourceSubstitutions.push({url:route.request().url(),beforeSha256:hash(before),afterSha256:hash(after),before:resolve(out,stem+'-before.mjs'),after:resolve(out,stem+'-after.mjs')});
   await route.fulfill({response,body:after});
  });
 }:undefined});report.url=page.url();
 if(bodyPrototype)await page.evaluate(()=>{
  const painter=window.__depthScene.effects,original=painter.protect;
  const skills=new Set(['mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'].map(x=>x+'-4'));
  painter.protect=function(c,view,labels,narrow=false){
   const count=original.call(this,c,view,labels,narrow),plan=view.frame?.plan;
   if(!narrow&&plan?.ultimate&&skills.has(plan.presentationId??plan.skillId)){
    c.save();c.globalCompositeOperation='destination-out';c.globalAlpha=1;
    for(const actor of view.actors){
     if(actor.hp<=0)continue;const face=this.socket(actor.id,'head'),feet=this.socket(actor.id,'feet');if(!face||!feet)continue;
     const size=Math.abs(feet.y-face.y)/.77;
     c.drawImage(this.legacyMask,face.x-size*.45,face.y-size*.1,size*.9,size*1.2);
    }
    c.restore();
   }
   return count;
  };
 });
 for(const owner of owners)for(const reduced of [false,true]){
  for(const stop of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+stop),'STOP '+stop);
  await page.evaluate(async({owner,reduced})=>{
   const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
   const {snapshotBattle,splitPresentation}=await import('/src/game/cardrpg/depth/battle-presentation.ts');
   const {createCardActionPlan}=await import('/src/game/cardrpg/depth/card-action-plan.ts');
   const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const m=window.__depthReview,s=window.__depthScene,id=owner+'-4';
   const roster=[owner,...['panko','mallow','sorrel','biscuit'].filter(x=>x!==owner)].slice(0,4);
   const a=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=a.account.cards[0];
   a.account.cards=roster.map(cardId=>({...template,id:cardId,cardId,level:6}));a.team=roster;a.rows=Object.fromEntries(roster.map((x,i)=>[x,i<2?'front':'rear']));a.skills=Object.fromEntries(roster.map(x=>[x,R.CAT_BY_ID[x].skills.map(z=>z.id)]));
   Object.assign(a.settings,{speed:1,quality:'high',reducedMotion:reduced});a.tutorial=4;
   const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(a),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
   const caster=battle.actors.find(x=>x.catalogId===owner);for(const x of battle.actors)x.hp=Math.round(x.maxHp*(x.side==='party'?.55:.8));
   if(owner==='cinnamon')battle.actors.find(x=>x.side==='party'&&x.id!==caster.id).hp=0;
   caster.charge=100;caster.turns=3;caster.shield=45;battle.queue=[caster.id,...battle.queue.filter(x=>x!==caster.id)];battle.v4.committed=true;
   const before=snapshotBattle(battle),choice=R.legalChoices(battle).find(x=>x.skillId===id);
   if(!choice||!R.act(battle,choice))throw Error('No legal native ultimate '+id);
   const resolved=splitPresentation(before,battle,id),targetIds=[...new Set(resolved.events.flatMap(e=>e.targetIds))];
   const start={version:3,seq:0,turn:1,round:1,actionId:1,beat:0,type:'action_start',actorId:caster.id,skillId:id,targetIds,amount:0};
   m.state=a;Object.assign(m,{galleryBattle:resolved.impact,plan:configureSequence(createCardActionPlan([start,...resolved.events],id)),galleryId:id,animationAt:0,paused:true,labOpen:false,sceneStarted:true});
   m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },{owner,reduced});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  for(const ms of [1100,1280,1550,1760,2199]){
   const row=await page.evaluate(({owner,reduced,ms})=>{
    const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;cancelAnimationFrame(s.raf);
    const render=()=>s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);
    render();const field=s.effects.field,original=field.render,audit=structuredClone(field.audit),size=s.sizeAudit(),view=s.view();
    const metrics=()=>{
     const c=s.effects.canvas,ctx=c.getContext('2d'),p=ctx.getImageData(0,0,c.width,c.height).data,sx=c.width/size.width,sy=c.height/size.height;
     const coverage=box=>{let samples=0,alphaSum=0,overHalf=0;for(let y=Math.max(0,Math.floor(box.y*sy));y<Math.min(c.height,Math.ceil((box.y+box.height)*sy));y++)for(let x=Math.max(0,Math.floor(box.x*sx));x<Math.min(c.width,Math.ceil((box.x+box.width)*sx));x++){const alpha=p[(y*c.width+x)*4+3]/255;samples++;alphaSum+=alpha;if(alpha>.5)overHalf++;}return{samples,meanAlpha:samples?alphaSum/samples:0,overHalf,overHalfRatio:samples?overHalf/samples:0};};
     return{canvas:[c.width,c.height],paint:coverage({x:0,y:0,width:size.width,height:size.height}),units:size.units.map(u=>({id:u.id,coreBox:u.coreBox,faceBox:u.faceBox,body:coverage(u.coreBox),face:coverage(u.faceBox)}))};
    };
    const full=metrics();let noField;
    try{field.render=function(){this.draws=0;};render();noField=metrics();}finally{field.render=original;render();}
    return{owner,reduced,ms,skill:m.plan.skillId,targets:m.plan.targetIds,events:m.plan.events,actorIds:view.actors.map(x=>x.catalogId),audit,full,noField,stats:structuredClone(s.effects.stats),url:location.href};
   },{owner,reduced,ms});
   assert(!row.actorIds.includes('soot'));report.rows.push(row);
   if(ms===1280&&reviewOwners.includes(owner)){
    const name=owner+'-'+(reduced?'reduced':'normal'),path=resolve(out,name+'.png');await page.screenshot({path});
    const preview=resolve(out,name+'-1024.jpg');execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-q:v','2',preview]);
    report.captures.push({owner,reduced,ms,path,sha256:hash(await readFile(path)),preview,previewSha256:hash(await readFile(preview)),utc:new Date().toISOString(),reviewed:false,views:0});
   }
  }
 }
 report.errors=errors;report.blockedRequests=blockedRequests;report.completedUTC=new Date().toISOString();
 assert.equal(errors.length,0);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({out,rows:report.rows.length,captures:report.captures.length,errors:errors.length}));
}finally{await browser.close();}
