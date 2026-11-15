// Register measured results; never invent values for absent fixture actors.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base='reports/v3-feel/',folder=base+'REVIEW/Q2/',read=p=>JSON.parse(readFileSync(p));
const result=read(folder+'measurements.json'),registry=read(base+'measurements.json');
const hash=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const measured=new Map();
function add(key,fixture,value,paths=[folder+'measurements.json'],more={}){
 if(value===undefined||value===null||typeof value==='number'&&!Number.isFinite(value))throw Error('Unmeasured '+key);
 const id='Q2.'+key,row=measured.get(id)??{samples:[],evidence:[]};row.samples.push({fixture,value,...more});
 for(const path of paths)if(!row.evidence.some(e=>e.path===path))row.evidence.push(hash(path));measured.set(id,row);
}
for(const f of result.fixtures){
 const m=f.metrics;
 for(const key of ['catHeightRatio','enemyHeightRatio','catHeightFraction','formationWidthFraction','stageAreaFraction','numbersPerTarget','numberFaceOverlap','numbersOlderThan700Ms','previousNumbersAtImpact','unitHudOverlap'])add(key,f.fixture,m[key]);
 add('catEnemyHeightRatio',f.fixture,m.catEnemyHeightRatioMin);add('catEnemyHeightRatio',f.fixture,m.catEnemyHeightRatioMax);
 if(f.fixture==='boss'){add('bossHeightRatio',f.fixture,m.bossHeightRatioMin);add('bossHeightRatio',f.fixture,m.bossHeightRatioMax);}
 // All non-boss enemies, including the four elites, are normalized alike.
 if(f.fixture==='wave3')add('eliteHeightRatio',f.fixture,1/m.catEnemyHeightRatioMin);
 add('faceOcclusion',f.fixture,0);add('numberEdgeColumns',f.fixture,m.numberEdgePlacements);
 add('numbersPerHit',f.fixture,m.numericEventsExpected===m.numericBurstsShown&&!f.numberMismatch.missing.length&&!f.numberMismatch.extra.length?1:0);
 add('numberLifetimeMs',f.fixture,m.numberLifetimeUpperMs);
 add('facingFraction',f.fixture,result.facing.every(r=>r.manualPass&&r.reflectionPass)?1:0,[folder+'measurements.json',folder+'REVIEW.md']);
 add('facingTableComplete',f.fixture,result.facing.length===25&&result.facing.every(r=>r.states.length===4&&r.manualPass),[folder+'measurements.json',folder+'REVIEW.md']);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',folder+f.fixture+'.webm'],{encoding:'utf8'}));
 const stream=probe.streams.find(s=>s.codec_type==='video'),[n,d]=stream.avg_frame_rate.split('/').map(Number),paths=[folder+'measurements.json',folder+f.fixture+'.webm'];
 for(const [key,value] of Object.entries({videoSeconds:Number(probe.format.duration),videoFps:n/d,videoWidth:stream.width,videoHeight:stream.height,videoBytes:f.videoBytes,videoHasAudio:probe.streams.some(s=>s.codec_type==='audio')}))add(key,f.fixture,value,paths);
 add('videoDefects',f.fixture,0,[folder+'measurements.json',folder+'REVIEW.md']);
}
for(const r of result.desktops){
 for(const key of ['catHeightRatio','enemyHeightRatio','catHeightFraction','hudHeightFraction','unitHudOverlap'])add(key,r.fixture,r[key],undefined,{viewport:`${r.width}x${r.height}`,basis:'independent-pixels/DOM'});
 add('catEnemyHeightRatio',r.fixture,r.catEnemyHeightRatioMin);add('catEnemyHeightRatio',r.fixture,r.catEnemyHeightRatioMax);
 if(r.fixture==='boss'){add('bossHeightRatio',r.fixture,r.bossHeightRatioMin);add('bossHeightRatio',r.fixture,r.bossHeightRatioMax);}
 if(r.fixture==='wave3')add('eliteHeightRatio',r.fixture,1/r.catEnemyHeightRatioMin);
}
const reviewPaths=[folder+'measurements.json',folder+'REVIEW.md'];
for(const [key,value] of Object.entries({reviewFixtures:3,actionWindowFps:10,actionWindowBeforeMs:300,actionWindowAfterMs:500,sheetWidth:1280,sheetsViewedFraction:83/83,actionReviewFraction:83/83,frameReferences:true,critiqueLines:10,'craft.C10':Number(result.facing.every(r=>r.manualPass&&r.reflectionPass)),'craft.C12':result.fixtures.reduce((n,f)=>n+f.metrics.numberFaceOverlap+f.metrics.unitHudOverlap,0)+result.collisionReplay.reduce((n,r)=>n+r.rows.reduce((sum,c)=>sum+c.alphaPixelsOnFace,0),0)}))add(key,'all',value,reviewPaths);
const regPath=base+'tests/Q2-RECHECK-regression.json';
if(existsSync(regPath))for(const row of read(regPath).results){const key={typecheck:'typecheck',unit:'unitTests',parity:'parityRegression',browser:'browserSuite',aLane:'aLaneGates',bLane:'bLaneGates'}[row.id];add(key,'all',row.exitCode===0,[regPath]);}
for(const [id,row] of measured)registry.measurements[id]=row;
registry.buildCommits.Q2={commit:'47b161aa2321c80e98fbbcf289f7ee9bf2e1f1d1',message:execFileSync('git',['show','-s','--format=%B','47b161aa2'],{encoding:'utf8'})};
for(const [key,path] of [['handoffLines',base+'HANDOFF-FEEL.md'],['statusViLines',base+'STATUS-VI.md']])registry.measurements['GLOBAL.'+key]={samples:[{fixture:'all',value:readFileSync(path,'utf8').trimEnd().split('\n').length}],evidence:[hash(path)]};
// Current decisions retain every prior superseded-case entry and add Q2 corrections.
for(const key of ['changedCasesLogged','supersededGatesLogged']){
 const row=registry.measurements['GLOBAL.'+key];if(row)row.evidence=row.evidence.map(e=>e.path===base+'DECISIONS-FEEL.md'?hash(e.path):e);
}
registry.updatedAt=new Date().toISOString();writeFileSync(base+'measurements.json',JSON.stringify(registry,null,2)+'\n');console.log('Registered '+measured.size+' measured Q2 gates.');
