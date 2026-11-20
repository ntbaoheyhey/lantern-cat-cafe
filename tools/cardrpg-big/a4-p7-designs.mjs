// REFERENCE: design-check.mjs, GAMEPLAY-V4 section6. Twelve final-build captures of the current local-ledger flow.
import {loadRules} from './a4-load.mjs';
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const output=process.env.BIG_DESIGN_OUT||'reports/cardrpg-big/a4/p7/full/designs',artifact=resolve(process.env.BIG_ARTIFACT||'docs/cardrpg3/index.html');
await mkdir(output,{recursive:true});
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),rows=[];
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],remoteRequests=[],captures=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remoteRequests.push(r.url());});
  const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  const state=()=>page.evaluate(()=>window.__depthReview.state);
  const importState=async s=>{await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(R.exportSave(s));await page.getByRole('button',{name:'Import save code',exact:true}).click();assert.equal(await page.locator('.cr-status.error').count(),0);await nav('Fuji Relics');};
  const capture=async name=>{
   await page.locator('.dp-v4-editions').scrollIntoViewIfNeeded();
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,articles:[...document.querySelectorAll('.dp-v4-editions article')].map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label'),x:r.x,right:r.right,width:r.width};})}));
   assert.equal(layout.overflow,0);assert.equal(layout.articles.length,2);assert(layout.articles.every(r=>r.x>=0&&r.right<=width));
   const path=`${output}/${width}x${height}-${name}.png`;await page.screenshot({path});captures.push({name,path,layout});
  };
  await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();await nav('Fuji Relics');
  const moon=page.getByRole('article',{name:'Moon Collar'}),maneki=page.getByRole('article',{name:'Golden Maneki'});
  assert.match(await moon.innerText(),/Lifetime issued 0 \/ 2400/);assert.match(await maneki.innerText(),/Season issued 0 \/ 60/);
  assert(await moon.getByRole('button').isDisabled());assert(await maneki.getByRole('button').isDisabled());await capture('effort-locked');
  await page.getByText('Read issuance receipts (0)',{exact:true}).click();assert(await page.getByText(/Copied saves do not share a global authority/).isVisible());await capture('help');
  const fixture=R.setGameplayV4(R.createDepthAccount(32),true);fixture.seals=13;fixture.cleared=[1,2,3];fixture.masteries=[1,2,3];for(let day=1;day<=13;day++)fixture.account.inventory.stacks[`depth-seal-${day}`]=1;
  await importState(fixture);const powerBefore=R.battleCats(await state());await moon.getByRole('button',{name:'Reserve Moon Collar · 3 seals',exact:true}).click();
  let s=await state();assert.equal(s.seals,10);assert.equal(s.v4.issuance.lifetimeIssued['moon-collar'],1);assert.equal(s.v4.issuance.seasonIssued[s.v4.issuance.currentSeason]['moon-collar'],1);assert.deepEqual(R.battleCats(s),powerBefore);
  assert(await maneki.getByRole('button').isDisabled());await capture('moon-reserved');
  // Independent explicit cap fixture: no bypass through browser state writes and no earned-progression claim.
  const capped=structuredClone(fixture);capped.account.scarcity['golden-maneki'].issuedDesign=359;capped.account.scarcity['golden-maneki'].seasonIssuedDesign=59;
  await importState(capped);await maneki.getByRole('button',{name:'Reserve Golden Maneki · 10 seals',exact:true}).click();
  s=await state();assert.equal(s.seals,3);assert.equal(s.v4.issuance.lifetimeIssued['golden-maneki'],360);assert.equal(s.v4.issuance.seasonIssued[s.v4.issuance.currentSeason]['golden-maneki'],60);assert(await maneki.getByRole('button').isDisabled());assert.deepEqual(R.battleCats(s),powerBefore);await capture('last-supply-reserved');
  assert.deepEqual(errors,[]);assert.deepEqual(remoteRequests,[]);rows.push({width,height,errors,remoteRequests,captures,checks:{initialEffortLocked:true,localScopeVisible:true,moonBothCounters:true,exactSealSpend:true,finalGlobalAndSeasonPlace:true,onePerDay:true,powerUnchanged:true}});await page.close();
 }
}finally{
 await writeFile(`${output}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Real navigation/reservation clicks, explicit effort and last-slot safety fixtures imported through Save UI. Local ledger limits and zero battle-stat changes, not earned progression or global authority. Four captures per size.',rows},null,2));await browser.close();await vite.close();
}
