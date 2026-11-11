/** Lane assignment through delayed loads, replaced enemies and fallen cats. */
import{createRequire}from'node:module';import{writeFile}from'node:fs/promises';import{resolve}from'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const report={method:'Controlled renderer lifecycle and public preview actions; delay only Mochi PNG in an isolated context. No gameplay progression or timing benchmark.',cases:[],errors:[],complete:false};
try{
 for(const[width,height]of[[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));
  let release,held=false;const gate=new Promise(r=>{release=r;});
  await page.route('**/mochi.png*',async route=>{if(route.request().resourceType()!=='image')return route.continue();held=true;await gate;await route.continue();});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{const m=window.__depthReview;m.tutorial();m.fight();m.paused=true;m.notify(false);window.originalPractice=JSON.stringify(m.tutorialBattle);});
  for(let n=0;n<100&&!held;n++)await page.waitForTimeout(20);if(!held)throw Error('Mochi asset interception missing');
  for(const id of ['inkcap-4','cinnamon-4'])await page.evaluate(id=>window.__depthReview.inspect(id,.7),id);
  release();await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&m.visualBattle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId)&&s.actors.size===m.visualBattle.actors.length;});
  async function order(){return page.evaluate(()=>{const s=window.__depthScene;s.prepare(s.view());s.render(s.view(),0);const cards=[...document.querySelectorAll('.uv-battle-cat')].map(e=>e.dataset.actor),actual=s.sizeAudit().units.filter(u=>u.side==='party').sort((a,b)=>a.box.x-b.box.x).map(u=>u.id);return{cards,actual,match:JSON.stringify(cards)===JSON.stringify(actual),original:window.originalPractice===JSON.stringify(window.__depthReview.tutorialBattle)};});}
  const pending=await order();if(!pending.match||!pending.original)throw Error('Pending crew '+JSON.stringify(pending));report.cases.push({width,height,kind:'pending-roster',...pending});
  await page.evaluate(()=>window.__depthReview.closeGallery());await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&m.visualBattle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId)&&s.actors.size===m.visualBattle.actors.length;});
  const returned=await order();if(!returned.match||!returned.original)throw Error('Return '+JSON.stringify(returned));report.cases.push({width,height,kind:'return',...returned});
  await page.unroute('**/mochi.png*');
  await page.evaluate(async()=>{
   const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
   m.tutorialBattle=R.createBattle({...m.tutorialBattle.initial,seed:71,enemies:['button-guard','binding-thread','needle-moth']});m.plan=null;m.paused=true;m.notify(false);
  });await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s.ready&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId)&&s.actors.size===m.battle.actors.length;});
  const identities=await page.evaluate(()=>{
   const s=window.__depthScene;s.render(s.view(),0);window.laneOriginalView=s.view.bind(s);window.laneView={...s.view(),fixedTime:5,galleryPreview:true};s.view=()=>window.laneView;
   const foes=window.laneView.actors.filter(a=>a.side==='enemy');window.lanePositions=Object.fromEntries([...s.actors].map(([id,e])=>[id,{x:e.actor.root.position.x,lane:e.lane}]));window.laneGone=foes[0].id;
   window.laneView={...window.laneView,actors:window.laneView.actors.filter(a=>a.id!==window.laneGone)};s.prepare(s.view());s.render(s.view(),0);
   return{gone:!s.actors.has(window.laneGone),stable:[...s.actors].every(([id,e])=>e.lane===window.lanePositions[id].lane&&e.actor.root.position.x===window.lanePositions[id].x)};
  });if(!identities.gone||!identities.stable)throw Error('Removed enemy shifted survivors');report.cases.push({width,height,kind:'enemy-removed',...identities});
  await page.evaluate(()=>{const s=window.__depthScene,v=window.laneView,unit=v.actors.find(a=>a.side==='enemy'),id='new-binding-thread';window.laneView={...v,actors:[...v.actors,{...unit,id}],models:{...v.models,[id]:'binding-thread'}};s.prepare(s.view());});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.has('new-binding-thread'));
  const replacement=await page.evaluate(()=>{const s=window.__depthScene;s.render(s.view(),0);return{stable:[...s.actors].filter(([id])=>id!=='new-binding-thread').every(([id,e])=>e.lane===window.lanePositions[id].lane&&e.actor.root.position.x===window.lanePositions[id].x),newLane:s.actors.get('new-binding-thread').lane,vacant:window.lanePositions[window.laneGone].lane};});if(!replacement.stable||replacement.newLane!==replacement.vacant)throw Error('Replacement enemy shifted lanes');report.cases.push({width,height,kind:'enemy-replaced',...replacement});
  const fallen=await page.evaluate(()=>{const s=window.__depthScene,v=window.laneView;window.laneView={...v,actors:v.actors.map(a=>a.side==='party'?{...a,hp:0}:a)};s.prepare(s.view());s.render(s.view(),0);return{stable:[...s.actors].filter(([id])=>window.lanePositions[id]).every(([id,e])=>e.lane===window.lanePositions[id].lane&&e.actor.root.position.x===window.lanePositions[id].x)};});if(!fallen.stable)throw Error('Fallen cats shifted lanes');report.cases.push({width,height,kind:'party-fallen',...fallen});
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify(report));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(root,'reports/cardrpg-c/checks/c11-roster-lifecycle.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
