/** Build a reviewable scene-only candidate without touching application source. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,buildProductionComparison} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
import {battleContextSource,battleModule} from './battle-context-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-battle-context-prototype-build');assert(!existsSync(out));await mkdir(out,{recursive:true});
const original=await readFile(resolve(root,battleModule),'utf8'),candidate=battleContextSource(original),path=resolve(out,'candidate-scene.ts');await writeFile(path,candidate);
const snapshots=[];
for(const name of ['build-battle-context-prototype.mjs','battle-context-source.mjs','build-hud-production.mjs','probe-battle-context-loss.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});}
const built=await buildProductionComparison(out,{modulePath:battleModule,currentSource:original,variants:{native:candidate},metadata:{originalSceneSha256:hash(original),candidateSceneSha256:hash(candidate),candidatePath:path,snapshots}});
assert.equal(built.artifacts[0].transformed,1);assert.equal(hash(await readFile(resolve(root,battleModule))),hash(original));
console.log(JSON.stringify({out,source:built.source,originalSha256:hash(original),candidateSha256:hash(candidate),indexSha256:built.artifacts[0].indexSha256}));
