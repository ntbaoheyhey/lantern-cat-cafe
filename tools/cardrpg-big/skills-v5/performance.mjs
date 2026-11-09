// Native headless natural-battle samples; registered fixtures, no renderer edits.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from './load.mjs';
const root='reports/cardrpg-big/skills-v5/s8/performance',reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json','utf8'));
const id=process.argv[2],spec=reg.cases.find(c=>c.id===id);assert(spec);
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(await readFile(reg.artifact)),reg.artifactSha256);assert.equal(sha(await readFile(import.meta.filename)),reg.scriptSha256);
const out=root+'/'+id;await mkdir(out,{recursive:true});
assert(!await readFile(out+'/checks.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;}),'Completed observations are not repeated');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720}});
const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:spec.cpu});await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errors=[],remote=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
let complete=false,result;
try{
 await page.addInitScript(()=>{const d=window.__v5Perf={frames:[],last:0};requestAnimationFrame(function sample(at){const m=window.__depthReview,s=window.__depthScene;if(d.last)d.frames.push({at,ms:at-d.last,ready:!!s?.ready,showBattle:!!m?.showBattle,planId:m?.plan?.id??null,skillId:m?.plan?.skillId??null,calls:s?.stats?.calls??null,triangles:s?.stats?.triangles??null});d.last=at;requestAnimationFrame(sample);});});
 await page.goto('file://'+reg.artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 if(spec.fixture){
  const bytes=await readFile(reg.fixture);assert.equal(sha(bytes),reg.fixtureSha256);
  const f=JSON.parse(bytes).fixtures.find(f=>f.id===spec.fixture);assert(f);
  const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts'),battle=R.createBattle(f.initial);await suite.vite.close();
  await page.evaluate(b=>{const m=window.__depthReview;m.state.run=undefined;m.replay=null;m.tutorialBattle=b;m.watching=false;m.sceneStarted=false;m.go('prepare');},battle);
 }else await page.getByRole('button',{name:/Try the practice table/}).click();
 const initial=await page.evaluate(()=>window.__depthReview.battle.initial);assert(initial.skillsV5);
 const begin=await page.evaluate(()=>performance.now());await page.getByRole('button',{name:'Fight',exact:true}).click();await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
 await page.waitForFunction(()=>window.__depthReview.screen==='result'&&!window.__depthReview.showBattle,null,{timeout:600000});
 const ended=await page.evaluate(()=>performance.now());result=await page.evaluate(()=>({frames:window.__v5Perf.frames,battle:window.__depthReview.battle}));
 const casts=result.frames.filter(f=>f.at>=begin&&f.at<=ended&&f.showBattle&&f.planId!==null&&f.ready),whole=result.frames.filter(f=>f.at<=ended);
 assert(casts.length>0,'No ready action frames: timing and draw gates are NOT VERIFIED');
 assert(casts.every(f=>Number.isFinite(f.ms)&&f.ms>0&&Number.isFinite(f.calls)&&f.calls>=0),'Missing or invalid cast telemetry');
 assert(casts.some(f=>f.calls>0&&f.triangles>0),'No rendered geometry was observed during a ready action');
 result={initialSha256:sha(JSON.stringify(initial)),begin,ended,battleMs:ended-begin,...result,castMaxMs:Math.max(0,...casts.map(f=>f.ms)),wholeOpeningMaxMs:Math.max(0,...whole.map(f=>f.ms)),peakDraws:Math.max(0,...casts.map(f=>f.calls??0)),sampledActions:new Set(casts.map(f=>f.planId)).size};
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);complete=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({complete,case:spec,artifactSha256:reg.artifactSha256,result,errors,remote,limits:'One observation per registered case, natural x1. A-owned shell with inherited renderer; B V3 is not integrated. First-use opening includes loading. No unmeasured-case or human-recognition claim.'},null,2));await browser.close();
 console.log(JSON.stringify({id,complete,castMaxMs:result?.castMaxMs,wholeOpeningMaxMs:result?.wholeOpeningMaxMs,peakDraws:result?.peakDraws,battleMs:result?.battleMs}));
}
