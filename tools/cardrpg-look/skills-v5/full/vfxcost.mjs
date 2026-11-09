import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {open,apply} from './harness.mjs';
const artifact=resolve(process.env.V5_ARTIFACT),out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const result={method:'Cost probe separate from timing: warmed natural cast, CDP heap before/after and allocation sampling (including renderer/DOM/harness). Peak additive coverage is conservative projected instance bounding-box area summed over translucent layers. Not pixel-exact overdraw.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal','--enable-precise-memory-info']});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));await open(page,artifact);
 const cdp=await page.context().newCDPSession(page),ids=process.env.V5_IDS?.split(',')??await page.evaluate(()=>window.__depthReview.galleryActions.filter(a=>!a.id.startsWith('enemy:')).map(a=>a.id));
 for(const id of ids){
  await apply(page,{gallery:id,progress:0});await page.evaluate(id=>window.__depthReview.inspect(id,0,true),id);await page.waitForFunction(()=>!window.__depthReview.plan);
  await cdp.send('HeapProfiler.collectGarbage');const before=await cdp.send('Runtime.getHeapUsage');
  const programsBefore=await page.evaluate(()=>window.__depthScene.renderer.info.programs.length);
  await cdp.send('HeapProfiler.startSampling',{samplingInterval:512,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
  await page.evaluate(id=>{window.__vfxCosts=[];window.__depthReview.inspect(id,0,true);function sample(){const s=window.__depthScene;window.__vfxCosts.push({...s.stats,programs:s.renderer.info.programs.length});if(window.__depthReview.plan)requestAnimationFrame(sample)}requestAnimationFrame(sample)},id);
  await page.waitForFunction(()=>!window.__depthReview.plan);const after=await cdp.send('Runtime.getHeapUsage');const {profile}=await cdp.send('HeapProfiler.stopSampling');
  const frames=await page.evaluate(()=>window.__vfxCosts);
  await apply(page,{gallery:id,progress:.56});
  const peak=await page.evaluate(()=>{const s=window.__depthScene,e=s.cardEffects,entries=[];let area=0;
   const camera=s.camera;camera.updateMatrixWorld();const transform=(m,x,y,z,w=1)=>[m[0]*x+m[4]*y+m[8]*z+m[12]*w,m[1]*x+m[5]*y+m[9]*z+m[13]*w,m[2]*x+m[6]*y+m[10]*z+m[14]*w,m[3]*x+m[7]*y+m[11]*z+m[15]*w];
   for(const [name,pool]of e.pools){const mesh=pool.mesh;if(!mesh.visible||!mesh.count)continue;mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;
    for(let i=0;i<mesh.count;i++){const a=mesh.instanceMatrix.array.slice(i*16,i*16+16),xs=[],ys=[];
     for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){let v=transform(a,x,y,z);v=transform(mesh.matrixWorld.elements,...v);v=transform(camera.matrixWorldInverse.elements,...v);v=transform(camera.projectionMatrix.elements,...v);xs.push(Math.max(0,Math.min(1,(v[0]/v[3]+1)/2)));ys.push(Math.max(0,Math.min(1,(v[1]/v[3]+1)/2)))}
     area+=(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys));
    }entries.push({name,count:mesh.count});
   }return{coverageLayers:area,entries,lights:e.look?.lights.length??0,programs:s.renderer.info.programs.length,stats:{...s.stats}};
  });
  const bytes=node=>node.selfSize+node.children.reduce((n,c)=>n+bytes(c),0);
  result.rows.push({id,beforeHeap:before.usedSize,afterHeap:after.usedSize,heapDelta:after.usedSize-before.usedSize,sampledAllocationBytes:bytes(profile.head),programsBefore,programsAfter:peak.programs,peak,draws:Math.max(...frames.map(f=>f.calls)),tris:Math.max(...frames.map(f=>f.triangles)),particles:Math.max(...frames.map(f=>f.particles))});
  await writeFile(out+'/vfxcost.json.gz',gzipSync(JSON.stringify(result)));console.log(JSON.stringify(result.rows.at(-1)));
 }
}finally{await browser.close();await writeFile(out+'/vfxcost.json.gz',gzipSync(JSON.stringify(result)))}
