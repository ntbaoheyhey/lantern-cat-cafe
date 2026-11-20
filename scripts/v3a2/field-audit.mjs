/** Actual posed alpha masks, not rectangle overlap. All decodes stay in reports/. */
import sharp from 'sharp';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,config,openFixture} from './browser-fixture.mjs';
const args=process.argv.slice(2),arg=(name,fallback)=>args.includes('--'+name)?args[args.indexOf('--'+name)+1]:fallback;
const out=resolve(root,arg('out','reports/v3-battle/a2/F1'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const fixtures={};
const median=v=>[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)];
try{
 for(const [width,height] of (arg('width',null)?[[Number(arg('width')),Number(arg('height','720'))]]:[[1280,720],[1440,900]])){
  for(const fixture of config.fixtures.filter(f=>arg('fixture','all')==='all'||f.id===arg('fixture'))){
   const {page,errors}=await openFixture(browser,fixture,{width,height}),key=`${fixture.id}@${width}x${height}`;
   const screenshot=await page.screenshot();await sharp(screenshot).resize({width:1280,withoutEnlargement:true}).png().toFile(resolve(out,key+'.png'));
   const sample=await page.evaluate(async(root)=>{
    const s=window.__depthScene,canvas=s.renderer.domElement,rect=canvas.getBoundingClientRect();
    const audit=s.sizeAudit(),visibility=s.scene.children.map(c=>[c,c.visible]);
    const {ShaderMaterial,NormalBlending,Color}=await import('/@fs'+root+'/apps/web/node_modules/three/build/three.module.js');
    const clear=s.renderer.getClearColor(new Color()).clone();s.renderer.setClearColor(0x000000);
    const masks=[];
    for(const unit of audit.units){
     for(const [c] of visibility)c.visible=false;
     const actor=s.actors.get(unit.id).actor;actor.root.visible=true;
     const originals=[];
     actor.root.traverse(node=>{if(!node.isMesh)return;
      const material=node.material;originals.push([node,material]);
      node.material=new ShaderMaterial({uniforms:{map:{value:material.map},opacity:{value:material.opacity}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D map;uniform float opacity;varying vec2 vUv;void main(){gl_FragColor=vec4(vec3(1.),texture2D(map,vUv).a*opacity);}',transparent:true,blending:NormalBlending,side:material.side,depthTest:false,depthWrite:false});
     });
     s.renderer.clear(true,true,true);s.renderer.render(s.scene,s.camera);masks.push({id:unit.id,png:canvas.toDataURL('image/png')});
     for(const [node,material] of originals){node.material.dispose();node.material=material;}
    }
    for(const [c,v] of visibility)c.visible=v;s.renderer.setClearColor(clear);s.render({...s.view(),fixedTime:10,paused:true},0);
    return {audit,masks,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},fieldNameLabels:document.querySelectorAll('.b3-world-name').length};
   },root);
   const {audit}=sample,w=audit.width,h=audit.height;
   const masks=new Map();
   for(const m of sample.masks){const {data,info}=await sharp(Buffer.from(m.png.split(',')[1],'base64')).removeAlpha().raw().toBuffer({resolveWithObject:true});masks.set(m.id,{data,channels:info.channels});}
   let maxFaceOcclusion=0,clippedUnits=0,visibleFloor=0;const pairs=[];
   for(const unit of audit.units){
    const face=unit.faceBox,rear=masks.get(unit.id);let rearArea=0;
    for(let y=Math.max(0,Math.floor(face.y));y<Math.min(h,Math.ceil(face.y+face.height));y++)for(let x=Math.max(0,Math.floor(face.x));x<Math.min(w,Math.ceil(face.x+face.width));x++)rearArea+=rear.data[(y*w+x)*rear.channels]/255;
    for(const front of audit.units.filter(u=>u.id!==unit.id&&u.drawOrder>unit.drawOrder)){
     const other=masks.get(front.id);let overlap=0;
     for(let y=Math.max(0,Math.floor(face.y));y<Math.min(h,Math.ceil(face.y+face.height));y++)for(let x=Math.max(0,Math.floor(face.x));x<Math.min(w,Math.ceil(face.x+face.width));x++)overlap+=rear.data[(y*w+x)*rear.channels]/255*other.data[(y*w+x)*other.channels]/255;
     const fraction=overlap/Math.max(1,rearArea);maxFaceOcclusion=Math.max(maxFaceOcclusion,fraction);if(fraction>0)pairs.push({rear:unit.asset,front:front.asset,fraction});
    }
    let edgeInk=0;for(let x=0;x<w;x++)edgeInk+=Number(rear.data[x*rear.channels]>25)+Number(rear.data[((h-1)*w+x)*rear.channels]>25);
    for(let y=0;y<h;y++)edgeInk+=Number(rear.data[y*w*rear.channels]>25)+Number(rear.data[(y*w+w-1)*rear.channels]>25);
    if(edgeInk)clippedUnits++;
   }
   // Conservative manually reviewed floor matte: excludes wall, counter and pot.
   // Architecture is cropped at source 74%, painted floor begins at destination 160/1024.
   const floorMatte={top:.17,edgeProps:[{left:0,right:.075,top:.7},{left:.94,right:1,top:.75}]},allMasks=[...masks.values()];
   for(let y=Math.ceil(h*floorMatte.top);y<h;y++)for(let x=0;x<w;x++){
    if(floorMatte.edgeProps.some(p=>x/w>=p.left&&x/w<=p.right&&y/h>=p.top))continue;
    if(!allMasks.some(m=>m.data[(y*w+x)*m.channels]>25))visibleFloor++;
   }
   fixtures[key]={medianCoreHeightFraction:median(audit.units.filter(u=>u.kind!=='boss').map(u=>u.coreBox.height/height)),maxFaceOcclusion,clippedUnits,visibleFloorFraction:visibleFloor/(w*h),floorMatte,fieldNameLabels:sample.fieldNameLabels,field:sample.rect,units:audit.units,pairs,errors};
   await writeFile(resolve(out,key+'.json'),JSON.stringify({_meta:evidenceMeta(),...fixtures[key]},null,2)+'\n');
   console.log(key,JSON.stringify({scale:fixtures[key].medianCoreHeightFraction,occlusion:maxFaceOcclusion,clipping:clippedUnits,floor:fixtures[key].visibleFloorFraction,errors}));
   await page.close();
  }
 }
}finally{await browser.close();}
let suite;try{suite=JSON.parse(await readFile(resolve(out,'suite.json'),'utf8'));}catch{}
await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),fixtures,suite},null,2)+'\n');
