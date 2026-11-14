/** Measurements from retained, immutable render snapshots. Never grants a
 * manual/listening verdict or substitutes planned times for observed times. */
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base='reports/v3-feel/',item='Q1',folder=base+'REVIEW/'+item+'/';
const fixtures=['wave1','wave3','boss'];
const hash=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const old=JSON.parse(readFileSync(base+'parity-old.json')).rows;
const baseline=JSON.parse(readFileSync(base+'parity-new.json')).rows;
const measurements=JSON.parse(readFileSync(base+'measurements.json'));
const measured=new Map(),rows=[];
function add(key,fixture,value,evidence){
 if(value===undefined||value===null||typeof value==='number'&&!Number.isFinite(value))return;
 const id=item+'.'+key,m=measured.get(id)??{samples:[],evidence:[]};
 m.samples.push({fixture,value});for(const path of evidence)if(!m.evidence.some(e=>e.path===path))m.evidence.push(hash(path));measured.set(id,m);
}
for(const fixture of fixtures){
 const path=folder+fixture+'/capture.json.gz',d=JSON.parse(gunzipSync(readFileSync(path)));
 if(!d.plans.every(p=>Number.isFinite(p.clockStart)&&Number.isInteger(p.key)))throw Error('Requires per-render snapshots and unique presentation keys: '+fixture);
 const plans=d.plans.filter(p=>p.events.some(e=>e.type==='action_start'||e.type==='charge'));
 const first=d.frames[0],cameraDefects=[],displacements=[],focus=[],observed=[];
 let shakePx=0,shakeOutside=0,plateFrames=0,rangedDisplacement=0;
 for(const f of d.frames){
  const plan=d.plans.find(p=>p.key===f.action?.key),elapsed=f.action?.elapsed??-1;
  const shake=Math.hypot(f.camera.position[0],f.camera.position[1])*f.field.width/f.renderCamera.worldWidth;
  const allowed=!!plan?.ultimate&&elapsed>=plan.impact&&elapsed<plan.impact+120;
  const rootFixed=JSON.stringify(f.camera.root)===JSON.stringify(first.camera.root);
  if(!rootFixed||f.camera.zoom!==1||f.renderCamera.rotation!==0||shake>4.000001||shake>1e-6&&!allowed)cameraDefects.push({t:f.t,shake,allowed,rootFixed});
  shakePx=Math.max(shakePx,shake);if(shake>1e-6&&!allowed)shakeOutside++;
  plateFrames+=Number(!!f.sequence.plate);
  for(const motion of f.motion){
   displacements.push(Math.hypot(motion.dx,motion.dy)/f.field.width);
   if(motion.id===plan?.actorId&&!plan.ultimate&&['throw','staff-cast','summon'].includes(motion.archetype))rangedDisplacement=Math.max(rangedDisplacement,Math.hypot(motion.dx,motion.dy)/f.field.width);
  }
  if(plan?.ultimate&&elapsed>=0&&elapsed<600)focus.push({t:f.t,brightness:f.focus.brightness,outline:f.focus.outline,banner:f.sequence.banner});
 }
 for(const plan of plans){
  const frames=d.frames.filter(f=>f.action?.key===plan.key),hit=frames.find(f=>f.action.elapsed>=plan.impact);
  const previous=hit?frames[frames.indexOf(hit)-1]:null;
  observed.push({id:plan.id,actor:plan.actorId,skill:plan.skillId,tier:plan.tier,clockStart:plan.clockStart,duration:plan.duration,impact:plan.impact,
   firstVisible:frames[0]?.t,lastVisible:frames.at(-1)?.t,firstContact:hit?.t,contactWallOffsetMs:hit?(hit.t-plan.clockStart)*1000:null,
   contactBracketMs:hit&&previous?(hit.t-previous.t)*1000:null});
 }
 const overlaps=d.plans.slice(1).map((p,i)=>({from:d.plans[i].id,to:p.id,overlapMs:Math.max(0,(d.plans[i].clockStart+d.plans[i].duration/1000-p.clockStart)*1000)})).filter(r=>r.overlapMs>0.001);
 const stats={fixture,recorded:d.recorded,frames:d.frames.length,cameraDefects,shakePx,shakeOutside,plateFrames,
  actorDisplacementWidth:Math.max(...displacements),rangedDisplacementWidth:rangedDisplacement,focus,overlaps,observed,
  audio:d.audio,errors:d.errors,parity:d.parity,sourceVideoSha256:d.videoSha256,notes:'Observed wall contacts include measured sampling/render delays. Planned durations are reported separately. Listening remains OPEN.'};
 const statsPath=folder+fixture+'/q1-measurements.json';writeFileSync(statsPath,JSON.stringify(stats,null,2)+'\n');rows.push(stats);
 const evidence=[path,statsPath];
 add('staticCameraFraction',fixture,1-cameraDefects.length/d.frames.length,evidence);
 add('shakePx',fixture,shakePx,evidence);add('shakeOutsideUltimate',fixture,shakeOutside,evidence);
 add('activeEvents',fixture,plans.filter(p=>p.tier==='active').length,evidence);
 add('actorDisplacementWidth',fixture,stats.actorDisplacementWidth,evidence);
 add('rangedDisplacementWidth',fixture,rangedDisplacement<1e-12?0:rangedDisplacement,evidence);
 add('plateFrames',fixture,plateFrames,evidence);
 // The tolerance above is numerical zero (world-to-pixel roundoff), not motion.
 for(const [tier,prefix] of [['basic','basic'],['ultimate','ultimate']]){
  const set=plans.filter(p=>p.tier===tier);if(!set.length)continue;
  add(prefix+'DurationMs',fixture,Math.max(...set.map(p=>p.duration)),evidence);
  add(prefix+'DurationSpreadMs',fixture,Math.max(...set.map(p=>p.duration))-Math.min(...set.map(p=>p.duration)),evidence);
  add(prefix+'ImpactMs',fixture,Math.max(...set.map(p=>p.impact)),evidence);
  add(prefix+'ImpactSpreadMs',fixture,Math.max(...set.map(p=>p.impact))-Math.min(...set.map(p=>p.impact)),evidence);
  add(tier==='basic'?'basicAnticipationEndMs':'focusEndMs',fixture,Math.max(...set.map(p=>p.beats[0].duration)),evidence);
 }
 if(focus.length){
  add('focusBrightness',fixture,focus.reduce((a,b)=>Math.abs(a.brightness-.45)>Math.abs(b.brightness-.45)?a:b).brightness,evidence);
  add('focusComponents',fixture,focus.every(f=>f.outline&&f.banner),evidence);
 }
 add('actionOverlapMs',fixture,Math.max(0,...overlaps.map(o=>o.overlapMs)),evidence);
 const b=baseline.find(r=>r.fixture===fixture),before=old.find(r=>r.fixture===fixture);
 add('parity',fixture,d.parity&&b.parity,[...evidence,base+'parity-new.json']);
 add('fixtureWon',fixture,d.result==='party'&&b.result==='party',[...evidence,base+'parity-new.json']);
 add('durationRatio',fixture,b.durationMs/before.durationMs,[base+'parity-new.json',base+'parity-old.json']);
 const video=folder+fixture+'.webm',wav=folder+fixture+'-mix.wav';
 const probe=p=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',p],{encoding:'utf8'}));
 const v=probe(video),a=probe(wav),stream=v.streams.find(s=>s.codec_type==='video'),rate=stream.avg_frame_rate.split('/').map(Number);
 for(const [key,value] of Object.entries({videoSeconds:Number(v.format.duration),videoFps:rate[0]/rate[1],videoWidth:stream.width,videoHeight:stream.height,videoBytes:d.videoBytes,videoHasAudio:v.streams.some(s=>s.codec_type==='audio'),audioMixSeconds:Number(a.format.duration),audioMetricsComplete:Number.isFinite(d.audio.integratedLufs)&&Number.isFinite(d.audio.truePeakDbTP)&&Number.isFinite(d.audio.maxTransientVoices)}))add(key,fixture,value,[...evidence,video,wav]);
 console.log(JSON.stringify({fixture,frames:d.frames.length,cameraDefects:cameraDefects.length,shakePx,plateFrames,displacement:stats.actorDisplacementWidth,overlaps:overlaps.length,focusFailures:focus.filter(f=>!f.outline||!f.banner).length,audio:d.audio}));
}
for(const [id,value] of measured)measurements.measurements[id]=value;
measurements.updatedAt=new Date().toISOString();writeFileSync(base+'measurements.json',JSON.stringify(measurements,null,2)+'\n');
writeFileSync(folder+'measurement-summary.json',JSON.stringify({at:new Date().toISOString(),fixtures:rows.map(r=>({fixture:r.fixture,frames:r.frames,defects:r.cameraDefects.length,shakePx:r.shakePx,actorDisplacementWidth:r.actorDisplacementWidth,overlaps:r.overlaps,audio:r.audio}))},null,2)+'\n');
