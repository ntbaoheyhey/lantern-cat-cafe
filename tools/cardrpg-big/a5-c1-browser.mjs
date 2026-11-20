// REFERENCE: PROMPT-A5 C1; real clicks, keyboard placement, explicit player/reviewer modes.
// Staged overlay is independently testable; never mutate the H0 artifact. Run under shared lock.
import { chromium } from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
assert([1024,1280,1440].includes(width));
const artifact=resolve(process.env.A5_C1_ARTIFACT||'docs/cardrpg3/index.html'),out=`${process.env.A5_C1_OUTPUT||'reports/cardrpg-big/a5/c1'}/browser-${width}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const errors=[],remote=[],captures=[],checks=[];
const page=await browser.newPage({viewport:{width,height}});
page.on('pageerror',e=>errors.push(String(e)));
page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
const button=name=>page.getByRole('button',{name,exact:true});
const nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
async function capture(name,selector='.cr-content'){
 await page.locator(selector).scrollIntoViewIfNeeded();
 await page.locator('.cr-content img').evaluateAll(xs=>Promise.all(xs.map(x=>x.decode().catch(()=>{}))));
 const measurements=await page.evaluate(()=>{
  const shown=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
  const words=[],root=document.querySelector('.cr-content'),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   const parent=node.parentElement;if(!parent||parent.closest('option,script,style')||!shown(parent))continue;
   const range=document.createRange();range.selectNodeContents(node);if(range.getClientRects().length)words.push(node.textContent.trim());
  }
  for(const select of root.querySelectorAll('select'))if(shown(select))words.push(select.selectedOptions[0]?.textContent||'');
  const rgb=value=>(value.match(/[\d.]+/g)||[]).map(Number);
  const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const contrast=[...document.querySelectorAll('.dp-v4-prepare *, .dp-v4-filters *, .dp-player-odds *, .dp-v4-outcome *')]
   .filter(el=>shown(el)&&el.children.length===0&&el.textContent.trim()&&!el.matches(':disabled'))
   .map(el=>{let p=el,bg;while(p){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}p=p.parentElement;}
    const a=luminance(rgb(getComputedStyle(el).color)),b=luminance(bg||[29,27,40]);return {text:el.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   });
  return {overflow:document.documentElement.scrollWidth-innerWidth,words:words.join(' ').trim().split(/\s+/).filter(Boolean).length,contrast};
 });
 await page.screenshot({path:`${out}/${name}.png`});captures.push({name,...measurements});
 assert.equal(measurements.overflow,0,name+' horizontal overflow');
 assert(measurements.contrast.every(x=>x.ratio>=4.5),JSON.stringify(measurements.contrast.filter(x=>x.ratio<4.5)));
}
async function playerToolsHidden(){
 for(const name of ['Feel lab','Review studio','Mechanics lab','Frame meter','Look A/B','Before / after'])assert.equal(await button(name).isVisible(),false,name);
 assert(!/seed\s+\d+/i.test(await page.locator('.cr-page-title').allTextContents().then(xs=>xs.join(' '))));
}
try{
 await page.goto('file://'+artifact);
 await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 assert.equal((await read()).state.gameplayV4,true);
 await playerToolsHidden();await capture('hub-player');checks.push('player controls hidden');
 await page.getByRole('button',{name:/Try the practice table/}).click();
 const initial=await read();
 assert.equal(await page.locator('.dp-v4-prepare select').count(),0);
 const originalSeed=initial.battle.seed,originalStats=initial.battle.initial.enemyStats;
 // Native buttons supply Space/Enter activation, without a drag-only or pointer-only path.
 await button('Select Soot for placement').focus();await page.keyboard.press('Space');
 await button('Place Soot in Front').focus();await page.keyboard.press('Enter');
 await button('Select Mochi for placement').click();await button('Place Mochi in Back').click();
 assert.equal((await read()).battle.actors.find(a=>a.id==='mochi').row,'rear');
 await button('Select Soot for placement').click();assert.equal(await button('Place Soot in Back').isDisabled(),true);
 await button('Stop their support').click();await button('Protect · below 65% HP').click();
 const placed=await read();assert.equal(placed.battle.seed,originalSeed);assert.deepEqual(placed.battle.initial.enemyStats,originalStats);
 assert.deepEqual(placed.battle.v4.plan,{focus:'support',care:'protect'});
 await playerToolsHidden();await capture('prepare-player','.dp-v4-prepare');checks.push('keyboard/click placement, front invariant, fixed seed, standing plan');
 await button('Select Mochi for placement').click();await button('Place Mochi in Front').click();
 await button('Select Soot for placement').click();await button('Place Soot in Back').click();
 await button('Fight').click();await button('Skip to result').click();
 await page.getByRole('heading',{name:'Your crew’s turning points'}).waitFor();
 assert((await read()).battle.v4.committed);await playerToolsHidden();await capture('result-player','.dp-v4-outcome');
 await button('Complete lesson').click();await nav('Invitations');
 assert.equal(await page.locator('.dp-player-odds').getAttribute('open'),null);
 await capture('invitations-player');await page.locator('.dp-player-odds summary').first().click();
 assert.equal(await page.locator('.dp-invitation-odds').isVisible(),true);
 assert.equal(await page.locator('.dp-exact-odds p').first().isVisible(),true);
 assert.match(await page.locator('.dp-player-odds').innerText(),/30 invitations daily/);
 await capture('odds-player','.dp-player-odds');checks.push('rarity odds, exact item odds and caps one click away');
 await nav('Equipment');assert.equal(await page.locator('.dp-v4-filters select').count(),0);
 await page.getByRole('group',{name:'Equip for',exact:true}).getByRole('button',{name:'Soot',exact:true}).click();
 await page.getByRole('group',{name:'Slot',exact:true}).getByRole('button',{name:'outfit',exact:true}).click();
 assert.equal((await read()).state.equipment.mochi.weapon,initial.state.equipment.mochi.weapon);
 await capture('equipment-player','.dp-v4-filters');checks.push('equipment chip filters');
 await nav('Collection journal');await capture('journal-player');await playerToolsHidden();
 await page.goto('file://'+artifact+'?dev=1');
 await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 for(const name of ['Feel lab','Review studio','Mechanics lab','Frame meter','Look A/B','Before / after'])assert(await button(name).isVisible(),name);
 await capture('hub-reviewer');await button('Look A/B').click();await capture('hub-reviewer-look');
 await page.getByRole('button',{name:/Try the practice table/}).click();await capture('prepare-look','.dp-v4-prepare');
 checks.push('review controls reachable via dev=1; both look themes');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 console.log(JSON.stringify({width,height,passed:true,checks,captures:captures.length}));
}finally{
 await writeFile(`${out}/checks.json`,JSON.stringify({width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,captures,errors,remote},null,2));
 await browser.close();
}
