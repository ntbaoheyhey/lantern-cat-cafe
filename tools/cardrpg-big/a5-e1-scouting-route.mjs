// REFERENCE: PROMPT-A5 E1. Real-click earned route; explicit event/elite clues and boss forecast.
import {chromium} from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const artifact=process.env.A5_E1_ARTIFACT||'/tmp/cardrpg-a5-e1-artifact/index.html';
const out=process.env.A5_E1_SCOUT_OUT||'reports/cardrpg-big/a5/e1/reviewed/scouting-route';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'}),errors=[],timeline=[];
page.on('pageerror',e=>errors.push(String(e)));
const button=name=>page.getByRole('button',{name,exact:true});
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,screen:window.__depthReview.screen}));
let passed=false,forecast;
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name:'Save & settings',exact:true}).click();
 await page.getByLabel('Save code',{exact:true}).fill(await readFile('reports/cardrpg-big/a5/e1/rules/earned-loss.save','utf8'));
 await button('Import save code').click();await button('Apply and retry route').click({timeout:30000});
 for(let n=0;n<32;n++){
  const {state,screen}=await read(),run=state.run,node=run.nodes.find(n=>n.id===run.current);
  timeline.push({screen,node:node?.kind,visited:[...run.visited]});
  assert(!run.complete,'Route should reach boss preparation');
  if(screen==='prepare'){
   await page.waitForFunction(()=>document.querySelector('.dp-v4-forecast')?.hasAttribute('data-forecast-ms'));
   if(node.kind==='boss'){
    assert.match(await page.locator('.dp-v4-scouting').innerText(),/Known about the boss: 3\/3/);
    forecast=await page.locator('.dp-v4-forecast').evaluate(e=>({text:e.innerText,elapsedMs:Number(e.dataset.forecastMs),computeMs:Number(e.dataset.computeMs)}));
    assert.match(forecast.text,/Risky|Even|Favoured/);await page.locator('.dp-v4-scouting').scrollIntoViewIfNeeded();
    await page.screenshot({path:out+'/boss-preparation.png'});passed=true;break;
   }
   await button('Fight').click();await button('Skip to result').click();await page.getByRole('heading',{name:'Victory',exact:true}).waitFor();await button('Continue to rewards').click();
  }else if(run.rewardChoices.length){await page.locator('.dp-reward').first().click();}
  else if(!node){
   const found=Number((await page.locator('.dp-v4-scouting').innerText()).match(/boss: (\d)/)[1]);
   if(run.visited.length===1){assert.equal(found,1);assert.doesNotMatch(await page.locator('.dp-v4-scouting article').first().innerText(),/both rows|half HP/);}
   const available=page.locator('.dp-node:enabled');
   const event=available.filter({hasText:'event'}),elite=available.filter({hasText:'elite'});
   await ((await event.count())?event:(await elite.count())?elite:available.first()).click();
  }else if(node.kind==='event')await page.locator('.dp-three button:enabled').first().click();
  else if(node.kind==='treasure')await button('Take 70 run points').click();
  else if(node.kind==='shop')await button('Save your points and leave').click();
  else if(node.kind==='campfire')await button('Heal the team · 35% HP').click();
  else throw Error('Unhandled route stop '+node.kind);
 }
 assert(passed,'Reached boss preparation');assert.deepEqual(errors,[]);
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),timeline,forecast,errors,
 limitations:['Uses Skip between preparations; not battle duration or engagement evidence.','Reaches boss preparation; does not claim boss victory.']},null,2));await browser.close();
}
