// Q3B-X06: half-float paint reconstruction in actual normalized pilot poses.
// Fixed256 versus integer field-pixel crop; no recorder changes.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3b/raw/ground-crop';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),actor=s.actors.get('soot').actor;
   const W=s.width,H=s.height,px=s.worldWidth/W,output=new T.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false});output.texture.colorSpace=T.SRGBColorSpace;
   const read=()=>{const pixels=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(output,0,0,W,H,pixels);return pixels;};
   const png=pixels=>{const c=document.createElement('canvas');c.width=W;c.height=H;const context=c.getContext('2d'),d=context.createImageData(W,H);for(let y=0;y<H;y++)d.data.set(pixels.subarray((H-1-y)*W*4,(H-y)*W*4),y*W*4);context.putImageData(d,0,0);return c.toDataURL();};
   const colour=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha(),savedTarget=s.renderer.getRenderTarget();
   const v={...s.view(),fixedTime:10,paused:true},rows=[],images={};
   const linear=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;},lum=(p,i)=>.2126*linear(p[i])+.7152*linear(p[i+1])+.0722*linear(p[i+2]);
   for(const [clip,total,ms]of [['attack',800,0],['attack',800,225],['attack',800,350],['ult',2200,600],['ult',2200,1100],['ult',2200,1360]]){
    s.render({...v,model:{clip},modelProgress:ms/total},0);const unit=s.sizeAudit().units.find(u=>u.id==='soot'),b=unit.box,face=unit.faceBox;
    const crop={x:Math.floor(b.x-8),y:Math.floor(b.y-8),width:Math.ceil(b.x+b.width+8)-Math.floor(b.x-8),height:Math.ceil(b.y+b.height+8)-Math.floor(b.y-8)};
    s.renderer.setClearColor(0,0);s.renderer.setRenderTarget(output);s.renderer.clear();s.renderer.render(actor.root,s.camera);const base=read();images[clip+'-'+ms+'-source']=png(base);
    for(const method of ['fixed256','pixel-aligned']){
     const tw=method==='fixed256'?256:crop.width,th=method==='fixed256'?256:crop.height,target=new T.WebGLRenderTarget(tw,th,{type:T.HalfFloatType,depthBuffer:false,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});target.texture.colorSpace=T.LinearSRGBColorSpace;
     const cam=s.camera.clone();cam.left=crop.x*px-s.worldWidth/2;cam.right=(crop.x+crop.width)*px-s.worldWidth/2;cam.top=1950-crop.y*px;cam.bottom=1950-(crop.y+crop.height)*px;cam.updateProjectionMatrix();
     s.renderer.setRenderTarget(target);s.renderer.clear();s.renderer.render(actor.root,cam);
     const mat=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,uniforms:{paint:{value:target.texture}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D paint;varying vec2 vUv;void main(){vec4 p=texture2D(paint,vUv);if(p.a<.001)discard;gl_FragColor=vec4(p.rgb/max(p.a,.001),p.a);\n#include <colorspace_fragment>\n}'});
     const quad=new T.Mesh(new T.PlaneGeometry(crop.width*px,crop.height*px),mat);quad.position.set((crop.x+crop.width*.5)*px-s.worldWidth/2,1950-(crop.y+crop.height*.5)*px,0);
     s.renderer.setRenderTarget(output);s.renderer.clear();s.renderer.render(quad,s.camera);const a=read();images[clip+'-'+ms+'-'+method]=png(a);
     let error=0,count=0,alphaError=0;const contrast={body:{aa:0,ab:0},face:{aa:0,ab:0}};
     for(let y=0;y<H;y++)for(let x=0;x<W-1;x++){
      const i=(y*W+x)*4,j=i+4;if(base[i+3]<204)continue;for(let c=0;c<3;c++)error+=Math.abs(base[i+c]-a[i+c]);alphaError+=Math.abs(base[i+3]-a[i+3]);count++;
      if(base[j+3]<204)continue;const l=lum(base,i),r=lum(base,j),nl=lum(a,i),nr=lum(a,j),d=(r-l)/Math.max(.0001,r+l),e=(nr-nl)/Math.max(.0001,nr+nl);if(Math.abs(r-l)<.006)continue;
      contrast.body.aa+=d*d;contrast.body.ab+=d*e;const sy=H-1-y;if(x>=face.x&&x<=face.x+face.width&&sy>=face.y&&sy<=face.y+face.height){contrast.face.aa+=d*d;contrast.face.ab+=d*e;}
     }
     rows.push({clip,ms,method,crop,target:[tw,th],opaquePixels:count,rgbMae255:error/(count*3),alphaMae255:alphaError/count,contrast:Object.fromEntries(Object.entries(contrast).map(([k,v])=>[k,v.aa?v.ab/v.aa:1]))});quad.geometry.dispose();mat.dispose();target.dispose();
    }
   }
   s.renderer.setRenderTarget(savedTarget);s.renderer.setClearColor(colour,alpha);output.dispose();return{rows,images,scope:'Source reconstruction only, not a full production shadow/rim contrast or FPS acceptance.'};
  });
  for(const [name,data]of Object.entries(result.images))writeFileSync(`${out}/${width}-${name}.png`,Buffer.from(data.split(',')[1],'base64'));delete result.images;results.push({width,height,errors,...result});
  for(const method of ['fixed256','pixel-aligned']){const r=result.rows.filter(r=>r.method===method);console.log(JSON.stringify({width,method,errors,maxRgbMae255:Math.max(...r.map(a=>a.rgbMae255)),minFaceContrast:Math.min(...r.map(a=>a.contrast.face)),minBodyContrast:Math.min(...r.map(a=>a.contrast.body))}));}await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/ground-crop-study.json',JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
}finally{await browser.close();}
