// REFERENCE: GAMEPLAY-V4 sections5/6. Real clicks; safety fixtures imported through the save UI.
import {loadRules} from "./a4-load.mjs";
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
const out=`reports/cardrpg-big/a4/p4/browser-${width}`,artifact=resolve('docs/cardrpg3/index.html');
await mkdir(out,{recursive:true});
const {load,vite}=await loadRules(), R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width,height}}),errors=[],captures=[],contrasts=[];
page.on('pageerror',error=>errors.push(String(error)));
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
const captureOne=async(name,selector='.cr-content')=>{
 await page.locator(selector).scrollIntoViewIfNeeded();
 await page.locator('.cr-content img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>{}))));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.equal(overflow,0);
 const samples=await page.locator('.dp-v4-selector,.dp-v4-editions').evaluateAll(panels=>{
  const rgb=value=>(value.match(/[\d.]+/g)||[]).map(Number);
  const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  return panels.flatMap(panel=>[...panel.querySelectorAll('*')].filter(el=>el.children.length===0&&el.textContent.trim()&&el.tagName!=='OPTION'&&el.getClientRects().length).map(el=>{
   const fg=rgb(getComputedStyle(el).color);let parent=el,bg;
   while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}parent=parent.parentElement;}
   const a=luminance(fg),b=luminance(bg||[29,27,40]);
   return {text:el.textContent.slice(0,80),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }));
 });
 contrasts.push({name,samples});await page.screenshot({path:`${out}/${name}.png`});assert(samples.every(s=>s.ratio>=4.5),JSON.stringify(samples.filter(s=>s.ratio<4.5)));
 await page.screenshot({path:`${out}/${name}.png`});captures.push({name,overflow});
};
const capture=async(name,selector)=>{
 await captureOne(name+'-classic',selector);
 await page.getByRole('button',{name:'Look A/B',exact:true}).click();
 await captureOne(name+'-look',selector);
 await page.getByRole('button',{name:'Look A/B',exact:true}).click();
};
const nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
const importState=async state=>{
 await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(R.exportSave(state));
 await page.getByRole('button',{name:'Import save code',exact:true}).click();
 assert.equal(await page.locator('.cr-status.error').count(),0);
};
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await nav('Invitations');await page.getByRole('button',{name:'Open free welcome invitation',exact:true}).click();
 if(await page.getByRole('button',{name:'Skip reveal',exact:true}).count())await page.getByRole('button',{name:'Skip reveal',exact:true}).click();
 assert.equal(R.selectorMarksV4((await read()).state),0);
 await page.getByRole('button',{name:'Invite once · 150 stamps',exact:true}).click();
 if(await page.getByRole('button',{name:'Skip reveal',exact:true}).count())await page.getByRole('button',{name:'Skip reveal',exact:true}).click();
 assert.equal(R.selectorMarksV4((await read()).state),1);await capture('earned-choice','.dp-v4-selector');
 const fixture=R.setGameplayV4(R.createDepthAccount(71),true);fixture.v4.selectorMarks=60;fixture.settings.reducedMotion=true;
 await importState(fixture);await nav('Invitations');await page.getByLabel('Chosen reward',{exact:true}).selectOption('panko');
 await capture('selector-ready','.dp-v4-selector');await page.getByRole('button',{name:'Choose reward · 60 marks',exact:true}).click();
 let s=(await read()).state;assert.equal(R.selectorMarksV4(s),0);assert(s.account.cards.some(c=>c.cardId==='panko'));assert.deepEqual(s.account.pity,fixture.account.pity);
 const ledgerFixture=R.setGameplayV4(R.createDepthAccount(32),true);ledgerFixture.seals=13;ledgerFixture.cleared=[1,2,3];ledgerFixture.masteries=[1,2,3];
 for(let day=1;day<=13;day++)ledgerFixture.account.inventory.stacks[`depth-seal-${day}`]=1;
 await importState(ledgerFixture);await nav('Fuji Relics');await capture('local-supply','.dp-v4-editions');
 await page.getByRole('button',{name:'Reserve Moon Collar · 3 seals',exact:true}).click();
 s=(await read()).state;assert.equal(s.seals,10);assert.equal(s.v4.issuance.lifetimeIssued['moon-collar'],1);
 assert.equal(await page.getByRole('button',{name:'Reserve Golden Maneki · 10 seals',exact:true}).isDisabled(),true);
 await capture('reserved','.dp-v4-editions');
 await page.getByRole('button',{name:'Burn local record moon-collar:1',exact:true}).click();
 s=(await read()).state;assert.equal(s.v4.issuance.reservations[0].status,'burned');assert.equal(s.v4.issuance.lifetimeIssued['moon-collar'],1);assert.equal(s.seals,10);
 await capture('burn-keeps-supply','.dp-v4-editions');
 await nav('Save & settings');await page.getByRole('button',{name:'Export save code',exact:true}).click();
 assert((await page.getByLabel('Save code',{exact:true}).inputValue()).startsWith('THC11.'));
 const before=(await read()).state;await page.getByRole('button',{name:'Import save code',exact:true}).click();assert.deepEqual((await read()).state,before);
 assert.deepEqual(errors,[]);
} finally {
 await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),width,height,method:'Real clicks for welcome/paid draw/selector/reserve/burn/export-import; explicit imported 60-mark and effort fixtures do not claim earned progression.',errors,captures,contrasts},null,2));
 await browser.close();await vite.close();
}
