// Verify the generated offline guide at all requested widths. No combat samples.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s6/guide',path=resolve('docs/cardrpg3/skills-v5-guide.html'),bytes=await readFile(path);
assert(bytes.toString().startsWith('<!-- REFERENCE:'));await mkdir(root,{recursive:true});
assert(!await readFile(root+'/checks.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;}));
const browser=await chromium.launch({channel:'chromium',headless:true}),rows=[],a5Rows=[],errors=[],remote=[];let complete=false;
const contrast=page=>page.evaluate(()=>{
 const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
 return Math.min(...[...document.querySelectorAll('h1,h2,h3,p,a,th,td,small,figcaption,summary')].filter(e=>e.getClientRects().length&&e.textContent.trim()).map(e=>{
  let parent=e,bg=[255,255,255];while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}parent=parent.parentElement;}
  const a=lum(rgb(getComputedStyle(e).color)),b=lum(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 }));
});
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
  const minimumContrast=await contrast(page);assert(minimumContrast>=4.5);
  assert.equal(facts.overflow,0);rows.push({width,height,...facts,minimumContrast,captures});await page.close();
 }
 const a5Path=resolve('docs/cardrpg3/gameplay-v4.html'),a5Bytes=await readFile(a5Path);assert(a5Bytes.toString().startsWith('<!-- REFERENCE:'));
 for(const [width,height]of [[1280,720],[1440,900],[1024,600]]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto('file://'+a5Path);const section=page.locator('#a5-skills-v5');await section.waitFor();
  assert.equal(await section.locator('img').count(),3);assert.equal(await section.locator('tbody').last().locator('tr').count(),7);
  assert(await section.locator('img').evaluateAll(xs=>xs.every(x=>x.complete&&x.naturalWidth>0&&x.src.startsWith('data:'))));
  const captures=[];
  for(const [label,selector]of [['intro','#a5-skills-v5 h2'],['screens','#a5-current-screens'],['balance','#a5-current-balance'],['week','#a5-first-week']]){
   await page.locator(selector).scrollIntoViewIfNeeded();const capture=`${root}/${width}-a5-${label}.png`;await page.screenshot({path:capture});captures.push(capture);
  }
  const facts=await section.evaluate(e=>({overflow:document.documentElement.scrollWidth-innerWidth,text:e.innerText,links:[...e.querySelectorAll('a')].map(a=>({text:a.innerText,url:a.href}))}));
  for(const link of facts.links){const target=new URL(link.url);assert.equal(target.protocol,'file:');assert(await readFile(decodeURIComponent(target.pathname)),link.url);}
  const minimumContrast=await contrast(page);assert(minimumContrast>=4.5);assert.equal(facts.overflow,0);
  a5Rows.push({width,height,path:a5Path,sha256:createHash('sha256').update(a5Bytes).digest('hex'),...facts,minimumContrast,captures});await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);complete=true;
}finally{await browser.close();await writeFile(root+'/checks.json',JSON.stringify({complete,path,sha256:createHash('sha256').update(bytes).digest('hex'),rows,a5Rows,errors,remote,scope:'Static offline guides: eight core keywords, twelve kits, measured tables, inherited A5 refresh with three embedded Z captures and seven-day goals, local links, contrast and three-width overflow. No human reading or recognition claim.'},null,2)+'\n');}
console.log(JSON.stringify({complete,widths:rows.length,a5Widths:a5Rows.length,captures:[...rows,...a5Rows].reduce((n,r)=>n+r.captures.length,0)}));
