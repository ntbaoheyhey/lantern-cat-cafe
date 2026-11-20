/** Public preview switching/return must keep the crew in the HUD's order. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp'),baseline=process.argv.includes('--baseline');
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-roster-'+(baseline?'before':'after');if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid tag');
const out=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const report={method:'Public DepthModel preview and close-gallery actions on a paused offline practice fixture, both sizes/motion modes. Compare actual screen x order with rendered A6 card order. No progression sample.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 for(const [width,height]of [[1280,720],[1440,900]])for(const reduced of [false,true]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(reduced=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.tutorial();m.fight();m.paused=true;m.notify(false);window.rosterOriginal=JSON.stringify(m.battle);},reduced);
  for(const id of ['practice','mochi-4','inkcap-4','cinnamon-4','return']){
   if(id!=='practice')await page.evaluate(id=>{const m=window.__depthReview;if(id==='return')m.closeGallery();else m.inspect(id,.7);},id);
   await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&m.sceneReady&&s.audit().stage.source==='painted'&&m.visualBattle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId)&&s.actors.size===m.visualBattle.actors.length;});
   const result=await page.evaluate(()=>{
    const m=window.__depthReview,s=window.__depthScene;s.prepare(s.view());s.render(s.view(),0);
    const cards=[...document.querySelectorAll('.uv-battle-cat')].map(el=>el.dataset.actor),expected=s.view().actors.filter(a=>a.side==='party').map(a=>a.id);
    const units=s.sizeAudit().units.filter(u=>u.side==='party').sort((a,b)=>a.box.x-b.box.x),actual=units.map(u=>u.id);
    return{cards,expected,actual,match:JSON.stringify(cards)===JSON.stringify(actual)&&JSON.stringify(expected)===JSON.stringify(actual),overlaps:s.labelAudit.overlaps,original:window.rosterOriginal===JSON.stringify(m.tutorialBattle),sizes:units.map(u=>u.ratio)};
   });report.cases.push({width,height,reduced,id,...result});
   if(['inkcap-4','return'].includes(id)){const file=`${id}-${reduced?'calm':'motion'}-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});}
   if(!baseline&&(!result.match||result.overlaps||!result.original))throw Error('Roster order '+JSON.stringify(report.cases.at(-1)));
  }
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,mismatches:report.cases.filter(c=>!c.match).length,shots:report.shots.length,errors:report.errors}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
