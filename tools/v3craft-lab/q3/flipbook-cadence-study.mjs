// Q3 D4 learning experiment, not the runtime player. LEARN/Q3.md T02/T05/T07/T10/T25.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3/raw/D4-study';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D1&revision=2');await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const p=window.__drill,size=256,camera=new T.OrthographicCamera(530,1070,625,85,-100,100);camera.position.z=10;
  const target=new T.WebGLRenderTarget(size,size),pixels=new Uint8Array(size*size*4),frames=[],images=[];
  p.scene.children.forEach(o=>o.visible=o===p.drill.root);p.renderer.setRenderTarget(target);p.renderer.setClearColor(0,0);
  for(let i=0;i<=120;i++){p.drill.draw(i/120*2000);p.renderer.render(p.scene,camera);p.renderer.readRenderTargetPixels(target,0,0,size,size,pixels);frames.push(pixels.slice());}
  const encode=v=>Math.round(255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055));
  const png=data=>{const out=new Uint8ClampedArray(data.length);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const s=((size-1-y)*size+x)*4,d=(y*size+x)*4,a=data[s+3]/255;for(let c=0;c<3;c++)out[d+c]=encode(data[s+c]/255+.018*(1-a));out[d+3]=255;}const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d').putImageData(new ImageData(out,size,size),0,0);return canvas.toDataURL();};
  const rows=[];
  for(const fps of [24,30])for(const mode of ['held','premultiplied-linear']){
   let rgbaError=0,n=0,mismatch=0,union=0,worstMean=0;const samples=[];
   for(let i=0;i<=120;i++){
    const index=i/120*fps,lo=Math.floor(index+1e-9),hi=Math.min(fps,lo+1),mix=mode==='held'?0:index-lo;
    const a=frames[lo*120/fps],b=frames[hi*120/fps],direct=frames[i],replay=new Float32Array(a.length);let error=0,count=0;
    for(let j=0;j<a.length;j+=4){for(let c=0;c<4;c++)replay[j+c]=a[j+c]*(1-mix)+b[j+c]*mix;
     const visible=direct[j+3]>20,played=replay[j+3]>20;
     if(visible||played){union++;if(visible!==played)mismatch++;for(let c=0;c<4;c++){error+=Math.abs(direct[j+c]-replay[j+c]);count++;}}
    }
    const mean=count?error/count:0;rgbaError+=error;n+=count;worstMean=Math.max(worstMean,mean);
    samples.push({ms:i/120*1000,meanPremultipliedRgbaError255:mean});
    if([17,53,83,113].includes(i))images.push({name:`cadence-${fps}-${mode}-${i}`,png:png(replay)});
   }
   rows.push({fps,mode,frameCount:fps+1,durationMs:1000,referenceSamples:121,meanPremultipliedRgbaError255:rgbaError/n,worstSampleMean255:worstMean,contourMismatchFraction:mismatch/union,samples});
  }
  for(const i of [17,53,83,113])images.push({name:`cadence-direct-${i}`,png:png(frames[i])});
  // A cropped original paint edge next to a diagnostic red tile tests tile filtering.
  // The diagnostic colour is never an authored or shipped effect.
  const source=frames[24],cropSize=32;
  const borderRows=[];
  for(const padding of [0,2]){
   const stride=cropSize+2*padding,width=stride*2,height=stride,data=new Uint8Array(width*height*4);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const j=(y*width+x)*4;
    if(x>=stride){data.set([255,0,0,255],j);continue;}
    const sx=126+Math.max(0,Math.min(cropSize-1,x-padding)),sy=126+Math.max(0,Math.min(cropSize-1,y-padding));
    data.set(source.slice((sy*size+sx)*4,(sy*size+sx)*4+4),j);
   }
   const texture=new T.DataTexture(data,width,height);texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
   for(const halfTexelClamp of [false,true]){
    const uniforms={uMap:{value:texture},uSize:{value:new T.Vector2(width,height)},uStride:{value:stride},uPadding:{value:padding},uClamp:{value:halfTexelClamp?1:0}};
    const material=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D uMap;uniform vec2 uSize;uniform float uStride;uniform float uPadding;uniform float uClamp;varying vec2 vUv;void main(){vec2 px=vec2(uPadding)+vUv*32.;if(uClamp>.5)px=clamp(px,vec2(uPadding+.5),vec2(uPadding+31.5));gl_FragColor=texture2D(uMap,px/uSize);}'});
    const plane=new T.Mesh(new T.PlaneGeometry(540,540),material);plane.position.set(800,355,0);const scene=new T.Scene();scene.add(plane);p.renderer.render(scene,camera);p.renderer.readRenderTargetPixels(target,0,0,size,size,pixels);
    let maxRedExcess=0,affected=0;
    // Compare rightmost output samples with the known clamped source edge.
    for(let y=8;y<size-8;y++){
     const fy=(y+.5)/size*32-.5,iy=Math.floor(fy),f=fy-iy;
     const at=yy=>source[((126+Math.max(0,Math.min(31,yy)))*size+157)*4];
     const expected=at(iy)*(1-f)+at(iy+1)*f,observed=pixels[(y*size+size-1)*4],excess=observed-expected;
     maxRedExcess=Math.max(maxRedExcess,excess);if(excess>2)affected++;
    }
    borderRows.push({padding,halfTexelClamp,rightEdgeSamples:240,redContaminatedSamples:affected,maxRedExcess255:maxRedExcess});
    material.dispose();plane.geometry.dispose();
   }
   texture.dispose();
  }
  target.dispose();return{rows,borderRows,images,terminalSupport:frames[120].filter((v,i)=>i%4===3&&v>0).length};
 });
 for(const im of result.images)writeFileSync(`${out}/${im.name}.png`,Buffer.from(im.png.split(',')[1],'base64'));delete result.images;
 writeFileSync('tools/v3craft-lab/q3/flipbook-cadence-study.json',JSON.stringify({at:new Date().toISOString(),content:'D1 r2 original paint/chips, same1000ms duration, fixed540px crop,256px render',...result},null,2)+'\n');
 console.log(JSON.stringify({...result,rows:result.rows.map(({samples,...r})=>r)}));
}finally{await browser.close();}
