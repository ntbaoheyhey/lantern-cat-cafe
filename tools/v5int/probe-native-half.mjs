/** Actual desktop production atlas comparison, without response or rendering overrides. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';

const [label,compare]=process.argv.slice(2);assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/native-half-review',label);assert(!existsSync(out));await mkdir(out,{recursive:true});
const ids=['kettle-knight','crumb-sentinel','pollen-scout','spool-ram'],hash=b=>createHash('sha256').update(b).digest('hex');
const report={utc:new Date().toISOString(),url:judgeUrl,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),harnessSha256:hash(await readFile(import.meta.filename)),viewport:{width:1280,height:720},method:'Own production wave3, normal/reduced at frozen30s. Actual selected atlas URLs and every source alpha sample verified with native Image/Canvas. Full game captures plus isolated native GPU actor RGBA for bounded image comparison; no source imports, response substitutions or ordinary gameplay/performance claim.',runs:[],captures:[],complete:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await save();
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const mode=reduced?'reduced':'normal',requests=[];
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{setupPage:async page=>page.on('response',r=>{const path=new URL(r.url()).pathname;if(ids.some(id=>path.includes('/units/'+id+'/rig-depth')))requests.push({path,status:r.status()});})});
  const rows=await page.evaluate(async({ids,reduced})=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.state.settings.reducedMotion=reduced;m.plan=null;m.animationAt=0;m.paused=true;
   for(const a of document.getAnimations()){a.pause();a.currentTime=0;}
   const view={...s.view(),frame:null,fixedTime:30,paused:true};s.render(view,0);
   const native=[];
   for(const [actorId,e]of s.actors){if(!ids.includes(e.asset))continue;
    const images=[];e.actor.root.traverse(n=>{const materials=Array.isArray(n.material)?n.material:[n.material];for(const material of materials){const image=material?.map?.image;if(image?.currentSrc&&!images.some(x=>x.url===image.currentSrc))images.push({url:image.currentSrc,width:image.naturalWidth,height:image.naturalHeight});}});
    native.push({actorId,asset:e.asset,images,body:s.bodyBoxes.get(actorId),matrix:Array.from(e.actor.root.matrixWorld.elements)});
   }
   return native;
  },{ids,reduced});
  assert(ids.every(id=>rows.some(r=>r.asset===id)),'All four targeted actors must be present');
  const decode=await page.evaluate(async rows=>{
   const result=[];
   for(const row of rows)for(const selected of row.images){
    const original='/units/'+row.asset+'/rig-depth.half.webp';if(!selected.url.includes('/rig-depth.half.'))continue;
    const pixels=async url=>{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0);return{width:c.width,height:c.height,data:x.getImageData(0,0,c.width,c.height).data};};
    const a=await pixels(original),b=await pixels(selected.url);if(a.width!==b.width||a.height!==b.height)throw Error('Decoded dimension mismatch');let alphaMaxError=0,alphaChangedPixels=0;
    for(let i=3;i<a.data.length;i+=4){const d=Math.abs(a.data[i]-b.data[i]);alphaMaxError=Math.max(alphaMaxError,d);alphaChangedPixels+=Number(d>0);}
    result.push({asset:row.asset,url:selected.url,width:b.width,height:b.height,alphaMaxError,alphaChangedPixels});
   }return result;
  },rows);
  assert(ids.every(id=>decode.some(r=>r.asset===id)),'All four selected half atlases must be verified');assert(decode.every(r=>r.alphaMaxError===0));
  const rawPath=resolve(out,mode+'.png'),path=resolve(out,mode+'-1024.jpg');await page.screenshot({path:rawPath});await sharp(rawPath).resize(1024,576).jpeg({quality:92}).toFile(path);
  const stats=await sharp(path).stats(),meta=await sharp(path).metadata();assert(meta.width===1024&&meta.height===576&&stats.channels.every(c=>c.stdev>10));
  report.captures.push({path,rawPath,sha256:hash(await readFile(path)),dimensions:[meta.width,meta.height],stdev:stats.channels.map(c=>c.stdev),utc:new Date().toISOString()});await save();
  const isolated=await page.evaluate(async ids=>{
   const s=window.__depthScene,visible=s.scene.children.map(n=>[n,n.visible]),background=s.scene.background,sampleColor=[...s.actors.values()].find(e=>e.craftPose?.drawing).craftPose.drawing.material.color.clone(),color=s.renderer.getClearColor(sampleColor),alpha=s.renderer.getClearAlpha(),gl=s.renderer.getContext(),data=new Uint8Array(s.width*s.height*4),rows=[];
   try{for(const [actorId,e]of s.actors){if(!ids.includes(e.asset))continue;for(const[n,v]of visible)n.visible=v&&n===e.actor.root;s.scene.background=null;s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,s.width,s.height,gl.RGBA,gl.UNSIGNED_BYTE,data);let base64='';for(let i=0;i<data.length;i+=8192)base64+=String.fromCharCode(...data.subarray(i,i+8192));rows.push({actorId,asset:e.asset,width:s.width,height:s.height,base64:btoa(base64)});}}
   finally{for(const[n,v]of visible)n.visible=v;s.scene.background=background;s.renderer.setClearColor(color,alpha);s.renderer.render(s.scene,s.camera);}return rows;
  },ids);
  for(const row of isolated){const data=Buffer.from(row.base64,'base64');delete row.base64;row.rgbaPath=resolve(out,mode+'-'+row.actorId.replace(/[^a-z0-9-]/gi,'_')+'.rgba');row.sha256=hash(data);await writeFile(row.rgbaPath,data);
   if(compare){const prior=JSON.parse(await readFile(resolve(compare,'report.json'),'utf8')).runs.find(r=>r.mode===mode).isolated.find(r=>r.actorId===row.actorId);const a=await readFile(prior.rgbaPath);assert.equal(a.length,data.length);let sum=0,n=0,max=0,alphaMax=0;for(let i=0;i<a.length;i+=4){alphaMax=Math.max(alphaMax,Math.abs(a[i+3]-data[i+3]));if(a[i+3]||data[i+3])for(let c=0;c<3;c++){const d=a[i+c]-data[i+c];sum+=d*d;n++;max=Math.max(max,Math.abs(d));}}row.comparison={priorSha256:prior.sha256,visibleRgbRmse:Math.sqrt(sum/n),visibleRgbMax:max,alphaMaxError:alphaMax,visiblePixels:n/3};assert.equal(alphaMax,0);}
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push({mode,rows,decode,requests,isolated,errors,blockedRequests});await save();await page.close();
 }
 report.complete=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await browser.close();report.finishedUtc=new Date().toISOString();await save();console.log(JSON.stringify({out,complete:report.complete,failure:report.failure}));}
