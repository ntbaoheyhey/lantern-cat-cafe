import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {root,evidenceMeta} from './check-gates.mjs';
const out=resolve(root,'reports/v3-battle/a2/T1');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),fixtures={},fontFindings=[];
async function sample(page){return page.evaluate(()=>{
 const words=[],fonts=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const n=walker.currentNode,e=n.parentElement;
  if(!e||!n.textContent.trim()||e.closest('script,style,option,svg,.sr-only,[hidden],.b3-cutin')||!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
  const range=document.createRange();range.selectNodeContents(n);
  if(![...range.getClientRects()].some(r=>r.width>1&&r.height>1&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight))continue;
  if(e.closest('details:not([open])')&&!e.closest('summary'))continue;
  words.push(...(n.textContent.match(/[\p{L}]+(?:['’][\p{L}]+)*/gu)??[]));fonts.push({text:n.textContent.trim().slice(0,40),font:getComputedStyle(e).fontFamily});
 }
 const numbers=window.__depthScene.numbers;
 const criticalTags=numbers.drawn.filter(n=>numbers.bursts.find(b=>b.key===n.key)?.critical).length;
 words.push(...Array(criticalTags).fill('CRIT'));
 const canvasFont=getComputedStyle(numbers.canvas).getPropertyValue('--font-num').trim();fonts.push({text:'bitmap digit atlas',font:canvasFont});
 return {words,count:words.length,criticalTags,fonts,errors:window.__depthReview.sceneError};
 });}
try{
 for(const fixture of config.fixtures){
  const {page,errors}=await openFixture(browser,fixture),samples=[];
  for(let i=0;i<900;i++){
   await page.evaluate(i=>{const m=window.__depthReview,s=window.__depthScene;m.paused=false;if(!m.plan&&!m.battle.result)m.step();m.tick(i?1000/30:0,1000+i*1000/30);m.paused=true;s.render({...s.view(),fixedTime:10+i/30,paused:true},1/30);},i);
   await page.clock.runFor(Math.round((i+1)*1000/30)-Math.round(i*1000/30));
   if(i%30===0){const row=await sample(page);samples.push({second:i/30,...row});fontFindings.push(...row.fonts);}
   if(i===120)await page.screenshot({path:resolve(out,`${fixture.id}.png`)});
  }
  const parity=await page.evaluate(()=>{const R=window.__v3a2.R,a=structuredClone(window.__depthReview.battle),b=structuredClone(window.__v3a2.initial);R.playBattle(a,'auto');R.playBattle(b,'auto');return JSON.stringify(a)===JSON.stringify(b);});
  fixtures[fixture.id]={framesCounted:samples.length,maxNonNumberWords:Math.max(...samples.map(s=>s.count)),samples,parity,browserErrors:errors};
  console.log(fixture.id,JSON.stringify({max:fixtures[fixture.id].maxNonNumberWords,parity,errors}));await page.close();
 }
 for(const [name,width,height] of [['1280x720',1280,720],['1440x900',1440,900],['phone',390,844]]){
  const {page,errors}=await openFixture(browser,config.fixtures[2],{width,height});await page.clock.runFor(1200);
  await page.screenshot({path:resolve(out,name+'.png')});
  const touch=await page.locator('.b3-hud button:not([hidden])').evaluateAll(nodes=>nodes.filter(n=>n.checkVisibility()).map(n=>{const r=n.getBoundingClientRect();return {label:n.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height};}));
  await writeFile(resolve(out,name+'-controls.json'),JSON.stringify({touch,errors},null,2)+'\n');await page.close();
 }
}finally{await browser.close();}
const fontLint={systemFonts:fontFindings.filter(f=>!/(Baloo|Barlow)/i.test(f.font)).length,families:[...new Set(fontFindings.map(f=>f.font))]};
await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),fixtures,fontLint},null,2)+'\n');console.log('fontLint',JSON.stringify(fontLint));
