/** Own fresh visual review; exact served build plus pinned diagnostic wrappers. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadRules} from '../cardrpg-big/a4-load.mjs';

const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXI_CAPTURE_OUT??'');
assert(out.startsWith(resolve(root,'work/v5/CXI')+'/')&&!existsSync(out));
assert(process.env.CXI_BROWSER_LEASE_RECEIPT,'Explicit release receipt required');
const sha=b=>createHash('sha256').update(b).digest('hex');
const preregPath=resolve(root,'reports/v5/CXI/evidence/v8-label-staging-own-view-r1-preregistration.json');
const preregBytes=await readFile(preregPath),pre=JSON.parse(preregBytes);
const load=async ref=>{const b=await readFile(ref.path);assert.equal(sha(b),ref.sha256);return JSON.parse(b);};
const build=await load(pre.build),raw=await load(pre.pilotRaw),rules=await load(pre.rulesAudit);
assert.deepEqual(rules.raw,pre.pilotRaw);
assert(rules.fullBattleExact&&raw.actions.length===1);
for(const ref of pre.helpers)assert.equal(sha(await readFile(ref.path)),ref.sha256);
assert.equal(process.env.CXV_MEDIA_BUILD,pre.build.path);
assert.equal(process.env.CXV_MEDIA_CAT,'both');
const {chromium,config,openFixture,runtimeEvidence,judgeUrl,waitForDecodedMediaFrame}=await import(pathToFileURL(pre.helpers[0].path).href);
const {sample,installLabelTargetShift,installLowerBodyLabel}=await import(pathToFileURL(pre.helpers[1].path).href);
assert.equal(judgeUrl,pre.url);
assert.equal(runtimeEvidence().indexSha256,pre.indexSha256);
execFileSync('git',['diff','--quiet',pre.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules'],{cwd:root});
const require=createRequire(resolve(root,'apps/web/package.json')),sharp=require('sharp');
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
const cats=['mochi','clover','panko','mallow'],state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
state.account.cards=cats.map(id=>({...template,id,cardId:id,level:6}));state.team=cats;state.tutorial=4;
state.rows=Object.fromEntries(cats.map((id,i)=>[id,i<2?'front':'rear']));
state.skills=Object.fromEntries(cats.map(id=>[id,R.CAT_BY_ID[id].skills.map(s=>s.id)]));
Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:false});
const action=raw.actions[0],battle=structuredClone(action.initialBattle),expected=structuredClone(battle);
assert(R.legalChoices(battle).some(c=>JSON.stringify(c)===JSON.stringify(action.choice)));
assert(R.act(expected,action.choice));assert.deepEqual(expected,action.expectedBattle);
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:pre.viewport,sourceCommit:pre.sourceCommit,indexSha256:pre.indexSha256,
 preregistration:{path:preregPath,sha256:sha(preregBytes)},harnessSha256:sha(await readFile(import.meta.filename)),leaseReceipt:process.env.CXI_BROWSER_LEASE_RECEIPT,
 helpers:pre.helpers,diagnostic:pre.diagnostic,captures:[],pass:false,productionAcceptance:false};
const stop=()=>{for(const n of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+n),n);};
let browser;
try{
 stop();browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
 await page.evaluate(installLabelTargetShift,{dx:-12,dy:19});await page.evaluate(installLowerBodyLabel);
 await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;
  Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},{state,battle});
 await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s.ready&&['mochi','clover'].every(id=>s.actors.get(id)?.actor?.designerMedia?.media.state.ready)&&s.view().actors.every(a=>a.hp===m.visualBattle.actors.find(b=>b.id===a.id)?.hp);});
 await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
 const render=async fixedTime=>{
  await page.evaluate(t=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:t,paused:true},0);},fixedTime);
  await waitForDecodedMediaFrame(page,{displayedFrame:true});
  await page.evaluate(t=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:t,paused:true},0);},fixedTime);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 };
 await render(31.25);
 assert.deepEqual(await page.evaluate(()=>window.__depthReview.battle),battle);
 report.action=await page.evaluate(choice=>{const m=window.__depthReview;m.paused=false;if(!m.canAct)throw Error('Cannot act');m.act(choice);m.paused=true;m.notify(false);return{battle:m.battle,plan:{skill:m.plan.skillId,duration:m.plan.duration,contact:m.plan.beats[2].start}};},action.choice);
 assert.deepEqual(report.action.battle,expected);
 let previous=0;
 for(const ms of pre.capturePhasesMs){
  stop();
  await page.evaluate(({previous,ms})=>{const m=window.__depthReview;let at=previous,now=100000+previous;m.tick(0,now);m.paused=false;
   while(at<ms-1e-8){const delta=Math.min(16,ms-at);now+=delta;at+=delta;m.tick(delta,now);}m.paused=true;m.notify(false);},{previous,ms});previous=ms;
  await render(70+ms/1000);
  await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.target?.closest('.b3-world')&&Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished));});
  await page.waitForFunction(()=>document.querySelector('.b3-total')?.hidden??true,null,{timeout:3000});
  await render(70+ms/1000);
  const before=await page.evaluate(sample),path=resolve(out,ms+'-native.png'),utc=new Date().toISOString();
  await page.screenshot({path,scale:'css'});
  const after=await page.evaluate(sample),bytes=await readFile(path),meta=await sharp(bytes).metadata();
  assert.equal(meta.width,1280);assert.equal(meta.height,720);
  const view=resolve(out,ms+'-review.png');
  const pipeline=ms===0?sharp(bytes).resize(1024,576):sharp(bytes).extract({left:150,top:50,width:800,height:650});
  await pipeline.png().toFile(view);
  const viewBytes=await readFile(view),vm=await sharp(viewBytes).metadata(),stats=await sharp(viewBytes).stats();
  assert(vm.width<=1024&&vm.height<=1024);
  report.captures.push({ms,utc,before,after,path,sha256:sha(bytes),width:1280,height:720,
   view:{path:view,sha256:sha(viewBytes),width:vm.width,height:vm.height,channels:stats.channels.map(c=>({min:c.min,max:c.max,mean:c.mean,stdev:c.stdev})),viewed:false}});
 }
 report.errors=errors;report.blockedRequests=blockedRequests;assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);
 assert.equal(new Set(report.captures.map(c=>c.view.sha256)).size,2);report.pass=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}
finally{
 if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({out,pass:report.pass,captures:report.captures.length,failure:report.failure}));
}
