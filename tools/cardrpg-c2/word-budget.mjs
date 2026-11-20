import {loadRules} from '../cardrpg-sim/load.mjs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';

/** Count text actually painted in the viewport, including duplicates. Only unit
 * names and numeric tokens are exempt. ARIA labels never inflate the visual count. */
export async function visibleWords(page,names){
 return page.evaluate(names=>{
  // The C2 reward modal has an opaque backdrop; its underlying page is not painted.
  const scope=document.querySelector('dialog.c2-tip-review[open]')??document.body;
  const parts=[],walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const n=walker.currentNode,e=n.parentElement;
   if(!e||!n.textContent.trim()||e.closest('script,style,option,svg title,.sr-only,[hidden]')||!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
   if(e.closest('details:not([open])')&&!e.closest('summary'))continue;
   const range=document.createRange();range.selectNodeContents(n);
   const rects=[...range.getClientRects()].filter(r=>r.width>1&&r.height>1&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight);
   if(!rects.length)continue;
   const visible=rects.some(r=>{
    let left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
    // Body overflow is propagated to the viewport. A fixed app can leave body
    // with zero layout height while still painting the entire game.
    for(let p=e;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(['hidden','clip','scroll','auto'].includes(s.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right);}if(['hidden','clip','scroll','auto'].includes(s.overflowY)){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}if(s.clipPath==='inset(50%)'||s.clip==='rect(0px, 0px, 0px, 0px)')return false;}
    return right-left>1&&bottom-top>1;
   });
   if(visible)parts.push(n.textContent.trim());
  }
  // Native selects paint their selected label, not every option in the DOM.
  for(const select of scope.querySelectorAll('select')){
   const r=select.getBoundingClientRect();
   if(select.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth)parts.push([...select.selectedOptions].map(o=>o.textContent).join(' '));
  }
  for(const input of scope.querySelectorAll('input[type=search],input[type=text]')){
   const r=input.getBoundingClientRect();
   if(input.checkVisibility()&&r.bottom>0&&r.top<innerHeight)parts.push(input.value||input.placeholder);
  }
  let text=parts.join(' ');
  for(const name of [...names].sort((a,b)=>b.length-a.length))text=text.replace(new RegExp('(?<![\\p{L}])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\p{L}])','giu'),' ');
  const words=[...text.matchAll(/[\p{L}]+(?:['’][\p{L}]+)*/gu)].map(m=>m[0]);
  return {count:words.length,words,text:parts.join('\n')};
 },names);
}

export const screens=['home','collection','team','inventory','gacha','map','tower','journal','bonds','relics','save','daily','prepare','result','battle','materials','skills','cat-gear','cat-bonds','weekly','tasks','gifts','codex','menu','route','route-reward','route-shop','route-campfire','route-event','route-treasure','route-complete','save-reset','tips'];
export async function runBudget(page,{shots=process.env.C2_WORD_SHOTS,only=screens}={}){
 // These are returning-player screens; entry/coach flows have their own checks.
 await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
 await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await page.waitForFunction(()=>!!window.__depthReview);
 // The hook is retained; the visible application runs in normal player mode.
 await page.evaluate(()=>{history.replaceState({},'',location.href.replace('&dev=1',''));const m=window.__depthReview;m.offline=true;m.state.tutorial=4;m.state.freeInvite=true;m.shortcut('unlock');m.shortcut('chapter');m.command({type:'level',cardId:m.state.account.cards[0].id});if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.state.run=null;m.go('hub');});
 const {load,vite}=await loadRules();let exempt,boons;try{const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');exempt=[...R.CATS,...R.ENEMIES].map(x=>x.name);boons=R.BOONS.slice(0,3).map(b=>b.id);}finally{await vite.close();}
 const rows=[];
 for(const screen of only){
  // Remount each sheet so tabs, dialogs and menu state cannot leak between cases.
  if(await page.locator('.uv-close').isVisible()){
   await page.locator('.uv-close').click();
   // The shell keeps its focus trap alive during the exit animation. Navigating
   // before it finishes lets the previous close callback replace the next page.
   await page.locator('.uv-sheet').waitFor({state:'hidden'});
  }
  await page.evaluate(()=>{const m=window.__depthReview;m.watching=false;m.plan=null;m.go('hub');});
  await page.locator('.uv-dock').waitFor();
  await page.evaluate(({screen,boons})=>{const m=window.__depthReview;m.watching=false;m.plan=null;m.tutorialBattle=null;m.galleryBattle=null;m.state.run=null;m.error=false;m.notice='';m.state.settings.speed=3;m.state.v4.journey.pending=[];
   if(['prepare','result','battle'].includes(screen)){m.start(1,'campaign',1);m.enter(m.state.run.nodes[0].id);}
   else if(screen.startsWith('route')){m.start(1,'campaign',1);const r=m.state.run;r.battle=null;r.rewardChoices=[];r.points=100;r.supplies=2;if(screen==='route-reward')r.rewardChoices=boons;if(screen==='route-complete'){r.complete=true;r.won=true;}const kind=screen.slice(6),node=r.nodes.find(n=>n.kind===kind);if(node){r.current=node.id;r.visited=[];}m.go('map');}
   else m.go(({home:'hub',tips:'hub',daily:'hub',weekly:'hub',tasks:'hub',gifts:'hub',menu:'hub',materials:'inventory',skills:'collection','cat-gear':'collection','cat-bonds':'collection','save-reset':'save'})[screen]??screen);
  },{screen,boons});
  const destination=({home:'hub',tips:'hub',daily:'hub',weekly:'hub',tasks:'hub',gifts:'hub',menu:'hub',materials:'inventory',skills:'collection','cat-gear':'collection','cat-bonds':'collection','save-reset':'save',result:'prepare',battle:'prepare'})[screen]??(screen.startsWith('route')?'map':screen);
  if(destination==='hub')await page.locator('.uv-dock').waitFor();
  else await page.locator(`.uv-sheet[data-sheet="${destination}"]`).waitFor();
  if(['daily','weekly','tasks','gifts'].includes(screen)){await page.getByRole('button',{name:'Events',exact:true}).click();if(screen!=='daily')await page.getByRole('button',{name:new RegExp(screen,'i')}).first().click();}
  if(screen==='materials')await page.getByRole('button',{name:'Materials',exact:true}).click();
  if(['skills','cat-gear','cat-bonds'].includes(screen))await page.getByRole('navigation',{name:'Companion details'}).getByRole('button',{name:screen==='skills'?'Skills':screen==='cat-gear'?'Gear':'Bonds',exact:true}).click();
  if(screen==='menu')await page.getByRole('button',{name:'Open menu'}).click();
  if(screen==='save-reset')await page.getByRole('button',{name:/^(?:↺\s*)?Reset$/,exact:true}).click();
  if(screen==='tips')await page.getByRole('button',{name:'Review Night tips',exact:true}).click();
  if(screen==='result'||screen==='battle')await page.getByRole('button',{name:/^Fight/}).click();
  if(screen==='result')await page.locator('.uv-result').waitFor({timeout:120000});
  if(screen==='battle'){await page.waitForFunction(()=>window.__depthReview.sceneReady);await page.evaluate(()=>{const m=window.__depthReview;m.paused=true;m.notify(false);});}
  await page.waitForFunction(()=>!document.querySelector('.a6-opening,.uv-opening'));
  if(screen!=='battle')await page.waitForFunction(()=>!!document.querySelector('.uv-shell'));
  await page.waitForTimeout(700);
  await page.waitForFunction(()=>Array.from(document.images).filter(i=>i.checkVisibility()).every(i=>i.complete&&i.naturalWidth>0));
  const entry={screen,...await visibleWords(page,exempt)};
  if(!entry.text.trim())throw new Error(`${screen}: no visible text; the screen or measurement failed`);
  rows.push(entry);
  if(process.env.C2_WORD_OUTPUT)await writeFile(process.env.C2_WORD_OUTPUT,JSON.stringify(rows,null,2));
  console.log(screen,entry.count);
  if(shots){await mkdir(shots,{recursive:true});await page.screenshot({path:resolve(shots,screen+'.png')});}
  if(screen==='menu')await page.keyboard.press('Escape');
  if(screen==='tips')await page.keyboard.press('Escape');
 }
 return rows;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(fileURLToPath(new URL('../..',import.meta.url))),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({baseURL:process.env.C2_URL??'http://127.0.0.1:5970',viewport:{width:1280,height:720}});
 try{const rows=await runBudget(page,{shots:process.env.C2_WORD_SHOTS,only:process.env.C2_WORD_SCREENS?.split(',')});console.table(rows.map(({screen,count})=>({screen,words:count,budget:25,result:count<=25?'PASS':'FAIL'})));if(process.env.C2_WORD_OUTPUT)await writeFile(process.env.C2_WORD_OUTPUT,JSON.stringify(rows,null,2));if(rows.some(r=>r.count>25))process.exitCode=1;}finally{await browser.close();}
}
