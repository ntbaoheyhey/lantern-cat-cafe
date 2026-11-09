// Verify the generated offline guide at all requested widths. No combat samples.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s6/guide',path=resolve('docs/cardrpg3/skills-v5-guide.html'),bytes=await readFile(path);
assert(bytes.toString().startsWith('<!-- REFERENCE:'));await mkdir(root,{recursive:true});
assert(!await readFile(root+'/checks.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;}));
const browser=await chromium.launch({channel:'chromium',headless:true}),rows=[],errors=[],remote=[];let complete=false;
try{
 for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto('file://'+path);await page.getByRole('heading',{name:'A crew with something to do together.'}).waitFor();
  assert.equal(await page.locator('tbody').first().locator('tr').count(),8);assert.equal(await page.locator('details').count(),12);
  const captures=[];for(const label of ['intro','keywords','evidence']){
   if(label==='keywords')await page.getByRole('heading',{name:'Eight keywords'}).scrollIntoViewIfNeeded();
   if(label==='evidence')await page.getByRole('heading',{name:'What this build measured'}).scrollIntoViewIfNeeded();
   const capture=`${root}/${width}-${label}.png`;await page.screenshot({path:capture});captures.push(capture);
  }
  const facts=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,links:[...document.querySelectorAll('a')].map(a=>({text:a.innerText,url:a.href})),text:document.body.innerText}));
  for(const link of facts.links){const target=new URL(link.url);assert.equal(target.protocol,'file:');assert(await readFile(decodeURIComponent(target.pathname)),link.url);}
  assert.equal(facts.overflow,0);rows.push({width,height,...facts,captures});await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);complete=true;
}finally{await browser.close();await writeFile(root+'/checks.json',JSON.stringify({complete,path,sha256:createHash('sha256').update(bytes).digest('hex'),rows,errors,remote,scope:'Static offline guide: eight core keywords, twelve kits, measured table, local links and three-width overflow. No human reading or recognition claim.'},null,2)+'\n');}
console.log(JSON.stringify({complete,widths:rows.length,captures:rows.reduce((n,r)=>n+r.captures.length,0)}));
