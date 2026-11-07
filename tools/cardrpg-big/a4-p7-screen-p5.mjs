// REFERENCE: P7 new-screen acceptance; original P5 public UI paths on the delivery artifact. Historical receipts are not overwritten.
// REFERENCE: GAMEPLAY-V4 section7. Real clicks; safety fixtures imported through the save UI.
import {loadRules} from "./a4-load.mjs";
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
const out=`${process.env.BIG_P7_SCREEN_OUT||'reports/cardrpg-big/a4/p7/new-screens/p5'}/browser-${width}`,artifact=resolve('docs/cardrpg3/index.html');
await mkdir(out,{recursive:true});
const {load,vite}=await loadRules(), R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width,height}}),errors=[],captures=[],contrasts=[];
page.on('pageerror',error=>errors.push(String(error)));
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
const captureOne=async(name,selector='.cr-content')=>{
 await page.locator(selector).scrollIntoViewIfNeeded();
 await page.locator('.cr-content img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>{}))));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.equal(overflow,0);
 const samples=await page.locator('.dp-v4-cafe,.dp-v4-journal').evaluateAll(panels=>{
  const rgb=value=>(value.match(/[\d.]+/g)||[]).map(Number);
  const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  return panels.flatMap(panel=>[...panel.querySelectorAll('*')].filter(el=>el.children.length===0&&el.textContent.trim()&&el.tagName!=='OPTION'&&el.getClientRects().length).map(el=>{
   const fg=rgb(getComputedStyle(el).color);let parent=el,bg;
   while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}parent=parent.parentElement;}
   const a=luminance(fg),b=luminance(bg||[29,27,40]);
   return {text:el.textContent.slice(0,80),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }));
 });
 contrasts.push({name,samples});await page.screenshot({path:`${out}/${name}.png`});assert(samples.every(s=>s.ratio>=4.5),JSON.stringify(samples.filter(s=>s.ratio<4.5)));
 captures.push({name,overflow});
};
const capture=async(name,selector)=>{
 await captureOne(name+'-classic',selector);
 await page.getByRole('button',{name:'Look A/B',exact:true}).click();
 await captureOne(name+'-look',selector);
 await page.getByRole('button',{name:'Look A/B',exact:true}).click();
};
const nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
const importState=async state=>{
 await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(R.exportSave(state));
 await page.getByRole('button',{name:'Import save code',exact:true}).click();
 assert.equal(await page.locator('.cr-status.error').count(),0);
};
try{
 await page.clock.install();
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 assert.equal(await page.getByRole('button',{name:'Claim cafe service',exact:true}).isDisabled(),true);
 await capture('fresh-board','.dp-v4-cafe');
 await page.getByRole('button',{name:'Understood · next tip',exact:true}).click();
 assert.equal((await read()).state.v4.lessons[0],'front');await capture('one-next-lesson','.dp-v4-cafe');
 await page.clock.fastForward(3600000);
 await page.getByRole('button',{name:'Claim cafe service',exact:true}).click();
 let s=(await read()).state;assert.equal(s.account.daily.service,2);assert.equal(await page.getByRole('button',{name:'Claim cafe service',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Claim Warm the Kettle',exact:true}).click();s=(await read()).state;assert(s.account.quests['daily-service'].claimed);await capture('service-and-board','.dp-v4-cafe');
 await nav('Collection journal');await capture('earned-journal','.dp-v4-journal');
 const fixture=R.setGameplayV4(R.createDepthAccount(71),true);fixture.v4.journal={cats:[],gear:R.GEAR.slice(0,12).map(g=>g.id),sets:[],rewardedRoutes:10,claims:[]};fixture.account.daily.earned={...R.DEPTH_CAPS};fixture.account.day=7;
 await importState(fixture);await nav('Collection journal');
 assert.equal(await page.getByRole('button',{name:'Claim A shelf of possibilities',exact:true}).isDisabled(),true);await capture('full-cap-preserves-milestone','.dp-v4-journal');
 const ready=R.metaCommand(fixture,{type:'advanceLocalDay'}).state;await importState(ready);await nav('Collection journal');
 const before=ready.account.currencies.threads;await page.getByRole('button',{name:'Claim A shelf of possibilities',exact:true}).click();s=(await read()).state;assert.equal(s.account.currencies.threads,before+40);
 assert.equal(await page.getByRole('button',{name:'Claim A shelf of possibilities',exact:true}).isDisabled(),true);await capture('milestone-once','.dp-v4-journal');
 await nav('Cafe');assert.equal(await page.getByRole('button',{name:'Understood · next tip',exact:true}).count(),0);
 await nav('Save & settings');await page.getByRole('button',{name:'Export save code',exact:true}).click();assert((await page.getByLabel('Save code',{exact:true}).inputValue()).startsWith('THC12.'));
 const saved=(await read()).state;await page.getByRole('button',{name:'Import save code',exact:true}).click();assert.deepEqual((await read()).state,saved);assert.deepEqual(errors,[]);
} finally {
 await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),width,height,method:'Real clicks for fresh board, lesson, elapsed-clock service, existing quest, journal, deferred milestone, and save roundtrip. Playwright advances the test clock by one hour; explicit imported full-cap/ready fixtures do not claim earned progression.',errors,captures,contrasts},null,2));
 await browser.close();await vite.close();
}
