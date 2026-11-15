// Two UV/motion parameterizations on the original D2 source-to-target path.
import * as T from '../../../apps/web/node_modules/three/build/three.module.js';
import {writeFileSync} from 'node:fs';
const controls=[[340,280],[360,470],[850,510],[975,245]],curve=new T.CubicBezierCurve(...controls.map(p=>new T.Vector2(...p)));curve.arcLengthDivisions=1024;
const rows=[];
for(const method of ['uniform-parameter','arc-length']){
 const points=Array.from({length:31},(_,i)=>(method==='arc-length'?curve.getPointAt(i/30):curve.getPoint(i/30)).toArray());
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),mean=lengths.reduce((a,b)=>a+b,0)/lengths.length;
 rows.push({method,points,minStepPx:Math.min(...lengths),maxStepPx:Math.max(...lengths),maxMinRatio:Math.max(...lengths)/Math.min(...lengths),coefficientOfVariation:Math.sqrt(lengths.reduce((sum,n)=>sum+(n-mean)**2,0)/lengths.length)/mean});
}
writeFileSync('tools/v3craft-lab/q3/arc-study.json',JSON.stringify({at:new Date().toISOString(),controls,steps:30,method:'Same cubic path, equal clock/UV increments, actual installed Three.js 0.180.0. No reference pixels or production edits.',rows},null,2)+'\n');
console.log(JSON.stringify(rows.map(({points,...summary})=>summary)));
