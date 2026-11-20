/** Real browser playback through the judge route at 1x, without clock or combat overrides. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const origin=process.env.DEMO_ORIGIN??'http://127.0.0.1:6301';
const out=resolve(process.env.DEMO_OUTPUT??'work/v9/CXI/browser');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--mute-audio']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 const loaded=new Set(),failedPortraits=[];
 page.on('response',response=>{
  const path=new URL(response.url()).pathname;
  if(response.ok())loaded.add(path);
  else if(/\/units\/[^/]+\/portrait\.webp$/.test(path))failedPortraits.push(path);
 });
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${origin}/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`);
 const play=page.getByRole('button',{name:'Play free',exact:true});
 await play.or(page.getByRole('button',{name:'Guard the café',exact:true})).waitFor({timeout:45000});
 if(await play.isVisible())await play.click();
 await page.getByRole('button',{name:'Guard the café',exact:true}).waitFor({timeout:45000});
 await page.screenshot({path:resolve(out,'intro.png')});
 await page.getByRole('button',{name:'Collection',exact:true}).click();
 assert.equal(await page.locator('.judge-collection figure').count(),12);
 await page.getByRole('button',{name:'Back to café',exact:true}).click();
 await page.getByRole('button',{name:'Guard the café',exact:true}).click();
 await page.waitForFunction(()=>window.__depthReview?.battle?.initial.enemies.includes('needle-moth'));
 assert.deepEqual(await page.evaluate(()=>window.__depthReview.battle.actors.filter(a=>a.side==='party').map(a=>a.catalogId)),['mochi','clover','soot']);
 await page.waitForFunction(()=>window.__depthReview?.sceneReady===true);
 await page.screenshot({path:resolve(out,'wave.png')});
 await page.getByRole('button',{name:'Face the Yarn Giant',exact:true}).waitFor({timeout:90000});
 assert.deepEqual(failedPortraits,[],'HUD portraits must not 404');
 for(const id of ['needle-moth','teacup-healer','button-guard']){
  assert([...loaded].some(path=>path.includes(`/${id}-`)&&path.endsWith('.webp')),`${id} HUD portrait was not served`);
 }
 console.log('PASS street wave: three cats, needle-moth + teacup-healer + button-guard.');
 // Observe presentations as they run; do not drive the simulation from the test.
 await page.evaluate(()=>{
  window.__demoSeen=[];window.__demoLastPlan=null;
  window.__demoObserver=setInterval(()=>{
   const m=window.__depthReview,p=m?.plan;
   if(p&&p!==window.__demoLastPlan){window.__demoLastPlan=p;if(p.ultimate&&['mochi','clover','soot'].includes(p.actorId))window.__demoSeen.push({id:p.skillId,at:performance.now()});}
  },10);
 });
 const started=Date.now();
 await page.getByRole('button',{name:'Face the Yarn Giant',exact:true}).click();
 await page.waitForFunction(()=>window.__demoSeen.length===1,{},{timeout:45000});
 await page.screenshot({path:resolve(out,'boss.png')});
 await page.getByRole('heading',{name:'The last lantern stays lit',exact:true}).waitFor({timeout:75000});
 const elapsed=Date.now()-started,ults=await page.evaluate(()=>{clearInterval(window.__demoObserver);return window.__demoSeen;});
 assert.deepEqual(ults.map(u=>u.id),['mochi-4','clover-4','soot-4']);
 assert(elapsed<75000,`Boss playback exceeded 75s: ${elapsed}ms`);
 await page.screenshot({path:resolve(out,'victory.png')});
 console.log(`PASS boss in ${(elapsed/1000).toFixed(1)}s: Mochi → Clover → Soot; victory.`);
 if(process.argv.includes('--v9-deliveries')){
  for(const id of ['mochi','clover'])assert(loaded.has(`/units/${id}/designer/idle.webm`),`${id} delivered idle was not loaded`);
  const packs=await page.evaluate(()=>window.__thAudio?.diagnostics.packs??[]);
  for(const scene of ['battle','boss'])assert(packs.includes(`v9:${scene}-v9`),`${scene} delivered music was not decoded`);
  console.log('PASS delivered Mochi/Clover video loads and V9 battle/boss music decode. Soot remains on its fallback rig.');
 }
 if(process.argv.includes('--v9-recording')){
  const hits=await page.evaluate(()=>window.__thAudio?.hits??[]);
  for(const cat of ['mochi','clover','soot'])for(const layer of ['riser','transient','body','tail']){
   const id=`sfx.ult.${cat}.${layer}`;
   assert(hits.some(hit=>hit.id===id&&hit.result==='played'),`${id} did not play through the delivered director/engine wiring`);
  }
  for(const id of ['impact-core','shockwave-ring','smoke-embers','lantern-dome','tea-clover','comet-loop','fire-dome','rune-circle']){
   for(const ext of ['json','webp'])assert(loaded.has(`/vfx/v9/${id}.${ext}`),`${id}.${ext} was not loaded`);
  }
  console.log('PASS recording bundle: all 12 AGS ultimate layers played and all 8 CXV flipbooks loaded.');
 }
 if(process.argv.includes('--chain-ui')){
  await page.getByRole('button',{name:'Preview receipt fixture',exact:true}).click();
  const fixture=page.getByRole('status',{name:'Fixture receipt — no transaction'});
  await fixture.waitFor();assert.equal(await fixture.locator('a').count(),0);
  await page.screenshot({path:resolve(out,'receipt-fixture.png')});
  await page.getByRole('button',{name:'Dismiss receipt',exact:true}).click();
  await page.getByRole('button',{name:'Collection',exact:true}).click();
  await page.getByLabel('Wallet address',{exact:true}).fill('0x0000000000000000000000000000000000000001');
  await page.getByRole('button',{name:'Read Fuji Relics',exact:true}).click();
  await page.getByText('Owned on Avalanche Fuji',{exact:true}).waitFor({timeout:90000});
  assert(await page.getByText('No Relics in this wallet.',{exact:true}).isVisible());
  console.log('PASS labelled receipt fixture (no explorer link) and live Fuji RPC Collection without backend.');
 }
 await page.goto(`${origin}/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&legacy=1`);
 const begin=page.getByRole('button',{name:'Start playing',exact:true});
 await begin.or(page.getByRole('heading',{name:'Taskbar Hero',exact:true})).waitFor({timeout:30000});
 if(await begin.isVisible())await begin.click();
 await page.getByRole('heading',{name:'Taskbar Hero',exact:true}).waitFor({timeout:30000});
 assert.equal(await page.locator('.judge-demo-v9').count(),0);
 assert.deepEqual(errors,[]);
 console.log(`PASS boss in ${(elapsed/1000).toFixed(1)}s: Mochi → Clover → Soot; victory, Collection and legacy route passed.`);
}finally{await browser.close();}
