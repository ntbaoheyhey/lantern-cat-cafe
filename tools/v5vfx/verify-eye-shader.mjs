/** GPU regression: original open pixels/alpha, bounded eye changes, authored K4 bypass. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-A3-shader-check');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720}};
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 report.rows=await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js'),{usePaintedAtlasColor}=await import('/src/game/rig/atlas-color.ts'),{DRAWING_EYES}=await import('/src/game/rig/drawing-eye-regions.ts');
  const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;s.render({...s.view(),frame:null,fixedTime:1.003106305,paused:true,galleryPreview:true},0);
  const width=s.width,height=s.height,target=new T.WebGLRenderTarget(width,height,{depthBuffer:false}),previous=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()),alpha=s.renderer.getClearAlpha(),rows=[];
  const inside=(x,y,r)=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height;
  try{
   s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);
   for(const e of s.actors.values()){
    if(!DRAWING_EYES[e.asset])continue;const d=e.craftPose.drawing;
    for(const [key,clip,seconds]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
     d.sample(clip,seconds,false,undefined,1.003106305);d.updateWorldMatrix(true,false);
     const scene=new T.Scene(),mesh=new T.Mesh(d.geometry,d.material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);mesh.frustumCulled=false;scene.add(mesh);
     const neutral=new T.MeshBasicMaterial().copy(d.material);usePaintedAtlasColor(neutral,false);
     const render=material=>{mesh.material=material;const bytes=new Uint8Array(width*height*4);s.renderer.clear();s.renderer.render(scene,s.camera);s.renderer.readRenderTargetPixels(target,0,0,width,height,bytes);return bytes;};
     const reference=render(neutral);d.expression.sample(d.frame.face,d.set.manifest.canvas,0,0,key);const open=render(d.material);d.expression.sample(d.frame.face,d.set.manifest.canvas,1,1,key);const closed=render(d.material);neutral.dispose();
     const [fx,fy,fw,fh]=d.frame.face;
     const eyes=(DRAWING_EYES[e.asset][key]??[]).map(([cx,cy,rx,ry,roll])=>{
      const points=Array.from({length:32},(_,i)=>{const t=i*Math.PI/16,x=Math.cos(t)*fw*rx*1.3,y=Math.sin(t)*fh*ry*1.3,p=d.point([fx+fw*cx+x*Math.cos(roll)-y*Math.sin(roll),fy+fh*cy+x*Math.sin(roll)+y*Math.cos(roll)]),v=d.localToWorld(new T.Vector3(p.x,p.y,0)).project(s.camera);return{x:(v.x*.5+.5)*width,y:(.5-v.y*.5)*height};});
      const x=Math.floor(Math.min(...points.map(p=>p.x)))-2,y=Math.floor(Math.min(...points.map(p=>p.y)))-2;return{x,y,width:Math.ceil(Math.max(...points.map(p=>p.x)))-x+2,height:Math.ceil(Math.max(...points.map(p=>p.y)))-y+2};
     });
     let openChanged=0,alphaChanged=0,closedChanged=0,outsideEyeBounds=0,irisOpen=0,irisClosed=0;
     const turquoise=(b,i)=>b[i+1]>b[i]*1.15&&b[i+2]>b[i]*1.05&&b[i+1]>65&&b[i+3]>127;
     for(let i=0;i<open.length;i+=4){
      const x=(i/4)%width,y=height-1-Math.floor(i/4/width),inEyes=eyes.some(r=>inside(x,y,r));
      if(open[i]!==reference[i]||open[i+1]!==reference[i+1]||open[i+2]!==reference[i+2]||open[i+3]!==reference[i+3])openChanged++;
      if(open[i+3]!==closed[i+3])alphaChanged++;
      if(open[i]!==closed[i]||open[i+1]!==closed[i+1]||open[i+2]!==closed[i+2]){closedChanged++;if(!inEyes)outsideEyeBounds++;}
      if(e.asset==='mochi'&&inEyes){if(turquoise(open,i))irisOpen++;if(turquoise(closed,i))irisClosed++;}
     }
     rows.push({owner:e.asset,key,width,height,openChanged,alphaChanged,closedChanged,outsideEyeBounds,mochiEyeHue:e.asset==='mochi'?{open:irisOpen,closed:irisClosed}:undefined});
    }
   }
  }finally{s.renderer.setRenderTarget(previous);s.renderer.setClearColor(clear,alpha);target.dispose();}
  return rows;
 });
 report.errors=errors;report.pass=!errors.length&&report.rows.every(r=>r.openChanged===0&&r.alphaChanged===0&&r.outsideEyeBounds===0&&(r.key==='K4'?r.closedChanged===0:r.closedChanged>0)&&(!r.mochiEyeHue||r.mochiEyeHue.closed<=Math.max(2,r.mochiEyeHue.open*.05)));
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
