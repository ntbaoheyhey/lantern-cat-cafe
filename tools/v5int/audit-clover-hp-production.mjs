/** Independently reproduce local socket and DOM-label arithmetic from raw native rows. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {createServer}=await import(req.resolve('vite')),sha=x=>createHash('sha256').update(x).digest('hex');
const path='/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/clover-hp-q21-r2/own-native-r1/report.json';
const bytes=await readFile(path),raw=JSON.parse(bytes),verified=[];
async function verify(p,expected){const b=await readFile(p);assert.equal(sha(b),expected,p);verified.push({path:p,sha256:expected});return b;}
const build=JSON.parse(await verify(raw.build.path,raw.build.sha256));
assert.equal(raw.sourceCommit,build.sourceCommit);assert.equal(raw.indexSha256,build.indexSha256);
await verify(raw.preregistration.path,raw.preregistration.sha256);
await verify('/Users/bao/taskbar-hero-chain/tools/v5int/probe-clover-hp-production.mjs',raw.harnessSha256);
for(const f of build.runtimeSources)await verify(f.path,f.sha256);
for(const f of raw.captures)await verify(f.path,f.sha256);
const file=build.files.find(f=>f.url===build.registryOverride.clover),manifest=JSON.parse(await verify(file.path,file.sha256));
const server=await createServer({root:app,configFile:false,server:{middlewareMode:true},logLevel:'error'});
const report={utc:new Date().toISOString(),raw:{path,sha256:sha(bytes)},sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,
 verified,rows:raw.rows.length,glints:0,maxLocalSpoutError:0,maxLocalHpError:0,maxEmissionError:0,maxGlintPlacementError:0,
 hpBodyOverlapMax:0,hpOtherLabelOverlapMax:0,minLabelBodyGap:Infinity,maxLabelCenterOffset:0,hpSpoutOverlaps:[],hpFaceOverlapMax:0,minHpPointGap:Infinity,callbackAgeExceptions:[],paintLightRows:0,imagesViewed:0};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
try{
 const {sampleLivingCatCast,livingCatCastOffset,LIVING_CAT_SKILL_SECONDS}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/living-cat-cast.ts'));
 const {designerPhase}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/designer-idle-loader.ts'));
 for(const row of raw.rows){
  if(row.manifest)assert.deepEqual(row.manifest,manifest);
  assert(row.media.ready&&!row.media.seeking&&row.minTriangleRatio>0);
  const name=row.sampled.name,duration=name==='attack'?.8:name==='ult'?2.2:name==='skill'?LIVING_CAT_SKILL_SECONDS:10;
  const pose={lean:0,lift:0,tilt:0,follow:0};sampleLivingCatCast('clover',name,Math.max(0,Math.min(duration,row.sampled.at))/duration,row.reduced,pose);
  const frame=row.reduced?0:designerPhase(row.media.currentTime)*30,scale=512/manifest.opaqueHeight;
  for(const [socket,actual,key]of [['vfx-origin',row.localSpout,'maxLocalSpoutError'],['hp-anchor',row.localHp,'maxLocalHpError']]){
   let [x,y]=manifest.sockets[socket];const channel=manifest.socketChannels[socket],track=channel&&manifest.socketTracks[channel];
   if(track){const i=Math.floor(frame),t=frame-i;[x,y]=[x+track[i][0]+(track[(i+1)%300][0]-track[i][0])*t,y+track[i][1]+(track[(i+1)%300][1]-track[i][1])*t];}
   const px=(x-manifest.foot[0])*scale,py=(manifest.foot[1]-y)*scale,offset={x:0,y:0};livingCatCastOffset(px,py,512,pose,offset);
   const error=distance([px+offset.x,py+offset.y],actual);report[key]=Math.max(report[key],error);assert(error<1e-7,`${socket} ${error}`);
  }
  if(row.phase==='action'&&row.glint?.visible){
   const expected=[row.spout.x,row.spout.y],emission=distance(expected,[row.renderedSource.x,row.renderedSource.y]),glint=distance(expected,row.glint.position);
   assert(emission<1e-7&&glint<1e-7);assert.equal(emission,row.emissionError);assert.equal(glint,row.glintPlacementError);
   report.glints++;report.maxEmissionError=Math.max(report.maxEmissionError,emission);report.maxGlintPlacementError=Math.max(report.maxGlintPlacementError,glint);
  }
  const l=row.label,p=row.spout,inside=p.x>=l.x&&p.x<=l.x+l.width&&p.y>=l.y&&p.y<=l.y+l.height;
  assert.equal(inside,row.labelMetrics.spoutInside);assert(Math.abs(l.x+l.width/2-row.head.x-row.labelMetrics.centerOffsetFromHead)<1e-8);
  const f=row.anchor.face,overlap=Math.max(0,Math.min(l.x+l.width,f.x+f.width)-Math.max(l.x,f.x))*Math.max(0,Math.min(l.y+l.height,f.y+f.height)-Math.max(l.y,f.y));
  assert(Math.abs(overlap-row.labelMetrics.faceOverlapArea)<1e-7);report.hpFaceOverlapMax=Math.max(report.hpFaceOverlapMax,overlap);
  if(inside)report.hpSpoutOverlaps.push({phase:row.phase,ms:row.ms,sourceFrame:row.sourceFrame,skill:row.skill,reduced:row.reduced});
  assert(row.anchor.labelTarget);assert.equal(row.hpObstacles.allBodyOverlapArea,0);assert.equal(row.hpObstacles.otherLabelOverlapArea,0);
  const body=row.body,bodyOverlap=Math.max(0,Math.min(l.x+l.width,body.x+body.width)-Math.max(l.x,body.x))*Math.max(0,Math.min(l.y+l.height,body.y+body.height)-Math.max(l.y,body.y));
  assert.equal(bodyOverlap,row.labelMetrics.bodyOverlapArea);assert.equal(bodyOverlap,0);report.hpBodyOverlapMax=Math.max(report.hpBodyOverlapMax,bodyOverlap);
  report.hpOtherLabelOverlapMax=Math.max(report.hpOtherLabelOverlapMax,row.hpObstacles.otherLabelOverlapArea);
  const gap=body.y-l.y-l.height;assert(Math.abs(gap-row.labelMetrics.gapAboveBody)<1e-7);report.minLabelBodyGap=Math.min(report.minLabelBodyGap,gap);
  report.maxLabelCenterOffset=Math.max(report.maxLabelCenterOffset,Math.abs(l.x+l.width/2-row.hp.x));
  report.minHpPointGap=Math.min(report.minHpPointGap,row.hpScreenGapAboveFullPlane);
  if(row.paintLightPresent)report.paintLightRows++;
  if(row.decoded){const gap=Math.abs(((row.media.currentTime-row.decoded.mediaTime+15)%10)-5);if(gap>1/30+1e-5)report.callbackAgeExceptions.push({phase:row.phase,ms:row.ms,reduced:row.reduced,currentTime:row.media.currentTime,callbackMediaTime:row.decoded.mediaTime,gapSeconds:gap});}
 }
}finally{await server.close();}
assert.equal(report.glints,10);assert.equal(raw.runtimeSourceSubstitutions.length,0);assert.deepEqual(raw.errors,[]);assert.deepEqual(raw.blockedRequests,[]);
assert.equal(report.hpSpoutOverlaps.length,0);assert.equal(report.hpFaceOverlapMax,0);assert.equal(report.callbackAgeExceptions.length,0);
report.decision='ACCEPT scoped socket/glint arithmetic, actual HP clearance and bounded callback alignment. No full art/loop/release acceptance.';
const ledger=JSON.parse(await readFile(resolve(root,'work/v5/CXI/batch-m/clover-hp-q21-r2/own-native-r1/view-ledger.json')));for(const v of ledger.views){await verify(v.path,v.sha256);assert(v.viewed);assert(v.width<=1024&&v.height<=1024);}report.imagesViewed=ledger.views.length;report.viewLedger=ledger;
report.limits='56 owned current-build rows and10capture hashes;2fresh1024px views once. Idle callbacks exact; action callback <=1/30s from continuous socket phase. PaintLight absent and unexercised. Original-art/loop, byte, performance and journey gates remain open.';
await writeFile(resolve(root,'reports/v5/CXI/evidence/v8-clover-hp-r2-native-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({rows:report.rows,glints:report.glints,maxLocalSpoutError:report.maxLocalSpoutError,maxLocalHpError:report.maxLocalHpError,hpSpoutOverlaps:report.hpSpoutOverlaps.length,minHpPointGap:report.minHpPointGap,callbackAgeExceptions:report.callbackAgeExceptions,paintLightRows:report.paintLightRows}));
