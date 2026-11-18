/** Local built artifacts only; never the CXI judge server or persisted account progression. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {waitForBattleReady} from '../v4ship-lab/rehearsal/battle-ready.mjs';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json'));
export const {chromium}=require('@playwright/test');
export const config=JSON.parse(readFileSync(resolve(root,'scripts/v3a2/fixtures.json')));
const mode=process.env.CXV_ARTIFACT_MODE;assert(['baseline','text','pruned','native','read'].includes(mode));
const parent=resolve(process.env.CXV_PRODUCTION_OUT??resolve(root,'work/v5/CXV/films/V7-F-hud-production'));
assert(parent.startsWith(resolve(root,'work/v5/CXV')+'/'));
const built=JSON.parse(readFileSync(resolve(parent,'build.json'))),artifact=built.artifacts.find(a=>a.mode===mode);
assert(artifact&&artifact.dist===resolve(parent,mode));
export const judgeUrl='http://127.0.0.1:'+(mode==='baseline'?6311:6312)+'/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function runtimeEvidence(){return{indexSha256:hash(readFileSync(resolve(artifact.dist,'index.html'))),artifactMode:mode,buildSource:built.source,buildRuntimePatchSha256:built.runtimePatchSha256,buildManifestSha256:hash(readFileSync(resolve(parent,'build.json'))),harnessSha256:hash(readFileSync(import.meta.filename))};}
export async function openFixture(browser,fixture,{setupPage}={}){
 for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);
 assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),artifact.indexSha256);
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1}),errors=[],blockedRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+new URL(r.url()).pathname);});
 await page.route('**/*',route=>{
  const request=route.request(),target=new URL(request.url());
  if(target.pathname.startsWith('/src/')||target.pathname.startsWith('/@fs')){blockedRequests.push(target.pathname);return route.abort();}
  if(request.method()!=='POST')return route.continue();
  let body;try{body=request.postDataJSON();}catch{blockedRequests.push(target.pathname);return route.abort();}
  const calls=Array.isArray(body)?body:[body];
  if(target.href==='https://api.avax-test.network/ext/bc/C/rpc'&&calls.every(call=>/^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(call?.method)))return route.continue();
  blockedRequests.push(target.origin+target.pathname);return route.abort();
 });
 if(setupPage)await setupPage(page);
 await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
 await page.goto(judgeUrl+'&dev=1');await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>window.__depthReview);
 const modules=await loadRules();
 try{
  const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
  const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(config.seed),true));state.tutorial=4;
  Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:false});
  for(const card of state.account.cards){card.level=6;state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(s=>s.id);}
  const battle=R.createBattle({seed:config.seed,chapter:fixture.chapter,cats:R.battleCats(state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});battle.v4.committed=true;
  await page.evaluate(({state,battle,url})=>{history.replaceState(null,'',url);const m=window.__depthReview;m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map'});m.notify(false);},{state,battle,url:judgeUrl});
 }finally{await modules.vite.close();}
 await waitForBattleReady(page,90000);await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>cancelAnimationFrame(window.__depthScene.raf));assert.equal(page.url(),judgeUrl);
 return{page,errors,blockedRequests};
}
