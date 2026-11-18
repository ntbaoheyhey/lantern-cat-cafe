/** Conservative HP clearance around the complete media plane, without runtime edits. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'), integration='/Users/bao/taskbar-hero-chain';
const app=resolve(integration,'apps/web'),base=resolve(root,'work/v5/CXV/batch-m/clover-hp-clearance-R1');
const req=createRequire(resolve(root,'apps/web/package.json')),T=req('three');
const {createServer}=await import(req.resolve('vite'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const ref=async path=>({path,sha256:sha(await readFile(path))});
const prereg=JSON.parse(await readFile(resolve(base,'preregistration.json')));
const destination=resolve(root,'reports/v5/CXV/M-clover-hp-clearance-R1.json');
assert(!existsSync(destination));
const {width,height,opaqueHeight,foot,segments}=prereg.geometry,scale=512/opaqueHeight;
const hp=[(prereg.candidateDeliveryXY[0]-foot[0])*scale,(foot[1]-prereg.candidateDeliveryXY[1])*scale];
assert.equal(hp[0],0);assert(Math.abs(hp[1]-1.12*512)<1e-10);
const paths=['src/game/cardrpg/spine/designer-idle-loader.ts','src/game/rig/living-cast.ts','src/game/cardrpg/spine/assets.ts','src/game/cardrpg/spine/scene.ts'];
const sources=await Promise.all(paths.map(p=>ref(resolve(app,p))));
const loader=await readFile(sources[0].path,'utf8'),fallback=await readFile(sources[2].path,'utf8');
assert(loader.includes('new T.PlaneGeometry(manifest.width*scale,manifest.height*scale,24,24)'));
assert(fallback.includes("['hpAnchor',1.12]"));
const geometry=new T.PlaneGeometry(width*scale,height*scale,...segments);
geometry.translate((width/2-foot[0])*scale,(foot[1]-height/2)*scale,0);
const original=new Float32Array(geometry.attributes.position.array),target=geometry.attributes.position.array;
const server=await createServer({root:app,configFile:false,cacheDir:resolve(base,'vite-cache'),server:{middlewareMode:true,watch:null,fs:{allow:[root,integration]}},logLevel:'error'});
const report={utc:new Date().toISOString(),preregistration:await ref(resolve(base,'preregistration.json')),sources,
  candidateDeliveryXY:prereg.candidateDeliveryXY,candidateWorldXY:hp,geometry:prereg.geometry,vertexCount:original.length/3,
  groups:[],limits:'Local canonical media mesh envelope only. Full plane includes transparent corners, so this is conservative; no alpha correctness is assumed. Scene root transforms, camera, hp centering and label readability remain separate native gates. No application or registry writes.',pass:false};
try{
  const {sampleLivingCatCast,applyLivingCatCast,livingCatCastOffset}=await server.ssrLoadModule(resolve(app,'src/game/rig/living-cast.ts'));
  // Every clamped quintic pulse is in [0,1]. Triangle inequality over the
  // exact Clover coefficients bounds all continuous skill/ultimate poses.
  const poseBounds={lift:.012+.022+.008+.003,follow:.008+.004,tilt:.021*(.6+1+.35)};
  const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(t*6-15)+10);};
  const sinBound=Math.sin(poseBounds.tilt),cosLoss=1-Math.cos(poseBounds.tilt),hpDy=hp[1]-.63*512;
  let conservative=Infinity,worstVertex=-1;
  for(let i=0;i<original.length;i+=3){
    const x=original[i],y=original[i+1],upper=y>0?smooth((y/512-.06)/.72):0,head=y>0?smooth((y/512-.57)/.29):0;
    // Bound the difference directly: shared lift/follow cancel near the top.
    const lower=hp[1]-y-512*poseBounds.lift*Math.abs(1-upper)
      -512*poseBounds.follow*Math.abs(.25-upper*(1-.75*head))
      -Math.abs(x*head)*sinBound-Math.abs(hpDy-(y-.63*512)*head)*cosLoss-.001;
    if(lower<conservative){conservative=lower;worstVertex=i/3;}
  }
  report.continuousLocalBound={poseBounds,float32SafetyWorld:.001,minimumClearanceWorld:conservative,worstVertex,
    derivation:'hpY-y -512|lift|(1-upper) -512|follow||.25-upper(1-.75head)| -|x head|sin(maxTilt) -|hpDy-dy head|(1-cos(maxTilt)) -.001. All triangle interiors lie in their vertex convex hull.'};
  assert(conservative>0);
  const rows=[],pose={lean:0,lift:0,tilt:0,follow:0},offset={x:0,y:0};
  for(const animation of ['idle','skill','ult'])for(const reduced of [false,true]){
    let min=Infinity,max=-Infinity,worst=null;
    for(let step=0;step<=1000;step++){
      const phase=step/1000;sampleLivingCatCast('clover',animation,phase,reduced,pose);
      for(const k of Object.keys(poseBounds))assert(Math.abs(pose[k])<=poseBounds[k]+1e-12);
      applyLivingCatCast(original,target,512,pose);livingCatCastOffset(hp[0],hp[1],512,pose,offset);
      let top=-Infinity;for(let i=1;i<target.length;i+=3)top=Math.max(top,target[i]);
      const clearance=hp[1]+offset.y-top;assert(clearance>=conservative);
      rows.push({animation,reduced,phase,clearance,anchor:[hp[0]+offset.x,hp[1]+offset.y],meshTop:top});
      if(clearance<min){min=clearance;worst={phase,pose:{...pose},meshTop:top};}max=Math.max(max,clearance);
    }
    report.groups.push({animation,reduced,samples:1001,minClearanceWorld:min,maxClearanceWorld:max,worst});
  }
  const rawPath=resolve(base,'samples.json');await writeFile(rawPath,JSON.stringify(rows)+'\n');report.raw=await ref(rawPath);
  for(const f of sources)assert.equal(sha(await readFile(f.path)),f.sha256,'Source changed during experiment');
  report.harness=await ref(import.meta.filename);report.pass=true;
}finally{geometry.dispose();await server.close();await writeFile(destination,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({pass:report.pass,candidateDeliveryXY:report.candidateDeliveryXY,continuousLocalBound:report.continuousLocalBound,groups:report.groups.map(({animation,reduced,samples,minClearanceWorld})=>({animation,reduced,samples,minClearanceWorld}))}));
