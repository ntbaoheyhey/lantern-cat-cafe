import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
// Uses actual controls and the actual presenter/rules. Only animation waiting is accelerated.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const base=process.env.CARDRPG_URL||'http://127.0.0.1:5523/?demo&squad=1&cardrpg=1&squadDebug=1',out=process.env.CARDRPG_CHECK_OUT||'reports/cardrpg/path';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),rows=[],errors=[],requests=[],writes=[];
try{for(const [width,height] of [[1024,600],[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(base.startsWith('file:')&&!/^(file:|data:|blob:)/.test(r.url()))requests.push(r.url())});
 await page.exposeFunction('__storageWrite',s=>writes.push(s));await page.addInitScript(()=>{for(const name of ['setItem','removeItem','clear'])Storage.prototype[name]=function(){window.__storageWrite('Storage.'+name);throw Error('Storage write forbidden')};indexedDB.open=()=>{window.__storageWrite('indexedDB.open');throw Error('No database')};Object.defineProperty(document,'cookie',{set(){window.__storageWrite('cookie');throw Error('No cookie')},get(){return ''}})});
 await page.goto(base);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();
 const shot=async(id)=>page.screenshot({path:`${out}/${width}-${id}.png`});await shot('hub');
 await page.getByRole('button',{name:'Equipment ↗'}).click();await page.getByLabel('Equip for',{exact:true}).selectOption({index:0});
 await page.getByRole('button',{name:'Equip again',exact:true}).click();assert.equal(await page.evaluate(()=>window.__cardrpgReview.error),false);await shot('equipment');
 await page.getByRole('button',{name:'Invitations',exact:false}).first().click();
 const before=await page.evaluate(()=>structuredClone(window.__cardrpgReview.state));await page.getByRole('button',{name:/Invite once/}).click();await page.getByRole('button',{name:'Reveal invitation results'}).click();await page.locator('.cr-revealed').first().waitFor();
 const drawn=await page.evaluate(()=>structuredClone(window.__cardrpgReview.state));assert.equal(drawn.history.length,before.history.length+1);assert.ok(drawn.currencies.stamps<before.currencies.stamps);await shot('draw');
 await page.getByRole('button',{name:'Cafe',exact:true}).click();await page.getByRole('button',{name:/Prepare patrol/}).click();await page.getByRole('button',{name:/Begin patrol/}).click();
 await page.waitForFunction(()=>window.__turn3dReview?.scene?.ready&&window.__turn3dReview.controller.canChoose&&window.__turn3dReview.scene.stats.loaded===window.__turn3dReview.view().actors.length&&document.querySelectorAll('.t3-anchor').length===window.__turn3dReview.view().actors.length);
 const viewport=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth}));assert.equal(viewport.height,height);assert.equal(viewport.width,width);await shot('battle');const audit=await page.evaluate(()=>({models:window.__turn3dReview.scene.audit(),labels:window.__turn3dReview.scene.labelAudit}));assert.deepEqual(audit.models.outside,[]);assert.deepEqual(audit.models.overlaps,[]);assert.deepEqual(audit.labels.missing,[]);assert.equal(audit.labels.overlaps,0);
 await page.getByLabel('Auto all cats',{exact:true}).check();await page.getByLabel('Animation playback rate').selectOption('4');
 let steps=0;const stages=[];
 while(!await page.evaluate(()=>!!window.__turn3dReview.controller.battle.result)){
  await page.evaluate(()=>{const c=window.__turn3dReview.controller;for(let i=0;i<8;i++){if(c.presenter.busy)c.skip();c.tick(100);if(['loot','rest'].includes(c.battle.run.stage))break}});
  const stage=await page.evaluate(()=>{const b=window.__turn3dReview.controller.battle;return {stage:b.run.stage,wave:b.wave,round:b.round}});
  if(stage.stage==='loot'){stages.push(stage);await shot(`wave-${stage.wave+1}-loot`);await page.getByRole('button',{name:/^Keep /}).first().click()}
  if(stage.stage==='rest'||await page.getByRole('button',{name:/Continue patrol|Face the Yarn Giant/}).count()){await page.getByRole('button',{name:'Auto-equip best',exact:true}).click();await page.getByRole('button',{name:/Continue patrol|Face the Yarn Giant/}).click()}
  if(++steps>2000)throw Error('Battle made no completion progress');
 }
 await page.evaluate(()=>{const c=window.__turn3dReview.controller;while(c.presenter.busy)c.skip();c.notify()});
 assert.equal(await page.locator('.t3-fallback').count(),0,'Full journey must retain 3D rendering');const battle=await page.evaluate(()=>window.__turn3dReview.controller.battle.result);assert.equal(battle.winner,'party','Starter path should complete Yarn Giant');assert.equal(battle.wavesCleared,3);
 await page.getByRole('button',{name:/Collect patrol rewards/}).click();await page.getByRole('heading',{name:'Something to bring home.'}).waitFor();await shot('rewards');
 assert.equal(await page.evaluate(()=>window.__cardrpgReview.error),false);assert.equal(await page.evaluate(()=>window.__cardrpgReview.state.pendingRun),null);
 await page.getByRole('button',{name:'Enhance a favourite'}).click();const level=await page.evaluate(()=>{const m=window.__cardrpgReview;return m.state.inventory.items.find(i=>i.id===m.itemId).enhancement});await page.getByRole('button',{name:'Enhance equipment',exact:true}).click();assert.equal(await page.evaluate(()=>{const m=window.__cardrpgReview;return m.state.inventory.items.find(i=>i.id===m.itemId).enhancement}),level+1);await shot('enhance');
 await page.getByRole('button',{name:'Companions',exact:false}).first().click();await page.locator('.cr-card-grid').waitFor();await shot('collection');await page.getByRole('button',{name:'Field guide',exact:false}).click();await page.getByRole('heading',{name:'Know what matters.'}).waitFor();await shot('codex');
 rows.push({width,height,stages,battle,steps,draws:drawn.history.length,enhanced:true,viewport,audit});await page.close();console.log(JSON.stringify(rows.at(-1)));
}}finally{await browser.close();await fs.writeFile(`${out}/check.json`,JSON.stringify({artifactSha256:base.startsWith('file:')?createHash('sha256').update(await fs.readFile(fileURLToPath(base))).digest('hex'):null,date:new Date().toISOString(),base,rows,errors,requests,writes,method:'Real UI setup, draw and rewards; real battle auto rules with presenter skip/tick acceleration, no HP/reward edits.'},null,2))}
assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(writes,[]);
