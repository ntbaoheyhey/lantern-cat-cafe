/** Two matched production artifacts, with no application source mutation. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,buildProductionComparison} from './build-hud-production.mjs';
import {transactionSources,focusPath,statusPath} from './focus-transaction-source.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-focus-transaction-production');assert(!existsSync(out));await mkdir(out,{recursive:true});
const sources=await transactionSources(root),snapshots=[];
for(const name of ['build-focus-transaction-artifacts.mjs','run-focus-transaction-series.mjs','focus-transaction-source.mjs','build-hud-production.mjs','benchmark-boss-play.mjs','production-candidate-fixture.mjs']){
 const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);snapshots.push({name,sha256:hash(bytes)});
}
const module=(path)=>({modulePath:path,currentSource:sources[path].baseline,variants:{baseline:sources[path].baseline,transaction:sources[path].candidate}});
const built=await buildProductionComparison(out,{...module(focusPath),additionalModules:[module(statusPath)],metadata:{snapshots,experiment:'current/pending/title geometry shares the temporary clone lifetime',sources:Object.fromEntries(Object.entries(sources).map(([p,s])=>[p,{baselineSha256:s.baselineSha256,candidateSha256:s.candidateSha256}]))}});
assert(built.staticAssetsExact);assert.deepEqual(built.artifacts.map(a=>a.transformed),[0,2]);console.log(JSON.stringify({out,source:built.source,pass:true,artifacts:built.artifacts.map(a=>({mode:a.mode,indexSha256:a.indexSha256,transformed:a.transformed}))}));
