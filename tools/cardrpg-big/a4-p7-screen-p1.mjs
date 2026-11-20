// REFERENCE: P7 new-screen acceptance; original P1 public UI paths on the delivery artifact. Historical receipts are not overwritten.
// REFERENCE: GAMEPLAY-V4 section1. Headless real-click preparation paths.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
const out=`${process.env.BIG_P7_SCREEN_OUT||'reports/cardrpg-big/a4/p7/new-screens/p1'}/browser-${width}`,artifact=resolve('docs/cardrpg3/index.html');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width,height}}),errors=[],captures=[],contrasts=[];
page.on('pageerror',error=>errors.push(String(error)));
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
const captureOne=async(name,selector='.cr-content')=>{
 await page.locator(selector).scrollIntoViewIfNeeded();
 await page.locator('.cr-content img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>{}))));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.equal(overflow,0);
 const samples=await page.locator('.dp-v4-prepare,.dp-v4-crews,.dp-v4-outcome').evaluateAll(panels=>{
  const rgb=value=>(value.match(/[\d.]+/g)||[]).map(Number);
  const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  return panels.flatMap(panel=>[...panel.querySelectorAll('*')].filter(el=>el.children.length===0&&el.textContent.trim()&&el.tagName!=='OPTION'&&el.getClientRects().length).map(el=>{
   const fg=rgb(getComputedStyle(el).color);let parent=el,bg;
   while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}parent=parent.parentElement;}
   const a=luminance(fg),b=luminance(bg||[29,27,40]);
   return {text:el.textContent.slice(0,80),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }));
 });
 contrasts.push({name,samples});assert(samples.every(s=>s.ratio>=4.5),JSON.stringify(samples.filter(s=>s.ratio<4.5)));
 await page.screenshot({path:`${out}/${name}.png`});captures.push({name,overflow});
};
const capture=async(name,selector)=>{
 await captureOne(name+'-classic',selector);
 await page.getByRole('button',{name:'Look A/B',exact:true}).click();
 await captureOne(name+'-look',selector);
 await page.getByRole('button',{name:'Look A/B',exact:true}).click();
};
try{
 await page.goto('file://'+artifact);
 await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 assert.equal((await read()).state.gameplayV4,true);
 await page.getByRole('button',{name:/Try the practice table/}).click();
 await page.getByLabel('Focus',{exact:true}).selectOption('support');
 await page.getByLabel('Care',{exact:true}).selectOption('protect');
 await page.getByLabel('Soot opening row',{exact:true}).selectOption('front');
 await page.getByLabel('Mochi opening row',{exact:true}).selectOption('rear');
 assert.equal((await read()).battle.actors.find(a=>a.id==='mochi').row,'rear');
 await capture('formation','.dp-v4-prepare');await capture('crew','.dp-v4-crews');
 await page.getByLabel('Mochi opening row',{exact:true}).selectOption('front');
 await page.getByLabel('Soot opening row',{exact:true}).selectOption('rear');
 const before=await read();
 await page.getByLabel('Mochi opening row',{exact:true}).selectOption('rear');
 assert.deepEqual((await read()).battle,before.battle); // all-rear rejected atomically
 await page.getByRole('button',{name:'Fight',exact:true}).click();
 await page.getByRole('button',{name:'Skip to result',exact:true}).click();
 await page.getByRole('heading',{name:'What your preparation contributed'}).waitFor();
 const ended=await read();assert(ended.battle.v4.committed);assert(ended.battle.v4.events.length>0);
 await capture('result','.dp-v4-outcome');
 await page.getByRole('button',{name:'Complete lesson',exact:true}).click();
 await page.getByRole('button',{name:'Open free welcome invitation',exact:true}).click();
 await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name:'Cafe',exact:true}).click();
 await page.getByRole('button',{name:/Tangled Cafe/}).click();
 await page.locator('.dp-node:enabled').first().click();
 await page.getByRole('heading',{name:'Read their plan'}).waitFor();
 const initial=await read();
 await page.getByLabel('Focus',{exact:true}).selectOption('leader');
 assert.equal((await read()).battle.seed,initial.battle.seed);
 assert.deepEqual((await read()).battle.initial.enemyStats,initial.battle.initial.enemyStats);
 await capture('opponents','.dp-opponents');
 await page.getByRole('button',{name:'Fight',exact:true}).click();
 await page.getByRole('button',{name:'Skip to result',exact:true}).click();
 await page.getByRole('heading',{name:'What your preparation contributed'}).waitFor();
 await capture('route-result','.dp-v4-outcome');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({width,height,passed:true,captures:captures.length}));
}finally{
 await writeFile(`${out}/checks.json`,JSON.stringify({width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),errors,captures,contrasts},null,2));
 await browser.close();
}
