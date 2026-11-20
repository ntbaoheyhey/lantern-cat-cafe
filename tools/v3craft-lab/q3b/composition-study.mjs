// Q3.B study only. LEARN/Q3.B.md; reuse real battle and existing GPU readback recipe.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out='tools/v3craft-lab/q3b/raw/composition';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'));
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const {seededNoise}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/d1.ts');
  const W=s.width,H=s.height,unit=W/s.worldWidth,old=s.renderer.getClearColor(new T.Color()).clone(),oldAlpha=s.renderer.getClearAlpha(),oldTarget=s.renderer.getRenderTarget(),autoClear=s.renderer.autoClear;
  s.render({...s.view(),reducedMotion:true,model:{clip:'idle'},modelProgress:0,fixedTime:10,paused:true},0);
  const audit=s.sizeAudit(),rows=[],images={},rt=new T.WebGLRenderTarget(W,H),bytes=new Uint8Array(W*H*4);rt.texture.colorSpace=T.SRGBColorSpace;
  const read=()=>{s.renderer.setRenderTarget(rt);s.renderer.clear(true,true,true);s.renderer.render(s.scene,s.camera);s.renderer.readRenderTargetPixels(rt,0,0,W,H,bytes);return bytes.slice();};
  const png=a=>{const c=document.createElement('canvas');c.width=W;c.height=H;const flipped=new Uint8ClampedArray(a.length);for(let y=0;y<H;y++)flipped.set(a.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(flipped,W,H),0,0);return c.toDataURL();};
  const base=read();images.base=png(base);
  const paint=await new T.TextureLoader().loadAsync('/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/assets/soot-core.png');paint.colorSpace=T.SRGBColorSpace;
  const noise=new T.DataTexture(seededNoise(),256,256,T.RGBAFormat);noise.needsUpdate=true;noise.minFilter=noise.magFilter=T.LinearFilter;
  const uniforms={uPaint:{value:paint},uNoise:{value:noise},uReveal:{value:0},uBend:{value:0},uAlpha:{value:0}};
  const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms,
   vertexShader:`uniform float uBend;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.x+=uBend*sin(uv.y*3.14159265)*sin(uv.x*3.14159265);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`uniform sampler2D uPaint,uNoise;uniform float uReveal,uAlpha;varying vec2 vUv;void main(){vec4 p=texture2D(uPaint,vUv);float rank=.60*(1.-vUv.y)+.28*vUv.x+.12*texture2D(uNoise,vUv).r;float a=p.a*uAlpha*(1.-smoothstep(uReveal-.035,uReveal+.035,rank));if(a<.001)discard;gl_FragColor=vec4(p.rgb,a);#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
  const mesh=new T.Mesh(new T.PlaneGeometry(1000/unit,1000/unit,24,24),material);mesh.position.set((W*.62-W/2)/unit,(H-H*.45)/unit,0);const root=new T.Group();root.name='Q3B-composition-study';root.add(mesh);s.scene.add(root);
  const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const masks=[];const saved=s.scene.children.map(o=>[o,o.visible]);
  saved.forEach(([o])=>o.visible=false);s.renderer.setClearColor(0,0);const empty=read();const emptyAlphaPixels=empty.filter((v,i)=>i%4===3&&v>0).length;saved.forEach(([o,v])=>o.visible=v);s.renderer.setClearColor(old,oldAlpha);
  if(emptyAlphaPixels!==0)throw Error('Empty target contains alpha: '+emptyAlphaPixels);
  for(const u of audit.units){const e=s.actors.get(u.id),vis=saved.map(([o])=>[o,o.visible]);vis.forEach(([o])=>o.visible=o===e.actor.root);s.renderer.setClearColor(0,0);const a=read();vis.forEach(([o,v])=>o.visible=v);s.renderer.setClearColor(old,oldAlpha);const alphaPixels=a.filter((v,i)=>i%4===3&&v>=204).length;if(alphaPixels===0||alphaPixels>W*H*.2)throw Error('Invalid actor mask '+u.id);masks.push({id:u.id,asset:u.asset,side:u.side,box:u.box,faceBox:u.faceBox,alpha:a,alphaPixels,order:e.actor.root.renderOrder});}
  const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const lum=(a,i)=>.2126*linear(a[i])+ .7152*linear(a[i+1])+.0722*linear(a[i+2]);
  for(const method of ['simultaneous-front','staggered-rear']){
   let prior=null;
   for(const ms of [600,633.333,666.667,700,733.333,766.667,800,833.333,866.667,900,933.333,966.667,1000,1033.333,1066.667,1100,1400,1800,2200]){
    const t=clamp((ms-600)/500),fall=1-smooth((ms-1250)/950);root.renderOrder=method==='simultaneous-front'?Math.max(...masks.map(m=>m.order))+20:Math.min(...masks.map(m=>m.order))-.5;mesh.renderOrder=0;
    if(method==='simultaneous-front'){uniforms.uReveal.value=1.1;uniforms.uAlpha.value=smooth(t*2.5)*fall;uniforms.uBend.value=0;mesh.scale.setScalar(.72+.28*smooth(t*2.5));}
    else{uniforms.uReveal.value=-.06+1.16*t;uniforms.uAlpha.value=smooth(t*8)*fall;uniforms.uBend.value=Math.sin(t*Math.PI)*95/unit;mesh.scale.set(.6+.4*smooth(t),.72+.28*t,1);}
    mesh.position.y=(H-H*(.44+.035*Math.sin(t*Math.PI)))/unit;
    const rendered=read();let changed=0,peak=0;if(prior)for(let i=0;i<bytes.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(rendered[i+c]-prior[i+c])))>5)changed++;
    const contrast=[];
    for(const m of masks){let aa=0,ab=0;for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=(y*W+x)*4,j=i+4;if(m.alpha[i+3]<204||m.alpha[j+3]<204)continue;const a=lum(base,i),b=lum(base,j),c=lum(rendered,i),d=lum(rendered,j),da=(b-a)/Math.max(.0001,a+b),db=(d-c)/Math.max(.0001,c+d);if(Math.abs(b-a)<.006)continue;aa+=da*da;ab+=da*db;}contrast.push({id:m.id,asset:m.asset,retention:aa?ab/aa:1});}
    const vis=s.scene.children.map(o=>[o,o.visible]);vis.forEach(([o])=>o.visible=o===root);s.renderer.setClearColor(0,0);const isolated=read();for(let i=3;i<isolated.length;i+=4)if(isolated[i]>=20)peak++;vis.forEach(([o,v])=>o.visible=v);s.renderer.setClearColor(old,oldAlpha);
    rows.push({method,ms,changedPixels:prior?changed:null,effectPixels:peak,effectFraction:peak/(W*H),contrast});prior=rendered;
    images[method+'-'+ms]=png(rendered);if([1100,2200].includes(ms))images[method+'-mask-'+ms]=png(isolated);
   }
  }
  s.renderer.setRenderTarget(oldTarget);s.renderer.setClearColor(old,oldAlpha);s.scene.remove(root);rt.dispose();mesh.geometry.dispose();material.dispose();paint.dispose();noise.dispose();
  return{rows,images,audit,width:W,height:H,isolation:{autoClear,emptyAlphaPixels,masks:masks.map(({alpha,...m})=>m)},scope:'Original painted core and real wave3 scene; same peak size, scalar simultaneous front versus continuously deformed/revealed rear. Explicit cleared render target and group sorting. No complete effect, face-specific or video timing acceptance.'};
 });
 for(const [name,data] of Object.entries(result.images))writeFileSync(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));delete result.images;
 const data={at:new Date().toISOString(),errors,sourceCommit:'4e92343da',scriptSha256:createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex'),...result};
 writeFileSync('tools/v3craft-lab/q3b/composition-study.json',JSON.stringify(data,null,2)+'\n');
 for(const method of ['simultaneous-front','staggered-rear']){const rows=data.rows.filter(r=>r.method===method);console.log(JSON.stringify({method,zeroCastChanges:rows.filter(r=>r.ms>600&&r.ms<=1100&&r.changedPixels===0).length,minimumContrast:Math.min(...rows.flatMap(r=>r.contrast.map(c=>c.retention))),peakArea:Math.max(...rows.map(r=>r.effectFraction)),errors}));}
}finally{await browser.close();}
