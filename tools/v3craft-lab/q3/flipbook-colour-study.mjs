// D4 learning experiment. T02/T07/T10 and installed Three.js renderer source.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3/raw/D4-study';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D1&revision=2');await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const p=window.__drill,d=p.drill,size=256,camera=new T.OrthographicCamera(530,1070,625,85,-100,100);camera.position.z=10;
  const target=new T.WebGLRenderTarget(size,size),pixels=new Uint8Array(size*size*4),images=[];
  p.renderer.setRenderTarget(target);p.scene.children.forEach(o=>o.visible=o===d.root);
  const read=()=>{p.renderer.readRenderTargetPixels(target,0,0,size,size,pixels);return pixels.slice();};
  const encode=v=>Math.round(255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055));
  const png=(rgba,linear=false)=>{const data=new Uint8ClampedArray(rgba.length);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const src=((size-1-y)*size+x)*4,dst=(y*size+x)*4;for(let c=0;c<3;c++)data[dst+c]=linear?encode(rgba[src+c]/255):rgba[src+c];data[dst+3]=rgba[src+3];}const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d').putImageData(new ImageData(data,size,size),0,0);return canvas.toDataURL();};
  // Known swatch confirms the blend convention in this actual installed renderer.
  const swatchScene=new T.Scene(),swatch=new T.Mesh(new T.PlaneGeometry(540,540),new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'void main(){gl_FragColor=vec4(.5,.2,.1,.5);}'}));swatch.position.set(800,355,0);swatchScene.add(swatch);p.renderer.setClearColor(0,0);p.renderer.render(swatchScene,camera);const swatchPixel=Array.from(read().slice((128*256+128)*4,(128*256+128)*4+4));
  const rows=[];
  for(const sourceMs of [400,800,1400]){
   d.draw(sourceMs);p.renderer.setClearColor(0,0);p.renderer.render(p.scene,camera);const raw=read();
   p.renderer.setClearColor('#242336',1);p.renderer.render(p.scene,camera);const direct=read();images.push({name:`direct-${sourceMs}`,png:png(direct,true)});
   for(const method of ['naive-raw-as-sRGB','unpremultiply-linear-then-sRGB']){
    const data=raw.slice();if(method!=='naive-raw-as-sRGB')for(let i=0;i<data.length;i+=4){const a=raw[i+3]/255;for(let c=0;c<3;c++)data[i+c]=a?encode(Math.min(1,raw[i+c]/255/a)):0;}
    const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.colorSpace=T.SRGBColorSpace;texture.minFilter=texture.magFilter=T.NearestFilter;texture.needsUpdate=true;
    const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});const plane=new T.Mesh(new T.PlaneGeometry(540,540),material);plane.position.set(800,355,0);const scene=new T.Scene();scene.add(plane);
    p.renderer.setClearColor('#242336',1);p.renderer.render(scene,camera);const baked=read();let sum=0,n=0,max=0;
    for(let i=0;i<raw.length;i+=4)if(raw[i+3]>8)for(let c=0;c<3;c++){const delta=Math.abs(direct[i+c]-baked[i+c]);sum+=delta;n++;max=Math.max(max,delta);}
    rows.push({sourceMs,method,supportPixels:n/3,meanLinearRgbError255:sum/n,maxChannelError255:max});images.push({name:`${method}-${sourceMs}`,png:png(baked,true)});
    material.dispose();plane.geometry.dispose();texture.dispose();
   }
  }
  target.dispose();return{swatchPixel,expectedSwatch:[64,26,13,128],rows,images};
 });
 for(const entry of result.images)writeFileSync(`${out}/${entry.name}.png`,Buffer.from(entry.png.split(',')[1],'base64'));delete result.images;
 writeFileSync('tools/v3craft-lab/q3/flipbook-colour-study.json',JSON.stringify({at:new Date().toISOString(),method:'Actual D1 paint/chips rendered at256px on a fixed540px crop; linear GPU comparison after texture replay over same background.',...result},null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();}
