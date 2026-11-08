// REFERENCE: PROMPT-A5 C1. Paired fresh-save copy comparison, not an engagement or timing run.
import {chromium} from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const after=process.env.A5_C1_ARTIFACT;
assert(after,'Provide reviewed C1 artifact');
const out=process.env.A5_C1_OUTPUT||'/tmp/cardrpg-a5-c1-revision/copy';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const rows=[],errors=[];
try {
 for(const [variant,file] of [['h0','docs/cardrpg3/index.html'],['c1',after]]) {
  const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage();
  const digest=createHash('sha256').update(await readFile(file)).digest('hex');
  if(variant==='h0')assert.equal(digest,'067d2062f6836a6d0bb9f6753ece1b2f3ca923688f241866a7f42806c8f7b6a1');
  page.on('pageerror',e=>errors.push({variant,error:String(e)}));
  const button=name=>page.getByRole('button',{name,exact:true});
  const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  async function snapshot(screen) {
   const measured=await page.evaluate(()=>{
    const legacy=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
    const rendered=el=>{
     if(!legacy(el))return false;
     for(let ancestor=el;ancestor;ancestor=ancestor.parentElement) {
      if(ancestor.tagName==='DETAILS'&&!ancestor.open) {
       const summary=[...ancestor.children].find(child=>child.tagName==='SUMMARY');
       if(!summary?.contains(el))return false;
      }
     }
     return true;
    };
    const count=visible=>{
     const root=document.querySelector('.cr-content'),parts=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
     while((node=walker.nextNode())){
      const parent=node.parentElement;if(!parent||parent.closest('option,script,style')||!visible(parent))continue;
      const range=document.createRange();range.selectNodeContents(node);if(range.getClientRects().length)parts.push(node.textContent.trim());
     }
     for(const select of root.querySelectorAll('select'))if(visible(select))parts.push(select.selectedOptions[0]?.textContent||'');
     const text=parts.filter(Boolean).join('\n');return {words:text.split(/\s+/).filter(Boolean).length,text};
    };
    const debug=[...document.querySelectorAll('button')].filter(rendered).filter(el=>/^(Feel lab|Review studio|Mechanics lab|Frame meter|Look A\/B|Before \/ after)$/.test(el.innerText.trim()));
    const m=window.__depthReview;
    return {legacyWords:count(legacy).words,...count(rendered),debug:debug.map(el=>el.innerText.trim()),overflow:document.documentElement.scrollWidth-innerWidth,state:{day:m.state.day,team:m.state.team,cards:m.state.account.cards,gear:m.state.gear,equipment:m.state.equipment,currencies:m.state.account.currencies}};
   });
   assert.equal(measured.overflow,0);
   rows.push({variant,screen,digest,...measured});
   if(variant==='c1')assert.deepEqual(measured.debug,[]);
  }
  await page.goto('file://'+resolve(file));
  await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
  await snapshot('hub');
  await page.getByRole('button',{name:/Try the practice table/}).click();
  await snapshot('prepare');
  await button('Fight').click();await button('Skip to result').click();
  await page.getByRole('heading',{name:'Victory',exact:true}).waitFor();
  await snapshot('result');await button('Complete lesson').click();
  await nav('Invitations');await snapshot('invitations');
  if(variant==='c1'){
   await page.locator('.dp-player-odds summary').first().click();await snapshot('invitations-open-rules');
  }
  await nav('Equipment');await snapshot('equipment');
  if(variant==='c1'){
   await page.getByRole('group',{name:'Slot',exact:true}).getByRole('button',{name:'outfit',exact:true}).click();
   assert.match(await page.locator('.dp-equip-action h2').innerText(),/Apron|Shawl|Vest/);
   await page.getByRole('group',{name:'Rarity',exact:true}).getByRole('button',{name:'legendary',exact:true}).click();
   assert.equal(await button('Equip selected').count(),0);
   assert.equal(await page.locator('.dp-v4-utility').count(),0);
  }
  await nav('Collection journal');await snapshot('journal');
  await context.close();
 }
 const comparisons=rows.filter(r=>r.variant==='h0').map(before=>{
  const after=rows.find(r=>r.variant==='c1'&&r.screen===before.screen);assert(after);
  assert.deepEqual(after.state,before.state,before.screen+' same earned inventory and crew');
  return {screen:before.screen,before:before.words,after:after.words,delta:after.words-before.words};
 });
 assert.deepEqual(errors,[]);
 await writeFile(out+'/comparison.json',JSON.stringify({method:'Same fresh save and real-click practice path on both immutable artifacts; no draws, grants, clocks or engagement claim. Corrected count explicitly excludes content beneath every closed details ancestor, retaining its direct summary and selected select option. Original H0 timeline is not rewritten.',comparisons,rows,errors},null,2));
 console.log(JSON.stringify(comparisons));
} finally {await browser.close();}
