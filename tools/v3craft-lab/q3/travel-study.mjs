// Q3-X06. Compare explicit timing on the same measured D2 arc-distance path.
import * as T from '../../../apps/web/node_modules/three/build/three.module.js';
import {writeFileSync} from 'node:fs';
const source=[380.79614409357373,253.06507929853802],target=[980,228.29544025873926];
const curve=new T.CubicBezierCurve(...[source,[source[0]+32,source[1]+200],[target[0]-125,target[1]+240],target].map(p=>new T.Vector2(...p)));
curve.arcLengthDivisions=1024;
const rows=[];
for(const method of ['linear-r1','shaped-r2']){
 const head=ms=>{const p=Math.max(0,(ms-100)/(method==='linear-r1'?1000:650));return 1.08*(method==='linear-r1'?p:p<=1?Math.pow(p,1.45):1+(p-1)*.7);};
 const samples=Array.from({length:21},(_,i)=>{const ms=i*100,u=Math.min(1,head(ms));return{ms,head:head(ms),distancePx:u*curve.getLength(),point:curve.getPointAt(u).toArray()};});
 const increments=samples.slice(1).map((s,i)=>({fromMs:samples[i].ms,toMs:s.ms,distancePx:s.distancePx-samples[i].distancePx}));
 let arrivalMs=0;while(head(arrivalMs)<1)arrivalMs++;
 rows.push({method,arrivalMs,pathLengthPx:curve.getLength(),samples,increments});
}
const result={at:new Date().toISOString(),method:'Same original cubic and measured actor sockets. Arc-distance timing hypotheses; not a film timing claim.',rows};
writeFileSync('tools/v3craft-lab/q3/travel-study.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(rows.map(r=>({method:r.method,arrivalMs:r.arrivalMs,pathLengthPx:r.pathLengthPx,increments:r.increments.filter(s=>s.fromMs>=100&&s.toMs<=700)}))));
