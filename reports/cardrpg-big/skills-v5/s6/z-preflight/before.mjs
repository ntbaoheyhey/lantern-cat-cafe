// One screenshot group on the delivery artifact. Fixtures are explicit; no timing claims.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {loadRules} from './load.mjs';
const width=Number(process.argv[2]),look=process.argv[3]==='on',height=width===1440?900:width===1024?600:720;
assert([1280,1440,1024].includes(width));assert(['on','off'].includes(process.argv[3]));
const root='reports/cardrpg-big/skills-v5/s6/z',out=`${root}/${width}-look-${look?'on':'off'}`;
const artifact=resolve('docs/cardrpg3/skills-v5.html'),manifest=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');assert.equal(sha(await readFile(artifact)),manifest.artifactSha256);
await mkdir(out,{recursive:true});assert(!await readFile(out+'/checks.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;}),'Do not recapture a completed group');
const save=await readFile(manifest.earnedSave,'utf8');assert.equal(sha(save),manifest.earnedSaveSha256);
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts');
const example=JSON.parse(await readFile('packages/game-rules/src/cardrpg/depth/skills-v5/fixtures/events-v2.json','utf8')).fixtures.find(f=>f.id==='rupture');
const prepared=R.createBattle(example.initial),finished=R.playBattle(R.createBattle(example.initial),'auto');await suite.vite.close();
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
const rows=[],errors=[],remote=[],checks=[];let complete=false;page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
const button=name=>page.getByRole('button',{name,exact:true});
const nav=async name=>{await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();await page.locator('.dp-page').waitFor();};
async function capture(name,selector='.dp-page'){
 const target=page.locator(selector).first();await target.waitFor();await target.scrollIntoViewIfNeeded();
 await page.locator('.cr-content img').evaluateAll(xs=>Promise.all(xs.map(x=>x.decode().catch(()=>{}))));
 const facts=await page.evaluate(selector=>{
  const root=document.querySelector(selector),shown=e=>{if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope > summary')?.contains(e))return false;return true;};
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const contrast=[...root.querySelectorAll('h1,h2,h3,p,button,small,label,dt,dd,summary,strong')].filter(e=>shown(e)&&e.textContent.trim()&&!e.closest('button:disabled,select:disabled')).map(e=>{
   let p=e,bgs;while(p){const s=getComputedStyle(p),stops=[...s.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}const c=rgb(s.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
   const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));return{text:e.textContent.trim().slice(0,160),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });return{screen:window.__depthReview.screen,text:root.innerText,overflow:document.documentElement.scrollWidth-innerWidth,contrast,look:document.querySelector('.dp-app').dataset.lookV2,previewReady:window.__depthPreviewScene?.stats?.loaded??null};
 },selector);
 const path=`${out}/${name}.png`;await page.screenshot({path});rows.push({name,path,...facts});await writeFile(out+'/partial.json',JSON.stringify({artifact,width,height,look,rows,errors,remote},null,2));
}
try{
 await page.goto('file://'+artifact+'?dev=1');await page.waitForFunction(()=>!!window.__depthReview);
 if((await page.locator('.dp-app').getAttribute('data-look-v2'))!==String(look))await button('Look A/B').click();
 await page.evaluate(()=>{history.replaceState(null,'',location.pathname);window.__depthReview.notify(false);});
 for(const name of ['Feel lab','Review studio','Mechanics lab','Frame meter','Look A/B','Before / after'])assert.equal(await button(name).count(),0,name);
 await capture('fresh-home','.dp-v4-home');
 await page.getByRole('button',{name:/Try the practice table/}).click();
 await button('Select Soot for placement').focus();await page.keyboard.press('Space');await button('Place Soot in Front').focus();await page.keyboard.press('Enter');
 await capture('fresh-prepare','.dp-v4-prepare');checks.push('Public keyboard placement; no in-fight input');
 await page.evaluate(code=>{const m=window.__depthReview;m.import(code);m.go('hub');},save);
 await capture('earned-home','.dp-v4-home');
 for(const [name,screen]of [['team','Team & cards'],['companions','Companions'],['equipment','Equipment'],['invitations','Invitations'],['journal','Collection journal'],['guide','Field guide'],['save','Save & settings']]){await nav(screen);await capture(name);}
 await nav('Companions');await page.locator('.dp-v5-glossary summary').click();await capture('status-glossary','.dp-v5-glossary');
 await nav('Invitations');await page.locator('.dp-player-odds summary').first().click();await capture('invitation-odds','.dp-player-odds');
 await nav('Equipment');const item=page.locator('.dp-gear-grid button').first();if(await item.count()){await item.click();await capture('equipment-compare','.dp-v4-utility');}
 await nav('Cafe');await page.getByRole('region',{name:'Tonight at home',exact:true}).locator('button.cr-primary').click();
 await nav('Night route');await capture('night-route');
 // S4 natural reaction fixture is a review setup, not earned progression.
 await page.evaluate(b=>{const m=window.__depthReview;m.state.run=undefined;m.replay=null;m.tutorialBattle=b;m.watching=false;m.sceneStarted=false;m.go('prepare');},prepared);
 await button('Select Biscuit for placement').click();await capture('combo-prepare','.dp-v4-prepare');await capture('crew-hint','.dp-v5-combos');
 await button('Fight').click();await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.battle?.log.length>5,null,{timeout:120000});
 await capture('automatic-battle','.dp-v5-status-strip');
 await button('Skip to result').click();await page.waitForFunction(()=>!window.__depthReview.showBattle);
 await page.evaluate(b=>{const m=window.__depthReview;m.replay=b;m.tutorialBattle=null;m.watching=false;m.sceneStarted=false;m.paused=false;m.go('result');},finished);
 await capture('reaction-result','.dp-v4-outcome');await capture('reaction-explanation','.dp-v5-reaction-summary');
 await page.evaluate(()=>{const m=window.__depthReview;m.replay=null;m.tutorialBattle=null;m.sceneStarted=false;m.go('hub');});
 await page.evaluate(()=>{history.replaceState(null,'',location.pathname+'?dev=1');window.__depthReview.notify(false);});
 assert(await button('Look A/B').isVisible());await capture('review-controls','.dp-page');checks.push('Review controls require dev=1; both looks retain V5 rules');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 assert.equal(rows.length,21,'Every declared screen must be captured');complete=true;
}finally{
 const contrast=rows.flatMap(r=>r.contrast),failures=rows.flatMap(r=>r.contrast.filter(c=>c.ratio<4.5).map(c=>({capture:r.name,...c})));
 const receipt={complete,artifact,artifactSha256:sha(await readFile(artifact)),width,height,look,rows,checks,errors,remote,minimumContrast:Math.min(...contrast.map(c=>c.ratio)),contrastFailures:failures,overflowFailures:rows.filter(r=>r.overflow!==0).map(r=>({name:r.name,overflow:r.overflow})),scope:'One last-artifact A-owned screen group. Earned day45 save imported for populated screens; natural S4 reaction fixture for Prepare/Result. No wallet/Relic action, combat timing, human recognition or causal progression claim.'};
 await writeFile(out+'/checks.json',JSON.stringify(receipt,null,2)+'\n');await browser.close();console.log(JSON.stringify({width,look,captures:rows.length,contrastFailures:failures.length,overflowFailures:receipt.overflowFailures.length,errors:errors.length}));
}
