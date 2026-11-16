// Q3B-X09: actual Soot paint, unchanged pose; fade versus material-local erosion.
// The native material remains responsible for source colour. GPU masks reuse X01.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out='tools/v3craft-lab/q3b/raw/death';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const {flowingNoise}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/cardrpg/vfx-craft/lantern-requiem.ts');
   s.render({...s.view(),model:{clip:'attack'},modelProgress:0,fixedTime:10,paused:true},0);
   const actor=s.actors.get('soot').actor,W=s.width,H=s.height,box=s.sizeAudit().units.find(u=>u.id==='soot').box;
   const noise=flowingNoise(),uniforms={uStudyAmount:{value:0},uStudyMode:{value:0},uStudyNoise:{value:noise},uStudyRange:{value:new T.Vector2(actor.bounds.y,actor.bounds.height)}};
   const rt=new T.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false});rt.texture.colorSpace=T.SRGBColorSpace;
   const oldTarget=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha();
   const read=()=>{s.renderer.setRenderTarget(rt);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(actor.root,s.camera);const p=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(rt,0,0,W,H,p);return p;};
   const png=p=>{const c=document.createElement('canvas');c.width=W;c.height=H;const a=new Uint8ClampedArray(p.length);for(let y=0;y<H;y++)a.set(p.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(a,W,H),0,0);return c.toDataURL();};
   const base=read();
   const saved=[];
   actor.root.traverse(o=>{if(!o.isMesh)return;const material=o.material;const hook=material.onBeforeCompile,key=material.customProgramCacheKey,baseKey=key.call(material);saved.push([material,hook,key]);
    material.onBeforeCompile=(shader,renderer)=>{
     hook.call(material,shader,renderer);
     Object.assign(shader.uniforms,uniforms);
     shader.vertexShader='varying vec2 vStudyObject;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStudyObject=transformed.xy;');
     shader.fragmentShader='varying vec2 vStudyObject;uniform float uStudyAmount,uStudyMode;uniform sampler2D uStudyNoise;uniform vec2 uStudyRange;\n'+shader.fragmentShader.replace('#include <alphatest_fragment>',`
      if(uStudyAmount>0.){
       float n=texture2D(uStudyNoise,vStudyObject/250.).r;
       float rank=.72*clamp((vStudyObject.y-uStudyRange.x)/uStudyRange.y,0.,1.)+.28*n;
       float keep=uStudyMode<.5?1.-uStudyAmount:1.-smoothstep(rank-.025,rank+.025,uStudyAmount*1.10-.05);
       diffuseColor.a*=uStudyAmount>=1.?0.:keep;
      }
      #include <alphatest_fragment>`);
    };material.customProgramCacheKey=()=> baseKey+'|Q3B-X09-death-study';material.needsUpdate=true;
   });
   const rows=[],images={},delta=(a,b)=>{let maximum=0,changed=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d)changed++;maximum=Math.max(maximum,d);}return{maximum,changed};};
   const initial=delta(base,read());
   for(const [mode,method]of ['opacity-fade','material-erosion'].entries())for(const ms of [0,100,200,300,400,500,600]){
    uniforms.uStudyMode.value=mode;uniforms.uStudyAmount.value=ms/600;const pixels=read();let opaque=0,partial=0,nonzero=0;
    for(let i=3;i<pixels.length;i+=4){if(pixels[i]>=204)opaque++;else if(pixels[i]>2)partial++;if(pixels[i]>2)nonzero++;}
    rows.push({method,ms,opaque,partial,nonzero});images[method+'-'+ms]=png(pixels);
   }
   uniforms.uStudyMode.value=1;uniforms.uStudyAmount.value=.35;const first=read();uniforms.uStudyAmount.value=.8;read();uniforms.uStudyAmount.value=.35;const seek=delta(first,read());uniforms.uStudyAmount.value=0;const returned=delta(base,read());
   let affineResidual=0;const inverse=actor.root.matrixWorld.clone().invert(),v=new T.Vector3();
   for(const child of actor.mesh.children){const a=child.geometry.attributes.position.array;for(let i=0;i<a.length;i+=3){v.set(a[i],a[i+1],a[i+2]).applyMatrix4(actor.root.matrixWorld).applyMatrix4(inverse);affineResidual=Math.max(affineResidual,Math.abs(v.x-a[i]),Math.abs(v.y-a[i+1]));}}
   for(const [material,hook,key]of saved){material.onBeforeCompile=hook;material.customProgramCacheKey=key;material.needsUpdate=true;}
   s.renderer.setRenderTarget(oldTarget);s.renderer.setClearColor(clear,alpha);rt.dispose();noise.dispose();
   return{rows,images,box,initial,seek,returned,affineResidual};
  });
  for(const [name,data]of Object.entries(result.images))writeFileSync(`${out}/${width}-${name}.png`,Buffer.from(data.split(',')[1],'base64'));delete result.images;
  results.push({width,height,errors,...result});console.log(JSON.stringify({width,errors,initial:result.initial,seek:result.seek,returned:result.returned,affineResidual:result.affineResidual,rows:result.rows}));await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/death-study.json',JSON.stringify({at:new Date().toISOString(),scriptSha256:createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex'),scope:'Equal600ms comparison of body method on actual source pose; no particles, death pose, final lifetime or performance acceptance.',results},null,2)+'\n');
}finally{await browser.close();}
