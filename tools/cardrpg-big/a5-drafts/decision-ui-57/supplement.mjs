// REFERENCE: A5 C1/E1. Existing earned loss, account flag only; no battles resampled.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from '../../a4-load.mjs';
const root='reports/cardrpg-big/a5/c1-decisions';
const manifest=JSON.parse(await readFile('reports/cardrpg-big/a5/e1-result-advice/fixtures/checks.json'));
const loader=await loadRules();
try {
 const R=await loader.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const input=JSON.parse(await readFile(manifest.fixtures[0].beforePath));
 const state=R.setGameplayV4(input,false);
 assert(!R.gameplayV4(state));assert(state.run.battle.v4);assert.equal(state.run.battle.result,'enemy');
 assert.deepEqual(state.run,input.run);
 const path=root+'/off-retained.save';await writeFile(path,R.exportSave(state)+'\n');
 manifest.fixtures.push({name:'off-retained',path,sha256:createHash('sha256').update(await readFile(path)).digest('hex'),method:'Public flag toggle retains the exact earned V4 battle. Renderer compatibility only.'});
 await writeFile(root+'/result-fixtures.json',JSON.stringify(manifest,null,2)+'\n');
}finally{await loader.vite.close();}
