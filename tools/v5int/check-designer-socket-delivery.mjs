/** Validate CXV pixel payload through CXI's actual adapter; never enroll candidate media. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {createServer}=await import(req.resolve('vite')),T=req('three');
const sha=x=>createHash('sha256').update(x).digest('hex');
const cat=process.argv[2]??'mochi';assert(['mochi','clover'].includes(cat));
const payloadPath=`/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-${cat}-socket-delivery-${cat==='mochi'?'R3':'R1'}.json`;
const bytes=await readFile(payloadPath),payload=JSON.parse(bytes),sourceBytes=await readFile(payload.sourceReport),source=JSON.parse(sourceBytes);
assert.equal(sha(sourceBytes),payload.sourceReportSha256);assert.equal(payload.sourceSha256,source.sourceSha256);
const receipt=JSON.parse(await readFile(resolve(root,'reports/v5/CXI/evidence/v8-m-mochi-candidate.json')));
let original=JSON.parse(await readFile(receipt.files.find(f=>f.path.endsWith('.json')).path));
if(cat==='clover'){
 const packetBytes=await readFile(payload.coordinateContract);assert.equal(sha(packetBytes),payload.coordinateContractSha256);
 const packet=JSON.parse(packetBytes),sockets=Object.fromEntries(Object.entries(packet.provisionalSockets).map(([k,v])=>[k,v.xy]));
 original={...original,id:cat,width:318,height:390,foot:packet.foot.xy,opaqueBounds:[0,0,318,390],faceROI:[135,60,90,90],sourceSha256:payload.sourceSha256,video:'/units/clover/designer-idle-ab.mp4',poster:'/units/clover/designer-idle-cd.webp',sockets:{...sockets,root:packet.foot.xy,'hp-anchor':[182,-35]}};
}
assert.deepEqual([original.width,original.height],payload.deliverySize);assert.equal(original.opaqueHeight,payload.opaqueHeight);
const manifest={...original,sockets:{...original.sockets,...payload.partialManifest.sockets},socketTracks:payload.partialManifest.socketTracks,socketChannels:payload.partialManifest.socketChannels};
assert.deepEqual(manifest.socketChannels,cat==='mochi'?{hip:'hip','main-hand':'shieldWrist','vfx-origin':'lantern'}:{hip:'hip','main-hand':'prop'});
const registry=await readFile(resolve(app,'src/game/cardrpg/spine/designer-idle-registry.json'));assert.deepEqual(JSON.parse(registry),{});
const server=await createServer({root:app,configFile:false,server:{middlewareMode:true,fs:{allow:[root]}},resolve:{dedupe:['three']},logLevel:'error'});
const report={utc:new Date().toISOString(),cat,payloadPath,payloadSha256:sha(bytes),sourceReportSha256:sha(sourceBytes),registrySha256:sha(registry),units:payload.units,cases:0,maxWorldError:0,channels:[],pass:false,limits:'Adapter arithmetic acceptance only. Source tracking, visual placement and failed media remain unaccepted. Clover scaffolding uses provisional geometry, not a delivery manifest.'};
let geometry;
try{
 const {DesignerIdleActorMedia}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/designer-idle-actor-loader.ts'));
 const {validateDesignerIdle}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/designer-idle-loader.ts'));
 const {SPINE_CONFIG}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/config.ts'));
 validateDesignerIdle(manifest,cat);geometry=new T.PlaneGeometry(512,512,2,2);
 const media={manifest,geometry,basePositions:new Float32Array(geometry.attributes.position.array),video:{currentTime:0},sample(){},failure:undefined};
 const adapter=new DesignerIdleActorMedia(media),actor={unit:{id:cat},sockets:new Map(Object.keys(SPINE_CONFIG.sockets).map(k=>[k,new T.Object3D()]))};
 const channels=cat==='mochi'?[['hip','hip','chest'],['shieldWrist','mainHand','mainHand'],['lantern','vfxOrigin','vfxOrigin']]:[['hip','hip','chest'],['prop','mainHand','mainHand']];
 const clock={worldTime:0,paused:false,fixedTime:false,frozen:false},scale=512/manifest.opaqueHeight;
 for(let f=0;f<300;f++)for(const sub of [0,.125,.25,.5,.875]){
  media.video.currentTime=(f+sub)/30;adapter.sample(actor,'idle',0,10,false,clock);
  for(const [channel,key,socket]of channels){
   const ref=source.sockets[key],a=ref.worldOffsets[f],b=ref.worldOffsets[(f+1)%300],base=ref.initialDeliveryPoint;
   const expected=[(base[0]-manifest.foot[0])*scale+a[0]+(b[0]-a[0])*sub,(manifest.foot[1]-base[1])*scale+a[1]+(b[1]-a[1])*sub];
   const actual=actor.sockets.get(socket).position;const error=Math.max(Math.abs(actual.x-expected[0]),Math.abs(actual.y-expected[1]));
   report.maxWorldError=Math.max(report.maxWorldError,error);report.cases++;assert(error<1e-6,`${channel}@${f+sub}: ${error}`);
  }
  assert.deepEqual(actor.sockets.get('feet').position.toArray(),[0,0,1]);
  if(cat==='clover')assert.deepEqual(actor.sockets.get('vfxOrigin').position.toArray(),[(280-manifest.foot[0])*scale,(manifest.foot[1]-155)*scale,1]);
 }
 report.channels=channels.map(([channel,key])=>({channel,reference:key,samples:manifest.socketTracks[channel].length}));report.pass=true;
}finally{geometry?.dispose();await server.close();await writeFile(resolve(root,`reports/v5/CXI/evidence/v8-m-${cat==='mochi'?'socket-channel':'clover-socket'}-adapter.json`),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
