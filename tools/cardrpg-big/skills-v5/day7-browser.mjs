// One predeclared TRAIN day-7 account, real public clicks and x1 playback.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s8/day7',reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex'),save=await readFile(reg.save,'utf8');
assert.equal(sha(save),reg.saveSha256);assert.equal(sha(await readFile(reg.artifact)),reg.artifactSha256);assert.equal(sha(await readFile(import.meta.filename)),reg.scriptSha256);
await mkdir(root,{recursive:true});assert(!await readFile(root+'/checks.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;}));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[],remote=[],encounters=[],choices=[],captures=[],routes=[];let complete=false,initial,after,advice=null,attempt=1;
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
const button=name=>page.getByRole('button',{name,exact:true}),nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
async function capture(label){const path=root+'/'+label+'.png';await page.screenshot({path});captures.push({label,path});}
try{
 await page.goto('file://'+reg.artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(save);await button('Import save code').click();initial=await read();assert.equal(initial.state.account.day,7);assert(initial.state.skillsV5);
 await nav('Cafe');await capture('earned-day7-home');
 const chapter=Math.min(3,initial.state.cleared.length+1),level=Math.min(...initial.state.account.cards.filter(c=>initial.state.team.includes(c.cardId)).map(c=>c.level));
 await page.getByLabel('Challenge band',{exact:true}).selectOption(String(level));await page.locator('.cr-route-list button').nth(chapter-1).click();
 for(let step=0;step<70;step++){
  const current=await read(),run=current.state.run;assert(run);if(!routes.some(r=>r.id===run.id))routes.push({id:run.id,seed:run.seed,chapter:run.chapter,band:run.challengeLevel,attempt});
  if(run.complete)break;
  if(current.battle&&!current.battle.result){
   const node=run.nodes.find(n=>n.id===run.current),setup=current.battle.initial;assert(setup.skillsV5);
   const started=Date.now();await button('Fight').click();await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
   await page.waitForFunction(()=>window.__depthReview.screen==='result'&&!window.__depthReview.showBattle,null,{timeout:600000});
   const result=await read();encounters.push({attempt,kind:node.kind,node:node.id,wallMs:Date.now()-started,setup,battle:result.battle});await capture('attempt-'+attempt+'-'+step+'-'+node.kind);
   if(result.battle.result==='enemy'){
    const apply=button('Apply and retry route');if(attempt===1&&await apply.count()&&await apply.isEnabled()){advice=await page.locator('.dp-v4-advice').innerText();await apply.click();attempt++;continue;}
    await button('Continue to rewards').click();break;
   }
   await button('Continue to rewards').click();continue;
  }
  if(run.rewardChoices.length){choices.push({kind:'reward',choice:run.rewardChoices[0]});await page.locator('.dp-reward').first().click();continue;}
  if(run.current){
   const node=run.nodes.find(n=>n.id===run.current);choices.push({kind:node.kind,node:node.id});
   if(node.kind==='event')await page.locator('.cr-panel .dp-three button:enabled').first().click();
   else if(node.kind==='treasure')await button('Take 70 run points').click();
   else if(node.kind==='shop')await button('Save your points and leave').click();
   else if(node.kind==='campfire')await button('Heal the team · 35% HP').click();
   else throw Error('Unresolved node '+node.kind);
  }else{choices.push({kind:'route',label:await page.locator('.dp-node:enabled').first().innerText()});await page.locator('.dp-node:enabled').first().click();}
 }
 after=await read();await nav('Collection journal');await capture('day7-journal');assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);complete=true;
}finally{
 const bosses=encounters.filter(e=>e.kind==='boss'),win=bosses.find(e=>e.battle.result==='party');
 const gates={bossVictory:!!win,boss45to90s:!!win&&win.wallMs>=45000&&win.wallMs<=90000};
 await writeFile(root+'/checks.json',JSON.stringify({complete,registration:reg,initial,after,advice,routes,encounters,choices,captures,errors,remote,gates,method:'Fixed regular account0 from earned45-day TRAIN cohort at day7. Import via UI, choose next uncleared chapter/current crew band with real clicks, first route/boon/event, camp heal/shop saving. At most one available advice retry. Natural UI route seeds are recorded; no grants, skip, clock change or best-account selection. One fixture is separate from90-account and heldout gates.'},null,2));await browser.close();console.log(JSON.stringify({complete,gates,bosses:bosses.map(e=>({attempt:e.attempt,wallMs:e.wallMs,result:e.battle.result}))}));
}
