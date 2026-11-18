import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cpus} from 'node:os';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),T=require('three');
const sha=x=>createHash('sha256').update(x).digest('hex'),sources={};
async function compile(path,imports={}){
 const source=await readFile(path,'utf8'),exports={};sources[path]=sha(source);
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','exports',code)(id=>{if(id in imports)return imports[id];throw Error(`Unexpected CPU import: ${id}`);},exports);return exports;
}
const living=await compile('apps/web/src/game/rig/native-living.ts');
const {CutoutMesh}=await compile('apps/web/src/game/rig/cutout.ts',{'three':T,'./native-living':living,'./atlas-color':{usePaintedAtlasColor:()=>{}},'./drawing-layer':{DrawingLayer:class{constructor(){throw Error('Drawing outside native CPU study');}}}});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,
 machine:{cpu:cpus()[0]?.model,arch:process.arch,node:process.version},
 method:'Actual native CPU pose plus skinning; same original rig enrolled vs unenrolled, seven alternating paired blocks,120poses/block,200warmup/condition. Process CPU and elapsed wall time. Shader/drawing hooks stubbed; no GPU/browser/frame-time claim. Baseline retains original clip durations; poses intentionally differ.',rows:[]};
const sorted=x=>[...x].sort((a,b)=>a-b),median=x=>sorted(x)[Math.floor(x.length/2)];
let checksum=0;
for(const cat of Object.keys(living.nativeLivingProfiles)){
 const raw=await readFile(`apps/web/public/units/${cat}/rig.json`,'utf8'),data=JSON.parse(raw),textures=data.pages.map(()=>new T.Texture());
 const baseline=new CutoutMesh(data,textures),candidate=new CutoutMesh(data,textures);if(!candidate.enableLivingCat(cat))throw Error(`Enrollment failed ${cat}`);
 const count=candidate.batches.reduce((n,b)=>n+b.positions.length/3,0);
 for(const reduced of [false,true])for(const clip of ['idle','skill']){
  candidate.livingReducedMotion=reduced;
  const sample=(mesh,n,enrolled)=>{const phase=(n%120)/119,clock=20+phase*10;mesh.proceduralTime=clock;mesh.pose(clip==='skill'?phase*(enrolled?1:data.clips.skill.duration):clock%(enrolled?10:data.clips.idle.duration),clip);};
  for(let n=0;n<200;n++){sample(baseline,n,false);sample(candidate,n,true);}
  const blocks=[];
  for(let trial=0;trial<7;trial++)for(const mode of trial%2?['living','legacy']:['legacy','living']){
   const mesh=mode==='living'?candidate:baseline,cpu=process.cpuUsage(),start=performance.now();
   for(let n=0;n<120;n++)sample(mesh,n,mode==='living');
   const elapsed=performance.now()-start,used=process.cpuUsage(cpu);
   checksum+=mesh.batches[0].positions[0];
   blocks.push({trial,mode,cpuMsPerPose:(used.user+used.system)/1000/120,wallMsPerPose:elapsed/120});
  }
  const summary={};for(const mode of ['legacy','living']){const x=blocks.filter(b=>b.mode===mode);summary[mode]={medianCpuMs:median(x.map(b=>b.cpuMsPerPose)),medianWallMs:median(x.map(b=>b.wallMsPerPose)),minWallMs:Math.min(...x.map(b=>b.wallMsPerPose)),maxWallMs:Math.max(...x.map(b=>b.wallMsPerPose))};}
  report.rows.push({cat,reduced,clip,vertices:count,rigSha256:sha(raw),blocks,summary,cpuRatio:summary.living.medianCpuMs/summary.legacy.medianCpuMs});
 }
 if(JSON.stringify(data)!==JSON.stringify(JSON.parse(raw)))throw Error(`Original rig changed ${cat}`);
 baseline.dispose();candidate.dispose();textures.forEach(t=>t.dispose());
 console.log(JSON.stringify({cat,cases:4,completeUTC:new Date().toISOString()}));
}
if(!Number.isFinite(checksum))throw Error('Nonfinite sample checksum');
report.checksum=checksum;report.completedUTC=new Date().toISOString();
report.worstLivingMedianCpuMs=Math.max(...report.rows.map(r=>r.summary.living.medianCpuMs));
report.limits='CPU diagnostic only. Native GPU rendering, texture uploads, composition, actual gameplay and whole-frame performance remain separate gates. No optimization is adopted or FPS inferred from these measurements.';
await writeFile('reports/v5/CXV/M-native-eight-CPU-R1.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:report.rows.length,worstLivingMedianCpuMs:report.worstLivingMedianCpuMs,completeUTC:report.completedUTC}));
