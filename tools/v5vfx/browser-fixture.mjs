/** CXV capture harness: exact judge-facing route, no save/rules edits outside fixtures. */
import {chromium,config} from '../../scripts/v3feel/browser-fixture.mjs';
export {chromium,config};
const root=process.cwd();
export async function openFixture(browser,fixture,{width=1280,height=720,url='http://127.0.0.1:6310',fixedClock=true,setupPage}={}){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[],blockedRequests=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return route.continue();blockedRequests.push({url:u.origin+u.pathname,type:route.request().resourceType()});return route.abort();});
 if(setupPage)await setupPage(page);
 await page.goto(url+'/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 await page.evaluate(async({fixture,seed,root})=>{
  const m=window.__depthReview,R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
  m.state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(seed),true));m.state.tutorial=4;
  Object.assign(m.state.settings,{speed:1,quality:'high',reducedMotion:false});
  for(const card of m.state.account.cards){card.level=6;m.state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(s=>s.id);}
  const battle=R.createBattle({seed,chapter:fixture.chapter,cats:R.battleCats(m.state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
  battle.v4.committed=true;
  Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map'});m.notify(false);
  window.__v3a2={R,initial:structuredClone(battle),plans:[],lastPlan:null};
 },{fixture,seed:config.seed,root});
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>cancelAnimationFrame(window.__depthScene.raf));
 if(fixedClock){await page.clock.install({time:new Date('2026-11-13T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-13T00:00:01Z'));}
 await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:10,paused:true},0);});
 if(fixedClock)await page.clock.runFor(34);
 return {page,errors,blockedRequests};
}
