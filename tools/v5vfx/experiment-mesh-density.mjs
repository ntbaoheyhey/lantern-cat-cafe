/** Topology quality experiment; rendered differences are expected and measured. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-mesh-density');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),viewport:{width:1280,height:720},method:'Tool-only32/24/20grid topology comparison. Same current art/material/UVs/clocks and motion formula; images not downsampled. Isolated1280x720 GPU RGBA differences on visible union, mesh interpolation at32grid vertices, exact arbitrary sockets/feet. Includes two forced diagonal face extrema for heroes. Separate warmed geometry timing at4xCPU. Changed topology is not exact-pixel parity or ordinary FPS.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const fixture of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===fixture),{fixedClock:false});report.url=page.url();
  const result=await page.evaluate(async fixture=>{
   const T=await import('/node_modules/.vite/deps/three.js');
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
   m.plan=null;m.animationAt=0;s.render({...s.view(),frame:null,fixedTime:30,paused:true,galleryPreview:true},0);
   const scene=new T.Scene(),target=new T.WebGLRenderTarget(1280,720,{depthBuffer:false});
   const previous=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()),clearAlpha=s.renderer.getClearAlpha();
   const variants=new Map(),rows=[],worst={},drawings=[...s.actors].filter(([,e])=>e.craftPose?.drawing);
   const select=(d,n)=>{const v=variants.get(d).get(n);d.geometry=v.geometry;d.source=v.source;d.vertexWeights=v.weights;};
   const project=(d,p)=>s.screen(new T.Vector3(p[0],p[1],.002).applyMatrix4(d.matrixWorld));
   const imageBounds=pair=>{let x0=1280,y0=720,x1=0,y1=0;for(let i=0;i<1280*720;i++){if(!pair.some(p=>p.pixels[i*4+3]))continue;const x=i%1280,y=719-Math.floor(i/1280);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}x0=Math.max(0,x0-12);y0=Math.max(0,y0-12);return{x:x0,y:y0,width:Math.min(1280,x1+13)-x0,height:Math.min(720,y1+13)-y0};};
   const png=(data,clip)=>{const canvas=document.createElement('canvas');canvas.width=clip.width;canvas.height=clip.height;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(clip.width,clip.height);for(let y=0;y<clip.height;y++){const start=((719-clip.y-y)*1280+clip.x)*4;pixels.data.set(data.subarray(start,start+clip.width*4),y*clip.width*4);}ctx.putImageData(pixels,0,0);return canvas.toDataURL('image/png');};
   const sample=(d,clip,at,clock,forced)=>{
    d.sample(clip,at,false,undefined,clock);
    if(forced){d.secondary.turn=forced[0];d.secondary.nod=forced[1];d.faceDepth.sample(...forced);const a=d.geometry.attributes.position;
     for(let i=0;i<a.count;i++){const p=d.point([d.source[i*3]+d.set.manifest.canvas[0]/2,d.set.manifest.canvas[1]/2-d.source[i*3+1]]);a.setXYZ(i,p.x,p.y,.002);}a.needsUpdate=true;
    }
   };
   const gpu=d=>{const data=new Uint8Array(1280*720*4),mesh=new T.Mesh(d.geometry,d.material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);mesh.frustumCulled=false;scene.add(mesh);s.renderer.clear();s.renderer.render(scene,s.camera);s.renderer.readRenderTargetPixels(target,0,0,1280,720,data);scene.remove(mesh);return data;};
   const compare=(a,b)=>{let union=0,changed=0,over8=0,sum=0,alphaSum=0,max=0;
    for(let i=0;i<a.length;i+=4){if(!a[i+3]&&!b[i+3])continue;union++;let peak=0;for(let c=0;c<4;c++){const delta=Math.abs(a[i+c]-b[i+c]);sum+=delta*delta;if(c===3)alphaSum+=delta*delta;peak=Math.max(peak,delta);}changed+=peak>0;over8+=peak>8;max=Math.max(max,peak);}
    return{visibleUnion:union,changed,over8,over8Percent:100*over8/Math.max(1,union),rmse:Math.sqrt(sum/Math.max(1,union*4)),alphaRmse:Math.sqrt(alphaSum/Math.max(1,union)),maxChannelDelta:max};
   };
   const interpolation=(d,base,n)=>{const a=d.geometry.attributes.position.array,[w,h]=d.set.manifest.canvas,[fx,fy,fw,fh]=d.frame.face,bounds=d.frame.opaqueBounds??[0,0,w,h];let maxBody=0,maxFace=0,sum=0,count=0;
    for(let iy=0;iy<=32;iy++)for(let ix=0;ix<=32;ix++){
     const x=ix*w/32,y=iy*h/32;if(x<bounds[0]||x>bounds[2]||y<bounds[1]||y>bounds[3])continue;
     const gx=ix*n/32,gy=iy*n/32,cx=Math.min(n-1,Math.floor(gx)),cy=Math.min(n-1,Math.floor(gy)),u=gx-cx,v=gy-cy;
     const tl=cy*(n+1)+cx,bl=tl+n+1,tr=tl+1,br=bl+1,ids=u+v<=1?[tl,bl,tr]:[bl,br,tr],weights=u+v<=1?[1-u-v,v,u]:[1-u,u+v-1,1-v];
     const q=[0,0];for(let k=0;k<3;k++){q[0]+=a[ids[k]*3]*weights[k];q[1]+=a[ids[k]*3+1]*weights[k];}
     const b=(iy*33+ix)*3,p0=project(d,[base[b],base[b+1]]),p1=project(d,q),distance=Math.hypot(p0.x-p1.x,p0.y-p1.y);maxBody=Math.max(maxBody,distance);sum+=distance*distance;count++;
     if(x>=fx&&x<=fx+fw&&y>=fy&&y<=fy+fh)maxFace=Math.max(maxFace,distance);
    }
    return{maxBodyPx:maxBody,maxFacePx:maxFace,rmsBodyPx:Math.sqrt(sum/Math.max(1,count)),samples:count};
   };
   try{
    s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);
    for(const [,e]of drawings){const d=e.craftPose.drawing,[w,h]=d.set.manifest.canvas,all=new Map([[32,{geometry:d.geometry,source:d.source,weights:d.vertexWeights}]]);
     for(const n of [24,20]){const geometry=new T.PlaneGeometry(w,h,n,n);all.set(n,{geometry,source:Float32Array.from(geometry.attributes.position.array),weights:new Map()});}variants.set(d,all);
    }
    for(const [actorId,e]of drawings){const d=e.craftPose.drawing,hero=['mochi','soot','clover','panko'].includes(e.asset);
     const cases=[...['K0','K1','K2','K5','K4'].flatMap((key,i)=>[30,30.6].map(clock=>({key,clip:['idle','attack','attack','ult','hurt'][i],at:[0,.1,.4,1.1,0][i],clock}))),...(hero?[[-1,1],[1,-1]].map(forced=>({key:'K0',clip:'idle',at:0,clock:30.6,forced})):[])];
     for(const c of cases){const pair=[];for(const n of [32,24,20]){select(d,n);sample(d,c.clip,c.at,c.clock,c.forced);e.actor.root.updateMatrixWorld(true);pair.push({n,pixels:gpu(d),vertices:Float32Array.from(d.geometry.attributes.position.array),points:JSON.stringify({sockets:Object.values(d.frame.sockets).map(p=>d.point(p)),feet:d.contactPoints()})});}
      const metrics=pair.slice(1).map(p=>{select(d,p.n);return{segments:p.n,...compare(pair[0].pixels,p.pixels),...interpolation(d,pair[0].vertices,p.n),pointsExact:p.points===pair[0].points};});
      rows.push({actorId,asset:e.asset,...c,metrics});
      const score=metrics[0].maxFacePx+metrics[0].maxBodyPx;
      if(hero&&(!worst[actorId]||score>worst[actorId].score)){const clip=imageBounds(pair);worst[actorId]={score,actorId,asset:e.asset,...c,crop:clip,images:pair.map(p=>({segments:p.n,data:png(p.pixels,clip)}))};}
     }
    }
   }finally{s.renderer.setRenderTarget(previous);s.renderer.setClearColor(clear,clearAlpha);target.dispose();for(const [d,all]of variants){select(d,32);for(const n of [24,20])all.get(n).geometry.dispose();}}
   return{fixture,rows,worst:Object.values(worst)};
  },fixture);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  result.timing=await page.evaluate(async()=>{
   const T=await import('/node_modules/.vite/deps/three.js'),drawings=[...window.__depthScene.actors.values()].flatMap(e=>e.craftPose?.drawing?[e.craftPose.drawing]:[]),variants=new Map();
   for(const d of drawings){const [w,h]=d.set.manifest.canvas,all=new Map([[32,{geometry:d.geometry,source:d.source,weights:d.vertexWeights}]]);for(const n of [24,20]){const geometry=new T.PlaneGeometry(w,h,n,n);all.set(n,{geometry,source:Float32Array.from(geometry.attributes.position.array),weights:new Map()});}variants.set(d,all);}
   const select=n=>{for(const d of drawings){const v=variants.get(d).get(n);d.geometry=v.geometry;d.source=v.source;d.vertexWeights=v.weights;}};
   const cases=[['idle',.6],['attack',.1],['attack',.3],['attack',.35],['attack',.6],['ult',.6],['ult',1.1],['ult',1.8],['hurt',.06],['victory',1]],rows=[];
   const run=(n,cycles=6)=>{select(n);const start=performance.now();for(let c=0;c<cycles;c++)for(const [clip,at]of cases)for(const d of drawings)d.sample(clip,at,false,undefined,30+c*5+at,.7);return{segments:n,ms:performance.now()-start,samples:cycles*cases.length*drawings.length};};
   try{for(const n of [32,24,20])run(n,3);for(let block=0;block<7;block++)for(const n of block%2?[20,24,32]:[32,24,20])rows.push({...run(n),block});
    return{rows,modes:[32,24,20].map(n=>({segments:n,vertices:(n+1)**2,triangles:2*n*n,medianMs:rows.filter(r=>r.segments===n).map(r=>r.ms).sort((a,b)=>a-b)[3],cpuWeightBytes:drawings.reduce((sum,d)=>sum+[...variants.get(d).get(n).weights.values()].reduce((s,w)=>s+w.data.byteLength,0),0)}))};
   }finally{select(32);for(const all of variants.values())for(const n of [24,20])all.get(n).geometry.dispose();}
  });
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  for(const w of result.worst){const paths=[];for(const img of w.images){const path=resolve(out,`${fixture}-${w.asset}-${img.segments}.png`);await writeFile(path,Buffer.from(img.data.split(',')[1],'base64'));delete img.data;img.path=path;paths.push(path);}
   const sheet=resolve(out,`${fixture}-${w.asset}.jpg`);execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-filter_complex_threads','1',...paths.flatMap(p=>['-i',p]),'-filter_complex','[0:v]scale=256:320:force_original_aspect_ratio=decrease,pad=256:320:(ow-iw)/2:(oh-ih)/2:color=0x28242e[a];[1:v]scale=256:320:force_original_aspect_ratio=decrease,pad=256:320:(ow-iw)/2:(oh-ih)/2:color=0x28242e[b];[2:v]scale=256:320:force_original_aspect_ratio=decrease,pad=256:320:(ow-iw)/2:(oh-ih)/2:color=0x28242e[c];[a][b][c]hstack=inputs=3','-frames:v','1','-q:v','3','-y',sheet]);w.sheet=sheet;
  }
  report.fixtures.push(result);report.errors.push(...errors);await page.close();
  await writeFile(resolve(out,'report.partial.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({fixture,rows:result.rows.length,timing:result.timing.modes,errors}));
 }
 report.ended=new Date().toISOString();report.pass=!report.errors.length&&report.fixtures.every(f=>f.rows.every(r=>r.metrics.every(m=>m.pointsExact)));
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));assert(report.pass);
}finally{await browser.close();}
