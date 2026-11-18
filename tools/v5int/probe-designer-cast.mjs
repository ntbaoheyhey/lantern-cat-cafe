/** Real production media action routing, clock, mesh and foot evidence. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from '/Users/bao/taskbar-hero-chain/tools/v5int/production-fixture.mjs';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';
const root=resolve(import.meta.dirname,'../..'),hash=x=>createHash('sha256').update(x).digest('hex');
const cat=process.env.CXI_MEDIA_CAT??'mochi';assert(['mochi','clover'].includes(cat));
const buildPath=process.env.CXI_MEDIA_BUILD;assert(buildPath,'Explicit current candidate build.json required');
const build=JSON.parse(await readFile(buildPath)),out=resolve(process.env.CXI_CAPTURE_OUT??'');
assert(out.startsWith(resolve(root,'work/v5/CXI')+'/')&&!existsSync(out),'Fresh owned output required');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),cat,url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,registryOverride:build.registryOverride,buildPath,buildSha256:hash(await readFile(buildPath)),harnessSha256:hash(await readFile(import.meta.filename)),runtimeSourceSubstitutions:[],rows:[],actions:[],captures:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);};
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');let browser;
function fixture(reduced,skill){
 const roster=[cat,'panko','mallow','sorrel'],state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=roster.map(cardId=>({...template,id:cardId,cardId,level:6}));state.team=roster;state.tutorial=4;
 state.rows=Object.fromEntries(roster.map((x,i)=>[x,i<2?'front':'rear']));state.skills=Object.fromEntries(roster.map(x=>[x,R.CAT_BY_ID[x].skills.map(z=>z.id)]));Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:reduced});
 const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 for(const actor of battle.actors)actor.hp=Math.round(actor.maxHp*.65);
 const caster=battle.actors.find(x=>x.catalogId===cat);caster.charge=100;caster.turns=3;battle.queue=[caster.id,...battle.queue.filter(x=>x!==caster.id)];battle.v4.committed=true;
 const choice=R.legalChoices(battle).find(x=>x.skillId===cat+'-'+skill);assert(choice,'Requested legal card');const expected=structuredClone(battle);assert(R.act(expected,choice));return{state,battle,choice,expected};
}
try{
 stop();assert.equal(execFileSync('git',['diff',build.sourceCommit,'--','packages/game-rules/src'],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'}),'','Rules match candidate source');assert.equal(runtimeEvidence().indexSha256,build.indexSha256);assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),build.indexSha256);
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const errors=[],blockedRequests=[];
 // A6 exposes only the basic card and ultimate. Legacy -2/-3 cards belong
 // to the compiled gallery contract, not legal judge-facing actions.
 for(const reduced of [false,true])for(const skill of [1,4]){
  stop();const f=fixture(reduced,skill);
  const opened=await openFixture(browser,config.fixtures.find(f=>f.id==='boss')),page=opened.page;
  await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},f);
  await page.waitForFunction(cat=>{const s=window.__depthScene,m=window.__depthReview,a=[...s.actors.values()].find(e=>e.asset===cat)?.actor;return s.ready&&a?.source==='media'&&a.designerMedia.media.state.ready&&s.view().actors.every(a=>a.hp===m.visualBattle.actors.find(b=>b.id===a.id)?.hp);},cat,{timeout:90000});
  await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:30,paused:true},0);});
  const phaseOffset=await page.evaluate(cat=>[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state.desired,cat);
  const action=await page.evaluate(choice=>{const m=window.__depthReview;m.paused=false;if(!m.canAct)throw Error('Model cannot act');m.act(choice);m.paused=true;m.notify(false);return{log:m.battle.log,actors:m.battle.actors,plan:{skill:m.plan.skillId,duration:m.plan.duration,contact:m.plan.beats[2].start,ultimate:m.plan.ultimate,events:m.plan.events}};},f.choice);
  assert.deepEqual(action.log,f.expected.log);assert.deepEqual(action.actors,f.expected.actors);assert.equal(action.plan.contact,skill===4?1100:350);report.actions.push({reduced,skill,phaseOffset,...action});
  let previous=0;
  for(const ms of [...new Set([0,175,action.plan.contact,...(skill===4?[1600/3]:[]),600,action.plan.duration-.0001,action.plan.duration])].sort((a,b)=>a-b)){
   await page.evaluate(({previous,ms})=>{const m=window.__depthReview;let at=previous,now=100000+previous;m.tick(0,now);m.paused=false;while(at<ms-1e-8){const delta=Math.min(16,ms-at);now+=delta;at+=delta;m.tick(delta,now);}m.paused=true;m.notify(false);},{previous,ms});previous=ms;
   await page.waitForFunction(()=>{const m=window.__depthReview,s=window.__depthScene;return s.view().actors.every(a=>{const b=m.visualBattle.actors.find(x=>x.id===a.id);return b&&a.hp===b.hp&&a.shield===b.shield;});});
   const fixedTime=40+ms/1000-phaseOffset;
   await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);},fixedTime);
   await page.waitForFunction(cat=>{const media=[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state;return media.ready&&!media.seeking&&Math.abs(((media.currentTime-media.desired+15)%10)-5)<=1/60;},cat,{timeout:10000});
   const row=await page.evaluate(({cat,reduced,skill,ms,fixedTime})=>{
    const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);
    const [id,entry]=[...s.actors].find(([,e])=>e.asset===cat),a=entry.actor,media=a.designerMedia.media,positions=media.geometry.attributes.position,base=media.basePositions,index=media.geometry.index;
    let maxMeshDelta=0,minTriangleRatio=Infinity;for(let i=0;i<positions.array.length;i++)maxMeshDelta=Math.max(maxMeshDelta,Math.abs(positions.array[i]-base[i]));
    for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)],area=get=>{const[x,y,z]=ids.map(get);return(y[0]-x[0])*(z[1]-x[1])-(y[1]-x[1])*(z[0]-x[0]);},before=area(j=>[base[j*3],base[j*3+1]]),after=area(j=>[positions.getX(j),positions.getY(j)]);if(before)minTriangleRatio=Math.min(minTriangleRatio,after/before);}
    const worldFoot=a.root.position.clone().set(0,0,0);a.root.localToWorld(worldFoot);const projected=worldFoot.clone().project(s.camera);
    const focus={visible:s.casterFocus.root.visible,copies:s.casterFocus.root.children.length,cacheKeys:s.casterFocus.root.children.map(c=>c.material.customProgramCacheKey()),preservesSource:s.casterFocus.preserveSourceShader};
    return{cat,reduced,skill,ms,fixedTime,currentPlan:m.plan?.skillId??null,sampled:{name:s.sampled.get(id)?.name,at:s.sampled.get(id)?.at},focus,maxMeshDelta,minTriangleRatio,worldFoot:worldFoot.toArray(),screenFoot:[(projected.x+1)*s.width/2,(1-projected.y)*s.height/2],root:a.root.matrixWorld.toArray(),opaqueWorld:a.opaqueWorld,box:s.sizeAudit().units.find(u=>u.id===id),media:{...media.state},manifest:ms===0?media.manifest:undefined,source:a.source,bossPhaseAudit:{...s.bossPhase.audit},bossPhases:s.view().bossPhases,scenePlan:s.view().frame?.plan.skillId??null,url:location.href};
   },{cat,reduced,skill,ms,fixedTime});assert.equal(row.url,judgeUrl);assert.equal(row.source,'media');assert(row.minTriangleRatio>0);report.rows.push(row);
   if(skill===4&&ms===1600/3){assert(row.focus.visible&&row.focus.preservesSource);assert(row.focus.cacheKeys.length>0&&row.focus.cacheKeys.every(k=>k.includes('designer-h264-ycrcb-alpha-four-plane-v2')));}
   if((skill===4&&ms===1600/3)||(!reduced&&((skill===1&&ms===350)||(skill===4&&(ms===1100||ms===2200-.0001))))||(reduced&&skill===4&&ms===1100)){const path=resolve(out,`cast-${skill}-${reduced?'reduced':'normal'}-${ms}.png`);await page.screenshot({path});report.captures.push({path,sha256:hash(await readFile(path)),utc:new Date().toISOString(),skill,reduced,ms});}
  }
  errors.push(...opened.errors);blockedRequests.push(...opened.blockedRequests);await page.close();await save();
 }
 report.errors=errors;report.blockedRequests=blockedRequests;assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
 report.routingPass=report.rows.filter(r=>r.ms<(r.skill===4?2200:800)).every(r=>r.sampled.name===(r.skill===4?'ult':'attack'));
 report.hitPass=report.rows.filter(r=>r.ms===(r.skill===4?1100:350)).every(r=>Math.abs(r.sampled.at-(r.skill===4?1.1:.35))<1e-8);
 report.mediaCastPass=report.rows.some(r=>r.skill===4&&!r.reduced&&r.maxMeshDelta>0)&&report.rows.filter(r=>r.reduced).every(r=>r.maxMeshDelta===0);
 report.pass=report.routingPass&&report.hitPass&&report.mediaCastPass;report.limits='Actual A6 basic/ultimate actions only; -2/-3 are not legal judge cards and are excluded. Each action has a fresh page to isolate prior boss phase state. Four fresh desktop stills saved for separate measured review; no art acceptance, final enrollment or FPS claim. Static intake bounds are not per-frame silhouette.';assert.equal(report.pass,true,'Production media routing/contact/deformation gate failed');
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,routingPass:report.routingPass,hitPass:report.hitPass,rows:report.rows.length,failure:report.failure}));}
