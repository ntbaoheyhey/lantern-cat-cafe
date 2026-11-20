// REFERENCE: Equipment41. Adoption is separate from the immutable prototype run.
import assert from 'node:assert/strict';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root='reports/cardrpg-big/a5/e1-equipment-forecast';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p));
const prototype=await json(root+'/prototype-audit.json');
assert(prototype.status.startsWith('PASS: isolated prototype'));
assert(prototype.cpu1Under400ms);assert.equal(prototype.captures.length,24);
assert.equal(prototype.workers.checks.length,2);
const contextual=await json('reports/cardrpg-big/a5/b1/display-context-40/audit.json');
assert.equal(contextual.screen,'PASS');assert.equal(contextual.cases.length,384);
assert.equal(execFileSync('git',['diff','--name-only','994d84056','--','apps','packages','assets','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
for(const r of prototype.receipts)assert.equal(sha(await readFile(r.path)),r.sha256,r.path);
for(const a of prototype.artifacts)assert.equal(sha(await readFile(a.path)),a.sha256,a.path);
const reg=await json(root+'/REGISTERED-UI.json'),correction=await json(root+'/source-correction-1.json');
const clarification=await json(root+'/test-fixture-clarification.json');
const paths={};
for(const name of ['Equipment.tsx','EquipmentForecastV4.tsx','equipment-forecast.ts','ForecastV4.tsx','depth.css','equipment-forecast.test.ts','ForecastV4.test.tsx']){
 const source=`/tmp/cardrpg-a5-equipment-forecast-41/source/${name}`;
 const checked=`tools/cardrpg-big/a5-drafts/equipment-forecast-41/source/${name}`;
 const expected=correction.paths[source]??(source===clarification.path?clarification.sha256:reg.paths[source]);
 assert.equal(sha(await readFile(source)),expected,source);
 assert.equal(sha(await readFile(checked)),expected,checked);
 paths['apps/web/src/game/cardrpg/depth/'+name]=expected;
}
// Validate every source before the first write. No rule, dependency or save field changes.
for(const destination of Object.keys(paths))await copyFile('tools/cardrpg-big/a5-drafts/equipment-forecast-41/source/'+destination.split('/').at(-1),destination);
await writeFile(root+'/adoption.json',JSON.stringify({at:new Date().toISOString(),base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),paths,
 prototypeSha256:sha(await readFile(root+'/prototype-audit.json')),
 contextualSha256:sha(await readFile('reports/cardrpg-big/a5/b1/display-context-40/audit.json')),
 limits:'Contextual TRAIN screen supports the UI only. Static display and fresh acceptance remain open.'},null,2)+'\n');
console.log(JSON.stringify({adopted:Object.keys(paths),sourceChecks:'Required next; not yet verified in the application suite.'}));
