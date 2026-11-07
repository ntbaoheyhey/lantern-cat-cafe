// REFERENCE: memory/PROMPT.md ADDENDUM WAITING-L1 item1. Screenshot-free real-click route.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const artifact=resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const artifactSha256=sha(await readFile(artifact));
assert.equal(artifactSha256,process.env.UI_HITCH_SHA,'Pin artifact SHA before recording');
const cpu=Number(process.env.UI_HITCH_CPU||1), traced=process.env.UI_HITCH_TRACE==='1';
const [width,height]=(process.env.UI_HITCH_SIZE||'1280,720').split(',').map(Number);
const output=process.env.UI_HITCH_OUT || `reports/cardrpg-big/ui-hitch/before/cpu${cpu}${traced?'-trace':''}`;
await mkdir(output,{recursive:true});
const receipt={artifact,artifactSha256,harnessSha256:sha(await readFile(import.meta.filename)),cpu,width,height,traced,
  method:'Fresh Chromium context/cache, raw RAF from page open, real clicks and full natural 1/10-pull ceremonies; no screenshots, video, forced layout/capture, or state mutations. Demo stamps are granted through visible controls. Traced runs are diagnostic and separate.',
  errors:[],remote:[],stages:[],fixtures:['Visible Add 1500 demo stamps button twice before route. No level/gear/team fixture.'],started:new Date().toISOString()};
const save=()=>writeFile(`${output}/checks.json`,JSON.stringify(receipt,null,2)+'\n');
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
let page,cdp;
try{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'no-preference'});
  page=await context.newPage();page.setDefaultTimeout(90000);
  page.on('pageerror',e=>receipt.errors.push(String(e)));
  page.on('request',r=>{if(/^https?:/.test(r.url()))receipt.remote.push(r.url());});
  cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.addInitScript(()=>{
    const d=window.__uiHitch={frames:[],marks:[{label:'page-open',at:0}],longTasks:[],longFrames:[],clicks:[],scenes:[],last:0};
    for(const [type,key]of[['longtask','longTasks'],['long-animation-frame','longFrames']]){
      if(PerformanceObserver.supportedEntryTypes.includes(type))new PerformanceObserver(list=>{
        for(const e of list.getEntries())d[key].push(e.toJSON());
      }).observe({type,buffered:true});
    }
    document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)d.clicks.push({text:(b.getAttribute('aria-label')||b.textContent).slice(0,120),at:performance.now()});},true);
    new MutationObserver(()=>{
      if(d.interactive)return;
      if(document.querySelector('.cr-hero button')){d.interactive=performance.now();d.marks.push({label:'first-interactive',at:d.interactive});performance.mark('ui-first-interactive');}
    }).observe(document,{childList:true,subtree:true});
    let previous,serial=0;
    requestAnimationFrame(function sample(now){
      if(d.last)d.frames.push({at:now,ms:now-d.last});d.last=now;
      const scene=window.__depthPreviewScene;
      if(scene!==previous){d.scenes.push({at:now,available:!!scene,serial:scene?++serial:0});previous=scene;}
      requestAnimationFrame(sample);
    });
  });
  if(traced)await cdp.send('Tracing.start',{categories:'devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler',transferMode:'ReturnAsStream'});
  const mark=label=>page.evaluate(label=>{const at=performance.now();window.__uiHitch.marks.push({label,at});performance.mark(`ui-${label}`);return at;},label);
  const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  const step=async(name,action,ready)=>{
    const start=await mark(`${name}:start`);await action();if(ready)await ready();
    await page.waitForTimeout(2200);const end=await mark(`${name}:end`);
    receipt.stages.push({name,start,end});await save();console.log(JSON.stringify({cpu,traced,stage:name}));
  };
  await page.goto('file://'+artifact);
  await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();
  await page.waitForTimeout(6000);receipt.stages.push({name:'cold-hub',start:0,end:await mark('cold-hub:end')});
  await step('fixture-settings',()=>nav('Save & settings'));
  await page.getByRole('button',{name:'Add 1500 demo stamps',exact:true}).click();
  await page.getByRole('button',{name:'Add 1500 demo stamps',exact:true}).click();
  await step('hub',()=>nav('Cafe'));
  for(const [name,label]of[['team','Team & cards'],['collection','Companions'],['equipment','Equipment'],['invitations','Invitations']])await step(name,()=>nav(label));
  await step('one-pull',()=>page.getByRole('button',{name:'Invite once · 150 stamps',exact:true}).click(),()=>page.getByRole('region',{name:'Invitation results',exact:true}).waitFor());
  await step('ten-pull',()=>page.getByRole('button',{name:'Invite ten · 1500 stamps',exact:true}).click(),async()=>{
    await page.getByRole('button',{name:'Skip reveal',exact:true}).waitFor();
    await page.getByRole('region',{name:'Invitation results',exact:true}).waitFor();
  });
  assert.equal(await page.locator('.dp-batch-grid > article').count(),10);
  await step('return-hub',()=>nav('Cafe'));
  await step('route-map',()=>page.getByRole('button',{name:/^Tangled Cafe/}).click());
  await step('prepare',()=>page.locator('.dp-node:enabled').first().click(),()=>page.getByRole('heading',{name:'Prepare your team',exact:true}).waitFor());
  await step('fight',()=>page.getByRole('button',{name:'Fight',exact:true}).click(),()=>page.waitForFunction(()=>window.__depthReview.battle.choices.length>=1));
  await step('result',()=>page.getByRole('button',{name:'Skip to result',exact:true}).click(),()=>page.getByRole('button',{name:'Continue to rewards',exact:true}).waitFor());
  await step('rewards-map',async()=>{
    await page.getByRole('button',{name:'Continue to rewards',exact:true}).click();
    const reward=page.locator('.dp-reward');if(await reward.count())await reward.first().click();
    await nav('Night route');
  });
  receipt.complete=true;
}catch(error){receipt.failure=String(error);throw error;}
finally{
  if(page){
    const raw=await page.evaluate(()=>window.__uiHitch).catch(()=>null);
    if(raw){
      await writeFile(`${output}/raw.json`,JSON.stringify(raw)+'\n');
      receipt.rawSha256=sha(await readFile(`${output}/raw.json`));receipt.firstInteractive=raw.interactive;
      const stats=frames=>{const s=frames.map(f=>f.ms).sort((a,b)=>a-b);return{frames:s.length,max:s.at(-1)||0,p95:s[Math.floor(s.length*.95)]||0,above25:s.filter(n=>n>25).length,above50:s.filter(n=>n>50).length,above100:s.filter(n=>n>100).length};};
      receipt.afterInteractive=stats(raw.frames.filter(f=>f.at>=raw.interactive));
      for(const stage of receipt.stages){stage.stats=stats(raw.frames.filter(f=>f.at>=Math.max(stage.start,raw.interactive||0)&&f.at-f.ms<=stage.end));stage.pass=stage.stats.max<=(cpu===1?50:100);}
      receipt.sceneCreations=raw.scenes.filter(s=>s.available).length;
    }
  }
  if(traced&&cdp){
    const complete=new Promise(done=>cdp.once('Tracing.tracingComplete',done));await cdp.send('Tracing.end');
    const {stream}=await complete;let trace='';
    for(;;){const chunk=await cdp.send('IO.read',{handle:stream});trace+=chunk.data;if(chunk.eof)break;}
    await cdp.send('IO.close',{handle:stream});await writeFile(`${output}/trace.json.gz`,gzipSync(trace));
    receipt.traceSha256=sha(await readFile(`${output}/trace.json.gz`));
  }
  receipt.ended=new Date().toISOString();await save();await browser.close();
  console.log(JSON.stringify({output,complete:receipt.complete,summary:receipt.afterInteractive,scenes:receipt.sceneCreations,failure:receipt.failure}));
}
