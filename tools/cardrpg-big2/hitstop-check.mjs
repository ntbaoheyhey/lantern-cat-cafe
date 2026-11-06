// REFERENCE: turn3d/card-impact.ts; real mixer and effect-frame samples in the offline build.
import{chromium}from'../../apps/web/node_modules/@playwright/test/index.mjs';
import{mkdir,writeFile,readFile}from'node:fs/promises';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const artifact=process.env.BIG_ARTIFACT||'/tmp/cardrpg-big2-hitstop-index.html',out='reports/cardrpg-big2/audio/hitstop';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),errors=[],rows=[];
try{const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));await page.goto('file://'+artifact);await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).click();await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 const ids=await page.evaluate(()=>window.__depthReview.galleryActions.filter(a=>/^[a-z]+-[1-4]$/.test(a.id)||a.id.startsWith('enemy:')).map(a=>a.id));
 for(const id of ids){await page.evaluate(id=>window.__depthReview.inspect(id,0),id);await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
  const row=await page.evaluate(id=>{const m=window.__depthReview,s=window.__depthScene,p=s.puppets.get(m.plan.actorId),impact=m.plan.beats.find(b=>b.kind==='impact');const samples=[];
   for(const reducedMotion of[false,true])for(const offset of[0,20,90]){m.state.settings.reducedMotion=reducedMotion;m.animationAt=impact.start+Math.min(offset,impact.duration-1);s.render({...s.view(),reducedMotion,frame:m.frame,fixedTime:10},0);samples.push({reducedMotion,offset,progress:m.frame.progress,clip:p.clip,time:p.actions.get(p.clip)?.time,shake:m.frame.shake,head:p.head?.quaternion.toArray()});}
   return{id,duration:m.plan.duration,impact:impact.duration,samples};},id);
  assert.equal(row.samples[0].clip,id);assert.equal(row.samples[1].clip,id);assert.ok(row.samples[4].progress>0);assert.equal(row.samples[4].shake,0);rows.push(row);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Three real mixer samples per impact and reduced-motion variant. Same action durations; no extra battle wait.',rows,errors},null,2));}
console.log(JSON.stringify({actions:rows.length,errors}));
