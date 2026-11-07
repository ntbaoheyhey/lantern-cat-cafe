// REFERENCE: PROMPT-A3.md. Real-click, first-viewport and density evidence; screenshots are not timing evidence.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
const [width,height]=(process.env.A3_SIZE||'1280,720').split(',').map(Number);
const artifact=resolve(process.env.BIG_ARTIFACT||'docs/cardrpg3/index.html');
const out=process.env.A3_OUT||`reports/cardrpg-big/a3/screens-${width}`;
const strict=process.env.A3_STRICT==='1';
const hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});
const receipt={artifact,artifactSha256:hash(await readFile(artifact)),width,height,strict,errors:[],remote:[],rows:[]};
const save=()=>writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2));
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.setDefaultTimeout(60000);
 page.on('pageerror',e=>receipt.errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))receipt.remote.push(r.url());});
 const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
 const preview=()=>page.waitForFunction(()=>window.__depthPreviewScene?.ready&&window.__depthPreviewScene.stats.calls>0);
 const capture=async (screen,button,art)=>{
  await page.locator('.cr-content').evaluate(e=>e.scrollTo(0,0));
  await page.locator('.cr-content img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const action=button?await button.boundingBox():null;
  const portrait=art?await art.first().boundingBox():null;
  const data=await page.evaluate(()=>{
   const texts=[],registry=window.__cardAssets;
   const walker=document.createTreeWalker(document.querySelector('.dp-cafe'),NodeFilter.SHOW_TEXT);
   for(let n;(n=walker.nextNode());){const e=n.parentElement,s=getComputedStyle(e),text=n.textContent.trim();
    if(!text||['STYLE','SCRIPT','OPTION'].includes(e.tagName)||s.visibility!=='visible'||s.display==='none')continue;
    const range=document.createRange();range.selectNodeContents(n);let opacity=1;for(let p=e;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
    for(const r of range.getClientRects())if(r.width>2&&r.height>2&&r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&document.elementsFromPoint(r.x+r.width/2,r.y+r.height/2).includes(e))texts.push({text,tag:e.tagName,className:e.className,colour:s.color,fontSize:s.fontSize,fontWeight:s.fontWeight,opacity,disabled:!!e.closest(':disabled'),bounds:{x:r.x,y:r.y,width:r.width,height:r.height}});
   }
   const sources=[...document.querySelectorAll('.cr-content img')].map(img=>{const id=['mochi','soot','clover'].find(id=>img.src===registry[`assets/cardrpg-look/portraits/${id}-1x.webp`]);return id?{id,pair:img.srcset===`${registry[`assets/cardrpg-look/portraits/${id}-1x.webp`]} 1x, ${registry[`assets/cardrpg-look/portraits/${id}-2x.webp`]} 2x`,fit:getComputedStyle(img).objectFit}:null;}).filter(Boolean);
   return {texts,sources,overflow:document.documentElement.scrollWidth-innerWidth,rightOverflow:[...document.querySelectorAll('.cr-content button,.cr-content select')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>innerWidth+1).map(e=>e.textContent.slice(0,70))};
  });
  const inside=r=>!!r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1;
  const screenshot=`${out}/${screen}.png`;await page.screenshot({path:screenshot});
  const row={screen,mode:'on',action,portrait,firstViewport:(!button||inside(action))&&(!art||inside(portrait)),screenshot,sha256:hash(await readFile(screenshot)),...data};
  const mask=await page.addStyleTag({content:'.dp-cafe,.dp-cafe *,.dp-cafe *::before,.dp-cafe *::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}'});
  row.background=`${out}/${screen}-text-background.png`;await page.screenshot({path:row.background});row.backgroundSha256=hash(await readFile(row.background));await mask.evaluate(e=>e.remove());
  receipt.rows.push(row);await save();assert.equal(data.overflow,0,screen+' overflow');assert.deepEqual(data.rightOverflow,[],screen+' right overflow');assert(data.sources.every(p=>p.pair&&p.fit==='contain'));
  if(strict)assert(row.firstViewport,screen+' main action and art in first viewport');
 };
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();await preview();
 await capture('hub',null,page.locator('.dp-hub-portrait'));
 await nav('Field guide');await page.getByRole('button',{name:'companions',exact:true}).click();await capture('guide',null,page.locator('.dp-enemy-portrait'));
 await nav('Companions');await preview();await capture('collection',page.getByRole('button',{name:'Level up',exact:true}),page.locator('.cr-card-grid .cr-portrait img'));
 await nav('Team & cards');await capture('team',page.getByRole('button',{name:'Begin Tangled Cafe',exact:true}),page.locator('.dp-formation-card .cr-portrait img'));
 await nav('Equipment');await preview();await capture('equipment',page.getByRole('button',{name:'Equip selected',exact:true}),page.locator('.dp-paper-doll .dp-cat-heading img'));
 await nav('Invitations');await preview();await capture('invitations',page.getByRole('button',{name:'Open free welcome invitation',exact:true}),page.locator('.dp-featured-card .cr-portrait img'));
 await page.getByRole('button',{name:'Open free welcome invitation',exact:true}).click();if(await page.getByRole('button',{name:'Skip reveal',exact:true}).count())await page.getByRole('button',{name:'Skip reveal',exact:true}).click();await capture('rewards',null,page.locator('.dp-batch-grid .cr-portrait img'));
 await nav('Cafe');await page.getByRole('button',{name:/Try the practice table/}).click();await page.getByText(/\/5 simulated wins/).waitFor();await capture('prepare',page.getByRole('button',{name:'Fight',exact:true}),page.locator('.dp-cat-heading img'));
 await page.getByRole('button',{name:'Fight',exact:true}).click();await page.waitForFunction(()=>window.__depthReview?.battle?.choices.length>=1);await page.getByRole('button',{name:'Skip to result',exact:true}).click();await page.getByRole('heading',{name:'Victory',exact:true}).waitFor();await capture('result',page.getByRole('button',{name:'Complete lesson',exact:true}),page.locator('.dp-result-banner .cr-portrait img'));
 assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.remote,[]);receipt.passed=true;console.log(JSON.stringify({out,rows:receipt.rows.length,firstViewport:receipt.rows.filter(r=>r.firstViewport).length,passed:true}));
} finally {await save();await browser.close();}
