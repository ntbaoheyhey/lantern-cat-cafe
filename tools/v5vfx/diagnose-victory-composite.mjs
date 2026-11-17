/** Isolate first full GPU pixels from page composition; no runtime source changes. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-candidate-fixture.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT);assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),viewport:{width:1280,height:720},method:'Production diagnostic with WebGL readback only on first full four-actor render and one explicit resize restoration. Not performance evidence. Native remains the preserved build-time variant. Page CSS probes are diagnostic only.',captures:[],errors:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{setupPage:page=>page.addInitScript(()=>{
  const audit=globalThis.__cxvVictoryPixels={armed:true,frameCalls:0,pixels:null,draws:0,samples:0};
  const proto=WebGL2RenderingContext.prototype,clear=proto.clear;proto.clear=function(...args){if(this.canvas.matches('.b3-victory-crew>canvas'))audit.frameCalls=0;return clear.apply(this,args);};
  for(const name of ['drawElements','drawArrays']){const original=proto[name];proto[name]=function(...args){
   const value=original.apply(this,args);if(!this.canvas.matches('.b3-victory-crew>canvas'))return value;
   audit.draws++;audit.frameCalls++;
   if(audit.armed&&audit.frameCalls===4&&this.canvas.parentElement.dataset.drawn==='4'){
    const width=this.drawingBufferWidth,height=this.drawingBufferHeight,pixels=new Uint8Array(width*height*4);this.readPixels(0,0,width,height,this.RGBA,this.UNSIGNED_BYTE,pixels);
    audit.pixels={width,height,rgba:Array.from(pixels),error:this.getError()};audit.samples++;audit.armed=false;
   }return value;
  };}
 })});
 const modules=await loadRules();let battle;
 try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
 await page.evaluate(battle=>{const m=window.__depthReview;m.state.settings.reducedMotion=true;m.tutorialBattle=battle;m.showResult();},battle);
 await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForFunction(()=>globalThis.__cxvVictoryPixels.pixels);await page.waitForTimeout(2000);
 const gpu=async name=>{const state=await page.evaluate(()=>globalThis.__cxvVictoryPixels),rgba=Buffer.from(state.pixels.rgba);assert.equal(state.pixels.error,0);assert(rgba.some(v=>v));const path=resolve(out,name+'.rgba');await writeFile(path,rgba);return{name,path,width:state.pixels.width,height:state.pixels.height,sha256:hash(rgba),draws:state.draws,samples:state.samples};};
 report.initialGpu=await gpu('initial');
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.waitForTimeout(32000);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 const capture=async name=>{const path=resolve(out,name+'.png');await page.locator('.b3-victory-crew').screenshot({path});const bytes=await readFile(path),rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);report.captures.push({name,path,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:hash(bytes),rgbSha256:hash(rgb)});};
 await capture('ordinary');
 report.style=await page.locator('.b3-victory-crew').evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),canvasRect:e.querySelector('canvas').getBoundingClientRect().toJSON(),canvasStyle:e.querySelector('canvas').getAttribute('style'),animations:document.getAnimations().map(a=>({state:a.playState,currentTime:a.currentTime,target:a.effect?.target?.className}))}));
 await page.locator('.b3-victory-crew>canvas').evaluate(e=>e.style.visibility='hidden');await capture('background-only');
 await page.locator('.b3-victory-crew>canvas').evaluate(e=>e.style.removeProperty('visibility'));
 await page.locator('.b3-victory-crew').evaluate(e=>e.style.background='#211e36');await capture('solid-backing');
 await page.locator('.b3-victory-crew').evaluate(e=>e.style.removeProperty('background'));
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});await capture('animations-disabled');
 await page.locator('.b3-victory-crew').evaluate(e=>e.style.height='246px');await page.waitForTimeout(150);
 await page.evaluate(()=>globalThis.__cxvVictoryPixels.armed=true);await page.locator('.b3-victory-crew').evaluate(e=>e.style.removeProperty('height'));
 await page.waitForFunction(()=>globalThis.__cxvVictoryPixels.samples>=2);await page.waitForTimeout(150);report.restoredGpu=await gpu('restored');await capture('size-restored');
 report.errors=errors;report.blockedRequests=blockedRequests;report.pass=!errors.length&&!blockedRequests.length&&report.initialGpu.sha256===report.restoredGpu.sha256;report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode:report.artifactMode,pass:report.pass,initial:report.initialGpu,restored:report.restoredGpu,errors}));
}finally{await browser.close();}
