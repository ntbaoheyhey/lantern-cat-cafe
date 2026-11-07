// REFERENCE: GAMEPLAY-V4 P7. Standalone offline guide, embedded screenshots and keyboard/readability checks.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const artifact=resolve('docs/cardrpg3/gameplay-v4.html'),out='reports/cardrpg-big/a4/p7/guide',rows=[];
const bytes=await readFile(artifact);assert(bytes.toString().startsWith('<!-- REFERENCE: docs/design/cardrpg/GAMEPLAY-V4.md; docs/design/cardrpg/RESEARCH-GAMEPLAY-V4.md; docs/design/cardrpg/NFT-VALUE-SPEC.md -->'));
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],remote=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto('file://'+artifact);await page.getByRole('heading',{level:1}).waitFor();
  const images=await page.locator('img').evaluateAll(async xs=>{for(const i of xs){i.loading='eager';await i.decode();}return xs.map(i=>({width:i.naturalWidth,height:i.naturalHeight,alt:i.alt,embedded:i.src.startsWith('data:image/')}));});
  assert.equal(images.length,6);assert(images.every(i=>i.width>0&&i.height>0&&i.alt&&i.embedded));
  const data=await page.evaluate(()=>{
   const rgb=v=>(v.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   return {overflow:document.documentElement.scrollWidth-innerWidth,links:[...document.querySelectorAll('a')].map(a=>({href:a.getAttribute('href'),label:a.textContent})),contrast:[...document.querySelectorAll('h1,h2,p,a,th,td,figcaption,.eyebrow')].filter(e=>e.textContent.trim()).map(e=>{
    let bg,p=e;while(p){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}p=p.parentElement;}
    const a=lum(rgb(getComputedStyle(e).color)),b=lum(bg??[255,255,255]);return {tag:e.tagName,text:e.textContent.slice(0,60),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   })};
  });
  assert.equal(data.overflow,0);assert(data.contrast.every(r=>r.ratio>=4.5),JSON.stringify(data.contrast.filter(r=>r.ratio<4.5)));
  for(const link of data.links){assert(!/^https?:/.test(link.href));if(!link.href.startsWith('#'))assert((await stat(resolve('docs/cardrpg3',link.href))).isFile());}
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Open the offline game');
  const screenshots=[];for(const [label,selector] of [['intro','h1'],['gear','#gear'],['evidence','#evidence']]){await page.locator(selector).scrollIntoViewIfNeeded();const path=`${out}/${width}-${label}.png`;await page.screenshot({path});screenshots.push(path);}
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);rows.push({width,height,...data,images,screenshots,errors,remote,keyboardEntry:true});await page.close();
 }
}finally{await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(bytes).digest('hex'),method:'Three desktop widths; eager decode of all embedded images; real keyboard Tab; local links checked on disk; computed text contrast and overflow. Screenshots are visual evidence, not performance measurements.',rows},null,2));}
