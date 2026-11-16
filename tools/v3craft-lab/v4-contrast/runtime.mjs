/** Observe actual paused fixture labels and existing interaction states. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='tools/v3craft-lab/v4-contrast/raw/runtime-'+(process.argv[2]??'r1');
const overflowOnly=process.argv.includes('--overflow');
const selectors=overflowOnly?['.b3-statuses > span[aria-label$="more statuses"]']:['.b3-statuses b','.b3-speed','.b3-stars','.b3-auto'];
await mkdir(out,{recursive:true});
const paths=JSON.parse(await readFile('tools/v3craft-lab/v4-clarity/source-paths.json','utf8'));
for(const p of ['battle.css','hud-details.css','BattleHud.tsx'])paths.push('apps/web/src/game/cardrpg/battle-v3/'+p);
const report={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Six real development-fixture views; existing controls hovered/focused. No synthetic counts, no SHIP journey acceptance.',sourceHashes:{},variants:[],errors:[]};
if(overflowOnly)report.scope='First naturally reached overflow-status labels in six development-fixture views. Model advancement only; no synthetic statuses, production changes, or SHIP journey acceptance.';
for(const p of new Set(paths))report.sourceHashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
async function record(page,variant,fixture,width,height,state){
 await page.screenshot({path:out+'/'+variant+'.png'});
 const metadata=await page.evaluate(selectors=>{
  const rows=[];
  for(const selector of selectors)for(const [index,el]of [...document.querySelectorAll(selector)].entries()){
   const cs=getComputedStyle(el),r=el.getBoundingClientRect(),rects=[];
   if(!r.width||!r.height||r.x+r.width<0||r.y+r.height<0||r.x>innerWidth||r.y>innerHeight)continue;
   const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   while(walk.nextNode()){
    const n=walk.currentNode;if(!n.textContent.trim()||n.parentElement.closest('svg'))continue;
    const range=document.createRange();range.selectNodeContents(n);
    for(const b of range.getClientRects())rects.push({x:b.x,y:b.y,width:b.width,height:b.height});
   }
   const ancestors=[];
   for(let node=el;node;node=node.parentElement){
    const s=getComputedStyle(node);
    if(s.opacity!=='1'||s.filter!=='none'||s.mixBlendMode!=='normal')ancestors.push({class:node.className,opacity:s.opacity,filter:s.filter,blend:s.mixBlendMode});
   }
   rows.push({selector,index,text:el.textContent,color:cs.color,fontSize:cs.fontSize,fontWeight:cs.fontWeight,background:cs.backgroundColor,backgroundImage:cs.backgroundImage,rect:{x:r.x,y:r.y,width:r.width,height:r.height},rects,ancestors,fallen:el.closest('.b3-portrait')?.dataset.fallen==='true'});
  }
  return rows;
 },selectors);
 if(!metadata.length)throw Error('No visible label metadata: '+variant);
 const mask=await page.addStyleTag({content:'/* glyph observation */'});
 for(const [name,fill]of [['background','transparent'],['black','#000'],['white','#fff']]){
  await mask.evaluate((el,{fill,selectors})=>el.textContent=selectors.join(',')+'{-webkit-text-fill-color:'+fill+'!important;text-shadow:none!important}',{fill,selectors});
  await page.screenshot({path:out+'/'+variant+'-'+name+'.png'});
 }
 await mask.evaluate(el=>el.remove());
 const view=await page.evaluate(()=>({sceneReady:window.__depthScene.ready,canvasVisible:!!document.querySelector('.dp-arena canvas')?.getBoundingClientRect().width,activeElement:document.activeElement.className,focusVisible:document.activeElement.matches(':focus-visible'),plan:window.__depthReview.plan?.kind??null,actors:window.__depthReview.battle.actors.map(a=>({id:a.id,hp:a.hp,statuses:a.statuses.map(s=>({id:s.id,stacks:s.stacks}))}))}));
 report.variants.push({variant,fixture,width,height,state,view,metadata});
 await writeFile(out+'/drill.json',JSON.stringify(report,null,2)+'\n');
}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height]of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  const {page,errors}=await openFixture(browser,fixture,{width,height});
  // Advance the actual fixture model until the requested label exists naturally.
  const target=overflowOnly?selectors[0]:'.b3-statuses b';
  for(let i=0;i<(overflowOnly?480:120)&&!await page.locator(target).count();i++){
   await page.evaluate(()=>{
    const m=window.__depthReview,s=window.__depthScene;
    m.paused=false;if(!m.plan)m.step();m.tick(100);m.paused=true;m.notify(false);
    cancelAnimationFrame(s.raf);s.render({...s.view(),paused:true},0);
   });await page.clock.runFor(34);
  }
  await page.mouse.move(0,0);await page.clock.runFor(200);
  if(!await page.locator(target).count())throw Error('No real requested status label found: '+fixture.id);
  const prefix=fixture.id+'-'+height;
  await record(page,prefix+'-rest',fixture.id,width,height,'rest');
  if(!overflowOnly&&fixture.id==='wave1'&&height===720){
   for(const [state,selector]of [['hover-speed','.b3-speed'],['hover-auto','.b3-auto'],['hover-portrait','.b3-portrait'],['focus-speed','.b3-speed'],['focus-auto','.b3-auto']]){
    await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement.blur());
    if(state.startsWith('hover'))await page.locator(selector).first().hover();
    else{await page.keyboard.press('Tab');await page.locator(selector).first().focus();}
    await page.clock.runFor(200);await record(page,prefix+'-'+state,fixture.id,width,height,state);
   }
  }
  report.errors.push(...errors.map(message=>({fixture:fixture.id,height,message})));await page.close();
  console.log(JSON.stringify({fixture:fixture.id,height,variants:report.variants.length,errors:errors.length}));
 }
}finally{await browser.close();}
report.finished=new Date().toISOString();
await writeFile(out+'/drill.json',JSON.stringify(report,null,2)+'\n');
if(report.errors.length)process.exitCode=1;
