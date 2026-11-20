// D5 sandbox experiment; formal source-over, colour and metric method in LEARN/Q3.md.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3/raw/D5-study';mkdirSync(out,{recursive:true});
const face=JSON.parse(readFileSync('tools/v3craft-lab/q2/faces.json')).units.soot;
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D1&revision=2');await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async(face)=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const p=window.__drill,W=1280,H=720;p.drill.root.visible=false;
  const target=new T.WebGLRenderTarget(W,H);target.texture.colorSpace=T.SRGBColorSpace;
  const rgba=new Uint8Array(W*H*4);p.renderer.setRenderTarget(target);
  const render=()=>{p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(target,0,0,W,H,rgba);return rgba.slice();};
  const baseline=render();const visible=p.scene.children.map(o=>[o,o.visible]);visible.forEach(([o])=>o.visible=o===p.actor.root);p.renderer.setClearColor(0,0);const mask=render();visible.forEach(([o,v])=>o.visible=v);p.renderer.setClearColor('#242336',1);
  let x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(mask[(y*W+x)*4+3]>=128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  const bounds=[x0,y0,x1+1,y1+1],bw=x1-x0+1,bh=y1-y0+1;
  const faceWorld=[x0+face[0]*bw,y1+1-(face[1]+face[3])*bh,face[2]*bw,face[3]*bh];
  const positions=[],uvs=[],indices=[];
  // A single slanted, tapered stroke intersects the real face and body. Identical in all methods.
  for(let i=0;i<=80;i++){const u=i/80,x=x0-55+u*(bw+145),y=y0+bh*.18+u*bh*.65,half=bh*.48*Math.pow(Math.sin(Math.PI*u),.8);
   for(const side of [-1,1]){positions.push(x-half*.25*side,y+half*side,0);uvs.push(u,(side+1)/2);}if(i<80){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
  const maskTexture=new T.DataTexture(mask,W,H,T.RGBAFormat);maskTexture.flipY=false;maskTexture.colorSpace=T.NoColorSpace;maskTexture.needsUpdate=true;
  const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const fragment=`uniform sampler2D uMask;uniform vec4 uFace;uniform float uCore,uProtected,uAge;uniform vec3 uColour;varying vec2 vUv;
void main(){float along=smoothstep(0.,.07,vUv.x)*(1.-smoothstep(.91,1.,vUv.x));float cross=1.-smoothstep(.65,1.,abs(vUv.y-.5)*2.);float a=along*cross*.82;
if(uCore>.5)a*=exp(-pow((vUv.y-.57)/.09,2.))*.55;
if(uProtected>.5){vec2 q=gl_FragCoord.xy;float body=texture2D(uMask,q/vec2(1280.,720.)).a;vec2 f=(q-uFace.xy)/uFace.zw;float onFace=step(0.,f.x)*step(f.x,1.)*step(0.,f.y)*step(f.y,1.);a*=1.-body*.82;a*=1.-onFace;}
vec3 c=uColour*(.68+.32*sin(vUv.x*16.-uAge*5.)*sin(vUv.x*16.-uAge*5.));if(uCore>.5)c=mix(c,vec3(1.,.87,.66),.65);
gl_FragColor=vec4(c,a);#include <colorspace_fragment>
}`.replace(';#include',';\n#include');
  const make=core=>new T.Mesh(geometry,new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,uniforms:{uMask:{value:maskTexture},uFace:{value:new T.Vector4(...faceWorld)},uCore:{value:core},uProtected:{value:0},uAge:{value:0},uColour:{value:new T.Color('#bf65ff')}},vertexShader:vertex,fragmentShader:fragment}));
  const broad=make(0),core=make(1);const broadGroup=new T.Group(),coreGroup=new T.Group();broadGroup.renderOrder=11;coreGroup.renderOrder=12;broadGroup.add(broad);coreGroup.add(core);p.scene.add(broadGroup,coreGroup);broad.renderOrder=11;core.renderOrder=12;
  const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const Y=bytes=>{const ys=new Float32Array(W*H);for(let i=0;i<ys.length;i++){const k=i*4;ys[i]=.2126*linear(bytes[k])+.7152*linear(bytes[k+1])+.0722*linear(bytes[k+2]);}return ys;};
  const yBase=Y(baseline),inside=(x,y,region)=>mask[(y*W+x)*4+3]>204&&(region==='body'||(x>=faceWorld[0]&&x<faceWorld[0]+faceWorld[2]&&y>=faceWorld[1]&&y<faceWorld[1]+faceWorld[3]));
  const metrics=bytes=>{const ys=Y(bytes),r={};for(const region of ['face','body']){let aa=0,ab=0,bb=0,edges=0,count=0,delta=0,white=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inside(x,y,region)){const k=y*W+x;count++;delta+=Math.abs(ys[k]-yBase[k]);if(Math.min(bytes[k*4],bytes[k*4+1],bytes[k*4+2])>=250)white++;for(const [dx,dy] of [[1,0],[0,1]])if(inside(x+dx,y+dy,region)){const n=k+dx+dy*W,a=yBase[n]-yBase[k],b=ys[n]-ys[k];if(Math.abs(a)>.006){aa+=a*a;ab+=a*b;bb+=b*b;edges++;}}}r[region]={retainedOriginalGradient:ab/aa,rmsGradientRatio:Math.sqrt(bb/aa),meanAbsoluteLuminanceChange:delta/count,nearWhiteFraction:white/count,pixels:count,edges};}return r;};
  const png=bytes=>{const c=document.createElement('canvas');c.width=W;c.height=H;const a=new Uint8ClampedArray(bytes.length);for(let y=0;y<H;y++)a.set(bytes.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(a,W,H),0,0);return c.toDataURL();};
  const results=[],images={baseline:png(baseline),mask:png(mask)};
  for(const method of ['front-additive','front-alpha','split-colour-core'])for(const age of [.15,.5,.85]){
   broadGroup.renderOrder=method==='split-colour-core'?5:11;core.visible=method==='split-colour-core';broad.material.blending=method==='front-additive'?T.AdditiveBlending:T.NormalBlending;broad.material.needsUpdate=true;
   core.material.blending=T.AdditiveBlending;core.material.needsUpdate=true;core.material.uniforms.uProtected.value=1;
   const colour=new T.Color(age<.3?'#e8c6ff':age<.7?'#b64af3':'#511773');for(const m of [broad,core]){m.material.uniforms.uAge.value=age;m.material.uniforms.uColour.value.copy(colour);}
   const bytes=render();results.push({method,age,metrics:metrics(bytes)});images[method+'-'+age]=png(bytes);
  }
  target.dispose();return {bounds,faceWorld,results,images};
 },face);
 for(const [name,data]of Object.entries(result.images))writeFileSync(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'));delete result.images;
 const receipt={at:new Date().toISOString(),errors,method:'Identical WebGL mesh/colour samples; sRGB readback decoded to linear Rec.709; signed original-gradient retention and RMS reported separately. Real actor alpha>.8; Q2 reviewed face rectangle.',...result};
 writeFileSync('tools/v3craft-lab/q3/blend-study.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}finally{await browser.close();}
