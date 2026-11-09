// Targeted fallback HUD checks; not the later Z screenshot pack or human recognition test.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from './load.mjs';
const require=createRequire(resolve('apps/web/package.json')),{chromium}=require('@playwright/test');
const out=process.env.V5_UI_OUT,artifact=process.env.V5_UI_ARTIFACT;assert(out&&artifact);await mkdir(out,{recursive:true});
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts');
const fixture=JSON.parse(await readFile('packages/game-rules/src/cardrpg/depth/skills-v5/fixtures/events-v2.json','utf8')).fixtures.find(f=>f.id==='rupture');
const b=R.createBattle(fixture.initial);let snapshot,score=-1;
for(let i=0;!b.result&&i<100;i++){
 if(R.currentActor(b).side==='enemy')R.enemyAct(b);else R.act(b,R.chooseAction(b,'auto'));
 const next=b.actors.filter(a=>a.hp>0).reduce((n,a)=>n+a.statuses.length,0)+(b.v4.events.some(e=>e.kind==='reaction')?10:0);
 if(next>score&&!b.result){score=next;snapshot=structuredClone(b);}
}
assert(snapshot);await suite.vite.close();
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[];
try{for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:/,route=>{network.push(route.request().url());return route.abort();});
 await page.goto(pathToFileURL(resolve(artifact)).href);await page.waitForFunction(()=>!!window.__depthReview);
 const initial=await page.evaluate(()=>({v5:window.__depthReview.state.skillsV5,v4:window.__depthReview.state.gameplayV4}));assert(initial.v5&&initial.v4);
 await page.evaluate(b=>{const m=window.__depthReview;m.galleryBattle=b;m.sceneStarted=true;m.paused=true;m.notify(false);},snapshot);
 const strip=page.getByRole('complementary',{name:'Battle conditions'});await strip.waitFor();await page.waitForFunction(()=>!!document.querySelector('canvas'));
 const label=await strip.innerText();assert(/Rupture|Burn|Bleed|Shred|Mark/.test(label));
 const check=await strip.evaluate(el=>{
  const r=el.getBoundingClientRect(),badges=[...el.querySelectorAll('.dp-v5-keyword')],style=getComputedStyle(el);
  return {box:{x:r.x,y:r.y,width:r.width,height:r.height},overflow:el.scrollWidth>el.clientWidth+1,badgeCounts:[...el.querySelectorAll('.dp-v5-unit-condition')].map(e=>e.querySelectorAll('.dp-v5-keyword').length),foreground:style.color,background:style.backgroundColor,badges:badges.length};
 });assert(check.box.x>=0&&check.box.x+check.box.width<=width&&check.box.y+check.box.height<=height);assert(!check.overflow);assert(check.badgeCounts.every(n=>n<=4));
 const badge=strip.locator('.dp-v5-keyword').first();await badge.focus();await badge.getByRole('tooltip').waitFor({state:'visible'});
 await page.screenshot({path:out+`/fallback-${width}.png`});
 await page.evaluate(()=>{const m=window.__depthReview;m.galleryBattle.initial.skillsV5=false;m.notify(false);});await strip.waitFor({state:'detached'});
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);rows.push({width,height,initial,label,check,keyboardTooltip:true,offHidden:true,errors,network});await page.close();
}}finally{await browser.close();}
await writeFile(out+'/checks.json',JSON.stringify({artifact,artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),scope:'Targeted static fallback HUD and explicit demo flag; source unit tests cover old-route retention. No human recognition or render-performance claim.',rows},null,2));console.log(JSON.stringify({checks:rows.length,status:'PASS'}));
