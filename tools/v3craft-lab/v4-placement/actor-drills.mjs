/** Two private geometry drills over already captured DOM bounds. */
import {placeActorLabels} from './actor-relative.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),dir=resolve(root,'reports/v4-art/REVIEW/A11/placement-r1');
const out=resolve(dir,'actor-drills-r1.json');if(existsSync(out))throw Error('Never overwrite a drill');
const read=p=>JSON.parse(readFileSync(p,'utf8')),gz=p=>JSON.parse(gunzipSync(readFileSync(p)).toString());
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const temporal=read(resolve(dir,'temporal-r3.json'));
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const nearest=(rect,faces)=>faces.map(f=>({id:f.id,d:Math.hypot(Math.max(f.x-rect.x-rect.width,rect.x-f.x-f.width,0),Math.max(f.y-rect.y-rect.height,rect.y-f.y-f.height,0))})).sort((a,b)=>a.d-b.d)[0]?.id;
const report={at:new Date().toISOString(),scope:'Offline geometry experiments on304 previously saved DOM states. No new browser/visual/film acceptance.',
 sourceSha256:sha(resolve(dir,'temporal-r3.json')),candidateSha256:sha(resolve(import.meta.dirname,'actor-relative.mjs')),variants:[],productionInstalled:false};
for(const mode of ['actor','sticky']){
 const variant={mode,cases:[]};report.variants.push(variant);
 for(const c of temporal.cases){
  const original=gz(resolve(root,c.capturePath));const sides=new Map(original.initial.actors.map(a=>[a.id,a.side]));
  const samples=gz(resolve(root,c.rawSamples.path));let previous=[],previousSample=null;
  const result={fixture:c.fixture,height:c.height,samples:[],summary:{intersections:0,infeasible:0,associationChanges:0,maxStableTextRelativeJump:0,maxBaselineOffset:0}};
  for(const s of samples){
   const b=s.baseline,labels=b.labels.map(l=>({...l,side:sides.get(l.id)}));
   const p=placeActorLabels(labels,b.width,b.height,b.obstacles,b.faces,mode,previous);
   const intersections=p.flatMap((x,i)=>[...b.obstacles,...b.faces,...p.slice(i+1).map(x=>x.rect)].filter(o=>overlaps(x.rect,o)).map(()=>x.id));
   const associations=p.filter(x=>{const label=b.labels.find(l=>l.id===x.id);return nearest(label.rect,b.faces)===x.id&&nearest(x.rect,b.faces)!==x.id;}).map(x=>x.id);
   const jumps=previousSample&&s.encodedFrame===previousSample.frame+1?p.flatMap(x=>{const old=previous.find(o=>o.id===x.id),l=labels.find(l=>l.id===x.id),oldLabel=previousSample.labels.find(o=>o.id===x.id);return old&&l.text===oldLabel?.text?[{id:x.id,distance:Math.hypot(x.relativeX-old.relativeX,x.relativeY-old.relativeY)}]:[];}):[];
   const maxOffset=Math.max(0,...p.map(x=>{const l=labels.find(l=>l.id===x.id);return Math.hypot(x.rect.x-l.rect.x,x.rect.y-l.rect.y);}));
   result.samples.push({encodedFrame:s.encodedFrame,intersections,associations,infeasible:p.filter(x=>!x.feasible).map(x=>x.id),jumps});
   result.summary.intersections+=intersections.length;result.summary.infeasible+=p.filter(x=>!x.feasible).length;result.summary.associationChanges+=associations.length;
   result.summary.maxStableTextRelativeJump=Math.max(result.summary.maxStableTextRelativeJump,...jumps.map(x=>x.distance));
   result.summary.maxBaselineOffset=Math.max(result.summary.maxBaselineOffset,maxOffset);
   previous=p;previousSample={frame:s.encodedFrame,labels};
  }
  variant.cases.push(result);
 }
 console.log(mode,JSON.stringify(variant.cases.map(c=>({fixture:c.fixture,height:c.height,...c.summary}))));
}
writeFileSync(out,JSON.stringify(report,null,2)+'\n');
