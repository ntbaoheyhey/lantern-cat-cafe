// Records explicit reviewed choices; never chooses artwork by a numeric score.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { globSync } from 'node:fs';
import { createHash } from 'node:crypto';
const base='reports/cardrpg-look';
const cats='panko,mallow,cinnamon,biscuit,inkcap,sorrel,brioche,velvet,marigold'.split(',');
const opponents='button-guard,sock-skipper,spool-ram,needle-moth,teacup-healer,crumb-sentinel,pollen-scout,rain-spool,binding-thread,practice-cushion,yarn-giant,kettle-knight,pantry-crown'.split(',');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path));
const poseReviews={
 panko:'batch1/pilot-2/poses/REVIEW.md',mallow:'batch1/pilot-3/poses/REVIEW.md',cinnamon:'batch1/pilot-4/poses/REVIEW.md',
 biscuit:'remaining-six/pilot-2/poses/REVIEW.md',inkcap:'remaining-six/pilot-1/poses/REVIEW.md',sorrel:'remaining-six/pilot-2/poses/REVIEW.md',
 brioche:'opponents/boss-frame-pilot/cat-poses/REVIEW.md',velvet:'remaining-six/pilot-1/poses/REVIEW.md',marigold:'opponents/boss-frame-pilot/cat-poses/REVIEW.md',
 'button-guard':'opponents/first-six/poses/REVIEW.md','sock-skipper':'opponents/sock-rain-pilot/poses/REVIEW.md',
 'spool-ram':'opponents/first-six/poses/REVIEW.md','needle-moth':'opponents/first-six/poses/REVIEW.md','teacup-healer':'opponents/first-six/poses/REVIEW.md',
 'crumb-sentinel':'opponents/next-four/poses/REVIEW.md','pollen-scout':'opponents/framing-pilot-2/poses/REVIEW.md',
 'rain-spool':'opponents/framing-pilot-2/poses/REVIEW.md','binding-thread':'opponents/boss-frame-pilot/poses/REVIEW.md',
 'practice-cushion':'opponents/boss-frame-pilot/poses/REVIEW.md','yarn-giant':'opponents/framing-pilot-2/poses/REVIEW.md',
 'kettle-knight':'opponents/boss-frame-pilot/poses/REVIEW.md','pantry-crown':'opponents/boss-frame-pilot/poses/REVIEW.md',
};
const choices=[];
for(const owner of [...cats,...opponents]){
 const kind=cats.includes(owner)?'cat':'opponent',section=kind==='cat'?'roster':'opponents';
 const raw=`assets/cardrpg-look/models/${owner}.glb`,packed=`assets/cardrpg-look/game-models/${owner}.glb`;
 const rawBytes=await readFile(raw),packedBytes=await readFile(packed),rawSha256=hash(rawBytes),packedSha256=hash(packedBytes);
 const exports=[];
 for(const path of globSync(`${base}/rounds/${section}/exports/**/models/${owner}.glb`))if(hash(await readFile(path))===rawSha256)exports.push(path);
 assert.equal(exports.length,1,`${owner}: exact authored export`);
 const round=Number(exports[0].match(/\/round-(\d+)\/models\//)[1]);
 const rounds=globSync(`${base}/rounds/${section}/${owner}/round-*/REVIEW.md`).sort();
 assert(rounds.length>=2,`${owner}: two personal authoring rounds required`);
 const staticReview=`${base}/rounds/${section}/${owner}/round-${round}/REVIEW.md`;
 const packing=[];
 for(const path of globSync(`${base}/validation/l5/compression/*/packing.json`)){
  const receipt=await json(path);
  for(const row of (Array.isArray(receipt)?receipt:receipt.rows||[])){
   if(row.sourceSha256===rawSha256&&row.sha256===packedSha256)packing.push({path,row});
  }
 }
 assert.equal(packing.length,1,`${owner}: exact reviewed packing`);
 const packingDirectory=packing[0].path.replace(/\/packing.json$/,'');
 const compressionReview=owner==='panko'||owner==='mallow'||owner==='cinnamon'
  ?`${packingDirectory}/comparison/RUNTIME-REVIEW.md`:`${packingDirectory}/studio/REVIEW.md`;
 const turns=[];
 for(const path of globSync(`${base}/turntables/l5*/${owner}/receipt.json`))if((await json(path)).modelHash===rawSha256)turns.push(path);
 assert.equal(turns.length,1,`${owner}: exact completed turntable`);
 const turntable=turns[0],turn=await json(turntable),turnDir=turntable.replace(/\/receipt.json$/,'');
 assert.equal(turn.frames,48);assert.equal(hash(await readFile(`${turnDir}/turntable.mp4`)),turn.videoSha256);
 const frameAudit=await json(`${turnDir}/frame-audit.json`);
 assert.equal(frameAudit.modelHash,rawSha256);assert.equal(frameAudit.frames,48);assert.deepEqual(frameAudit.framingFailures,[]);
 const ownTurnReview=`${turnDir}/REVIEW.md`;
 const turnReview=await access(ownTurnReview).then(()=>true,()=>false)?ownTurnReview:`${base}/turntables/l5/REVIEW.md`;
 // Only these five cats were reviewed in the explicitly named shared review.
 if(turnReview!==ownTurnReview)assert(['panko','mallow','biscuit','inkcap','sorrel'].includes(owner));
 const reviews=[...new Set([...rounds,staticReview,compressionReview,turnReview,`${base}/validation/l5/${poseReviews[owner]}`])];
 for(const path of reviews)assert((await readFile(path,'utf8')).trim().length>100,path);
 choices.push({owner,kind,tier:'improved',reviewed:true,raw,rawSha256,rawBytes:rawBytes.length,packed,packedSha256,packedBytes:packedBytes.length,
  authoredExport:exports[0],round,packing:packing[0].path,turntable,reviews,
  limitations:'Improved tier only; raised eye rims, rigid cloth/accessories and simple rear surfaces. Pilot poses are sampled evidence; fresh committed phase poses and performance gates remain separate.'});
}
const out=`${base}/validation/l5/selection.json`;
await writeFile(out,JSON.stringify({at:new Date().toISOString(),method:'Explicit personal review choices, matched by exact raw/packed/export/turntable hashes. Historical rejected rounds and pilots retained.',rows:choices},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,models:choices.length,rawBytes:choices.reduce((n,r)=>n+r.rawBytes,0),packedBytes:choices.reduce((n,r)=>n+r.packedBytes,0)}));
