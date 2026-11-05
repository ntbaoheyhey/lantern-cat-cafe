// Natural x4 playback through three waves, loot/rest, equipment preview and boss.
// No controller ticks, skips, health edits or delayed measurement windows.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const out=process.env.CARDRPG_PERF_OUT||'reports/cardrpg/lifecycle-delivery',url='file://'+process.cwd()+'/docs/cardrpg/index.html';await fs.mkdir(out,{recursive:true});
const artifactSha256=createHash('sha256').update(await fs.readFile(new URL(url))).digest('hex');
const widths=process.env.CARDRPG_WIDTHS?JSON.parse(process.env.CARDRPG_WIDTHS):[[1024,600],[1280,720],[1440,900]];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),rows=[],errors=[],warnings=[];
try{for(const [width,height] of widths){
 const p=await browser.newPage({viewport:{width,height}}),cdp=await p.context().newCDPSession(p);
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text())});
 await p.addInitScript(()=>{
  window.__lifecycle={long:[],marks:[],frames:[],record:false,last:0,contexts:0};
  const context=HTMLCanvasElement.prototype.getContext,seen=new WeakSet();HTMLCanvasElement.prototype.getContext=function(...args){const result=context.apply(this,args);if(result&&String(args[0]).startsWith('webgl')&&!seen.has(result)){seen.add(result);window.__lifecycle.contexts++}return result};
  new PerformanceObserver(es=>{if(window.__lifecycle.record)for(const e of es.getEntries())window.__lifecycle.long.push({start:e.startTime,duration:e.duration,stage:window.__turn3dReview?.controller.battle.run.stage})}).observe({type:'longtask'});
  requestAnimationFrame(function tick(t){const x=window.__lifecycle;if(x.record&&x.last)x.frames.push(t-x.last);x.last=t;requestAnimationFrame(tick)});
 });
 await p.goto(url);await p.getByRole('button',{name:/Prepare patrol/}).click();await p.getByRole('button',{name:/Begin patrol/}).click();await p.waitForFunction(()=>window.__turn3dReview?.scene?.ready&&window.__turn3dReview.controller.canChoose);
 if(process.env.CARDRPG_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start')}
 await p.getByLabel('Animation playback rate').selectOption('4');
 await p.evaluate(()=>{window.__retainedScene=window.__turn3dReview.scene;const x=window.__lifecycle;x.contextsAtStart=x.contexts;x.record=true;x.last=0;x.marks.push({event:'start',at:performance.now()})});
 await p.getByLabel('Auto all cats',{exact:true}).check();
 for(let i=0;i<4;i++){
  await p.waitForFunction(()=>!!document.querySelector('.t3-loot')||!!window.__turn3dReview.controller.battle.result&&!window.__turn3dReview.controller.presenter.busy,{},{timeout:180000});
  if(await p.locator('.t3-loot').count()){
   await p.waitForTimeout(500);await p.evaluate(()=>window.__lifecycle.marks.push({event:'loot',at:performance.now()}));
   await p.getByRole('button',{name:/^Keep /}).first().click();await p.waitForTimeout(500);await p.evaluate(()=>window.__lifecycle.marks.push({event:'rest',at:performance.now()}));
   if(i===0){await p.getByRole('button',{name:'Mochi Weapon',exact:true}).click();await p.waitForTimeout(300);await p.getByRole('button',{name:'Close item picker',exact:true}).click()}
   await p.getByRole('button',{name:'Auto-equip best',exact:true}).click();await p.getByRole('button',{name:/Continue patrol|Face the Yarn Giant/}).click();
  }else break;
 }
 const measurement=await p.evaluate(()=>{const x=window.__lifecycle;x.record=false;return {...x,stats:window.__turn3dReview.scene?.stats,result:window.__turn3dReview.controller.battle.result,rendererRetained:window.__turn3dReview.scene===window.__retainedScene}});
 if(process.env.CARDRPG_PROFILE)await fs.writeFile(`${out}/profile-${width}.json`,JSON.stringify(await cdp.send('Profiler.stop')));
 const sorted=[...measurement.frames].sort((a,b)=>a-b);rows.push({width,height,...measurement,p95Ms:sorted[Math.floor((sorted.length-1)*.95)],p99Ms:sorted[Math.floor((sorted.length-1)*.99)]});
 console.log(JSON.stringify({width,long:measurement.long,contexts:measurement.contexts,atStart:measurement.contextsAtStart,result:measurement.result}));await p.close();
}}finally{await browser.close();await fs.writeFile(out+'/measurement.json',JSON.stringify({artifactSha256,date:new Date().toISOString(),method:'Natural x4 presentation and actual Auto rules. Full three waves and boss, including every loot/rest entry, one equipment picker and all continuations. No skip/tick injection. Context creation counted throughout; RAF and Long Tasks include the complete path after loading.',errors,warnings,rows},null,2)+'\n')}
assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);assert.equal(rows.length,widths.length);
for(const r of rows){assert.ok(r.rendererRetained);assert.equal(r.marks.filter(m=>m.event==='rest').length,3);assert.equal(r.result?.winner,'party');assert.equal(r.contexts,r.contextsAtStart,'No new WebGL contexts after loading');assert.deepEqual(r.long,[],'No lifecycle long tasks after loading')}
