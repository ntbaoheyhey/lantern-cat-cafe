// REFERENCE: turn3d/card-boss-{motion,performance}.ts. Deterministic presentation fixtures, not natural phase timing.
import{chromium}from'../../apps/web/node_modules/@playwright/test/index.mjs';
import{mkdir,writeFile,readFile,mkdtemp,rm}from'node:fs/promises';
import{resolve}from'node:path';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
const artifact=resolve(process.env.BIG_ARTIFACT||'/tmp/cardrpg-big2-boss-index.html'),out='reports/cardrpg-big2/enemies/boss/lifecycle';
await mkdir(out,{recursive:true});const temporary=await mkdtemp('/tmp/cardrpg-big2-boss-frames-');
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const errors=[],rows=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('file://'+artifact);await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).click();await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 for(const owner of ['yarn-giant','rain-spool','pantry-crown'])for(const state of ['intro','phase']){
  await page.evaluate(id=>window.__depthReview.inspect(`enemy:${id}`,0),owner);
  await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
  const frames=[],checks=[];
  await page.evaluate(({owner,state})=>{const s=window.__depthScene,p=[...s.puppets.values()].find(p=>p.asset===owner);p.enteredAt=state==='intro'?10:-100;p.bossPhase=state==='phase'?2:1;p.phaseAt=state==='phase'?10:-100;}, {owner,state});
  for(let i=0;i<8;i++){
   const check=await page.evaluate(({owner,state,progress})=>{
    const s=window.__depthScene,m=window.__depthReview,p=[...s.puppets.values()].find(p=>p.asset===owner),id=m.plan.actorId;
    s.render({...s.view(),frame:null,currentId:null,targetIds:[],fixedTime:10+progress*(state==='intro'?1.14:.30),bossPhases:{[id]:state==='intro'?1:2}},0);
    const r=s.renderer.domElement.getBoundingClientRect();
    return{progress,clip:p.clip,clipTime:p.actions.get(p.clip)?.time,bounds:s.audit().units.find(a=>a.id===id).box,rect:{x:r.x,y:r.y,width:r.width,height:r.height},stats:{...s.stats},visibleBossDraws:s.bossAtmosphere.root.children.filter(c=>c.visible).length};
   },{owner,state,progress:i/8});
   if(check.clip!==`boss-${state}`)throw Error(`Expected ${state} pose, saw ${check.clip}`);
   const path=resolve(temporary,`${owner}-${state}-${i}.png`);await page.screenshot({path,clip:check.rect});frames.push(path);checks.push(check);
  }
  rows.push({owner,state,name:`${owner} · ${state}`,frames,bounds:checks.map(c=>c.bounds),checks,output:resolve(`${out}/${owner}-${state}.webp`)});
 }
 const calm=[];
 for(const owner of ['yarn-giant','rain-spool','pantry-crown']){
  await page.evaluate(id=>window.__depthReview.inspect(`enemy:${id}`,0),owner);await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
  const poses=await page.evaluate(owner=>{const s=window.__depthScene,m=window.__depthReview,p=[...s.puppets.values()].find(p=>p.asset===owner),id=m.plan.actorId;return[10,10.1,10.2].map(t=>{s.render({...s.view(),frame:null,currentId:null,targetIds:[],fixedTime:t,reducedMotion:true,bossPhases:{[id]:2}},0);return{clip:p.clip,head:p.head.quaternion.toArray(),camera:s.camera.position.toArray(),zoom:s.camera.zoom}})},owner);
  if(new Set(poses.map(p=>JSON.stringify(p))).size!==1)throw Error(`Reduced motion differs for ${owner}`);calm.push({owner,poses});
 }
 const manifest=resolve(temporary,'frames.json');await writeFile(manifest,JSON.stringify(rows));execFileSync('/tmp/cardrpg-big-tools/bin/python',['tools/cardrpg-big/motion-sheets.py',manifest],{stdio:'inherit'});
 for(const r of rows){delete r.frames;r.sha256=createHash('sha256').update(await readFile(r.output)).digest('hex');}
 await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Eight direct scene-render samples per boss introduction/phase. Rule state unmodified; fixedTime drives bounded animation. This is not a natural battle timing measurement.',rows,calm,errors},null,2));
 console.log(JSON.stringify({filmstrips:rows.length,calm:calm.length,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();await rm(temporary,{recursive:true,force:true})}
