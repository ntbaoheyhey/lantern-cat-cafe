/** GPU alpha regression: actual production decoder chunk, synthetic packed pixels. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/M-media-focus-gpu-R1');assert(!existsSync(out));await mkdir(out,{recursive:true});
const loaderPath='/Users/bao/taskbar-hero-chain/apps/web/src/game/cardrpg/spine/designer-idle-loader.ts',loader=await readFile(loaderPath,'utf8');
const chunk=loader.slice(loader.indexOf('export function designerMapChunk('),loader.indexOf('export class DesignerIdleMedia')).replace('export function','function').replace(':DesignerIdleFormat','');
assert(chunk.startsWith('function designerMapChunk(')&&chunk.includes('h264-ycrcb-alpha-four-plane'));
const report={utc:new Date().toISOString(),viewport:[1280,720],...runtimeEvidence(),loaderPath,loaderSha256:hash(loader),decoderChunkSha256:hash(chunk),harnessSha256:hash(await readFile(import.meta.filename)),method:'Actual CXI decoder function with synthetic circle mask in packed opaque texture. Pre-fix and patched focus share Three and data. GPU pixels only; no production or art acceptance.',pass:false};
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const{page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 const scene=await(await page.request.get('http://127.0.0.1:6310/src/game/cardrpg/spine/scene.ts')).text(),three=scene.match(/import \* as T from "([^"]+)"/)?.[1];assert(three);
 report.rows=await page.evaluate(async({chunk,three})=>{
  const T=await import(three),{CasterFocus:Fixed}=await import('/src/game/cardrpg/battle-v3/focus.ts');
  const{CasterFocus:Before}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/batch-m/media-focus-baseline.ts');
  const decode=new Function(chunk+';return designerMapChunk;')(),rows=[];
  const renderer=new T.WebGLRenderer({alpha:true,antialias:false});renderer.setSize(128,128);renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;
  const target=new T.WebGLRenderTarget(128,128),camera=new T.OrthographicCamera(-64,64,64,-64,.1,100);camera.position.z=10;camera.updateMatrixWorld();
  const pixels=new Uint8Array(128*128*4),circle=(x,y)=>Math.hypot(x-7.5,y-7.5)<4.5;
  for(const format of ['h264-rgb-mask','h264-ycrcb-alpha-four-plane']){
   const four=format.includes('four-plane'),w=four?32:16,h=32,packedData=new Uint8Array(w*h*4),posterData=new Uint8Array(16*16*4);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const a=circle(x%16,y%16)?255:0,i=(y*w+x)*4;
    const value=four?(y>=16?(x<16?(a?170:0):128):(x<16?128:a)):(y>=16?(a?170:0):a);
    packedData.set([value,value,value,255],i);
   }
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){const a=circle(x,y)?255:0;posterData.set([a,a,a,a],(y*16+x)*4);}
   const video=new T.DataTexture(packedData,w,h),poster=new T.DataTexture(posterData,16,16);video.needsUpdate=poster.needsUpdate=true;
   const packed={value:1},source=new T.MeshBasicMaterial({map:video,transparent:true,depthWrite:false,depthTest:false,toneMapped:false});
   source.onBeforeCompile=shader=>{shader.uniforms.designerPacked=packed;shader.uniforms.designerTexel={value:new T.Vector2(1/w,1/h)};shader.fragmentShader='uniform float designerPacked;\nuniform vec2 designerTexel;\n'+shader.fragmentShader.replace('#include <map_fragment>',decode(format));};
   source.customProgramCacheKey=()=> 'designer-'+format+'-v2';
   const geometry=new T.PlaneGeometry(96,96),actor=new T.Group();actor.add(new T.Mesh(geometry,source));actor.updateMatrixWorld(true);
   for(const [label,Focus,preserve] of [['before',Before,false],['fixed',Fixed,true]]){
    const focus=new Focus(),scene=new T.Scene();scene.add(focus.root);let textureDisposed=0,geometryDisposed=0;const onTexture=()=>textureDisposed++,onGeometry=()=>geometryDisposed++;
    video.addEventListener('dispose',onTexture);poster.addEventListener('dispose',onTexture);geometry.addEventListener('dispose',onGeometry);
    for(const mode of ['packed','poster','packed-restored']){
     packed.value=mode==='poster'?0:1;source.map=mode==='poster'?poster:video;focus.render(actor,'#ffd892',1,1,preserve);
     renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,128,128,pixels);
     const alpha=(x,y)=>pixels[(y*128+x)*4+3],outside=alpha(26,26),inside=alpha(64,64);let covered=0;
     for(let i=3;i<pixels.length;i+=4)covered+=pixels[i]>2?1:0;
     rows.push({format,label,mode,outside,inside,covered,copyCount:focus.root.children.length,cacheKey:focus.root.children[0].material.customProgramCacheKey()});
    }
    focus.dispose();rows.push({format,label,disposal:true,textureDisposed,geometryDisposed});
    video.removeEventListener('dispose',onTexture);poster.removeEventListener('dispose',onTexture);geometry.removeEventListener('dispose',onGeometry);
   }
   geometry.dispose();source.dispose();video.dispose();poster.dispose();
  }
  target.dispose();renderer.dispose();renderer.forceContextLoss();return rows;
 },{chunk,three});
 assert.deepEqual(errors,[]);report.errors=errors;
 for(const row of report.rows)if(row.disposal){assert.equal(row.textureDisposed,0);assert.equal(row.geometryDisposed,0);}else{
  assert(row.inside>200);assert.equal(row.copyCount,8);
  if(row.label==='fixed'||row.mode==='poster')assert.equal(row.outside,0);else assert(row.outside>200,'Old packed focus must reproduce opaque rectangle');
 }
 report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();report.finishedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,rows:report.rows?.length,failure:report.failure}));}
