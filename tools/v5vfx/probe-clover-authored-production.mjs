/** Native R5 head and R6 paw bindings against frozen independent source-coordinate curves. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './media-production-fixture.mjs';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';

const root=resolve(import.meta.dirname,'../..'),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.env.CXV_MEDIA_CAT,'clover');
const buildPath=process.env.CXV_MEDIA_BUILD,build=JSON.parse(await readFile(buildPath));
const out=resolve(process.env.CXV_CAPTURE_OUT??'');assert(out.startsWith(resolve(root,'work/v5/CXV')+'/')&&!existsSync(out));
await mkdir(out,{recursive:true});
const preregPath=resolve(root,'work/v5/CXV/batch-m/clover-authored-native-R1-preregistration.json');
const prereg=JSON.parse(await readFile(preregPath));
for(const input of prereg.inputs)assert.equal(sha(await readFile(input.path)),input.sha256);
const runtimeFiles=[];for(const source of build.runtimeSources??[])runtimeFiles.push({path:source.path,sha256:sha(await readFile(source.path))});
for(const source of build.runtimeSources??[])assert.equal(sha(await readFile(source.path)),source.sha256);
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,
  build:{path:buildPath,sha256:sha(await readFile(buildPath))},runtimePatch:build.registryOverride,preregistration:{path:preregPath,sha256:sha(await readFile(preregPath))},
  harnessSha256:sha(await readFile(import.meta.filename)),fixtureSha256:sha(await readFile(resolve(root,'tools/v5vfx/media-production-fixture.mjs'))),
  runtimeSourceSubstitutions:[],runtimeFiles,requireHPClearance:process.env.CXV_REQUIRE_HP_CLEARANCE==='1',rows:[],actions:[],captures:[],errors:[],blockedRequests:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);};
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
let browser;
function fixture(reduced,skill){
 const roster=['clover','panko','mallow','sorrel'],state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),template=state.account.cards[0];
 state.account.cards=roster.map(cardId=>({...template,id:cardId,cardId,level:6}));state.team=roster;state.tutorial=4;
 state.rows=Object.fromEntries(roster.map((x,i)=>[x,i<2?'front':'rear']));state.skills=Object.fromEntries(roster.map(x=>[x,R.CAT_BY_ID[x].skills.map(z=>z.id)]));
 Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:reduced});
 const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
 for(const actor of battle.actors)actor.hp=Math.round(actor.maxHp*.65);
 const caster=battle.actors.find(x=>x.catalogId==='clover');caster.charge=100;caster.turns=3;battle.queue=[caster.id,...battle.queue.filter(x=>x!==caster.id)];battle.v4.committed=true;
 const choice=R.legalChoices(battle).find(x=>x.skillId==='clover-'+skill);assert(choice);const expected=structuredClone(battle);assert(R.act(expected,choice));return{state,battle,choice,expected};
}
async function observe(page,fixedTime,metadata){
 await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);},fixedTime);
 await page.waitForFunction(()=>{const media=[...window.__depthScene.actors.values()].find(e=>e.asset==='clover').actor.designerMedia.media.state;return media.ready&&!media.seeking&&Math.abs(((media.currentTime-media.desired+15)%10)-5)<=1/60;},null,{timeout:10000});
 await page.waitForFunction(metadata=>{
  const media=[...window.__depthScene.actors.values()].find(e=>e.asset==='clover').actor.designerMedia.media.state,decoded=window.__cxvMediaAudit?.decoded.at(-1);
  if(!decoded)return false;
  const expected=metadata.reduced?0:metadata.phase==='idle'?metadata.sourceFrame/30:media.desired;
  return Math.abs(decoded.mediaTime-expected)<=(metadata.reduced||metadata.phase==='idle'?1e-5:1/30+1e-6);
 },metadata,{timeout:10000});
 const row=await page.evaluate(({fixedTime,metadata,prereg})=>{
  const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);
  const [id,entry]=[...s.actors].find(([,e])=>e.asset==='clover'),a=entry.actor,media=a.designerMedia.media;
  const spout=s.socket(id,'vfxOrigin'),grip=s.socket(id,'mainHand'),hp=s.socket(id,'hpAnchor'),head=s.socket(id,'head');
  const screenLocal=(x,y,z)=>{const p=s.scratch.clone().set(x,y,z);a.root.localToWorld(p);p.project(s.camera);return{x:(p.x+1)*s.width/2,y:(1-p.y)*s.height/2};};
  const position=media.geometry.attributes.position,index=media.geometry.index,base=media.basePositions;
  let top=Infinity,localTop=-Infinity,minTriangleRatio=Infinity,maxMeshDelta=0;
  for(let i=0;i<position.count;i++){const p=screenLocal(position.getX(i),position.getY(i),position.getZ(i));top=Math.min(top,p.y);localTop=Math.max(localTop,position.getY(i));}
  for(let i=0;i<position.array.length;i++)maxMeshDelta=Math.max(maxMeshDelta,Math.abs(position.array[i]-base[i]));
  for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)],area=get=>{const[x,y,z]=ids.map(get);return(y[0]-x[0])*(z[1]-x[1])-(y[1]-x[1])*(z[0]-x[0]);},before=area(j=>[base[j*3],base[j*3+1]]),after=area(j=>[position.getX(j),position.getY(j)]);if(before)minTriangleRatio=Math.min(minTriangleRatio,after/before);}
  const art=s.craftEffects.effects.heal,glint=art?.glint,actual=art?.audit?.source;
  const delta=(p,q)=>p&&q?Math.hypot(p.x-q.x,p.y-q.y):null;
  const localSpout=a.sockets.get('vfxOrigin').position,localHp=a.sockets.get('hpAnchor').position;
  const light=entry.craftLight?.edge?.material?.uniforms?.uSource?.value;
  const canvas=s.renderer.domElement.getBoundingClientRect(),plate=document.querySelector(`.b3-world[data-actor="${id}"]`);
  const measure=node=>{if(!node||node.hidden)return null;const boxes=[node,...node.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);if(!boxes.length)return null;const x=Math.min(...boxes.map(r=>r.left)),y=Math.min(...boxes.map(r=>r.top));return{x:x-canvas.x,y:y-canvas.y,width:Math.max(...boxes.map(r=>r.right))-x,height:Math.max(...boxes.map(r=>r.bottom))-y};};
  const rect=measure(plate),label=rect?{...rect,hidden:plate.hidden,text:plate.textContent}:null;
  const anchor=s.anchors.find(x=>x.id===id),body=anchor?.body;
  const overlap=(p,q)=>Math.max(0,Math.min(p.x+p.width,q.x+q.width)-Math.max(p.x,q.x))*Math.max(0,Math.min(p.y+p.height,q.y+q.height)-Math.max(p.y,q.y));
  const decoded=window.__cxvMediaAudit?.decoded.at(-1);
  // Independently locate the source landmark on the decoded frame's actual
  // posed triangle mesh; the socket uses the continuous video clock instead.
  let decodedMeshPoint=null;
  const decodedFrame=decoded?Math.round(decoded.mediaTime*30)%300:null,mf=media.manifest;
  if(decodedFrame!==null){
   const origin=mf.sockets['vfx-origin'],offset=mf.socketTracks.spout[decodedFrame],scale=512/mf.opaqueHeight;
   const x=(origin[0]+offset[0]-mf.foot[0])*scale,y=(mf.foot[1]-origin[1]-offset[1])*scale;
   for(let j=0;j<index.count;j+=3){
    const ids=[index.getX(j),index.getX(j+1),index.getX(j+2)],v=ids.map(i=>[base[i*3],base[i*3+1]]),[a0,b0,c0]=v;
    const den=(b0[1]-c0[1])*(a0[0]-c0[0])+(c0[0]-b0[0])*(a0[1]-c0[1]);
    const a1=((b0[1]-c0[1])*(x-c0[0])+(c0[0]-b0[0])*(y-c0[1]))/den,b1=((c0[1]-a0[1])*(x-c0[0])+(a0[0]-c0[0])*(y-c0[1]))/den,w=[a1,b1,1-a1-b1];
    if(w.some(z=>z<-.000001))continue;
    decodedMeshPoint=screenLocal(...[0,1,2].map(axis=>ids.reduce((sum,id,k)=>sum+position.array[id*3+axis]*w[k],0)));break;
   }
  }
  const authored={};
  for(const key of ['head','offHand']){
   const track=prereg.sourcePoints[key],actual=s.socket(id,key);
   const meshAt=time=>{
    const frame=((time%10+10)%10)*30,i=Math.floor(frame),t=frame-i;
    const point=track[i].map((v,k)=>v*(1-t)+track[(i+1)%300][k]*t);
    const delivery=[((point[0]+.5)*421/526*318/409-.5)*mf.width/318,(((point[1]+.5)*512/640-2)*390/500-.5)*mf.height/390];
    const scale=512/mf.opaqueHeight,x=(delivery[0]-mf.foot[0])*scale,y=(mf.foot[1]-delivery[1])*scale;
    for(let j=0;j<index.count;j+=3){
     const ids=[index.getX(j),index.getX(j+1),index.getX(j+2)],v=ids.map(i=>[base[i*3],base[i*3+1]]),[a0,b0,c0]=v;
     const den=(b0[1]-c0[1])*(a0[0]-c0[0])+(c0[0]-b0[0])*(a0[1]-c0[1]);if(!den)continue;
     const u=((b0[1]-c0[1])*(x-c0[0])+(c0[0]-b0[0])*(y-c0[1]))/den,vv=((c0[1]-a0[1])*(x-c0[0])+(a0[0]-c0[0])*(y-c0[1]))/den,w=[u,vv,1-u-vv];
     if(w.some(z=>z<-.000001))continue;
     return screenLocal(...[0,1,2].map(axis=>ids.reduce((sum,id,k)=>sum+position.array[id*3+axis]*w[k],0)));
    }return null;
   };
   const time=metadata.reduced||media.failure?0:media.video.currentTime,continuous=meshAt(time),decodedPoint=decoded?meshAt(metadata.reduced?0:decoded.mediaTime):null;
   authored[key]={actual,continuous,decodedPoint,continuousError:delta(actual,continuous),decodedError:delta(actual,decodedPoint),time};
  }
  return{...metadata,authored,fixedTime,url:location.href,source:a.source,media:{...media.state},decoded,decodedClockDelta:decoded?Math.abs(decoded.mediaTime-media.state.desired):null,
   decodedFrame,decodedMeshPoint,decodedSpoutAttachmentError:delta(decodedMeshPoint,spout),
   manifest:metadata.includeManifest?media.manifest:undefined,spout,grip,hp,head,localSpout:localSpout.toArray(),localHp:localHp.toArray(),
   renderedSource:actual?{...actual}:null,emissionError:delta(actual,spout),gripDistance:delta(spout,grip),glint:glint?{visible:glint.visible,position:glint.position.toArray(),alpha:glint.material.uniforms.uAlpha.value}:null,
   glintPlacementError:glint?delta({x:glint.position.x,y:glint.position.y},spout):null,paintLightPresent:!!entry.craftLight,lightSource:light?.toArray()??null,
   sampled:{...s.sampled.get(id)},host:{x:canvas.x,y:canvas.y,width:canvas.width,height:canvas.height},body,anchor,label,labelMetrics:label?{centerX:label.x+label.width/2,centerOffsetFromHead:label.x+label.width/2-head.x,centerOffsetFromHP:label.x+label.width/2-hp.x,gapAboveFullPlane:top-label.y-label.height,gapAboveBody:body.y-label.y-label.height,bodyOverlapArea:overlap(label,body),faceOverlapArea:overlap(label,anchor.face),spoutInside:spout.x>=label.x&&spout.x<=label.x+label.width&&spout.y>=label.y&&spout.y<=label.y+label.height}:null,labelAudit:{overlaps:s.labelAudit.overlaps,missing:[...s.labelAudit.missing]},
   hpObstacles:label?{allBodyOverlapArea:s.anchors.filter(x=>x.visible).reduce((sum,x)=>sum+overlap(label,x.body),0),otherLabelOverlapArea:[...document.querySelectorAll('.b3-world')].filter(n=>n!==plate).map(measure).filter(Boolean).reduce((sum,x)=>sum+overlap(label,x),0)}:null,
   hpLocalClearance:localHp.y-localTop,hpScreenGapAboveFullPlane:top-hp.y,minTriangleRatio,maxMeshDelta,foot:s.socket(id,'feet'),root:a.root.matrixWorld.toArray()};
 },{fixedTime,metadata,prereg});
 assert.equal(row.url,judgeUrl);assert.equal(row.source,'media');assert(row.media.ready&&!row.media.failed);assert(row.minTriangleRatio>0);
 assert(row.decodedMeshPoint,'Decoded source spout must lie inside the rendered media mesh');
 for(const key of ['head','offHand']){const p=row.authored[key];assert(p.continuous&&p.decodedPoint,key+' inside rendered mesh');assert(p.continuousError<=prereg.gate.maxContinuousMeshAttachmentCSSPx,key+' continuous attachment');assert(p.decodedError<=prereg.gate.maxDecodedMeshAttachmentCSSPx,key+' decoded attachment');}
 assert(row.label?.width>0&&row.label?.height>0&&!row.label.hidden,'Actual battle-v3 HUD label must have measurable geometry');
 if(process.env.CXV_REQUIRE_HP_CLEARANCE==='1'){assert(row.anchor.labelTarget,'Prepared Clover must supply its authored HP target');assert.equal(row.hpObstacles.allBodyOverlapArea,0);assert.equal(row.hpObstacles.otherLabelOverlapArea,0);assert.equal(row.labelMetrics.spoutInside,false);}
 if(metadata.reduced){assert(Math.abs(row.media.currentTime)<1/60);assert.equal(row.maxMeshDelta,0);}
 if(row.manifest){assert.equal(row.manifest.socketChannels.head,'head');assert.equal(row.manifest.socketChannels['off-hand'],'freePaw');assert.equal(row.manifest.socketChannels['vfx-origin'],'spout');assert.notEqual(row.manifest.socketChannels['main-hand'],'spout');}
 if(metadata.phase==='action'&&row.glint?.visible){assert(row.emissionError<1e-6);assert(row.glintPlacementError<1e-6);}
 report.rows.push(row);await save();return row;
}
async function capture(page,name,row){
 const path=resolve(out,name+'.png');await page.screenshot({path});const bytes=await readFile(path);
 const dimensions=[bytes.readUInt32BE(16),bytes.readUInt32BE(20)];assert.deepEqual(dimensions,[1280,720]);
 report.captures.push({name,path,sha256:sha(bytes),dimensions,utc:new Date().toISOString(),row:report.rows.indexOf(row)});await save();
}
try{
 stop();assert.equal(execFileSync('git',['diff',build.sourceCommit,'--','packages/game-rules/src'],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'}),'');
 assert.equal(runtimeEvidence().indexSha256,build.indexSha256);assert.equal(sha(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),build.indexSha256);
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 for(const reduced of [false,true])for(const skill of [1,4]){
  stop();const f=fixture(reduced,skill),{page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(x=>x.id==='boss'));
  await page.evaluate(({state,battle})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map',beforeImpact:null,afterImpact:null,animationAt:0});m.notify(false);},f);
  await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview,a=[...s.actors.values()].find(e=>e.asset==='clover')?.actor;return s.ready&&a?.source==='media'&&a.designerMedia.media.state.ready&&s.view().actors.every(a=>a.hp===m.visualBattle.actors.find(b=>b.id===a.id)?.hp);},null,{timeout:90000});
  await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:30,paused:true},0);});
  const phaseOffset=await page.evaluate(()=>[...window.__depthScene.actors.values()].find(e=>e.asset==='clover').actor.designerMedia.media.state.desired);
  if(skill===1)for(const sourceFrame of (reduced?prereg.reducedFrames:prereg.idleSourceFrames)){
   const row=await observe(page,50+(sourceFrame+.25)/30-phaseOffset,{phase:'idle',sourceFrame,reduced,skill,includeManifest:sourceFrame===0});
   if((reduced?prereg.reducedCaptureFrames:prereg.normalCaptureFrames).includes(sourceFrame))await capture(page,`idle-${sourceFrame}-${reduced?'reduced':'normal'}`,row);
  }
  const action=await page.evaluate(choice=>{const m=window.__depthReview;m.paused=false;if(!m.canAct)throw Error('Model cannot act');m.act(choice);m.paused=true;m.notify(false);return{log:m.battle.log,actors:m.battle.actors,plan:{skill:m.plan.skillId,duration:m.plan.duration,contact:m.plan.beats[2].start,events:m.plan.events}};},f.choice);
  assert.deepEqual(action.log,f.expected.log);assert.deepEqual(action.actors,f.expected.actors);assert.equal(action.plan.contact,skill===4?1100:350);report.actions.push({reduced,skill,phaseOffset,...action});
  let previous=0;
  const times=[...new Set([0,175,250,350,533.333333,600,800,1100,1760,action.plan.duration-.0001,action.plan.duration].filter(x=>x<=action.plan.duration))].sort((a,b)=>a-b);
  for(const ms of times){
   await page.evaluate(({previous,ms})=>{const m=window.__depthReview;let at=previous,now=100000+previous;m.tick(0,now);m.paused=false;while(at<ms-1e-8){const delta=Math.min(16,ms-at);now+=delta;at+=delta;m.tick(delta,now);}m.paused=true;m.notify(false);},{previous,ms});previous=ms;
   await page.waitForFunction(()=>{const m=window.__depthReview,s=window.__depthScene;return s.view().actors.every(a=>{const b=m.visualBattle.actors.find(x=>x.id===a.id);return b&&a.hp===b.hp&&a.shield===b.shield;});});
   const row=await observe(page,60+ms/1000-phaseOffset,{phase:'action',ms,reduced,skill});
   if(ms===(skill===1?250:800))await capture(page,`cast-${skill}-${reduced?'reduced':'normal'}`,row);
   if(skill===4&&ms===533.333333)await capture(page,`focus-${reduced?'reduced':'normal'}`,row);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.errors.push(...errors);report.blockedRequests.push(...blockedRequests);await page.close();await save();
 }
 const glints=report.rows.filter(x=>x.phase==='action'&&x.glint?.visible);
 assert.equal(report.rows.filter(x=>x.phase==='idle'&&!x.reduced).length,300);
 assert.equal(report.rows.filter(x=>x.phase==='idle'&&x.reduced).length,5);
 assert.equal(report.actions.length,4);assert.equal(report.captures.length,16);
 report.authoredSummary=Object.fromEntries(['head','offHand'].map(key=>[key,{
  samples:report.rows.length,maxContinuousError:Math.max(...report.rows.map(x=>x.authored[key].continuousError)),
  maxDecodedError:Math.max(...report.rows.map(x=>x.authored[key].decodedError))
 }]));
 assert(glints.some(x=>!x.reduced&&x.skill===1)&&glints.some(x=>!x.reduced&&x.skill===4),'Both legal cards must actually render their source glint');
 report.emissionSamples=glints.length;report.maxEmissionError=Math.max(...glints.map(x=>x.emissionError));
 for(const source of runtimeFiles)assert.equal(sha(await readFile(source.path)),source.sha256,'Concurrent runtime source change');
 assert.equal(runtimeEvidence().indexSha256,build.indexSha256);report.pass=true;
 report.limits='Actual production candidate at1280x720 with deterministic fixed-time seeks and legal A6 actions; no runtime source substitutions. Native callback must match each requested idle source frame; action callback may precede continuous socket time by at most one30Hz frame. Proves sampled routing/decoding only. R5head/R6paw independently follow frozen sparse source curves through decoded geometry;source uncertainty remains8/6px. Art/downsample quality, source loop, native physical visibility and general laptop FPS remain open. Bytes report-only.';
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();await modules.vite.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.length,captures:report.captures.length,maxEmissionError:report.maxEmissionError,failure:report.failure}));}
