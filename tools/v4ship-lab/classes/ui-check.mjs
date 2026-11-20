/** Class UI inspection on explicit seeded local fixtures; not a guest funnel pass. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),sharp=require('sharp'),out=resolve(root,'reports/v4-ship/S2b/ui');
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),rows=[];
try{for(const [width,height] of [[1280,720],[1440,900]]){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message.slice(0,180)));
 await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
 await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 await page.evaluate(async root=>{const m=window.__depthReview,R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');m.state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));m.state.tutorial=4;Object.assign(m,{tutorialBattle:null,galleryBattle:null,replay:null,plan:null,watching:false,paused:true});m.cardId='clover';m.go('team');},root);
 for(const screen of ['team','collection','guide']){
  await page.evaluate(screen=>window.__depthReview.go(screen==='guide'?'codex':screen),screen);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);
  if(screen==='team')await page.locator('.b2-formation [data-combat-class]').first().waitFor({timeout:90000});
  if(screen==='collection')await page.locator('.a6-cat-detail [data-combat-class]').waitFor({timeout:90000});
  if(screen==='guide'){
   await page.getByRole('button',{name:'Battle notes',exact:true}).click();
   await page.getByRole('combobox',{name:'Field note'}).selectOption('class-healer');
   await page.getByRole('button',{name:'Healer',exact:true}).click();
   await page.locator('dialog[aria-label="Healer"] .c2-help-body').waitFor({state:'visible'});
   await page.waitForTimeout(350);
  }
  const measured=await page.evaluate(()=>{
   const visible=e=>e.checkVisibility()&&e.getBoundingClientRect().width>0;
   const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
   const styles=e=>{const s=getComputedStyle(e);return {tag:e.tagName,className:e.className,color:s.color,background:s.backgroundColor,opacity:s.opacity,filter:s.filter};};
   const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(v=>{const n=Number(v)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
   const badges=[...document.querySelectorAll('[data-combat-class]')].filter(visible).map(e=>{const s=styles(e),a=luminance(s.color),b=luminance(s.background);return {class:e.dataset.combatClass,text:e.textContent,box:box(e),style:s,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),overflow:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1};});
   const textOverflow=[...document.querySelectorAll('button,h1,h2,h3,p,small,label')].filter(e=>visible(e)&&e.textContent.trim()&&getComputedStyle(e).overflowX==='hidden'&&e.scrollWidth>e.clientWidth+1).map(e=>({tag:e.tagName,text:e.textContent.slice(0,70),box:box(e)}));
   const guide=document.querySelector('dialog[aria-label="Healer"] .c2-help-body'),guideStyles=[];
   for(let e=guide;e;e=e.parentElement)guideStyles.push(styles(e));
   return {badges,textOverflow,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,detailClass:document.querySelector('.a6-cat-detail [data-combat-class]')?.textContent,guideText:guide?.textContent,guideStyles};
  });
  const image=`${width}-${screen}.png`;await sharp(await page.screenshot()).resize({width:1024}).png().toFile(resolve(out,image));rows.push({width,height,screen,...measured,errors:[...errors],image});
  console.log(JSON.stringify({width,screen,classes:measured.badges.map(b=>b.class),minimumBadgeContrast:measured.badges.length?Math.min(...measured.badges.map(b=>b.contrast)):null,badgeOverflow:measured.badges.filter(b=>b.overflow).length,textOverflow:measured.textOverflow.length,horizontalOverflow:measured.horizontalOverflow,errors:errors.length}));
 }
 await context.close();
}}finally{await browser.close();await writeFile(resolve(out,'checks.json'),JSON.stringify({at:new Date().toISOString(),scope:'Seeded class UI only; no funnel claim',rows},null,2)+'\n');}
