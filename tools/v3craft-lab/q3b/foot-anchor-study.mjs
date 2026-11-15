// Q3B-X07: reproject existing X06 original-paint feet through the actual Q2 root.
// Two contact methods: moving body-box centre versus two material foot anchors.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const rows=await page.evaluate(async()=>{
   const s=window.__depthScene,v={...s.view(),fixedTime:10,paused:true},rows=[];
   const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const actor=s.actors.get('soot').actor,root=new T.Group(),copies=[];
   for(const [page,child]of actor.mesh.children.entries()){
    let offset=0;const index=[];
    for(const part of actor.mesh.data.parts.filter(p=>p.page===page)){
     if(part.name==='feet')index.push(...part.triangles.map(n=>n+offset));offset+=part.vertices.length;
    }
    if(!index.length)continue;
    const g=child.geometry.clone();g.setIndex(index);const mesh=new T.Mesh(g,child.material);mesh.matrixAutoUpdate=false;root.add(mesh);copies.push({mesh,child});
   }
   const target=new T.WebGLRenderTarget(s.width,s.height,{depthBuffer:false}),pixels=new Uint8Array(s.width*s.height*4);
   const saved=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha();
   for(const [clip,total,ms]of [['attack',800,0],['attack',800,225],['attack',800,350],['ult',2200,600],['ult',2200,1100],['ult',2200,1360]]){
    s.render({...v,model:{clip},modelProgress:ms/total},0);
    for(const {mesh,child}of copies){mesh.geometry.attributes.position.copy(child.geometry.attributes.position);mesh.geometry.attributes.position.needsUpdate=true;mesh.matrix.copy(child.matrixWorld);}
    s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(root,s.camera);s.renderer.readRenderTargetPixels(target,0,0,s.width,s.height,pixels);
    let bottom=-1,paintedPixels=0;for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)if(pixels[((s.height-1-y)*s.width+x)*4+3]>=128){bottom=Math.max(bottom,y);paintedPixels++;}
    const profile=Array(s.width).fill(0);for(let y=bottom-7;y<=bottom;y++)for(let x=0;x<s.width;x++)if(pixels[((s.height-1-y)*s.width+x)*4+3]>=128)profile[x]++;
    const patches=[];let run=[];for(let x=0;x<=s.width;x++){if(profile[x]>0)run.push(x);else if(run.length){if(run.length>2){const sum=run.reduce((a,x)=>a+profile[x],0);patches.push([run.reduce((a,x)=>a+x*profile[x],0)/sum,bottom+.5]);}run=[];}}
    s.renderer.setRenderTarget(saved);s.renderer.setClearColor(clear,alpha);
    rows.push({clip,ms,paintedPixels,paintedFeet:patches,matrix:actor.root.matrixWorld.toArray(),worldWidth:s.worldWidth,worldHeight:1950,width:s.width,height:s.height,box:s.sizeAudit().units.find(u=>u.id==='soot').box});
   }for(const {mesh}of copies)mesh.geometry.dispose();target.dispose();return rows;
  });results.push({width,height,errors,rows});await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/foot-anchor-transforms.json',JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
}finally{await browser.close();}
