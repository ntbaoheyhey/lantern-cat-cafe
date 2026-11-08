import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from '../lock.mjs';
const artifact=resolve(process.env.B2_ARTIFACT||'docs/cardrpg-look/b2.html'),out=process.env.B2_OUT||'reports/cardrpg-look/b2/v6/ui';await mkdir(out,{recursive:true});const rows=[],errors=[];
await withTimingLock('B2 UI accessibility and live comparison',async()=>{
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [width,height]of [[1024,600],[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(String(e)));await page.goto('file://'+artifact);await page.waitForFunction(()=>window.__depthReview);
 await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.notify(false);});await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 const measure=()=>page.evaluate(()=>{
  const card=document.querySelector('.dp-readable .dp-party'),cards=[...document.querySelectorAll('.dp-readable .dp-party-card')],icons=[...document.querySelectorAll('.dp-readable .dp-skill-state')];
  const lum=rgb=>{const a=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]};
  const number=icons.find(el=>el.querySelector('b'))?.querySelector('b'),style=number&&getComputedStyle(number);const contrast=style?(lum(style.color)+.05)/(lum(style.backgroundColor)+.05):null;
  return {partyHeight:card.getBoundingClientRect().height,numberContrast:contrast,icons:icons.map(el=>({label:el.getAttribute('aria-label'),tabIndex:el.tabIndex})),overflow:document.documentElement.scrollWidth>innerWidth,cardOverflow:cards.map(el=>el.scrollWidth>el.clientWidth),bDevButtons:[...document.querySelectorAll('button')].filter(b=>/^(Look atelier|Look:|Frame meter)/.test(b.textContent)).map(b=>b.textContent),battleFeelLab:[...document.querySelectorAll('.dp-battle button')].filter(b=>b.textContent==='Feel lab').length};
 });
 const metrics=await measure();assert.equal(metrics.overflow,false);assert.equal(metrics.icons.length,12);assert(metrics.numberContrast>=4.5);assert(metrics.cardOverflow.every(v=>!v));assert(metrics.icons.every(i=>i.label&&i.tabIndex===0));assert.equal(metrics.bDevButtons.length,0);assert.equal(metrics.battleFeelLab,0);if(width===1280)assert(metrics.partyHeight<=108);
 await page.locator('.dp-skill-state').first().focus();const tooltip=await page.locator('.dp-skill-state').first().evaluate(el=>getComputedStyle(el,'::after').display);assert.equal(tooltip,'block');
 const before=await page.evaluate(()=>{window.__b2OriginalScene=window.__depthScene;return JSON.stringify(window.__depthReview.battle)});
 await page.getByRole('button',{name:'B2 before/after',exact:true}).click();await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene!==window.__b2OriginalScene,null,{timeout:120000});
 const comparison=await page.evaluate(()=>({same:JSON.stringify(window.__depthReview.battle),oldDisposed:window.__b2OriginalScene.disposed,before:!document.querySelector('.dp-readable')}));assert.equal(comparison.same,before);assert(comparison.oldDisposed&&comparison.before);
 await page.getByRole('button',{name:'B2 before/after',exact:true}).click();await page.waitForFunction(()=>window.__depthScene?.ready&&!!document.querySelector('.dp-readable'),null,{timeout:120000});assert.equal(await page.evaluate(()=>JSON.stringify(window.__depthReview.battle)),before);

 const receipt=await page.evaluate(async()=>{
   const m=window.__depthReview;m.inspect('sorrel-1',-1);
   await new Promise(resolve=>{const check=()=>m.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId)?resolve():requestAnimationFrame(check);check();});
   const scene=window.__depthScene,account=JSON.stringify(m.state),event={version:2,kind:'earned-reveal',sequence:8,round:0,discovery:{kind:'stars',id:'sorrel:3'},itemId:'sorrel',text:'Sorrel reached three stars.'};
   const first=await scene.playEntrance('sorrel',event),start=scene.entrance.startedAt;
   const repeated=await scene.playEntrance('sorrel',event),sameStart=scene.entrance.startedAt===start;
   const duration=scene.entrance.duration,text=scene.earnedBadge.textContent;
   scene.render({...scene.view(),fixedTime:start+1.2},0);
   return {first,repeated,sameStart,duration,text,hidden:scene.earnedBadge.hidden,unchanged:JSON.stringify(m.state)===account};
 });
 assert(receipt.first&&receipt.repeated&&receipt.sameStart&&receipt.hidden&&receipt.unchanged);assert.equal(receipt.duration,1.2);assert.match(receipt.text,/Sorrel/);
 if(width===1280&&await page.getByRole('button',{name:'Battle gallery',exact:true}).count()){
   await page.evaluate(()=>{const m=window.__depthReview;m.closeGallery();m.leave();});
   await page.getByRole('button',{name:'Battle gallery',exact:true}).click();
   assert.equal(await page.locator('.look-b2-pairs figure').count(),6);
   await page.locator('.look-b2-ultimates button').first().click();
   await page.getByLabel('Preview speed',{exact:true}).selectOption('0.25');
   await page.getByLabel('Effect only',{exact:true}).check();
   assert.deepEqual(await page.evaluate(()=>({speed:window.__depthReview.gallerySpeed,only:window.__depthReview.galleryEffectOnly})),{speed:.25,only:true});
 }
 rows.push({width,height,...metrics,tooltip,receipt,comparison:{sameBattle:true,disposed:comparison.oldDisposed}});await page.close();
 }
}finally{await browser.close()}
});
await writeFile(`${out}/checks.json`,JSON.stringify({sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),rows,errors},null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify({sizes:rows.length,errors}));
