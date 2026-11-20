// REFERENCE: tools/cardrpg-big2/MechanicsLab.tsx; auto-extras/index.ts. Run under timing lock.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const artifact=resolve(process.env.BIG_ARTIFACT||'docs/cardrpg3b/index.html'),out=process.env.BIG_LAB_OUT||'reports/cardrpg-big2/mechanics/browser';
await mkdir(out,{recursive:true});
const rows=[],errors=[],browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [width,height,cpu,calm] of [[1280,720,1,false],[1440,900,1,false],[1024,600,1,true],[1280,720,4,false]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:calm?'reduce':'no-preference'});
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
  await page.goto('file://'+artifact);
  await page.getByRole('button',{name:'Mechanics lab',exact:true}).click();
  const account=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
  const compact=await page.locator('.b2-lab').getAttribute('data-layout')==='compact';
  if(process.env.BIG_LAB_EXPECT_POLISH==='1')assert.equal(compact,true);
  let masterAlignment;
  if(compact){masterAlignment=await page.locator('.b2-master').evaluate(label=>{
   const box=label.querySelector('input').getBoundingClientRect(),text=document.createRange();
   text.selectNodeContents([...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()));
   const t=text.getBoundingClientRect();return{width:box.width,height:box.height,gap:t.left-box.right,centerOffset:Math.abs((box.top+box.height/2)-(t.top+t.height/2))};
  });assert.ok(masterAlignment.width<=20&&masterAlignment.height<=20&&masterAlignment.gap>=6&&masterAlignment.gap<=16&&masterAlignment.centerOffset<=5,JSON.stringify(masterAlignment));}

  const toggles=page.locator('.b2-lab input[type=checkbox]');assert.equal(await toggles.count(),4);
  for(const box of await toggles.all())assert.equal(await box.isChecked(),false);
  assert.equal(await page.getByRole('navigation',{name:'Cafe screens'}).isVisible(),true);
  assert.equal(await page.locator('.cr-topbar').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`${out}/${width}-${height}-cpu${cpu}-prep.png`});
  await toggles.nth(0).check();for(let i=1;i<4;i++)await toggles.nth(i).check();
  await page.getByRole('button',{name:'Fight experiment',exact:true}).click();
  await page.getByLabel('Playback speed',{exact:true}).selectOption('4');
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.evaluate(()=>{
   const data=window.__labPerf={frames:[],cues:[],last:0,active:true};
   requestAnimationFrame(function frame(at){
    if(!data.active)return;
    const m=window.__mechanicsLab,scene=window.__depthScene;
    if(data.last)data.frames.push({at,ms:at-data.last,calls:scene.stats.calls,triangles:scene.stats.triangles});data.last=at;
    if(m.impactVisible)for(const cue of m.cues){const key=`${cue.round}/${cue.id}/${m.plan.id}`;if(!data.cues.some(c=>c.key===key))data.cues.push({key,...cue,plan:m.plan.presentationCueTargets,visible:document.querySelector('.b2-lab-live').textContent});}
    requestAnimationFrame(frame);
   });
  });
  await page.waitForFunction(()=>!window.__mechanicsLab.watching,null,{timeout:120000});
  const result=await page.evaluate(()=>{
   window.__labPerf.active=false;
   return{...window.__labPerf,battle:window.__mechanicsLab.battle,calm:window.__mechanicsLab.state.settings.reducedMotion,account:JSON.stringify(window.__depthReview.state)};
  });
  assert.equal(result.account,account);assert.equal(result.calm,calm);
  assert.ok(result.cues.length>0);
  for(const cue of result.cues){assert.equal(cue.plan[`auto-extra:${cue.id}`],cue.targetId);assert.ok(cue.visible.includes(cue.label));}
  let resultBounds;
  if(compact){resultBounds=await page.locator('.b2-lab-result').boundingBox();assert.ok(resultBounds.y>=0&&resultBounds.y+resultBounds.height<=height,JSON.stringify(resultBounds));}
  await page.screenshot({path:`${out}/${width}-${height}-cpu${cpu}-result.png`});
  await page.getByRole('button',{name:'Fight experiment',exact:true}).click();
  await page.getByRole('button',{name:'Skip to result',exact:true}).click();
  const skipped=await page.evaluate(()=>window.__mechanicsLab.battle);assert.deepEqual(skipped,result.battle);
  await page.getByRole('button',{name:'Return to cafe',exact:true}).click();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__depthReview.state)),account);
  const times=result.frames.map(f=>f.ms).sort((a,b)=>a-b);
  rows.push({width,height,cpu,calm,compact,masterAlignment,resultBounds,frames:result.frames,cues:result.cues,finalHash:createHash('sha256').update(JSON.stringify(result.battle)).digest('hex'),max:times.at(-1),p95:times[Math.floor(times.length*.95)],calls:Math.max(...result.frames.map(f=>f.calls)),triangles:Math.max(...result.frames.map(f=>f.triangles))});
  await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),rows,errors},null,2));
  await page.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({cases:rows.length,errors,rows:rows.map(({frames,cues,...r})=>({...r,frames:frames.length,cues:cues.length}))}));
}finally{await browser.close()}
