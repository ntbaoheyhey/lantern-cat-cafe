/** Exact-grid trimming experiment; no application files are changed. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installOuterCellPrototype} from './outer-cell-prototype.mjs';
import {installStaticVertexNative} from './static-vertex-native-comparison.mjs';
const transparentWork=true;
const out=resolve(process.env.CXV_CAPTURE_OUT??(transparentWork?'work/v5/CXV/films/V7-F-static-native/geometry':'work/v5/CXV/films/V7-F-mesh-outer-prototype'));await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),prototypeSha256:createHash('sha256').update(await readFile(new URL('./outer-cell-prototype.mjs',import.meta.url))).digest('hex'),viewport:{width:1280,height:720},method:'Tool-only original32grid outer-cell trim. Compare retained vertex Float32 values via original indices, all UV values and triangle order, arbitrary sockets/feet/face corners, actual filtered GPU RGBA and painted world bounds. Full motion boundary suite plus normal/reduced GPU cases and diagonal face extremes; all current textures preserved. Seven alternating warmed geometry blocks at4xCPU; not ordinary FPS.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
if(transparentWork){report.transparentWork=true;report.prototypeSha256=createHash('sha256').update(await readFile(new URL('./static-vertex-native-comparison.mjs',import.meta.url))).digest('hex');report.method='Tool-only partial CPU deformation with all original vertices, UVs, indices and triangle order. Outer positions independently initialized at idle0 and frozen; active positions, arbitrary points, painted bounds and filtered GPU RGBA compared. Same boundary/reduced/diagonal suite and seven warmed geometry blocks; not ordinary FPS.';}
report.options={padding:Number(process.env.CXV_OUTER_PADDING??2),fullControl:process.env.CXV_OUTER_FULL_CONTROL==='1',noMipsControl:process.env.CXV_OUTER_NO_MIPS==='1',preserveSlots:process.env.CXV_OUTER_PRESERVE_SLOTS==='1'};
report.options.previewScales=true;
report.options.staticOnly=true;
if(report.options.staticOnly)report.method='Native stationary-row cutoff compared with the original module saved before editing: below baseline and every face projection/neck region. All original vertex values, UVs and indices must match, including frozen vertices. Independent idle0 initialization, full motion/filtered GPU suite plus preview scales. Original point/weight source asserted unchanged; all vertices and filtered GPU outputs must match.';
try{
 for(const fixture of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===fixture),{fixedClock:false});report.url=page.url();
  if(report.options.noMipsControl)await page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');for(const e of window.__depthScene.actors.values())for(const t of Object.values(e.craftPose?.drawing?.set.textures??{})){t.minFilter=T.LinearFilter;t.needsUpdate=true;}});
  const details=await (transparentWork?installStaticVertexNative:installOuterCellPrototype)(page,{active:false,...report.options});
  const result=await page.evaluate(async ({fixture,previewScales})=>{
   const T=await import('/node_modules/.vite/deps/three.js'),{opaqueWorldBounds}=await import('/src/game/cardrpg/stage/opaque-pose-bounds.ts');
   const s=window.__depthScene,m=window.__depthReview,p=window.__cxvOuter;cancelAnimationFrame(s.raf);
   m.plan=null;m.animationAt=0;s.render({...s.view(),frame:null,fixedTime:30,paused:true,galleryPreview:true},0);
   const rows=[],gpuRows=[],differences=[],topology=[],worst={count:-1};
   const cases={idle:[0,.3,.6,1.003106305,2.4,8.2],attack:[0,.05,.27,.3,.329,.33,.35,.439,.44,.56,.799],ult:[.29,.3,.6,1.1,1.189,1.19,1.759,1.76,1.8,2.199],hurt:[0,.089,.09,.179,.18,.399],ko:[.3],victory:[1]};
   const points=d=>JSON.stringify({sockets:Object.fromEntries(Object.entries(d.frame.sockets).map(([name,q])=>[name,d.point(q)])),face:d.faceCorners(),feet:d.contactPoints()});
   for(const v of p.variants){
    const {d,full,cut,ids}=v;let uvExact=true,indicesExact=true;
    for(let i=0;i<ids.length;i++)for(let c=0;c<2;c++)uvExact&&=full.geometry.attributes.uv.array[ids[i]*2+c]===cut.geometry.attributes.uv.array[(v.fullTopology?ids[i]:i)*2+c];
    const actual=[],keep=new Set(ids),expected=[];
    if(!v.fullTopology)for(let i=0;i<cut.geometry.index.count;i+=3){const t=Array.from(cut.geometry.index.array.slice(i,i+3),id=>ids[id]);if(t[0]!==t[1]||t[1]!==t[2])actual.push(...t);}
    for(let i=0;i<full.geometry.index.count;i+=3){const t=Array.from(full.geometry.index.array.slice(i,i+3));if(t.every(n=>keep.has(n)))expected.push(...t);}
    indicesExact=v.fullTopology?full.geometry.index.array.every((n,i)=>n===cut.geometry.index.array[i]):JSON.stringify(actual)===JSON.stringify(expected);
    if(v.fullTopology)uvExact=full.geometry.attributes.uv.array.every((n,i)=>n===cut.geometry.attributes.uv.array[i]);
    topology.push({unit:d.set.manifest.unit,uvExact,indicesExact,fullTopology:!!v.fullTopology,vertices:cut.geometry.attributes.position.count,indices:cut.geometry.index.count});
    for(const reduced of [false,true])for(const [clip,times]of Object.entries(cases))for(const at of times){
     p.select('full');d.sample(clip,at,reduced,undefined,30+at,.7);const baseline=Float32Array.from(d.geometry.attributes.position.array),a=points(d);
     p.select('cut');d.sample(clip,at,reduced,undefined,30+at,.7);const candidate=d.geometry.attributes.position.array,b=points(d);let changed=0;
     for(let i=0;i<ids.length;i++)for(let c=0;c<3;c++)if(!Object.is(candidate[(v.fullTopology?ids[i]:i)*3+c],baseline[ids[i]*3+c]))changed++;
     let frozenChanged=0;if(v.fullTopology)for(let i=0;i<candidate.length/3;i++)if(!keep.has(i))for(let c=0;c<3;c++)if(!Object.is(candidate[i*3+c],cut.initialPosition[i*3+c]))frozenChanged++;
     const allVertexExact=v.staticOnly?candidate.every((n,i)=>Object.is(n,baseline[i])):null;
     const row={unit:d.set.manifest.unit,reduced,clip,at,changedVertexComponents:changed,frozenChanged,allVertexExact,pointsExact:a===b};rows.push(row);if(changed||frozenChanged||allVertexExact===false||a!==b)differences.push(row);
    }
   }
   const scene=new T.Scene(),target=new T.WebGLRenderTarget(1280,720,{depthBuffer:false}),clear=s.renderer.getClearColor(new T.Color()),alpha=s.renderer.getClearAlpha(),previous=s.renderer.getRenderTarget();
   const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   const render=(d,scale=1)=>{const pixels=new Uint8Array(1280*720*4),mesh=new T.Mesh(d.geometry,d.material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);if(scale!==1)mesh.matrix.multiply(new T.Matrix4().makeScale(scale,scale,1));mesh.frustumCulled=false;scene.add(mesh);s.renderer.clear();s.renderer.render(scene,s.camera);s.renderer.readRenderTargetPixels(target,0,0,1280,720,pixels);scene.remove(mesh);return pixels;};
   try{
    s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);
    for(const [actorId,e]of s.actors){const d=e.craftPose?.drawing;if(!d)continue;
     const hero=['mochi','soot','clover','panko'].includes(e.asset),gpuCases=[...['K0','K1','K2','K5','K4'].flatMap((key,i)=>[30,30.6].flatMap(clock=>[false,true].map(reduced=>({key,clip:['idle','attack','attack','ult','hurt'][i],at:[0,.1,.4,1.1,0][i],clock,reduced})))),...(hero?[[-1,1],[1,-1]].map(forced=>({key:'K0',clip:'idle',at:0,clock:30.6,reduced:false,forced})):[])];
     if(previewScales)for(const scale of [.125,.25,.5,1.5])for(const reduced of [false,true])gpuCases.push({key:'K0',clip:'idle',at:.6,clock:30.6,reduced,scale});
     for(const c of gpuCases){const pair=[];
      for(const mode of ['full','cut']){p.select(mode);d.sample(c.clip,c.at,c.reduced,undefined,c.clock);
       if(c.forced){d.secondary.turn=c.forced[0];d.secondary.nod=c.forced[1];d.faceDepth.sample(...c.forced);const a=d.geometry.attributes.position,v=p.variants.find(v=>v.d===d),ids=mode==='cut'&&v.fullTopology?v.ids:Array.from({length:a.count},(_,i)=>i);for(const i of ids){const q=d.point([d.source[i*3]+d.set.manifest.canvas[0]/2,d.set.manifest.canvas[1]/2-d.source[i*3+1]]);a.setXYZ(i,q.x,q.y,.002);}a.needsUpdate=true;}
       e.actor.root.updateMatrixWorld(true);pair.push({bounds:opaqueWorldBounds(e.actor.root),pixels:render(d,c.scale)});
      }
      let changedPixels=0,maxDelta=0;for(let i=0;i<pair[0].pixels.length;i+=4){let changed=false;for(let c=0;c<4;c++){const delta=Math.abs(pair[0].pixels[i+c]-pair[1].pixels[i+c]);changed||=delta>0;maxDelta=Math.max(maxDelta,delta);}changedPixels+=changed;}
      const row={actorId,unit:e.asset,...c,changedPixels,maxDelta,boundsExact:JSON.stringify(pair[0].bounds)===JSON.stringify(pair[1].bounds),fullSha256:await hash(pair[0].pixels),cutSha256:await hash(pair[1].pixels)};gpuRows.push(row);if(changedPixels||!row.boundsExact)differences.push(row);
      if(changedPixels>worst.count){Object.assign(worst,{count:changedPixels,row,images:pair.map(p=>{const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const ctx=canvas.getContext('2d'),image=ctx.createImageData(1280,720);for(let y=0;y<720;y++)image.data.set(p.pixels.subarray((719-y)*1280*4,(720-y)*1280*4),y*1280*4);ctx.putImageData(image,0,0);return canvas.toDataURL('image/png');})});}
     }
    }
   }finally{s.renderer.setRenderTarget(previous);s.renderer.setClearColor(clear,alpha);target.dispose();p.select('full');}
   return{fixture,topology,rows,gpuRows,differences,worst};
  },{fixture,previewScales:report.options.previewScales});
  result.details=details;
  for(const [i,data]of result.worst.images.entries())await writeFile(resolve(out,fixture+'-worst-'+i+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.worst.images;
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  result.timing=await page.evaluate(()=>{
   const p=window.__cxvOuter,cases=[['idle',.6],['attack',.1],['attack',.3],['attack',.35],['attack',.6],['ult',.6],['ult',1.1],['ult',1.8],['hurt',.06],['victory',1]],rows=[];
   const run=(mode,cycles=6)=>{p.select(mode);const start=performance.now();for(let c=0;c<cycles;c++)for(const [clip,at]of cases)for(const {d}of p.variants)d.sample(clip,at,false,undefined,30+c*5+at,.7);return{mode,ms:performance.now()-start,samples:cycles*cases.length*p.variants.length};};
   for(const mode of ['full','cut'])run(mode,3);
   for(let block=0;block<7;block++)for(const mode of block%2?['cut','full']:['full','cut'])rows.push({...run(mode),block});
   return{rows,modes:['full','cut'].map(mode=>({mode,medianMs:rows.filter(r=>r.mode===mode).map(r=>r.ms).sort((a,b)=>a-b)[3],weightBytes:p.variants.reduce((sum,v)=>sum+[...v[mode].weights.values()].reduce((n,w)=>n+w.data.byteLength,0),0),vertices:p.variants.reduce((sum,v)=>sum+v[mode].source.length/3,0)}))};
  });
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await page.evaluate(()=>{window.__cxvOuter.select('cut');const s=window.__depthScene;s.render({...s.view(),frame:null,fixedTime:30.6,paused:true,galleryPreview:true},0);});
  const path=resolve(out,fixture+'.png');await page.screenshot({path});execFileSync('sips',['-Z','1024',path,'--out',resolve(out,fixture+'-review.png')],{stdio:'ignore'});result.capture={path,review:resolve(out,fixture+'-review.png'),utc:new Date().toISOString()};
  await page.evaluate(()=>window.__cxvOuter.restore());report.fixtures.push(result);report.errors.push(...errors);await page.close();
 }
 report.ended=new Date().toISOString();report.pass=!report.errors.length&&report.fixtures.every(f=>!f.differences.length&&f.topology.every(t=>t.uvExact&&t.indicesExact));await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,errors:report.errors,fixtures:report.fixtures.map(f=>({id:f.fixture,motion:f.rows.length,gpu:f.gpuRows.length,differences:f.differences.length,timing:f.timing.modes}))}));assert(report.pass);
}finally{await browser.close();}
