/** Measure full-battle evidence and construct fresh, once-only review sheets. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),input=resolve(process.env.CXV_FULL_INPUT??resolve(root,'work/v5/CXV/films/V7-F-full-battle-judge'));
const output=resolve(process.env.CXV_FULL_REPORT??resolve(root,'reports/v5/CXV/V7-F-full-battle-judge.json'));
assert(input.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(output.startsWith(resolve(root,'reports/v5/CXV')+'/'));assert(!existsSync(output),'Preserve earlier measurement report');
const hash=value=>createHash('sha256').update(value).digest('hex');
const rawPath=resolve(input,'report.json'),raw=JSON.parse(readFileSync(rawPath));assert(raw.pass&&raw.runs.length===2);
const timelines=raw.runs.map(r=>JSON.parse(readFileSync(resolve(input,r.mode,'timeline.json'))));
const withoutTime=plans=>plans.map(({wallMs,...p})=>p);
const parity={initialBattle:raw.initialBattleEqual,result:raw.finalResultEqual,
 logs:JSON.stringify(timelines[0].log)===JSON.stringify(timelines[1].log),
 presentations:JSON.stringify(withoutTime(timelines[0].plans))===JSON.stringify(withoutTime(timelines[1].plans)),
 finalActors:JSON.stringify(raw.runs[0].final.actors)===JSON.stringify(raw.runs[1].final.actors)};
assert(Object.values(parity).every(Boolean),'Motion preferences must not change rules, presentation order or final actors');
const report={utc:new Date().toISOString(),source:raw.source,servedSource:raw.servedSource,indexSha256:raw.indexSha256,url:raw.url,viewport:raw.viewport,
 captureUtc:raw.utc,captureEnded:raw.ended,raw:{path:rawPath,sha256:hash(readFileSync(rawPath))},
 harnessSha256:raw.harnessSha256,productionFixtureSha256:raw.productionFixtureSha256,runtimePatch:'No application-response substitution; seeded setup only.',
 method:raw.method,parity,runs:[],captures:[],sheets:[],reviewedUtc:null,visualReview:null,pass:false};
report.local=raw.local??false;report.artifactIdentity=raw.artifactIdentity??null;report.buildRuntimePatchSha256=raw.artifactIdentity?.buildRuntimePatchSha256??null;
report.cpuRate=raw.cpuRate??1;report.hardware=raw.hardware??null;report.browser=raw.browser??null;
const review=resolve(input,'review');mkdirSync(review,{recursive:true});
for(const [index,run]of raw.runs.entries()){
 const timeline=timelines[index],actions=timeline.plans.filter(p=>p.events.some(e=>e.type==='action_start'||e.type==='charge'));
 const windows=run.captures.map(c=>[c.before.wallMs,c.after.wallMs]);
 const clean=timeline.frames.filter((f,i)=>i>0&&f.frameMs>0&&!windows.some(([a,b])=>b>timeline.frames[i-1].wallMs&&a<f.wallMs));
 const stats=xs=>{const sorted=xs.filter(Number.isFinite).sort((a,b)=>a-b);return{samples:sorted.length,median:sorted[Math.floor(sorted.length*.5)]??null,p95:sorted[Math.floor(sorted.length*.95)]??null,max:sorted.at(-1)??null};};
 const segment=frames=>({frames:frames.length,frameMs:stats(frames.map(f=>f.frameMs)),renderSubmissionMs:stats(frames.map(f=>f.cpuMs)),intervalsOver50p5ms:frames.filter(f=>f.frameMs>50.5).length});
 const stress={excludedCaptureIntervals:timeline.frames.length-clean.length,method:'Exclude render-finish intervals intersecting recorded screenshot wall windows. This is descriptive capture-aware timing, not a calibrated laptop or optimization comparison. Submission duration excludes GPU completion.',all:segment(clean),first5s:segment(clean.filter(f=>f.wallMs<5000)),later:segment(clean.filter(f=>f.wallMs>=5000)),slowestSubmissions:[...clean].sort((a,b)=>b.cpuMs-a.cpuMs).slice(0,5).map(f=>({...f,nearestPlan:timeline.plans.filter(p=>p.wallMs<=f.wallMs).at(-1)?.skillId??null}))};
 const pacing=actions.every(p=>p.fixedTiming&&p.leadIn===0&&p.duration===(p.ultimate?2200:800));assert(pacing);
 const statusEvents={};for(const p of timeline.plans)for(const event of p.events)if(event.type.startsWith('status_'))statusEvents[event.type]=(statusEvents[event.type]??0)+1;
 const heroUltimates=Object.fromEntries(['mochi','soot','clover','panko'].map(id=>[id,timeline.plans.filter(p=>p.actorId===id&&p.ultimate).length]));assert(Object.values(heroUltimates).every(n=>n>0));
 const last=run.captures.at(-1).after,crew=last.crew[0];assert(crew?.ready==='true'&&crew.drawn==='4'&&!crew.loadError);
 if(run.mode==='reduced')assert.equal(crew.confetti,0);
 assert.equal(run.captures.length,8);assert.equal(run.identity.indexSha256,raw.indexSha256);assert.equal(run.identityAfter.indexSha256,raw.indexSha256);
 report.runs.push({mode:run.mode,naturalResultMs:run.final.wallMs,captureRunElapsedMs:run.elapsedMs,result:run.final.result,round:run.final.round,
  actions:run.actions,presentations:run.presentations,ultimates:run.ultimates.length,heroUltimates,logEvents:run.logEvents,logSha256:hash(JSON.stringify(timeline.log)),
  actionPacingExact:pacing,statusEvents,frameMs:run.frameMs,renderCpuMs:run.renderCpuMs,stress,crew,errors:run.errors,blockedRequests:run.blockedRequests,
  party:run.final.actors.filter(a=>a.side==='party').map(a=>({id:a.catalogId,hp:a.hp})),timeline:{path:resolve(input,run.mode,'timeline.json'),sha256:hash(readFileSync(resolve(input,run.mode,'timeline.json')))}});
 for(const capture of run.captures){
  const bytes=readFileSync(capture.path),width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(width,1280);assert.equal(height,720);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',capture.path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
  assert.equal(rgb.length,160*90*3);const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
  report.captures.push({mode:run.mode,reason:capture.reason,path:capture.path,utc:capture.utc,width,height,bytes:bytes.length,sha256:hash(bytes),mean,stdDev,
   wallWindowMs:[capture.before.wallMs,capture.after.wallMs],ageWindowMs:[capture.before.age,capture.after.age],planBefore:capture.before.plan,planAfter:capture.after.plan,
   crew:capture.after.crew});
 }
 for(let part=0;part<2;part++){
  const frames=run.captures.slice(part*4,part*4+4),path=resolve(review,`${run.mode}-${part}.jpg`);assert(!existsSync(path),'Preserve prior review; never reopen inspected sheets');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error',...frames.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
  const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
  report.sheets.push({mode:run.mode,part,path,...dimensions,sha256:hash(readFileSync(path)),frames:frames.map(c=>({reason:c.reason,path:c.path}))});
 }
}
report.pass=Object.values(parity).every(Boolean)&&report.runs.every(r=>!r.errors.length&&!r.blockedRequests.length);
report.limits='Current served candidate, not latest green artifact. All battle progression after seeded setup is natural; no account/reward/public-chain proof. Screenshot windows are recorded because capture interrupts wall-clock smoothness. Whole-run timing is descriptive, includes capture overhead and is not a before/after performance claim. Reduced/normal captures are not synchronized pixel-equality pairs. Fresh visual review remains required.';
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,pass:report.pass,parity,sheets:report.sheets.map(s=>s.path)}));
