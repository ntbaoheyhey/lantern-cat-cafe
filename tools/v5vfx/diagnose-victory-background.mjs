/** Isolate sheet image decode/rasterization with reversible page-only probes. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-candidate-fixture.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT);assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const references={baseline:'905463b64c4fec1052de0ad6b12ec58c13c75faafb59387b0d0d3e672cb61b1a',variant:'9030c0a75fafc212d4f4c91986dd2d01daaca04d4d7078afa75af944e8fa6612'};
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),viewport:{width:1280,height:720},method:'Preserved artifact with unmodified crew scheduling. First2s settle and32s4x reproduce original capture ordering. Subsequent page-only sheet image removal/restoration and browser-canvas PNG substitution isolate background contribution. No application source changes or performance claim.',references,captures:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});report.browser=browser.version();
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'));
 const modules=await loadRules();let battle;
 try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
 await page.evaluate(battle=>{const m=window.__depthReview;m.state.settings.reducedMotion=true;m.tutorialBattle=battle;m.showResult();},battle);
 await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(2000);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.waitForTimeout(32000);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 const state=()=>page.evaluate(()=>{
  const sheet=document.querySelector('.uv-sheet'),crew=document.querySelector('.b3-victory-crew'),s=getComputedStyle(sheet);
  return{sheet:sheet.getBoundingClientRect().toJSON(),crew:crew.getBoundingClientRect().toJSON(),canvas:crew.querySelector('canvas').getBoundingClientRect().toJSON(),ready:crew.dataset.ready,drawn:crew.dataset.drawn,animations:document.getAnimations().length,backgroundImage:s.backgroundImage.replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g,'[decoded PNG]'),backgroundSize:s.backgroundSize,backgroundPosition:s.backgroundPosition,backgroundOrigin:s.backgroundOrigin,backgroundClip:s.backgroundClip,opacity:s.opacity,transform:s.transform};
 });
 const originalState=await state();assert.equal(originalState.drawn,'4');assert.equal(originalState.animations,0);
 const capture=async name=>{
  const details=await state();assert.deepEqual(details.crew,originalState.crew);assert.deepEqual(details.canvas,originalState.canvas);assert.deepEqual(details.sheet,originalState.sheet);
  const path=resolve(out,name+'.png');await page.screenshot({path});const bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10_000_000});const rgbSha256=hash(rgb);
  const row={name,path,utc:new Date().toISOString(),width:1280,height:720,pngSha256:hash(bytes),rgbSha256,reference:Object.entries(references).find(([,v])=>v===rgbSha256)?.[0]??'different',state:details};report.captures.push(row);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({name,reference:row.reference,rgbSha256}));
 };
 const settle=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
 await capture('ordinary');
 await page.evaluate(()=>{const e=document.querySelector('.uv-sheet');window.__cxvBackground={value:e.style.getPropertyValue('--b2-scene'),priority:e.style.getPropertyPriority('--b2-scene'),computed:getComputedStyle(e).backgroundImage};e.style.setProperty('--b2-scene','none','important');});
 await settle();await capture('without-sheet-image');
 const restore=()=>page.evaluate(()=>{const e=document.querySelector('.uv-sheet'),a=window.__cxvBackground;if(a.value)e.style.setProperty('--b2-scene',a.value,a.priority);else e.style.removeProperty('--b2-scene');});
 await restore();await settle();await capture('image-restored');
 const decoded=await page.evaluate(async()=>{
  const source=window.__cxvBackground.computed.match(/url\("?([^"\)]+)"?\)/)?.[1];if(!source?.endsWith('/backdrop-garden.webp'))throw Error('Unexpected sheet image');
  const image=new Image();image.src=source;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);if(!pixels.data.some(v=>v))throw Error('Empty decode');
  const url=canvas.toDataURL('image/png');window.__cxvBackground.decoded=url;return{source,width:canvas.width,height:canvas.height,data:url.split(',')[1]};
 });
 const decodedBytes=Buffer.from(decoded.data,'base64'),decodedPath=resolve(out,'browser-decoded-background.png');await writeFile(decodedPath,decodedBytes);report.decodedBackground={source:decoded.source,width:decoded.width,height:decoded.height,path:decodedPath,bytes:decodedBytes.length,sha256:hash(decodedBytes)};
 await capture('after-readback');
 await page.evaluate(async()=>{const a=window.__cxvBackground;const i=new Image();i.src=a.decoded;await i.decode();document.querySelector('.uv-sheet').style.setProperty('--b2-scene',`url("${a.decoded}")`,'important');});await settle();await capture('decoded-png');
 await restore();await settle();await capture('original-restored');
 if(process.env.CXV_BACKGROUND_BLOB==='1'){
  report.blobTrials=[];
  for(let trial=0;trial<2;trial++){
   const info=await page.evaluate(async()=>{
    const a=window.__cxvBackground,source=a.computed.match(/url\("?([^"\)]+)"?\)/)?.[1];
    const response=await fetch(source),bytes=await response.arrayBuffer();if(!response.ok)throw Error('Background fetch failed');
    const digest=await crypto.subtle.digest('SHA-256',bytes),sha256=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
    const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));a.blob=url;
    document.querySelector('.uv-sheet').style.setProperty('--b2-scene',`url("${url}")`,'important');
    return{source,bytes:bytes.byteLength,sha256,url};
   });
   assert.equal(info.sha256,'f0ff3c94111ee34caee444e5c66b51000edc232561344b641a4ca0021b93d001');
   await page.waitForTimeout(1000);await capture('all-bytes-blob-'+trial);
   await restore();await settle();await capture('blob-restored-'+trial);
   await page.waitForTimeout(1000);await capture('blob-restored-settled-'+trial);
   await page.evaluate(()=>{URL.revokeObjectURL(window.__cxvBackground.blob);delete window.__cxvBackground.blob;});report.blobTrials.push(info);
  }
 }
 if(process.env.CXV_BACKGROUND_DECODE_CHOICES){
  const manifestPath=resolve(process.env.CXV_BACKGROUND_DECODE_CHOICES);assert(manifestPath.includes('/work/v5/CXV/'));
  const manifestBytes=await readFile(manifestPath),manifest=JSON.parse(manifestBytes);assert.equal(manifest.sourceSha256,'f0ff3c94111ee34caee444e5c66b51000edc232561344b641a4ca0021b93d001');
  report.decodeChoices={manifestPath,sha256:hash(manifestBytes),...manifest};
  for(const choice of manifest.decodes){
   const bytes=await readFile(choice.path);assert.equal(hash(bytes),choice.sha256);
   const routePath='/__cxv_bg_'+choice.name+'.png';await page.route('**'+routePath,route=>route.fulfill({body:bytes,contentType:'image/png'}));
   await page.evaluate(async path=>{const image=new Image();image.src=path;await image.decode();document.querySelector('.uv-sheet').style.setProperty('--b2-scene',`url("${path}")`,'important');},routePath);
   await settle();await capture('decode-'+choice.name);await restore();await page.waitForTimeout(1000);await capture('decode-restored-'+choice.name);
  }
 }
 assert.equal((await state()).backgroundImage,originalState.backgroundImage);
 report.errors=errors;report.blockedRequests=blockedRequests;assert.equal(errors.length,0);assert.equal(blockedRequests.length,0);report.pass=true;
}catch(error){report.error=String(error);process.exitCode=1;}finally{report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
