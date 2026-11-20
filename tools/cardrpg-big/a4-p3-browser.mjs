// REFERENCE: GAMEPLAY-V4 sections8/9. Headless real x1 clicks; one encounter per lock.
import {loadRules} from './a4-load.mjs';
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const chapter=Number(process.argv[2]||1),kind=process.argv[3]||'boss',width=Number(process.argv[4]||1280),level=kind==='ordinary'?1:6;
const out=`${process.env.BIG_PACING_BROWSER_OUT||'reports/cardrpg-big/a4/p3'}/browser-${chapter}-${kind}-${width}`,artifact=resolve('docs/cardrpg3/index.html');await mkdir(out,{recursive:true});
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const take=r=>{assert(r.ok,r.error);return r.state;};
let s=R.setGameplayV4(R.createDepthAccount(23),true);s.account.cards.forEach(c=>c.level=level);s.cleared=[1,2,3];
s=take(R.startRun(s,chapter,23));
// Controlled level/unlock benchmark; traverse preceding nodes with actual public commands.
for(let n=0;n<30;n++){
 const run=s.run;assert(!run.complete,'Benchmark route lost before target');
 if(run.battle){R.playBattle(run.battle,'auto');s=take(R.finishEncounter(s));continue;}
 if(run.rewardChoices.length){s=take(R.chooseReward(s,run.rewardChoices[0]));continue;}
 if(run.current){const node=run.nodes.find(n=>n.id===run.current);let choice;
  if(node.kind==='campfire')choice='heal';else if(node.kind==='treasure')choice='charm';else if(node.kind==='shop')choice='leave';
  else choice=R.EVENTS.find(e=>e.id===node.eventId).choices.filter(c=>c.cost<=run.points).sort((a,b)=>b.heal-a.heal)[0].id;
  s=take(R.resolveNode(s,choice));continue;
 }
 const nodes=R.availableNodes(run),node=nodes.find(n=>kind==='elite'&&n.kind==='elite')??nodes[0];
 s=take(R.enterNode(s,node.id));
 if(node.kind===(kind==='ordinary'?'battle':kind))break;
}
assert(s.run.battle);await writeFile(`${out}/fixture.save.txt`,R.exportSave(s));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width,height:width===1024?600:width===1440?900:720}}),errors=[],captures=[],contrasts=[];
const sha256=createHash('sha256').update(await readFile(artifact)).digest('hex');let timing;
page.on('pageerror',e=>errors.push(String(e)));
const capture=async name=>{
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.equal(overflow,0);
 const samples=await page.locator('.dp-v4-pacing').evaluateAll(panels=>{
  const rgb=v=>(v.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  return panels.flatMap(panel=>[panel,...panel.querySelectorAll('*')].filter(el=>el.textContent.trim()&&el.getClientRects().length).map(el=>{
   let parent=el,bg;while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}parent=parent.parentElement;}
   const a=lum(rgb(getComputedStyle(el).color)),b=lum(bg||[29,27,40]);return {text:el.textContent.slice(0,100),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }));
 });
 contrasts.push({name,samples});await page.screenshot({path:`${out}/${name}.png`});captures.push({name,overflow});
 assert(samples.every(s=>s.ratio>=4.5),JSON.stringify(samples.filter(s=>s.ratio<4.5)));
};
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
 await capture('new-hub');await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(R.exportSave(s));await page.getByRole('button',{name:'Import save code',exact:true}).click();
 await page.getByRole('heading',{name:'Prepare your team',exact:true}).waitFor();await page.locator('.dp-v4-pacing').scrollIntoViewIfNeeded();
 assert.match(await page.locator('.dp-v4-pacing').innerText(),new RegExp(`Challenge band ${level}`));
 await capture('prepare-classic');await page.getByRole('button',{name:'Look A/B',exact:true}).click();await capture('prepare-look');
 const initial=await page.evaluate(()=>structuredClone(window.__depthReview.battle.initial));assert.deepEqual(initial.enemyStats,s.run.battle.initial.enemyStats);
 await page.evaluate(()=>{window.__a4Pacing={start:performance.now(),bossDeath:null,result:null};const tick=()=>{const m=window.__depthReview,t=window.__a4Pacing,b=m.battle;const boss=b?.actors.find(a=>['yarn-giant','rain-spool','pantry-crown'].includes(a.catalogId));if(boss?.hp===0&&t.bossDeath===null)t.bossDeath=performance.now()-t.start;if(m.screen==='result'&&!m.showBattle)t.result=performance.now()-t.start;else requestAnimationFrame(tick);};requestAnimationFrame(tick);});
 await page.getByRole('button',{name:'Fight',exact:true}).click();await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
 await page.waitForFunction(()=>window.__a4Pacing.result!==null,null,{timeout:240000});
 timing=await page.evaluate(()=>{const b=window.__depthReview.battle;return {...window.__a4Pacing,outcome:b.result,rounds:b.round,actions:b.log.filter(e=>e.kind==='action'||e.kind==='enemy-action').length,initial:b.initial,events:b.v4.events};});
 await capture('result-look');await page.getByRole('button',{name:'Look A/B',exact:true}).click();await capture('result-classic');
 assert.deepEqual(errors,[]);const band=kind==='boss'?[45000,90000]:kind==='elite'?[25000,45000]:[15000,30000];
 timing.targetMs=band;timing.pacing=timing.result>=band[0]&&timing.result<=band[1]?'PASS':'MISS';
 console.log(JSON.stringify({chapter,kind,level,width,wallMs:timing.result,bossDeathMs:timing.bossDeath,postBossMs:timing.bossDeath===null?null:timing.result-timing.bossDeath,outcome:timing.outcome,actions:timing.actions,pacing:timing.pacing}));
}finally{
 await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256,chapter,kind,level,width,method:'Controlled level/unlocked-chapter benchmark at seed23; no claim of earned new-save progression. Preceding nodes use public commands, then save import through UI. Fight includes initial load and x1 playback; no skip or nominal speed change. Real browser captures.',errors,captures,contrasts,timing},null,2));await browser.close();await vite.close();
}
