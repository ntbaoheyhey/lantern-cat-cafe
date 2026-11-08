// REFERENCE: PROMPT-A5 C1. Settings shortcuts are reviewer-only in GameplayV4; OFF stays unchanged.
import assert from 'node:assert/strict';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const mode=process.argv[2],width=Number(process.argv[3]),before=process.env.A5_REVIEW_BEFORE==='1';
assert(['on','off'].includes(mode));assert([1280,1440,1024].includes(width));
const artifact=process.env.A5_REVIEW_ARTIFACT||`/tmp/cardrpg-a5-review-controls-${mode}/index.html`;
const out=`reports/cardrpg-big/a5/c1-review-controls/${before?'before':'after'}-${mode}-${width}-attempt-${process.env.A5_REVIEW_ATTEMPT||'1'}`;
await mkdir(out,{recursive:false});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const grants=['Unlock all cats and build materials','Add 1500 demo stamps','Unlock chapters and Tower','Advance fixture day'];
const checks=[],captures=[],errors=[],remote=[];let passed=false;
try{
 for(const view of ['player','reviewer','reviewer-look']){
  const dev=view!=='player';
  const page=await browser.newPage({viewport:{width,height:width===1440?900:width===1024?600:720},reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(String(error)));page.on('request',request=>{if(/^https?:/.test(request.url()))remote.push(request.url());});
  await page.goto('file://'+artifact+(dev?'?dev=1':''));
  await page.getByRole('navigation',{name:'Cafe screens'}).waitFor({timeout:120000});
  if(view==='reviewer-look')await page.getByRole('button',{name:'Look A/B',exact:true}).click();
  await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name:'Save & settings',exact:true}).click();
  const button=name=>page.getByRole('button',{name,exact:true});
  const hasTools=before||mode==='off'||dev;
  for(const name of grants)assert.equal(await button(name).count(),hasTools?1:0,name);
  await button('Export save code').click();
  const code=await page.getByLabel('Save code',{exact:true}).inputValue();assert.match(code,/^THC(7|13)\./);
  const original=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
  await button('Import save code').click();
  assert.match(await page.locator('.cr-status').innerText(),/checksum verified/);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__depthReview.state)),original);
  if(hasTools){
   const day=await page.evaluate(()=>window.__depthReview.state.account.day);
   await button('Advance fixture day').focus();await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>window.__depthReview.state.account.day),day+1);
  }
  const label=view;
  await page.getByRole('heading',{name:hasTools?'Demo shortcuts':'Comfort and playback',exact:true}).scrollIntoViewIfNeeded();
  const measurements=await page.locator('.dp-page').evaluate(root=>{
   const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
   const nodes=[...root.querySelectorAll('h2,p,button,small')].filter(e=>!e.children.length&&e.getClientRects().length&&e.textContent.trim()&&!e.matches(':disabled'));
   return {overflow:document.documentElement.scrollWidth-innerWidth,contrast:nodes.map(e=>{
    let p=e,bgs;const rect=e.getBoundingClientRect(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
    while(p){const box=p.getBoundingClientRect();if(x<box.left||x>box.right||y<box.top||y>box.bottom){p=p.parentElement;continue;}
     const style=getComputedStyle(p),stops=[...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));
     if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}
     const c=rgb(style.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
    const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));
    return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   })};
  });
  assert.equal(measurements.overflow,0);assert(measurements.contrast.length&&measurements.contrast.every(c=>c.ratio>=4.5));
  const path=out+'/'+label+'.png';await page.screenshot({path});captures.push({path,label,...measurements});
  checks.push({view,dev,hasTools,grantControls:hasTools?4:0,saveRoundtrip:true,keyboardDayAdvance:hasTools});
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,mode,width,before,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,captures,errors,remote},null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({passed,mode,width,before}));
