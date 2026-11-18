/** Run the actual adapter against independently tracked source coordinates; no enrollment. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {createServer}=await import(req.resolve('vite')),T=req('three');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceReviewPath=resolve(root,'reports/v5/CXI/evidence/v8-clover-spout-source-review.json');
const review=JSON.parse(await readFile(sourceReviewPath));
const payloadBytes=await readFile(review.payload),payload=JSON.parse(payloadBytes);
assert.equal(sha(payloadBytes),review.payloadSha256);
const sourceBytes=await readFile(payload.sourceReport.path),source=JSON.parse(sourceBytes);
assert.equal(sha(sourceBytes),payload.sourceReport.sha256);
const rawBytes=await readFile(source.raw.path),raw=JSON.parse(rawBytes);assert.equal(sha(rawBytes),source.raw.sha256);
const registryPath=resolve(app,'src/game/cardrpg/spine/designer-idle-registry.json'),registry=await readFile(registryPath);assert.deepEqual(JSON.parse(registry),{});
const manifest={version:1,id:'clover',format:'h264-rgb-mask',video:'/units/clover/designer-idle-ab.mp4',poster:'/units/clover/designer-idle-cd.webp',width:318,height:390,opaqueHeight:384,foot:payload.foot.xy,duration:10,fps:30,frames:300,sourceSha256:payload.sourceVideo.sha256,videoSha256:'b'.repeat(64),posterSha256:'c'.repeat(64),videoBytes:1000,faceROI:[135,60,90,90],
 sockets:{root:payload.foot.xy,hip:[160,230],head:[180,100],'hp-anchor':[180,-35],'main-hand':[250,170],'off-hand':[150,180],...payload.partialManifest.sockets},
 socketTracks:{...payload.partialManifest.socketTracks,prop:Array.from({length:300},()=>[11,-13]),lantern:Array.from({length:300},()=>[-17,19])},socketChannels:{'main-hand':'prop',...payload.partialManifest.socketChannels}};
const server=await createServer({root:app,configFile:false,server:{middlewareMode:true,fs:{allow:[root]}},resolve:{dedupe:['three']},logLevel:'error'});
const report={utc:new Date().toISOString(),payload:review.payload,payloadSha256:review.payloadSha256,sourceReviewSha256:sha(await readFile(sourceReviewPath)),registrySha256:sha(registry),cases:0,maxWorldError:0,pass:false,imagesViewed:0,limits:'Actual adapter coordinate arithmetic only. Dummy media and provisional remaining sockets; no media loaded or registry enrollment. Source annotation and decoded scene/cast/loop/budget gates remain separate.'};
let geometry;
try{
 const {DesignerIdleActorMedia}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/designer-idle-actor-loader.ts'));
 const {validateDesignerIdle}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/designer-idle-loader.ts'));
 const {SPINE_CONFIG}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/config.ts'));
 validateDesignerIdle(manifest,'clover');geometry=new T.PlaneGeometry(512,512,2,2);
 const media={manifest,geometry,basePositions:new Float32Array(geometry.attributes.position.array),video:{currentTime:0},sample(){},failure:undefined};
 const adapter=new DesignerIdleActorMedia(media),actor={unit:{id:'clover'},sockets:new Map(Object.keys(SPINE_CONFIG.sockets).map(k=>[k,new T.Object3D()]))};
 const clock={worldTime:55,paused:false,fixedTime:false,frozen:false};
 for(let frame=0;frame<300;frame++)for(const fraction of [0,.125,.25,.5,.875]){
  media.video.currentTime=(frame+fraction)/30;adapter.sample(actor,'idle',0,10,false,clock);
  const a=raw.forwardPoints[frame][0],b=raw.forwardPoints[(frame+1)%300][0];
  const sourcePoint=a.map((value,i)=>value+(b[i]-value)*fraction);
  const delivery=[(sourcePoint[0]+.5)*421/526*318/409-.5,((sourcePoint[1]+.5)*512/640-2)*390/500-.5];
  const expected=[(delivery[0]-manifest.foot[0])*512/384,(manifest.foot[1]-delivery[1])*512/384];
  const actual=actor.sockets.get('vfxOrigin').position,error=Math.max(Math.abs(actual.x-expected[0]),Math.abs(actual.y-expected[1]));
  assert(error<2e-6,`Spout conversion at ${frame+fraction}: ${error}`);report.maxWorldError=Math.max(report.maxWorldError,error);report.cases++;
  assert.deepEqual(actor.sockets.get('feet').position.toArray(),[0,0,1]);
  const held=actor.sockets.get('mainHand').position.toArray(),heldExpected=[(261-manifest.foot[0])*512/384,(manifest.foot[1]-157)*512/384,1];
  assert(held.every((value,i)=>Math.abs(value-heldExpected[i])<1e-10),'Spout must not move held prop');
 }
 assert.equal(sha(await readFile(registryPath)),report.registrySha256);report.pass=true;
}finally{geometry?.dispose();await server.close();await writeFile(resolve(root,'reports/v5/CXI/evidence/v8-clover-spout-adapter-review.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
