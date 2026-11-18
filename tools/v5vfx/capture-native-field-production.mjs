/** Five native ultimates through the shipped model; no runtime source substitutions. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from '/Users/bao/taskbar-hero-chain/tools/v5int/production-fixture.mjs';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';

const root=resolve(import.meta.dirname,'../..'),integration='/Users/bao/taskbar-hero-chain';
const hash=x=>createHash('sha256').update(x).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:integration,encoding:'utf8'});
const owners=['mallow','sorrel','biscuit','cinnamon','brioche'];
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);};
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
function fixture(owner,reduced){
 const roster=[owner,...['panko','mallow','sorrel','biscuit'].filter(x=>x!==owner)].slice(0,4);
 const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=roster.map(cardId=>({...template,id:cardId,cardId,level:6}));state.team=roster;
 state.rows=Object.fromEntries(roster.map((x,i)=>[x,i<2?'front':'rear']));state.skills=Object.fromEntries(roster.map(x=>[x,R.CAT_BY_ID[x].skills.map(z=>z.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:reduced});state.tutorial=4;
 const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 const caster=battle.actors.find(x=>x.catalogId===owner);for(const x of battle.actors)x.hp=Math.round(x.maxHp*(x.side==='party'?.55:.8));
 if(owner==='cinnamon')battle.actors.find(x=>x.side==='party'&&x.id!==caster.id).hp=0;
 caster.charge=100;caster.turns=3;caster.shield=45;battle.queue=[caster.id,...battle.queue.filter(x=>x!==caster.id)];battle.v4.committed=true;
 const choice=R.legalChoices(battle).find(x=>x.skillId===owner+'-4');assert(choice);
 const expected=structuredClone(battle);assert(R.act(expected,choice));
 return{state,battle,choice,expected,roster};
}

let browser;
try{
 if(process.env.CXV_FIELD_FIXTURES_ONLY==='1'){
  for(const owner of owners)for(const reduced of [false,true]){const f=fixture(owner,reduced);console.log(JSON.stringify({owner,reduced,choice:f.choice,events:f.expected.log.length,roster:f.roster}));}
 }else{
  stop();const source=process.env.CXV_SERVED_SOURCE,index=process.env.CXV_EXPECTED_INDEX;
  assert(/^[a-f0-9]{40}$/.test(source)&&/^[a-f0-9]{64}$/.test(index),'Explicit published source/index required');
  assert.equal(git('diff',source,'--','packages/game-rules/src'),'','Rules must match production source');
  const files=['battle-v3/native-ultimate-field.ts','battle-v3/field-vfx.ts','spine/vfx.ts'].map(p=>'apps/web/src/game/cardrpg/'+p);
  const sourceHashes=Object.fromEntries(files.map(p=>[p,hash(git('show',source+':'+p))]));
  assert.equal(sourceHashes[files[0]],hash(await readFile(resolve(root,files[0]))),'Five-skill helper must match reviewed implementation');
  assert.equal(runtimeEvidence().indexSha256,index);assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),index);
  const out=resolve(process.env.CXV_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/M-native-field-production-R1'));
  assert(out.startsWith(resolve(root,'work/v5/CXV')+'/')&&!existsSync(out),'Fresh owned evidence directory required');await mkdir(out,{recursive:true});
  const report={utc:new Date().toISOString(),source:git('rev-parse','HEAD').trim(),servedSource:source,indexSha256:index,sourceHashes,
   runnerSha256:hash(await readFile(import.meta.filename)),fixture:runtimeEvidence(),url:judgeUrl,viewport:[1280,720],runtimeSourceSubstitutions:[],rows:[],captures:[],rules:[],errors:[],blockedRequests:[],pass:false,
   method:'Seeded native fixtures; production model.act resolves each legal ultimate. Exact logs/actors compared to unchanged rules. Fixed-clock rendering at five phases, normal/reduced. No source imports/substitution, forced result or performance claim; fixture setup changes HP/charge before the action.'};
  browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
  for(const owner of owners)for(const reduced of [false,true]){
   stop();const f=fixture(owner,reduced);
   await page.evaluate(({state,battle})=>{
    const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;
    Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,impactApplied:false,animationAt:0});m.notify(false);s.ensureActors(s.view());
   },f);
   await page.waitForFunction(roster=>{const s=window.__depthScene;return s.ready&&s.actors.size===window.__depthReview.battle.actors.length&&roster.every(cat=>[...s.actors.values()].some(e=>e.asset===cat&&(cat==='panko'?e.craftPose?.drawing:e.actor?.mesh?.livingCat===cat)));},f.roster,{timeout:90000});
   await page.evaluate(async()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);await s.effects.ready;await document.fonts.ready;});
   const result=await page.evaluate(choice=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.paused=false;if(!m.canAct)throw Error('Production model cannot act');m.act(choice);m.paused=true;cancelAnimationFrame(s.raf);if(!m.plan?.ultimate)throw Error('Expected native ultimate');return{log:m.battle.log,actors:m.battle.actors,plan:{skill:m.plan.skillId,events:m.plan.events,duration:m.plan.duration,contact:m.plan.beats[2].start,leadIn:m.plan.speechLeadInMs??0}};},f.choice);
   assert.deepEqual(result.log,f.expected.log);assert.deepEqual(result.actors,f.expected.actors);
   assert.equal(result.plan.skill,owner+'-4');assert.equal(result.plan.contact,1100);assert.equal(result.plan.duration,2200);assert.equal(result.plan.leadIn,0);
   report.rules.push({owner,reduced,exact:true,...result});
   for(const ms of [1100,1280,1550,1760,2199]){
    const row=await page.evaluate(({owner,reduced,ms})=>{
     const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.animationAt=ms;m.impactApplied=true;
     s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);
     const size=s.sizeAudit(),c=s.effects.canvas,p=c.getContext('2d').getImageData(0,0,c.width,c.height).data,sx=c.width/size.width,sy=c.height/size.height;
     const coverage=box=>{let samples=0,sum=0,overHalf=0;for(let y=Math.max(0,Math.floor(box.y*sy));y<Math.min(c.height,Math.ceil((box.y+box.height)*sy));y++)for(let x=Math.max(0,Math.floor(box.x*sx));x<Math.min(c.width,Math.ceil((box.x+box.width)*sx));x++){const a=p[(y*c.width+x)*4+3]/255;samples++;sum+=a;if(a>.5)overHalf++;}return{samples,meanAlpha:samples?sum/samples:0,overHalf};};
     return{owner,reduced,ms,skill:m.plan.skillId,targets:m.plan.targetIds,events:m.plan.events,actorIds:s.view().actors.map(x=>x.catalogId),audit:structuredClone(s.effects.field.audit),canvas:[c.width,c.height],units:size.units.map(u=>({id:u.id,coreBox:u.coreBox,faceBox:u.faceBox,body:coverage(u.coreBox),face:coverage(u.faceBox)})),url:location.href};
    },{owner,reduced,ms});
    assert.equal(row.url,judgeUrl);assert(!row.actorIds.includes('soot'));report.rows.push(row);
    if(ms===1280){const name=owner+'-'+(reduced?'reduced':'normal'),path=resolve(out,name+'.png'),preview=resolve(out,name+'-1024.jpg');await page.screenshot({path});execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-q:v','2',preview]);report.captures.push({owner,reduced,ms,path,sha256:hash(await readFile(path)),preview,previewSha256:hash(await readFile(preview)),utc:new Date().toISOString(),reviewed:false,views:0});}
   }
  }
  report.errors=errors;report.blockedRequests=blockedRequests;report.completedUTC=new Date().toISOString();
  assert.equal(errors.length,0);assert.equal(blockedRequests.length,0);assert.equal(runtimeEvidence().indexSha256,index);assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),index);
  report.pass=true;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,source,index,rows:report.rows.length,captures:report.captures.length,errors:errors.length}));
 }
}finally{if(browser)await browser.close();await modules.vite.close();}
