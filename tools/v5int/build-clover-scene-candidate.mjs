/** Ignored Clover spout study, retaining the exact Mochi R6 media payload. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web');
const req=createRequire(resolve(app,'package.json')),sharp=req('sharp');
const {build,createServer}=await import(req.resolve('vite'));
const sha=data=>createHash('sha256').update(data).digest('hex');
const label=process.argv[2]??'clover-spout-q21-r1';assert(/^[a-z0-9-]+$/.test(label));
const out=resolve(root,'work/v5/CXI/batch-m',label),dist=resolve(out,'dist');
const evidence=[];
async function pinned(path,expected){
 const bytes=await readFile(path),hash=sha(bytes);if(expected)assert.equal(hash,expected,path);
 evidence.push({path,sha256:hash,bytes:bytes.length});return bytes;
}
async function json(path,expected){return JSON.parse(await pinned(path,expected));}
const nativeReview=await json(resolve(root,'reports/v5/CXI/evidence/v8-clover-q21-native-review.json'));
const native=await json(nativeReview.raw.path,nativeReview.raw.sha256);
assert(native.runs.length===2&&native.runs.every(r=>r.numericPass&&r.samples.length===300&&r.loopWrapped));
const offline=await json(resolve(root,'work/v5/CXI/batch-m/clover-four-plane-q21-r1/report.json'));
const trial=offline.trials.find(t=>t.mode==='ycrcb');assert(trial.numericPass);
const video=await pinned(trial.video,trial.sha256);assert.equal(sha(video),native.video.sha256);
assert(video.length<=1000000);assert.deepEqual(offline.logicalSize,[212,260]);
const source=await pinned(offline.sourceRgba,offline.sourceRgbaSha256);
assert.equal(sha(source),native.sourceRgbaSha256);
const w=212,h=260,ratio=2/3,scaled=xy=>xy.map(v=>v*ratio);
assert.equal(source.length,300*w*h*4);
const base=await json(resolve(root,'reports/v5/CXI/evidence/v8-m-clover-provisional-sockets.json'));
const hip=await json('/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-clover-socket-delivery-R1.json');
await pinned(hip.sourceReport,hip.sourceReportSha256);
await pinned(hip.coordinateContract,hip.coordinateContractSha256);
const adapter=await json(resolve(root,'reports/v5/CXI/evidence/v8-clover-spout-adapter-review.json'));assert(adapter.pass);
const spout=await json(adapter.payload,adapter.payloadSha256);
await pinned(spout.sourceReport.path,spout.sourceReport.sha256);
await pinned(spout.matteSource.path,spout.matteSource.sha256);
assert.equal(spout.matteSource.sha256,offline.originalMatte.sha256);
assert.deepEqual(spout.deliverySize,[318,390]);assert.equal(spout.opaqueHeight,384);
assert.equal(base.sourceSha256,spout.sourceVideo.sha256);assert.equal(hip.sourceSha256,base.sourceSha256);
assert.deepEqual(hip.foot.xy,base.foot.xy);assert.deepEqual(spout.foot.xy,base.foot.xy);
const foot=scaled(base.foot.xy),rgba=Buffer.from(source.subarray(0,w*h*4));
for(let p=0;p<rgba.length;p+=4)for(let c=0;c<3;c++)rgba[p+c]=rgba[p+3]?Math.min(255,Math.round(rgba[p+c]*255/rgba[p+3])):0;
const poster=await sharp(rgba,{raw:{width:w,height:h,channels:4}}).webp({lossless:true}).toBuffer();
const decoded=await sharp(poster).ensureAlpha().raw().toBuffer();
for(let p=3;p<rgba.length;p+=4)assert.equal(decoded[p],rgba[p],'Poster alpha must be exact');
let left=w,top=h,right=0,bottom=0;
for(let p=3;p<source.length;p+=4)if(source[p]>=16){const i=((p-3)/4)%(w*h),x=i%w,y=Math.floor(i/w);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
const sockets=Object.fromEntries(Object.entries(base.provisionalSockets).map(([k,v])=>[k,scaled(v.xy)]));
Object.assign(sockets,{root:foot,'hp-anchor':[foot[0],foot[1]-1.12*256]});
const socketTracks={},socketChannels={};
for(const partial of [hip.partialManifest,spout.partialManifest]){
 Object.assign(sockets,Object.fromEntries(Object.entries(partial.sockets).map(([k,v])=>[k,scaled(v)])));
 Object.assign(socketTracks,Object.fromEntries(Object.entries(partial.socketTracks).map(([k,v])=>[k,v.map(scaled)])));
 Object.assign(socketChannels,partial.socketChannels);
}
assert.deepEqual(socketChannels,{hip:'hip','main-hand':'prop','vfx-origin':'spout'});
const manifest={version:1,id:'clover',format:'h264-ycrcb-alpha-four-plane',
 video:`/units/clover/designer-idle-${sha(video).slice(0,16)}.mp4`,poster:`/units/clover/designer-idle-${sha(poster).slice(0,16)}.webp`,
 width:w,height:h,opaqueHeight:256,foot,opaqueBounds:[left,top,right,bottom],faceROI:scaled([135,60,90,90]),
 duration:10,fps:30,frames:300,sourceSha256:base.sourceSha256,videoSha256:sha(video),posterSha256:sha(poster),videoBytes:video.length,sockets,socketTracks,socketChannels};
const ssr=await createServer({root:app,configFile:false,server:{middlewareMode:true},logLevel:'error'});
try{const {validateDesignerIdle}=await ssr.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/designer-idle-loader.ts'));validateDesignerIdle(manifest,'clover');}finally{await ssr.close();}
const manifestBytes=Buffer.from(JSON.stringify(manifest)+'\n'),manifestPath=`/units/clover/designer-idle-${sha(manifestBytes).slice(0,16)}.json`;
const prior=await json(resolve(root,'work/v5/CXI/batch-m/mochi-scene-q22-r6/build.json'));
const payloads=[[manifestPath,manifestBytes],[manifest.video,video],[manifest.poster,poster]];
for(const f of prior.files){assert(f.url.startsWith('/units/mochi/'));payloads.push([f.url,await pinned(f.path,f.sha256)]);}
const registryOverride={...prior.registryOverride,clover:manifestPath};
const registryPath=resolve(app,'src/game/cardrpg/spine/designer-idle-registry.json'),registryBefore=await readFile(registryPath);
assert.deepEqual(JSON.parse(registryBefore),{});
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['diff','HEAD','--','apps/web','packages/game-rules'],{cwd:root,encoding:'utf8'}),'','Commit application source first');
const runtimeSources=[];
for(const rel of ['apps/web/src/game/cardrpg/spine/designer-idle-loader.ts','apps/web/src/game/cardrpg/spine/designer-idle-actor-loader.ts','apps/web/src/game/cardrpg/spine/assets.ts','apps/web/src/game/cardrpg/spine/scene.ts','apps/web/src/game/rig/living-cast.ts']){
 const path=resolve(root,rel);runtimeSources.push({path,sha256:sha(await readFile(path))});
}
await mkdir(out);let injected=0;
await build({root:app,configFile:resolve(app,'vite.config.ts'),envFile:false,plugins:[{name:'explicit-clover-spout-study',enforce:'pre',load(id){if(id.split('?')[0]===registryPath){injected++;return JSON.stringify(registryOverride);}}}],build:{outDir:dist,emptyOutDir:false}});
assert(injected>0);assert.equal(sha(await readFile(registryPath)),sha(registryBefore));
const files=[];
for(const [url,data] of payloads){const path=resolve(dist,url.slice(1));await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,data);files.push({url,path,bytes:data.length,sha256:sha(data)});}
const report={utc:new Date().toISOString(),sourceCommit,sourceKind:'Committed application source plus explicit ignored Mochi+Clover study registry override',
 toolSha256:sha(await readFile(import.meta.filename)),dist,indexSha256:sha(await readFile(resolve(dist,'index.html'))),registryOverride,
 productionRegistrySha256:sha(registryBefore),productionRegistryChanged:false,runtimeSources,evidence,files,
 clover:{scale:ratio,logicalSize:[w,h],opaqueHeight:256,foot,opaqueBounds:manifest.opaqueBounds,faceROI:manifest.faceROI,sockets,socketChannels,
  provisional:['head','off-hand','faceROI','hp-anchor native centering/readability'],hpFormula:'[footX,footY-1.12*opaqueHeight]; no track',
  opaqueBoundsBasis:'Union of all300 resized source masks at alpha>=16; right/bottom exclusive',
  unresolved:['original matte/fringe/halo','tail loop seam','anatomy','decoded scene/cast','cold bytes','performance']},
 priorMochiBuildSha256:sha(await readFile(resolve(root,'work/v5/CXI/batch-m/mochi-scene-q22-r6/build.json'))),
 productionInstalled:false,accepted:false,imagesViewed:0};
await writeFile(resolve(out,'build.json'),JSON.stringify(report,null,2)+'\n');
await writeFile(resolve(root,`reports/v5/CXI/evidence/v8-${label}-build.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({dist,sourceCommit,indexSha256:report.indexSha256,registryOverride,cloverBytes:files.filter(f=>f.url.startsWith('/units/clover/')).reduce((s,f)=>s+f.bytes,0)}));
