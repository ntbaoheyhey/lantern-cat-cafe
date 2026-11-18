import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),T=require('three');
const file='apps/web/src/game/cardrpg/spine/living-cat-cast.ts',source=await readFile(file,'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {sampleLivingCatCast,livingCatCastOffset,applyLivingCatCast}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const geometry=new T.PlaneGeometry(560,544,24,24).translate(0,256,0),base=new Float32Array(geometry.attributes.position.array),target=new Float32Array(base.length),indices=geometry.index.array;
const area=(a,i)=>{const x=indices[i]*3,y=indices[i+1]*3,z=indices[i+2]*3;return(a[y]-a[x])*(a[z+1]-a[x+1])-(a[y+1]-a[x+1])*(a[z]-a[x]);};
const rows=[];
for(const unit of ['mochi','clover'])for(const clip of ['skill','ult']){
 let minTriangleRatio=Infinity,maxDisplacement=0,maxEndpointDelta=0,maxFootDelta=0;const samples=[];
 for(let frame=0;frame<=300;frame++){
  const progress=frame/300,pose=sampleLivingCatCast(unit,clip,progress,false,{});applyLivingCatCast(base,target,512,pose);
  for(let i=0;i<base.length;i+=3){const d=Math.hypot(target[i]-base[i],target[i+1]-base[i+1]);maxDisplacement=Math.max(maxDisplacement,d);if(frame===0||frame===300)maxEndpointDelta=Math.max(maxEndpointDelta,d);}
  for(let i=0;i<indices.length;i+=3)minTriangleRatio=Math.min(minTriangleRatio,area(target,i)/area(base,i));
  for(const x of [-120,0,120]){const d=livingCatCastOffset(x,0,512,pose,{});maxFootDelta=Math.max(maxFootDelta,Math.hypot(d.x,d.y));}
  if([0,42,75,150,165,252,300].includes(frame))samples.push({progress,pose,head:livingCatCastOffset(0,400,512,pose,{}),hand:livingCatCastOffset(130,240,512,pose,{})});
 }
 rows.push({unit,clip,minTriangleRatio,maxDisplacement,maxDisplacementPctH:100*maxDisplacement/512,maxEndpointDelta,maxFootDelta,samples});
}
geometry.dispose();
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceFile:file,sourceSha256:createHash('sha256').update(source).digest('hex'),grid:[24,24],height:512,framesPerClip:301,rows,validation:{tests:15,typecheck:0},limitation:'Pure helper geometry study only. Final commissioned media integration, actual socket metadata, and native battle cast film remain pending.'};
await writeFile('reports/v5/CXV/M-V3-designer-cast-math.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(rows.map(({samples,...rest})=>rest)));
