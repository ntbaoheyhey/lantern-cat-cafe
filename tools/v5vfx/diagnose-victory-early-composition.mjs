/** Early first-complete-frame freeze compared with naturally idle production artifacts. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-candidate-fixture.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT),early=process.env.CXV_EARLY_FREEZE==='1';
assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
assert(!early||process.env.CXV_ARTIFACT_MODE==='baseline');
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),earlyFreeze:early,viewport:{width:1280,height:720},method:'Preserved local artifacts. Baseline can park all RAF immediately after the first four-actor WebGL frame; natural candidate remains unchanged. No GPU readback before screenshots. Record computed composition styles, image readiness and CDP layers.32s at4x is a reproduction window, not a performance test. Resume and reversible crew-size restoration follow the original captures.',captures:[],errors:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{setupPage:page=>page.addInitScript(()=>{
  const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
  const a=globalThis.__cxvEarlyComposition={enabled:false,frozen:false,parked:new Map(),calls:0,skipped:0,draws:0,frameDraws:0,completeAt:null};
  window.requestAnimationFrame=callback=>{let id;id=request(now=>{if(a.frozen){a.parked.set(id,callback);a.skipped++;}else{a.calls++;callback(now);}});return id;};
  window.cancelAnimationFrame=id=>{a.parked.delete(id);cancel(id);};
  a.resume=()=>{a.enabled=false;a.frozen=false;const callbacks=[...a.parked.values()];a.parked.clear();for(const callback of callbacks)request(callback);};
  const proto=WebGL2RenderingContext.prototype,clear=proto.clear;
  proto.clear=function(...args){if(this.canvas.matches('.b3-victory-crew>canvas'))a.frameDraws=0;return clear.apply(this,args);};
  for(const name of ['drawElements','drawArrays']){const original=proto[name];proto[name]=function(...args){
   const result=original.apply(this,args);if(!this.canvas.matches('.b3-victory-crew>canvas'))return result;
   a.draws++;a.frameDraws++;if(a.frameDraws===4&&this.canvas.parentElement.dataset.drawn==='4'&&a.completeAt===null){a.completeAt=performance.now();if(a.enabled)a.frozen=true;}return result;
  };}
 })});
 const cdp=await page.context().newCDPSession(page);let layers=[];cdp.on('LayerTree.layerTreeDidChange',event=>layers=event.layers??[]);await cdp.send('LayerTree.enable');
 const modules=await loadRules();let battle;
 try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
 await page.evaluate(({battle,early})=>{const m=window.__depthReview;globalThis.__cxvEarlyComposition.enabled=early;m.state.settings.reducedMotion=true;m.tutorialBattle=battle;m.showResult();},{battle,early});
 await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForFunction(()=>globalThis.__cxvEarlyComposition.completeAt!==null);await page.waitForTimeout(2000);
 const capture=async name=>{
  const state=await page.evaluate(()=>{
   const a=globalThis.__cxvEarlyComposition,e=document.querySelector('.b3-victory-crew');
   const selectors=['.b3-victory-crew>canvas','.b3-victory-crew','.a6-result-companion','.c2-result','.uv-sheet-content','.uv-sheet','.uv-shell','.uv-app'];
   const props=['backgroundImage','backgroundColor','opacity','filter','backdropFilter','mixBlendMode','transform','isolation','willChange','contain','clipPath','visibility','borderRadius'];
   const styles=selectors.map(selector=>{const n=document.querySelector(selector);if(!n)return{selector,missing:true};const s=getComputedStyle(n);return{selector,rect:n.getBoundingClientRect().toJSON(),style:Object.fromEntries(props.map(p=>[p,s[p]]))};});
   return{frozen:a.frozen,parked:a.parked.size,calls:a.calls,skipped:a.skipped,draws:a.draws,completeAt:a.completeAt,now:performance.now(),ready:e.dataset.ready,drawn:e.dataset.drawn,styles,animations:document.getAnimations().map(v=>({state:v.playState,time:v.currentTime,target:v.effect?.target?.className})),images:[...document.images].filter(i=>i.getBoundingClientRect().width).map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth,height:i.naturalHeight}))};
  });
  const layerRows=[];for(const layer of layers){let reason;try{reason=await cdp.send('LayerTree.compositingReasons',{layerId:layer.layerId});}catch{reason={unavailable:true};}layerRows.push({...layer,...reason});}
  const path=resolve(out,name+'.png'),crewPath=resolve(out,name+'-crew.png');await page.screenshot({path});await page.locator('.b3-victory-crew').screenshot({path:crewPath});
  const decode=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10_000_000});
  const row={name,path,crewPath,utc:new Date().toISOString(),sha256:hash(await readFile(path)),fullRgbSha256:hash(decode(path)),crewRgbSha256:hash(decode(crewPath)),state,layers:layerRows};report.captures.push(row);console.log(JSON.stringify({name,full:row.fullRgbSha256,crew:row.crewRgbSha256,draws:state.draws,frozen:state.frozen}));
  assert.equal(state.ready,'true');assert.equal(state.drawn,'4');assert(state.images.every(i=>i.complete&&i.width>0),'Visible images must be loaded');
 };
 await capture('loaded');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.waitForTimeout(32000);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await capture('settled');
 if(early){assert(report.captures.at(-1).state.parked>0);assert.equal(report.captures[0].state.draws,report.captures[1].state.draws);await page.evaluate(()=>globalThis.__cxvEarlyComposition.resume());await page.waitForTimeout(2000);await capture('resumed');}
 await page.locator('.b3-victory-crew').evaluate(e=>e.style.height='246px');await page.waitForTimeout(200);await page.locator('.b3-victory-crew').evaluate(e=>e.style.removeProperty('height'));await page.waitForTimeout(1000);await capture('size-restored');
 report.errors=errors;report.blockedRequests=blockedRequests;report.pass=!errors.length&&!blockedRequests.length;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');assert(report.pass);
}finally{await browser.close();}
