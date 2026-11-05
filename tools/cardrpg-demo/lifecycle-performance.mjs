// Real x4 playback across the full first wave, loot and rest, with no controller tick/skip.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const out='reports/cardrpg/lifecycle-delivery',url='file://'+process.cwd()+'/docs/cardrpg/index.html';await fs.mkdir(out,{recursive:true});
const artifactSha256=createHash('sha256').update(await fs.readFile(new URL(url))).digest('hex');
const b=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],warnings=[];
p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text())});
try{
 await p.addInitScript(()=>{window.__lifecycle={long:[],marks:[],frames:[],record:false,last:0};new PerformanceObserver(es=>{if(window.__lifecycle.record)for(const e of es.getEntries())window.__lifecycle.long.push({start:e.startTime,duration:e.duration,stage:window.__turn3dReview?.controller.battle.run.stage})}).observe({type:'longtask'});requestAnimationFrame(function tick(t){const x=window.__lifecycle;if(x.record&&x.last)x.frames.push(t-x.last);x.last=t;requestAnimationFrame(tick)})});
 await p.goto(url);await p.getByRole('button',{name:/Prepare patrol/}).click();await p.getByRole('button',{name:/Begin patrol/}).click();await p.waitForFunction(()=>window.__turn3dReview?.scene?.ready&&window.__turn3dReview.controller.canChoose);
 await p.getByLabel('Animation playback rate').selectOption('4');await p.getByLabel('Auto all cats',{exact:true}).check();await p.evaluate(()=>{window.__lifecycle.record=true;window.__lifecycle.marks.push({event:'start',at:performance.now()})});
 await p.getByRole('button',{name:/^Keep /}).first().waitFor({timeout:180000});await p.waitForTimeout(1000);await p.evaluate(()=>window.__lifecycle.marks.push({event:'loot',at:performance.now()}));
 await p.getByRole('button',{name:/^Keep /}).first().click();await p.waitForTimeout(1000);await p.evaluate(()=>window.__lifecycle.marks.push({event:'rest',at:performance.now()}));
 await p.getByRole('button',{name:'Auto-equip best',exact:true}).click();await p.waitForTimeout(500);await p.getByRole('button',{name:/Continue patrol/}).click();await p.waitForTimeout(2200);
 const measurement=await p.evaluate(()=>{window.__lifecycle.record=false;const x=window.__lifecycle;return {...x,stats:window.__turn3dReview.scene?.stats,stage:window.__turn3dReview.controller.battle.run.stage,hasScene:!!window.__turn3dReview.scene}});
 assert.ok(measurement.hasScene);await fs.writeFile(out+'/measurement.json',JSON.stringify({artifactSha256,date:new Date().toISOString(),method:'Natural x4 presentation, real auto rules. Entire first wave, loot entry, rest and next wave. No skip/tick injection. Timings include miniature preview creation and disposal.',errors,warnings,...measurement},null,2)+'\n');console.log(JSON.stringify({long:measurement.long,marks:measurement.marks,errors,warnings}));
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);
}finally{await b.close()}
