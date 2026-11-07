// REFERENCE: GAMEPLAY-V4 sections3/4. Real clicks; safety fixtures imported through the save UI.
import {loadRules} from "./a4-load.mjs";
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
const out=`reports/cardrpg-big/a4/p2/browser-${width}`,artifact=resolve('docs/cardrpg3/index.html');
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
 const samples=await page.locator('.dp-v4-loadouts,.dp-v4-utility,.dp-v4-pantry').evaluateAll(panels=>{
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
 await page.goto('file://'+artifact);
 await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await nav('Equipment');
 const initial=(await read()).state;
 await page.getByLabel('Shift name',{exact:true}).fill('Quiet evening');
 await page.getByRole('button',{name:'Save current shift',exact:true}).click();
 const saved=(await read()).state;assert.equal(saved.v4.loadouts[0].name,'Quiet evening');
 await page.getByLabel('Equip for',{exact:true}).selectOption('soot');
 await capture('compare','.dp-v4-utility');
 await page.getByRole('button',{name:'Equip selected',exact:true}).click();
 const transfer=(await read()).state;assert.equal(transfer.equipment.soot.weapon,initial.equipment.mochi.weapon);
 await page.getByRole('button',{name:'Apply saved shift',exact:true}).click();
 assert.deepEqual((await read()).state.equipment,initial.equipment);
 await capture('preset','.dp-v4-loadouts');
 await page.getByLabel('Equip for',{exact:true}).selectOption('mochi');
 await page.getByRole('button',{name:'Unequip slot',exact:true}).click();
 await page.getByRole('button',{name:'Salvage',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Apply saved shift',exact:true}).isDisabled(),true);
 assert.match(await page.locator('.dp-v4-loadouts').innerText(),/missing/);
 await capture('missing-piece','.dp-v4-loadouts');
 await page.getByLabel('Ownership',{exact:true}).selectOption('available');
 await page.getByLabel('Sort',{exact:true}).selectOption('utility');
 assert(!await page.locator('.dp-gear-grid').innerText().then(t=>t.includes('Worn by')));
 await nav('Save & settings');await page.getByRole('button',{name:'Export save code',exact:true}).click();
 const exported=await page.getByLabel('Save code',{exact:true}).inputValue();assert(exported.startsWith('THC9.'));
 const snapshot=(await read()).state;await page.getByRole('button',{name:'Import save code',exact:true}).click();
 assert.deepEqual((await read()).state,snapshot);
 // Explicit imported fixture: owned supplies and route, no debug mutations in the browser.
 let supplies=R.startRun(R.setGameplayV4(R.createDepthAccount(71),true),1,81).state;
 supplies.account.inventory.stacks['shield-biscuit']=2;supplies.account.inventory.stacks['cleanse-tea']=1;
 await importState(supplies);await nav('Equipment');await page.getByRole('button',{name:'Consumables',exact:true}).click();
 await page.getByRole('button',{name:'Confirm packed supply',exact:true}).click();
 assert.equal((await read()).state.account.inventory.stacks['shield-biscuit'],1);
 await page.getByLabel('Pantry supply',{exact:true}).selectOption('quicken-yarn');
 const before=(await read()).state;await page.getByRole('button',{name:'Confirm packed supply',exact:true}).click();
 assert.deepEqual((await read()).state,before);
 await page.getByLabel('Pantry supply',{exact:true}).selectOption('cleanse-tea');
 await page.getByRole('button',{name:'Confirm packed supply',exact:true}).click();
 assert.equal((await read()).state.account.inventory.stacks['shield-biscuit'],2);
 await capture('pantry','.dp-v4-pantry');
 await page.getByRole('button',{name:'Return packed supply',exact:true}).click();
 assert.equal((await read()).state.account.inventory.stacks['cleanse-tea'],1);
 // A legacy over-cap import must retain all pieces and reject a voluntary acquisition atomically.
 const full=R.setGameplayV4(R.createDepthAccount(19),true);full.account.currencies.fish=10000;full.account.currencies.threads=1000;
 while(full.gear.length<243)full.gear.push(R.makeGear(full,'hearthloom-weapon-common',full.gear.length));
 await importState(full);await nav('Equipment');
 const fullBefore=(await read()).state;await page.getByRole('button',{name:'Craft chosen piece',exact:true}).click();
 assert.deepEqual((await read()).state,fullBefore);assert.equal(fullBefore.gear.length,243);
 assert.match(await page.locator('.cr-status').innerText(),/full/);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({width,height,passed:true,captures:captures.length}));
}finally{
 await writeFile(`${out}/checks.json`,JSON.stringify({width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),errors,captures,contrasts},null,2));
 await browser.close();await vite.close();
}
