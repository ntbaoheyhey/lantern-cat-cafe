// Staged for tools/cardrpg-look. Small historic, hash-bound comparison images.
// Native originals remain in reports; thumbnail compression is presentation only.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json'),sharp=require('sharp');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function showcaseEvidence(root){
 const beforeDir='reports/cardrpg-look/validation/l1/before-neutral',afterDir='reports/cardrpg-look/validation/l1/after';
 const json=async path=>JSON.parse(await readFile(resolve(root,path)));
 const before=await json(`${beforeDir}/captures.json`),after=await json(`${afterDir}/captures.json`);
 const payload={pairs:[],rounds:[],measures:[]},files=[];
 for(const owner of ['mochi','soot','clover']){
  const file=`1280x720-unit-${owner}.png`,a=before.rows.find(row=>row.file===file),b=after.rows.find(row=>row.file===file);
  assert(a&&b);assert.deepEqual(a.camera,b.camera);assert.deepEqual(a.canvas,b.canvas);
  const c=a.canvas,boxes=[a,b].flatMap(row=>row.crops.filter(crop=>crop.asset===owner).map(crop=>crop.box)),dpr=before.dpr;
  assert.equal(dpr,after.dpr);
  const x=Math.floor(Math.max(c.x,Math.min(...boxes.map(box=>box[0]))-7)*dpr),y=Math.floor(Math.max(c.y,Math.min(...boxes.map(box=>box[1]))-7)*dpr);
  const right=Math.ceil(Math.min(c.x+c.width,Math.max(...boxes.map(box=>box[2]))+7)*dpr),bottom=Math.ceil(Math.min(c.y+c.height,Math.max(...boxes.map(box=>box[3]))+7)*dpr);
  const pair=[];
  for(const [directory,row]of [[beforeDir,a],[afterDir,b]]){
   const path=`${directory}/${file}`,raw=await readFile(resolve(root,path));assert.equal(hash(raw),row.sha256);
   const bytes=await sharp(raw).extract({left:x,top:y,width:right-x,height:bottom-y}).resize({width:420,withoutEnlargement:true}).webp({quality:85}).toBuffer();
   files.push({path,sourceSha256:hash(raw),thumbnailSha256:hash(bytes),thumbnailBytes:bytes.length,crop:[x,y,right,bottom]});
   pair.push(`data:image/webp;base64,${bytes.toString('base64')}`);
  }
  payload.pairs.push({name:`${owner[0].toUpperCase()+owner.slice(1)} · sculpture checkpoint`,before:pair[0],after:pair[1],source:`${beforeDir}/${file} → ${afterDir}/${file}. Artifacts ${before.sha256} / ${after.sha256}.`,note:'Historical L1 model comparison at the same camera and3.2s idle. The live miniature viewer shows the current lighting. Earlier framing is retained here, including its clipping; these are not new L7 captures.'});
 }
 for(const owner of ['mochi','soot','clover']){
  const path=`reports/cardrpg-look/rounds/${owner}/round-3.png`,raw=await readFile(resolve(root,path));
  const bytes=await sharp(raw).resize({width:480,withoutEnlargement:true}).webp({quality:82}).toBuffer();
  files.push({path,sourceSha256:hash(raw),thumbnailSha256:hash(bytes),thumbnailBytes:bytes.length});
  payload.rounds.push({name:`${owner[0].toUpperCase()+owner.slice(1)} · early round3`,image:`data:image/webp;base64,${bytes.toString('base64')}`,source:path,note:'A retained workbench round, before later eye, cloth and motion corrections. See the full checkpoint for selected rounds.'});
 }
 const selectionPath='reports/cardrpg-look/validation/l5/selection.json',auditPath='reports/cardrpg-look/validation/l5/audit.json';
 const selection=await json(selectionPath),audit=await json(auditPath);assert.equal(selection.rows.length,22);
 assert.equal(audit.modelRows.length,22);assert.equal(audit.performance.castWindows,24);assert.equal(audit.performance.coldRuns,7);
 for(const path of [selectionPath,auditPath])files.push({path,sourceSha256:hash(await readFile(resolve(root,path))),kind:'source-receipt'});
 payload.measures=[
  {name:'L5 roster',value:'22 models ·9 portrait refreshes',note:'Nine cats +10 opponents +3 bosses. Hash-bound selection, raw and packed models.'},
  {name:'L5 rotations',value:'22 ×48 frames',note:'All frames audited; six sampled angles personally reviewed per unit. Does not prove continuous collision freedom.'},
  {name:'Hero sculpture',value:'<12,000 triangles each',note:'L1 exported meshes. Lighting and full-scene draw costs are separate.'},
  {name:'L4 effect identity',value:'0 threshold failures;1,162 strict decreases',note:'Historical67 recipes/2,211 pairs. Numeric regressions remain open.'},
  {name:'L5 first/repeat casts',value:`24 windows ·${audit.performance.castMaxMs.toFixed(1)}ms max`,note:'Accepted High/DPR1 slice checkpoint; the full final roster is measured separately.'},
  {name:'L5 cold opening',value:`7 openings ·${audit.performance.coldMaxMs.toFixed(1)}ms max`,note:'Checkpoint includes native and CPU×4 opening. Loading and active-cast windows are measured separately.'},
 ];
 const serialized=JSON.stringify(payload).replace(/</g,'\\u003c');
 return {script:`window.__lookShowcase=${serialized};`,files,bytes:Buffer.byteLength(serialized)};
}
