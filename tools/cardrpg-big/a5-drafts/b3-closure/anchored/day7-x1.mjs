// REFERENCE: PROMPT-A5 B3/E2; the exact existing earned loss, one available advice, real x1 retry.
import {chromium} from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const artifact=process.env.A5_DAY7_ARTIFACT||'/tmp/cardrpg-a5-b3-closure-artifact/index.html',out=process.env.A5_DAY7_X1_OUT||'reports/cardrpg-big/a5/b3/closure/day7-x1';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[],remote=[],encounters=[],choices=[],captures=[];let complete=false,before,after,advice,applied,started;
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
const button=name=>page.getByRole('button',{name,exact:true}),nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
async function capture(label){const path=`${out}/${label}.png`;await page.screenshot({path});captures.push({label,path,elapsedMs:Date.now()-started});}
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(await readFile('reports/cardrpg-big/a5/e1/rules/earned-loss.save','utf8'));await button('Import save code').click();
 await button('Apply and retry route').waitFor({timeout:30000});before=await read();assert.equal(before.state.account.day,7);assert.equal(before.battle.result,'enemy');
 started=Date.now();advice=await page.locator('.dp-v4-advice').innerText();await capture('earned-loss-and-advice');
 await button('Apply and retry route').click();applied=await read();assert.equal(applied.state.run.id,before.state.nextRunId);await capture('retry-prepare');
 for(let step=0;step<30;step++){
  const current=await read(),run=current.state.run;if(run.complete)break;
  if(current.battle&&!current.battle.result){
   const node=run.nodes.find(n=>n.id===run.current),setup=current.battle.initial;
   const start=Date.now();await button('Fight').click();await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
   await page.waitForFunction(()=>window.__depthReview.screen==='result'&&!window.__depthReview.showBattle,null,{timeout:300000});
   const wallMs=Date.now()-start,result=await read();encounters.push({node:node.id,kind:node.kind,wallMs,setup,battle:result.battle});await capture(`result-${step}-${node.kind}`);
   await button('Continue to rewards').click();if(result.battle.result!=='party')break;continue;
  }
  if(run.rewardChoices.length){choices.push({kind:'reward',id:run.rewardChoices[0],text:await page.locator('.dp-reward').first().innerText()});await page.locator('.dp-reward').first().click();continue;}
  if(run.current){
   const node=run.nodes.find(n=>n.id===run.current);
   if(node.kind==='event'){choices.push({kind:'event',text:await page.locator('.cr-panel .dp-three button:enabled').first().innerText()});await page.locator('.cr-panel .dp-three button:enabled').first().click();}
   else if(node.kind==='treasure')await button('Take 70 run points').click();
   else if(node.kind==='shop')await button('Save your points and leave').click();
   else if(node.kind==='campfire')await button('Heal the team · 35% HP').click();
   else throw Error('Unresolved stop '+node.kind);continue;
  }
  const last=run.nodes.find(n=>n.id===run.visited.at(-1)),available=run.nodes.filter(n=>last?last.next.includes(n.id):n.depth===0),node=available.find(n=>n.kind==='event')??available.find(n=>n.kind==='elite')??available[0];assert(node);
  choices.push({kind:'route',node:node.id,type:node.kind});await page.locator('.dp-node:enabled').filter({has:page.locator('b',{hasText:new RegExp(`^${node.kind}$`)})}).first().click();
 }
 after=await read();assert(after.state.run.complete);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);complete=true;
 await capture('completed-route');await nav('Collection journal');await page.getByRole('region',{name:'Discoveries',exact:true}).scrollIntoViewIfNeeded();await capture('discoveries');
}finally{
 const boss=encounters.find(e=>e.kind==='boss'),gates={bossVictory:boss?.battle.result==='party',boss45to90s:!!boss&&boss.wallMs>=45000&&boss.wallMs<=90000};
 await writeFile(out+'/checks.json',JSON.stringify({complete,method:'Same public-command-earned H0 loss imported through real UI. Apply one available rule-generated improvement. Fresh route uses event if offered, otherwise elite if offered, first boon/affordable event, route points, save at shop, heal at camp. All fights real x1, no Skip or clock acceleration. Different route is disclosed; this single fixture does not establish the90-account gate.',artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),before,advice,applied,encounters,choices,captures,after,gates,errors,remote},null,2));await browser.close();
 console.log(JSON.stringify({complete,gates,encounters:encounters.map(e=>({kind:e.kind,result:e.battle.result,wallMs:e.wallMs}))}));
}
