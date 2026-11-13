import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {sha} from './runtime.mjs';
const require=createRequire(new URL('../../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const folder='reports/v3-shell/b2/econ',signed=path=>({path,sha256:sha(path)});

/** Inspect the actual page and compare displayed prices/odds with live rules. */
export async function captureEconomyUi(rules,{url='http://127.0.0.1:5995',oddsLog}={}){
 const browser=await chromium.launch({headless:true});
 const shots=[],observations=[],errors=[];
 mkdirSync(`${folder}/shots`,{recursive:true});
 try{
  for(const [width,height] of [[1280,720],[1440,900]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3','{"disabled":true}'));
   await page.goto(`${url}/?demo=1&squad=1&cardrpg2=1&a6=1&formationc2=1`);
   await page.getByRole('button',{name:'Play free',exact:true}).click();
   await page.locator('.uv-shell').waitFor();
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent('shell:page',{detail:'economy'})));
   const dialog=page.getByRole('dialog',{name:'economy',exact:true});await dialog.waitFor();
   const shoot=async name=>{
    await page.waitForTimeout(300);
    const path=`${folder}/shots/economy-${name}-${width}.png`;await page.screenshot({path});
    shots.push({...signed(path),width,height,screen:name});
   };
   const policy=rules.ECONOMY_LAB.policy;
   const flow=await dialog.locator('.b2-flow-steps').innerText();
   assert(flow.includes(`${policy.rewards.weeklySpool}/week`));assert(flow.includes(`${policy.fusion.legendary.yarn} YARN`));
   await shoot('flow');
   for(const tab of ['allocation','craft','fees','odds']){
    await dialog.getByRole('button',{name:tab,exact:true}).click();
    if(tab==='allocation')assert.equal(await dialog.locator('.b2-allocation-pie').getAttribute('aria-label'),Object.entries(policy.allocation).map(([k,v])=>`${k} ${v}%`).join(', '));
    if(tab==='craft'){
     for(const id of rules.ECONOMY_SINK_IDS){
      const quote=rules.economySinkQuote(id,{gear:[{id:'preview',template:'hearthloom-weapon-epic',quality:0}],styles:[]},'preview');
      const tile=dialog.locator(`[data-sink-id="${id}"]`);
      await tile.getByLabel(`${quote.yarn} YARN`,{exact:true}).waitFor();
      await tile.getByLabel(`${quote.starThread} Star Thread`,{exact:true}).waitFor();
      observations.push({width,kind:'recipe',id,yarn:quote.yarn,starThread:quote.starThread});
     }
    }
    if(tab==='odds'){
     const values=await dialog.getByRole('table',{name:'Published gacha odds'}).locator('tbody tr').evaluateAll(rows=>rows.map(r=>Array.from(r.querySelectorAll('td'),c=>c.textContent)));
     const expected=['cat','gear'].map(kind=>[...Object.values(policy[kind].odds).map(n=>`${n/100}%`),String(policy[kind].soft),String(policy[kind].hard)]);
     assert.deepEqual(values,expected);observations.push({width,kind:'banner',values});
    }
    await shoot(tab);
    if(tab==='fees'){
     await dialog.getByRole('button',{name:'Limits and risks',exact:true}).click();
     assert((await dialog.innerText()).includes('147/2024'));await shoot('risks');
    }
   }
   for(const [label,name] of [['Featured & shards','featured'],['Enhancement & fusion','enhancement'],['Drops','drops']]){
    await dialog.getByRole('button',{name:label,exact:true}).click();
    if(name==='enhancement'){
     const values=await dialog.getByRole('table',{name:'Enhancement odds'}).locator('td').allTextContents();
     assert.deepEqual(values,policy.enhancement.successBp.map(n=>`${n/100}%`));observations.push({width,kind:name,values});
    }
    if(name==='drops'){
     const values=await dialog.getByRole('table',{name:'Gear drop odds'}).locator('tbody tr').evaluateAll(rows=>rows.map(r=>Array.from(r.querySelectorAll('td'),c=>c.textContent)));
     assert.deepEqual(values,['battle','elite','boss','firstBoss','tower'].map(k=>[`${policy.drops[k].chanceBp/100}%`,Object.values(policy.drops[k].odds).map(n=>`${n/100}%`).join(' / ')]));observations.push({width,kind:name,values});
    }
    await shoot(name);
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);
  const log=readFileSync(oddsLog,'utf8'),passed=Number(log.match(/Tests\s+(\d+) passed/)?.[1]);
  assert(passed>0&&!/Tests\s+\d+ failed|FAIL /.test(log),'Passing odds test log required');
  const report={date:new Date().toISOString(),environment:'Disposable localhost Anvil; live public Fuji belongs to C1',shots,observations,errors,oddsTest:{exitCode:0,passed,log:signed(oddsLog)}};
  writeFileSync(`${folder}/UI.json`,JSON.stringify(report,null,2)+'\n');
  return report;
 }finally{await browser.close();}
}
