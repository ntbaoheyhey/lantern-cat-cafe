// P2 own-content experiment: image colour/origin before production drawing swaps.
// LEARN/P2.md; real battle renderer, unchanged capture machinery.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/p2/raw/runtime';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const rows=[];
try {
 for(const [width,height] of [[1280,720],[1440,900]]) {
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const data=await page.evaluate(async()=>{
   const s=window.__depthScene,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const {usePaintedAtlasColor}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/rig/atlas-color.ts');
   const {opaqueWorldBounds}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/cardrpg/stage/opaque-pose-bounds.ts');
   s.render({...s.view(),model:{clip:'idle'},modelProgress:0,fixedTime:10,paused:true},0);
   const actor=s.actors.get('soot').actor,W=s.width,H=s.height;
   const rt=new T.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false});rt.texture.colorSpace=T.SRGBColorSpace;
   const oldTarget=s.renderer.getRenderTarget(),oldColour=s.renderer.getClearColor(new T.Color()).clone(),oldAlpha=s.renderer.getClearAlpha();
   const pixels=()=>{actor.root.updateMatrixWorld(true);s.renderer.setRenderTarget(rt);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(actor.root,s.camera);const p=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(rt,0,0,W,H,p);return p;};
   const png=p=>{const c=document.createElement('canvas');c.width=W;c.height=H;const a=new Uint8ClampedArray(p.length);for(let y=0;y<H;y++)a.set(p.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(a,W,H),0,0);return c.toDataURL();};
   const bounds=p=>{let left=W,right=-1,bottom=H,top=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(p[(y*W+x)*4+3]>=128){left=Math.min(left,x);right=Math.max(right,x);bottom=Math.min(bottom,y);top=Math.max(top,y);}return{left,right,bottom,top,height:top-bottom+1};};
   const base=pixels(),baseBox=bounds(base),world=opaqueWorldBounds(actor.root),inverse=actor.root.matrixWorld.clone().invert();
   const localFoot=new T.Vector3((world.x+world.width/2),world.y,0).applyMatrix4(inverse);
   const img=new Image();img.src='/units/soot/runtime.webp';await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const cx=c.getContext('2d');cx.drawImage(img,0,0);const rgba=cx.getImageData(0,0,img.width,img.height).data;
   let l=img.width,r=0,t=img.height,b=0;for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++)if(rgba[(y*img.width+x)*4+3]>=128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
   let sum=0,n=0;for(let y=b-4;y<=b;y++)for(let x=l;x<=r;x++)if(rgba[(y*img.width+x)*4+3]>=128){sum+=x+.5;n++;}
   const sourceFoot=[sum/n,b+.5],scale=world.height/actor.root.scale.y/(b-t+1),hidden=[];
   actor.root.traverse(o=>{if(o.isMesh){hidden.push([o,o.visible]);o.visible=false;}});
   const tex=new T.Texture(img);tex.colorSpace=T.NoColorSpace;tex.needsUpdate=true;
   const geometry=new T.PlaneGeometry(img.width*scale,img.height*scale),material=new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false});
   const plane=new T.Mesh(geometry,material);plane.frustumCulled=false;plane.renderOrder=actor.root.children[0].renderOrder;actor.root.add(plane);
   const images={rig:png(base)},measurements=[];let painted;
   for(const method of ['default-centred','painted-foot','srgb-foot']) {
    if(method==='default-centred')plane.position.set(0,0,.01);
    else plane.position.set(localFoot.x+(img.width/2-sourceFoot[0])*scale,localFoot.y+(sourceFoot[1]-img.height/2)*scale,.01);
    if(method==='painted-foot')usePaintedAtlasColor(material,false);
    if(method==='srgb-foot'){material.onBeforeCompile=()=>{};material.customProgramCacheKey=()=> 'P2-srgb-foot';tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;}
    material.needsUpdate=true;const p=pixels(),box=bounds(p);images[method]=png(p);
    if(method==='painted-foot')painted=p;
    let difference=0,count=0,max=0;if(method==='srgb-foot')for(let i=0;i<p.length;i+=4)if(p[i+3]>=250&&painted[i+3]>=250)for(let j=0;j<3;j++){const d=Math.abs(p[i+j]-painted[i+j]);difference+=d;max=Math.max(max,d);count++;}
    measurements.push({method,box,footDriftPx:Math.abs(box.bottom-baseBox.bottom),heightDeltaPx:box.height-baseBox.height,meanDecodeDifference:count?difference/count:null,maxDecodeDifference:count?max:null,hull:opaqueWorldBounds(actor.root)});
   }
   // Independently demonstrate why hiding only a parent group is insufficient for our hull reader.
   plane.visible=false;for(const [o,v]of hidden)o.visible=v;actor.mesh.visible=false;const hiddenParentHull=opaqueWorldBounds(actor.root);actor.mesh.visible=true;
   for(const [o]of hidden)o.visible=false;const hiddenMeshesHull=opaqueWorldBounds(actor.root);
   for(const [o,v]of hidden)o.visible=v;plane.removeFromParent();geometry.dispose();material.dispose();tex.dispose();
   const restored=pixels();let restorationMax=0;for(let i=0;i<base.length;i++)restorationMax=Math.max(restorationMax,Math.abs(base[i]-restored[i]));
   s.renderer.setRenderTarget(oldTarget);s.renderer.setClearColor(oldColour,oldAlpha);rt.dispose();
   return{images,baseBox,sourceBounds:{l,r,t,b},sourceFoot,localFoot:localFoot.toArray(),measurements,hiddenParentHull,hiddenMeshesHull,restorationMax};
  });
  for(const [name,png]of Object.entries(data.images))writeFileSync(`${out}/${width}-${name}.png`,Buffer.from(png.split(',')[1],'base64'));delete data.images;
  rows.push({width,height,errors,...data});await page.close();
 }
 writeFileSync('tools/v3craft-lab/p2/runtime-study.json',JSON.stringify({at:new Date().toISOString(),scope:'Own-art colour/origin comparison, not production acceptance',rows},null,2)+'\n');
 console.log(JSON.stringify(rows.map(({width,errors,measurements,restorationMax})=>({width,errors,measurements,restorationMax}))));
} finally {await browser.close();}
