/** Actual adapter at212x260 against frozen source curves; no media enrollment or image review. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {createServer}=await import(req.resolve('vite')),T=req('three');
const sha=b=>createHash('sha256').update(b).digest('hex'),refs=[];
async function json(path,expected){const bytes=await readFile(path);if(expected)assert.equal(sha(bytes),expected);refs.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
const review=await json(resolve(root,'reports/v5/CXI/evidence/v8-clover-authored-bindings-review.json'));
const prior=await json(resolve(root,'work/v5/CXI/batch-m/clover-atlas-q21-r3/build.json'));
const old=prior.files.find(f=>f.url===prior.registryOverride.clover);assert(old);
const manifest=await json(old.path,old.sha256),ratio=2/3;
assert.deepEqual([manifest.width,manifest.height,manifest.opaqueHeight],[212,260,256]);
const channels=[];
for(const [file,channel,socket,actorSocket]of [['M-clover-eye-delivery-R5.json','head','head','head'],['M-clover-paw-delivery-R6.json','freePaw','off-hand','offHand']]){
 const path='/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/'+file;
 assert(review.artifactHashes[path]);const payload=await json(path,review.artifactHashes[path]);
 const source=await json(payload.sourceReport.path,payload.sourceReport.sha256);
 const rawRef=channel==='head'?source.raw:source.model.raw,raw=await json(rawRef.path,rawRef.sha256);
 const points=channel==='head'?raw.centers:raw[source.model.field].centers;
 manifest.sockets[socket]=payload.partialManifest.sockets[socket].map(v=>v*ratio);
 manifest.socketTracks[channel]=payload.partialManifest.socketTracks[channel].map(p=>p.map(v=>v*ratio));
 manifest.socketChannels[socket]=channel;
 channels.push({channel,socket,actorSocket,points,foot:payload.foot.xy});
}
const registryPath=resolve(app,'src/game/cardrpg/spine/designer-idle-registry.json'),registry=await readFile(registryPath);assert.deepEqual(JSON.parse(registry),{});
const files=['designer-idle-loader.ts','designer-idle-actor-loader.ts'].map(file=>resolve(app,'src/game/cardrpg/spine',file));
const runtime=await Promise.all(files.map(async path=>({path,sha256:sha(await readFile(path))})));
const server=await createServer({root:app,configFile:false,envFile:false,server:{middlewareMode:true,fs:{allow:[root]}},resolve:{dedupe:['three']},logLevel:'error'});
const report={utc:new Date().toISOString(),refs,runtime,deliverySize:[212,260],coordinateConvention:'Scale both position,offset,foot and opaqueHeight by2/3;compare unchanged foot-relative world coordinates with source-derived318x390 positions. Native decoded alignment separate.',
 idleChecks:0,castMeshChecks:0,isolationChecks:0,maxWorldError:0,maxCastMeshError:0,fallbackChecks:0,imagesViewed:0,pass:false};
let geometry;
function expected(c,time){
 const phase=((time%10)+10)%10*30,i=Math.floor(phase),f=phase-i,a=c.points[i],b=c.points[(i+1)%300];
 const point=a.map((v,axis)=>v+(b[axis]-v)*f);
 const delivery=[(point[0]+.5)*421/526*318/409-.5,((point[1]+.5)*512/640-2)*390/500-.5];
 return[(delivery[0]-c.foot[0])*512/384,(c.foot[1]-delivery[1])*512/384];
}
try{
 const {DesignerIdleActorMedia}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/designer-idle-actor-loader.ts'));
 const {validateDesignerIdle}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/designer-idle-loader.ts'));
 const {SPINE_CONFIG}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/config.ts'));
 validateDesignerIdle(manifest,'clover');geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(9),3));
 const media={manifest,geometry,basePositions:new Float32Array(9),video:{currentTime:0},sample(){},failure:undefined};
 const adapter=new DesignerIdleActorMedia(media),actor={unit:{id:'clover'},sockets:new Map(Object.keys(SPINE_CONFIG.sockets).map(k=>[k,new T.Object3D()]))};
 const clock={worldTime:55,paused:false,fixedTime:false,frozen:false};
 for(let frame=0;frame<300;frame++)for(const fraction of [0,.125,.5,.875]){
  media.video.currentTime=(frame+fraction)/30;adapter.sample(actor,'idle',0,10,false,clock);
  for(const c of channels){
   const want=expected(c,media.video.currentTime),p=actor.sockets.get(c.actorSocket).position;
   const error=Math.max(Math.abs(p.x-want[0]),Math.abs(p.y-want[1]));assert(error<2e-6);report.maxWorldError=Math.max(report.maxWorldError,error);report.idleChecks++;
  }
  assert.deepEqual(actor.sockets.get('feet').position.toArray(),[0,0,1]);
  if(fraction!==.5)continue;
  const snapshots=new Map([...actor.sockets].map(([key,obj])=>[key,obj.position.toArray()])),face={...actor.faceRegion},oldPoint=manifest.socketTracks.freePaw[frame];
  manifest.socketTracks.freePaw[frame]=[oldPoint[0]+13,oldPoint[1]-11];adapter.sample(actor,'idle',0,10,false,clock);
  for(const [key,obj]of actor.sockets)if(key!=='offHand')assert.deepEqual(obj.position.toArray(),snapshots.get(key));
  assert.deepEqual(actor.faceRegion,face);assert.notDeepEqual(actor.sockets.get('offHand').position.toArray(),snapshots.get('offHand'));
  manifest.socketTracks.freePaw[frame]=oldPoint;report.isolationChecks++;
  media.basePositions.set([0,0,0,...snapshots.get('head').slice(0,2),0,...snapshots.get('offHand').slice(0,2),0]);
  for(const name of ['skill','ult'])for(const time of [.14,.25,.31,.55,.84,1]){
   adapter.sample(actor,name,time,1,false,clock);
   for(const [i,c]of channels.entries()){
    const p=actor.sockets.get(c.actorSocket).position,attr=geometry.attributes.position;
    const error=Math.max(Math.abs(p.x-attr.getX(i+1)),Math.abs(p.y-attr.getY(i+1)));assert(error<6e-5);report.maxCastMeshError=Math.max(report.maxCastMeshError,error);report.castMeshChecks++;
   }
   assert.deepEqual(actor.sockets.get('feet').position.toArray(),[0,0,1]);
  }
 }
 for(const [time,reduced,failure]of [[10,false,undefined],[20,false,undefined],[-.01,false,undefined],[6.7,true,undefined],[7.4,false,'decode']]){
  media.video.currentTime=time;media.failure=failure;adapter.sample(actor,'idle',0,10,reduced,clock);
  for(const c of channels){const want=expected(c,reduced||failure?0:time),p=actor.sockets.get(c.actorSocket).position;assert(Math.max(Math.abs(p.x-want[0]),Math.abs(p.y-want[1]))<2e-6);report.fallbackChecks++;}
 }
 for(const f of runtime)assert.equal(sha(await readFile(f.path)),f.sha256);
 assert.equal(sha(await readFile(registryPath)),sha(registry));report.pass=true;
}finally{geometry?.dispose();await server.close();}
const out=resolve(root,'reports/v5/CXI/evidence/v8-clover-authored-adapter-review.json');
await writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({out,pass:report.pass,idleChecks:report.idleChecks,castMeshChecks:report.castMeshChecks,isolationChecks:report.isolationChecks,fallbackChecks:report.fallbackChecks,maxWorldError:report.maxWorldError,maxCastMeshError:report.maxCastMeshError}));
