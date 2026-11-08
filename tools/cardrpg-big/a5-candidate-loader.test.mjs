// REFERENCE: A5 stat-budget05 execution correction. A skipped candidate must fail loudly.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {dirname} from 'node:path';
import {loadRules} from './a5-drafts/stat-budget-05-corrected/isolated-load.mjs';
const files=['packages/game-rules/src/cardrpg/index.ts','packages/game-rules/src/cardrpg/depth/index.ts','packages/game-rules/src/cardrpg/depth/run-bot.ts','packages/game-rules/src/cardrpg/depth/onboarding.ts','packages/game-rules/src/rng.ts'];
async function fixture(run){
 const dir=await mkdtemp('/tmp/cardrpg-a5-loader-test-'),previous=process.env.BIG_RULES_ROOT;
 try{
  for(const p of files){await mkdir(dirname(`${dir}/actual/${p}`),{recursive:true});await writeFile(`${dir}/actual/${p}`,"export const value='original';");}
  await symlink(`${dir}/actual`,`${dir}/alias`);process.env.BIG_RULES_ROOT=`${dir}/alias`;
  await writeFile(`${dir}/overlay.ts`,"export const value='candidate';");await run(dir);
 }finally{if(previous===undefined)delete process.env.BIG_RULES_ROOT;else process.env.BIG_RULES_ROOT=previous;await rm(dir,{recursive:true,force:true});}
}
test('applies an overlay exactly once through a symlinked source root',()=>fixture(async dir=>{
 const bundle=await loadRules({transforms:{[files[1]]:`${dir}/overlay.ts`}});
 try{assert.equal(bundle.depth.value,'candidate');assert.equal(bundle.legacy.value,'original');assert.deepEqual(Object.values(bundle.appliedTransforms),[1]);}finally{await bundle.close();}
}));
test('rejects a declared runtime overlay absent from the actual module graph',()=>fixture(async dir=>{
 const orphan='packages/game-rules/src/orphan.ts';await writeFile(`${dir}/actual/${orphan}`,'export const orphan=1;');
 await assert.rejects(loadRules({transforms:{[orphan]:`${dir}/overlay.ts`}}),/Candidate transform must execute exactly once/);
}));
test('rejects a nonexistent input instead of sampling the untouched rules',()=>fixture(async dir=>{
 await assert.rejects(loadRules({transforms:{'packages/game-rules/src/missing.ts':`${dir}/overlay.ts`}}),{code:'ENOENT'});
}));
