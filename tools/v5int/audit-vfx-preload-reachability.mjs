/** Source-only reachability inventory; no claim that a fetched atlas is safe to remove. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {createServer}=await import(req.resolve('vite'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),verified=[];
async function read(path,expected){const bytes=await readFile(path),hash=sha(bytes);if(expected)assert.equal(hash,expected);verified.push({path,sha256:hash});return JSON.parse(bytes);}
const packed=await read(resolve(root,'assets/cardrpg-look/vfx-packed/manifest.json'));
const sampled=await read(resolve(app,'src/game/cardrpg/vfx-layered/sampled-atlases.json'));
const deliveries=await read(resolve(app,'src/game/cardrpg/vfx-layered/vfx-atlas-manifest-loader.json'));
const authored=new Map();for(const file of await readdir(resolve(root,'assets/cardrpg-look/vfx-layered')))if(file.endsWith('.json')){const m=await read(resolve(root,'assets/cardrpg-look/vfx-layered',file));authored.set(m.id,m);}
const server=await createServer({root:app,configFile:false,server:{middlewareMode:true,fs:{allow:[root]}},logLevel:'error'});
const rows=[],natural=[];
try{
 const {SPINE_UNITS}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/spine/config.ts'));
 const {V5SkillPlayer}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/vfx-layered/skill-player.ts'));
 const {getV5Timeline}=await server.ssrLoadModule(resolve(app,'src/game/cardrpg/vfx-layered/skill-timeline.ts'));
 const player=new V5SkillPlayer(()=>undefined,{});
 for(const unit of SPINE_UNITS){
  const skillIds=unit.skills.map(s=>s.id),entries=Object.entries(packed.entries).filter(([id])=>authored.get(id)?.owner===unit.id);
  const pages=[...new Set(entries.map(([,entry])=>entry.page))];
  const tests=skillIds.map(id=>({id,v5:!!getV5Timeline(id),action:player.handles({skillId:id,actorId:unit.id,events:[{type:'action_start',actorId:unit.id}]}),chargeOnly:player.handles({skillId:id,actorId:unit.id,events:[{type:'charge',actorId:unit.id}]}),noAction:player.handles({skillId:id,actorId:unit.id,events:[]})}));
  rows.push({owner:unit.id,sootProtected:unit.id==='soot',skills:tests,extraPackedIdentities:entries.map(([id])=>id).filter(id=>!skillIds.includes(id)),pages:pages.map(page=>({page,delivery:[...deliveries,...sampled].find(d=>d.request===page)??null}))});
 }
 const receipt=await read('/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-media-natural-R3.json');
 for(const run of receipt.runs){
  const timeline=await read(run.timeline.path,run.timeline.sha256);
  const counts=new Map();
  for(const plan of timeline.plans){const id=plan.presentationId??plan.skillId,key=JSON.stringify([plan.actorId,id,player.handles(plan),plan.events.map(e=>e.type).filter(t=>['action_start','charge'].includes(t))]);counts.set(key,(counts.get(key)??0)+1);}
  natural.push({mode:run.mode,plans:timeline.plans.length,missingPresentationId:timeline.plans.filter(p=>p.presentationId===undefined).length,limits:'Serialized snapshots omit presentationId; predicate results from these records do not prove actual enemy render routing.',paths:[...counts].map(([key,count])=>({key:JSON.parse(key),count}))});
 }
}finally{await server.close();}
const transfer=await read(resolve(root,'work/v5/CXI/transfer/v8-mochi-scene-q22-r6/all.json'));
const requested=transfer.rows.map(row=>({fixture:row.fixture,layered:row.transfer.resources.filter(x=>x.path.startsWith('/vfx/sampled-delivery/')||x.path.startsWith('/vfx-delivery/v5/'))}));
const report={utc:new Date().toISOString(),verified,owners:rows,natural,requested,runtimeChanged:false,imagesViewed:0,provenSafeRemovals:[],limits:'Actual V5SkillPlayer predicate checked, not visual/runtime equivalence. Charge-only and no-action paths can bypass V5. Packed passive identities and explicit designer overrides require separate review. Soot excluded from any proposed filtering. No loading behavior changed.'};
await writeFile(resolve(root,'reports/v5/CXI/evidence/v8-vfx-preload-reachability-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({owners:rows.map(({owner,skills,extraPackedIdentities,pages})=>({owner,v5Action:skills.filter(x=>x.action).length,skills:skills.length,extraPackedIdentities,pages:pages.map(x=>x.page)})),natural,requested}));
