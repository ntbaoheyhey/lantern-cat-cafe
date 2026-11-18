/** Real HTMLVideoElement regression for measured media bounds; no art acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const base=resolve('work/v5/CXV/batch-m/media-bounds-R1'),manifest=JSON.parse(await readFile(resolve(base,'manifest.json'),'utf8'));
assert.equal(hash(await readFile(resolve(base,'source.mp4'))),manifest.videoSha256);
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/M-media-bounds-browser-R1');assert(!existsSync(out));await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});
 const scene=await(await page.request.get('http://127.0.0.1:6310/src/game/cardrpg/spine/scene.ts')).text();
 const three=scene.match(/import \* as T from "([^"]+)"/)?.[1];assert(three,'Use the actual served Three module');
 const result=await page.evaluate(async({manifest,base,three})=>{
  const T=await import(three),{opaqueWorldBounds}=await import('/src/game/cardrpg/stage/opaque-pose-bounds.ts'),{actorOpaqueWorldBounds}=await import('/src/game/cardrpg/stage/media-pose-bounds.ts');
  const {sampleLivingCatCast,applyLivingCatCast}=await import('/src/game/rig/living-cast.ts');
  const video=document.createElement('video');video.muted=true;video.preload='auto';video.playsInline=true;
  await new Promise((done,reject)=>{video.onloadeddata=done;video.onerror=()=>reject(Error('Source video failed'));video.src='/@fs'+base+'/source.mp4';});
  const scale=512/manifest.opaqueHeight,geometry=new T.PlaneGeometry(manifest.width*scale,manifest.height*scale,24,24);
  geometry.translate((manifest.width/2-manifest.foot[0])*scale,(manifest.foot[1]-manifest.height/2)*scale,0);
  const original=new Float32Array(geometry.attributes.position.array),texture=new T.VideoTexture(video),material=new T.MeshBasicMaterial({map:texture}),plane=new T.Mesh(geometry,material),root=new T.Group();root.add(plane);
  let legacyError;try{opaqueWorldBounds(root);}catch(error){legacyError={name:error.name,message:error.message};}
  const pose={lean:0,lift:0,tilt:0,follow:0},actor={root,designerIdle:true,designerMedia:{media:{plane,manifest}}},rows=[];
  for(const unit of ['mochi','clover'])for(const reduced of [false,true])for(const progress of [0,.25,.55,.8,1]){
   sampleLivingCatCast(unit,'skill',progress,reduced,pose);applyLivingCatCast(original,geometry.attributes.position.array,512,pose);
   rows.push({unit,reduced,progress,bounds:actorOpaqueWorldBounds(unit,actor)});
  }
  const initial=rows[0].bounds,last=rows[4].bounds;
  material.map=new T.Texture(document.createElement('img'));const poster=actorOpaqueWorldBounds('mochi',actor);material.map.dispose();
  const decoded=[video.videoWidth,video.videoHeight],element=[video.width,video.height];video.pause();video.removeAttribute('src');video.load();geometry.dispose();material.dispose();texture.dispose();
  return{legacyError,decoded,element,rows,initial,last,poster};
 },{manifest,base,three});
 // Position/UV attributes use Float32. Four relative Float32 epsilons allow
 // interpolation/transform rounding, under 0.00025 world units at height 512.
 const heightTolerance=4*2**-23*512,heightError=Math.abs(result.initial.height-512);
 const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),url:page.url(),viewport:[1280,720],indexSha256:hash(await(await page.request.get('http://127.0.0.1:6310/')).body()),harnessSha256:hash(await readFile(import.meta.filename)),manifestSha256:hash(await readFile(resolve(base,'manifest.json'))),videoSha256:manifest.videoSha256,result,heightTolerance,heightError,errors,blockedRequests,pass:false,limits:'Actual Chromium decoder and current stage helpers, using a detached measured media mesh. Twenty cast cases cover both media IDs using the same Mochi descriptor; this is not Clover media acceptance, complete production scene integration or a silhouette measurement.'};
 const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 await save(); // Preserve native measurements even if a following assertion fails.
 try{
  assert.deepEqual(result.element,[0,0]);assert(result.decoded.every(x=>x>0));assert.equal(result.legacyError?.name,'IndexSizeError');
  assert.equal(result.rows.length,20);assert(result.rows.every(r=>r.bounds&&Object.values(r.bounds).every(Number.isFinite)&&r.bounds.width>0&&r.bounds.height>0));
  assert.deepEqual(result.initial,result.last);assert.deepEqual(result.initial,result.poster);assert(heightError<=heightTolerance,`Height error ${heightError} exceeds Float32 tolerance ${heightTolerance}`);assert.equal(errors.length,0);
  assert(blockedRequests.every(r=>r.url==='https://fonts.googleapis.com/css2'&&r.type==='stylesheet'),'Only the fixture intentional external-font block is allowed');
  report.pass=true;await save();
 }catch(error){report.failure={name:error.name,message:error.message};await save();throw error;}
 console.log(JSON.stringify({out,legacy:result.legacyError,rows:result.rows.length,initial:result.initial,heightError,heightTolerance,errors}));
}finally{await browser.close();}
