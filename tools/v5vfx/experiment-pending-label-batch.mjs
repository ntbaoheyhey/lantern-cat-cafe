/** Measure actual HUD clone footprints, cleanup and forced-layout counts. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {measurePendingLabelBatch} from './pending-label-prototype.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-pending-label-batch');await mkdir(out,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:sha(await readFile(new URL(import.meta.url))),prototypeSha256:sha(await readFile(new URL('./pending-label-prototype.mjs',import.meta.url))),statusSourceSha256:sha(await readFile('apps/web/src/game/cardrpg/battle-v3/world-label-status.ts')),viewport:{width:1280,height:720},method:'Actual HUD label DOM/current fonts/CSS. Bind synthetic pending status snapshots only in the browser fixture; compare every original single-label footprint with batched clone append/read/remove. Test missing source,overflow stacks,hidden nodes,reversed input and cleanup. Seven alternating20-call warmed blocks at4xCPU;CDP LayoutCount/LayoutDuration corroborate. No runtime edits or ordinary FPS claim.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const fixture of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===fixture),{fixedClock:false});report.url=page.url();
  const result=await page.evaluate(async({fixture,candidate})=>{
   const {bindWorldStatusSource,pendingLabelExtent}=await import('/src/game/cardrpg/battle-v3/world-label-status.ts');
   const batch=new Function('return ('+candidate+')')(),s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
   s.render({...s.view(),frame:null,fixedTime:30,paused:true,galleryPreview:true},0);
   const nodes=[...document.querySelectorAll('.b3-world')],parents=[...new Set(nodes.map(n=>n.parentElement))];
   const actual=(m.visualBattle?.actors??[]).map(a=>({id:a.id,shield:a.shield>0,stacks:a.statuses.map(s=>s.stacks)}));let rows=actual;
   const releases=parents.map(parent=>bindWorldStatusSource(parent,()=>rows));
   const lookup=node=>rows.find(r=>r.id===node.dataset.actor),single=list=>list.map(n=>pendingLabelExtent(n)),multiple=list=>{const result=batch(list,lookup);return list.map(n=>result.get(n));};
   const cases=[{name:'current',rows:actual},{name:'empty',rows:nodes.map(n=>({id:n.dataset.actor,shield:false,stacks:[]}))},{name:'shield',rows:nodes.map(n=>({id:n.dataset.actor,shield:true,stacks:[]}))},{name:'three-wide',rows:nodes.map(n=>({id:n.dataset.actor,shield:true,stacks:[12345,99,3]}))},{name:'overflow',rows:nodes.map(n=>({id:n.dataset.actor,shield:true,stacks:[12345,99,3,4,5]}))},{name:'source-missing',rows:[]}],checks=[];
   for(const reduced of [false,true])for(const c of cases)for(const reversed of [false,true]){
    const hud=document.querySelector('.b3-hud');hud.dataset.reduced=String(reduced);rows=c.rows;const list=reversed?[...nodes].reverse():nodes;
    const before=parents.map(p=>p.innerHTML),a=single(list),b=multiple(list),clean=JSON.stringify(before)===JSON.stringify(parents.map(p=>p.innerHTML));checks.push({name:c.name,reduced,reversed,rows:list.length,equal:JSON.stringify(a)===JSON.stringify(b),clean,rects:a});
   }
   const hidden=nodes[0],oldHidden=hidden.hidden;hidden.hidden=true;rows=cases[4].rows;const hiddenPair=[single(nodes),multiple(nodes)];checks.push({name:'hidden',equal:JSON.stringify(hiddenPair[0])===JSON.stringify(hiddenPair[1]),clean:parents.every(p=>!p.querySelector('[aria-hidden="true"][inert]'))});hidden.hidden=oldHidden;
   const rect=Element.prototype.getBoundingClientRect;let threw=false;
   Element.prototype.getBoundingClientRect=function(){if(this.hasAttribute('inert'))throw Error('injected measurement failure');return rect.call(this);};
   const before=parents.map(p=>p.innerHTML);try{multiple(nodes);}catch{threw=true;}finally{Element.prototype.getBoundingClientRect=rect;}
   checks.push({name:'exception-cleanup',equal:threw,clean:JSON.stringify(before)===JSON.stringify(parents.map(p=>p.innerHTML))});
   rows=cases[4].rows;const run=(mode,cycles=20)=>{const fn=mode==='single'?single:multiple,start=performance.now();for(let i=0;i<cycles;i++)fn(nodes);return{mode,ms:performance.now()-start,cycles,labels:nodes.length};};
   window.__cxvPendingBench={run,dispose(){for(const release of releases)release();for(const parent of parents)bindWorldStatusSource(parent,()=>actual);delete window.__cxvPendingBench;}};
   return{fixture,checks,nodes:nodes.map(n=>n.dataset.actor)};
  },{fixture,candidate:measurePendingLabelBatch.toString()});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
  await page.evaluate(()=>{window.__cxvPendingBench.run('single',3);window.__cxvPendingBench.run('batch',3);});
  result.blocks=[];
  const metric=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  for(let block=0;block<7;block++)for(const mode of block%2?['batch','single']:['single','batch']){const before=await metric(),row=await page.evaluate(mode=>window.__cxvPendingBench.run(mode),mode),after=await metric();result.blocks.push({...row,block,layoutCount:after.LayoutCount-before.LayoutCount,layoutDurationMs:1000*(after.LayoutDuration-before.LayoutDuration)});}
  result.timing=['single','batch'].map(mode=>{const a=result.blocks.filter(r=>r.mode===mode),median=key=>a.map(r=>r[key]).sort((x,y)=>x-y)[3];return{mode,medianMs:median('ms'),medianLayoutCount:median('layoutCount'),medianLayoutMs:median('layoutDurationMs')};});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await page.evaluate(()=>window.__cxvPendingBench.dispose());
  report.fixtures.push(result);report.errors.push(...errors);await page.close();
 }
 report.ended=new Date().toISOString();report.pass=!report.errors.length&&report.fixtures.every(f=>f.checks.every(c=>c.equal&&c.clean));await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,errors:report.errors,fixtures:report.fixtures.map(f=>({fixture:f.fixture,checks:f.checks.length,failures:f.checks.filter(c=>!c.equal||!c.clean),timing:f.timing}))}));assert(report.pass);
}finally{await browser.close();}
