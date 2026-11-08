// REFERENCE: A5 P1. Actual lazy module requests and reviewer-panel actions, not a timing rerun.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/p1/adoption/lazy-flows';await mkdir(out,{recursive:true});
const artifact='/tmp/cardrpg-a5-p1-adopted/index.html',build=JSON.parse(await readFile('/tmp/cardrpg-a5-p1-adopted/build.json','utf8'));
assert.equal(createHash('sha256').update(await readFile(artifact)).digest('hex'),'9d9335f3a92bbb9f63a98306277ded6b889b591ff054b646c296c75a2634de7d');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),requests=[],errors=[],remote=[],checks=[];
page.on('request',r=>{requests.push(r.url());if(/^https?:/.test(r.url()))remote.push(r.url());});page.on('pageerror',e=>errors.push(String(e)));
let result={artifact,sha256:build.sha256,checks,errors,remote};
const button=name=>page.getByRole('button',{name,exact:true});
async function capture(name){
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0,name);
 await page.screenshot({path:out+'/'+name+'.png'});
}
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 const seen=new Set(requests),urls=await page.evaluate(()=>window.__cardModuleUrls);
 const loaded=Object.entries(urls).filter(([,url])=>seen.has(url)).map(([id])=>id);
 const chunks=loaded.map(id=>build.moduleChunks.find(c=>'@lantern/'+c.name===id));assert(chunks.every(Boolean));
 result.startup={boundary:'Visible Hub heading, before any navigation; preview may continue loading afterward',requestedModules:loaded,codeBytes:chunks.reduce((n,c)=>n+c.bytes,0),modules:chunks.flatMap(c=>c.modules)};
 for(const suffix of ['/depth/Utility.tsx','/cardrpg-big2/ReviewStudio.tsx','/cardrpg-big2/MechanicsLab.tsx','/depth/Battle.tsx'])assert(!result.startup.modules.some(m=>m.endsWith(suffix)),suffix+' must stay deferred');
 checks.push('Actual Hub request graph excludes Utility, reviewer panels and Battle view');
 for(const [width,height]of [[1280,720],[1024,600],[1440,900]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const bounds=await page.locator('.cr-content').boundingBox();assert(bounds.width>500&&bounds.height>200);
  await capture('hub-resize-'+width);
 }
 checks.push('Existing layout measurements respond to all three desktop widths with no horizontal overflow');
 const navigation=page.getByRole('navigation',{name:'Cafe screens'});
 for(const label of ['Team & cards','Companions','Equipment','Invitations','Collection journal']){
  await navigation.getByRole('button',{name:label,exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.dp-page')?.textContent?.includes('Opening the table…'));
  assert((await page.locator('.dp-page').innerText()).trim().length>20);
 }
 checks.push('Deferred team, collection, equipment, invitations and journal screens load through real navigation');
 await page.goto('file://'+artifact+'?dev=1');await button('Review studio').waitFor({timeout:120000});
 await button('Review studio').click();await page.getByRole('heading',{name:'Meet the whole cast'}).waitFor();
 await capture('studio');await button('Return to cafe').click();
 await button('Mechanics lab').click();await page.getByRole('heading',{name:'Mechanics lab',exact:true}).waitFor();
 await capture('mechanics');await button('Return to cafe').click();
 await button('Frame meter').click();await page.getByRole('complementary',{name:'Live performance',exact:true}).waitFor();
 await button('Frame meter').click();
 checks.push('Deferred studio, mechanics panel and frame meter actually open and close in reviewer mode');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);result.passed=true;
 console.log(JSON.stringify({passed:true,startupBytes:result.startup.codeBytes,checks}));
}finally{await writeFile(out+'/checks.json',JSON.stringify(result,null,2));await browser.close();}
