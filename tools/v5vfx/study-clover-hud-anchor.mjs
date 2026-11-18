/** Replay frozen native geometry; retain the original solver as an independent oracle. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/batch-m/clover-hud-repair-r1');
const req=createRequire(resolve(root,'apps/web/package.json')),ts=req('typescript'),sha=b=>createHash('sha256').update(b).digest('hex');
const priorPath=resolve(out,'world-label-layout-before.ts'),currentPath=resolve(root,'apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts');
const load=async path=>{const source=await readFile(path,'utf8'),js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;return(await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))).layoutWorldLabels;};
const before=await load(priorPath),after=await load(currentPath);
const fixtures=JSON.parse(await readFile(resolve(root,'apps/web/src/game/cardrpg/battle-v3/world-label-layout.fixtures.json')));
const captures=JSON.parse(await readFile(resolve(root,'apps/web/src/game/cardrpg/battle-v3/clover-hud-fixtures.json')));
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const result={utc:new Date().toISOString(),prior:{path:priorPath,sha256:sha(await readFile(priorPath))},candidate:{path:currentPath,sha256:sha(await readFile(currentPath))},originalFixtures:0,nativeGeometryCases:0,fixedCompanionCases:0,minBodyGap:Infinity,maxSpoutOverlap:0,protectedPaths:0,pass:false};
for(const f of fixtures){assert.deepEqual(after(f.labels,f.width,f.height,f.obstacles,f.faces),before(f.labels,f.width,f.height,f.obstacles,f.faces));result.originalFixtures++;}
for(const f of captures){
 const label={id:'clover',side:'party',rect:f.rect},target={...label,anchorPlacement:{rect:f.target,avoid:f.body}};
 const [placed]=after([target],1280,720,[],[f.face]);assert(placed.feasible);assert.deepEqual(placed.rect,f.target);assert(!overlaps(placed.rect,f.body));
 result.minBodyGap=Math.min(result.minBodyGap,f.body.y-placed.rect.y-placed.rect.height);result.nativeGeometryCases++;
 const inside=f.spout.x>=placed.rect.x&&f.spout.x<=placed.rect.x+placed.rect.width&&f.spout.y>=placed.rect.y&&f.spout.y<=placed.rect.y+placed.rect.height;
 result.maxSpoutOverlap=Math.max(result.maxSpoutOverlap,Number(inside));assert(!inside);
 for(const x of [100,400,800]){
  const companion={id:'companion',side:'party',rect:{x,y:100,width:96,height:45}},baseline=before([label,companion],1280,720,[],[f.face]);
  const actual=after([target,companion],1280,720,[],[f.face]);assert.deepEqual(actual.find(x=>x.id==='companion'),baseline.find(x=>x.id==='companion'));
  assert(actual.find(x=>x.id==='clover').feasible);assert(!overlaps(actual[0].rect,actual[1].rect));result.fixedCompanionCases++;
 }
}
const baseline=JSON.parse(await readFile(resolve(root,'work/v5/CXV/batch-m/soot-path-baseline.json')));
for(const f of baseline.sootPaths){assert.equal(sha(await readFile(resolve(root,f.path))),f.sha256,f.path);result.protectedPaths++;}
assert.equal(sha(await readFile(resolve(root,'tools/v5vfx/capture-arrival.mjs'))),baseline.captureArrivalSha256);
result.arrivalSha256=baseline.captureArrivalSha256;result.pass=true;result.limits='Offline placement/metadata proof from frozen measured geometry; full HUD obstacles and actual DOM/source-decoder timing need fresh current-production capture. No source-art, loop, budget or general performance claim.';
await writeFile(resolve(out,'study.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
