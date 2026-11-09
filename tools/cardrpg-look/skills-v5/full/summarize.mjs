// Aggregate complete receipts, never infer a pass from the last console row.
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const [directory,output]=process.argv.slice(2);
async function read(name){try{const b=await readFile(`${directory}/${name}`);return JSON.parse(name.endsWith('.gz')?gunzipSync(b):b)}catch(e){if(e.code==='ENOENT')return null;throw e}}
const [collide,casts,cold,shots,faces,ui]=await Promise.all([
 read('collide3/collisions.json.gz'),read('casts3/casts.json.gz'),read('cold-attempt3/summary.json.gz'),
 read('after3/shots.json.gz'),read('faces3/faces.json'),read('ui4/ui.json'),
]);
const all=collide?.rows.flatMap(r=>r.frames.map(f=>({id:r.id,width:r.width,...f})));
const round=n=>Math.round(n*10)/10;
const result={generatedAt:new Date().toISOString(),
 collisions:all?{windows:collide.rows.length,frames:all.length,errors:collide.errors,
  failures:all.filter(f=>f.overlaps.length||f.outside.length||f.unplaced.length).map(f=>({id:f.id,width:f.width,at:f.at,overlaps:f.overlaps.length,outside:f.outside.length,unplaced:f.unplaced})),
  visibleOverlaps:all.reduce((n,f)=>n+f.overlaps.length,0),pass:collide.rows.length===30&&collide.errors.length===0&&all.every(f=>!f.overlaps.length&&!f.outside.length&&!f.unplaced.length)}:null,
 casts:casts?{windows:casts.rows.length,expected:168,errors:casts.errors,draws:Math.max(...casts.rows.map(r=>r.draws)),tris:Math.max(...casts.rows.map(r=>r.tris)),
  groups:[1,4].map(cpu=>{const rows=casts.rows.filter(r=>r.cpu===cpu);return{cpu,count:rows.length,maxMs:round(Math.max(...rows.map(r=>r.max))),misses:rows.filter(r=>round(r.max)>(cpu===1?16.8:100)).map(({frames,...r})=>r)}})}:null,
 cold:cold?{runs:cold.rows.length,rows:cold.rows.map(r=>({cpu:r.throttle,maxMs:round(r.max),readyMs:round(r.battleReadyMs),postReadyMaxMs:round(r.postReady.max),maxQueueSliceMs:round(Math.max(...r.prewarm.filter(q=>q.name==='look-prewarm:queue-slice').map(q=>q.duration))),errors:r.errors}))}:null,
 shots:shots?{count:shots.shots.length,errors:shots.errors,minContrast:Math.min(...shots.shots.map(r=>r.contrast)),failures:shots.shots.filter(r=>r.overlaps.length||r.outside.length||r.unplaced.length||r.overflow).map(r=>({id:r.id,width:r.width,overlaps:r.overlaps.length,outside:r.outside.length,unplaced:r.unplaced,overflow:r.overflow}))}:null,
 faces:faces?{samples:faces.samples,offenders:faces.offenders}:null,
 ui:ui?{cases:ui.rows.length,errors:ui.errors}:null,
};
await writeFile(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,collisions:result.collisions?{...result.collisions,failures:result.collisions.failures.length}:null}));
