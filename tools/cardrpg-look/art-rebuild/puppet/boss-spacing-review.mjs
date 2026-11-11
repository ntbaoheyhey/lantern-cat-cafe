// Wide boss separation at idle/impact in the same current A6 HUD and camera.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {audit} from '../../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),artifacts=[['before',resolve(process.env.ART_BEFORE)],['after',resolve(process.env.ART_ARTIFACT)]];
const replay=JSON.parse(await readFile('reports/cardrpg-look/art-rebuild/p10/level6/boss-replay.json','utf8'));
await mkdir(out,{recursive:true});const result={errors:[],rows:[]},tiles=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [version,artifact] of artifacts){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));
  await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const [width,height] of [[1440,900],[1280,720]])for(const pose of ['idle','impact']){
   await page.setViewportSize({width,height});await page.waitForFunction(({width,height})=>{const s=window.__depthScene;return s.width===width&&s.height===height-230;},{width,height});await page.evaluate(pose=>{const m=window.__depthReview;m.inspect('enemy:rain-spool',0);m.galleryBattle.initial.gameplayA6=true;if(pose==='idle')m.plan=null;else{const impact=m.plan.beats.find(b=>b.kind==='impact');m.animationAt=impact.start+impact.duration*.5;}m.notify(false);},pose);
   await page.waitForFunction(()=>{const s=window.__depthScene;return s?.ready&&window.__depthReview.sceneReady&&[...s.puppets.values()].some(p=>p.asset==='rain-spool')&&s.view().actors.every(a=>s.puppets.has(a.id));});
   const state=await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:12,paused:true},0);s.render({...s.view(),fixedTime:12,paused:true},0);s.dirty=false;const bounds=s.audit(),boss=[...s.puppets.values()].find(p=>p.asset==='rain-spool');return{bounds,faceHp:s.labelAudit.overlaps,base:boss.base.toArray(),scale:boss.root.scale.toArray(),cameraZoom:s.camera.zoom,a6Hud:document.querySelectorAll('.a6-hud-portrait').length};});
   const boss=state.bounds.units.find(u=>u.side==='enemy').box,front=state.bounds.units.find(u=>u.id==='mochi').box;
   result.rows.push({version,width,height,pose,...state,gap:boss.x-front.x-front.width,ui:await page.evaluate(audit)});
   if(width===1440){const index=version==='before'?0:1,row=pose==='idle'?0:1;tiles.push({input:await sharp(await page.screenshot()).resize(960,600).toBuffer(),left:index*960,top:row*630+30});tiles.push({input:Buffer.from(`<svg width="960" height="30"><text x="12" y="22" fill="#fff0d2" font-size="17">${version} · Rain Spool ${pose}</text></svg>`),left:index*960,top:row*630});}
  }
  // The same boss also appears with live rules-owned Binding Thread adds.
  // Inspect their face/HP lanes as well as the isolated signature fixture.
  for(const bossId of ['rain-spool','yarn-giant','pantry-crown'])for(const [width,height] of [[1440,900],[1280,720]]){
   await page.setViewportSize({width,height});await page.waitForFunction(({width,height})=>{const s=window.__depthScene;return s.width===width&&s.height===height-230;},{width,height});await page.evaluate(({replay,bossId})=>{const m=window.__depthReview;m.galleryBattle=null;m.tutorialBattle=null;m.state=replay.account;m.screen='hub';m.state.lastBattle={...replay.setup,chapter:bossId==='rain-spool'?2:bossId==='pantry-crown'?3:1,enemies:[bossId]};m.state.lastChoices=replay.choices;m.replayLast();m.paused=true;m.notify(false);},{replay,bossId});
   await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady&&window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
   const state=await page.evaluate(bossId=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:12,paused:true},0);s.render({...s.view(),fixedTime:12,paused:true},0);s.dirty=false;const boss=[...s.puppets.values()].find(p=>p.asset===bossId);const faces=[...s.puppets.entries()].filter(([,p])=>p.asset==='binding-thread').map(([id,p])=>{const v=p.base.clone();p.head.getWorldPosition(v);v.y+=.2*p.root.scale.y;v.project(s.camera);return{id,x:(v.x*.5+.5)*s.width,y:(.5-v.y*.5)*s.height,depth:v.z,base:p.base.toArray()};});return{bounds:s.audit(),faces,faceHp:s.labelAudit.overlaps,missing:s.labelAudit.missing,base:boss.base.toArray(),scale:boss.root.scale.toArray(),cameraZoom:s.camera.zoom,a6Hud:document.querySelectorAll('.a6-hud-portrait').length};},bossId);
   const boss=state.bounds.units.find(u=>u.id==='foe-0-'+bossId).box,front=state.bounds.units.find(u=>u.id==='mochi').box;
   result.rows.push({version,width,height,pose:bossId+'-live-with-adds',...state,gap:boss.x-front.x-front.width,ui:await page.evaluate(audit)});
   if(version==='after')await sharp(await page.screenshot()).webp({quality:87}).toFile(out+'/'+bossId+'-live-'+width+'.webp');
  }
  await page.close();
 }
 await sharp({create:{width:1920,height:1260,channels:3,background:'#173039'}}).composite(tiles).webp({quality:87}).toFile(out+'/rain-spool-spacing.webp');
}finally{await browser.close();await writeFile(out+'/spacing-review.json',JSON.stringify(result,null,2)+'\n');}
const failures=[];
for(const after of result.rows.filter(r=>r.version==='after')){const before=result.rows.find(r=>r.version==='before'&&r.width===after.width&&r.pose===after.pose);if((after.pose.includes('rain-spool')||!after.pose.includes('live-with-adds'))&&after.gap<=before.gap+20||after.bounds.outside.length||after.faceHp||after.ui.overlaps.length||after.a6Hud!==3||after.bounds.width!==after.width||after.bounds.height!==after.height-230||after.missing?.length||JSON.stringify(after.scale)!==JSON.stringify(before.scale))failures.push(after.width+'-'+after.pose);}
console.log(JSON.stringify({screens:result.rows.length,errors:result.errors,failures,gaps:result.rows.map(r=>({version:r.version,width:r.width,pose:r.pose,gap:r.gap}))}));if(result.errors.length||failures.length)process.exitCode=1;
