/** Tool-only cropped-upload probe, with full-size ImageBitmap conversion control. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-texture-padding');
assert(!existsSync(resolve(out,'report.json')),'Keep earlier evidence');await mkdir(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:sha(await readFile(new URL(import.meta.url))),viewport:{width:1280,height:720},method:'Tool-only GPU exactness probe on the four first-contact pose textures. Compare unchanged HTML image with full-size ImageBitmap control and alpha>0 crop snapped/padded32px. Preserve full mesh, logical UVs and eye positions; transform only texture sampling coordinates and gradients. All original minification/mipmap flags retained. Normal/reduced motion and forced open/closed eyes at two clocks. Separate isolated RGBA targets, no ordinary-performance or judge-acceptance claim.',errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 report.indexSha256=sha(await (await page.request.get(new URL(report.url).origin+'/')).body());
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js');
  const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
  m.plan=null;m.animationAt=0;s.render({...s.view(),frame:null,fixedTime:30,paused:true,galleryPreview:true},0);
  const targets=[],seen=new Set(),rows=[],assets=[],resources=[],worst={changedPixels:-1};
  for(const [actorId,e]of s.actors){
   const keys=e.asset==='mochi'?['K1','K2']:['binding-thread','yarn-giant'].includes(e.asset)?['K4']:[];
   for(const key of keys){const d=e.craftPose?.drawing,t=d?.set.textures[key];if(!t||seen.has(t))continue;seen.add(t);targets.push({actorId,e,d,t,key});}
  }
  if(targets.length!==4)throw Error('Expected four cold-upload targets, found '+targets.length);
  const scene=new T.Scene(),target=new T.WebGLRenderTarget(1280,720,{depthBuffer:false});
  const previous=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()),clearAlpha=s.renderer.getClearAlpha();
  const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const render=(d,material)=>{const bytes=new Uint8Array(1280*720*4),mesh=new T.Mesh(d.geometry,material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);mesh.frustumCulled=false;scene.add(mesh);s.renderer.clear();s.renderer.render(scene,s.camera);s.renderer.readRenderTargetPixels(target,0,0,1280,720,bytes);scene.remove(mesh);return bytes;};
  const compare=(a,b)=>{let changedPixels=0,maxDelta=0,paintedPixels=0;for(let i=0;i<a.length;i+=4){let changed=false;paintedPixels+=a[i+3]>0;for(let c=0;c<4;c++){const delta=Math.abs(a[i+c]-b[i+c]);changed||=delta>0;maxDelta=Math.max(maxDelta,delta);}changedPixels+=changed;}return{changedPixels,maxDelta,paintedPixels};};
  const png=bytes=>{const c=document.createElement('canvas');c.width=1280;c.height=720;const x=c.getContext('2d'),im=x.createImageData(1280,720);for(let y=0;y<720;y++)im.data.set(bytes.subarray((719-y)*1280*4,(720-y)*1280*4),y*1280*4);x.putImageData(im,0,0);return c.toDataURL('image/png');};
  try{
   s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);
   for(const {actorId,e,d,t,key}of targets){
    const width=t.image.width,height=t.image.height,c=document.createElement('canvas');c.width=width;c.height=height;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(t.image,0,0);const rgba=ctx.getImageData(0,0,width,height).data;
    let x0=width,y0=height,x1=0,y1=0,painted=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>0){painted++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
    if(!painted)throw Error('Empty source '+e.asset+'/'+key);
    const left=Math.max(0,Math.floor(x0/32)*32-32),top=Math.max(0,Math.floor(y0/32)*32-32),right=Math.min(width,Math.ceil(x1/32)*32+32),bottom=Math.min(height,Math.ceil(y1/32)*32+32);
    const region=[left,top,right-left,bottom-top],asset={unit:e.asset,key,url:t.image.currentSrc||t.image.src,width,height,alphaBounds:[x0,y0,x1,y1],painted,region,areaRatio:region[2]*region[3]/(width*height),sourceRgbaSha256:await hash(rgba),options:{flipY:t.flipY,premultiplyAlpha:t.premultiplyAlpha,colorSpace:t.colorSpace,minFilter:t.minFilter,generateMipmaps:t.generateMipmaps}};assets.push(asset);
    const variants=[];
    for(const [mode,rect]of [['bitmap-full',[0,0,width,height]],['bitmap-crop',region]]){
     const [x,y,w,h]=rect,bitmap=await createImageBitmap(t.image,x,y,w,h,{imageOrientation:t.flipY?'flipY':'from-image',premultiplyAlpha:t.premultiplyAlpha?'premultiply':'none',colorSpaceConversion:'none'});
     const texture=new T.Texture(bitmap);for(const prop of ['wrapS','wrapT','magFilter','minFilter','anisotropy','format','type','colorSpace','generateMipmaps','premultiplyAlpha','flipY'])texture[prop]=t[prop];texture.needsUpdate=true;
     const material=d.material.clone(),hook=d.material.onBeforeCompile,keyFunction=d.material.customProgramCacheKey.bind(d.material),crop={value:new T.Vector4(-x/w,-(height-y-h)/h,width/w,height/h)};
     material.map=texture;material.customProgramCacheKey=()=>keyFunction()+'-cxv-padding-probe';
     material.onBeforeCompile=(shader,renderer)=>{
      hook.call(d.material,shader,renderer);shader.uniforms.cxvCrop=crop;
      if(!shader.fragmentShader.includes('texture2D(atlas,uv)')||(shader.fragmentShader.match(/textureGrad\(atlas,/g)??[]).length!==2)throw Error('Unexpected expression source');
      shader.fragmentShader=`uniform vec4 cxvCrop;
vec2 cxvCropUV(vec2 uv){return uv*cxvCrop.zw+cxvCrop.xy;}
vec4 cxvCropTexture(sampler2D tex,vec2 uv){return texture2D(tex,cxvCropUV(uv));}
vec4 cxvCropGradient(sampler2D tex,vec2 uv,vec2 dxUv,vec2 dyUv){return textureGrad(tex,cxvCropUV(uv),dxUv*cxvCrop.zw,dyUv*cxvCrop.zw);}
`+shader.fragmentShader.replace('texture2D(atlas,uv)','cxvCropTexture(atlas,uv)').replaceAll('textureGrad(atlas,','cxvCropGradient(atlas,');
     };
     resources.push({bitmap,texture,material});variants.push({mode,material});
    }
    for(const reduced of [false,true])for(const clock of [30,30.6])for(const closed of [0,1]){
     d.sample(key==='K4'?'hurt':'attack',key==='K1'?.1:key==='K2'?.4:0,reduced,undefined,clock);
     if(d.key!==key)throw Error('Unexpected sampled key');
     d.expression.sample(d.frame.face,d.set.manifest.canvas,closed,closed,key);e.actor.root.updateMatrixWorld(true);
     const baseline=render(d,d.material),baselineSha256=await hash(baseline);
     for(const {mode,material}of variants){
      const pixels=render(d,material),comparison=compare(baseline,pixels),row={actorId,unit:e.asset,key,mode,reduced,clock,closed,...comparison,baselineSha256,candidateSha256:await hash(pixels)};rows.push(row);
      if(comparison.changedPixels>worst.changedPixels)Object.assign(worst,{...row,images:[png(baseline),png(pixels)]});
     }
    }
   }
  }finally{s.renderer.setRenderTarget(previous);s.renderer.setClearColor(clear,clearAlpha);target.dispose();for(const {material,texture,bitmap}of resources){material.dispose();texture.dispose();bitmap.close();}}
  return{assets,rows,worst,exact:rows.every(r=>!r.changedPixels&&r.paintedPixels>100)};
 });
 for(const [i,data]of result.worst.images.entries()){
  const path=resolve(out,'worst-'+i+'.png');await writeFile(path,Buffer.from(data.split(',')[1],'base64'));
  execFileSync('sips',['-Z','1024',path,'--out',resolve(out,'worst-'+i+'-review.png')],{stdio:'ignore'});
 }
 delete result.worst.images;report.result=result;report.errors=errors;report.blockedRequests=blockedRequests;report.ended=new Date().toISOString();
 report.pass=result.exact&&!errors.length&&!blockedRequests.length;
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,errors,assets:result.assets.map(({unit,key,region,areaRatio})=>({unit,key,region,areaRatio})),modes:['bitmap-full','bitmap-crop'].map(mode=>({mode,comparisons:result.rows.filter(r=>r.mode===mode).length,mismatches:result.rows.filter(r=>r.mode===mode&&r.changedPixels).length,maxDelta:Math.max(...result.rows.filter(r=>r.mode===mode).map(r=>r.maxDelta))}))}));
}finally{await browser.close();}
