// Measures real wave-entry rendering separately from the per-recipe cast gallery.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const out=process.env.CARDRPG_PERF_OUT||'reports/cardrpg/performance-final',url=process.env.CARDRPG_URL||'file://'+process.cwd()+'/docs/cardrpg/index.html';await fs.mkdir(out,{recursive:true});
const artifactSha256=url.startsWith('file:')?createHash('sha256').update(await fs.readFile(fileURLToPath(url))).digest('hex'):null;
const widths=process.env.CARDRPG_WIDTHS?JSON.parse(process.env.CARDRPG_WIDTHS):[[1024,600],[1280,720],[1440,900]];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),rows=[],errors=[];
try{for(const [width,height]of widths){
 const p=await browser.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(String(e)));
 const cdp=await p.context().newCDPSession(p);if(process.env.CARDRPG_PROFILE)await cdp.send('Profiler.enable');
 await p.addInitScript(()=>{window.__perf={long:[],raf:[],record:false,last:0};new PerformanceObserver(es=>{if(window.__perf.record)window.__perf.long.push(...es.getEntries().map(e=>({start:e.startTime,duration:e.duration})))}).observe({type:'longtask',buffered:false});requestAnimationFrame(function tick(t){const x=window.__perf;if(x.record&&x.last)x.raf.push(t-x.last);x.last=t;requestAnimationFrame(tick)})});
 await p.goto(url);await p.getByRole('button',{name:/Prepare patrol/}).click();await p.getByRole('button',{name:/Begin patrol/}).click();await p.waitForFunction(()=>window.__turn3dReview?.scene?.ready&&window.__turn3dReview.controller.canChoose);await p.evaluate(()=>{window.__retainedScene=window.__turn3dReview.scene});await p.getByLabel('Auto all cats',{exact:true}).check();
 for(let guard=0;guard<2000;guard++){
  await p.evaluate(()=>{const c=window.__turn3dReview.controller;for(let n=0;n<8;n++){if(c.presenter.busy)c.skip();c.tick(100);if(['loot','rest'].includes(c.battle.run.stage)||c.battle.result)break}});
  const s=await p.evaluate(()=>({stage:window.__turn3dReview.controller.battle.run.stage,result:window.__turn3dReview.controller.battle.result}));if(s.result)break;
  if(s.stage==='loot')await p.getByRole('button',{name:/^Keep /}).first().click();
  if(await p.getByRole('button',{name:/Continue patrol|Face the Yarn Giant/}).count()){
   await p.getByRole('button',{name:'Auto-equip best',exact:true}).click();
   const restingFrames=await p.evaluate(()=>window.__turn3dReview.scene.stats.frames);await p.waitForTimeout(80);
   assert.equal(await p.evaluate(()=>window.__turn3dReview.scene.stats.frames),restingFrames,'Hidden preparation must not render');
   assert.ok(await p.evaluate(()=>window.__turn3dReview.scene===window.__retainedScene),'Preparation must retain the renderer');
   if(process.env.CARDRPG_PROFILE)await cdp.send('Profiler.start');
   await p.evaluate(()=>{Object.assign(window.__perf,{long:[],raf:[],record:true,last:0})});await p.getByRole('button',{name:/Continue patrol|Face the Yarn Giant/}).click();await p.waitForTimeout(2200);
   const x=await p.evaluate(()=>{window.__perf.record=false;return {wave:window.__turn3dReview.controller.battle.wave,rendererRetained:window.__turn3dReview.scene===window.__retainedScene,raf:window.__perf.raf,longTasks:window.__perf.long}});assert.ok(x.rendererRetained);const sorted=[...x.raf].sort((a,b)=>a-b);rows.push({width,height,...x,p95Ms:sorted[Math.floor((sorted.length-1)*.95)],p99Ms:sorted[Math.floor((sorted.length-1)*.99)]});
   if(process.env.CARDRPG_PROFILE)await fs.writeFile(`${out}/transition-profile-${width}-${x.wave}.json`,JSON.stringify(await cdp.send('Profiler.stop')));
  }
 }
 await p.close();console.log(JSON.stringify({width,transitions:rows.filter(r=>r.width===width).length}));
}}finally{await browser.close();await fs.writeFile(out+'/transitions.json',JSON.stringify({artifactSha256,date:new Date().toISOString(),url,method:'Actual file UI wave/rest entry with auto-equip. Rules accelerated only outside each 2.2 second measurement window. Raw RAF and Long Tasks retained.',rows,errors},null,2)+'\n')}
assert.deepEqual(errors,[]);assert.equal(rows.length,widths.length*3);
