/** Native living-cat production squads; original rules, no runtime source patch. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';
import {waitForBattleReady} from '/Users/bao/taskbar-hero-chain/tools/v4ship-lab/rehearsal/battle-ready.mjs';
const root='/Users/bao/taskbar-hero-chain',req=createRequire(resolve(root,'apps/web/package.json'));
export const {chromium}=req('@playwright/test');
export const config=JSON.parse(readFileSync(resolve(root,'scripts/v3a2/fixtures.json')));
export const judgeUrl='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3';
const source=process.env.CXV_SERVED_SOURCE??'85cb62233d016faf5c5235ffe178408df1682af3',index=process.env.CXV_EXPECTED_INDEX??'d75197ff94529a92091902510795dd1ec3000e516e8ef02ec13108b6a4d4ef84';
assert(/^[a-f0-9]{40}$/.test(source)&&/^[a-f0-9]{64}$/.test(index),'Explicit pinned source/index identity');
const hash=data=>createHash('sha256').update(data).digest('hex');
const squads=[['mallow','sorrel','biscuit','inkcap'],['cinnamon','brioche','velvet','marigold'],['panko','mallow','sorrel','biscuit']];
const group=Number(process.env.CXV_M_GROUP);assert(Number.isInteger(group)&&squads[group]);
assert.equal(execFileSync('git',['diff',source,'--','packages/game-rules/src'],{cwd:root,encoding:'utf8'}),'','Production rules must match source');
export function runtimeEvidence(){return{indexSha256:hash(readFileSync(resolve(root,'apps/web/dist/index.html'))),harnessSha256:hash(readFileSync(import.meta.filename)),servedSource:source,roster:squads[group],group};}
export async function openFixture(browser,fixture,{setupPage}={}){
 for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);
 assert.equal(runtimeEvidence().indexSha256,index);
 assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),index);
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 if(setupPage)await setupPage(page);
 const errors=[],blockedRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`);});
 await page.route('**/*',route=>{
  const request=route.request(),target=new URL(request.url());
  if(target.pathname.startsWith('/src/')||target.pathname.startsWith('/@fs')){blockedRequests.push(target.pathname);return route.abort();}
  if(request.method()!=='POST')return route.continue();
  let body;try{body=request.postDataJSON();}catch{blockedRequests.push(target.pathname);return route.abort();}
  const calls=Array.isArray(body)?body:[body];
  if(target.href==='https://api.avax-test.network/ext/bc/C/rpc'&&calls.every(call=>/^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(call?.method)))return route.continue();
  blockedRequests.push(target.origin+target.pathname);return route.abort();
 });
 await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
 await page.goto(judgeUrl+'&dev=1');await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>window.__depthReview);
 const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(config.seed),true));state.tutorial=4;
 const template=state.account.cards[0];state.account.cards=squads[group].map(id=>({...template,id,cardId:id,level:6}));
 state.team=[...squads[group]];state.rows=Object.fromEntries(state.team.map((id,i)=>[id,i<2?'front':'rear']));state.skills=Object.fromEntries(state.team.map(id=>[id,R.CAT_BY_ID[id].skills.map(s=>s.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:false});
 const battle=R.createBattle({seed:config.seed,chapter:fixture.chapter,cats:R.battleCats(state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});battle.v4.committed=true;
 assert.deepEqual(battle.actors.filter(a=>a.side==='party').map(a=>a.catalogId),squads[group]);
 await page.evaluate(({state,battle,url})=>{history.replaceState(null,'',url);const m=window.__depthReview;m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map'});m.notify(false);},{state,battle,url:judgeUrl});
 await waitForBattleReady(page,90000);await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>cancelAnimationFrame(window.__depthScene.raf));assert.equal(page.url(),judgeUrl);
 const enrolled=await page.evaluate(roster=>[...window.__depthScene.actors.values()].filter(e=>roster.includes(e.asset)).map(e=>({asset:e.asset,native:e.actor?.mesh?.livingCat,drawn:!!e.craftPose?.drawing})),squads[group]);
 for(const cat of squads[group])assert(enrolled.some(e=>e.asset===cat&&(cat==='panko'?e.drawn:e.native===cat)),'Native profile missing '+cat);
 return{page,errors,blockedRequests};
}
