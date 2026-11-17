/** Preserve natural-play observations; measure every image before review. */
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'), dir=resolve(root,'work/v5/CXV/films/V7-D-clover-leaf/natural-play');
const hash=b=>createHash('sha256').update(b).digest('hex');
const series=JSON.parse(readFileSync(resolve(dir,'series.json')));
assert(series.pass&&series.trials.length===4);
const target=resolve(dir,'measurements.json');assert(!existsSync(target));
const trials=[],images=[],states=[],references=new Map();
const dimensions=path=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];
for(const t of series.trials){
 const bytes=readFileSync(t.path);assert.equal(hash(bytes),t.sha256);
 const d=JSON.parse(bytes);assert(d.pass);assert.deepEqual(d.errors,[]);
 assert.equal(d.runtimePatchSha256,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');assert.deepEqual(d.runtimeUntrackedSha256,{});
 const runs=[];
 for(const r of d.runs){
  const plan=r.plans.map(({wallMs,...p})=>p),state={plan,initial:r.initial,final:r.final};
  const reference=references.get(r.rate);
  const exactWithinRate=!reference||JSON.stringify(state)===JSON.stringify(reference);
  if(!reference)references.set(r.rate,state);
  states.push({trial:t.index,rate:r.rate,exactWithinRate,state});
  assert(r.blockedRequests.every(b=>b.url==='https://fonts.googleapis.com/css2'&&b.type==='stylesheet'));
  const path=resolve(dirname(t.path),`boss-${r.rate}x.png`),size=dimensions(path);assert.deepEqual(size,{width:1280,height:720});
  const pixels=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'],{maxBuffer:8*1024*1024});
  assert.equal(pixels.length,1280*720*4);let light=0;for(let i=0;i<pixels.length;i+=4)light+=(pixels[i]+pixels[i+1]+pixels[i+2])/3;
  const mean=light/(1280*720);assert(mean>10&&mean<245);images.push({trial:t.index,mode:t.mode,rate:r.rate,path,...size,meanRgb:mean,sha256:hash(readFileSync(path))});
  runs.push({rate:r.rate,elapsedMs:r.elapsedMs,actions:plan.filter(p=>p.kind==='action').length,ultimates:plan.filter(p=>p.ultimate).length,events:r.final.log,preparation:r.cloverLeafPreparation,steady:{frameMs:r.frameMs,submitCpuMs:r.submitCpuMs,over33:r.over33,over50:r.over50},startup:r.startup,wholeRun:r.wholeRun,blockedRequests:r.blockedRequests});
 }
 trials.push({index:t.index,mode:t.mode,source:d.source,runtimePatchSha256:d.runtimePatchSha256,utc:d.utc,ended:d.ended,url:d.url,runs});
}
const sheets=[];
for(const trial of trials){
 const items=images.filter(i=>i.trial===trial.index),path=resolve(dir,`review-${trial.index}-${trial.mode}.jpg`);assert(!existsSync(path));
 execFileSync('ffmpeg',['-v','error',...items.flatMap(i=>['-i',i.path]),'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[a][b]hstack=inputs=2[v]','-map','[v]','-frames:v','1','-q:v','4',path]);
 const size=dimensions(path);assert(size.width<=1024&&size.height<=1024);sheets.push({trial:trial.index,mode:trial.mode,path,...size,sha256:hash(readFileSync(path)),order:['1x CPU','4x CPU']});
}
const allExact=states.every(s=>JSON.stringify(s.state)===JSON.stringify(states[0].state));
const commonLength=Math.min(...states.map(s=>s.state.plan.length));
const commonPrefixExact=states.every(s=>JSON.stringify(s.state.plan.slice(0,commonLength))===JSON.stringify(states[0].state.plan.slice(0,commonLength)));
const summary={utc:new Date().toISOString(),seriesSha256:hash(readFileSync(resolve(dir,'series.json'))),series,observationsComplete:true,gameplayExactAcross8Runs:allExact,gameplayExactWithinRate:states.every(s=>s.exactWithinRate),commonPlanPrefixExact:commonPrefixExact,commonPlanLength:commonLength,states,trials,images,sheets,reviewedUtc:null,limits:'Candidate Vite prototype only; four alternating trials with natural speed1 play. Final4x baseline reaches25actions/5ultimates/161events; other7runs26/6/171. Fixed32s windows end at different actions; final states differ. Common ordered prefix is checked separately, not gameplay equivalence. Local preparation is not a cold-network measurement. CPU render submission excludes GPU completion. 4x is a stress proxy; observations do not establish a speedup. Each screenshot is taken after its timed window, not at a matched action timestamp.'};
writeFileSync(target,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({observationsComplete:true,runs:8,allExact,commonPrefixExact,counts:trials.map(t=>({index:t.index,runs:t.runs.map(r=>({rate:r.rate,actions:r.actions,ultimates:r.ultimates,events:r.events}))})),sheets}));
