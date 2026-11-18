/** Read-only artifact control: distinguish screenshot/guide/loss RGB histories at DPR2. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-battle-context-native-production'),out=resolve(root,'work/v5/CXV/films/V7-F-battle-notice-rgb-control');assert(!existsSync(out));await mkdir(out,{recursive:true});
const build=JSON.parse(await readFile(resolve(production,'build.json'))),artifact=build.artifacts[0];assert.equal(artifact.transformed,0);
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,config,openFixture,judgeUrl}=await import('./production-candidate-fixture.mjs');const {preview}=await import(require.resolve('vite'));
const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),report={utc:new Date().toISOString(),source:build.source,indexSha256:artifact.indexSha256,url:judgeUrl,captures:[],pass:false};
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{deviceScaleFactor:2});const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:2,mobile:false});await page.locator('.b3-wave-intro').waitFor({state:'hidden'});
 await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;m.paused=true;m.notify(false);for(const a of document.getAnimations())a.pause();s.time=20.3;s.phaseNoticeAt=-100;s.dirty=true;s.raf=requestAnimationFrame(s.loop);const gl=s.renderer.getContext();globalThis.__noticeRgb={gl,extension:gl.getExtension('WEBGL_lose_context')};});
 const pixels=[];
 const capture=async name=>{
  await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(500);await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:.5}}),path=resolve(out,name+'.png');await writeFile(path,Buffer.from(shot.data,'base64'));
  const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});pixels.push(rgb);
  const state=await page.evaluate(()=>({notice:window.__depthReview.sceneError,time:window.__depthScene.time,age:window.__depthReview.animationAt,world:[...document.querySelectorAll('.b3-world')].map(n=>({rect:n.getBoundingClientRect().toJSON(),html:n.innerHTML}))}));
  const difference=other=>{let count=0,minX=1280,minY=720,maxX=-1,maxY=-1,maxChannel=0;for(let i=0;i<rgb.length;i+=3)if(rgb[i]!==other[i]||rgb[i+1]!==other[i+1]||rgb[i+2]!==other[i+2]){count++;minX=Math.min(minX,i/3%1280);maxX=Math.max(maxX,i/3%1280);minY=Math.min(minY,Math.floor(i/3/1280));maxY=Math.max(maxY,Math.floor(i/3/1280));for(let j=0;j<3;j++)maxChannel=Math.max(maxChannel,Math.abs(rgb[i+j]-other[i+j]));}return{count,minX,minY,maxX,maxY,maxChannel};};
  const row={name,path,sha256:hash(await readFile(path)),rgbSha256:hash(rgb),state,differenceFromInitial:difference(pixels[0]),differenceFromPrevious:difference(pixels.at(-2)??rgb)};report.captures.push(row);console.log(JSON.stringify({name,rgbSha256:row.rgbSha256,initial:row.differenceFromInitial,previous:row.differenceFromPrevious}));
 };
 const controls=async()=>{await page.getByRole('button',{name:'Read battle guide',exact:true}).click();await page.getByRole('button',{name:'Close guide',exact:true}).click();await page.getByRole('button',{name:'More battle options',exact:true}).click();await page.keyboard.press('Escape');};
 const loss=async()=>{await page.evaluate(()=>globalThis.__noticeRgb.extension.loseContext());await page.waitForFunction(()=>globalThis.__noticeRgb.gl.isContextLost()&&window.__depthReview.sceneError);};
 const restore=async()=>{await page.evaluate(()=>globalThis.__noticeRgb.extension.restoreContext());await page.waitForFunction(()=>!globalThis.__noticeRgb.gl.isContextLost()&&!window.__depthReview.sceneError);};
 await capture('initial-a');await capture('initial-b');await controls();await capture('controls');await loss();await capture('lost');await restore();await capture('restored-a');await capture('restored-b');await controls();await capture('controls-again');await loss();await restore();await capture('restored-again');
 assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.pass=true;report.errors=errors;report.blockedRequests=blockedRequests;
}finally{await browser.close();await new Promise(done=>server.httpServer.close(done));report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
